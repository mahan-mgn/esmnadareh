"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { priceCart } from "@/lib/coupons";
import { grantOrderAccess } from "@/lib/orders";
import { releaseExpiredReservations, reserveForOrder } from "@/lib/inventory";
import { getDictionary } from "@/i18n";
import { errorState, type ActionState } from "./types";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  province: z.string().min(2),
  city: z.string().min(2),
  line1: z.string().min(5),
  postalCode: z.string().min(5),
  note: z.string().max(500).optional(),
  saveAddress: z.string().optional(),
  locale: z.string().default("fa"),
});

/**
 * EN-100001, EN-100002, … — readable and monotonically increasing.
 *
 * The highest number wins, not the newest row: an order whose number does not
 * parse (imported or seeded data) must not reset the sequence back onto numbers
 * that are already taken. `number` is unique, so concurrent checkouts can still
 * pick the same value — the caller retries on that collision.
 */
async function nextOrderNumber() {
  const rows = await prisma.order.findMany({
    where: { number: { startsWith: "EN-" } },
    select: { number: true },
  });

  const highest = rows.reduce((max, row) => {
    const value = Number(row.number.slice(3));
    return Number.isSafeInteger(value) && value > max ? value : max;
  }, 100000);

  return `EN-${highest + 1}`;
}

/** Postgres unique-violation, surfaced by Prisma when two orders race. */
function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Thrown to roll the order transaction back when the stock ran out between the
 * pre-flight check and the reservation. Not an error the buyer should see as a
 * crash — it becomes "out of stock" below.
 */
class OutOfStockError extends Error {}

export async function placeOrder(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !errors[key]) {
        errors[key] = dict.common.required;
      }
    }
    return errorState(dict.common.somethingWrong, errors);
  }

  // Give back anything held by abandoned checkouts before reading stock, so a
  // buyer is not told "sold out" by an order nobody is going to pay for.
  await releaseExpiredReservations();

  const cart = await getCart();
  if (!cart?.items.length) {
    return errorState(dict.checkout.emptyCart);
  }

  const session = await getSession();
  const data = parsed.data;

  // Priced here rather than trusting anything the summary rendered: the code
  // may have expired, run out, or stopped clearing its minimum since the
  // basket was last drawn.
  const totals = await priceCart(cart, session?.sub);

  // Never trust the client for stock — re-check every line at order time. The
  // reservation below is what actually settles it; this only fails fast with a
  // readable message.
  for (const line of cart.items) {
    if (line.variant.stock < line.quantity) {
      return errorState(dict.product.outOfStock);
    }
  }

  const createOrder = (number: string) =>
    prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number,
          userId: session?.sub ?? null,
          email: data.email,
          phone: data.phone,
          locale,
          status: "PENDING",
          paymentStatus: "UNPAID",
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          discount: totals.discount,
          total: totals.total,
          // Only a code that actually discounted this order counts as
          // redeemed — that is what the usage limits are counted from.
          couponId: totals.discount > 0 ? (totals.coupon?.id ?? null) : null,
          couponCode: totals.discount > 0 ? (totals.coupon?.code ?? null) : null,
          shipFullName: data.fullName,
          shipProvince: data.province,
          shipCity: data.city,
          shipLine1: data.line1,
          shipPostalCode: data.postalCode,
          note: data.note || null,
          items: {
            create: cart.items.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              nameFa: line.product.nameFa,
              nameEn: line.product.nameEn,
              image: line.product.images[0]?.url ?? null,
              size: line.variant.size,
              colorFa: line.variant.colorFa,
              colorEn: line.variant.colorEn,
              unitPrice: line.product.price + line.variant.priceDelta,
              quantity: line.quantity,
            })),
          },
        },
      });

      // Hold the units now. Anything already sold rolls the whole order back.
      const reserved = await reserveForOrder(
        tx,
        created.id,
        cart.items.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      );
      if (!reserved) throw new OutOfStockError();

      if (session && data.saveAddress === "on") {
        await tx.address.create({
          data: {
            userId: session.sub,
            fullName: data.fullName,
            phone: data.phone,
            province: data.province,
            city: data.city,
            line1: data.line1,
            postalCode: data.postalCode,
          },
        });
      }

      return created;
    });

  // Two checkouts landing together can pick the same number; the loser retries.
  let order;
  for (let attempt = 0; ; attempt++) {
    try {
      order = await createOrder(await nextOrderNumber());
      break;
    } catch (error) {
      if (error instanceof OutOfStockError) {
        return errorState(dict.product.outOfStock);
      }
      if (!isUniqueViolation(error) || attempt >= 4) throw error;
    }
  }

  // Guest checkout has no account to authorise against later — remember the
  // order on this browser so the gateway and receipt stay reachable.
  await grantOrderAccess(order.id);

  redirect(`/${locale}/checkout/gateway/${order.id}`);
}
