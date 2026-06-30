"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminShippingRequest, ShippingStatus } from "@/lib/shipping";

type Props = {
  requests: AdminShippingRequest[];
};

const statusOptions: Array<{ value: ShippingStatus; label: string }> = [
  { value: "requested", label: "신청완료" },
  { value: "preparing", label: "배송 준비중" },
  { value: "shipped", label: "발송완료" },
  { value: "delivered", label: "배송완료" }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function AdminShippingClient({ requests }: Props) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [localValues, setLocalValues] = useState<Record<string, { status: ShippingStatus; trackingNo: string }>>(() => {
    const entries = requests.map((request) => [request.id, { status: request.status, trackingNo: request.trackingNo ?? "" }] as const);
    return Object.fromEntries(entries);
  });

  function updateLocal(id: string, value: Partial<{ status: ShippingStatus; trackingNo: string }>) {
    setLocalValues((current) => ({
      ...current,
      [id]: {
        status: value.status ?? current[id]?.status ?? "requested",
        trackingNo: value.trackingNo ?? current[id]?.trackingNo ?? ""
      }
    }));
  }

  async function save(requestId: string) {
    setMessage("");
    setSavingId(requestId);
    try {
      const values = localValues[requestId];
      const response = await fetch(`/api/admin/shipping/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.message ?? "배송 상태 변경에 실패했습니다.");
        return;
      }
      setMessage("배송 상태가 저장되었습니다.");
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  if (!requests.length) {
    return <div className="card" style={{ marginTop: 20 }}>배송 신청 데이터가 없습니다.</div>;
  }

  return (
    <div style={{ marginTop: 20 }}>
      {message ? <p className={`noticeText ${message.includes("실패") ? "errorText" : ""}`}>{message}</p> : null}
      <div className="adminShippingList">
        {requests.map((request) => {
          const values = localValues[request.id] ?? { status: request.status, trackingNo: request.trackingNo ?? "" };
          return (
            <article className="card" key={request.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <span className="badge">{statusOptions.find((option) => option.value === request.status)?.label ?? request.status}</span>
                  <h3 style={{ marginTop: 12 }}>{request.userLabel}</h3>
                  <p className="muted">신청일: {formatDate(request.createdAt)}</p>
                </div>
                <div className="adminShippingControls">
                  <select value={values.status} onChange={(event) => updateLocal(request.id, { status: event.target.value as ShippingStatus })}>
                    {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <input value={values.trackingNo} onChange={(event) => updateLocal(request.id, { trackingNo: event.target.value })} placeholder="운송장 번호" />
                  <button className="btn btnPrimary" type="button" disabled={savingId === request.id} onClick={() => save(request.id)}>
                    {savingId === request.id ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>

              <div className="grid2" style={{ marginTop: 18 }}>
                <div>
                  <div className="statRow"><span>수령인</span><strong>{request.recipientName}</strong></div>
                  <div className="statRow"><span>연락처</span><strong>{request.phone}</strong></div>
                  <div className="statRow"><span>우편번호</span><strong>{request.postalCode || "-"}</strong></div>
                  <div className="statRow"><span>상품 수</span><strong>{request.itemCount}개</strong></div>
                </div>
                <div>
                  <p className="noticeText">주소: {request.address}</p>
                  {request.memo ? <p className="noticeText" style={{ marginTop: 10 }}>요청사항: {request.memo}</p> : null}
                  <ul className="compactList">
                    {request.itemLabels.map((label) => <li key={label}>{label}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
