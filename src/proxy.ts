import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const LOCALE_COOKIE = "en_locale";

/** Paths that must never be locale-prefixed. */
const PASSTHROUGH = [
  "/api",
  "/_next",
  "/media",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

function resolveLocale(request: NextRequest): Locale {
  const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(remembered)) return remembered;

  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0].trim().split("-")[0].toLowerCase());

  return (locales.find((locale) => preferred.includes(locale)) ??
    defaultLocale) as Locale;
}

// Next 16 renamed the Middleware convention to Proxy; behaviour is unchanged.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    PASSTHROUGH.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  // Unprefixed URL → send the visitor to their locale.
  if (!isLocale(maybeLocale)) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const locale = maybeLocale;
  const rest = "/" + segments.slice(2).join("/");

  // Gate the private areas before the page renders, so an unauthenticated
  // visitor never sees a flash of the admin shell.
  const needsAuth = rest.startsWith("/account") || rest.startsWith("/admin");
  if (needsAuth) {
    const session = await verifySessionToken(
      request.cookies.get(SESSION_COOKIE)?.value,
    );

    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }

    if (rest.startsWith("/admin") && session.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
