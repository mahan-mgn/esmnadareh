"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Destructive submit that asks first. Kept as its own client component so the
 * admin tables around it can stay server-rendered.
 */
export function ConfirmSubmit({
  label,
  confirmText,
  children,
  className,
}: {
  label: string;
  confirmText: string;
  /** Icon or other content in place of the label — the label stays as the accessible name. */
  children?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={children ? label : undefined}
      title={children ? label : undefined}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
      className={
        className ??
        "text-xs text-content-faint transition-colors hover:text-rust-400 disabled:opacity-40"
      }
    >
      {children ?? label}
    </button>
  );
}
