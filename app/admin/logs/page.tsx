import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";

export default async function AdminLogsPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <h1>운영 로그</h1>
      <div className="tableWrap"><table><thead><tr><th>시간</th><th>회원 이름</th><th>관리자</th><th>동작</th><th>상세</th></tr></thead><tbody><tr><td colSpan={5}>로그 데이터가 없습니다.</td></tr></tbody></table></div>
    </AdminShell>
  );
}
