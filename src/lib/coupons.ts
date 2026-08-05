import "server-only";

import { prisma } from "./prisma";
import { cartTotals, type CartWithItems } from "./cart";
import type { Dictionary } from "@/i18n";
import type { Coupon } from "@/generated/prisma/client";

/**
 * Discount codes.
 *
 * A code is never "applied" in the sense of being baked into a total — it is
 * re-evaluated every time a basket is priced, and again when the order is
 * placed. A basket can sit in a cookie for weeks; by the time it is paid for,
 * the code may have expired, run out, or stopped clearing its minimum because
 * a line was removed.
 */

export type CouponRejection =
  | "not-found"
  | "inactive"
  | "not-started"
  | "expired"
  | "min-subtotal"
  | "usage-limit"
  | "already-used";

export type CouponCheck =
  | { ok: true; discount: number }
  | { ok: false; reason: CouponRejection };

/** Buyers type codes in any case, with stray spaces, sometimes with a dash. */
export function normalizeCouponCode(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * What the code takes off this subtotal.
 *
 * Never more than the subtotal itself: a 500,000 flat code on a 300,000 basket
 * discounts 300,000, it does not start paying for the shipping.
 */
export function discountFor(
  coupon: Pick<Coupon, "type" | "value" | "maxDiscount">,
  subtotal: number,
) {
  const raw =
    coupon.type === "PERCENT"
      ? Math.floor((subtotal * Math.min(100, Math.max(0, coupon.value))) / 100)
      : coupon.value;

  const capped =
    coupon.type === "PERCENT" && coupon.maxDiscount !== null
      ? Math.min(raw, coupon.maxDiscount)
      : raw;

  return Math.max(0, Math.min(capped, subtotal));
}

/**
 * Redemptions are counted from the orders themselves rather than a column, so
 * a cancelled or lapsed checkout gives the code back automatically.
 */
async function redemptions(couponId: string, userId?: string | null) {
  return prisma.order.count({
    where: {
      couponId,
      status: { not: "CANCELLED" },
      ...(userId ? { userId } : {}),
    },
  });
}

export async function checkCoupon(
  coupon: Coupon | null,
  subtotal: number,
  userId?: string | null,
): Promise<CouponCheck> {
  if (!coupon) return { ok: false, reason: "not-found" };
  if (!coupon.active) return { ok: false, reason: "inactive" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: "not-started" };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, reason: "expired" };
  }
  if (subtotal < coupon.minSubtotal) {
    return { ok: false, reason: "min-subtotal" };
  }

  if (coupon.usageLimit !== null) {
    if ((await redemptions(coupon.id)) >= coupon.usageLimit) {
      return { ok: false, reason: "usage-limit" };
    }
  }

  // Per-buyer limits can only be enforced against an account; a guest has
  // nothing durable to count against.
  if (coupon.perUserLimit !== null && userId) {
    if ((await redemptions(coupon.id, userId)) >= coupon.perUserLimit) {
      return { ok: false, reason: "already-used" };
    }
  }

  return { ok: true, discount: discountFor(coupon, subtotal) };
}

/**
 * Why a code did not apply, in the buyer's language.
 *
 * "Not found" and "expired" are told apart on purpose: a shopper mistyping a
 * code needs to know to check it, and one holding a genuinely dead code needs
 * to stop trying.
 */
export function couponMessage(reason: CouponRejection, dict: Dictionary) {
  switch (reason) {
    case "min-subtotal":
      return dict.cart.couponMinSubtotal;
    case "expired":
    case "not-started":
      return dict.cart.couponExpired;
    case "usage-limit":
    case "already-used":
      return dict.cart.couponUsedUp;
    case "inactive":
    case "not-found":
    default:
      return dict.cart.couponInvalid;
  }
}

export async function findCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code: normalizeCouponCode(code) },
  });
}

export type PricedCart = ReturnType<typeof cartTotals> & {
  discount: number;
  coupon: Coupon | null;
  /** Set when a code is attached but currently does nothing, so the UI can say why. */
  couponIssue: CouponRejection | null;
};

/**
 * The single place a basket turns into money. Both the cart and checkout pages
 * render from this, and `placeOrder` charges from it — so what the buyer was
 * shown and what they are charged cannot drift apart.
 */
export async function priceCart(
  cart: CartWithItems | null,
  userId?: string | null,
): Promise<PricedCart> {
  const base = cartTotals(cart);

  if (!cart?.couponId) {
    return { ...base, discount: 0, coupon: null, couponIssue: null };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { id: cart.couponId },
  });
  const check = await checkCoupon(coupon, base.subtotal, userId);

  if (!check.ok) {
    return { ...base, discount: 0, coupon, couponIssue: check.reason };
  }

  return {
    ...base,
    discount: check.discount,
    total: base.subtotal - check.discount + base.shipping,
    coupon,
    couponIssue: null,
  };
}
