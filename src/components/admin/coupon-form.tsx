"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveCoupon } from "@/actions/admin";
import { idleState } from "@/actions/types";
import { Field, Input, Select } from "@/components/ui/field";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type CouponFormValues = {
  id?: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  perUserLimit: number | null;
  active: boolean;
};

export function CouponForm({
  locale,
  dict,
  values,
}: {
  locale: Locale;
  dict: Dictionary;
  values: CouponFormValues;
}) {
  const [state, action] = useActionState(saveCoupon, idleState);
  // The cap only means anything for a percentage; a flat code is its own cap.
  const [type, setType] = useState(values.type);

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-8">
      <input type="hidden" name="locale" value={locale} />
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={dict.admin.couponCode} hint={dict.admin.couponCodeHint}>
          <Input
            name="code"
            required
            dir="ltr"
            defaultValue={values.code}
            className="uppercase"
          />
        </Field>
        <Field label={dict.admin.couponType}>
          <Select
            name="type"
            defaultValue={values.type}
            onChange={(event) =>
              setType(event.target.value as CouponFormValues["type"])
            }
          >
            <option value="PERCENT">{dict.admin.couponPercent}</option>
            <option value="FIXED">{dict.admin.couponFixed}</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field
          label={dict.admin.couponValue}
          hint={type === "PERCENT" ? "٪ / %" : dict.common.toman}
        >
          <Input
            name="value"
            type="number"
            min={1}
            max={type === "PERCENT" ? 100 : undefined}
            required
            defaultValue={values.value}
            className="nums"
          />
        </Field>
        <Field label={dict.admin.couponMinSubtotal} hint={dict.common.optional}>
          <Input
            name="minSubtotal"
            type="number"
            min={0}
            defaultValue={values.minSubtotal}
            className="nums"
          />
        </Field>
        {type === "PERCENT" ? (
          <Field label={dict.admin.couponMaxDiscount} hint={dict.common.optional}>
            <Input
              name="maxDiscount"
              type="number"
              min={0}
              defaultValue={values.maxDiscount ?? ""}
              className="nums"
            />
          </Field>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={dict.admin.couponStartsAt} hint={dict.common.optional}>
          <Input name="startsAt" type="date" defaultValue={values.startsAt} dir="ltr" />
        </Field>
        <Field label={dict.admin.couponEndsAt} hint={dict.common.optional}>
          <Input name="endsAt" type="date" defaultValue={values.endsAt} dir="ltr" />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={dict.admin.couponUsageLimit} hint={dict.admin.couponUnlimited}>
          <Input
            name="usageLimit"
            type="number"
            min={0}
            defaultValue={values.usageLimit ?? ""}
            className="nums"
          />
        </Field>
        <Field
          label={dict.admin.couponPerUserLimit}
          hint={dict.admin.couponPerUserHint}
        >
          <Input
            name="perUserLimit"
            type="number"
            min={0}
            defaultValue={values.perUserLimit ?? ""}
            className="nums"
          />
        </Field>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2.5 border-t border-line pt-6 text-sm text-content-muted">
        <input
          type="checkbox"
          name="active"
          defaultChecked={values.active}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        {dict.admin.couponActive}
      </label>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rust-400" role="alert">
          {state.message}
        </p>
      ) : null}

      <Submit label={dict.common.save} pendingLabel={dict.common.loading} />
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
