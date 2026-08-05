import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { InstagramIcon, TelegramIcon } from "@/components/brand/social-icons";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  dict: Dictionary;
  categories: { slug: string; name: string }[];
  collections: { slug: string; name: string }[];
};

export function SiteFooter({ locale, dict, categories, collections }: Props) {
  const p = (path: string) => `/${locale}${path}`;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="container-x">
        {/* Newsletter sits inside the footer so the page ends on an invitation */}
        <div className="grid gap-10 border-b border-line py-16 md:grid-cols-2 md:items-center md:gap-16 lg:py-20">
          <div>
            <h2 className="text-title font-medium text-balance">
              {dict.home.newsletterTitle}
            </h2>
            <p className="mt-3 max-w-md text-content-muted">
              {dict.home.newsletterBody}
            </p>
          </div>
          <NewsletterForm locale={locale} dict={dict} />
        </div>

        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5">
            {/* self-start keeps the black chip hugging the mark inside the
                stretch-aligned column */}
            <Logo height={34} className="self-start" />
            <p className="max-w-xs text-sm leading-relaxed text-content-muted">
              {dict.brand.tagline}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <SocialLink
                href="https://instagram.com"
                label="Instagram"
                icon={<InstagramIcon size={16} />}
              />
              <SocialLink
                href="https://t.me"
                label="Telegram"
                icon={<TelegramIcon size={16} />}
              />
              <SocialLink
                href={`mailto:${dict.contact.emailValue}`}
                label="Email"
                icon={<Mail size={16} strokeWidth={1.5} />}
              />
            </div>
          </div>

          <FooterColumn title={dict.footer.shopHeading}>
            {categories.map((category) => (
              <FooterLink
                key={category.slug}
                href={`${p("/shop")}?category=${category.slug}`}
              >
                {category.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={dict.nav.collections}>
            {collections.map((collection) => (
              <FooterLink
                key={collection.slug}
                href={p(`/collections/${collection.slug}`)}
              >
                {collection.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={dict.footer.helpHeading}>
            <FooterLink href={p("/about")}>{dict.nav.about}</FooterLink>
            <FooterLink href={p("/contact")}>{dict.nav.contact}</FooterLink>
            <FooterLink href={p("/account")}>{dict.nav.account}</FooterLink>
            <FooterLink href={p("/wishlist")}>{dict.nav.wishlist}</FooterLink>
          </FooterColumn>
        </div>

        {/* Last element on the page — with `viewport-fit=cover` it would
            otherwise sit under the home indicator. */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-8 pb-safe text-center text-xs text-content-faint [--pb-safe:2rem] md:flex-row md:text-start">
          <p>
            © {year} {dict.brand.name} — {dict.common.copyright}
          </p>
          <p className="tracking-[0.2em] uppercase">{dict.footer.madeIn}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="eyebrow text-content-faint">{title}</h3>
      {/* Tighter gaps on phones because each link carries its own vertical
          padding there — the rhythm stays the same, the targets get bigger. */}
      <ul className="flex flex-col gap-1 sm:gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block py-1.5 text-sm text-content-muted transition-colors duration-300 hover:text-accent sm:py-0"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center border border-line text-content-muted transition-all duration-300 hover:border-line-strong hover:text-content sm:h-9 sm:w-9"
    >
      {icon}
    </a>
  );
}
