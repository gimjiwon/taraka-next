import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const completeSchema = z.object({
  orderId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = completeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "주문 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, kuji_id, status")
    .eq("id", parsed.data.orderId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (order.status === "paid") {
    const { data: kuji } = await admin.from("kujis").select("slug").eq("id", order.kuji_id).maybeSingle();
    return NextResponse.json({ ok: true, orderId: order.id, paymentStatus: "paid", resultUrl: `/kuji/${kuji?.slug ?? ""}/result?order=${order.id}` });
  }

  if (order.status !== "pending") {
    return NextResponse.json({ message: "결제 가능한 주문 상태가 아닙니다." }, { status: 409 });
  }

  const { data: items } = await admin
    .from("order_items")
    .select("ticket_id")
    .eq("order_id", order.id);

  const ticketIds = [...new Set((items ?? []).map((item) => item.ticket_id).filter(Boolean))];
  if (!ticketIds.length) {
    return NextResponse.json({ message: "주문에 연결된 번호가 없습니다." }, { status: 409 });
  }

  const { data: tickets } = await admin
    .from("kuji_tickets")
    .select("id, status, locked_by, locked_until")
    .in("id", ticketIds);

  const now = Date.now();
  const invalidTicket = (tickets ?? []).find((ticket) => {
    const lockMs = ticket.locked_until ? new Date(ticket.locked_until).getTime() : 0;
    return ticket.status !== "locked" || ticket.locked_by !== userData.user.id || lockMs < now;
  });

  if (invalidTicket || (tickets ?? []).length !== ticketIds.length) {
    await admin
      .from("kuji_tickets")
      .update({ status: "available", locked_by: null, locked_until: null })
      .in("id", ticketIds)
      .eq("status", "locked")
      .eq("locked_by", userData.user.id);

    await admin
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return NextResponse.json({ message: "결제 제한 시간이 만료되었습니다. 다시 번호를 선택해주세요." }, { status: 409 });
  }

  const { error: finalizeError } = await admin.rpc("finalize_paid_order", {
    p_order_id: order.id,
    p_user_id: userData.user.id
  });

  if (finalizeError) {
    return NextResponse.json({ message: finalizeError.message }, { status: 500 });
  }

  const { data: kuji } = await admin.from("kujis").select("slug").eq("id", order.kuji_id).maybeSingle();

  await admin.from("admin_logs").insert({
    actor_id: userData.user.id,
    action: "order.paid",
    detail: { order_id: order.id, kuji_id: order.kuji_id, ticket_ids: ticketIds }
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    paymentStatus: "paid",
    resultUrl: `/kuji/${kuji?.slug ?? ""}/result?order=${order.id}`
  });
}
