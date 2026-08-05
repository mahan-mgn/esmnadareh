import "server-only";

import { prisma } from "./prisma";
import { getSession } from "./auth";
import { getCart, cartTotals } from "./cart";
import { pick } from "./utils";
import type { Locale } from "@/i18n/config";

/**
 * Everything the header and footer need, gathered in one pass so the chrome
 * costs a single round-trip rather than one query per widget.
 */
export async function getNavigationData(locale: Locale) {
  const session = await getSession();

  const [categories, collections, cart, wishlistCount] = await Promise.all([
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { slug: true, nameFa: true, nameEn: true },
    }),
    prisma.collection.findMany({
      where: { published: true },
      orderBy: { position: "asc" },
      select: { slug: true, nameFa: true, nameEn: true },
    }),
    getCart(),
    session
      ? prisma.wishlistItem.count({ where: { userId: session.sub } })
      : Promise.resolve(0),
  ]);

  return {
    categories: categories.map((category) => ({
      slug: category.slug,
      name: pick(locale, category.nameFa, category.nameEn),
    })),
    collections: collections.map((collection) => ({
      slug: collection.slug,
      name: pick(locale, collection.nameFa, collection.nameEn),
    })),
    cartCount: cartTotals(cart).count,
    wishlistCount,
    isSignedIn: Boolean(session),
    isAdmin: session?.role === "ADMIN",
  };
}
