import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { formatDateTime, formatPrice } from "@/lib/format";
import { AdminHeader, EmptyRow, Pill, Table, Td, Th } from "@/components/admin/table";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { email: true } } },
  });

  return (
    <div>
      <AdminHeader title={dict.admin.orders} />

      <Table>
        <thead>
          <tr>
            <Th>{dict.checkout.orderNumber}</Th>
            <Th>{dict.checkout.fullName}</Th>
            <Th>{dict.account.orderDate}</Th>
            <Th>{dict.account.orderItems}</Th>
            <Th className="text-end">{dict.common.total}</Th>
            <Th>{dict.checkout.paymentMethod}</Th>
            <Th className="min-w-44">{dict.admin.changeStatus}</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length ? (
            orders.map((order) => (
              <tr key={order.id}>
                <Td className="nums">{order.number}</Td>
                <Td>
                  {order.shipFullName}
                  <p className="mt-0.5 text-xs text-content-faint" dir="ltr">
                    {order.user?.email ?? order.email}
                  </p>
                </Td>
                <Td className="text-content-muted nums">
                  {formatDateTime(order.createdAt, locale)}
                </Td>
                <Td className="text-content-muted">
                  <span className="nums">{order.items.length}</span>
                  <p className="mt-0.5 max-w-48 truncate text-xs text-content-faint">
                    {order.items
                      .map((item) => pick(locale, item.nameFa, item.nameEn))
                      .join("، ")}
                  </p>
                </Td>
                <Td className="text-end nums">
                  {formatPrice(order.total, locale)}
                </Td>
                <Td>
                  <Pill
                    tone={order.paymentStatus === "PAID" ? "accent" : "muted"}
                  >
                    {dict.paymentStatus[order.paymentStatus]}
                  </Pill>
                </Td>
                <Td>
                  <OrderStatusSelect
                    orderId={order.id}
                    status={order.status}
                    locale={locale}
                    dict={dict}
                  />
                </Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={7} label={dict.admin.noItems} />
          )}
        </tbody>
      </Table>
    </div>
  );
}
