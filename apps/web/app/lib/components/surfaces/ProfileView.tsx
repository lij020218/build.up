"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { supabase } from "../../../../lib/supabase";
import { PortOneConnectCard } from "../profile/PortOneConnectCard";
import { TossPlaceConnectCard } from "../profile/TossPlaceConnectCard";
import { CsvUploadCard } from "../profile/CsvUploadCard";
import { CodefConnectCard } from "../profile/CodefConnectCard";

// ── Local styles ──
const card: React.CSSProperties = {
  ...styles.card,
  gap: "0px",
  padding: "0px",
  overflow: "hidden",
};
const sectionLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  padding: "16px 18px 12px",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};
const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "13px 18px",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
};
const rowLast: React.CSSProperties = {
  ...row,
  borderBottom: "none",
};
const rowKey: React.CSSProperties = { fontSize: "13px", color: "var(--muted)" };
const rowVal: React.CSSProperties = { fontSize: "13px", fontWeight: 500, color: "var(--primary)", textAlign: "right" as const };

export function ProfileView() {
  const d = useDashboardCtx();
  const router = useRouter();
  const {
    language, copy, persistenceReady, authLabel, userName,
    businessLaunched, businessHealthScore,
    completedCount, pathTotalStages, correctedProgressPercent,
    setLanguage, resetDemo, persistenceLabel,
  } = d;

  const ko = language === "ko";

  // ── 계정 정보 파싱 ──
  // authLabel 형식: "email · userId8자리" 또는 "로그인 필요"
  const isSignedIn = persistenceReady;
  const emailPart = authLabel.includes(" · ") ? authLabel.split(" · ")[0] : null;
  const idPart = authLabel.includes(" · ") ? authLabel.split(" · ")[1] : null;
  // 회원가입 시 입력한 이름을 우선, 없으면 이메일 첫 글자.
  const avatarLetter = userName
    ? userName.trim()[0]?.toUpperCase() ?? "?"
    : emailPart ? emailPart[0].toUpperCase() : "?";
  const isAnonymous = !emailPart || emailPart === copy.home.signInRequired;
  const displayName = userName && userName.trim().length > 0 ? userName.trim() : null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <section style={styles.section}>

      {/* ── 헬스 점수 요약 카드 ── */}
      {businessLaunched && (() => {
        const score = businessHealthScore === "healthy" ? 85 : businessHealthScore === "caution" ? 55 : businessHealthScore === "danger" ? 30 : 0;
        const grade = businessHealthScore === "healthy" ? (ko ? "건강" : "Healthy") : businessHealthScore === "caution" ? (ko ? "주의" : "Caution") : businessHealthScore === "danger" ? (ko ? "위험" : "Danger") : "—";
        const gradeColor = businessHealthScore === "healthy" ? "#059669" : businessHealthScore === "caution" ? "#d97706" : "#dc2626";
        const circumference = 2 * Math.PI * 42;
        const strokeDash = (score / 100) * circumference;

        return (
          <div style={{
            marginBottom: "20px", padding: "24px", borderRadius: "24px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
            border: "1px solid rgba(15,23,42,0.05)",
            boxShadow: "0 2px 12px rgba(15,23,42,0.03)",
            display: "flex", alignItems: "center", gap: "24px",
          }}>
            {/* SVG 원형 게이지 */}
            <div style={{ position: "relative" as const, width: "100px", height: "100px", flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(15,23,42,0.05)" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={gradeColor}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
                />
              </svg>
              <div style={{
                position: "absolute" as const, inset: 0,
                display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
              }}>
                <span className="bento-number" style={{ fontSize: "28px", fontWeight: 780, letterSpacing: "-0.04em", color: gradeColor, lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.35)", marginTop: "2px" }}>
                  /100
                </span>
              </div>
            </div>
            {/* 텍스트 */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(15,23,42,0.4)", marginBottom: "4px" }}>
                {ko ? "경영 건강 점수" : "Business Health Score"}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 740, letterSpacing: "-0.03em", color: gradeColor, marginBottom: "4px" }}>
                {grade}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
                {score >= 80
                  ? (ko ? "안정적인 경영 구조입니다. 이 상태를 유지하세요." : "Stable business structure. Maintain this level.")
                  : score >= 50
                    ? (ko ? "몇 가지 개선이 필요합니다. AI 액션을 확인하세요." : "Some improvements needed. Check AI actions.")
                    : (ko ? "긴급한 조치가 필요합니다. 비용 구조를 점검하세요." : "Urgent action needed. Review your cost structure.")}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 아바타 + 계정 헤더 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{
          width: "60px", height: "60px", borderRadius: "50%",
          background: isAnonymous ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, #007aff 0%, #5ac8fa 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", fontWeight: 700, color: isAnonymous ? "rgba(0,0,0,0.3)" : "#fff",
          flexShrink: 0,
        }}>
          {isAnonymous ? "?" : avatarLetter}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {isAnonymous
              ? (ko ? "로그인이 필요합니다" : "Not signed in")
              : displayName
                ? (ko ? `${displayName}님` : displayName)
                : emailPart}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {isAnonymous
              ? (ko ? "계정을 만들면 진행 상황이 저장됩니다" : "Create an account to save your progress")
              : displayName && emailPart
                ? emailPart
                : (ko ? "이메일 계정" : "Email account")}
          </div>
        </div>
      </div>

      {/* ── 카드 1: 계정 정보 ── */}
      <article style={card}>
        <div style={sectionLabel}>{ko ? "계정 정보" : "Account"}</div>
        {isSignedIn && displayName && !isAnonymous && (
          <div style={row}>
            <span style={rowKey}>{ko ? "이름" : "Name"}</span>
            <span style={rowVal}>{displayName}</span>
          </div>
        )}
        {isSignedIn && emailPart && !isAnonymous && (
          <div style={row}>
            <span style={rowKey}>{ko ? "이메일" : "Email"}</span>
            <span style={{ ...rowVal, fontSize: "12px", fontFamily: "monospace" }}>{emailPart}</span>
          </div>
        )}
        {idPart && (
          <div style={row}>
            <span style={rowKey}>{ko ? "사용자 ID" : "User ID"}</span>
            <span style={{ ...rowVal, fontSize: "12px", fontFamily: "monospace", color: "var(--muted)" }}>{idPart}…</span>
          </div>
        )}
        <div style={rowLast}>
          <span style={rowKey}>{ko ? "계정 유형" : "Account type"}</span>
          <span style={{
            fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px",
            background: isAnonymous ? "rgba(255,149,0,0.10)" : "rgba(52,199,89,0.10)",
            color: isAnonymous ? "#b36200" : "#1a7a36",
            border: `1px solid ${isAnonymous ? "rgba(255,149,0,0.2)" : "rgba(52,199,89,0.2)"}`,
          }}>
            {isAnonymous ? (ko ? "미로그인" : "Guest") : (ko ? "이메일 계정" : "Registered")}
          </span>
        </div>
      </article>

      {/* ── 카드 2: 내 여정 진행 상황 ── */}
      <article style={{ ...card, marginTop: "12px" }}>
        <div style={sectionLabel}>{ko ? "내 여정" : "My Journey"}</div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>
              {ko ? `${completedCount}개 단계 완료` : `${completedCount} stages completed`}
            </span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: correctedProgressPercent >= 100 ? "#34c759" : "#007aff", letterSpacing: "-0.5px" }}>
              {correctedProgressPercent}%
            </span>
          </div>
          <div style={{ height: "6px", borderRadius: "4px", background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              background: correctedProgressPercent >= 100
                ? "#34c759"
                : "linear-gradient(90deg, #007aff 0%, #5ac8fa 100%)",
              width: `${correctedProgressPercent}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
            {ko ? `전체 ${pathTotalStages}단계 중` : `of ${pathTotalStages} total stages`}
            {businessLaunched
              ? (ko ? " · 개업 완료" : " · Business launched")
              : (ko ? " · 창업 준비 중" : " · In progress")}
          </div>
        </div>
      </article>

      {/* ── 카드 3: 앱 설정 ── */}
      <article style={{ ...card, marginTop: "12px" }}>
        <div style={sectionLabel}>{ko ? "설정" : "Settings"}</div>
        <div style={rowLast}>
          <span style={rowKey}>{ko ? "언어" : "Language"}</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["ko", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                style={{
                  fontSize: "12px", fontWeight: 600, padding: "5px 14px",
                  borderRadius: "8px", cursor: "pointer",
                  border: language === lang ? "none" : "1px solid rgba(0,0,0,0.12)",
                  background: language === lang ? "#007aff" : "transparent",
                  color: language === lang ? "#fff" : "var(--muted)",
                  transition: "all 0.15s ease",
                }}
              >
                {lang === "ko" ? "한국어" : "English"}
              </button>
            ))}
          </div>
        </div>
      </article>

      {/* ── 카드 3.5: 외부 데이터 연결 (4가지 trail) ── */}
      <PortOneConnectCard ko={ko} />
      <TossPlaceConnectCard ko={ko} />
      <CodefConnectCard ko={ko} />
      <CsvUploadCard ko={ko} />

      {/* ── 카드 4: 계정 관리 ── */}
      <article style={{ ...card, marginTop: "12px" }}>
        <div style={sectionLabel}>{ko ? "계정 관리" : "Account Actions"}</div>

        {isAnonymous && (
          <div style={row}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                {ko ? "계정 만들기" : "Create account"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                {ko ? "진행 상황을 영구 저장하고 기기 간 동기화" : "Save progress permanently across devices"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/auth")}
              style={{
                fontSize: "12px", fontWeight: 600, color: "#fff",
                background: "#007aff", border: "none", borderRadius: "10px",
                padding: "8px 16px", cursor: "pointer", flexShrink: 0,
              }}
            >
              {ko ? "시작하기 →" : "Get started →"}
            </button>
          </div>
        )}

        <div style={row}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
              {ko ? "진행 초기화" : "Reset progress"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>
              {ko ? "모든 단계 결정 및 입력값을 초기화합니다" : "Clear all stage decisions and inputs"}
            </div>
          </div>
          <button
            type="button"
            onClick={resetDemo}
            style={{
              fontSize: "12px", fontWeight: 600, color: "#ff3b30",
              background: "rgba(255,59,48,0.08)", border: "none", borderRadius: "10px",
              padding: "8px 14px", cursor: "pointer", flexShrink: 0,
            }}
          >
            {ko ? "초기화" : "Reset"}
          </button>
        </div>

        {!isAnonymous && (
          <div style={rowLast}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              {ko ? "로그아웃" : "Sign out"}
            </span>
            <button
              type="button"
              onClick={() => { void handleSignOut(); }}
              style={{
                fontSize: "12px", fontWeight: 600, color: "var(--muted)",
                background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "10px",
                padding: "8px 14px", cursor: "pointer", flexShrink: 0,
              }}
            >
              {ko ? "로그아웃" : "Sign out"}
            </button>
          </div>
        )}
        {isAnonymous && (
          <div style={rowLast}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>
              {ko ? "저장 상태" : "Save status"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{persistenceLabel}</span>
          </div>
        )}
      </article>

    </section>
  );
}
