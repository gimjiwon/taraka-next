import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getActiveKujiBySlug } from "@/lib/kujis";

export default async function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getActiveKujiBySlug(id);
  if (!data) notFound();

  const { kuji } = data;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <section className="card" style={{ textAlign: "center" }}>
            <span className="badge">QUEUE</span>
            <h1>{kuji.title}</h1>
            <p className="lead">현재 테스트 단계에서는 바로 번호 선택 화면으로 입장합니다. 다음 단계에서 서버 대기열을 실제로 연결합니다.</p>
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
