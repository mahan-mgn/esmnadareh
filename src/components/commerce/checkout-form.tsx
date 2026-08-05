"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Lock } from "lucide-react";

import { placeOrder } from "@/actions/checkout";
import { idleState } from "@/actions/types";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type CheckoutDefaults = {
  fullName: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  line1: string;
  postalCode: string;
};

export function CheckoutForm({
  locale,
  dict,
  defaults,
  isSignedIn,
}: {
  locale: Locale;
  dict: Dictionary;
  defaults: CheckoutDefaults;
  isSignedIn: boolean;
}) {
  const [state, action] = useActionState(placeOrder, idleState);

  return (
    <form action={action} className="flex flex-col gap-12">
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-2 eyebrow text-content-faint">
          {dict.checkout.contact}
        </legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={dict.checkout.fullName} error={state.errors?.fullName}>
            <Input
              name="fullName"
              required
              autoComplete="name"
              defaultValue={defaults.fullName}
            />
          </Field>
          <Field label={dict.checkout.phone} error={state.errors?.phone}>
            <Input
              name="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              defaultValue={defaults.phone}
              className="nums"
            />
          </Field>
        </div>

        <Field label={dict.checkout.email} error={state.errors?.email}>
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaults.email}
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-2 eyebrow text-content-faint">
          {dict.checkout.shippingAddress}
        </legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={dict.checkout.province} error={state.errors?.province}>
            <Input
              name="province"
              required
              autoComplete="address-level1"
              defaultValue={defaults.province}
            />
          </Field>
          <Field label={dict.checkout.city} error={state.errors?.city}>
            <Input
              name="city"
              required
              autoComplete="address-level2"
              defaultValue={defaults.city}
            />
          </Field>
        </div>

        <Field label={dict.checkout.address} error={state.errors?.line1}>
          <Input
            name="line1"
            required
            autoComplete="street-address"
            defaultValue={defaults.line1}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label={dict.checkout.postalCode}
            error={state.errors?.postalCode}
          >
            <Input
              name="postalCode"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              defaultValue={defaults.postalCode}
              className="nums"
            />
          </Field>
        </div>

        <Field label={dict.checkout.note} hint={dict.common.optional}>
          <Textarea
            name="note"
            rows={3}
            placeholder={dict.checkout.notePlaceholder}
          />
        </Field>

        {isSignedIn ? (
          <label className="flex cursor-pointer items-center gap-3 text-sm text-content-muted">
            <input
              type="checkbox"
              name="saveAddress"
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {dict.account.addAddress}
          </label>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 eyebrow text-content-faint">
          {dict.checkout.paymentMethod}
        </legend>

        <div className="flex items-start gap-4 border border-line-strong p-5">
          <CreditCard size={20} strokeWidth={1.5} className="mt-0.5 text-accent" />
          <div>
            <p className="font-medium">{dict.checkout.online}</p>
            <p className="mt-1 text-sm text-content-muted">
              {dict.checkout.onlineBody}
            </p>
          </div>
        </div>
      </fieldset>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rust-400" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        label={dict.checkout.placeOrder}
        pendingLabel={dict.checkout.processing}
      />
    </form>
  );
}

function SubmitButton({
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
      className="flex h-14 w-full items-center justify-center gap-2 bg-content eyebrow text-surface transition-all duration-300 ease-[var(--ease-brand)] hover:bg-accent hover:text-on-accent disabled:opacity-50"
    >
      <Lock size={14} strokeWidth={1.5} />
      {pending ? pendingLabel : label}
    </button>
  );
}
