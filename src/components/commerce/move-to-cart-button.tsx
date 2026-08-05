"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { moveWishlistItemToCart } from "@/actions/wishlist";
import { idleState } from "@/actions/types";
import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/i18n/config";

export function MoveToCartButton({
  productId,
  locale,
  label,
  disabled,
  disabledLabel,
}: {
  productId: string;
  locale: Locale;
  label: string;
  disabled?: boolean;
  disabledLabel: string;
}) {
  const [state, action] = useActionState(moveWishlistItemToCart, idleState);
  const toast = useToast();

  useEffect(() => {
    if (state.status !== "idle" && state.message) {
      toast(state.message, state.status === "error" ? "error" : "success");
    }
  }, [state, toast]);

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locale" value={locale} />
      <Submit
        label={disabled ? disabledLabel : label}
        disabled={Boolean(disabled)}
      />
    </form>
  );
}

function Submit({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="h-10 w-full border border-line-strong eyebrow transition-all duration-300 hover:bg-content hover:text-surface disabled:pointer-events-none disabled:opacity-40"
    >
      {label}
    </button>
  );
}
