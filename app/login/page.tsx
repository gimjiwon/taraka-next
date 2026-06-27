import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <section className="card">
            <h1>로그인</h1>
            <p className="lead">Supabase Auth 연결 후 실제 로그인으로 전환됩니다.</p>
            <form className="formGrid">
              <div className="field"><label>아이디 또는 이메일</label><input placeholder="user@example.com" /></div>
              <div className="field"><label>비밀번호</label><input type="password" /></div>
              <button className="btn btnPrimary" type="button">로그인</button>
            </form>
            <p className="muted">계정이 없나요? <Link href="/signup">회원가입</Link></p>
          </section>
        </div>
      </main>
    </>
  );
}
