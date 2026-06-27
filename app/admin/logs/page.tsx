import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";
import { getAdminLogs } from "@/lib/orders";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

export default async function AdminLogsPage() {
  await requireAdmin();
  const logs = await getAdminLogs();

  return (
    <AdminShell>
      <h1>운영 로그</h1>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>시간</th>
              <th>주체</th>
              <th>동작</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.actorLabel}</td>
                <td>{log.action}</td>
                <td><code>{JSON.stringify(log.detail)}</code></td>
              </tr>
            )) : <tr><td colSpan={4}>로그 데이터가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
