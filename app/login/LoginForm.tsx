"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "로그인에 실패했습니다.");
      }

      const next = new URLSearchParams(window.location.search).get("next") || "/";
      window.location.href = next;
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
