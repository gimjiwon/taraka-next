import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getDemoKuji } from "@/lib/mock-data";
import { formatTicketCount, formatWon } from "@/lib/format";

export default async function KujiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kuji = getDemoKuji(id);
  const remaining = kuji.totalTickets - kuji.soldTickets;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container grid2">
          <section className="card">
            <span className="badge">KUJI DETAIL</span>
            <h1>{kuji.title}</h1>
            <p className="lead">{kuji.description}</p>
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
