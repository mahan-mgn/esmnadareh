import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/table";
import { TaxonomyForm } from "@/components/admin/taxonomy-form";

export default async function AdminEditCategoryPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = getDictionary(locale);

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <AdminHeader title={dict.admin.editCategory} />
      <TaxonomyForm
        kind="category"
        locale={locale}
        dict={dict}
        values={{
          id: category.id,
          nameFa: category.nameFa,
          nameEn: category.nameEn,
          descFa: category.descFa ?? "",
          descEn: category.descEn ?? "",
          featured: category.featured,
        }}
      />
    </div>
  );
}
