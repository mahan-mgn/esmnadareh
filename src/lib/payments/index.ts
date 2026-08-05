import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { consumeReservations, returnStock } from "@/lib/inventory";
import type { Locale } from "@/i18n/config";
import { createSimulated } from "./simulated";
import { createZarinpal } from "./zarinpal";
import type { PaymentProvider } from "./types";

export type { PaymentProvider, PaymentOrder } from "./types";

/**
 * Which gateway is in play is decided by configuration alone, so going live is
 * a matter of setting `ZARINPAL_MERCHANT_ID` — no code path changes, and no
 * chance of shipping with a simulator that was switched on by a stray flag.
 */
export function getPaymentProvider(): PaymentProvider {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();

  if (merchantId) {
    return createZarinpal({
      merchantId,
      sandbox: process.env.ZARINPAL_SANDBOX === "1",
    });
  }

  return createSimulated();
}

/** Absolute origin — the gateway redirects a browser back to it, so a relative path will not do. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const header = await headers();
  const host = header.get("x-forwarded-host") ?? header.get("host");
  const proto = header.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function paymentCallbackUrl(orderId: string, locale: Locale) {
  return `${await siteOrigin()}/api/payments/callback/${orderId}?locale=${locale}`;
}

/**
 * Opens the payment at the provider and remembers its handle on the order.
 *
 * The handle is what verification is done against later — without storing it,
 * a callback could only be believed on the strength of its own query string.
 */
export async function startPayment(
  order: {
    id: string;
    number: string;
    total: number;
    email: string;
    phone: string;
  },
  locale: Locale,
) {
  const provider = getPaymentProvider();
  const result = await provider.start(
    order,
    await paymentCallbackUrl(order.id, locale),
  );

  if (result.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: provider.id,
        paymentAuthority: result.authority,
      },
    });
  }

  return { provider, result };
}

/**
 * Records a verified payment: the order becomes PAID, the units it was holding
 * become sold, and the basket it came from is emptied.
 *
 * Only ever moves UNPAID → PAID, so a provider that fires its callback twice
 * settles once.
 */
export async function markOrderPaid(orderId: string, reference: string) {
  return prisma.$transaction(async (tx) => {
    const settled = await tx.order.updateMany({
      // `stockReturnedAt` is the hard gate: once the units have gone back on
      // the shelf there is nothing to ship, so a late "paid" callback must not
      // turn the order green. It becomes a refund conversation instead.
      where: { id: orderId, paymentStatus: "UNPAID", stockReturnedAt: null },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        paymentRef: reference,
      },
    });
    if (settled.count === 0) return false;

    // The stock left the shelf when the order was placed; the hold has simply
    // become a sale.
    await consumeReservations(tx, orderId);

    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (order?.userId) {
      const cart = await tx.cart.findUnique({
        where: { userId: order.userId },
      });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        // The code has been spent on this order; leaving it attached would
        // silently discount the next basket too.
        await tx.cart.update({
          where: { id: cart.id },
          data: { couponId: null },
        });
      }
    }

    return true;
  });
}

/** Payment did not happen: give the held units back and close the order. */
export async function markOrderFailed(orderId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "UNPAID" },
      data: { paymentStatus: "FAILED", status: "CANCELLED" },
    });
    await returnStock(tx, orderId);
  });
}
