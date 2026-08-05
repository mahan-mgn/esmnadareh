import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { deleteCollection } from "@/actions/admin";
import { AdminHeader, EmptyRow, Pill, Table, Td, Th } from "@/components/admin/table";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export default async function AdminCollectionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <AdminHeader
        title={dict.admin.collections}
        action={{
          href: `/${locale}/admin/collections/new`,
          label: dict.admin.newCollection,
        }}
      />

      <Table>
        <thead>
          <tr>
            <Th>{dict.admin.name}</Th>
            <Th>{dict.admin.slug}</Th>
            <Th className="text-end">{dict.admin.products}</Th>
            <Th>{dict.admin.published}</Th>
            <Th className="text-end" />
          </tr>
        </thead>
        <tbody>
          {collections.length ? (
            collections.map((collection) => (
              <tr key={collection.id}>
                <Td>
                  <Link
                    href={`/${locale}/admin/collections/${collection.id}`}
                    className="transition-colors hover:text-accent"
                  >
                    {pick(locale, collection.nameFa, collection.nameEn)}
                  </Link>
                  <p className="mt-0.5 text-xs text-content-faint">
                    {collection.season} {collection.year}
                  </p>
                </Td>
                <Td className="text-content-faint" dir="ltr">
                  {collection.slug}
                </Td>
                <Td className="text-end nums">{collection._count.products}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone={collection.published ? "strong" : "muted"}>
                      {collection.published
                        ? dict.admin.published
                        : dict.admin.draft}
                    </Pill>
                    {collection.featured ? (
                      <Pill tone="accent">{dict.admin.featured}</Pill>
                    ) : null}
                  </div>
                </Td>
                <Td className="text-end">
                  <form action={deleteCollection} className="inline">
                    <input type="hidden" name="id" value={collection.id} />
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
