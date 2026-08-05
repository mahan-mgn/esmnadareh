import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/table";
import { ProductForm } from "@/components/admin/product-form";

export default async function AdminNewProductPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.collection.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <div>
      <AdminHeader title={dict.admin.newProduct} />
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
          sku: "",
          nameFa: "",
          nameEn: "",
          subtitleFa: "",
          subtitleEn: "",
          descFa: "",
          descEn: "",
          price: 0,
          compareAtPrice: null,
          categoryId: categories[0]?.id ?? "",
          collectionId: null,
          published: true,
          featured: false,
          isNew: true,
        }}
      />
    </div>
  );
}
