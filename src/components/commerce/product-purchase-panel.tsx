"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, ShoppingBag } from "lucide-react";

import { addToCart } from "@/actions/cart";
import { idleState } from "@/actions/types";
import { useToast } from "@/components/ui/toast";
import { WishlistButton } from "./wishlist-button";
import { cn, compareSizes, unique } from "@/lib/utils";
import {
  discountPercent,
  formatNumber,
  formatPercent,
  formatPrice,
} from "@/lib/format";
import { fill, type Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Variant = {
  id: string;
  size: string | null;
  colorName: string | null;
  colorCode: string | null;
  stock: number;
  priceDelta: number;
};

export type PurchaseProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  subtitle: string | null;
  description: string;
  price: number;
  compareAtPrice: number | null;
  collection: { slug: string; name: string } | null;
  images: { url: string; alt: string }[];
  variants: Variant[];
  specs: { label: string; value: string }[];
};

const LOW_STOCK_THRESHOLD = 4;

export function ProductPurchasePanel({
  locale,
  dict,
  product,
  inWishlist,
}: {
  locale: Locale;
  dict: Dictionary;
  product: PurchaseProduct;
  inWishlist: boolean;
}) {
  const sizes = useMemo(
    () =>
      unique(
        product.variants
          .map((variant) => variant.size)
          .filter((size): size is string => Boolean(size)),
      ).sort(compareSizes),
    [product.variants],
  );

  const colors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const variant of product.variants) {
      if (variant.colorCode && !seen.has(variant.colorCode)) {
        seen.set(variant.colorCode, variant.colorName ?? variant.colorCode);
      }
    }
    return Array.from(seen, ([code, name]) => ({ code, name }));
  }, [product.variants]);

  // Preselect the first combination that is actually buyable.
  const firstAvailable = useMemo(
    () =>
      product.variants.find((variant) => variant.stock > 0) ??
      product.variants[0],
    [product.variants],
  );

  const [size, setSize] = useState<string | null>(firstAvailable?.size ?? null);
  const [color, setColor] = useState<string | null>(
    firstAvailable?.colorCode ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const selected = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          (sizes.length ? variant.size === size : true) &&
          (colors.length ? variant.colorCode === color : true),
      ) ?? null,
    [color, colors.length, product.variants, size, sizes.length],
  );

  const stockForSize = (candidate: string) =>
    product.variants
      .filter(
        (variant) =>
          variant.size === candidate &&
          (colors.length ? variant.colorCode === color : true),
      )
      .reduce((sum, variant) => sum + variant.stock, 0);

  const stockForColor = (candidate: string) =>
    product.variants
      .filter((variant) => variant.colorCode === candidate)
      .reduce((sum, variant) => sum + variant.stock, 0);

  const unitPrice = product.price + (selected?.priceDelta ?? 0);
  const discount = discountPercent(unitPrice, product.compareAtPrice);
  const available = (selected?.stock ?? 0) > 0;

  // Switching to a lower-stock variant must not leave an unbuyable quantity.
  const maxQuantity = selected ? Math.max(1, Math.min(20, selected.stock)) : 1;
  if (quantity > maxQuantity) setQuantity(maxQuantity);

  const [state, formAction, isAdding] = useActionState(addToCart, idleState);
  const toast = useToast();

  useEffect(() => {
    if (state.status !== "idle" && state.message) {
      toast(state.message, state.status === "error" ? "error" : "success");
    }
  }, [state, toast]);

  return (
    <div className="grid gap-10 pb-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:gap-24">
      {/* ------------------------------------------------------- gallery */}
      <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-5">
        {/* On phones the thumbnails are a swipeable strip; from `md` they
            become the vertical rail beside the main image. */}
        {product.images.length > 1 ? (
          <div
            className="no-scrollbar scroll-bleed flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain md:w-20 md:snap-none md:flex-col md:overflow-visible"
            role="tablist"
            aria-label={dict.product.gallery}
          >
            {product.images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                role="tab"
                aria-selected={index === activeImage}
                aria-label={fill(dict.product.image, { n: index + 1 })}
                onClick={() => setActiveImage(index)}
                className={cn(
                  "relative aspect-4/5 w-16 shrink-0 snap-start overflow-hidden bg-surface-2 transition-all duration-300 md:w-full",
                  index === activeImage
                    ? "opacity-100 ring-1 ring-content"
                    : "opacity-55 hover:opacity-100",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative aspect-4/5 flex-1 overflow-hidden bg-surface-2">
          {product.images[activeImage] ? (
            <Image
              key={product.images[activeImage].url}
              src={product.images[activeImage].url}
              alt={product.images[activeImage].alt}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="animate-fade object-cover"
            />
          ) : null}
        </div>
      </div>

      {/* ---------------------------------------------------------- buy box */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        {product.collection ? (
          <Link
            href={`/${locale}/collections/${product.collection.slug}`}
            className="eyebrow text-accent transition-opacity hover:opacity-70"
          >
            {product.collection.name}
          </Link>
        ) : null}

        <h1 className="mt-3 text-title font-medium text-balance">
          {product.name}
        </h1>
        {product.subtitle ? (
          <p className="mt-2 text-content-muted">{product.subtitle}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-baseline gap-3 nums">
          <span className="text-2xl">{formatPrice(unitPrice, locale)}</span>
          {product.compareAtPrice ? (
            <span className="text-content-faint line-through">
              {formatPrice(product.compareAtPrice, locale)}
            </span>
          ) : null}
          {discount ? (
            <span className="cut text-[0.625rem] tracking-[0.18em] uppercase">
              {fill(dict.product.save, { p: formatPercent(discount, locale) })}
            </span>
          ) : null}
        </div>

        {/* The wishlist control is its own form, so it must live *outside*
            this one — nested forms are invalid HTML and the browser would
            hand its clicks to the add-to-cart form instead. */}
        <form
          id="purchase-form"
          action={formAction}
          className="mt-9 flex flex-col gap-7"
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="variantId" value={selected?.id ?? ""} />
          <input type="hidden" name="quantity" value={quantity} />
          <input type="hidden" name="locale" value={locale} />

          {colors.length ? (
            <fieldset>
              <legend className="mb-3 flex items-baseline gap-2 eyebrow text-content-faint">
                {dict.shop.color}
                {color ? (
                  <span className="tracking-normal normal-case text-content-muted">
                    —{" "}
                    {colors.find((item) => item.code === color)?.name ?? color}
                  </span>
                ) : null}
              </legend>
              {/* Swatch stays 36px; the button around it reaches 44px on
                  touch devices without changing the drawn size. */}
              <div className="flex flex-wrap gap-1 sm:gap-3">
                {colors.map((item) => {
                  const soldOut = stockForColor(item.code) === 0;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setColor(item.code)}
                      aria-pressed={color === item.code}
                      aria-label={item.name}
                      title={item.name}
                      className="touch-target flex items-center justify-center"
                    >
                      <span
                        className={cn(
                          "relative h-9 w-9 rounded-full transition-all duration-300",
                          color === item.code
                            ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                            : "ring-1 ring-line hover:ring-content-faint",
                          soldOut && "opacity-40",
                        )}
                        style={{ backgroundColor: item.code }}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {sizes.length ? (
            <fieldset>
              <legend className="mb-3 flex w-full items-baseline justify-between eyebrow text-content-faint">
                {dict.shop.size}
                <span className="tracking-normal normal-case text-content-faint">
                  {dict.product.sizeGuide}
                </span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((item) => {
                  const soldOut = stockForSize(item) === 0;
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setSize(item)}
                      aria-pressed={size === item}
                      className={cn(
                        "min-w-14 border px-4 py-3 text-sm transition-all duration-300 nums",
                        size === item
                          ? "border-line-strong bg-content text-surface"
                          : "border-line text-content-muted hover:border-line-strong hover:text-content",
                        soldOut &&
                          "cursor-not-allowed line-through opacity-40 hover:border-line",
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {/* quantity + stock notice */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center border border-line">
              <button
                type="button"
                onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                disabled={quantity <= 1}
                className="flex h-12 w-12 items-center justify-center text-content-muted transition-colors hover:text-content disabled:opacity-30"
                aria-label="-"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center text-sm nums">
                {formatNumber(quantity, locale)}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((n) => Math.min(maxQuantity, n + 1))}
                disabled={!available || quantity >= maxQuantity}
                className="flex h-12 w-12 items-center justify-center text-content-muted transition-colors hover:text-content disabled:opacity-30"
                aria-label="+"
              >
                <Plus size={15} />
              </button>
            </div>

            {selected && selected.stock > 0 && selected.stock <= LOW_STOCK_THRESHOLD ? (
              <p className="text-xs text-accent nums">
                {fill(dict.product.lowStock, { n: formatNumber(selected.stock, locale) })}
              </p>
            ) : null}
          </div>

        </form>

        <div className="mt-7 flex gap-3">
          <AddButton
            label={dict.product.addToCart}
            pendingLabel={dict.product.adding}
            soldOutLabel={dict.product.outOfStock}
            available={available}
            pending={isAdding}
          />
          <WishlistButton
            productId={product.id}
            active={inWishlist}
            dict={dict}
            locale={locale}
          />
        </div>

        {/* ------------------------------------------------------ details */}
        <div className="mt-12 divide-y divide-[var(--line)] border-y border-line">
          <Accordion title={dict.product.description} defaultOpen>
            <p className="leading-relaxed text-content-muted">
              {product.description}
            </p>
          </Accordion>

          {product.specs.length ? (
            <Accordion title={dict.product.specs}>
              <dl className="flex flex-col gap-3">
                {product.specs.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 text-sm"
                  >
                    <dt className="text-content-faint">{row.label}</dt>
                    <dd className="text-end text-content-muted">{row.value}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-6 text-sm">
                  <dt className="text-content-faint">{dict.product.sku}</dt>
                  <dd className="text-content-muted nums">{product.sku}</dd>
                </div>
              </dl>
            </Accordion>
          ) : null}

          <Accordion title={dict.product.shippingReturns}>
            <p className="leading-relaxed text-content-muted">
              {dict.product.shippingReturnsBody}
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function AddButton({
  label,
  pendingLabel,
  soldOutLabel,
  available,
  pending,
}: {
  label: string;
  pendingLabel: string;
  soldOutLabel: string;
  available: boolean;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      // Lives outside the form it submits, so it points back by id.
      form="purchase-form"
      disabled={!available || pending}
      className={cn(
        "flex h-12 flex-1 items-center justify-center gap-2 eyebrow transition-all duration-300 ease-[var(--ease-brand)]",
        "bg-content text-surface hover:bg-accent hover:text-on-accent active:scale-[0.99]",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <ShoppingBag size={15} strokeWidth={1.5} />
      {!available ? soldOutLabel : pending ? pendingLabel : label}
    </button>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-start eyebrow transition-colors hover:text-accent"
      >
        {title}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={cn(
            "shrink-0 transition-transform duration-300 ease-[var(--ease-brand)]",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-400 ease-[var(--ease-brand)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-6 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
