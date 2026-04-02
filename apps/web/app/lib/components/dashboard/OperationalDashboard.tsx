"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import { DetailTabs } from "./DetailTabs";
import { PLHeroCard } from "./PLHeroCard";
import { RevenueCalendar } from "./RevenueCalendar";
import { WeeklyReport } from "./WeeklyReport";
import { NotificationCenter } from "./NotificationCenter";
import { MilestoneToast, checkMilestones } from "./MilestoneToast";
import { ForecastCard } from "./ForecastCard";
import { supabase } from "../../../../lib/supabase";
import { calculateHealthMetrics, buildTaxCalendar, getUrgencyColor, getTaxCategoryLabel } from "@build-up/shared";

type Props = { d: DashboardHook };

type DailyEntry = { date: string; sales: number; customers: number };
type InventoryEntry = {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  minThreshold?: number;
  category?: string;
  unitCost?: number;
  expiryDate?: string;
  supplierName?: string;
  supplierUrl?: string;
  leadTimeDays?: number;
  dailyUsage?: number;
  lastOrderedAt?: string;
  wasteLog?: Array<{ date: string; qty: number; reason: string }>;
};
type EmployeeEntry = {
  id: string;
  name: string;
  hourlyWage?: number;
  weeklyHours?: number;
  isInsured?: boolean;
};

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
  const ko = d.language === "ko";
  const isStaff = d.userRole === "staff";
  const isStartupCompany = d.businessCtx.categoryId === "startup-tech";
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dismissedMilestones, setDismissedMilestones] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("dismissedMilestones");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isWide = viewportWidth >= 980;
  const isThreeUp = viewportWidth >= 1220;

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const allEntries = d.dailyEntries as DailyEntry[];
  const monthEntries = allEntries.filter((entry) => entry.date.startsWith(currentMonth));
  const todayEntry = allEntries.find((entry) => entry.date === todayStr);
  const recent7Entries = allEntries.slice(-7);
  const previous7Entries = allEntries.slice(-14, -7);

  const totalSales = monthEntries.reduce((sum, entry) => sum + entry.sales, 0);
  const totalCustomers = monthEntries.reduce((sum, entry) => sum + entry.customers, 0);
  const workingDays = monthEntries.length;
  const avgDailySales = workingDays > 0 ? totalSales / workingDays : 0;
  const recent7Sales = recent7Entries.reduce((sum, entry) => sum + entry.sales, 0);
  const previous7Sales = previous7Entries.reduce((sum, entry) => sum + entry.sales, 0);
  const weeklySalesChange =
    previous7Sales > 0 ? Math.round(((recent7Sales - previous7Sales) / previous7Sales) * 100) : 0;
  const recent7Customers = recent7Entries.reduce((sum, entry) => sum + entry.customers, 0);
  const activeDays7 = recent7Entries.filter((entry) => entry.sales > 0 || entry.customers > 0).length;

  const monthlyCosts = d.monthlyCosts as {
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    other: number;
  };
  const totalCosts =
    monthlyCosts.ingredients +
    monthlyCosts.labor +
    monthlyCosts.rent +
    monthlyCosts.utilities +
    monthlyCosts.other;
  const netProfit = totalSales - totalCosts;
  const projectedSales =
    workingDays > 0
      ? totalSales +
        avgDailySales *
          (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
            new Date().getDate())
      : 0;
  const projectedProfit = projectedSales - totalCosts;
  const ingredientRatio = totalSales > 0 ? (monthlyCosts.ingredients / totalSales) * 100 : 0;
  const laborRatio = totalSales > 0 ? (monthlyCosts.labor / totalSales) * 100 : 0;
  const rentRatio = totalSales > 0 ? (monthlyCosts.rent / totalSales) * 100 : 0;
  const primeCost = ingredientRatio + laborRatio;
  const bepProgress = totalCosts > 0 ? Math.min(100, (totalSales / totalCosts) * 100) : 0;

  // BEP 실시간 추적 (일일 손익분기)
  const healthMetrics = calculateHealthMetrics(
    allEntries as Array<{ date: string; sales: number; customers: number }>,
    monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number },
  );
  // 세금 캘린더
  const taxCalendar = buildTaxCalendar({
    isSimplified: ((d.taxSettings as { vatType?: string })?.vatType ?? "general") === "simplified",
    hasEmployees: (d.employees as unknown[])?.length > 0,
  });
  const nextTaxItem = taxCalendar.next;

  const breakEvenDailySales = healthMetrics.breakEvenDailySales;
  const daysAboveBreakEven = healthMetrics.daysAboveBreakEven;
  const todaySales = (allEntries.find(e => e.date === todayStr) as { sales: number } | undefined)?.sales ?? 0;
  const todayBepProgress = breakEvenDailySales > 0 ? Math.min(100, Math.round((todaySales / breakEvenDailySales) * 100)) : 0;

  /* previous month data from costHistory */
  const costHistory = d.costHistory as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>;
  const prevMonthKey = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const prevSnap = costHistory.find(h => h.month === prevMonthKey);
  const prevMonthCosts = prevSnap ? prevSnap.ingredients + prevSnap.labor + prevSnap.rent + prevSnap.utilities + prevSnap.other : undefined;
  const prevMonthEntries = allEntries.filter(e => e.date.startsWith(prevMonthKey));
  const prevMonthSales = prevMonthEntries.length > 0 ? prevMonthEntries.reduce((s, e) => s + e.sales, 0) : undefined;

  const inventory = d.inventory as InventoryEntry[];
  const lowStockItems = inventory.filter((item) => item.quantity <= (item.minThreshold ?? 0));
  const employees = d.employees as EmployeeEntry[];
  const estimatedMonthlyPayroll = employees.reduce(
    (sum, employee) => sum + (employee.hourlyWage ?? 0) * (employee.weeklyHours ?? 0) * 4.34,
    0
  );
  const insuredEmployees = employees.filter((employee) => employee.isInsured).length;
  const monthlyBurn = Math.max(totalCosts - totalSales, 0);
  const launchDateText =
    typeof window !== "undefined" ? window.localStorage.getItem("businessLaunchedDate") : null;
  const launchDate =
    launchDateText && !Number.isNaN(new Date(launchDateText).getTime())
      ? new Date(launchDateText)
      : null;
  const daysSinceLaunch = launchDate
    ? Math.max(0, Math.round((Date.now() - launchDate.getTime()) / 86400000))
    : 0;
  const capitalLeft = Math.max(0, (d.selectedBudget ?? 0) - totalCosts * (daysSinceLaunch / 30));
  const runwayMonths =
    totalCosts > 0 && netProfit < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(netProfit))) : -1;
  const healthTone =
    d.businessHealthScore === "healthy"
      ? "#177245"
      : d.businessHealthScore === "danger"
        ? "#b42318"
        : d.businessHealthScore === "caution"
          ? "#b54708"
          : "rgba(15, 23, 42, 0.82)";
  const healthLabel =
    d.businessHealthScore === "healthy"
      ? ko
        ? "안정"
        : "Healthy"
      : d.businessHealthScore === "danger"
        ? ko
          ? "위험"
          : "Critical"
        : d.businessHealthScore === "caution"
          ? ko
            ? "주의"
            : "Caution"
          : ko
            ? "미확인"
            : "Unknown";
  const weeklySignalLabel =
    previous7Sales > 0
      ? `${weeklySalesChange >= 0 ? "+" : ""}${weeklySalesChange}%`
      : ko
        ? "비교 데이터 없음"
        : "No comparison";
  const topRiskLabel =
    runwayMonths >= 0 && runwayMonths <= 3
      ? ko
        ? `런웨이 ${runwayMonths}개월`
        : `${runwayMonths} mo runway`
      : lowStockItems.length > 0
        ? ko
          ? `재고 경고 ${lowStockItems.length}건`
          : `${lowStockItems.length} stock alerts`
        : employees.length === 0
          ? ko
            ? "인력 플랜 필요"
            : "Team plan needed"
          : ko
            ? "핵심 리스크 낮음"
            : "Low immediate risk";
  const focusMessage =
    runwayMonths >= 0 && runwayMonths <= 3
      ? ko
        ? "지금은 성장보다 현금 방어가 우선입니다. 고정비와 저효율 지출부터 줄이세요."
        : "Cash defense comes before growth. Cut fixed and low-efficiency spend first."
      : weeklySalesChange < 0
        ? ko
          ? "전주 대비 하락세입니다. 신규 유입보다 재구매와 전환 병목부터 점검하세요."
          : "Weekly trend is down. Fix retention and conversion before chasing more acquisition."
        : lowStockItems.length > 0
          ? ko
            ? "매출을 만들 수 있어도 재고가 막으면 성장이 멈춥니다. 발주 우선순위를 정하세요."
            : "Stockouts can kill growth. Prioritize reorder decisions now."
          : ko
            ? "오늘은 매출 기록, 병목 점검, 핵심 운영 자산 유지에 집중하면 됩니다."
            : "Today, focus on logging revenue, checking bottlenecks, and protecting core operations.";

  useEffect(() => {
    if (!d.aiActions && !d.aiActionsLoading && d.businessLaunched && d.storeName) {
      void d.fetchAiActions();
    }
  }, [d]);

  /* ── streak computation ── */
  const streak = (() => {
    let count = 0;
    const checkDate = new Date();
    const todayE = allEntries.find(e => e.date === todayStr);
    if (!todayE) checkDate.setDate(checkDate.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().slice(0, 10);
      if (allEntries.some(e => e.date === ds)) { count++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }
    return count;
  })();

  /* ── milestone check ── */
  const healthScore = typeof d.businessHealthScore === "string" ? (d.businessHealthScore === "healthy" ? 85 : d.businessHealthScore === "caution" ? 55 : 30) : 0;
  const currentMilestone = checkMilestones({
    streak,
    totalEntries: allEntries.length,
    bepProgress,
    healthScore,
    completedStages: d.completedCount,
    dismissed: dismissedMilestones,
    ko,
  });
  const handleDismissMilestone = () => {
    if (!currentMilestone) return;
    const next = new Set(dismissedMilestones);
    next.add(currentMilestone.id);
    setDismissedMilestones(next);
    try { localStorage.setItem("dismissedMilestones", JSON.stringify([...next])); } catch {}
  };

  const headlineStats = isStaff ? [] : [
    {
      label: isStartupCompany ? (ko ? "월 Burn / 손익" : "Monthly burn / P&L") : ko ? "월 손익" : "Monthly P&L",
      value: totalSales > 0 || totalCosts > 0 ? `${netProfit >= 0 ? "+" : ""}${fmt(netProfit)}` : "—",
      note:
        totalCosts > 0
          ? ko
            ? `월 비용 ${fmt(totalCosts)}`
            : `Costs ${fmt(totalCosts)}`
          : ko
            ? "비용 입력 필요"
            : "Need monthly costs",
      tone: netProfit > 0 ? "#177245" : netProfit < 0 ? "#b42318" : "rgba(15, 23, 42, 0.82)",
    },
    {
      label: ko ? "현금 런웨이" : "Cash runway",
      value:
        totalCosts > 0
          ? runwayMonths < 0
            ? ko
              ? "흑자"
              : "Positive"
            : `${runwayMonths}${ko ? "개월" : " mo"}`
          : "—",
      note:
        d.selectedBudget
          ? ko
            ? `가용 현금 ${fmt(capitalLeft)}`
            : `Cash left ${fmt(capitalLeft)}`
          : ko
            ? "예산 입력 필요"
            : "Need starting cash",
      tone: runwayMonths >= 0 && runwayMonths <= 3 ? "#b42318" : "rgba(15, 23, 42, 0.82)",
    },
    {
      label: isStartupCompany ? (ko ? "로드맵 실행" : "Roadmap execution") : ko ? "현재 재고" : "Inventory",
      value: isStartupCompany
        ? `${d.completedCount}/${d.pathTotalStages}`
        : inventory.length > 0
          ? `${inventory.length}${ko ? "개" : ""}`
          : ko
            ? "미등록"
            : "Empty",
      note:
        isStartupCompany
          ? d.nextRoadmapStage
            ? `${d.nextRoadmapStage.title}`
            : ko
              ? "현재 단계 완료"
              : "Current stage complete"
          : lowStockItems.length > 0
          ? ko
            ? `부족 ${lowStockItems.length}개 품목`
            : `${lowStockItems.length} low-stock items`
          : ko
            ? "재고 상태 안정"
            : "Stock looks stable",
      tone: "rgba(15, 23, 42, 0.94)",
    },
    {
      label: ko ? "직원 관리" : "Staff",
      value: employees.length > 0 ? `${employees.length}${ko ? "명" : ""}` : ko ? "미등록" : "No staff",
      note:
        employees.length > 0
          ? ko
            ? `예상 인건비 ${fmt(estimatedMonthlyPayroll)}`
            : `Payroll ${fmt(estimatedMonthlyPayroll)}`
          : ko
            ? "직원 정보 추가"
            : "Add staff",
      tone: "rgba(15, 23, 42, 0.94)",
    },
    ...(nextTaxItem ? [{
      label: ko ? "다음 세금 마감" : "Next tax deadline",
      value: nextTaxItem.daysUntil <= 0
        ? (ko ? "오늘 마감!" : "Due today!")
        : nextTaxItem.daysUntil <= 7
          ? `D-${nextTaxItem.daysUntil}`
          : `${nextTaxItem.daysUntil}${ko ? "일 후" : "d"}`,
      note: nextTaxItem.summary,
      tone: nextTaxItem.daysUntil <= 7 ? "#b42318" : nextTaxItem.daysUntil <= 30 ? "#b54708" : "rgba(15, 23, 42, 0.82)",
    }] : []),
  ];

  return (
    <section style={shell}>
      <style>{bentoHoverCSS}</style>
      <div style={heroPanel} className="bento-card">
        <div style={heroHeader}>
          <div>
            <div style={heroEyebrow}>{ko ? "운영 홈" : "Operations home"}</div>
            <h1 style={heroTitle}>{d.storeName || (ko ? "내 가게" : "My Store")}</h1>
            <p style={heroBody}>
              {isStartupCompany
                ? ko
                  ? "기술 스타트업 모드입니다. 첫 화면에는 런웨이, 주간 성장, 월 burn/손익, 팀, 실행 단계, 오늘의 우선순위만 남겼습니다."
                  : "Startup mode keeps only the numbers that matter right now: runway, weekly growth, monthly burn/P&L, team, execution progress, and today's priorities."
                : ko
                  ? "첫 화면은 매일 경영 판단에 직접 쓰는 숫자만 남겼습니다. 현금, 7일 흐름, 월 손익, 재고, 직원, 그리고 오늘의 우선순위를 한 번에 봅니다."
                  : "This home screen keeps only the numbers you use to run the business every day: cash, 7-day trend, monthly P&L, inventory, staff, and today's priorities."}
            </p>
          </div>
          <div style={heroActions}>
            <NotificationCenter d={d} ko={ko} />
            {!isStaff && (
              <>
                <button type="button" onClick={() => d.router.push("/analysis")} style={primaryAction} className="bento-btn">
                  {ko ? "경영 분석" : "Analysis"}
                </button>
                <button type="button" onClick={() => { d.setSelectedStoreIndex(0); d.navigateToSurface("analytics"); }} style={secondaryAction} className="bento-btn">
                  {ko ? "가게 정보" : "Store Info"}
                </button>
              </>
            )}
          </div>
        </div>

        {headlineStats.length > 0 && (
        <div style={headlineGrid}>
          {headlineStats.map((item, idx) => (
            <div key={item.label} style={{ ...headlineCard, animationDelay: `${idx * 60}ms` }} className="bento-headline bento-fade-in">
              <div style={headlineLabel}>{item.label}</div>
              <div style={{ ...headlineValue, color: item.tone }} className="bento-number">{item.value}</div>
              <div style={headlineNote}>{item.note}</div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div
        style={{
          ...survivalGrid,
          gridTemplateColumns: isWide ? "minmax(0, 1.15fr) minmax(360px, 0.85fr)" : "1fr",
        }}
      >
        <ActivitySnapshotCard
          d={d}
          ko={ko}
          todayStr={todayStr}
          recent7Entries={recent7Entries}
          recent7Sales={recent7Sales}
          weeklySalesChange={weeklySalesChange}
          todayEntry={todayEntry ?? null}
          avgDailySales={avgDailySales}
          fmt={fmt}
          onOpenCalendar={() => setShowCalendar(true)}
        />
        {!isStaff && (
          <SurvivalBoardCard
            ko={ko}
            isStartupCompany={isStartupCompany}
            runwayMonths={runwayMonths}
            capitalLeft={capitalLeft}
            weeklySalesChange={weeklySalesChange}
            weeklySignalLabel={weeklySignalLabel}
            healthLabel={healthLabel}
            healthTone={healthTone}
            topRiskLabel={topRiskLabel}
            focusMessage={focusMessage}
            d={d}
          />
        )}
      </div>

      <div
        style={{
          ...coreGrid,
          gridTemplateColumns: isThreeUp ? "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)" : isWide ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
        }}
      >
        {!isStaff && isStartupCompany ? (
          <StartupMetricsCard
            ko={ko}
            recent7Customers={recent7Customers}
            activeDays7={activeDays7}
            weeklySalesChange={weeklySalesChange}
            monthlyBurn={monthlyBurn}
            runwayMonths={runwayMonths}
            employeesCount={employees.length}
            roadmapProgress={d.pathTotalStages > 0 ? Math.round((d.completedCount / d.pathTotalStages) * 100) : 0}
            fmt={fmt}
          />
        ) : null}
        {!isStaff && (
          <PLHeroCard
            totalSales={totalSales}
            totalCosts={totalCosts}
            netProfit={netProfit}
            bepProgress={bepProgress}
            ingredientRatio={ingredientRatio}
            laborRatio={laborRatio}
            rentRatio={rentRatio}
            primeCost={primeCost}
            projectedProfit={projectedProfit}
            workingDays={workingDays}
            ko={ko}
            fmt={fmt}
            prevMonthSales={prevMonthSales}
            prevMonthCosts={prevMonthCosts}
            breakEvenDailySales={breakEvenDailySales}
            todaySales={todaySales}
            todayBepProgress={todayBepProgress}
            daysAboveBreakEven={daysAboveBreakEven}
            totalDaysRecorded={healthMetrics.totalDaysRecorded}
          />
        )}
        <InventoryOpsCard ko={ko} inventory={inventory} lowStockItems={lowStockItems} d={d} />
        <StaffOpsCard
          ko={ko}
          employees={employees}
          estimatedMonthlyPayroll={estimatedMonthlyPayroll}
          insuredEmployees={insuredEmployees}
          totalSales={totalSales}
          d={d}
        />
      </div>

      {/* ── Weekly Report (owner only) ── */}
      {!isStaff && <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
        {streak >= 7 ? (
          <WeeklyReport d={d} ko={ko} fmt={fmt} />
        ) : (
          <div style={{
            borderRadius: "28px", padding: "24px", textAlign: "center" as const,
            background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
            border: "1px solid rgba(15,23,42,0.06)",
          }}>
            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="6" y="13" width="16" height="11" rx="3" stroke="rgba(15,23,42,0.35)" strokeWidth="1.5" fill="rgba(15,23,42,0.04)" />
                <path d="M10 13V9.5a4 4 0 1 1 8 0V13" stroke="rgba(15,23,42,0.35)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="14" cy="18.5" r="1.5" fill="rgba(15,23,42,0.3)" />
                <path d="M14 20v1.5" stroke="rgba(15,23,42,0.3)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>
              {ko ? "주간 리포트" : "Weekly Report"}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.48)", marginTop: "4px", lineHeight: 1.5 }}>
              {ko
                ? `7일 연속 매출 기록 시 해금됩니다 (현재 ${streak}일)`
                : `Unlocks at 7-day streak (current: ${streak}d)`}
            </div>
            <div style={{
              marginTop: "12px", height: "6px", borderRadius: "3px",
              background: "rgba(15,23,42,0.06)", overflow: "hidden", maxWidth: "200px", marginInline: "auto",
            }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${Math.min(100, (streak / 7) * 100)}%`,
                background: "linear-gradient(90deg, #2563eb, #457b9d)",
                transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
              }} />
            </div>
            {/* 다음 해금 단계 안내 */}
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "center", gap: "12px" }}>
              {[
                { days: 7, label: ko ? "주간 리포트" : "Weekly", icon: "📊", color: "#2563eb" },
                { days: 30, label: ko ? "월간 트렌드" : "Monthly", icon: "📈", color: "#7c3aed" },
                { days: 90, label: ko ? "연간 리포트" : "Annual", icon: "💎", color: "#059669" },
              ].map(tier => (
                <div key={tier.days} style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "3px",
                  opacity: streak >= tier.days ? 1 : 0.4,
                }}>
                  <span style={{ fontSize: "16px" }}>{streak >= tier.days ? "✓" : tier.icon}</span>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: streak >= tier.days ? tier.color : "rgba(15,23,42,0.35)" }}>
                    {tier.days}{ko ? "일" : "d"}
                  </span>
                  <span style={{ fontSize: "9px", color: "rgba(15,23,42,0.3)" }}>{tier.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>}

      {/* ── 매출 예측 + "이대로 가면" 시나리오 (owner only) ── */}
      {!isStaff && allEntries.length >= 3 && (
        <ForecastCard
          ko={ko}
          dailyEntries={allEntries as Array<{ date: string; sales: number; customers: number }>}
          monthlyCosts={d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number }}
          capitalLeft={capitalLeft}
          breakEvenDailySales={breakEvenDailySales}
          industryCategoryId={d.industryCategoryId}
        />
      )}

      {!isStaff && <section style={detailSection}>
        <div style={detailSectionHeader}>
          <div>
            <div style={sectionEyebrow}>{ko ? "추가 관리" : "More controls"}</div>
            <div style={detailSectionTitle}>
              {ko ? "세부 입력과 편집은 아래에서 필요할 때만 펼쳐보세요" : "Open detailed controls below only when you need them"}
            </div>
          </div>
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
              <button type="button" onClick={() => setShowCalendar(false)} style={{ background: "rgba(15,23,42,0.06)", border: "none", borderRadius: "999px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "rgba(15,23,42,0.5)" }}>✕</button>
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

function ActivitySnapshotCard({
  d,
  ko,
  todayStr,
  recent7Entries,
  recent7Sales,
  weeklySalesChange,
  todayEntry,
  avgDailySales,
  fmt,
  onOpenCalendar,
}: {
  d: DashboardHook;
  ko: boolean;
  todayStr: string;
  recent7Entries: DailyEntry[];
  recent7Sales: number;
  weeklySalesChange: number;
  todayEntry: DailyEntry | null;
  avgDailySales: number;
  fmt: (n: number) => string;
  onOpenCalendar: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [postEntryReaction, setPostEntryReaction] = useState<string | null>(null);

  // 매출 입력 후 즉시 반응 생성 (AI 호출 없이 수식 기반)
  const generatePostEntryReaction = (sales: number, customers: number) => {
    const allE = d.dailyEntries as DailyEntry[];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yEntry = allE.find(e => e.date === yesterday.toISOString().slice(0, 10));

    // BEP 비교
    const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
    const fixedDaily = (mc.labor + mc.rent + mc.utilities + mc.other) / 26;
    const totalRev = allE.reduce((s, e) => s + e.sales, 0);
    const cogsRate = totalRev > 0 ? mc.ingredients / totalRev : 0.33;
    const bepDaily = cogsRate < 1 ? Math.round(fixedDaily / (1 - cogsRate)) : 0;

    // 어제 대비
    if (yEntry && yEntry.sales > 0) {
      const diff = Math.round(((sales - yEntry.sales) / yEntry.sales) * 100);
      if (sales >= bepDaily && diff >= 0) {
        return ko ? `BEP 달성 + 어제 대비 +${diff}%. 좋은 하루입니다` : `Above BEP + ${diff}% vs yesterday. Good day`;
      }
      if (sales >= bepDaily) {
        return ko ? `BEP 달성. 어제보다 ${Math.abs(diff)}% 하락했지만 흑자 구간` : `Above BEP but ${Math.abs(diff)}% below yesterday`;
      }
      if (diff >= 10) {
        return ko ? `어제 대비 +${diff}% 상승. BEP까지 ${fmt(bepDaily - sales)} 부족` : `+${diff}% vs yesterday. ${fmt(bepDaily - sales)} short of BEP`;
      }
    }

    // BEP만 비교
    if (bepDaily > 0 && sales >= bepDaily) {
      return ko ? `오늘 BEP 달성. 이 페이스면 월 흑자 가능` : `BEP reached today. On track for monthly profit`;
    }
    if (bepDaily > 0 && sales > 0) {
      const gap = bepDaily - sales;
      return ko ? `BEP까지 ${fmt(gap)} 부족. 내일 ${fmt(Math.round(gap * 0.5))} 더 올리면 주간 균형` : `${fmt(gap)} short of BEP`;
    }

    // 기본
    if (customers > 0 && sales > 0) {
      const ticket = Math.round(sales / customers);
      return ko ? `객단가 ${fmt(ticket)}. 기록 완료` : `Avg ticket ${fmt(ticket)}. Logged`;
    }
    return ko ? "기록 완료" : "Logged";
  };

  const last7 = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
  const entryMap = Object.fromEntries(recent7Entries.map((entry) => [entry.date, entry]));
  const bars = last7.map((date) => ({
    date,
    sales: entryMap[date]?.sales ?? 0,
    label: new Date(`${date}T12:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", {
      weekday: ko ? "narrow" : "short",
    }),
    isToday: date === todayStr,
  }));
  const maxSales = Math.max(...bars.map((bar) => bar.sales), 1);

  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "rgba(255,255,255,0.92)",
    flex: 1,
    minWidth: 0,
    boxSizing: "border-box",
  };

  return (
    <section style={activityCard} className="bento-card">
      <div style={activityHeader}>
        <div>
          <div style={sectionEyebrow}>{ko ? "오늘 + 최근 7일" : "Today + last 7 days"}</div>
          <div style={activityTitle}>{ko ? "매출 흐름과 오늘 입력" : "Revenue flow and today's log"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={activityStatRail}>
            <div style={activityMiniStat}>
              <div style={activityMiniLabel}>{ko ? "최근 7일" : "Last 7 days"}</div>
              <div style={activityMiniValue}>{fmt(recent7Sales)}</div>
            </div>
            <div style={activityMiniStat}>
              <div style={activityMiniLabel}>{ko ? "주간 변화" : "Weekly change"}</div>
              <div style={{ ...activityMiniValue, color: weeklySalesChange >= 0 ? "#177245" : "#b42318" }}>
                {weeklySalesChange >= 0 ? "+" : ""}{weeklySalesChange}%
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCalendar}
            title={ko ? "매출 캘린더" : "Revenue calendar"}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "34px", height: "34px", borderRadius: "9px",
              border: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.82)",
              cursor: "pointer", flexShrink: 0, transition: "background 0.15s ease",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" fill="none" />
              <path d="M2 6.5h12" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" />
              <path d="M5.5 1.5v3M10.5 1.5v3" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="5.5" cy="9.5" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="8" cy="9.5" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="10.5" cy="9.5" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="5.5" cy="11.75" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="8" cy="11.75" r="0.75" fill="rgba(15,23,42,0.45)" />
            </svg>
          </button>
        </div>
      </div>

      <div style={activityChartWrap}>
        {bars.map((bar) => {
          const height = bar.sales > 0 ? Math.max(8, (bar.sales / maxSales) * 92) : 4;
          return (
            <div key={bar.date} style={{ ...activityBarCol, cursor: "pointer" }} onClick={() => {
              const allE = d.dailyEntries as DailyEntry[];
              const entry = allE.find(e => e.date === bar.date);
              d.setDailyDateInput(bar.date);
              if (entry) {
                d.setDailySalesInput(String(Math.round(entry.sales / 10000)));
                d.setDailyCustomersInput(String(entry.customers));
              } else {
                d.setDailySalesInput("");
                d.setDailyCustomersInput("");
              }
            }}>
              <div style={activityBarTrack}>
                <div
                  className="bento-meter-fill"
                  style={{
                    ...activityBarFill,
                    height,
                    background: bar.isToday
                      ? "linear-gradient(180deg, #1d3557 0%, #457b9d 100%)"
                      : bar.sales > 0
                        ? "linear-gradient(180deg, rgba(29,53,87,0.35) 0%, rgba(29,53,87,0.15) 100%)"
                        : "linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.04) 100%)",
                    borderRadius: "6px 6px 2px 2px",
                    boxShadow: bar.isToday ? "0 -4px 12px rgba(29,53,87,0.15)" : "none",
                    transition: "height 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease",
                  }}
                />
              </div>
              {bar.sales > 0 && (
                <div style={{ fontSize: "9px", fontWeight: 650, color: bar.isToday ? "#1d3557" : "rgba(15,23,42,0.3)", marginBottom: "1px", fontVariantNumeric: "tabular-nums" as const }}>
                  {bar.sales >= 10000 ? `${Math.round(bar.sales / 10000)}` : ""}
                </div>
              )}
              <div style={{ ...activityBarLabel, color: bar.isToday ? "#0f172a" : "rgba(15,23,42,0.38)", fontWeight: bar.isToday ? 650 : 500 }}>{bar.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ ...activityFooter, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* ── 왼쪽: 오늘 상태 + 입력/수정 폼 + 상품별 매출 ── */}
        <div>
        {(() => {
          const allE = d.dailyEntries as DailyEntry[];
          const isEditing = editMode;
          const isToday = d.dailyDateInput === todayStr;

          // streak
          let streak = 0;
          const checkDate = new Date();
          if (!todayEntry) checkDate.setDate(checkDate.getDate() - 1);
          for (let i = 0; i < 365; i++) {
            const ds = checkDate.toISOString().slice(0, 10);
            if (allE.some(e => e.date === ds)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
            else break;
          }

          // missed days
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const missedDays: string[] = [];
          for (let i = 0; i < 3; i++) {
            const dt = new Date(); dt.setDate(dt.getDate() - i);
            const ds = dt.toISOString().slice(0, 10);
            if (!allE.some(e => e.date === ds)) missedDays.push(ds);
          }

          // yesterday comparison
          const yEntry = allE.find(e => e.date === yesterday.toISOString().slice(0, 10));
          const yesterdayDiff = todayEntry && yEntry && yEntry.sales > 0
            ? Math.round(((todayEntry.sales - yEntry.sales) / yEntry.sales) * 100)
            : null;

          // 수정 모드 진입
          const enterEdit = (dateStr: string) => {
            const entry = allE.find(e => e.date === dateStr);
            d.setDailyDateInput(dateStr);
            if (entry) {
              d.setDailySalesInput(String(Math.round(entry.sales / 10000)));
              d.setDailyCustomersInput(String(entry.customers));
              setEditMode(true);
            } else {
              d.setDailySalesInput("");
              d.setDailyCustomersInput("");
              setEditMode(false);
            }
          };

          // 삭제
          const handleDelete = (dateStr: string) => {
            const next = allE.filter(e => e.date !== dateStr);
            d.setDailyEntries(next);
            try { localStorage.setItem("dailyEntries", JSON.stringify(next)); } catch {}
            d.setDailySalesInput("");
            d.setDailyCustomersInput("");
            d.setDailyDateInput(todayStr);
            setEditMode(false);
          };

          return (
            <>
              {/* 오늘 상태 요약 */}
              <div style={activityTodaySummary}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <div style={activityMiniLabel}>{isToday ? (ko ? "오늘 상태" : "Today") : new Date(d.dailyDateInput + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" })}</div>
                  {streak >= 3 && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#e85d04", background: "rgba(232,93,4,0.08)", borderRadius: "6px", padding: "2px 8px" }}>
                      🔥 {streak}{ko ? "일 연속" : "d streak"}
                    </span>
                  )}
                  {missedDays.length >= 2 && (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#b42318", background: "rgba(180,35,24,0.06)", borderRadius: "6px", padding: "2px 8px" }}>
                      {missedDays.length}{ko ? "일째 미기록" : "d not logged"}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <div style={activityTodayValue}>
                    {todayEntry ? fmt(todayEntry.sales) : ko ? "아직 미입력" : "Not logged yet"}
                  </div>
                  {/* 수정 버튼 */}
                  {todayEntry && (
                    <button type="button" onClick={() => enterEdit(todayStr)}
                      style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                      {ko ? "수정" : "Edit"}
                    </button>
                  )}
                </div>

                {yesterdayDiff != null && (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: yesterdayDiff >= 0 ? "#177245" : "#b42318", marginTop: "2px" }}>
                    {ko ? "어제 대비" : "vs yesterday"} {yesterdayDiff >= 0 ? "+" : ""}{yesterdayDiff}%
                  </div>
                )}

                <div style={activityTodayMeta}>
                  {todayEntry
                    ? todayEntry.customers > 0
                      ? ko
                        ? `고객 ${todayEntry.customers}명 · 객단가 ${fmt(todayEntry.sales / todayEntry.customers)}`
                        : `${todayEntry.customers} customers · avg ${fmt(todayEntry.sales / todayEntry.customers)}`
                      : ko ? "고객 수 미입력" : "Customer count missing"
                    : ko ? `최근 평균 ${fmt(avgDailySales)}` : `Recent avg ${fmt(avgDailySales)}`}
                </div>

                {/* 미입력 날짜 빠른 선택 */}
                {missedDays.length > 0 && !todayEntry && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                    {missedDays.map(ds => (
                      <button key={ds} type="button" onClick={() => enterEdit(ds)}
                        style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.08)", background: d.dailyDateInput === ds ? "rgba(15,23,42,0.08)" : "transparent", color: "rgba(15,23,42,0.6)", cursor: "pointer" }}>
                        {new Date(`${ds}T12:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" })}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 입력/수정 폼 */}
              <div style={{ marginTop: "8px" }}>
                {isEditing && (
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5V8.5z" stroke="#2563eb" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                    {ko ? "수정 모드" : "Edit mode"} — {new Date(d.dailyDateInput + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" })}
                  </div>
                )}
                <div style={activityForm}>
                  <input type="date" value={d.dailyDateInput}
                    onChange={(event) => enterEdit(event.target.value)}
                    style={{ ...inputStyle, flex: "0 0 148px" }} />
                  <input type="text" inputMode="numeric" value={d.dailySalesInput}
                    onChange={(event) => d.setDailySalesInput(event.target.value.replace(/[^0-9]/g, ""))}
                    placeholder={ko ? "매출 (만원)" : "Sales (만원)"}
                    style={inputStyle} />
                  <input type="text" inputMode="numeric" value={d.dailyCustomersInput}
                    onChange={(event) => d.setDailyCustomersInput(event.target.value.replace(/[^0-9]/g, ""))}
                    placeholder={ko ? "고객 수" : "Customers"}
                    style={{ ...inputStyle, flex: "0 0 116px" }} />
                  <button type="button" onClick={() => {
                    const salesVal = (Number(d.dailySalesInput.replace(/[^0-9]/g, "")) || 0) * 10000;
                    const custVal = Number(d.dailyCustomersInput.replace(/[^0-9]/g, "")) || 0;
                    d.handleAddDailyEntry();
                    setEditMode(false);
                    if (salesVal > 0) {
                      setPostEntryReaction(generatePostEntryReaction(salesVal, custVal));
                      setTimeout(() => setPostEntryReaction(null), 8000);
                    }
                  }} disabled={!d.dailySalesInput}
                    style={{ ...secondaryAction, padding: "12px 18px", background: d.dailySalesInput ? "#0f172a" : "rgba(15,23,42,0.06)", color: d.dailySalesInput ? "#fff" : "rgba(15,23,42,0.34)", border: "none" }}>
                    {isEditing ? (ko ? "수정" : "Update") : (ko ? "저장" : "Save")}
                  </button>
                </div>
                {/* 수정 모드에서 삭제 + 취소 */}
                {isEditing && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <button type="button" onClick={() => handleDelete(d.dailyDateInput)}
                      style={{ fontSize: "12px", fontWeight: 600, color: "#b42318", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                      {ko ? "이 기록 삭제" : "Delete this entry"}
                    </button>
                    <button type="button" onClick={() => { d.setDailySalesInput(""); d.setDailyCustomersInput(""); d.setDailyDateInput(todayStr); setEditMode(false); }}
                      style={{ fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.4)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                      {ko ? "취소" : "Cancel"}
                    </button>
                  </div>
                )}
              </div>

              {/* 매출 입력 후 즉시 반응 */}
              {postEntryReaction && (
                <div style={{
                  marginTop: "10px", padding: "10px 14px", borderRadius: "12px",
                  background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)",
                  display: "flex", alignItems: "center", gap: "8px",
                  animation: "fadeIn 0.3s ease",
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="6" stroke="#2563eb" strokeWidth="1.2" fill="none" />
                    <path d="M5 7l1.5 1.5L9 5.5" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af", lineHeight: 1.4 }}>
                    {postEntryReaction}
                  </span>
                </div>
              )}
            </>
          );
        })()}

        {/* ── 상품별 매출 입력 (접히는 영역) ── */}
        <ProductSalesEntry d={d} ko={ko} fmt={fmt} onSalesApplied={(sales, customers) => {
          setPostEntryReaction(generatePostEntryReaction(sales, customers));
          setTimeout(() => setPostEntryReaction(null), 8000);
        }} />
        </div>

        {/* ── 오른쪽: 오늘 판매 현황 ── */}
        <TodaySalesSummary d={d} ko={ko} fmt={fmt} />
      </div>
    </section>
  );
}

function ProductSalesEntry({ d, ko, fmt, onSalesApplied }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string; onSalesApplied?: (sales: number, customers: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});

  // 판매 상품: inventory에서 itemType=product이거나, products 배열에서 가져옴
  const invProducts = (d.inventory as Array<{ id: string; name: string; sellingPrice?: number; itemType?: string; unitCost?: number }>)
    .filter((item) => item.itemType === "product" && (item.sellingPrice ?? 0) > 0)
    .map((item) => ({ id: item.id, name: item.name, price: item.sellingPrice ?? 0 }));

  const standaloneProducts = (d.products as unknown as Array<{ id: string; name: string; price: number; cost: number }>)
    .filter((p) => p.price > 0)
    .map((p) => ({ id: p.id, name: p.name, price: p.price }));

  // 중복 제거 (이름 기준)
  const seen = new Set<string>();
  const products = [...invProducts, ...standaloneProducts].filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  if (products.length === 0) return null;

  const totalFromProducts = Object.entries(soldCounts).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p?.price ?? 0) * qty;
  }, 0);

  const handleTap = (id: string) => {
    setSoldCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleMinus = (id: string) => {
    setSoldCounts((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) > 0) next[id] = (next[id] ?? 0) - 1;
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const handleApply = () => {
    if (totalFromProducts <= 0) return;

    // 1. 매출 입력 필드에 값 세팅
    const inManWon = String(Math.round(totalFromProducts / 10000));
    d.setDailySalesInput(inManWon);
    const totalQty = Object.values(soldCounts).reduce((s, v) => s + v, 0);
    d.setDailyCustomersInput(String(totalQty));

    // 2. 바로 저장 실행
    const entryDate = d.dailyDateInput || new Date().toISOString().slice(0, 10);
    const allE = d.dailyEntries as Array<{ date: string; sales: number; customers: number; productSales?: Record<string, number> }>;
    const existing = allE.find((e) => e.date === entryDate);

    // 상품별 판매 기록 합산
    const prevProductSales: Record<string, number> = existing?.productSales ?? {};
    const mergedProductSales: Record<string, number> = { ...prevProductSales };
    for (const [id, qty] of Object.entries(soldCounts)) {
      if (qty > 0) mergedProductSales[id] = (mergedProductSales[id] ?? 0) + qty;
    }

    const entry = {
      date: entryDate,
      sales: (existing?.sales ?? 0) + totalFromProducts,
      customers: (existing?.customers ?? 0) + totalQty,
      productSales: mergedProductSales,
    };
    const next = [...allE.filter((e) => e.date !== entry.date), entry].sort((a, b) => b.date.localeCompare(a.date));
    d.setDailyEntries(next);
    try { localStorage.setItem("dailyEntries", JSON.stringify(next)); } catch {}

    // 3. 재고 차감
    const currentInv = d.inventory as Array<{ id: string; quantity: number; itemType?: string; [k: string]: unknown }>;
    const updated = currentInv.map((item) => {
      const sold = soldCounts[item.id];
      if (sold && sold > 0 && item.itemType === "product") {
        return { ...item, quantity: Math.max(0, item.quantity - sold) };
      }
      return item;
    });
    if (updated.some((item, i) => item !== currentInv[i])) {
      d.saveInventory(updated as never);
    }

    // 4. 반응 콜백 + 입력 필드 초기화
    if (totalFromProducts > 0 && onSalesApplied) {
      onSalesApplied(entry.sales, entry.customers);
    }
    d.setDailySalesInput("");
    d.setDailyCustomersInput("");
    setSoldCounts({});
  };

  return (
    <div style={{
      marginTop: "12px", borderRadius: "16px",
      background: expanded ? "rgba(255,255,255,0.98)" : "rgba(15,23,42,0.025)",
      border: expanded ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(15,23,42,0.04)",
      overflow: expanded ? "visible" : "hidden", transition: "all 0.2s ease",
    }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="12" rx="3" stroke="rgba(15,23,42,0.45)" strokeWidth="1.2" fill="none" />
            <path d="M2 7h14" stroke="rgba(15,23,42,0.45)" strokeWidth="1.2" />
            <path d="M6 7v8M10 7v8" stroke="rgba(15,23,42,0.45)" strokeWidth="1.2" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>
            {ko ? "상품별 매출 입력" : "Sales by product"}
          </span>
          {!expanded && totalFromProducts > 0 && (
            <span style={{ fontSize: "12px", fontWeight: 650, color: "#2563eb" }}>
              {fmt(totalFromProducts)}
            </span>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          <path d="M3.5 5.5L7 9l3.5-3.5" stroke="rgba(15,23,42,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (() => {
        // 오늘 기록된 상품별 판매 내역 (이전에 저장된 것)
        const todayLog = (d.dailyEntries as Array<{ date: string; sales: number; customers: number; productSales?: Record<string, number> }>)
          .find((e) => e.date === d.dailyDateInput || e.date === new Date().toISOString().slice(0, 10));
        const savedProductSales = (todayLog as { productSales?: Record<string, number> } | undefined)?.productSales;

        return (
        <div style={{ padding: "0 16px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {/* 드롭다운 셀렉터 */}
              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => setPickerOpen(!pickerOpen)} style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", borderRadius: "12px",
                  border: pickerOpen ? "1.5px solid #2563eb" : "1px solid rgba(15,23,42,0.1)",
                  background: "#fff", cursor: "pointer", transition: "all 0.15s ease",
                }}>
                  <span style={{ fontSize: "14px", color: pickerOpen ? "#2563eb" : "rgba(15,23,42,0.45)" }}>
                    {ko ? "상품을 선택하세요" : "Select a product"}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.2s", transform: pickerOpen ? "rotate(180deg)" : "rotate(0)" }}>
                    <path d="M3.5 5.5L7 9l3.5-3.5" stroke={pickerOpen ? "#2563eb" : "rgba(15,23,42,0.35)"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* 드롭다운 목록 */}
                {pickerOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20,
                    maxHeight: "220px", overflowY: "auto",
                    borderRadius: "14px", background: "#fff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 12px 32px rgba(15,23,42,0.1)",
                  }}>
                    {products.map((p) => {
                      const alreadyAdded = (soldCounts[p.id] ?? 0) > 0;
                      return (
                        <button key={p.id} type="button"
                          onClick={() => { handleTap(p.id); setPickerOpen(false); }}
                          style={{
                            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "12px 14px", border: "none", borderBottom: "1px solid rgba(15,23,42,0.04)",
                            background: alreadyAdded ? "rgba(37,99,235,0.03)" : "transparent",
                            cursor: "pointer", transition: "background 0.1s ease",
                            textAlign: "left" as const,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", marginTop: "1px" }}>{fmt(p.price ?? 0)}</div>
                          </div>
                          {alreadyAdded ? (
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "rgba(37,99,235,0.08)", borderRadius: "6px", padding: "2px 8px" }}>
                              {soldCounts[p.id]}{ko ? "개 추가됨" : " added"}
                            </span>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 3.5v9M3.5 8h9" stroke="rgba(15,23,42,0.3)" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 선택된 상품 수량 입력 */}
              {Object.entries(soldCounts).filter(([, qty]) => qty > 0).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                  {Object.entries(soldCounts).filter(([, qty]) => qty > 0).map(([id]) => {
                    const p = products.find((x) => x.id === id);
                    if (!p) return null;
                    const count = soldCounts[id] ?? 0;
                    return (
                      <div key={id} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 12px", borderRadius: "12px",
                        background: "rgba(37,99,235,0.035)",
                        border: "1px solid rgba(37,99,235,0.1)",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a" }}>{p.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)" }}>{fmt(p.price ?? 0)} × {count} = {fmt((p.price ?? 0) * count)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", borderRadius: "9px", overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", background: "#fff" }}>
                          <button type="button" onClick={() => handleMinus(id)}
                            style={{ width: "32px", height: "34px", border: "none", cursor: "pointer", background: "transparent", fontSize: "15px", fontWeight: 500, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <input type="text" inputMode="numeric" value={String(count)}
                            onChange={(e) => { const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10); setSoldCounts((prev) => ({ ...prev, [id]: Number.isNaN(val) ? 0 : Math.max(0, val) })); }}
                            style={{ width: "40px", height: "34px", border: "none", borderLeft: "1px solid rgba(15,23,42,0.06)", borderRight: "1px solid rgba(15,23,42,0.06)", textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#2563eb", outline: "none", background: "transparent", fontVariantNumeric: "tabular-nums" }} />
                          <button type="button" onClick={() => handleTap(id)}
                            style={{ width: "32px", height: "34px", border: "none", cursor: "pointer", background: "transparent", fontSize: "15px", fontWeight: 500, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                        {/* 삭제 버튼 */}
                        <button type="button" onClick={() => setSoldCounts((prev) => { const next = { ...prev }; delete next[id]; return next; })}
                          style={{ width: "28px", height: "28px", borderRadius: "8px", border: "none", background: "rgba(15,23,42,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 3l6 6M9 3l-6 6" stroke="rgba(15,23,42,0.35)" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* total + apply */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", borderRadius: "12px",
                background: totalFromProducts > 0 ? "rgba(37,99,235,0.05)" : "rgba(15,23,42,0.02)",
                border: totalFromProducts > 0 ? "1px solid rgba(37,99,235,0.1)" : "1px solid transparent",
              }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>
                    {ko ? "합계" : "Total"}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 750, color: totalFromProducts > 0 ? "#0f172a" : "rgba(15,23,42,0.25)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", marginTop: "2px" }}>
                    {totalFromProducts > 0 ? fmt(totalFromProducts) : "—"}
                  </div>
                </div>
                <button type="button" onClick={handleApply} disabled={totalFromProducts <= 0}
                  style={{ fontSize: "13px", fontWeight: 650, padding: "10px 18px", borderRadius: "10px", border: "none", cursor: totalFromProducts > 0 ? "pointer" : "default", background: totalFromProducts > 0 ? "#0f172a" : "rgba(15,23,42,0.06)", color: totalFromProducts > 0 ? "#fff" : "rgba(15,23,42,0.3)", transition: "all 0.15s ease" }}>
                  {ko ? "매출에 반영" : "Apply"}
                </button>
              </div>
            </div>

        </div>
        );
      })()}
    </div>
  );
}

function TodaySalesSummary({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = (d.dailyEntries as Array<{ date: string; sales: number; customers: number }>)
    .find((e) => e.date === todayStr);

  // 판매 상품 목록
  const invProducts = (d.inventory as Array<{ id: string; name: string; sellingPrice?: number; itemType?: string }>)
    .filter((item) => item.itemType === "product" && (item.sellingPrice ?? 0) > 0)
    .map((item) => ({ id: item.id, name: item.name, price: item.sellingPrice ?? 0 }));
  const standaloneProducts = (d.products as unknown as Array<{ id: string; name: string; price: number }>)
    .filter((p) => p.price > 0)
    .map((p) => ({ id: p.id, name: p.name, price: p.price }));
  const seen = new Set<string>();
  const products = [...invProducts, ...standaloneProducts].filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  if (products.length === 0) return null;

  const ps = (todayEntry as { productSales?: Record<string, number> } | undefined)?.productSales;
  const soldEntries = ps ? Object.entries(ps).filter(([, qty]) => qty > 0) : [];
  const totalSold = soldEntries.reduce((s, [, q]) => s + q, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,23,42,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
        {ko ? "오늘 상품 판매" : "Today's product sales"}
      </div>

      {soldEntries.length > 0 ? (
        <>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
            {soldEntries.map(([id, qty]) => {
              const p = products.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div key={id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", borderRadius: "10px", background: "rgba(15,23,42,0.02)",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", fontVariantNumeric: "tabular-nums" }}>
                    {qty}{ko ? "개" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)" }}>
            {ko ? `총 ${totalSold}개 판매` : `${totalSold} total sold`}
          </div>
        </>
      ) : (
        <div style={{ padding: "20px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.015)", border: "1px solid rgba(15,23,42,0.04)", textAlign: "center" as const }}>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.3)", lineHeight: 1.5 }}>
            {ko ? "상품별 매출을 입력하면\n판매 수량이 여기에 표시됩니다" : "Product sales will\nappear here"}
          </div>
        </div>
      )}
    </div>
  );
}

const counterBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: "32px", height: "32px", borderRadius: "8px",
  border: "none", cursor: "pointer", fontSize: "14px",
  background: "rgba(15,23,42,0.06)", color: "rgba(15,23,42,0.5)",
  transition: "all 0.1s ease",
};

function StartupMetricsCard({
  ko,
  recent7Customers,
  activeDays7,
  weeklySalesChange,
  monthlyBurn,
  runwayMonths,
  employeesCount,
  roadmapProgress,
  fmt,
}: {
  ko: boolean;
  recent7Customers: number;
  activeDays7: number;
  weeklySalesChange: number;
  monthlyBurn: number;
  runwayMonths: number;
  employeesCount: number;
  roadmapProgress: number;
  fmt: (n: number) => string;
}) {
  return (
    <section style={opsCard} className="bento-card">
      <div style={opsHeader}>
        <div>
          <div style={sectionEyebrow}>{ko ? "검증 가능한 운영 지표" : "Verified operating metrics"}</div>
          <div style={opsTitle}>{ko ? "활성·burn·실행 상태" : "Activity, burn, and execution"}</div>
        </div>
        <div style={opsPill}>{ko ? "실측 기준" : "Measured only"}</div>
      </div>

      <div style={startupMetricGrid}>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "최근 7일 활성 사용자/고객" : "7-day active users/customers"}</div>
          <div style={startupMetricValue}>{recent7Customers > 0 ? recent7Customers.toLocaleString() : "—"}</div>
          <div style={startupMetricNote}>{ko ? `${activeDays7}/7일 활동 기록` : `${activeDays7}/7 active days logged`}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "주간 성장률" : "Weekly growth"}</div>
          <div style={{ ...startupMetricValue, color: weeklySalesChange >= 0 ? "#177245" : "#b42318" }}>
            {weeklySalesChange >= 0 ? "+" : ""}{weeklySalesChange}%
          </div>
          <div style={startupMetricNote}>{ko ? "직전 7일 대비" : "vs previous 7 days"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "월 burn" : "Monthly burn"}</div>
          <div style={{ ...startupMetricValue, color: monthlyBurn > 0 ? "#b54708" : "#177245" }}>
            {monthlyBurn > 0 ? fmt(monthlyBurn) : ko ? "흑자" : "Positive"}
          </div>
          <div style={startupMetricNote}>{ko ? "비용 - 매출 기준" : "Costs minus revenue"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "런웨이" : "Runway"}</div>
          <div style={startupMetricValue}>
            {runwayMonths < 0 ? (ko ? "흑자" : "Positive") : `${runwayMonths}${ko ? "개월" : " mo"}`}
          </div>
          <div style={startupMetricNote}>{ko ? "Sequoia / YC식 생존 지표" : "Core survival metric"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "팀" : "Team"}</div>
          <div style={startupMetricValue}>{employeesCount}{ko ? "명" : ""}</div>
          <div style={startupMetricNote}>{ko ? "등록된 인력 기준" : "Based on registered staff"}</div>
        </div>
        <div style={startupMetricBlock}>
          <div style={startupMetricLabel}>{ko ? "로드맵 실행률" : "Execution progress"}</div>
          <div style={startupMetricValue}>{roadmapProgress}%</div>
          <div style={startupMetricNote}>{ko ? "현재 경로 완료 비율" : "Completion on current path"}</div>
        </div>
      </div>

      <div style={verifiedNote}>
        {ko
          ? "리텐션, 파이프라인, burn multiple은 현재 데이터만으로는 검증 불가해서 일부러 제외했습니다. 코호트 이벤트, ARR, CRM 데이터가 연결되면 그때 실제 방식으로 추가하는 게 맞습니다."
          : "Retention, pipeline, and burn multiple are intentionally omitted until cohort events, ARR, and CRM data are available."}
      </div>
    </section>
  );
}

function SurvivalBoardCard({
  ko,
  isStartupCompany,
  runwayMonths,
  capitalLeft,
  weeklySalesChange,
  weeklySignalLabel,
  healthLabel,
  healthTone,
  topRiskLabel,
  focusMessage,
  d,
}: {
  ko: boolean;
  isStartupCompany: boolean;
  runwayMonths: number;
  capitalLeft: number;
  weeklySalesChange: number;
  weeklySignalLabel: string;
  healthLabel: string;
  healthTone: string;
  topRiskLabel: string;
  focusMessage: string;
  d: DashboardHook;
}) {
  const actions = d.aiActions?.todayActions ?? [];
  const hasActions = actions.length > 0;
  const runwayProgress =
    runwayMonths < 0 ? 100 : runwayMonths >= 12 ? 100 : Math.max(8, Math.min(100, runwayMonths * 8));
  const weeklyProgress = Math.max(10, Math.min(100, 50 + weeklySalesChange));

  return (
    <section style={survivalCard} className="bento-card">
      <div style={survivalTop}>
        <div>
          <div style={sectionEyebrow}>{isStartupCompany ? (ko ? "스타트업 생존 보드" : "Startup survival board") : ko ? "생존 보드" : "Survival board"}</div>
          <div style={opsTitle}>{isStartupCompany ? (ko ? "오늘의 회사 우선순위" : "Today's company priorities") : ko ? "오늘의 경영 우선순위" : "Today's priorities"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* 헬스 점수 미니 게이지 */}
          <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none"
              stroke={healthTone}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${(d.businessHealthScore === "healthy" ? 85 : d.businessHealthScore === "caution" ? 55 : 30) * 0.942} 94.2`}
              transform="rotate(-90 18 18)"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
            <text x="18" y="20" textAnchor="middle" fontSize="10" fontWeight="750" fill={healthTone}>
              {d.businessHealthScore === "healthy" ? 85 : d.businessHealthScore === "caution" ? 55 : 30}
            </text>
          </svg>
          <div style={{ ...opsPill, color: healthTone }}>{healthLabel}</div>
        </div>
      </div>

      <div style={survivalMetricGrid}>
        <div style={survivalMetricCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={survivalMetricLabel}>{ko ? "런웨이" : "Runway"}</div>
              <div style={{ ...survivalMetricValue, color: runwayMonths >= 0 && runwayMonths <= 3 ? "#b42318" : "#0f172a" }}>
                {runwayMonths < 0 ? (ko ? "흑자" : "Positive") : `${runwayMonths}${ko ? "개월" : " mo"}`}
              </div>
              <div style={survivalMetricNote}>{ko ? `가용 현금 ${fmt(capitalLeft)}` : `Cash left ${fmt(capitalLeft)}`}</div>
            </div>
            {/* mini semicircle gauge */}
            <svg width="48" height="28" viewBox="0 0 48 28" style={{ flexShrink: 0 }}>
              <path d="M4 24 A20 20 0 0 1 44 24" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="4" strokeLinecap="round" />
              <path d="M4 24 A20 20 0 0 1 44 24" fill="none"
                stroke={runwayMonths >= 0 && runwayMonths <= 3 ? "#ef4444" : runwayMonths <= 6 ? "#f97316" : "#22c55e"}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${runwayProgress * 0.628} 62.8`}
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
          </div>
          <div style={meterTrack}>
            <div style={{ ...meterFill, width: `${runwayProgress}%`, background: runwayMonths >= 0 && runwayMonths <= 3 ? "#ef4444" : "#2563eb" }} />
          </div>
        </div>
        <div style={survivalMetricCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={survivalMetricLabel}>{ko ? "주간 성장 신호" : "Weekly signal"}</div>
              <div style={{ ...survivalMetricValue, color: weeklySalesChange >= 0 ? "#177245" : "#b42318" }}>
                {weeklySignalLabel}
              </div>
              <div style={survivalMetricNote}>
                {ko ? "최근 7일 vs 직전 7일" : "Recent 7 days vs previous 7"}
              </div>
            </div>
            {/* sparkline: 7 dots */}
            <svg width="56" height="28" viewBox="0 0 56 28" style={{ flexShrink: 0 }}>
              {(() => {
                const allE = d.dailyEntries as DailyEntry[];
                const pts: number[] = [];
                for (let i = 6; i >= 0; i--) {
                  const dt = new Date(); dt.setDate(dt.getDate() - i);
                  const e = allE.find(x => x.date === dt.toISOString().slice(0, 10));
                  pts.push(e?.sales ?? 0);
                }
                const mx = Math.max(...pts, 1);
                const points = pts.map((v, i) => `${4 + i * 8},${24 - (v / mx) * 18}`).join(" ");
                return (
                  <>
                    <polyline points={points} fill="none" stroke={weeklySalesChange >= 0 ? "#22c55e" : "#f97316"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((v, i) => (
                      <circle key={i} cx={4 + i * 8} cy={24 - (v / mx) * 18} r={i === 6 ? 3 : 1.5} fill={i === 6 ? (weeklySalesChange >= 0 ? "#22c55e" : "#f97316") : "rgba(15,23,42,0.2)"} />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
          <div style={meterTrack}>
            <div style={{ ...meterFill, width: `${weeklyProgress}%`, background: weeklySalesChange >= 0 ? "#22c55e" : "#f97316" }} />
          </div>
        </div>
      </div>

      <div style={focusCard}>
        <div style={focusLabel}>{ko ? "지금 가장 먼저 볼 것" : "What to watch first"}</div>
        <div style={focusTitle}>{topRiskLabel}</div>
        <div style={focusBody}>{focusMessage}</div>
      </div>

      <div style={actionList}>
        {(hasActions
          ? actions
          : [
              {
                title: ko ? "오늘 기록부터 입력하기" : "Log today's numbers",
                reason: ko
                  ? "일매출과 고객 수를 기록해야 추세와 손익, 병목이 정확히 보입니다."
                  : "Daily sales and customer logs are the foundation for trend and bottleneck detection.",
                priority: "high" as const,
              },
              {
                title: ko ? "가장 급한 재고/인력 병목 확인" : "Check the biggest ops bottleneck",
                reason: ko
                  ? "재고 부족과 인력 공백은 매출이 있어도 성장을 막습니다."
                  : "Stockouts and staffing gaps block growth even when demand exists.",
                priority: "medium" as const,
              },
            ]
        ).slice(0, 2).map((action, index) => (
          <div key={`${action.title}-${index}`} style={actionRow}>
            <button
              type="button"
              onClick={(e) => {
                const el = e.currentTarget;
                el.style.background = "#177245";
                el.style.color = "#fff";
                el.textContent = "✓";
                const row = el.closest("[data-action-row]") as HTMLElement | null;
                if (row) { row.style.opacity = "0.5"; row.style.textDecoration = "line-through"; }
              }}
              style={{ ...actionIndex, cursor: "pointer", border: "1px solid rgba(15,23,42,0.1)", transition: "all 0.2s ease" }}
            >
              {index + 1}
            </button>
            <div data-action-row="">
              <div style={actionTitle}>{action.title}</div>
              <div style={actionBody}>{action.reason}</div>
            </div>
            <div style={{ ...priorityPill, background: action.priority === "high" ? "rgba(239,68,68,0.12)" : "rgba(37,99,235,0.10)", color: action.priority === "high" ? "#b42318" : "#2563eb" }}>
              {action.priority === "high" ? (ko ? "긴급" : "High") : ko ? "중요" : "Medium"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InventoryOpsCard({
  ko,
  inventory,
  lowStockItems,
  d,
}: {
  ko: boolean;
  inventory: InventoryEntry[];
  lowStockItems: InventoryEntry[];
  d: DashboardHook;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const invForm = d.invForm;
  const isEditing = Boolean(invForm.editId);
  const [showAllInventory, setShowAllInventory] = useState(false);
  const categoryLabels: Record<NonNullable<typeof invForm.category>, string> = {
    fresh: ko ? "신선" : "Fresh",
    dry: ko ? "건식" : "Dry",
    frozen: ko ? "냉동" : "Frozen",
    beverage: ko ? "음료" : "Beverage",
    supply: ko ? "소모품" : "Supply",
    other: ko ? "기타" : "Other",
  };

  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(15,23,42,0.10)",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  };

  const handleExcelImport = async (file: File) => {
    try {
      let text = "";
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv" || ext === "tsv" || ext === "txt") {
        // 텍스트 파일: 직접 읽기
        text = await file.text();
      } else if (ext === "xlsx" || ext === "xls") {
        // 엑셀 바이너리: SheetJS로 클라이언트 파싱 → CSV 변환
        try {
          const XLSX = (await import("xlsx"));
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          text = XLSX.utils.sheet_to_csv(firstSheet);
        } catch {
          alert(ko ? "엑셀 파일을 읽을 수 없습니다." : "Cannot read Excel file.");
          return;
        }
      } else {
        // 기타 텍스트 시도
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          text = new TextDecoder("euc-kr", { fatal: false }).decode(bytes);
        }
        if (text.includes("\0") || text.length < 10) {
          alert(ko
            ? "이 파일 형식은 지원하지 않습니다. CSV, TSV, TXT 파일을 업로드해 주세요."
            : "Unsupported file format. Please upload CSV, TSV, or TXT.");
          return;
        }
      }

      if (!text.trim()) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/api/ai/products/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ text: text.slice(0, 50000), language: d.language }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        alert(payload.error ?? "Parse failed");
        return;
      }

      const parsed = payload.products as Array<{
        name: string;
        category: string;
        price: number;
        cost: number;
        stock: number;
        unit: string;
      }>;
      if (!parsed?.length) {
        alert(ko ? "데이터를 찾을 수 없습니다." : "No data found.");
        return;
      }

      const newItems = parsed.map((product) => ({
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: product.name,
        quantity: product.stock,
        unit: product.unit || "개",
        minThreshold: 0,
        unitCost: product.cost,
        category: "other" as const,
        itemType: "product" as const,
        sellingPrice: product.price ?? 0,
        expiryDate: "",
        supplierName: "",
        supplierUrl: "",
        leadTimeDays: 1,
        dailyUsage: 0,
        lastOrderedAt: "",
        wasteLog: [],
      }));

      d.saveInventory([...(d.inventory as typeof newItems), ...newItems]);
      alert(ko ? `${newItems.length}개 품목 등록 완료` : `${newItems.length} items added`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Excel import error]", msg);
      alert(ko ? `파일 처리 오류: ${msg}` : `File error: ${msg}`);
    }
  };

  return (
    <section style={opsCard} className="bento-card">
      <div style={opsHeader}>
        <div>
          <div style={sectionEyebrow}>
            {d.businessCtx.categoryId === "startup-tech" ? (ko ? "운영 자산" : "Ops assets") : ko ? "현재 재고" : "Current inventory"}
          </div>
          <div style={opsTitle}>
            {d.businessCtx.categoryId === "startup-tech" ? (ko ? "자산·도구 관리" : "Assets and tools") : ko ? "재고 관리" : "Inventory management"}
          </div>
        </div>
        <div style={opsActionRow}>
          <button
            type="button"
            onClick={() => d.setInvForm({ ...d.emptyInvForm, open: true })}
            style={opsActionPrimary}
          >
            {ko ? "재고 추가" : "Add item"}
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={opsActionSecondary}>
            {ko ? "엑셀" : "Excel"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            style={{ display: "none" }}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              event.target.value = "";
              await handleExcelImport(file);
            }}
          />
        </div>
      </div>

      <div style={opsMetricGrid}>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "발주 필요" : "Reorder"}</div>
          <div style={{ ...opsMetricValue, color: lowStockItems.length > 0 ? "#b42318" : "#177245" }}>
            {lowStockItems.length}{ko ? "개" : ""}
          </div>
        </div>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "정상 품목" : "Normal"}</div>
          <div style={opsMetricValue}>{Math.max(inventory.length - lowStockItems.length, 0)}{ko ? "개" : ""}</div>
        </div>
      </div>

      <div style={listStack}>
        {(lowStockItems.length > 0 ? lowStockItems : inventory).slice(0, 4).map((item) => {
          const isLow = lowStockItems.some((c) => c.id === item.id);
          const threshold = item.minThreshold ?? 0;
          const urgency = threshold > 0 && item.quantity <= 0 ? "critical" : isLow ? "warning" : "ok";
          const urgencyColor = urgency === "critical" ? "#b42318" : urgency === "warning" ? "#e85d04" : "#177245";
          return (
          <div key={item.id} style={{ ...listRow, borderLeft: `3px solid ${urgencyColor}` }}>
            <div>
              <div style={listTitle}>{item.name}</div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: (item as { itemType?: string }).itemType === "product" ? "#2563eb" : "rgba(15,23,42,0.4)", background: (item as { itemType?: string }).itemType === "product" ? "rgba(37,99,235,0.08)" : "rgba(15,23,42,0.04)", borderRadius: "4px", padding: "1px 5px" }}>
                  {(item as { itemType?: string }).itemType === "product" ? (ko ? "상품" : "Product") : (ko ? "재료" : "Material")}
                </span>
                <div style={listMeta}>{item.category || (ko ? "일반" : "General")}</div>
                {urgency !== "ok" && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: urgencyColor, background: `${urgencyColor}10`, borderRadius: "4px", padding: "1px 5px" }}>
                    {urgency === "critical" ? (ko ? "즉시 발주" : "Order now") : (ko ? "발주 필요" : "Low")}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={listTitle}>
                {item.quantity}{item.unit ? ` ${item.unit}` : ""}
              </div>
              {threshold > 0 && (
                <div style={{ height: "3px", borderRadius: "2px", background: `${urgencyColor}18`, width: "48px", overflow: "hidden", marginTop: "4px", marginLeft: "auto" }}>
                  <div style={{ height: "100%", borderRadius: "2px", background: urgencyColor, width: `${Math.min(100, (item.quantity / threshold) * 100)}%`, transition: "width 0.3s ease" }} />
                </div>
              )}
            </div>
            <div style={rowActions}>
              <button type="button" onClick={() => d.openInvEdit(item as never)} style={tinyAction}>
                {ko ? "수정" : "Edit"}
              </button>
              <button type="button" onClick={() => d.handleInvDelete(item.id)} style={tinyDangerAction}>
                {ko ? "삭제" : "Delete"}
              </button>
            </div>
          </div>
          );
        })}
        {inventory.length === 0 ? (
          <div style={emptyState}>
            {d.businessCtx.categoryId === "startup-tech"
              ? ko
                ? "장비, 계정, 테스트 디바이스, 반복 결제 도구 같은 운영 자산을 등록해두면 팀이 한곳에서 관리할 수 있습니다."
                : "Track equipment, accounts, test devices, and recurring tools here."
              : ko
                ? "운영 재고를 등록하면 부족 품목을 바로 확인할 수 있습니다."
                : "Add inventory items to track low stock here."}
          </div>
        ) : null}
        {inventory.length > 4 && (
          <button type="button" onClick={() => setShowAllInventory(true)} style={{
            width: "100%", padding: "10px", marginTop: "6px", borderRadius: "10px",
            border: "none", background: "rgba(15,23,42,0.03)", cursor: "pointer",
            fontSize: "13px", fontWeight: 600, color: "rgba(15,23,42,0.45)",
          }}>
            {ko ? `전체 ${inventory.length}개 보기` : `View all ${inventory.length} items`}
          </button>
        )}
      </div>

      {/* 전체 재고 팝업 */}
      {showAllInventory && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAllInventory(false); }}
        >
          <div style={{ width: "min(600px, 90vw)", maxHeight: "80vh", borderRadius: "24px", background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" as const }}>
            {/* header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {ko ? "전체 재고" : "All Inventory"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>
                  {inventory.length}{ko ? "개 품목" : " items"} · {ko ? "발주 필요" : "Low stock"} {lowStockItems.length}{ko ? "건" : ""}
                </div>
              </div>
              <button type="button" onClick={() => setShowAllInventory(false)} style={{
                width: "32px", height: "32px", borderRadius: "999px", border: "none",
                background: "rgba(15,23,42,0.06)", cursor: "pointer", fontSize: "16px", color: "rgba(15,23,42,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
            {/* list */}
            <div style={{ overflowY: "auto", padding: "12px 24px 24px", display: "flex", flexDirection: "column" as const, gap: "6px" }}>
              {inventory.map((item) => {
                const isLow = lowStockItems.some((c) => c.id === item.id);
                const urgency = (item.minThreshold ?? 0) > 0 && item.quantity <= 0 ? "critical" : isLow ? "warning" : "ok";
                const urgencyColor = urgency === "critical" ? "#b42318" : urgency === "warning" ? "#e85d04" : "#177245";
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 12px", borderRadius: "12px",
                    background: urgency !== "ok" ? `${urgencyColor}06` : "rgba(15,23,42,0.02)",
                    borderLeft: `3px solid ${urgencyColor}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{item.name}</div>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "2px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: (item as { itemType?: string }).itemType === "product" ? "#2563eb" : "rgba(15,23,42,0.4)", background: (item as { itemType?: string }).itemType === "product" ? "rgba(37,99,235,0.08)" : "rgba(15,23,42,0.04)", borderRadius: "4px", padding: "1px 5px" }}>
                          {(item as { itemType?: string }).itemType === "product" ? (ko ? "상품" : "Product") : (ko ? "재료" : "Material")}
                        </span>
                        <span style={{ fontSize: "10px", color: "rgba(15,23,42,0.35)" }}>{item.category || (ko ? "일반" : "General")}</span>
                        {urgency !== "ok" && (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: urgencyColor, background: `${urgencyColor}10`, borderRadius: "4px", padding: "1px 5px" }}>
                            {urgency === "critical" ? (ko ? "즉시 발주" : "Order now") : (ko ? "발주 필요" : "Low")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </div>
                      {(item as { sellingPrice?: number }).sellingPrice ? (
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)" }}>{fmt((item as { sellingPrice?: number }).sellingPrice ?? 0)}</div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button type="button" onClick={() => { d.openInvEdit(item as never); setShowAllInventory(false); }} style={tinyAction}>
                        {ko ? "수정" : "Edit"}
                      </button>
                      <button type="button" onClick={() => d.handleInvDelete(item.id)} style={tinyDangerAction}>
                        {ko ? "삭제" : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {invForm.open ? (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>
            {isEditing ? (ko ? "재고 수정" : "Edit inventory") : (ko ? "재고 추가" : "Add inventory")}
          </div>
          {/* 유형 선택: 원재료 / 판매 상품 */}
          <div style={{ display: "flex", gap: "4px", padding: "3px", borderRadius: "10px", background: "rgba(15,23,42,0.04)", marginBottom: "10px" }}>
            {([
              { value: "material" as const, label: ko ? "원재료" : "Material" },
              { value: "product" as const, label: ko ? "판매 상품" : "Product" },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => d.setInvForm((prev) => ({ ...prev, itemType: opt.value }))}
                style={{
                  flex: 1, fontSize: "12px", fontWeight: 600, padding: "8px 0",
                  borderRadius: "8px", border: "none", cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: invForm.itemType === opt.value ? "#fff" : "transparent",
                  color: invForm.itemType === opt.value ? "#0f172a" : "rgba(15,23,42,0.45)",
                  boxShadow: invForm.itemType === opt.value ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={formGridTwo}>
            <input
              type="text"
              value={invForm.name}
              onChange={(event) => d.setInvForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={ko ? "품목명" : "Item name"}
              style={inputStyle}
            />
            <select
              value={invForm.category}
              onChange={(event) =>
                d.setInvForm((prev) => ({
                  ...prev,
                  category: event.target.value as typeof invForm.category,
                }))
              }
              style={inputStyle}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {/* 판매 상품일 때 판매가 입력 */}
          {invForm.itemType === "product" && (
            <div style={{ marginBottom: "2px" }}>
              <input
                type="text"
                inputMode="numeric"
                value={invForm.sellingPrice}
                onChange={(event) => d.setInvForm((prev) => ({ ...prev, sellingPrice: event.target.value.replace(/[^0-9]/g, "") }))}
                placeholder={ko ? "판매가 (원)" : "Selling price (₩)"}
                style={inputStyle}
              />
            </div>
          )}
          {invForm.itemType === "product" ? (
            /* ── 판매 상품 폼: 판매가 + 수량 + (선택)원가 ── */
            <>
              <div style={formGridThree}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.qty}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, qty: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "재고 수량" : "Stock qty"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={invForm.unit}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder={ko ? "단위 (개, 병)" : "Unit"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.unitCost}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unitCost: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "원가 (선택)" : "Cost (opt)"}
                  style={inputStyle}
                />
              </div>
              {invForm.sellingPrice && invForm.unitCost && Number(invForm.unitCost) > 0 && (
                <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600, padding: "4px 0" }}>
                  {ko ? "마진율" : "Margin"}: {Math.round(((Number(invForm.sellingPrice) - Number(invForm.unitCost)) / Number(invForm.sellingPrice)) * 100)}%
                </div>
              )}
            </>
          ) : (
            /* ── 원재료 폼: 단가 + 수량 + 최소수량 + 일사용량 + 리드타임 + 공급처 ── */
            <>
              <div style={formGridThree}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.qty}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, qty: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "수량" : "Qty"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={invForm.unit}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder={ko ? "단위" : "Unit"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.threshold}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, threshold: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "최소 수량" : "Min"}
                  style={inputStyle}
                />
              </div>
              <div style={formGridThree}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.unitCost}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unitCost: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "단가 (매입가)" : "Unit cost"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.dailyUsage}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, dailyUsage: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "일 사용량" : "Daily usage"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.leadTimeDays}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, leadTimeDays: event.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder={ko ? "리드타임" : "Lead days"}
                  style={inputStyle}
                />
              </div>
            </>
          )}
          {invForm.itemType === "material" && (
          <div style={formGridTwo}>
            <input
              type="text"
              value={invForm.supplierName}
              onChange={(event) => d.setInvForm((prev) => ({ ...prev, supplierName: event.target.value }))}
              placeholder={ko ? "공급업체명" : "Supplier"}
              style={inputStyle}
            />
            <input
              type="text"
              value={invForm.url}
              onChange={(event) => d.setInvForm((prev) => ({ ...prev, url: event.target.value }))}
              placeholder={ko ? "주문 URL" : "Order URL"}
              style={inputStyle}
            />
          </div>
          )}
          <div style={editorActions}>
            <button type="button" onClick={d.handleInvSave} style={opsActionPrimary}>
              {isEditing ? (ko ? "수정 저장" : "Save") : (ko ? "추가 저장" : "Add")}
            </button>
            <button
              type="button"
              onClick={() => d.setInvForm((prev) => ({ ...prev, ...d.emptyInvForm }))}
              style={opsActionSecondary}
            >
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StaffOpsCard({
  ko,
  employees,
  estimatedMonthlyPayroll,
  insuredEmployees,
  totalSales,
  d,
}: {
  ko: boolean;
  employees: EmployeeEntry[];
  estimatedMonthlyPayroll: number;
  insuredEmployees: number;
  totalSales: number;
  d: DashboardHook;
}) {
  const totalWeeklyHours = employees.reduce((s, e) => s + (e.weeklyHours ?? 0), 0);
  const monthlyHours = totalWeeklyHours * 4.34;
  const revenuePerHour = monthlyHours > 0 && totalSales > 0 ? Math.round(totalSales / monthlyHours) : 0;
  const isEditing = Boolean(d.empEditId);
  const [addMode, setAddMode] = useState<"choice" | "member" | "manual" | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(15,23,42,0.10)",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <section style={opsCard} className="bento-card">
      <div style={opsHeader}>
        <div>
          <div style={sectionEyebrow}>{ko ? "직원 관리" : "Staff management"}</div>
          <div style={opsTitle}>{ko ? "근무 인력" : "Working team"}</div>
        </div>
        <div style={opsActionRow}>
          <button
            type="button"
            onClick={() => {
              if (addMode) {
                setAddMode(null);
                d.setEmpFormOpen(false);
              } else {
                setAddMode("choice");
                setGeneratedCode(null);
                setInviteEmail("");
                setInviteStatus("idle");
              }
            }}
            style={opsActionPrimary}
          >
            {ko ? "직원 추가" : "Add staff"}
          </button>
          <div style={opsPill}>{employees.length}{ko ? "명" : ""}</div>
        </div>
      </div>

      <div style={{ ...opsMetricGrid, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "예상 인건비" : "Est. payroll"}</div>
          <div style={opsMetricValue}>{employees.length > 0 ? fmt(estimatedMonthlyPayroll) : "—"}</div>
        </div>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "보험 적용" : "Insured"}</div>
          <div style={opsMetricValue}>{insuredEmployees}{ko ? "명" : ""}</div>
        </div>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "시간당 매출" : "Rev/hour"}</div>
          <div style={{ ...opsMetricValue, color: revenuePerHour > 0 ? "#0f172a" : "rgba(15,23,42,0.34)" }}>
            {revenuePerHour > 0 ? fmt(revenuePerHour) : "—"}
          </div>
        </div>
      </div>

      <div style={listStack}>
        {employees.slice(0, 4).map((employee) => (
          <div key={employee.id} style={listRow}>
            <div>
              <div style={listTitle}>{employee.name}</div>
              <div style={listMeta}>
                {employee.weeklyHours != null
                  ? `${employee.weeklyHours}${ko ? "시간/주" : " hrs/week"}`
                  : ko
                    ? "근무시간 미입력"
                    : "Hours missing"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={listTitle}>{employee.hourlyWage ? fmt(employee.hourlyWage) : "—"}</div>
              <div style={listMeta}>
                {employee.isInsured ? (ko ? "보험 적용" : "Insured") : (ko ? "보험 미적용" : "Uninsured")}
              </div>
            </div>
            <div style={rowActions}>
              <button type="button" onClick={() => d.openEmpEdit(employee as never)} style={tinyAction}>
                {ko ? "수정" : "Edit"}
              </button>
              <button type="button" onClick={() => d.handleEmpDelete(employee.id)} style={tinyDangerAction}>
                {ko ? "삭제" : "Delete"}
              </button>
            </div>
          </div>
        ))}
        {employees.length === 0 ? (
          <div style={emptyState}>
            {ko ? "직원이나 파트타이머가 있다면 먼저 등록해 두세요." : "Add staff members here if you work with employees or part-timers."}
          </div>
        ) : null}
      </div>

      {/* ── Step 1: 회원/비회원 선택 ── */}
      {addMode === "choice" && (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>{ko ? "직원 추가" : "Add staff"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "14px", lineHeight: 1.5 }}>
            {ko ? "이 직원이 build.up 회원인가요?" : "Is this employee a build.up member?"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button type="button" onClick={() => setAddMode("member")} style={{
              padding: "16px 12px", borderRadius: "14px", border: "1.5px solid rgba(15,23,42,0.08)",
              background: "#fff", cursor: "pointer", textAlign: "center" as const, transition: "all 0.15s ease",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block" }}>
                <circle cx="12" cy="8" r="4" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" fill="none" />
                <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M17 8l2 2 2-2" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>{ko ? "네, 회원이에요" : "Yes, member"}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "4px" }}>
                {ko ? "이메일로 초대합니다" : "Invite by email"}
              </div>
            </button>
            <button type="button" onClick={() => { setAddMode("manual"); d.setEmpFormOpen(true); d.setEmpEditId(null); d.setEmpName(""); d.setEmpWage(""); d.setEmpHours(""); d.setEmpInsured(false); }} style={{
              padding: "16px 12px", borderRadius: "14px", border: "1.5px solid rgba(15,23,42,0.08)",
              background: "#fff", cursor: "pointer", textAlign: "center" as const, transition: "all 0.15s ease",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block" }}>
                <circle cx="12" cy="8" r="4" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" fill="none" />
                <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="rgba(15,23,42,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
              <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>{ko ? "아니요" : "No, not yet"}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "4px" }}>
                {ko ? "이름/시급만 기록합니다" : "Record name & wage only"}
              </div>
            </button>
          </div>
          <button type="button" onClick={() => setAddMode(null)} style={{ ...opsActionSecondary, marginTop: "8px", width: "100%" }}>
            {ko ? "취소" : "Cancel"}
          </button>
        </div>
      )}

      {/* ── Step 2a: 회원 초대 ── */}
      {addMode === "member" && (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>{ko ? "회원 직원 초대" : "Invite member"}</div>
          {!generatedCode ? (
            <>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "12px", lineHeight: 1.5 }}>
                {ko ? "직원의 이메일을 입력하세요. 초대 코드가 생성됩니다." : "Enter the employee's email. An invite code will be generated."}
              </div>
              <div style={formGridTwo}>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={ko ? "직원 이메일" : "Employee email"} style={inputStyle} />
                <input type="text" value={d.empName} onChange={(e) => d.setEmpName(e.target.value)}
                  placeholder={ko ? "이름 (선택)" : "Name (optional)"} style={inputStyle} />
              </div>
              <div style={editorActions}>
                <button type="button" disabled={!inviteEmail.includes("@") || inviteStatus === "loading"}
                  onClick={async () => {
                    setInviteStatus("loading");
                    try {
                      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        await supabase.from("store_invites" as never).insert({
                          owner_user_id: user.id,
                          invite_code: code,
                          role: "staff",
                        } as never);
                      }
                      // 직원 정보도 기본 등록 (연동 전이라 시급 등은 나중에)
                      if (d.empName.trim()) {
                        d.setEmpWage("0"); d.setEmpHours("0"); d.setEmpInsured(false);
                        d.setEmpFormOpen(true);
                        d.handleEmpSave();
                      }
                      setGeneratedCode(code);
                      setInviteStatus("sent");
                    } catch {
                      setInviteStatus("error");
                    }
                  }}
                  style={{ ...opsActionPrimary, opacity: !inviteEmail.includes("@") || inviteStatus === "loading" ? 0.4 : 1 }}>
                  {inviteStatus === "loading" ? (ko ? "생성 중..." : "Creating...") : (ko ? "초대 코드 생성" : "Generate code")}
                </button>
                <button type="button" onClick={() => { setAddMode("choice"); setInviteEmail(""); }} style={opsActionSecondary}>
                  {ko ? "뒤로" : "Back"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "12px", lineHeight: 1.5 }}>
                {ko ? "아래 초대 코드를 직원에게 전달하세요." : "Share this invite code with your employee."}
              </div>
              <div style={{
                padding: "20px", borderRadius: "14px", background: "rgba(37,99,235,0.04)",
                border: "1px solid rgba(37,99,235,0.1)", textAlign: "center" as const, marginBottom: "12px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                  {ko ? "초대 코드" : "Invite Code"}
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "0.15em", color: "#0f172a", fontFamily: "monospace" }}>
                  {generatedCode}
                </div>
                <button type="button" onClick={() => { void navigator.clipboard.writeText(generatedCode ?? ""); }}
                  style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", marginTop: "8px" }}>
                  {ko ? "코드 복사" : "Copy code"}
                </button>
              </div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", lineHeight: 1.5, marginBottom: "12px" }}>
                {ko
                  ? "직원이 build.up 가입 후 '직원' 역할을 선택하고 이 코드를 입력하면 가게에 연결됩니다. 코드는 7일간 유효합니다."
                  : "The employee signs up, selects 'Staff' role, and enters this code to connect. Valid for 7 days."}
              </div>
              <button type="button" onClick={() => { setAddMode(null); setGeneratedCode(null); setInviteEmail(""); setInviteStatus("idle"); }} style={{ ...opsActionPrimary, width: "100%" }}>
                {ko ? "완료" : "Done"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Step 2b: 비회원 수동 등록 (기존 폼) ── */}
      {(addMode === "manual" || isEditing) && d.empFormOpen ? (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>
            {isEditing ? (ko ? "직원 수정" : "Edit staff") : (ko ? "직원 정보 입력" : "Enter staff info")}
          </div>
          {!isEditing && (
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", marginBottom: "10px" }}>
              {ko ? "나중에 이 직원이 build.up에 가입하면 연동할 수 있습니다." : "You can link this employee later if they join build.up."}
            </div>
          )}
          <div style={formGridTwo}>
            <input
              type="text"
              value={d.empName}
              onChange={(event) => d.setEmpName(event.target.value)}
              placeholder={ko ? "이름" : "Name"}
              style={inputStyle}
            />
            <input
              type="text"
              inputMode="numeric"
              value={d.empWage}
              onChange={(event) => d.setEmpWage(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder={ko ? "시급 (원)" : "Hourly wage"}
              style={inputStyle}
            />
          </div>
          <div style={formGridTwo}>
            <input
              type="text"
              inputMode="numeric"
              value={d.empHours}
              onChange={(event) => d.setEmpHours(event.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={ko ? "주간 근무시간" : "Hours/week"}
              style={inputStyle}
            />
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={d.empInsured}
                onChange={(event) => d.setEmpInsured(event.target.checked)}
              />
              <span>{ko ? "4대보험 적용" : "Insured"}</span>
            </label>
          </div>
          <div style={editorActions}>
            <button type="button" onClick={() => { d.handleEmpSave(); setAddMode(null); }} style={opsActionPrimary}>
              {isEditing ? (ko ? "수정 저장" : "Save") : (ko ? "직원 추가" : "Add")}
            </button>
            <button
              type="button"
              onClick={() => {
                d.setEmpFormOpen(false);
                d.setEmpEditId(null);
                d.setEmpName(""); d.setEmpWage(""); d.setEmpHours(""); d.setEmpInsured(false);
                setAddMode(null);
              }}
              style={opsActionSecondary}
            >
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const shell: React.CSSProperties = {
  display: "grid",
  gap: "18px",
  fontFamily:
    "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
};

const heroPanel: React.CSSProperties = {
  borderRadius: "28px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.995) 0%, rgba(241,245,252,0.94) 48%, rgba(252,253,255,0.975) 100%)",
  border: "1px solid rgba(15, 23, 42, 0.05)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.76) inset, 0 20px 50px rgba(15, 23, 42, 0.04)",
  display: "grid",
  gap: "20px",
  transition: "box-shadow 0.3s ease, transform 0.3s ease",
};

const heroHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "16px",
  flexWrap: "wrap",
};

const heroEyebrow: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.48)",
  marginBottom: "6px",
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 52px)",
  lineHeight: 0.98,
  letterSpacing: "-0.058em",
  fontWeight: 760,
  color: "#0f172a",
};

const heroBody: React.CSSProperties = {
  margin: "10px 0 0",
  maxWidth: "64ch",
  fontSize: "15px",
  lineHeight: 1.65,
  color: "rgba(15, 23, 42, 0.62)",
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryAction: React.CSSProperties = {
  border: "none",
  borderRadius: "999px",
  padding: "12px 18px",
  background: "linear-gradient(180deg, rgba(19,28,45,0.98), rgba(15,23,42,0.92))",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(15,23,42,0.14)",
};

const secondaryAction: React.CSSProperties = {
  border: "1px solid rgba(15, 23, 42, 0.065)",
  borderRadius: "999px",
  padding: "12px 18px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(247,249,252,0.78))",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 1px 0 rgba(255,255,255,0.72) inset",
};

const headlineGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const headlineCard: React.CSSProperties = {
  borderRadius: "20px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(246,248,252,0.76))",
  border: "1px solid rgba(15, 23, 42, 0.045)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.78) inset, 0 10px 24px rgba(15,23,42,0.022)",
  transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease",
  cursor: "default",
};

const headlineLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.48)",
  marginBottom: "8px",
};

const headlineValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 780,
  letterSpacing: "-0.045em",
  lineHeight: 1.05,
  fontVariantNumeric: "tabular-nums",
};

const headlineNote: React.CSSProperties = {
  marginTop: "8px",
  fontSize: "12px",
  lineHeight: 1.5,
  color: "rgba(15, 23, 42, 0.52)",
};

const coreGrid: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  alignItems: "stretch",
};

const survivalGrid: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  alignItems: "stretch",
};

/* ── Bento micro-interaction: inject global hover styles once ── */
const bentoHoverCSS = `
@keyframes bentoFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bentoPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
@keyframes bentoProgress { from { width: 0; } }
@keyframes bentoBarGrow { from { height: 0; } }
@keyframes bentoCountUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bentoGlow { 0%, 100% { box-shadow: 0 0 0 rgba(29,53,87,0); } 50% { box-shadow: 0 0 12px rgba(29,53,87,0.08); } }
.bento-card { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease !important; }
.bento-card:hover { transform: translateY(-2px) !important; box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset, 0 20px 50px rgba(15,23,42,0.065) !important; }
.bento-headline { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease !important; }
.bento-headline:hover { transform: translateY(-1px) !important; box-shadow: 0 1px 0 rgba(255,255,255,0.82) inset, 0 14px 32px rgba(15,23,42,0.04) !important; }
.bento-btn { transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease !important; }
.bento-btn:active { transform: scale(0.97) !important; }
.bento-meter-fill { animation: bentoProgress 0.8s cubic-bezier(0.22, 1, 0.36, 1) !important; }
.bento-fade-in { animation: bentoFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both !important; }
.bento-number { animation: bentoCountUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; font-variant-numeric: tabular-nums; }
`;

const activityCard: React.CSSProperties = {
  borderRadius: "24px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(243,246,251,0.91))",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 18px 42px rgba(15, 23, 42, 0.038)",
  display: "grid",
  gap: "18px",
};

const activityHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

const activityTitle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 740,
  letterSpacing: "-0.04em",
  color: "#0f172a",
};

const activityStatRail: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const activityMiniStat: React.CSSProperties = {
  minWidth: "124px",
  borderRadius: "18px",
  padding: "12px 14px",
  background: "linear-gradient(180deg, rgba(248,250,253,0.92), rgba(242,246,250,0.8))",
  border: "1px solid rgba(15,23,42,0.042)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset",
};

const activityMiniLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(15,23,42,0.48)",
  marginBottom: "6px",
};

const activityMiniValue: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 750,
  letterSpacing: "-0.05em",
  color: "#0f172a",
  lineHeight: 1,
};

const activityChartWrap: React.CSSProperties = {
  height: "138px",
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "10px",
  alignItems: "end",
  padding: "8px 2px 0",
};

const activityBarCol: React.CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
};

const activityBarTrack: React.CSSProperties = {
  width: "100%",
  height: "110px",
  display: "flex",
  alignItems: "flex-end",
  padding: "0 4px",
};

const activityBarFill: React.CSSProperties = {
  width: "100%",
  borderRadius: "14px",
  minHeight: "4px",
  transition: "height 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
};

const activityBarLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
};

const activityFooter: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 0.42fr) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "end",
};

const activityTodaySummary: React.CSSProperties = {
  borderRadius: "20px",
  padding: "16px",
  background: "linear-gradient(180deg, rgba(248,250,253,0.94), rgba(243,246,250,0.82))",
  border: "1px solid rgba(15,23,42,0.042)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.68) inset",
  display: "grid",
  gap: "6px",
};

const activityTodayValue: React.CSSProperties = {
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 760,
  letterSpacing: "-0.06em",
  color: "#0f172a",
};

const activityTodayMeta: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.55,
  color: "rgba(15,23,42,0.54)",
};

const activityForm: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
};

const opsCard: React.CSSProperties = {
  borderRadius: "24px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.975), rgba(245,247,250,0.9))",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.76) inset, 0 14px 30px rgba(15, 23, 42, 0.03)",
  display: "grid",
  gap: "14px",
};

const opsHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.46)",
  marginBottom: "6px",
};

const opsTitle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 740,
  letterSpacing: "-0.04em",
  color: "#0f172a",
};

const opsPill: React.CSSProperties = {
  borderRadius: "999px",
  padding: "8px 12px",
  background: "rgba(15, 23, 42, 0.04)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
  fontSize: "12px",
  fontWeight: 700,
  color: "rgba(15, 23, 42, 0.72)",
  whiteSpace: "nowrap",
};

const opsActionRow: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const opsActionPrimary: React.CSSProperties = {
  border: "none",
  borderRadius: "999px",
  padding: "9px 12px",
  background: "linear-gradient(180deg, rgba(19,28,45,0.98), rgba(15,23,42,0.92))",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
};

const opsActionSecondary: React.CSSProperties = {
  border: "1px solid rgba(15, 23, 42, 0.055)",
  borderRadius: "999px",
  padding: "9px 12px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(247,249,252,0.78))",
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 1px 0 rgba(255,255,255,0.72) inset",
};

const opsMetricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const startupMetricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
};

const startupMetricBlock: React.CSSProperties = {
  borderRadius: "16px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(238,244,255,0.52), rgba(255,255,255,0.72))",
  display: "grid",
  gap: "6px",
};

const startupMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: 1.45,
  color: "rgba(15, 23, 42, 0.50)",
};

const startupMetricValue: React.CSSProperties = {
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 760,
  letterSpacing: "-0.05em",
  color: "#0f172a",
};

const startupMetricNote: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: 1.5,
  color: "rgba(15, 23, 42, 0.48)",
};

const verifiedNote: React.CSSProperties = {
  borderRadius: "16px",
  padding: "12px 14px",
  background: "linear-gradient(180deg, rgba(247,249,253,0.94), rgba(241,245,250,0.84))",
  border: "1px solid rgba(15, 23, 42, 0.05)",
  fontSize: "12px",
  lineHeight: 1.6,
  color: "rgba(15, 23, 42, 0.66)",
};

const opsMetricCard: React.CSSProperties = {
  borderRadius: "16px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(247,249,252,0.92), rgba(242,245,249,0.8))",
  boxShadow: "0 1px 0 rgba(255,255,255,0.68) inset",
};

const opsMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(15, 23, 42, 0.46)",
  marginBottom: "8px",
};

const opsMetricValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 720,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const rowActions: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "flex-end",
};

const tinyAction: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const tinyDangerAction: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#b42318",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const listStack: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const listRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: "linear-gradient(180deg, rgba(247,249,252,0.92), rgba(242,245,249,0.8))",
  boxShadow: "0 1px 0 rgba(255,255,255,0.66) inset",
};

const listTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 650,
  color: "#0f172a",
};

const listMeta: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "11px",
  color: "rgba(15, 23, 42, 0.48)",
};

const emptyState: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  background: "linear-gradient(180deg, rgba(248,249,252,0.94), rgba(243,246,250,0.82))",
  boxShadow: "0 1px 0 rgba(255,255,255,0.66) inset",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "rgba(15, 23, 42, 0.58)",
};

const inlineEditor: React.CSSProperties = {
  borderTop: "1px solid rgba(15, 23, 42, 0.08)",
  paddingTop: "14px",
  display: "grid",
  gap: "10px",
};

const inlineEditorTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#2563eb",
  letterSpacing: "0.02em",
};

const formGridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const formGridThree: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
};

const editorActions: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#fff",
  border: "1px solid rgba(15,23,42,0.10)",
  fontSize: "13px",
  color: "#0f172a",
};

const detailSection: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const detailSectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const detailSectionTitle: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: 1.3,
  fontWeight: 720,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const survivalCard: React.CSSProperties = {
  borderRadius: "24px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.982), rgba(243,246,250,0.9))",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 16px 38px rgba(15, 23, 42, 0.035)",
  display: "grid",
  gap: "12px",
};

const survivalTop: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
};

const survivalMetricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const survivalMetricCard: React.CSSProperties = {
  borderRadius: "16px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(248,250,253,0.92), rgba(242,246,250,0.82))",
  border: "1px solid rgba(15,23,42,0.04)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset",
  display: "grid",
  gap: "8px",
  transition: "background 0.2s ease",
};

const survivalMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.48)",
};

const survivalMetricValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 760,
  letterSpacing: "-0.05em",
  lineHeight: 1,
};

const survivalMetricNote: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.5,
  color: "rgba(15,23,42,0.56)",
};

const meterTrack: React.CSSProperties = {
  height: "6px",
  borderRadius: "999px",
  background: "rgba(15,23,42,0.06)",
  overflow: "hidden",
};

const meterFill: React.CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
};

const focusCard: React.CSSProperties = {
  borderRadius: "20px",
  padding: "18px",
  background: "linear-gradient(135deg, rgba(247,249,252,0.96), rgba(241,244,248,0.84))",
  border: "1px solid rgba(15,23,42,0.045)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset",
  display: "grid",
  gap: "8px",
  transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease",
};

const focusLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.46)",
};

const focusTitle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 760,
  letterSpacing: "-0.04em",
  lineHeight: 1.08,
};

const focusBody: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.65,
  color: "rgba(15,23,42,0.62)",
};

const actionList: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const actionRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) auto",
  gap: "12px",
  alignItems: "flex-start",
  borderRadius: "16px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(248,250,252,0.94), rgba(243,246,249,0.82))",
  border: "1px solid rgba(15,23,42,0.04)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.68) inset",
  transition: "transform 0.2s ease, background 0.2s ease",
  cursor: "default",
};

const actionIndex: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  background: "linear-gradient(180deg, rgba(236,240,245,0.98), rgba(228,233,239,0.92))",
  display: "grid",
  placeItems: "center",
  fontSize: "12px",
  fontWeight: 700,
  color: "#0f172a",
  boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
};

const actionTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#0f172a",
};

const actionBody: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "12px",
  lineHeight: 1.55,
  color: "rgba(15,23,42,0.58)",
};

const priorityPill: React.CSSProperties = {
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
