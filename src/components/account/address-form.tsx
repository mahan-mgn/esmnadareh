"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addAddress } from "@/actions/auth";
import { idleState } from "@/actions/types";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export function AddressForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [state, action] = useActionState(addAddress, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      if (state.message) toast(state.message);
    } else if (state.status === "error" && state.message) {
      toast(state.message, "error");
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={action} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={dict.checkout.fullName}>
          <Input name="fullName" required autoComplete="name" />
        </Field>
        <Field label={dict.checkout.phone}>
          <Input name="phone" required inputMode="tel" className="nums" />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={dict.checkout.province}>
          <Input name="province" required />
        </Field>
        <Field label={dict.checkout.city}>
          <Input name="city" required />
        </Field>
      </div>

      <Field label={dict.checkout.address}>
        <Input name="line1" required autoComplete="street-address" />
      </Field>

      <Field label={dict.checkout.postalCode} className="sm:max-w-xs">
        <Input name="postalCode" required inputMode="numeric" className="nums" />
      </Field>

      <Submit label={dict.account.addAddress} pendingLabel={dict.common.loading} />
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
