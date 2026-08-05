import "server-only";

import { cookies } from "next/headers";
import { getSession } from "./auth";

/**
 * Order pages are reachable by id (`/checkout/gateway/<id>`, `/checkout/result/<id>`)
 * and the gateway posts that same id back to `settlePayment`. Neither may be
 * open to anyone holding an id: an order carries the buyer's name, address and
 * e-mail.
 *
 * Signed-in buyers are matched on `userId`. Guest checkout has no user to match
 * against, so placing an order drops the id into an httpOnly cookie and only
 * that browser may open it afterwards.
 */

export const ORDER_GRANT_COOKIE = "en_orders";
const GRANT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const GRANT_LIMIT = 20; // keep the cookie small; older orders live in /account

function parseGrants(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(".").filter(Boolean);
}

export const ORDER_GRANT_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: GRANT_MAX_AGE,
} as const;

/**
 * The cookie value that adds this order to the ones this browser may open.
 *
 * Split out from the write so a Route Handler can put it on its own response —
 * cookies set through `next/headers` do not survive a `NextResponse.redirect`.
 */
export async function orderGrantValue(orderId: string) {
  const store = await cookies();
  const existing = parseGrants(store.get(ORDER_GRANT_COOKIE)?.value);
  return [orderId, ...existing.filter((id) => id !== orderId)]
    .slice(0, GRANT_LIMIT)
    .join(".");
}

/** Called right after an order is created, before redirecting to the gateway. */
export async function grantOrderAccess(orderId: string) {
  const store = await cookies();
  store.set(
    ORDER_GRANT_COOKIE,
    await orderGrantValue(orderId),
    ORDER_GRANT_OPTIONS,
  );
}

/**
 * True when the current visitor is allowed to see or settle this order:
 * its owner, an admin, or the browser that placed it as a guest.
 */
export async function canAccessOrder(order: {
  id: string;
  userId: string | null;
}): Promise<boolean> {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") return true;
    if (order.userId && order.userId === session.sub) return true;
  }

  // An order that belongs to an account is never reachable through a cookie.
  if (order.userId) return false;

  const store = await cookies();
  return parseGrants(store.get(ORDER_GRANT_COOKIE)?.value).includes(order.id);
}
