"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cartTotals, getCart, getOrCreateCart } from "@/lib/cart";
import {
  checkCoupon,
  couponMessage,
  findCouponByCode,
  normalizeCouponCode,
} from "@/lib/coupons";
import { getDictionary } from "@/i18n";
import { errorState, successState, type ActionState } from "./types";

/** Matches the per-line cap enforced when adding to the cart. */
const MAX_LINE_QUANTITY = 20;

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(MAX_LINE_QUANTITY).default(1),
  locale: z.string().default("fa"),
});

export async function addToCart(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dict = getDictionary(String(formData.get("locale") ?? "fa"));

  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return errorState(dict.product.pleaseSelectSize);
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    select: { id: true, stock: true, productId: true },
  });

  if (!variant || variant.productId !== parsed.data.productId) {
    return errorState(dict.common.somethingWrong);
  }
  if (variant.stock < 1) {
    return errorState(dict.product.outOfStock);
  }

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.variantId === variant.id);
  // Repeated adds must respect the same cap a single add does.
  const nextQuantity = Math.min(
    variant.stock,
    MAX_LINE_QUANTITY,
    (existing?.quantity ?? 0) + parsed.data.quantity,
  );

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    create: {
      cartId: cart.id,
      productId: variant.productId,
      variantId: variant.id,
      quantity: nextQuantity,
    },
    update: { quantity: nextQuantity },
  });

  revalidatePath("/", "layout");
  return successState(dict.product.added);
}

/**
 * A cart-item id arrives from the client, so every mutation is scoped to the
 * caller's own cart. Without the `cartId` in the filter, one visitor could
 * re-quantify or delete lines out of someone else's cart.
 */
export async function updateCartItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  if (!itemId) return;

  const cart = await getCart();
  if (!cart) return;

  const item = cart.items.find((line) => line.id === itemId);
  if (!item) return;

  if (!Number.isFinite(quantity) || quantity < 1) {
    await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    revalidatePath("/", "layout");
    return;
  }

  await prisma.cartItem.updateMany({
    where: { id: itemId, cartId: cart.id },
    data: {
      quantity: Math.min(
        Math.round(quantity),
        Math.max(1, item.variant.stock),
        MAX_LINE_QUANTITY,
      ),
    },
  });

  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- coupons

/**
 * Attaching a code to the basket, not to a total: what it is worth is worked
 * out again on every render and once more at checkout.
 */
export async function applyCoupon(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);
  const code = normalizeCouponCode(String(formData.get("code") ?? ""));

  if (!code) return errorState(dict.common.required);

  const cart = await getCart();
  if (!cart?.items.length) return errorState(dict.checkout.emptyCart);

  const coupon = await findCouponByCode(code);
  const session = await getSession();
  const { subtotal } = cartTotals(cart);
  const check = await checkCoupon(coupon, subtotal, session?.sub);

  if (!check.ok || !coupon) {
    return errorState(couponMessage(check.ok ? "not-found" : check.reason, dict));
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: coupon.id },
  });

  revalidatePath("/", "layout");
  return successState(dict.cart.couponApplied);
}

export async function removeCoupon() {
  const cart = await getCart();
  if (!cart) return;

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: null },
  });

  revalidatePath("/", "layout");
}

export async function removeCartItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const cart = await getCart();
  if (!cart) return;

  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  revalidatePath("/", "layout");
}
