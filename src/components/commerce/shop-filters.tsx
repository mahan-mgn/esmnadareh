"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type Facets = {
  sizes: string[];
  colors: { code: string; name: string }[];
  minPrice: number;
  maxPrice: number;
  categories: { slug: string; name: string; count: number }[];
  collections: { slug: string; name: string }[];
};

export function ShopFilterPanel({
  locale,
  dict,
  facets,
}: {
  locale: Locale;
  dict: Dictionary;
  facets: Facets;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: filters live behind a button so the grid owns the screen */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-fit items-center gap-2 border border-line px-4 eyebrow lg:hidden"
      >
        <SlidersHorizontal size={15} strokeWidth={1.5} />
        {dict.shop.filters}
      </button>

      <aside className="hidden lg:block">
        <FilterBody locale={locale} dict={dict} facets={facets} />
      </aside>

      <div
        className={cn(
          // `h-dvh`, not `inset-0`: a fixed panel measured against the large
          // viewport hides its own footer behind mobile browser chrome.
          "fixed inset-x-0 top-0 z-90 h-dvh lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        // Keeps the closed panel's controls out of the tab order.
        inert={!open}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ink/70 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal={open}
          aria-label={dict.shop.filters}
          className={cn(
            "absolute inset-y-0 end-0 flex w-[88%] max-w-sm flex-col bg-surface transition-transform duration-500 ease-[var(--ease-brand)]",
            open
              ? "translate-x-0"
              : "ltr:translate-x-full rtl:-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line py-4 pad-x-safe">
            <h2 className="eyebrow">{dict.shop.filters}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.nav.close}
              className="-me-2 flex h-11 w-11 items-center justify-center"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain py-6 pad-x-safe pb-safe [--pb-safe:1.5rem]">
            <FilterBody
              locale={locale}
              dict={dict}
              facets={facets}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function FilterBody({
  locale,
  dict,
  facets,
  onNavigate,
}: {
  locale: Locale;
  dict: Dictionary;
  facets: Facets;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();

  /** Rewrites one query key and always resets pagination. */
  const apply = useCallback(
    (mutate: (search: URLSearchParams) => void) => {
      const search = new URLSearchParams(params.toString());
      mutate(search);
      search.delete("page");
      const qs = search.toString();
      router.push(`/${locale}/shop${qs ? `?${qs}` : ""}`, { scroll: false });
      onNavigate?.();
    },
    [locale, onNavigate, params, router],
  );

  const toggleMulti = (key: string, value: string) =>
    apply((search) => {
      const current = search.getAll(key);
      search.delete(key);
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      for (const item of next) search.append(key, item);
    });

  const setSingle = (key: string, value: string | null) =>
    apply((search) => {
      if (value === null || search.get(key) === value) search.delete(key);
      else search.set(key, value);
    });

  const activeSizes = params.getAll("size");
  const activeColors = params.getAll("color");
  const activeCategory = params.get("category");
  const activeCollection = params.get("collection");
  const inStockOnly = params.get("stock") === "1";
  const hasFilters = Array.from(params.keys()).some((key) =>
    ["size", "color", "category", "collection", "stock", "min", "max"].includes(
      key,
    ),
  );

  return (
    <div className="flex flex-col gap-9">
      {hasFilters ? (
        <button
          type="button"
          onClick={() =>
            apply((search) => {
              for (const key of [
                "size",
                "color",
                "category",
                "collection",
                "stock",
                "min",
                "max",
              ]) {
                search.delete(key);
              }
            })
          }
          className="inline-flex w-fit items-center gap-2 text-xs text-accent transition-opacity hover:opacity-70"
        >
          <X size={13} />
          {dict.shop.clearFilters}
        </button>
      ) : null}

      <Group title={dict.shop.category}>
        <ul className="flex flex-col gap-1.5">
          {facets.categories.map((category) => (
            <li key={category.slug}>
              <button
                type="button"
                onClick={() => setSingle("category", category.slug)}
                className={cn(
                  // Roomy enough to hit with a thumb; back to a tight list
                  // once it is a sidebar being driven by a cursor.
                  "flex w-full items-baseline justify-between gap-2 py-2 text-start text-sm transition-colors lg:py-0.5",
                  activeCategory === category.slug
                    ? "text-accent"
                    : "text-content-muted hover:text-content",
                )}
              >
                <span>{category.name}</span>
                <span className="text-xs text-content-faint nums">
                  {category.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group title={dict.shop.collection}>
        <ul className="flex flex-col gap-1.5">
          {facets.collections.map((collection) => (
            <li key={collection.slug}>
              <button
                type="button"
                onClick={() => setSingle("collection", collection.slug)}
                className={cn(
                  "py-2 text-start text-sm transition-colors lg:py-0.5",
                  activeCollection === collection.slug
                    ? "text-accent"
                    : "text-content-muted hover:text-content",
                )}
              >
                {collection.name}
              </button>
            </li>
          ))}
        </ul>
      </Group>

      {facets.sizes.length ? (
        <Group title={dict.shop.size}>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleMulti("size", size)}
                aria-pressed={activeSizes.includes(size)}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center border px-3 text-xs transition-all duration-300 lg:min-h-9 nums",
                  activeSizes.includes(size)
                    ? "border-line-strong bg-content text-surface"
                    : "border-line text-content-muted hover:border-line-strong hover:text-content",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </Group>
      ) : null}

      {facets.colors.length ? (
        <Group title={dict.shop.color}>
          {/*
            The dot stays 28px; the *button* grows to 44px on touch devices via
            `touch-target`. Enlarging the dot itself would have changed the
            design, and a 28px tap target is a coin-toss with a thumb.
          */}
          <div className="flex flex-wrap gap-1 sm:gap-2.5">
            {facets.colors.map((color) => {
              const value = color.code.replace("#", "");
              const active = activeColors.includes(value);
              return (
                <button
                  key={color.code}
                  type="button"
                  title={color.name}
                  aria-label={color.name}
                  aria-pressed={active}
                  onClick={() => toggleMulti("color", value)}
                  className="touch-target flex items-center justify-center"
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full transition-all duration-300",
                      active
                        ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                        : "ring-1 ring-line hover:ring-content-faint",
                    )}
                    style={{ backgroundColor: color.code }}
                  />
                </button>
              );
            })}
          </div>
        </Group>
      ) : null}

      <Group title={dict.shop.priceRange}>
        <p className="text-xs text-content-faint nums">
          {formatPrice(facets.minPrice, locale)} —{" "}
          {formatPrice(facets.maxPrice, locale)}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            defaultValue={params.get("min") ?? ""}
            placeholder={dict.common.from}
            onBlur={(event) =>
              setSingle("min", event.currentTarget.value || null)
            }
            className="w-full min-w-0 border-b border-line bg-transparent py-2 text-base outline-none focus:border-accent sm:text-sm nums"
          />
          <span className="text-content-faint">—</span>
          <input
            type="number"
            inputMode="numeric"
            defaultValue={params.get("max") ?? ""}
            placeholder={dict.common.to}
            onBlur={(event) =>
              setSingle("max", event.currentTarget.value || null)
            }
            className="w-full min-w-0 border-b border-line bg-transparent py-2 text-base outline-none focus:border-accent sm:text-sm nums"
          />
        </div>
      </Group>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-content-muted lg:min-h-0">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={() => setSingle("stock", inStockOnly ? null : "1")}
          className="h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        {dict.shop.inStockOnly}
      </label>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 eyebrow text-content-faint">{title}</h3>
      {children}
    </div>
  );
}
