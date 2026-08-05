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
  return { title: getDictionary(locale).auth.registerTitle };
}

export default async function RegisterPage({
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
        <h1 className="text-title font-medium">{dict.auth.registerTitle}</h1>
        <p className="mt-2 text-content-muted">{dict.auth.registerLead}</p>

        <AuthForm mode="register" locale={locale} dict={dict} next={next} />

        <p className="mt-8 text-sm text-content-muted">
          {dict.auth.hasAccount}{" "}
          <Link
            href={`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-accent transition-opacity hover:opacity-70"
          >
            {dict.auth.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
