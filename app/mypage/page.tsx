import { SiteHeader } from "@/components/SiteHeader";

export default function MyPage() {
  return (
    <>
      <SiteHeader />
      <main className="section"><div className="container"><h1>마이페이지</h1><div className="grid3"><div className="card"><h3>보관 상품</h3><strong>0개</strong></div><div className="card"><h3>배송 요청</h3><strong>0건</strong></div><div className="card"><h3>주문</h3><strong>0건</strong></div></div></div></main>
    </>
  );
}
