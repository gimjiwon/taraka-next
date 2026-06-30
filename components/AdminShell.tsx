import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <Link href="/admin" className="logo">
          <span className="logoMark">✦</span>
          TAKARA
        </Link>
        <div className="badge" style={{ marginTop: 14 }}>ADMIN</div>
        <nav className="sideNav">
          <Link href="/admin">대시보드</Link>
          <Link href="/admin/kuji">쿠지 등록/관리</Link>
          <Link href="/admin/orders">주문 관리</Link>
          <Link href="/admin/shipping">배송 관리</Link>
          <Link href="/admin/members">회원 관리</Link>
          <Link href="/admin/logs">운영 로그</Link>
          <Link href="/">고객 화면</Link>
        </nav>
      </aside>
      <main className="adminMain">{children}</main>
    </div>
  );
}
