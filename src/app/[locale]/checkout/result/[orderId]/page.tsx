import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { canAccessOrder } from "@/lib/orders";
import { orderIsPayable } from "@/lib/inventory";
import { pick } from "@/lib/utils";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { robots: { index: false, follow: false } };

export default async function CheckoutResultPage({
  params,
}: {
  params: Promise<{ locale: Locale; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  const dict = getDictionary(locale);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  // A receipt carries the buyer's name, address and postcode — 404 rather than
  // confirm the order exists to whoever guessed the id.
  if (!order || !(await canAccessOrder(order))) notFound();

  const paid = order.paymentStatus === "PAID";
  // An unpaid order can still be taken back to the gateway — but only while it
  // is holding its stock. Once the hold lapses the order is cancelled and the
  // buyer needs a fresh basket, so "try again" would be a dead end.
  const payable = !paid && (await orderIsPayable(order));
  const lapsed = !paid && !payable;

  return (
    <div className="container-x py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <span
            className={
              paid
                ? "flex h-16 w-16 items-center justify-center rounded-full bg-accent text-on-accent"
                : "flex h-16 w-16 items-center justify-center rounded-full border border-line text-content-muted"
            }
          >
            {paid ? <Check size={26} /> : <X size={26} />}
          </span>

          <h1 className="mt-8 text-hero font-medium">
            {paid
              ? dict.checkout.successTitle
              : lapsed
                ? dict.checkout.expiredTitle
                : dict.checkout.failedTitle}
          </h1>
          <p className="mt-4 max-w-md text-content-muted">
            {paid
              ? dict.checkout.successBody
              : lapsed
                ? dict.checkout.expiredBody
                : dict.checkout.failedBody}
          </p>
        </div>

        <div className="mt-12 border border-line">
          <div className="grid grid-cols-2 gap-6 border-b border-line px-6 py-5 text-sm sm:grid-cols-4">
            <Meta label={dict.checkout.orderNumber}>{order.number}</Meta>
            <Meta label={dict.account.orderDate}>
              {formatDate(order.createdAt, locale)}
            </Meta>
            <Meta label={dict.account.orderStatus}>
              {dict.orderStatus[order.status]}
            </Meta>
            <Meta label={dict.common.total}>
              {formatPrice(order.total, locale)}
            </Meta>
          </div>

          <ul className="divide-y divide-[var(--line)]">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative aspect-4/5 w-12 shrink-0 overflow-hidden bg-surface-2">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {pick(locale, item.nameFa, item.nameEn)}
                  </p>
                  <p className="mt-0.5 text-xs text-content-faint">
                    {[
                      pick(locale, item.colorFa, item.colorEn),
                      item.size,
                      `× ${formatNumber(item.quantity, locale)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <p className="shrink-0 text-sm nums">
                  {formatPrice(item.unitPrice * item.quantity, locale)}
                </p>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-6 py-5 text-sm">
            <p className="text-content-muted">{dict.checkout.shippingAddress}</p>
            <p className="mt-2">
              {order.shipFullName} — {order.shipProvince}، {order.shipCity}،{" "}
              {order.shipLine1}
              <span className="ms-2 text-content-faint nums">
                {order.shipPostalCode}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {paid ? (
            <ButtonLink href={`/${locale}/account/orders`}>
              {dict.checkout.trackOrder}
            </ButtonLink>
          ) : payable ? (
            <ButtonLink href={`/${locale}/checkout/gateway/${order.id}`}>
              {dict.error.retry}
            </ButtonLink>
          ) : (
            <ButtonLink href={`/${locale}/cart`}>{dict.nav.cart}</ButtonLink>
          )}
          <ButtonLink href={`/${locale}/shop`} variant="outline">
            {dict.checkout.backToShop}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow text-content-faint">{label}</p>
      <p className="mt-1.5 nums">{children}</p>
    </div>
  );
}
