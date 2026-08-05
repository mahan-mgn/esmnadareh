import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { AdminHeader } from "@/components/admin/table";
import { TaxonomyForm } from "@/components/admin/taxonomy-form";

export default async function AdminNewCategoryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div>
      <AdminHeader title={dict.admin.newCategory} />
      <TaxonomyForm
        kind="category"
        locale={locale}
        dict={dict}
        values={{
          nameFa: "",
          nameEn: "",
          descFa: "",
          descEn: "",
          featured: false,
        }}
      />
    </div>
  );
}
