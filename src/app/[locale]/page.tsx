import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Package, Repeat, Shield, Truck } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/section";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { count, getDictionary } from "@/i18n";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import {
  getCategories,
  getFeaturedCollections,
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/queries";
import { getWishlistProductIds } from "@/lib/wishlist";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const [collections, newArrivals, featured, categories, wishlist] =
    await Promise.all([
      getFeaturedCollections(locale, 3),
      getNewArrivals(locale, 8),
      getFeaturedProducts(locale, 4),
      getCategories(locale),
      getWishlistProductIds(),
    ]);

  const p = (path: string) => `/${locale}${path}`;
  const heroCollection = collections[0];

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative flex min-h-[calc(100svh-var(--spacing-header))] items-end overflow-hidden bg-ink">
        <Image
          src="/media/editorial/hero.svg"
          alt=""
          fill
          priority
          className="animate-fade object-cover opacity-90"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10"
          aria-hidden
        />

        <div className="container-x relative w-full pb-16 md:pb-24">
          <div className="max-w-4xl">
            <p className="animate-fade-up eyebrow text-paper/60">
              {dict.home.heroEyebrow}
              {heroCollection ? ` — ${heroCollection.name}` : null}
            </p>

            <h1
              className="mt-6 animate-fade-up text-display font-medium whitespace-pre-line text-paper"
              style={{ animationDelay: "120ms" }}
            >
              {dict.home.heroTitle}
            </h1>

            <p
              className="mt-8 max-w-xl animate-fade-up text-lg leading-relaxed text-paper/70"
              style={{ animationDelay: "240ms" }}
            >
              {dict.home.heroLead}
            </p>

            <div
              className="mt-10 flex animate-fade-up flex-wrap items-center gap-4"
              style={{ animationDelay: "340ms" }}
            >
              <ButtonLink
                href={
                  heroCollection
                    ? p(`/collections/${heroCollection.slug}`)
                    : p("/collections")
                }
                variant="accent"
                size="lg"
              >
                {dict.home.heroCta}
                <ArrowRight size={15} className="rtl:rotate-180" />
              </ButtonLink>
              <ButtonLink
                href={p("/shop")}
                size="lg"
                className="border border-paper/30 bg-transparent text-paper hover:bg-paper hover:text-ink"
              >
                {dict.home.heroCtaAlt}
              </ButtonLink>
            </div>
          </div>

          <div
            className="mt-16 flex animate-fade items-center gap-3 text-paper/40"
            style={{ animationDelay: "600ms" }}
          >
            <ArrowDown size={14} />
            <span className="eyebrow">{dict.home.scroll}</span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- intro */}
      <Section className="border-b border-line">
        <div className="container-x">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Reveal>
              <Eyebrow>{dict.brand.latin}</Eyebrow>
              <h2 className="mt-5 text-hero font-medium text-balance">
                {dict.home.introTitle}
              </h2>
            </Reveal>
            <Reveal delay={120} className="flex flex-col justify-end gap-6">
              <p className="text-lg leading-relaxed text-content-muted">
                {dict.home.introBody}
              </p>
              <Link
                href={p("/about")}
                className="group inline-flex w-fit items-center gap-2 eyebrow transition-colors hover:text-accent"
              >
                {dict.home.brandCta}
                <span
                  aria-hidden
                  className="h-px w-6 bg-current transition-all duration-300 group-hover:w-12"
                />
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------- featured collections */}
      <Section>
        <div className="container-x">
          <SectionHeader
            eyebrow={dict.brand.since}
            title={dict.home.featuredCollections}
            lead={dict.home.featuredCollectionsLead}
            action={{ href: p("/collections"), label: dict.common.seeAll }}
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {collections.map((collection, index) => (
              <Reveal key={collection.slug} delay={index * 110}>
                <Link
                  href={p(`/collections/${collection.slug}`)}
                  className="group block"
                >
                  <div className="relative aspect-3/4 overflow-hidden bg-surface-2">
                    {collection.cover ? (
                      <Image
                        src={collection.cover}
                        alt={collection.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover transition-transform duration-1000 ease-[var(--ease-brand)] group-hover:scale-105"
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="eyebrow text-paper/60">
                        {collection.season} {collection.year}
                      </p>
                      <h3 className="mt-2 text-2xl font-medium text-paper">
                        {collection.name}
                      </h3>
                      <p className="mt-1 text-sm text-paper/70">
                        {collection.tagline}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-content-faint nums">
                    {count(dict.collections.pieces, collection.count, locale)}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------- new arrivals */}
      <Section className="border-t border-line">
        <div className="container-x">
          <SectionHeader
            eyebrow={dict.home.newArrivalsLead}
            title={dict.home.newArrivals}
            action={{ href: p("/shop"), label: dict.common.seeAll }}
          />

          <ProductGrid className="mt-14">
            {newArrivals.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 90}>
                <ProductCard
                  product={product}
                  locale={locale}
                  dict={dict}
                  inWishlist={wishlist.has(product.id)}
                />
              </Reveal>
            ))}
          </ProductGrid>
        </div>
      </Section>

      {/* ------------------------------------------------------- categories */}
      <Section className="border-t border-line bg-surface-2">
        <div className="container-x">
          <SectionHeader
            eyebrow={dict.home.categoryLead}
            title={dict.home.shopByCategory}
          />

          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {categories.map((category, index) => (
              <Reveal key={category.slug} delay={(index % 4) * 80}>
                <Link
                  href={`${p("/shop")}?category=${category.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-4/5 overflow-hidden bg-surface-3">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition-transform duration-1000 ease-[var(--ease-brand)] group-hover:scale-105"
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 bg-ink/25 transition-colors duration-500 group-hover:bg-ink/10"
                      aria-hidden
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <h3 className="font-medium transition-colors group-hover:text-accent">
                      {category.name}
                    </h3>
                    <span className="text-xs text-content-faint nums">
                      {formatNumber(category.count, locale)}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------ brand story */}
      <Section className="border-t border-line">
        <div className="container-x">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal className="order-2 lg:order-1">
              <Eyebrow>{dict.brand.latin}</Eyebrow>
              <h2 className="mt-5 text-hero font-medium text-balance">
                {dict.home.brandTitle}
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-content-muted">
                {dict.home.brandBody}
              </p>
              <ButtonLink href={p("/about")} variant="outline" className="mt-8">
                {dict.home.brandCta}
              </ButtonLink>
            </Reveal>

            <Reveal delay={120} className="order-1 lg:order-2">
              <div className="relative aspect-4/3 overflow-hidden bg-surface-2">
                <Image
                  src="/media/editorial/brand-story.svg"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- values */}
      <Section className="border-t border-line py-16 md:py-20">
        <div className="container-x">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: dict.home.valueQuality, body: dict.home.valueQualityBody },
              { icon: Package, title: dict.home.valueLimited, body: dict.home.valueLimitedBody },
              { icon: Truck, title: dict.home.valueShipping, body: dict.home.valueShippingBody },
              { icon: Repeat, title: dict.home.valueReturn, body: dict.home.valueReturnBody },
            ].map((value, index) => (
              <Reveal key={value.title} delay={index * 80} className="flex flex-col gap-3">
                <value.icon size={22} strokeWidth={1.25} className="text-accent" />
                <h3 className="font-medium">{value.title}</h3>
                <p className="text-sm leading-relaxed text-content-muted">
                  {value.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------- selection */}
      {featured.length ? (
        <Section className="border-t border-line bg-surface-2">
          <div className="container-x">
            <SectionHeader
              eyebrow={dict.brand.tagline}
              title={dict.home.featuredCollectionsLead}
              action={{ href: p("/shop"), label: dict.common.seeAll }}
            />
            <ProductGrid className="mt-14">
              {featured.map((product, index) => (
                <Reveal key={product.id} delay={(index % 4) * 90}>
                  <ProductCard
                    product={product}
                    locale={locale}
                    dict={dict}
                    inWishlist={wishlist.has(product.id)}
                  />
                </Reveal>
              ))}
            </ProductGrid>
          </div>
        </Section>
      ) : null}
    </>
  );
}
