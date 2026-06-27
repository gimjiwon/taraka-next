import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/guards";

export default async function AdminKujiPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <span className="badge">KUJI ADMIN</span>
      <h1>쿠지 등록/관리</h1>
      <div className="grid2">
        <section className="card">
          <h2>기본 정보</h2>
          <form className="formGrid">
            <div className="field"><label>쿠지명</label><input placeholder="예: 원피스 기어5 스페셜 쿠지" /></div>
            <div className="field"><label>가격</label><input type="number" placeholder="12000" /></div>
            <div className="field"><label>총 티켓 수</label><input type="number" placeholder="100" /></div>
            <div className="field"><label>설명</label><textarea placeholder="쿠지 설명" /></div>
            <button className="btn btnPrimary" type="button">쿠지 등록</button>
          </form>
        </section>
        <section className="card">
          <h2>상품·번호 배치</h2>
          <p className="muted">정식 구현에서는 prize와 ticket 테이블을 생성하고 관리자 저장 버튼으로 배치합니다.</p>
          <div className="ticketGrid" style={{ marginTop: 18 }}>
            {Array.from({ length: 50 }, (_, i) => <button className="ticket available" key={i}>{i + 1}</button>)}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
