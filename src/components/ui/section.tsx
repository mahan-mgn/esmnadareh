import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Small uppercase kicker with a rule running off to the side. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 eyebrow text-content-muted",
        className,
      )}
    >
      <span className="h-px w-8 bg-accent" aria-hidden />
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-title font-medium text-balance">{title}</h2>
        {lead ? (
          <p className="max-w-prose text-content-muted">{lead}</p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 eyebrow text-content transition-colors hover:text-accent"
        >
          {action.label}
          <span
            aria-hidden
            className="h-px w-6 bg-current transition-all duration-300 ease-[var(--ease-brand)] group-hover:w-10"
          />
        </Link>
      ) : null}
    </Reveal>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-20 md:py-28 lg:py-32", className)}>
      {children}
    </section>
  );
}
