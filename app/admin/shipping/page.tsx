import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";
import { getAdminShippingRequests } from "@/lib/shipping";
import { AdminShippingClient } from "./AdminShippingClient";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  await requireAdmin();
  const requests = await getAdminShippingRequests();

  return (
    <AdminShell>
      <h1>배송 관리</h1>
      <p className="lead">회원 배송 신청을 확인하고 상태와 운송장 번호를 관리합니다.</p>
      <AdminShippingClient requests={requests} />
    </AdminShell>
  );
}
