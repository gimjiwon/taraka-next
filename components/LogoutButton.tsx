"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store"
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button className="btn btnPrimary" type="button" onClick={logout} disabled={loading}>
      {loading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
