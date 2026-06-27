import { SiteHeader } from "@/components/SiteHeader";

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <section className="card">
            <h1>회원가입</h1>
            <p className="lead">아이디와 닉네임 중복확인은 DB 연결 후 API로 검증합니다.</p>
            <form className="formGrid">
              <div className="field"><label>아이디</label><input placeholder="takara_user" /></div>
              <button className="btn btnSecondary" type="button">아이디 중복확인</button>
              <div className="field"><label>닉네임</label><input placeholder="보물찾는사람" /></div>
              <button className="btn btnSecondary" type="button">닉네임 중복확인</button>
              <div className="field"><label>이메일</label><input type="email" placeholder="user@example.com" /></div>
              <div className="field"><label>비밀번호</label><input type="password" /></div>
              <button className="btn btnPrimary" type="button">가입하기</button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
