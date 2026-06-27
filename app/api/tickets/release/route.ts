import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // TODO: Release lock if it belongs to the current user/session.
  return NextResponse.json({ ok: true, ticketNo: body.ticketNo ?? null });
}
