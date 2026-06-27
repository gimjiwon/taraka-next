"use client";

import { useState } from "react";
import type { Ticket } from "@/types/takara";

export function TicketGrid({ tickets, kujiSlug }: { tickets: Ticket[]; kujiSlug: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function randomSelect() {
    const available = tickets.filter((ticket) => ticket.status === "available");
    if (!available.length) return;
    const picked = available[Math.floor(Math.random() * available.length)];
    setSelected(picked.ticketNo);
    setError("");
  }

  async function reserveSelected() {
    if (!selected) {
      setError("번호를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tickets/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: kujiSlug, ticketNo: selected })
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?next=/kuji/${kujiSlug}/select`;
          return;
        }
        throw new Error(result.message ?? "번호 예약에 실패했습니다.");
      }

      window.location.href = result.paymentUrl ?? `/kuji/${kujiSlug}/payment?order=${result.orderId}&ticket=${selected}`;
    } catch (reserveError) {
      setError(reserveError instanceof Error ? reserveError.message : "번호 예약에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h2>번호 선택</h2>
          <p className="muted">번호를 선택한 뒤 결제로 이동하면 2분 동안 해당 번호가 예약됩니다.</p>
        </div>
        <button className="btn btnSecondary" type="button" onClick={randomSelect} disabled={loading}>랜덤 선택</button>
      </div>
      <div className="ticketGrid">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            className={`ticket ${ticket.status}`}
            aria-pressed={selected === ticket.ticketNo}
            disabled={ticket.status !== "available" || loading}
            onClick={() => {
              setSelected(ticket.ticketNo);
              setError("");
            }}
            style={selected === ticket.ticketNo ? { outline: "3px solid var(--orange)", background: "#fff7ed", color: "#c2410c" } : undefined}
          >
            {ticket.ticketNo}
          </button>
        ))}
      </div>
      {error ? <p className="noticeText errorText">{error}</p> : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
        <strong>{selected ? `${selected}번 선택됨` : "선택된 번호 없음"}</strong>
        <button className={`btn ${selected ? "btnPrimary" : "btnSecondary"}`} type="button" onClick={reserveSelected} disabled={!selected || loading}>
          {loading ? "번호 예약 중..." : "번호 예약 후 결제로 이동"}
        </button>
      </div>
    </div>
  );
}
