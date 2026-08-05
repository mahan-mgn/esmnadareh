import type { Metadata } from "next";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pick } from "@/lib/utils";
import { formatNumber, formatPrice } from "@/lib/format";
import { getCart, lineUnitPrice } from "@/lib/cart";
import { couponMessage, priceCart } from "@/lib/coupons";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/commerce/checkout-form";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).checkout.title };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);
  const totals = await priceCart(cart, user?.id);
  const items = cart?.items ?? [];

  if (!items.length) {
    return (
      <div className="container-x flex min-h-[60svh] flex-col items-center justify-center gap-6 py-24 text-center">
        <ShoppingBag size={36} strokeWidth={1} className="text-content-faint" />
        <h1 className="text-title font-medium">{dict.checkout.emptyCart}</h1>
        <ButtonLink href={`/${locale}/shop`}>{dict.cart.emptyCta}</ButtonLink>
      </div>
    );
  }

  const defaultAddress = user
    ? await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : null;

  return (
    <div className="container-x py-14 md:py-20">
      <h1 className="border-b border-line pb-8 text-hero font-medium">
        {dict.checkout.title}
      </h1>

      <div className="grid gap-12 py-10 lg:grid-cols-[1fr_23rem] lg:gap-16">
        <CheckoutForm
          locale={locale}
          dict={dict}
          isSignedIn={Boolean(user)}
          defaults={{
            fullName: defaultAddress?.fullName ?? user?.name ?? "",
            email: user?.email ?? "",
            phone: defaultAddress?.phone ?? user?.phone ?? "",
            province: defaultAddress?.province ?? "",
            city: defaultAddress?.city ?? "",
            line1: defaultAddress?.line1 ?? "",
            postalCode: defaultAddress?.postalCode ?? "",
          }}
        />

        {/* ---------------------------------------------------- order recap */}
        {/*
          Stacked on mobile the recap would land *below* the place-order
          button, so the buyer would confirm a total they never saw. `order`
          lifts it above the form; on `lg` it returns to the right column.
          Purely visual — the recap holds no focusable controls.
        */}
        <aside className="order-first lg:order-none lg:sticky lg:top-28 lg:self-start">
          <div className="border border-line p-5 sm:p-6">
            <h2 className="eyebrow text-content-faint">
              {dict.cart.orderSummary}
            </h2>

            <ul className="mt-6 flex flex-col gap-4">
              {items.map((line) => {
                const name = pick(
                  locale,
                  line.product.nameFa,
                  line.product.nameEn,
                );
                const color = pick(
                  locale,
                  line.variant.colorFa,
                  line.variant.colorEn,
                );

                return (
                  <li key={line.id} className="flex gap-3">
                    <div className="relative aspect-4/5 w-14 shrink-0 overflow-hidden bg-surface-2">
                      {line.product.images[0] ? (
                        <Image
                          src={line.product.images[0].url}
                          alt={name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                      <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-content px-1 text-[0.5625rem] text-surface nums">
                        {formatNumber(line.quantity, locale)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{name}</p>
                      <p className="mt-0.5 text-xs text-content-faint">
                        {[color, line.variant.size].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs nums">
                      {formatPrice(lineUnitPrice(line) * line.quantity, locale)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-content-muted">{dict.common.subtotal}</dt>
                <dd className="nums">{formatPrice(totals.subtotal, locale)}</dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex items-baseline justify-between text-accent">
                  <dt>
                    {dict.common.discount}
                    {totals.coupon ? (
                      <span className="ms-2 text-xs opacity-70" dir="ltr">
                        {totals.coupon.code}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="nums">
                    −{formatPrice(totals.discount, locale)}
                  </dd>
                </div>
              ) : null}
              {totals.couponIssue ? (
                <p className="text-xs text-rust-400">
                  {couponMessage(totals.couponIssue, dict)}
                </p>
              ) : null}
              <div className="flex items-baseline justify-between">
                <dt className="text-content-muted">{dict.common.shipping}</dt>
                <dd className="nums">
                  {totals.shipping === 0
                    ? dict.common.free
                    : formatPrice(totals.shipping, locale)}
                </dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4 text-base font-medium">
                <dt>{dict.common.total}</dt>
                <dd className="nums">{formatPrice(totals.total, locale)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
