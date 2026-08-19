"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import { useDashboardComputed } from "../../hooks/useDashboardComputed";
import { SegmentedTabs } from "../SegmentedTabs";
import { markDeepDiveOpen } from "./DeepDiveSection";
import { HOME_SEGMENTS, DEEPDIVE_SEGMENT, HOME_FOCUS_EVENT, registerHomeSegmentHost, type HomeSegment, type HomeFocusDetail } from "./homeSegments";

// ── Tier sections (분기 표 → sections/DASHBOARD_MAP.md) ──
import { Tier0Header } from "./sections/Tier0Header";
import { StoreSetupMissionsCard } from "./StoreSetupMissionsCard";
import { Tier1Hero } from "./sections/Tier1Hero";
import { FeatureNudgeSection } from "./FeatureNudgeCard";
import { TodaySummarySection } from "./sections/TodaySummarySection";
import { TodayManagementSection } from "./sections/TodayManagementSection";
import { Tier1DailyHub } from "./sections/Tier1DailyHub";
import { Tier1_5Coaching } from "./sections/Tier1_5Coaching";
import { Tier2WeeklyPulse } from "./sections/Tier2WeeklyPulse";
import { Tier3Operations } from "./sections/Tier3Operations";
import { Tier4GrowthTools } from "./sections/Tier4GrowthTools";
import { Tier5ForecastTools } from "./sections/Tier5ForecastTools";

// ── 모달 + Admin Tabs ──
import { MilestoneToast } from "./MilestoneToast";
import { RevenueCalendar } from "./RevenueCalendar";
import { DetailTabs } from "./DetailTabs";
import { shell, bentoHoverCSS } from "./operationalStyles";

type Props = { d: DashboardHook };

// 홈 세그먼트 (2026-08-19 IA — iOS TodayView 동일 3탭: 오늘 · 운영 · 더보기).
//  한 화면에 tier 전부가 동시에 뜨지 않게 progressive disclosure. 카드는 삭제 0 — 탭으로 분산만.
//  매핑 SSOT → ./homeSegments.ts, 분기 표 → sections/DASHBOARD_MAP.md "세그먼트" 절.

/** 정확한 원화 표시. 반올림 없음. */
const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const remain = abs % 100000000;
    const man = Math.floor(remain / 10000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString()}만원` : `${sign}${eok}억원`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const remain = abs % 10000;
    return remain > 0 ? `${sign}${man.toLocaleString()}만 ${remain.toLocaleString()}원` : `${sign}${man.toLocaleString()}만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
};


export default function OperationalDashboard({ d }: Props) {
  // ── 모든 계산값은 useDashboardComputed 훅에서 단일 소스 ──
  //    기존 280줄 인라인 계산 → 훅 1개 + destructured 별칭으로 압축.
  const c = useDashboardComputed(d);
  const {
    ko,
    isStartupCompany,
    isOnlineCategory,
    usesSubscriptions,
    saasMetrics,
    viewportWidth,
    isWide,
    isThreeUp,
    todayStr,
    allEntries,
    monthEntries,
    todayEntry,
    recent7Entries,
    totalSales,
    workingDays,
    avgDailySales,
    recent7Sales,
    weeklySalesChange,
    monthlyCosts,
    totalCosts,
    netProfit,
    cashflowCriticalElevation,
    projectedProfit,
    ingredientRatio,
    laborRatio,
    rentRatio,
    primeCost,
    bepProgress,
    healthMetrics,
    breakEvenDailySales,
    daysAboveBreakEven,
    todaySales,
    todayBepProgress,
    nextTaxItem,
    prevMonthCosts,
    prevMonthSales,
    inventory,
    lowStockItems,
    employees,
    estimatedMonthlyPayroll,
    insuredEmployees,
    monthlyBurn,
    launchDateText,
    daysSinceLaunch,
    capitalLeft,
    runwayMonths,
    healthTone,
    healthLabel,
    weeklySignalLabel,
    topRiskLabel,
    focusMessage,
    streak,
    healthScore,
    currentMilestone,
    handleDismissMilestone,
  } = c;
  const isStaff = d.userRole === "staff";

  // 캘린더 모달 (orchestrator 만의 로컬 UI 상태)
  const [showCalendar, setShowCalendar] = useState(false);
  // 전체 AI 브리핑(CEOMorningHero) 펼침 — 요약 카드의 [자세히 보기] 토글 (2026-07-21 밀도 재설계)
  const [showFullBriefing, setShowFullBriefing] = useState(false);

  // 홈 세그먼트 — 기본 「오늘」. 다른 탭의 DeepDive 를 여는 이벤트(구독 플랜 → ops-mgmt 등)가 오면 탭 전환 + 펼침 예약.
  const [segment, setSegment] = useState<HomeSegment>("today");
  const segmentRef = useRef<HomeSegment>("today");
  segmentRef.current = segment;
  useEffect(() => {
    const onDeepDive = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      const target = id ? DEEPDIVE_SEGMENT[id] : undefined;
      if (!id || !target || target === segmentRef.current) return;
      markDeepDiveOpen(id);
      setSegment(target);
    };
    // 히어로 CTA 등 "다른 탭의 카드로 스크롤" 요청 → 탭 전환 후 다음 프레임에 스크롤(+입력 포커스)
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<HomeFocusDetail>).detail;
      if (!detail?.selector) return;
      if (detail.segment !== segmentRef.current) setSegment(detail.segment);
      window.setTimeout(() => {
        const el = document.querySelector<HTMLElement>(detail.selector);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (detail.focusInput) {
          window.setTimeout(() => {
            el.querySelector<HTMLInputElement>('input[inputmode="numeric"], input[type="number"], input[type="text"]')?.focus();
          }, 450);
        }
      }, 60);
    };
    window.addEventListener("buildup:open-deepdive", onDeepDive);
    window.addEventListener(HOME_FOCUS_EVENT, onFocus);
    const unregister = registerHomeSegmentHost();
    return () => {
      unregister();
      window.removeEventListener("buildup:open-deepdive", onDeepDive);
      window.removeEventListener(HOME_FOCUS_EVENT, onFocus);
    };
  }, []);

  // CSS-only stagger
  const STAGGER_STEP_MS = 70;
  let staggerIdx = 0;
  const nextStaggerStyle = (): React.CSSProperties => ({
    animationDelay: `${staggerIdx++ * STAGGER_STEP_MS}ms`,
  });

  // headlineStats + pnlChangePercent 제거됨 (display:none 상태에서 중복 계산만 하던 죽은 코드)

  // handleExportCSV 제거됨 (2026-07-12) — 버튼 미연결 죽은 코드. CSV 내보내기는 ExportPanel(Tier 5) SSOT.

  return (
    <section className="dash-shell" style={shell}>
      <style>{bentoHoverCSS}</style>

      {/* ━━━ Tier 0 — 상호명 + 리추얼 배너 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      <Tier0Header d={d} ko={ko} isStaff={isStaff} nextStaggerStyle={nextStaggerStyle} />

      {/* ━━━ 세그먼트 — 오늘 · 운영 · 더보기 (2026-08-19 IA, iOS TodayView 동일) ━━━ */}
      {!isStaff && (
        <SegmentedTabs<HomeSegment>
          items={HOME_SEGMENTS}
          value={segment}
          onChange={setSegment}
          ariaLabel={ko ? "홈 세그먼트" : "Home segments"}
        />
      )}

      {/* ═══════════ 「오늘」 = 미션 → 요약(히어로+매출+고객) → 긴급 알림 → 손익·현금 ═══════════ */}
      {!isStaff && segment === "today" && (
        <>
          {/* 가게 세팅 미션 — 기존 가게 등록자만 (로드맵·AI 로드맵 유저 미노출, 완료 시 자동 소멸) */}
          <StoreSetupMissionsCard
            ko={ko}
            decisions={d.decisions}
            categoryId={d.selectedIndustryCategoryId ?? null}
            subIndustryId={d.selectedIndustryId ?? null}
            entriesCount={allEntries.length}
            monthlyCostsTotal={totalCosts}
            inventoryCount={inventory.length}
            onRevenue={() => setShowCalendar(true)}
            onCosts={() => d.navigateToSurface("analytics")}
            onOfferings={() => d.navigateToSurface("offerings")}
            onVerifyBiz={() => { d.setViewingStageId("registration-setup"); d.navigateToSurface("roadmap"); }}
          />

          {/* 오늘의 요약 — 타일(매출·고객) + AI 코칭 + 추이 차트 2개 (2026-07-21 사장님 목업 참고) */}
          <div className="dash-stagger-item" style={nextStaggerStyle()}>
            <TodaySummarySection
              d={d} c={c} ko={ko} fmt={fmt}
              onOpenCalendar={() => setShowCalendar(true)}
              briefingExpanded={showFullBriefing}
              onToggleBriefing={() => setShowFullBriefing((v) => !v)}
            />
          </div>

          {/* Tier 1 — 긴급 AlertStrip (전체 AI 브리핑은 오늘의 요약 카드에서 펼침) */}
          <Tier1Hero d={d} nextStaggerStyle={nextStaggerStyle} />

          {/* Tier 1.1–1.2 — 데일리 허브: 손익 + 현금흐름 2-col */}
          <Tier1DailyHub
            d={d}
            c={c}
            ko={ko}
            fmt={fmt}
            nextStaggerStyle={nextStaggerStyle}
            onOpenCalendar={() => setShowCalendar(true)}
          />
        </>
      )}

      {/* ═══════════ 「운영」 = 오늘의 관리(오퍼링·고객·팀) → 업종 코칭 카드 → 운영 관리 DeepDive ═══════════ */}
      {!isStaff && segment === "ops" && (
        <>
          {/* 오늘의 관리 — 재고 관리·팀 현황 실카드 2-up (요약 타일 중복 제거, 사장님 지시) */}
          <div className="dash-stagger-item" style={nextStaggerStyle()}>
            <TodayManagementSection d={d} c={c} ko={ko} fmt={fmt} />
          </div>

          {/* Tier 1.5 — 오늘의 코칭 (리추얼·정책자금·위생·업종별 카드·스타트업 지표) */}
          <Tier1_5Coaching d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} />

          {/* ── 비용 미입력 안내 ── */}
          {allEntries.length >= 1 && totalCosts === 0 && (
            <button className="dash-stagger-item" type="button" onClick={() => d.navigateToSurface("analytics")} style={{
              ...nextStaggerStyle(),
              width: "100%", marginTop: "10px", padding: "14px 18px",
              borderRadius: "16px", border: "1px solid rgba(25,25,112,0.15)",
              background: "linear-gradient(180deg, rgba(25,25,112,0.04) 0%, rgba(255,255,255,0.9) 100%)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
              transition: "all 0.15s ease",
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "10px",
                background: "rgba(25,25,112,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v6M8 11.5v.5" stroke="#191970" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="8" cy="8" r="6.5" stroke="#191970" strokeWidth="1.2" fill="none" />
                </svg>
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: "13px", fontWeight: 670, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  {ko ? "월 비용을 입력하면 손익 분석이 시작됩니다" : "Enter monthly costs to unlock P&L analysis"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                  {(() => {
                    const ef = d.businessCtx.expenseFields;
                    const ing = ef?.find((f) => f.fieldKey === "ingredients")?.label ?? { ko: "재료비", en: "materials" };
                    const lab = ef?.find((f) => f.fieldKey === "labor")?.label ?? { ko: "인건비", en: "labor" };
                    const rnt = ef?.find((f) => f.fieldKey === "rent")?.label ?? { ko: "임대료", en: "rent" };
                    return ko
                      ? `${ing.ko}, ${lab.ko}, ${rnt.ko} 등 실제 비용을 입력하세요`
                      : `Enter actual costs: ${ing.en}, ${lab.en}, ${rnt.en}, etc.`;
                  })()}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M5 3l4 4-4 4" stroke="rgba(15,23,42,0.3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Tier 3 — 운영 관리 DeepDive (구독·고객·인기상품·최근활동) */}
          <div className="dash-stagger-item" style={nextStaggerStyle()}>
            <Tier3Operations d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} />
          </div>
        </>
      )}

      {/* ═══════════ 「더보기」 = 이번 주 점검 → 성장 도구 → 플레이북·내보내기 → 기능 안내 → 세부 관리 ═══════════ */}
      {!isStaff && segment === "more" && (
        <>
          {/* Tier 2 — 이번 주 점검 */}
          <div className="dash-stagger-item" style={nextStaggerStyle()}>
            <Tier2WeeklyPulse d={d} c={c} ko={ko} fmt={fmt} />
          </div>

          {/* Tier 4 — 성장 도구 */}
          <div className="dash-stagger-item" style={nextStaggerStyle()}>
            <Tier4GrowthTools d={d} c={c} ko={ko} fmt={fmt} />
          </div>

          {/* Tier 5 — 예측·플레이북·내보내기 */}
          <div className="dash-stagger-item" style={nextStaggerStyle()}>
            <Tier5ForecastTools d={d} c={c} ko={ko} />
          </div>

          {/* 미사용 기능 안내 — 정적 안내는 데이터 뒤 (데이터 먼저 원칙) */}
          <div className="dash-stagger-item" style={nextStaggerStyle()}>
            <FeatureNudgeSection d={d} />
          </div>

          <section className="dash-stagger-item" style={{ ...nextStaggerStyle(), display: "flex", flexDirection: "column" as const, gap: "14px", marginTop: "8px" }}>
            <div>
              <div style={{
                fontSize: "10.5px", fontWeight: 650, letterSpacing: "0.1em",
                textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "4px",
              }}>
                {ko ? "세부 관리" : "Admin"}
              </div>
              <h2 style={{
                margin: 0, fontSize: "20px", fontWeight: 700,
                letterSpacing: "-0.025em", color: "var(--text)", lineHeight: 1.2,
              }}>
                {ko ? "필요할 때만 여는 입력·편집" : "Detailed controls"}
              </h2>
              {/* 탭 목록 부제 삭제 — 실제 탭이 바로 아래 보여 완전 중복 (2026-07-31) */}
            </div>
            <DetailTabs d={d} fmt={fmt} />
          </section>
        </>
      )}

      {/* ── Milestone Toast ── */}
      <MilestoneToast milestone={currentMilestone} onDismiss={handleDismissMilestone} />

      {/* ── Calendar Modal ── */}
      {showCalendar && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCalendar(false); }}
        >
          <div style={{ width: "min(520px, 90vw)", maxHeight: "85vh", overflowY: "auto", borderRadius: "28px", background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <div />
              <button type="button" onClick={() => setShowCalendar(false)} style={{ background: "rgba(25,25,112,0.05)", border: "none", borderRadius: "999px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "var(--muted)" }}>✕</button>
            </div>
            <div style={{ padding: "0 0 24px" }}>
              <RevenueCalendar
                dailyEntries={allEntries}
                ko={ko}
                fmt={fmt}
                onDateClick={(date) => { d.setDailyDateInput(date); setShowCalendar(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
