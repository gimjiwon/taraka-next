import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ResultPageClient } from "./ResultPageClient";

export default async function ResultPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { id } = await params;
  const { order: orderId } = await searchParams;

  if (!orderId) {
    return (
      <>
        <SiteHeader />
        <main className="section">
          <div className="container">
            <section className="card">
              <span className="badge">TAKARA RESULT</span>
              <h1>결과를 볼 주문이 없습니다</h1>
              <p className="lead">결제를 완료한 뒤 결과를 확인할 수 있습니다.</p>
              <Link className="btn btnPrimary" href="/kuji">쿠지 목록으로</Link>
            </section>
          </div>
        </main>
      </>
    );
  }

  return <ResultPageClient orderId={orderId} expectedSlug={id} />;
}
