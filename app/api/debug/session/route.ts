import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { TAKARA_SESSION_BACKUP_COOKIE, TAKARA_SESSION_COOKIE } from "@/lib/app-session";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name).sort();

  return NextResponse.json(
    {
      ok: true,
      loggedIn: Boolean(user),
      userId: user?.id ?? null,
      email: user?.email ?? null,
      hasTakaraSessionCookie: cookieNames.includes(TAKARA_SESSION_COOKIE),
      hasTakaraBackupCookie: cookieNames.includes(TAKARA_SESSION_BACKUP_COOKIE),
      cookieNames,
      note: "로그인 판정은 takara_session 또는 takara_session_backup 쿠키만 사용합니다. GET /logout은 세션을 삭제하지 않습니다."
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
