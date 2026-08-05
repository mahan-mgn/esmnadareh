import "server-only";

import { prisma } from "./prisma";
import { getSession } from "./auth";

/**
 * Returns the set of product ids the signed-in visitor has saved, so grids can
 * render the heart in its correct state without one query per card.
 */
export async function getWishlistProductIds(): Promise<Set<string>> {
  const session = await getSession();
  if (!session) return new Set();

  const rows = await prisma.wishlistItem.findMany({
    where: { userId: session.sub },
    select: { productId: true },
  });

  return new Set(rows.map((row) => row.productId));
}
