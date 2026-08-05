import type { Metadata } from "next";
import { Heart } from "lucide-react";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toCard } from "@/lib/queries";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { MoveToCartButton } from "@/components/commerce/move-to-cart-button";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).wishlist.title };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const session = await getSession();

  // Middleware already redirects anonymous visitors, but guard anyway.
  if (!session) {
    return (
      <EmptyState
        title={dict.wishlist.loginNeeded}
        body={dict.wishlist.emptyBody}
        cta={{ href: `/${locale}/login`, label: dict.auth.login }}
      />
    );
  }

  const rows = await prisma.wishlistItem.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 2 },
          category: true,
          collection: true,
          variants: true,
        },
      },
    },
  });

  const products = rows
    .filter((row) => row.product.published)
    .map((row) => toCard(row.product, locale));

  if (!products.length) {
    return (
      <EmptyState
        title={dict.wishlist.empty}
        body={dict.wishlist.emptyBody}
        cta={{ href: `/${locale}/shop`, label: dict.nav.shop }}
      />
    );
  }

  return (
    <div className="container-x py-14 md:py-20">
      <header className="border-b border-line pb-8">
        <h1 className="text-hero font-medium">{dict.wishlist.title}</h1>
        <p className="mt-3 text-content-muted">{dict.wishlist.lead}</p>
      </header>

      <ProductGrid className="mt-12">
        {products.map((product, index) => (
          <Reveal key={product.id} delay={(index % 4) * 80}>
            <div className="flex h-full flex-col">
              <ProductCard
                product={product}
                locale={locale}
                dict={dict}
                inWishlist
                priority={index < 4}
              />
              <MoveToCartButton
                productId={product.id}
                locale={locale}
                label={dict.wishlist.moveToCart}
                disabled={!product.inStock}
                disabledLabel={dict.product.outOfStock}
              />
            </div>
          </Reveal>
        ))}
      </ProductGrid>
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="container-x flex min-h-[60svh] flex-col items-center justify-center gap-6 py-24 text-center">
      <Heart size={36} strokeWidth={1} className="text-content-faint" />
      <h1 className="text-title font-medium">{title}</h1>
      <p className="max-w-sm text-content-muted">{body}</p>
      <ButtonLink href={cta.href} className="mt-2">
        {cta.label}
      </ButtonLink>
    </div>
  );
}
