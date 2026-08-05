import { notFound, redirect } from "next/navigation";
import { Lock, ShieldAlert } from "lucide-react";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { canAccessOrder } from "@/lib/orders";
import {
  orderIsPayable,
  releaseExpiredReservations,
  reservationExpiry,
} from "@/lib/inventory";
import { startPayment } from "@/lib/payments";
import { formatPrice } from "@/lib/format";
import { LogoMark } from "@/components/brand/logo";
import { ReservationTimer } from "@/components/commerce/reservation-timer";

export const metadata = { robots: { index: false, follow: false } };

/**
 * The hand-off to the payment service.
 *
 * With a real provider configured this page never renders: it opens the
 * payment and forwards the browser to the bank. Without one it draws the
 * simulator, whose two buttons link to the very same callback the bank would
 * return to — so development and production differ only in who is asked
 * whether the money moved.
 */
export default async function GatewayPage({
  params,
}: {
  params: Promise<{ locale: Locale; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  const dict = getDictionary(locale);

  // Sweep lapsed holds first, so an order that timed out while this page was
  // open is already cancelled by the time it is read below.
  await releaseExpiredReservations();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      total: true,
      email: true,
      phone: true,
      status: true,
      paymentStatus: true,
      userId: true,
    },
  });
  // This page opens a payment against the order and shows the buyer's e-mail;
  // only the buyer may reach it.
  if (!order || !(await canAccessOrder(order))) notFound();

  // Nothing left to pay — send the buyer to the receipt instead of offering to
  // charge an order that is already settled.
  if (order.paymentStatus === "PAID") {
    redirect(`/${locale}/checkout/result/${order.id}`);
  }

  // Without a live hold the units may already belong to another buyer, so
  // there is nothing safe to charge for. The result page explains the lapse.
  if (!(await orderIsPayable(order))) {
    redirect(`/${locale}/checkout/result/${order.id}`);
  }

  const expiresAt = await reservationExpiry(order.id);

  // Opening the payment is what produces the URL to send the buyer to, and the
  // authority the callback will be verified against.
  const { provider, result } = await startPayment(order, locale);

  if (result.ok && provider.live) {
    redirect(result.redirectUrl);
  }

  // A provider that will not open a payment cannot be paid — say so here
  // rather than showing a pay button that leads nowhere.
  if (!result.ok) {
    return (
      <div className="container-x flex min-h-[75svh] items-center justify-center py-16">
        <div className="w-full max-w-md border border-line bg-surface-3 px-6 py-10 text-center">
          <h1 className="text-xl font-medium">{dict.checkout.gatewayUnavailable}</h1>
          <p className="mt-3 text-sm text-content-muted">
            {dict.checkout.gatewayUnavailableBody}
          </p>
          <a
            href={`/${locale}/cart`}
            className="mt-8 inline-flex h-12 w-full items-center justify-center border border-line eyebrow transition-colors hover:border-line-strong"
          >
            {dict.nav.cart}
          </a>
        </div>
      </div>
    );
  }

  // Simulated gateway: both buttons go to the real callback route.
  const successUrl = result.redirectUrl;
  const failureUrl = (() => {
    const url = new URL(successUrl);
    url.searchParams.set("Status", "NOK");
    return url.toString();
  })();

  return (
    <div className="container-x flex min-h-[75svh] items-center justify-center py-16">
      <div className="w-full max-w-md border border-line bg-surface-3">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="eyebrow">{dict.checkout.gatewayTitle}</span>
          </div>
          <Lock size={16} strokeWidth={1.5} className="text-accent" />
        </div>

        <div className="px-6 py-8">
          <dl className="flex flex-col gap-4 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-content-muted">
                {dict.checkout.orderNumber}
              </dt>
              <dd className="nums">{order.number}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-content-muted">{dict.checkout.email}</dt>
              <dd className="truncate ps-4">{order.email}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-4 text-lg">
              <dt className="font-medium">{dict.common.total}</dt>
              <dd className="font-medium nums">
                {formatPrice(order.total, locale)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex items-start gap-3 border border-line bg-surface-2 p-4">
            <ShieldAlert
              size={16}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-content-faint"
            />
            <p className="text-xs leading-relaxed text-content-muted">
              {dict.checkout.gatewayNote}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={successUrl}
              className="flex h-12 w-full items-center justify-center bg-accent eyebrow text-on-accent transition-colors duration-300 hover:bg-accent-hover"
            >
              {dict.checkout.gatewayPay}
            </a>
            <a
              href={failureUrl}
              className="flex h-12 w-full items-center justify-center border border-line eyebrow text-content-muted transition-colors duration-300 hover:border-line-strong hover:text-content"
            >
              {dict.checkout.gatewayFail}
            </a>
          </div>

          {expiresAt ? (
            <div className="mt-6">
              <ReservationTimer
                expiresAt={expiresAt.toISOString()}
                label={dict.checkout.holdRemaining}
                locale={locale}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
