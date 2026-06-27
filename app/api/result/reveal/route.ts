import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const revealSchema = z.object({
  orderId: z.string().uuid(),
  revealedIndex: z.coerce.number().int().min(0).optional()
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = revealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "결과 공개 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", parsed.data.orderId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({ message: "결제 완료 주문만 결과를 공개할 수 있습니다." }, { status: 409 });
  }

  await admin
    .from("order_items")
    .update({ revealed_at: new Date().toISOString() })
    .eq("order_id", order.id)
    .is("revealed_at", null);

  await admin
    .from("orders")
    .update({ reveal_status: "done", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  return NextResponse.json({ ok: true, orderId: order.id, revealedIndex: parsed.data.revealedIndex ?? 0 });
}
