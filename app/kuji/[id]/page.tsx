import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getActiveKujiBySlug } from "@/lib/kujis";
import { formatTicketCount, formatWon } from "@/lib/format";

export default async function KujiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getActiveKujiBySlug(id);
  if (!data) notFound();

  const { kuji, lastOnePrizeName } = data;
  const remaining = kuji.totalTickets - kuji.soldTickets;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container grid2">
          <section className="card">
            <span className="badge">KUJI DETAIL</span>
            <h1>{kuji.title}</h1>
            <p className="lead">{kuji.description || "등록된 쿠지 설명이 없습니다."}</p>
            {lastOnePrizeName ? <p className="noticeText">Last One 상품: {lastOnePrizeName}</p> : null}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <Link className="btn btnPrimary" href={`/kuji/${kuji.slug}/queue`}>입장하기</Link>
              <Link className="btn btnSecondary" href="/kuji">목록으로</Link>
            </div>
          </section>
          <aside className="card">
            <h2>판매 현황</h2>
            <div className="statRow"><span>가격</span><strong>{formatWon(kuji.price)}</strong></div>
            <div className="statRow"><span>전체 수량</span><strong>{formatTicketCount(kuji.totalTickets)}</strong></div>
            <div className="statRow"><span>판매 완료</span><strong>{formatTicketCount(kuji.soldTickets)}</strong></div>
            <div className="statRow"><span>남은 수량</span><strong>{formatTicketCount(remaining)}</strong></div>
          </aside>
        </div>
      </main>
    </>
  );
}
