import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

function normalizeLoginId(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const loginId = normalizeLoginId(String(body.loginId || ""));
    const nickname = String(body.nickname || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!loginId || !nickname || !email || !password) {
      return NextResponse.json({ ok: false, message: "모든 필수 정보를 입력해주세요." }, { status: 400 });
    }

    if (!/^[a-z0-9_]{4,20}$/.test(loginId)) {
      return NextResponse.json({ ok: false, message: "아이디는 영문 소문자, 숫자, 밑줄 4~20자로 입력해주세요." }, { status: 400 });
    }

    if (nickname.length < 2 || nickname.length > 16) {
      return NextResponse.json({ ok: false, message: "닉네임은 2~16자로 입력해주세요." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, message: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const duplicateChecks = [
      { column: "login_id", value: loginId, message: "이미 사용 중인 아이디입니다." },
      { column: "nickname", value: nickname, message: "이미 사용 중인 닉네임입니다." },
      { column: "email", value: email, message: "이미 가입된 이메일입니다." }
    ] as const;

    for (const check of duplicateChecks) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq(check.column, check.value)
        .maybeSingle();
      if (data) {
        return NextResponse.json({ ok: false, message: check.message }, { status: 409 });
      }
    }

    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const role = count === 0 ? "admin" : "customer";

    const { data: createdUser, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        login_id: loginId,
        nickname
      }
    });

    if (userError || !createdUser.user) {
      return NextResponse.json({ ok: false, message: userError?.message || "회원 생성에 실패했습니다." }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: createdUser.user.id,
        login_id: loginId,
        nickname,
        email,
        role
      }, { onConflict: "id" });

    if (profileError) {
      await supabase.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ ok: false, message: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
