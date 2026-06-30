import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type ShippingStatus = "none" | "requested" | "preparing" | "shipped" | "delivered";

export type ShippingStorageItem = {
  id: string;
  shippingStatus: ShippingStatus;
  orderNo: string;
  kujiTitle: string;
  ticketNo: number;
  rank: string;
  prizeName: string;
  prizeImageUrl: string | null;
};

export type UserShippingRequest = {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  memo: string | null;
  status: ShippingStatus;
  trackingNo: string | null;
  createdAt: string;
  itemCount: number;
  itemLabels: string[];
};

export type AdminShippingRequest = UserShippingRequest & {
  userLabel: string;
  postalCode: string | null;
  address1: string;
  address2: string | null;
  updatedAt: string;
};

function makeMap<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function formatAddress(row: { postal_code: string | null; address1: string; address2: string | null }) {
  return [row.postal_code ? `(${row.postal_code})` : "", row.address1, row.address2 ?? ""]
    .filter(Boolean)
    .join(" ");
}

export async function getShippableStorageItems(userId: string): Promise<ShippingStorageItem[]> {
  const admin = createSupabaseAdminClient();
  const { data: storageRows, error } = await admin
    .from("storage_items")
    .select("id, order_item_id, prize_id, shipping_status")
    .eq("user_id", userId)
    .eq("shipping_status", "none")
    .order("created_at", { ascending: false });

  if (error || !storageRows?.length) return [];

  const orderItemIds = [...new Set(storageRows.map((row) => row.order_item_id).filter(Boolean))];
  const prizeIdsFromStorage = [...new Set(storageRows.map((row) => row.prize_id).filter(Boolean))];

  const { data: orderItems } = orderItemIds.length
    ? await admin.from("order_items").select("id, order_id, ticket_id, prize_id").in("id", orderItemIds)
    : { data: [] };

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

  const orderItemMap = makeMap((orderItems ?? []) as Array<{ id: string; order_id: string; ticket_id: string; prize_id: string | null }>);
  const orderMap = makeMap((orders ?? []) as Array<{ id: string; order_no: string; kuji_id: string }>);
  const ticketMap = makeMap((tickets ?? []) as Array<{ id: string; ticket_no: number; kuji_id: string }>);
  const prizeMap = makeMap((prizes ?? []) as Array<{ id: string; rank: string; name: string; image_url: string | null }>);

  const kujiIds = [...new Set([...(orders ?? []).map((order) => order.kuji_id), ...(tickets ?? []).map((ticket) => ticket.kuji_id)].filter(Boolean))];
  const { data: kujis } = kujiIds.length
    ? await admin.from("kujis").select("id, title").in("id", kujiIds)
    : { data: [] };
  const kujiMap = makeMap((kujis ?? []) as Array<{ id: string; title: string }>);

  return storageRows.map((row) => {
    const orderItem = orderItemMap.get(row.order_item_id);
    const order = orderItem ? orderMap.get(orderItem.order_id) : null;
    const ticket = orderItem ? ticketMap.get(orderItem.ticket_id) : null;
    const prize = prizeMap.get(row.prize_id ?? orderItem?.prize_id ?? "");
    const kuji = kujiMap.get(order?.kuji_id ?? ticket?.kuji_id ?? "");

    return {
      id: row.id,
      shippingStatus: row.shipping_status as ShippingStatus,
      orderNo: order?.order_no ?? "-",
      kujiTitle: kuji?.title ?? "삭제된 쿠지",
      ticketNo: ticket?.ticket_no ?? 0,
      rank: prize?.rank ?? "?",
      prizeName: prize?.name ?? "상품 정보 없음",
      prizeImageUrl: prize?.image_url ?? null
    };
  });
}

async function getShippingRequestItemLabels(requestIds: string[]) {
  const admin = createSupabaseAdminClient();
  if (!requestIds.length) return new Map<string, string[]>();

  const { data: requestItems } = await admin
    .from("shipping_request_items")
    .select("shipping_request_id, storage_item_id")
    .in("shipping_request_id", requestIds);

  const storageIds = [...new Set((requestItems ?? []).map((item) => item.storage_item_id).filter(Boolean))];
  const { data: storageRows } = storageIds.length
    ? await admin.from("storage_items").select("id, order_item_id, prize_id").in("id", storageIds)
    : { data: [] };

  const orderItemIds = [...new Set((storageRows ?? []).map((row) => row.order_item_id).filter(Boolean))];
  const prizeIdsFromStorage = [...new Set((storageRows ?? []).map((row) => row.prize_id).filter(Boolean))];

  const { data: orderItems } = orderItemIds.length
    ? await admin.from("order_items").select("id, ticket_id, prize_id").in("id", orderItemIds)
    : { data: [] };

  const ticketIds = [...new Set((orderItems ?? []).map((item) => item.ticket_id).filter(Boolean))];
  const prizeIds = [...new Set([...(orderItems ?? []).map((item) => item.prize_id).filter(Boolean), ...prizeIdsFromStorage])];

  const { data: tickets } = ticketIds.length
    ? await admin.from("kuji_tickets").select("id, ticket_no").in("id", ticketIds)
    : { data: [] };

  const { data: prizes } = prizeIds.length
    ? await admin.from("prizes").select("id, rank, name").in("id", prizeIds)
    : { data: [] };

  const storageMap = makeMap((storageRows ?? []) as Array<{ id: string; order_item_id: string; prize_id: string | null }>);
  const orderItemMap = makeMap((orderItems ?? []) as Array<{ id: string; ticket_id: string; prize_id: string | null }>);
  const ticketMap = makeMap((tickets ?? []) as Array<{ id: string; ticket_no: number }>);
  const prizeMap = makeMap((prizes ?? []) as Array<{ id: string; rank: string; name: string }>);

  const labelsByRequest = new Map<string, string[]>();

  for (const item of requestItems ?? []) {
    const storage = storageMap.get(item.storage_item_id);
    const orderItem = storage ? orderItemMap.get(storage.order_item_id) : null;
    const ticket = orderItem ? ticketMap.get(orderItem.ticket_id) : null;
    const prize = prizeMap.get(storage?.prize_id ?? orderItem?.prize_id ?? "");
    const label = `${ticket?.ticket_no ?? "?"}번 · ${prize ? `${prize.rank}상 ${prize.name}` : "상품 정보 없음"}`;
    const current = labelsByRequest.get(item.shipping_request_id) ?? [];
    current.push(label);
    labelsByRequest.set(item.shipping_request_id, current);
  }

  return labelsByRequest;
}

export async function getUserShippingRequests(userId: string): Promise<UserShippingRequest[]> {
  const admin = createSupabaseAdminClient();
  const { data: requests, error } = await admin
    .from("shipping_requests")
    .select("id, recipient_name, phone, address1, address2, postal_code, memo, status, tracking_no, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !requests?.length) return [];

  const labelsByRequest = await getShippingRequestItemLabels(requests.map((request) => request.id));

  return requests.map((request) => {
    const labels = labelsByRequest.get(request.id) ?? [];
    return {
      id: request.id,
      recipientName: request.recipient_name,
      phone: request.phone,
      address: formatAddress(request),
      memo: request.memo ?? null,
      status: request.status as ShippingStatus,
      trackingNo: request.tracking_no ?? null,
      createdAt: request.created_at,
      itemCount: labels.length,
      itemLabels: labels
    };
  });
}

export async function getAdminShippingRequests(): Promise<AdminShippingRequest[]> {
  const admin = createSupabaseAdminClient();
  const { data: requests, error } = await admin
    .from("shipping_requests")
    .select("id, user_id, recipient_name, phone, address1, address2, postal_code, memo, status, tracking_no, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !requests?.length) return [];

  const userIds = [...new Set(requests.map((request) => request.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, nickname, login_id, email").in("id", userIds)
    : { data: [] };
  const profileMap = makeMap((profiles ?? []) as Array<{ id: string; nickname: string; login_id: string; email: string | null }>);
  const labelsByRequest = await getShippingRequestItemLabels(requests.map((request) => request.id));

  return requests.map((request) => {
    const profile = profileMap.get(request.user_id);
    const labels = labelsByRequest.get(request.id) ?? [];
    return {
      id: request.id,
      recipientName: request.recipient_name,
      phone: request.phone,
      address: formatAddress(request),
      address1: request.address1,
      address2: request.address2 ?? null,
      postalCode: request.postal_code ?? null,
      memo: request.memo ?? null,
      status: request.status as ShippingStatus,
      trackingNo: request.tracking_no ?? null,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      itemCount: labels.length,
      itemLabels: labels,
      userLabel: profile ? `${profile.nickname} (${profile.login_id})` : "알 수 없음"
    };
  });
}
