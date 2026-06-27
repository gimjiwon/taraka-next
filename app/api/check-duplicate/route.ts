import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const TARGETS = new Set(["login_id", "nickname", "email"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const target = String(body.target || "").trim();
    const value = String(body.value || "").trim();

    if (!TARGETS.has(target)) {
      return NextResponse.json({ ok: false, message: "잘못된 확인 항목입니다." }, { status: 400 });
    }

    if (!value) {
      return NextResponse.json({ ok: false, message: "확인할 값을 입력해주세요." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq(target, value)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, available: !data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "중복확인 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
