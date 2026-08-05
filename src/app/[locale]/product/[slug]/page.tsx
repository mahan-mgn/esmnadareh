import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pick } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getSession } from "@/lib/auth";
import {
  getOwnReview,
  getProductReviews,
  getRatingSummary,
} from "@/lib/reviews";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { ProductPurchasePanel } from "@/components/commerce/product-purchase-panel";
import { ProductReviews } from "@/components/commerce/product-reviews";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeader } from "@/components/ui/section";

type SpecRow = {
  labelFa: string;
  labelEn: string;
  valueFa: string;
  valueEn: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "404" };

  const name = pick(locale, product.nameFa, product.nameEn);
  const description = pick(locale, product.descFa, product.descEn);

  return {
    title: name,
    description: description.slice(0, 160),
    openGraph: {
      title: name,
      description: description.slice(0, 160),
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = getDictionary(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, wishlist, session, summary, reviews] = await Promise.all([
    getRelatedProducts(locale, product, 4),
    getWishlistProductIds(),
    getSession(),
    getRatingSummary(product.id),
    getProductReviews(product.id),
  ]);

  // Their own review comes back whether or not it has been approved, so the
  // form can say "waiting" instead of looking as though nothing was sent.
  const ownReview = session
    ? await getOwnReview(product.id, session.sub)
    : null;

  const name = pick(locale, product.nameFa, product.nameEn);
  const subtitle = pick(locale, product.subtitleFa, product.subtitleEn);
  const description = pick(locale, product.descFa, product.descEn);
  const specs = (product.specs as unknown as SpecRow[]) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description.slice(0, 300),
    sku: product.sku,
    image: product.images.map((image) => image.url),
    brand: { "@type": "Brand", name: "Esm Nadareh" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "IRR",
      availability: product.variants.some((variant) => variant.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    // Only published once there is something real to publish — Google treats a
    // rating with no reviews behind it as structured-data spam.
    ...(summary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(summary.average.toFixed(1)),
            reviewCount: summary.count,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-x">
        {/* ----------------------------------------------------- breadcrumb */}
        {/* Wraps rather than overflowing: a long Farsi product name on a
            narrow screen used to push the row past the viewport. */}
        <nav
          className="flex flex-wrap items-center gap-x-2 gap-y-1 py-6 text-xs text-content-faint"
          aria-label="breadcrumb"
        >
          <Link href={`/${locale}`} className="transition-colors hover:text-content">
            {dict.nav.home}
          </Link>
          <ChevronLeft size={13} className="shrink-0 ltr:rotate-180" />
          <Link
            href={`/${locale}/shop?category=${product.category.slug}`}
            className="transition-colors hover:text-content"
          >
            {pick(locale, product.category.nameFa, product.category.nameEn)}
          </Link>
          <ChevronLeft size={13} className="shrink-0 ltr:rotate-180" />
          <span className="min-w-0 text-content-muted">{name}</span>
        </nav>

        {/* ------------------------------------------------------ main pane */}
        <ProductPurchasePanel
          locale={locale}
          dict={dict}
          product={{
            id: product.id,
            slug: product.slug,
            sku: product.sku,
            name,
            subtitle,
            description,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            collection: product.collection
              ? {
                  slug: product.collection.slug,
                  name: pick(
                    locale,
                    product.collection.nameFa,
                    product.collection.nameEn,
                  ),
                }
              : null,
            images: product.images.map((image) => ({
              url: image.url,
              alt: pick(locale, image.altFa, image.altEn) ?? name,
            })),
            variants: product.variants.map((variant) => ({
              id: variant.id,
              size: variant.size,
              colorName: pick(locale, variant.colorFa, variant.colorEn),
              colorCode: variant.colorCode,
              stock: variant.stock,
              priceDelta: variant.priceDelta,
            })),
            specs: specs.map((row) => ({
              label: pick(locale, row.labelFa, row.labelEn),
              value: pick(locale, row.valueFa, row.valueEn),
            })),
          }}
          inWishlist={wishlist.has(product.id)}
        />
      </div>

      {/* ------------------------------------------------------- reviews */}
      <Section className="mt-8 border-t border-line">
        <div className="container-x">
          <SectionHeader title={dict.review.title} />
          <div className="mt-12">
            <ProductReviews
              locale={locale}
              dict={dict}
              productId={product.id}
              summary={summary}
              reviews={reviews}
              isSignedIn={Boolean(session)}
              own={ownReview}
            />
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------- related */}
      {related.length ? (
        <Section className="mt-8 border-t border-line">
          <div className="container-x">
            <SectionHeader title={dict.product.related} />
            <ProductGrid className="mt-12">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={(index % 4) * 80}>
                  <ProductCard
                    product={item}
                    locale={locale}
                    dict={dict}
                    inWishlist={wishlist.has(item.id)}
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
