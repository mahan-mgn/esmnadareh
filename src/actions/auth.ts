"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { mergeAnonymousCart } from "@/lib/cart";
import { getDictionary } from "@/i18n";
import { errorState, successState, type ActionState } from "./types";

const emailSchema = z.string().email();

function safeNext(next: unknown, locale: string) {
  // Only allow same-origin paths — never redirect to an arbitrary URL.
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return `/${locale}/account`;
}

// ---------------------------------------------------------------- login

export async function login(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!emailSchema.safeParse(email).success) {
    return errorState(dict.auth.invalidEmail, { email: dict.auth.invalidEmail });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return errorState(dict.auth.invalidCredentials);
  }

  await createSession({ sub: user.id, role: user.role, email: user.email });
  await mergeAnonymousCart(user.id);

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next"), locale));
}

// ---------------------------------------------------------------- register

export async function register(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = dict.auth.nameRequired;
  if (!emailSchema.safeParse(email).success) errors.email = dict.auth.invalidEmail;
  if (password.length < 8) errors.password = dict.auth.passwordShort;

  if (Object.keys(errors).length) {
    return errorState(Object.values(errors)[0], errors);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return errorState(dict.auth.emailTaken, { email: dict.auth.emailTaken });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone: phone || null,
      passwordHash: await hashPassword(password),
    },
  });

  await createSession({ sub: user.id, role: user.role, email: user.email });
  await mergeAnonymousCart(user.id);

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next"), locale));
}

// ---------------------------------------------------------------- logout

export async function logout(formData: FormData) {
  const locale = String(formData.get("locale") ?? "fa");
  await destroySession();
  revalidatePath("/", "layout");
  redirect(`/${locale}`);
}

// ---------------------------------------------------------------- profile

export async function updateProfile(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const session = await getSession();
  if (!session) return errorState(dict.auth.invalidCredentials);

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2) {
    return errorState(dict.auth.nameRequired, { name: dict.auth.nameRequired });
  }

  await prisma.user.update({
    where: { id: session.sub },
    data: { name, phone: phone || null },
  });

  revalidatePath("/", "layout");
  return successState(dict.account.profileUpdated);
}

// ---------------------------------------------------------------- addresses

export async function addAddress(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = String(formData.get("locale") ?? "fa");
  const dict = getDictionary(locale);

  const session = await getSession();
  if (!session) return errorState(dict.auth.invalidCredentials);

  const values = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    province: String(formData.get("province") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    line1: String(formData.get("line1") ?? "").trim(),
    postalCode: String(formData.get("postalCode") ?? "").trim(),
  };

  if (Object.values(values).some((value) => value.length < 2)) {
    return errorState(dict.common.required);
  }

  const count = await prisma.address.count({ where: { userId: session.sub } });
  await prisma.address.create({
    data: { ...values, userId: session.sub, isDefault: count === 0 },
  });

  revalidatePath(`/${locale}/account/addresses`);
  return successState(dict.admin.saved);
}

export async function deleteAddress(formData: FormData) {
  const session = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!session || !id) return;

  await prisma.address.deleteMany({ where: { id, userId: session.sub } });
  revalidatePath("/", "layout");
}

export async function setDefaultAddress(formData: FormData) {
  const session = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!session || !id) return;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: session.sub },
      data: { isDefault: false },
    }),
    prisma.address.updateMany({
      where: { id, userId: session.sub },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/", "layout");
}
