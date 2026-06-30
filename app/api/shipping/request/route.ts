import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getRequestUser } from "@/lib/auth";

const requestSchema = z.object({
  storageItemIds: z.array(z.string().uuid()).min(1, "배송 신청할 상품을 선택해주세요."),
  recipientName: z.string().trim().min(1, "수령인을 입력해주세요.").max(40),
  phone: z.string().trim().min(8, "연락처를 입력해주세요.").max(30),
  postalCode: z.string().trim().max(20).optional().default(""),
  address1: z.string().trim().min(1, "기본주소를 입력해주세요.").max(200),
  address2: z.string().trim().max(200).optional().default(""),
  memo: z.string().trim().max(500).optional().default("")
});

function nullableText(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }

  const input = parsed.data;
  const uniqueStorageItemIds = [...new Set(input.storageItemIds)];
  const admin = createSupabaseAdminClient();

  const { data: storageRows, error: storageError } = await admin
    .from("storage_items")
    .select("id, shipping_status")
    .eq("user_id", user.id)
    .in("id", uniqueStorageItemIds);

  if (storageError) {
    return NextResponse.json({ message: storageError.message }, { status: 500 });
  }

  if (!storageRows || storageRows.length !== uniqueStorageItemIds.length) {
    return NextResponse.json({ message: "선택한 상품 중 배송 신청할 수 없는 상품이 있습니다." }, { status: 409 });
  }

  const unavailable = storageRows.find((row) => row.shipping_status !== "none");
  if (unavailable) {
    return NextResponse.json({ message: "이미 배송 신청된 상품이 포함되어 있습니다." }, { status: 409 });
  }

  const { data: shippingRequest, error: requestError } = await admin
    .from("shipping_requests")
    .insert({
      user_id: user.id,
      recipient_name: input.recipientName,
      phone: input.phone,
      postal_code: nullableText(input.postalCode),
      address1: input.address1,
      address2: nullableText(input.address2),
      memo: nullableText(input.memo),
      status: "requested"
    })
    .select("id")
    .single();

  if (requestError || !shippingRequest) {
    return NextResponse.json({ message: requestError?.message ?? "배송 신청 생성에 실패했습니다." }, { status: 500 });
  }

  const itemRows = uniqueStorageItemIds.map((storageItemId) => ({
    shipping_request_id: shippingRequest.id,
    storage_item_id: storageItemId
  }));

  const { error: itemError } = await admin.from("shipping_request_items").insert(itemRows);
  if (itemError) {
    await admin.from("shipping_requests").delete().eq("id", shippingRequest.id);
    return NextResponse.json({ message: itemError.message }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("storage_items")
    .update({ shipping_status: "requested" })
    .eq("user_id", user.id)
    .in("id", uniqueStorageItemIds);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  await admin.from("admin_logs").insert({
    actor_id: user.id,
    action: "shipping.request",
    detail: {
      shipping_request_id: shippingRequest.id,
      storage_item_ids: uniqueStorageItemIds,
      item_count: uniqueStorageItemIds.length
    }
  });

  return NextResponse.json({
    ok: true,
    message: "배송 신청이 완료되었습니다.",
    shippingRequestId: shippingRequest.id
  });
}
