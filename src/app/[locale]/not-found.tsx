import Link from "next/link";

/**
 * Rendered inside the locale layout, so it inherits the header, footer and
 * theme. Copy is intentionally locale-neutral: `not-found.tsx` cannot read
 * route params, so both languages are shown rather than guessing wrong.
 */
export default function LocaleNotFound() {
  return (
    <div className="container-x flex min-h-[65svh] flex-col items-center justify-center gap-6 py-24 text-center">
      <p className="text-display leading-none font-medium text-accent nums">
        404
      </p>

      <h1 className="text-title font-medium">
        این صفحه هم اسم ندارد
        <span className="mt-1 block text-content-muted">
          This page has no name either
        </span>
      </h1>

      <p className="max-w-md text-content-muted">
        آدرسی که دنبالش بودید وجود ندارد یا جابه‌جا شده است.
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/fa"
          className="inline-flex h-12 items-center bg-content px-8 eyebrow text-surface transition-colors hover:bg-accent hover:text-on-accent"
        >
          بازگشت به خانه
        </Link>
        <Link
          href="/en"
          className="inline-flex h-12 items-center border border-line-strong px-8 eyebrow transition-colors hover:bg-content hover:text-surface"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
