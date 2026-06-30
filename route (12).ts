import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";
import { getAdminMembers } from "@/lib/orders";

function roleLabel(role: string) {
  return role === "admin" ? "관리자" : "일반회원";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminMembersPage() {
  await requireAdmin();
  const members = await getAdminMembers();

  return (
    <AdminShell>
      <h1>회원 관리</h1>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>닉네임</th>
              <th>아이디</th>
              <th>이메일</th>
              <th>역할</th>
              <th>가입일</th>
            </tr>
          </thead>
          <tbody>
            {members.length ? members.map((member) => (
              <tr key={member.id}>
                <td>{member.nickname}</td>
                <td>{member.loginId}</td>
                <td>{member.email ?? "-"}</td>
                <td><span className="badge">{roleLabel(member.role)}</span></td>
                <td>{formatDate(member.createdAt)}</td>
              </tr>
            )) : <tr><td colSpan={5}>회원 데이터가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
