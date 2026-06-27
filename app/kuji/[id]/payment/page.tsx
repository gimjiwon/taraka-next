import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { DeadlineTimer } from "@/components/DeadlineTimer";
import { getDemoKuji } from "@/lib/mock-data";
import { formatWon } from "@/lib/format";

export default async function PaymentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ticket?: string }> }) {
  const { id } = await params;
  const { ticket } = await searchParams;
  const kuji = getDemoKuji(id);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container grid2">
          <section className="card">
            <span className="badge">PAYMENT</span>
            <h1>결제</h1>
            <p className="lead">결제 제한 시간 안에 결제를 완료해야 번호가 확정됩니다.</p>
            <div className="statRow"><span>쿠지</span><strong>{kuji.title}</strong></div>
            <div className="statRow"><span>선택 번호</span><strong>{ticket ?? "미선택"}번</strong></div>
            <div className="statRow"><span>결제 금액</span><strong>{formatWon(kuji.price)}</strong></div>
            <div className="statRow"><span>남은 결제 시간</span><strong><DeadlineTimer seconds={120} /></strong></div>
          </section>
          <section className="card">
            <h2>결제 수단 선택</h2>
            <div className="formGrid">
              <label className="card" style={{ boxShadow: "none" }}><input type="radio" name="pay" defaultChecked /> 간편 결제</label>
              <label className="card" style={{ boxShadow: "none" }}><input type="radio" name="pay" /> 카드 결제</label>
              <label className="card" style={{ boxShadow: "none" }}><input type="radio" name="pay" /> 계좌이체</label>
            </div>
            <Link className="btn btnPrimary" style={{ marginTop: 20, width: "100%" }} href={`/kuji/${kuji.slug}/result?ticket=${ticket ?? "12"}`}>결제 완료 시뮬레이션</Link>
          </section>
        </div>
      </main>
    </>
  );
}
