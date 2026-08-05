"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/actions/admin";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { Role } from "@/generated/prisma/enums";

export function UserRoleSelect({
  userId,
  role,
  locale,
  dict,
  disabled,
}: {
  userId: string;
  role: Role;
  locale: Locale;
  dict: Dictionary;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      // An admin may not demote themselves — that is enforced server-side too.
      disabled={disabled || pending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          const data = new FormData();
          data.set("userId", userId);
          data.set("role", next);
          data.set("locale", locale);
          await updateUserRole(data);
        });
      }}
      // See OrderStatusSelect — 16px on phones keeps iOS from zooming on focus.
      className="w-full cursor-pointer border border-line bg-transparent px-2 py-2 text-base outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5 sm:text-xs"
    >
      <option value="CUSTOMER">{dict.admin.customer}</option>
      <option value="ADMIN">{dict.admin.administrator}</option>
    </select>
  );
}
