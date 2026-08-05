import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The mark is a paper-cut collage designed on a black field, so it always
 * travels with that field. In dark mode the chip disappears into the page and
 * the letters float; in light mode it reads as a black stamp. Either way the
 * logo is never shown on a background it was not drawn for.
 */
/** Intrinsic ratio of the mark (1914 × 694), used to derive its drawn width. */
const ASPECT = 1914 / 694;

export function Logo({
  className,
  height = 30,
  priority = false,
}: {
  className?: string;
  height?: number;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-ink px-2.5 py-1.5",
        "transition-transform duration-500 ease-[var(--ease-brand)]",
        className,
      )}
      style={{
        clipPath: "polygon(1% 5%, 99% 0%, 100% 93%, 97% 100%, 2% 97%, 0% 9%)",
      }}
    >
      <Image
        src="/brand/esmnadareh-icon.png"
        alt="Esm Nadareh"
        width={1914}
        height={694}
        priority={priority}
        /*
          The source is a 1914px master. Without `sizes`, next/image builds the
          srcset from the intrinsic width and hands a phone the full-size file
          for a mark that draws ~90px wide — on every page, in the header, the
          footer and the drawer. `sizes` switches it to a width-based srcset so
          the optimizer serves a variant matched to the real box.
        */
        sizes={`${Math.ceil(height * ASPECT)}px`}
        // The mark is a two-line collage; it needs real height to stay legible.
        style={{ height, width: "auto" }}
        className="select-none"
      />
    </span>
  );
}

/** Circular badge — favicon-scale spots such as the account menu. */
export function LogoMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/mark-192.png"
      alt="Esm Nadareh"
      width={size}
      height={size}
      className={cn("rounded-full", className)}
    />
  );
}
