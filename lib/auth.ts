import type { NextRequest } from "next/server";
import { getTakaraSessionUserFromCookies, getTakaraSessionUserFromRequest, type TakaraSessionUser } from "@/lib/app-session";

/**
 * Single source of truth for login state.
 *
 * Do not check Supabase SSR cookies here. Supabase Auth verifies the password
 * during login, but the site itself uses the signed TAKARA session cookie.
 */
export async function getRequestUser(request: NextRequest): Promise<TakaraSessionUser | null> {
  return getTakaraSessionUserFromRequest(request);
}

export async function getCurrentUser(): Promise<TakaraSessionUser | null> {
  return getTakaraSessionUserFromCookies();
}
