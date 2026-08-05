import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { getSession } from "./auth";

export const CART_COOKIE = "en_cart";
const CART_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export const FREE_SHIPPING_THRESHOLD = 5_000_000;
export const SHIPPING_FLAT = 79_000;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      },
      variant: true,
    },
  },
} as const;

export type CartWithItems = NonNullable<
  Awaited<ReturnType<typeof getCart>>
>;
export type CartLine = CartWithItems["items"][number];

/**
 * Read-only lookup safe to call from Server Components. Returns null rather
 * than minting a cart, because RSCs may not write cookies.
 */
export async function getCart() {
  const session = await getSession();
  if (session) {
    return prisma.cart.findUnique({
      where: { userId: session.sub },
      include: cartInclude,
    });
  }

  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;

  return prisma.cart.findUnique({
    where: { token },
    include: cartInclude,
  });
}

/**
 * Mutating counterpart — only valid inside Server Actions and Route Handlers,
 * where setting the cart cookie is allowed.
 */
export async function getOrCreateCart() {
  const session = await getSession();
  const store = await cookies();

  if (session) {
    const existing = await prisma.cart.findUnique({
      where: { userId: session.sub },
      include: cartInclude,
    });
    if (existing) return existing;

    return prisma.cart.create({
      data: { userId: session.sub, token: randomUUID() },
      include: cartInclude,
    });
  }

  const token = store.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await prisma.cart.findUnique({
      where: { token },
      include: cartInclude,
    });
    if (existing) return existing;
  }

  const newToken = token ?? randomUUID();
  store.set(CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MAX_AGE,
  });

  return prisma.cart.create({
    data: { token: newToken },
    include: cartInclude,
  });
}

export function lineUnitPrice(line: {
  product: { price: number };
  variant: { priceDelta: number };
}) {
  return line.product.price + line.variant.priceDelta;
}

export function cartTotals(cart: CartWithItems | null) {
  const items = cart?.items ?? [];
  const count = items.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = items.reduce(
    (sum, line) => sum + lineUnitPrice(line) * line.quantity,
    0,
  );
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  return {
    count,
    subtotal,
    shipping,
    total: subtotal + shipping,
    remainingForFreeShipping: Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - subtotal,
    ),
  };
}

/**
 * Called right after sign-in: folds an anonymous cart into the user's cart so
 * nothing picked out before logging in is lost.
 */
export async function mergeAnonymousCart(userId: string) {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return;

  const anon = await prisma.cart.findUnique({
    where: { token },
    include: { items: true },
  });
  if (!anon || anon.userId) return;

  const userCart =
    (await prisma.cart.findUnique({ where: { userId } })) ??
    (await prisma.cart.create({
      data: { userId, token: randomUUID() },
    }));

  for (const item of anon.items) {
    await prisma.cartItem.upsert({
      where: {
        cartId_variantId: { cartId: userCart.id, variantId: item.variantId },
      },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      },
      update: { quantity: { increment: item.quantity } },
    });
  }

  await prisma.cart.delete({ where: { id: anon.id } });
  store.delete(CART_COOKIE);
}
