/**
 * Shared between the server layout (which reads the cookie and renders the
 * class) and the client provider (which writes it). Deliberately *not* a
 * `"use client"` module — a function exported from one of those cannot be
 * called on the server, only rendered as a component.
 */

export type Theme = "light" | "dark";

export const THEME_COOKIE = "en_theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: string | undefined | null): value is Theme {
  return value === "light" || value === "dark";
}
