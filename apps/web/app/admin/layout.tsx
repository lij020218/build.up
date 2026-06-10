"use client";

/**
 * /admin 레이아웃 — 좌측 사이드바 + 상단바 셸. AdminGuard 로 감싼다.
 *   세션이 클라이언트 측이라 client component. 디자인 토큰은 Found.One 공통.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard, useAdminEmail } from "../lib/components/admin/AdminGuard";
import { BG, NAVY, MUTED, BORDER } from "../lib/components/admin/ui";

const NAV = [
  { href: "/admin", label: "개요", exact: true },
  { href: "/admin/feedback", label: "피드백" },
  { href: "/admin/applications", label: "지원사업 신청" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/revenue", label: "매출·구독" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <Shell>{children}</Shell>
    </AdminGuard>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const email = useAdminEmail();

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Pretendard, -apple-system, sans-serif", display: "flex" }}>
      {/* 사이드바 */}
      <aside
        style={{
          width: 224, flexShrink: 0, background: "#fff", borderRight: `1px solid ${BORDER}`,
          padding: "22px 14px", position: "sticky", top: 0, height: "100vh", boxSizing: "border-box",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 8px 18px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1d3557,#191970)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>F</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#16181d", letterSpacing: "-0.01em" }}>Admin</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "9px 12px", borderRadius: 9, fontSize: 13.5, fontWeight: active ? 700 : 500,
                  color: active ? NAVY : "#3a3f49",
                  background: active ? "rgba(29,53,87,0.07)" : "transparent",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", padding: "12px 10px 0", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 8, wordBreak: "break-all" }}>{email ?? ""}</div>
          <Link href="/" style={{ fontSize: 12.5, color: MUTED, textDecoration: "none" }}>← 앱으로 돌아가기</Link>
        </div>
      </aside>

      {/* 콘텐츠 */}
      <main style={{ flex: 1, minWidth: 0, padding: "32px 36px", maxWidth: 1100 }}>{children}</main>
    </div>
  );
}
