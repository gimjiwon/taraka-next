"use client";

import { useState } from "react";
import type { Ticket } from "@/types/takara";

export function TicketGrid({ tickets }: { tickets: Ticket[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  function randomSelect() {
    const available = tickets.filter((ticket) => ticket.status === "available");
    if (!available.length) return;
    const picked = available[Math.floor(Math.random() * available.length)];
    setSelected(picked.ticketNo);
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h2>번호 선택</h2>
          <p className="muted">신중하게 선택해주세요. 쿠지는 결제 후 환불이 불가합니다.</p>
        </div>
        <button className="btn btnSecondary" type="button" onClick={randomSelect}>랜덤 선택</button>
      </div>
      <div className="ticketGrid">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            className={`ticket ${ticket.status}`}
            aria-pressed={selected === ticket.ticketNo}
            disabled={ticket.status !== "available"}
            onClick={() => setSelected(ticket.ticketNo)}
            style={selected === ticket.ticketNo ? { outline: "3px solid var(--orange)", background: "#fff7ed", color: "#c2410c" } : undefined}
          >
            {ticket.ticketNo}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
        <strong>{selected ? `${selected}번 선택됨` : "선택된 번호 없음"}</strong>
        <a className={`btn ${selected ? "btnPrimary" : "btnSecondary"}`} href={selected ? `./payment?ticket=${selected}` : "#"}>결제로 이동</a>
      </div>
    </div>
  );
}
