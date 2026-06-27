import { SiteHeader } from "@/components/SiteHeader";
import { KujiCard } from "@/components/KujiCard";
import { demoKujis } from "@/lib/mock-data";

export default function KujiListPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <span className="badge">LIVE KUJI</span>
          <h1>진행 중인 쿠지</h1>
          <p className="lead">서버 DB가 연결되면 관리자에서 등록한 쿠지가 이 목록에 자동으로 표시됩니다.</p>
          <div className="grid3" style={{ marginTop: 26 }}>
            {demoKujis.map((kuji) => <KujiCard key={kuji.id} kuji={kuji} />)}
          </div>
        </div>
      </main>
    </>
  );
}
