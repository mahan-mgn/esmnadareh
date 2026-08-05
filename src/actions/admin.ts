"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { returnStock } from "@/lib/inventory";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";
import { normalizeCouponCode } from "@/lib/coupons";
import { sendOrderStatusUpdate } from "@/lib/mail";
import { slugify } from "@/lib/format";
import { getDictionary } from "@/i18n";
import { errorState, successState, type ActionState } from "./types";
import type { OrderStatus, Role } from "@/generated/prisma/enums";

/**
 * Every admin action re-checks the session; the proxy alone is not enough.
 *
 * The role is re-read from the database rather than trusted from the JWT: the
 * token lives for 30 days, so a demoted admin would otherwise keep writing to
 * the catalogue until it expired.
 */
async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Forbidden");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");

  return session;
}

function bool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function int(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

// ---------------------------------------------------------------- products

const productSchema = z.object({
  nameFa: z.string().min(1),
  nameEn: z.string().min(1),
  descFa: z.string().min(1),
  descEn: z.string().min(1),
  price: z.number().int().min(0),
  categoryId: z.string().min(1),
});

export async function saveProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const id = String(formData.get("id") ?? "");
  const nameEn = String(formData.get("nameEn") ?? "").trim();

  const values = {
    nameFa: String(formData.get("nameFa") ?? "").trim(),
    nameEn,
    subtitleFa: String(formData.get("subtitleFa") ?? "").trim() || null,
    subtitleEn: String(formData.get("subtitleEn") ?? "").trim() || null,
    descFa: String(formData.get("descFa") ?? "").trim(),
    descEn: String(formData.get("descEn") ?? "").trim(),
    price: int(formData.get("price")),
    compareAtPrice: formData.get("compareAtPrice")
      ? int(formData.get("compareAtPrice"))
      : null,
    categoryId: String(formData.get("categoryId") ?? ""),
    collectionId: String(formData.get("collectionId") ?? "") || null,
    published: bool(formData.get("published")),
    featured: bool(formData.get("featured")),
    isNew: bool(formData.get("isNew")),
  };

  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return errorState(dict.common.required);
  }

  if (id) {
    await prisma.product.update({ where: { id }, data: values });
  } else {
    const slug = slugify(nameEn) || `product-${Date.now()}`;
    await prisma.product.create({
      data: {
        ...values,
        slug,
        sku: String(formData.get("sku") ?? "").trim() || `EN-${Date.now()}`,
        specs: [],
        variants: {
          create: {
            sku: `EN-${Date.now()}-OS-STD`,
            stock: int(formData.get("stock"), 0),
          },
        },
      },
    });
  }

  revalidatePath(`/${locale}/admin/products`);
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/products`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  await prisma.product.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/${locale}/admin/products`);
  revalidatePath("/", "layout");
}

export async function updateVariantStock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("variantId") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  await prisma.productVariant.update({
    where: { id },
    data: { stock: Math.max(0, int(formData.get("stock"))) },
  });
  revalidatePath(`/${locale}/admin/products`);
}

// ---------------------------------------------------------------- images

/**
 * Photographs are the shop. Until this existed the only way to change one was
 * to write a URL into the database by hand, which is why every product still
 * wears a generated SVG.
 */
export async function uploadProductImage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("file");

  if (!productId || !(file instanceof File)) {
    return errorState(dict.common.somethingWrong);
  }

  const saved = await saveUploadedImage(file);
  if (!saved.ok) {
    return errorState(
      saved.reason === "too-large"
        ? dict.admin.imageTooLarge
        : dict.admin.imageUnsupported,
    );
  }

  // New photographs go to the end of the strip; the first one is the one the
  // shop grid shows, and reordering is deliberate.
  const last = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.productImage.create({
    data: {
      productId,
      url: saved.url,
      altFa: String(formData.get("altFa") ?? "").trim() || null,
      altEn: String(formData.get("altEn") ?? "").trim() || null,
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath(`/${locale}/admin/products/${productId}`);
  revalidatePath("/", "layout");
  return successState(dict.admin.imageUploaded);
}

export async function deleteProductImage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("imageId") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) return;

  await prisma.productImage.delete({ where: { id } });
  // The row is the only reference to the file, so it goes too — otherwise the
  // upload directory grows forever with photographs nothing points at.
  await deleteUploadedImage(image.url);

  revalidatePath(`/${locale}/admin/products/${image.productId}`);
  revalidatePath("/", "layout");
}

/** Moves an image to the front, which is what the shop grid and cards show. */
export async function makeImagePrimary(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("imageId") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) return;

  const siblings = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  const ordered = [id, ...siblings.map((row) => row.id).filter((rowId) => rowId !== id)];
  await prisma.$transaction(
    ordered.map((rowId, index) =>
      prisma.productImage.update({
        where: { id: rowId },
        data: { position: index },
      }),
    ),
  );

  revalidatePath(`/${locale}/admin/products/${image.productId}`);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- collections

export async function saveCollection(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const id = String(formData.get("id") ?? "");
  const nameFa = String(formData.get("nameFa") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  if (!nameFa || !nameEn) return errorState(dict.common.required);

  const values = {
    nameFa,
    nameEn,
    taglineFa: String(formData.get("taglineFa") ?? "").trim() || null,
    taglineEn: String(formData.get("taglineEn") ?? "").trim() || null,
    storyFa: String(formData.get("storyFa") ?? "").trim() || null,
    storyEn: String(formData.get("storyEn") ?? "").trim() || null,
    season: String(formData.get("season") ?? "").trim() || null,
    year: formData.get("year") ? int(formData.get("year")) : null,
    featured: bool(formData.get("featured")),
    published: bool(formData.get("published")),
  };

  if (id) {
    await prisma.collection.update({ where: { id }, data: values });
  } else {
    await prisma.collection.create({
      data: { ...values, slug: slugify(nameEn) || `collection-${Date.now()}` },
    });
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/collections`);
}

export async function deleteCollection(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  await prisma.collection.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
  revalidatePath(`/${locale}/admin/collections`);
}

// ---------------------------------------------------------------- categories

export async function saveCategory(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const id = String(formData.get("id") ?? "");
  const nameFa = String(formData.get("nameFa") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  if (!nameFa || !nameEn) return errorState(dict.common.required);

  const values = {
    nameFa,
    nameEn,
    descFa: String(formData.get("descFa") ?? "").trim() || null,
    descEn: String(formData.get("descEn") ?? "").trim() || null,
    featured: bool(formData.get("featured")),
  };

  if (id) {
    await prisma.category.update({ where: { id }, data: values });
  } else {
    await prisma.category.create({
      data: { ...values, slug: slugify(nameEn) || `category-${Date.now()}` },
    });
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/categories`);
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  // Categories with products are restricted at the database level; surface a
  // clean no-op rather than a 500.
  await prisma.category.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
  revalidatePath(`/${locale}/admin/categories`);
}

// ---------------------------------------------------------------- coupons

const couponSchema = z.object({
  code: z.string().min(3).max(32).regex(/^[A-Z0-9-]+$/),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().min(1),
});

/** `<input type="date">` gives a bare day; empty means "no bound". */
function date(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function optionalInt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

export async function saveCoupon(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "PERCENT");

  const values = {
    code: normalizeCouponCode(String(formData.get("code") ?? "")),
    type: type === "FIXED" ? ("FIXED" as const) : ("PERCENT" as const),
    value: int(formData.get("value")),
    minSubtotal: Math.max(0, int(formData.get("minSubtotal"))),
    maxDiscount: optionalInt(formData.get("maxDiscount")),
    startsAt: date(formData.get("startsAt")),
    endsAt: date(formData.get("endsAt")),
    usageLimit: optionalInt(formData.get("usageLimit")),
    perUserLimit: optionalInt(formData.get("perUserLimit")),
    active: bool(formData.get("active")),
  };

  const parsed = couponSchema.safeParse(values);
  if (!parsed.success) return errorState(dict.common.required);

  // A percentage above 100 would pay the buyer to shop here.
  if (values.type === "PERCENT" && values.value > 100) {
    return errorState(dict.admin.couponPercentRange);
  }
  if (values.startsAt && values.endsAt && values.startsAt > values.endsAt) {
    return errorState(dict.admin.couponDateRange);
  }

  try {
    if (id) {
      await prisma.coupon.update({ where: { id }, data: values });
    } else {
      await prisma.coupon.create({ data: values });
    }
  } catch (error) {
    // The code is unique — two campaigns cannot share one.
    if ((error as { code?: string }).code === "P2002") {
      return errorState(dict.admin.couponDuplicate);
    }
    throw error;
  }

  revalidatePath(`/${locale}/admin/coupons`);
  redirect(`/${locale}/admin/coupons`);
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  // Orders keep `couponCode` as a snapshot, so deleting a spent code does not
  // erase what a past buyer was charged.
  await prisma.coupon.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/${locale}/admin/coupons`);
}

// ---------------------------------------------------------------- orders

const orderStatuses: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const locale = String(formData.get("locale") ?? "fa");

  if (!id || !orderStatuses.includes(status)) return;

  const before = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!before) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        status,
        // Keep payment state consistent with the fulfilment state.
        ...(status === "PAID" ? { paymentStatus: "PAID" as const } : {}),
        ...(status === "REFUNDED" ? { paymentStatus: "REFUNDED" as const } : {}),
      },
    });

    // A cancelled or refunded order is not shipping — its units go back on the
    // shelf. `returnStock` is idempotent, so toggling between the two states
    // credits the stock once.
    if (status === "CANCELLED" || status === "REFUNDED") {
      await returnStock(tx, id);
    }
  });

  // Only a real change is worth an e-mail; re-saving the same status in the
  // dropdown should not tell the buyer their order moved.
  if (before.status !== status) {
    await sendOrderStatusUpdate(id);
  }

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- reviews

export async function setReviewApproval(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("reviewId") ?? "");
  const approved = bool(formData.get("approved"));
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  const review = await prisma.review.update({
    where: { id },
    data: { approved },
    select: { product: { select: { slug: true } } },
  });

  revalidatePath(`/${locale}/admin/reviews`);
  // The product page shows the rating average, so it has to be rebuilt too.
  revalidatePath(`/${locale}/product/${review.product.slug}`);
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("reviewId") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  await prisma.review.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/${locale}/admin/reviews`);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- users

export async function updateUserRole(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  const locale = String(formData.get("locale") ?? "fa");

  if (!id || !["CUSTOMER", "ADMIN"].includes(role)) return;
  // Do not let an admin lock themselves out.
  if (id === session.sub) return;

  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath(`/${locale}/admin/users`);
}

export async function markMessageHandled(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "fa");
  if (!id) return;

  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) return;

  await prisma.contactMessage.update({
    where: { id },
    data: { handled: !message.handled },
  });
  revalidatePath(`/${locale}/admin/messages`);
}

export async function noop(): Promise<ActionState> {
  return successState();
}
