import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/guards";
import { getOrderSummaryForUser } from "@/lib/orders";
import { PaymentClient } from "./PaymentClient";

export default async function PaymentPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order?: string; ticket?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { order: orderId } = await searchParams;

  if (!orderId) {
    return (
      <>
        <SiteHeader />
        <main className="section">
          <div className="container">
            <section className="card">
              <span className="badge">PAYMENT</span>
              <h1>결제할 주문이 없습니다</h1>
              <p className="lead">번호 선택 화면에서 번호를 먼저 예약해주세요.</p>
              <Link className="btn btnPrimary" href={`/kuji/${id}/select`}>번호 선택으로 돌아가기</Link>
            </section>
          </div>
        </main>
      </>
    );
  }

  const order = await getOrderSummaryForUser(orderId, user.id);
  if (!order || order.kujiSlug !== id) notFound();

  return (
    <>
      <SiteHeader />
      <main className="section">
        <PaymentClient order={order} />
      </main>
    </>
  );
}
