import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1)
});

async function resolveEmail(identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (value.includes("@")) return value;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("login_id", value)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.email) throw new Error("가입된 아이디를 찾을 수 없습니다.");
  return data.email;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "아이디 또는 이메일과 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const email = await resolveEmail(parsed.data.identifier);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password
    });

    if (error || !data.user) {
      return NextResponse.json({ ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, userId: data.user.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인에 실패했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
