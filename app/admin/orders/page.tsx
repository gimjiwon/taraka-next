import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";
import { formatWon } from "@/lib/format";
import { getAdminOrders } from "@/lib/orders";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "결제 대기",
    paid: "결제 완료",
    failed: "결제 실패",
    cancelled: "취소",
    refunded: "환불"
  };
  return labels[status] ?? status;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAdminOrders();

  return (
    <AdminShell>
      <h1>주문·배송 관리</h1>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>주문번호</th>
              <th>회원</th>
              <th>쿠지</th>
              <th>번호</th>
              <th>상품</th>
              <th>금액</th>
              <th>상태</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? orders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderNo}</td>
                <td>{order.userLabel}</td>
                <td>{order.kujiTitle}</td>
                <td>{order.ticketNo ? `${order.ticketNo}번` : "-"}</td>
                <td>{order.prizeLabel}</td>
                <td>{formatWon(order.amount)}</td>
                <td><span className="badge">{statusLabel(order.status)}</span></td>
                <td>{formatDate(order.createdAt)}</td>
              </tr>
            )) : <tr><td colSpan={8}>주문 데이터가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
