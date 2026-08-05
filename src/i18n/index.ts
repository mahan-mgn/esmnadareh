import fa, { type Dictionary } from "./dictionaries/fa";
import en from "./dictionaries/en";
import { defaultLocale, isLocale, type Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { fa, en };

/**
 * Dictionaries are tiny and fully static, so they are imported eagerly —
 * no async boundary and no waterfall on first paint.
 */
export function getDictionary(locale: string | undefined): Dictionary {
  return dictionaries[isLocale(locale) ? locale : defaultLocale];
}

export type { Dictionary };
export * from "./config";
export * from "./template";
