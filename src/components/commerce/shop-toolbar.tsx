"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { count, type Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { Facets } from "./shop-filters";

/** Result count on one side, sort control and active chips on the other. */
export function ShopToolbar({
  locale,
  dict,
  total,
  facets,
}: {
  locale: Locale;
  dict: Dictionary;
  total: number;
  facets: Facets;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const sortOptions: { value: string; label: string }[] = [
    { value: "newest", label: dict.shop.sortNewest },
    { value: "price-asc", label: dict.shop.sortPriceAsc },
    { value: "price-desc", label: dict.shop.sortPriceDesc },
    { value: "name-asc", label: dict.shop.sortNameAsc },
  ];

  function push(mutate: (search: URLSearchParams) => void) {
    const search = new URLSearchParams(params.toString());
    mutate(search);
    search.delete("page");
    const qs = search.toString();
    router.push(`/${locale}/shop${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const chips: { key: string; value: string; label: string }[] = [];

  const category = params.get("category");
  if (category) {
    chips.push({
      key: "category",
      value: category,
      label:
        facets.categories.find((item) => item.slug === category)?.name ??
        category,
    });
  }

  const collection = params.get("collection");
  if (collection) {
    chips.push({
      key: "collection",
      value: collection,
      label:
        facets.collections.find((item) => item.slug === collection)?.name ??
        collection,
    });
  }

  for (const size of params.getAll("size")) {
    chips.push({ key: "size", value: size, label: `${dict.shop.size}: ${size}` });
  }

  for (const color of params.getAll("color")) {
    const match = facets.colors.find(
      (item) => item.code.replace("#", "") === color,
    );
    chips.push({
      key: "color",
      value: color,
      label: match?.name ?? `#${color}`,
    });
  }

  const q = params.get("q");
  if (q) chips.push({ key: "q", value: q, label: `“${q}”` });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <p className="text-sm text-content-muted nums">
          {count(dict.shop.productsCount, total, locale)}
        </p>

        <label className="flex items-center gap-2 text-sm">
          <span className="eyebrow text-content-faint">{dict.shop.sort}</span>
          <select
            value={params.get("sort") ?? "newest"}
            onChange={(event) =>
              push((search) => {
                if (event.target.value === "newest") search.delete("sort");
                else search.set("sort", event.target.value);
              })
            }
            className="cursor-pointer border-b border-line bg-transparent py-1 text-sm outline-none focus:border-accent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() =>
                push((search) => {
                  const remaining = search
                    .getAll(chip.key)
                    .filter((item) => item !== chip.value);
                  search.delete(chip.key);
                  for (const item of remaining) search.append(chip.key, item);
                })
              }
              className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs text-content-muted transition-colors hover:border-line-strong hover:text-content"
            >
              {chip.label}
              <X size={12} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
