import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="logo" aria-label="TAKARA home">
          <span className="logoMark">✦</span>
          TAKARA
        </Link>
        <nav className="menu" aria-label="주요 메뉴">
          <Link href="/kuji">쿠지</Link>
          <Link href="/shop">쇼핑몰</Link>
          <Link href="/notice">공지사항</Link>
          <Link href="/storage">보관함</Link>
          <Link href="/mypage">마이페이지</Link>
        </nav>
        <div className="navActions">
          <Link className="btn btnSecondary" href="/login">로그인</Link>
          <Link className="btn btnPrimary" href="/signup">회원가입</Link>
        </div>
      </div>
    </header>
  );
}
