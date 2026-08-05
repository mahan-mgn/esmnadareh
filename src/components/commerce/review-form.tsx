"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";

import { submitReview } from "@/actions/reviews";
import { idleState } from "@/actions/types";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type OwnReview = {
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
} | null;

export function ReviewForm({
  locale,
  dict,
  productId,
  isSignedIn,
  own,
}: {
  locale: Locale;
  dict: Dictionary;
  productId: string;
  isSignedIn: boolean;
  own: OwnReview;
}) {
  const [state, action] = useActionState(submitReview, idleState);
  const [rating, setRating] = useState(own?.rating ?? 5);

  if (!isSignedIn) {
    return (
      <p className="border border-line px-5 py-6 text-sm text-content-muted">
        {dict.review.signInRequired}{" "}
        <Link
          href={`/${locale}/login?next=${encodeURIComponent(`/${locale}`)}`}
          className="text-accent underline-offset-4 hover:underline"
        >
          {dict.nav.account}
        </Link>
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6 border border-line p-5 sm:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <p className="eyebrow text-content-faint">{dict.review.yourRating}</p>
        {/* Radio semantics rather than buttons: a rating is one choice out of
            five, and arrow keys should move between them. */}
        <div className="mt-3 flex gap-1" role="radiogroup" aria-label={dict.review.yourRating}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={String(value)}
              onClick={() => setRating(value)}
              // The star stays 22px; `touch-target` grows the hit area to 44px
              // on touch devices only, matching the swatches and steppers.
              className="touch-target flex items-center justify-center p-1 transition-colors"
            >
              <Star
                size={22}
                strokeWidth={1.5}
                className={value <= rating ? "text-accent" : "text-content-faint"}
                fill={value <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <Field label={dict.review.titleLabel} hint={dict.common.optional}>
        <Input name="title" maxLength={120} defaultValue={own?.title ?? ""} />
      </Field>

      <Field label={dict.review.bodyLabel}>
        <Textarea
          name="body"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          defaultValue={own?.body ?? ""}
          placeholder={dict.review.bodyPlaceholder}
        />
      </Field>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-rust-400"
              : "text-sm text-accent"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : own && !own.approved ? (
        <p className="text-sm text-content-muted">{dict.review.pending}</p>
      ) : null}

      <Submit
        label={own ? dict.review.update : dict.review.submit}
        pendingLabel={dict.common.loading}
      />
    </form>
  );
}

function Submit({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-fit min-w-44 bg-content px-8 eyebrow text-surface transition-all duration-300 hover:bg-accent hover:text-on-accent disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
