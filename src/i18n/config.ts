export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fa";

export const localeMeta: Record<
  Locale,
  { dir: "rtl" | "ltr"; label: string; short: string; htmlLang: string }
> = {
  fa: { dir: "rtl", label: "فارسی", short: "FA", htmlLang: "fa" },
  en: { dir: "ltr", label: "English", short: "EN", htmlLang: "en" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** `/fa/shop` → `/en/shop`, preserving the query string. */
export function swapLocaleInPath(pathname: string, next: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = next;
    return segments.join("/") || "/";
  }
  return `/${next}${pathname === "/" ? "" : pathname}`;
}
