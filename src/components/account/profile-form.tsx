"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "@/actions/auth";
import { idleState } from "@/actions/types";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function ProfileForm({
  locale,
  dict,
  defaults,
}: {
  locale: Locale;
  dict: Dictionary;
  defaults: { name: string; phone: string };
}) {
  const [state, action] = useActionState(updateProfile, idleState);
  const toast = useToast();

  useEffect(() => {
    if (state.status !== "idle" && state.message) {
      toast(state.message, state.status === "error" ? "error" : "success");
    }
  }, [state, toast]);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="locale" value={locale} />

      <Field label={dict.auth.name} error={state.errors?.name}>
        <Input name="name" required defaultValue={defaults.name} />
      </Field>

      <Field label={dict.auth.phone} hint={dict.common.optional}>
        <Input
          name="phone"
          inputMode="tel"
          defaultValue={defaults.phone}
          className="nums"
        />
      </Field>

      <Submit
        label={dict.account.updateProfile}
        pendingLabel={dict.common.loading}
      />
    </form>
  );
}

function Submit({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-fit min-w-48 bg-content px-8 eyebrow text-surface transition-all duration-300 hover:bg-accent hover:text-on-accent disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
