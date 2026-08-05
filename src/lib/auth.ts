import "server-only";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from "./session";

export { SESSION_COOKIE, verifySessionToken };
export type { SessionPayload };

// ------------------------------------------------------------- passwords

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// ------------------------------------------------------------- session

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function isAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN";
}
