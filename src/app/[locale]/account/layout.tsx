import { redirect } from "next/navigation";
import { fill, getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({
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

  if (!user) redirect(`/${locale}/login?next=/${locale}/account`);

  return (
    <div className="container-x py-14 md:py-20">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <p className="eyebrow text-content-muted">{dict.account.title}</p>
          <h1 className="mt-3 text-hero font-medium">
            {fill(dict.account.hello, {
              name: user.name ?? user.email.split("@")[0],
            })}
          </h1>
        </div>

        <form action={logout}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="eyebrow text-content-muted transition-colors hover:text-accent"
          >
            {dict.auth.logout}
          </button>
        </form>
      </header>

      <div className="grid gap-10 py-10 lg:grid-cols-[14rem_1fr] lg:gap-16">
        <AccountNav locale={locale} dict={dict} isAdmin={user.role === "ADMIN"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
