"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { swapLocaleInPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

export type NavCategory = { slug: string; name: string };
export type NavCollection = { slug: string; name: string };

type Props = {
  locale: Locale;
  dict: Dictionary;
  cartCount: number;
  wishlistCount: number;
  isSignedIn: boolean;
  isAdmin: boolean;
  categories: NavCategory[];
  collections: NavCollection[];
};

export function SiteHeader({
  locale,
  dict,
  cartCount,
  wishlistCount,
  isSignedIn,
  isAdmin,
  categories,
  collections,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  const p = (path: string) => `/${locale}${path}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any navigation closes whatever overlay is open. Adjusting during render
  // (rather than in an effect) avoids a frame where the drawer is still up.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  /*
    `overflow: hidden` on <body> is not a scroll lock on iOS Safari — the page
    behind the drawer still rubber-bands, and reopening lands at the top. Pin
    the body at its current offset instead, then restore the offset on close.
    The scrollbar gutter is held by `scrollbar-gutter: stable` in globals.css,
    so nothing shifts sideways on desktop.
  */
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      insetInline: body.style.insetInline,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.insetInline = "0";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.insetInline = previous.insetInline;
      // `scroll-behavior: smooth` is set globally; restoring must not animate.
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const links = [
    { href: p("/shop"), label: dict.nav.shop },
    { href: p("/collections"), label: dict.nav.collections },
    { href: p("/about"), label: dict.nav.about },
    { href: p("/contact"), label: dict.nav.contact },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    const query = typeof value === "string" ? value.trim() : "";
    setSearchOpen(false);
    router.push(query ? `${p("/shop")}?q=${encodeURIComponent(query)}` : p("/shop"));
  }

  return (
    <>
      {/* Rolling announcement — the only always-on colour in the chrome */}
      <div className="relative overflow-hidden bg-accent text-on-accent">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {Array.from({ length: 6 }).map((_, index) => (
                <span
                  key={index}
                  className="px-6 py-2 text-[0.625rem] tracking-[0.28em] uppercase whitespace-nowrap"
                >
                  {dict.home.marquee}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-500 ease-[var(--ease-brand)]",
          scrolled
            ? "border-line bg-surface/85 backdrop-blur-xl"
            : "border-transparent bg-surface",
        )}
      >
        <div className="container-x">
          <div className="grid h-(--spacing-header) grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Left: desktop nav / mobile menu button */}
            <nav className="hidden items-center gap-8 lg:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative eyebrow py-1 transition-colors duration-300",
                    isActive(link.href)
                      ? "text-content"
                      : "text-content-muted hover:text-content",
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 -bottom-0.5 h-px origin-center bg-accent transition-transform duration-300 ease-[var(--ease-brand)]",
                      isActive(link.href)
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ms-2 flex h-11 w-11 items-center justify-center text-content lg:hidden"
              aria-label={dict.nav.menu}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>

            {/* Centre: the mark */}
            <Link
              href={p("")}
              className="group justify-self-center"
              aria-label={dict.brand.name}
            >
              <Logo
                height={30}
                priority
                className="group-hover:-rotate-1 group-hover:scale-[1.02]"
              />
            </Link>

            {/* Right: utilities. 44px hit areas on phones, tightened up once
                there is a pointer and the row has neighbours to fit. */}
            <div className="-me-2 flex items-center justify-end sm:me-0 sm:gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-11 w-11 items-center justify-center text-content-muted transition-colors hover:text-content sm:h-10 sm:w-10"
                aria-label={dict.nav.search}
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              <button
                type="button"
                onClick={toggle}
                className="hidden h-11 w-11 items-center justify-center text-content-muted transition-colors hover:text-content sm:flex sm:h-10 sm:w-10"
                aria-label={
                  theme === "dark" ? dict.common.lightMode : dict.common.darkMode
                }
              >
                {theme === "dark" ? (
                  <Sun size={18} strokeWidth={1.5} />
                ) : (
                  <Moon size={18} strokeWidth={1.5} />
                )}
              </button>

              <Link
                href={swapLocaleInPath(pathname, locale === "fa" ? "en" : "fa")}
                className="hidden h-10 min-w-11 items-center justify-center px-2 text-[0.6875rem] tracking-[0.18em] text-content-muted transition-colors hover:text-content sm:flex"
                aria-label={dict.common.language}
              >
                {locale === "fa" ? "EN" : "FA"}
              </Link>

              <Link
                href={p("/wishlist")}
                className="relative hidden h-11 w-11 items-center justify-center text-content-muted transition-colors hover:text-content sm:flex sm:h-10 sm:w-10"
                aria-label={dict.nav.wishlist}
              >
                <Heart size={18} strokeWidth={1.5} />
                {wishlistCount > 0 ? <Badge count={wishlistCount} /> : null}
              </Link>

              <Link
                href={p(isSignedIn ? "/account" : "/login")}
                className="hidden h-11 w-11 items-center justify-center text-content-muted transition-colors hover:text-content sm:flex sm:h-10 sm:w-10"
                aria-label={dict.nav.account}
              >
                <User size={18} strokeWidth={1.5} />
              </Link>

              <Link
                href={p("/cart")}
                className="relative flex h-11 w-11 items-center justify-center text-content transition-colors hover:text-accent sm:h-10 sm:w-10"
                aria-label={dict.nav.cart}
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {cartCount > 0 ? <Badge count={cartCount} /> : null}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------- mobile drawer */}
      <div
        className={cn(
          // `h-dvh` rather than `inset-0`: a fixed element is sized against the
          // large viewport, so on mobile the drawer's footer would sit behind
          // the browser's collapsing toolbar until the user scrolled.
          "fixed inset-x-0 top-0 z-90 h-dvh lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        // `inert` — not just `aria-hidden` — so the closed drawer's links stay
        // out of the tab order instead of trapping keyboard users off-screen.
        inert={!menuOpen}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-400",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          role="dialog"
          aria-modal={menuOpen}
          aria-label={dict.nav.menu}
          className={cn(
            "absolute inset-y-0 start-0 flex w-[86%] max-w-sm flex-col bg-surface",
            "transition-transform duration-500 ease-[var(--ease-brand)]",
            menuOpen ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line py-4 pad-x-safe">
            <Logo height={26} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="-me-2 flex h-11 w-11 items-center justify-center text-content"
              aria-label={dict.nav.close}
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* `overscroll-contain` keeps a flick at the end of the list from
              chaining through to the page underneath. */}
          <nav className="flex-1 overflow-y-auto overscroll-contain py-8 pad-x-safe">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-3 text-2xl font-medium tracking-tight transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-10 eyebrow text-content-faint">
              {dict.nav.categories}
            </p>
            <ul className="mt-4 flex flex-col gap-1">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`${p("/shop")}?category=${category.slug}`}
                    className="block py-2.5 text-content-muted transition-colors hover:text-content"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-10 eyebrow text-content-faint">
              {dict.nav.collections}
            </p>
            <ul className="mt-4 flex flex-col gap-1">
              {collections.map((collection) => (
                <li key={collection.slug}>
                  <Link
                    href={p(`/collections/${collection.slug}`)}
                    className="block py-2.5 text-content-muted transition-colors hover:text-content"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* `pb-safe` clears the home indicator on gesture-bar phones. */}
          <div className="border-t border-line py-4 pad-x-safe pb-safe [--pb-safe:1rem]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={p(isSignedIn ? "/account" : "/login")}
                className="inline-flex min-h-11 items-center gap-2 eyebrow"
              >
                <User size={15} strokeWidth={1.5} />
                {isSignedIn ? dict.nav.account : dict.auth.login}
              </Link>

              <div className="-me-2 flex items-center">
                <Link
                  href={p("/wishlist")}
                  className="relative flex h-11 w-11 items-center justify-center text-content-muted"
                  aria-label={dict.nav.wishlist}
                >
                  <Heart size={17} strokeWidth={1.5} />
                  {wishlistCount > 0 ? <Badge count={wishlistCount} /> : null}
                </Link>
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-11 w-11 items-center justify-center text-content-muted"
                  aria-label={dict.common.theme}
                >
                  {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <Link
                  href={swapLocaleInPath(
                    pathname,
                    locale === "fa" ? "en" : "fa",
                  )}
                  className="flex h-11 min-w-11 items-center justify-center px-2 text-[0.6875rem] tracking-[0.18em] text-content-muted"
                >
                  {locale === "fa" ? "EN" : "FA"}
                </Link>
              </div>
            </div>

            {isAdmin ? (
              <Link
                href={p("/admin")}
                className="mt-4 inline-block eyebrow text-accent"
              >
                {dict.nav.admin}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- search overlay */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-90 h-dvh transition-opacity duration-300",
          searchOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        inert={!searchOpen}
        aria-hidden={!searchOpen}
      >
        <div
          className="absolute inset-0 bg-surface/95 backdrop-blur-xl"
          onClick={() => setSearchOpen(false)}
        />
        {/*
          Scrollable rather than a fixed `pt-32`: on a landscape phone (~360px
          tall) the old offset pushed the input and the category chips off the
          bottom of the screen with no way to reach them. The on-screen keyboard
          has the same effect on a portrait phone.
        */}
        <div
          role="dialog"
          aria-modal={searchOpen}
          aria-label={dict.nav.search}
          className="container-x relative flex h-full flex-col overflow-y-auto overscroll-contain pt-24 pb-safe [--pb-safe:2.5rem] md:pt-32"
        >
          <form onSubmit={submitSearch} className="w-full">
            <label htmlFor="site-search" className="eyebrow text-content-muted">
              {dict.shop.searchTitle}
            </label>
            <div className="mt-4 flex items-center gap-3 border-b border-line-strong pb-4 sm:gap-4">
              <Search
                size={22}
                strokeWidth={1.5}
                className="shrink-0 text-accent"
              />
              <input
                ref={searchInput}
                id="site-search"
                name="q"
                type="search"
                placeholder={dict.shop.searchPlaceholder}
                // `min-w-0` lets the input shrink inside the flex row instead
                // of forcing the whole overlay wider than the screen.
                className="w-full min-w-0 bg-transparent text-xl outline-none placeholder:text-content-faint sm:text-2xl md:text-4xl"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="-me-2 flex h-11 w-11 shrink-0 items-center justify-center text-content-muted transition-colors hover:text-content"
                aria-label={dict.nav.close}
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.slug}
                  href={`${p("/shop")}?category=${category.slug}`}
                  className="flex min-h-11 items-center border border-line px-4 text-sm text-content-muted transition-colors hover:border-line-strong hover:text-content"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.5625rem] font-medium text-on-accent nums">
      {count > 99 ? "99+" : count}
    </span>
  );
}
