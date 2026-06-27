import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";

export default async function AdminMembersPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <h1>회원 관리</h1>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="field"><label>닉네임 검색</label><input placeholder="회원 닉네임" /></div>
      </div>
      <div className="tableWrap"><table><thead><tr><th>닉네임</th><th>아이디</th><th>이메일</th><th>역할</th><th>가입일</th></tr></thead><tbody><tr><td colSpan={5}>회원 데이터가 없습니다.</td></tr></tbody></table></div>
    </AdminShell>
  );
}
