"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function AccountNav({
  locale,
  dict,
  isAdmin,
}: {
  locale: Locale;
  dict: Dictionary;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const base = `/${locale}/account`;

  const links = [
    { href: base, label: dict.account.overview, exact: true },
    { href: `${base}/orders`, label: dict.account.orders },
    { href: `${base}/addresses`, label: dict.account.addresses },
    { href: `${base}/profile`, label: dict.account.profile },
  ];

  return (
    <nav aria-label={dict.account.title}>
      {/* See AdminNav — horizontal rail on phones, sidebar from `lg`. */}
      <ul className="no-scrollbar scroll-bleed flex gap-1 overflow-x-auto overscroll-x-contain border-b border-line pb-3 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-0 lg:px-0 lg:pb-0">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex min-h-11 shrink-0 items-center whitespace-nowrap px-3 eyebrow transition-colors lg:min-h-0 lg:px-0 lg:py-3",
                  active
                    ? "text-accent"
                    : "text-content-muted hover:text-content",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}

        {isAdmin ? (
          <li className="lg:mt-6 lg:border-t lg:border-line lg:pt-4">
            <Link
              href={`/${locale}/admin`}
              className="flex min-h-11 shrink-0 items-center whitespace-nowrap px-3 eyebrow text-content-muted transition-colors hover:text-accent lg:min-h-0 lg:px-0 lg:py-3"
            >
              {dict.nav.admin}
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
