import { notFound } from "next/navigation";

/**
 * Without this catch-all, a URL that matches no route at all falls through to
 * Next's bare built-in 404 instead of the branded one — the locale layout is
 * never entered, so `[locale]/not-found.tsx` never gets a chance to render.
 */
export default function UnmatchedRoute(): never {
  notFound();
}
