import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { deleteProduct } from "@/actions/admin";
import { AdminHeader, EmptyRow, Pill, Table, Td, Th } from "@/components/admin/table";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: true,
      variants: { select: { stock: true } },
    },
  });

  return (
    <div>
      <AdminHeader
        title={dict.admin.products}
        action={{
          href: `/${locale}/admin/products/new`,
          label: dict.admin.newProduct,
        }}
      />

      <Table>
        <thead>
          <tr>
            <Th className="w-16" />
            <Th>{dict.admin.name}</Th>
            <Th>{dict.shop.category}</Th>
            <Th className="text-end">{dict.admin.price}</Th>
            <Th className="text-end">{dict.admin.stock}</Th>
            <Th>{dict.admin.published}</Th>
            <Th className="text-end" />
          </tr>
        </thead>
        <tbody>
          {products.length ? (
            products.map((product) => {
              const stock = product.variants.reduce(
                (sum, variant) => sum + variant.stock,
                0,
              );

              return (
                <tr key={product.id}>
                  <Td>
                    <div className="relative aspect-4/5 w-10 overflow-hidden bg-surface-2">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </Td>
                  <Td>
                    <Link
                      href={`/${locale}/admin/products/${product.id}`}
                      className="transition-colors hover:text-accent"
                    >
                      {pick(locale, product.nameFa, product.nameEn)}
                    </Link>
                    <p className="mt-0.5 text-xs text-content-faint nums">
                      {product.sku}
                    </p>
                  </Td>
                  <Td className="text-content-muted">
                    {pick(locale, product.category.nameFa, product.category.nameEn)}
                  </Td>
                  <Td className="text-end nums">
                    {formatPrice(product.price, locale)}
                  </Td>
                  <Td
                    className={
                      stock === 0 ? "text-end text-rust-400 nums" : "text-end nums"
                    }
                  >
                    {stock}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill tone={product.published ? "strong" : "muted"}>
                        {product.published ? dict.admin.published : dict.admin.draft}
                      </Pill>
                      {product.featured ? (
                        <Pill tone="accent">{dict.admin.featured}</Pill>
                      ) : null}
                    </div>
                  </Td>
                  <Td className="text-end">
                    <form action={deleteProduct} className="inline">
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <ConfirmSubmit
                        label={dict.common.delete}
                        confirmText={dict.admin.confirmDelete}
                      />
                    </form>
                  </Td>
                </tr>
              );
            })
          ) : (
            <EmptyRow colSpan={7} label={dict.admin.noItems} />
          )}
        </tbody>
      </Table>
    </div>
  );
}
