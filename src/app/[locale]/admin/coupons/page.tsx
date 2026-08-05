import Link from "next/link";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { deleteCoupon } from "@/actions/admin";
import {
  AdminHeader,
  EmptyRow,
  Pill,
  Table,
  Td,
  Th,
} from "@/components/admin/table";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      // Redemptions are counted from live orders rather than a column, so this
      // number can never drift from what buyers actually used.
      _count: { select: { orders: { where: { status: { not: "CANCELLED" } } } } },
    },
  });

  const now = new Date();

  return (
    <div>
      <AdminHeader
        title={dict.admin.coupons}
        action={{
          href: `/${locale}/admin/coupons/new`,
          label: dict.admin.newCoupon,
        }}
      />

      <Table>
        <thead>
          <tr>
            <Th>{dict.admin.couponCode}</Th>
            <Th>{dict.admin.couponValue}</Th>
            <Th>{dict.admin.couponWindow}</Th>
            <Th className="text-end">{dict.admin.couponUsed}</Th>
            <Th>{dict.admin.couponStatus}</Th>
            <Th className="text-end" />
          </tr>
        </thead>
        <tbody>
          {coupons.length ? (
            coupons.map((coupon) => {
              const expired = coupon.endsAt !== null && coupon.endsAt < now;
              const pending = coupon.startsAt !== null && coupon.startsAt > now;
              const exhausted =
                coupon.usageLimit !== null &&
                coupon._count.orders >= coupon.usageLimit;

              return (
                <tr key={coupon.id}>
                  <Td dir="ltr">
                    <Link
                      href={`/${locale}/admin/coupons/${coupon.id}`}
                      className="transition-colors hover:text-accent"
                    >
                      {coupon.code}
                    </Link>
                    {coupon.minSubtotal > 0 ? (
                      <p className="mt-0.5 text-xs text-content-faint nums">
                        {dict.admin.couponMinSubtotal}:{" "}
                        {formatPrice(coupon.minSubtotal, locale)}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="nums">
                    {coupon.type === "PERCENT"
                      ? `${formatNumber(coupon.value, locale)}٪`
                      : formatPrice(coupon.value, locale)}
                    {coupon.type === "PERCENT" && coupon.maxDiscount !== null ? (
                      <p className="mt-0.5 text-xs text-content-faint">
                        {dict.admin.couponMaxDiscount}:{" "}
                        {formatPrice(coupon.maxDiscount, locale)}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="text-content-muted nums">
                    {coupon.startsAt || coupon.endsAt
                      ? [
                          coupon.startsAt
                            ? formatDate(coupon.startsAt, locale)
                            : "—",
                          coupon.endsAt ? formatDate(coupon.endsAt, locale) : "—",
                        ].join(" → ")
                      : "—"}
                  </Td>
                  <Td className="text-end nums">
                    {formatNumber(coupon._count.orders, locale)}
                    {coupon.usageLimit !== null
                      ? ` / ${formatNumber(coupon.usageLimit, locale)}`
                      : ""}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {!coupon.active ? (
                        <Pill tone="muted">{dict.admin.draft}</Pill>
                      ) : expired ? (
                        <Pill tone="muted">{dict.admin.couponExpired}</Pill>
                      ) : pending ? (
                        <Pill tone="muted">{dict.admin.couponScheduled}</Pill>
                      ) : exhausted ? (
                        <Pill tone="muted">{dict.admin.couponExhausted}</Pill>
                      ) : (
                        <Pill tone="accent">{dict.admin.couponActive}</Pill>
                      )}
                    </div>
                  </Td>
                  <Td className="text-end">
                    <form action={deleteCoupon} className="inline">
                      <input type="hidden" name="id" value={coupon.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <ConfirmSubmit
                        label={dict.common.delete}
                        confirmText={dict.admin.confirmDelete}
                      />
                    </form>
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
