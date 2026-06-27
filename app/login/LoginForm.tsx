"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resolveEmail(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.includes("@")) return trimmed;

    const response = await fetch("/api/auth/resolve-login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: trimmed })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || !result.email) {
      throw new Error(result.message || "가입된 아이디를 찾을 수 없습니다.");
    }

    return String(result.email).trim().toLowerCase();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const email = await resolveEmail(identifier);
      const supabase = createSupabaseBrowserClient();

      // 핵심: 브라우저 Supabase 세션을 먼저 생성한다.
      // 번호 예약/결제 API는 이 세션의 access_token을 Authorization 헤더로 받아 로그인 사용자를 확인한다.
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.session || !data.user) {
        throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
      }

      // 서버 컴포넌트/관리자 페이지에서도 같은 세션을 읽을 수 있도록 서버 쿠키도 동기화한다.
      // 실패해도 브라우저 세션은 이미 만들어졌으므로 구매 API는 정상 작동한다.
      await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password })
      }).catch(() => null);

      const next = new URLSearchParams(window.location.search).get("next") || "/";
      window.location.assign(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h1>로그인</h1>
      <p className="lead">가입한 아이디 또는 이메일로 로그인하세요.</p>
      <form className="formGrid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="identifier">아이디 또는 이메일</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="takara_user 또는 user@example.com"
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {message ? <p className="noticeText errorText">{message}</p> : null}
        <button className="btn btnPrimary" disabled={loading} type="submit">
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
      <p className="muted">계정이 없나요? <Link href="/signup">회원가입</Link></p>
    </section>
  );
}
