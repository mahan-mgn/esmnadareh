import { formatNumber } from "@/lib/format";
import type { Locale } from "./config";

/**
 * Dictionaries have to be plain data: a Server Component may hand one to a
 * Client Component, and functions cannot cross that boundary. So phrases that
 * need a value carry `{placeholders}` and are filled in at the call site.
 */

export type Plural = { one: string; other: string };

export function fill(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Picks the singular or plural phrasing and formats the number for `locale`. */
export function count(entry: Plural, n: number, locale: Locale): string {
  const template = n === 1 ? entry.one : entry.other;
  return fill(template, { n: formatNumber(n, locale) });
}
