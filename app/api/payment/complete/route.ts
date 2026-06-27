import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // TODO: Verify PG webhook/payment result, then finalize order and sold tickets.
  return NextResponse.json({ ok: true, orderId: body.orderId ?? "demo-order", paymentStatus: "paid" });
}
