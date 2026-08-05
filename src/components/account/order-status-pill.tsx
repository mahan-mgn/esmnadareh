import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n";
import type { OrderStatus } from "@/generated/prisma/enums";

/** Only the terminal-negative states get colour; everything else stays quiet. */
const tone: Record<OrderStatus, string> = {
  PENDING: "border-line text-content-muted",
  PAID: "border-accent text-accent",
  PROCESSING: "border-accent text-accent",
  SHIPPED: "border-accent text-accent",
  DELIVERED: "border-line-strong text-content",
  CANCELLED: "border-line text-content-faint line-through",
  REFUNDED: "border-line text-content-faint",
};

export function OrderStatusPill({
  status,
  dict,
  className,
}: {
  status: OrderStatus;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-3 py-1 text-[0.625rem] tracking-[0.16em] uppercase",
        tone[status],
        className,
      )}
    >
      {dict.orderStatus[status]}
    </span>
  );
}
