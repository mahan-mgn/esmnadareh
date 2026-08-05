import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick the field matching the active locale from a `*Fa` / `*En` pair. */
export function pick<T>(
  locale: string,
  fa: T,
  en: T,
): T {
  return locale === "en" ? en : fa;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/**
 * Sizes sort alphabetically by default, which puts L before M before S. This
 * orders letter sizes properly and numeric ones (shoes, rings, belts, waists)
 * numerically, keeping the two families apart.
 */
export function compareSizes(a: string, b: string): number {
  const ai = LETTER_SIZES.indexOf(a.toUpperCase());
  const bi = LETTER_SIZES.indexOf(b.toUpperCase());

  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;

  const an = Number(a);
  const bn = Number(b);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;

  return a.localeCompare(b);
}
