import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { count, getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCollectionBySlug } from "@/lib/queries";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = await getCollectionBySlug(slug, locale);
  if (!collection) return { title: "404" };

  return {
    title: collection.name,
    description: collection.tagline ?? undefined,
    openGraph: {
      title: collection.name,
      images: collection.cover ? [collection.cover] : undefined,
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = getDictionary(locale);

  const [collection, wishlist] = await Promise.all([
    getCollectionBySlug(slug, locale),
    getWishlistProductIds(),
  ]);
  if (!collection) notFound();

  return (
    <>
      {/* -------------------------------------------------------- cover */}
      <header className="relative flex min-h-[62svh] items-end overflow-hidden bg-ink">
        {collection.cover ? (
          <Image
            src={collection.cover}
            alt=""
            fill
            priority
            className="animate-fade object-cover"
          />
        ) : null}
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent"
          aria-hidden
        />

        <div className="container-x relative w-full pb-14 md:pb-20">
          <p className="animate-fade-up eyebrow text-paper/60">
            {collection.season} {collection.year}
          </p>
          <h1
            className="mt-4 animate-fade-up text-hero font-medium text-paper text-balance"
            style={{ animationDelay: "100ms" }}
          >
            {collection.name}
          </h1>
          {collection.tagline ? (
            <p
              className="mt-4 max-w-xl animate-fade-up text-lg text-paper/70"
              style={{ animationDelay: "200ms" }}
            >
              {collection.tagline}
            </p>
          ) : null}
        </div>
      </header>

      <div className="container-x">
        {/* -------------------------------------------------------- story */}
        {collection.story ? (
          <Reveal className="grid gap-8 border-b border-line py-16 md:grid-cols-[auto_1fr] md:gap-20 md:py-20">
            <h2 className="eyebrow text-content-faint">
              {dict.collections.story}
            </h2>
            <p className="max-w-3xl text-lg leading-relaxed text-content-muted">
              {collection.story}
            </p>
          </Reveal>
        ) : null}

        {/* ------------------------------------------------------ products */}
        <section className="py-16 md:py-20">
          <div className="mb-12 flex items-baseline justify-between gap-4">
            <h2 className="text-title font-medium">{dict.nav.shop}</h2>
            <p className="text-sm text-content-faint nums">
              {count(dict.collections.pieces, collection.products.length, locale)}
            </p>
          </div>

          {collection.products.length ? (
            <ProductGrid>
              {collection.products.map((product, index) => (
                <Reveal key={product.id} delay={(index % 4) * 80}>
                  <ProductCard
                    product={product}
                    locale={locale}
                    dict={dict}
                    inWishlist={wishlist.has(product.id)}
                    priority={index < 4}
                  />
                </Reveal>
              ))}
            </ProductGrid>
          ) : (
            <div className="flex flex-col items-start gap-4 border border-line px-8 py-20">
              <p className="text-content-muted">{dict.collections.empty}</p>
              <ButtonLink href={`/${locale}/shop`} variant="outline" size="sm">
                {dict.nav.shop}
              </ButtonLink>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
