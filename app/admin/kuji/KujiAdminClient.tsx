"use client";

import { useMemo, useState } from "react";

type AdminKujiRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  total_tickets: number;
  status: "draft" | "active" | "paused" | "ended";
  last_one_prize_name: string | null;
  created_at: string;
  sold_count: number;
};

type PrizeFormRow = {
  rank: string;
  name: string;
  quantity: number;
  description: string;
  imageUrl: string;
};

const defaultPrizes: PrizeFormRow[] = [
  { rank: "A", name: "메인 피규어", quantity: 1, description: "", imageUrl: "" },
  { rank: "B", name: "서브 피규어", quantity: 2, description: "", imageUrl: "" },
  { rank: "C", name: "아크릴 스탠드", quantity: 7, description: "", imageUrl: "" },
  { rank: "D", name: "키링/스티커", quantity: 90, description: "", imageUrl: "" }
];

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function statusLabel(status: AdminKujiRow["status"]) {
  const labels = {
    draft: "임시저장",
    active: "진행중",
    paused: "중지",
    ended: "종료"
  } as const;
  return labels[status];
}

function makeClientSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);

  return base || `kuji-${Date.now()}`;
}

export function KujiAdminClient({ initialKujis }: { initialKujis: AdminKujiRow[] }) {
  const [kujis, setKujis] = useState(initialKujis);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(12000);
  const [totalTickets, setTotalTickets] = useState(100);
  const [status, setStatus] = useState<"draft" | "active" | "paused">("draft");
  const [lastOnePrizeName, setLastOnePrizeName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [prizes, setPrizes] = useState<PrizeFormRow[]>(defaultPrizes);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const prizeQuantityTotal = useMemo(
    () => prizes.reduce((sum, prize) => sum + Number(prize.quantity || 0), 0),
    [prizes]
  );

  function updatePrize(index: number, key: keyof PrizeFormRow, value: string | number) {
    setPrizes((current) => current.map((prize, i) => (i === index ? { ...prize, [key]: value } : prize)));
  }

  function addPrizeRow() {
    setPrizes((current) => [...current, { rank: "", name: "", quantity: 1, description: "", imageUrl: "" }]);
  }

  function removePrizeRow(index: number) {
    setPrizes((current) => current.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice(12000);
    setTotalTickets(100);
    setStatus("draft");
    setLastOnePrizeName("");
    setImageUrl("");
    setPrizes(defaultPrizes);
  }

  async function submitKuji(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (prizeQuantityTotal !== Number(totalTickets)) {
      setError(`상품 수량 합계(${prizeQuantityTotal})와 총 티켓 수(${totalTickets})가 같아야 합니다.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/kujis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || makeClientSlug(title),
          description,
          price,
          totalTickets,
          status,
          lastOnePrizeName,
          imageUrl,
          prizes
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "쿠지 등록에 실패했습니다.");
      }

      setMessage(result.message ?? "쿠지가 등록되었습니다.");
      resetForm();
      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "쿠지 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, nextStatus: AdminKujiRow["status"]) {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/kujis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "상태 변경에 실패했습니다.");

      setKujis((current) => current.map((kuji) => (kuji.id === id ? { ...kuji, status: nextStatus } : kuji)));
      setMessage(result.message ?? "상태가 변경되었습니다.");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "상태 변경에 실패했습니다.");
    }
  }

  async function deleteKuji(id: string, titleToDelete: string) {
    const ok = window.confirm(`'${titleToDelete}' 쿠지를 삭제할까요? 등록된 상품과 번호도 함께 삭제됩니다.`);
    if (!ok) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/kujis/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "삭제에 실패했습니다.");

      setKujis((current) => current.filter((kuji) => kuji.id !== id));
      setMessage(result.message ?? "쿠지가 삭제되었습니다.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "삭제에 실패했습니다.");
    }
  }

  return (
    <div className="formGrid" style={{ gap: 22 }}>
      {message ? <p className="noticeText">{message}</p> : null}
      {error ? <p className="noticeText errorText">{error}</p> : null}

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <span className="badge">KUJI CREATE</span>
            <h2 style={{ marginTop: 12 }}>새 쿠지 등록</h2>
            <p className="muted">상품 수량 합계와 총 티켓 수가 같아야 번호가 자동 생성됩니다.</p>
          </div>
          <div className={prizeQuantityTotal === Number(totalTickets) ? "badge" : "badge errorBadge"}>
            상품 수량 합계 {prizeQuantityTotal} / 총 {totalTickets}
          </div>
        </div>

        <form className="formGrid" onSubmit={submitKuji}>
          <div className="grid2">
            <div className="field">
              <label>쿠지명</label>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 원피스 기어5 스페셜 쿠지" required />
            </div>
            <div className="field">
              <label>URL 슬러그</label>
              <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="예: onepiece-gear5-01" />
            </div>
            <div className="field">
              <label>가격</label>
              <input type="number" min="0" value={price} onChange={(event) => setPrice(Number(event.target.value))} required />
            </div>
            <div className="field">
              <label>총 티켓 수</label>
              <input type="number" min="1" value={totalTickets} onChange={(event) => setTotalTickets(Number(event.target.value))} required />
            </div>
            <div className="field">
              <label>상태</label>
              <select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "active" | "paused")}>
                <option value="draft">임시저장</option>
                <option value="active">바로 공개</option>
                <option value="paused">중지</option>
              </select>
            </div>
            <div className="field">
              <label>Last One 상품명</label>
              <input value={lastOnePrizeName} onChange={(event) => setLastOnePrizeName(event.target.value)} placeholder="예: Last One 한정 피규어" />
            </div>
          </div>

          <div className="field">
            <label>대표 이미지 URL</label>
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
          </div>

          <div className="field">
            <label>설명</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="쿠지 설명을 입력하세요." />
          </div>

          <div className="card" style={{ boxShadow: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <h3>상품 구성</h3>
                <p className="muted" style={{ margin: 0 }}>예: A상 1개, B상 2개, C상 7개, D상 90개 = 총 100장</p>
              </div>
              <button className="btn btnSecondary" type="button" onClick={addPrizeRow}>상품 줄 추가</button>
            </div>

            <div className="adminPrizeRows">
              {prizes.map((prize, index) => (
                <div className="adminPrizeRow" key={`${index}-${prize.rank}`}>
                  <div className="field">
                    <label>등급</label>
                    <input value={prize.rank} onChange={(event) => updatePrize(index, "rank", event.target.value)} placeholder="A" required />
                  </div>
                  <div className="field">
                    <label>상품명</label>
                    <input value={prize.name} onChange={(event) => updatePrize(index, "name", event.target.value)} placeholder="상품명" required />
                  </div>
                  <div className="field">
                    <label>수량</label>
                    <input type="number" min="1" value={prize.quantity} onChange={(event) => updatePrize(index, "quantity", Number(event.target.value))} required />
                  </div>
                  <div className="field">
                    <label>이미지 URL</label>
                    <input value={prize.imageUrl} onChange={(event) => updatePrize(index, "imageUrl", event.target.value)} placeholder="선택" />
                  </div>
                  <button className="btn btnDanger" type="button" onClick={() => removePrizeRow(index)} disabled={prizes.length <= 1}>삭제</button>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? "등록 중..." : "쿠지 등록 + 번호 자동 생성"}
          </button>
        </form>
      </section>

      <section className="card">
        <span className="badge">KUJI LIST</span>
        <h2 style={{ marginTop: 12 }}>등록된 쿠지</h2>
        {kujis.length ? (
          <div className="tableWrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>상태</th>
                  <th>쿠지명</th>
                  <th>URL</th>
                  <th>가격</th>
                  <th>판매</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {kujis.map((kuji) => (
                  <tr key={kuji.id}>
                    <td><span className="badge">{statusLabel(kuji.status)}</span></td>
                    <td>{kuji.title}</td>
                    <td>/kuji/{kuji.slug}</td>
                    <td>{formatWon(kuji.price)}</td>
                    <td>{kuji.sold_count} / {kuji.total_tickets}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn btnSecondary" type="button" onClick={() => updateStatus(kuji.id, "active")}>공개</button>
                        <button className="btn btnSecondary" type="button" onClick={() => updateStatus(kuji.id, "paused")}>중지</button>
                        <button className="btn btnSecondary" type="button" onClick={() => updateStatus(kuji.id, "ended")}>종료</button>
                        <button className="btn btnDanger" type="button" onClick={() => deleteKuji(kuji.id, kuji.title)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">아직 등록된 쿠지가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
