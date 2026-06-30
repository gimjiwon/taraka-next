import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // TODO: Call claim_queue_turn RPC. Only one active selector per kuji.
  return NextResponse.json({ ok: true, kujiId: body.kujiId ?? null, status: "active", expiresInSeconds: 180 });
}
