import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // TODO: Supabase queue_entries insert + position calculation.
  return NextResponse.json({ ok: true, queueEntryId: "demo-entry", kujiId: body.kujiId ?? null, status: "waiting" });
}
