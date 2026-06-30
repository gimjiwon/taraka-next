"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ShippingStorageItem } from "@/lib/shipping";

type Props = {
  items: ShippingStorageItem[];
};

type FormState = {
  recipientName: string;
  phone: string;
  postalCode: string;
  address1: string;
  address2: string;
  memo: string;
};

const initialForm: FormState = {
  recipientName: "",
  phone: "",
  postalCode: "",
  address1: "",
  address2: "",
  memo: ""
};

export function ShippingClient({ items }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItems = useMemo(() => items.filter((item) => selectedIds.includes(item.id)), [items, selectedIds]);

  function toggleItem(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelectedIds((current) => current.length === items.length ? [] : items.map((item) => item.id));
  }

  async function submit() {
    setMessage("");

    if (!selectedIds.length) {
      setMessage("배송 신청할 상품을 선택해주세요.");
      return;
    }

    if (!form.recipientName.trim() || !form.phone.trim() || !form.address1.trim()) {
      setMessage("수령인, 연락처, 기본주소는 필수입니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/shipping/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, storageItemIds: selectedIds })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(result.message ?? "배송 신청에 실패했습니다.");
        return;
      }

      setMessage("배송 신청이 완료되었습니다.");
      setSelectedIds([]);
      setForm(initialForm);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid2" style={{ alignItems: "start", marginTop: 22 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <h2>상품 선택</h2>
            <p className="muted">배송 상태가 ‘보관중’인 상품만 신청할 수 있습니다.</p>
          </div>
          {items.length ? <button className="btn btnSecondary" type="button" onClick={toggleAll}>{selectedIds.length === items.length ? "전체 해제" : "전체 선택"}</button> : null}
        </div>

        {items.length ? (
          <div className="selectableList">
            {items.map((item) => (
              <label className={`selectableItem ${selectedIds.includes(item.id) ? "selected" : ""}`} key={item.id}>
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleItem(item.id)} />
                <span>
                  <strong>{item.rank}상 · {item.prizeName}</strong>
                  <small>{item.kujiTitle} / {item.ticketNo}번 / {item.orderNo}</small>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="noticeText">현재 배송 신청 가능한 보관 상품이 없습니다.</p>
        )}
      </div>

      <div className="card">
        <h2>배송지 입력</h2>
        <p className="muted">선택 상품 {selectedItems.length}개를 한 번에 배송 신청합니다.</p>
        <div className="formGrid" style={{ marginTop: 16 }}>
          <div className="field">
            <label>수령인</label>
            <input value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} placeholder="홍길동" />
          </div>
          <div className="field">
            <label>연락처</label>
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="010-0000-0000" />
          </div>
          <div className="field">
            <label>우편번호</label>
            <input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} placeholder="선택 입력" />
          </div>
          <div className="field">
            <label>기본주소</label>
            <input value={form.address1} onChange={(event) => setForm({ ...form, address1: event.target.value })} placeholder="도로명/지번 주소" />
          </div>
          <div className="field">
            <label>상세주소</label>
            <input value={form.address2} onChange={(event) => setForm({ ...form, address2: event.target.value })} placeholder="동/호수 등" />
          </div>
          <div className="field">
            <label>배송 요청사항</label>
            <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} placeholder="부재 시 문 앞에 놓아주세요." />
          </div>
          {message ? <p className={`noticeText ${message.includes("실패") || message.includes("선택") || message.includes("필수") ? "errorText" : ""}`}>{message}</p> : null}
          <button className="btn btnPrimary" type="button" onClick={submit} disabled={isSubmitting || !items.length}>
            {isSubmitting ? "신청 중..." : "배송 신청하기"}
          </button>
        </div>
      </div>
    </section>
  );
}
