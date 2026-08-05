"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check } from "lucide-react";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { idleState } from "@/actions/types";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  locale,
  dict,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const [state, action] = useActionState(subscribeToNewsletter, idleState);

  return (
    <form action={action} className={cn("w-full", className)}>
      <input type="hidden" name="locale" value={locale} />

      <div className="flex items-center gap-3 border-b border-line-strong pb-3">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={dict.home.newsletterPlaceholder}
          aria-label={dict.home.newsletterPlaceholder}
          // `min-w-0`: without it the input's intrinsic width keeps the flex
          // row from shrinking, and the email field overflows a 320px screen.
          className="w-full min-w-0 bg-transparent py-2 text-base outline-none placeholder:text-content-faint"
        />
        <SubmitButton label={dict.home.newsletterCta} />
      </div>

      {state.status !== "idle" && state.message ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-2 text-sm",
            state.status === "success" ? "text-accent" : "text-rust-400",
          )}
          role="status"
        >
          {state.status === "success" ? <Check size={15} /> : null}
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex min-h-11 shrink-0 items-center gap-2 eyebrow text-content transition-colors hover:text-accent disabled:opacity-50"
    >
      {label}
      <ArrowRight
        size={15}
        strokeWidth={1.5}
        className="transition-transform duration-300 ease-[var(--ease-brand)] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
      />
    </button>
  );
}
