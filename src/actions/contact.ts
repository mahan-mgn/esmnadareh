"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/i18n";
import { errorState, successState, type ActionState } from "./types";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z.string().min(2).max(120),
  body: z.string().min(10).max(2000),
});

export async function sendContactMessage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dict = getDictionary(String(formData.get("locale") ?? "fa"));

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    body: formData.get("message"),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !errors[key]) {
        errors[key] = dict.common.required;
      }
    }
    return errorState(dict.contact.error, errors);
  }

  await prisma.contactMessage.create({ data: parsed.data });
  return successState(dict.contact.sent);
}
