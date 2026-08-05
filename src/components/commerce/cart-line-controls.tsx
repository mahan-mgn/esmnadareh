"use client";

import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { removeCartItem, updateCartItem } from "@/actions/cart";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/config";

/**
 * Quantity stepper and remove control for one cart line. Both call server
 * actions directly so the cart stays authoritative in the database.
 */
export function CartLineControls({
  itemId,
  quantity,
  max,
  removeLabel,
  locale,
}: {
  itemId: string;
  quantity: number;
  max: number;
  removeLabel: string;
  locale: Locale;
}) {
  const [pending, startTransition] = useTransition();

  function setQuantity(next: number) {
    startTransition(async () => {
      const data = new FormData();
      data.set("itemId", itemId);
      data.set("quantity", String(next));
      await updateCartItem(data);
    });
  }

  function remove() {
    startTransition(async () => {
      const data = new FormData();
      data.set("itemId", itemId);
      await removeCartItem(data);
    });
  }

  return (
    <div
      className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-2"
      data-pending={pending ? "" : undefined}
      style={{ opacity: pending ? 0.55 : 1, transition: "opacity 200ms" }}
    >
      <div className="flex items-center border border-line">
        <button
          type="button"
          onClick={() => setQuantity(quantity - 1)}
          disabled={pending}
          aria-label="-"
          className="flex h-11 w-11 items-center justify-center text-content-muted transition-colors hover:text-content disabled:opacity-40 sm:h-9 sm:w-9"
        >
          <Minus size={13} />
        </button>
        <span className="w-8 text-center text-sm nums">
          {formatNumber(quantity, locale)}
        </span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          disabled={pending || quantity >= max}
          aria-label="+"
          className="flex h-11 w-11 items-center justify-center text-content-muted transition-colors hover:text-content disabled:opacity-40 sm:h-9 sm:w-9"
        >
          <Plus size={13} />
        </button>
      </div>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs text-content-faint transition-colors hover:text-rust-400 disabled:opacity-40"
      >
        <Trash2 size={13} />
        {removeLabel}
      </button>
    </div>
  );
}
