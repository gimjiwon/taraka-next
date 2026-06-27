import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/guards";
import { getUserStorageItems } from "@/lib/orders";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    none: "보관중",
    requested: "배송 요청",
    preparing: "배송 준비",
    shipped: "배송중",
    delivered: "배송 완료"
  };
  return labels[status] ?? status;
}

export default async function StoragePage() {
  const user = await requireUser();
  const items = await getUserStorageItems(user.id);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <span className="badge">STORAGE</span>
              <h1>보관함</h1>
              <p className="lead">결제 완료 후 당첨 상품이 이곳에 저장됩니다.</p>
            </div>
            <Link className="btn btnSecondary" href="/shipping">배송 신청</Link>
          </div>

          {items.length ? (
            <div className="grid3">
              {items.map((item) => (
                <article className="card" key={item.id}>
                  {item.prizeImageUrl ? <img src={item.prizeImageUrl} alt="" className="kujiImage" /> : null}
                  <span className="badge">{statusLabel(item.shippingStatus)}</span>
                  <h3 style={{ marginTop: 12 }}>{item.rank}상 · {item.prizeName}</h3>
                  <p className="muted" style={{ marginBottom: 14 }}>{item.kujiTitle}</p>
                  <div className="statRow"><span>번호</span><strong>{item.ticketNo}번</strong></div>
                  <div className="statRow"><span>주문번호</span><strong>{item.orderNo}</strong></div>
                  {item.kujiSlug ? <Link className="btn btnSecondary" href={`/kuji/${item.kujiSlug}`} style={{ marginTop: 14 }}>쿠지 보기</Link> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="card">아직 보관 중인 상품이 없습니다.</div>
          )}
        </div>
      </main>
    </>
  );
}
