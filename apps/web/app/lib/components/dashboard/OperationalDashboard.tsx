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
import { calculateHealthMetrics, buildTaxCalendar } from "@build-up/shared";
import { MorningBriefing } from "./MorningBriefing";
import { SalesBreakdownCard } from "./SalesBreakdownCard";
import { MonthlyProgressCard } from "./MonthlyProgressCard";
import { CostStructureCard } from "./CostStructureCard";
import { BenchmarkCard } from "./BenchmarkCard";
import { ActivitySnapshotCard } from "./ActivitySnapshotCard";
import { SurvivalBoardCard } from "./SurvivalBoardCard";
import { StartupMetricsCard } from "./StartupMetricsCard";
import { InventoryOpsCard } from "./InventoryOpsCard";
import { StaffOpsCard } from "./StaffOpsCard";
import { CashFlowForecastCard } from "./CashFlowForecastCard";
import {
  shell,
  bentoHoverCSS,
  heroPanel,
  heroHeader,
  heroEyebrow,
  heroTitle,
  heroBody,
  heroActions,
  primaryAction,
  secondaryAction,
  headlineGrid,
  headlineCard,
  headlineLabel,
  headlineValue,
  headlineNote,
  survivalGrid,
  coreGrid,
  opsCard,
  opsHeader,
  sectionEyebrow,
  emptyState,
  detailSection,
  detailSectionHeader,
  detailSectionTitle,
} from "./operationalStyles";

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
  const isOnlineCategory = d.businessCtx.categoryId === "online-digital";
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
  // AI 코치에서 가장 높은 우선순위 액션의 제목을 topRiskLabel로 사용
  const aiTopAction = d.aiActions?.todayActions?.[0];
  const aiCrisis = d.aiActions?.crisisActions?.[0];
  const topRiskLabel =
    aiCrisis
      ? aiCrisis.title
      : aiTopAction?.priority === "high"
        ? aiTopAction.title
        : runwayMonths >= 0 && runwayMonths <= 3
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
  // AI 코치에서 reason/impact를 focusMessage로 사용
  const focusMessage =
    aiCrisis
      ? aiCrisis.impact
      : aiTopAction?.priority === "high"
        ? aiTopAction.reason
        : runwayMonths >= 0 && runwayMonths <= 3
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

  const aiLoadAttemptedRef = useRef(false);
  useEffect(() => {
    if (!d.aiActions && !d.aiActionsLoading && d.businessLaunched && d.storeName && !aiLoadAttemptedRef.current) {
      aiLoadAttemptedRef.current = true;
      void d.fetchAiActions().finally(() => {
        // 5초 후 다시 시도 가능하도록 (무한 루프 방지)
        setTimeout(() => { aiLoadAttemptedRef.current = false; }, 5000);
      });
    }
  }, [d.aiActions, d.aiActionsLoading, d.businessLaunched, d.storeName]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 전월 대비 손익 변화율
  const prevNetProfit = (prevMonthSales !== undefined && prevMonthCosts !== undefined) ? prevMonthSales - prevMonthCosts : undefined;
  const pnlChangePercent = (prevNetProfit !== undefined && prevNetProfit !== 0) ? Math.round(((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100) : undefined;

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
      change: pnlChangePercent,
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
      change: undefined as number | undefined,
    },
    {
      label: isStartupCompany
        ? (ko ? "로드맵 실행" : "Roadmap execution")
        : ko ? (d.businessCtx.inventoryLabel?.ko ?? "현재 재고") : (d.businessCtx.inventoryLabel?.en ?? "Inventory"),
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
            ? (d.businessCtx.inventoryMode === "unified" ? "제품 상태 안정" : "재고 상태 안정")
            : "Stock looks stable",
      tone: "rgba(15, 23, 42, 0.94)",
      change: undefined as number | undefined,
    },
    {
      label: ko ? "경영 건강" : "Health",
      value: totalSales > 0
        ? `${healthMetrics.healthScore}${ko ? "점" : "pt"}`
        : "—",
      note: totalSales > 0
        ? healthMetrics.healthGrade === "healthy" ? (ko ? "건강한 상태입니다" : "Healthy")
          : healthMetrics.healthGrade === "caution" ? (ko ? "주의가 필요합니다" : "Needs attention")
          : healthMetrics.healthGrade === "warning" ? (ko ? "경고 — 비용 점검 필요" : "Warning — check costs")
          : (ko ? "위험 — 즉시 대응 필요" : "Critical — act now")
        : ko ? "매출 입력 후 측정" : "Enter sales to measure",
      tone: totalSales > 0
        ? healthMetrics.healthScore >= 75 ? "#059669"
          : healthMetrics.healthScore >= 50 ? "#d97706"
          : "#dc2626"
        : "rgba(15, 23, 42, 0.82)",
      change: undefined as number | undefined,
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
      change: undefined as number | undefined,
    }] : []),
  ];

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

      {/* ━━━ 상호명 ━━━ */}
      <div style={{
        padding: "4px 0 12px",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{
          fontSize: "18px", fontWeight: 720, color: "#0f172a",
          letterSpacing: "-0.02em",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}>
          {d.storeName || (ko ? "내 가게" : "My Store")}
        </span>
        {d.businessLaunched && (
          <span style={{
            fontSize: "10px", fontWeight: 650, padding: "3px 8px", borderRadius: "6px",
            background: "rgba(5,150,105,0.08)", color: "#059669",
            letterSpacing: "0.02em",
          }}>
            {ko ? "운영 중" : "LIVE"}
          </span>
        )}
      </div>

      {/* ━━━ 1단계: 모닝 브리핑 (5초 뷰) ━━━ */}
      <MorningBriefing />

      {/* ━━━ 2단계: 매출 분해 + 월간 진행 + 비용 구조 (데이터 있을 때만) ━━━ */}
      {allEntries.length >= 2 && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
        <SalesBreakdownCard />
        <MonthlyProgressCard />
      </div>
      )}
      {allEntries.length >= 1 && (
      <div style={{ display: "grid", gridTemplateColumns: !isStartupCompany && !isOnlineCategory ? "1fr 1fr" : "1fr", gap: "14px", marginTop: "14px" }}>
        {/* CostStructure: 오프라인 전용 (식재료/인건비 비율 — 스타트업/온라인에 불필요) */}
        {!isStartupCompany && !isOnlineCategory && <CostStructureCard />}
        <BenchmarkCard />
      </div>
      )}

      {/* ━━━ 기존 대시보드 (3단계: 딥다이브) — 데이터 있을 때만 표시 ━━━ */}
      {allEntries.length >= 3 && (
      <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(15,23,42,0.35)", marginBottom: "16px" }}>
          {ko ? "상세 분석" : "DEEP DIVE"}
        </div>
      </div>
      )}

      <div style={{ ...heroPanel, display: "none" }} className="bento-card">
        <div style={heroHeader}>
          <div>
            <div style={heroEyebrow}>{ko ? "운영 홈" : "Operations home"}</div>
            <h1 style={heroTitle}>{d.storeName || (ko ? "내 가게" : "My Store")}</h1>
            <p style={heroBody}>
              {""}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={headlineLabel}>{item.label}</div>
                {item.change !== undefined && item.change !== 0 && (
                  <div style={{
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: item.change > 0 ? "rgba(101, 197, 101, 0.12)" : "rgba(197, 101, 101, 0.12)",
                    color: item.change > 0 ? "#177245" : "#b42318",
                  }}>
                    {item.change > 0 ? "+" : ""}{item.change}%
                  </div>
                )}
              </div>
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
            totalSales={totalSales}
            netProfit={netProfit}
            totalCosts={totalCosts}
          />
        )}
      </div>

      {/* ── 정산 예정 타임라인 (오프라인/온라인 — 스타트업은 숨김) ── */}
      {!isStartupCompany && <CashFlowForecastCard />}

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
            cogsLabel={d.businessCtx.expenseFields?.[0]?.label}
          />
        )}
        {/* ── 재고 요약 (읽기 전용) — CRUD는 내 가게 탭 ── */}
        {d.businessCtx.showInventoryCard && (
          <article style={{ borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)", background: "#fff", padding: "18px 22px", display: "grid", gap: "10px" }} className="bento-card bento-fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>{ko ? "재고 현황" : "Inventory"}</span>
                <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(29,53,87,0.06)", color: "var(--primary)" }}>{inventory.length}{ko ? "개" : ""}</span>
              </div>
              <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>{ko ? "관리하기 →" : "Manage →"}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              <div style={{ padding: "10px", borderRadius: "10px", background: lowStockItems.length > 0 ? "rgba(255,59,48,0.04)" : "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
                <div style={{ fontSize: "18px", fontWeight: 740, color: lowStockItems.length > 0 ? "#ff3b30" : "#0f172a" }}>{lowStockItems.length}</div>
                <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "부족" : "Low"}</div>
              </div>
              <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
                <div style={{ fontSize: "18px", fontWeight: 740, color: "#0f172a" }}>{inventory.filter((i: InventoryEntry) => { const exp = i.expiryDate ? new Date(i.expiryDate) : null; return exp && exp.getTime() - Date.now() < 3 * 86400000 && exp.getTime() > Date.now(); }).length}</div>
                <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "유통기한 임박" : "Expiring"}</div>
              </div>
              <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
                <div style={{ fontSize: "18px", fontWeight: 740, color: "#0f172a" }}>{inventory.length}</div>
                <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "총 항목" : "Total"}</div>
              </div>
            </div>
            {inventory.length === 0 && (
              <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px dashed rgba(0,0,0,0.1)", background: "transparent", cursor: "pointer", fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
                {ko ? "📦 재고를 등록하면 부족 알림을 받을 수 있어요" : "📦 Register inventory to get low-stock alerts"}
              </button>
            )}
          </article>
        )}
        {/* ── 팀 요약 (읽기 전용) — CRUD는 내 가게 탭 ── */}
        <article style={{ borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)", background: "#fff", padding: "18px 22px", display: "grid", gap: "10px" }} className="bento-card bento-fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>{ko ? "팀 현황" : "Team"}</span>
              <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(29,53,87,0.06)", color: "var(--primary)" }}>{employees.length}{ko ? "명" : ""}</span>
            </div>
            <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>{ko ? "관리하기 →" : "Manage →"}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 740, color: "#0f172a" }}>{employees.length}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "인원" : "Staff"}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 740, color: "#0f172a" }}>{fmt(estimatedMonthlyPayroll)}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "예상 급여" : "Payroll"}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 740, color: "#0f172a" }}>{insuredEmployees}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "4대보험" : "Insured"}</div>
            </div>
          </div>
          {employees.length === 0 && (
            <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px dashed rgba(0,0,0,0.1)", background: "transparent", cursor: "pointer", fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
              {ko ? "👥 직원을 등록하면 급여·보험 현황을 한눈에 볼 수 있어요" : "👥 Add staff to see payroll & insurance at a glance"}
            </button>
          )}
        </article>
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

      {/* ── 인기 상품/서비스 + 최근 활동 2열 그리드 ── */}
      {!isStaff && (d.businessCtx.inventoryMode as string) !== "minimal" && !isStartupCompany && (
        <div style={{ display: "grid", gridTemplateColumns: viewportWidth >= 768 ? "1fr 1fr" : "1fr", gap: "16px" }}>
          {/* 인기 상품/서비스 카드 */}
          <div style={opsCard} className="bento-card bento-fade-in">
            <div style={opsHeader}>
              <div>
                <div style={sectionEyebrow}>{ko ? "이번 달" : "This Month"}</div>
                <div style={{ fontSize: "17px", fontWeight: 650, letterSpacing: "-0.02em", color: "#0f172a" }}>
                  {ko ? (d.businessCtx.inventoryMode === "service" ? "인기 서비스" : d.businessCtx.inventoryMode === "minimal" ? "인기 프로그램" : "인기 상품") : "Top Products"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", marginTop: "2px" }}>
                  {ko ? "매출 기준 상위 항목" : "Best selling products this month"}
                </div>
              </div>
            </div>
            {(d.products as Array<{ id: string; name: string; monthlySales?: number; price?: number }> || []).length > 0 ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {(d.products as Array<{ id: string; name: string; monthlySales?: number; price?: number }>)
                  .sort((a, b) => ((b.monthlySales ?? 0) * (b.price ?? 0)) - ((a.monthlySales ?? 0) * (a.price ?? 0)))
                  .slice(0, 4)
                  .map((product, i) => {
                    const revenue = (product.monthlySales ?? 0) * (product.price ?? 0);
                    const maxRevenue = Math.max(...(d.products as Array<{ monthlySales?: number; price?: number }>).map(p => (p.monthlySales ?? 0) * (p.price ?? 0)), 1);
                    const percent = Math.round((revenue / maxRevenue) * 100);
                    return (
                      <div key={product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>{product.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>
                            {product.monthlySales ?? 0}{ko ? "개 판매" : " sales"}
                          </div>
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(5,97,252,0.08)", marginTop: "6px", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "2px", width: `${percent}%`, background: i === 0 ? "#0561fc" : "rgba(5,97,252,0.4)", transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a", whiteSpace: "nowrap" }}>{fmt(revenue)}</div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={emptyState}>{ko ? "상품을 등록하면 매출 순위가 여기에 표시됩니다" : "Add products to see sales ranking here"}</div>
            )}
          </div>

          {/* 최근 활동 피드 */}
          <div style={opsCard} className="bento-card bento-fade-in">
            <div style={opsHeader}>
              <div>
                <div style={sectionEyebrow}>{ko ? "최근" : "Recent"}</div>
                <div style={{ fontSize: "17px", fontWeight: 650, letterSpacing: "-0.02em", color: "#0f172a" }}>
                  {ko ? "최근 활동" : "Recent Activity"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", marginTop: "2px" }}>
                  {ko ? "대시보드 최근 이벤트" : "Latest events and updates"}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {recent7Entries.length > 0 ? recent7Entries.slice(-5).reverse().map((entry, i) => (
                <div key={entry.date} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: i === 0 ? "rgba(5,97,252,0.04)" : "transparent" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: entry.sales > avgDailySales ? "rgba(101,197,101,0.12)" : "rgba(5,97,252,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                    {entry.sales > avgDailySales ? "📈" : "📊"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                      {ko ? "매출 기록" : "Sales recorded"} — {fmt(entry.sales)}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>
                      {ko ? `고객 ${entry.customers}명` : `${entry.customers} customers`} · {entry.date.slice(5).replace("-", "/")}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", whiteSpace: "nowrap" }}>
                    {i === 0 ? (ko ? "최근" : "Latest") : `${i + 1}${ko ? "일 전" : "d ago"}`}
                  </div>
                </div>
              )) : (
                <div style={emptyState}>{ko ? "매출을 기록하면 활동 내역이 여기에 표시됩니다" : "Record sales to see activity here"}</div>
              )}
            </div>
          </div>
        </div>
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
