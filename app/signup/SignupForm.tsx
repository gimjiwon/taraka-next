"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkDuplicate(target: "login_id" | "nickname" | "email", value: string) {
    setMessage("");
    setChecking(target);
    try {
      const response = await fetch("/api/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, value })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "중복확인에 실패했습니다.");
      setMessage(result.available ? "사용할 수 있습니다." : "이미 사용 중입니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "중복확인에 실패했습니다.");
    } finally {
      setChecking(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, nickname, email, password })
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "회원가입에 실패했습니다.");
      }

      setMessage(result.role === "admin" ? "첫 가입 계정이므로 관리자 권한이 부여되었습니다. 로그인해주세요." : "회원가입이 완료되었습니다. 로그인해주세요.");
      setTimeout(() => router.push("/login"), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h1>회원가입</h1>
      <p className="lead">첫 번째로 가입한 계정은 관리자 권한을 받습니다. 이후 가입자는 일반 회원으로 등록됩니다.</p>
      <form className="formGrid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="loginId">아이디</label>
          <input
            id="loginId"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value.toLowerCase())}
            placeholder="takara_user"
            autoComplete="username"
            required
          />
        </div>
        <button className="btn btnSecondary" type="button" disabled={checking === "login_id"} onClick={() => checkDuplicate("login_id", loginId)}>
          {checking === "login_id" ? "확인 중..." : "아이디 중복확인"}
        </button>
        <div className="field">
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="보물찾는사람"
            required
          />
        </div>
        <button className="btn btnSecondary" type="button" disabled={checking === "nickname"} onClick={() => checkDuplicate("nickname", nickname)}>
          {checking === "nickname" ? "확인 중..." : "닉네임 중복확인"}
        </button>
        <div className="field">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="user@example.com"
            autoComplete="email"
            required
          />
        </div>
        <button className="btn btnSecondary" type="button" disabled={checking === "email"} onClick={() => checkDuplicate("email", email)}>
          {checking === "email" ? "확인 중..." : "이메일 중복확인"}
        </button>
        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
        {message ? <p className="noticeText">{message}</p> : null}
        <button className="btn btnPrimary" disabled={loading} type="submit">
          {loading ? "가입 처리 중..." : "가입하기"}
        </button>
      </form>
    </section>
  );
}
