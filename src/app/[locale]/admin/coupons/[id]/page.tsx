import { notFound } from "next/navigation";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/table";
import { CouponForm } from "@/components/admin/coupon-form";

/** `<input type="date">` only speaks yyyy-mm-dd. */
function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function AdminEditCouponPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = getDictionary(locale);

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <div>
      <AdminHeader title={dict.admin.editCoupon} />
      <CouponForm
        locale={locale}
        dict={dict}
        values={{
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minSubtotal: coupon.minSubtotal,
          maxDiscount: coupon.maxDiscount,
          startsAt: dateInput(coupon.startsAt),
          endsAt: dateInput(coupon.endsAt),
          usageLimit: coupon.usageLimit,
          perUserLimit: coupon.perUserLimit,
          active: coupon.active,
        }}
      />
    </div>
  );
}
