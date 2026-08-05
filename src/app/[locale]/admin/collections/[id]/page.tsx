import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/table";
import { TaxonomyForm } from "@/components/admin/taxonomy-form";

export default async function AdminEditCollectionPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = getDictionary(locale);

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) notFound();

  return (
    <div>
      <AdminHeader title={dict.admin.editCollection} />
      <TaxonomyForm
        kind="collection"
        locale={locale}
        dict={dict}
        values={{
          id: collection.id,
          nameFa: collection.nameFa,
          nameEn: collection.nameEn,
          descFa: collection.storyFa ?? "",
          descEn: collection.storyEn ?? "",
          taglineFa: collection.taglineFa ?? "",
          taglineEn: collection.taglineEn ?? "",
          season: collection.season ?? "",
          year: collection.year,
          featured: collection.featured,
          published: collection.published,
        }}
      />
    </div>
  );
}
