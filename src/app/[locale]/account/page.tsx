import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { OrderStatusPill } from "@/components/account/order-status-pill";
import { ButtonLink } from "@/components/ui/button";

export default async function AccountOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return null;

  const [orders, wishlistCount, addressCount, spend] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { _count: { select: { items: true } } },
    }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.order.aggregate({
      where: { userId: user.id, paymentStatus: "PAID" },
      _sum: { total: true },
    }),
  ]);

  const totalOrders = await prisma.order.count({ where: { userId: user.id } });

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        <Stat
          label={dict.account.orders}
          value={formatNumber(totalOrders, locale)}
        />
        <Stat
          label={dict.nav.wishlist}
          value={formatNumber(wishlistCount, locale)}
        />
        <Stat
          label={dict.account.addresses}
          value={formatNumber(addressCount, locale)}
        />
        <Stat
          label={dict.admin.revenue}
          value={formatPrice(spend._sum.total ?? 0, locale)}
        />
      </div>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-title font-medium">{dict.account.orders}</h2>
          {orders.length ? (
            <Link
              href={`/${locale}/account/orders`}
              className="eyebrow text-content-muted transition-colors hover:text-accent"
            >
              {dict.common.seeAll}
            </Link>
          ) : null}
        </div>

        {orders.length ? (
          <ul className="divide-y divide-[var(--line)] border-y border-line">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div>
                  <p className="font-medium nums">{order.number}</p>
                  <p className="mt-1 text-xs text-content-faint">
                    {formatDate(order.createdAt, locale)} ·{" "}
                    <span className="nums">
                      {formatNumber(order._count.items, locale)}
                    </span>{" "}
                    {dict.account.orderItems}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <OrderStatusPill status={order.status} dict={dict} />
                  <p className="text-sm nums">
                    {formatPrice(order.total, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4 border border-line px-6 py-14">
            <p className="text-content-muted">{dict.account.noOrders}</p>
            <ButtonLink href={`/${locale}/shop`} variant="outline" size="sm">
              {dict.nav.shop}
            </ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-5 py-6">
      <p className="eyebrow text-content-faint">{label}</p>
      <p className="mt-2 text-xl font-medium nums">{value}</p>
    </div>
  );
}
