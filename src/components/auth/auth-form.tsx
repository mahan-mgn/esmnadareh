"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, register } from "@/actions/auth";
import { idleState } from "@/actions/types";
import { Field, Input } from "@/components/ui/field";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function AuthForm({
  mode,
  locale,
  dict,
  next,
}: {
  mode: "login" | "register";
  locale: Locale;
  dict: Dictionary;
  next?: string;
}) {
  const [state, action] = useActionState(
    mode === "login" ? login : register,
    idleState,
  );

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {mode === "register" ? (
        <Field label={dict.auth.name} error={state.errors?.name}>
          <Input name="name" required autoComplete="name" />
        </Field>
      ) : null}

      <Field label={dict.auth.email} error={state.errors?.email}>
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
        />
      </Field>

      {mode === "register" ? (
        <Field
          label={dict.auth.phone}
          hint={dict.common.optional}
          error={state.errors?.phone}
        >
          <Input name="phone" inputMode="tel" autoComplete="tel" className="nums" />
        </Field>
      ) : null}

      <Field label={dict.auth.password} error={state.errors?.password}>
        <Input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          dir="ltr"
        />
      </Field>

      {state.status === "error" && state.message && !state.errors ? (
        <p className="text-sm text-rust-400" role="alert">
          {state.message}
        </p>
      ) : null}

      <Submit
        label={mode === "login" ? dict.auth.login : dict.auth.register}
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
      className="h-12 w-full bg-content eyebrow text-surface transition-all duration-300 ease-[var(--ease-brand)] hover:bg-accent hover:text-on-accent disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
