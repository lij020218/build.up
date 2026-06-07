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
import { PopbillConnectCard } from "../profile/PopbillConnectCard";
import { SaasMetricsConnectCard } from "../profile/SaasMetricsConnectCard";
import { SubscriptionWebhookConnectCard } from "../profile/SubscriptionWebhookConnectCard";
import { SubscriptionPlanManager } from "../dashboard/SubscriptionPlanManager";
import { DashboardLayoutCard } from "../profile/DashboardLayoutCard";
import { OwnerProfileChips } from "../dashboard/OwnerProfileChips";
import { formatKrw } from "../../utils/format-krw";
import { StoreNameInput } from "../stages/shared/StoreNameInput";
import { BusinessHoursInput } from "../stages/shared/BusinessHoursInput";

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
    businessLaunched,
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
    // ⚠️ 2026-05-18: signOut 직전 pending autosave 강제 flush.
    //   종전엔 1초 debounce / 5초 interval / 800ms autosave 가 fire 직전이면
    //   RLS 거부 (anonymous) 로 reject 되고 사장님이 방금 입력한 값이 영구 손실.
    //   flushStoreDataImmediate 가 있으면 await 으로 완료 보장 후 signOut.
    try {
      const flush = (d as { flushStoreDataImmediate?: () => Promise<void> }).flushStoreDataImmediate;
      if (flush) await flush();
    } catch (err) {
      console.warn("[signOut] flush failed (non-fatal):", err);
    }
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handleDeleteAccount = async () => {
    const confirmed = typeof window !== "undefined" && window.confirm(
      ko
        ? "정말 계정을 삭제하시겠어요?\n모든 데이터와 구독이 영구 삭제되며, 되돌릴 수 없습니다."
        : "Delete your account?\nAll data and subscriptions are permanently removed. This cannot be undone."
    );
    if (!confirmed) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert(ko ? "로그인이 필요합니다." : "Sign in required.");
        return;
      }
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? (ko ? "계정 삭제에 실패했습니다." : "Failed to delete account."));
        return;
      }
      await supabase.auth.signOut();
      router.push("/auth");
    } catch (e) {
      console.error("[deleteAccount]", e);
      alert(ko ? "오류가 발생했습니다. 잠시 후 다시 시도해 주세요." : "An error occurred. Please try again.");
    }
  };

  return (
    <section style={styles.section}>

      {/* 경영 건강 점수 — 사용자 지침 2026-05-11: 내 정보 페이지에서 *운영 대시보드* 로 이동. */}

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
            <span style={{ fontSize: "20px", fontWeight: 700, color: correctedProgressPercent >= 100 ? "#1d3557" : "#007aff", letterSpacing: "-0.5px" }}>
              {correctedProgressPercent}%
            </span>
          </div>
          <div style={{ height: "6px", borderRadius: "4px", background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              background: correctedProgressPercent >= 100
                ? "#1d3557"
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

      {/* ── 카드 2.5: 매장 정보 (상호 + 영업 시간) ── */}
      {/* 운영 중에도 변경 가능 — 영업 시간이 바뀌면 일자 컷오프도 자동 반영 */}
      <article style={{ ...card, marginTop: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ ...sectionLabel, padding: 0, borderBottom: "none" }}>
          {ko ? "매장 정보" : "Store info"}
        </div>
        <StoreNameInput />
        {d.industryCategoryId !== "online-digital" && d.industryCategoryId !== "startup-tech" && (
          <BusinessHoursInput />
        )}
      </article>

      {/* ── 카드 2.6: 사장님 정보 (지원사업 맞춤 매칭) ──
       *   출생연도·신용점수·폐업검토·장애 — 청년/시니어/신용취약/폐업/장애 정책자금 매칭에 사용.
       *   ⚠️ 민감정보라 기기(localStorage)에만 저장하고 서버로 전송하지 않음. 모두 선택 입력.
       */}
      <article style={{ ...card, marginTop: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ ...sectionLabel, padding: 0, borderBottom: "none" }}>
          {ko ? "사장님 정보 (지원사업 매칭)" : "Owner info (program matching)"}
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5, marginTop: "-2px" }}>
          {ko
            ? "출생연도를 알려주시면 청년(만 39세 이하)·시니어(40세+) 전용 지원을 더 정확히 찾아드려요. 모두 선택 입력 · 기기에만 저장."
            : "Add your birth year to surface youth (≤39) / senior (40+) programs. All optional, stored on device only."}
        </div>
        <OwnerProfileChips ko={ko} />
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

      {/* ── 카드 3.1: 대시보드 카드 표시 설정 (2026-05-11) ── */}
      <DashboardLayoutCard ko={ko} />

      {/* ── 카드 3.2: 구독 관리 (2026-05-27 추가) ─────────────────────────
       *   대시보드 Tier 3 와 동일한 SubscriptionPlanManager + SubscriptionWebhookConnectCard 를
       *   "내 설정" 에서도 노출. 사장님이 대시보드 또는 설정 어느 쪽에서든 플랜·구독자 관리 가능.
       *
       *   분기: usesSubscriptions === true 일 때만 (대시보드와 동일 SSOT).
       *   참고: 대시보드 Tier3Operations.tsx 와 동일한 컴포넌트 → 같은 store 를 보므로
       *        한쪽에서 추가/삭제하면 다른 쪽에 즉시 반영.
       */}
      {d.usesSubscriptions ? (
        <>
          <SubscriptionPlanManager d={d} ko={ko} fmt={formatKrw} />
          <SubscriptionWebhookConnectCard ko={ko} />
        </>
      ) : null}

      {/* ── 카드 3.5: 외부 데이터 연결 ──────────────────────────────────────
       *   순서 원칙 (2026-05-27): 사용자가 바로 이해하는 방식부터.
       *     1) CSV 업로드      — 가장 단순, 누구나 가능
       *     2) GA4 / SaaS 지표 — startup-tech 만 (내부 가드). 1-click OAuth
       *     3) 결제 연동       — PortOne·Toss·Popbill·Codef (영수증·매출 자동 동기화)
       *
       *   Webhook · Pull API 는 SaasMetricsConnectCard 내부 "고급 연결 (개발자용)"
       *   토글 안에 숨김 — 비개발자 사장님이 압도되지 않도록.
       */}
      <CsvUploadCard ko={ko} />
      {/* 스타트업 업종 사장님 자기 제품 사용자 수 자동 수집 (내부에서 industry 가드) */}
      <SaasMetricsConnectCard ko={ko} industryCategoryId={d.industryCategoryId} />
      <PortOneConnectCard ko={ko} />
      <TossPlaceConnectCard ko={ko} />
      <PopbillConnectCard ko={ko} />
      <CodefConnectCard ko={ko} />

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
              fontSize: "12px", fontWeight: 600, color: "#b64c4c",
              background: "rgba(182,76,76,0.08)", border: "none", borderRadius: "10px",
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
        {!isAnonymous && (
          <div style={rowLast}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px", color: "#b64c4c" }}>
                {ko ? "계정 삭제" : "Delete account"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                {ko ? "모든 데이터·구독 영구 삭제 (되돌릴 수 없음)" : "Permanently remove all data & subscriptions"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { void handleDeleteAccount(); }}
              style={{
                fontSize: "12px", fontWeight: 600, color: "#fff",
                background: "#b64c4c", border: "none", borderRadius: "10px",
                padding: "8px 14px", cursor: "pointer", flexShrink: 0,
              }}
            >
              {ko ? "계정 삭제" : "Delete"}
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
