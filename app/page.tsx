import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { KujiCard } from "@/components/KujiCard";
import { formatTicketCount } from "@/lib/format";
import { getActiveKujis } from "@/lib/kujis";

export default async function HomePage() {
  const activeKujis = await getActiveKujis();
  const featuredKujis = activeKujis.slice(0, 3);
  const totalRemaining = activeKujis.reduce((sum, kuji) => sum + Math.max(kuji.totalTickets - kuji.soldTickets, 0), 0);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="homeHero">
          <div className="container homeHeroGrid">
            <div className="homeHeroCopy">
              <span className="eyebrow">TAKARA ONLINE KUJI</span>
              <h1>
                보물은 항상
                <br />
                <span>기다리고 있다.</span>
              </h1>
              <p className="lead">
                원하는 번호를 직접 선택하고, 결제 후 결과를 확인하세요. 당첨 상품은 보관함에 저장되고 원하는 시점에 배송 신청할 수 있습니다.
              </p>
              <div className="heroActions">
                <Link className="btn btnPrimary" href="/kuji">쿠지 참여하기</Link>
                <Link className="btn btnSecondary" href="/storage">보관함 보기</Link>
              </div>
              <div className="heroMetricGrid" aria-label="서비스 핵심 기능">
                <div>
                  <strong>{activeKujis.length}</strong>
                  <span>진행중 쿠지</span>
                </div>
                <div>
                  <strong>{formatTicketCount(totalRemaining)}</strong>
                  <span>남은 티켓</span>
                </div>
                <div>
                  <strong>배송</strong>
                  <span>보관함 합배송</span>
                </div>
              </div>
            </div>

            <div className="heroShowcase" aria-label="TAKARA 서비스 흐름">
              <div className="treasureBox" aria-hidden="true">
                <div className="treasureLid" />
                <div className="treasureLight" />
                <div className="treasureBase">TAKARA</div>
              </div>
              <div className="flowCard floatingCard one">
                <span>01</span>
                <strong>번호 선택</strong>
                <small>남은 티켓 중 원하는 번호를 선택</small>
              </div>
              <div className="flowCard floatingCard two">
                <span>02</span>
                <strong>결과 공개</strong>
                <small>결제 후 당첨 상품 확인</small>
              </div>
              <div className="flowCard floatingCard three">
                <span>03</span>
                <strong>보관 · 배송</strong>
                <small>보관함에서 배송 신청</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container sectionHead">
            <div>
              <span className="badge">LIVE KUJI</span>
              <h2>지금 참여할 수 있는 쿠지</h2>
              <p className="muted">관리자가 공개한 쿠지만 표시됩니다. 이미지는 관리자 업로드 기능과 연결됩니다.</p>
            </div>
            <Link className="btn btnSecondary" href="/kuji">전체 보기</Link>
          </div>
          <div className="container">
            {featuredKujis.length ? (
              <div className="grid3">
                {featuredKujis.map((kuji) => <KujiCard key={kuji.id} kuji={kuji} />)}
              </div>
            ) : (
              <section className="card emptyState">
                <span className="badge">READY</span>
                <h2>아직 공개된 쿠지가 없습니다.</h2>
                <p className="muted">관리자 페이지에서 쿠지를 등록하고 상태를 진행중으로 변경하면 메인에 표시됩니다.</p>
                <Link className="btn btnPrimary" href="/admin/kuji">관리자 쿠지 등록</Link>
              </section>
            )}
          </div>
        </section>

        <section className="section softSection">
          <div className="container grid3">
            <article className="featureCard">
              <span>번호 선택</span>
              <h3>직접 고르는 쿠지 경험</h3>
              <p>남아 있는 번호를 확인하고 여러 장을 한 번에 선택할 수 있습니다.</p>
            </article>
            <article className="featureCard">
              <span>보관함</span>
              <h3>당첨 상품 자동 저장</h3>
              <p>결제 완료 후 공개된 결과는 보관함에 저장됩니다.</p>
            </article>
            <article className="featureCard">
              <span>배송 관리</span>
              <h3>관리자 배송 처리</h3>
              <p>배송 신청, 상태 변경, 운송장 입력까지 관리자에서 처리합니다.</p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
