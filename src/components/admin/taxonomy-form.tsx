"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveCategory, saveCollection } from "@/actions/admin";
import { idleState } from "@/actions/types";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type TaxonomyValues = {
  id?: string;
  nameFa: string;
  nameEn: string;
  descFa: string;
  descEn: string;
  taglineFa?: string;
  taglineEn?: string;
  season?: string;
  year?: number | null;
  featured: boolean;
  published?: boolean;
};

/**
 * Collections and categories differ by a handful of fields, so they share one
 * form rather than two near-identical copies.
 */
export function TaxonomyForm({
  kind,
  locale,
  dict,
  values,
}: {
  kind: "collection" | "category";
  locale: Locale;
  dict: Dictionary;
  values: TaxonomyValues;
}) {
  const [state, action] = useActionState(
    kind === "collection" ? saveCollection : saveCategory,
    idleState,
  );

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-8">
      <input type="hidden" name="locale" value={locale} />
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={dict.admin.nameFa}>
          <Input name="nameFa" required defaultValue={values.nameFa} />
        </Field>
        <Field label={dict.admin.nameEn}>
          <Input name="nameEn" required defaultValue={values.nameEn} dir="ltr" />
        </Field>
      </div>

      {kind === "collection" ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={`Tagline (fa)`} hint={dict.common.optional}>
              <Input name="taglineFa" defaultValue={values.taglineFa ?? ""} />
            </Field>
            <Field label={`Tagline (en)`} hint={dict.common.optional}>
              <Input
                name="taglineEn"
                defaultValue={values.taglineEn ?? ""}
                dir="ltr"
              />
            </Field>
          </div>

          <Field label={dict.admin.descFa}>
            <Textarea name="storyFa" rows={5} defaultValue={values.descFa} />
          </Field>
          <Field label={dict.admin.descEn}>
            <Textarea
              name="storyEn"
              rows={5}
              defaultValue={values.descEn}
              dir="ltr"
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Season" hint={dict.common.optional}>
              <Input name="season" defaultValue={values.season ?? ""} />
            </Field>
            <Field label="Year" hint={dict.common.optional}>
              <Input
                name="year"
                type="number"
                defaultValue={values.year ?? ""}
                className="nums"
              />
            </Field>
          </div>
        </>
      ) : (
        <>
          <Field label={dict.admin.descFa} hint={dict.common.optional}>
            <Textarea name="descFa" rows={3} defaultValue={values.descFa} />
          </Field>
          <Field label={dict.admin.descEn} hint={dict.common.optional}>
            <Textarea
              name="descEn"
              rows={3}
              defaultValue={values.descEn}
              dir="ltr"
            />
          </Field>
        </>
      )}

      <div className="flex flex-wrap gap-6 border-t border-line pt-6">
        <Toggle
          name="featured"
          label={dict.admin.featured}
          defaultChecked={values.featured}
        />
        {kind === "collection" ? (
          <Toggle
            name="published"
            label={dict.admin.published}
            defaultChecked={values.published ?? true}
          />
        ) : null}
      </div>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rust-400" role="alert">
          {state.message}
        </p>
      ) : null}

      <Submit label={dict.common.save} pendingLabel={dict.common.loading} />
    </form>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-content-muted">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[var(--accent)]"
      />
      {label}
    </label>
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
