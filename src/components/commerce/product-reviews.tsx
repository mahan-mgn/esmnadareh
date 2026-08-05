import { BadgeCheck } from "lucide-react";

import { formatDate, formatNumber } from "@/lib/format";
import { reviewerName } from "@/lib/reviews";
import { count } from "@/i18n";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { Stars } from "./stars";
import { ReviewForm, type OwnReview } from "./review-form";

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: Date;
  user: { name: string | null };
};

export function ProductReviews({
  locale,
  dict,
  productId,
  summary,
  reviews,
  isSignedIn,
  own,
}: {
  locale: Locale;
  dict: Dictionary;
  productId: string;
  summary: { average: number; count: number };
  reviews: ReviewRow[];
  isSignedIn: boolean;
  own: OwnReview;
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div>
        <div className="flex flex-wrap items-center gap-4 border-b border-line pb-6">
          <Stars
            value={summary.average}
            size={18}
            label={`${summary.average.toFixed(1)} / 5`}
          />
          <p className="text-sm text-content-muted nums">
            {summary.count > 0
              ? `${formatNumber(Number(summary.average.toFixed(1)), locale)} — ${count(
                  dict.review.reviewsCount,
                  summary.count,
                  locale,
                )}`
              : dict.review.none}
          </p>
        </div>

        {reviews.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {reviews.map((review) => (
              <li key={review.id} className="py-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={review.rating} label={`${review.rating} / 5`} />
                  <span className="text-sm">
                    {reviewerName(review.user.name, dict.review.anonymous)}
                  </span>
                  {review.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-accent">
                      <BadgeCheck size={13} strokeWidth={1.5} />
                      {dict.review.verified}
                    </span>
                  ) : null}
                  <span className="text-xs text-content-faint nums">
                    {formatDate(review.createdAt, locale)}
                  </span>
                </div>

                {review.title ? (
                  <h3 className="mt-3 font-medium">{review.title}</h3>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-content-muted">
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-10 text-sm text-content-muted">{dict.review.beFirst}</p>
        )}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <h3 className="mb-5 eyebrow text-content-faint">
          {dict.review.writeTitle}
        </h3>
        <ReviewForm
          locale={locale}
          dict={dict}
          productId={productId}
          isSignedIn={isSignedIn}
          own={own}
        />
      </aside>
    </div>
  );
}
