import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getRequestUser } from "@/lib/auth";

const releaseSchema = z.object({
  orderId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = releaseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "주문 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", parsed.data.orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json({ message: "결제 대기 주문만 취소할 수 있습니다." }, { status: 409 });
  }

  const { data: items } = await admin
    .from("order_items")
    .select("ticket_id")
    .eq("order_id", order.id);

  const ticketIds = [...new Set((items ?? []).map((item) => item.ticket_id).filter(Boolean))];

  if (ticketIds.length) {
    await admin
      .from("kuji_tickets")
      .update({ status: "available", locked_by: null, locked_until: null })
      .in("id", ticketIds)
      .eq("status", "locked")
      .eq("locked_by", user.id);
  }

  await admin
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  await admin.from("admin_logs").insert({
    actor_id: user.id,
    action: "ticket.release",
    detail: { order_id: order.id, ticket_ids: ticketIds }
  });

  return NextResponse.json({ ok: true, message: "번호 예약이 취소되었습니다." });
}
