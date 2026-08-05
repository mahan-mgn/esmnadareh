"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPurchased } from "@/lib/reviews";
import { getDictionary } from "@/i18n";
import { errorState, successState, type ActionState } from "./types";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

/**
 * Writing — or rewriting — a review.
 *
 * Every submission goes back into moderation, including an edit of something
 * already approved: otherwise an approved review could be swapped for anything
 * the moment it was live.
 */
export async function submitReview(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const session = await getSession();
  if (!session) return errorState(dict.review.signInRequired);

  const parsed = schema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: String(formData.get("title") ?? "").trim() || undefined,
    body: String(formData.get("body") ?? "").trim(),
  });

  if (!parsed.success) {
    const tooShort = parsed.error.issues.some((issue) => issue.path[0] === "body");
    return errorState(tooShort ? dict.review.tooShort : dict.common.required);
  }

  const { productId, rating, title, body } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) return errorState(dict.common.somethingWrong);

  const verified = await hasPurchased(productId, session.sub);

  await prisma.review.upsert({
    where: { productId_userId: { productId, userId: session.sub } },
    create: {
      productId,
      userId: session.sub,
      rating,
      title: title ?? null,
      body,
      verified,
      approved: false,
    },
    update: {
      rating,
      title: title ?? null,
      body,
      verified,
      approved: false,
    },
  });

  revalidatePath(`/${locale}/product/${product.slug}`);
  return successState(dict.review.submitted);
}

export async function deleteOwnReview(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = String(formData.get("reviewId") ?? "");
  if (!id) return;

  // Scoped to the author: a review id from the page must not delete anyone
  // else's opinion.
  await prisma.review.deleteMany({ where: { id, userId: session.sub } });
  revalidatePath("/", "layout");
}
