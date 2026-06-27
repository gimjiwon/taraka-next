import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const reserveSchema = z.object({
  slug: z.string().trim().min(1),
  ticketNo: z.coerce.number().int().positive()
});

function makeOrderNo() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TK-${ymd}-${Date.now().toString().slice(-6)}-${random}`;
}

async function releaseUserPendingLocks(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string, kujiId: string) {
  const { data: pendingOrders } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("kuji_id", kujiId)
    .eq("status", "pending");

  const orderIds = (pendingOrders ?? []).map((order) => order.id);
  if (!orderIds.length) return;

  const { data: items } = await admin
    .from("order_items")
    .select("ticket_id")
    .in("order_id", orderIds);

  const ticketIds = [...new Set((items ?? []).map((item) => item.ticket_id).filter(Boolean))];

  if (ticketIds.length) {
    await admin
      .from("kuji_tickets")
      .update({ status: "available", locked_by: null, locked_until: null })
      .in("id", ticketIds)
      .eq("status", "locked")
      .eq("locked_by", userId);
  }

  await admin
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .in("id", orderIds);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = reserveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "선택한 번호 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const { slug, ticketNo } = parsed.data;
  const admin = createSupabaseAdminClient();

  const { data: kuji, error: kujiError } = await admin
    .from("kujis")
    .select("id, slug, title, price, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (kujiError || !kuji) {
    return NextResponse.json({ message: "진행중인 쿠지를 찾을 수 없습니다." }, { status: 404 });
  }

  await releaseUserPendingLocks(admin, userData.user.id, kuji.id);

  const { data: reservedTicket, error: reserveError } = await admin.rpc("reserve_ticket", {
    p_kuji_id: kuji.id,
    p_ticket_no: ticketNo,
    p_user_id: userData.user.id,
    p_hold_seconds: 120
  });

  if (reserveError || !reservedTicket) {
    const rawMessage = reserveError?.message ?? "번호 예약에 실패했습니다.";
    const message = rawMessage.includes("ticket_already_sold")
      ? "이미 판매된 번호입니다."
      : rawMessage.includes("ticket_locked_by_other_user")
        ? "다른 사용자가 결제 중인 번호입니다."
        : rawMessage.includes("ticket_not_found")
          ? "존재하지 않는 번호입니다."
          : rawMessage;
    return NextResponse.json({ message }, { status: 409 });
  }

  const ticket = Array.isArray(reservedTicket) ? reservedTicket[0] : reservedTicket;
  if (!ticket?.id || !ticket?.prize_id) {
    return NextResponse.json({ message: "예약된 번호 정보를 확인할 수 없습니다." }, { status: 500 });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_no: makeOrderNo(),
      user_id: userData.user.id,
      kuji_id: kuji.id,
      amount: kuji.price,
      status: "pending"
    })
    .select("id, order_no")
    .single();

  if (orderError || !order) {
    await admin
      .from("kuji_tickets")
      .update({ status: "available", locked_by: null, locked_until: null })
      .eq("id", ticket.id)
      .eq("locked_by", userData.user.id);

    return NextResponse.json({ message: orderError?.message ?? "주문 생성에 실패했습니다." }, { status: 500 });
  }

  const { error: itemError } = await admin.from("order_items").insert({
    order_id: order.id,
    ticket_id: ticket.id,
    prize_id: ticket.prize_id,
    reveal_index: 0
  });

  if (itemError) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    await admin
      .from("kuji_tickets")
      .update({ status: "available", locked_by: null, locked_until: null })
      .eq("id", ticket.id)
      .eq("locked_by", userData.user.id);

    return NextResponse.json({ message: itemError.message }, { status: 500 });
  }

  await admin.from("admin_logs").insert({
    actor_id: userData.user.id,
    action: "ticket.reserve",
    detail: { kuji_id: kuji.id, slug: kuji.slug, ticket_no: ticketNo, order_id: order.id }
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNo: order.order_no,
    ticketNo,
    expiresInSeconds: 120,
    paymentUrl: `/kuji/${kuji.slug}/payment?order=${order.id}&ticket=${ticketNo}`
  });
}
