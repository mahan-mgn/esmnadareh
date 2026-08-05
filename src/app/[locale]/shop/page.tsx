import type { Metadata } from "next";
import Link from "next/link";
import { fill, getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getShopFacets, getShopProducts, type ShopSort } from "@/lib/queries";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { ShopToolbar } from "@/components/commerce/shop-toolbar";
import { ShopFilterPanel } from "@/components/commerce/shop-filters";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";

const SORTS: ShopSort[] = ["newest", "price-asc", "price-desc", "name-asc"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function many(value: string | string[] | undefined) {
  if (!value) return [];
  return (Array.isArray(value) ? value : value.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * `?min=abc` must fall back to "no bound". Passing the resulting NaN into the
 * price filter matched nothing, so a typo in the URL emptied the whole shop.
 */
function positiveInt(value: string | string[] | undefined) {
  const raw = first(value);
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.floor(parsed);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return { title: dict.shop.title, description: dict.shop.lead };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const dict = getDictionary(locale);

  const sortParam = first(query.sort) as ShopSort | undefined;
  const filters = {
    q: first(query.q)?.trim() || undefined,
    category: first(query.category) || undefined,
    collection: first(query.collection) || undefined,
    minPrice: positiveInt(query.min),
    maxPrice: positiveInt(query.max),
    sizes: many(query.size),
    colors: many(query.color).map((color) =>
      color.startsWith("#") ? color : `#${color}`,
    ),
    inStock: first(query.stock) === "1",
    sort: sortParam && SORTS.includes(sortParam) ? sortParam : "newest",
    page: positiveInt(query.page) || 1,
  } as const;

  const [{ products, total, page, pageCount }, facets, wishlist] =
    await Promise.all([
      getShopProducts(locale, filters),
      getShopFacets(locale, {
        category: filters.category,
        collection: filters.collection,
      }),
      getWishlistProductIds(),
    ]);

  const activeCategory = facets.categories.find(
    (category) => category.slug === filters.category,
  );

  function pageHref(next: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key === "page" || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) {
        search.append(key, item);
      }
    }
    if (next > 1) search.set("page", String(next));
    const qs = search.toString();
    return `/${locale}/shop${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="container-x">
      {/* -------------------------------------------------------- masthead */}
      <header className="border-b border-line py-14 md:py-20">
        <p className="eyebrow text-content-muted">{dict.nav.shop}</p>
        <h1 className="mt-4 text-hero font-medium text-balance">
          {filters.q
            ? fill(dict.shop.searchFor, { q: filters.q })
            : (activeCategory?.name ?? dict.shop.title)}
        </h1>
        <p className="mt-4 max-w-xl text-content-muted">
          {activeCategory?.description ?? dict.shop.lead}
        </p>
      </header>

      <div className="grid gap-10 py-10 lg:grid-cols-[16rem_1fr] lg:gap-14 lg:py-14">
        {/* ------------------------------------------------------ filters */}
        <ShopFilterPanel locale={locale} dict={dict} facets={facets} />

        <div className="min-w-0">
          <ShopToolbar
            locale={locale}
            dict={dict}
            total={total}
            facets={facets}
          />

          {products.length ? (
            <>
              <ProductGrid className="mt-8">
                {products.map((product, index) => (
                  <Reveal key={product.id} delay={(index % 4) * 70}>
                    <ProductCard
                      product={product}
                      locale={locale}
                      dict={dict}
                      inWishlist={wishlist.has(product.id)}
                      priority={index < 4}
                      sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 45vw"
                    />
                  </Reveal>
                ))}
              </ProductGrid>

              {pageCount > 1 ? (
                <nav
                  // `flex-wrap`: a catalogue deep enough to need a dozen pages
                  // pushed the pager off the side of a phone.
                  className="mt-16 flex flex-wrap items-center justify-center gap-2"
                  aria-label="pagination"
                >
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                    (number) => (
                      <Link
                        key={number}
                        href={pageHref(number)}
                        aria-current={number === page ? "page" : undefined}
                        className={
                          number === page
                            ? "flex h-11 min-w-11 items-center justify-center bg-content px-3 text-sm text-surface sm:h-10 sm:min-w-10 nums"
                            : "flex h-11 min-w-11 items-center justify-center border border-line px-3 text-sm text-content-muted transition-colors hover:border-line-strong hover:text-content sm:h-10 sm:min-w-10 nums"
                        }
                      >
                        {number}
                      </Link>
                    ),
                  )}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-start gap-4 border border-line px-5 py-16 sm:px-8 sm:py-20">
              <h2 className="text-2xl font-medium">{dict.shop.emptyTitle}</h2>
              <p className="text-content-muted">{dict.shop.emptyBody}</p>
              <ButtonLink href={`/${locale}/shop`} variant="outline" size="sm">
                {dict.shop.clearFilters}
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
