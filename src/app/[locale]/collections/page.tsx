import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { count, getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getCollections } from "@/lib/queries";
import { Reveal } from "@/components/ui/reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return { title: dict.collections.title, description: dict.collections.lead };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const collections = await getCollections(locale);

  return (
    <div className="container-x">
      <header className="border-b border-line py-14 md:py-20">
        <p className="eyebrow text-content-muted">{dict.brand.latin}</p>
        <h1 className="mt-4 text-hero font-medium">{dict.collections.title}</h1>
        <p className="mt-4 max-w-xl text-content-muted">
          {dict.collections.lead}
        </p>
      </header>

      <div className="flex flex-col">
        {collections.map((collection, index) => (
          <Reveal key={collection.slug}>
            <Link
              href={`/${locale}/collections/${collection.slug}`}
              className="group grid items-center gap-8 border-b border-line py-12 md:grid-cols-2 md:gap-16 md:py-16"
            >
              <div
                className={
                  index % 2 === 0
                    ? "relative aspect-4/3 overflow-hidden bg-surface-2"
                    : "relative aspect-4/3 overflow-hidden bg-surface-2 md:order-2"
                }
              >
                {collection.cover ? (
                  <Image
                    src={collection.cover}
                    alt={collection.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-1000 ease-[var(--ease-brand)] group-hover:scale-105"
                  />
                ) : null}
              </div>

              <div className={index % 2 === 0 ? "" : "md:order-1"}>
                <p className="eyebrow text-content-faint">
                  {collection.season} {collection.year} ·{" "}
                  <span className="nums">
                    {count(dict.collections.pieces, collection.count, locale)}
                  </span>
                </p>
                <h2 className="mt-4 text-title font-medium transition-colors duration-300 group-hover:text-accent">
                  {collection.name}
                </h2>
                {collection.tagline ? (
                  <p className="mt-2 text-content-muted">{collection.tagline}</p>
                ) : null}
                {collection.story ? (
                  <p className="mt-5 line-clamp-4 max-w-prose leading-relaxed text-content-muted">
                    {collection.story}
                  </p>
                ) : null}
                <span className="mt-7 inline-flex items-center gap-2 eyebrow">
                  {dict.collections.viewCollection}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 ease-[var(--ease-brand)] group-hover:translate-x-1.5 rtl:rotate-180 rtl:group-hover:-translate-x-1.5"
                  />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
