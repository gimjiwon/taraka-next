import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // TODO: Persist revealed_at/order item reveal sequence on the server.
  return NextResponse.json({ ok: true, orderId: body.orderId ?? null, revealedIndex: body.revealedIndex ?? 0 });
}
