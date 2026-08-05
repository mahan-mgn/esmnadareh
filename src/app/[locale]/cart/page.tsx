import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { count, fill, getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pick } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { getCart, lineUnitPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/cart";
import { couponMessage, priceCart } from "@/lib/coupons";
import { getSession } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { CartLineControls } from "@/components/commerce/cart-line-controls";
import { CouponForm } from "@/components/commerce/coupon-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).cart.title };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const [cart, session] = await Promise.all([getCart(), getSession()]);
  const totals = await priceCart(cart, session?.sub);
  const items = cart?.items ?? [];

  if (!items.length) {
    return (
      <div className="container-x flex min-h-[60svh] flex-col items-center justify-center gap-6 py-24 text-center">
        <ShoppingBag size={36} strokeWidth={1} className="text-content-faint" />
        <h1 className="text-title font-medium">{dict.cart.empty}</h1>
        <p className="max-w-sm text-content-muted">{dict.cart.emptyBody}</p>
        <ButtonLink href={`/${locale}/shop`} className="mt-2">
          {dict.cart.emptyCta}
        </ButtonLink>
      </div>
    );
  }

  const progress = Math.min(
    100,
    Math.round((totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100),
  );

  return (
    <div className="container-x py-14 md:py-20">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-line pb-8">
        <h1 className="text-hero font-medium">{dict.cart.title}</h1>
        <p className="text-sm text-content-muted nums">
          {count(dict.cart.itemsCount, totals.count, locale)}
        </p>
      </header>

      <div className="grid gap-12 py-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
        {/* ---------------------------------------------------------- lines */}
        <ul className="flex flex-col divide-y divide-[var(--line)] border-b border-line">
          {items.map((line) => {
            const name = pick(locale, line.product.nameFa, line.product.nameEn);
            const color = pick(locale, line.variant.colorFa, line.variant.colorEn);
            const unit = lineUnitPrice(line);

            return (
              <li key={line.id} className="flex gap-4 py-6 sm:gap-5">
                <Link
                  href={`/${locale}/product/${line.product.slug}`}
                  className="relative aspect-4/5 w-24 shrink-0 overflow-hidden bg-surface-2 sm:w-28"
                >
                  {line.product.images[0] ? (
                    <Image
                      src={line.product.images[0].url}
                      alt={name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate font-medium">
                        <Link
                          href={`/${locale}/product/${line.product.slug}`}
                          className="transition-colors hover:text-accent"
                        >
                          {name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-xs text-content-faint">
                        {[color, line.variant.size].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm nums">
                      {formatPrice(unit * line.quantity, locale)}
                    </p>
                  </div>

                  <CartLineControls
                    itemId={line.id}
                    quantity={line.quantity}
                    max={Math.min(20, Math.max(1, line.variant.stock))}
                    removeLabel={dict.cart.remove}
                    locale={locale}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {/* -------------------------------------------------------- summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-line p-5 sm:p-6">
            <h2 className="eyebrow text-content-faint">
              {dict.cart.orderSummary}
            </h2>

            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <Row label={dict.common.subtotal}>
                {formatPrice(totals.subtotal, locale)}
              </Row>
              {totals.discount > 0 ? (
                <div className="flex items-baseline justify-between gap-4 text-accent">
                  <dt>{dict.common.discount}</dt>
                  <dd className="nums">
                    −{formatPrice(totals.discount, locale)}
                  </dd>
                </div>
              ) : null}
              <Row label={dict.common.shipping}>
                {totals.shipping === 0
                  ? dict.common.free
                  : formatPrice(totals.shipping, locale)}
              </Row>
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-4 text-base">
                <dt className="font-medium">{dict.common.total}</dt>
                <dd className="font-medium nums">
                  {formatPrice(totals.total, locale)}
                </dd>
              </div>
            </dl>

            <CouponForm
              locale={locale}
              dict={dict}
              applied={totals.coupon?.code ?? null}
              issue={
                totals.couponIssue ? couponMessage(totals.couponIssue, dict) : null
              }
            />

            {/* Progress toward the free-shipping threshold */}
            {totals.remainingForFreeShipping > 0 ? (
              <div className="mt-6">
                <p className="text-xs text-content-muted nums">
                  {fill(dict.cart.freeShippingRemaining, {
                    p: formatPrice(totals.remainingForFreeShipping, locale),
                  })}
                </p>
                <div className="mt-2 h-px w-full bg-line">
                  <div
                    className="h-px bg-accent transition-all duration-700 ease-[var(--ease-brand)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-6 text-xs text-accent">
                {fill(dict.cart.freeShippingFrom, {
                  p: formatPrice(FREE_SHIPPING_THRESHOLD, locale),
                })}
              </p>
            )}

            <ButtonLink
              href={`/${locale}/checkout`}
              fullWidth
              className="mt-7"
            >
              {dict.cart.checkout}
              <ArrowRight size={15} className="rtl:rotate-180" />
            </ButtonLink>

            <Link
              href={`/${locale}/shop`}
              className="mt-4 block text-center text-xs text-content-muted transition-colors hover:text-content"
            >
              {dict.cart.continueShopping}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-content-muted">{label}</dt>
      <dd className="nums">{children}</dd>
    </div>
  );
}
