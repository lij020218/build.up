"use client";

/**
 * AdminGuard — /admin 클라이언트 가드(UX). 실제 보안 경계는 /api/admin/* 의 requireAdmin.
 *   마운트 시 /api/admin/me 프로브:
 *     200 → children 렌더(+ 마스킹 이메일을 컨텍스트로 공유)
 *     401 → /auth 로 이동(로그인 필요)
 *     403 → 권한 없음 카드(홈 링크)
 */
import { createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { useAdminFetch } from "./useAdminFetch";
import { Card, MUTED, NAVY, BG } from "./ui";

const AdminEmailContext = createContext<string | null>(null);
export function useAdminEmail() {
  return useContext(AdminEmailContext);
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { data, loading, status } = useAdminFetch<{ ok: boolean; email?: string }>("/api/admin/me");

  if (loading) {
    return <CenteredNote>확인 중…</CenteredNote>;
  }

  if (status === 401) {
    if (typeof window !== "undefined") window.location.replace("/auth");
    return <CenteredNote>로그인이 필요합니다…</CenteredNote>;
  }

  if (status === 403 || !data?.ok) {
    return (
      <CenteredNote>
        <Card style={{ padding: "28px 32px", maxWidth: 380, textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#16181d", marginBottom: 8 }}>접근 권한이 없습니다</div>
          <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 18px" }}>
            이 페이지는 Found.One 관리자만 볼 수 있습니다.
          </p>
          <Link href="/" style={{ display: "inline-block", padding: "10px 20px", borderRadius: 10, background: NAVY, color: "#fff", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
            홈으로
          </Link>
        </Card>
      </CenteredNote>
    );
  }

  return <AdminEmailContext.Provider value={data.email ?? null}>{children}</AdminEmailContext.Provider>;
}

function CenteredNote({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Pretendard, -apple-system, sans-serif", color: MUTED, fontSize: 14 }}>
      {children}
    </div>
  );
}
