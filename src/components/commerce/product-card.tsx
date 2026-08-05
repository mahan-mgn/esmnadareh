import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { discountPercent, formatPercent, formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({
  product,
  locale,
  dict,
  inWishlist = false,
  priority = false,
  className,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw",
}: {
  product: ProductCardData;
  locale: Locale;
  dict: Dictionary;
  inWishlist?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const discount = discountPercent(product.price, product.compareAtPrice);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link
        href={`/${locale}/product/${product.slug}`}
        className="relative block overflow-hidden bg-surface-2"
        aria-label={product.name}
      >
        <div className="relative aspect-4/5 w-full">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.alt}
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                "object-cover transition-all duration-700 ease-[var(--ease-brand)]",
                product.hoverImage
                  ? "group-hover:opacity-0"
                  : "group-hover:scale-105",
              )}
            />
          ) : (
            <div className="absolute inset-0 bg-surface-3" />
          )}

          {/* Second frame, cross-faded on hover — the editorial "flip" */}
          {product.hoverImage ? (
            <Image
              src={product.hoverImage}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-all duration-700 ease-[var(--ease-brand)] group-hover:scale-105 group-hover:opacity-100"
            />
          ) : null}
        </div>

        {/* Badges */}
        <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNew ? (
            <span className="cut text-[0.5625rem] tracking-[0.2em] uppercase">
              {locale === "fa" ? "جدید" : "New"}
            </span>
          ) : null}
          {discount ? (
            <span className="bg-content px-2 py-1 text-[0.5625rem] tracking-[0.2em] text-surface uppercase nums">
              −{formatPercent(discount, locale)}
            </span>
          ) : null}
          {!product.inStock ? (
            <span className="bg-surface px-2 py-1 text-[0.5625rem] tracking-[0.2em] text-content-muted uppercase">
              {dict.product.soldOut}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="pointer-events-none absolute end-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100 max-md:pointer-events-auto max-md:opacity-100">
        <div className="pointer-events-auto">
          <WishlistButton
            productId={product.id}
            active={inWishlist}
            dict={dict}
            locale={locale}
            variant="floating"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-4">
        <p className="text-[0.625rem] tracking-[0.18em] text-content-faint uppercase">
          {product.collectionName ?? product.categoryName}
        </p>

        <h3 className="text-[0.95rem] leading-snug font-medium">
          <Link
            href={`/${locale}/product/${product.slug}`}
            className="transition-colors duration-300 hover:text-accent"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-1 flex items-baseline gap-2 nums">
          <span className="text-[0.9rem]">
            {formatPrice(product.price, locale)}
          </span>
          {product.compareAtPrice ? (
            <span className="text-xs text-content-faint line-through">
              {formatPrice(product.compareAtPrice, locale)}
            </span>
          ) : null}
        </div>

        {product.colors.length > 1 ? (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color}
                className="h-2.5 w-2.5 rounded-full ring-1 ring-line"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ProductGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-x-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
