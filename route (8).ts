import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";
import { getAdminKujis } from "@/lib/kujis";
import { KujiAdminClient } from "./KujiAdminClient";

export default async function AdminKujiPage() {
  await requireAdmin();
  const kujis = await getAdminKujis();

  return (
    <AdminShell>
      <span className="badge">KUJI ADMIN</span>
      <h1>쿠지 등록/관리</h1>
      <KujiAdminClient initialKujis={kujis} />
    </AdminShell>
  );
}
