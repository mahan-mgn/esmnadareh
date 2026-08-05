"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";

import { applyCoupon, removeCoupon } from "@/actions/cart";
import { idleState } from "@/actions/types";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

/**
 * The code box.
 *
 * When a code is already attached it shows what is attached instead of an
 * empty field — including when it has stopped applying, with the reason. A
 * basket that silently drops a discount the buyer entered is how checkout
 * abandonment happens.
 */
export function CouponForm({
  locale,
  dict,
  applied,
  issue,
}: {
  locale: Locale;
  dict: Dictionary;
  applied: string | null;
  issue: string | null;
}) {
  const [state, action] = useActionState(applyCoupon, idleState);

  if (applied) {
    return (
      <div className="mt-6 border-t border-line pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm" dir="ltr">
              {applied}
            </p>
            {issue ? (
              <p className="mt-1 text-xs text-rust-400">{issue}</p>
            ) : (
              <p className="mt-1 text-xs text-content-faint">
                {dict.cart.couponApplied}
              </p>
            )}
          </div>

          <form action={removeCoupon}>
            <button
              type="submit"
              aria-label={dict.cart.couponRemove}
              title={dict.cart.couponRemove}
              className="touch-target -me-2 flex items-center justify-center p-1 text-content-faint transition-colors hover:text-content"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 border-t border-line pt-5">
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="coupon-code" className="eyebrow text-content-faint">
        {dict.cart.couponLabel}
      </label>

      <div className="mt-2 flex items-stretch gap-2">
        <input
          id="coupon-code"
          name="code"
          required
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          placeholder={dict.cart.couponPlaceholder}
          className="min-w-0 flex-1 border-b border-line bg-transparent py-2 text-base uppercase outline-none transition-colors placeholder:normal-case placeholder:text-content-faint focus:border-accent sm:text-sm"
        />
        <ApplyButton label={dict.cart.couponApply} />
      </div>

      {state.status === "error" && state.message ? (
        <p className="mt-2 text-xs text-rust-400" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function ApplyButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 shrink-0 border-b border-line px-3 pb-2 text-xs uppercase tracking-wider text-content-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50 sm:min-h-0"
    >
      {label}
    </button>
  );
}
