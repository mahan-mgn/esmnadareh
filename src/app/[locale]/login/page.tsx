import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getSession } from "@/lib/auth";
import { AuthForm } from "@/components/auth/auth-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).auth.loginTitle };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ locale }, { next }] = await Promise.all([params, searchParams]);
  const dict = getDictionary(locale);

  if (await getSession()) redirect(`/${locale}/account`);

  return (
    <div className="container-x flex min-h-[70svh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-title font-medium">{dict.auth.loginTitle}</h1>
        <p className="mt-2 text-content-muted">{dict.auth.loginLead}</p>

        <AuthForm mode="login" locale={locale} dict={dict} next={next} />

        <p className="mt-8 text-sm text-content-muted">
          {dict.auth.noAccount}{" "}
          <Link
            href={`/${locale}/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-accent transition-opacity hover:opacity-70"
          >
            {dict.auth.register}
          </Link>
        </p>

        {/* Seeded demo credentials — remove before going live. */}
        <div className="mt-10 border border-line p-4 text-xs leading-relaxed text-content-faint">
          <p className="mb-2 eyebrow">demo</p>
          <p className="nums">admin@esmnadareh.com — Admin!2345</p>
          <p className="nums">customer@esmnadareh.com — Customer!2345</p>
        </div>
      </div>
    </div>
  );
}
