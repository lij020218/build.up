// @ts-nocheck
// TODO: Add proper types after decomposition stabilizes
"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { hydrateSavedFinanceSnapshot } from "../../helpers";
import { SURFACE_HREFS, VENDOR_URL_MAP } from "../../constants";
import { useRef, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import {
  formatKRW, calculateHealthMetrics, localizeRecommendationItem,
  getUiCopy, formatBudgetPresetLabel, formatStartupType,
  resolveBusinessContext, starterIndustryOptions, getMatchedProgramsV2,
  getApplicationStatusLabel, getFranchiseBrandById, getMatchedHighlights,
  getProgramCategoryColor, getProgramCategoryLabel,
  getFranchiseSupplyInfo, getSupplyTypeColor,
  getFranchiseBenchmark, getIndustryBenchmark,
} from "@build-up/shared";

export function AnalyticsSurface() {
  const d = useDashboardCtx();
  // Spread ALL dashboard context properties into local scope
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _d = d as any;
  const {
    language, dailyEntries, monthlyCosts, inventory, setInventory, invForm, setInvForm,
    employees, setEmployees, fixedExpenses, setFixedExpenses,
    deliveryPlatforms, setDeliveryPlatforms, monthlyDeliverySales, setMonthlyDeliverySales,
    products, setProducts, unifiedProducts, setUnifiedProducts, serviceMenuItems, setServiceMenuItems,
    members, setMembers, taxSettings, setTaxSettings, costHistory,
    businessLaunched, storeName, setStoreName, businessCtx, industryCategoryId,
    handleAddDailyEntry, handleSaveMonthlyCosts,
    saveInventory, handleInvSave, handleInvQty, handleInvDelete, openInvEdit, handleInvWaste, handleMarkOrdered,
    emptyInvForm, saveEmployees, handleEmpSave, handleEmpDelete, openEmpEdit,
    saveFixedExpenses, handleFexpSave, handleFexpDelete, openFexpEdit,
    saveDeliveryPlatforms, saveMonthlyDeliverySales, handleDlvSave, handleDlvDelete, openDlvEdit,
    saveProducts, handleProdSave, handleProdDelete, handleProdSoldChange, openProdEdit,
    saveUnifiedProducts, saveServiceMenuItems, saveTaxSettings,
    dailySalesInput, setDailySalesInput, dailyCustomersInput, setDailyCustomersInput, dailyDateInput, setDailyDateInput,
    costIngredientsText, setCostIngredientsText, costLaborText, setCostLaborText,
    costRentText, setCostRentText, costUtilitiesText, setCostUtilitiesText, costOtherText, setCostOtherText,
    empFormOpen, setEmpFormOpen, empEditId, setEmpEditId, empName, setEmpName,
    empWage, setEmpWage, empHours, setEmpHours, empInsured, setEmpInsured,
    userRole, resetDemo, navigateToSurface,
    selectedStoreIndex, setSelectedStoreIndex, decisions, profile, startupType,
    selectedIndustryId, preferredRegion, showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    cpaDecision, setCpaDecision, onlinePlatformSales, setOnlinePlatformSales,
    onlineSelectedPlatforms, setOnlineSelectedPlatforms, onlineSelectedCourier, setOnlineSelectedCourier,
    onlineMonthlyParcels, setOnlineMonthlyParcels, router, copy,
    invCategoryFilter, setInvCategoryFilter,
    prodFormOpen, setProdFormOpen, prodEditId, setProdEditId, prodName, setProdName,
    prodPrice, setProdPrice, prodCost, setProdCost, prodCategory, setProdCategory,
    fexpFormOpen, setFexpFormOpen, fexpEditId, setFexpEditId, fexpName, setFexpName,
    fexpAmount, setFexpAmount, fexpDueDay, setFexpDueDay, fexpCategory, setFexpCategory,
    dlvFormOpen, setDlvFormOpen, dlvEditId, setDlvEditId, dlvName, setDlvName,
    dlvFeeRate, setDlvFeeRate,
    memFormOpen, setMemFormOpen, memEditId, setMemEditId, memName, setMemName,
    memPlan, setMemPlan, memFee, setMemFee, memStartDate, setMemStartDate, memEndDate, setMemEndDate,
    businessHealthScore, flushStoreData, persistenceReady,
    roadmap, completedCount, pathTotalStages, correctedProgressPercent,
    currentStage, localizedCurrentStage, businessLaunchedDate,
    handleExcelImport, softOpenChecks, softOpenSkips, softOpenPricing, setSoftOpenPricing,
    opsSelections, setOpsSelections, vendorSelections, vendorCustomInputs,
    selectedBudget, saveMembers,
    savedFinanceSnapshot, selectedIndustryCategoryId, selectedFranchiseBrandId,
    aiActions, aiActionsLoading, fetchAiActions,
    isDigitalCategory, showFinancePanel, setShowFinancePanel,
    invWasteQty, setInvWasteQty, invWasteReason, setInvWasteReason, invWasteTarget, setInvWasteTarget,
    prodStock, setProdStock, prodUnit, setProdUnit,
    dlvAd, setDlvAd, dlvRate, setDlvRate,
    memEnd, setMemEnd,
  } = _d;
  const analyticsInventoryRef = useRef<HTMLDivElement>(null);
  const analyticsStaffRef = useRef<HTMLDivElement>(null);
  const ko = language === "ko";
  const [invShowAll, setInvShowAll] = useState(false);
  const aiLoadedRef = useRef(false);

  // AI 코치 자동 로드 (렌더링 중 setState 방지 — useEffect에서 1회만)
  useEffect(() => {
    if (!aiLoadedRef.current && !aiActions && !aiActionsLoading && storeName && businessLaunched) {
      aiLoadedRef.current = true;
      const timer = setTimeout(() => fetchAiActions(), 500);
      return () => clearTimeout(timer);
    }
  }, [aiActions, aiActionsLoading, storeName, businessLaunched]);


        const currentMonth = new Date().toISOString().slice(0, 7);
        type DE = { date: string; sales: number; customers: number };
        const monthEntries = (dailyEntries as DE[]).filter((e) => e.date.startsWith(currentMonth));
        const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
        const totalCustomers = monthEntries.reduce((s, e) => s + e.customers, 0);
        const workingDays = monthEntries.length;
        const avgDailySales = workingDays > 0 ? totalSales / workingDays : 0;
        const avgTicket = totalCustomers > 0 ? totalSales / totalCustomers : 0;
        const { ingredients, labor, rent, utilities, other } = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
        const totalCosts = ingredients + labor + rent + utilities + other;
        const ingredientRatio = totalSales > 0 ? (ingredients / totalSales) * 100 : 0;
        const laborRatio = totalSales > 0 ? (labor / totalSales) * 100 : 0;
        const primeCost = ingredientRatio + laborRatio;
        const rentRatio = totalSales > 0 ? (rent / totalSales) * 100 : 0;
        const netProfit = totalSales - totalCosts;
        const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
        const bepProgress = totalCosts > 0 ? Math.min(100, (totalSales / totalCosts) * 100) : 0;

        const fmt = (n: number) => n >= 10000
          ? `${Math.round(n / 10000).toLocaleString()}만원`
          : `${Math.round(n).toLocaleString()}원`;
        const pct = (n: number) => `${n.toFixed(1)}%`;

        type HealthLevel = "good" | "caution" | "danger";
        const health = (val: number, good: number, caution: number): HealthLevel =>
          val <= good ? "good" : val <= caution ? "caution" : "danger";
        const healthColor = (h: HealthLevel) =>
          h === "good" ? "#34c759" : h === "caution" ? "#ff9f0a" : "#ff3b30";
        const healthLabel = (h: HealthLevel) =>
          language === "ko"
            ? h === "good" ? "건강" : h === "caution" ? "주의" : "위험"
            : h === "good" ? "Good" : h === "caution" ? "Caution" : "Danger";

        const ingHealth = health(ingredientRatio, 35, 40);
        const labHealth = health(laborRatio, 30, 35);
        const primeHealth = health(primeCost, 60, 65);
        const rentHealth = health(rentRatio, 10, 15);

        // 월말 순이익 예측
        const todayDate = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const remainDays = daysInMonth - todayDate;
        const avgDailySalesNum = workingDays > 0 ? totalSales / workingDays : 0;
        const projectedSales = workingDays > 0 ? totalSales + avgDailySalesNum * remainDays : 0;
        const projectedProfit = projectedSales - totalCosts;
        const hasDangerZone = ingHealth === "danger" || labHealth === "danger" || rentHealth === "danger" || primeHealth === "danger" || (totalSales > 0 && netProfit < 0);

        const diagnostics: string[] = [];
        if (totalSales > 0) {
          if (primeHealth === "danger") diagnostics.push(language === "ko"
            ? `Prime Cost(원가율+인건비율)가 ${pct(primeCost)}입니다. 65% 이하를 유지해야 임대료·세금을 내고 수익이 남습니다.`
            : `Prime Cost is ${pct(primeCost)}. Keep it under 65% to have margin left after rent and taxes.`);
          if (ingHealth !== "good") diagnostics.push(language === "ko"
            ? `재료비율이 ${pct(ingredientRatio)}입니다. 30~35%를 목표로 메뉴 원가를 점검하세요.`
            : `Food cost ratio is ${pct(ingredientRatio)}. Target 30–35% and review menu costs.`);
          if (labHealth !== "good") diagnostics.push(language === "ko"
            ? `인건비율이 ${pct(laborRatio)}입니다. 30% 이하를 유지해야 수익이 납니다. 스케줄 최적화를 검토하세요.`
            : `Labor ratio is ${pct(laborRatio)}. Keep it under 30% to stay profitable. Review staff scheduling.`);
          if (rentHealth !== "good") diagnostics.push(language === "ko"
            ? `임대료 비율이 ${pct(rentRatio)}입니다. 10% 이하를 권장합니다. 매출 증대가 시급합니다.`
            : `Rent ratio is ${pct(rentRatio)}. Under 10% is recommended — focus on increasing revenue.`);
          if (netProfit < 0) diagnostics.push(language === "ko"
            ? `이번 달 예상 적자입니다(${fmt(Math.abs(netProfit))}). 비용 구조를 점검하세요.`
            : `Projected loss this month (${fmt(Math.abs(netProfit))}). Review your cost structure.`);
          if (diagnostics.length === 0) diagnostics.push(language === "ko"
            ? "지표가 모두 건강한 범위에 있습니다. 이 구조를 유지하세요."
            : "All metrics are in healthy range. Keep up the good work.");
        }

        const inputStyle = {
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "15px",
          outline: "none",
          background: "rgba(255,255,255,0.8)",
          width: "100%",
          boxSizing: "border-box" as const
        };
        const costRowStyle = { display: "flex", gap: "8px", alignItems: "center" };
        const costLabelStyle = { fontSize: "13px", color: "var(--muted)", width: "80px", flexShrink: 0 };
        const kpiRowStyle = { display: "flex", flexDirection: "column" as const, gap: "10px" };
        const kpiItemStyle = { display: "flex", flexDirection: "column" as const, gap: "4px" };
        const kpiLabelStyle = { fontSize: "12px", color: "var(--muted)", fontWeight: 500, letterSpacing: "0.04em" };
        const kpiValueStyle = { fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" };
        const kpiBarBgStyle = { height: "6px", borderRadius: "4px", background: "rgba(0,0,0,0.08)", overflow: "hidden" as const };

        // ── 가게 카드 목록 뷰 ──
        if (selectedStoreIndex === null) {
          const ko = language === "ko";
          const industryId = decisions["industry-selection"]?.selectedPrimaryOptionId ?? profile?.subIndustryId;
          const industryLabel = industryId
            ? localizeRecommendationItem({ id: industryId, title: industryId }, language).title
            : null;
          const progressPct = Math.min(100, Math.round((roadmap.completedStageIds.length / pathTotalStages) * 100));

          return (
            <section style={styles.section}>
              <div style={styles.sectionTitle} role="heading" aria-level={2}>{ko ? "내 가게" : "My Stores"}</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>

                {/* ── 현재 가게 카드 ── */}
                <button
                  type="button"
                  onClick={() => setSelectedStoreIndex(0)}
                  aria-label={ko ? "현재 가게 선택" : "Select current store"}
                  style={{
                    display: "block", width: "100%", textAlign: "left" as const,
                    background: "#fff", borderRadius: "18px",
                    border: "1px solid rgba(0,0,0,0.10)",
                    padding: "22px 22px 20px", cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  {/* 상단: 상호명 + 상태 뱃지 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div style={{ fontSize: "21px", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                      {storeName || (ko ? "내 가게" : "My Store")}
                    </div>
                    <div style={{
                      fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px",
                      background: businessLaunched ? "rgba(52,199,89,0.10)" : "rgba(0,0,0,0.05)",
                      color: businessLaunched ? "#248a3d" : "var(--muted)",
                      flexShrink: 0, marginLeft: "10px",
                    }}>
                      {businessLaunched ? (ko ? "운영 중" : "Open") : (ko ? "준비 중" : "Preparing")}
                    </div>
                  </div>

                  {/* 업종 레이블 */}
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "20px", letterSpacing: "0.01em" }}>
                    {industryLabel ?? (ko ? "업종 미설정" : "Industry not set")}
                  </div>

                  {/* 진행률 */}
                  <div style={{ height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{
                      height: "100%", borderRadius: "2px",
                      background: progressPct >= 100 ? "#34c759" : "#007aff",
                      width: `${progressPct}%`, transition: "width 0.4s ease",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      {ko ? `${roadmap.completedStageIds.length}/${pathTotalStages} 단계` : `${roadmap.completedStageIds.length} of ${pathTotalStages} stages`}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#007aff" }}>
                      {ko ? "자세히 보기" : "View details"} ›
                    </span>
                  </div>
                </button>

                {/* ── 가게 추가 (준비 중) ── */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "18px 22px",
                  background: "rgba(0,0,0,0.02)", borderRadius: "18px",
                  border: "1px dashed rgba(0,0,0,0.13)",
                }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    border: "1.5px dashed rgba(0,0,0,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", fontWeight: 300, color: "rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}>+</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(0,0,0,0.25)", marginBottom: "2px" }}>
                      {ko ? "가게 추가" : "Add a store"}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 500, color: "rgba(0,0,0,0.18)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      {ko ? "곧 지원 예정" : "Coming soon"}
                    </div>
                  </div>
                </div>

              </div>
            </section>
          );
        }


  return (
    <>
            <section style={styles.section}>
              {/* ── 뒤로가기 ── */}
              <button
                type="button"
                onClick={() => setSelectedStoreIndex(null)}
                aria-label={language === "ko" ? "내 가게 목록으로 돌아가기" : "Back to My Stores"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "15px", fontWeight: 400, color: "#007aff",
                  padding: "0", marginBottom: "20px",
                }}
              >
                ‹ {language === "ko" ? "내 가게" : "My Stores"}
              </button>
              {/* ── 상단: 가게명 + 상태 + KPI 한눈에 ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, letterSpacing: "-0.03em" }}>
                    {storeName || (language === "ko" ? "내 가게" : "My Store")}
                  </div>
                  <div style={{
                    fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px",
                    background: businessLaunched ? "rgba(52,199,89,0.10)" : "rgba(0,0,0,0.05)",
                    color: businessLaunched ? "#248a3d" : "var(--muted)",
                  }}>
                    {businessLaunched ? (language === "ko" ? "운영 중" : "Open") : (language === "ko" ? "준비 중" : "Preparing")}
                  </div>
                </div>
              </div>

              {/* ── KPI 요약 바 (매출 / 비용 / 순이익 / BEP) ── */}
              {totalSales > 0 && (
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px",
                  marginBottom: "8px",
                }}>
                  {[
                    { label: language === "ko" ? "이달 매출" : "Revenue", value: fmt(totalSales), color: "#1d3557" },
                    { label: language === "ko" ? "총 비용" : "Costs", value: fmt(totalCosts), color: "#5b616e" },
                    { label: language === "ko" ? "순이익" : "Net Profit", value: `${netProfit >= 0 ? "+" : ""}${fmt(netProfit)}`, color: netProfit >= 0 ? "#34c759" : "#ff3b30" },
                    { label: language === "ko" ? "손익분기" : "BEP", value: `${bepProgress.toFixed(0)}%`, color: bepProgress >= 100 ? "#34c759" : bepProgress >= 70 ? "#ff9f0a" : "#ff3b30" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{
                      padding: "14px 16px", borderRadius: "18px",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))",
                      border: "1px solid rgba(17,17,17,0.06)",
                      backdropFilter: "blur(12px)",
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", marginBottom: "4px" }}>{kpi.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: 720, color: kpi.color, letterSpacing: "-0.03em" }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── AI 오늘 할 일 카드 ── */}
              {businessLaunched && (() => {
                const ko = language === "ko";
                // 자동 로드는 useEffect에서 처리 (렌더링 중 setState 방지)
                if (!aiActions && !aiActionsLoading) return null;
                return (
                  <article ref={analyticsInventoryRef} id="inventory-management" style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    <div style={{ padding: "18px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "2px" }}>
                          {ko ? "AI 코치" : "AI Coach"}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
                          {ko ? "오늘 할 일" : "Today's Actions"}
                        </div>
                      </div>
                      <button type="button" onClick={fetchAiActions} disabled={aiActionsLoading}
                        style={{ fontSize: "11px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", opacity: aiActionsLoading ? 0.4 : 1 }}>
                        {aiActionsLoading ? (ko ? "분석 중..." : "Loading...") : (ko ? "새로고침" : "Refresh")}
                      </button>
                    </div>

                    {aiActionsLoading && !aiActions && (
                      <div style={{ padding: "20px 22px 24px", textAlign: "center" as const }}>
                        <div style={{ fontSize: "13px", color: "var(--muted)" }}>{ko ? "경영 데이터를 분석하고 있습니다..." : "Analyzing your business data..."}</div>
                      </div>
                    )}

                    {aiActions && (
                      <>
                        {/* 한 줄 인사이트 */}
                        {aiActions.insight && (
                          <div style={{ padding: "0 22px 12px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", lineHeight: 1.5 }}>
                              {aiActions.insight}
                            </div>
                          </div>
                        )}

                        {/* ── 프랜차이즈/업종 벤치마크 비교 바 ── */}
                        {(() => {
                          const fBench = selectedFranchiseBrandId ? getFranchiseBenchmark(selectedFranchiseBrandId) : null;
                          const iBench = selectedIndustryCategoryId ? getIndustryBenchmark(selectedIndustryCategoryId) : null;
                          const userMonthly = (dailyEntries as { sales: number }[]).reduce((s, e) => s + e.sales, 0);
                          const userMonthlyMan = Math.round(userMonthly / 10000);
                          const benchAvg = fBench?.avgMonthlyRevenue ?? (iBench ? Math.round(iBench.avgAnnualRevenue / 12) : 0);
                          const benchTop = fBench?.topStoreMonthlyRevenue ?? (iBench ? Math.round(iBench.top10PctRevenue / 12) : 0);
                          const benchLabel = fBench ? (getFranchiseBrandById(selectedFranchiseBrandId!)?.name?.[language] ?? selectedFranchiseBrandId) : (ko ? "업종 평균" : "Industry avg");

                          if (!benchAvg || userMonthly === 0) return null;

                          const pct = Math.min(Math.round((userMonthlyMan / benchTop) * 100), 100);
                          const avgPct = Math.min(Math.round((benchAvg / benchTop) * 100), 100);
                          const barColor = userMonthlyMan >= benchAvg ? "#34c759" : userMonthlyMan >= benchAvg * 0.7 ? "#ff9f0a" : "#ff3b30";

                          return (
                            <div style={{ padding: "0 22px 14px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>
                                {fBench ? (ko ? `${benchLabel} 같은 브랜드 비교` : `vs ${benchLabel} stores`) : (ko ? "업종 내 포지션" : "Industry position")}
                              </div>
                              {/* 비교 바 */}
                              <div style={{ position: "relative" as const, height: "28px", borderRadius: "8px", background: "rgba(0,0,0,0.03)", overflow: "hidden" }}>
                                {/* 평균 마커 */}
                                <div style={{ position: "absolute" as const, left: `${avgPct}%`, top: 0, bottom: 0, width: "1.5px", background: "rgba(0,0,0,0.15)", zIndex: 2 }} />
                                <div style={{ position: "absolute" as const, left: `${Math.max(avgPct - 3, 0)}%`, top: "-1px", fontSize: "9px", fontWeight: 700, color: "var(--muted)" }}>
                                  {ko ? "평균" : "Avg"}
                                </div>
                                {/* 사용자 바 */}
                                <div style={{
                                  position: "absolute" as const, left: 0, top: "10px", bottom: "4px", width: `${pct}%`,
                                  borderRadius: "6px", background: barColor, transition: "width 0.6s ease",
                                  minWidth: "4px",
                                }} />
                              </div>
                              {/* 레이블 */}
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "var(--muted)" }}>
                                <span>{ko ? `내 매장 ${userMonthlyMan.toLocaleString()}만` : `You ${userMonthlyMan.toLocaleString()}만`}</span>
                                <span>{ko ? `상위 매장 ${benchTop.toLocaleString()}만` : `Top ${benchTop.toLocaleString()}만`}</span>
                              </div>
                              {/* 상위 매장 비결 (프랜차이즈만) */}
                              {fBench?.operationalInsights?.[0] && (
                                <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "10px", background: "rgba(0,122,255,0.03)", border: "0.5px solid rgba(0,122,255,0.08)" }}>
                                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#007aff", marginBottom: "2px" }}>
                                    {ko ? "상위 매장 비결" : "Top store insight"}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--text)", lineHeight: 1.4 }}>
                                    {fBench.operationalInsights[0]}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 오늘 할 일 3가지 */}
                        <div style={{ padding: "0 22px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                          {aiActions.todayActions.map((action, i) => (
                            <div key={i} style={{
                              display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "14px",
                              background: action.priority === "high" ? "rgba(0,122,255,0.04)" : "rgba(0,0,0,0.02)",
                              border: action.priority === "high" ? "0.5px solid rgba(0,122,255,0.1)" : "0.5px solid rgba(0,0,0,0.04)",
                            }}>
                              <div style={{
                                width: "24px", height: "24px", borderRadius: "8px", flexShrink: 0,
                                background: action.priority === "high" ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: 700, color: action.priority === "high" ? "#007aff" : "var(--muted)",
                              }}>
                                {i + 1}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{action.title}</div>
                                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{action.reason}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 위기 해결 방법 (있을 때만) */}
                        {aiActions.crisisActions.length > 0 && (
                          <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "14px 22px 16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#ff3b30", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
                              {ko ? "위기 대응 방법" : "Crisis Response"}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                              {aiActions.crisisActions.map((action, i) => {
                                const diffColor = action.difficulty === "easy" ? "#34c759" : action.difficulty === "hard" ? "#ff9f0a" : "#007aff";
                                const diffLabel = action.difficulty === "easy" ? (ko ? "쉬움" : "Easy") : action.difficulty === "hard" ? (ko ? "어려움" : "Hard") : (ko ? "보통" : "Medium");
                                return (
                                  <div key={i} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255,59,48,0.03)", border: "0.5px solid rgba(255,59,48,0.08)" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{action.title}</div>
                                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{action.impact}</div>
                                    </div>
                                    <div style={{ fontSize: "10px", fontWeight: 700, color: diffColor, padding: "3px 8px", borderRadius: "6px", background: `${diffColor}12`, flexShrink: 0, alignSelf: "flex-start" }}>
                                      {diffLabel}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })()}

              {/* ── 월 비용 확인 프롬프트 ── */}
              {showMonthlyCostPrompt && (() => {
                const ko = language === "ko";
                const lastSnap = costHistory.length > 0 ? (costHistory as { month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }[]).sort((a, b) => b.month.localeCompare(a.month))[0] : null;
                return (
                  <article style={{ ...styles.card, padding: "18px 22px", background: "linear-gradient(135deg, rgba(0,122,255,0.04), rgba(52,199,89,0.04))", border: "1px solid rgba(0,122,255,0.12)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                          {ko ? "지난달 비용을 확인해주세요" : "Review last month's costs"}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                          {ko ? "비용 추세를 정확히 추적하려면 매달 업데이트가 필요합니다." : "Monthly updates are needed for accurate cost trend tracking."}
                        </div>
                      </div>
                      <button type="button" onClick={() => setShowMonthlyCostPrompt(false)}
                        aria-label={ko ? "비용 확인 닫기" : "Dismiss cost prompt"}
                        style={{ fontSize: "13px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 }}>✕</button>
                    </div>
                    {lastSnap && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" as const }}>
                        <button type="button" onClick={() => {
                          setCostIngredientsText(String(Math.round(lastSnap.ingredients / 10000)));
                          setCostLaborText(String(Math.round(lastSnap.labor / 10000)));
                          setCostRentText(String(Math.round(lastSnap.rent / 10000)));
                          setCostUtilitiesText(String(Math.round(lastSnap.utilities / 10000)));
                          setCostOtherText(String(Math.round(lastSnap.other / 10000)));
                          handleSaveMonthlyCosts();
                          setShowMonthlyCostPrompt(false);
                        }}
                          style={{ ...styles.primaryButton, fontSize: "13px", padding: "10px 18px" }}>
                          {ko ? "지난달과 동일" : "Same as last month"}
                        </button>
                        <button type="button" onClick={() => {
                          setCostIngredientsText(String(Math.round(lastSnap.ingredients / 10000)));
                          setCostLaborText(String(Math.round(lastSnap.labor / 10000)));
                          setCostRentText(String(Math.round(lastSnap.rent / 10000)));
                          setCostUtilitiesText(String(Math.round(lastSnap.utilities / 10000)));
                          setCostOtherText(String(Math.round(lastSnap.other / 10000)));
                          setShowMonthlyCostPrompt(false);
                          navigateToSurface("analytics");
                        }}
                          style={{ ...styles.button, fontSize: "13px", padding: "10px 18px" }}>
                          {ko ? "수정하기" : "Edit costs"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })()}

              {/* ── 매출 현황 + 입력 통합 카드 ── */}
              {(() => {
                const ko = language === "ko";
                const todayStr = new Date().toISOString().slice(0, 10);
                const last7 = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  return d.toISOString().slice(0, 10);
                });
                const entryMap = Object.fromEntries(
                  (dailyEntries as { date: string; sales: number; customers: number }[]).map(e => [e.date, { sales: e.sales, customers: e.customers }])
                );
                const bars = last7.map(date => ({
                  date,
                  sales: entryMap[date]?.sales ?? 0,
                  customers: entryMap[date]?.customers ?? 0,
                  label: ko
                    ? new Date(date + "T12:00:00").toLocaleDateString("ko-KR", { weekday: "narrow" })
                    : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
                  isToday: date === todayStr,
                }));
                const maxSales = Math.max(...bars.map(b => b.sales), 1);
                const hasAny = bars.some(b => b.sales > 0);
                const weekTotal = bars.reduce((s, b) => s + b.sales, 0);
                const todayEntry = entryMap[todayStr];
                const chartH = 56;
                const inputFieldStyle: React.CSSProperties = {
                  border: "1px solid rgba(17,17,17,0.08)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "15px",
                  outline: "none",
                  background: "rgba(255,255,255,0.9)",
                  flex: 1,
                  minWidth: 0,
                  boxSizing: "border-box" as const,
                };

                return (
                  <div style={{
                    borderRadius: "24px",
                    border: "1px solid rgba(17,17,17,0.06)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.82))",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 8px 24px rgba(17,17,17,0.04)",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}>
                    {/* 상단: 차트 영역 */}
                    <div style={{ padding: "20px 22px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                          {ko ? "최근 7일 매출" : "Last 7 Days"}
                        </div>
                        {hasAny && (
                          <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--text)" }}>
                            {fmt(weekTotal)}
                          </div>
                        )}
                      </div>

                      {/* 바 차트 */}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: `${chartH + 28}px` }}>
                        {bars.map(bar => {
                          const barH = bar.sales > 0 ? Math.max(5, (bar.sales / maxSales) * chartH) : 0;
                          return (
                            <div key={bar.date} style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
                              <div style={{
                                fontSize: "9px", fontWeight: 700, marginBottom: "3px", lineHeight: 1,
                                color: bar.isToday ? "#007aff" : bar.sales > 0 ? "rgba(0,0,0,0.45)" : "transparent",
                                minHeight: "10px",
                              }}>
                                {bar.sales > 0 ? `${Math.round(bar.sales / 10000)}` : ""}
                              </div>
                              <div style={{ width: "100%", height: `${chartH}px`, display: "flex", alignItems: "flex-end" }}>
                                <div style={{
                                  width: "100%",
                                  height: bar.sales > 0 ? `${barH}px` : "2px",
                                  borderRadius: "5px 5px 2px 2px",
                                  background: bar.isToday ? "#007aff" : bar.sales > 0 ? "rgba(0,122,255,0.16)" : "rgba(0,0,0,0.04)",
                                  transition: "height 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
                                }} />
                              </div>
                              <div style={{
                                fontSize: "10px", fontWeight: bar.isToday ? 700 : 500, marginTop: "5px",
                                color: bar.isToday ? "#007aff" : "var(--muted)",
                              }}>
                                {bar.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {!hasAny && (
                        <div style={{ textAlign: "center" as const, fontSize: "13px", color: "var(--muted)", padding: "12px 0 4px" }}>
                          {ko ? "아래에서 오늘 매출을 입력하세요" : "Enter today's sales below"}
                        </div>
                      )}
                    </div>

                    {/* 구분선 */}
                    <div style={{ height: "0.5px", background: "rgba(17,17,17,0.06)" }} />

                    {/* 하단: 입력 영역 */}
                    <div style={{ padding: "16px 22px 18px", background: "rgba(0,0,0,0.015)" }}>
                      {todayEntry ? (
                        /* 오늘 이미 입력됨 → 요약 표시 */
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", marginBottom: "2px" }}>
                              {ko ? "오늘 기록" : "Today"}
                            </div>
                            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                              {fmt(todayEntry.sales)}
                              {todayEntry.customers > 0 && (
                                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", marginLeft: "8px" }}>
                                  {todayEntry.customers}{ko ? "명" : " pax"} · {ko ? "객단가" : "avg"} {fmt(todayEntry.sales / todayEntry.customers)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button type="button" onClick={() => { setDailyDateInput(todayStr); setDailySalesInput(String(Math.round(todayEntry.sales / 10000))); setDailyCustomersInput(String(todayEntry.customers)); }}
                            aria-label={ko ? "오늘 매출 수정" : "Edit today's sales"}
                            style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer" }}>
                            {ko ? "수정" : "Edit"}
                          </button>
                        </div>
                      ) : (
                        /* 오늘 미입력 → 입력 폼 */
                        <>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", marginBottom: "10px" }}>
                            {ko ? "오늘 매출 입력" : "Log today's sales"}
                          </div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="date" value={dailyDateInput} onChange={(e) => setDailyDateInput(e.target.value)}
                              aria-label={ko ? "매출 날짜" : "Sales date"}
                              style={{ ...inputFieldStyle, flex: "0 0 auto", width: "140px" }} />
                            <input type="text" inputMode="numeric" value={dailySalesInput}
                              onChange={(e) => setDailySalesInput(e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder={ko ? "매출 만원" : "Sales 만원"}
                              aria-label={ko ? "매출 금액 (만원)" : "Sales amount (10K KRW)"}
                              style={inputFieldStyle} />
                            <input type="text" inputMode="numeric" value={dailyCustomersInput}
                              onChange={(e) => setDailyCustomersInput(e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder={ko ? "고객 수" : "Customers"}
                              aria-label={ko ? "고객 수" : "Number of customers"}
                              style={{ ...inputFieldStyle, flex: "0 0 90px" }} />
                            <button type="button"
                              style={{
                                borderRadius: "12px", border: "none",
                                background: dailySalesInput ? "var(--primary)" : "rgba(0,0,0,0.06)",
                                color: dailySalesInput ? "#fff" : "var(--muted)",
                                padding: "10px 18px", fontSize: "14px", fontWeight: 600,
                                cursor: dailySalesInput ? "pointer" : "default",
                                transition: "all 0.15s ease",
                                flexShrink: 0,
                              }}
                              onClick={handleAddDailyEntry}
                              disabled={!dailySalesInput}>
                              {ko ? "저장" : "Save"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── 주간 매출 요약 ── */}
              {(() => {
                const ko = language === "ko";
                const entries = dailyEntries as { date: string; sales: number; customers: number }[];
                const now = new Date();
                const todayIso = now.toISOString().slice(0, 10);
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const thisMonday = new Date(now); thisMonday.setDate(now.getDate() + mondayOffset); thisMonday.setHours(0, 0, 0, 0);
                const lastMonday = new Date(thisMonday); lastMonday.setDate(lastMonday.getDate() - 7);
                const lastSunday = new Date(thisMonday); lastSunday.setDate(lastSunday.getDate() - 1);

                const toIso = (d: Date) => d.toISOString().slice(0, 10);
                const thisWeek = entries.filter(e => e.date >= toIso(thisMonday) && e.date <= todayIso);
                const lastWeek = entries.filter(e => e.date >= toIso(lastMonday) && e.date <= toIso(lastSunday));

                if (thisWeek.length < 2) return null;

                const thisTotal = thisWeek.reduce((s, e) => s + e.sales, 0);
                const lastTotal = lastWeek.reduce((s, e) => s + e.sales, 0);
                const thisCust = thisWeek.reduce((s, e) => s + e.customers, 0);
                const avgSales = Math.round(thisTotal / thisWeek.length);
                const avgCust = thisWeek.length > 0 ? Math.round(thisCust / thisWeek.length) : 0;
                const change = lastTotal > 0 ? Math.round((thisTotal - lastTotal) / lastTotal * 100) : 0;
                const best = thisWeek.reduce((a, b) => a.sales > b.sales ? a : b);
                const bestLabel = new Date(best.date + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short", month: "short", day: "numeric" });
                const fmtW = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;

                return (
                  <article ref={analyticsStaffRef} id="staff-management" style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    <div style={{ padding: "18px 22px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                          {ko ? "주간 요약" : "Weekly Summary"}
                        </div>
                        {lastTotal > 0 && (
                          <div style={{
                            fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "8px",
                            background: change >= 0 ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)",
                            color: change >= 0 ? "#34c759" : "#ff3b30",
                          }}>
                            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% {ko ? "전주 대비" : "vs last week"}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "이번 주 매출" : "This week"}</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>{fmtW(thisTotal)}</div>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "일평균 매출" : "Daily avg"}</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>{fmtW(avgSales)}</div>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "일평균 고객" : "Avg customers"}</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>{avgCust}{ko ? "명" : " pax"}</div>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "최고 매출일" : "Best day"}</div>
                          <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.2px" }}>{bestLabel}</div>
                          <div style={{ fontSize: "12px", color: "#007aff", fontWeight: 600 }}>{fmtW(best.sales)}</div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })()}

              {/* ── 2컬럼 레이아웃 ── */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)", gap: "16px", alignItems: "stretch" }}>

              {/* ════ LEFT COLUMN ════ */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>

              {/* ── 사업 프로필 대시보드 ── */}
              {(() => {
                const ko = language === "ko";
                const notSet = ko ? "미입력" : "—";
                const divider = <div style={{ height: "1px", background: "rgba(0,0,0,0.06)" }} />;

                // ── 공통 스타일 헬퍼 ──
                const tileStyle: React.CSSProperties = { background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 13px" };
                const tileLabelStyle: React.CSSProperties = { fontSize: "11px", color: "var(--muted)", marginBottom: "5px", letterSpacing: "0.02em" };
                const tileValueStyle = (empty: boolean): React.CSSProperties => ({ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.2px", color: empty ? "var(--muted)" : "inherit" });
                const sectionLabel = (text: string, editHint?: string) => (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                      {text}
                    </div>
                    {editHint && <div style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic" }}>{editHint}</div>}
                  </div>
                );
                const chip = (text: string, active = true) => (
                  <span key={text} style={{ display: "inline-block", fontSize: "11px", fontWeight: 500, color: active ? "#007aff" : "var(--muted)", background: active ? "rgba(0,122,255,0.08)" : "rgba(0,0,0,0.05)", borderRadius: "6px", padding: "3px 8px" }}>
                    {text}
                  </span>
                );

                // 해당 로드맵 단계로 이동 (?editStage= 쿼리 파라미터로 전달)
                const goToStage = (stageId: string) => {
                  router.push(`${SURFACE_HREFS.current}?editStage=${stageId}`);
                };

                // ── 데이터 추출 ──
                const industryId = decisions["industry-selection"]?.selectedPrimaryOptionId ?? profile?.subIndustryId;
                const industryLabel = industryId ? localizeRecommendationItem({ id: industryId, title: industryId }, language).title : notSet;
                const startupTypeVal = decisions["startup-type"]?.selectedPrimaryOptionId ?? profile?.startupType;
                const startupTypeLabel = startupTypeVal ? formatStartupType(String(startupTypeVal), language) : notSet;
                const bizModelId = decisions["business-model"]?.selectedPrimaryOptionId ?? profile?.businessModelId;
                const bizModelLabel = bizModelId ? localizeRecommendationItem({ id: String(bizModelId), title: String(bizModelId) }, language).title : notSet;
                const capitalVal = decisions["budget-setup"]?.inputs?.capital ?? profile?.capital;
                const capitalLabel = capitalVal != null ? formatBudgetPresetLabel(Number(capitalVal), language) : notSet;
                const openDateVal = decisions["budget-setup"]?.inputs?.targetOpenDate
                  ?? (typeof window !== "undefined" ? localStorage.getItem("businessLaunchedDate") : null);
                const openDateLabel = openDateVal ? String(openDateVal) : notSet;
                const locationId = decisions["location-candidates"]?.selectedPrimaryOptionId;
                const regionInput = decisions["location-candidates"]?.inputs?.preferredRegion;
                const locationLabel = locationId
                  ? localizeRecommendationItem({ id: String(locationId), title: String(locationId) }, language).title
                  : regionInput ? String(regionInput) : notSet;

                // 재무 시뮬레이션
                const finSnap = hydrateSavedFinanceSnapshot(decisions["financial-simulation"]);
                const contractRisk = decisions["contract-analysis"]?.inputs?.riskLevel;

                // 운영 채널
                const deliveryPlatforms = [
                  { id: "baemin",       label: "배민" },
                  { id: "coupangeats",  label: "쿠팡이츠" },
                  { id: "yogiyo",       label: "요기요" },
                  { id: "naver-order",  label: "네이버주문" },
                ].filter(p => (opsSelections as Record<string, boolean>)[`delivery-${p.id}`]);
                const snsPlatforms = [
                  { id: "instagram",       label: "인스타그램" },
                  { id: "naver-place",     label: "네이버플레이스" },
                  { id: "kakao-channel",   label: "카카오채널" },
                  { id: "google-business", label: "구글비즈니스" },
                ].filter(p => (opsSelections as Record<string, boolean>)[`sns-${p.id}`]);
                const softOpenPricingLabel =
                  softOpenPricing === "free"     ? (ko ? "무료 제공" : "Free") :
                  softOpenPricing === "discount" ? (ko ? "30–50% 할인" : "30–50% off") :
                  softOpenPricing === "full"     ? (ko ? "정가 운영" : "Full price") : null;

                // 로드맵 진행
                const totalStages = pathTotalStages;
                const completedCount = roadmap.completedStageIds.length;
                const progressPct = Math.min(100, Math.round((completedCount / totalStages) * 100));

                // 위험도 색상
                const riskColor = (r: string | undefined) =>
                  r === "low" ? "#34c759" : r === "medium" ? "#ff9f0a" : r === "high" || r === "critical" ? "#ff3b30" : "var(--muted)";
                const riskLabel = (r: string | undefined) =>
                  !r ? notSet :
                  ko ? (r === "low" ? "낮음" : r === "medium" ? "보통" : r === "high" ? "높음" : "위험") :
                       (r === "low" ? "Low" : r === "medium" ? "Medium" : r === "high" ? "High" : "Critical");

                if (!persistenceReady) {
                  return (
                    <article style={{ ...styles.card, gap: "12px" }}>
                      <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {ko ? "데이터 불러오는 중…" : "Loading data…"}
                      </div>
                    </article>
                  );
                }

                return (
                  <>
                    {/* 생존 진단 카드는 대시보드 홈 KPI로 이동됨 */}
                    {false && (() => {
                      const launchDateStr = typeof window !== "undefined" ? localStorage.getItem("businessLaunchedDate") : null;
                      if (!launchDateStr) return null;
                      const launchDate = new Date(launchDateStr);
                      const today = new Date();
                      const daysSinceLaunch = Math.floor((today.getTime() - launchDate.getTime()) / 86400000);
                      if (daysSinceLaunch < 0) return null;

                      // 현재 달 매출 데이터
                      type DE = { date: string; sales: number; customers: number };
                      const allEntries = dailyEntries as DE[];
                      const totalRevenue = allEntries.reduce((s, e) => s + e.sales, 0);
                      const totalDays = allEntries.length;
                      const avgDaily = totalDays > 0 ? totalRevenue / totalDays : 0;
                      const monthlyProjected = avgDaily * 30;

                      // BEP 비교
                      const bepRevenue = savedFinanceSnapshot?.breakEvenRevenue ?? 0;
                      const bepAchievement = bepRevenue > 0 ? Math.max(0, Math.round((monthlyProjected / bepRevenue) * 100)) : 0;

                      // 원가율
                      const mc = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
                      const totalCost = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
                      const primeRate = monthlyProjected > 0 ? ((mc.ingredients + mc.labor) / monthlyProjected) * 100 : 0;

                      // 런웨이
                      const monthlyNet = monthlyProjected - totalCost;
                      const capitalLeft = Math.max(0, (selectedBudget ?? 0) - totalCost * (daysSinceLaunch / 30));
                      const runway = totalCost > 0 && monthlyNet < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(monthlyNet))) : -1; // -1 = 흑자(무한)

                      // 진단 단계 결정
                      const checkpoint = daysSinceLaunch >= 90 ? 90 : daysSinceLaunch >= 60 ? 60 : daysSinceLaunch >= 30 ? 30 : 0;
                      const phaseLabel = checkpoint === 0 ? (ko ? "적응기" : "Settling in")
                        : checkpoint === 30 ? (ko ? "30일 진단" : "30-Day Check")
                        : checkpoint === 60 ? (ko ? "60일 진단" : "60-Day Check")
                        : (ko ? "90일 진단" : "90-Day Check");

                      // 전체 건강 점수
                      const bepScore = bepAchievement >= 100 ? 3 : bepAchievement >= 70 ? 2 : bepAchievement >= 40 ? 1 : 0;
                      const primeScore = primeRate <= 60 ? 3 : primeRate <= 65 ? 2 : primeRate <= 70 ? 1 : 0;
                      const runwayScore = runway >= 6 ? 3 : runway >= 3 ? 2 : runway >= 1 ? 1 : 0;
                      const totalScore = bepScore + primeScore + runwayScore;
                      const overallHealth = totalScore >= 7 ? "good" : totalScore >= 4 ? "caution" : "danger";
                      const healthColor = overallHealth === "good" ? "#34c759" : overallHealth === "caution" ? "#ff9f0a" : "#ff3b30";
                      const healthMsg = overallHealth === "good"
                        ? (ko ? "양호한 흐름입니다. 현재 방향을 유지하세요." : "On track. Maintain current direction.")
                        : overallHealth === "caution"
                          ? (ko ? "주의가 필요합니다. 비용 구조를 점검하세요." : "Needs attention. Review your cost structure.")
                          : (ko ? "위험 신호입니다. 즉시 비용 절감과 매출 개선이 필요합니다." : "Warning. Immediate cost reduction and revenue improvement needed.");

                      return (
                        <article style={{
                          ...styles.card,
                          border: `1px solid ${healthColor}20`,
                          background: `linear-gradient(180deg, rgba(255,255,255,0.92) 0%, ${healthColor}04 100%)`
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: healthColor, marginBottom: "4px" }}>
                                {phaseLabel} · D+{daysSinceLaunch}
                              </div>
                              <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                                {ko ? "생존 진단" : "Survival Check"}
                              </div>
                            </div>
                            <div style={{
                              width: 44, height: 44, borderRadius: 22,
                              background: `${healthColor}15`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "20px"
                            }}>
                              {overallHealth === "good" ? "✓" : overallHealth === "caution" ? "!" : "⚠"}
                            </div>
                          </div>

                          {/* 핵심 지표 3개 */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                            <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                              <div style={{ fontSize: "18px", fontWeight: 700, color: bepAchievement >= 100 ? "#34c759" : bepAchievement >= 70 ? "#ff9f0a" : "#ff3b30" }}>
                                {totalDays > 0 ? `${bepAchievement}%` : "—"}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "BEP 달성률" : "BEP Rate"}</div>
                            </div>
                            <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                              <div style={{ fontSize: "18px", fontWeight: 700, color: primeRate <= 60 ? "#34c759" : primeRate <= 65 ? "#ff9f0a" : "#ff3b30" }}>
                                {totalDays > 0 ? `${primeRate.toFixed(0)}%` : "—"}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "프라임코스트" : "Prime Cost"}</div>
                            </div>
                            <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                              <div style={{ fontSize: "18px", fontWeight: 700, color: runway < 0 ? "#34c759" : runway >= 6 ? "#34c759" : runway >= 3 ? "#ff9f0a" : "#ff3b30" }}>
                                {totalCost > 0 ? (runway < 0 ? (ko ? "흑자" : "Surplus") : `${runway}${ko ? "개월" : "mo"}`) : "—"}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "현금 런웨이" : "Runway"}</div>
                            </div>
                          </div>

                          {/* 진단 메시지 */}
                          <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
                            {healthMsg}
                          </div>

                          {/* 위기 대응 가이드 (문제 감지 시) */}
                          {overallHealth !== "good" && totalDays > 0 && (() => {
                            type CrisisAction = { icon: string; title: string; actions: string[] };
                            const crisisGuides: CrisisAction[] = [];
                            if (bepAchievement < 70) {
                              crisisGuides.push({
                                icon: "📈", title: ko ? "매출 증가 전략" : "Revenue Growth",
                                actions: ko
                                  ? ["네이버 플레이스 리뷰 관리 — 별점 4.5 이상 유지가 신규 유입 핵심", "배달앱 상위노출 광고 (첫 주 집중)", "오프닝 프로모션 연장 또는 재이벤트", "주변 오피스/주거 타겟 전단지 + 쿠폰"]
                                  : ["Maintain 4.5+ Naver Place rating", "Delivery app top-exposure ads (focus first week)", "Extend/repeat opening promotions", "Flyers + coupons targeting nearby offices/residents"]
                              });
                            }
                            if (primeRate > 65) {
                              crisisGuides.push({
                                icon: "✂️", title: ko ? "비용 절감 전략" : "Cost Reduction",
                                actions: ko
                                  ? ["공급업체 2곳 이상 비교 견적 받기", "저마진 메뉴 제거 또는 가격 조정", "피크/비피크 시간대 인력 재배치", "식재료 로스 줄이기 — 일별 사용량 기록 시작"]
                                  : ["Get quotes from 2+ suppliers", "Remove low-margin items or adjust pricing", "Redistribute staff between peak/off-peak", "Reduce food waste — start daily usage tracking"]
                              });
                            }
                            if (runway < 3) {
                              crisisGuides.push({
                                icon: "🚨", title: ko ? "긴급 자금 확보" : "Emergency Funding",
                                actions: ko
                                  ? ["소상공인 긴급경영안정자금 신청 (소진공 1357)", "불필요한 고정비 즉시 해지 (미사용 구독, 과잉 보험)", "매출 집중 — 배달 전용 메뉴 추가로 매출원 다변화", "세무사 상담 — 비용 처리 최적화로 현금흐름 개선"]
                                  : ["Apply for emergency SME stabilization fund (SEMAS 1357)", "Cancel unnecessary fixed costs (unused subscriptions, excess insurance)", "Diversify revenue — add delivery-only menu", "Tax advisor — optimize expense treatment for cash flow"]
                              });
                            }
                            if (crisisGuides.length === 0) return null;
                            return (
                              <div style={{ display: "grid", gap: "8px" }}>
                                {crisisGuides.map((guide, gi) => (
                                  <div key={gi} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                      <span>{guide.icon}</span> {guide.title}
                                    </div>
                                    {guide.actions.map((action, ai) => (
                                      <div key={ai} style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", display: "flex", gap: "6px", marginBottom: "3px" }}>
                                        <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                                        <span>{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* 체크포인트별 추가 안내 */}
                          {checkpoint >= 30 && totalDays > 0 && (
                            <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}>
                              {checkpoint === 30 && (ko
                                ? `개업 30일 경과. 월 예상 매출 ${fmt(monthlyProjected)}으로 BEP(${fmt(bepRevenue)}) 대비 ${bepAchievement}% 달성 중입니다.${bepAchievement < 70 ? " 마케팅 강화와 메뉴 점검을 권장합니다." : ""}`
                                : `30 days since opening. Projected monthly ${fmt(monthlyProjected)} = ${bepAchievement}% of BEP (${fmt(bepRevenue)}).`)}
                              {checkpoint === 60 && (ko
                                ? `개업 60일 경과. 프라임코스트 ${primeRate.toFixed(1)}%${primeRate > 65 ? " — 식재료비 또는 인건비 재검토가 필요합니다." : "로 안정적입니다."} 고정비 구조를 점검하세요.`
                                : `60 days. Prime cost ${primeRate.toFixed(1)}%.${primeRate > 65 ? " Review ingredient or labor costs." : " Stable."} Check fixed cost structure.`)}
                              {checkpoint === 90 && (ko
                                ? `개업 90일 경과. ${monthlyNet >= 0 ? "흑자 구조입니다. 안정적 성장 단계로 진입했습니다." : "적자 구조입니다. 메뉴 가격, 원가, 고정비 중 하나를 반드시 조정해야 합니다."}`
                                : `90 days. ${monthlyNet >= 0 ? "Profitable. Entering stable growth phase." : "Loss structure. Must adjust menu pricing, costs, or fixed expenses."}`)}
                            </div>
                          )}
                        </article>
                      );
                    })()}

                    {/* ── 카드 1: 사업 기본 정보 ── */}
                    <article style={{ ...styles.card, gap: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {sectionLabel(ko ? "사업 기본 정보" : "Business Info")}
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
                          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: businessLaunched ? "#34c759" : "#ff9f0a" }} />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: businessLaunched ? "#34c759" : "#ff9f0a" }}>
                            {businessLaunched ? (ko ? "개업 운영 중" : "Open") : (ko ? "준비 중" : "Preparing")}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                          { label: ko ? "상호명" : "Store name",       value: storeName || notSet, stageId: "biz-registration" },
                          { label: ko ? "업종" : "Industry",           value: industryLabel,    stageId: "industry-selection" },
                          { label: ko ? "창업 형태" : "Startup type",  value: startupTypeLabel, stageId: "startup-type" },
                          { label: ko ? "운영 방식" : "Model",         value: bizModelLabel,    stageId: "business-model" },
                          { label: ko ? "초기 자본금" : "Capital",      value: capitalLabel,     stageId: "budget-setup" },
                          { label: ko ? "개업 목표일" : "Target date",  value: openDateLabel,    stageId: "budget-setup" },
                          { label: ko ? "상권·입지" : "Location",       value: locationLabel,    stageId: "location-candidates" },
                        ].map(({ label, value, stageId }) => (
                          <button
                            key={label}
                            onClick={() => goToStage(stageId)}
                            style={{ ...tileStyle, border: "none", cursor: "pointer", textAlign: "left" as const, display: "block", width: "100%", position: "relative" as const, transition: "background 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,122,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                          >
                            <div style={tileLabelStyle}>{label}</div>
                            <div style={tileValueStyle(value === notSet)}>{value}</div>
                            <div style={{ position: "absolute" as const, top: "9px", right: "9px", fontSize: "10px", fontWeight: 600, color: "rgba(0,122,255,0.6)" }}>
                              {ko ? "수정 →" : "Edit →"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </article>

                    {/* ── 카드 2: 재무 진단 ── */}
                    {finSnap && (
                      <article style={{ ...styles.card, gap: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                            {ko ? "재무 시뮬레이션 결과" : "Financial Forecast"}
                          </div>
                          <button
                            onClick={() => router.push(`${SURFACE_HREFS.guides}?panel=finance`)}
                            style={{ fontSize: "11px", color: "#007aff", fontWeight: 600, background: "rgba(0,122,255,0.08)", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer" }}
                          >
                            {ko ? "다시 계산" : "Recalculate"}
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div style={tileStyle}>
                            <div style={tileLabelStyle}>{ko ? "손익분기 월매출" : "Break-even revenue"}</div>
                            <div style={{ fontSize: "16px", fontWeight: 700 }}>{fmt(finSnap.breakEvenRevenue)}</div>
                          </div>
                          <div style={tileStyle}>
                            <div style={tileLabelStyle}>{ko ? "자본 생존 가능 기간" : "Runway"}</div>
                            <div style={{ fontSize: "16px", fontWeight: 700 }}>
                              {finSnap.survivabilityMonths > 0 ? `${finSnap.survivabilityMonths}${ko ? "개월" : "mo"}` : notSet}
                            </div>
                          </div>
                          <div style={tileStyle}>
                            <div style={tileLabelStyle}>{ko ? "재무 위험 등급" : "Risk level"}</div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: riskColor(finSnap.riskLevel) }}>
                              {riskLabel(finSnap.riskLevel)}
                            </div>
                          </div>
                          <div style={tileStyle}>
                            <div style={tileLabelStyle}>{ko ? "인테리어 후 잔여 자본" : "Capital after setup"}</div>
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>
                              {finSnap.capitalAfterSetupLow > 0
                                ? `${fmt(finSnap.capitalAfterSetupLow)} ~ ${fmt(finSnap.capitalAfterSetupHigh)}`
                                : notSet}
                            </div>
                          </div>
                          {finSnap.breakEvenMonth != null && (
                            <div style={tileStyle}>
                              <div style={tileLabelStyle}>{ko ? "손익분기 예상 시점" : "BEP month"}</div>
                              <div style={{ fontSize: "15px", fontWeight: 700 }}>
                                {ko ? `개업 후 ${finSnap.breakEvenMonth}개월차` : `Month ${finSnap.breakEvenMonth}`}
                              </div>
                            </div>
                          )}
                          {contractRisk && (
                            <div style={tileStyle}>
                              <div style={tileLabelStyle}>{ko ? "임대차 계약 위험도" : "Contract risk"}</div>
                              <div style={{ fontSize: "15px", fontWeight: 700, color: riskColor(String(contractRisk)) }}>
                                {riskLabel(String(contractRisk))}
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    )}

                    {/* ── 카드 3: 운영 채널 & 세팅 ── */}
                    {(() => {
                      const allDelivery = [
                        { id: "baemin",       label: "배민" },
                        { id: "coupangeats",  label: "쿠팡이츠" },
                        { id: "yogiyo",       label: "요기요" },
                        { id: "naver-order",  label: "네이버주문" },
                      ];
                      const allSns = [
                        { id: "instagram",       label: "인스타그램" },
                        { id: "naver-place",     label: "네이버플레이스" },
                        { id: "kakao-channel",   label: "카카오채널" },
                        { id: "google-business", label: "구글비즈니스" },
                      ];
                      const toggleChip = (key: string, label: string, active: boolean, onToggle: () => void) => (
                        <button
                          key={key}
                          onClick={onToggle}
                          style={{
                            display: "inline-block", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer",
                            color: active ? "#007aff" : "var(--muted)",
                            background: active ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.05)",
                            borderRadius: "7px", padding: "5px 10px",
                            outline: active ? "1.5px solid rgba(0,122,255,0.3)" : "none",
                            transition: "all 0.15s"
                          }}
                        >
                          {active ? "✓ " : ""}{label}
                        </button>
                      );
                      const pricingOptions = [
                        { id: "free",     label: ko ? "무료 제공" : "Free" },
                        { id: "discount", label: ko ? "30–50% 할인" : "Discount" },
                        { id: "full",     label: ko ? "정가 운영" : "Full price" },
                      ];
                      return (
                        <article style={{ ...styles.card, gap: "14px" }}>
                          {sectionLabel(ko ? "운영 채널 & 세팅" : "Operations", ko ? "직접 수정 가능" : "Edit inline")}
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
                            {/* 배달 플랫폼 */}
                            <div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "배달 플랫폼" : "Delivery platforms"}</div>
                              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                                {allDelivery.map(p => {
                                  const k = `delivery-${p.id}`;
                                  const active = !!(opsSelections as Record<string, boolean>)[k];
                                  return toggleChip(k, p.label, active, () => setOpsSelections(prev => ({ ...prev, [k]: !prev[k] })));
                                })}
                              </div>
                            </div>
                            {divider}
                            {/* SNS 채널 */}
                            <div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "SNS 채널" : "SNS channels"}</div>
                              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                                {allSns.map(p => {
                                  const k = `sns-${p.id}`;
                                  const active = !!(opsSelections as Record<string, boolean>)[k];
                                  return toggleChip(k, p.label, active, () => setOpsSelections(prev => ({ ...prev, [k]: !prev[k] })));
                                })}
                              </div>
                            </div>
                            {divider}
                            {/* 세무 처리 */}
                            <div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "세무 처리 방식" : "Tax filing"}</div>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {toggleChip("cpa", ko ? "세무사 선임" : "CPA hired", cpaDecision === "cpa", () => setCpaDecision(cpaDecision === "cpa" ? null : "cpa"))}
                                {toggleChip("self", ko ? "직접 신고" : "Self-filing", cpaDecision === "self", () => setCpaDecision(cpaDecision === "self" ? null : "self"))}
                              </div>
                            </div>
                            {divider}
                            {/* 소프트오픈 가격 전략 */}
                            <div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "소프트오픈 가격 전략" : "Soft open pricing"}</div>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {pricingOptions.map(opt =>
                                  toggleChip(opt.id, opt.label, softOpenPricing === opt.id, () => setSoftOpenPricing(softOpenPricing === opt.id ? "" : opt.id))
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })()}

                    {/* 월 비용 구조 → 오른쪽 비용 카드에 통합됨 */}

                    {/* ── 카드 5: 로드맵 진행 ── */}
                    <article style={{ ...styles.card, gap: "14px" }}>
                      {sectionLabel(ko ? "로드맵 진행" : "Roadmap Progress")}
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-1px" }}>{completedCount}</span>
                        <span style={{ fontSize: "15px", color: "var(--muted)", fontWeight: 500 }}>/ {totalStages}{ko ? "단계 완료" : " stages"}</span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "4px", background: "rgba(0,0,0,0.08)", overflow: "hidden" as const }}>
                        <div style={{ height: "100%", borderRadius: "4px", background: completedCount >= totalStages ? "#34c759" : "#007aff", width: `${progressPct}%`, transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "창업 준비 시작" : "Start"}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: completedCount >= totalStages ? "#34c759" : "#007aff" }}>{progressPct}%</span>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "개업 완료" : "Open"}</span>
                      </div>
                    </article>
                  </>
                );
              })()}

              {/* ── 지원사업·대출 정보 카드 ── */}
              {(() => {
                const ko = language === "ko";
                const allMatched = getMatchedProgramsV2({ startupType, industryCategoryId: selectedIndustryCategoryId });
                const programs = allMatched.filter(p => p.eligible).slice(0, 10);
                const highlights = getMatchedHighlights(startupType);
                if (programs.length === 0) return null;
                return (
                  <article style={{
                    ...styles.card, padding: "0", overflow: "hidden" as const,
                    border: "1px solid rgba(29,53,87,0.06)",
                    background: "linear-gradient(160deg, rgba(240,244,255,0.6) 0%, rgba(255,255,255,0.95) 100%)",
                  }}>
                    <div style={{ padding: "18px 20px 14px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "4px" }}>
                        {ko ? "지원사업 · 대출" : "Funding & Support"}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                        {ko ? "내 사업에 맞는 프로그램" : "Programs matched to your business"}
                      </div>
                    </div>
                    {highlights.length > 0 && (
                      <div style={{ padding: "0 20px 10px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        {highlights.slice(0, 2).map(h => (
                          <div key={h.id} style={{
                            fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px",
                            background: "rgba(29,53,87,0.06)", color: "var(--primary)",
                          }}>
                            {h.highlight ? (ko ? h.name.ko : h.name.en) : (ko ? h.name.ko : h.name.en)}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column" as const, gap: "1px", overflow: "hidden" as const }}>
                      {programs.map(prog => {
                        const catColor = getProgramCategoryColor(prog.category);
                        const catLabel = getProgramCategoryLabel(prog.category, language);
                        return (
                          <a key={prog.id} href={prog.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "10px 10px", borderRadius: "10px",
                              textDecoration: "none", color: "inherit",
                              transition: "background 0.15s",
                              overflow: "hidden" as const,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: "2px", flexShrink: 0 }}>
                              <div style={{
                                padding: "2px 7px", borderRadius: "5px", fontSize: "9px", fontWeight: 700,
                                background: `${catColor}14`, color: catColor,
                                letterSpacing: "0.02em",
                              }}>
                                {catLabel}
                              </div>
                              {prog.applicationStatus && (() => {
                                const st = getApplicationStatusLabel(prog.applicationStatus, language);
                                return (
                                  <div style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "9px", fontWeight: 700, background: `${st.color}14`, color: st.color, letterSpacing: "0.02em", textAlign: "center" as const }}>
                                    {st.label}
                                  </div>
                                );
                              })()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                {ko ? prog.name.ko : prog.name.en}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                {ko ? prog.benefit.ko : prog.benefit.en}
                              </div>
                              {prog.requiredDocs && prog.requiredDocs.length > 0 && (
                                <div style={{ fontSize: "10px", color: "rgba(0,122,255,0.7)", marginTop: "2px" }}>
                                  {ko ? "서류: " : "Docs: "}{prog.requiredDocs.map(d => ko ? d.ko : d.en).join(" · ")}
                                </div>
                              )}
                            </div>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: "rgba(0,0,0,0.2)" }}>
                              <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        );
                      })}
                    </div>
                    <div style={{ padding: "0 20px 14px" }}>
                      <button type="button" onClick={() => navigateToSurface("guides")}
                        style={{ fontSize: "12px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        {ko ? "전체 지원사업 보기 →" : "View all programs →"}
                      </button>
                    </div>
                  </article>
                );
              })()}

              </div>{/* END LEFT COLUMN */}

              {/* ════ RIGHT COLUMN ════ */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>

              {/* ── 이달 손익 히어로 카드 ── */}
              {(() => {
                const ko = language === "ko";
                const hasData = totalSales > 0;
                const hasCosts = totalCosts > 0;
                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 위험 경보 배너 */}
                    {hasDangerZone && hasData && (
                      <div style={{ padding: "11px 20px", background: "rgba(255,59,48,0.05)", borderBottom: "0.5px solid rgba(255,59,48,0.12)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                          <path d="M7 1L13 12H1L7 1Z" stroke="#ff3b30" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
                          <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round"/>
                          <circle cx="7" cy="10.5" r="0.7" fill="#ff3b30"/>
                        </svg>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#ff3b30", lineHeight: 1.4 }}>
                          {ko ? "비용 구조에 위험 신호가 있습니다. 아래 진단을 확인하세요." : "Cost structure alert. Review diagnostics below."}
                        </span>
                      </div>
                    )}

                    {/* 헤더 */}
                    <div style={{ padding: "20px 22px 16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                        {ko ? `${new Date().getMonth() + 1}월 손익` : `${new Date().toLocaleString("en", { month: "long" })} P&L`}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "3px", flexWrap: "wrap" as const }}>
                        {workingDays > 0 && (
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {ko ? `${workingDays}일 운영 기록` : `${workingDays} days recorded`}
                          </div>
                        )}
                        {projectedSales > 0 && (
                          <div style={{ fontSize: "12px", color: projectedProfit >= 0 ? "#34c759" : "#ff3b30", fontWeight: 600 }}>
                            {ko
                              ? `월말 예상 ${projectedProfit >= 0 ? "+" : ""}${fmt(projectedProfit)}`
                              : `Projected month-end ${projectedProfit >= 0 ? "+" : ""}${fmt(projectedProfit)}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3-col 핵심 지표 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "0.5px solid rgba(0,0,0,0.08)", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      {[
                        { label: ko ? "총 매출" : "Revenue", value: hasData ? fmt(totalSales) : "—", color: "inherit" as const, prefix: "" },
                        { label: ko ? "총 비용" : "Costs", value: hasCosts ? fmt(totalCosts) : "—", color: "inherit" as const, prefix: "" },
                        {
                          label: ko ? "순이익" : "Net profit",
                          value: hasData && hasCosts ? fmt(Math.abs(netProfit)) : "—",
                          color: (hasData && hasCosts ? (netProfit >= 0 ? "#34c759" : "#ff3b30") : "inherit") as string,
                          prefix: hasData && hasCosts ? (netProfit >= 0 ? "+" : "−") : "",
                        },
                      ].map((m, idx) => (
                        <div key={m.label} style={{ padding: "18px 14px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "8px" }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.5px", color: m.color, lineHeight: 1.1 }}>
                            {m.prefix}{m.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* BEP + 비율 그리드 */}
                    {hasData && hasCosts && (
                      <div style={{ padding: "16px 22px 4px", display: "flex", flexDirection: "column" as const, gap: "14px" }}>
                        {/* 손익분기점 바 */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.03em" }}>
                              {ko ? "손익분기점 달성률" : "Break-even progress"}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: bepProgress >= 100 ? "#34c759" : "#007aff" }}>
                              {bepProgress.toFixed(0)}%{bepProgress >= 100 ? (ko ? " · 달성 ✓" : " · Hit ✓") : ""}
                            </span>
                          </div>
                          <div style={{ height: "5px", borderRadius: "3px", background: "rgba(0,0,0,0.07)", overflow: "hidden" as const }}>
                            <div style={{ height: "100%", borderRadius: "3px", width: `${Math.min(100, bepProgress)}%`, background: bepProgress >= 100 ? "#34c759" : "#007aff", transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                        {/* 비율 2×2 그리드 */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          {[
                            { label: ko ? "원가율" : "Food cost", value: ingredientRatio, good: 35, caution: 40 },
                            { label: ko ? "인건비율" : "Labor", value: laborRatio, good: 30, caution: 35 },
                            { label: ko ? "임대료율" : "Rent", value: rentRatio, good: 10, caution: 15 },
                            { label: "Prime Cost", value: primeCost, good: 60, caution: 65 },
                          ].map(row => {
                            const h = health(row.value, row.good, row.caution);
                            return (
                              <div key={row.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                  <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.03em" }}>{row.label}</span>
                                  <span style={{ fontSize: "11px", fontWeight: 700, color: healthColor(h) }}>{pct(row.value)}</span>
                                </div>
                                <div style={{ height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.07)", overflow: "hidden" as const }}>
                                  <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(100, (row.value / (row.caution * 1.5)) * 100)}%`, background: healthColor(h), transition: "width 0.4s" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 진단 메시지 */}
                    {diagnostics.length > 0 && hasData && (
                      <div style={{ padding: "12px 22px 18px", display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                        {diagnostics.map((msg, i) => {
                          const isWarn = msg.includes("위험") || msg.includes("적자") || msg.includes("Danger") || msg.includes("loss");
                          return (
                            <div key={i} style={{
                              display: "flex", gap: "8px", padding: "10px 12px", borderRadius: "10px",
                              background: isWarn ? "rgba(255,59,48,0.05)" : "rgba(52,199,89,0.05)",
                              border: `0.5px solid ${isWarn ? "rgba(255,59,48,0.15)" : "rgba(52,199,89,0.15)"}`,
                              fontSize: "12px", lineHeight: 1.5, color: "rgba(0,0,0,0.72)",
                            }}>
                              {isWarn
                                ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M7 1.5L12.5 12H1.5L7 1.5Z" stroke="#ff3b30" strokeWidth="1.4" strokeLinejoin="round" fill="none"/><line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10.5" r="0.65" fill="#ff3b30"/></svg>
                                : <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }}><polyline points="2,7 5,10 11,3" stroke="#34c759" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                              }
                              {msg}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 빈 상태 */}
                    {!hasData && (
                      <div style={{ padding: "16px 22px 20px" }}>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                          {ko ? "아래에서 오늘 매출과 비용을 입력하면 손익이 실시간 계산됩니다." : "Enter today's sales and costs below to see your P&L in real time."}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })()}

              {/* ── 재고/소모품 현황 — separate(food,cafe) + service(beauty,living) + minimal(fitness,edu,space) ── */}
              {businessCtx.showInventoryCard && (() => {
                const ko = language === "ko";
                const todayStr = new Date().toISOString().slice(0, 10);
                const currentMonth = todayStr.slice(0, 7);
                const UNITS = ["개", "kg", "g", "L", "ml", "봉지", "박스", "병", "캔"];
                const invStep = (unit: string) => ["kg", "L", "l"].includes(unit) ? 0.5 : 1;

                // ── 핵심 계산 함수 ──
                const daysLeft = (item: InventoryItem): number | null =>
                  item.dailyUsage > 0 ? Math.floor(item.quantity / item.dailyUsage) : null;

                const expiryLeft = (item: InventoryItem): number | null => {
                  if (!item.expiryDate) return null;
                  return Math.ceil(
                    (new Date(item.expiryDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000
                  );
                };

                const needsOrderToday = (item: InventoryItem): boolean => {
                  const d = daysLeft(item);
                  return d !== null && d <= (item.leadTimeDays || 1);
                };

                const itemStatus = (item: InventoryItem): "urgent" | "warning" | "good" => {
                  if (item.quantity === 0) return "urgent";
                  if (needsOrderToday(item)) return "urgent";
                  const exp = expiryLeft(item);
                  if (exp !== null && exp <= 2) return "urgent";
                  if (item.minThreshold > 0 && item.quantity <= item.minThreshold) return "warning";
                  if (exp !== null && exp <= 5) return "warning";
                  return "good";
                };

                const CAT: Record<string, { ko: string; en: string; color: string }> = {
                  fresh:    { ko: "신선", en: "Fresh",    color: "#34c759" },
                  dry:      { ko: "건식", en: "Dry",      color: "#ff9f0a" },
                  frozen:   { ko: "냉동", en: "Frozen",   color: "#007aff" },
                  beverage: { ko: "음료", en: "Beverage", color: "#30b0c7" },
                  supply:   { ko: "소모품", en: "Supply", color: "#af52de" },
                  other:    { ko: "기타", en: "Other",    color: "#8e8e93" },
                };
                const SC = { urgent: "#ff3b30", warning: "#ff9f0a", good: "#34c759" } as const;
                const SL = {
                  urgent: { ko: "긴급", en: "Urgent" },
                  warning: { ko: "주의", en: "Low" },
                  good:   { ko: "충분", en: "OK" },
                } as const;

                // ── 필터 & 정렬 ──
                const SORT = { urgent: 0, warning: 1, good: 2 } as const;
                const filtered = invCategoryFilter === "all"
                  ? inventory
                  : inventory.filter(i => (i.category ?? "other") === invCategoryFilter);
                const sorted = [...filtered].sort((a, b) => SORT[itemStatus(a)] - SORT[itemStatus(b)]);

                // ── 통계 ──
                const urgentList  = inventory.filter(i => itemStatus(i) === "urgent");
                const orderCount  = inventory.filter(needsOrderToday).length;
                const totalValue  = inventory.reduce((s, i) => s + i.quantity * (i.unitCost || 0), 0);
                const wasteCost   = inventory.reduce((s, i) => {
                  const w = (i.wasteLog ?? []).filter(e => e.date.startsWith(currentMonth)).reduce((a, e) => a + e.qty, 0);
                  return s + w * (i.unitCost || 0);
                }, 0);

                const fmtV = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;
                const catCounts = Object.fromEntries(
                  Object.keys(CAT).map(c => [c, inventory.filter(i => (i.category ?? "other") === c).length])
                );

                // ── 공통 스타일 ──
                const inputSt: React.CSSProperties = {
                  border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px",
                  padding: "10px 13px", fontSize: "14px", outline: "none",
                  background: "#fff", width: "100%", boxSizing: "border-box" as const,
                };
                const secLbl: React.CSSProperties = {
                  fontSize: "11px", fontWeight: 700, color: "var(--muted)",
                  textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "8px",
                };

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>

                    {/* ── 헤더 ── */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                          {businessCtx.inventoryLabel[language]}
                        </div>
                        {inventory.length > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                            {ko ? `${inventory.length}개 품목 관리 중` : `${inventory.length} items tracked`}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button type="button"
                          onClick={() => setInvForm({ ...emptyInvForm, open: true })}
                          style={{ fontSize: "12px", fontWeight: 600, color: "#007aff", background: "rgba(0,122,255,0.08)", border: "none", borderRadius: "9px", padding: "6px 13px", cursor: "pointer" }}>
                          {ko ? "+ 직접 추가" : "+ Add"}
                        </button>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#34c759", cursor: "pointer", padding: "6px 13px", background: "rgba(52,199,89,0.08)", borderRadius: "9px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v12M2 8h12" /></svg>
                          {ko ? "엑셀" : "Excel"}
                          <input type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" aria-label={ko ? "재고 엑셀 파일 업로드" : "Upload inventory Excel file"} style={{ display: "none" }} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            e.target.value = "";
                            try {
                              let text = "";
                              const ext = file.name.split(".").pop()?.toLowerCase();
                              if (ext === "csv" || ext === "tsv" || ext === "txt") {
                                text = await file.text();
                              } else if (ext === "xlsx" || ext === "xls") {
                                const XLSX = await import("xlsx");
                                const buffer = await file.arrayBuffer();
                                const workbook = XLSX.read(buffer, { type: "array" });
                                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                                text = XLSX.utils.sheet_to_csv(firstSheet);
                              } else {
                                const buf = await file.arrayBuffer();
                                const bytes = new Uint8Array(buf);
                                try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
                                catch { text = new TextDecoder("euc-kr", { fatal: false }).decode(bytes); }
                                if (text.includes("\0") || text.length < 10) {
                                  alert(ko ? "지원하지 않는 파일 형식입니다." : "Unsupported file format.");
                                  return;
                                }
                              }
                              if (!text.trim()) return;
                              const { data: { session } } = await supabase.auth.getSession();
                              const res = await fetch("/api/ai/products/parse", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
                                body: JSON.stringify({ text: text.slice(0, 50000), language }),
                              });
                              const payload = await res.json();
                              if (!res.ok || payload.error) { alert(payload.error ?? "Parse failed"); return; }
                              const parsed = payload.products as { name: string; category: string; price: number; cost: number; stock: number; unit: string }[];
                              if (!parsed?.length) { alert(ko ? "데이터를 찾을 수 없습니다." : "No data found."); return; }
                              const newItems: InventoryItem[] = parsed.map((p) => ({
                                id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                name: p.name, quantity: p.stock, unit: p.unit || "개",
                                minThreshold: 0, unitCost: p.cost,
                                category: "other" as const,
                                itemType: "product" as const, sellingPrice: p.price ?? 0,
                                expiryDate: "", supplierName: "", supplierUrl: "",
                                leadTimeDays: 1, dailyUsage: 0, lastOrderedAt: "",
                                wasteLog: [],
                              }));
                              saveInventory([...inventory, ...newItems]);
                              alert(ko ? `${newItems.length}개 품목 등록 완료` : `${newItems.length} items added`);
                            } catch (err) { alert(ko ? `파일 처리 오류: ${err instanceof Error ? err.message : err}` : `File error: ${err}`); }
                          }} />
                        </label>
                      </div>
                    </div>

                    {/* ── 발주 알림 배너 ── */}
                    {urgentList.length > 0 && (
                      <div style={{ padding: "12px 22px", background: "rgba(255,59,48,0.04)", borderBottom: "0.5px solid rgba(255,59,48,0.10)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#ff3b30", marginBottom: "2px" }}>
                          {ko ? `지금 주문하세요 — ${urgentList.map(i => i.name).join(", ")}` : `Order now — ${urgentList.map(i => i.name).join(", ")}`}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(200,40,30,0.8)", lineHeight: 1.4 }}>
                          {ko ? "리드타임 기준, 오늘 발주해야 재고 소진을 막을 수 있습니다." : "Based on lead times, order today to prevent stockouts."}
                        </div>
                      </div>
                    )}

                    {/* ── 3-col 요약 지표 ── */}
                    {inventory.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
                        {[
                          { label: ko ? "총 재고 가치" : "Stock value",      value: totalValue > 0 ? fmtV(totalValue) : "—",                               color: "inherit" as const },
                          { label: ko ? "이달 폐기 비용" : "Waste this month", value: wasteCost > 0 ? fmtV(wasteCost) : "—",                                color: wasteCost > 0 ? "#ff9f0a" : "inherit" as const },
                          { label: ko ? "주문 필요" : "To order",             value: orderCount > 0 ? `${orderCount}${ko ? "건" : ""}` : ko ? "없음" : "—", color: orderCount > 0 ? "#ff3b30" : "#34c759" as const },
                        ].map((m, idx) => (
                          <div key={m.label} style={{ padding: "12px 14px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "5px" }}>{m.label}</div>
                            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.4px", color: m.color }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── 카테고리 필터 ── */}
                    {inventory.length > 1 && (
                      <div style={{ display: "flex", gap: "6px", padding: "11px 22px", overflowX: "auto" as const, borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
                        {[
                          { id: "all", label: ko ? "전체" : "All", count: inventory.length },
                          ...Object.entries(CAT).filter(([c]) => catCounts[c] > 0).map(([c, v]) => ({
                            id: c, label: ko ? v.ko : v.en, count: catCounts[c],
                          })),
                        ].map(tab => (
                          <button key={tab.id} type="button" onClick={() => setInvCategoryFilter(tab.id)}
                            style={{
                              flexShrink: 0, fontSize: "11px", fontWeight: 600, border: "none",
                              borderRadius: "8px", padding: "5px 11px", cursor: "pointer", transition: "background 0.15s, color 0.15s",
                              background: invCategoryFilter === tab.id ? "#007aff" : "rgba(0,0,0,0.05)",
                              color: invCategoryFilter === tab.id ? "#fff" : "var(--muted)",
                            }}>
                            {tab.label} {tab.count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ── 빈 상태 ── */}
                    {inventory.length === 0 && !invForm.open && (
                      <div style={{ padding: "24px 22px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.3px", marginBottom: "7px" }}>
                          {ko ? "재고 관리로 폐업 위험을 줄이세요" : "Track inventory to reduce failure risk"}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
                          {ko
                            ? "단가와 1일 사용량을 입력하면 소진 예정일과 발주 시점을 자동 계산합니다. 유통기한 알림으로 신선재료 폐기 손실도 방지할 수 있습니다."
                            : "Enter unit cost and daily usage to auto-predict depletion dates and reorder timing. Expiry alerts prevent fresh ingredient waste."}
                        </div>
                      </div>
                    )}

                    {/* ── 재고 목록 (기본 5개, 전체 보기 토글) ── */}
                    {(invShowAll ? sorted : sorted.slice(0, 5)).map((item, idx) => {
                      const s   = itemStatus(item);
                      const sc  = SC[s];
                      const d   = daysLeft(item);
                      const exp = expiryLeft(item);
                      const st  = invStep(item.unit);
                      const cat = CAT[item.category ?? "other"];
                      const val = item.quantity * (item.unitCost || 0);
                      const lastOrderAge = item.lastOrderedAt
                        ? Math.round((Date.now() - new Date(item.lastOrderedAt).getTime()) / 86400000)
                        : null;
                      const isWasting = invWasteTarget === item.id;
                      const isLast = idx === sorted.length - 1;

                      return (
                        <div key={item.id} style={{
                          padding: "16px 22px",
                          borderBottom: (!isLast || invForm.open) ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                          background: s === "urgent" ? "rgba(255,59,48,0.018)" : s === "warning" ? "rgba(255,159,10,0.012)" : "transparent",
                        }}>

                          {/* 이름 · 카테고리 · 상태 */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                {item.name}
                              </span>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: cat.color, background: `${cat.color}18`, borderRadius: "5px", padding: "2px 7px", flexShrink: 0 }}>
                                {ko ? cat.ko : cat.en}
                              </span>
                            </div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: sc, background: `${sc}18`, borderRadius: "6px", padding: "3px 8px", letterSpacing: "0.05em", flexShrink: 0, marginLeft: "8px" }}>
                              {SL[s][ko ? "ko" : "en"]}
                            </div>
                          </div>

                          {/* 핵심 인사이트 줄 */}
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "12px", alignItems: "center" }}>
                            {d !== null ? (
                              <span style={{ fontSize: "12px", fontWeight: 600, color: d <= (item.leadTimeDays || 1) ? "#ff3b30" : d <= 7 ? "#ff9f0a" : "var(--muted)" }}>
                                {d === 0 ? (ko ? "오늘 소진" : "Depletes today") : d === 1 ? (ko ? "내일 소진" : "Depletes tomorrow") : (ko ? `D-${d} 소진 예정` : `${d}d left`)}
                              </span>
                            ) : (
                              <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.22)", fontStyle: "italic" }}>
                                {ko ? "사용량 미입력" : "No usage rate"}
                              </span>
                            )}
                            {exp !== null && (
                              <span style={{ fontSize: "12px", fontWeight: exp <= 2 ? 700 : 500, color: exp <= 0 ? "#ff3b30" : exp <= 2 ? "#ff3b30" : exp <= 5 ? "#ff9f0a" : "var(--muted)" }}>
                                {exp <= 0 ? (ko ? "유통기한 만료" : "Expired") : (ko ? `유통기한 D+${exp}` : `Exp D+${exp}`)}
                              </span>
                            )}
                            {val > 0 && (
                              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{fmtV(val)}</span>
                            )}
                            {lastOrderAge !== null && (
                              <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.22)" }}>
                                {ko ? `발주 ${lastOrderAge}일 전` : `Ordered ${lastOrderAge}d ago`}
                              </span>
                            )}
                          </div>

                          {/* 수량 스테퍼 + 액션 버튼 */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                            {/* +/− 스테퍼 */}
                            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0,0,0,0.11)", borderRadius: "10px", overflow: "hidden" }}>
                              <button type="button" onClick={() => handleInvQty(item.id, -st)} disabled={item.quantity <= 0}
                                aria-label={ko ? `${item.name} 수량 감소` : `Decrease ${item.name} quantity`}
                                style={{ width: "36px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: item.quantity > 0 ? "pointer" : "default", fontSize: "20px", color: item.quantity > 0 ? "var(--primary)" : "rgba(0,0,0,0.18)", fontWeight: 300, lineHeight: 1 }}>
                                −
                              </button>
                              <div style={{ minWidth: "64px", textAlign: "center" as const, fontSize: "13px", fontWeight: 600, padding: "0 6px", borderLeft: "0.5px solid rgba(0,0,0,0.09)", borderRight: "0.5px solid rgba(0,0,0,0.09)" }} aria-live="polite">
                                {item.quantity}{item.unit}
                              </div>
                              <button type="button" onClick={() => handleInvQty(item.id, st)}
                                aria-label={ko ? `${item.name} 수량 증가` : `Increase ${item.name} quantity`}
                                style={{ width: "36px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--primary)", fontWeight: 300, lineHeight: 1 }}>
                                +
                              </button>
                            </div>

                            {/* 주문하기 (긴급·주의) */}
                            {(s === "urgent" || s === "warning") && (
                              item.supplierUrl ? (
                                <a href={item.supplierUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: "12px", fontWeight: 700, color: "#fff", background: "#007aff", textDecoration: "none", borderRadius: "9px", padding: "7px 14px" }}>
                                  {ko ? "주문하기 ›" : "Order ›"}
                                </a>
                              ) : (
                                <span style={{ fontSize: "11px", color: "#ff9f0a", background: "rgba(255,159,10,0.09)", borderRadius: "8px", padding: "6px 11px", fontWeight: 600 }}>
                                  {item.supplierName ? item.supplierName : (ko ? "공급업체 미등록" : "No supplier")}
                                </span>
                              )
                            )}

                            {/* 주문 완료 표시 (긴급·주의) */}
                            {(s === "urgent" || s === "warning") && (
                              <button type="button" onClick={() => handleMarkOrdered(item.id)}
                                style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "8px", padding: "6px 11px", cursor: "pointer" }}>
                                {ko ? "주문 완료" : "Ordered"}
                              </button>
                            )}

                            {/* 폐기 기록 */}
                            <button type="button"
                              onClick={() => { setInvWasteTarget(isWasting ? null : item.id); setInvWasteQty(""); setInvWasteReason(""); }}
                              style={{ fontSize: "11px", fontWeight: 500, color: isWasting ? "#ff3b30" : "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                              {ko ? "폐기 기록" : "Log waste"}
                            </button>

                            {/* 수정·삭제 */}
                            <div style={{ marginLeft: "auto", display: "flex" }}>
                              <button type="button" onClick={() => openInvEdit(item)}
                                style={{ fontSize: "11px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 9px", fontWeight: 500 }}>
                                {ko ? "수정" : "Edit"}
                              </button>
                              <button type="button" onClick={() => handleInvDelete(item.id)}
                                style={{ fontSize: "11px", color: "#ff3b30", background: "none", border: "none", cursor: "pointer", padding: "4px 9px", fontWeight: 500 }}>
                                {ko ? "삭제" : "Del"}
                              </button>
                            </div>
                          </div>

                          {/* 폐기 기록 인라인 폼 */}
                          {isWasting && (
                            <div style={{ marginTop: "12px", padding: "13px 15px", background: "rgba(255,59,48,0.04)", borderRadius: "12px", border: "0.5px solid rgba(255,59,48,0.13)", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "#ff3b30", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                                {ko ? "폐기 기록" : "Waste log"}
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <input type="text" inputMode="decimal" placeholder={ko ? `수량 (${item.unit})` : `Qty (${item.unit})`}
                                  value={invWasteQty} onChange={e => setInvWasteQty(e.target.value.replace(/[^0-9.]/g, ""))}
                                  aria-label={ko ? "폐기 수량" : "Waste quantity"}
                                  style={{ ...inputSt, flex: 1, fontSize: "13px", padding: "8px 11px" }} />
                                <select value={invWasteReason} onChange={e => setInvWasteReason(e.target.value)}
                                  aria-label={ko ? "폐기 사유" : "Waste reason"}
                                  style={{ ...inputSt, flex: 1, fontSize: "13px", padding: "8px 11px", cursor: "pointer" }}>
                                  <option value="">{ko ? "사유 선택" : "Reason"}</option>
                                  <option value="expiry">{ko ? "유통기한 만료" : "Expired"}</option>
                                  <option value="quality">{ko ? "품질 불량" : "Quality issue"}</option>
                                  <option value="overstock">{ko ? "과주문" : "Over-ordered"}</option>
                                  <option value="other">{ko ? "기타" : "Other"}</option>
                                </select>
                              </div>
                              <div style={{ display: "flex", gap: "7px" }}>
                                <button type="button" disabled={!invWasteQty} onClick={() => handleInvWaste(item.id)}
                                  style={{ flex: 1, background: invWasteQty ? "#ff3b30" : "rgba(0,0,0,0.08)", color: invWasteQty ? "#fff" : "var(--muted)", border: "none", borderRadius: "9px", padding: "8px 0", fontSize: "12px", fontWeight: 700, cursor: invWasteQty ? "pointer" : "default" }}>
                                  {ko ? "기록" : "Record"}
                                </button>
                                <button type="button" onClick={() => setInvWasteTarget(null)}
                                  style={{ background: "rgba(0,0,0,0.06)", color: "var(--muted)", border: "none", borderRadius: "9px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                  {ko ? "취소" : "Cancel"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 전체 보기 / 접기 */}
                    {sorted.length > 5 && (
                      <button type="button" onClick={() => setInvShowAll(v => !v)} style={{
                        width: "100%", padding: "10px", border: "none", background: "none",
                        fontSize: "13px", fontWeight: 600, color: "#0561fc", cursor: "pointer",
                        borderTop: "0.5px solid rgba(0,0,0,0.06)",
                      }}>
                        {invShowAll ? (ko ? `접기 ↑` : `Collapse ↑`) : (ko ? `전체 ${sorted.length}개 보기 ↓` : `Show all ${sorted.length} ↓`)}
                      </button>
                    )}

                    {/* ── 품목 추가·수정 폼 ── */}
                    {invForm.open && (
                      <div style={{ padding: "22px 22px", borderTop: "0.5px solid rgba(0,0,0,0.09)", background: "rgba(0,0,0,0.018)", display: "flex", flexDirection: "column" as const, gap: "18px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                          {invForm.editId ? (ko ? "품목 수정" : "Edit item") : (ko ? "새 품목 추가" : "New item")}
                        </div>

                        {/* 기본 정보 */}
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                          <div style={secLbl}>{ko ? "기본 정보" : "Basic info"}</div>
                          <input type="text" placeholder={ko ? "품목명 (예: 닭가슴살)" : "Item name"}
                            aria-label={ko ? "품목명" : "Item name"}
                            value={invForm.name} onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))} style={inputSt} />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <select value={invForm.category} onChange={e => setInvForm(f => ({ ...f, category: e.target.value as InvForm["category"] }))}
                              aria-label={ko ? "카테고리" : "Category"}
                              style={{ ...inputSt, flex: 1, cursor: "pointer" }}>
                              {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{ko ? v.ko : v.en}</option>)}
                            </select>
                            <select value={invForm.unit} onChange={e => setInvForm(f => ({ ...f, unit: e.target.value }))}
                              aria-label={ko ? "단위" : "Unit"}
                              style={{ ...inputSt, width: "76px", flex: "none", cursor: "pointer" }}>
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* 수량 & 사용량 */}
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                          <div style={secLbl}>{ko ? "수량 & 사용량" : "Quantity & usage"}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {[
                              { label: ko ? "현재 수량" : "Current qty", key: "qty" as const, ph: "0" },
                              { label: ko ? `1일 사용량 (${invForm.unit})` : `Daily usage (${invForm.unit})`, key: "dailyUsage" as const, ph: "e.g. 2.5" },
                              { label: ko ? `재주문 기준량 (${invForm.unit})` : `Reorder at (${invForm.unit})`, key: "threshold" as const, ph: "e.g. 5" },
                              { label: ko ? "단가 (원)" : "Unit cost (₩)", key: "unitCost" as const, ph: "e.g. 8500" },
                            ].map(f => (
                              <div key={f.key}>
                                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "5px" }}>{f.label}</div>
                                <input type="text" inputMode="decimal" placeholder={f.ph}
                                  value={invForm[f.key]} onChange={e => setInvForm(p => ({ ...p, [f.key]: e.target.value.replace(/[^0-9.]/g, "") }))} style={inputSt} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 유통기한 (신선·냉동만) */}
                        {(invForm.category === "fresh" || invForm.category === "frozen") && (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                            <div style={secLbl}>{ko ? "유통기한" : "Expiry date"}</div>
                            <input type="date" value={invForm.expiryDate} onChange={e => setInvForm(f => ({ ...f, expiryDate: e.target.value }))} aria-label={ko ? "유통기한" : "Expiry date"} style={inputSt} />
                          </div>
                        )}

                        {/* 공급업체 */}
                        {(() => {
                          // 프랜차이즈 본사 공급업체 추출
                          const franchiseSuppliers: { name: string; type: string; color: string }[] = [];
                          if (startupType === "franchise" && selectedFranchiseBrandId) {
                            const fb = getFranchiseBrandById(selectedFranchiseBrandId);
                            if (fb) {
                              const supplyInfo = getFranchiseSupplyInfo(fb);
                              supplyInfo.forEach(s => {
                                const typeName = s.type === "hq-exclusive" ? (language === "ko" ? "본사 독점" : "HQ Only")
                                  : s.type === "hq-designated" ? (language === "ko" ? "본사 지정" : "HQ Designated")
                                  : "";
                                if (typeName) {
                                  franchiseSuppliers.push({
                                    name: `${fb!.name[language]} ${s.category[language]}`,
                                    type: typeName,
                                    color: getSupplyTypeColor(s.type)
                                  });
                                }
                              });
                            }
                          }

                          // 로드맵 vendor-setup 단계에서 저장한 공급업체 목록 추출
                          const savedSuppliers = Object.entries(vendorSelections)
                            .filter(([, v]) => v !== "")
                            .map(([k, v]) => {
                              const name = v.startsWith("__etc__") ? (vendorCustomInputs[k] ?? "").trim() : v;
                              return { name, url: VENDOR_URL_MAP[name] ?? "" };
                            })
                            .filter(({ name }) => name !== "")
                            .filter((s, i, arr) => arr.findIndex(x => x.name === s.name) === i);
                          return (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                          <div style={secLbl}>{ko ? "공급업체" : "Supplier"}</div>

                          {/* 프랜차이즈 본사 공급업체 */}
                          {franchiseSuppliers.length > 0 && (
                            <div>
                              <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.38)", marginBottom: "6px", fontWeight: 500 }}>
                                {ko ? "프랜차이즈 본사 공급" : "Franchise HQ supply"}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                                {franchiseSuppliers.map(s => {
                                  const isSelected = invForm.supplierName === s.name;
                                  return (
                                    <button
                                      key={s.name}
                                      type="button"
                                      onClick={() => setInvForm(f => ({
                                        ...f,
                                        supplierName: isSelected ? "" : s.name,
                                      }))}
                                      style={{
                                        fontSize: "11px", fontWeight: 600, padding: "4px 10px",
                                        borderRadius: "999px", cursor: "pointer",
                                        border: isSelected ? `1.5px solid ${s.color}` : `1px solid ${s.color}30`,
                                        background: isSelected ? `${s.color}15` : `${s.color}06`,
                                        color: s.color,
                                        transition: "all 0.15s",
                                        display: "inline-flex", alignItems: "center", gap: "4px"
                                      }}
                                    >
                                      <span style={{ fontSize: "9px", opacity: 0.7 }}>{s.type}</span>
                                      {s.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {savedSuppliers.length > 0 && (
                            <div>
                              <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.38)", marginBottom: "6px", fontWeight: 500 }}>
                                {ko ? "로드맵에서 저장한 공급업체" : "From your roadmap"}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                                {savedSuppliers.map(s => {
                                  const isSelected = invForm.supplierName === s.name;
                                  return (
                                    <button
                                      key={s.name}
                                      type="button"
                                      onClick={() => setInvForm(f => ({
                                        ...f,
                                        supplierName: isSelected ? "" : s.name,
                                        url: isSelected ? f.url : (s.url || f.url),
                                      }))}
                                      style={{
                                        fontSize: "12px", fontWeight: 600, padding: "5px 11px",
                                        borderRadius: "999px", cursor: "pointer",
                                        border: isSelected ? "none" : "1px solid rgba(0,0,0,0.12)",
                                        background: isSelected ? "#007aff" : "rgba(0,0,0,0.04)",
                                        color: isSelected ? "#fff" : "var(--primary)",
                                        transition: "all 0.15s",
                                      }}
                                    >
                                      {s.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <input type="text" placeholder={savedSuppliers.length > 0 ? (ko ? "또는 직접 입력" : "Or enter manually") : (ko ? "공급업체명 (예: 한국식자재)" : "Supplier name")}
                            aria-label={ko ? "공급업체명" : "Supplier name"}
                            value={invForm.supplierName} onChange={e => setInvForm(f => ({ ...f, supplierName: e.target.value }))} style={inputSt} />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "end" }}>
                            <input type="text" placeholder={ko ? "주문 URL (주문하기 버튼에 연결)" : "Order URL (linked to Order button)"}
                              aria-label={ko ? "주문 URL" : "Order URL"}
                              value={invForm.url} onChange={e => setInvForm(f => ({ ...f, url: e.target.value }))} style={inputSt} />
                            <div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "5px", whiteSpace: "nowrap" as const }}>{ko ? "리드타임 (일)" : "Lead time (d)"}</div>
                              <input type="text" inputMode="numeric" placeholder="1"
                                aria-label={ko ? "리드타임 (일)" : "Lead time (days)"}
                                value={invForm.leadTimeDays} onChange={e => setInvForm(f => ({ ...f, leadTimeDays: e.target.value.replace(/[^0-9]/g, "") }))}
                                style={{ ...inputSt, width: "64px" }} />
                            </div>
                          </div>
                        </div>
                          );
                        })()}

                        {/* 소진 예측 미리보기 */}
                        {invForm.qty && invForm.dailyUsage && Number(invForm.dailyUsage) > 0 && (() => {
                          const days = Math.floor(Number(invForm.qty) / Number(invForm.dailyUsage));
                          const lead = Number(invForm.leadTimeDays) || 1;
                          const warn = days <= lead;
                          return (
                            <div style={{ padding: "11px 14px", borderRadius: "11px", background: warn ? "rgba(255,59,48,0.05)" : "rgba(52,199,89,0.05)", border: `0.5px solid ${warn ? "rgba(255,59,48,0.15)" : "rgba(52,199,89,0.15)"}` }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: warn ? "#ff3b30" : "#34c759" }}>
                                {warn
                                  ? (ko ? `현재 수량으로 ${days}일치 — 리드타임(${lead}일) 고려 시 오늘 주문 필요` : `${days}d of stock — must order today (${lead}d lead time)`)
                                  : (ko ? `현재 수량으로 ${days}일치 — 당장 주문 불필요` : `${days} days of stock — no immediate order needed`)}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 저장·취소 */}
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button type="button" style={{ ...styles.primaryButton, flex: 1, opacity: invForm.name.trim() ? 1 : 0.45 }}
                            onClick={handleInvSave} disabled={!invForm.name.trim()}>
                            {ko ? "저장" : "Save"}
                          </button>
                          <button type="button" style={styles.button}
                            onClick={() => setInvForm(f => ({ ...f, open: false, editId: null }))}>
                            {ko ? "취소" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })()}
              {/* ── 직원 인건비 계산기 ── */}
              {(() => {
                const ko = language === "ko";
                // 인건비 계산 함수
                const calcEmployee = (emp: Employee) => {
                  const weeklyAllowance = emp.weeklyHours >= 15
                    ? (emp.weeklyHours / 5) * emp.hourlyWage
                    : 0;
                  const monthlyWage = Math.round((emp.hourlyWage * emp.weeklyHours + weeklyAllowance) * 4.345);
                  const insurance = emp.isInsured ? Math.round(monthlyWage * 0.1041) : 0;
                  return { monthlyWage, insurance, total: monthlyWage + insurance };
                };
                const totalEmpBurden = employees.reduce((s, e) => s + calcEmployee(e).total, 0);
                const manualLabor = (monthlyCosts as { labor: number }).labor;
                const laborDiff = totalEmpBurden - manualLabor;
                const fmt = (n: number) => n >= 10000
                  ? `${Math.round(n / 10000).toLocaleString()}만원`
                  : `${Math.round(n).toLocaleString()}원`;

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 */}
                    <div style={{ padding: "18px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                          {ko ? "직원 인건비" : "Staff Labor Cost"}
                        </div>
                        {employees.length > 0 && (
                          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                            {ko ? `${employees.length}명 · 월 총부담 ${fmt(totalEmpBurden)}` : `${employees.length} staff · Est. ${fmt(totalEmpBurden)}/mo`}
                          </div>
                        )}
                      </div>
                      <button type="button"
                        onClick={() => { setEmpFormOpen(true); setEmpEditId(null); setEmpName(""); setEmpWage(""); setEmpHours(""); setEmpInsured(false); }}
                        style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                        {ko ? "+ 직원 추가" : "+ Add staff"}
                      </button>
                    </div>

                    {/* monthlyCosts.labor 비교 알림 */}
                    {employees.length > 0 && manualLabor > 0 && Math.abs(laborDiff) > 10000 && (
                      <div style={{ margin: "0 22px 12px", padding: "10px 14px", borderRadius: "12px", background: laborDiff > 0 ? "rgba(255,159,10,0.07)" : "rgba(0,122,255,0.06)", border: `0.5px solid ${laborDiff > 0 ? "rgba(255,159,10,0.2)" : "rgba(0,122,255,0.15)"}` }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: laborDiff > 0 ? "#ff9f0a" : "#007aff", lineHeight: 1.5 }}>
                          {ko
                            ? laborDiff > 0
                              ? `비용 카드 인건비(${fmt(manualLabor)})가 실제 예상(${fmt(totalEmpBurden)})보다 ${fmt(laborDiff)} 낮게 입력됨`
                              : `비용 카드 인건비(${fmt(manualLabor)})가 실제 예상(${fmt(totalEmpBurden)})보다 ${fmt(-laborDiff)} 높게 입력됨`
                            : laborDiff > 0
                              ? `Cost card labor (${fmt(manualLabor)}) is ${fmt(laborDiff)} lower than estimated`
                              : `Cost card labor (${fmt(manualLabor)}) is ${fmt(-laborDiff)} higher than estimated`}
                        </div>
                      </div>
                    )}

                    {/* 직원 목록 */}
                    {employees.length === 0 ? (
                      <div style={{ padding: "16px 22px 22px" }}>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                          {ko ? "직원을 등록하면 월 인건비와 4대보험 사업주 부담을 자동 계산합니다." : "Register staff to auto-calculate monthly wages and employer insurance costs."}
                        </div>
                      </div>
                    ) : (
                      <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
                        {employees.map((emp, idx) => {
                          const c = calcEmployee(emp);
                          const hasAllowance = emp.weeklyHours >= 15;
                          return (
                            <div key={emp.id} style={{ padding: "14px 22px", borderBottom: idx < employees.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
                              {/* 이름 행 */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,122,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#007aff" }}>
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)" }}>{emp.name}</div>
                                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                                      {ko
                                        ? `시급 ${emp.hourlyWage.toLocaleString()}원 · 주 ${emp.weeklyHours}시간${hasAllowance ? " · 주휴수당 포함" : ""}`
                                        : `₩${emp.hourlyWage.toLocaleString()}/hr · ${emp.weeklyHours}h/wk${hasAllowance ? " · incl. weekly holiday" : ""}`}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button type="button" onClick={() => openEmpEdit(emp)} style={{ fontSize: "12px", color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                                    {ko ? "수정" : "Edit"}
                                  </button>
                                  <button type="button" onClick={() => handleEmpDelete(emp.id)} style={{ fontSize: "12px", color: "#ff3b30", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                                    {ko ? "삭제" : "Del"}
                                  </button>
                                </div>
                              </div>
                              {/* 비용 분해 행 */}
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                                {[
                                  { label: ko ? "월 급여" : "Monthly pay", value: fmt(c.monthlyWage), color: "var(--primary)" },
                                  ...(emp.isInsured ? [{ label: ko ? "4대보험" : "Insurance", value: fmt(c.insurance), color: "var(--muted)" }] : []),
                                  { label: ko ? "총부담" : "Total", value: fmt(c.total), color: "#007aff" },
                                ].map(item => (
                                  <div key={item.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: "8px", padding: "5px 10px" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "2px" }}>{item.label}</div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: item.color }}>{item.value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {/* 합계 행 */}
                        <div style={{ padding: "14px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.015)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                            {ko ? "월 총 인건비 부담" : "Total Monthly Burden"}
                          </div>
                          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.4px" }}>
                            {fmt(totalEmpBurden)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 추가/수정 폼 */}
                    {empFormOpen && (
                      <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,122,255,0.03)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#007aff", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                          {empEditId ? (ko ? "직원 수정" : "Edit Staff") : (ko ? "직원 추가" : "Add Staff")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                          <input type="text" placeholder={ko ? "이름 (예: 김민지)" : "Name"} value={empName} onChange={e => setEmpName(e.target.value)}
                            aria-label={ko ? "직원 이름" : "Employee name"}
                            style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "시급 (원)" : "Hourly wage (₩)"}</div>
                              <input type="text" inputMode="numeric" placeholder="10,030" value={empWage} onChange={e => setEmpWage(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "시급 (원)" : "Hourly wage (KRW)"}
                                style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "주간 근무시간" : "Hours/week"}</div>
                              <input type="text" inputMode="numeric" placeholder="20" value={empHours} onChange={e => setEmpHours(e.target.value.replace(/[^0-9.]/g, ""))}
                                aria-label={ko ? "주간 근무시간" : "Weekly work hours"}
                                style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                            </div>
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="checkbox" checked={empInsured} onChange={e => setEmpInsured(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                            <span style={{ fontSize: "13px", color: "var(--primary)" }}>
                              {ko ? "4대보험 가입 (월 60시간 이상 근무 시 필수)" : "4 major insurances (required if ≥60h/month)"}
                            </span>
                          </label>
                          {empWage && empHours && (
                            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(0,122,255,0.06)", border: "0.5px solid rgba(0,122,255,0.15)" }}>
                              {(() => {
                                const wage = parseInt(empWage, 10) || 0;
                                const hours = parseFloat(empHours) || 0;
                                const allowance = hours >= 15 ? (hours / 5) * wage : 0;
                                const monthly = Math.round((wage * hours + allowance) * 4.345);
                                const autoInsured = hours * 4.345 >= 60;
                                const ins = (empInsured || autoInsured) ? Math.round(monthly * 0.1041) : 0;
                                return (
                                  <div style={{ fontSize: "12px", color: "#007aff", lineHeight: 1.7 }}>
                                    <div>{ko ? `월 급여: ${(monthly / 10000).toFixed(1)}만원` : `Monthly wage: ${(monthly / 10000).toFixed(1)}만원`}</div>
                                    {ins > 0 && <div>{ko ? `4대보험(사업주): ${(ins / 10000).toFixed(1)}만원` : `Insurance: ${(ins / 10000).toFixed(1)}만원`}</div>}
                                    <div style={{ fontWeight: 700 }}>{ko ? `총부담: ${((monthly + ins) / 10000).toFixed(1)}만원` : `Total: ${((monthly + ins) / 10000).toFixed(1)}만원`}</div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button type="button" onClick={handleEmpSave}
                              style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#007aff", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                              {empEditId ? (ko ? "수정 완료" : "Save changes") : (ko ? "추가" : "Add")}
                            </button>
                            <button type="button" onClick={() => { setEmpFormOpen(false); setEmpEditId(null); }}
                              style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                              {ko ? "취소" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })()}

              {/* ── 배달/배송 플랫폼 수수료 분석 ── */}
              {(businessCtx.isDeliveryRelevant || businessCtx.isOnlineStore) && (() => {
                const ko = language === "ko";
                const fmt = (n: number) => n >= 10000
                  ? `${Math.round(n / 10000).toLocaleString()}만원`
                  : `${Math.round(n).toLocaleString()}원`;

                const platformData = deliveryPlatforms.map(p => {
                  const gross = (monthlyDeliverySales[p.id] ?? 0) * 10000;
                  const commission = Math.round(gross * (p.commissionRate / 100));
                  const adCost = p.adCostMonthly * 10000;
                  const net = gross - commission - adCost;
                  const realRate = gross > 0 ? ((gross - net) / gross) * 100 : 0;
                  return { ...p, gross, commission, adCost, net, realRate };
                });
                const totalGross = platformData.reduce((s, p) => s + p.gross, 0);
                const totalNet = platformData.reduce((s, p) => s + p.net, 0);
                const avgLoss = totalGross > 0 ? ((totalGross - totalNet) / totalGross) * 100 : 0;

                const PLATFORM_PRESETS = businessCtx.isDeliveryRelevant
                  ? [
                      { name: ko ? "배달의민족" : "Baemin", commissionRate: 6.8, adCostMonthly: 8 },
                      { name: ko ? "쿠팡이츠" : "Coupang Eats", commissionRate: 6.8, adCostMonthly: 0 },
                      { name: ko ? "요기요" : "Yogiyo", commissionRate: 6.8, adCostMonthly: 5 },
                      { name: ko ? "땡겨요" : "Ddangyo", commissionRate: 2.0, adCostMonthly: 0 },
                    ]
                  : [
                      { name: ko ? "CJ대한통운" : "CJ Logistics", commissionRate: 0, adCostMonthly: 0 },
                      { name: ko ? "한진택배" : "Hanjin", commissionRate: 0, adCostMonthly: 0 },
                      { name: ko ? "롯데택배" : "Lotte", commissionRate: 0, adCostMonthly: 0 },
                      { name: ko ? "우체국택배" : "Korea Post", commissionRate: 0, adCostMonthly: 0 },
                    ];

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 */}
                    <div style={{ padding: "18px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                          {businessCtx.isDeliveryRelevant
                            ? (ko ? "배달 플랫폼 수수료 분석" : "Delivery Platform Fees")
                            : (ko ? "배송 비용 분석" : "Shipping Cost Analysis")}
                        </div>
                        {platformData.length > 0 && totalGross > 0 && (
                          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                            {ko ? `실제 수수료 평균 ${avgLoss.toFixed(1)}% — 매출의 ${avgLoss.toFixed(1)}%가 플랫폼에 지급됨` : `Avg. ${avgLoss.toFixed(1)}% of revenue goes to platforms`}
                          </div>
                        )}
                      </div>
                      <button type="button"
                        onClick={() => { setDlvFormOpen(true); setDlvEditId(null); setDlvName(""); setDlvRate(""); setDlvAd(""); }}
                        style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                        {ko ? "+ 플랫폼 추가" : "+ Add platform"}
                      </button>
                    </div>

                    {/* 요약 3-col (데이터 있을 때) */}
                    {totalGross > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "0.5px solid rgba(0,0,0,0.08)", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                        {[
                          { label: ko ? "배달 총 매출" : "Gross", value: fmt(totalGross), color: "inherit" },
                          { label: ko ? "수수료+광고비" : "Fees+Ads", value: fmt(totalGross - totalNet), color: "#ff3b30" },
                          { label: ko ? "실 순매출" : "Net revenue", value: fmt(totalNet), color: totalNet > 0 ? "#34c759" : "#ff3b30" },
                        ].map((col, idx) => (
                          <div key={col.label} style={{ padding: "14px 12px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "6px" }}>{col.label}</div>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: col.color, letterSpacing: "-0.4px" }}>{col.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 플랫폼 없을 때 */}
                    {deliveryPlatforms.length === 0 ? (
                      <div style={{ padding: "16px 22px 20px" }}>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "12px" }}>
                          {ko ? "배달 플랫폼별 수수료와 광고비를 입력하면 실제 남는 순매출을 계산합니다." : "Enter commission rates and ad costs per platform to see actual net revenue."}
                        </div>
                        {/* 프리셋 빠른 추가 */}
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>
                          {ko ? "빠른 추가" : "Quick add"}
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                          {PLATFORM_PRESETS.map(preset => (
                            <button key={preset.name} type="button"
                              onClick={() => {
                                const entry: DeliveryPlatform = { id: `dlv-${Date.now()}-${preset.name}`, ...preset };
                                saveDeliveryPlatforms([...deliveryPlatforms, entry]);
                              }}
                              style={{ fontSize: "12px", fontWeight: 600, padding: "7px 14px", borderRadius: "20px", border: "1px solid rgba(0,0,0,0.12)", background: "transparent", color: "var(--primary)", cursor: "pointer" }}>
                              + {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {platformData.map((p, idx) => (
                          <div key={p.id} style={{ padding: "14px 22px", borderBottom: idx < platformData.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
                            {/* 플랫폼 이름 + 수수료 설정 */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--primary)", textAlign: "center" as const, lineHeight: 1.2 }}>
                                  {p.name.slice(0, 2)}
                                </div>
                                <div>
                                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)" }}>{p.name}</div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                                    {ko ? `수수료 ${p.commissionRate}% · 광고비 ${p.adCostMonthly}만원/월` : `${p.commissionRate}% commission · ₩${p.adCostMonthly}만 ads/mo`}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button type="button" onClick={() => openDlvEdit(p)} style={{ fontSize: "12px", color: "#007aff", background: "none", border: "none", cursor: "pointer" }}>{ko ? "수정" : "Edit"}</button>
                                <button type="button" onClick={() => handleDlvDelete(p.id)} style={{ fontSize: "12px", color: "#ff3b30", background: "none", border: "none", cursor: "pointer" }}>{ko ? "삭제" : "Del"}</button>
                              </div>
                            </div>
                            {/* 이번 달 매출 입력 + 결과 */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" as const }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "160px" }}>
                                <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" as const }}>{ko ? "이달 매출" : "Month sales"}</span>
                                <input
                                  type="text" inputMode="numeric"
                                  placeholder="0"
                                  aria-label={ko ? `${p.name} 이달 매출 (만원)` : `${p.name} monthly sales (10K KRW)`}
                                  value={monthlyDeliverySales[p.id] ? String(monthlyDeliverySales[p.id]) : ""}
                                  onChange={e => {
                                    const v = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                                    saveMonthlyDeliverySales({ ...monthlyDeliverySales, [p.id]: v });
                                  }}
                                  style={{ width: "80px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "8px", padding: "6px 10px", fontSize: "14px", outline: "none", textAlign: "right" as const }}
                                />
                                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "만원" : "만원"}</span>
                              </div>
                              {p.gross > 0 && (
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                                  {[
                                    { label: ko ? "수수료+광고" : "Fees", value: fmt(p.commission + p.adCost), color: "#ff3b30" },
                                    { label: ko ? "실순매출" : "Net", value: fmt(p.net), color: p.net > 0 ? "#34c759" : "#ff3b30" },
                                    { label: ko ? "실질수수료율" : "Real rate", value: `${p.realRate.toFixed(1)}%`, color: p.realRate > 25 ? "#ff3b30" : p.realRate > 15 ? "#ff9f0a" : "var(--muted)" },
                                  ].map(item => (
                                    <div key={item.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: "8px", padding: "4px 10px" }}>
                                      <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" as const }}>{item.label}</div>
                                      <div style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>{item.value}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* 프리셋 빠른 추가 (기존 있을 때) */}
                        {PLATFORM_PRESETS.filter(pr => !deliveryPlatforms.some(p => p.name === pr.name)).length > 0 && (
                          <div style={{ padding: "10px 22px 14px", borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                              {PLATFORM_PRESETS.filter(pr => !deliveryPlatforms.some(p => p.name === pr.name)).map(preset => (
                                <button key={preset.name} type="button"
                                  onClick={() => {
                                    const entry: DeliveryPlatform = { id: `dlv-${Date.now()}-${preset.name}`, ...preset };
                                    saveDeliveryPlatforms([...deliveryPlatforms, entry]);
                                  }}
                                  style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.10)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
                                  + {preset.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 플랫폼 추가/수정 폼 */}
                    {dlvFormOpen && (
                      <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,122,255,0.03)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#007aff", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                          {dlvEditId ? (ko ? "플랫폼 수정" : "Edit Platform") : (ko ? "플랫폼 추가" : "Add Platform")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                          <input type="text" placeholder={ko ? "플랫폼명 (예: 배달의민족)" : "Platform name"} value={dlvName} onChange={e => setDlvName(e.target.value)}
                            aria-label={ko ? "플랫폼명" : "Platform name"}
                            style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "중개 수수료 (%)" : "Commission (%)"}</div>
                              <input type="text" inputMode="decimal" placeholder="6.8" value={dlvRate} onChange={e => setDlvRate(e.target.value.replace(/[^0-9.]/g, ""))}
                                aria-label={ko ? "중개 수수료 (%)" : "Commission rate (%)"}
                                style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "월 광고비 (만원)" : "Monthly ads (만원)"}</div>
                              <input type="text" inputMode="numeric" placeholder="0" value={dlvAd} onChange={e => setDlvAd(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "월 광고비 (만원)" : "Monthly ad spend (10K KRW)"}
                                style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button type="button" onClick={handleDlvSave}
                              style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#007aff", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                              {dlvEditId ? (ko ? "수정 완료" : "Save") : (ko ? "추가" : "Add")}
                            </button>
                            <button type="button" onClick={() => { setDlvFormOpen(false); setDlvEditId(null); }}
                              style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                              {ko ? "취소" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })()}

              {/* ── 온라인 플랫폼 수수료 + 택배사 (online-digital only) ── */}
              {businessCtx.isOnlineStore && (() => {
                const ko = language === "ko";
                const fmt = (n: number) => n >= 10000
                  ? `${Math.round(n / 10000).toLocaleString()}만원`
                  : `${Math.round(n).toLocaleString()}원`;

                // 플랫폼 수수료 데이터 (2026 기준)
                const platforms = [
                  { id: "smartstore", name: ko ? "스마트스토어" : "SmartStore", rate: 2.0, adBase: 0, note: ko ? "결제 수수료 별도" : "+payment fee" },
                  { id: "coupang", name: ko ? "쿠팡 로켓그로스" : "Coupang", rate: 10.8, adBase: 0, note: ko ? "카테고리별 4~15%" : "4–15% by category" },
                  { id: "gmarket", name: ko ? "G마켓/옥션" : "G마켓", rate: 9.0, adBase: 0, note: ko ? "일반 판매 기준" : "standard seller" },
                  { id: "29cm", name: "29CM", rate: 12.0, adBase: 0, note: ko ? "패션/라이프스타일" : "fashion/lifestyle" },
                  { id: "kakao", name: ko ? "카카오쇼핑" : "Kakao Shopping", rate: 5.5, adBase: 0, note: ko ? "톡스토어 기준" : "Talk Store" },
                ];
                const couriers = [
                  { id: "cj", name: ko ? "CJ대한통운" : "CJ Logistics", base: 3000, perKg: 500, note: ko ? "2.5kg 기준 3,000원" : "3,000₩ up to 2.5kg" },
                  { id: "hanjin", name: ko ? "한진택배" : "Hanjin", base: 3000, perKg: 500, note: ko ? "기본 3,000원~" : "from 3,000₩" },
                  { id: "lotte", name: ko ? "롯데택배" : "Lotte", base: 3500, perKg: 500, note: ko ? "기본 3,500원~" : "from 3,500₩" },
                  { id: "post", name: ko ? "우체국택배" : "Korea Post", base: 4000, perKg: 600, note: ko ? "일반소포 기준" : "standard parcel" },
                ];

                const monthlySales = onlinePlatformSales;
                const setMonthlySales = setOnlinePlatformSales;
                const selectedPlatform = onlineSelectedPlatforms;
                const setSelectedPlatform = setOnlineSelectedPlatforms;
                const selectedCourier = onlineSelectedCourier;
                const setSelectedCourier = setOnlineSelectedCourier;
                const monthlyParcels = onlineMonthlyParcels;
                const setMonthlyParcels = setOnlineMonthlyParcels;

                const parcelCount = parseInt(monthlyParcels) || 0;
                const courier = couriers.find(c => c.id === selectedCourier) ?? couriers[0];
                const totalShipping = parcelCount * courier.base;

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                        {ko ? "온라인 채널 비용 분석" : "Online Channel Costs"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                        {ko ? "플랫폼 수수료 · 택배비 실수령액 계산" : "Platform fee & shipping cost calculator"}
                      </div>
                    </div>

                    {/* 플랫폼 섹션 */}
                    <div style={{ padding: "16px 22px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "12px" }}>
                        {ko ? "판매 채널 수수료" : "Platform Commission"}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "0" }}>
                        {platforms.map((p, idx) => {
                          const grossVal = parseInt(monthlySales[p.id] ?? "") || 0;
                          const commAmt = Math.round(grossVal * 10000 * (p.rate / 100));
                          const netAmt = grossVal * 10000 - commAmt;
                          const isOn = selectedPlatform.includes(p.id);
                          return (
                            <div key={p.id} style={{ borderTop: idx > 0 ? "0.5px solid rgba(0,0,0,0.06)" : "none", paddingTop: idx > 0 ? "10px" : "0", paddingBottom: "10px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <button type="button"
                                    onClick={() => setSelectedPlatform(prev => isOn ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                                    role="checkbox" aria-checked={isOn}
                                    aria-label={ko ? `${p.name} 선택` : `Select ${p.name}`}
                                    style={{ width: "18px", height: "18px", borderRadius: "5px", border: `1.5px solid ${isOn ? "#007aff" : "rgba(0,0,0,0.18)"}`, background: isOn ? "#007aff" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {isOn && <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true"><polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  </button>
                                  <div>
                                    <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "-0.2px" }}>{p.name}</span>
                                    <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "6px" }}>{p.rate}% — {p.note}</span>
                                  </div>
                                </div>
                                {isOn && grossVal > 0 && (
                                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#34c759" }}>{fmt(netAmt)} {ko ? "수령" : "net"}</div>
                                )}
                              </div>
                              {isOn && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "26px" }}>
                                  <input type="text" inputMode="numeric"
                                    placeholder={ko ? "이달 매출 (만원)" : "Monthly sales (10K₩)"}
                                    aria-label={ko ? `${p.name} 이달 매출 (만원)` : `${p.name} monthly sales (10K KRW)`}
                                    value={monthlySales[p.id] ?? ""}
                                    onChange={e => setMonthlySales(prev => ({ ...prev, [p.id]: e.target.value.replace(/[^0-9]/g, "") }))}
                                    style={{ flex: 1, fontSize: "13px", padding: "8px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
                                  {grossVal > 0 && (
                                    <div style={{ fontSize: "11px", color: "#ff3b30", whiteSpace: "nowrap" as const }}>
                                      {ko ? `수수료 ${fmt(commAmt)}` : `-${fmt(commAmt)}`}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 총 요약 */}
                    {selectedPlatform.length > 0 && (() => {
                      const totalGross = selectedPlatform.reduce((s, id) => s + (parseInt(monthlySales[id] ?? "") || 0), 0) * 10000;
                      const totalComm = selectedPlatform.reduce((s, id) => {
                        const p = platforms.find(x => x.id === id);
                        const g = (parseInt(monthlySales[id] ?? "") || 0) * 10000;
                        return s + Math.round(g * ((p?.rate ?? 0) / 100));
                      }, 0);
                      const totalNet = totalGross - totalComm - totalShipping;
                      if (totalGross === 0) return null;
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                          {[
                            { label: ko ? "총 매출" : "Gross", value: fmt(totalGross), color: "inherit" },
                            { label: ko ? "수수료+배송" : "Fees+Ship", value: `-${fmt(totalComm + totalShipping)}`, color: "#ff3b30" },
                            { label: ko ? "실수령" : "Net", value: fmt(Math.max(0, totalNet)), color: "#34c759" },
                          ].map((col, i) => (
                            <div key={col.label} style={{ padding: "12px 12px", borderLeft: i > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
                              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{col.label}</div>
                              <div style={{ fontSize: "15px", fontWeight: 700, color: col.color, letterSpacing: "-0.3px" }}>{col.value}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* 택배사 섹션 */}
                    <div style={{ padding: "16px 22px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "12px" }}>
                        {ko ? "택배비 계산" : "Shipping Cost"}
                      </div>
                      {/* 택배사 선택 */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "12px" }}>
                        {couriers.map(c => (
                          <button key={c.id} type="button"
                            onClick={() => setSelectedCourier(c.id)}
                            style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: `1px solid ${selectedCourier === c.id ? "#007aff" : "rgba(0,0,0,0.10)"}`, background: selectedCourier === c.id ? "rgba(0,122,255,0.09)" : "transparent", color: selectedCourier === c.id ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                            {c.name}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "10px" }}>
                        {courier.note}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="text" inputMode="numeric"
                          placeholder={ko ? "이달 발송 건수" : "Monthly parcels"}
                          aria-label={ko ? "이달 발송 건수" : "Monthly parcel count"}
                          value={monthlyParcels}
                          onChange={e => setMonthlyParcels(e.target.value.replace(/[^0-9]/g, ""))}
                          style={{ flex: 1, fontSize: "13px", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
                        {parcelCount > 0 && (
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#ff3b30", whiteSpace: "nowrap" as const }}>
                            {fmt(totalShipping)}
                          </div>
                        )}
                      </div>
                      {parcelCount > 0 && (
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
                          {ko
                            ? `${parcelCount.toLocaleString()}건 × ${courier.base.toLocaleString()}원 = ${fmt(totalShipping)}`
                            : `${parcelCount.toLocaleString()} × ₩${courier.base.toLocaleString()} = ${fmt(totalShipping)}`}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })()}

              {/* 주간 매출 차트 → KPI 바 바로 아래로 이동됨 */}


              {/* ── 메뉴 · 상품 관리 (inventory businesses + online store) ── */}
              {/* ── 제품/메뉴 카드 — separate(food,cafe) + service(beauty,living) ── */}
              {/* unified 모드(retail,online,pet)는 재고 카드에 통합되므로 여기선 숨김 */}
              {businessCtx.showProductCard && (() => {
                const ko = language === "ko";
                const isRestaurant = businessCtx.inventoryMode === "separate";
                const fmt = (n: number) => n >= 10000
                  ? `${Math.round(n / 10000).toLocaleString()}만원`
                  : `${Math.round(n).toLocaleString()}원`;
                const fmtN = (n: number) => n.toLocaleString();

                // 수익성 계산
                const calcMargin = (p: Product) => p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                const calcRevenue = (p: Product) => p.monthlySold * p.price;
                const calcProfit = (p: Product) => p.monthlySold * (p.price - p.cost);

                const totalRevenue = products.reduce((s, p) => s + calcRevenue(p), 0);
                const totalProfit = products.reduce((s, p) => s + calcProfit(p), 0);
                const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

                // 정렬: 월 매출 기여도 내림차순
                const sorted = [...products].sort((a, b) => calcRevenue(b) - calcRevenue(a));
                const dangerItems = products.filter(p => p.cost > 0 && calcMargin(p) < 20);

                const marginColor = (m: number) => m < 0 ? "#ff3b30" : m < 20 ? "#ff9f0a" : m < 40 ? "var(--primary)" : "#34c759";

                // 카테고리 목록 (업종별 기본값)
                const defaultCategories = isRestaurant
                  ? (ko ? ["메인", "사이드", "음료", "디저트", "세트"] : ["Main", "Side", "Drink", "Dessert", "Set"])
                  : businessCtx.isOnlineStore
                    ? (ko ? ["의류", "잡화", "디지털", "홈리빙", "기타"] : ["Apparel", "Accessories", "Digital", "Home", "Other"])
                    : (ko ? ["상품", "소모품", "악세서리", "기타"] : ["Product", "Supplies", "Accessories", "Other"]);

                const UNITS = ["개", "잔", "그릇", "접시", "병", "캔", "팩"];

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                            {businessCtx.productLabel[language] || (ko ? "제품 수익성" : "Product Performance")}
                          </div>
                          {products.length > 0 && (
                            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                              {ko ? `${products.length}개 등록 · 이달 매출 기여 ${fmt(totalRevenue)}` : `${products.length} items · ${fmt(totalRevenue)} this month`}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <button type="button"
                            onClick={() => { setProdFormOpen(true); setProdEditId(null); setProdName(""); setProdCategory(""); setProdPrice(""); setProdCost(""); setProdStock(""); setProdUnit("개"); }}
                            style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                            {ko ? "+ 직접 추가" : "+ Add manually"}
                          </button>
                          <label style={{ fontSize: "13px", fontWeight: 600, color: "#34c759", cursor: "pointer", padding: "4px 0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M8 2v12M2 8h12" />
                            </svg>
                            {ko ? "엑셀 업로드" : "Upload Excel"}
                            <input type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" aria-label={ko ? "제품 엑셀 파일 업로드" : "Upload product Excel file"} style={{ display: "none" }} onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              e.target.value = "";
                              try {
                                let text = "";
                                const fileExt = file.name.split(".").pop()?.toLowerCase();
                                if (fileExt === "csv" || fileExt === "tsv" || fileExt === "txt") {
                                  text = await file.text();
                                } else if (fileExt === "xlsx" || fileExt === "xls") {
                                  const XLSX = await import("xlsx");
                                  const buf = await file.arrayBuffer();
                                  const wb = XLSX.read(buf, { type: "array" });
                                  text = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
                                } else {
                                  const buf = await file.arrayBuffer();
                                  const bytes = new Uint8Array(buf);
                                  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
                                  catch { text = new TextDecoder("euc-kr", { fatal: false }).decode(bytes); }
                                  if (text.includes("\0") || text.length < 10) {
                                    alert(ko ? "지원하지 않는 파일 형식입니다." : "Unsupported format.");
                                    return;
                                  }
                                }
                                if (!text.trim()) { alert(ko ? "파일 내용이 비어 있습니다." : "File is empty."); return; }

                                const statusEl = document.getElementById("excel-upload-status");
                                if (statusEl) statusEl.textContent = ko ? "AI가 분석 중..." : "AI parsing...";

                                const { data: { session } } = await supabase.auth.getSession();
                                const res = await fetch("/api/ai/products/parse", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
                                  body: JSON.stringify({ text: text.slice(0, 50000), language }),
                                });
                                const payload = await res.json();
                                if (!res.ok || payload.error) {
                                  alert(payload.error ?? (ko ? "파싱 실패" : "Parse failed"));
                                  if (statusEl) statusEl.textContent = "";
                                  return;
                                }
                                const parsed = payload.products as { name: string; category: string; price: number; cost: number; stock: number; unit: string }[];
                                if (!parsed || parsed.length === 0) {
                                  alert(ko ? "제품 데이터를 찾을 수 없습니다." : "No products found.");
                                  if (statusEl) statusEl.textContent = "";
                                  return;
                                }
                                const newProducts = parsed.map((p) => ({
                                  id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                  name: p.name,
                                  category: p.category,
                                  price: p.price,
                                  cost: p.cost,
                                  stock: p.stock,
                                  monthlySold: 0,
                                  unit: p.unit,
                                }));
                                const merged = [...products, ...newProducts];
                                saveProducts(merged);
                                if (statusEl) statusEl.textContent = ko ? `${newProducts.length}개 제품 등록 완료` : `${newProducts.length} products added`;
                                setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
                              } catch (err) {
                                alert(ko ? "파일 처리 중 오류가 발생했습니다." : "Error processing file.");
                              }
                            }} />
                          </label>
                        </div>
                      </div>
                      <div id="excel-upload-status" style={{ fontSize: "12px", fontWeight: 600, color: "#34c759", minHeight: "18px", marginTop: "4px", padding: "0 22px" }} />
                      {/* 업종 태그 */}
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" as const, padding: "0 22px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "16px", border: "1px solid #007aff", background: "rgba(0,122,255,0.08)", color: "#007aff" }}>
                          {ko ? "제품 관리" : "Products"}
                        </span>
                      </div>
                    </div>

                    {/* 위험 경보 */}
                    {dangerItems.length > 0 && (
                      <div style={{ padding: "10px 22px", background: "rgba(255,59,48,0.04)", borderBottom: "0.5px solid rgba(255,59,48,0.10)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#ff3b30" }}>
                          {ko ? `마진 20% 미만 경고: ${dangerItems.map(p => p.name).join(", ")}` : `Low margin (<20%): ${dangerItems.map(p => p.name).join(", ")}`}
                        </div>
                      </div>
                    )}

                    {/* 요약 3-col */}
                    {products.length > 0 && totalRevenue > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                        {[
                          { label: ko ? "이달 매출" : "Revenue", value: fmt(totalRevenue), color: "inherit" },
                          { label: ko ? "이달 이익" : "Gross profit", value: fmt(totalProfit), color: totalProfit >= 0 ? "#34c759" : "#ff3b30" },
                          { label: ko ? "평균 마진율" : "Avg margin", value: `${overallMargin.toFixed(1)}%`, color: marginColor(overallMargin) },
                        ].map((col, idx) => (
                          <div key={col.label} style={{ padding: "14px 12px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "6px" }}>{col.label}</div>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: col.color, letterSpacing: "-0.4px" }}>{col.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 빈 상태 */}
                    {products.length === 0 ? (
                      <div style={{ padding: "16px 22px 22px" }}>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                          {ko
                            ? `${isRestaurant ? "메뉴" : "상품"}를 등록하면 판매량 기록, 마진율 계산, 베스트셀러 분석이 가능합니다.`
                            : `Register ${isRestaurant ? "menu items" : "products"} to track sales, calculate margins, and identify bestsellers.`}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {sorted.map((p, idx) => {
                          const margin = calcMargin(p);
                          const revenue = calcRevenue(p);
                          const revenueShare = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                          return (
                            <div key={p.id} style={{ padding: "13px 22px", borderBottom: idx < sorted.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
                              {/* 이름 행 */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)" }}>{p.name}</span>
                                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>{p.category}</span>
                                    {idx === 0 && totalRevenue > 0 && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px", background: "rgba(0,122,255,0.10)", color: "#007aff" }}>{ko ? "베스트" : "Best"}</span>}
                                    {margin < 0 && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px", background: "rgba(255,59,48,0.10)", color: "#ff3b30" }}>{ko ? "적자주의" : "Loss!"}</span>}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
                                    {ko ? `판매가 ${fmtN(p.price)}원 · 원가 ${p.cost > 0 ? fmtN(p.cost) + "원" : "미입력"} · 재고 ${p.stock}${p.unit}` : `Price ₩${fmtN(p.price)} · Cost ${p.cost > 0 ? "₩" + fmtN(p.cost) : "N/A"} · Stock ${p.stock}${p.unit}`}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                  <button type="button" onClick={() => openProdEdit(p)} style={{ fontSize: "11px", color: "#007aff", background: "none", border: "none", cursor: "pointer" }}>{ko ? "수정" : "Edit"}</button>
                                  <button type="button" onClick={() => handleProdDelete(p.id)} style={{ fontSize: "11px", color: "#ff3b30", background: "none", border: "none", cursor: "pointer" }}>{ko ? "삭제" : "Del"}</button>
                                </div>
                              </div>
                              {/* 마진율 바 */}
                              {p.cost > 0 && (
                                <div style={{ marginBottom: "8px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{ko ? "마진율" : "Margin"}</span>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: marginColor(margin) }}>{margin.toFixed(1)}%</span>
                                  </div>
                                  <div style={{ height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.07)" }}>
                                    <div style={{ height: "100%", borderRadius: "2px", width: `${Math.max(0, Math.min(100, margin))}%`, background: marginColor(margin) }} />
                                  </div>
                                </div>
                              )}
                              {/* 판매량 조작 + 월 기여 */}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" as const }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                                  <button type="button" onClick={() => handleProdSoldChange(p.id, -1)}
                                    aria-label={ko ? `${p.name} 판매량 감소` : `Decrease ${p.name} sold count`}
                                    style={{ width: "28px", height: "28px", borderRadius: "8px 0 0 8px", border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.03)", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>−</button>
                                  <div style={{ padding: "0 10px", height: "28px", border: "1px solid rgba(0,0,0,0.12)", borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", fontSize: "13px", fontWeight: 600, minWidth: "44px", justifyContent: "center" }} aria-live="polite">
                                    {p.monthlySold}{p.unit}
                                  </div>
                                  <button type="button" onClick={() => handleProdSoldChange(p.id, 1)}
                                    aria-label={ko ? `${p.name} 판매량 증가` : `Increase ${p.name} sold count`}
                                    style={{ width: "28px", height: "28px", borderRadius: "0 8px 8px 0", border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.03)", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>+</button>
                                </div>
                                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{ko ? "이달 판매량" : "Sold this month"}</span>
                                {revenue > 0 && (
                                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", marginLeft: "auto" }}>
                                    {ko ? `매출 ${fmt(revenue)}` : `${fmt(revenue)} revenue`}
                                    {revenueShare > 0 && <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "4px" }}>({revenueShare.toFixed(0)}%)</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 추가/수정 폼 */}
                    {prodFormOpen && (
                      <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,122,255,0.03)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#007aff", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                          {prodEditId ? (ko ? "수정" : "Edit") : (ko ? "제품 추가" : "Add product")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                          <input type="text" placeholder={ko ? "제품명 (예: 아메리카노, 흰티셔츠)" : "Product name"} value={prodName} onChange={e => setProdName(e.target.value)}
                            aria-label={ko ? "제품명" : "Product name"}
                            style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                          {/* 카테고리 선택 */}
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>{ko ? "카테고리" : "Category"}</div>
                            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" as const }}>
                              {defaultCategories.map(cat => (
                                <button key={cat} type="button" onClick={() => setProdCategory(cat)}
                                  style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: `1px solid ${prodCategory === cat ? "#007aff" : "rgba(0,0,0,0.10)"}`, background: prodCategory === cat ? "rgba(0,122,255,0.09)" : "transparent", color: prodCategory === cat ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                                  {cat}
                                </button>
                              ))}
                              <input type="text" placeholder={ko ? "직접 입력" : "Custom"} value={!defaultCategories.includes(prodCategory) ? prodCategory : ""} onChange={e => setProdCategory(e.target.value)}
                                aria-label={ko ? "사용자 정의 카테고리" : "Custom category"}
                                style={{ width: "80px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "5px 10px", fontSize: "12px", outline: "none" }} />
                            </div>
                          </div>
                          {/* 가격 + 원가 */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "판매가 (원)" : "Price (₩)"}</div>
                              <input type="text" inputMode="numeric" placeholder="12000" value={prodPrice} onChange={e => setProdPrice(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "판매가 (원)" : "Selling price (KRW)"}
                                style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "원가 (원, 선택)" : "Cost (₩, optional)"}</div>
                              <input type="text" inputMode="numeric" placeholder="4000" value={prodCost} onChange={e => setProdCost(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "원가 (원)" : "Cost price (KRW)"}
                                style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                            </div>
                          </div>
                          {/* 재고 + 단위 */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "재고 수량" : "Stock qty"}</div>
                              <input type="text" inputMode="numeric" placeholder="0" value={prodStock} onChange={e => setProdStock(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "재고 수량" : "Stock quantity"}
                                style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "단위" : "Unit"}</div>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const }}>
                                {UNITS.map(u => (
                                  <button key={u} type="button" onClick={() => setProdUnit(u)}
                                    style={{ fontSize: "11px", fontWeight: 600, padding: "5px 10px", borderRadius: "12px", border: `1px solid ${prodUnit === u ? "#007aff" : "rgba(0,0,0,0.10)"}`, background: prodUnit === u ? "rgba(0,122,255,0.09)" : "transparent", color: prodUnit === u ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                                    {u}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* 마진 미리보기 */}
                          {prodPrice && prodCost && parseInt(prodPrice) > 0 && (
                            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(0,122,255,0.05)", border: "0.5px solid rgba(0,122,255,0.12)" }}>
                              {(() => {
                                const p = parseInt(prodPrice); const c = parseInt(prodCost);
                                if (p <= 0) return null;
                                const m = ((p - c) / p * 100);
                                return (
                                  <div style={{ fontSize: "12px", color: m < 0 ? "#ff3b30" : marginColor(m), fontWeight: 600 }}>
                                    {ko ? `마진율 ${m.toFixed(1)}% · 건당 이익 ${(p - c).toLocaleString()}원` : `Margin ${m.toFixed(1)}% · ₩${(p - c).toLocaleString()} per item`}
                                    {m < 0 && <span style={{ color: "#ff3b30", marginLeft: "8px", fontWeight: 600 }}>{ko ? "⚠ 역마진" : "⚠ Negative"}</span>}
                                    {m >= 0 && m < 20 && <span style={{ color: "#ff9f0a", marginLeft: "8px", fontWeight: 600 }}>{ko ? "마진 낮음" : "Low margin"}</span>}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button type="button" onClick={handleProdSave}
                              style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#007aff", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                              {prodEditId ? (ko ? "수정 완료" : "Save") : (ko ? "추가" : "Add")}
                            </button>
                            <button type="button" onClick={() => { setProdFormOpen(false); setProdEditId(null); }}
                              style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                              {ko ? "취소" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })()}

              {/* ── 수강생 · 회원 관리 (fitness, education, space only) ── */}
              {businessCtx.isRecurringRevenue && (() => {
                const ko = language === "ko";
                const fmt = (n: number) => n >= 10000
                  ? `${Math.round(n / 10000).toLocaleString()}만원`
                  : `${Math.round(n).toLocaleString()}원`;

                const saveMembers = (list: Member[]) => {
                  setMembers(list);
                  try { localStorage.setItem("members", JSON.stringify(list)); } catch { /* ignore */ }
                };

                const todayStr = new Date().toISOString().slice(0, 10);
                const in7days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

                const enriched = members.map(m => ({
                  ...m,
                  status: m.endDate < todayStr ? "expired" as const : m.endDate <= in7days ? "expiring" as const : "active" as const,
                }));

                const activeCount = enriched.filter(m => m.status === "active").length;
                const expiringCount = enriched.filter(m => m.status === "expiring").length;
                const monthlyRevenue = enriched.filter(m => m.status !== "expired").reduce((s, m) => s + m.fee, 0);

                const planPresets = industryCategoryId === "fitness"
                  ? (ko ? ["1개월", "3개월", "6개월", "12개월", "PT 10회", "PT 20회"] : ["1 Month", "3 Months", "6 Months", "12 Months", "PT 10x", "PT 20x"])
                  : industryCategoryId === "space"
                    ? (ko ? ["시간권", "월정액", "주간권", "단기"] : ["Hourly", "Monthly", "Weekly", "Short-term"])
                    : (ko ? ["월 수강", "분기 수강", "단과", "특강"] : ["Monthly", "Quarterly", "Single", "Special"]);

                const statusColor = (s: string) => s === "expired" ? "#ff3b30" : s === "expiring" ? "#ff9f0a" : "#34c759";
                const statusLabel = (s: string) => s === "expired" ? (ko ? "만료" : "Expired") : s === "expiring" ? (ko ? "만료임박" : "Expiring") : (ko ? "정상" : "Active");

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                            {industryCategoryId === "fitness" ? (ko ? "회원 관리" : "Member Management")
                              : industryCategoryId === "space" ? (ko ? "이용자 관리" : "User Management")
                              : (ko ? "수강생 관리" : "Student Management")}
                          </div>
                          {members.length > 0 && (
                            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                              {ko
                                ? `총 ${members.length}명 · 활성 ${activeCount}명 · 이달 예상 ${fmt(monthlyRevenue * 10000)}`
                                : `${members.length} total · ${activeCount} active · ${fmt(monthlyRevenue * 10000)} this month`}
                            </div>
                          )}
                        </div>
                        <button type="button"
                          onClick={() => { setMemFormOpen(true); setMemName(""); setMemPlan(""); setMemFee(""); setMemEnd(""); }}
                          style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                          {ko ? "+ 등록" : "+ Add"}
                        </button>
                      </div>
                    </div>

                    {/* 만료 임박 경보 */}
                    {expiringCount > 0 && (
                      <div style={{ padding: "10px 22px", background: "rgba(255,159,10,0.06)", borderBottom: "0.5px solid rgba(255,159,10,0.12)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#ff9f0a" }}>
                          {ko ? `7일 내 만료 ${expiringCount}명 — 갱신 안내 필요` : `${expiringCount} member${expiringCount > 1 ? "s" : ""} expiring in 7 days`}
                        </div>
                      </div>
                    )}

                    {/* 요약 3-col */}
                    {members.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                        {[
                          { label: ko ? "전체" : "Total", value: `${members.length}명`, color: "inherit" },
                          { label: ko ? "만료임박" : "Expiring", value: `${expiringCount}명`, color: expiringCount > 0 ? "#ff9f0a" : "inherit" },
                          { label: ko ? "이달 수입" : "Revenue", value: fmt(monthlyRevenue * 10000), color: "#007aff" },
                        ].map((col, i) => (
                          <div key={col.label} style={{ padding: "12px 12px", borderLeft: i > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{col.label}</div>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: col.color, letterSpacing: "-0.4px" }}>{col.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 빈 상태 */}
                    {members.length === 0 && !memFormOpen && (
                      <div style={{ padding: "16px 22px 22px" }}>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                          {ko
                            ? "수강생/회원을 등록하면 만료일 추적, 이달 수입 계산, 갱신 안내 알림 관리가 가능합니다."
                            : "Register members to track expiry dates, calculate monthly revenue, and manage renewal reminders."}
                        </div>
                      </div>
                    )}

                    {/* 회원 목록 */}
                    {enriched.length > 0 && (
                      <div>
                        {enriched.map((m, idx) => {
                          const daysLeft = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000);
                          return (
                            <div key={m.id} style={{ padding: "12px 22px", borderTop: idx > 0 ? "0.5px solid rgba(0,0,0,0.06)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: m.status === "expired" ? 0.5 : 1 }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "-0.2px" }}>{m.name}</span>
                                  <span style={{ fontSize: "10px", fontWeight: 700, color: statusColor(m.status), background: `${statusColor(m.status)}18`, padding: "2px 7px", borderRadius: "20px" }}>
                                    {statusLabel(m.status)}
                                  </span>
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                                  {m.plan} · {fmt(m.fee * 10000)} · {m.endDate}
                                  {m.status !== "expired" && daysLeft >= 0 && (
                                    <span style={{ color: m.status === "expiring" ? "#ff9f0a" : "var(--muted)" }}>
                                      {" "}{ko ? `(D-${daysLeft})` : `(${daysLeft}d left)`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button type="button"
                                onClick={() => saveMembers(members.filter(x => x.id !== m.id))}
                                aria-label={ko ? `${m.name} 삭제` : `Delete ${m.name}`}
                                style={{ fontSize: "11px", color: "#ff3b30", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                                {ko ? "삭제" : "Del"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 등록 폼 */}
                    {memFormOpen && (
                      <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.09)", background: "rgba(0,0,0,0.018)", display: "flex", flexDirection: "column" as const, gap: "12px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>{ko ? "수강생/회원 등록" : "Register Member"}</div>
                        <input type="text" placeholder={ko ? "이름" : "Name"}
                          value={memName} onChange={e => setMemName(e.target.value)}
                          aria-label={ko ? "회원 이름" : "Member name"}
                          style={{ fontSize: "13px", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                          {planPresets.map(preset => (
                            <button key={preset} type="button"
                              onClick={() => setMemPlan(preset)}
                              style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "14px", border: `1px solid ${memPlan === preset ? "#007aff" : "rgba(0,0,0,0.10)"}`, background: memPlan === preset ? "rgba(0,122,255,0.09)" : "transparent", color: memPlan === preset ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                              {preset}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input type="text" inputMode="numeric" placeholder={ko ? "수강료 (만원)" : "Fee (10K₩)"}
                            value={memFee} onChange={e => setMemFee(e.target.value.replace(/[^0-9]/g, ""))}
                            aria-label={ko ? "수강료 (만원)" : "Membership fee (10K KRW)"}
                            style={{ flex: 1, fontSize: "13px", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
                          <input type="date" value={memEnd} onChange={e => setMemEnd(e.target.value)}
                            aria-label={ko ? "만료일" : "Expiry date"}
                            style={{ flex: 1, fontSize: "13px", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button type="button"
                            disabled={!memName.trim() || !memEnd}
                            onClick={() => {
                              if (!memName.trim() || !memEnd) return;
                              const newMember: Member = { id: `m_${Date.now()}`, name: memName.trim(), plan: memPlan || (ko ? "기타" : "Other"), fee: parseInt(memFee) || 0, startDate: todayStr, endDate: memEnd };
                              saveMembers([...members, newMember]);
                              setMemFormOpen(false);
                            }}
                            style={{ flex: 1, padding: "12px", borderRadius: "12px", background: memName.trim() && memEnd ? "#007aff" : "rgba(0,0,0,0.08)", color: memName.trim() && memEnd ? "#fff" : "var(--muted)", border: "none", fontSize: "14px", fontWeight: 700, cursor: memName.trim() && memEnd ? "pointer" : "default" }}>
                            {ko ? "등록" : "Register"}
                          </button>
                          <button type="button" onClick={() => setMemFormOpen(false)}
                            style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                            {ko ? "취소" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })()}



              {/* 매출 입력은 상단 7일 차트 카드에 통합됨 */}

              {/* ── 세금 · 납부 D-day 캘린더 ── */}
              {(() => {
                const ko = language === "ko";
                const now = new Date();
                const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const diffDays = (d: Date) =>
                  Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - todayMs) / 86400000);
                const y = now.getFullYear();
                const m = now.getMonth();
                const dom = now.getDate();
                const { vatType, hasEmployees } = taxSettings;

                // 원천세: 매월 10일 (직원 있을 때만)
                const whtM = dom >= 10 ? m + 1 : m;
                const withholdingDate = new Date(whtM > 11 ? y + 1 : y, whtM % 12, 10);

                // 4대보험료: 매월 말일 (직원 있을 때만)
                const insuranceDate = new Date(y, m + 1, 0);

                // 부가세 — 일반: 1/25·7/25 (확정신고), 간이: 1/25 (연 1회)
                const vatDates = vatType === "simplified"
                  ? [new Date(y, 0, 25), new Date(y + 1, 0, 25)]
                  : [new Date(y, 0, 25), new Date(y, 6, 25), new Date(y + 1, 0, 25)];
                const vatDate = vatDates.find(d => diffDays(d) >= 0) ?? vatDates[vatDates.length - 1];
                const vatSub = ko
                  ? vatType === "simplified" ? "간이과세자 — 연 1회 (1월 25일)" : "일반과세자 — 연 2회 (1·7월 25일)"
                  : vatType === "simplified" ? "Simplified — once/year (Jan 25)" : "General — twice/year (Jan & Jul 25)";

                // 종합소득세: 5/31
                const incomeTaxDate = [new Date(y, 4, 31), new Date(y + 1, 4, 31)]
                  .find(d => diffDays(d) >= 0) ?? new Date(y + 1, 4, 31);

                // 부가세 예정신고 (일반과세자만): 4/25, 10/25
                const vatProvisionalDates = [new Date(y, 3, 25), new Date(y, 9, 25), new Date(y + 1, 3, 25)];
                const vatProvisionalDate = vatProvisionalDates.find(d => diffDays(d) >= 0) ?? vatProvisionalDates[vatProvisionalDates.length - 1];

                // 산재보험: 3/31 (사업주 의무)
                const industrialDate = [new Date(y, 2, 31), new Date(y + 1, 2, 31)]
                  .find(d => diffDays(d) >= 0) ?? new Date(y + 1, 2, 31);

                const allEvents = [
                  ...(hasEmployees ? [
                    { label: ko ? "원천세 신고·납부" : "Withholding tax", sub: ko ? "급여 지급 다음달 10일까지" : "By 10th of following month", date: withholdingDate, icon: "원", color: "#007aff", alwaysShow: true, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                    { label: ko ? "4대보험료" : "Social insurance", sub: ko ? "매월 말일 자동이체" : "Auto-debit, end of month", date: insuranceDate, icon: "보", color: "#34c759", alwaysShow: true, url: "https://www.4insure.or.kr", urlLabel: ko ? "4대보험 포털" : "4 Insurance Portal" },
                  ] : []),
                  { label: ko ? "부가세 확정신고" : "VAT filing", sub: vatSub, date: vatDate, icon: "부", color: "#ff9f0a", alwaysShow: true, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                  ...(vatType === "general" ? [
                    { label: ko ? "부가세 예정신고" : "VAT provisional", sub: ko ? "일반과세자 — 4·10월 25일" : "General VAT — Apr & Oct 25", date: vatProvisionalDate, icon: "예", color: "#ff6b00", alwaysShow: false, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                  ] : []),
                  { label: ko ? "종합소득세" : "Income tax", sub: ko ? "매년 5월 31일" : "May 31 annually", date: incomeTaxDate, icon: "소", color: "#af52de", alwaysShow: true, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                  { label: ko ? "산재보험료 정산" : "Industrial accident ins.", sub: ko ? "매년 3월 31일" : "March 31 annually", date: industrialDate, icon: "산", color: "#5856d6", alwaysShow: false, url: "https://www.comwel.or.kr", urlLabel: ko ? "근로복지공단" : "COMWEL" },
                ].sort((a, b) => diffDays(a.date) - diffDays(b.date));

                const urgencyColor = (d: Date) => {
                  const n = diffDays(d);
                  return n < 0 ? "rgba(0,0,0,0.25)" : n <= 7 ? "#ff3b30" : n <= 30 ? "#ff9f0a" : "var(--muted)";
                };
                const dLabel = (d: Date) => {
                  const n = diffDays(d);
                  if (n === 0) return ko ? "오늘" : "Today";
                  if (n < 0) return ko ? `${Math.abs(n)}일 전` : `${Math.abs(n)}d ago`;
                  return `D-${n}`;
                };
                const dateLabel = (d: Date) =>
                  d.toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" });

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0", flex: 1 }}>
                    {/* 헤더 + 사업자 유형 설정 */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "12px" }}>
                        {ko ? "세금 · 납부 일정" : "Tax Calendar"}
                      </div>
                      {/* 설정 토글 2행 */}
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                        {/* 과세 유형 */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{ko ? "과세 유형" : "VAT type"}</span>
                          <div style={{ display: "flex", gap: "4px" }} role="radiogroup" aria-label={ko ? "과세 유형" : "VAT type"}>
                            {(["general", "simplified"] as const).map(type => {
                              const active = vatType === type;
                              const label = ko ? (type === "general" ? "일반과세자" : "간이과세자") : (type === "general" ? "General" : "Simplified");
                              return (
                                <button key={type} type="button"
                                  role="radio" aria-checked={active}
                                  onClick={() => saveTaxSettings({ ...taxSettings, vatType: type })}
                                  style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: `1px solid ${active ? "#007aff" : "rgba(0,0,0,0.12)"}`, background: active ? "rgba(0,122,255,0.10)" : "transparent", color: active ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {/* 직원 유무 */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{ko ? "직원 유무" : "Employees"}</span>
                          <div style={{ display: "flex", gap: "4px" }} role="radiogroup" aria-label={ko ? "직원 유무" : "Has employees"}>
                            {([true, false] as const).map(v => {
                              const active = hasEmployees === v;
                              const label = ko ? (v ? "있음" : "없음") : (v ? "Yes" : "No");
                              return (
                                <button key={String(v)} type="button"
                                  role="radio" aria-checked={active}
                                  onClick={() => saveTaxSettings({ ...taxSettings, hasEmployees: v })}
                                  style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: `1px solid ${active ? "#007aff" : "rgba(0,0,0,0.12)"}`, background: active ? "rgba(0,122,255,0.10)" : "transparent", color: active ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 세금 이벤트 목록 */}
                    {allEvents.map((ev, idx) => {
                      const days = diffDays(ev.date);
                      const isUrgent = days >= 0 && days <= 14;
                      return (
                      <div key={`${ev.label}-${idx}`} style={{
                        display: "flex", alignItems: "center", gap: "14px", padding: "13px 22px",
                        borderBottom: idx < allEvents.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                        opacity: days < 0 ? 0.45 : 1,
                        background: isUrgent ? `${ev.color}06` : "transparent",
                      }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: ev.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                          {ev.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{ev.label}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{ev.sub}</div>
                          {isUrgent && ev.url && (
                            <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "4px",
                              fontSize: "11px", fontWeight: 600, color: ev.color, textDecoration: "none"
                            }}>
                              {ev.urlLabel} ↗
                            </a>
                          )}
                        </div>
                        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: urgencyColor(ev.date), letterSpacing: "-0.2px" }}>
                            {dLabel(ev.date)}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
                            {dateLabel(ev.date)}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    {/* 유용한 링크 */}
                    <div style={{ padding: "12px 22px 16px", borderTop: "0.5px solid rgba(0,0,0,0.06)", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                      {[
                        { label: ko ? "홈택스" : "HomeTax", url: "https://www.hometax.go.kr", color: "#5856d6" },
                        { label: ko ? "4대보험 포털" : "4 Insurance", url: "https://www.4insure.or.kr", color: "#34c759" },
                        { label: ko ? "근로복지공단" : "COMWEL", url: "https://www.comwel.or.kr", color: "#007aff" },
                        { label: ko ? "캐시노트" : "CashNote", url: "https://cashnote.kr", color: "#ff9f0a" },
                      ].map(link => (
                        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px",
                          borderRadius: "999px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)",
                          fontSize: "11px", fontWeight: 600, color: link.color, textDecoration: "none"
                        }}>
                          {link.label} ↗
                        </a>
                      ))}
                    </div>
                  </article>
                );
              })()}
              {/* ── 이번 달 비용 (통합: 변동비 + 고정비 + 고정 지출 D-day) ── */}
              {(() => {
                const ko = language === "ko";
                const now = new Date();
                const today = now.getDate();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const fmtD = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;
                const catIcon: Record<string, string> = { rent: "🏠", loan: "🏦", insurance: "🛡", other: "📋" };
                const catLabel: Record<string, { ko: string; en: string }> = {
                  rent: { ko: "임대료", en: "Rent" }, loan: { ko: "대출", en: "Loan" },
                  insurance: { ko: "보험", en: "Insurance" }, other: { ko: "기타", en: "Other" },
                };

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 + 합계 */}
                    <div style={{ padding: "18px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                        {ko ? "이번 달 비용" : "Monthly Costs"}
                      </div>
                      {totalCosts > 0 && (
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{fmtD(totalCosts)}</div>
                      )}
                    </div>

                    {/* 비용 구조 시각화 바 */}
                    {totalCosts > 0 && (
                      <div style={{ padding: "0 22px 14px" }}>
                        {/* 스택 바 */}
                        <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
                          {[
                            { value: ingredients, color: "#007aff" },
                            { value: labor, color: "#34c759" },
                            { value: rent, color: "#ff9f0a" },
                            { value: utilities, color: "#af52de" },
                            { value: other, color: "#8e8e93" },
                          ].filter(r => r.value > 0).map((r, i) => (
                            <div key={i} style={{ width: `${(r.value / totalCosts) * 100}%`, background: r.color, minWidth: "2px" }} />
                          ))}
                        </div>
                        {/* 범례 */}
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px 14px" }}>
                          {[
                            { label: ko ? "재료비" : "COGS", value: ingredients, color: "#007aff" },
                            { label: ko ? "인건비" : "Labor", value: labor, color: "#34c759" },
                            { label: ko ? "임대료" : "Rent", value: rent, color: "#ff9f0a" },
                            { label: ko ? "공과금" : "Util.", value: utilities, color: "#af52de" },
                            { label: ko ? "기타" : "Other", value: other, color: "#8e8e93" },
                          ].filter(r => r.value > 0).map(r => (
                            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "2px", background: r.color }} />
                              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{r.label}</span>
                              <span style={{ fontSize: "11px", fontWeight: 600 }}>{fmtD(r.value)}</span>
                              <span style={{ fontSize: "10px", color: "var(--muted)" }}>({((r.value / totalCosts) * 100).toFixed(0)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 비용 추세 (2개월 이상 이력) */}
                    {costHistory.length >= 2 && (() => {
                      const sorted = [...(costHistory as { month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }[])].sort((a, b) => a.month.localeCompare(b.month)).slice(-3);
                      const totals = sorted.map(s => s.ingredients + s.labor + s.rent + s.utilities + s.other);
                      const maxT = Math.max(...totals, 1);
                      const latest = sorted[sorted.length - 1];
                      const prev = sorted[sorted.length - 2];
                      const latestT = totals[totals.length - 1];
                      const prevT = totals[totals.length - 2];
                      const changePct = prevT > 0 ? Math.round((latestT - prevT) / prevT * 100) : 0;
                      const monthlyRev = (dailyEntries as { sales: number }[]).reduce((s, e) => s + e.sales, 0);
                      const ingRatio = monthlyRev > 0 ? Math.round(latest.ingredients / monthlyRev * 100) : 0;
                      const labRatio = monthlyRev > 0 ? Math.round(latest.labor / monthlyRev * 100) : 0;
                      return (
                        <div style={{ padding: "14px 22px", borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
                            {ko ? "비용 추세" : "Cost Trend"}
                            {changePct !== 0 && (
                              <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 700, color: changePct > 0 ? "#ff3b30" : "#34c759" }}>
                                {changePct > 0 ? "↑" : "↓"} {Math.abs(changePct)}%
                              </span>
                            )}
                          </div>
                          {/* 미니 바 차트 */}
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "40px", marginBottom: "10px" }}>
                            {sorted.map((s, i) => {
                              const h = Math.max(4, (totals[i] / maxT) * 36);
                              const isLatest = i === sorted.length - 1;
                              return (
                                <div key={s.month} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "3px" }}>
                                  <div style={{ fontSize: "9px", fontWeight: 600, color: isLatest ? "var(--text)" : "var(--muted)" }}>
                                    {fmtD(totals[i])}
                                  </div>
                                  <div style={{ width: "100%", height: `${h}px`, borderRadius: "4px", background: isLatest ? "#007aff" : "rgba(0,122,255,0.15)" }} />
                                  <div style={{ fontSize: "9px", color: "var(--muted)" }}>{s.month.slice(5)}{ko ? "월" : ""}</div>
                                </div>
                              );
                            })}
                          </div>
                          {/* 원가율 경고 */}
                          {monthlyRev > 0 && (ingRatio > 35 || labRatio > 30) && (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                              {ingRatio > 35 && (
                                <div style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px", background: "rgba(255,59,48,0.08)", color: "#ff3b30" }}>
                                  {ko ? `재료비율 ${ingRatio}% — 35% 초과` : `COGS ${ingRatio}% — over 35%`}
                                </div>
                              )}
                              {labRatio > 30 && (
                                <div style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px", background: "rgba(255,149,0,0.08)", color: "#ff9f0a" }}>
                                  {ko ? `인건비율 ${labRatio}% — 30% 초과` : `Labor ${labRatio}% — over 30%`}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 구분선 */}
                    {totalCosts > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />}

                    {/* 비용 입력 필드 (업종별 동적 레이블) */}
                    <div style={{ padding: "0 22px 16px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                      {(() => {
                        const textMap: Record<string, string> = { ingredients: costIngredientsText, labor: costLaborText, rent: costRentText, utilities: costUtilitiesText, other: costOtherText };
                        const setMap: Record<string, (v: string) => void> = { ingredients: setCostIngredientsText, labor: setCostLaborText, rent: setCostRentText, utilities: setCostUtilitiesText, other: setCostOtherText };
                        return (businessCtx.expenseFields ?? [
                          { fieldKey: "ingredients", label: { ko: "재료비", en: "Ingredients" }, placeholder: "120", description: { ko: "", en: "" } },
                          { fieldKey: "labor", label: { ko: "인건비", en: "Labor" }, placeholder: "200", description: { ko: "", en: "" } },
                          { fieldKey: "rent", label: { ko: "임대료", en: "Rent" }, placeholder: "80", description: { ko: "", en: "" } },
                          { fieldKey: "utilities", label: { ko: "공과금", en: "Utilities" }, placeholder: "20", description: { ko: "", en: "" } },
                          { fieldKey: "other", label: { ko: "기타", en: "Other" }, placeholder: "15", description: { ko: "", en: "" } },
                        ]).map((field) => ({
                          label: field.label[language] ?? field.label.ko,
                          val: textMap[field.fieldKey] ?? "",
                          set: setMap[field.fieldKey] ?? (() => {}),
                          ph: field.placeholder,
                          desc: field.description?.[language] ?? "",
                        }));
                      })().map((row) => (
                        <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ fontSize: "13px", color: "var(--muted)", width: "80px", flexShrink: 0 }}>{row.label}</div>
                          <input type="text" inputMode="numeric" value={row.val}
                            onChange={(e) => row.set(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder={row.ph}
                            style={inputStyle} />
                        </div>
                      ))}
                      <button type="button" style={{ ...styles.primaryButton, marginTop: "4px" }} onClick={handleSaveMonthlyCosts}>
                        {ko ? "비용 저장" : "Save costs"}
                      </button>
                    </div>

                    {/* 구분선 + 고정 지출 D-day */}
                    <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "14px 22px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                          {ko ? "고정 지출 납부일" : "Fixed expense due dates"}
                        </div>
                        <button type="button" onClick={() => { setFexpFormOpen(true); setFexpEditId(null); setFexpName(""); setFexpAmount(""); setFexpDueDay(""); setFexpCategory("other"); }}
                          style={{ fontSize: "12px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer" }}>
                          {ko ? "+ 항목 추가" : "+ Add"}
                        </button>
                      </div>

                      {fixedExpenses.length === 0 ? (
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                          {ko ? "대출이자, 보험료 등 매달 고정 지출을 등록하면 납부일 D-day를 추적합니다." : "Add recurring expenses like loans and insurance to track due dates."}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                          {(fixedExpenses as FixedExpense[]).map(fe => {
                            const effectiveDay = Math.min(fe.dueDay, daysInMonth);
                            const dLeft = effectiveDay >= today ? effectiveDay - today : daysInMonth - today + fe.dueDay;
                            const urgent = dLeft <= 3;
                            return (
                              <div key={fe.id} style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "8px 10px", borderRadius: "10px",
                                background: urgent ? "rgba(255,59,48,0.04)" : "rgba(0,0,0,0.02)",
                              }}>
                                <span style={{ fontSize: "16px" }}>{catIcon[fe.category] ?? "📋"}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{fe.name}</div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                                    {ko ? `매월 ${fe.dueDay}일` : `Due ${fe.dueDay}th`} · {fmtD(fe.amount)}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                  <div style={{ fontSize: "14px", fontWeight: 700, color: urgent ? "#ff3b30" : dLeft <= 7 ? "#ff9f0a" : "var(--text)" }}>
                                    D-{dLeft}
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleFexpDelete(fe.id)}
                                  aria-label={ko ? `${fe.name} 삭제` : `Delete ${fe.name}`}
                                  style={{ fontSize: "11px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0 }}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 고정 지출 추가 폼 */}
                      {fexpFormOpen && (
                        <div style={{ marginTop: "10px", padding: "12px", borderRadius: "12px", background: "rgba(0,122,255,0.03)", border: "1px solid rgba(0,122,255,0.08)" }}>
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                            <input type="text" placeholder={ko ? "항목명 (예: 대출이자)" : "Name"} value={fexpName} onChange={e => setFexpName(e.target.value)}
                              aria-label={ko ? "고정 지출 항목명" : "Fixed expense name"}
                              style={{ ...inputStyle, fontSize: "14px" }} />
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input type="text" inputMode="numeric" placeholder={ko ? "금액 (만원)" : "Amount"} value={fexpAmount} onChange={e => setFexpAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "금액 (만원)" : "Amount (10K KRW)"}
                                style={{ ...inputStyle, flex: 1, fontSize: "14px" }} />
                              <input type="text" inputMode="numeric" placeholder={ko ? "납부일 (1~31)" : "Due day"} value={fexpDueDay} onChange={e => setFexpDueDay(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "납부일 (1~31)" : "Due day (1-31)"}
                                style={{ ...inputStyle, flex: 1, fontSize: "14px" }} />
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {(["rent", "loan", "insurance", "other"] as const).map(cat => (
                                <button key={cat} type="button" onClick={() => setFexpCategory(cat)}
                                  style={{ fontSize: "11px", fontWeight: fexpCategory === cat ? 600 : 500, padding: "4px 10px", borderRadius: "8px", border: fexpCategory === cat ? "1px solid var(--primary)" : "1px solid var(--border)", background: fexpCategory === cat ? "rgba(29,53,87,0.06)" : "transparent", color: fexpCategory === cat ? "var(--primary)" : "var(--muted)", cursor: "pointer" }}>
                                  {catIcon[cat]} {catLabel[cat][language]}
                                </button>
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="button" onClick={handleFexpSave} style={{ ...styles.primaryButton, flex: 1, fontSize: "13px" }}>
                                {ko ? "추가" : "Add"}
                              </button>
                              <button type="button" onClick={() => setFexpFormOpen(false)}
                                style={{ ...styles.button, flex: 0, fontSize: "13px", padding: "10px 16px" }}>
                                {ko ? "취소" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })()}
              </div>{/* END RIGHT COLUMN */}
              </div>{/* END 2-col grid */}
            </section>

            {/* ── 폐업/전환 안내 ── */}
            {businessLaunched && (() => {
              const ko = language === "ko";
              const isDanger = businessHealthScore === "danger";
              const isCaution = businessHealthScore === "caution";
              const mc = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
              const monthlyRent = mc.rent;
              const empCount = (employees as { id: string }[]).length;

              // 폐업 비용 추정
              const remainingLease = monthlyRent * 3; // 보통 3개월 잔여
              const severance = empCount > 0 ? empCount * 2000000 : 0; // 인당 약 200만원
              const interiorLoss = (selectedBudget ?? 0) * 0.3; // 인테리어 감가 약 30%
              const taxSettlement = 500000; // 부가세 확정신고 등 약 50만원
              const totalClosureCost = remainingLease + severance + interiorLoss + taxSettlement;
              const fmtC = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;

              return (
                <section style={{ ...styles.section, marginTop: "32px" }}>
                  {/* 위기 경고 배너 (danger/caution 시) */}
                  {(isDanger || isCaution) && (
                    <article style={{
                      ...styles.card, padding: "18px 22px", marginBottom: "14px",
                      background: isDanger ? "rgba(255,59,48,0.04)" : "rgba(255,149,0,0.04)",
                      border: `1px solid ${isDanger ? "rgba(255,59,48,0.15)" : "rgba(255,149,0,0.15)"}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isDanger ? "rgba(255,59,48,0.12)" : "rgba(255,149,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M7 1L13 12H1L7 1Z" fill={isDanger ? "#ff3b30" : "#ff9f0a"} />
                            <rect x="6.25" y="5" width="1.5" height="3.5" rx="0.75" fill="white" />
                            <circle cx="7" cy="10" r="0.85" fill="white" />
                          </svg>
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: isDanger ? "#ff3b30" : "#ff9f0a" }}>
                          {isDanger ? (ko ? "사업 위기 감지" : "Business crisis detected") : (ko ? "주의 필요" : "Attention needed")}
                        </div>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                        {isDanger
                          ? (ko ? "순이익 적자가 지속되고 원가율이 위험 수준입니다. 비용 구조 재검토 또는 사업 전환을 고려해야 할 시점입니다." : "Persistent net loss with dangerous cost ratio. Consider cost restructuring or business pivot.")
                          : (ko ? "비용이 증가 추세이거나 순이익이 마이너스입니다. 지금 조치하면 위기를 예방할 수 있습니다." : "Costs trending up or net profit negative. Act now to prevent crisis.")}
                      </div>
                    </article>
                  )}

                  {/* 폐업 비용 계산기 + 지원 안내 */}
                  <article style={{
                    borderRadius: "20px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.6)",
                    padding: "0",
                    overflow: "hidden" as const,
                  }}>
                    <div style={{ padding: "18px 22px 14px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)" }}>
                        {ko ? "사업 전환 · 폐업 안내" : "Business Transition & Closure"}
                      </div>
                      <div style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--muted)", marginTop: "4px" }}>
                        {ko
                          ? "어려운 결정이 필요한 순간에도 build.up이 함께합니다."
                          : "build.up is with you even in difficult decisions."}
                      </div>
                    </div>

                    {/* 폐업 비용 추정 (데이터가 있을 때만) */}
                    {(monthlyRent > 0 || empCount > 0 || (selectedBudget ?? 0) > 0) && (
                      <div style={{ padding: "0 22px 16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
                          {ko ? "폐업 시 예상 비용" : "Estimated closure costs"}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {[
                            { label: ko ? "잔여 임대료 (3개월)" : "Remaining lease (3mo)", value: remainingLease },
                            ...(empCount > 0 ? [{ label: ko ? `퇴직금 (${empCount}명)` : `Severance (${empCount})`, value: severance }] : []),
                            ...(interiorLoss > 0 ? [{ label: ko ? "인테리어 감가" : "Interior depreciation", value: interiorLoss }] : []),
                            { label: ko ? "세금 정산" : "Tax settlement", value: taxSettlement },
                          ].map(item => (
                            <div key={item.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: "10px", padding: "10px 12px" }}>
                              <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "3px" }}>{item.label}</div>
                              <div style={{ fontSize: "14px", fontWeight: 600 }}>{fmtC(item.value)}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,59,48,0.04)", textAlign: "center" as const }}>
                          <div style={{ fontSize: "10px", color: "#ff3b30", marginBottom: "2px" }}>{ko ? "예상 총 폐업 비용" : "Est. total closure cost"}</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: "#ff3b30" }}>{fmtC(totalClosureCost)}</div>
                        </div>
                      </div>
                    )}

                    <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />

                    {/* 지원 링크 */}
                    <div style={{ padding: "14px 22px 18px", display: "grid", gap: "6px" }}>
                      {[
                        { label: ko ? "폐업 절차 안내 (국세청)" : "Closure procedures (NTS)", desc: ko ? "사업자 폐업 신고, 부가세 확정신고, 폐업 세금 정리" : "Business closure filing, VAT final return, tax settlement", url: "https://www.hometax.go.kr" },
                        { label: ko ? "희망리턴패키지 (소진공)" : "Hope Return Package (SEMAS)", desc: ko ? "폐업 후 재창업 최대 2,000만원 + 점포 철거비 600만원 지원" : "Re-startup up to 20M + store demolition 6M KRW support", url: "https://www.semas.or.kr" },
                        { label: ko ? "고용보험 실업급여 (사업주)" : "Employment insurance (business owner)", desc: ko ? "사업주 고용보험 임의가입 시 폐업 후 실업급여 수급 가능" : "Business owner unemployment benefits if voluntarily insured", url: "https://www.ei.go.kr" },
                      ].map((item, idx) => (
                        <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" style={{
                          display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px",
                          borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)",
                          textDecoration: "none", color: "inherit"
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{item.label}</div>
                            <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>{item.desc}</div>
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                        </a>
                      ))}
                    </div>
                  </article>
                </section>
              );
            })()}
    </>
  );
}
