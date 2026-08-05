import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fields are drawn as a single underline rather than a boxed input — it keeps
 * forms quiet enough to sit next to the editorial layouts.
 */
/*
 * The 16px floor on small screens is not a style choice: iOS Safari zooms the
 * page whenever a focused control renders below 16px, and it never zooms back
 * out — so a single tap on a checkout field leaves the buyer scrolled sideways
 * on a magnified page. Above `sm` the intended 15.2px returns.
 */
const control =
  "w-full bg-transparent border-b border-line px-0 py-3 text-base sm:text-[0.95rem] text-content " +
  "placeholder:text-content-faint outline-none transition-colors duration-300 " +
  "focus:border-accent disabled:opacity-50";

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-baseline justify-between gap-3 eyebrow text-content-muted"
    >
      <span>{children}</span>
      {hint ? (
        <span className="text-[0.625rem] tracking-normal normal-case text-content-faint">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <Label hint={hint}>{label}</Label> : null}
      {children}
      {error ? (
        <p className="text-xs text-rust-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(control, "resize-y py-3", className)} {...props} />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(control, "appearance-none cursor-pointer", className)}
      {...props}
    />
  );
}
