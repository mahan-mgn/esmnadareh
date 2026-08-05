import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { AdminHeader } from "@/components/admin/table";
import { CouponForm } from "@/components/admin/coupon-form";

export default async function AdminNewCouponPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div>
      <AdminHeader title={dict.admin.newCoupon} />
      <CouponForm
        locale={locale}
        dict={dict}
        values={{
          code: "",
          type: "PERCENT",
          value: 10,
          minSubtotal: 0,
          maxDiscount: null,
          startsAt: "",
          endsAt: "",
          usageLimit: null,
          perUserLimit: null,
          active: true,
        }}
      />
    </div>
  );
}
