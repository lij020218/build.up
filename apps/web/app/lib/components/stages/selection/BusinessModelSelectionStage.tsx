"use client";

import { useRef, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  getStarterBusinessModelOptions,
  localizeRecommendationItem,
} from "@foundone/shared";
import { BusinessHoursInput } from "../shared/BusinessHoursInput";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.08)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";

type RevenueOption = {
  id: string;
  ko: { title: string; sub: string; example: string };
  en: { title: string; sub: string; example: string };
  // 어떤 industryCategory에 적용 가능한가 (빈 배열 = 모든 카테고리)
  applicableTo: string[];
};

// 수익 모델 — 어떻게 돈을 받는가. business-model 단계의 두 번째 질문.
// SaaS 거장(Salesforce·Stripe 패턴) + 한국 SMB(배달앱·구독커머스) 통합 분류.
const REVENUE_OPTIONS: RevenueOption[] = [
  {
    id: "subscription",
    ko: { title: "정기 구독 (월·연)", sub: "매월/매년 자동 결제", example: "예: 넷플릭스 · 노션 · 토스" },
    en: { title: "Subscription (monthly/yearly)", sub: "Auto-renewing recurring", example: "e.g., Netflix · Notion · Toss" },
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "api-usage",
    ko: { title: "API 사용량 (호출·토큰 단위)", sub: "쓴 만큼 청구", example: "예: OpenAI · Stripe · Twilio" },
    en: { title: "API usage (per call/token)", sub: "Pay-as-you-go metering", example: "e.g., OpenAI · Stripe · Twilio" },
    applicableTo: ["startup-tech"],
  },
  {
    id: "one-time",
    ko: { title: "일회 구매", sub: "한 번 결제, 그 후 사용", example: "예: 음식점 · 옷가게 · 디지털 상품 단건" },
    en: { title: "One-time purchase", sub: "Pay once, use forever", example: "e.g., restaurant · digital goods" },
    applicableTo: [], // 모든 카테고리
  },
  {
    id: "freemium",
    ko: { title: "무료 + 프리미엄", sub: "무료 체험 후 유료 전환", example: "예: 디스코드 · 줌 · 노션 무료 플랜" },
    en: { title: "Freemium", sub: "Free tier + paid upgrade", example: "e.g., Discord · Zoom · Notion free" },
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "marketplace-fee",
    ko: { title: "거래 수수료", sub: "매출 발생 시 % 수수료", example: "예: 우버이츠 · 에어비앤비 · 크몽" },
    en: { title: "Marketplace fee", sub: "% commission on transactions", example: "e.g., Uber Eats · Airbnb · Kmong" },
    applicableTo: ["startup-tech", "online-digital"],
  },
  {
    id: "hybrid",
    ko: { title: "복합 (둘 이상)", sub: "구독 + API · 무료 + 광고 등", example: "예: AWS · Slack · Spotify" },
    en: { title: "Hybrid (mix)", sub: "Subscription + usage / freemium + ads", example: "e.g., AWS · Slack · Spotify" },
    applicableTo: ["startup-tech", "online-digital"],
  },
];

export function BusinessModelSelectionStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    selectedIndustryId,
    selectedIndustryLabel,
    selectedBusinessModelId, setSelectedBusinessModelId,
    selectedRevenueModelId, setSelectedRevenueModelId,
    canCompleteBusinessModelStep,
    handleBusinessModelContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
  } = d;

  const businessModelRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);
  const ko = language === "ko";

  // 수익 모델 옵션 필터 — 카테고리에 맞는 것만 표시
  const revenueOptions = REVENUE_OPTIONS.filter(
    (opt) => opt.applicableTo.length === 0 || opt.applicableTo.includes(industryCategoryId ?? ""),
  );
  // 외식·뷰티·피트니스·펫 등 대부분 오프라인은 "one-time" 또는 "subscription" 정도만 의미.
  // startup-tech / online-digital은 6개 모두 노출.
  const showRevenueModel = (industryCategoryId === "startup-tech" || industryCategoryId === "online-digital") && !!selectedBusinessModelId;

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "한 가지 운영 모델에 우선 락인 — 분산은 매출 후"
            : "Lock in one operating model first — diversify after revenue",
          detail: ko
            ? "먼저 한 가지 운영 모델로 락인하고 첫 3개월은 그 모델로 표준화하세요. 매출이 안정된 뒤 두 번째 채널·모델을 추가하는 게 실패 위험을 줄입니다 — 여러 채널을 동시에 벌이면 초기 운영·마케팅 역량이 분산됩니다."
            : "Lock in one operating model first and standardize on it for the first 3 months. Add a second channel/model only after revenue stabilizes — running several at once scatters early ops and marketing.",
        }}
      />
      <div style={styles.helper}>
        {copy.home.businessModelHelp}
      </div>
      <div style={styles.helper}>
        {ko
          ? `${selectedIndustryLabel} 기준으로 운영 방식을 고르세요.`
          : `Choose the operating model for ${selectedIndustryLabel}.`}
      </div>

      {/* specialty(세부업종) 는 IndustrySelectionStage(Step 2) 에서 이미 선택됨.
          여기서 다시 노출하면 ID 체계 충돌 + 중복 선택 UX 발생 (2026-05-04 audit). */}
      {(() => {
        const color = "#1d3557"; // 미드나이트 블루
        const modelIcons: Record<string, string> = {
          "dine-in-restaurant": "M3 12h18M5 12a7 7 0 0114 0M12 12v6m-3 0h6",           // 접시 (매장식사)
          "takeout-focused": "M8 2h8l-1 5H9L8 2zM7 7h10v4a5 5 0 01-5 5 5 5 0 01-5-5V7zm3 14h4", // 테이크아웃 컵
          "delivery-hybrid": "M5 17h14l1-9H4l1 9zM7 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000-2z", // 배달
          "storefront-cafe": "M3 21V8l9-5 9 5v13M9 21v-6h6v6",                          // 매장
          "self-serve-light": "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm4 15h8M12 19v2", // 키오스크
          "small-storefront-retail": "M3 3h18v18H3V3zm0 6h18",                          // 소매 매장
          "online-focused-retail": "M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zm0 4h16", // 모니터
          "marketplace-seller": "M3 3h2l1 9h12l1-6H6M8 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z", // 장바구니
          "brand-own-store": "M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z",    // 별 (브랜드)
          "content-membership": "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", // 메일
          "appointment-service": "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", // 캘린더
          "membership-pass": "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm10 0l2 2 4-4", // 멤버십
          "class-session": "M12 3l9 5v2l-9 5-9-5V8l9-5zm0 12v5",                        // 수업
          "utility-storefront": "M3 21V8l9-5 9 5v13M9 21v-4h6v4",                       // 서비스 매장
          "mobile-service": "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0l5.5 6M3 16l5.5 6", // 출장
          "hourly-rental": "M12 2a10 10 0 100 20 10 10 0 000-20zm0 6v4l3 3",            // 시계
          "saas-product": "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm0 4h16M4 13h16M8 9v8", // 대시보드
          "platform-model": "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10", // 플랫폼
          "api-infra": "M16 18l6-6-6-6M8 6l-6 6 6 6",                                   // 코드
        };
        const options = getStarterBusinessModelOptions(industryCategoryId);
        return (
          <div ref={businessModelRef} style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`, gap: "10px", ...(shakeWarning ? { outline: "2px solid #b64c4c", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
            {options.map((rawOption) => {
              const option = localizeRecommendationItem(rawOption, language);
              const selected = selectedBusinessModelId === rawOption.id;
              const iconPath = modelIcons[rawOption.id] ?? "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5";
              return (
                <button
                  key={rawOption.id}
                  type="button"
                  style={{
                    display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const,
                    gap: "6px", padding: "28px 16px", borderRadius: "18px", cursor: "pointer", width: "100%",
                    border: selected ? `1.5px solid ${color}50` : "1.5px solid rgba(0,0,0,0.04)",
                    background: selected
                      ? `linear-gradient(160deg, ${color}0e 0%, ${color}06 100%)`
                      : "rgba(255,255,255,0.8)",
                    boxShadow: selected ? `0 0 0 3px ${color}0a, 0 4px 12px ${color}08` : "none",
                    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  onClick={() => setSelectedBusinessModelId(rawOption.id)}
                >
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: selected ? `${color}12` : "rgba(0,0,0,0.035)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "4px", transition: "all 0.2s ease",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke={selected ? color : "rgba(15,23,42,0.35)"}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: "stroke 0.2s ease" }}>
                      <path d={iconPath} />
                    </svg>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 650, letterSpacing: "-0.01em", color: selected ? color : "#0f172a" }}>
                    {option.title}
                  </div>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════
          REVENUE MODEL SECTION — 수익 모델 (어떻게 돈을 받는가)
          startup-tech / online-digital 만 표시. 외식·뷰티 등은 자동 "one-time".
          ═════════════════════════════════════════════════════════ */}
      {showRevenueModel && (
        <div style={{ marginTop: "24px", padding: "20px 22px", borderRadius: "20px", background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)", border: `1px solid ${MIDNIGHT_BORDER}`, boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ padding: "3px 9px", borderRadius: "6px", background: MIDNIGHT, color: "#fff", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em" }}>
              {ko ? "수익 모델" : "REVENUE MODEL"}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f0f4a", letterSpacing: "-0.01em" }}>
              {ko ? "어떻게 돈을 받으실 건가요?" : "How will you charge?"}
            </div>
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.6)", marginBottom: "16px", lineHeight: 1.55 }}>
            {ko
              ? "수익 모델은 운영 대시보드의 KPI(MRR·재구매율·ARPU 등)와 가격 설계 단계의 추천 콘텐츠를 결정합니다. 결합 모델이면 '복합'을 선택하세요."
              : "Revenue model determines your dashboard KPIs (MRR / repeat rate / ARPU) and pricing recommendations. Pick 'Hybrid' if combining multiple."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(220px, 1fr))`, gap: "10px" }}>
            {revenueOptions.map((opt) => {
              const sel = selectedRevenueModelId === opt.id;
              const t = ko ? opt.ko : opt.en;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedRevenueModelId(opt.id)}
                  style={{
                    display: "flex", flexDirection: "column" as const, alignItems: "flex-start",
                    textAlign: "left" as const, gap: "4px",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    width: "100%",
                    border: sel ? `1.5px solid ${MIDNIGHT}` : "1.5px solid rgba(25,25,112,0.10)",
                    background: sel
                      ? `linear-gradient(160deg, ${MIDNIGHT_SOFT} 0%, rgba(25,25,112,0.03) 100%)`
                      : "#ffffff",
                    boxShadow: sel
                      ? "0 0 0 3px rgba(25,25,112,0.08), 0 4px 12px rgba(25,25,112,0.10)"
                      : "0 1px 2px rgba(25,25,112,0.03)",
                    transition: "all 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "999px",
                      background: sel ? MIDNIGHT : "rgba(25,25,112,0.18)",
                      flexShrink: 0, transition: "background 0.18s ease",
                    }} />
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: sel ? MIDNIGHT : "#0f172a", letterSpacing: "-0.005em" }}>
                      {t.title}
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "rgba(15,23,42,0.6)", marginTop: "2px", marginLeft: "16px", lineHeight: 1.45 }}>
                    {t.sub}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 500, color: "rgba(25,25,112,0.55)", marginTop: "4px", marginLeft: "16px", letterSpacing: "-0.005em" }}>
                    {t.example}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 영업 시간 입력 — 오프라인 path 만 (online·startup은 자정 KST 컷오프 자동) */}
      {industryCategoryId !== "online-digital" && industryCategoryId !== "startup-tech" && selectedBusinessModelId && (
        <div style={{ marginTop: "20px", marginBottom: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px", opacity: 0.7 }}>
            {ko ? "STEP 3 — 영업 시간 (대시보드 일자 기준)" : "STEP 3 — Operating hours (dashboard cutoff)"}
          </div>
          <BusinessHoursInput />
        </div>
      )}

      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="자본·일정 설정"
        doneItemsKo={[
          { label: "1. 운영 모델 선택", detail: "매장형 · 배달·온라인 · 하이브리드 · 무인 등 업종에 맞는 운영 모델 결정" },
          { label: "2. 핵심 상품·서비스 확정", detail: "코어·시그니처·확장·실험 4-tier로 상품·서비스 우선순위 정의" },
          { label: "3. 영업시간·요일 설정", detail: "주중·주말·휴무일 패턴 + 피크타임 시간대 정의" },
          { label: "4. 수익 모델 결정", detail: "단품 판매·구독·멤버십·시간제 등 카테고리별 매출 흐름 모델 확정" },
        ]}
        verifyItemsKo={[
          "운영 모델별 인허가·신고 차이 확인 (예: 무인 매장은 24시간 별도 신고, 온라인은 통신판매업, 배달 전문은 영업신고 형태 상이)",
          "핵심 상품·서비스 — 원가율·제공 시간(조리·시술·처리)·손실률을 업종 기준으로 점검",
          "영업시간 — 근로기준법 1주 52시간 한도 + 1일 11시간 연속휴식권(근기법 §54)·주휴(§55) 사전 시뮬",
          "수익 모델 — 객단가·이용료 × 이용 빈도(회전·재방문) × 영업일수로 월매출 시뮬 후 손익분기 계산 (BEP < 보유자본 6개월)",
          "프랜차이즈인 경우 본사 규정(상품·운영·시간) 변경 가능 여부 (계약서 「본사 동의 필수」 조항 확인)",
          "플랫폼 의존 모델(배달·오픈마켓 등) — 플랫폼 수수료 + 결제 + 광고비·배송비·VAT 합산 시 매출 비중을 계산해 마진 확보 가능한지 (예: 배달앱 합산 매출의 17~28%)",
        ]}
        nextSummaryKo="운영 모델·상품/서비스·시간 확정 → 자본·일정 설정 단계로 진입"
      />

      <div style={styles.stageFooter}>
        {prevTraversedStage ? (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        ) : null}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            // 수익 모델이 필요한 카테고리는 그것까지 선택해야 진행 가능
            opacity: (canCompleteBusinessModelStep && (!showRevenueModel || !!selectedRevenueModelId)) ? 1 : 0.45
          }}
          onClick={() => {
            if (!canCompleteBusinessModelStep) {
              setShakeWarning(true);
              businessModelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            if (showRevenueModel && !selectedRevenueModelId) {
              setShakeWarning(true);
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleBusinessModelContinue();
          }}
        >
          {canCompleteBusinessModelStep && (!showRevenueModel || !!selectedRevenueModelId)
            ? (language === "ko" ? "운영·수익 모델 확정하고 계속" : "Lock model and continue")
            : showRevenueModel && !selectedRevenueModelId
              ? (language === "ko" ? "↑ 수익 모델을 선택하세요" : "↑ Select a revenue model")
              : (language === "ko" ? "↑ 운영 방식을 선택하세요" : "↑ Select an operating model")}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
