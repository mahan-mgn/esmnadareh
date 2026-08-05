"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, type Theme } from "@/lib/theme";

/**
 * The chosen theme lives in a cookie rather than localStorage so the server can
 * read it and render `<html class="…">` itself. That removes the usual
 * render-blocking inline script — and with it React's warning about `<script>`
 * tags inside components — while still avoiding a flash of the wrong theme.
 *
 * When no cookie is set, no class is emitted and CSS follows the OS via
 * `prefers-color-scheme` (see globals.css).
 */

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}>({ theme: "dark", toggle: () => {}, setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * The DOM is the source of truth. `useSyncExternalStore` is what makes reading
 * it safe across the hydration boundary.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Theme {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  // No explicit choice — report whatever the OS is giving us.
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
  initial,
}: {
  children: ReactNode;
  /** What the server rendered, so the first client snapshot agrees with it. */
  initial: Theme;
}) {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    getSnapshot,
    () => initial,
  );

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
