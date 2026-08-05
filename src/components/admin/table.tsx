import Link from "next/link";
import { cn } from "@/lib/utils";

/** Thin wrappers that keep every admin list looking the same. */

export function AdminHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-xl font-medium">{title}</h2>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-10 items-center bg-content px-5 eyebrow text-surface transition-colors hover:bg-accent hover:text-on-accent"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Table({
  children,
  label,
}: {
  children: React.ReactNode;
  /** Names the scroll region for assistive tech. Omit and the wrapper stays a
   *  plain focusable box rather than an unlabelled landmark. */
  label?: string;
}) {
  return (
    /*
      These tables are wider than a phone by design, so the wrapper scrolls.
      `tabIndex` makes that scroll reachable without a pointer — otherwise the
      columns past the fold are unreadable by keyboard. `overscroll-x-contain`
      keeps a sideways flick from firing the browser's back gesture on iOS.
    */
    <div
      className="overflow-x-auto overscroll-x-contain border border-line"
      tabIndex={0}
      role={label ? "region" : undefined}
      aria-label={label}
    >
      <table className="w-full min-w-160 border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-line bg-surface-2 px-4 py-3 text-start eyebrow text-content-faint",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-line px-4 py-3 align-middle", className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-16 text-center text-content-faint"
      >
        {label}
      </td>
    </tr>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "accent" | "strong";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[0.625rem] tracking-[0.14em] uppercase",
        tone === "accent" && "border-accent text-accent",
        tone === "strong" && "border-line-strong text-content",
        tone === "muted" && "border-line text-content-faint",
      )}
    >
      {children}
    </span>
  );
}
