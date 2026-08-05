"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Star, Trash2 } from "lucide-react";

import {
  deleteProductImage,
  makeImagePrimary,
  uploadProductImage,
} from "@/actions/admin";
import { idleState } from "@/actions/types";
import { Field, Input } from "@/components/ui/field";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type ProductImageRow = {
  id: string;
  url: string;
  alt: string | null;
};

export function ProductImages({
  locale,
  dict,
  productId,
  images,
}: {
  locale: Locale;
  dict: Dictionary;
  productId: string;
  images: ProductImageRow[];
}) {
  const [state, action] = useActionState(uploadProductImage, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section>
      <h2 className="mb-5 text-xl font-medium">{dict.admin.images}</h2>

      {images.length ? (
        <ul className="mb-8 grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-6">
          {images.map((image, index) => (
            <li key={image.id} className="group relative bg-surface">
              <div className="relative aspect-4/5">
                <Image
                  src={image.url}
                  alt={image.alt ?? ""}
                  fill
                  sizes="(min-width: 1024px) 12vw, 33vw"
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute start-0 top-0 bg-accent px-2 py-1 text-[0.625rem] uppercase tracking-wider text-on-accent">
                    {dict.admin.primaryImage}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-1.5">
                {index === 0 ? (
                  <span />
                ) : (
                  <form action={makeImagePrimary}>
                    <input type="hidden" name="imageId" value={image.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      title={dict.admin.makePrimary}
                      aria-label={dict.admin.makePrimary}
                      className="p-1 text-content-faint transition-colors hover:text-accent"
                    >
                      <Star size={14} strokeWidth={1.5} />
                    </button>
                  </form>
                )}

                <form action={deleteProductImage}>
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <ConfirmSubmit
                    label={dict.common.delete}
                    confirmText={dict.admin.confirmDelete}
                    className="p-1 text-content-faint transition-colors hover:text-rust-400 disabled:opacity-40"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-8 border border-dashed border-line px-5 py-8 text-center text-sm text-content-muted">
          {dict.admin.noImages}
        </p>
      )}

      <form
        ref={formRef}
        action={(formData) => {
          action(formData);
          // Leaving the chosen file in the input invites a second upload of the
          // same photograph on the next submit.
          formRef.current?.reset();
        }}
        className="flex max-w-3xl flex-col gap-6 border-t border-line pt-8"
      >
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="locale" value={locale} />

        <Field label={dict.admin.addImage} hint={dict.admin.imageHint}>
          <input
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="w-full border-b border-line py-3 text-sm file:me-4 file:cursor-pointer file:border-0 file:bg-content file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-wider file:text-surface"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={`${dict.admin.altText} — ${dict.admin.nameFa}`} hint={dict.common.optional}>
            <Input name="altFa" />
          </Field>
          <Field label={`${dict.admin.altText} — ${dict.admin.nameEn}`} hint={dict.common.optional}>
            <Input name="altEn" dir="ltr" />
          </Field>
        </div>

        {state.message ? (
          <p
            className={
              state.status === "error"
                ? "text-sm text-rust-400"
                : "text-sm text-content-muted"
            }
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <UploadButton label={dict.admin.upload} pendingLabel={dict.common.loading} />
      </form>
    </section>
  );
}

function UploadButton({
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
      className="h-12 w-fit min-w-48 border border-line px-8 eyebrow transition-all duration-300 hover:border-content disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
