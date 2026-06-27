"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Ticket } from "@/types/takara";

export function TicketGrid({ tickets, kujiSlug }: { tickets: Ticket[]; kujiSlug: string }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleTicket(ticketNo: number) {
    setSelected((current) =>
      current.includes(ticketNo)
        ? current.filter((no) => no !== ticketNo)
        : [...current, ticketNo].sort((a, b) => a - b)
    );
    setError("");
  }

  function randomSelect() {
    const available = tickets.filter((ticket) => ticket.status === "available" && !selectedSet.has(ticket.ticketNo));
    if (!available.length) return;
    const picked = available[Math.floor(Math.random() * available.length)];
    setSelected((current) => [...current, picked.ticketNo].sort((a, b) => a - b));
    setError("");
  }

  function clearSelected() {
    setSelected([]);
    setError("");
  }

  async function reserveSelected() {
    if (!selected.length) {
      setError("번호를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch("/api/tickets/reserve", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ slug: kujiSlug, ticketNos: selected })
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?next=/kuji/${kujiSlug}/select`;
          return;
        }
        throw new Error(result.message ?? "번호 예약에 실패했습니다.");
      }

      window.location.href = result.paymentUrl ?? `/kuji/${kujiSlug}/payment?order=${result.orderId}`;
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
          <p className="muted">여러 번호를 동시에 선택할 수 있습니다. 같은 번호는 한 장만 구매 가능하며, 결제로 이동하면 2분 동안 선택한 번호들이 예약됩니다.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btnSecondary" type="button" onClick={randomSelect} disabled={loading}>랜덤 추가</button>
          <button className="btn btnSecondary" type="button" onClick={clearSelected} disabled={loading || !selected.length}>선택 초기화</button>
        </div>
      </div>
      <div className="ticketGrid">
        {tickets.map((ticket) => {
          const isSelected = selectedSet.has(ticket.ticketNo);
          return (
            <button
              key={ticket.id}
              type="button"
              className={`ticket ${ticket.status}`}
              aria-pressed={isSelected}
              disabled={ticket.status !== "available" || loading}
              onClick={() => toggleTicket(ticket.ticketNo)}
              style={isSelected ? { outline: "3px solid var(--orange)", background: "#fff7ed", color: "#c2410c" } : undefined}
            >
              {ticket.ticketNo}
            </button>
          );
        })}
      </div>
      {error ? <p className="noticeText errorText">{error}</p> : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
        <strong>{selected.length ? `${selected.length}개 선택됨: ${selected.join(", ")}번` : "선택된 번호 없음"}</strong>
        <button className={`btn ${selected.length ? "btnPrimary" : "btnSecondary"}`} type="button" onClick={reserveSelected} disabled={!selected.length || loading}>
          {loading ? "번호 예약 중..." : "선택 번호 예약 후 결제로 이동"}
        </button>
      </div>
    </div>
  );
}
