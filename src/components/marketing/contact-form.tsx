"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { sendContactMessage } from "@/actions/contact";
import { idleState } from "@/actions/types";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function ContactForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [state, action] = useActionState(sendContactMessage, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-6">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={dict.contact.name} error={state.errors?.name}>
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label={dict.contact.email} error={state.errors?.email}>
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
          />
        </Field>
      </div>

      <Field label={dict.contact.subject} error={state.errors?.subject}>
        <Input name="subject" required />
      </Field>

      <Field label={dict.contact.message} error={state.errors?.body}>
        <Textarea name="message" rows={6} required minLength={10} />
      </Field>

      {state.status !== "idle" && state.message ? (
        <p
          className={
            state.status === "success"
              ? "flex items-center gap-2 text-sm text-accent"
              : "text-sm text-rust-400"
          }
          role="status"
        >
          {state.status === "success" ? <Check size={15} /> : null}
          {state.message}
        </p>
      ) : null}

      <Submit label={dict.contact.send} pendingLabel={dict.contact.sending} />
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
      className="h-12 w-fit min-w-52 bg-content px-8 eyebrow text-surface transition-all duration-300 ease-[var(--ease-brand)] hover:bg-accent hover:text-on-accent disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
