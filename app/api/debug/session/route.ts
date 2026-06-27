import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  return NextResponse.json({
    ok: true,
    loggedIn: Boolean(user),
    userId: user?.id ?? null,
    email: user?.email ?? null,
    hasAuthorizationHeader: Boolean(request.headers.get("authorization")),
    cookieNames: request.cookies.getAll().map((cookie) => cookie.name).filter((name) => name.includes("supabase") || name.startsWith("sb-")).slice(0, 20)
  }, { headers: { "Cache-Control": "no-store" } });
}
