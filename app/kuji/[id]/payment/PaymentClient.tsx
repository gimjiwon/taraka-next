"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeadlineTimer } from "@/components/DeadlineTimer";
import { formatWon } from "@/lib/format";
import type { PaymentOrderSummary } from "@/lib/orders";

export function PaymentClient({ orderId, expectedSlug }: { orderId: string; expectedSlug: string }) {
  const [order, setOrder] = useState<PaymentOrderSummary | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOrder() {
    setLoadingOrder(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/summary?order=${encodeURIComponent(orderId)}`, {
        credentials: "include"
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message ?? "주문을 불러오지 못했습니다.");
      if (result.order.kujiSlug !== expectedSlug) throw new Error("현재 쿠지의 주문 정보가 아닙니다.");
      setOrder(result.order);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "주문을 불러오지 못했습니다.");
    } finally {
      setLoadingOrder(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  async function completePayment() {
    if (!order) return;
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/payment/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "결제 처리에 실패했습니다.");

      setMessage("결제가 완료되었습니다. 결과 페이지로 이동합니다.");
      window.location.href = result.resultUrl ?? `/kuji/${order.kujiSlug}/result?order=${order.id}`;
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "결제 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelPayment() {
    if (!order) return;
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/tickets/release", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "예약 취소에 실패했습니다.");
      window.location.href = `/kuji/${order.kujiSlug}/select`;
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "예약 취소에 실패했습니다.");
      setLoading(false);
    }
  }

  if (loadingOrder) {
    return (
      <div className="container">
        <section className="card">
          <span className="badge">PAYMENT</span>
          <h1>주문 확인 중...</h1>
          <p className="lead">선택한 번호와 결제 정보를 불러오고 있습니다.</p>
        </section>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <section className="card">
          <span className="badge">PAYMENT</span>
          <h1>결제 정보를 불러오지 못했습니다</h1>
          {error ? <p className="noticeText errorText">{error}</p> : null}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnSecondary" type="button" onClick={loadOrder}>다시 시도</button>
            <Link className="btn btnPrimary" href={`/login?next=/kuji/${expectedSlug}/select`}>다시 로그인</Link>
          </div>
        </section>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const isPending = order.status === "pending";
  const secondsLeft = order.lockedUntil ? Math.max(0, Math.floor((new Date(order.lockedUntil).getTime() - Date.now()) / 1000)) : 0;

  return (
    <div className="container grid2">
      <section className="card">
        <span className="badge">PAYMENT</span>
        <h1>결제</h1>
        <p className="lead">결제 제한 시간 안에 결제를 완료해야 선택한 번호가 확정됩니다.</p>
        <div className="statRow"><span>주문번호</span><strong>{order.orderNo}</strong></div>
        <div className="statRow"><span>쿠지</span><strong>{order.kujiTitle}</strong></div>
        <div className="statRow"><span>선택 번호</span><strong>{order.ticketNos.length ? `${order.ticketNos.join(", ")}번` : "-"}</strong></div>
        <div className="statRow"><span>선택 수량</span><strong>{order.ticketNos.length || 1}개</strong></div>
        <div className="statRow"><span>결제 금액</span><strong>{formatWon(order.amount)}</strong></div>
        <div className="statRow"><span>주문 상태</span><strong>{statusLabel(order.status)}</strong></div>
        {isPending ? (
          <div className="statRow"><span>남은 결제 시간</span><strong><DeadlineTimer seconds={secondsLeft || 1} onExpire={() => setError("결제 제한 시간이 만료되었습니다. 다시 번호를 선택해주세요.")} /></strong></div>
        ) : null}
      </section>

      <section className="card">
        <h2>결제 수단 선택</h2>
        <p className="muted">현재는 PG 연동 전 단계라 실제 결제 대신 결제 완료 시뮬레이션으로 주문을 확정합니다.</p>
        <div className="formGrid">
          <label className="card" style={{ boxShadow: "none" }}><input type="radio" name="pay" defaultChecked /> 간편 결제</label>
          <label className="card" style={{ boxShadow: "none" }}><input type="radio" name="pay" /> 카드 결제</label>
          <label className="card" style={{ boxShadow: "none" }}><input type="radio" name="pay" /> 계좌이체</label>
        </div>

        {message ? <p className="noticeText">{message}</p> : null}
        {error ? <p className="noticeText errorText">{error}</p> : null}

        {isPaid ? (
          <a className="btn btnPrimary" style={{ marginTop: 20, width: "100%" }} href={`/kuji/${order.kujiSlug}/result?order=${order.id}`}>결과 보기</a>
        ) : (
          <>
            <button className="btn btnPrimary" style={{ marginTop: 20, width: "100%" }} type="button" onClick={completePayment} disabled={!isPending || loading || secondsLeft <= 0}>
              {loading ? "처리 중..." : "결제 완료 시뮬레이션"}
            </button>
            <button className="btn btnSecondary" style={{ marginTop: 10, width: "100%" }} type="button" onClick={cancelPayment} disabled={loading || !isPending}>
              번호 예약 취소
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function statusLabel(status: PaymentOrderSummary["status"]) {
  const labels: Record<PaymentOrderSummary["status"], string> = {
    pending: "결제 대기",
    paid: "결제 완료",
    failed: "결제 실패",
    cancelled: "취소",
    refunded: "환불"
  };
  return labels[status] ?? status;
}
