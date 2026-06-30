import { NextResponse } from "next/server";
import { TAKARA_SESSION_BACKUP_COOKIE, TAKARA_SESSION_COOKIE } from "@/lib/app-session";

export async function POST() {
  const response = NextResponse.json(
    { ok: true, message: "로그아웃되었습니다." },
    { headers: { "Cache-Control": "no-store" } }
  );

  response.cookies.delete(TAKARA_SESSION_COOKIE);
  response.cookies.delete(TAKARA_SESSION_BACKUP_COOKIE);

  return response;
}
