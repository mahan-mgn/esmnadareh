import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A rating drawn as five outlines with a filled overlay clipped to the score,
 * so 4.3 reads as 4.3 rather than being rounded to something the average is
 * not. The number itself is still announced for screen readers, because a row
 * of icons is not a rating to anyone who cannot see it.
 */
export function Stars({
  value,
  size = 14,
  label,
  className,
}: {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      role="img"
      aria-label={label}
    >
      <span className="flex text-content-faint" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} size={size} strokeWidth={1.5} />
        ))}
      </span>

      <span
        className="absolute inset-0 flex overflow-hidden text-accent"
        style={{ width: `${(clamped / 5) * 100}%` }}
        aria-hidden
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={size}
            strokeWidth={1.5}
            fill="currentColor"
            className="shrink-0"
          />
        ))}
      </span>
    </span>
  );
}
