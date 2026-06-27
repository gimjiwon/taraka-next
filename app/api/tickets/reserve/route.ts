import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // TODO: Call reserve_ticket RPC. This must be server-side transactional.
  return NextResponse.json({ ok: true, ticketNo: body.ticketNo ?? null, expiresInSeconds: 120 });
}
