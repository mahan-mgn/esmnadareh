import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { AdminHeader } from "@/components/admin/table";
import { TaxonomyForm } from "@/components/admin/taxonomy-form";

export default async function AdminNewCollectionPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div>
      <AdminHeader title={dict.admin.newCollection} />
      <TaxonomyForm
        kind="collection"
        locale={locale}
        dict={dict}
        values={{
          nameFa: "",
          nameEn: "",
          descFa: "",
          descEn: "",
          taglineFa: "",
          taglineEn: "",
          season: "",
          year: new Date().getFullYear(),
          featured: false,
          published: true,
        }}
      />
    </div>
  );
}
