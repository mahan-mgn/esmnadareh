import Image from "next/image";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { OrderStatusPill } from "@/components/account/order-status-pill";
import { ButtonLink } from "@/components/ui/button";

export default async function AccountOrdersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (!orders.length) {
    return (
      <div className="flex flex-col items-start gap-4 border border-line px-6 py-16">
        <p className="text-content-muted">{dict.account.noOrders}</p>
        <ButtonLink href={`/${locale}/shop`} variant="outline" size="sm">
          {dict.nav.shop}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {orders.map((order) => (
        <article key={order.id} className="border border-line">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <p className="font-medium nums">{order.number}</p>
              <p className="text-xs text-content-faint">
                {formatDate(order.createdAt, locale)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusPill status={order.status} dict={dict} />
              <p className="text-sm font-medium nums">
                {formatPrice(order.total, locale)}
              </p>
            </div>
          </header>

          <ul className="divide-y divide-[var(--line)]">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
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

          <footer className="border-t border-line px-5 py-4 text-xs text-content-muted">
            {order.shipFullName} — {order.shipProvince}، {order.shipCity}،{" "}
            {order.shipLine1}{" "}
            <span className="nums">{order.shipPostalCode}</span>
          </footer>
        </article>
      ))}
    </div>
  );
}
