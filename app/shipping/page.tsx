import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/guards";
import { getShippableStorageItems, getUserShippingRequests } from "@/lib/shipping";
import { ShippingClient } from "./ShippingClient";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    requested: "신청완료",
    preparing: "배송 준비중",
    shipped: "발송완료",
    delivered: "배송완료"
  };
  return labels[status] ?? status;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function ShippingPage() {
  const user = await requireUser();
  const [items, requests] = await Promise.all([
    getShippableStorageItems(user.id),
    getUserShippingRequests(user.id)
  ]);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <span className="badge">SHIPPING</span>
          <h1>배송 신청</h1>
          <p className="lead">보관중인 상품을 선택해서 합배송을 신청할 수 있습니다.</p>

          <ShippingClient items={items} />

          <section style={{ marginTop: 32 }}>
            <h2>배송 신청 내역</h2>
            {requests.length ? (
              <div className="grid2" style={{ marginTop: 16 }}>
                {requests.map((request) => (
                  <article className="card" key={request.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="badge">{statusLabel(request.status)}</span>
                      <span className="muted">{formatDate(request.createdAt)}</span>
                    </div>
                    <h3 style={{ marginTop: 14 }}>{request.recipientName}</h3>
                    <p className="muted" style={{ lineHeight: 1.6 }}>{request.address}</p>
                    <div className="statRow"><span>연락처</span><strong>{request.phone}</strong></div>
                    <div className="statRow"><span>상품 수</span><strong>{request.itemCount}개</strong></div>
                    <div className="statRow"><span>운송장</span><strong>{request.trackingNo || "등록 전"}</strong></div>
                    {request.memo ? <p className="noticeText">요청사항: {request.memo}</p> : null}
                    <ul className="compactList">
                      {request.itemLabels.slice(0, 5).map((label) => <li key={label}>{label}</li>)}
                      {request.itemLabels.length > 5 ? <li>외 {request.itemLabels.length - 5}개</li> : null}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <div className="card" style={{ marginTop: 16 }}>아직 배송 신청 내역이 없습니다.</div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
