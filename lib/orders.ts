import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ResultItem } from "@/types/takara";

export type PaymentOrderSummary = {
  id: string;
  orderNo: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  amount: number;
  kujiId: string;
  kujiSlug: string;
  kujiTitle: string;
  ticketNo: number | null;
  ticketNos: number[];
  lockedUntil: string | null;
  createdAt: string;
};

export type StorageDisplayItem = {
  id: string;
  shippingStatus: string;
  createdAt: string;
  orderNo: string;
  kujiTitle: string;
  kujiSlug: string;
  ticketNo: number;
  rank: string;
  prizeName: string;
  prizeImageUrl: string | null;
};

export type AdminOrderRow = {
  id: string;
  orderNo: string;
  userLabel: string;
  kujiTitle: string;
  amount: number;
  status: string;
  ticketNo: number | null;
  prizeLabel: string;
  createdAt: string;
  paidAt: string | null;
};

export type AdminMemberRow = {
  id: string;
  nickname: string;
  loginId: string;
  email: string | null;
  role: string;
  createdAt: string;
};

export type AdminLogRow = {
  id: string;
  action: string;
  detail: Record<string, unknown>;
  actorLabel: string;
  createdAt: string;
};

function makeMap<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

export async function getOrderSummaryForUser(orderId: string, userId: string): Promise<PaymentOrderSummary | null> {
  const admin = createSupabaseAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("id, order_no, user_id, kuji_id, amount, status, created_at")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !order) return null;

  const { data: kuji } = await admin
    .from("kujis")
    .select("id, slug, title")
    .eq("id", order.kuji_id)
    .maybeSingle();

  const { data: orderItems } = await admin
    .from("order_items")
    .select("ticket_id")
    .eq("order_id", order.id);

  const ticketIds = [...new Set((orderItems ?? []).map((item) => item.ticket_id).filter(Boolean))];
  let ticketNos: number[] = [];
  let lockedUntil: string | null = null;

  if (ticketIds.length) {
    const { data: tickets } = await admin
      .from("kuji_tickets")
      .select("ticket_no, locked_until")
      .in("id", ticketIds);

    ticketNos = (tickets ?? [])
      .map((ticket) => ticket.ticket_no)
      .filter((ticketNo): ticketNo is number => typeof ticketNo === "number")
      .sort((a, b) => a - b);

    const lockTimes = (tickets ?? [])
      .map((ticket) => ticket.locked_until)
      .filter((value): value is string => typeof value === "string")
      .sort();
    lockedUntil = lockTimes[0] ?? null;
  }

  const ticketNo = ticketNos[0] ?? null;

  return {
    id: order.id,
    orderNo: order.order_no,
    status: order.status,
    amount: order.amount,
    kujiId: order.kuji_id,
    kujiSlug: kuji?.slug ?? "",
    kujiTitle: kuji?.title ?? "삭제된 쿠지",
    ticketNo,
    ticketNos,
    lockedUntil,
    createdAt: order.created_at
  };
}

export async function getOrderResultItems(orderId: string, userId: string): Promise<{ order: PaymentOrderSummary; items: ResultItem[] } | null> {
  const order = await getOrderSummaryForUser(orderId, userId);
  if (!order || order.status !== "paid") return null;

  const admin = createSupabaseAdminClient();
  const { data: orderItems, error } = await admin
    .from("order_items")
    .select("id, ticket_id, prize_id, reveal_index")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error || !orderItems?.length) return { order, items: [] };

  const ticketIds = [...new Set(orderItems.map((item) => item.ticket_id).filter(Boolean))];
  const prizeIds = [...new Set(orderItems.map((item) => item.prize_id).filter(Boolean))];

  const { data: tickets } = ticketIds.length
    ? await admin.from("kuji_tickets").select("id, ticket_no").in("id", ticketIds)
    : { data: [] };

  const { data: prizes } = prizeIds.length
    ? await admin.from("prizes").select("id, rank, name, image_url").in("id", prizeIds)
    : { data: [] };

  const ticketMap = makeMap((tickets ?? []) as Array<{ id: string; ticket_no: number }>);
  const prizeMap = makeMap((prizes ?? []) as Array<{ id: string; rank: string; name: string; image_url: string | null }>);

  const items = orderItems
    .map((item) => {
      const ticket = item.ticket_id ? ticketMap.get(item.ticket_id) : null;
      const prize = item.prize_id ? prizeMap.get(item.prize_id) : null;
      return {
        ticketNo: ticket?.ticket_no ?? order.ticketNo ?? 0,
        rank: prize?.rank ?? "?",
        prizeName: prize?.name ?? "상품 정보 없음",
        imageUrl: prize?.image_url ?? null
      };
    })
    .sort((a, b) => a.ticketNo - b.ticketNo);

  return { order, items };
}

export async function getUserStorageItems(userId: string): Promise<StorageDisplayItem[]> {
  const admin = createSupabaseAdminClient();
  const { data: storageRows, error } = await admin
    .from("storage_items")
    .select("id, order_item_id, prize_id, shipping_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !storageRows?.length) return [];

  const orderItemIds = [...new Set(storageRows.map((row) => row.order_item_id).filter(Boolean))];
  const prizeIdsFromStorage = [...new Set(storageRows.map((row) => row.prize_id).filter(Boolean))];

  const { data: orderItems } = orderItemIds.length
    ? await admin.from("order_items").select("id, order_id, ticket_id, prize_id").in("id", orderItemIds)
    : { data: [] };

  const orderItemMap = makeMap((orderItems ?? []) as Array<{ id: string; order_id: string; ticket_id: string; prize_id: string | null }>);
  const orderIds = [...new Set((orderItems ?? []).map((item) => item.order_id).filter(Boolean))];
  const ticketIds = [...new Set((orderItems ?? []).map((item) => item.ticket_id).filter(Boolean))];
  const prizeIdsFromItems = [...new Set((orderItems ?? []).map((item) => item.prize_id).filter(Boolean))];
  const prizeIds = [...new Set([...prizeIdsFromStorage, ...prizeIdsFromItems])];

  const { data: orders } = orderIds.length
    ? await admin.from("orders").select("id, order_no, kuji_id").in("id", orderIds)
    : { data: [] };

  const { data: tickets } = ticketIds.length
    ? await admin.from("kuji_tickets").select("id, ticket_no, kuji_id").in("id", ticketIds)
    : { data: [] };

  const { data: prizes } = prizeIds.length
    ? await admin.from("prizes").select("id, rank, name, image_url").in("id", prizeIds)
    : { data: [] };

  const orderMap = makeMap((orders ?? []) as Array<{ id: string; order_no: string; kuji_id: string }>);
  const ticketMap = makeMap((tickets ?? []) as Array<{ id: string; ticket_no: number; kuji_id: string }>);
  const prizeMap = makeMap((prizes ?? []) as Array<{ id: string; rank: string; name: string; image_url: string | null }>);

  const kujiIds = [...new Set([...(orders ?? []).map((order) => order.kuji_id), ...(tickets ?? []).map((ticket) => ticket.kuji_id)].filter(Boolean))];
  const { data: kujis } = kujiIds.length
    ? await admin.from("kujis").select("id, title, slug").in("id", kujiIds)
    : { data: [] };
  const kujiMap = makeMap((kujis ?? []) as Array<{ id: string; title: string; slug: string }>);

  return storageRows.map((row) => {
    const orderItem = orderItemMap.get(row.order_item_id);
    const order = orderItem ? orderMap.get(orderItem.order_id) : null;
    const ticket = orderItem ? ticketMap.get(orderItem.ticket_id) : null;
    const prize = prizeMap.get(row.prize_id ?? orderItem?.prize_id ?? "");
    const kuji = kujiMap.get(order?.kuji_id ?? ticket?.kuji_id ?? "");

    return {
      id: row.id,
      shippingStatus: row.shipping_status,
      createdAt: row.created_at,
      orderNo: order?.order_no ?? "-",
      kujiTitle: kuji?.title ?? "삭제된 쿠지",
      kujiSlug: kuji?.slug ?? "",
      ticketNo: ticket?.ticket_no ?? 0,
      rank: prize?.rank ?? "?",
      prizeName: prize?.name ?? "상품 정보 없음",
      prizeImageUrl: prize?.image_url ?? null
    };
  });
}

export async function getMyPageStats(userId: string) {
  const admin = createSupabaseAdminClient();

  const [{ count: storageCount }, { count: orderCount }, { count: shippingCount }] = await Promise.all([
    admin.from("storage_items").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("shipping_status", "none"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("shipping_requests").select("id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  return {
    storageCount: storageCount ?? 0,
    orderCount: orderCount ?? 0,
    shippingCount: shippingCount ?? 0
  };
}

export async function getAdminOrders(): Promise<AdminOrderRow[]> {
  const admin = createSupabaseAdminClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, order_no, user_id, kuji_id, amount, status, created_at, paid_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !orders?.length) return [];

  const userIds = [...new Set(orders.map((order) => order.user_id).filter(Boolean))];
  const kujiIds = [...new Set(orders.map((order) => order.kuji_id).filter(Boolean))];
  const orderIds = orders.map((order) => order.id);

  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, nickname, login_id, email").in("id", userIds)
    : { data: [] };

  const { data: kujis } = kujiIds.length
    ? await admin.from("kujis").select("id, title").in("id", kujiIds)
    : { data: [] };

  const { data: orderItems } = await admin
    .from("order_items")
    .select("order_id, ticket_id, prize_id")
    .in("order_id", orderIds);

  const ticketIds = [...new Set((orderItems ?? []).map((item) => item.ticket_id).filter(Boolean))];
  const prizeIds = [...new Set((orderItems ?? []).map((item) => item.prize_id).filter(Boolean))];

  const { data: tickets } = ticketIds.length
    ? await admin.from("kuji_tickets").select("id, ticket_no").in("id", ticketIds)
    : { data: [] };

  const { data: prizes } = prizeIds.length
    ? await admin.from("prizes").select("id, rank, name").in("id", prizeIds)
    : { data: [] };

  const profileMap = makeMap((profiles ?? []) as Array<{ id: string; nickname: string; login_id: string; email: string | null }>);
  const kujiMap = makeMap((kujis ?? []) as Array<{ id: string; title: string }>);
  const ticketMap = makeMap((tickets ?? []) as Array<{ id: string; ticket_no: number }>);
  const prizeMap = makeMap((prizes ?? []) as Array<{ id: string; rank: string; name: string }>);
  const itemByOrder = new Map<string, { ticket_id: string; prize_id: string | null }>();
  for (const item of orderItems ?? []) {
    if (!itemByOrder.has(item.order_id)) itemByOrder.set(item.order_id, item);
  }

  return orders.map((order) => {
    const profile = profileMap.get(order.user_id);
    const kuji = kujiMap.get(order.kuji_id);
    const item = itemByOrder.get(order.id);
    const ticket = item ? ticketMap.get(item.ticket_id) : null;
    const prize = item?.prize_id ? prizeMap.get(item.prize_id) : null;

    return {
      id: order.id,
      orderNo: order.order_no,
      userLabel: profile ? `${profile.nickname} (${profile.login_id})` : "알 수 없음",
      kujiTitle: kuji?.title ?? "삭제된 쿠지",
      amount: order.amount,
      status: order.status,
      ticketNo: ticket?.ticket_no ?? null,
      prizeLabel: prize ? `${prize.rank}상 · ${prize.name}` : "-",
      createdAt: order.created_at,
      paidAt: order.paid_at ?? null
    };
  });
}

export async function getAdminMembers(): Promise<AdminMemberRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, nickname, login_id, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    nickname: row.nickname,
    loginId: row.login_id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at
  }));
}

export async function getAdminLogs(): Promise<AdminLogRow[]> {
  const admin = createSupabaseAdminClient();
  const { data: logs, error } = await admin
    .from("admin_logs")
    .select("id, actor_id, action, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !logs?.length) return [];

  const actorIds = [...new Set(logs.map((log) => log.actor_id).filter(Boolean))];
  const { data: profiles } = actorIds.length
    ? await admin.from("profiles").select("id, nickname, login_id").in("id", actorIds)
    : { data: [] };
  const profileMap = makeMap((profiles ?? []) as Array<{ id: string; nickname: string; login_id: string }>);

  return logs.map((log) => {
    const actor = log.actor_id ? profileMap.get(log.actor_id) : null;
    return {
      id: log.id,
      action: log.action,
      detail: (log.detail ?? {}) as Record<string, unknown>,
      actorLabel: actor ? `${actor.nickname} (${actor.login_id})` : "system",
      createdAt: log.created_at
    };
  });
}
