"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Tags,
  Receipt,
  Ticket,
  Star,
  Users,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function AdminNav({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const pathname = usePathname();
  const base = `/${locale}/admin`;

  const links = [
    { href: base, label: dict.admin.dashboard, icon: LayoutDashboard, exact: true },
    { href: `${base}/products`, label: dict.admin.products, icon: Package },
    { href: `${base}/collections`, label: dict.admin.collections, icon: Layers },
    { href: `${base}/categories`, label: dict.admin.categories, icon: Tags },
    { href: `${base}/orders`, label: dict.admin.orders, icon: Receipt },
    { href: `${base}/coupons`, label: dict.admin.coupons, icon: Ticket },
    { href: `${base}/reviews`, label: dict.admin.reviews, icon: Star },
    { href: `${base}/users`, label: dict.admin.users, icon: Users },
    { href: `${base}/messages`, label: dict.admin.messages, icon: MessageSquare },
  ];

  return (
    <nav aria-label={dict.admin.title}>
      {/* A horizontal rail on phones, a sidebar from `lg`. `scroll-bleed` lets
          it run to the screen edge so the last tab is never half-clipped. */}
      <ul className="no-scrollbar scroll-bleed flex gap-1 overflow-x-auto overscroll-x-contain border-b border-line pb-3 lg:mx-0 lg:flex-col lg:overflow-visible lg:border-0 lg:px-0 lg:pb-0">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap px-3 text-sm transition-colors lg:min-h-0 lg:px-3 lg:py-2.5",
                  active
                    ? "bg-surface-2 text-accent"
                    : "text-content-muted hover:text-content",
                )}
              >
                <link.icon size={15} strokeWidth={1.5} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={`/${locale}`}
        className="mt-6 hidden items-center gap-2 px-3 text-xs text-content-faint transition-colors hover:text-content lg:flex"
      >
        <ArrowLeft size={13} className="rtl:rotate-180" />
        {dict.admin.backToSite}
      </Link>
    </nav>
  );
}
