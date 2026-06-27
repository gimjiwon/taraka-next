import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/guards";
import { getMyPageStats } from "@/lib/orders";

export default async function MyPage() {
  const user = await requireUser();
  const stats = await getMyPageStats(user.id);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <span className="badge">MY PAGE</span>
          <h1>마이페이지</h1>
          <div className="grid3">
            <Link className="card" href="/storage" style={{ textDecoration: "none", color: "inherit" }}>
              <h3>보관 상품</h3>
              <strong>{stats.storageCount}개</strong>
            </Link>
            <Link className="card" href="/shipping" style={{ textDecoration: "none", color: "inherit" }}>
              <h3>배송 요청</h3>
              <strong>{stats.shippingCount}건</strong>
            </Link>
            <div className="card">
              <h3>주문</h3>
              <strong>{stats.orderCount}건</strong>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
