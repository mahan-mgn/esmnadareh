import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/table";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = getDictionary(locale);

  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: [{ size: "asc" }, { colorCode: "asc" }] },
        images: { orderBy: { position: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.collection.findMany({ orderBy: { position: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-14">
      <AdminHeader title={dict.admin.editProduct} />
      <ProductForm
        locale={locale}
        dict={dict}
        categories={categories.map((category) => ({
          id: category.id,
          name: pick(locale, category.nameFa, category.nameEn),
        }))}
        collections={collections.map((collection) => ({
          id: collection.id,
          name: pick(locale, collection.nameFa, collection.nameEn),
        }))}
        values={{
          id: product.id,
          sku: product.sku,
          nameFa: product.nameFa,
          nameEn: product.nameEn,
          subtitleFa: product.subtitleFa ?? "",
          subtitleEn: product.subtitleEn ?? "",
          descFa: product.descFa,
          descEn: product.descEn,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          categoryId: product.categoryId,
          collectionId: product.collectionId,
          published: product.published,
          featured: product.featured,
          isNew: product.isNew,
        }}
        variants={product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          size: variant.size,
          colorName: pick(locale, variant.colorFa, variant.colorEn),
          stock: variant.stock,
        }))}
      />

      <ProductImages
        locale={locale}
        dict={dict}
        productId={product.id}
        images={product.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: pick(locale, image.altFa, image.altEn),
        }))}
      />
    </div>
  );
}
