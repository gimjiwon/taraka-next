import Link from "next/link";
import type { Kuji } from "@/types/takara";
import { formatTicketCount, formatWon } from "@/lib/format";

export function KujiCard({ kuji }: { kuji: Kuji }) {
  const remaining = Math.max(kuji.totalTickets - kuji.soldTickets, 0);
  const soldRate = kuji.totalTickets > 0 ? Math.min(100, Math.round((kuji.soldTickets / kuji.totalTickets) * 100)) : 0;

  return (
    <article className="kujiCard card">
      <div className="kujiThumbWrap">
        {kuji.imageUrl ? (
          <img src={kuji.imageUrl} alt={`${kuji.title} 대표 이미지`} className="kujiThumb" />
        ) : (
          <div className="kujiThumbPlaceholder">TAKARA</div>
        )}
        <span className="kujiStatusBadge">진행중</span>
      </div>
      <div className="kujiCardBody">
        <h3>{kuji.title}</h3>
        <p className="muted kujiDesc">{kuji.description || "상세 설명이 등록되지 않았습니다."}</p>
        <div className="progressBlock" aria-label="판매 진행률">
          <div className="progressTop">
            <span>판매 진행률</span>
            <strong>{soldRate}%</strong>
          </div>
          <div className="progressTrack"><div style={{ width: `${soldRate}%` }} /></div>
        </div>
        <div className="kujiMetaGrid">
          <div><span>가격</span><strong>{formatWon(kuji.price)}</strong></div>
          <div><span>남은 수량</span><strong>{formatTicketCount(remaining)}</strong></div>
        </div>
        <div className="kujiCardActions">
          <Link className="btn btnSecondary" href={`/kuji/${kuji.slug}`}>상세보기</Link>
          <Link className="btn btnPrimary" href={`/kuji/${kuji.slug}/queue`}>입장하기</Link>
        </div>
      </div>
    </article>
  );
}
