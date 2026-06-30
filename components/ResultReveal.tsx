"use client";

import { useMemo, useState } from "react";
import type { ResultItem, RevealMode } from "@/types/takara";

export function ResultReveal({ items, orderId }: { items: ResultItem[]; orderId?: string }) {
  const [mode, setMode] = useState<RevealMode>("ready");
  const [index, setIndex] = useState(-1);
  const current = index >= 0 ? items[index] : null;
  const isLast = index >= items.length - 1;

  const title = useMemo(() => {
    if (!items.length) return "공개할 결과가 없습니다";
    if (mode === "ready") return "보물상자를 열어 결과를 확인하세요";
    if (mode === "done" || mode === "all_at_once") return "전체 결과";
    return `${index + 1}번째 보물 공개`;
  }, [items.length, mode, index]);

  async function persistReveal(nextIndex: number) {
    if (!orderId) return;
    await fetch("/api/result/reveal", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId, revealedIndex: nextIndex })
    }).catch(() => null);
  }

  function openNext() {
    const nextIndex = Math.min(index + 1, items.length - 1);
    setMode("one_by_one");
    setIndex(nextIndex);
    void persistReveal(nextIndex);
  }

  function showAll() {
    setMode("all_at_once");
    setIndex(items.length - 1);
    void persistReveal(items.length - 1);
  }

  function finish() {
    setMode("done");
    void persistReveal(items.length - 1);
  }

  return (
    <div className="revealStage">
      <section className="revealCard">
        <span className="badge">TAKARA RESULT</span>
        <h1 style={{ fontSize: "clamp(34px, 7vw, 62px)", marginTop: 18 }}>{title}</h1>

        {!items.length && (
          <div style={{ display: "grid", gap: 12, marginTop: 26 }}>
            <p className="muted">결제된 상품 정보가 없습니다.</p>
            <a className="btn btnPrimary" href="/kuji">쿠지 목록으로</a>
          </div>
        )}

        {mode === "ready" && items.length > 0 && (
          <>
            <div className="resultTreasure readyChest" aria-hidden="true">
              <div className="resultLid" />
              <div className="resultBeam" />
              <div className="resultBase">TAKARA</div>
            </div>
            <p className="revealHint">결과는 보관함에 자동 저장됩니다.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <button className="btn btnPrimary" onClick={openNext}>하나씩 열기</button>
              <button className="btn btnSecondary" onClick={showAll}>한번에 열기</button>
            </div>
          </>
        )}

        {mode === "one_by_one" && current && (
          <>
            <div className="resultTreasure openChest" aria-hidden="true">
              <div className="resultLid" />
              <div className="resultBeam" />
              <div className="resultBase">OPEN</div>
            </div>
            <div className="glowPrize">
              <div>
                {current.imageUrl ? <img src={current.imageUrl} alt="" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 24, marginBottom: 18 }} /> : null}
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
              <div key={`${item.ticketNo}-${item.prizeName}`} className="resultItemCard">
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 16 }} /> : <div className="miniPrizeBox">{item.rank}</div>}
                  <div>
                    <strong>{item.rank}상 · {item.prizeName}</strong>
                    <p className="muted" style={{ margin: "6px 0 0" }}>{item.ticketNo}번</p>
                  </div>
                </div>
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
