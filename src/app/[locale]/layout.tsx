import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Inter, Vazirmatn } from "next/font/google";
import "../globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/toast";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getDictionary } from "@/i18n";
import { isLocale, locales, localeMeta, type Locale } from "@/i18n/config";
import { getNavigationData } from "@/lib/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-farsi",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * `viewportFit: "cover"` lets the page paint under the notch and the home
 * indicator, which is why every edge-anchored surface (container, drawers,
 * toasts) pads itself with `env(safe-area-inset-*)`.
 *
 * `themeColor` is split per scheme so the browser chrome matches the page
 * instead of flashing white above a black hero.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Deliberately no `maximumScale`/`userScalable: false` — pinch-zoom is an
  // accessibility affordance and iOS ignores the lock anyway.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a0a" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const isFa = locale === "fa";

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: `${dict.brand.name} — ${dict.brand.tagline}`,
      template: `%s · ${dict.brand.name}`,
    },
    description: isFa
      ? "فروشگاه کالکشنی اسم نداره؛ پوشاک، کیف، کفش، اکسسوری، عطر و جواهرات در تیراژ محدود."
      : "Esm Nadareh collection store — clothing, bags, shoes, accessories, fragrance and jewelry in limited runs.",
    openGraph: {
      type: "website",
      siteName: dict.brand.name,
      locale: isFa ? "fa_IR" : "en_US",
      images: ["/brand/mark-512.png"],
    },
    alternates: {
      languages: { fa: "/fa", en: "/en" },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const dict = getDictionary(locale);
  const meta = localeMeta[locale];
  const [nav, cookieStore] = await Promise.all([
    getNavigationData(locale),
    cookies(),
  ]);

  // Only emit a theme class once the visitor has actually picked one; without
  // it, CSS falls back to `prefers-color-scheme`.
  const stored = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isTheme(stored) ? stored : undefined;

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={[inter.variable, vazirmatn.variable, theme]
        .filter(Boolean)
        .join(" ")}
      // globals.css sets `scroll-behavior: smooth`; this opts route changes out
      // of it, so navigating does not animate a scroll to the top.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      {/* Column layout so short pages (404, empty cart, gateway) still push the
          footer to the bottom of the viewport instead of leaving a gap under
          it. `dvh` tracks the collapsing mobile browser bars. */}
      <body className="flex min-h-dvh flex-col antialiased">
        <ThemeProvider initial={theme ?? "dark"}>
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:m-4 focus:bg-content focus:px-4 focus:py-2 focus:text-surface"
            >
              {locale === "fa" ? "پرش به محتوا" : "Skip to content"}
            </a>

            <SiteHeader
              locale={locale}
              dict={dict}
              cartCount={nav.cartCount}
              wishlistCount={nav.wishlistCount}
              isSignedIn={nav.isSignedIn}
              isAdmin={nav.isAdmin}
              categories={nav.categories}
              collections={nav.collections}
            />

            {/* `min-w-0` stops a wide child (table, scroller) from stretching
                the flex column and giving the document a sideways scroll. */}
            <main id="main" className="min-w-0 flex-1">
              {children}
            </main>

            <SiteFooter
              locale={locale}
              dict={dict}
              categories={nav.categories}
              collections={nav.collections}
            />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
