"use client";

/**
 * StaffProfileView — 직원용 「내 정보」 전체 페이지 (2026-07-13)
 *
 * 사장 ProfileView 와 동일한 룩(아바타 헤더 + card/sectionLabel/row 스타일)의
 *   전체 페이지. 팝업(모달) 아님 — StaffDashboard 가 뷰 전환으로 렌더(뒤로가기로 복귀).
 *
 * ⚠️ 사장 ProfileView 컴포넌트 자체는 useDashboardCtx(DashboardProvider) 에 의존하는데,
 *   직원 라우팅은 그 Provider 바깥이라 재사용 불가 → 같은 룩으로 직원 필수 카드만 구성.
 *   직원 무의미 카드(매장정보·데이터연결·구독·로드맵)는 제외.
 *
 * 카드: ① 계정 정보 ② 소속 가게 ③ 가게 연결(StoreConnectCard) ④ 피드백 ⑤ 계정 관리(로그아웃)
 */

import { useEffect, useState } from "react";
import { ChevronLeft, LogOut } from "lucide-react";
import { styles } from "../../styles";
import { supabase } from "../../../../lib/supabase";
import { FoundOneSpiralLogo } from "../ui/FoundOneSpiralLogo";
import { StoreConnectCard } from "../profile/StoreConnectCard";
import { FeedbackCard } from "../profile/FeedbackCard";

const INK = "#0f172a";

// 사장 ProfileView 룩 미러 (동일 값 복제 — 그쪽은 모듈 로컬 const 라 import 불가)
const card: React.CSSProperties = { ...styles.card, gap: "0px", padding: "0px", overflow: "hidden" };
const sectionLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase",
  letterSpacing: "0.07em", padding: "16px 18px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)",
};
const row: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "13px 18px", borderBottom: "1px solid rgba(0,0,0,0.05)",
};
const rowLast: React.CSSProperties = { ...row, borderBottom: "none" };
const rowKey: React.CSSProperties = { fontSize: "13px", color: "var(--muted)" };
const rowVal: React.CSSProperties = { fontSize: "13px", fontWeight: 500, color: "var(--primary)", textAlign: "right" };

export function StaffProfileView({ storeName, role, ko, onBack, onSignOut, signingOut }: {
  storeName: string;
  role: "staff" | "manager";
  ko: boolean;
  onBack: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data?.user) return;
      setEmail(data.user.email ?? null);
      const meta = data.user.user_metadata as { name?: string } | null;
      setName(meta?.name ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  const avatarLetter = (name ?? email ?? "?").charAt(0).toUpperCase();

  return (
    <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "24px 20px 48px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* 상단: 로고 + 뒤로가기 (사장 화면은 사이드바 네비 — 직원은 뒤로가기로) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 4px", marginBottom: 16 }}>
          <button
            type="button"
            onClick={onBack}
            aria-label={ko ? "뒤로" : "Back"}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 13, fontWeight: 700, padding: "6px 6px 6px 0" }}
          >
            <ChevronLeft size={18} strokeWidth={2.2} />{ko ? "대시보드" : "Back"}
          </button>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <FoundOneSpiralLogo size={24} color="#3A3AC8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: INK, letterSpacing: "-0.03em" }}>
              Found<span style={{ color: "#1d3557" }}>.</span><span style={{ fontWeight: 800 }}>One</span>
            </span>
          </div>
        </div>

        <section style={styles.section}>
          {/* ── 아바타 + 계정 헤더 (사장 미러) ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "linear-gradient(135deg, #3b5c8c 0%, #5f8bb8 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px", fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {avatarLetter}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name ? (ko ? `${name}님` : name) : (email ?? "…")}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ko ? "직원 계정" : "Staff account"}
              </div>
            </div>
          </div>

          {/* ── 카드 1: 계정 정보 ── */}
          <article style={card}>
            <div style={sectionLabel}>{ko ? "계정 정보" : "Account"}</div>
            {name && (
              <div style={row}>
                <span style={rowKey}>{ko ? "이름" : "Name"}</span>
                <span style={rowVal}>{name}</span>
              </div>
            )}
            <div style={row}>
              <span style={rowKey}>{ko ? "이메일" : "Email"}</span>
              <span style={{ ...rowVal, fontSize: "12px", fontFamily: "monospace" }}>{email ?? "…"}</span>
            </div>
            <div style={rowLast}>
              <span style={rowKey}>{ko ? "계정 유형" : "Account type"}</span>
              <span style={{
                fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px",
                background: "rgba(29,53,87,0.10)", color: "#1a7a36", border: "1px solid rgba(29,53,87,0.2)",
              }}>
                {role === "manager" ? (ko ? "매니저" : "Manager") : (ko ? "직원" : "Staff")}
              </span>
            </div>
          </article>

          {/* ── 카드 2: 소속 가게 ── */}
          <article style={{ ...card, marginTop: "12px" }}>
            <div style={sectionLabel}>{ko ? "소속 가게" : "Workplace"}</div>
            <div style={rowLast}>
              <span style={rowKey}>{ko ? "가게" : "Store"}</span>
              <span style={rowVal}>{storeName}</span>
            </div>
          </article>

          {/* ── 카드 3: 가게 연결 (다른 가게 초대 수락·코드 입력) ── */}
          <div style={{ marginTop: "12px" }}>
            <StoreConnectCard ko={ko} />
          </div>

          {/* ── 카드 4: 피드백 (사장 화면과 동일 카드 재사용) ── */}
          <div style={{ marginTop: "12px" }}>
            <FeedbackCard ko={ko} />
          </div>

          {/* ── 카드 5: 계정 관리 ── */}
          <article style={{ ...card, marginTop: "12px" }}>
            <div style={sectionLabel}>{ko ? "계정 관리" : "Account"}</div>
            <div style={rowLast}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{ko ? "로그아웃" : "Sign out"}</span>
              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: "12px", fontWeight: 600, color: "var(--muted)",
                  background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "10px",
                  padding: "8px 14px", cursor: signingOut ? "default" : "pointer", flexShrink: 0,
                  opacity: signingOut ? 0.6 : 1,
                }}
              >
                <LogOut size={13} strokeWidth={1.8} />
                {signingOut ? (ko ? "로그아웃 중…" : "…") : ko ? "로그아웃" : "Sign out"}
              </button>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
