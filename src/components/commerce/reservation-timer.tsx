"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";

import type { Locale } from "@/i18n/config";

/**
 * The stock behind this order is only held for a few minutes. Showing the
 * remaining time is honest about the deadline, and refreshing the page when it
 * runs out means the buyer sees the order lapse instead of paying for units
 * that have already gone back on the shelf.
 */
export function ReservationTimer({
  expiresAt,
  label,
  locale,
}: {
  expiresAt: string;
  label: string;
  locale: Locale;
}) {
  const router = useRouter();
  const deadline = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, deadline - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, router]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const digits = (value: number) =>
    new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(value);

  return (
    <p className="flex items-center justify-center gap-2 text-xs text-content-muted">
      <Timer size={14} strokeWidth={1.5} className="shrink-0" />
      <span>{label}</span>
      <span className="nums tabular-nums" dir="ltr">
        {digits(minutes)}:{digits(seconds)}
      </span>
    </p>
  );
}
