import "server-only";

import { prisma } from "./prisma";

/**
 * Ratings are aggregated from approved reviews only. An average that quietly
 * includes what nobody has read yet would move the stars around every time
 * spam arrived.
 */
export async function getRatingSummary(productId: string) {
  const result = await prisma.review.aggregate({
    where: { productId, approved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    average: result._avg.rating ?? 0,
    count: result._count._all,
  };
}

export async function getProductReviews(productId: string, take = 12) {
  return prisma.review.findMany({
    where: { productId, approved: true },
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      verified: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });
}

/** The buyer's own review, approved or not — so they can see it is pending. */
export async function getOwnReview(productId: string, userId: string) {
  return prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      approved: true,
    },
  });
}

/**
 * Whether this account has paid for this product.
 *
 * Anyone signed in may write a review; buying it is what earns the "verified"
 * mark next to it.
 */
export async function hasPurchased(productId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      paymentStatus: "PAID",
      items: { some: { productId } },
    },
    select: { id: true },
  });

  return order !== null;
}

/** Only a first name is shown — a full name next to an opinion is more than a buyer signed up for. */
export function reviewerName(name: string | null, fallback: string) {
  if (!name) return fallback;
  const first = name.trim().split(/\s+/)[0];
  return first || fallback;
}
