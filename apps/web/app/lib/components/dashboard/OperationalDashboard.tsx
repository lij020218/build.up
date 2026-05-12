"use client";

import { useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import { useDashboardComputed } from "../../hooks/useDashboardComputed";

// ── Tier sections (분기 표 → sections/DASHBOARD_MAP.md) ──
import { Tier0Header } from "./sections/Tier0Header";
import { Tier1Hero } from "./sections/Tier1Hero";
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
    totalCustomers,
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

  // CSS-only stagger
  const STAGGER_STEP_MS = 70;
  let staggerIdx = 0;
  const nextStaggerStyle = (): React.CSSProperties => ({
    animationDelay: `${staggerIdx++ * STAGGER_STEP_MS}ms`,
  });

  // headlineStats + pnlChangePercent 제거됨 (display:none 상태에서 중복 계산만 하던 죽은 코드)

  // CSV 내보내기
  const handleExportCSV = () => {
    const rows = [ko ? ["날짜", "매출(원)", "고객수"] : ["Date", "Sales(KRW)", "Customers"]];
    for (const entry of allEntries) {
      rows.push([entry.date, String(entry.sales), String(entry.customers)]);
    }
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buildup-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // suppress unused variable warnings
  void totalCustomers;
  void handleExportCSV;

  return (
    <section style={shell}>
      <style>{bentoHoverCSS}</style>

      {/* ━━━ Tier 0 — 상호명 + 리추얼 배너 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      <Tier0Header d={d} ko={ko} isStaff={isStaff} nextStaggerStyle={nextStaggerStyle} />

      {/* ━━━ Tier 1 Hero — CEOMorningHero + FeatureNudge + AlertStrip (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      {!isStaff && <Tier1Hero d={d} nextStaggerStyle={nextStaggerStyle} />}

      {/* ━━━ Tier 1.1–1.2 — 데일리 허브 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      {!isStaff && (
        <Tier1DailyHub
          d={d}
          c={c}
          ko={ko}
          fmt={fmt}
          nextStaggerStyle={nextStaggerStyle}
          onOpenCalendar={() => setShowCalendar(true)}
        />
      )}

      {/* ━━━ Tier 1.5 — 오늘의 코칭 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      {!isStaff && <Tier1_5Coaching d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} />}

      {/* ━━━ Tier 2 — 이번 주 점검 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      {!isStaff && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <Tier2WeeklyPulse d={d} c={c} ko={ko} fmt={fmt} />
        </div>
      )}

      {/* ━━━ Tier 4 — 성장 도구 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      {!isStaff && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <Tier4GrowthTools d={d} c={c} ko={ko} fmt={fmt} />
        </div>
      )}

      {/* ── 비용 미입력 안내 ── */}
      {!isStaff && allEntries.length >= 1 && totalCosts === 0 && (
        <button className="dash-stagger-item" type="button" onClick={() => d.navigateToSurface("analytics")} style={{
          ...nextStaggerStyle(),
          width: "100%", marginTop: "10px", padding: "14px 18px",
          borderRadius: "16px", border: "1px solid rgba(245,158,11,0.15)",
          background: "linear-gradient(180deg, rgba(245,158,11,0.04) 0%, rgba(255,255,255,0.9) 100%)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
          transition: "all 0.15s ease",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "rgba(245,158,11,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v6M8 11.5v.5" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: "13px", fontWeight: 670, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {ko ? "월 비용을 입력하면 손익 분석이 시작됩니다" : "Enter monthly costs to unlock P&L analysis"}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>
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

      {/* SalesBreakdown / MonthlyProgress / CostStructure / BenchmarkCard
          → Tier 2 "이번 주 점검" DeepDive 안으로 이동됨 (위에 weekly-pulse DeepDive 참조) */}

      {/* ━━━ Tier 3 — 운영 관리 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      {!isStaff && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <Tier3Operations d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} />
        </div>
      )}

      {/* ━━━ Tier 5 — 예측·플레이북·내보내기 (분기 표 → sections/DASHBOARD_MAP.md) ━━━ */}
      {!isStaff && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <Tier5ForecastTools d={d} c={c} ko={ko} />
        </div>
      )}

      {/* 인기 상품 + 최근 활동 → 운영 관리 DeepDive 안으로 이동됨 */}

      {!isStaff && <section className="dash-stagger-item" style={{ ...nextStaggerStyle(), display: "flex", flexDirection: "column" as const, gap: "14px", marginTop: "8px" }}>
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
          <p style={{
            margin: "4px 0 0", fontSize: "13px", color: "var(--muted)",
            lineHeight: 1.5, letterSpacing: "-0.005em",
          }}>
            {ko ? "비용 · 재고 · 직원 · 배달 · 메뉴 · 회원 · 세금 — 탭으로 전환" : "Costs · Inventory · Staff · Delivery · Menu · Members · Tax"}
          </p>
        </div>
        <DetailTabs d={d} fmt={fmt} />
      </section>}

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
              <button type="button" onClick={() => setShowCalendar(false)} style={{ background: "rgba(25,25,112,0.05)", border: "none", borderRadius: "999px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "rgba(15,23,42,0.5)" }}>✕</button>
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
