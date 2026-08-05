"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/i18n";
import { errorState, successState, type ActionState } from "./types";

const schema = z.object({
  email: z.string().email(),
  locale: z.string().default("fa"),
});

export async function subscribeToNewsletter(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const parsed = schema.safeParse({
    email: formData.get("email"),
    locale,
  });

  if (!parsed.success) {
    return errorState(dict.home.newsletterError, {
      email: dict.home.newsletterError,
    });
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });
  if (existing) {
    return errorState(dict.home.newsletterDuplicate);
  }

  await prisma.newsletterSubscriber.create({
    data: { email, locale: parsed.data.locale },
  });

  return successState(dict.home.newsletterOk);
}
