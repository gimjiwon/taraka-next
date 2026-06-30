import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getRequestUser } from "@/lib/auth";

const updateSchema = z.object({
  status: z.enum(["requested", "preparing", "shipped", "delivered"]),
  trackingNo: z.string().trim().max(80).optional().default("")
});

async function getAdminUserId(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return { error: NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }) };
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }

  return { userId: user.id };
}

function nullableText(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminUserId(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "배송 상태값이 올바르지 않습니다." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: shippingRequest } = await admin
    .from("shipping_requests")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!shippingRequest) {
    return NextResponse.json({ message: "배송 신청을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await admin
    .from("shipping_requests")
    .update({
      status: parsed.data.status,
      tracking_no: nullableText(parsed.data.trackingNo),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data: requestItems } = await admin
    .from("shipping_request_items")
    .select("storage_item_id")
    .eq("shipping_request_id", id);

  const storageItemIds = [...new Set((requestItems ?? []).map((item) => item.storage_item_id).filter(Boolean))];
  if (storageItemIds.length) {
    await admin
      .from("storage_items")
      .update({ shipping_status: parsed.data.status })
      .in("id", storageItemIds);
  }

  await admin.from("admin_logs").insert({
    actor_id: auth.userId,
    action: "shipping.status_update",
    detail: {
      shipping_request_id: id,
      status: parsed.data.status,
      tracking_no: nullableText(parsed.data.trackingNo),
      storage_item_ids: storageItemIds
    }
  });

  return NextResponse.json({ message: "배송 상태가 변경되었습니다." });
}
