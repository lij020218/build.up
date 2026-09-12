"use client";

import React, { useEffect, useState } from "react";
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
import { FeedbackCard } from "../profile/FeedbackCard";
import { StoreConnectCard } from "../profile/StoreConnectCard";
import { SubscriptionPlanManager } from "../dashboard/SubscriptionPlanManager";
import { DashboardLayoutCard } from "../profile/DashboardLayoutCard";
import { OwnerProfileChips } from "../dashboard/OwnerProfileChips";
import { formatKrw } from "../../utils/format-krw";
import { StoreNameInput } from "../stages/shared/StoreNameInput";
import { BusinessHoursInput } from "../stages/shared/BusinessHoursInput";
import { ConfirmModal } from "../ConfirmModal";
import { ListSection, ListRow, listSectionStyles } from "../ui/ListSection";

// 카드·행 스타일은 ui/ListSection.tsx 로 옮겼다 (2026-09-12) — 화면마다 다시 만들지 않는다.

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ── 운영자 여부 프로브 — allowlist 는 서버에만 있으므로 /api/admin/me 200 으로만 판정.
  //    비관리자(403)·미로그인·실패 = 버튼 미노출 (일반 사용자에겐 운영자 모드 존재 자체를 안 보임)
  const [isAdminUser, setIsAdminUser] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled && res.ok) setIsAdminUser(true);
      } catch {
        /* 프로브 실패 = 미노출 */
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const executeDeleteAccount = async () => {
    setDeleteConfirmOpen(false);
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
    <>
    <ConfirmModal
      open={deleteConfirmOpen}
      title={ko ? "계정을 삭제하시겠어요?" : "Delete your account?"}
      message={
        ko
          ? "계정·가게 데이터·업로드한 문서와 구독이 즉시 영구 삭제되며 되돌릴 수 없습니다. 직원 근로 기록만 법정 보존(근로기준법 3년)을 위해 계정과 분리해 보관 후 자동 파기됩니다."
          : "All data and subscriptions are permanently removed. This cannot be undone."
      }
      confirmLabel={ko ? "삭제" : "Delete"}
      cancelLabel={ko ? "취소" : "Cancel"}
      danger
      onConfirm={() => { void executeDeleteAccount(); }}
      onCancel={() => setDeleteConfirmOpen(false)}
    />
    <section style={styles.section}>

      {/* 경영 건강 점수 — 사용자 지침 2026-05-11: 내 정보 페이지에서 *운영 대시보드* 로 이동. */}

      {/* ── 아바타 + 계정 헤더 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{
          width: "60px", height: "60px", borderRadius: "50%",
          background: isAnonymous ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, #3b5c8c 0%, #5f8bb8 100%)",
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

      {/* ── 계정 (2026-09-12: 카드 안 대문자 eyebrow → 카드 밖 제목, 배지 → 값 텍스트) ── */}
      <ListSection title={ko ? "계정" : "Account"}>
        {isSignedIn && displayName && !isAnonymous && (
          <ListRow first label={ko ? "이름" : "Name"} value={displayName} />
        )}
        {isSignedIn && emailPart && !isAnonymous && (
          <ListRow label={ko ? "이메일" : "Email"} value={emailPart} monospace />
        )}
        {idPart && (
          <ListRow label={ko ? "사용자 ID" : "User ID"} value={`${idPart}…`} monospace />
        )}
        {/* 종전엔 주황/초록 캡슐 배지였다. 값이 두 가지뿐이라 색까지 쓸 이유가 없다. */}
        <ListRow
          label={ko ? "계정 유형" : "Account type"}
          value={isAnonymous ? (ko ? "미로그인" : "Guest") : (ko ? "이메일 계정" : "Registered")}
        />
      </ListSection>

      {/* ── 카드 1.5: 가게 연결 (직원용) — 받은 초대·초대 코드 입력 (2026-07-12) ── */}
      <div style={{ marginTop: "12px" }}>
        {/* id — 온보딩 진단 "지금 연동하러 가기" 스크롤 타깃 (bup:navigate-feature) */}
        <div id="store-connect-card">
          <StoreConnectCard ko={ko} />
        </div>
      </div>

      {/* ── 진행 상황 ── */}
      <ListSection
        title={ko ? "진행 상황" : "Progress"}
        style={{ marginTop: "16px" }}
        footer={
          (ko ? `전체 ${pathTotalStages}단계 중` : `of ${pathTotalStages} total stages`) +
          (businessLaunched
            ? (ko ? " · 개업 완료" : " · Business launched")
            : (ko ? " · 창업 준비 중" : " · In progress"))
        }
      >
        <ListRow
          first
          label={ko ? "완료한 단계" : "Stages completed"}
          value={`${completedCount} / ${pathTotalStages}`}
        />
        <ListRow label={ko ? "진행률" : "Progress"} value={`${correctedProgressPercent}%`} />
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ height: "6px", borderRadius: "4px", background: "rgba(17,19,26,0.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              background: "var(--primary)",
              width: `${correctedProgressPercent}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </ListSection>

      {/* ── 매장 정보 (운영 중에도 변경 가능 — 영업 시간이 바뀌면 일자 컷오프도 자동 반영) ── */}
      <ListSection title={ko ? "매장 정보" : "Store info"} style={{ marginTop: "16px" }}>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <StoreNameInput />
          {d.industryCategoryId !== "online-digital" && d.industryCategoryId !== "startup-tech" && (
            <BusinessHoursInput />
          )}
        </div>
      </ListSection>

      {/* ── 지원사업 매칭 ──
       *   출생연도·신용점수·폐업검토·장애 — 청년/시니어/신용취약/폐업/장애 정책자금 매칭에 사용.
       *   ⚠️ 민감정보라 기기(localStorage)에만 저장하고 서버로 전송하지 않음. 모두 선택 입력.
       */}
      <ListSection
        title={ko ? "지원사업 매칭" : "Program matching"}
        style={{ marginTop: "16px" }}
        footer={ko
          ? "모두 선택 항목이며 기기에만 저장됩니다. 서버로 보내지 않습니다."
          : "All optional, stored on device only — never sent to the server."}
      >
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={listSectionStyles.subtitle}>
            {ko
              ? "출생연도를 알려주시면 청년(만 39세 이하)·시니어(40세+) 전용 지원을 더 정확히 찾아드려요."
              : "Add your birth year to surface youth (≤39) / senior (40+) programs."}
          </div>
          <OwnerProfileChips ko={ko} />
        </div>
      </ListSection>

      {/* ── 설정 ── */}
      <ListSection title={ko ? "설정" : "Settings"} style={{ marginTop: "16px" }}>
        <ListRow
          first
          label={ko ? "언어" : "Language"}
          trailing={
            <div style={{ display: "flex", gap: "6px" }}>
              {(["ko", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  style={{
                    fontSize: "13px", fontWeight: 600, padding: "6px 14px",
                    borderRadius: "8px", cursor: "pointer",
                    border: language === lang ? "none" : "1px solid rgba(17,19,26,0.12)",
                    background: language === lang ? "var(--primary)" : "transparent",
                    color: language === lang ? "#fff" : "var(--muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {lang === "ko" ? "한국어" : "English"}
                </button>
              ))}
            </div>
          }
        />
      </ListSection>

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

      {/* ── 의견 보내기 (인앱 피드백) ── */}
      <FeedbackCard ko={ko} />

      {/* ── 계정 관리 (2026-09-12: 행마다 색 버튼을 달던 것을 애플처럼 글자 행으로) ── */}
      <ListSection
        title={ko ? "계정 관리" : "Account"}
        style={{ marginTop: "16px" }}
        footer={ko
          ? "진행 초기화는 모든 단계 결정·입력값을 지웁니다. 계정은 유지됩니다."
          : "Reset clears all stage decisions and inputs. Your account stays."}
      >
        {isAnonymous && (
          <ListRow
            first
            label={ko ? "계정 만들기" : "Create account"}
            subtitle={ko ? "진행 상황을 영구 저장하고 기기 간 동기화" : "Save progress permanently across devices"}
            onClick={() => router.push("/auth")}
            trailing={<span style={listSectionStyles.action}>{ko ? "시작하기" : "Get started"}</span>}
          />
        )}
        {isAdminUser && (
          <ListRow
            label={ko ? "운영자 콘솔" : "Operator console"}
            subtitle={ko ? "가입·기능 사용량·피드백 관리 (운영자 전용)" : "Signups, usage & feedback (operators only)"}
            onClick={() => router.push("/admin")}
            trailing={<span style={listSectionStyles.action}>{ko ? "열기" : "Open"}</span>}
          />
        )}
        <ListRow
          label={ko ? "진행 초기화" : "Reset progress"}
          onClick={resetDemo}
          destructive
        />
        {!isAnonymous && (
          <ListRow label={ko ? "로그아웃" : "Sign out"} onClick={() => { void handleSignOut(); }} />
        )}
        {!isAnonymous && (
          <ListRow
            label={ko ? "계정 삭제" : "Delete account"}
            subtitle={ko ? "모든 데이터·구독 영구 삭제 (되돌릴 수 없음)" : "Permanently remove all data & subscriptions"}
            onClick={() => setDeleteConfirmOpen(true)}
            destructive
          />
        )}
        {isAnonymous && (
          <ListRow label={ko ? "저장 상태" : "Save status"} value={persistenceLabel} />
        )}
      </ListSection>

    </section>
    </>
  );
}
