import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();
    const value = String(identifier || "").trim();

    if (!value) {
      return NextResponse.json({ ok: false, message: "아이디 또는 이메일을 입력해주세요." }, { status: 400 });
    }

    if (value.includes("@")) {
      return NextResponse.json({ ok: true, email: value });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("login_id", value)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    if (!data?.email) {
      return NextResponse.json({ ok: false, message: "가입된 아이디를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, email: data.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인 정보를 확인하지 못했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
