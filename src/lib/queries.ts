import "server-only";

import { prisma } from "./prisma";
import { compareSizes, pick } from "./utils";
import type { Locale } from "@/i18n/config";
import type { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------- shapes

const cardSelect = {
  id: true,
  slug: true,
  nameFa: true,
  nameEn: true,
  subtitleFa: true,
  subtitleEn: true,
  price: true,
  compareAtPrice: true,
  isNew: true,
  featured: true,
  images: {
    orderBy: { position: "asc" },
    take: 2,
    select: { url: true, altFa: true, altEn: true },
  },
  category: { select: { slug: true, nameFa: true, nameEn: true } },
  collection: { select: { slug: true, nameFa: true, nameEn: true } },
  variants: { select: { colorCode: true, colorFa: true, colorEn: true, stock: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  image: string | null;
  hoverImage: string | null;
  alt: string;
  categoryName: string;
  categorySlug: string;
  collectionName: string | null;
  colors: string[];
  inStock: boolean;
};

type RawCard = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function toCard(product: RawCard, locale: Locale): ProductCardData {
  const name = pick(locale, product.nameFa, product.nameEn);
  return {
    id: product.id,
    slug: product.slug,
    name,
    subtitle: pick(locale, product.subtitleFa, product.subtitleEn),
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    isNew: product.isNew,
    image: product.images[0]?.url ?? null,
    hoverImage: product.images[1]?.url ?? null,
    alt:
      pick(
        locale,
        product.images[0]?.altFa ?? null,
        product.images[0]?.altEn ?? null,
      ) ?? name,
    categoryName: pick(
      locale,
      product.category.nameFa,
      product.category.nameEn,
    ),
    categorySlug: product.category.slug,
    collectionName: product.collection
      ? pick(locale, product.collection.nameFa, product.collection.nameEn)
      : null,
    colors: Array.from(
      new Set(
        product.variants
          .map((variant) => variant.colorCode)
          .filter((code): code is string => Boolean(code)),
      ),
    ),
    inStock: product.variants.some((variant) => variant.stock > 0),
  };
}

// ---------------------------------------------------------------- home

export async function getFeaturedProducts(locale: Locale, take = 8) {
  const rows = await prisma.product.findMany({
    where: { published: true, featured: true },
    orderBy: { position: "asc" },
    take,
    select: cardSelect,
  });
  return rows.map((row) => toCard(row, locale));
}

export async function getNewArrivals(locale: Locale, take = 8) {
  const rows = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take,
    select: cardSelect,
  });
  return rows.map((row) => toCard(row, locale));
}

export async function getFeaturedCollections(locale: Locale, take = 3) {
  const rows = await prisma.collection.findMany({
    where: { published: true, featured: true },
    orderBy: { position: "asc" },
    take,
    include: { _count: { select: { products: true } } },
  });

  return rows.map((row) => ({
    slug: row.slug,
    name: pick(locale, row.nameFa, row.nameEn),
    tagline: pick(locale, row.taglineFa, row.taglineEn),
    cover: row.coverImage,
    season: row.season,
    year: row.year,
    count: row._count.products,
  }));
}

export async function getCategories(locale: Locale) {
  const rows = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return rows.map((row) => ({
    slug: row.slug,
    name: pick(locale, row.nameFa, row.nameEn),
    description: pick(locale, row.descFa, row.descEn),
    image: row.image,
    featured: row.featured,
    count: row._count.products,
  }));
}

// ---------------------------------------------------------------- shop

export type ShopSort = "newest" | "price-asc" | "price-desc" | "name-asc";

export type ShopFilters = {
  q?: string;
  category?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
  sort?: ShopSort;
  page?: number;
  perPage?: number;
};

const orderByFor: Record<ShopSort, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  "name-asc": { nameEn: "asc" },
};

export async function getShopProducts(locale: Locale, filters: ShopFilters) {
  const perPage = filters.perPage ?? 12;
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.ProductWhereInput = { published: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.q) {
    and.push({
      OR: [
        { nameFa: { contains: filters.q, mode: "insensitive" } },
        { nameEn: { contains: filters.q, mode: "insensitive" } },
        { descFa: { contains: filters.q, mode: "insensitive" } },
        { descEn: { contains: filters.q, mode: "insensitive" } },
        { sku: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.category) and.push({ category: { slug: filters.category } });
  if (filters.collection) and.push({ collection: { slug: filters.collection } });
  if (filters.minPrice !== undefined) and.push({ price: { gte: filters.minPrice } });
  if (filters.maxPrice !== undefined) and.push({ price: { lte: filters.maxPrice } });
  if (filters.sizes?.length) {
    and.push({ variants: { some: { size: { in: filters.sizes } } } });
  }
  if (filters.colors?.length) {
    and.push({ variants: { some: { colorCode: { in: filters.colors } } } });
  }
  if (filters.inStock) and.push({ variants: { some: { stock: { gt: 0 } } } });

  if (and.length) where.AND = and;

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderByFor[filters.sort ?? "newest"],
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map((row) => toCard(row, locale)),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Facet values for the current view. Sizes and colours are scoped to the
 * active category/collection — a shoe size next to a ring size next to a belt
 * length is noise, not a filter.
 */
export async function getShopFacets(
  locale: Locale,
  scope: { category?: string; collection?: string } = {},
) {
  const scopedProduct: Prisma.ProductWhereInput = { published: true };
  if (scope.category) scopedProduct.category = { slug: scope.category };
  if (scope.collection) scopedProduct.collection = { slug: scope.collection };

  const [variants, priceRange, categories, collections] = await Promise.all([
    prisma.productVariant.findMany({
      where: { product: scopedProduct },
      select: { size: true, colorCode: true, colorFa: true, colorEn: true },
    }),
    prisma.product.aggregate({
      where: { published: true },
      _min: { price: true },
      _max: { price: true },
    }),
    getCategories(locale),
    prisma.collection.findMany({
      where: { published: true },
      orderBy: { position: "asc" },
      select: { slug: true, nameFa: true, nameEn: true },
    }),
  ]);

  const sizes = Array.from(
    new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s))),
  ).sort(compareSizes);

  const colorMap = new Map<string, string>();
  for (const variant of variants) {
    if (variant.colorCode && !colorMap.has(variant.colorCode)) {
      colorMap.set(
        variant.colorCode,
        pick(locale, variant.colorFa, variant.colorEn) ?? variant.colorCode,
      );
    }
  }

  return {
    sizes,
    colors: Array.from(colorMap, ([code, name]) => ({ code, name })),
    minPrice: priceRange._min.price ?? 0,
    maxPrice: priceRange._max.price ?? 0,
    categories,
    collections: collections.map((collection) => ({
      slug: collection.slug,
      name: pick(locale, collection.nameFa, collection.nameEn),
    })),
  };
}

// ---------------------------------------------------------------- product

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, published: true },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ size: "asc" }, { colorCode: "asc" }] },
      category: true,
      collection: true,
    },
  });
}

export async function getRelatedProducts(
  locale: Locale,
  product: { id: string; categoryId: string; collectionId: string | null },
  take = 4,
) {
  const rows = await prisma.product.findMany({
    where: {
      published: true,
      id: { not: product.id },
      OR: [
        { collectionId: product.collectionId ?? undefined },
        { categoryId: product.categoryId },
      ],
    },
    orderBy: { featured: "desc" },
    take,
    select: cardSelect,
  });
  return rows.map((row) => toCard(row, locale));
}

// ---------------------------------------------------------------- collections

export async function getCollections(locale: Locale) {
  const rows = await prisma.collection.findMany({
    where: { published: true },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return rows.map((row) => ({
    slug: row.slug,
    name: pick(locale, row.nameFa, row.nameEn),
    tagline: pick(locale, row.taglineFa, row.taglineEn),
    story: pick(locale, row.storyFa, row.storyEn),
    cover: row.coverImage,
    season: row.season,
    year: row.year,
    count: row._count.products,
  }));
}

export async function getCollectionBySlug(slug: string, locale: Locale) {
  const row = await prisma.collection.findFirst({
    where: { slug, published: true },
    include: {
      products: {
        where: { published: true },
        orderBy: { position: "asc" },
        select: cardSelect,
      },
    },
  });
  if (!row) return null;

  return {
    slug: row.slug,
    name: pick(locale, row.nameFa, row.nameEn),
    tagline: pick(locale, row.taglineFa, row.taglineEn),
    story: pick(locale, row.storyFa, row.storyEn),
    cover: row.coverImage,
    season: row.season,
    year: row.year,
    releasedAt: row.releasedAt,
    products: row.products.map((product) => toCard(product, locale)),
  };
}
