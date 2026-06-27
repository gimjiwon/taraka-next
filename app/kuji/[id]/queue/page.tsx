import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getDemoKuji } from "@/lib/mock-data";

export default async function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kuji = getDemoKuji(id);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <section className="card" style={{ textAlign: "center" }}>
            <span className="badge">QUEUE</span>
            <h1>{kuji.title}</h1>
            <p className="lead">정식 버전에서는 서버 대기열이 현재 입장 가능 여부를 판단합니다.</p>
            <div className="card" style={{ boxShadow: "none", margin: "24px auto", maxWidth: 520 }}>
              <div className="statRow"><span>현재 상태</span><strong>입장 가능</strong></div>
              <div className="statRow"><span>선택 제한</span><strong>3분</strong></div>
              <div className="statRow"><span>결제 제한</span><strong>2분</strong></div>
            </div>
            <Link className="btn btnPrimary" href={`/kuji/${kuji.slug}/select`}>입장하기</Link>
          </section>
        </div>
      </main>
    </>
  );
}
