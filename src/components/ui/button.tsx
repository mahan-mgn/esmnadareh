import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "uppercase tracking-[0.14em] transition-all duration-300 ease-[var(--ease-brand)] " +
  "disabled:pointer-events-none disabled:opacity-45 select-none";

const variants: Record<Variant, string> = {
  // Solid ink on paper, inverted on hover — the house button.
  primary:
    "bg-content text-surface hover:bg-accent hover:text-on-accent active:scale-[0.985]",
  accent:
    "bg-accent text-on-accent hover:bg-accent-hover active:scale-[0.985]",
  outline:
    "border border-line-strong text-content hover:bg-content hover:text-surface active:scale-[0.985]",
  ghost:
    "text-content-muted hover:text-content hover:bg-surface-2",
  danger:
    "border border-rust-500 text-rust-500 hover:bg-rust-500 hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.6875rem]",
  md: "h-12 px-7 text-[0.75rem]",
  lg: "h-14 px-10 text-[0.8125rem]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
