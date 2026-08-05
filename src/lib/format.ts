import type { Locale } from "@/i18n/config";

/**
 * Prices live in the database as whole toman. Farsi renders Persian digits
 * with the ” تومان“ suffix; English renders grouped latin digits with a
 * trailing T so the two never disagree about the underlying number.
 */
export function formatPrice(toman: number, locale: Locale): string {
  const n = Math.round(toman);
  if (locale === "fa") {
    return `${new Intl.NumberFormat("fa-IR").format(n)} تومان`;
  }
  return `${new Intl.NumberFormat("en-US").format(n)} T`;
}

/** Bare number, no currency — for input fields and admin tables. */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(
    value,
  );
}

export function formatPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  ).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-GB",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(d);
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return null;
  return (compareAt - price) / compareAt;
}

/** URL-safe slug that keeps Persian letters intact. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
