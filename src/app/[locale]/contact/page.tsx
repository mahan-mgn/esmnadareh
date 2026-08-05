import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { ContactForm } from "@/components/marketing/contact-form";
import { InstagramIcon, TelegramIcon } from "@/components/brand/social-icons";
import { Eyebrow } from "@/components/ui/section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return { title: dict.contact.title, description: dict.contact.lead };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const details = [
    { icon: MapPin, label: dict.contact.addressLabel, value: dict.contact.addressValue },
    { icon: Mail, label: dict.contact.emailLabel, value: dict.contact.emailValue, href: `mailto:${dict.contact.emailValue}` },
    { icon: Phone, label: dict.contact.phoneLabel, value: dict.contact.phoneValue, href: "tel:+982191000000" },
    { icon: Clock, label: dict.contact.hoursLabel, value: dict.contact.hoursValue },
  ];

  return (
    <div className="container-x">
      <header className="border-b border-line py-14 md:py-20">
        <Eyebrow>{dict.brand.latin}</Eyebrow>
        <h1 className="mt-5 text-hero font-medium">{dict.contact.title}</h1>
        <p className="mt-4 max-w-xl text-content-muted">{dict.contact.lead}</p>
      </header>

      <div className="grid gap-14 py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-24 lg:py-20">
        {/* --------------------------------------------------------- details */}
        <div className="flex flex-col gap-10">
          <h2 className="eyebrow text-content-faint">{dict.contact.infoTitle}</h2>

          <ul className="flex flex-col gap-7">
            {details.map((detail) => (
              <li key={detail.label} className="flex gap-4">
                <detail.icon
                  size={18}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-accent"
                />
                <div>
                  <p className="eyebrow text-content-faint">{detail.label}</p>
                  {detail.href ? (
                    <a
                      href={detail.href}
                      dir="ltr"
                      className="mt-1.5 block transition-colors hover:text-accent"
                    >
                      {detail.value}
                    </a>
                  ) : (
                    <p className="mt-1.5">{detail.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-line pt-8">
            <p className="eyebrow text-content-faint">
              {dict.contact.socialLabel}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center border border-line text-content-muted transition-all duration-300 hover:border-line-strong hover:text-content"
              >
                <InstagramIcon size={17} />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Telegram"
                className="flex h-10 w-10 items-center justify-center border border-line text-content-muted transition-all duration-300 hover:border-line-strong hover:text-content"
              >
                <TelegramIcon size={17} />
              </a>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ form */}
        <ContactForm locale={locale} dict={dict} />
      </div>
    </div>
  );
}
