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
  const remaining = Math.max(kuji.totalTickets - kuji.soldTickets, 0);
  const soldRate = kuji.totalTickets > 0 ? Math.min(100, Math.round((kuji.soldTickets / kuji.totalTickets) * 100)) : 0;

  return (
    <>
      <SiteHeader />
      <main className="section detailPage">
        <div className="container detailHero">
          <section className="detailImagePanel card">
            {kuji.imageUrl ? (
              <img src={kuji.imageUrl} alt={`${kuji.title} 대표 이미지`} className="detailImage" />
            ) : (
              <div className="detailImagePlaceholder">TAKARA</div>
            )}
          </section>

          <section className="detailInfoPanel card">
            <span className="badge">KUJI DETAIL</span>
            <h1>{kuji.title}</h1>
            <p className="lead">{kuji.description || "등록된 쿠지 설명이 없습니다."}</p>

            {lastOnePrizeName ? (
              <p className="noticeText">Last One 상품: {lastOnePrizeName}</p>
            ) : null}

            <div className="detailStats">
              <div><span>가격</span><strong>{formatWon(kuji.price)}</strong></div>
              <div><span>남은 수량</span><strong>{formatTicketCount(remaining)}</strong></div>
              <div><span>전체 수량</span><strong>{formatTicketCount(kuji.totalTickets)}</strong></div>
            </div>

            <div className="progressBlock largeProgress" aria-label="판매 진행률">
              <div className="progressTop">
                <span>판매 완료 {formatTicketCount(kuji.soldTickets)} / {formatTicketCount(kuji.totalTickets)}</span>
                <strong>{soldRate}%</strong>
              </div>
              <div className="progressTrack"><div style={{ width: `${soldRate}%` }} /></div>
            </div>

            <div className="detailActions">
              <Link className="btn btnPrimary" href={`/kuji/${kuji.slug}/queue`}>입장하기</Link>
              <Link className="btn btnSecondary" href={`/kuji/${kuji.slug}/select`}>바로 번호 보기</Link>
              <Link className="btn btnSecondary" href="/kuji">목록으로</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
