import type { Metadata } from "next";
import Image from "next/image";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow, Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return { title: dict.about.title, description: dict.about.lead };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const [collectionCount, productCount] = await Promise.all([
    prisma.collection.count({ where: { published: true } }),
    prisma.product.count({ where: { published: true } }),
  ]);

  const numbers = [
    { value: collectionCount, label: dict.about.n1 },
    { value: productCount, label: dict.about.n2 },
    { value: 31, label: dict.about.n3 },
    { value: 98, label: dict.about.n4, suffix: "٪" },
  ];

  const values = [
    { title: dict.about.value1, body: dict.about.value1Body },
    { title: dict.about.value2, body: dict.about.value2Body },
    { title: dict.about.value3, body: dict.about.value3Body },
    { title: dict.about.value4, body: dict.about.value4Body },
  ];

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <header className="border-b border-line">
        <div className="container-x py-20 md:py-28">
          <Eyebrow>{dict.brand.latin}</Eyebrow>
          <h1 className="mt-6 max-w-4xl animate-fade-up text-display font-medium text-balance">
            {dict.about.title}
          </h1>
          <p
            className="mt-8 max-w-xl animate-fade-up text-lg text-content-muted"
            style={{ animationDelay: "120ms" }}
          >
            {dict.about.lead}
          </p>
        </div>
      </header>

      {/* ----------------------------------------------------------- story */}
      <Section>
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="flex flex-col gap-8">
              <Reveal>
                <p className="text-lg leading-relaxed text-content-muted">
                  {dict.about.story1}
                </p>
              </Reveal>
              <Reveal delay={100}>
                <p className="text-lg leading-relaxed text-content-muted">
                  {dict.about.story2}
                </p>
              </Reveal>
            </div>

            <Reveal delay={140}>
              <div className="relative aspect-4/3 overflow-hidden bg-surface-2">
                <Image
                  src="/media/editorial/about-1.svg"
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

      {/* --------------------------------------------------- the mark itself */}
      <Section className="border-y border-line bg-surface-2">
        <div className="container-x">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <Reveal className="flex justify-center lg:justify-start">
              <Logo height={64} className="px-8 py-6" />
            </Reveal>
            <Reveal delay={120}>
              <p className="text-lg leading-relaxed text-content-muted">
                {dict.about.story3}
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- values */}
      <Section>
        <div className="container-x">
          <Reveal>
            <h2 className="text-title font-medium">{dict.about.valuesTitle}</h2>
          </Reveal>

          <div className="mt-12 grid gap-px bg-line sm:grid-cols-2">
            {values.map((value, index) => (
              <Reveal
                key={value.title}
                delay={index * 80}
                className="bg-surface p-8 md:p-10"
              >
                <span className="eyebrow text-accent nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl font-medium">{value.title}</h3>
                <p className="mt-3 leading-relaxed text-content-muted">
                  {value.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- numbers */}
      <Section className="border-t border-line">
        <div className="container-x">
          <Reveal>
            <h2 className="eyebrow text-content-faint">
              {dict.about.numbersTitle}
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {numbers.map((item, index) => (
              <Reveal key={item.label} delay={index * 80}>
                <p className="text-hero font-medium nums">
                  {formatNumber(item.value, locale)}
                  {item.suffix ?? ""}
                </p>
                <p className="mt-2 text-sm text-content-muted">{item.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- cta */}
      <Section className="border-t border-line bg-surface-2 py-20 md:py-24">
        <div className="container-x flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl text-title font-medium text-balance">
            {dict.home.introTitle}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href={`/${locale}/shop`}>{dict.nav.shop}</ButtonLink>
            <ButtonLink href={`/${locale}/contact`} variant="outline">
              {dict.nav.contact}
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
