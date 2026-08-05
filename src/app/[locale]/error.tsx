"use client";

import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x flex min-h-[65svh] flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="text-title font-medium">
        خطای سرور
        <span className="mt-1 block text-content-muted">Server error</span>
      </h1>

      <p className="max-w-md text-content-muted">
        چیزی از سمت ما درست کار نکرد. / Something on our side didn&apos;t work.
      </p>

      {error.digest ? (
        <p className="text-xs text-content-faint nums" dir="ltr">
          {error.digest}
        </p>
      ) : null}

      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-12 items-center bg-content px-8 eyebrow text-surface transition-colors hover:bg-accent hover:text-on-accent"
      >
        تلاش دوباره / Try again
      </button>
    </div>
  );
}
