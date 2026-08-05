import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/enums";

/**
 * Edge-safe half of authentication: no Prisma, no bcrypt, no `server-only`,
 * so `middleware.ts` can import it. Password hashing and database lookups
 * live in `auth.ts`, which runs only on the Node runtime.
 */

export const SESSION_COOKIE = "en_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  sub: string;
  role: Role;
  email: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a random string of at least 32 characters.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Verifies the signature only — it does not check the user still exists. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}
