"use client";

import { useMemo, useState } from "react";
import type { ResultItem, RevealMode } from "@/types/takara";

export function ResultReveal({ items, orderId }: { items: ResultItem[]; orderId?: string }) {
  const [mode, setMode] = useState<RevealMode>("ready");
  const [index, setIndex] = useState(-1);
  const [revealTick, setRevealTick] = useState(0);
  const current = index >= 0 ? items[index] : null;
  const isLast = index >= items.length - 1;

  const title = useMemo(() => {
    if (!items.length) return "공개할 결과가 없습니다";
    if (mode === "ready") return "어떤 보물이 기다리고 있을까요?";
    if (mode === "done" || mode === "all_at_once") return "전체 당첨 결과";
    return `${index + 1}번째 보물 공개`;
  }, [items.length, mode, index]);

  const subtitle = useMemo(() => {
    if (!items.length) return "결제된 상품 정보가 없습니다.";
    if (mode === "ready") return "하나씩 열기 또는 한번에 열기를 선택해 보물상자를 열어보세요.";
    if (mode === "all_at_once" || mode === "done") return "이번 쿠지에서 나온 전체 상품을 한눈에 확인할 수 있습니다.";
    return "상자가 열리며 금빛과 함께 상품이 등장합니다.";
  }, [items.length, mode]);

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
    setRevealTick((prev) => prev + 1);
    void persistReveal(nextIndex);
  }

  function showAll() {
    setMode("all_at_once");
    setIndex(items.length - 1);
    setRevealTick((prev) => prev + 1);
    void persistReveal(items.length - 1);
  }

  function finish() {
    setMode("done");
    setRevealTick((prev) => prev + 1);
    void persistReveal(items.length - 1);
  }

  return (
    <div className="revealStage">
      <section className="revealCard revealCardLuxury">
        <span className="badge">TAKARA RESULT</span>
        <h1 className="resultTitle" style={{ marginTop: 18 }}>{title}</h1>
        <p className="revealSubcopy">{subtitle}</p>

        {!items.length && (
          <div style={{ display: "grid", gap: 12, marginTop: 26 }}>
            <p className="muted">결제된 상품 정보가 없습니다.</p>
            <a className="btn btnPrimary" href="/kuji">쿠지 목록으로</a>
          </div>
        )}

        {mode === "ready" && items.length > 0 && (
          <>
            <div className="resultTreasure showcaseChest" aria-hidden="true">
              <div className="resultAura" />
              <div className="resultSparkles">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="resultLid" />
              <div className="resultLatch" />
              <div className="resultBeam" />
              <div className="resultBase"><span>TAKARA</span></div>
            </div>
            <p className="revealHint">결과는 자동으로 보관함에 저장되며, 마지막까지 열면 전체 결과가 정리되어 보여집니다.</p>
            <div className="resultActionRow">
              <button className="btn btnPrimary" onClick={openNext}>하나씩 열기</button>
              <button className="btn btnSecondary revealGhostBtn" onClick={showAll}>한번에 열기</button>
            </div>
          </>
        )}

        {mode === "one_by_one" && current && (
          <>
            <div key={`chest-${revealTick}`} className="resultTreasure openChest premiumChest" aria-hidden="true">
              <div className="resultAura" />
              <div className="resultSparkles intense">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="resultLid" />
              <div className="resultLatch" />
              <div className="resultBeam bright" />
              <div className="resultBase"><span>OPEN</span></div>
            </div>
            <div key={`prize-${revealTick}`} className="glowPrize luxuryPrizeCard">
              <div className="prizeContentCenter">
                {current.imageUrl ? <img src={current.imageUrl} alt="" className="resultPrizeImage" /> : null}
                <div className="rankBadgeLarge">{current.rank}상</div>
                <div className="prizeNameLarge">{current.prizeName}</div>
                <div className="ticketLabel">{current.ticketNo}번 당첨</div>
              </div>
            </div>
            <div className="resultActionRow">
              {!isLast ? (
                <button className="btn btnPrimary" onClick={openNext}>다음 상품 열기</button>
              ) : (
                <button className="btn btnPrimary" onClick={finish}>전체 결과 보기</button>
              )}
              <button className="btn btnSecondary revealGhostBtn" onClick={showAll}>한번에 열기</button>
            </div>
          </>
        )}

        {(mode === "all_at_once" || mode === "done") && (
          <div className="resultSummaryWrap">
            <div className="resultSummaryHead">
              <div>
                <div className="summaryLabel">총 당첨 수량</div>
                <strong>{items.length}개</strong>
              </div>
              <div>
                <div className="summaryLabel">공개 상태</div>
                <strong>전체 공개 완료</strong>
              </div>
            </div>
            <div className="resultGridList">
              {items.map((item, itemIndex) => (
                <div key={`${item.ticketNo}-${item.prizeName}`} className="resultItemCard luxuryResultItem">
                  <div className="resultOrderChip">#{itemIndex + 1}</div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="resultItemThumb" /> : <div className="miniPrizeBox">{item.rank}</div>}
                    <div>
                      <div className="rankBadgeInline">{item.rank}상</div>
                      <strong className="resultItemTitle">{item.prizeName}</strong>
                      <p className="muted" style={{ margin: "6px 0 0" }}>{item.ticketNo}번</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="resultActionRow" style={{ marginTop: 18 }}>
              <a className="btn btnPrimary" href="/storage">보관함 보기</a>
              <a className="btn btnSecondary revealGhostBtn" href="/kuji">다른 쿠지 보기</a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
