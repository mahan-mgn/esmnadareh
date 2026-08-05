import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { OrderStatusPill } from "@/components/account/order-status-pill";
import { Table, Td, Th, EmptyRow } from "@/components/admin/table";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const [revenue, orderCount, productCount, userCount, recent, lowStock] =
    await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { _count: { select: { items: true } } },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 3 } },
        orderBy: { stock: "asc" },
        take: 8,
        include: { product: { select: { nameFa: true, nameEn: true, slug: true } } },
      }),
    ]);

  const stats = [
    { label: dict.admin.revenue, value: formatPrice(revenue._sum.total ?? 0, locale) },
    { label: dict.admin.ordersCount, value: formatNumber(orderCount, locale) },
    {
      label: dict.admin.productsCount,
      value: formatNumber(productCount, locale),
    },
    { label: dict.admin.usersCount, value: formatNumber(userCount, locale) },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface px-5 py-6">
            <p className="eyebrow text-content-faint">{stat.label}</p>
            <p className="mt-2 text-lg font-medium nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-5 text-xl font-medium">{dict.admin.recentOrders}</h2>
        <Table>
          <thead>
            <tr>
              <Th>{dict.checkout.orderNumber}</Th>
              <Th>{dict.checkout.fullName}</Th>
              <Th>{dict.account.orderDate}</Th>
              <Th>{dict.account.orderStatus}</Th>
              <Th className="text-end">{dict.common.total}</Th>
            </tr>
          </thead>
          <tbody>
            {recent.length ? (
              recent.map((order) => (
                <tr key={order.id}>
                  <Td className="nums">
                    <Link
                      href={`/${locale}/admin/orders`}
                      className="transition-colors hover:text-accent"
                    >
                      {order.number}
                    </Link>
                  </Td>
                  <Td>{order.shipFullName}</Td>
                  <Td className="text-content-muted nums">
                    {formatDate(order.createdAt, locale)}
                  </Td>
                  <Td>
                    <OrderStatusPill status={order.status} dict={dict} />
                  </Td>
                  <Td className="text-end nums">
                    {formatPrice(order.total, locale)}
                  </Td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={5} label={dict.admin.noItems} />
            )}
          </tbody>
        </Table>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-medium">{dict.admin.lowStock}</h2>
        <Table>
          <thead>
            <tr>
              <Th>{dict.admin.name}</Th>
              <Th>{dict.shop.size}</Th>
              <Th>{dict.shop.color}</Th>
              <Th className="text-end">{dict.admin.stock}</Th>
            </tr>
          </thead>
          <tbody>
            {lowStock.length ? (
              lowStock.map((variant) => (
                <tr key={variant.id}>
                  <Td>
                    <Link
                      href={`/${locale}/product/${variant.product.slug}`}
                      className="transition-colors hover:text-accent"
                    >
                      {pick(locale, variant.product.nameFa, variant.product.nameEn)}
                    </Link>
                  </Td>
                  <Td className="text-content-muted nums">
                    {variant.size ?? "—"}
                  </Td>
                  <Td className="text-content-muted">
                    {pick(locale, variant.colorFa, variant.colorEn) ?? "—"}
                  </Td>
                  <Td
                    className={
                      variant.stock === 0
                        ? "text-end text-rust-400 nums"
                        : "text-end nums"
                    }
                  >
                    {variant.stock}
                  </Td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={4} label={dict.admin.noItems} />
            )}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
