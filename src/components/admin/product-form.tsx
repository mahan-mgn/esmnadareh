"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProduct, updateVariantStock } from "@/actions/admin";
import { idleState } from "@/actions/types";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type ProductFormValues = {
  id?: string;
  sku: string;
  nameFa: string;
  nameEn: string;
  subtitleFa: string;
  subtitleEn: string;
  descFa: string;
  descEn: string;
  price: number;
  compareAtPrice: number | null;
  categoryId: string;
  collectionId: string | null;
  published: boolean;
  featured: boolean;
  isNew: boolean;
};

export type VariantRow = {
  id: string;
  sku: string;
  size: string | null;
  colorName: string | null;
  stock: number;
};

export function ProductForm({
  locale,
  dict,
  values,
  categories,
  collections,
  variants,
}: {
  locale: Locale;
  dict: Dictionary;
  values: ProductFormValues;
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  variants?: VariantRow[];
}) {
  const [state, action] = useActionState(saveProduct, idleState);

  return (
    <div className="flex flex-col gap-14">
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

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label={`${dict.admin.nameFa} — ${dict.product.description}`}
            hint={dict.common.optional}
          >
            <Input name="subtitleFa" defaultValue={values.subtitleFa} />
          </Field>
          <Field
            label={`${dict.admin.nameEn} — ${dict.product.description}`}
            hint={dict.common.optional}
          >
            <Input name="subtitleEn" defaultValue={values.subtitleEn} dir="ltr" />
          </Field>
        </div>

        <Field label={dict.admin.descFa}>
          <Textarea name="descFa" rows={4} required defaultValue={values.descFa} />
        </Field>

        <Field label={dict.admin.descEn}>
          <Textarea
            name="descEn"
            rows={4}
            required
            defaultValue={values.descEn}
            dir="ltr"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label={dict.admin.price}>
            <Input
              name="price"
              type="number"
              min={0}
              required
              defaultValue={values.price}
              className="nums"
            />
          </Field>
          <Field label={`${dict.admin.price} (${dict.common.from})`} hint={dict.common.optional}>
            <Input
              name="compareAtPrice"
              type="number"
              min={0}
              defaultValue={values.compareAtPrice ?? ""}
              className="nums"
            />
          </Field>
          {!values.id ? (
            <Field label={dict.admin.stock}>
              <Input
                name="stock"
                type="number"
                min={0}
                defaultValue={10}
                className="nums"
              />
            </Field>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={dict.shop.category}>
            <Select name="categoryId" required defaultValue={values.categoryId}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={dict.shop.collection} hint={dict.common.optional}>
            <Select name="collectionId" defaultValue={values.collectionId ?? ""}>
              <option value="">—</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {!values.id ? (
          <Field label="SKU" hint={dict.common.optional}>
            <Input name="sku" defaultValue={values.sku} dir="ltr" className="nums" />
          </Field>
        ) : null}

        <div className="flex flex-wrap gap-6 border-t border-line pt-6">
          <Toggle name="published" label={dict.admin.published} defaultChecked={values.published} />
          <Toggle name="featured" label={dict.admin.featured} defaultChecked={values.featured} />
          <Toggle name="isNew" label={locale === "fa" ? "جدید" : "New"} defaultChecked={values.isNew} />
        </div>

        {state.status === "error" && state.message ? (
          <p className="text-sm text-rust-400" role="alert">
            {state.message}
          </p>
        ) : null}

        <Submit label={dict.common.save} pendingLabel={dict.common.loading} />
      </form>

      {/* -------------------------------------------------------- variants */}
      {variants?.length ? (
        <section>
          <h2 className="mb-5 text-xl font-medium">{dict.admin.variants}</h2>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-120 border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-line bg-surface-2 px-4 py-3 text-start eyebrow text-content-faint">
                    SKU
                  </th>
                  <th className="border-b border-line bg-surface-2 px-4 py-3 text-start eyebrow text-content-faint">
                    {dict.shop.size}
                  </th>
                  <th className="border-b border-line bg-surface-2 px-4 py-3 text-start eyebrow text-content-faint">
                    {dict.shop.color}
                  </th>
                  <th className="border-b border-line bg-surface-2 px-4 py-3 text-start eyebrow text-content-faint">
                    {dict.admin.stock}
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="border-b border-line px-4 py-2.5 text-xs text-content-faint nums">
                      {variant.sku}
                    </td>
                    <td className="border-b border-line px-4 py-2.5 nums">
                      {variant.size ?? "—"}
                    </td>
                    <td className="border-b border-line px-4 py-2.5 text-content-muted">
                      {variant.colorName ?? "—"}
                    </td>
                    <td className="border-b border-line px-4 py-2">
                      <form action={updateVariantStock} className="flex items-center gap-2">
                        <input type="hidden" name="variantId" value={variant.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <input
                          type="number"
                          name="stock"
                          min={0}
                          defaultValue={variant.stock}
                          className="w-20 border-b border-line bg-transparent py-1.5 text-base outline-none focus:border-accent sm:text-sm nums"
                        />
                        <button
                          type="submit"
                          className="text-xs text-content-faint transition-colors hover:text-accent"
                        >
                          {dict.common.save}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
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
