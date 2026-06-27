import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const updateSchema = z.object({
  status: z.enum(["draft", "active", "paused", "ended"])
});

async function getAdminUserId() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }

  return { userId: userData.user.id };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminUserId();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "변경할 상태값이 올바르지 않습니다." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("kujis")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await admin.from("admin_logs").insert({
    actor_id: auth.userId,
    action: "kuji.status_update",
    detail: { kuji_id: id, status: parsed.data.status }
  });

  return NextResponse.json({ message: "상태가 변경되었습니다." });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminUserId();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("kujis").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await admin.from("admin_logs").insert({
    actor_id: auth.userId,
    action: "kuji.delete",
    detail: { kuji_id: id }
  });

  return NextResponse.json({ message: "쿠지가 삭제되었습니다." });
}
