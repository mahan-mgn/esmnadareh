"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/actions/admin";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { OrderStatus } from "@/generated/prisma/enums";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

/** Changing the value submits immediately — no extra save button. */
export function OrderStatusSelect({
  orderId,
  status,
  locale,
  dict,
}: {
  orderId: string;
  status: OrderStatus;
  locale: Locale;
  dict: Dictionary;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          const data = new FormData();
          data.set("orderId", orderId);
          data.set("status", next);
          data.set("locale", locale);
          await updateOrderStatus(data);
        });
      }}
      // 16px on phones so iOS does not zoom the whole table on focus; the
      // compact size returns as soon as there is room for it.
      className="w-full cursor-pointer border border-line bg-transparent px-2 py-2 text-base outline-none transition-colors focus:border-accent disabled:opacity-50 sm:py-1.5 sm:text-xs"
    >
      {STATUSES.map((value) => (
        <option key={value} value={value}>
          {dict.orderStatus[value]}
        </option>
      ))}
    </select>
  );
}
