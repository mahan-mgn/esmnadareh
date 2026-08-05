import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminHeader, EmptyRow, Pill, Table, Td, Th } from "@/components/admin/table";
import { UserRoleSelect } from "@/components/admin/user-role-select";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const session = await getSession();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { paymentStatus: "PAID" },
        select: { total: true },
      },
    },
  });

  return (
    <div>
      <AdminHeader title={dict.admin.users} />

      <Table>
        <thead>
          <tr>
            <Th>{dict.admin.name}</Th>
            <Th>{dict.auth.email}</Th>
            <Th>{dict.admin.joined}</Th>
            <Th className="text-end">{dict.admin.ordersCount}</Th>
            <Th className="text-end">{dict.admin.revenue}</Th>
            <Th className="min-w-36">{dict.admin.role}</Th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((user) => {
              const spend = user.orders.reduce(
                (sum, order) => sum + order.total,
                0,
              );
              const isSelf = user.id === session?.sub;

              return (
                <tr key={user.id}>
                  <Td>
                    {user.name ?? "—"}
                    {isSelf ? (
                      <Pill tone="accent">
                        {locale === "fa" ? "شما" : "you"}
                      </Pill>
                    ) : null}
                  </Td>
                  <Td className="text-content-muted" dir="ltr">
                    {user.email}
                  </Td>
                  <Td className="text-content-muted nums">
                    {formatDate(user.createdAt, locale)}
                  </Td>
                  <Td className="text-end nums">{user._count.orders}</Td>
                  <Td className="text-end nums">{formatPrice(spend, locale)}</Td>
                  <Td>
                    <UserRoleSelect
                      userId={user.id}
                      role={user.role}
                      locale={locale}
                      dict={dict}
                      disabled={isSelf}
                    />
                  </Td>
                </tr>
              );
            })
          ) : (
            <EmptyRow colSpan={6} label={dict.admin.noItems} />
          )}
        </tbody>
      </Table>
    </div>
  );
}
