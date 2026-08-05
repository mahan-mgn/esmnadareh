import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { deleteCategory } from "@/actions/admin";
import { AdminHeader, EmptyRow, Pill, Table, Td, Th } from "@/components/admin/table";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <AdminHeader
        title={dict.admin.categories}
        action={{
          href: `/${locale}/admin/categories/new`,
          label: dict.admin.newCategory,
        }}
      />

      <Table>
        <thead>
          <tr>
            <Th>{dict.admin.name}</Th>
            <Th>{dict.admin.slug}</Th>
            <Th className="text-end">{dict.admin.products}</Th>
            <Th>{dict.admin.featured}</Th>
            <Th className="text-end" />
          </tr>
        </thead>
        <tbody>
          {categories.length ? (
            categories.map((category) => (
              <tr key={category.id}>
                <Td>
                  <Link
                    href={`/${locale}/admin/categories/${category.id}`}
                    className="transition-colors hover:text-accent"
                  >
                    {pick(locale, category.nameFa, category.nameEn)}
                  </Link>
                </Td>
                <Td className="text-content-faint" dir="ltr">
                  {category.slug}
                </Td>
                <Td className="text-end nums">{category._count.products}</Td>
                <Td>
                  {category.featured ? (
                    <Pill tone="accent">{dict.admin.featured}</Pill>
                  ) : (
                    <span className="text-content-faint">—</span>
                  )}
                </Td>
                <Td className="text-end">
                  {/* Deleting is only possible once no products reference it */}
                  <form action={deleteCategory} className="inline">
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <ConfirmSubmit
                      label={dict.common.delete}
                      confirmText={dict.admin.confirmDelete}
                    />
                  </form>
                </Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={5} label={dict.admin.noItems} />
          )}
        </tbody>
      </Table>
    </div>
  );
}
