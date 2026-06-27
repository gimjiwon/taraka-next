import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { getOrderResultItems } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get("order") ?? "";
  if (!orderId) {
    return NextResponse.json({ message: "주문 정보가 없습니다." }, { status: 400 });
  }

  const result = await getOrderResultItems(orderId, user.id);
  if (!result) {
    return NextResponse.json({ message: "결제 완료 주문을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: result.order, items: result.items });
}
