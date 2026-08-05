import Link from "next/link";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { deleteReview, setReviewApproval } from "@/actions/admin";
import {
  AdminHeader,
  EmptyRow,
  Pill,
  Table,
  Td,
  Th,
} from "@/components/admin/table";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Stars } from "@/components/commerce/stars";

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const reviews = await prisma.review.findMany({
    // Unapproved first: this page exists to clear a queue, not to browse.
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      product: { select: { slug: true, nameFa: true, nameEn: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div>
      <AdminHeader title={dict.admin.reviews} />

      <Table>
        <thead>
          <tr>
            <Th>{dict.admin.products}</Th>
            <Th>{dict.review.title}</Th>
            <Th>{dict.admin.joined}</Th>
            <Th>{dict.admin.couponStatus}</Th>
            <Th className="text-end" />
          </tr>
        </thead>
        <tbody>
          {reviews.length ? (
            reviews.map((review) => (
              <tr key={review.id}>
                <Td>
                  <Link
                    href={`/${locale}/product/${review.product.slug}`}
                    className="transition-colors hover:text-accent"
                  >
                    {pick(locale, review.product.nameFa, review.product.nameEn)}
                  </Link>
                  <p className="mt-0.5 text-xs text-content-faint" dir="ltr">
                    {review.user.name ?? review.user.email}
                  </p>
                </Td>
                <Td className="max-w-100">
                  <div className="flex items-center gap-2">
                    <Stars value={review.rating} label={`${review.rating} / 5`} />
                    {review.verified ? (
                      <Pill tone="accent">{dict.review.verified}</Pill>
                    ) : null}
                  </div>
                  {review.title ? (
                    <p className="mt-1.5 font-medium">{review.title}</p>
                  ) : null}
                  <p className="mt-1 text-xs leading-relaxed text-content-muted">
                    {review.body}
                  </p>
                </Td>
                <Td className="text-content-muted nums">
                  {formatDate(review.createdAt, locale)}
                </Td>
                <Td>
                  <Pill tone={review.approved ? "accent" : "muted"}>
                    {review.approved
                      ? dict.admin.reviewApproved
                      : dict.admin.reviewPending}
                  </Pill>
                </Td>
                <Td className="text-end">
                  <div className="flex items-center justify-end gap-4">
                    <form action={setReviewApproval} className="inline">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input
                        type="hidden"
                        name="approved"
                        value={review.approved ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="whitespace-nowrap text-xs text-content-faint transition-colors hover:text-accent"
                      >
                        {review.approved
                          ? dict.admin.reviewHide
                          : dict.admin.reviewApprove}
                      </button>
                    </form>

                    <form action={deleteReview} className="inline">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <ConfirmSubmit
                        label={dict.common.delete}
                        confirmText={dict.admin.confirmDelete}
                      />
                    </form>
                  </div>
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
