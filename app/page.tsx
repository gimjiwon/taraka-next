import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { KujiCard } from "@/components/KujiCard";
import { demoKujis } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container heroGrid">
            <div>
              <span className="eyebrow">보물은 항상 기다리고 있다.</span>
              <h1>온라인 쿠지와 <span>애니 굿즈</span>를 한 곳에서</h1>
              <p className="lead">원하는 번호를 고르고, 결과를 확인하고, 당첨 상품은 보관함에서 합배송하세요.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                <Link className="btn btnPrimary" href="/kuji">쿠지 참여하기</Link>
                <Link className="btn btnSecondary" href="/shop">쇼핑몰 보기</Link>
              </div>
            </div>
            <div className="card">
              <span className="badge">실시간 판매 현황</span>
              <h2 style={{ marginTop: 16 }}>남은 수량을 확인하고 번호를 선택하세요.</h2>
              {demoKujis.slice(0, 3).map((kuji) => (
                <div className="statRow" key={kuji.id}>
                  <span>{kuji.title}</span>
                  <strong>{kuji.totalTickets - kuji.soldTickets}장</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <h2>진행중인 쿠지</h2>
            <div className="grid3">
              {demoKujis.map((kuji) => <KujiCard key={kuji.id} kuji={kuji} />)}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
