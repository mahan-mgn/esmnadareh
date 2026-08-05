"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { getDictionary } from "@/i18n";
import { errorState, successState, type ActionState } from "./types";

export type WishlistState = ActionState & { active?: boolean };

export async function toggleWishlist(
  _previous: WishlistState,
  formData: FormData,
): Promise<WishlistState> {
  const dict = getDictionary(String(formData.get("locale") ?? "fa"));
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return errorState(dict.common.somethingWrong);

  const session = await getSession();
  if (!session) {
    return { status: "error", message: dict.wishlist.loginNeeded };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.sub, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/", "layout");
    return {
      status: "success",
      message: dict.product.removeFromWishlist,
      active: false,
    };
  }

  // The id comes from the client; creating against a missing product would
  // raise a foreign-key error and surface as a 500.
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return errorState(dict.common.somethingWrong);

  await prisma.wishlistItem.create({
    data: { userId: session.sub, productId },
  });
  revalidatePath("/", "layout");
  return {
    status: "success",
    message: dict.product.inWishlist,
    active: true,
  };
}

/** Wishlist → cart, picking the first variant that is actually in stock. */
export async function moveWishlistItemToCart(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dict = getDictionary(String(formData.get("locale") ?? "fa"));
  const productId = String(formData.get("productId") ?? "");

  const session = await getSession();
  if (!session) return errorState(dict.wishlist.loginNeeded);

  const variant = await prisma.productVariant.findFirst({
    where: { productId, stock: { gt: 0 } },
    orderBy: { stock: "desc" },
  });
  if (!variant) return errorState(dict.product.outOfStock);

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.variantId === variant.id);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    create: {
      cartId: cart.id,
      productId,
      variantId: variant.id,
      quantity: 1,
    },
    update: {
      quantity: Math.min(variant.stock, (existing?.quantity ?? 0) + 1),
    },
  });

  await prisma.wishlistItem
    .delete({ where: { userId_productId: { userId: session.sub, productId } } })
    .catch(() => {});

  revalidatePath("/", "layout");
  return successState(dict.product.added);
}
