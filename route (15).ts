import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <span className="badge">ADMIN DASHBOARD</span>
      <h1>관리자 대시보드</h1>
      <div className="grid3">
        <div className="card"><h3>진행 쿠지</h3><strong>0개</strong></div>
        <div className="card"><h3>오늘 주문</h3><strong>0건</strong></div>
        <div className="card"><h3>배송 요청</h3><strong>0건</strong></div>
      </div>
    </AdminShell>
  );
}
