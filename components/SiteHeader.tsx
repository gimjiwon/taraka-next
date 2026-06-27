import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,nickname")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

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
          {role === "admin" ? <Link href="/admin">관리자</Link> : null}
        </nav>
        <div className="navActions">
          {user ? (
            <>
              <Link className="btn btnSecondary" href="/mypage">내 정보</Link>
              <Link className="btn btnPrimary" href="/logout">로그아웃</Link>
            </>
          ) : (
            <>
              <Link className="btn btnSecondary" href="/login">로그인</Link>
              <Link className="btn btnPrimary" href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
