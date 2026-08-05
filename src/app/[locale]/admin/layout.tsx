import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next's generated route types hand back a plain string here; the segment is
  // already validated by the parent locale layout.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  const user = await getCurrentUser();

  // Middleware gates this too; the second check protects against direct
  // rendering paths and keeps the guarantee local to the layout.
  if (!user) redirect(`/${locale}/login?next=/${locale}/admin`);
  if (user.role !== "ADMIN") redirect(`/${locale}`);

  return (
    <div className="container-x py-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow text-accent">{dict.admin.title}</p>
          <h1 className="mt-2 text-title font-medium">{dict.admin.dashboard}</h1>
        </div>
        <p className="max-w-full truncate text-xs text-content-faint" dir="ltr">
          {user.email}
        </p>
      </header>

      <div className="grid gap-8 py-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <AdminNav locale={locale} dict={dict} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
