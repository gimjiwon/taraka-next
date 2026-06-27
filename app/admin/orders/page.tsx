import { AdminShell } from "@/components/AdminShell";

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <h1>주문·배송 관리</h1>
      <div className="tableWrap"><table><thead><tr><th>주문번호</th><th>회원명</th><th>쿠지</th><th>결제상태</th><th>배송상태</th><th>생성일</th></tr></thead><tbody><tr><td colSpan={6}>주문 데이터가 없습니다.</td></tr></tbody></table></div>
    </AdminShell>
  );
}
