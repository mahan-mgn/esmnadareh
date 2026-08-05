import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ProfileForm } from "@/components/account/profile-form";

export default async function AccountProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <ProfileForm
        locale={locale}
        dict={dict}
        defaults={{ name: user.name ?? "", phone: user.phone ?? "" }}
      />

      <dl className="flex flex-col gap-4 border-t border-line pt-8 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-content-faint">{dict.auth.email}</dt>
          <dd dir="ltr">{user.email}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-content-faint">{dict.admin.joined}</dt>
          <dd className="nums">{formatDate(user.createdAt, locale)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-content-faint">{dict.admin.role}</dt>
          <dd>
            {user.role === "ADMIN"
              ? dict.admin.administrator
              : dict.admin.customer}
          </dd>
        </div>
      </dl>
    </div>
  );
}
