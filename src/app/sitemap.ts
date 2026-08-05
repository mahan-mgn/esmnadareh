import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { locales } from "@/i18n/config";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

const STATIC_PATHS = ["", "/shop", "/collections", "/about", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.collection.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
      });
    }

    for (const product of products) {
      entries.push({
        url: `${BASE}/${locale}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const collection of collections) {
      entries.push({
        url: `${BASE}/${locale}/collections/${collection.slug}`,
        lastModified: collection.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
