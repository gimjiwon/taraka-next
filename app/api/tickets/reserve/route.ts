import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const reserveSchema = z.object({
  slug: z.string().trim().min(1),
  ticketNo: z.coerce.number().int().positive().optional(),
  ticketNos: z.array(z.coerce.number().int().positive()).min(1).max(20).optional()
});

function makeOrderNo() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TK-${ymd}-${Date.now().toString().slice(-6)}-${random}`;
}

function normalizeTicketNos(ticketNo?: number, ticketNos?: number[]) {
  const raw = ticketNos?.length ? ticketNos : typeof ticketNo === "number" ? [ticketNo] : [];
  return [...new Set(raw)].sort((a, b) => a - b);
}

function mapReserveError(rawMessage: string) {
  return rawMessage.includes("ticket_already_sold")
    ? "이미 판매된 번호가 포함되어 있습니다."
    : rawMessage.includes("ticket_locked_by_other_user")
      ? "다른 사용자가 결제 중인 번호가 포함되어 있습니다."
      : rawMessage.includes("ticket_not_found")
        ? "존재하지 않는 번호가 포함되어 있습니다."
        : rawMessage;
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

async function releaseReservedTickets(admin: ReturnType<typeof createSupabaseAdminClient>, ticketIds: string[], userId: string) {
  if (!ticketIds.length) return;
  await admin
    .from("kuji_tickets")
    .update({ status: "available", locked_by: null, locked_until: null })
    .in("id", ticketIds)
    .eq("status", "locked")
    .eq("locked_by", userId);
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

  const { slug, ticketNo, ticketNos } = parsed.data;
  const selectedTicketNos = normalizeTicketNos(ticketNo, ticketNos);

  if (!selectedTicketNos.length) {
    return NextResponse.json({ message: "번호를 1개 이상 선택해주세요." }, { status: 400 });
  }

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

  const reservedTickets: Array<{ id: string; prize_id: string | null; ticket_no: number }> = [];

  for (const no of selectedTicketNos) {
    const { data: reservedTicket, error: reserveError } = await admin.rpc("reserve_ticket", {
      p_kuji_id: kuji.id,
      p_ticket_no: no,
      p_user_id: userData.user.id,
      p_hold_seconds: 120
    });

    if (reserveError || !reservedTicket) {
      await releaseReservedTickets(admin, reservedTickets.map((ticket) => ticket.id), userData.user.id);
      const rawMessage = reserveError?.message ?? "번호 예약에 실패했습니다.";
      return NextResponse.json({ message: `${no}번: ${mapReserveError(rawMessage)}` }, { status: 409 });
    }

    const ticket = Array.isArray(reservedTicket) ? reservedTicket[0] : reservedTicket;
    if (!ticket?.id || !ticket?.prize_id) {
      await releaseReservedTickets(admin, reservedTickets.map((reserved) => reserved.id), userData.user.id);
      return NextResponse.json({ message: "예약된 번호 정보를 확인할 수 없습니다." }, { status: 500 });
    }

    reservedTickets.push({ id: ticket.id, prize_id: ticket.prize_id, ticket_no: no });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_no: makeOrderNo(),
      user_id: userData.user.id,
      kuji_id: kuji.id,
      amount: kuji.price * reservedTickets.length,
      status: "pending"
    })
    .select("id, order_no")
    .single();

  if (orderError || !order) {
    await releaseReservedTickets(admin, reservedTickets.map((ticket) => ticket.id), userData.user.id);
    return NextResponse.json({ message: orderError?.message ?? "주문 생성에 실패했습니다." }, { status: 500 });
  }

  const orderItems = reservedTickets.map((ticket, index) => ({
    order_id: order.id,
    ticket_id: ticket.id,
    prize_id: ticket.prize_id,
    reveal_index: index
  }));

  const { error: itemError } = await admin.from("order_items").insert(orderItems);

  if (itemError) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    await releaseReservedTickets(admin, reservedTickets.map((ticket) => ticket.id), userData.user.id);
    return NextResponse.json({ message: itemError.message }, { status: 500 });
  }

  await admin.from("admin_logs").insert({
    actor_id: userData.user.id,
    action: "ticket.reserve",
    detail: { kuji_id: kuji.id, slug: kuji.slug, ticket_nos: selectedTicketNos, order_id: order.id }
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNo: order.order_no,
    ticketNos: selectedTicketNos,
    expiresInSeconds: 120,
    paymentUrl: `/kuji/${kuji.slug}/payment?order=${order.id}&tickets=${selectedTicketNos.join(",")}`
  });
}
