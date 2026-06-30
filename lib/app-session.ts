import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * TAKARA uses one application-level login session.
 *
 * Reason:
 * Supabase Auth is still used to verify email/password, but every page and API
 * checks this signed TAKARA cookie instead of mixing Supabase SSR cookies,
 * browser localStorage sessions, and app cookies.
 */
export const TAKARA_SESSION_COOKIE = "takara_session";
export const TAKARA_SESSION_BACKUP_COOKIE = "takara_session_backup";
export const TAKARA_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type TakaraSessionUser = {
  id: string;
  email: string | null;
};

type TakaraSessionPayload = {
  userId: string;
  email: string | null;
  exp: number;
};

function getSecret() {
  const secret =
    process.env.TAKARA_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!secret) {
    throw new Error("TAKARA 로그인 세션 서명 키가 설정되어 있지 않습니다.");
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return crypto.createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createTakaraSessionValue(user: { id: string; email?: string | null }) {
  const payload: TakaraSessionPayload = {
    userId: user.id,
    email: user.email ?? null,
    exp: Math.floor(Date.now() / 1000) + TAKARA_SESSION_MAX_AGE
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyTakaraSessionValue(value?: string | null): TakaraSessionUser | null {
  if (!value) return null;

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as TakaraSessionPayload;
    if (!payload.userId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.userId,
      email: payload.email ?? null
    };
  } catch {
    return null;
  }
}

function getFirstValidSession(values: Array<string | undefined | null>) {
  for (const value of values) {
    const user = verifyTakaraSessionValue(value);
    if (user) return user;
  }
  return null;
}

export function getTakaraSessionUserFromRequest(request: NextRequest) {
  return getFirstValidSession([
    request.cookies.get(TAKARA_SESSION_COOKIE)?.value,
    request.cookies.get(TAKARA_SESSION_BACKUP_COOKIE)?.value
  ]);
}

export async function getTakaraSessionUserFromCookies() {
  const cookieStore = await cookies();
  return getFirstValidSession([
    cookieStore.get(TAKARA_SESSION_COOKIE)?.value,
    cookieStore.get(TAKARA_SESSION_BACKUP_COOKIE)?.value
  ]);
}

export const takaraSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TAKARA_SESSION_MAX_AGE
};

export const takaraSessionBackupCookieOptions = {
  // Backup cookie is readable by the browser only for debugging/compatibility.
  // Server APIs still verify the cryptographic signature before trusting it.
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TAKARA_SESSION_MAX_AGE
};
