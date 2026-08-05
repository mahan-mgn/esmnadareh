"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Heart } from "lucide-react";
import { toggleWishlist, type WishlistState } from "@/actions/wishlist";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function WishlistButton({
  productId,
  active,
  dict,
  locale,
  variant = "inline",
  className,
}: {
  productId: string;
  active: boolean;
  dict: Dictionary;
  locale: Locale;
  variant?: "inline" | "floating";
  className?: string;
}) {
  const [state, action] = useActionState<WishlistState, FormData>(
    toggleWishlist,
    { status: "idle" },
  );
  const toast = useToast();

  // The action's own result wins until the server sends a fresh `active` prop,
  // which keeps the heart filled the moment it is pressed.
  const saved = typeof state.active === "boolean" ? state.active : active;

  useEffect(() => {
    if (state.status !== "idle" && state.message) {
      toast(state.message, state.status === "error" ? "error" : "success");
    }
  }, [state, toast]);

  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locale" value={locale} />
      <Inner
        saved={saved}
        variant={variant}
        className={className}
        label={saved ? dict.product.removeFromWishlist : dict.product.addToWishlist}
      />
    </form>
  );
}

function Inner({
  saved,
  variant,
  className,
  label,
}: {
  saved: boolean;
  variant: "inline" | "floating";
  className?: string;
  label: string;
}) {
  const { pending } = useFormStatus();

  if (variant === "floating") {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        aria-pressed={saved}
        className={cn(
          // Permanently visible on touch (see ProductCard), so it has to be
          // comfortably tappable there rather than a 36px hover affordance.
          "flex h-11 w-11 items-center justify-center bg-surface/90 backdrop-blur-sm sm:h-9 sm:w-9",
          "transition-all duration-300 ease-[var(--ease-brand)] hover:bg-surface",
          "disabled:opacity-50",
          className,
        )}
      >
        <Heart
          size={16}
          strokeWidth={1.5}
          className={cn(
            "transition-all duration-300",
            saved ? "fill-accent text-accent scale-110" : "text-content",
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 border border-line-strong px-5",
        "eyebrow transition-all duration-300 ease-[var(--ease-brand)]",
        "hover:bg-content hover:text-surface disabled:opacity-50",
        saved && "border-accent text-accent hover:bg-accent hover:text-on-accent",
        className,
      )}
    >
      <Heart
        size={15}
        strokeWidth={1.5}
        className={cn(saved && "fill-current")}
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
