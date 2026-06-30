"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResultReveal } from "@/components/ResultReveal";
import type { PaymentOrderSummary } from "@/lib/orders";
import type { ResultItem } from "@/types/takara";

type ResultPayload = {
  order: PaymentOrderSummary;
  items: ResultItem[];
};

export function ResultPageClient({ orderId, expectedSlug }: { orderId: string; expectedSlug: string }) {
  const [payload, setPayload] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadResult() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/result?order=${encodeURIComponent(orderId)}`, {
        credentials: "include"
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message ?? "결과를 불러오지 못했습니다.");
      if (result.order.kujiSlug !== expectedSlug) throw new Error("현재 쿠지의 주문 결과가 아닙니다.");
      setPayload({ order: result.order, items: result.items });
    } catch (resultError) {
      setError(resultError instanceof Error ? resultError.message : "결과를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResult();
  }, [orderId]);

  if (loading) {
    return (
      <div className="revealStage">
        <section className="revealCard">
          <span className="badge">TAKARA RESULT</span>
          <h1>결과 확인 중...</h1>
          <p className="muted">결제된 상품 정보를 불러오고 있습니다.</p>
        </section>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="revealStage">
        <section className="revealCard">
          <span className="badge">TAKARA RESULT</span>
          <h1>결과를 불러오지 못했습니다</h1>
          {error ? <p className="noticeText errorText">{error}</p> : null}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnSecondary" type="button" onClick={loadResult}>다시 시도</button>
            <Link className="btn btnPrimary" href={`/login?next=/kuji/${expectedSlug}/result?order=${orderId}`}>다시 로그인</Link>
          </div>
        </section>
      </div>
    );
  }

  return <ResultReveal items={payload.items} orderId={payload.order.id} />;
}
