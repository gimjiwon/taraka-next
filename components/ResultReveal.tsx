"use client";

import { useMemo, useState } from "react";
import type { ResultItem, RevealMode } from "@/types/takara";

export function ResultReveal({ items }: { items: ResultItem[] }) {
  const [mode, setMode] = useState<RevealMode>("ready");
  const [index, setIndex] = useState(-1);
  const current = index >= 0 ? items[index] : null;
  const isLast = index >= items.length - 1;

  const title = useMemo(() => {
    if (mode === "ready") return "결과 공개 방식을 선택하세요";
    if (mode === "done" || mode === "all_at_once") return "전체 결과";
    return `${index + 1}번째 상품 공개`;
  }, [mode, index]);

  function openNext() {
    setMode("one_by_one");
    setIndex((prev) => Math.min(prev + 1, items.length - 1));
  }

  function showAll() {
    setMode("all_at_once");
    setIndex(items.length - 1);
  }

  function finish() {
    setMode("done");
  }

  return (
    <div className="revealStage">
      <section className="revealCard">
        <span className="badge">TAKARA RESULT</span>
        <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)", marginTop: 18 }}>{title}</h1>

        {mode === "ready" && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <button className="btn btnPrimary" onClick={openNext}>하나씩 열기</button>
            <button className="btn btnSecondary" onClick={showAll}>한번에 열기</button>
          </div>
        )}

        {mode === "one_by_one" && current && (
          <>
            <div className="glowPrize">
              <div>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>{current.rank}상</div>
                <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8 }}>{current.prizeName}</div>
                <div className="muted" style={{ marginTop: 8 }}>{current.ticketNo}번</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              {!isLast ? (
                <button className="btn btnPrimary" onClick={openNext}>다음 상품 열기</button>
              ) : (
                <button className="btn btnPrimary" onClick={finish}>전체 결과 보기</button>
              )}
              <button className="btn btnSecondary" onClick={showAll}>한번에 열기</button>
            </div>
          </>
        )}

        {(mode === "all_at_once" || mode === "done") && (
          <div style={{ display: "grid", gap: 12, marginTop: 26 }}>
            {items.map((item) => (
              <div key={`${item.ticketNo}-${item.prizeName}`} className="card" style={{ color: "var(--text)", textAlign: "left", boxShadow: "none" }}>
                <strong>{item.rank}상 · {item.prizeName}</strong>
                <p className="muted" style={{ margin: "6px 0 0" }}>{item.ticketNo}번</p>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <a className="btn btnPrimary" href="/storage">보관함 보기</a>
              <a className="btn btnSecondary" href="/kuji">다른 쿠지 보기</a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
