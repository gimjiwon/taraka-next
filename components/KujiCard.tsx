import Link from "next/link";
import type { Kuji } from "@/types/takara";
import { formatTicketCount, formatWon } from "@/lib/format";

export function KujiCard({ kuji }: { kuji: Kuji }) {
  const remaining = kuji.totalTickets - kuji.soldTickets;

  return (
    <article className="card">
      {kuji.imageUrl ? <img src={kuji.imageUrl} alt="" className="kujiImage" /> : null}
      <span className="badge">진행중</span>
      <h3 style={{ marginTop: 14 }}>{kuji.title}</h3>
      <p className="muted" style={{ minHeight: 58 }}>{kuji.description}</p>
      <div className="statRow"><span>가격</span><strong>{formatWon(kuji.price)}</strong></div>
      <div className="statRow"><span>남은 수량</span><strong>{formatTicketCount(remaining)}</strong></div>
      <div className="statRow"><span>판매 현황</span><strong>{formatTicketCount(kuji.soldTickets)} / {formatTicketCount(kuji.totalTickets)}</strong></div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <Link className="btn btnPrimary" href={`/kuji/${kuji.slug}`}>상세보기</Link>
        <Link className="btn btnSecondary" href={`/kuji/${kuji.slug}/queue`}>입장하기</Link>
      </div>
    </article>
  );
}
