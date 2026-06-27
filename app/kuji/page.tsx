import { SiteHeader } from "@/components/SiteHeader";
import { KujiCard } from "@/components/KujiCard";
import { getActiveKujis } from "@/lib/kujis";

export default async function KujiListPage() {
  const kujis = await getActiveKujis();

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <span className="badge">LIVE KUJI</span>
          <h1>진행 중인 쿠지</h1>
          <p className="lead">관리자가 공개 상태로 등록한 쿠지가 이 목록에 표시됩니다.</p>
          {kujis.length ? (
            <div className="grid3" style={{ marginTop: 26 }}>
              {kujis.map((kuji) => <KujiCard key={kuji.id} kuji={kuji} />)}
            </div>
          ) : (
            <section className="card" style={{ marginTop: 26 }}>
              <h2>아직 공개된 쿠지가 없습니다.</h2>
              <p className="muted">관리자 페이지에서 쿠지를 등록하고 상태를 ‘진행중’으로 변경하면 여기에 표시됩니다.</p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
