"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import {
  buildMarketScoreNarrative,
  buildRecommendedMarkets,
  computeOverallScore,
  contractCheckpoints,
  evaluateDirectMarket,
  formatBudgetPresetLabel,
  formatFranchiseCost,
  formatMarketMetaValue,
  formatOpenDatePresetLabel,
  formatStageType,
  formatStartupType,
  getFranchiseBrandById,
  getFranchiseBrandsForCategory,
  getFranchiseBrandsForSubIndustry,
  getFranchiseSupplyInfo,
  getFreshnessPresentation,
  getFullToolKit,
  getMatchedPrograms,
  getProgramCategoryColor,
  getProgramCategoryLabel,
  getRecommendedStack,
  getScoreColor,
  getScoreLabel,
  getStarterBusinessModelOptions,
  getSupplyTypeColor,
  getSupplyTypeLabel,
  loadBestMarketSignal,
  localizeRecommendationItem,
  localizeStarterIndustryCategory,
  localizeTaskTitle,
  starterBudgetPresets,
  starterIndustryCategories,
  starterIndustryOptions,
  starterOpenDatePresets,
  type ProgramCategory,
  type SupplyType,
} from "@build-up/shared";
import type { LucideIcon } from "lucide-react";
import {
  Layers, Lightbulb, VolumeX, Shield, Zap, Droplets, Wind, Gem,
  Paintbrush, Leaf, Scan, Lock, Plug, Grid3X3, DoorOpen, Sun, Film,
  PanelLeft, Table2, Box, Frame, Trees, Thermometer, Flame, Package,
  Factory, Coffee, Compass, Home, Beer, Wine, Sprout, Sparkles,
  Flower2, Crown, Heart, Dumbbell, Waves, BookOpen, Palette, Award,
  Star, Scissors, AlignLeft, Megaphone, Store, Cpu, RefreshCw,
  Maximize2, MapPin, Monitor, Smile, Building2, LayoutGrid,
  CreditCard, ClipboardList, BarChart2, Bike,
  Wifi, Camera, Users, Globe,
} from "lucide-react";
import { VENDOR_URL_MAP } from "../../constants";
import {
  getContractAnalysisHints,
  getContractTaskDetail,
} from "../../helpers";
import { LocationMapPanel } from "../LocationMapPanel";
import { HiringCostCalculator } from "../knowledge/HiringCostCalculator";
import { SecurityChecklist } from "../knowledge/SecurityChecklist";
import { InvestmentGlossary } from "../knowledge/InvestmentGlossary";
import { fetchLiveSupportPrograms } from "../../services/live-data";
import { supabase } from "../../../../lib/supabase";

export function CurrentStageView() {
  /* ------------------------------------------------------------------ *
   * Pull every value we need from the shared dashboard context.        *
   * The extracted block (~9 900 lines) references a very large number  *
   * of state variables, handlers and computed values so we spread the  *
   * full context rather than cherry-picking.                           *
   * ------------------------------------------------------------------ */
  const d = useDashboardCtx();

  // Shorthand aliases used heavily throughout the JSX
  const {
    // Core hooks / i18n
    language, copy, mounted,
    // Navigation / surface
    navigateToSurface, activeSurface,
    // Business launch state
    businessLaunched, setBusinessLaunched, storeName, setStoreName,
    // Daily entries / costs
    dailyEntries, monthlyCosts,
    dailyDateInput, setDailyDateInput,
    dailySalesInput, setDailySalesInput,
    dailyCustomersInput, setDailyCustomersInput,
    handleAddDailyEntry,
    // Viewing / traversal
    viewingStageId, setViewingStageId,
    allStagesDone, pathTotalStages,
    currentStage, localizedCurrentStage,
    transitionNotice, isFreshAccount,
    persistenceLabel, isViewingPastStage,
    prevTraversedStage,
    // Industry
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedIndustryId, setSelectedIndustryId,
    industryCategoryId, canCompleteIndustryStep, handleIndustryContinue,
    isDigitalCategory, preferredRegion, isGuideStage, persistCurrentState,
    // Startup type / franchise
    startupType, setStartupType,
    showFranchisePicker, setShowFranchisePicker,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    canCompleteStartupTypeStep, handleStartupTypeContinue,
    nearbyFranchiseStores, setNearbyFranchiseStores,
    nearbyFranchiseLoading, setNearbyFranchiseLoading,
    locationMapReady, setLocationMapReady,
    // Business model
    selectedBusinessModelId, setSelectedBusinessModelId,
    canCompleteBusinessModelStep,
    handleBusinessModelContinue,
    // Budget
    selectedBudget, setSelectedBudget,
    budgetInputText, setBudgetInputText,
    canCompleteBudgetStep, handleBudgetContinue,
    sliderBudgetValue, activeBudgetLabel,
    // Open date
    selectedOpenDate, setSelectedOpenDate,
    activeOpenDatePreset,
    // Location
    locationOptions, selectedLocationId, setSelectedLocationId,
    canCompleteLocationStep, handleLocationContinue,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    recommendedMarkets, setRecommendedMarkets,
    customMarketName, setCustomMarketName,
    customMarketReason, setCustomMarketReason,
    manualMarketEvaluation, setManualMarketEvaluation,
    manualAlternative, setManualAlternative,
    activeLocationCandidates, finalSelectedMarket,
    locationSourceLabel,
    locationRegionLabel, locationHelpText,
    locationRecommendedLabel, locationDirectLabel,
    locationInputPlaceholder, customLocationLabel,
    customLocationPlaceholder, customLocationReasonPlaceholder,
    scoreLocationLabel, selectedLocationDetailLabel,
    // Contract
    selectedContractTaskId, setSelectedContractTaskId,
    contractText, setContractText,
    contractAnalysisStatus, contractAnalysisError, contractAnalysis, setContractAnalysis,
    contractTasks, activeContractTask, activeContractTaskDetail,
    handleContractTaskToggle, handleContractContinue, handleContractAnalysis,
    // Finance
    showFinancePanel, setShowFinancePanel,
    financeCapitalText, setFinanceCapitalText,
    financeMonthlyRentText, setFinanceMonthlyRentText,
    financeLaborText, setFinanceLaborText,
    financeRevenueText, setFinanceRevenueText,
    financeMarketStyle, setFinanceMarketStyle,
    financeRentBand, setFinanceRentBand,
    financeStatus, financeError, financeResult, financeInterpretation,
    handleRunFinancialSimulation,
    // Guide Q&A
    selectedGuideSectionKey, setSelectedGuideSectionKey,
    guideQuestion, setGuideQuestion,
    guideQaStatus, guideQaError, guideAnswer, setGuideAnswer,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError, setKnowledgeQaError,
    handleGuideQuestion, handleKnowledgeQuestion,
    // Stage guide
    stageGuideContent, guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,
    // Knowledge
    permitGuides, taxGuides, loanGuides,
    hasPermitGuide, hasTaxGuide, hasLoanGuide,
    // Vendor / ops
    vendorSelections, setVendorSelections,
    vendorCustomInputs, setVendorCustomInputs,
    opsSelections, setOpsSelections,
    opsPosChecks, setOpsPosChecks,
    opsStep, setOpsStep,
    // Soft open
    softOpenChecks, setSoftOpenChecks,
    softOpenPricing, setSoftOpenPricing,
    softOpenStep, setSoftOpenStep,
    softOpenSkips, setSoftOpenSkips,
    // Tax / loan checks
    taxChecks, setTaxChecks, loanChecks, setLoanChecks,
    // Decisions / tasks / roadmap
    decisions, taskMap, roadmap,
    // Interior
    selectedInteriorConcept, setSelectedInteriorConcept,
    contractors, contractorsLoading, contractorsRetryKey, setContractorsRetryKey,
    // CPA
    cpaDecision, setCpaDecision,
    // Computed
    completedCount, businessCtx, correctedProgressPercent,
    startupSummary, selectedIndustryLabel,
    // Active guide
    activeGuide, activeGuideSections, activeGuideSection,
    activeGuideFreshness, activeGuideActionLabel, activeGuideEmptyLabel,
    guideDecisionKey,
    // Saved snapshots
    savedFinanceSnapshot, savedContractSnapshot, savedGuideQaSnapshot,
    effectiveContractAnalysis, effectiveGuideAnswer, financeDefaults,
    // Handlers
    handleTaskToggle, handleStageContinue, handleLaunchBusiness,
    handleVerificationContinue,
    openFinanceFromSummary,
    // Save
    saveStatus, setSaveStatus,
    // Reset
    resetDemo,
    // Local stage state (from context)
    filterCat, setFilterCat, expandedId, setExpandedId,
    competitorResults, setCompetitorResults, competitorLoading, setCompetitorLoading,
    bpLoading, setBpLoading, bpSections, setBpSections, bpSummary, setBpSummary,
    bpError, setBpError, bpExpandedIdx, setBpExpandedIdx,
    onboardingDismissed, setOnboardingDismissed,
    progFilter, setProgFilter,
    liveProgramsData, setLiveProgramsData, liveProgramsLoading, setLiveProgramsLoading,
    liveMarketInsights, setLiveMarketInsights,
    regPage, setRegPage,
    livePermitInsights, setLivePermitInsights,
    liveBudgetBenchmark, setLiveBudgetBenchmark,
  } = d;

  // ── 로컬 상태 (DashboardContext에 포함되지 않는 것들) ──
  const [mvpPage, setMvpPage] = useState(0);
  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);
  const [insuranceTaxPage, setInsuranceTaxPage] = useState(0);
  const [interiorGuidesData, setInteriorGuidesData] = useState<{ materials: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }>; concepts: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }> } | null>(null);
  const [interiorGuidesLoaded, setInteriorGuidesLoaded] = useState(false);
  const [mvpToolsOpen, setMvpToolsOpen] = useState(false);

  // Computed locals (originally defined in the parent component)
  const isStartupCategory = industryCategoryId === "startup-tech";
  const startupTypeOptions: Array<"independent" | "franchise" | "undecided"> = isStartupCategory
    ? ["independent", "undecided"]
    : ["independent", "franchise", "undecided"];

  return (
    <>
      {businessLaunched && !viewingStageId ? (() => {
          const ko = language === "ko";
          const currentMonth = new Date().toISOString().slice(0, 7);
          type DE2 = { date: string; sales: number; customers: number };
          const me2 = (dailyEntries as DE2[]).filter(e => e.date.startsWith(currentMonth));
          const ts2 = me2.reduce((s, e) => s + e.sales, 0);
          const tc2 = me2.reduce((s, e) => s + e.customers, 0);
          const wd2 = me2.length;
          const ads2 = wd2 > 0 ? Math.round(ts2 / wd2) : 0;
          const at2 = tc2 > 0 ? Math.round(ts2 / tc2) : 0;
          const mc2 = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
          const totalCosts2 = mc2.ingredients + mc2.labor + mc2.rent + mc2.utilities + mc2.other;
          const netProfit2 = ts2 - totalCosts2;
          const fmt2 = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;
          const today2 = new Date().toISOString().slice(0, 10);
          const todayEntry2 = (dailyEntries as DE2[]).find(e => e.date === today2);
          const inputStyle2 = { border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none", background: "rgba(255,255,255,0.8)", width: "100%", boxSizing: "border-box" as const };
          return (
            <section style={styles.section}>
              <div style={styles.sectionTitle}>{storeName || (ko ? "내 가게 운영" : "My Store")}</div>

              {/* 이번 달 핵심 지표 */}
              <article style={{ ...styles.card, gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                    {ko ? `${new Date().getMonth() + 1}월 현황` : `${new Date().toLocaleString("en", { month: "long" })} status`}
                  </div>
                  <button type="button" style={{ fontSize: "12px", color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => navigateToSurface("analytics")}>
                    {ko ? "전체 보기 →" : "Full view →"}
                  </button>
                </div>
                {ts2 === 0 ? (
                  <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
                    {ko ? "이번 달 매출 기록이 없습니다. 아래에서 오늘 매출을 입력하세요." : "No entries this month. Add today's sales below."}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      {[
                        { label: ko ? "이번달 매출" : "Monthly sales", value: fmt2(ts2) },
                        { label: ko ? "하루 평균" : "Daily avg", value: fmt2(ads2) },
                        { label: ko ? "객단가" : "Avg ticket", value: at2 > 0 ? fmt2(at2) : "—" },
                      ].map(item => (
                        <div key={item.label} style={{ background: "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "12px 10px" }}>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{item.label}</div>
                          <div style={{ fontSize: "15px", fontWeight: 700 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {totalCosts2 > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: netProfit2 >= 0 ? "rgba(52,199,89,0.08)" : "rgba(255,59,48,0.08)" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>{ko ? "예상 손익" : "Est. profit"}</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: netProfit2 >= 0 ? "#34c759" : "#ff3b30" }}>{netProfit2 >= 0 ? "+" : ""}{fmt2(netProfit2)}</span>
                      </div>
                    )}
                  </>
                )}
              </article>

              {/* 오늘 매출 입력 */}
              <article style={{ ...styles.card, gap: "14px" }}>
                {todayEntry2 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34c759", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>
                      {ko ? `오늘 입력 완료 — ${fmt2(todayEntry2.sales)}` : `Today logged — ${fmt2(todayEntry2.sales)}`}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                    {ko ? "오늘 매출 입력" : "Log today's sales"}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="date" value={dailyDateInput} onChange={(e) => setDailyDateInput(e.target.value)} style={{ ...inputStyle2, width: "auto", flex: 1 }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" inputMode="numeric" value={dailySalesInput} onChange={(e) => setDailySalesInput(e.target.value.replace(/[^0-9]/g, ""))} placeholder={ko ? "매출 (예: 45)" : "Sales (e.g. 45)"} style={{ ...inputStyle2, flex: 1 }} />
                  <input type="text" inputMode="numeric" value={dailyCustomersInput} onChange={(e) => setDailyCustomersInput(e.target.value.replace(/[^0-9]/g, ""))} placeholder={ko ? "고객 수 (예: 32)" : "Customers (e.g. 32)"} style={{ ...inputStyle2, flex: 1 }} />
                </div>
                <button type="button" style={{ ...styles.primaryButton, opacity: dailySalesInput ? 1 : 0.45 }} onClick={handleAddDailyEntry} disabled={!dailySalesInput}>
                  {ko ? "기록하기" : "Save entry"}
                </button>
                {me2.slice(0, 5).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px", marginTop: "4px" }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{ko ? "최근 기록" : "Recent"}</div>
                    {me2.slice(0, 5).map((e) => (
                      <div key={e.date} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.03)", fontSize: "13px" }}>
                        <span style={{ color: "var(--muted)" }}>{e.date.slice(5).replace("-", "/")}</span>
                        <span style={{ fontWeight: 600 }}>{fmt2(e.sales)}</span>
                        <span style={{ color: "var(--muted)" }}>{e.customers > 0 ? `${e.customers}명 · ${fmt2(e.sales / e.customers)}` : "-"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              {/* 퀵 링크 */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" style={{ ...styles.primaryButton, flex: 1 }} onClick={() => navigateToSurface("analytics")}>
                  {ko ? "내 가게 현황 전체 보기" : "Full store analytics"}
                </button>
                <button type="button" style={{ ...styles.button, width: "fit-content" }} onClick={() => navigateToSurface("roadmap")}>
                  {ko ? "로드맵" : "Roadmap"}
                </button>
              </div>
            </section>
          );
        })() : allStagesDone ? (() => {
          const ko = language === "ko";
          return (
            <section style={styles.section}>
              <div style={styles.sectionTitle}>{ko ? "로드맵 완료" : "Roadmap Complete"}</div>
              <article style={{
                background: "rgba(255,255,255,0.92)",
                borderRadius: "20px",
                border: "1px solid rgba(0,0,0,0.08)",
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                textAlign: "center" as const,
                gap: "0",
              }}>
                {/* 완료 아이콘 */}
                <div style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  background: "rgba(52,199,89,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "24px",
                }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="18" fill="#34c759"/>
                    <path d="M10 18L15.5 24L26 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <div style={{ fontSize: "26px", fontWeight: 720, letterSpacing: "-0.5px", color: "var(--primary)", marginBottom: "10px" }}>
                  {ko ? `${pathTotalStages}단계 모두 완료했습니다` : `All ${pathTotalStages} stages complete`}
                </div>
                <div style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.65, maxWidth: "420px", marginBottom: "32px" }}>
                  {ko
                    ? "창업 준비의 모든 단계를 마쳤습니다. 이제 내 가게를 본격적으로 운영하거나, 로드맵을 다시 살펴볼 수 있습니다."
                    : "You've completed every step of your startup journey. Head to your store dashboard or review your roadmap."}
                </div>

                {/* 진행률 바 */}
                <div style={{ width: "100%", maxWidth: "320px", marginBottom: "32px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                      {ko ? "진행률" : "Progress"}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#34c759" }}>100%</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "100%", background: "#34c759", borderRadius: "999px" }} />
                  </div>
                </div>

                {/* CTA 버튼 */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBusinessLaunched(true);
                      localStorage.setItem("businessLaunched", "true");
                      if (!localStorage.getItem("businessLaunchedDate")) {
                        localStorage.setItem("businessLaunchedDate", new Date().toISOString().slice(0, 10));
                      }
                      if (!storeName && selectedFranchiseBrandId) {
                        const fb = getFranchiseBrandById(selectedFranchiseBrandId);
                        if (fb) { setStoreName(fb.name[language]); localStorage.setItem("storeName", fb.name[language]); }
                      }
                      navigateToSurface("analytics");
                    }}
                    style={{
                      padding: "13px 28px", borderRadius: "999px",
                      background: "#007aff", color: "#fff",
                      border: "none", fontSize: "15px", fontWeight: 700,
                      cursor: "pointer", letterSpacing: "-0.2px",
                    }}
                  >
                    {ko ? "내 가게 대시보드로 이동" : "Go to My Store"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToSurface("roadmap")}
                    style={{
                      padding: "13px 24px", borderRadius: "999px",
                      background: "transparent", color: "var(--primary)",
                      border: "1px solid rgba(0,0,0,0.14)", fontSize: "15px", fontWeight: 600,
                      cursor: "pointer", letterSpacing: "-0.1px",
                    }}
                  >
                    {ko ? "로드맵 다시 보기" : "Review Roadmap"}
                  </button>
                </div>

                {/* 완료한 단계 수 뱃지 */}
                <div style={{ marginTop: "28px", display: "flex", gap: "20px" }}>
                  {[
                    { label: ko ? "완료 단계" : "Stages done", value: `${pathTotalStages}` },
                    { label: ko ? "소요 기간" : "Journey", value: ko ? "창업 준비 완료" : "Ready to launch" },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "18px", fontWeight: 720, color: "#34c759", letterSpacing: "-0.3px" }}>{item.value}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", fontWeight: 500 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          );
        })() : (
      <section style={styles.section}>
        <div style={styles.sectionTitle}>{copy.home.today}</div>
        <article style={styles.currentStage}>
          {/* 프로그레시브 바 + 단계 정보 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "2px" }}>
            <div style={{ flex: 1, display: "flex", gap: "3px" }}>
              {Array.from({ length: pathTotalStages }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: "4px", borderRadius: "2px",
                  background: i < (currentStage.stepNumber ?? 0) ? "var(--primary, #1d3557)" : i === (currentStage.stepNumber ?? 0) ? "rgba(29,53,87,0.35)" : "rgba(0,0,0,0.06)",
                  transition: "background 0.3s ease",
                }} />
              ))}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.4)", whiteSpace: "nowrap" as const, fontVariantNumeric: "tabular-nums" }}>
              {currentStage.stepNumber}/{pathTotalStages} · {formatStageType(currentStage.type, language)}
            </span>
          </div>
          <div style={styles.currentTitle}>{localizedCurrentStage.title}</div>
          <div style={styles.currentBody}>
            {localizedCurrentStage.goal}
          </div>
          {transitionNotice ? (
            <div style={styles.transitionNotice}>
              <div style={styles.transitionNoticeTitle}>{transitionNotice.title}</div>
              <div style={styles.transitionNoticeBody}>{transitionNotice.body}</div>
            </div>
          ) : null}

          {isFreshAccount ? null : (
            <>
              <div style={styles.currentActionRail}>
                <button type="button" style={styles.currentUtilityButton} onClick={() => navigateToSurface("roadmap")}>
                  {language === "ko" ? "전체 로드맵" : "Roadmap"}
                </button>
                <button type="button" style={styles.currentStateChip}>
                  {persistenceLabel}
                </button>
              </div>
              {isViewingPastStage ? (
                <div style={{
                  padding: "10px 16px",
                  borderRadius: "14px",
                  background: "rgba(29,53,87,0.06)",
                  border: "1px solid rgba(29,53,87,0.12)",
                  fontSize: "13px",
                  color: "var(--primary)",
                  fontWeight: 500
                }}>
                  {language === "ko" ? "이전 단계 보는 중" : "Viewing a past step"}
                </div>
              ) : null}
            </>
          )}

          {currentStage.code === "industry_selection" ? (
            <>
              <div style={styles.helper}>
                {copy.home.chooseIndustryHelp}
              </div>
              <div style={styles.categoryTabBar}>
                {starterIndustryCategories.map((rawCategory) => {
                  const category = localizeStarterIndustryCategory(rawCategory, language);
                  return (
                  <button
                    key={rawCategory.id}
                    type="button"
                    style={{
                      ...styles.categoryTab,
                      ...(selectedIndustryCategoryId === rawCategory.id ? styles.categoryTabSelected : {})
                    }}
                    onClick={() => {
                      setSelectedIndustryCategoryId(rawCategory.id);
                      setSelectedIndustryId(undefined);
                    }}
                  >
                    {category.title}
                  </button>
                )})}
              </div>
              <div style={styles.optionGrid}>
                {(() => {
                  // 업종별 아이콘 (SF Symbol 스타일 SVG)
                  const industryIcons: Record<string, string> = {
                    // food — Material Design Icons (viewBox: 0 -960 960 960)
                    "korean-casual": "MAT:M280-80v-366q-51-14-85.5-56T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 56-34.5 98T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z",  // restaurant (한식 — 뚝배기/수저)
                    "delivery-meals": "MAT:M195-235q-35-35-35-85H80v-120q0-66 47-113t113-47h160v200h140l140-174v-106H560v-80h120q33 0 56.5 23.5T760-680v134L580-320H400q0 50-35 85t-85 35q-50 0-85-35Zm125-165Zm-11.5 108.5Q320-303 320-320h-80q0 17 11.5 28.5T280-280q17 0 28.5-11.5ZM200-640v-80h200v80H200Zm475 405q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35Zm113.5-56.5Q800-303 800-320t-11.5-28.5Q777-360 760-360t-28.5 11.5Q720-337 720-320t11.5 28.5Q743-280 760-280t28.5-11.5ZM160-400h160v-120h-80q-33 0-56.5 23.5T160-440v40Z",  // delivery_dining (배달)
                    "salad-healthy": "MAT:M216-176q-45-45-70.5-104T120-402q0-63 24-124.5T222-642q35-35 86.5-60t122-39.5Q501-756 591.5-759t202.5 7q8 106 5 195t-16.5 160.5q-13.5 71.5-38 125T684-182q-53 53-112.5 77.5T450-80q-65 0-127-25.5T216-176Zm112-16q29 17 59.5 24.5T450-160q46 0 91-18.5t86-59.5q18-18 36.5-50.5t32-85Q709-426 716-500.5t2-177.5q-49-2-110.5-1.5T485-670q-61 9-116 29t-90 55q-45 45-62 89t-17 85q0 59 22.5 103.5T262-246q42-80 111-153.5T534-520q-72 63-125.5 142.5T328-192Z",  // eco (샐러드/건강식)
                    "ramen-noodle": "MAT:M400-160h160v-44l50-20q65-26 110.5-72.5T786-400H174q20 57 65 103.5T350-224l50 20v44Zm-80 80v-70q-107-42-173.5-130T80-480h80v-320l720-80v60l-460 52v68h460v60H420v160h460q0 112-66.5 200T640-150v70H320Zm0-620h40v-62l-40 5v57Zm-100 0h40v-50l-40 4v46Zm100 220h40v-160h-40v160Zm-100 0h40v-160h-40v160Zm260 80Z",  // ramen_dining (면/국밥)
                    "chicken-burger": "MAT:M160-120q-33 0-56.5-23.5T80-200v-120h800v120q0 33-23.5 56.5T800-120H160Zm0-120v40h640v-40H160Zm263-160q-21 20-77 20t-76-20q-20-20-56-20t-57 20q-21 20-77 20v-80q36 0 57-20t77-20q56 0 76 20t56 20q36 0 57-20t77-20q56 0 77 20t57 20q36 0 56-20t76-20q56 0 79 20t55 20v80q-56 0-75-20t-55-20q-36 0-58 20t-78 20q-56 0-77-20t-57-20q-36 0-57 20ZM80-560v-40q0-115 108.5-177.5T480-840q183 0 291.5 62.5T880-600v40H80Zm400-200q-124 0-207.5 31T166-640h628q-23-58-106.5-89T480-760Z",  // lunch_dining (치킨/버거)
                    "western-pasta-brunch": "MAT:m160-120-80-80h800l-80 80H160Zm-40-120q6-18 16-34t24-30v-296h-40v-60h40v-30h-40v-60h40v-30h-40v-60h280q33 0 56.5 23.5T480-760v10h360v60H480v10q0 33-23.5 56.5T400-600h-80v244q14 2 28 6t26 12q26-65 83-103.5T583-480q90 0 153.5 61.5T800-268v28H120Zm334-80h252q-17-36-50-58t-73-22q-42 0-77 21t-52 59ZM320-750h80v-30h-80v30Zm0 90h80v-30h-80v30Zm-100-90h40v-30h-40v30Zm0 90h40v-30h-40v30Zm0 314q10-5 19.5-7.5T260-358v-242h-40v254Zm360 26Z",  // dinner_dining (양식/스테이크)
                    // cafe — 컵, 원두, 디저트
                    "takeout-coffee": "MAT:M160-120v-80h640v80H160Zm160-160q-66 0-113-47t-47-113v-400h640q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Zm0-80h240q33 0 56.5-23.5T640-440v-320H240v320q0 33 23.5 56.5T320-360Zm400-280h80v-120h-80v120Z",  // local_cafe
                    "specialty-coffee": "MAT:M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h560v80h-80v80q0 17-11.5 28.5T680-680H360q-17 0-28.5-11.5T320-720v-80h-80v640h162q-38-27-60-68.5T320-320v-200h400v200q0 50-22 91.5T638-160h162v80H240Zm280-120q50 0 85-35t35-85v-120H400v120q0 50 35 85t85 35Z",  // coffee_maker
                    "dessert-cafe": "MAT:M160-80q-17 0-28.5-11.5T120-120v-200q0-33 23.5-56.5T200-400v-160q0-33 23.5-56.5T280-640h160v-58q-18-12-29-29t-11-41q0-15 6-29.5t18-26.5l56-56 56 56q12 12 18 26.5t6 29.5q0 24-11 41t-29 29v58h160q33 0 56.5 23.5T760-560v160q33 0 56.5 23.5T840-320v200q0 17-11.5 28.5T800-80H160Z",  // cake
                    "bakery-studio": "MAT:M804-282q17 9 30-4t4-30l-58-108-42 108 66 34Zm-200-38h48l96-238q3-8-1.5-13.5T736-580l-80-32q-9-3-17.5 2T628-596l-24 276Zm-296 0h48l-24-276q-2-11-10.5-15t-17.5-1l-80 32q-8 3-11.5 8.5T212-558l96 238Zm-152 38 66-34-42-108-58 108q-9 17 4 30t30 4Zm280-38h88l30-338q2-9-4.5-15.5T534-680H426q-8 0-14.5 6.5T406-658l30 338Z",  // bakery_dining
                    "icecream-bingsu": "MAT:M482-40 294-400q-71 3-122.5-41T120-560q0-51 29.5-92t74.5-58q18-91 89.5-150.5T480-920q95 0 166.5 59.5T736-710q45 17 74.5 58t29.5 92q0 75-53 119t-119 41L482-40Z",  // icecream
                    "self-serve-cafe": "MAT:M280-640q-33 0-56.5-23.5T200-720v-80q0-33 23.5-56.5T280-880h400q33 0 56.5 23.5T760-800v80q0 33-23.5 56.5T680-640H280Zm0-80h400v-80H280v80ZM160-80q-33 0-56.5-23.5T80-160v-40h800v40q0 33-23.5 56.5T800-80H160ZM80-240l139-313q10-22 30-34.5t43-12.5h376q23 0 43 12.5t30 34.5l139 313H80Z",  // point_of_sale
                    // retail — 가방, 선반, 상점
                    "convenience-small": "MAT:M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Z",  // storefront
                    "lifestyle-goods": "MAT:M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720Z",                                                   // 쇼핑백 + 하트
                    "beauty-supplies": "MAT:M480-80q-73-9-145-39.5T206.5-207Q150-264 115-351T80-560v-40h40q51 0 105 13t101 39q12-86 54.5-176.5T480-880q57 65 99.5 155.5T634-548q47-26 101-39t105-13h40v40q0 122-35 209t-91.5 144q-56.5 57-128 87.5T480-80Z",                     // 화장품 병
                    "fashion-accessories": "MAT:M120-160q-17 0-28.5-11.5T80-200q0-10 4-18.5T96-232l344-258v-70q0-17 12-28.5t29-11.5q25 0 42-18t17-43q0-25-17.5-42T480-720q-25 0-42.5 17.5T420-660h-80q0-58 41-99t99-41q58 0 99 40.5t41 98.5q0 47-27.5 84T520-526v36l344 258q8 5 12 13.5t4 18.5q0 17-11.5 28.5T840-160H120Z",                // 옷걸이/가방
                    "health-food-store": "MAT:M281.5-201.5Q200-283 200-400q0-94 55.5-168.5T401-669q-20-5-39-14.5T328-708q-33-33-42.5-78.5T281-879q47-5 92.5 4.5T452-832q23 23 33.5 52t13.5 61q13-31 31.5-58.5T572-828q11-11 28-11t28 11q11 11 11 28t-11 28q-22 22-39 48.5T564-667q88 28 142 101.5T760-400q0 117-81.5 198.5T480-120q-117 0-198.5-81.5Z",                                        // 건강식품 병
                    "unmanned-retail": "MAT:M120-200q-33 0-56.5-23.5T40-280v-400q0-33 23.5-56.5T120-760h124q7-18 22-29t34-11h80q19 0 34 11t22 29h404q33 0 56.5 23.5T920-680v400q0 33-23.5 56.5T840-200H120Z", // 무인 키오스크
                    // beauty — 가위, 브러시, 거울
                    "hair-salon": "MAT:M760-120 480-400l-94 94q8 15 11 32t3 34q0 66-47 113T240-80q-66 0-113-47T80-240q0-66 47-113t113-47q17 0 34 3t32 11l94-94-94-94q-15 8-32 11t-34 3q-66 0-113-47T80-720q0-66 47-113t113-47q66 0 113 47t47 113q0 17-3 34t-11 32l494 494v40H760Z",  // content_cut (가위)
                    "nail-studio": "MAT:M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm230-160L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Z",  // brush (브러시/네일)
                    "skin-care-room": "MAT:M324.5-324.5Q310-339 310-360t14.5-35.5Q339-410 360-410t35.5 14.5Q410-381 410-360t-14.5 35.5Q381-310 360-310t-35.5-14.5Zm240 0Q550-339 550-360t14.5-35.5Q579-410 600-410t35.5 14.5Q650-381 650-360t-14.5 35.5Q621-310 600-310t-35.5-14.5ZM480-80q134 0 227-93t93-227q0-24-3-46.5T786-490q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-628q-32 78-91.5 135.5T160-406v6q0 134 93 227t227 93Z",                          // 얼굴/스파
                    "waxing-studio": "MAT:M480-80q-73-9-145-39.5T206.5-207Q150-264 115-351T80-560v-40h40q51 0 105 13t101 39q12-86 54.5-176.5T480-880q57 65 99.5 155.5T634-548q47-26 101-39t105-13h40v40q0 122-35 209t-91.5 144q-56.5 57-128 87.5T480-80Z",                                       // 왁싱 추상
                    "eyelash-brow": "MAT:M480-320q-75 0-127.5-52.5T300-500q0-75 52.5-127.5T480-680t127.5 52.5Q660-575 660-500t-52.5 127.5T480-320Zm0-72q46 0 77-31t31-77-31-77-77-31-77 31-31 77 31 77 77 31ZM480-500ZM480-200q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z",          // 눈
                    "makeup-bridal": "MAT:M324.5-324.5Q310-339 310-360t14.5-35.5Q339-410 360-410t35.5 14.5Q410-381 410-360t-14.5 35.5Q381-310 360-310t-35.5-14.5Zm240 0Q550-339 550-360t14.5-35.5Q579-410 600-410t35.5 14.5Q650-381 650-360t-14.5 35.5Q621-310 600-310t-35.5-14.5ZM480-80q134 0 227-93t93-227q0-24-3-46.5T786-490q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-628q-32 78-91.5 135.5T160-406v6q0 134 93 227t227 93Z",                                  // 거울/화장대
                    // fitness — 운동 기구
                    "pilates-studio": "MAT:M272-160q-30 0-51-21t-21-51q0-21 12-39.5t32-26.5l156-62v-90q-54 63-125.5 96.5T120-320v-80q68 0 123.5-28T344-508l54-64q12-14 28-21t34-7h40q18 0 34 7t28 21l54 64q45 52 100.5 80T840-400v80q-83 0-154.5-33.5T560-450v90l156 62q20 8 32 26.5t12 39.5q0 30-21 51t-51 21H400v-20q0-26 17-43t43-17h120q9 0 14.5-5.5T600-260q0-9-5.5-14.5T580-280H460q-42 0-71 29t-29 71v20h-88Z",                                       // 필라테스 자세
                    "pt-gym": "MAT:m536-84-56-56 142-142-340-340-142 142-56-56 56-58-56-56 84-84-56-58 56-56 58 56 84-84 56 56 58-56 56 56-142 142 340 340 142-142 56 56-56 58 56 56-84 84 56 58-56 56-58-56-84 84-56-56-58 56Z",  // fitness_center
                    "yoga-studio": "MAT:m400-80-20-360-127-73-14 52 81 141-69 40-99-170 48-172 230-132-110-110 56-56 184 183-144 83 48 42 328-268 48 56-340 344-20 400h-80ZM200-680q-33 0-56.5-23.5T120-760q0-33 23.5-56.5T200-840q33 0 56.5 23.5T280-760q0 33-23.5 56.5T200-680Z",                                         // 요가 자세
                    "crossfit-box": "MAT:m826-585-56-56 30-31-128-128-31 30-57-57 30-31q23-23 57-22.5t57 23.5l129 129q23 23 23 56.5T857-615l-31 30ZM346-104q-23 23-56.5 23T233-104L104-233q-23-23-23-56.5t23-56.5l30-30 57 57-31 30 129 129 30-31 57 57-30 30Z",                                    // 무거운 바벨
                    "golf-studio": "MAT:M440-80v-40q0-33-23.5-56.5T360-200h-80v-80h400v80h-80q-33 0-56.5 23.5T520-120v40h-80Zm40-520Zm0 120q-66 0-113-47t-47-113 47-113 113-47 113 47 47 113-47 113-113 47Z",                                     // 골프 공+티
                    "unmanned-fitness": "MAT:m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z",                            // 24시간 운동기구
                    // education — 책, 연필, 학교
                    "study-room": "MAT:M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Z",  // school
                    "kids-academy": "MAT:M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Z",  // school (학교)
                    "adult-class": "MAT:M480-160q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740v484q51-32 107-48t113-16q36 0 70.5 6t69.5 18v-480q15 5 29.5 10.5T898-752q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Z",                                                     // 책상+창문(교실)
                    "language-academy": "MAT:m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Z",                                          // 언어(가나다/ABC)
                    "coding-class": "MAT:M320-240 80-480l240-240 57 57-184 184 183 183-56 56Zm320 0-57-57 184-184-183-183 56-56 240 240-240 240Z",                                                             // 코드 꺽쇠 + 슬래시
                    "small-study-room": "MAT:M560-564v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Z",                    // 책상+의자
                    // pet — 발바닥, 뼈, 동물
                    "pet-grooming": "MAT:M180-475q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm109-189q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29Zm240 0q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29Zm251 189q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM266-75q-45 0-75.5-34.5T160-191q0-52 35.5-91t70.5-77q29-31 50-67.5t50-68.5q22-26 51-43t63-17q34 0 63 16t51 42q28 32 49.5 69t50.5 69q35 38 70.5 77t35.5 91q0 47-30.5 81.5T694-75q-54 0-107-9t-107-9q-54 0-107 9t-107 9Z",  // pets (발바닥)
                    "pet-supplies": "MAT:M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Z",                              // 사료 봉투
                    "pet-hotel": "MAT:M200-160v-366L88-440l-48-64 440-336 160 122v-82h120v174l160 122-48 64-112-86v366H520v-240h-80v240H200Z",                                                               // 집(펫호텔)
                    "pet-cafe": "MAT:M160-120v-80h640v80H160Zm160-160q-66 0-113-47t-47-113v-400h640q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Z",                                      // 컵(펫카페)
                    "pet-training-school": "MAT:M206-206q-41-48-63.5-107.5T120-440q0-150 105-255t255-105h8l-64-64 56-56 160 160-160 160-57-57 63-63h-6q-116 0-198 82t-82 198q0 51 16.5 96t46.5 81l-57 57Z",                                     // 학교+발바닥
                    "pet-walking-visit": "MAT:m280-40 112-564-72 28v136h-80v-188l202-86q14-6 29.5-7t29.5 4q14 5 26.5 14t20.5 23l40 64q26 42 70.5 69T760-520v80q-70 0-125-29t-94-74l-25 123 84 80v300h-80v-260l-84-64-72 324h-84Z",                       // 산책하는 사람
                    // living — 도구, 서비스
                    "laundry-service": "MAT:M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640H240v640Zm241.5-98.5Q540-317 540-400t-58.5-141.5Q480-600 480-600t-141.5 58.5Q280-483 280-400t58.5 141.5Z", // 세탁기
                    "cleaning-service": "MAT:M120-40v-280q0-83 58.5-141.5T320-520h40v-320q0-33 23.5-56.5T440-920h80q33 0 56.5 23.5T600-840v320h40q83 0 141.5 58.5T840-320v280H120Z",                                               // 빗자루
                    "repair-service": "MAT:M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z", // 렌치
                    "self-laundry": "MAT:M280-80v-240h-64q-40 0-68-28t-28-68q0-29 16-53.5t42-36.5l262-116v-26q-36-13-58-43.5T360-760q0-50 35-85t85-35q50 0 85 35t35 85h-80q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760q0 17 11.5 28.5T480-720t28.5 11.5Q520-697 520-680v58l262 116q26 12 42 36.5t16 53.5q0 40-28 68t-68 28h-64v240H280Z", // 코인세탁기
                    "print-copy": "MAT:M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Z",  // 프린터
                    "device-repair": "MAT:M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v124q18 7 29 22t11 34v80q0 19-11 34t-29 22v404q0 33-23.5 56.5T680-40H280Z",               // 스마트폰
                    // space — 건물, 방
                    "guesthouse": "MAT:M40-200v-600h80v400h320v-320h320q66 0 113 47t47 113v360h-80v-120H120v120H40Z",                                                             // 게스트하우스
                    "rental-studio": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Z",    // 카메라/스튜디오
                    "party-room": "MAT:m80-80 200-560 360 360L80-80Zm132-132 282-100-182-182-100 282Z", // 파티 (스파클)
                    "study-cafe-space": "MAT:M160-120v-80h640v80H160Zm160-160q-66 0-113-47t-47-113v-400h640q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Z",                // 스터디카페 컵+책
                    "shared-office": "MAT:M120-120v-560h160v-160h400v320h160v400H520v-160h-80v160H120Zm80-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 320h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h80v-80h-80v80Zm0-160h80v-80h-80v80Z",            // 빌딩
                    "practice-room": "MAT:M287-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47q-66 0-113-47Z",                   // 음표
                    // online — 화면, 카트, 클라우드
                    "smart-store": "MAT:M223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Z",            // 스마트스토어 화면
                    "digital-products": "MAT:M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q17-72 85-137t145-65q33 0 56.5 23.5T520-716v242l64-62 56 56-160 160-160-160 56-56 64 62v-242q-76 14-118 73.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-48-22-89.5T600-680v-93q74 35 117 103.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H260Z",                  // 클라우드 다운로드
                    "creator-service": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Z",  // 영상 카메라
                    "consignment-commerce": "MAT:M155-195q-35-35-35-85H40v-440q0-33 23.5-56.5T120-800h560v160h120l120 160v200h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85H360q0 50-35 85t-85 35q-50 0-85-35Z",           // 장바구니
                    "newsletter-membership": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200Z",         // 봉투/메일
                    "global-buying": "MAT:M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z", // 지구본
                    // startup — 기술, 코드, 차트
                    "ai-application": "MAT:m760-600-50-110-110-50 110-50 50-110 50 110 110 50-110 50-50 110Zm0 560-50-110-110-50 110-50 50-110 50 110 110 50-110 50-50 110ZM360-160 260-380 40-480l220-100 100-220 100 220 220 100-220 100-100 220Z",                                            // AI 스파크
                    "developer-tools": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Zm140-40-56-56 103-104-104-104 57-56 160 160-160 160Zm180 0v-80h240v80H480Z",                                                          // 코드 </>
                    "b2b-saas": "MAT:M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Z",              // 대시보드
                    "fintech-startup": "MAT:M200-280v-280h80v280h-80Zm240 0v-280h80v280h-80ZM80-120v-80h800v80H80Zm600-160v-280h80v280h-80ZM80-640v-80l400-200 400 200v80H80Z",                                          // 달러 기호
                    "healthtech-startup": "MAT:M80-600v-120q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v120h-80v-120H160v120H80Zm80 440q-33 0-56.5-23.5T80-240v-120h80v120h640v-120h80v120q0 33-23.5 56.5T800-160H160Zm261-125.5q10-5.5 15-16.5l124-248 44 88q5 11 15 16.5t21 5.5h240v-80H665l-69-138q-5-11-15-15.5t-21-4.5q-11 0-21 4.5T524-658L400-410l-44-88q-5-11-15-16.5t-21-5.5H80v80h215l69 138q5 11 15 16.5t21 5.5q11 0 21-5.5Z",                                                                             // 십자가 (의료)
                    "security-startup": "MAT:M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q97-30 162-118.5T718-480H480v-315l-240 90v207q0 7 2 18h238v316Z",                                                   // 방패
                  };

                  // 업종별 테마 색상
                  const industryColors: Record<string, string> = {
                    // food — warm orange/red tones
                    "korean-casual": "#e25822", "delivery-meals": "#d94f00", "salad-healthy": "#16a34a",
                    "ramen-noodle": "#c2410c", "chicken-burger": "#dc2626", "western-pasta-brunch": "#b45309",
                    // cafe — brown/warm tones
                    "takeout-coffee": "#92400e", "specialty-coffee": "#78350f", "dessert-cafe": "#db2777",
                    "bakery-studio": "#a16207", "icecream-bingsu": "#0891b2", "self-serve-cafe": "#6366f1",
                    // retail — blue/teal
                    "convenience-small": "#0d9488", "lifestyle-goods": "#7c3aed", "beauty-supplies": "#db2777",
                    "fashion-accessories": "#9333ea", "health-food-store": "#16a34a", "unmanned-retail": "#4f46e5",
                    // beauty — pink/rose
                    "hair-salon": "#be185d", "nail-studio": "#e11d48", "skin-care-room": "#ec4899",
                    "waxing-studio": "#d946ef", "eyelash-brow": "#c026d3", "makeup-bridal": "#a21caf",
                    // fitness — energetic blues/greens
                    "pilates-studio": "#0ea5e9", "pt-gym": "#1d4ed8", "yoga-studio": "#0d9488",
                    "crossfit-box": "#dc2626", "golf-studio": "#059669", "unmanned-fitness": "#6366f1",
                    // education — calm blues
                    "study-room": "#2563eb", "kids-academy": "#f59e0b", "adult-class": "#7c3aed",
                    "language-academy": "#0891b2", "coding-class": "#4f46e5", "small-study-room": "#1d4ed8",
                    // pet — warm friendly
                    "pet-grooming": "#ea580c", "pet-supplies": "#16a34a", "pet-hotel": "#0891b2",
                    "pet-cafe": "#92400e", "pet-training-school": "#d97706", "pet-walking-visit": "#059669",
                    // living — functional teal/gray
                    "laundry-service": "#0d9488", "cleaning-service": "#2563eb", "repair-service": "#b45309",
                    "self-laundry": "#0891b2", "print-copy": "#64748b", "device-repair": "#4f46e5",
                    // space — indigo/purple
                    "guesthouse": "#7c3aed", "rental-studio": "#6366f1", "party-room": "#ec4899",
                    "study-cafe-space": "#1d4ed8", "shared-office": "#0f172a", "practice-room": "#9333ea",
                    // online — modern purple/blue
                    "smart-store": "#2563eb", "digital-products": "#7c3aed", "creator-service": "#ec4899",
                    "consignment-commerce": "#0891b2", "newsletter-membership": "#6366f1", "global-buying": "#059669",
                    // startup — tech blue/indigo
                    "ai-application": "#7c3aed", "developer-tools": "#0f172a", "b2b-saas": "#2563eb",
                    "fintech-startup": "#059669", "healthtech-startup": "#dc2626", "security-startup": "#1e40af",
                  };

                  return starterIndustryOptions
                    .filter((option) => option.meta?.categoryId === selectedIndustryCategoryId)
                    .slice(0, 6)
                    .map((rawOption) => {
                    const option = localizeRecommendationItem(rawOption, language);
                    const selected = selectedIndustryId === rawOption.id;
                    const iconPath = industryIcons[rawOption.id];
                    const color = industryColors[rawOption.id] ?? "#1d3557";
                    return (
                      <button
                        key={rawOption.id}
                        type="button"
                        style={{
                          ...styles.optionCard,
                          background: selected
                            ? `linear-gradient(160deg, ${color}14 0%, ${color}08 100%)`
                            : `linear-gradient(160deg, ${color}06 0%, rgba(255,255,255,0.9) 100%)`,
                          border: selected ? `1.5px solid ${color}40` : `1.5px solid ${color}10`,
                          boxShadow: selected ? `0 0 0 3px ${color}10, 0 4px 12px ${color}0c` : "none",
                        }}
                        onClick={() => setSelectedIndustryId(rawOption.id)}
                      >
                        <div style={{
                          width: "48px", height: "48px", borderRadius: "14px",
                          background: selected ? `${color}18` : `${color}0a`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: "8px",
                          transition: "all 0.2s ease",
                        }}>
                          {iconPath?.startsWith("MAT:") ? (
                            <svg width="24" height="24" viewBox="0 -960 960 960"
                              fill={selected ? color : `${color}80`}
                              style={{ transition: "fill 0.2s ease" }}>
                              <path d={iconPath.slice(4)} />
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                              stroke={selected ? color : `${color}80`}
                              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ transition: "stroke 0.2s ease" }}>
                              <path d={iconPath ?? "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"} />
                            </svg>
                          )}
                        </div>
                        <div style={{ ...styles.optionTitle, textAlign: "center" as const, color: selected ? color : "#0f172a" }}>{option.title}</div>
                      </button>
                    );
                  });
                })()}
              </div>

              <div style={styles.stageFooter}>
                {prevTraversedStage ? (
                  <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
                    {language === "ko" ? "← 이전 단계" : "← Back"}
                  </button>
                ) : null}
                <button
                  type="button"
                  style={{ ...styles.primaryButton, opacity: canCompleteIndustryStep ? 1 : 0.45 }}
                  onClick={handleIndustryContinue}
                  disabled={!canCompleteIndustryStep}
                >
                  {language === "ko" ? "이 업종으로 다음 단계" : "Use this industry and continue"}
                </button>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          ) : currentStage.code === "startup_type" ? (
            <>
              {!showFranchisePicker ? (
                /* ── Screen 1: Choose startup type ── */
                <>
                  <div style={styles.helper}>
                    {copy.home.startupTypeHelp}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${startupTypeOptions.length}, 1fr)`, gap: "10px" }}>
                    {startupTypeOptions.map((type) => {
                      const ko = language === "ko";
                      const selected = startupType === type;
                      const config: Record<string, { icon: string; color: string; subtitle: string }> = {
                        independent: {
                          icon: industryCategoryId === "startup-tech"
                            ? "M13 10V3L4 14h7v7l9-11h-7z"       // 번개
                            : "M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z", // 별
                          color: "#2563eb",
                          subtitle: industryCategoryId === "startup-tech"
                            ? (ko ? "직접 제품과 회사를 만드는 기술 스타트업입니다" : "Build a product company yourself")
                            : (ko ? "본인이 직접 브랜드와 메뉴를 구성합니다" : "Build your own brand and concept"),
                        },
                        franchise: {
                          icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v4m4-4v4", // 빌딩
                          color: "#7c3aed",
                          subtitle: ko ? "검증된 브랜드로 빠르게 시작합니다" : "Start fast with a proven brand",
                        },
                        undecided: {
                          icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 14v.01M12 8a2 2 0 012 2c0 1.5-2 2-2 3", // 물음표
                          color: "#6b7280",
                          subtitle: ko ? "아직 결정하지 않았습니다" : "Haven't decided yet",
                        },
                      };
                      const c = config[type] ?? config.undecided;
                      return (
                      <button
                        key={type}
                        type="button"
                        style={{
                          display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const,
                          gap: "8px", padding: "32px 20px", borderRadius: "20px", cursor: "pointer", width: "100%",
                          border: selected ? `1.5px solid ${c.color}40` : "1.5px solid rgba(0,0,0,0.04)",
                          background: selected
                            ? `linear-gradient(160deg, ${c.color}10 0%, ${c.color}06 100%)`
                            : "rgba(255,255,255,0.8)",
                          boxShadow: selected ? `0 0 0 3px ${c.color}0c, 0 4px 12px ${c.color}0a` : "none",
                          transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                        onClick={() => { setStartupType(type); if (type !== "franchise") { setSelectedFranchiseBrandId(null); setShowFranchisePicker(false); } }}
                      >
                        <div style={{
                          width: "56px", height: "56px", borderRadius: "16px",
                          background: selected ? `${c.color}14` : "rgba(0,0,0,0.035)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke={selected ? c.color : "rgba(15,23,42,0.35)"}
                            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: "stroke 0.2s ease" }}>
                            <path d={c.icon} />
                          </svg>
                        </div>
                        <div style={{ fontSize: "17px", fontWeight: 680, letterSpacing: "-0.02em", color: selected ? c.color : "#0f172a" }}>
                          {formatStartupType(type, language)}
                        </div>
                        <div style={{ fontSize: "13px", lineHeight: 1.5, color: "rgba(15,23,42,0.45)" }}>
                          {c.subtitle}
                        </div>
                      </button>
                    )})}
                  </div>

                  <div style={styles.stageFooter}>
                    {prevTraversedStage ? (
                      <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
                        {language === "ko" ? "← 이전 단계" : "← Back"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      style={{ ...styles.primaryButton, opacity: canCompleteStartupTypeStep ? 1 : 0.45 }}
                      onClick={handleStartupTypeContinue}
                      disabled={!canCompleteStartupTypeStep}
                    >
                      {startupType === "franchise"
                        ? (language === "ko" ? "브랜드 선택하기 →" : "Choose brand →")
                        : (language === "ko" ? "이 창업 형태로 계속" : "Use this startup type and continue")}
                    </button>
                    <button type="button" style={styles.button} onClick={resetDemo}>
                      {copy.common.resetDemo}
                    </button>
                  </div>
                </>
              ) : (
                /* ── Screen 2: Franchise brand picker ── */
                (() => {
                  const brands = (() => { const sub = selectedIndustryId ? getFranchiseBrandsForSubIndustry(selectedIndustryId) : []; return sub.length > 0 ? sub : getFranchiseBrandsForCategory(industryCategoryId); })();
                  const ko = language === "ko";
                  return (
                    <>
                      <div style={{ fontSize: "22px", fontWeight: 680, letterSpacing: "-0.03em", marginBottom: "6px" }}>
                        {ko ? "프랜차이즈 브랜드 선택" : "Choose a Franchise Brand"}
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                        {ko
                          ? "공정거래위원회 정보공개서 기반 데이터입니다. 점수는 수익성·안정성·진입장벽·브랜드력·본사지원을 종합한 결과입니다."
                          : "Data based on KFTC disclosure. Scores combine profitability, stability, accessibility, brand power, and HQ support."}
                      </div>

                      {brands.length === 0 ? (
                        <div style={{ padding: "24px", borderRadius: "16px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.6)", color: "var(--muted)", textAlign: "center" }}>
                          {ko ? "이 업종에는 아직 등록된 프랜차이즈가 없습니다." : "No franchise brands registered for this industry yet."}
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: "12px" }}>
                          {brands
                            .sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores))
                            .map((fb) => {
                            const overall = computeOverallScore(fb.scores);
                            const sel = selectedFranchiseBrandId === fb.id;
                            const scoreEntries: { key: string; label: string; value: number }[] = [
                              { key: "profit", label: ko ? "수익성" : "Profit", value: fb.scores.profitability },
                              { key: "stable", label: ko ? "안정성" : "Stability", value: fb.scores.stability },
                              { key: "access", label: ko ? "진입장벽" : "Access", value: fb.scores.accessibility },
                              { key: "brand", label: ko ? "브랜드" : "Brand", value: fb.scores.brandPower },
                              { key: "support", label: ko ? "지원" : "Support", value: fb.scores.support },
                            ];
                            return (
                              <button
                                key={fb.id}
                                type="button"
                                onClick={() => setSelectedFranchiseBrandId(sel ? null : fb.id)}
                                style={{
                                  display: "grid",
                                  gap: "14px",
                                  padding: "20px",
                                  borderRadius: "20px",
                                  border: sel ? "2px solid var(--primary)" : "1px solid var(--border)",
                                  background: sel ? "rgba(29,53,87,0.04)" : "rgba(255,255,255,0.82)",
                                  boxShadow: sel ? "0 0 0 4px rgba(29,53,87,0.06)" : "0 2px 8px rgba(17,17,17,0.03)",
                                  cursor: "pointer",
                                  textAlign: "left" as const,
                                  transition: "all 0.2s ease"
                                }}
                              >
                                {/* header row */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                      <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>{fb.name[language]}</span>
                                      {sel && <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--primary)", background: "rgba(29,53,87,0.08)", padding: "2px 8px", borderRadius: "6px" }}>{ko ? "선택됨" : "Selected"}</span>}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{fb.tagline[language]}</div>
                                  </div>
                                  {/* overall score circle */}
                                  <div style={{
                                    width: 52, height: 52, borderRadius: 26,
                                    background: `conic-gradient(${getScoreColor(overall)} ${overall * 3.6}deg, rgba(0,0,0,0.04) 0deg)`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0
                                  }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 21, background: sel ? "rgba(255,255,255,0.95)" : "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                      <span style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1, color: getScoreColor(overall) }}>{overall}</span>
                                      <span style={{ fontSize: "8px", color: "var(--muted)", marginTop: "1px" }}>{getScoreLabel(overall, language)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* key metrics */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                                  {[
                                    { label: ko ? "창업비용" : "Startup", value: formatFranchiseCost(fb.startupCostWon) },
                                    { label: ko ? "연매출" : "Revenue", value: formatFranchiseCost(fb.avgAnnualRevenueWon) },
                                    { label: ko ? "폐점률" : "Closure", value: `${fb.closureRate}%` },
                                    { label: ko ? "매장수" : "Stores", value: fb.storeCount.toLocaleString() }
                                  ].map((m) => (
                                    <div key={m.label} style={{ padding: "8px 6px", borderRadius: "10px", background: sel ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
                                      <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em" }}>{m.value}</div>
                                      <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{m.label}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* score bars */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                                  {scoreEntries.map((s) => (
                                    <div key={s.key} style={{ textAlign: "center" }}>
                                      <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.04)", marginBottom: "4px", overflow: "hidden" }}>
                                        <div style={{ width: `${s.value}%`, height: "100%", borderRadius: "2px", background: getScoreColor(s.value), transition: "width 0.5s ease" }} />
                                      </div>
                                      <div style={{ fontSize: "10px", color: "var(--muted)" }}>{s.label}</div>
                                      <div style={{ fontSize: "12px", fontWeight: 600, color: getScoreColor(s.value) }}>{s.value}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* expanded detail when selected */}
                                {sel && (
                                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "grid", gap: "8px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                                      {ko ? "프랜차이즈 로드맵 특이사항" : "Franchise Roadmap Notes"}
                                    </div>
                                    {fb.roadmapNotes[language].map((note, ni) => (
                                      <div key={ni} style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)", display: "flex", gap: "6px" }}>
                                        <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                                        <span>{note}</span>
                                      </div>
                                    ))}
                                    <div style={{ marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" as const, fontSize: "12px", color: "var(--muted)" }}>
                                      <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
                                      <span>·</span>
                                      <span>{ko ? `로열티 ${fb.monthlyRoyalty ? fb.monthlyRoyalty + "만/월" : "없음"}` : `Royalty ${fb.monthlyRoyalty ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
                                      <span>·</span>
                                      <span>{ko ? `데이터 ${fb.dataYear}년` : `Data ${fb.dataYear}`}</span>
                                    </div>
                                    {fb.franchiseUrl && (
                                      <a
                                        href={fb.franchiseUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          marginTop: "8px",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          padding: "10px 16px",
                                          borderRadius: "999px",
                                          border: "none",
                                          background: "var(--primary)",
                                          color: "#fff",
                                          fontSize: "13px",
                                          fontWeight: 600,
                                          textDecoration: "none",
                                          cursor: "pointer",
                                          width: "fit-content"
                                        }}
                                      >
                                        {ko ? `${fb.name.ko} 가맹 문의 →` : `${fb.name.en} Franchise Inquiry →`}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div style={styles.stageFooter}>
                        <button type="button" style={styles.button} onClick={() => setShowFranchisePicker(false)}>
                          {language === "ko" ? "← 창업 형태로 돌아가기" : "← Back to startup type"}
                        </button>
                        <button
                          type="button"
                          style={{ ...styles.primaryButton, opacity: selectedFranchiseBrandId ? 1 : 0.45 }}
                          onClick={handleStartupTypeContinue}
                          disabled={!selectedFranchiseBrandId}
                        >
                          {language === "ko"
                            ? (selectedFranchiseBrandId
                                ? `${getFranchiseBrandById(selectedFranchiseBrandId)?.name.ko}(으)로 계속`
                                : "브랜드를 선택해주세요")
                            : (selectedFranchiseBrandId
                                ? `Continue with ${getFranchiseBrandById(selectedFranchiseBrandId)?.name.en}`
                                : "Select a brand")}
                        </button>
                        <button type="button" style={styles.button} onClick={resetDemo}>
                          {copy.common.resetDemo}
                        </button>
                      </div>
                    </>
                  );
                })()
              )}
            </>
          ) : currentStage.code === "business_model" ? (
            <>
              <div style={styles.helper}>
                {copy.home.businessModelHelp}
              </div>
              <div style={styles.helper}>
                {language === "ko"
                  ? `${selectedIndustryLabel} 기준으로 운영 방식을 고르세요.`
                  : `Choose the operating model for ${selectedIndustryLabel}.`}
              </div>
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
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`, gap: "10px" }}>
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
                    opacity: canCompleteBusinessModelStep ? 1 : 0.45
                  }}
                  onClick={handleBusinessModelContinue}
                  disabled={!canCompleteBusinessModelStep}
                >
                  {language === "ko" ? "운영 방식 확정하고 계속" : "Lock this model and continue"}
                </button>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          ) : currentStage.code === "budget_setup" ? (
            <>
              <div style={styles.helper}>
                {copy.home.budgetHelp}
              </div>

              {/* ── 라이브 업종별 창업비용 벤치마크 ── */}
              {(() => {
                const ko = language === "ko";

                const loadBenchmark = async () => {
                  if (liveBudgetBenchmark && !liveBudgetBenchmark.loading) return;
                  setLiveBudgetBenchmark({ loading: true });
                  try {
                    const session = await supabase.auth.getSession();
                    const tk = session.data.session?.access_token;
                    const indsCode = ({ "food": "Q", "cafe-dessert": "Q", "retail": "D", "beauty": "F", "fitness": "R", "education": "P" } as Record<string, string>)[industryCategoryId] ?? "Q";
                    const res = await fetch(`/api/data/franchise/industry-costs?industryCode=${indsCode}`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null);
                    if (res?.data?.length) {
                      const latest = res.data[0] as { avgTotalStartupCost: number; avgFranchiseFee: number; avgDeposit: number; avgEducationFee: number; avgOtherCost: number; industryName: string };
                      setLiveBudgetBenchmark({ loading: false, data: latest });
                    } else {
                      setLiveBudgetBenchmark({ loading: false });
                    }
                  } catch { setLiveBudgetBenchmark({ loading: false }); }
                };

                if (!liveBudgetBenchmark) void loadBenchmark();

                if (!liveBudgetBenchmark || liveBudgetBenchmark.loading || !liveBudgetBenchmark.data) return null;
                const b = liveBudgetBenchmark.data;
                const userBudget = selectedBudget ?? 0;
                const diff = userBudget > 0 ? Math.round(((userBudget - b.avgTotalStartupCost * 10000) / (b.avgTotalStartupCost * 10000)) * 100) : 0;
                const diffLabel = diff > 10 ? (ko ? "업종 평균보다 여유" : "Above average") : diff < -10 ? (ko ? "업종 평균보다 부족" : "Below average") : (ko ? "업종 평균 수준" : "Near average");
                const diffColor = diff > 10 ? "#059669" : diff < -10 ? "#dc2626" : "#d97706";

                return (
                  <div style={{ marginBottom: "18px", borderRadius: "20px", border: `1px solid ${diffColor}15`, background: `linear-gradient(180deg, ${diffColor}06 0%, rgba(255,255,255,0.92) 100%)`, overflow: "hidden" }} className="bento-fade-in">
                    <div style={{ padding: "18px 20px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: diffColor }} />
                        <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "업종 창업비용 벤치마크" : "Industry Startup Cost Benchmark"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "공정거래위원회 가맹사업 통계 기반" : "Based on KFTC Franchise Statistics"}</div>
                    </div>
                    <div style={{ padding: "0 20px 18px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "24px", fontWeight: 760, letterSpacing: "-0.04em", color: "#0f172a" }}>{b.avgTotalStartupCost.toLocaleString()}<span style={{ fontSize: "14px", fontWeight: 500 }}>{ko ? "만원" : "만KRW"}</span></span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: diffColor }}>{diffLabel} ({diff > 0 ? "+" : ""}{diff}%)</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                        {[
                          { label: ko ? "가맹비" : "Franchise", value: b.avgFranchiseFee },
                          { label: ko ? "교육비" : "Education", value: b.avgEducationFee },
                          { label: ko ? "보증금" : "Deposit", value: b.avgDeposit },
                          { label: ko ? "기타" : "Other", value: b.avgOtherCost },
                        ].filter(x => x.value > 0).map(x => (
                          <div key={x.label} style={{ padding: "10px", borderRadius: "12px", background: `${diffColor}06` }}>
                            <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{x.label}</div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{x.value.toLocaleString()}<span style={{ fontSize: "10px", color: "var(--muted)" }}>{ko ? "만" : "M"}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Franchise cost guide panel ── */}
              {startupType === "franchise" && selectedFranchiseBrandId && (() => {
                const fb = getFranchiseBrandById(selectedFranchiseBrandId);
                if (!fb) return null;
                const ko = language === "ko";
                const totalCost = fb.startupCostWon;
                const hasBreakdown = fb.costVerified && fb.costBreakdown && fb.costBreakdown.length > 0;

                return (
                  <div style={{
                    marginBottom: "18px",
                    borderRadius: "28px",
                    border: "1px solid rgba(255,255,255,0.78)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
                    boxShadow: "0 12px 28px rgba(17,17,17,0.04)",
                    overflow: "hidden"
                  }}>
                    {/* header */}
                    <div style={{ padding: "22px 24px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 12,
                          background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: "14px", fontWeight: 700
                        }}>
                          ₩
                        </div>
                        <div>
                          <div style={{ fontSize: "17px", fontWeight: 680, letterSpacing: "-0.02em" }}>
                            {fb.name[language]}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {ko ? "예상 창업 비용 안내" : "Estimated Startup Cost Guide"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* total highlight */}
                    <div style={{
                      margin: "0 24px",
                      padding: "16px 20px",
                      borderRadius: "18px",
                      background: "rgba(29,53,87,0.04)",
                      border: "1px solid rgba(29,53,87,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>
                          {ko ? "예상 총 비용" : "Estimated Total"}
                          {fb.basePyeong ? ` (${fb.basePyeong}${ko ? "평 기준" : "py"})` : ""}
                        </div>
                        <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--primary)" }}>
                          {formatFranchiseCost(totalCost)}<span style={{ fontSize: "16px", fontWeight: 500 }}>원</span>
                        </div>
                      </div>
                      {fb.monthlyRoyalty > 0 && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{ko ? "월 로열티" : "Monthly Royalty"}</div>
                          <div style={{ fontSize: "16px", fontWeight: 650, color: "var(--primary)" }}>{fb.monthlyRoyalty}<span style={{ fontSize: "12px" }}>만/월</span></div>
                        </div>
                      )}
                    </div>

                    {/* breakdown or unverified notice */}
                    {hasBreakdown ? (
                      <div style={{ padding: "16px 24px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "10px" }}>
                          {ko ? "비용 항목" : "Cost Breakdown"}
                        </div>
                        {fb.costBreakdown!.map((item, idx) => (
                          <div key={idx} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 0",
                            borderTop: idx === 0 ? "none" : "1px solid rgba(17,17,17,0.05)"
                          }}>
                            <span style={{ fontSize: "14px", color: "var(--muted)" }}>{item.label[language]}</span>
                            <span style={{ fontSize: "14px", fontWeight: 600 }}>{formatFranchiseCost(item.amountWon)}원</span>
                          </div>
                        ))}
                        <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: 6, height: 6, borderRadius: 3, background: "#34c759", display: "inline-block" }} />
                          {ko ? `출처: ${fb.costSource} · VAT 별도 · 점포 구입비 별도` : `Source: ${fb.costSource} · Excl. VAT · Excl. property`}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "16px 24px" }}>
                        <div style={{
                          padding: "14px 16px",
                          borderRadius: "14px",
                          background: "rgba(255,159,10,0.06)",
                          border: "1px solid rgba(255,159,10,0.12)"
                        }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#ff9f0a", marginBottom: "4px" }}>
                            {ko ? "상세 비용 미확인" : "Detailed Costs Unverified"}
                          </div>
                          <div style={{ fontSize: "12px", lineHeight: 1.55, color: "var(--muted)" }}>
                            {ko
                              ? "이 브랜드의 항목별 비용은 아직 검증되지 않았습니다. 정확한 가맹비·교육비·인테리어비는 본사에 직접 확인해주세요."
                              : "Itemized costs for this brand are not yet verified. Please contact HQ directly for exact franchise fee, training, and interior costs."}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div style={{ padding: "0 24px 20px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const totalWon = totalCost * 10000;
                          setSelectedBudget(totalWon);
                          setBudgetInputText(String(totalCost));
                        }}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "999px",
                          border: "none",
                          background: "var(--primary)",
                          color: "#fff",
                          fontSize: "15px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {ko
                          ? `${formatFranchiseCost(totalCost)}원을 자본금으로 설정`
                          : `Set ${formatFranchiseCost(totalCost)} as capital`}
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div style={styles.budgetPanel}>
                <div style={styles.budgetHeader}>
                  <div style={styles.budgetLabel}>
                    {language === "ko" ? "시작 자본금" : "Starting capital"}
                  </div>
                  <div style={styles.budgetValue}>{activeBudgetLabel}</div>
                  <div style={styles.helper}>
                    {language === "ko"
                      ? "슬라이더로 예산 감을 먼저 잡고, 필요하면 아래 빠른 선택으로 조정하세요."
                      : "Use the slider to set a rough budget, then fine-tune with the quick picks below."}
                  </div>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={300000000}
                  step={10000}
                  value={sliderBudgetValue}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setSelectedBudget(nextValue);
                    setBudgetInputText(String(Math.round(nextValue / 10000)));
                  }}
                  style={styles.budgetRange}
                />
                <div style={styles.budgetRangeMeta}>
                  <span>{formatBudgetPresetLabel(1000000, language)}</span>
                  <span>
                    {formatBudgetPresetLabel(300000000, language)}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetInputText}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
                    setBudgetInputText(digitsOnly);

                    if (!digitsOnly) {
                      setSelectedBudget(undefined);
                      return;
                    }

                    const nextValue = Number(digitsOnly);
                    const nextBudget = nextValue * 10000;
                    setSelectedBudget(Math.min(300000000, Math.max(1000000, nextBudget)));
                  }}
                  placeholder={
                    language === "ko"
                      ? "예: 450"
                      : "Example: 4510000"
                  }
                  style={styles.budgetInput}
                />
                <div style={styles.helper}>
                  {language === "ko"
                    ? "직접 입력은 만원 단위입니다. 450을 입력하면 450만원으로 저장됩니다."
                    : "Direct input uses ten-thousand KRW units. Enter 450 to save KRW 4,500,000."}
                </div>
                <div style={styles.compactChoiceGrid}>
                  {starterBudgetPresets.map((budget) => (
                    <button
                      key={budget.id}
                      type="button"
                      style={{
                        ...styles.compactChoiceCard,
                        ...(selectedBudget === budget.value
                          ? styles.compactChoiceCardSelected
                          : {})
                      }}
                      onClick={() => {
                        setSelectedBudget(budget.value);
                        setBudgetInputText(String(Math.round(budget.value / 10000)));
                      }}
                    >
                      <div style={styles.compactChoiceTitle}>
                        {formatBudgetPresetLabel(budget.value, language)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.budgetPanel}>
                <div style={styles.budgetHeader}>
                  <div style={styles.budgetLabel}>
                    {language === "ko" ? "목표 오픈 시점" : "Target opening window"}
                  </div>
                  <div style={styles.compactChoiceTitle}>
                    {activeOpenDatePreset
                      ? formatOpenDatePresetLabel(
                          activeOpenDatePreset.id,
                          activeOpenDatePreset.label,
                          language
                        )
                      : language === "ko"
                        ? "아직 선택하지 않음"
                        : "Not selected yet"}
                  </div>
                </div>
                <div style={styles.compactChoiceGrid}>
                  {starterOpenDatePresets.map((date) => (
                    <button
                      key={date.id}
                      type="button"
                      style={{
                        ...styles.compactChoiceCard,
                        ...(selectedOpenDate === date.value
                          ? styles.compactChoiceCardSelected
                          : {})
                      }}
                      onClick={() => setSelectedOpenDate(date.value)}
                    >
                      <div style={styles.compactChoiceTitle}>
                        {formatOpenDatePresetLabel(date.id, date.label, language)}
                      </div>
                      <div style={styles.compactChoiceCaption}>
                        {language === "ko"
                          ? "로드맵 마감과 실행 속도를 이 일정에 맞춥니다."
                          : "Roadmap timing will align to this opening window."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

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
                    opacity: canCompleteBudgetStep ? 1 : 0.45
                  }}
                  onClick={handleBudgetContinue}
                  disabled={!canCompleteBudgetStep}
                >
                  {industryCategoryId === "startup-tech"
                    ? (language === "ko" ? "예산 저장하고 스타트업 로드맵 시작" : "Save budget and start startup roadmap")
                    : language === "ko"
                      ? "예산 저장하고 상권 보기"
                      : "Save budget and open markets"}
                </button>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          ) : currentStage.code === "location_candidates" ? (
            <>
              <div style={styles.helper}>{locationHelpText}</div>

              {/* ── Franchise nearby store search ── */}
              {startupType === "franchise" && selectedFranchiseBrandId && (() => {
                const fb = getFranchiseBrandById(selectedFranchiseBrandId);
                if (!fb) return null;
                const ko = language === "ko";
                const density = fb.storeCount > 2000 ? "high" : fb.storeCount > 500 ? "medium" : "low";
                const densityColor = density === "high" ? "#ff3b30" : density === "medium" ? "#ff9f0a" : "#34c759";
                const densityLabel = density === "high"
                  ? (ko ? "매우 높음" : "Very High")
                  : density === "medium"
                    ? (ko ? "보통" : "Medium")
                    : (ko ? "낮음" : "Low");

                const searchNearby = () => {
                  if (!preferredRegionInput.trim()) return;
                  const w = window as unknown as Record<string, unknown>;
                  type KPlace = { place_name: string; road_address_name: string; address_name: string; phone: string; place_url: string };
                  type KPagination = { totalCount: number };
                  const kakao = w.kakao as { maps?: { load?: (cb: () => void) => void; services?: { Places: new () => { keywordSearch: (q: string, cb: (d: KPlace[], s: string, p: KPagination) => void) => void }; Status: { OK: string; ZERO_RESULT: string; ERROR: string } } } } | undefined;
                  if (!kakao?.maps) return;
                  setNearbyFranchiseLoading(true);
                  setNearbyFranchiseStores(null);
                  const run = () => {
                    const svc = kakao!.maps!.services;
                    if (!svc) return;
                    const ps = new svc.Places();
                    const query = `${fb.name.ko} ${preferredRegionInput.trim()}`;
                    ps.keywordSearch(query, (data: KPlace[], status: string, pagination: KPagination) => {
                      if (status === svc.Status.OK) {
                        setNearbyFranchiseStores({
                          totalCount: pagination.totalCount,
                          places: data.map((d) => ({
                            name: d.place_name,
                            address: d.road_address_name || d.address_name,
                            phone: d.phone,
                            url: d.place_url
                          }))
                        });
                      } else {
                        setNearbyFranchiseStores({ totalCount: 0, places: [] });
                      }
                      setNearbyFranchiseLoading(false);
                    });
                  };
                  if (kakao.maps.load) {
                    kakao.maps.load(run);
                  } else {
                    run();
                  }
                };

                return (
                  <div style={{
                    marginBottom: "16px",
                    borderRadius: "20px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.82)",
                    overflow: "hidden"
                  }}>
                    {/* header */}
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
                          {ko ? `${fb.name.ko} 주변 매장 검색` : `${fb.name.en} Nearby Store Search`}
                        </div>
                        <div style={{
                          fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "8px",
                          background: `${densityColor}12`, color: densityColor
                        }}>
                          {ko ? `전국 ${fb.storeCount.toLocaleString()}개` : `${fb.storeCount.toLocaleString()} nationwide`} · {densityLabel}
                        </div>
                      </div>
                      <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
                        {ko
                          ? "희망 지역 근처에 같은 브랜드 매장이 있는지 확인하세요. 반경 내 동일 브랜드가 많으면 매출이 분산됩니다."
                          : "Check if the same brand already exists near your target area. Too many nearby stores will split revenue."}
                      </div>
                    </div>

                    {/* search action */}
                    <div style={{ padding: "14px 20px", display: "flex", gap: "8px", alignItems: "center", borderBottom: nearbyFranchiseStores ? "1px solid var(--border)" : "none" }}>
                      <button
                        type="button"
                        onClick={searchNearby}
                        disabled={!preferredRegionInput.trim() || nearbyFranchiseLoading}
                        style={{
                          padding: "10px 18px",
                          borderRadius: "12px",
                          border: "none",
                          background: preferredRegionInput.trim() ? "var(--primary)" : "rgba(0,0,0,0.06)",
                          color: preferredRegionInput.trim() ? "#fff" : "var(--muted)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: preferredRegionInput.trim() ? "pointer" : "default",
                          opacity: nearbyFranchiseLoading ? 0.6 : 1
                        }}
                      >
                        {nearbyFranchiseLoading
                          ? (ko ? "검색 중..." : "Searching...")
                          : preferredRegionInput.trim()
                            ? (ko ? `"${preferredRegionInput.trim()}" 근처 ${fb.name.ko} 검색` : `Search ${fb.name.en} near "${preferredRegionInput.trim()}"`)
                            : (ko ? "아래에서 희망 지역을 먼저 입력하세요" : "Enter your preferred region below first")}
                      </button>
                    </div>

                    {/* results */}
                    {nearbyFranchiseStores && (
                      <div style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 16,
                            background: nearbyFranchiseStores.totalCount === 0 ? "#34c75918" : nearbyFranchiseStores.totalCount <= 3 ? "#ff9f0a18" : "#ff3b3018",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "14px", fontWeight: 700,
                            color: nearbyFranchiseStores.totalCount === 0 ? "#34c759" : nearbyFranchiseStores.totalCount <= 3 ? "#ff9f0a" : "#ff3b30"
                          }}>
                            {nearbyFranchiseStores.totalCount}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>
                              {nearbyFranchiseStores.totalCount === 0
                                ? (ko ? "주변에 동일 브랜드가 없습니다" : "No same-brand stores nearby")
                                : (ko ? `주변에 ${fb.name.ko} ${nearbyFranchiseStores.totalCount}개 발견` : `${nearbyFranchiseStores.totalCount} ${fb.name.en} stores found nearby`)}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {nearbyFranchiseStores.totalCount === 0
                                ? (ko ? "해당 지역은 출점 가능성이 높습니다" : "This area has good potential for a new store")
                                : nearbyFranchiseStores.totalCount <= 3
                                  ? (ko ? "경쟁이 있지만 진입 가능합니다" : "Some competition but entry is viable")
                                  : (ko ? "이미 포화 상태입니다. 다른 지역을 고려하세요" : "Already saturated. Consider a different area")}
                            </div>
                          </div>
                        </div>

                        {nearbyFranchiseStores.places.length > 0 && (
                          <div style={{ display: "grid", gap: "6px" }}>
                            {nearbyFranchiseStores.places.slice(0, 8).map((place, pi) => (
                              <a
                                key={pi}
                                href={place.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  padding: "10px 12px",
                                  borderRadius: "12px",
                                  background: "rgba(0,0,0,0.02)",
                                  border: "1px solid var(--border)",
                                  textDecoration: "none",
                                  color: "inherit",
                                  cursor: "pointer"
                                }}
                              >
                                <div style={{
                                  width: 24, height: 24, borderRadius: 8,
                                  background: "var(--primary)",
                                  color: "#fff",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "11px", fontWeight: 700, flexShrink: 0
                                }}>
                                  {pi + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
                                </div>
                                {place.phone && <div style={{ fontSize: "11px", color: "var(--muted)", flexShrink: 0 }}>{place.phone}</div>}
                                <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {nearbyFranchiseStores.totalCount > 8 && (
                          <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
                            {ko ? `외 ${nearbyFranchiseStores.totalCount - 8}개 매장 더 있음` : `${nearbyFranchiseStores.totalCount - 8} more stores`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── 독립 창업자 동종업체 검색 ── */}
              {startupType !== "franchise" && (() => {
                const ko = language === "ko";
                const categoryKeywords: Record<string, string> = {
                  "cafe-dessert": "카페",
                  "food": industryCategoryId === "food" ? (selectedIndustryId === "chicken-burger" ? "치킨" : selectedIndustryId === "ramen-noodle" ? "국밥 면류" : selectedIndustryId === "korean-casual" ? "한식" : "음식점") : "음식점",
                  "retail": "편의점 소매점",
                  "beauty": selectedIndustryId === "hair-salon" ? "미용실" : selectedIndustryId === "nail-studio" ? "네일" : "뷰티",
                  "fitness": "헬스장 피트니스",
                  "education": "학원",
                  "pet": "펫샵 애견",
                  "living-service": "세탁소",
                  "space": "스터디카페",
                };
                const keyword = categoryKeywords[industryCategoryId] ?? "가게";
                // competitorResults / competitorLoading — hoisted to component top

                const searchCompetitors = () => {
                  if (!preferredRegionInput.trim()) return;
                  /* eslint-disable @typescript-eslint/no-explicit-any */
                  const w = window as any;
                  const kakao = w.kakao;
                  if (!kakao?.maps?.services) return;
                  setCompetitorLoading(true);
                  setCompetitorResults(null);
                  const run = () => {
                    const ps = new kakao.maps.services.Places();
                    const query = `${keyword} ${preferredRegionInput.trim()}`;
                    ps.keywordSearch(query, (data: any[], status: string, pagination: any) => {
                      if (status === kakao.maps.services.Status.OK) {
                        setCompetitorResults({
                          totalCount: pagination.totalCount,
                          places: data.map((d: any) => ({
                            name: d.place_name, address: d.road_address_name || d.address_name,
                            phone: d.phone || "", url: d.place_url || ""
                          }))
                        });
                      } else {
                        setCompetitorResults({ totalCount: 0, places: [] });
                      }
                      setCompetitorLoading(false);
                    }, { size: 10 });
                  };
                  if (kakao.maps.load) { kakao.maps.load(run); } else { run(); }
                  /* eslint-enable @typescript-eslint/no-explicit-any */
                };

                return (
                  <div style={{
                    marginBottom: "16px", borderRadius: "20px",
                    border: "1px solid var(--border)", background: "rgba(255,255,255,0.82)", overflow: "hidden"
                  }}>
                    <div style={{ padding: "18px 20px", borderBottom: competitorResults ? "1px solid var(--border)" : "none" }}>
                      <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                        {ko ? "주변 경쟁 업체 분석" : "Nearby Competition Analysis"}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                        {ko ? "희망 지역에 같은 업종이 얼마나 있는지 확인하세요. 경쟁이 과하면 차별화 전략이 필요합니다." : "Check how many competitors exist in your target area."}
                      </div>
                      <button
                        type="button"
                        onClick={searchCompetitors}
                        disabled={!preferredRegionInput.trim() || competitorLoading}
                        style={{
                          padding: "10px 18px", borderRadius: "12px", border: "none",
                          background: preferredRegionInput.trim() ? "var(--primary)" : "rgba(0,0,0,0.06)",
                          color: preferredRegionInput.trim() ? "#fff" : "var(--muted)",
                          fontSize: "13px", fontWeight: 600, cursor: preferredRegionInput.trim() ? "pointer" : "default",
                          opacity: competitorLoading ? 0.6 : 1
                        }}
                      >
                        {competitorLoading
                          ? (ko ? "검색 중..." : "Searching...")
                          : preferredRegionInput.trim()
                            ? (ko ? `"${preferredRegionInput.trim()}" 주변 ${keyword} 검색` : `Search ${keyword} near "${preferredRegionInput.trim()}"`)
                            : (ko ? "아래에서 지역을 먼저 입력하세요" : "Enter region below first")}
                      </button>
                    </div>

                    {competitorResults && (
                      <div style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 16,
                            background: competitorResults.totalCount <= 5 ? "#34c75918" : competitorResults.totalCount <= 15 ? "#ff9f0a18" : "#ff3b3018",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "14px", fontWeight: 700,
                            color: competitorResults.totalCount <= 5 ? "#34c759" : competitorResults.totalCount <= 15 ? "#ff9f0a" : "#ff3b30"
                          }}>
                            {competitorResults.totalCount}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>
                              {competitorResults.totalCount === 0
                                ? (ko ? "주변에 동종 업체가 없습니다" : "No competitors nearby")
                                : (ko ? `주변에 ${keyword} ${competitorResults.totalCount}곳 발견` : `${competitorResults.totalCount} ${keyword} found nearby`)}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {competitorResults.totalCount === 0
                                ? (ko ? "블루오션 지역입니다" : "Blue ocean area")
                                : competitorResults.totalCount <= 5
                                  ? (ko ? "경쟁이 적어 진입하기 좋습니다" : "Low competition, good entry")
                                  : competitorResults.totalCount <= 15
                                    ? (ko ? "보통 수준의 경쟁입니다. 차별화 전략이 필요합니다" : "Medium competition. Differentiation needed")
                                    : (ko ? "경쟁이 매우 치열합니다. 강력한 차별점이 필요합니다" : "Very competitive. Strong differentiation required")}
                            </div>
                          </div>
                        </div>

                        {competitorResults.places.length > 0 && (
                          <div style={{ display: "grid", gap: "6px" }}>
                            {competitorResults.places.slice(0, 5).map((place, pi) => (
                              <a key={pi} href={place.url} target="_blank" rel="noopener noreferrer" style={{
                                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                                borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)",
                                textDecoration: "none", color: "inherit"
                              }}>
                                <div style={{ width: 24, height: 24, borderRadius: 8, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{pi + 1}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── 라이브 상권 인사이트 패널 ── */}
              {preferredRegionInput.trim() && (() => {
                const ko = language === "ko";

                const loadMarketInsights = async () => {
                  if (liveMarketInsights && !liveMarketInsights.loading) return;
                  setLiveMarketInsights({ loading: true });
                  try {
                    const session = await supabase.auth.getSession();
                    const tk = session.data.session?.access_token;
                    const parts = preferredRegionInput.trim().replace(/\s+/g, " ").split(" ");
                    let sido = parts[0] ?? "";
                    if (sido === "서울") sido = "서울특별시";
                    else if (sido === "부산") sido = "부산광역시";
                    else if (sido === "경기") sido = "경기도";
                    else if (sido === "인천") sido = "인천광역시";
                    else if (sido === "대구") sido = "대구광역시";
                    else if (sido === "대전") sido = "대전광역시";
                    const sigungu = parts[1] ?? "";

                    const popRes = sido
                      ? await fetch(`/api/data/population?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null)
                      : null;

                    const result: typeof liveMarketInsights = { loading: false };
                    if (popRes?.data?.length) {
                      const popArr = popRes.data as Array<{ totalPopulation: number; householdCount: number; malePopulation: number; femalePopulation: number }>;
                      result.population = {
                        total: popArr.reduce((s, p) => s + p.totalPopulation, 0),
                        households: popArr.reduce((s, p) => s + p.householdCount, 0),
                        male: popArr.reduce((s, p) => s + p.malePopulation, 0),
                        female: popArr.reduce((s, p) => s + p.femalePopulation, 0),
                      };
                    }
                    setLiveMarketInsights(result);
                  } catch {
                    setLiveMarketInsights({ loading: false });
                  }
                };

                if (!liveMarketInsights) void loadMarketInsights();

                if (!liveMarketInsights || liveMarketInsights.loading) {
                  return (
                    <div style={{ marginBottom: "16px", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(219,234,254,0.12) 0%, rgba(255,255,255,0.9) 100%)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", animation: "bentoPulse 1.5s infinite" }} />
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{ko ? "상권 데이터 조회 중..." : "Loading market data..."}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
                        {[0, 1, 2].map(i => <div key={i} style={{ height: "52px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }} />)}
                      </div>
                    </div>
                  );
                }

                if (!liveMarketInsights.population) return null;
                const pop = liveMarketInsights.population;
                const femaleRatio = pop.total > 0 ? Math.round((pop.female / pop.total) * 100) : 50;

                return (
                  <div style={{ marginBottom: "16px", borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(219,234,254,0.12) 0%, rgba(255,255,255,0.92) 100%)", overflow: "hidden" }} className="bento-fade-in">
                    <div style={{ padding: "18px 20px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
                        <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "상권 인구 데이터" : "Market Demographics"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "행정안전부 인구통계 API" : "MOIS Population API"}</div>
                    </div>
                    <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "총 인구" : "Population"}</div>
                        <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{pop.total.toLocaleString()}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "명" : "people"}</div>
                      </div>
                      <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "세대 수" : "Households"}</div>
                        <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{pop.households.toLocaleString()}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "세대" : "units"}</div>
                      </div>
                      <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "여성 비율" : "Female %"}</div>
                        <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{femaleRatio}%</div>
                        <div style={{ display: "flex", gap: "2px", marginTop: "6px" }}>
                          <div style={{ flex: femaleRatio, height: "4px", borderRadius: "2px", background: "#ec4899" }} />
                          <div style={{ flex: 100 - femaleRatio, height: "4px", borderRadius: "2px", background: "#3b82f6" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={styles.inlinePanel}>
                <div style={styles.inlinePanelHeader}>
                  <div style={styles.budgetLabel}>
                    {locationRegionLabel}
                  </div>
                  <div style={styles.helper}>
                    {locationHelpText}
                  </div>
                </div>
                <input
                  type="text"
                  value={preferredRegionInput}
                  onChange={(event) => { setPreferredRegionInput(event.target.value); setLocationMapReady(false); }}
                  placeholder={locationInputPlaceholder}
                  style={styles.textInput}
                />
                <div style={styles.segmentedRow}>
                  <button
                    type="button"
                    disabled={!preferredRegionInput.trim()}
                    style={{
                      ...styles.button,
                      ...(locationMapReady && locationMode === "recommended"
                        ? styles.buttonSelected
                        : preferredRegionInput.trim()
                          ? { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)", fontWeight: 600 }
                          : { opacity: 0.45 })
                    }}
                    onClick={() => {
                      setLocationMode("recommended");
                      setLocationMapReady(true);
                      setManualMarketEvaluation(null);
                      setManualAlternative(null);
                    }}
                  >
                    {locationRecommendedLabel}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.button,
                      ...(locationMode === "direct" && !locationMapReady ? styles.buttonSelected : {})
                    }}
                    onClick={() => {
                      setLocationMode("direct");
                      setLocationMapReady(false);
                      setSelectedLocationId(undefined);
                    }}
                  >
                    {locationDirectLabel}
                  </button>
                </div>
              </div>

              {locationMapReady && locationMode === "recommended" ? (
                <>
                {/* ── Kakao Map + Location Cards (Apple-style) ── */}
                {locationMapReady && (
                  <LocationMapPanel
                    candidates={activeLocationCandidates}
                    selectedId={selectedLocationId}
                    onSelect={(id) => setSelectedLocationId(id)}
                    language={language}
                    region={preferredRegionInput}
                  />
                )}
                <div style={{ display: "grid", gap: "10px" }}>
                  {activeLocationCandidates.map((item) => {
                    const selected = selectedLocationId === item.id;
                    const freshness = getFreshnessPresentation(item.freshness);
                    const scoreColor = (item.score ?? 0) >= 85 ? "#34c759" : (item.score ?? 0) >= 70 ? "#007aff" : "#ff9f0a";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        style={{
                          display: "grid",
                          gap: "8px",
                          padding: "16px 18px",
                          borderRadius: "16px",
                          border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: selected ? "rgba(29,53,87,0.04)" : "rgba(255,255,255,0.82)",
                          boxShadow: selected ? "0 0 0 4px rgba(29,53,87,0.06)" : "0 1px 4px rgba(0,0,0,0.03)",
                          cursor: freshness.isSelectable ? "pointer" : "default",
                          textAlign: "left" as const,
                          opacity: freshness.isSelectable ? 1 : 0.5,
                          transition: "all 0.2s ease"
                        }}
                        onClick={() => { if (freshness.isSelectable) setSelectedLocationId(item.id); }}
                        disabled={!freshness.isSelectable}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>{item.title}</div>
                            {item.meta?.districtName && (
                              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{String(item.meta.districtName)}</div>
                            )}
                          </div>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: `${scoreColor}14`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <span style={{ fontSize: "16px", fontWeight: 700, color: scoreColor }}>{item.score ?? "-"}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)" }}>{item.summary}</div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                          {[
                            { label: language === "ko" ? "임대료" : "Rent", value: formatMarketMetaValue("rentBand", item.meta?.rentBand, language) },
                            { label: language === "ko" ? "경쟁도" : "Competition", value: formatMarketMetaValue("competitionLevel", item.meta?.competitionLevel, language) },
                            { label: language === "ko" ? "적합도" : "Fit", value: formatMarketMetaValue("customerFit", item.meta?.customerFit, language) }
                          ].map((chip) => (
                            <span key={chip.label} style={{
                              fontSize: "11px", fontWeight: 500,
                              padding: "4px 10px", borderRadius: "8px",
                              background: selected ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.03)",
                              border: "1px solid var(--border)",
                              color: "var(--muted)"
                            }}>
                              {chip.label} {chip.value}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
                </>
              ) : (
                <>
                  <div style={styles.inlinePanel}>
                    <div style={styles.inlinePanelHeader}>
                      <div style={styles.budgetLabel}>
                        {customLocationLabel}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={customMarketName}
                      onChange={(event) => setCustomMarketName(event.target.value)}
                      placeholder={customLocationPlaceholder}
                      style={styles.textInput}
                    />
                    <textarea
                      value={customMarketReason}
                      onChange={(event) => setCustomMarketReason(event.target.value)}
                      placeholder={customLocationReasonPlaceholder}
                      style={styles.textarea}
                    />
                    <div style={styles.stageInlineActions}>
                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          opacity: customMarketName.trim() ? 1 : 0.45
                        }}
                        disabled={!customMarketName.trim()}
                        onClick={async () => {
                          const signal = await loadBestMarketSignal(supabase, {
                            regionQuery: preferredRegionInput,
                            marketQuery: customMarketName,
                            categoryId: industryCategoryId
                          }).catch(() => null);
                          const result = evaluateDirectMarket({
                            region: preferredRegionInput,
                            marketName: customMarketName,
                            categoryId: industryCategoryId,
                            capital: selectedBudget,
                            candidates: locationOptions,
                            signal
                          });
                          const evaluation = localizeRecommendationItem(result.evaluation, language);
                          const alternative = result.alternative
                            ? localizeRecommendationItem(result.alternative, language)
                            : null;
                          setManualMarketEvaluation(evaluation);
                          setManualAlternative(alternative);
                          setSelectedLocationId(undefined);
                        }}
                      >
                        {scoreLocationLabel}
                      </button>
                    </div>
                  </div>

                  {manualMarketEvaluation ? (
                    <div style={styles.inlinePanel}>
                      <div style={styles.budgetLabel}>
                        {language === "ko" ? "평가 결과" : "Evaluation"}
                      </div>
                      <div style={styles.recommendationTop}>
                        <div style={styles.optionTitle}>{manualMarketEvaluation.title}</div>
                        <div style={styles.scoreBadge}>
                          {language === "ko" ? `점수 ${manualMarketEvaluation.score ?? "-"}` : `Score ${manualMarketEvaluation.score ?? "-"}`}
                        </div>
                      </div>
                      {manualMarketEvaluation.meta?.districtName ? (
                        <div style={styles.freshnessText}>
                          {String(manualMarketEvaluation.meta.districtName)}
                        </div>
                      ) : null}
                      <div style={styles.optionSummary}>{manualMarketEvaluation.summary}</div>
                      <div style={styles.helper}>
                        {language === "ko"
                          ? "이 상권으로 진행할지, build.up이 한 번 더 제안하는 대안을 볼지 선택하세요."
                          : "Choose whether to keep this market or review one suggested alternative."}
                      </div>
                      <div style={styles.stageInlineActions}>
                        <button
                          type="button"
                          style={styles.primaryButton}
                          onClick={() => setSelectedLocationId(manualMarketEvaluation.id)}
                        >
                          {language === "ko" ? "내가 고른 상권 유지" : "Keep my market"}
                        </button>
                        {manualAlternative ? (
                          <button
                            type="button"
                            style={styles.button}
                            onClick={() => {
                              setLocationMode("recommended");
                              setRecommendedMarkets(
                                buildRecommendedMarkets({
                                  region: preferredRegionInput || customMarketName,
                                  categoryId: industryCategoryId,
                                  capital: selectedBudget,
                                  candidates: locationOptions
                                }).map((item) => localizeRecommendationItem(item, language))
                              );
                              setSelectedLocationId(manualAlternative.id);
                            }}
                          >
                            {language === "ko" ? "추천 대안 보기" : "View suggested alternative"}
                          </button>
                        ) : null}
                      </div>
                      {manualAlternative ? (
                        <div style={styles.inlinePanel}>
                          <div style={styles.budgetLabel}>
                            {language === "ko" ? "이런 곳은 어떠세요?" : "How about this instead?"}
                          </div>
                          <div style={styles.recommendationTop}>
                            <div style={styles.optionTitle}>{manualAlternative.title}</div>
                            <div style={styles.scoreBadge}>
                              {language === "ko" ? `점수 ${manualAlternative.score ?? "-"}` : `Score ${manualAlternative.score ?? "-"}`}
                            </div>
                          </div>
                          <div style={styles.optionSummary}>{manualAlternative.summary}</div>
                          <div style={styles.helper}>
                            {language === "ko"
                              ? "원래 고른 상권도 계속 유지할 수 있습니다."
                              : "You can still keep your original market choice."}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}

              {finalSelectedMarket ? (
                <div style={styles.inlinePanel}>
                  <div style={styles.inlinePanelHeader}>
                    <div style={styles.budgetLabel}>
                      {selectedLocationDetailLabel}
                    </div>
                  </div>
                  <div style={styles.recommendationTop}>
                    <div style={styles.optionTitle}>{finalSelectedMarket.title}</div>
                    <div style={styles.scoreBadge}>
                      {language === "ko" ? `점수 ${finalSelectedMarket.score ?? "-"}` : `Score ${finalSelectedMarket.score ?? "-"}`}
                    </div>
                  </div>
                  {finalSelectedMarket.meta?.districtName ? (
                    <div style={styles.freshnessText}>
                      {String(finalSelectedMarket.meta.districtName)}
                    </div>
                  ) : null}
                  <div style={styles.optionSummary}>{finalSelectedMarket.summary}</div>
                  <div style={styles.helper}>
                    {buildMarketScoreNarrative(finalSelectedMarket, language)}
                  </div>
                  <div style={styles.budgetLabel}>
                    {language === "ko" ? "왜 괜찮은가" : "Why this works"}
                  </div>
                  {finalSelectedMarket.reasons?.slice(0, 2).map((reason) => (
                    <div key={reason} style={styles.helper}>
                      {reason}
                    </div>
                  ))}
                  <div style={styles.budgetLabel}>
                    {language === "ko" ? "주의할 점" : "Watch-outs"}
                  </div>
                  {finalSelectedMarket.warnings?.slice(0, 1).map((warning) => (
                    <div key={warning} style={styles.warningText}>
                      {warning}
                    </div>
                  ))}
                </div>
              ) : null}

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
                    opacity: canCompleteLocationStep ? 1 : 0.45
                  }}
                  onClick={handleLocationContinue}
                  disabled={!canCompleteLocationStep}
                >
                  {isDigitalCategory
                    ? language === "ko"
                      ? "이 거점으로 운영 준비 시작"
                      : "Use this base and continue"
                    : copy.home.selectMarketAndContinue}
                </button>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          ) : currentStage.code === "contract_review" ? (
            <>
              <div style={styles.helper}>
                {isDigitalCategory
                  ? language === "ko"
                    ? "운영 공간, 보관, 택배, 공급 접근성처럼 온라인 판매의 실제 실행 조건을 먼저 점검합니다."
                    : "Review workspace, storage, shipping, and sourcing conditions before scaling online operations."
                  : copy.home.contractHelp}
              </div>
              <div style={styles.budgetLabel}>
                {language === "ko" ? "꼭 볼 것 3개" : "Three must-check items"}
              </div>
                <div style={styles.optionGrid}>
                  {contractTasks.map((task) => {
                    const completed = task.status === "completed";
                    const selected = activeContractTask?.taskId === task.taskId;
                    const analysisHints = getContractAnalysisHints(
                      effectiveContractAnalysis,
                      task.taskId,
                      industryCategoryId,
                      language
                    );
                    return (
                      <button
                        key={task.taskId}
                      type="button"
                      style={{
                        ...styles.optionCard,
                        ...(completed ? {
                          background: "linear-gradient(180deg, rgba(240,248,240,0.95) 0%, rgba(220,245,220,0.85) 100%)",
                          border: "1px solid rgba(34,139,34,0.28)",
                          boxShadow: "0 0 0 3px rgba(34,139,34,0.07), 0 10px 24px rgba(17,17,17,0.04)"
                        } : selected ? styles.optionCardSelected : {})
                      }}
                      onClick={() => setSelectedContractTaskId(task.taskId)}
                      >
                        <div style={styles.recommendationTop}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {completed && (
                              <div style={{
                                width: "20px", height: "20px", borderRadius: "50%",
                                background: "#34c759", display: "flex", alignItems: "center",
                                justifyContent: "center", flexShrink: 0
                              }}>
                                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                            <div style={{ ...styles.optionTitle, ...(completed ? { color: "rgba(17,17,17,0.6)" } : {}) }}>
                              {getContractTaskDetail(task.taskId, language, industryCategoryId).title}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            {analysisHints.length > 0 ? (
                              <div style={styles.confidenceBadge}>
                                {language === "ko" ? `AI 주의 ${analysisHints.length}` : `AI focus ${analysisHints.length}`}
                              </div>
                            ) : null}
                            <div style={{
                              ...styles.scoreBadge,
                              ...(completed ? { background: "rgba(34,139,34,0.12)", color: "#228B22" } : {})
                            }}>
                              {completed ? (language === "ko" ? "확인 완료" : "Done") : `${task.estimatedMinutes ?? "-"} ${language === "ko" ? "분" : "min"}`}
                            </div>
                          </div>
                        </div>
                      <div style={styles.optionSummary}>
                        {analysisHints.length > 0
                          ? analysisHints[0]
                          : activeContractTask?.taskId === task.taskId
                            ? activeContractTaskDetail?.summary
                            : copy.common.requiredReviewItem}
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeContractTask && activeContractTaskDetail ? (
                <div style={styles.inlinePanel}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div>
                      <div style={{ ...styles.budgetLabel, marginBottom: "6px" }}>
                        {language === "ko" ? "현재 확인할 항목" : "Current review item"}
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 660, letterSpacing: "-0.2px", lineHeight: 1.2 }}>
                        {activeContractTaskDetail.title}
                      </div>
                    </div>
                    <div style={{
                      ...styles.scoreBadge,
                      whiteSpace: "nowrap" as const,
                      flexShrink: 0,
                      ...(activeContractTask.status === "completed"
                        ? { background: "rgba(34,139,34,0.12)", color: "#228B22" }
                        : {})
                    }}>
                      {activeContractTask.status === "completed"
                        ? language === "ko" ? "확인 완료" : "Done"
                        : `${activeContractTask.estimatedMinutes ?? "-"} ${language === "ko" ? "분" : "min"}`}
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ ...styles.optionSummary, fontSize: "14px" }}>
                    {activeContractTaskDetail.summary}
                  </div>

                  {/* AI hints (if any) */}
                  {getContractAnalysisHints(effectiveContractAnalysis, activeContractTask.taskId, industryCategoryId, language).length > 0 ? (
                    <div style={{
                      display: "grid",
                      gap: "8px",
                      padding: "14px 16px",
                      borderRadius: "16px",
                      background: "rgba(255,200,50,0.10)",
                      border: "1px solid rgba(200,150,0,0.18)"
                    }}>
                      <div style={{ ...styles.budgetLabel, color: "#9a6a00" }}>
                        {language === "ko" ? "AI가 먼저 보라고 한 이유" : "Why AI flagged this item"}
                      </div>
                      {getContractAnalysisHints(effectiveContractAnalysis, activeContractTask.taskId, industryCategoryId, language).map((item) => (
                        <div key={item} style={{ fontSize: "13px", lineHeight: 1.6, color: "#7a5200" }}>• {item}</div>
                      ))}
                    </div>
                  ) : null}

                  {/* Checklist */}
                  {activeContractTaskDetail.checklist.length > 0 ? (
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div style={styles.budgetLabel}>
                        {language === "ko" ? "확인할 항목" : "Checklist"}
                      </div>
                      {activeContractTaskDetail.checklist.map((item) => (
                        <div key={item} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <div style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            border: "1.5px solid rgba(29,53,87,0.25)",
                            flexShrink: 0,
                            marginTop: "3px",
                            background: "rgba(255,255,255,0.7)"
                          }} />
                          <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--primary)" }}>{item}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Traps / Pitfalls */}
                  {activeContractTaskDetail.traps.length > 0 ? (
                    <div style={{ display: "grid", gap: "8px" }}>
                      <div style={styles.budgetLabel}>
                        {language === "ko" ? "흔한 함정" : "Common pitfalls"}
                      </div>
                      {activeContractTaskDetail.traps.map((trap) => (
                        <div key={trap.label} style={{
                          display: "grid",
                          gap: "4px",
                          padding: "12px 14px",
                          borderRadius: "14px",
                          background: "rgba(220,60,30,0.05)",
                          border: "1px solid rgba(200,60,30,0.14)"
                        }}>
                          <div style={{ fontSize: "13px", fontWeight: 620, color: "#b83020", letterSpacing: "-0.1px" }}>
                            ⚠ {trap.label}
                          </div>
                          <div style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--muted)" }}>{trap.desc}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Action steps */}
                  {activeContractTaskDetail.actions.length > 0 ? (
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div style={styles.budgetLabel}>
                        {language === "ko" ? "지금 할 행동" : "Action steps"}
                      </div>
                      {activeContractTaskDetail.actions.map((action) => (
                        action.href ? (
                          <a
                            key={action.label}
                            href={action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "14px",
                              lineHeight: 1.5,
                              color: "var(--accent)",
                              textDecoration: "none",
                              padding: "4px 0"
                            }}
                          >
                            <span style={{ flexShrink: 0, opacity: 0.7 }}>↗</span>
                            <span>{action.label}</span>
                          </a>
                        ) : (
                          <div key={action.label} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "4px 0" }}>
                            <span style={{ fontSize: "14px", color: "var(--muted)", flexShrink: 0, marginTop: "1px" }}>→</span>
                            <div style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--primary)" }}>{action.label}</div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : null}

                  {/* Questions to ask */}
                  {activeContractTaskDetail.questions.length > 0 ? (
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div style={styles.budgetLabel}>
                        {language === "ko" ? "건물주·중개사에게 물어볼 것" : "Ask the landlord / agent"}
                      </div>
                      {activeContractTaskDetail.questions.map((q) => (
                        <div key={q} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <div style={{ fontSize: "14px", color: "var(--muted)", flexShrink: 0, marginTop: "1px" }}>Q</div>
                          <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--primary)", fontStyle: "italic" }}>{q}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Complete button */}
                  <div style={styles.stageInlineActions}>
                    <button
                      type="button"
                      style={activeContractTask.status === "completed" ? styles.button : styles.primaryButton}
                      onClick={() => handleContractTaskToggle(activeContractTask.taskId)}
                    >
                      {activeContractTask.status === "completed"
                        ? language === "ko" ? "다시 확인하기로 표시" : "Mark as not reviewed"
                        : language === "ko" ? "이 항목 확인 완료" : "Mark this item reviewed"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div style={styles.inlinePanel}>
                <div style={styles.inlinePanelHeader}>
                  <div style={styles.budgetLabel}>{language === "ko" ? "계약서 조항 분석" : "Contract clause analysis"}</div>
                  <div style={styles.helper}>
                    {language === "ko"
                      ? "상가 임대차 계약서 원문을 붙여넣으면 위험 조항, 누락 항목, 특이 조건을 먼저 짚어드립니다."
                      : "Paste the lease text to flag risky clauses, missing items, and unusual terms before signing."}
                  </div>
                </div>
                <div style={styles.aiHelper}>
                  {language === "ko"
                    ? "법률 자문이 아닌 1차 위험 점검입니다. 긴 계약서는 핵심 조항 중심으로 나눠 검토하는 편이 안전합니다."
                    : "This is a first-pass risk review, not legal advice. Review long leases in smaller key-clause sections."}
                </div>
                <textarea
                  value={contractText}
                  onChange={(event) => setContractText(event.target.value)}
                  placeholder={
                    language === "ko"
                      ? "임대차 계약서 원문을 붙여넣어 보세요. 예: 임대료, 원상복구, 권리금, 해지 조항..."
                      : "Paste the lease text here. Focus on rent, restoration, key money, termination, and renewal clauses."
                  }
                  style={{ ...styles.textarea, ...styles.aiTextarea }}
                />
                <div style={styles.aiHelper}>
                  {language === "ko"
                    ? "최소 100자 이상, 10,000자 이하의 텍스트를 권장합니다."
                    : "Use at least 100 characters and keep the text under 10,000 characters."}
                </div>
                <div style={styles.stageInlineActions}>
                  <button
                    type="button"
                    style={{ ...styles.button, ...(contractText.trim() ? styles.surfaceNavButtonSelected : {}) }}
                    onClick={handleContractAnalysis}
                    disabled={!contractText.trim() || contractAnalysisStatus === "loading"}
                  >
                    {contractAnalysisStatus === "loading"
                      ? language === "ko"
                        ? "분석 중..."
                        : "Analyzing..."
                      : language === "ko"
                        ? "계약서 분석하기"
                        : "Analyze contract"}
                  </button>
                </div>
                {contractAnalysisError ? <div style={styles.warningText}>{contractAnalysisError}</div> : null}
                {effectiveContractAnalysis ? (
                  <div style={{ ...styles.inlinePanel, ...styles.aiInlinePanel }}>
                    <div style={styles.inlinePanelMetaRow}>
                      <div style={styles.budgetLabel}>
                        {language === "ko" ? "AI 해석 · 계약서 원문 기반" : "AI interpretation · grounded in contract text"}
                      </div>
                      <div style={styles.confidenceBadge}>
                        {language === "ko"
                          ? effectiveContractAnalysis.riskLevel === "critical"
                            ? "위험 높음"
                            : effectiveContractAnalysis.riskLevel === "high"
                              ? "주의 필요"
                              : effectiveContractAnalysis.riskLevel === "medium"
                                ? "검토 권장"
                                : "기본 확인"
                          : effectiveContractAnalysis.riskLevel}
                      </div>
                    </div>
                    <div style={styles.inlinePanelHeader}>
                      <div style={styles.budgetLabel}>{language === "ko" ? "한 줄 요약" : "Summary"}</div>
                      <div style={styles.optionTitle}>{effectiveContractAnalysis.summary}</div>
                    </div>
                    {effectiveContractAnalysis.flaggedClauses.length > 0 ? (
                      <>
                        <div style={styles.budgetLabel}>{language === "ko" ? "위험 조항" : "Flagged clauses"}</div>
                        {effectiveContractAnalysis.flaggedClauses.slice(0, 3).map((clause) => (
                          <div key={`${clause.excerpt}-${clause.issue}`} style={styles.budgetPanel}>
                            <div style={styles.optionSummary}>{clause.excerpt}</div>
                            <div style={clause.severity === "danger" ? styles.criticalText : styles.warningText}>
                              {clause.issue}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : null}
                    {effectiveContractAnalysis.missingItems.length > 0 ? (
                      <>
                        <div style={styles.budgetLabel}>{language === "ko" ? "누락 확인 항목" : "Missing checks"}</div>
                        {effectiveContractAnalysis.missingItems.slice(0, 3).map((item) => (
                          <div key={item} style={styles.aiHelper}>• {item}</div>
                        ))}
                      </>
                    ) : null}
                    {effectiveContractAnalysis.unusualTerms.length > 0 ? (
                      <>
                        <div style={styles.budgetLabel}>{language === "ko" ? "특이 조건" : "Unusual terms"}</div>
                        {effectiveContractAnalysis.unusualTerms.slice(0, 3).map((item) => (
                          <div key={item} style={styles.aiHelper}>• {item}</div>
                        ))}
                      </>
                    ) : null}
                    <div style={styles.budgetLabel}>{language === "ko" ? "다음 행동" : "Next actions"}</div>
                    {effectiveContractAnalysis.nextActions.slice(0, 3).map((item) => (
                      <div key={item} style={styles.aiHelper}>• {item}</div>
                    ))}
                  </div>
                ) : null}
              </div>

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
                    opacity: contractTasks.every((task) => task.status === "completed") ? 1 : 0.45
                  }}
                  onClick={handleContractContinue}
                  disabled={!contractTasks.every((task) => task.status === "completed")}
                >
                  {copy.home.completeContractReview}
                </button>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          ) : (
            currentStage.code === "permit_check" ||
            currentStage.code === "construction_setup" ||
            currentStage.code === "vendor_setup" ||
            currentStage.code === "registration_setup" ||
            currentStage.code === "insurance_tax_setup" ||
            currentStage.code === "hiring_setup" ||
            currentStage.code === "operations_setup" ||
            currentStage.code === "pre_launch" ||
            currentStage.code === "platform_setup" ||
            currentStage.code === "online_registration" ||
            currentStage.code === "sourcing_setup" ||
            currentStage.code === "store_setup" ||
            currentStage.code === "online_marketing" ||
            currentStage.code === "startup_foundation" ||
            currentStage.code === "customer_discovery" ||
            currentStage.code === "mvp_build" ||
            currentStage.code === "launch_gtm" ||
            currentStage.code === "growth_engine" ||
            currentStage.code === "company_setup" ||
            currentStage.code === "fundraising_readiness" ||
            currentStage.code === "venture_certification" ||
            currentStage.code === "biz_registration" ||
            currentStage.code === "pre_launch_final" ||
            currentStage.code === "first_month_check" ||
            (currentStage.code as string) === "franchise_application"
          ) ? (() => {
            const stageIdMap: Record<string, string> = {
              franchise_application: "franchise-application",
              permit_check: "permit-check",
              construction_setup: "construction-setup",
              vendor_setup: "vendor-setup",
              registration_setup: "registration-setup",
              insurance_tax_setup: "insurance-tax-setup",
              hiring_setup: "hiring-setup",
              operations_setup: "operations-setup",
              pre_launch: "pre-launch",
              platform_setup: "platform-setup",
              online_registration: "online-registration",
              sourcing_setup: "sourcing-setup",
              store_setup: "store-setup",
              online_marketing: "online-marketing",
              startup_foundation: "startup-foundation",
              customer_discovery: "customer-discovery",
              mvp_build: "mvp-build",
              launch_gtm: "launch-gtm",
              growth_engine: "growth-engine",
              company_setup: "company-setup",
              fundraising_readiness: "fundraising-readiness",
              venture_certification: "venture-certification",
              biz_registration: "biz-registration",
              pre_launch_final: "pre-launch-final",
              first_month_check: "first-month-check"
            };
            const stageId = stageIdMap[currentStage.code] ?? currentStage.code.replace(/_/g, "-");
            const stageTasks = taskMap[stageId] ?? [];
            const isPreLaunch = stageId === "pre-launch";
            const preLaunchDoneMap: Record<string, boolean> = isPreLaunch ? (() => {
              const guestSel = ["guest-family","guest-neighbor","guest-influencer","guest-peer"].some(k => softOpenChecks[k]);
              const prepDone = ["prep-feedback-form","prep-invite-sent","prep-sns-plan"].every(k => softOpenChecks[k]);
              const dayKeys = ["day-cleanliness","day-staff-briefing","day-pos","day-ambiance","day-observation","day-payment","day-feedback-card","day-debrief","day-settlement","day-sns","day-inventory","day-order-timing","day-delivery","day-booking-system","day-no-show","day-service-time","day-display","day-checkout-test","day-equipment","day-crm","day-class","day-checkout-online","day-cs","day-fulfillment"];
              const fbKeys = ["feedback-service","feedback-price","feedback-ambiance","feedback-taste","feedback-quality","feedback-product","feedback-facility","feedback-ux","feedback-booking","feedback-menu","feedback-display","feedback-instructor"];
              const finalKeys = ["final-naver","final-instagram","final-kakao","final-event"];
              const finalAllResolved = finalKeys.every(k => softOpenChecks[k] || softOpenSkips[k]);
              const finalAtLeastOne  = finalKeys.some(k => softOpenChecks[k]);
              return {
                "soft-open-done":     guestSel && softOpenPricing !== "" && prepDone,
                "feedback-collected": dayKeys.filter(k => softOpenChecks[k]).length >= 6,
                "final-checklist":    fbKeys.filter(k => softOpenChecks[k]).length >= 4 && finalAllResolved && finalAtLeastOne,
              };
            })() : {};
            const completedCount = stageTasks.filter((t) => isPreLaunch ? (preLaunchDoneMap[t.taskId] ?? false) : t.status === "completed").length;
            const allDone = stageTasks.length > 0 && completedCount === stageTasks.length;
            return (
              <>
                <div style={styles.helper}>{localizedCurrentStage.goal}</div>

                {/* ── 사업자·통신판매 등록 가이드 (online_registration) ── */}
                {currentStage.code === "online_registration" && (() => {
                  const ko = language === "ko";
                  // regPage — hoisted to component top (0=사업자, 1=통신판매)

                  const pages = [
                    // ── 페이지 0: 사업자등록 ──
                    () => (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.1)", background: "linear-gradient(180deg, rgba(37,99,235,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        {/* 헤더 */}
                        <div style={{ padding: "24px 24px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 650, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 1 / 2</div>
                              <div style={{ fontSize: "20px", fontWeight: 720, letterSpacing: "-0.03em", color: "#0f172a" }}>{ko ? "사업자등록" : "Business Registration"}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
                            {ko ? "사업자등록증은 모든 상거래의 출발점입니다. 스마트스토어·쿠팡 등 판매 플랫폼 입점, 세금계산서 발행, 사업용 통장 개설에 반드시 필요합니다." : "Business registration is the starting point for all commerce — required for platform onboarding, invoicing, and business banking."}
                          </div>
                        </div>

                        {/* 어디서 + 바로가기 */}
                        <div style={{ margin: "0 24px 16px", padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "2px" }}>{ko ? "신청 장소" : "Where"}</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 세무서 또는 홈택스" : "Tax office or Hometax"}</div>
                          </div>
                          <a href="https://www.hometax.go.kr" target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: "10px", background: "#2563eb", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                            {ko ? "홈택스 바로가기" : "Go to Hometax"} <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </a>
                        </div>

                        {/* 준비물 체크리스트 */}
                        <div style={{ padding: "0 24px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "준비물" : "Required Documents"}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            {(ko ? [
                              { item: "신분증 (주민등록증/운전면허)", required: true },
                              { item: "임대차계약서 (자택이면 불필요)", required: false },
                              { item: "사업계획서 (간단히 1장)", required: false },
                              { item: "통장 사본 (환급용)", required: true },
                            ] : [
                              { item: "Government ID", required: true },
                              { item: "Lease contract (not needed if home)", required: false },
                              { item: "Business plan (simple 1 page)", required: false },
                              { item: "Bank account copy (for refund)", required: true },
                            ]).map((d, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderRadius: "10px", background: "rgba(37,99,235,0.03)" }}>
                                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: d.required ? "#2563eb" : "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {d.required && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.4 }}>{d.item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 절차 */}
                        <div style={{ padding: "0 24px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "신청 절차" : "Process"}</div>
                          {(ko ? [
                            { step: "홈택스 접속 → 로그인 (공동인증서)", detail: "공동인증서가 없으면 세무서 방문도 가능합니다" },
                            { step: "신청/제출 → 사업자등록 신청 클릭", detail: "개인사업자 선택 (법인 아님)" },
                            { step: "업종코드 입력: 전자상거래 소매업 (47911)", detail: "온라인 판매의 기본 업종코드입니다" },
                            { step: "사업장 주소 입력", detail: "자택도 가능 — 전입세대열람원으로 대체" },
                            { step: "제출 후 즉일~3영업일 내 발급", detail: "문자로 발급 알림이 옵니다" },
                          ] : [
                            { step: "Log into Hometax (certificate required)", detail: "Visit tax office if no certificate" },
                            { step: "Apply → Business Registration", detail: "Select sole proprietor (not corporation)" },
                            { step: "Industry code: 47911 (e-commerce retail)", detail: "Standard code for online selling" },
                            { step: "Enter business address", detail: "Home address allowed" },
                            { step: "Submit — issued in 0~3 business days", detail: "SMS notification when ready" },
                          ]).map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", marginBottom: "2px" }}>{s.step}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 과세 유형 비교 */}
                        <div style={{ padding: "0 24px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "간이과세 vs 일반과세" : "Tax Type Comparison"}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.1)" }}>
                              <div style={{ fontSize: "14px", fontWeight: 680, color: "#059669", marginBottom: "6px" }}>{ko ? "간이과세자" : "Simplified"}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                                {ko ? "연매출 8,000만원 이하 시 선택 가능. 부가세 면제 또는 감면. 세금계산서 발행 불가 (4,800만원 이하)." : "Available under 80M annual. VAT exempt/reduced. Cannot issue tax invoices under 48M."}
                              </div>
                              <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 600, color: "#059669", padding: "3px 8px", borderRadius: "6px", background: "rgba(5,150,105,0.08)", display: "inline-block" }}>{ko ? "초기 창업자 추천" : "Recommended for starters"}</div>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.08)" }}>
                              <div style={{ fontSize: "14px", fontWeight: 680, color: "#2563eb", marginBottom: "6px" }}>{ko ? "일반과세자" : "Standard"}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                                {ko ? "연매출 8,000만원 초과 또는 B2B 거래 시. 부가세 10% 납부. 세금계산서 발행 가능. 매입세액 공제 가능." : "Over 80M annual or B2B. 10% VAT. Can issue tax invoices. Input tax deductible."}
                              </div>
                              <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 600, color: "#2563eb", padding: "3px 8px", borderRadius: "6px", background: "rgba(37,99,235,0.06)", display: "inline-block" }}>{ko ? "B2B · 고매출 시" : "For B2B / high revenue"}</div>
                            </div>
                          </div>
                        </div>

                        {/* 팁 */}
                        <div style={{ margin: "0 24px 20px", padding: "12px 16px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#2563eb" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          <span style={{ fontSize: "12px", color: "rgba(37,99,235,0.8)", lineHeight: 1.55 }}>
                            {ko ? "자택 사업자도 가능합니다. 임대차계약서 없이 전입세대열람원(주민센터 발급)으로 대체할 수 있습니다. 처리기간은 보통 당일~1일입니다." : "Home-based business is possible. Resident registration document from community center substitutes lease. Usually processed same day."}
                          </span>
                        </div>
                      </div>
                    ),

                    // ── 페이지 1: 통신판매업 신고 ──
                    () => (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.1)", background: "linear-gradient(180deg, rgba(124,58,237,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        {/* 헤더 */}
                        <div style={{ padding: "24px 24px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 650, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 2 / 2</div>
                              <div style={{ fontSize: "20px", fontWeight: 720, letterSpacing: "-0.03em", color: "#0f172a" }}>{ko ? "통신판매업 신고" : "Telecom Sales Filing"}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
                            {ko ? "온라인으로 상품을 판매하려면 통신판매업 신고가 법적 의무입니다. 미신고 시 과태료 최대 1,000만원이며, 네이버 스마트스토어·쿠팡 입점 시 신고번호를 요구합니다." : "Legally required for all online sales. Up to ₩10M fine if unfiled. Smartstore and Coupang require the filing number."}
                          </div>
                        </div>

                        {/* 경고 */}
                        <div style={{ margin: "0 24px 16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#dc2626", lineHeight: 1.5 }}>
                            {ko ? "미신고 시 과태료 최대 1,000만원. 사업자등록 후 반드시 진행하세요." : "Fine up to ₩10M if unfiled. Must complete after business registration."}
                          </span>
                        </div>

                        {/* 어디서 + 바로가기 */}
                        <div style={{ margin: "0 24px 16px", padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "2px" }}>{ko ? "신청 장소" : "Where"}</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 구청 또는 정부24" : "District office or Gov24"}</div>
                          </div>
                          <a href="https://www.gov.kr" target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: "10px", background: "#7c3aed", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                            {ko ? "정부24 바로가기" : "Go to Gov24"} <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </a>
                        </div>

                        {/* 준비물 */}
                        <div style={{ padding: "0 24px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "준비물" : "Required Documents"}</div>
                          <div style={{ display: "grid", gap: "6px" }}>
                            {(ko ? [
                              { item: "사업자등록증 사본", detail: "1단계에서 발급받은 것", required: true },
                              { item: "신분증", detail: "주민등록증 또는 운전면허증", required: true },
                              { item: "구매안전서비스(에스크로) 가입증명", detail: "PG사 가입 시 자동 발급", required: true },
                            ] : [
                              { item: "Business registration copy", detail: "From Step 1", required: true },
                              { item: "Government ID", detail: "Resident ID or driver's license", required: true },
                              { item: "Escrow service certificate", detail: "Auto-issued from PG provider", required: true },
                            ]).map((d, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.03)" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#7c3aed"/><path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{d.item}</div>
                                  <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)" }}>{d.detail}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 구매안전서비스 설명 */}
                        <div style={{ margin: "0 24px 16px", padding: "16px", borderRadius: "14px", background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.06)" }}>
                          <div style={{ fontSize: "13px", fontWeight: 680, color: "#7c3aed", marginBottom: "6px" }}>{ko ? "구매안전서비스(에스크로)란?" : "What is escrow service?"}</div>
                          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
                            {ko ? "소비자가 결제한 금액을 판매자에게 바로 전달하지 않고, 제3자(PG사)가 보관했다가 상품 수령 확인 후 정산하는 시스템입니다. 통신판매업 신고 시 필수이며, 아래 PG사 중 하나에 가입하면 자동 발급됩니다." : "A system where payment is held by a third party (PG) until the buyer confirms receipt. Required for telecom filing. Auto-issued when signing up with a PG provider below."}
                          </div>
                          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" as const }}>
                            {["토스페이먼츠", "KG이니시스", "NHN KCP", "네이버페이 (스마트스토어 자동)"].map(pg => (
                              <span key={pg} style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px", background: "rgba(124,58,237,0.06)", color: "#7c3aed" }}>{pg}</span>
                            ))}
                          </div>
                        </div>

                        {/* 절차 */}
                        <div style={{ padding: "0 24px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "신고 절차" : "Filing Process"}</div>
                          {(ko ? [
                            { step: "정부24 접속 → '통신판매업 신고' 검색", detail: "공동인증서 로그인 필요" },
                            { step: "신고서 작성 → 사업자 정보 입력", detail: "사업자등록증의 정보와 일치해야 합니다" },
                            { step: "구매안전서비스 가입증명 첨부", detail: "PG사에서 발급받은 PDF 업로드" },
                            { step: "제출 → 즉일~5영업일 내 처리", detail: "신고번호가 문자로 발송됩니다" },
                            { step: "신고번호를 판매 플랫폼에 입력", detail: "스마트스토어·쿠팡 설정에서 등록" },
                          ] : [
                            { step: "Go to Gov24 → Search 'telecom sales filing'", detail: "Certificate login required" },
                            { step: "Fill form → Enter business info", detail: "Must match business registration" },
                            { step: "Attach escrow certificate", detail: "Upload PDF from PG provider" },
                            { step: "Submit → Processed in 0~5 business days", detail: "Filing number sent via SMS" },
                            { step: "Enter filing number in sales platforms", detail: "Register in Smartstore/Coupang settings" },
                          ]).map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", marginBottom: "2px" }}>{s.step}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 비용 */}
                        <div style={{ margin: "0 24px 16px", display: "flex", gap: "8px" }}>
                          <div style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", textAlign: "center" as const }}>
                            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "4px" }}>{ko ? "신고 수수료" : "Filing Fee"}</div>
                            <div style={{ fontSize: "18px", fontWeight: 740, color: "#059669" }}>{ko ? "무료" : "Free"}</div>
                          </div>
                          <div style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(217,119,6,0.04)", textAlign: "center" as const }}>
                            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "4px" }}>{ko ? "등록면허세" : "License Tax"}</div>
                            <div style={{ fontSize: "18px", fontWeight: 740, color: "#d97706" }}>~40,500{ko ? "원" : "₩"}</div>
                            <div style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)" }}>{ko ? "구청별 상이" : "Varies"}</div>
                          </div>
                          <div style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", textAlign: "center" as const }}>
                            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "4px" }}>{ko ? "처리기간" : "Processing"}</div>
                            <div style={{ fontSize: "18px", fontWeight: 740, color: "#2563eb" }}>1~5{ko ? "일" : "d"}</div>
                          </div>
                        </div>

                        {/* 팁 */}
                        <div style={{ margin: "0 24px 20px", padding: "12px 16px", borderRadius: "12px", background: "rgba(124,58,237,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          <span style={{ fontSize: "12px", color: "rgba(124,58,237,0.8)", lineHeight: 1.55 }}>
                            {ko ? "네이버 스마트스토어 가입 시 구매안전서비스가 자동 연동되는 경우가 많습니다. 별도 PG 가입 전에 스마트스토어 센터에서 확인하세요." : "Escrow is often auto-linked when joining Naver Smartstore. Check Smartstore Center before signing up with a separate PG."}
                          </span>
                        </div>
                      </div>
                    ),
                  ];

                  return (
                    <div style={{ marginBottom: "16px" }}>
                      {pages[regPage]()}
                      {/* 페이지 네비게이션 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
                        <button type="button" onClick={() => setRegPage(0)} disabled={regPage === 0}
                          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: regPage === 0 ? "rgba(0,0,0,0.02)" : "white", color: regPage === 0 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: regPage === 0 ? "default" : "pointer" }}>
                          ← {ko ? "사업자등록" : "Registration"}
                        </button>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {[0, 1].map(i => (
                            <div key={i} onClick={() => setRegPage(i)} style={{ width: i === regPage ? "20px" : "8px", height: "8px", borderRadius: "100px", background: i === regPage ? "#1d3557" : "rgba(0,0,0,0.1)", cursor: "pointer", transition: "all 0.2s ease" }} />
                          ))}
                        </div>
                        <button type="button" onClick={() => setRegPage(1)} disabled={regPage === 1}
                          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: regPage === 1 ? "rgba(0,0,0,0.02)" : "white", color: regPage === 1 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: regPage === 1 ? "default" : "pointer" }}>
                          {ko ? "통신판매 신고" : "Telecom Filing"} →
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 판매 플랫폼 선택 (platform_setup — 온라인/디지털 업종) ── */}
                {currentStage.code === "platform_setup" && (() => {
                  const ko = language === "ko";
                  type PlatItem = { id: string; name: string; desc: string; color: string; url: string; fee: string; mau: string; pros: string[]; cons: string[] };
                  const platforms: PlatItem[] = [
                    { id: "smartstore", name: ko ? "네이버 스마트스토어" : "Naver Smartstore", desc: ko ? "쇼핑 검색 1위 · 결제수수료 최저" : "#1 shopping search · Lowest fee", color: "#03C75A", url: "https://sell.smartstore.naver.com", fee: ko ? "주문 1.98~3.74% + 판매 0.91~2.73%" : "Order 1.98~3.74% + Sale 0.91~2.73%", mau: "536만", pros: ko ? ["네이버 검색 노출 최강", "결제 수수료 최저 수준", "쇼핑라이브 가능", "스마트스토어 센터 무료"] : ["Best Naver search", "Lowest fees", "Shopping Live"], cons: ko ? ["광고 없이 초기 노출 어려움", "경쟁 셀러 매우 많음"] : ["Hard initial exposure", "Many competitors"] },
                    { id: "coupang-mp", name: ko ? "쿠팡 마켓플레이스" : "Coupang Marketplace", desc: ko ? "이커머스 MAU 1위 · 로켓그로스" : "#1 ecommerce MAU · Rocket Growth", color: "#1460F3", url: "https://wing.coupang.com", fee: ko ? "4~10.8% + 월 55,000원" : "4~10.8% + ₩55K/mo", mau: "3,339만", pros: ko ? ["최대 트래픽 (MAU 3,339만)", "로켓그로스 풀필먼트", "와우 멤버십 노출 우선"] : ["Most traffic", "Rocket Growth", "Wow priority"], cons: ko ? ["월 정액비 55,000원", "가격 경쟁 심화", "수수료 높은 편"] : ["₩55K monthly", "Price competition", "Higher fees"] },
                    { id: "kakao-store", name: ko ? "카카오톡 스토어" : "KakaoTalk Store", desc: ko ? "카톡 4,700만 사용자 · 선물하기" : "47M KakaoTalk · Gifting", color: "#F9E000", url: "https://store.kakaotalk.com", fee: ko ? "3.3~10% (경로별), 선물하기 ~15%" : "3.3~10%, Gifting ~15%", mau: "4,700만", pros: ko ? ["카톡 메시지 직접 마케팅", "선물하기 입점 가능", "간편결제 연동"] : ["Direct KakaoTalk marketing", "Gift feature"], cons: ko ? ["선물하기 수수료 ~15%", "자체 검색 유입 약함"] : ["~15% gift fee", "Weak organic search"] },
                    { id: "elevenst", name: ko ? "11번가" : "11st", desc: ko ? "신규 셀러 12개월 수수료 6%로 할인" : "New seller 6% for 12 months", color: "#FF0000", url: "https://soffice.11st.co.kr", fee: ko ? "7~13% (카테고리별), 신규 6%" : "7~13%, new seller 6%", mau: "893만", pros: ko ? ["신규 12개월 수수료 할인", "SKT 멤버십 연계", "아마존 글로벌 연동"] : ["12-month discount", "SKT members"], cons: ko ? ["트래픽 감소 추세", "수수료 높은 편"] : ["Declining traffic", "Higher fees"] },
                    { id: "gmarket", name: ko ? "G마켓/옥션" : "G-Market/Auction", desc: ko ? "묶음배송 · 해외판매 연동" : "Bundle shipping · Global selling", color: "#00A34F", url: "https://www.gmarket.co.kr", fee: ko ? "4~15% (평균 9%)" : "4~15% (avg 9%)", mau: "706만+296만", pros: ko ? ["묶음 배송 시스템", "해외 판매 eBay 연동", "광고 효율 양호"] : ["Bundle shipping", "eBay global"], cons: ko ? ["트래픽 감소 추세", "수수료 높은 편"] : ["Declining traffic"] },
                  ];

                  const selectedCount = platforms.filter(p => opsSelections[`platform-${p.id}`]).length;

                  return (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.38)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                          {ko ? "판매 플랫폼 비교 · 선택" : "Compare & Select Platforms"}
                        </span>
                        {selectedCount > 0 && (
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.1)", padding: "2px 8px", borderRadius: "100px" }}>
                            {selectedCount}{ko ? "개 선택" : " selected"}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        {platforms.map((item) => {
                          const selKey = `platform-${item.id}`;
                          const isSelected = !!opsSelections[selKey];
                          return (
                            <div key={item.id}
                              style={{
                                background: isSelected ? `${item.color}06` : "white",
                                borderRadius: "18px", overflow: "hidden", cursor: "pointer",
                                border: isSelected ? `1.5px solid ${item.color}30` : "1px solid rgba(0,0,0,0.06)",
                                boxShadow: isSelected ? `0 0 0 3px ${item.color}08` : "0 1px 4px rgba(0,0,0,0.03)",
                                transition: "all 0.2s ease",
                              }}
                              onClick={() => setOpsSelections(prev => ({ ...prev, [selKey]: !prev[selKey] }))}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px" }}>
                                <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.15)", background: isSelected ? item.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                  {isSelected && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: item.id === "coupang-mp" || item.id === "coupangeats" ? item.color : `${item.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: item.id === "elevenst" ? "15px" : "17px", fontWeight: 750, color: item.id === "coupang-mp" || item.id === "coupangeats" ? "#fff" : item.color }}>{item.id === "elevenst" ? "11" : item.name.charAt(0)}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "15px", fontWeight: isSelected ? 660 : 600, color: isSelected ? item.color : "var(--text)", letterSpacing: "-0.02em" }}>{item.name}</span>
                                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "6px", background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}>MAU {item.mau}</span>
                                  </div>
                                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{item.desc}</div>
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px", padding: "3px 10px", borderRadius: "8px", background: `${item.color}0a`, fontSize: "11px", fontWeight: 620, color: item.color }}>
                                    {ko ? "수수료" : "Fee"}: {item.fee}
                                  </div>
                                </div>
                                <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </a>
                              </div>
                              {isSelected && (
                                <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} className="bento-fade-in">
                                  <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(5,150,105,0.04)" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "장점" : "Pros"}</div>
                                    {item.pros.map((p, pi) => (
                                      <div key={pi} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                                        <span style={{ color: "#059669", flexShrink: 0 }}>+</span> {p}
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(220,38,38,0.03)" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 650, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "주의" : "Cons"}</div>
                                    {item.cons.map((c, ci) => (
                                      <div key={ci} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                                        <span style={{ color: "#dc2626", flexShrink: 0 }}>-</span> {c}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(0,122,255,0.06)", marginTop: "10px" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="7" cy="7" r="6" stroke="rgb(0,122,255)" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="rgb(0,122,255)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                        <span style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>
                          {ko ? "스마트스토어는 수수료가 가장 낮아 필수입니다. 쿠팡은 트래픽이 가장 크지만 월 정액비가 있어 매출이 안정된 후 추가하세요." : "Smartstore is essential due to lowest fees. Add Coupang after sales stabilize due to monthly fee."}
                        </span>
                      </div>

                      {/* 개설 순서 가이드 */}
                      <div style={{ marginTop: "20px", padding: "18px", borderRadius: "16px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a", marginBottom: "10px" }}>{ko ? "추천 개설 순서" : "Recommended Setup Order"}</div>
                        {[
                          { step: "1", text: ko ? "네이버 스마트스토어 개설 (사업자등록증 필요, 당일~1일 심사)" : "Open Naver Smartstore (business registration needed, 0~1 day review)" },
                          { step: "2", text: ko ? "인스타그램 비즈니스 + 네이버 플레이스 등록 (무료, 즉시)" : "Register Instagram Business + Naver Place (free, instant)" },
                          { step: "3", text: ko ? "매출 안정 후 쿠팡 마켓플레이스 추가 (월 55,000원 정액비)" : "Add Coupang Marketplace after stable sales (₩55K/month)" },
                          { step: "4", text: ko ? "카카오톡 스토어 · 11번가 등 추가 채널 확장" : "Expand to KakaoTalk Store, 11st, etc." },
                        ].map((s) => (
                          <div key={s.step} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>{s.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── 마케팅 및 론칭 가이드 (online_marketing) ── */}
                {currentStage.code === "online_marketing" && (() => {
                  const ko = language === "ko";
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 네이버 SEO */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(3,199,90,0.1)", background: "linear-gradient(180deg, rgba(3,199,90,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#03C75A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 700 }}>N</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "네이버 쇼핑 SEO 최적화" : "Naver Shopping SEO"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>{ko ? "온라인 매출의 60%+가 검색에서 시작됩니다. 첫 1개월이 노출 순위를 결정합니다." : "60%+ of online sales start from search. The first month determines your ranking."}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { title: "상품명 = 핵심 키워드 + 속성", detail: "\"여성 린넨 원피스 여름 A라인 프리사이즈\" — 검색어를 순서대로 넣으세요. 브랜드명은 앞에" },
                            { title: "카테고리 정확히 매칭", detail: "네이버 쇼핑 카테고리와 상품이 불일치하면 노출 자체가 안 됩니다" },
                            { title: "상세페이지 텍스트 최적화", detail: "이미지만 넣지 마세요. 검색 크롤러는 텍스트를 읽습니다. 핵심 키워드를 본문에 포함" },
                            { title: "태그 20개 모두 채우기", detail: "스마트스토어 태그는 검색 노출에 직접 영향. 관련 키워드를 빠짐없이 등록" },
                            { title: "최신성 점수 — 신상품 등록 주기", detail: "네이버는 신상품을 우대합니다. 주 2-3회 신규 상품 등록이 이상적" },
                          ] : [
                            { title: "Product name = keywords + attributes", detail: "Put search terms in order. Brand name first" },
                            { title: "Category matching", detail: "Mismatched category = zero exposure" },
                            { title: "Detail page text optimization", detail: "Don't rely on images only. Crawlers read text" },
                            { title: "Fill all 20 tags", detail: "Tags directly affect search ranking" },
                            { title: "Freshness score — new product frequency", detail: "Naver favors new products. 2-3 per week ideal" },
                          ]).map(s => (
                            <div key={s.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(3,199,90,0.03)", border: "1px solid rgba(3,199,90,0.06)" }}>
                              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "2px" }}>{s.title}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.detail}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 첫 광고 캠페인 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "첫 광고 캠페인 세팅" : "First Ad Campaign Setup"}</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>{ko ? "초기 2주는 데이터 수집 기간. 일 5,000~10,000원부터 시작하세요." : "First 2 weeks are data collection. Start at ₩5-10K/day."}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
                          {(ko ? [
                            { platform: "네이버 쇼핑 검색광고", budget: "일 5,000~10,000원", desc: "구매 의도가 가장 높은 채널. CPC 300~800원. ROAS 확인 후 증액", color: "#03C75A", url: "https://searchad.naver.com" },
                            { platform: "인스타그램 광고", budget: "일 10,000~20,000원", desc: "비주얼 제품에 효과적. 25-34세 여성 타깃. 릴스 광고 CTR 최고", color: "#E4405F", url: "https://business.instagram.com" },
                            { platform: "쿠팡 CPC 광고", budget: "일 5,000~15,000원", desc: "쿠팡 내 검색 결과 상단 노출. 쿠팡 판매 시 필수", color: "#1460F3", url: "https://wing.coupang.com" },
                          ] : [
                            { platform: "Naver Shopping Ads", budget: "₩5-10K/day", desc: "Highest purchase intent. CPC ₩300-800", color: "#03C75A", url: "https://searchad.naver.com" },
                            { platform: "Instagram Ads", budget: "₩10-20K/day", desc: "Great for visual products. Reels ads best CTR", color: "#E4405F", url: "https://business.instagram.com" },
                            { platform: "Coupang CPC Ads", budget: "₩5-15K/day", desc: "Top of Coupang search. Essential for Coupang sellers", color: "#1460F3", url: "https://wing.coupang.com" },
                          ]).map(p => (
                            <a key={p.platform} href={p.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: "12px", padding: "14px", borderRadius: "14px", border: `1px solid ${p.color}15`, background: `${p.color}03`, textDecoration: "none", color: "inherit" }}>
                              <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${p.color}10`, color: p.color, fontSize: "10px", fontWeight: 650, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "2px" }}>{p.budget}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a", marginBottom: "2px" }}>{p.platform}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{p.desc}</div>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "4px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* 리뷰 전략 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "8px" }}>{ko ? "초기 리뷰 확보 전략" : "Early Review Strategy"}</div>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginBottom: "10px" }}>{ko ? "리뷰 0개 상품은 클릭률이 80% 낮습니다. 첫 10개 리뷰가 결정적입니다." : "Products with 0 reviews get 80% fewer clicks. First 10 reviews are decisive."}</div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { method: "체험단 모집 (소규모)", detail: "블로그 체험단 3~5명. 비용: 제품 원가 + 배송비. 네이버 블로그 리뷰 = 검색 노출 직결", tip: "무료" },
                            { method: "포토리뷰 이벤트", detail: "구매 고객에게 포토리뷰 작성 시 500~1,000원 적립금. 전환율 대비 가장 효율적", tip: "₩500/건" },
                            { method: "지인·친구 초기 구매", detail: "솔직하게 부탁하세요. 조작 리뷰는 네이버 패널티 대상. 실제 구매+배송 필수", tip: "실비" },
                          ] : [
                            { method: "Micro influencer trials", detail: "3-5 bloggers. Cost: product + shipping. Blog reviews boost search", tip: "Free" },
                            { method: "Photo review event", detail: "₩500-1K store credit for photo reviews. Most efficient conversion", tip: "₩500/ea" },
                            { method: "Friends & family first buys", detail: "Be honest. Fake reviews get penalized. Real purchase required", tip: "Cost" },
                          ]).map(r => (
                            <div key={r.method} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(217,119,6,0.03)" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{r.method}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{r.detail}</div>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(217,119,6,0.08)", color: "#d97706", whiteSpace: "nowrap" as const, flexShrink: 0, alignSelf: "flex-start" }}>{r.tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 인허가 스테이지: 라이브 경쟁/생존 데이터 ── */}
                {currentStage.code === "permit_check" && (() => {
                  const ko = language === "ko";

                  const loadPermitInsights = async () => {
                    if (livePermitInsights && !livePermitInsights.loading) return;
                    setLivePermitInsights({ loading: true });
                    try {
                      const session = await supabase.auth.getSession();
                      const tk = session.data.session?.access_token;
                      const res = await fetch(`/api/data/permits?pageSize=500`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null);
                      if (res?.data?.length) {
                        const permits = res.data as Array<{ status: string; permitDate?: string; closureDate?: string }>;
                        const operating = permits.filter(p => p.status === "operating").length;
                        const closed = permits.filter(p => p.status === "closed").length;
                        const total = operating + closed;
                        const survivalRate = total > 0 ? Math.round((operating / total) * 100) : 0;
                        setLivePermitInsights({ loading: false, data: { total, operating, closed, survivalRate } });
                      } else {
                        setLivePermitInsights({ loading: false });
                      }
                    } catch { setLivePermitInsights({ loading: false }); }
                  };

                  if (!livePermitInsights) void loadPermitInsights();

                  if (!livePermitInsights || livePermitInsights.loading) {
                    return (
                      <div style={{ marginBottom: "16px", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(234,88,12,0.08)", background: "linear-gradient(180deg, rgba(255,237,213,0.1) 0%, rgba(255,255,255,0.9) 100%)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ea580c", animation: "bentoPulse 1.5s infinite" }} />
                          <span style={{ fontSize: "14px", fontWeight: 600 }}>{ko ? "사업자 현황 데이터 조회 중..." : "Loading permit data..."}</span>
                        </div>
                      </div>
                    );
                  }

                  if (!livePermitInsights.data) return null;
                  const d = livePermitInsights.data;
                  const rateColor = d.survivalRate >= 70 ? "#059669" : d.survivalRate >= 50 ? "#d97706" : "#dc2626";

                  return (
                    <div style={{ marginBottom: "16px", borderRadius: "20px", border: `1px solid ${rateColor}15`, background: `linear-gradient(180deg, ${rateColor}06 0%, rgba(255,255,255,0.92) 100%)`, overflow: "hidden" }} className="bento-fade-in">
                      <div style={{ padding: "18px 20px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: rateColor }} />
                          <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "영업 현황 데이터" : "Business Permit Status"}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "지방행정인허가 데이터 기반" : "Based on LOCALDATA Permit API"}</div>
                      </div>
                      <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                        <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
                          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "전체 등록" : "Total"}</div>
                          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{d.total.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(5,150,105,0.06)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "영업 중" : "Active"}</div>
                          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#059669" }}>{d.operating.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(220,38,38,0.04)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "폐업" : "Closed"}</div>
                          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#dc2626" }}>{d.closed.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
                          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "생존율" : "Survival"}</div>
                          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: rateColor }}>{d.survivalRate}%</div>
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.06)", marginTop: "6px", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "2px", width: `${d.survivalRate}%`, background: rateColor, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 인허가 업종별 체크리스트 카드 ── */}
                {currentStage.code === "permit_check" && (() => {
                  const ko = language === "ko";
                  const { getPermitsForCategory, getTotalPermitCost } = require("@build-up/shared");
                  const permitSet = getPermitsForCategory(industryCategoryId);
                  if (!permitSet) return null;
                  const totalCost = getTotalPermitCost(industryCategoryId);
                  const priorityLabel = (p: string) => p === "required" ? (ko ? "필수" : "Required") : p === "conditional" ? (ko ? "조건부" : "Conditional") : (ko ? "권장" : "Recommended");
                  const priorityColor = (p: string) => p === "required" ? "#dc2626" : p === "conditional" ? "#d97706" : "#6b7280";

                  return (
                    <div style={{ marginBottom: "16px" }} className="bento-fade-in">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? `${permitSet.label.ko} 인허가 체크리스트` : `${permitSet.label.en} Permit Checklist`}</span>
                        </div>
                        {totalCost > 0 && (
                          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                            {ko ? `예상 비용: 약 ${Math.round(totalCost / 10000).toLocaleString()}만원` : `Est. cost: ~₩${totalCost.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {permitSet.permits.map((permit: { id: string; name: { ko: string; en: string }; priority: string; agency: { ko: string; en: string }; costWon: number; costNote?: { ko: string; en: string }; duration: { ko: string; en: string }; applyUrl?: string; documents: Array<{ ko: string; en: string }>; steps: Array<{ ko: string; en: string }>; warnings?: Array<{ ko: string; en: string }> }, idx: number) => {
                          const isExpanded = expandedPermitId === permit.id;
                          return (
                            <div key={permit.id} style={{ borderRadius: "16px", border: `1px solid ${isExpanded ? priorityColor(permit.priority) + "30" : "rgba(0,0,0,0.06)"}`, background: isExpanded ? `${priorityColor(permit.priority)}04` : "#fff", overflow: "hidden", transition: "all 0.2s ease" }}>
                              <button type="button" onClick={() => setExpandedPermitId(isExpanded ? null : permit.id)} style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${priorityColor(permit.priority)}15`, color: priorityColor(permit.priority), textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" as const }}>{priorityLabel(permit.priority)}</span>
                                  <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>{ko ? permit.name.ko : permit.name.en}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? permit.duration.ko : permit.duration.en}</span>
                                  <span style={{ fontSize: "12px", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
                                </div>
                              </button>
                              {isExpanded && (
                                <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px", marginBottom: "14px" }}>
                                    <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                                      <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{ko ? "신청 기관" : "Agency"}</div>
                                      <div style={{ fontSize: "13px", fontWeight: 550 }}>{ko ? permit.agency.ko : permit.agency.en}</div>
                                    </div>
                                    <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                                      <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{ko ? "비용" : "Cost"}</div>
                                      <div style={{ fontSize: "13px", fontWeight: 550 }}>{permit.costWon === 0 ? (ko ? "무료" : "Free") : `${permit.costWon.toLocaleString()}원`}</div>
                                      {permit.costNote && <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? permit.costNote.ko : permit.costNote.en}</div>}
                                    </div>
                                  </div>
                                  <div style={{ marginBottom: "12px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 650, marginBottom: "6px", color: "rgba(0,0,0,0.5)" }}>{ko ? "절차" : "Steps"}</div>
                                    {permit.steps.map((step: { ko: string; en: string }, si: number) => (
                                      <div key={si} style={{ display: "flex", gap: "8px", marginBottom: "4px", fontSize: "13px", lineHeight: 1.5 }}>
                                        <span style={{ color: priorityColor(permit.priority), fontWeight: 700, minWidth: "16px" }}>{si + 1}.</span>
                                        <span>{ko ? step.ko : step.en}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {permit.documents.length > 0 && (
                                    <div style={{ marginBottom: "12px" }}>
                                      <div style={{ fontSize: "12px", fontWeight: 650, marginBottom: "6px", color: "rgba(0,0,0,0.5)" }}>{ko ? "필요 서류" : "Documents"}</div>
                                      {permit.documents.map((doc: { ko: string; en: string }, di: number) => (
                                        <div key={di} style={{ fontSize: "13px", lineHeight: 1.6, paddingLeft: "12px" }}>• {ko ? doc.ko : doc.en}</div>
                                      ))}
                                    </div>
                                  )}
                                  {permit.warnings && permit.warnings.length > 0 && (
                                    <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
                                      {permit.warnings.map((w: { ko: string; en: string }, wi: number) => (
                                        <div key={wi} style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.5 }}>⚠ {ko ? w.ko : w.en}</div>
                                      ))}
                                    </div>
                                  )}
                                  {permit.applyUrl && (
                                    <a href={permit.applyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "12px", fontSize: "13px", fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                                      {ko ? "온라인 신청 바로가기 →" : "Apply Online →"}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── 스타트업 법인설립 가이드 (company_setup) — 페이지네이션 ── */}
                {currentStage.code === "company_setup" && (() => {
                  const ko = language === "ko";
                  const pg = guideStepIndex;
                  const totalPg = 3;
                  const pgLabels = ko ? ["법인 설립 절차", "비용 요약", "스톡옵션 팁"] : ["Incorporation", "Costs", "Stock Options"];
                  return (
                    <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      {/* 페이지 네비 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex(p => p - 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.08)",
                          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
                        }}>← {ko ? "이전" : "Prev"}</button>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {pgLabels.map((l, i) => (
                            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
                              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
                              background: i === pg ? "#2563eb" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
                              border: "none", cursor: "pointer",
                            }}>{l}</button>
                          ))}
                        </div>
                        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex(p => p + 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.08)",
                          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
                        }}>{ko ? "다음" : "Next"} →</button>
                      </div>

                      {/* Page 0: 법인 설립 절차 */}
                      {pg === 0 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "한국 법인 설립 6단계" : "6 Steps to Incorporate in Korea"}</span>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
                            {ko ? "자본금 100원부터 가능. 1-2주 내 완료." : "Min capital ₩100. Done in 1-2 weeks."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          {(ko ? [
                            { step: "1", title: "정관 작성", detail: "사업 목적, 발행 주식 수, 자본금 결정. AI로 초안 작성 가능" },
                            { step: "2", title: "발기인 총회", detail: "공동 창업자 합의. 지분율, 의사결정 구조 확정" },
                            { step: "3", title: "자본금 납입", detail: "은행에 자본금 입금 후 잔액 증명서 발급 (100원도 가능)" },
                            { step: "4", title: "등기 신청", detail: "등기소 방문 또는 온라인 (헬프미 등 대행 서비스 30만원~)" },
                            { step: "5", title: "사업자등록", detail: "세무서 또는 홈택스. 등기 완료 후 20일 이내" },
                            { step: "6", title: "법인 통장 개설", detail: "사업자등록증 + 법인 인감 지참. 토스 비즈니스 추천" },
                          ] : [
                            { step: "1", title: "Articles of Incorporation", detail: "Business purpose, shares, capital. AI can draft" },
                            { step: "2", title: "Founders Meeting", detail: "Agree on equity, decision structure" },
                            { step: "3", title: "Capital Deposit", detail: "Deposit to bank, get balance certificate (min ₩100)" },
                            { step: "4", title: "Registration", detail: "Registry office or online service (~₩300K)" },
                            { step: "5", title: "Tax Registration", detail: "Tax office or Hometax within 20 days" },
                            { step: "6", title: "Business Account", detail: "Bring registration + company seal" },
                          ]).map(s => (
                            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "6" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}

                      {/* Page 1: 비용 요약 */}
                      {pg === 1 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "rgba(255,255,255,0.98)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "14px" }}>{ko ? "법인 설립 비용" : "Incorporation Costs"}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                          {[
                            { label: ko ? "등록면허세" : "License tax", value: "~13만원" },
                            { label: ko ? "교육세" : "Education tax", value: "~2.6만원" },
                            { label: ko ? "대행비 (선택)" : "Agency (optional)", value: "30~50만원" },
                          ].map(c => (
                            <div key={c.label} style={{ padding: "12px", borderRadius: "12px", background: "rgba(37,99,235,0.03)", textAlign: "center" as const }}>
                              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.35)" }}>{c.label}</div>
                              <div style={{ fontSize: "16px", fontWeight: 720, color: "#2563eb" }}>{c.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.06)" }}>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6 }}>
                            {ko ? "총 비용: 직접 진행 시 약 16만원, 대행 이용 시 약 50~65만원. 자본금은 100원부터 가능하지만, 벤처인증을 위해 최소 100만원 이상 권장합니다." : "Total: ~₩160K DIY, ~₩500-650K with agency. Capital from ₩100, but ₩1M+ recommended for venture certification."}
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Page 2: 스톡옵션 팁 */}
                      {pg === 2 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "스톡옵션 & 캡테이블" : "Stock Options & Cap Table"}</div>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.7, marginBottom: "14px" }}>
                          {ko ? "벤처기업 인증 후 스톡옵션을 부여하면 직원 1인당 연 5,000만원까지 비과세 혜택을 받을 수 있습니다. 캡테이블은 ZUZU 같은 도구로 관리하세요." : "After venture certification, stock options are tax-free up to ₩50M/year per employee. Use ZUZU for cap table management."}
                        </div>
                        <div style={{ display: "grid", gap: "8px" }}>
                          {(ko ? [
                            { title: "4년 베스팅 / 1년 클리프", desc: "업계 표준. 1년 근속 후 25%가 행사 가능해지고, 이후 매월 점진적 확보" },
                            { title: "벤처인증 후 부여 필수", desc: "인증 전 부여 시 비과세 혜택 없음. 기술보증기금 경로가 가장 빠름 (15~30일)" },
                            { title: "ZUZU로 캡테이블 관리", desc: "주주 구성, 투자 라운드, 희석 시뮬레이션을 한 곳에서 관리" },
                          ] : [
                            { title: "4-year vesting / 1-year cliff", desc: "Industry standard. 25% after 1 year, then monthly vesting" },
                            { title: "Grant after venture certification", desc: "No tax benefit without certification. KIBO is fastest path (15-30 days)" },
                            { title: "ZUZU for cap table", desc: "Manage shareholders, rounds, and dilution in one place" },
                          ]).map(t => (
                            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.06)" }}>
                              <div style={{ fontSize: "13px", fontWeight: 640, color: "#059669" }}>{t.title}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── TIPS/정부지원 안내 (fundraising_readiness) ── */}
                {currentStage.code === "fundraising_readiness" && (() => {
                  const ko = language === "ko";
                  const progCard = (p: { name: string; amount: string; detail: string; color: string; url: string }) => (
                    <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "12px",
                      border: `1px solid ${p.color}12`, background: `${p.color}03`, textDecoration: "none", color: "inherit",
                    }}>
                      <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${p.color}0a`, fontSize: "11px", fontWeight: 700, color: p.color, whiteSpace: "nowrap" as const, flexShrink: 0 }}>{p.amount}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "1px" }}>{p.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{p.detail}</div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  );
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* WHY — 이 단계의 핵심 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(29,53,87,0.1)", background: "linear-gradient(180deg, rgba(29,53,87,0.03) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계의 핵심" : "Core Question"}</div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(29,53,87,0.04)", border: "1px solid rgba(29,53,87,0.08)" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
                            {ko ? "투자가 정말 필요한가? 아니면 고객 매출로 충분한가?" : "Do you actually need investment? Or can customer revenue sustain you?"}
                          </div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
                            {ko ? "모든 스타트업이 투자를 받아야 하는 건 아닙니다. 토스의 이승건은 8번 실패 후 개인 자금이 2만원까지 떨어졌지만, 많은 성공적인 SaaS/AI 제품은 첫 달부터 매출로 운영됩니다. 2026년 솔로 파운더의 52%가 외부 투자 없이 엑싯에 성공했습니다. 투자는 \"성장 속도를 높이는 도구\"이지 \"생존을 위한 필수\"가 아닐 수 있습니다." : "Not every startup needs investment. Many successful SaaS/AI products run on revenue from month 1. In 2026, 52% of solo founders exited without external funding. Investment accelerates growth — it's not always survival."}
                          </div>
                        </div>
                      </div>

                      {/* PATH A — 투자 없이 시작하기 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(5,150,105,0.08)", fontSize: "11px", fontWeight: 700, color: "#059669" }}>PATH A</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "투자 없이 시작하기" : "Bootstrap — No Investment"}</span>
                          </div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7, marginTop: "6px" }}>
                            {ko ? "고객이 돈을 내는 순간부터 당신은 자유입니다. 지분 희석 없이, 이사회 승인 없이, 당신의 속도로 성장할 수 있습니다." : "From the moment customers pay, you're free. No dilution, no board approval, grow at your own pace."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
                          <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                            {(ko ? [
                              "런웨이 계산: 현재 현금 ÷ 월 비용 = 남은 개월 수",
                              "월 매출 목표 설정: 최소 월 비용을 커버하는 매출 수준",
                              "정부 보조금 · 공모전으로 초기 자금 확보 (아래 참조)",
                              "첫 유료 고객 10명을 목표로 집중 — 이게 가장 강력한 증거",
                            ] : [
                              "Calculate runway: current cash ÷ monthly costs = months left",
                              "Set monthly revenue target: minimum to cover costs",
                              "Secure initial funds via government grants/competitions (below)",
                              "Focus on first 10 paying customers — strongest proof",
                            ]).map(t => (
                              <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669", flexShrink: 0, marginTop: "7px" }} />
                                <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "정부 보조금 · 무상 지원 (주요 프로그램)" : "Government Grants (Key Programs)"}</div>
                          <div style={{ display: "grid", gap: "6px" }}>
                            {(ko ? [
                              { name: "예비창업패키지 2차", amount: "최대 1억원", detail: "사업자등록 전 예비 창업자 대상. 접수: ~11/30 수시", color: "#2563eb", url: "https://www.k-startup.go.kr" },
                              { name: "TIPS 일반트랙", amount: "최대 8억원", detail: "운영사 선투자 → 정부 매칭. 접수: ~12/31 상시", color: "#7c3aed", url: "https://www.jointips.or.kr" },
                            ] : [
                              { name: "Pre-Startup 2nd Round", amount: "Up to ₩100M", detail: "Pre-entrepreneurs. Rolling until Nov 30", color: "#2563eb", url: "https://www.k-startup.go.kr" },
                              { name: "TIPS General", amount: "Up to ₩800M", detail: "Operator invest first → gov match. Rolling until Dec 31", color: "#7c3aed", url: "https://www.jointips.or.kr" },
                            ]).map(p => progCard(p))}
                          </div>
                          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(15,23,42,0.02)", marginTop: "8px", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
                            {ko ? "AI 바우처, 청년창업사관학교, 각종 경진대회 등 전체 지원사업 목록은 \"벤처인증 · 정부 지원사업\" 단계에서 상세히 안내합니다." : "Full list of programs (AI Voucher, Youth Academy, competitions) is covered in the Venture Certification stage."}
                          </div>
                        </div>
                      </div>

                      {/* PATH B — 투자 유치 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(37,99,235,0.08)", fontSize: "11px", fontWeight: 700, color: "#2563eb" }}>PATH B</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "투자 유치하기" : "Raise Investment"}</span>
                          </div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7, marginTop: "6px" }}>
                            {ko ? "투자는 시장을 빠르게 선점해야 할 때 필요합니다. \"승자독식\" 시장이거나, 네트워크 효과가 핵심이거나, 기술 개발에 큰 초기 비용이 드는 경우. Peter Thiel: \"CEO 연봉이 15만 달러를 넘으면 정치인이 되기 시작한다.\"" : "Investment is needed when you must capture a market fast — winner-takes-all, network effects, or high R&D costs. Peter Thiel: \"A CEO earning over $150K starts becoming a politician.\""}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "투자 유치 전 준비할 것" : "Before fundraising"}</div>
                          <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                            {(ko ? [
                              "런웨이 모델링: 현재 현금으로 몇 개월 버틸 수 있는지 정확히 계산",
                              "다음 마일스톤 정의: 투자금으로 달성할 구체적 목표 (유저 수, MRR, PMF)",
                              "투자 필요성 판단: 이 돈이 없으면 정말 못 하는 건지? 느려질 뿐인지?",
                              "투자자 스토리라인: 문제 → 솔루션 → 시장 → 견인력 → 팀 → 필요 금액",
                              "법인 설립 완료 (투자자는 법인만 투자합니다)",
                            ] : [
                              "Runway modeling: exactly how many months with current cash",
                              "Define next milestone: specific goal for the funds (users, MRR, PMF)",
                              "Justify need: can't do it at all without money? Or just slower?",
                              "Investor storyline: problem → solution → market → traction → team → ask",
                              "Incorporate (investors only invest in corporations)",
                            ]).map(t => (
                              <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: "7px" }} />
                                <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)", marginBottom: "12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>{ko ? "AI 활용법 — 피치덱 작성" : "AI — Pitch deck"}</div>
                            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>
                              {ko ? "\"우리 스타트업 데이터: [제품, 유저 수, MRR, 성장률, 시장 크기, 팀]. 한국 VC가 좋아하는 형식의 10장짜리 피치덱 구조를 만들어줘. 각 슬라이드에 들어갈 핵심 메시지와 데이터 포인트를 제안해줘.\"" : "\"Our data: [product, users, MRR, growth, market, team]. Create a 10-slide pitch deck structure that Korean VCs prefer. Suggest key message and data points for each slide.\""}
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "정부 투자 프로그램 (지분 희석 없음)" : "Government Investment (No Dilution)"}</div>
                          <div style={{ display: "grid", gap: "6px" }}>
                            {(ko ? [
                              { name: "TIPS", amount: "최대 5억원", detail: "R&D 3억 + 운영 2억. 50+ 운영사가 먼저 선발 후 정부 매칭. 기술 스타트업 필수", color: "#059669", url: "https://www.k-startup.go.kr" },
                              { name: "TIPS-R (후속 지원)", amount: "최대 8억원", detail: "TIPS 졸업 기업 대상 후속 지원. 스케일업 단계 R&D 자금", color: "#059669", url: "https://www.k-startup.go.kr" },
                            ] : [
                              { name: "TIPS", amount: "Up to ₩500M", detail: "R&D 300M + Ops 200M. 50+ operators select first, gov matches. Must for tech startups", color: "#059669", url: "https://www.k-startup.go.kr" },
                              { name: "TIPS-R (Follow-up)", amount: "Up to ₩800M", detail: "For TIPS graduates. Scale-up R&D funding", color: "#059669", url: "https://www.k-startup.go.kr" },
                            ]).map(p => progCard(p))}
                          </div>
                        </div>
                      </div>

                      {/* 런웨이 계산 도우미 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.95)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>{ko ? "런웨이 자가 진단" : "Runway Self-Check"}</div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { q: "현재 통장 잔고는?", hint: "정확한 숫자를 알아야 합니다", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
                            { q: "월 고정비용은? (서버+도구+생활비)", hint: "빠짐없이 계산. 생활비 포함", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" },
                            { q: "남은 개월 수 = 잔고 ÷ 월 비용", hint: "6개월 미만이면 즉시 행동 필요", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                          ] : [
                            { q: "Current bank balance?", hint: "Know the exact number", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
                            { q: "Monthly costs? (server+tools+living)", hint: "Include everything. Living costs too", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" },
                            { q: "Months left = balance ÷ monthly costs", hint: "Under 6 months = act now", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                          ]).map(item => (
                            <div key={item.q} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.02)" }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d={item.icon}/></svg>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", lineHeight: 1.4 }}>{item.q}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{item.hint}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 창업팀·기본 구조 가이드 (startup_foundation) ── */}
                {currentStage.code === "startup_foundation" && (() => {
                  const ko = language === "ko";
                  const iconSvg = (d: string, color: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={d} /></svg>;
                  // 페이지네이션: 0=핵심원칙, 1=Step1, 2=Step2, 3=Step3, 4=사례
                  const totalPages = 5;
                  const pageLabels = ko
                    ? ["핵심 원칙", "1. 문제 정의", "2. 팀 구성", "3. 법인 설립", "사례"]
                    : ["Principle", "1. Problem", "2. Team", "3. Incorporate", "Cases"];
                  const page = guideStepIndex;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 페이지 네비게이션 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
                        <button type="button" disabled={page === 0} onClick={() => setGuideStepIndex(p => p - 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: page === 0 ? "rgba(0,0,0,0.02)" : "white", color: page === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: page === 0 ? "default" : "pointer",
                        }}>
                          {ko ? "← 이전" : "← Prev"}
                        </button>
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          {pageLabels.map((label, i) => (
                            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
                              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === page ? 700 : 500,
                              background: i === page ? "#1d3557" : "transparent", color: i === page ? "#fff" : "rgba(15,23,42,0.4)",
                              border: "none", cursor: "pointer", transition: "all 0.2s ease",
                            }}>
                              {label}
                            </button>
                          ))}
                        </div>
                        <button type="button" disabled={page === totalPages - 1} onClick={() => setGuideStepIndex(p => p + 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: page === totalPages - 1 ? "rgba(0,0,0,0.02)" : "white", color: page === totalPages - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: page === totalPages - 1 ? "default" : "pointer",
                        }}>
                          {ko ? "다음 →" : "Next →"}
                        </button>
                      </div>

                      {/* 페이지별 콘텐츠 — 현재 페이지만 표시 */}
                      {page === 0 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(29,53,87,0.1)", background: "linear-gradient(180deg, rgba(29,53,87,0.03) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "핵심 원칙" : "Core Principle"}</div>
                        <div style={{ fontSize: "17px", fontWeight: 720, color: "#0f172a", lineHeight: 1.4, marginBottom: "10px" }}>
                          {ko ? "먼저 만들고, 법인은 나중에." : "Build first. Incorporate later."}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "12px" }}>
                          {ko
                            ? "Facebook은 하버드 기숙사에서 런칭한 후 6개월 뒤에 법인을 세웠습니다. 배달의민족은 앱 출시 5개월 후에야 회사를 설립했습니다. Stripe는 \"노트북 줘봐\"라며 직접 설치해주는 것부터 시작했습니다. 지금 당장 필요한 건 법인이 아니라, 해결할 문제와 만들 제품입니다."
                            : "Facebook launched 6 months before incorporating. Baemin released their app 5 months before founding the company. Stripe started by saying \"give me your laptop\" and installing for users manually. What you need now isn't a corporation — it's a problem to solve and a product to build."}
                        </div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { quote: "\"스타트업 아이디어를 얻는 방법은 스타트업 아이디어를 생각하는 게 아니라, 문제를 찾는 것이다. 가능하면 당신 자신의 문제를.\"", author: "Paul Graham, Y Combinator" },
                            { quote: "\"가장 위험한 것은 시장이 원하지 않는 것을 만드는 것이다. 실패한 스타트업의 42%가 이것 때문이다.\"", author: "CB Insights, 스타트업 실패 분석" },
                          ] : [
                            { quote: "\"The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.\"", author: "Paul Graham, Y Combinator" },
                            { quote: "\"The #1 reason startups fail is building something nobody wants. 42% fail for this exact reason.\"", author: "CB Insights, Startup Failure Analysis" },
                          ]).map(q => (
                            <div key={q.author} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(29,53,87,0.03)", borderLeft: "3px solid rgba(29,53,87,0.15)" }}>
                              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.55, fontStyle: "italic" }}>{q.quote}</div>
                              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "4px", fontWeight: 600 }}>— {q.author}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      )}

                      {page === 1 && (
                      <>
                      {/* STEP 1 — 핵심 문제 정의 (First Principles) */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "해결할 문제를 한 문장으로 정의하세요" : "Define the problem in one sentence"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
                            {ko ? "Elon Musk는 로켓 비용이 비싼 이유를 원자재 가격까지 분해했습니다 (재료비 = 가격의 2%). Peter Thiel은 \"대부분의 사람들이 동의하지 않는, 당신이 아는 중요한 진실은 무엇인가?\"라고 묻습니다. 이 질문에 답하세요." : "Musk broke down why rockets are expensive to raw materials (2% of price). Thiel asks: \"What important truth do few people agree with you on?\" Answer this question."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 16px" }}>
                          <div style={{ display: "grid", gap: "6px", marginBottom: "12px" }}>
                            {(ko ? [
                              { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "나 자신의 문제에서 시작하세요", desc: "YC가 선호하는 아이디어는 창업자가 직접 겪는 문제입니다. 상상이 아닌 경험에서 출발하세요" },
                              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "\"지금 이걸 누가 원하는가?\" 답할 수 있어야 합니다", desc: "많은 사람이 조금 원하는 것보다, 적은 사람이 절실하게 원하는 것을 선택하세요" },
                              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "기존 솔루션의 비용을 분해하세요", desc: "Musk 방식: 재료비·인건비·유통비를 분리하면 10배 싸게 만들 수 있는 지점이 보입니다" },
                            ] : [
                              { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "Start from your own problem", desc: "YC prefers ideas from founders' own experience, not imagination" },
                              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "Can you answer: \"Who wants this right now?\"", desc: "Choose something few people want desperately over many wanting slightly" },
                              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Break down existing solution costs", desc: "Musk method: separate materials/labor/distribution to find the 10x opportunity" },
                            ]).map(s => (
                              <div key={s.title} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.03)" }}>
                                {iconSvg(s.icon, "#2563eb")}
                                <div>
                                  <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
                                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>{ko ? "AI 활용법" : "How to use AI"}</div>
                            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, padding: "8px 12px", borderRadius: "8px", background: "rgba(37,99,235,0.03)", fontStyle: "italic" }}>
                              {ko ? "\"나는 [분야]에서 [타깃]의 [고통]을 해결하려 해. 1) 이 문제가 충분히 구체적인지, 2) 현재 사람들이 어떻게 해결하고 있는지, 3) 기존 솔루션의 비용 구조를 원자재 수준까지 분해해줘. 4) Peter Thiel의 '비밀' 프레임워크로 이 기회를 평가해줘.\"" : "\"I want to solve [pain] for [target] in [field]. 1) Is this specific enough? 2) How do people currently solve it? 3) Break down existing solution costs to raw materials. 4) Evaluate this opportunity using Thiel's 'secret' framework.\""}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 문제 정의 입력 + 저장 */}
                      <div style={{
                        borderRadius: "16px", padding: "18px 20px",
                        background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(37,99,235,0.12)",
                      }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                          {ko ? "나의 문제 정의" : "MY PROBLEM STATEMENT"}
                        </div>
                        <textarea
                          placeholder={ko
                            ? "예: \"소상공인은 매일 경영 데이터를 분석할 시간이 없다. 기존 솔루션(세무사, 엑셀)은 월 1회 사후 분석만 가능하고, 비용이 월 30만원 이상이다.\""
                            : "e.g., \"Small business owners don't have time to analyze daily data. Current solutions (accountants, Excel) only offer monthly reviews and cost $300+/mo.\""}
                          value={(decisions["startup-foundation"]?.inputs?.problemStatement as string) ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            d.setDecisions((prev: Record<string, unknown>) => ({
                              ...prev,
                              "startup-foundation": {
                                ...(prev["startup-foundation"] as Record<string, unknown> ?? {}),
                                stageId: "startup-foundation",
                                inputs: { ...((prev["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), problemStatement: val },
                              }
                            }));
                          }}
                          style={{
                            width: "100%", minHeight: "80px", padding: "12px 14px", borderRadius: "12px",
                            border: "1px solid rgba(37,99,235,0.1)", background: "rgba(248,250,252,0.8)",
                            fontSize: "14px", lineHeight: 1.6, resize: "vertical",
                            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                            outline: "none", color: "#0f172a",
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.1)"; }}
                        />
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "6px" }}>
                          {ko ? "자동 저장됩니다. 이 문장이 창업의 나침반이 됩니다." : "Auto-saved. This statement becomes your startup compass."}
                        </div>
                      </div>

                      </>
                      )}

                      {page === 2 && (
                      <>
                      {/* STEP 2 — 팀 구성 (또는 솔로 파운더) */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "팀 구성 방향을 정하세요" : "Decide your team structure"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
                            {ko ? "2026년, AI 도구 덕분에 1인 창업자도 이전의 5인 팀만큼 할 수 있습니다. 공동창업자가 반드시 필요하지는 않습니다." : "In 2026, AI tools let solo founders do what 5-person teams used to. Co-founders aren't always necessary."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 16px" }}>
                          {/* 솔로 vs 공동 — 선택형 버튼 */}
                          {(() => {
                            const teamChoice = (decisions["startup-foundation"]?.inputs?.teamStructure as string) ?? "";
                            const choose = (val: string) => {
                              d.setDecisions((prev: Record<string, unknown>) => ({
                                ...prev,
                                "startup-foundation": {
                                  ...(prev["startup-foundation"] as Record<string, unknown> ?? {}),
                                  stageId: "startup-foundation",
                                  inputs: { ...((prev["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), teamStructure: val },
                                }
                              }));
                            };
                            const isSolo = teamChoice === "solo";
                            const isCo = teamChoice === "co-founder";
                            return (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                                <button type="button" onClick={() => choose("solo")} style={{
                                  padding: "14px", borderRadius: "14px", textAlign: "left" as const, cursor: "pointer",
                                  background: isSolo ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.02)",
                                  border: isSolo ? "2px solid #7c3aed" : "1px solid rgba(124,58,237,0.06)",
                                  boxShadow: isSolo ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
                                  transition: "all 0.2s ease",
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                    {iconSvg("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", "#7c3aed")}
                                    <span style={{ fontSize: "14px", fontWeight: 680, color: "#7c3aed" }}>{ko ? "솔로 파운더" : "Solo Founder"}</span>
                                    {isSolo && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "#7c3aed", padding: "2px 6px", borderRadius: "4px", marginLeft: "auto" }}>✓</span>}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                                    {ko ? "성공 엑싯의 52%가 솔로 창업. Cursor + Claude로 MVP를 2~6주에 출시. 의사결정 빠름." : "52% of exits by solo founders. Ship MVP in 2-6wk with AI. Fast decisions."}
                                  </div>
                                </button>
                                <button type="button" onClick={() => choose("co-founder")} style={{
                                  padding: "14px", borderRadius: "14px", textAlign: "left" as const, cursor: "pointer",
                                  background: isCo ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.02)",
                                  border: isCo ? "2px solid #2563eb" : "1px solid rgba(37,99,235,0.06)",
                                  boxShadow: isCo ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
                                  transition: "all 0.2s ease",
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                    {iconSvg("M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", "#2563eb")}
                                    <span style={{ fontSize: "14px", fontWeight: 680, color: "#2563eb" }}>{ko ? "공동 창업" : "Co-founders"}</span>
                                    {isCo && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "#2563eb", padding: "2px 6px", borderRadius: "4px", marginLeft: "auto" }}>✓</span>}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                                    {ko ? "역할 분담으로 속도 UP. 하지만 합의사항 정리 필수. 아래 체크리스트를 확인하세요." : "Faster with role split. But must agree on terms below."}
                                  </div>
                                </button>
                              </div>
                            );
                          })()}

                          {/* 공동창업 시 합의사항 — 접이식 */}
                          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
                            <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "공동창업 시 반드시 합의할 것" : "Must-agree items for co-founders"}</div>
                            <div style={{ display: "grid", gap: "4px" }}>
                              {(ko ? [
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "각자의 역할과 책임 범위 (서면으로)", color: "#059669" },
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "의사결정 방식 — 의견 불일치 시 누가 최종 결정?", color: "#059669" },
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "지분 비율 (YC 추천: 동등 또는 근접 배분)", color: "#059669" },
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "베스팅 조건 (4년/1년 클리프가 표준)", color: "#059669" },
                                { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", text: "퇴사/이탈 시 지분 회수 조건 — 이걸 안 정하면 나중에 전쟁", color: "#d97706" },
                              ] : [
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Each person's role and responsibility scope (in writing)", color: "#059669" },
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Decision-making — who has final say on disagreements?", color: "#059669" },
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Equity split (YC recommends near-equal)", color: "#059669" },
                                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Vesting (4yr / 1yr cliff standard)", color: "#059669" },
                                { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", text: "Buyback terms on departure — skipping this means war later", color: "#d97706" },
                              ]).map(s => (
                                <div key={s.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                                  {iconSvg(s.icon, s.color)}
                                  <span>{s.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      </>
                      )}

                      {page === 3 && (
                      <>
                      {/* STEP 3 — 법인은 언제? (트리거 기반) */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "법인 설립 — 이때 하면 됩니다" : "Incorporate — when these triggers hit"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
                            {ko ? "MVP를 만들고, 유저를 모으고, 아래 상황이 발생하면 그때 법인을 세우세요. 그 전에는 불필요합니다." : "Build MVP, get users, then incorporate when these triggers happen. Before that, it's unnecessary."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px", display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { trigger: "첫 고객 결제를 받을 때", why: "개인 계좌로 사업 수익 수령 시 세무·책임 문제", color: "#dc2626", level: "필수" },
                            { trigger: "투자금을 받을 때", why: "모든 투자자가 법인을 요구합니다", color: "#dc2626", level: "필수" },
                            { trigger: "첫 직원을 고용할 때", why: "IP 소유권, 4대보험, 스톡옵션 부여에 법인 필요", color: "#dc2626", level: "필수" },
                            { trigger: "공동창업자와 지분을 나눌 때", why: "서면 합의서 + 베스팅을 법인 구조로 정리", color: "#d97706", level: "권장" },
                            { trigger: "정부 지원사업에 신청할 때", why: "대부분 법인 또는 사업자등록 필요", color: "#d97706", level: "권장" },
                          ] : [
                            { trigger: "First customer payment", why: "Personal account for business revenue = tax/liability issues", color: "#dc2626", level: "Must" },
                            { trigger: "Accepting investment", why: "All investors require a legal entity", color: "#dc2626", level: "Must" },
                            { trigger: "First hire", why: "IP ownership, insurance, stock options need a corp", color: "#dc2626", level: "Must" },
                            { trigger: "Splitting equity with co-founders", why: "Formalize with vesting in corporate structure", color: "#d97706", level: "Rec" },
                            { trigger: "Government program application", why: "Most require business registration", color: "#d97706", level: "Rec" },
                          ]).map(t => (
                            <div key={t.trigger} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: `${t.color}03`, border: `1px solid ${t.color}10` }}>
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${t.color}10`, color: t.color, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "2px" }}>{t.level}</span>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{t.trigger}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{t.why}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: "0 22px 16px", padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", borderLeft: "3px solid rgba(5,150,105,0.3)" }}>
                          <div style={{ fontSize: "13px", color: "rgba(5,150,105,0.8)", lineHeight: 1.55 }}>
                            {ko ? "구체적인 설립 절차, 비용, 스톡옵션 설계는 다음 단계(법인 운영·세무·보안 기본기)에서 상세히 안내합니다." : "Detailed procedures, costs, and stock option setup are covered in the next stage (Corp operations & tax basics)."}
                          </div>
                        </div>
                      </div>

                      </>
                      )}

                      {page === 4 && (
                      <>
                      {/* 실제 사례 — 영감 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.95)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>{ko ? "그들도 이렇게 시작했습니다" : "They all started this way"}</div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { name: "배달의민족", story: "바닥에 떨어진 전단지를 스캔해서 앱을 만듦. 회사 설립은 앱 출시 5개월 후", year: "2010" },
                            { name: "토스", story: "8번 실패 후 통장 잔고 2만원. \"또 다른 멍청한 아이디어\"가 7조원 기업이 됨", year: "2015" },
                            { name: "Airbnb", story: "에어 매트리스 3개로 시작. 시리얼 상자를 팔아 3천만원을 벌고 YC에 들어감", year: "2008" },
                            { name: "Stripe", story: "\"노트북 줘봐\" — 직접 설치해주는 것으로 첫 고객 확보. 7줄의 코드가 시작", year: "2010" },
                          ] : [
                            { name: "Baemin", story: "Scanned restaurant flyers off the ground. Company founded 5mo after app launch", year: "2010" },
                            { name: "Toss", story: "8 failures, ₩20K in bank. \"Another stupid idea\" became a $7B company", year: "2015" },
                            { name: "Airbnb", story: "3 air mattresses. Sold cereal boxes for $30K to fund YC application", year: "2008" },
                            { name: "Stripe", story: "\"Give me your laptop\" — manual installation for first customers. 7 lines of code", year: "2010" },
                          ]).map(s => (
                            <div key={s.name} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.name !== "Stripe" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.25)", width: "36px", flexShrink: 0, textAlign: "right" as const, marginTop: "2px" }}>{s.year}</div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{s.name}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.story}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      </>
                      )}
                    </div>
                  );
                })()}

                {/* ── 고객 발굴·문제 검증 가이드 (customer_discovery) ── */}
                {currentStage.code === "customer_discovery" && (() => {
                  const ko = language === "ko";
                  const pg = guideStepIndex;
                  const totalPg = 4;
                  const pgLabels = ko
                    ? ["왜 중요한가", "1. 인터뷰 준비", "2. 인터뷰 실행", "3. AI 분석"]
                    : ["Why", "1. Prepare", "2. Execute", "3. Analyze"];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 페이지 네비 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex(p => p - 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
                        }}>{ko ? "← 이전" : "← Prev"}</button>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {pgLabels.map((l, i) => (
                            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
                              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
                              background: i === pg ? "#1d3557" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
                              border: "none", cursor: "pointer",
                            }}>{l}</button>
                          ))}
                        </div>
                        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex(p => p + 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
                        }}>{ko ? "다음 →" : "Next →"}</button>
                      </div>

                      {pg === 0 && (
                      <>
                      {/* WHY — 왜 이 단계가 중요한가 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이게 첫 번째인가" : "Why this comes first"}</span>
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
                          {ko ? "스타트업의 42%는 \"시장이 필요로 하지 않는 제품\"을 만들어 실패합니다." : "42% of startups fail by building a product nobody needs."}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
                          {ko ? "코드를 한 줄도 쓰기 전에, 실제 사람과 대화해서 \"이 문제가 정말 돈이나 시간을 쓸 만큼 고통스러운지\" 확인해야 합니다. 이 과정을 건너뛰면 6개월 후 아무도 쓰지 않는 제품이 됩니다. AI를 활용하면 인터뷰 질문 설계, 응답 패턴 분석, 페르소나 정리를 훨씬 빠르게 할 수 있습니다." : "Before writing a single line of code, talk to real people to confirm the pain is real enough to pay for. Skip this and you'll have a product nobody uses in 6 months. AI can help design interview questions, analyze response patterns, and build personas faster."}
                        </div>
                      </div>

                      </>
                      )}

                      {pg === 1 && (
                      <>
                      {/* STEP 1 — AI로 인터뷰 스크립트 준비 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "AI로 인터뷰 스크립트 만들기" : "Create interview script with AI"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
                            {ko ? "The Mom Test 원칙: 솔루션을 말하지 말고, 문제만 물어보세요. 아래 질문을 기반으로 AI가 업종에 맞는 스크립트를 만들어줍니다." : "The Mom Test: Don't pitch your solution — only ask about problems. AI will create an industry-specific script based on these questions."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px", display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { q: "이 문제를 지금 어떻게 해결하고 있나요?", why: "현재 대안 파악 → 10배 나은지 판단 가능", color: "#059669" },
                            { q: "가장 최근에 이 문제를 겪은 게 언제예요?", why: "빈도와 심각도 확인. 기억도 못 하면 중요한 문제가 아님", color: "#2563eb" },
                            { q: "이 문제 때문에 돈이나 시간을 얼마나 쓰나요?", why: "지불 의사 간접 확인. 0원이면 무료 도구도 안 쓸 것", color: "#7c3aed" },
                            { q: "이상적으로 어떻게 되면 좋겠어요?", why: "고객 언어로 가치 정의 → 마케팅 카피에 직접 활용", color: "#d97706" },
                          ] : [
                            { q: "How do you currently solve this problem?", why: "Understand current alternatives → judge if 10x better", color: "#059669" },
                            { q: "When was the last time you faced this?", why: "Measure frequency. Can't remember = not important", color: "#2563eb" },
                            { q: "How much time/money do you spend on this?", why: "Indirect WTP check. Zero = won't use even if free", color: "#7c3aed" },
                            { q: "What would ideal look like?", why: "Define value in customer's words → use in marketing", color: "#d97706" },
                          ]).map(item => (
                            <div key={item.q} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${item.color}12`, background: `${item.color}03` }}>
                              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "3px" }}>"{item.q}"</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{item.why}</div>
                            </div>
                          ))}
                        </div>
                        {/* ── AI 인터뷰지 생성기 ── */}
                        <div style={{ margin: "0 22px 16px", padding: "16px 18px", borderRadius: "14px", background: "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.03) 100%)", border: "1px solid rgba(37,99,235,0.1)" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>
                            {ko ? "AI 인터뷰지 생성기" : "AI INTERVIEW GENERATOR"}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                            <input
                              type="text"
                              placeholder={ko ? "해결하려는 문제 (예: 소상공인의 경영 데이터 분석 시간 부족)" : "Problem to solve"}
                              value={(guideSelections["interview-problem"] ?? (decisions["startup-foundation"]?.inputs?.problemStatement as string) ?? "")}
                              onChange={e => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-problem": e.target.value }))}
                              style={{
                                padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.12)",
                                background: "rgba(255,255,255,0.9)", fontSize: "13px", outline: "none",
                              }}
                              onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; }}
                              onBlur={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)"; }}
                            />
                            <input
                              type="text"
                              placeholder={ko ? "타겟 고객 (예: 월매출 3천만원 이하 음식점 사장님)" : "Target customer"}
                              value={guideSelections["interview-target"] ?? ""}
                              onChange={e => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-target": e.target.value }))}
                              style={{
                                padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.12)",
                                background: "rgba(255,255,255,0.9)", fontSize: "13px", outline: "none",
                              }}
                              onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; }}
                              onBlur={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)"; }}
                            />
                          </div>
                          <button
                            type="button"
                            disabled={!guideSelections["interview-problem"]?.trim() || !guideSelections["interview-target"]?.trim() || guideSelections["interview-loading"] === "true"}
                            onClick={async () => {
                              d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-loading": "true", "interview-error": "" }));
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session?.access_token) throw new Error("로그인 필요");
                                const res = await fetch("/api/ai/interview", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                                  body: JSON.stringify({
                                    industryCategoryId: d.industryCategoryId,
                                    problemStatement: guideSelections["interview-problem"],
                                    targetCustomer: guideSelections["interview-target"],
                                    language: d.language,
                                  }),
                                });
                                if (!res.ok) throw new Error((await res.json()).error ?? "생성 실패");
                                const script = await res.json();
                                d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-loading": "false", "interview-result": JSON.stringify(script) }));
                              } catch (err) {
                                d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-loading": "false", "interview-error": err instanceof Error ? err.message : String(err) }));
                              }
                            }}
                            style={{
                              width: "100%", padding: "10px", borderRadius: "10px", border: "none",
                              background: (guideSelections["interview-problem"]?.trim() && guideSelections["interview-target"]?.trim() && guideSelections["interview-loading"] !== "true") ? "#2563eb" : "rgba(37,99,235,0.1)",
                              color: (guideSelections["interview-problem"]?.trim() && guideSelections["interview-target"]?.trim()) ? "#fff" : "rgba(37,99,235,0.3)",
                              fontSize: "13px", fontWeight: 700, cursor: "pointer",
                              boxShadow: (guideSelections["interview-problem"]?.trim() && guideSelections["interview-target"]?.trim()) ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                            }}
                          >
                            {guideSelections["interview-loading"] === "true"
                              ? (ko ? "생성 중..." : "Generating...")
                              : (ko ? "Mom Test 인터뷰지 생성" : "Generate Mom Test Script")}
                          </button>
                          {guideSelections["interview-error"] && (
                            <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "6px" }}>{guideSelections["interview-error"]}</div>
                          )}
                        </div>

                        {/* ── 생성된 인터뷰지 결과 + PDF 다운로드 ── */}
                        {guideSelections["interview-result"] && (() => {
                          const script = JSON.parse(guideSelections["interview-result"]);
                          const downloadPdf = () => {
                            // 간단한 텍스트 기반 PDF — HTML to print
                            const printContent = `
                              <html><head><meta charset="utf-8"><title>${script.title}</title>
                              <style>body{font-family:-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111}
                              h1{font-size:22px;margin-bottom:4px}h2{font-size:16px;color:#2563eb;margin-top:24px}
                              .q{margin:12px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #2563eb}
                              .q-text{font-size:14px;font-weight:600}.q-purpose{font-size:12px;color:#666;margin-top:4px}
                              .pill{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#2563eb;background:#eff6ff;margin-bottom:4px}
                              .donot{color:#dc2626;font-size:13px;margin:4px 0}
                              </style></head><body>
                              <h1>${script.title}</h1>
                              <p style="color:#666">${script.duration} · Mom Test 기반</p>
                              <h2>핵심 원칙</h2>
                              ${script.principles?.map((p: string) => `<p>• ${p}</p>`).join("") ?? ""}
                              <h2>아이스브레이커</h2><p>${script.icebreaker}</p>
                              <h2>질문</h2>
                              ${script.questions?.map((q: {phase:string;question:string;purpose:string;followUp?:string}, i: number) =>
                                `<div class="q"><span class="pill">${q.phase}</span><div class="q-text">${i+1}. ${q.question}</div><div class="q-purpose">💡 ${q.purpose}</div>${q.followUp ? `<div class="q-purpose">↪ ${q.followUp}</div>` : ""}</div>`
                              ).join("") ?? ""}
                              <h2>마무리</h2><p>${script.closing}</p>
                              <h2>하지 말 것</h2>
                              ${script.doNots?.map((d: string) => `<p class="donot">✕ ${d}</p>`).join("") ?? ""}
                              <p style="margin-top:40px;font-size:11px;color:#999">Generated by build.up AI · Mom Test Interview Script</p>
                              </body></html>`;
                            const w = window.open("", "_blank");
                            if (w) { w.document.write(printContent); w.document.close(); w.print(); }
                          };
                          return (
                            <div style={{ margin: "0 22px 16px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{script.title}</span>
                                <button type="button" onClick={downloadPdf} style={{
                                  padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(37,99,235,0.15)",
                                  background: "white", color: "#2563eb", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                                }}>
                                  {ko ? "PDF 저장" : "Save PDF"}
                                </button>
                              </div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginBottom: "10px" }}>{script.duration}</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {(guideSelections["interview-expanded"] === "true" ? script.questions : script.questions?.slice(0, 5))?.map((q: {phase:string;question:string;purpose:string;followUp?:string}, i: number) => (
                                  <div key={i} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(37,99,235,0.03)", borderLeft: "3px solid rgba(37,99,235,0.15)" }}>
                                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "3px" }}>{q.phase}</div>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>{i + 1}. {q.question}</div>
                                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "3px" }}>💡 {q.purpose}</div>
                                    {q.followUp && <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "2px" }}>↪ {q.followUp}</div>}
                                  </div>
                                ))}
                                {(script.questions?.length ?? 0) > 5 && (
                                  <button type="button" onClick={() => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-expanded": prev["interview-expanded"] === "true" ? "false" : "true" }))} style={{
                                    fontSize: "13px", fontWeight: 600, color: "#2563eb", background: "none", border: "1px solid rgba(37,99,235,0.12)",
                                    borderRadius: "10px", padding: "8px", cursor: "pointer", textAlign: "center" as const, width: "100%",
                                  }}>
                                    {guideSelections["interview-expanded"] === "true"
                                      ? (ko ? "접기" : "Collapse")
                                      : (ko ? `전체 ${script.questions?.length ?? 0}개 질문 보기` : `Show all ${script.questions?.length ?? 0} questions`)}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      </>
                      )}

                      {pg === 2 && (
                      <>
                      {/* STEP 2 — 인터뷰 대상 찾기 + 실행 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "10명 이상 인터뷰를 실행하세요" : "Run 10+ interviews"}</span>
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
                            {(ko ? [
                              { ch: "링크드인 DM", tip: "타깃 직군에 직접 메시지. 20통 중 4~5통 응답", url: "https://linkedin.com" },
                              { ch: "디스콰이엇", tip: "한국 스타트업 커뮤니티. 초기 유저 모집에 최적", url: "https://disquiet.io" },
                              { ch: "블라인드", tip: "직장인 익명 커뮤니티. B2B 타깃에 효과적", url: "https://www.teamblind.com" },
                              { ch: "지인 2차 소개", tip: "\"이 분야 아는 사람 소개해줄 수 있어?\"가 가장 효과적" },
                            ] : [
                              { ch: "LinkedIn DM", tip: "Direct message targets. ~20% response rate", url: "https://linkedin.com" },
                              { ch: "Disquiet", tip: "Korean startup community. Best for early users", url: "https://disquiet.io" },
                              { ch: "Blind", tip: "Anonymous work community. Effective for B2B", url: "https://www.teamblind.com" },
                              { ch: "2nd-degree referrals", tip: "\"Know anyone in this space?\" — most effective" },
                            ]).map(c => (
                              <div key={c.ch} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(5,150,105,0.03)" }}>
                                <div style={{ fontSize: "12px", fontWeight: 640, color: "#0f172a" }}>{c.ch}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{c.tip}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                            {(ko ? [
                              { num: "10+명", label: "최소 인터뷰 수", detail: "5명=패턴 감지, 10명=확신" },
                              { num: "30분", label: "인터뷰 시간", detail: "15분은 짧고 1시간은 부담" },
                              { num: "24h내", label: "기록 마감", detail: "기억은 빠르게 왜곡됨" },
                            ] : [
                              { num: "10+", label: "Min interviews", detail: "5=pattern, 10=confidence" },
                              { num: "30m", label: "Length", detail: "15min short, 1hr too long" },
                              { num: "24h", label: "Note deadline", detail: "Memory distorts fast" },
                            ]).map(s => (
                              <div key={s.num} style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
                                <div style={{ fontSize: "18px", fontWeight: 780, color: "#059669" }}>{s.num}</div>
                                <div style={{ fontSize: "11px", fontWeight: 640, color: "#0f172a" }}>{s.label}</div>
                                <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)" }}>{s.detail}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      </>
                      )}

                      {pg === 3 && (
                      <>
                      {/* STEP 3 — AI로 인사이트 정리 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "AI로 인터뷰 결과를 분석하세요" : "Analyze results with AI"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
                            {ko ? "인터뷰 노트를 AI에게 넘기면 반복 패턴, 핵심 고통, 초기 타깃 세그먼트를 자동 정리해줍니다." : "Pass your interview notes to AI — it auto-extracts repeated patterns, core pains, and initial target segments."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 16px" }}>
                          {/* ── AI 인터뷰 분석기 ── */}
                          <div style={{ padding: "16px 18px", borderRadius: "14px", background: "linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(37,99,235,0.03) 100%)", border: "1px solid rgba(124,58,237,0.1)", marginBottom: "10px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>
                              {ko ? "AI 인터뷰 결과 분석기" : "AI INTERVIEW ANALYZER"}
                            </div>
                            <textarea
                              placeholder={ko
                                ? "인터뷰 노트를 여기에 붙여넣으세요.\n\n예시:\n인터뷰 #1 (카페 사장님, 망원동, 3년차)\n- 매출 기록은 엑셀로 하는데 매일 30분씩 걸림\n- 세무사에게 월 30만원 내는데 사후 분석만 해줌\n- 재고 파악이 안 돼서 폐기가 월 50만원...\n\n인터뷰 #2 ..."
                                : "Paste your interview notes here.\n\nExample:\nInterview #1 (Cafe owner, 3 years)\n- Tracks sales in Excel, takes 30min daily\n- Pays accountant $300/mo but only gets monthly reports\n- Can't track inventory, wastes $500/mo..."}
                              value={guideSelections["analysis-notes"] ?? ""}
                              onChange={e => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-notes": e.target.value }))}
                              style={{
                                width: "100%", minHeight: "120px", padding: "12px 14px", borderRadius: "12px",
                                border: "1px solid rgba(124,58,237,0.12)", background: "rgba(255,255,255,0.9)",
                                fontSize: "13px", lineHeight: 1.6, resize: "vertical", outline: "none",
                                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                              }}
                              onFocus={e => { e.currentTarget.style.borderColor = "#7c3aed"; }}
                              onBlur={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.12)"; }}
                            />
                            <button
                              type="button"
                              disabled={!guideSelections["analysis-notes"]?.trim() || guideSelections["analysis-loading"] === "true"}
                              onClick={async () => {
                                d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-loading": "true", "analysis-error": "" }));
                                try {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (!session?.access_token) throw new Error("로그인 필요");
                                  const res = await fetch("/api/ai/interview/analyze", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                                    body: JSON.stringify({
                                      interviewNotes: guideSelections["analysis-notes"],
                                      industryCategoryId: d.industryCategoryId,
                                      language: d.language,
                                    }),
                                  });
                                  if (!res.ok) throw new Error((await res.json()).error ?? "분석 실패");
                                  const result = await res.json();
                                  d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-loading": "false", "analysis-result": JSON.stringify(result) }));
                                } catch (err) {
                                  d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-loading": "false", "analysis-error": err instanceof Error ? err.message : String(err) }));
                                }
                              }}
                              style={{
                                width: "100%", padding: "10px", borderRadius: "10px", border: "none", marginTop: "10px",
                                background: (guideSelections["analysis-notes"]?.trim() && guideSelections["analysis-loading"] !== "true") ? "#7c3aed" : "rgba(124,58,237,0.1)",
                                color: guideSelections["analysis-notes"]?.trim() ? "#fff" : "rgba(124,58,237,0.3)",
                                fontSize: "13px", fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              {guideSelections["analysis-loading"] === "true" ? (ko ? "분석 중..." : "Analyzing...") : (ko ? "인터뷰 결과 분석하기" : "Analyze Interview Results")}
                            </button>
                            {guideSelections["analysis-error"] && (
                              <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "6px" }}>{guideSelections["analysis-error"]}</div>
                            )}
                          </div>

                          {/* ── 분석 결과 표시 ── */}
                          {guideSelections["analysis-result"] && (() => {
                            const r = JSON.parse(guideSelections["analysis-result"]);
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
                                {/* 핵심 문제 */}
                                <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.06)", border: "1.5px solid rgba(124,58,237,0.12)" }}>
                                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                                    {ko ? "우리가 해결할 문제" : "THE ONE PROBLEM"}
                                  </div>
                                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5 }}>{r.oneProblemStatement}</div>
                                </div>

                                {/* 타겟 세그먼트 */}
                                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
                                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "초기 타겟" : "TARGET"}</div>
                                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{r.targetSegment}</div>
                                </div>

                                {/* 패턴 */}
                                {r.patterns?.map((p: { pattern: string; frequency: string; quotes: string[] }, i: number) => (
                                  <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(248,250,252,0.8)", border: "1px solid rgba(15,23,42,0.05)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                      <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{p.pattern}</span>
                                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#7c3aed", background: "rgba(124,58,237,0.06)", padding: "2px 8px", borderRadius: "4px" }}>{p.frequency}</span>
                                    </div>
                                    {p.quotes?.map((q: string, qi: number) => (
                                      <div key={qi} style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", fontStyle: "italic", lineHeight: 1.4, marginTop: "3px" }}>"{q}"</div>
                                    ))}
                                  </div>
                                ))}

                                {/* 다음 단계 */}
                                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.08)" }}>
                                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", marginBottom: "6px" }}>{ko ? "다음 행동" : "NEXT STEPS"}</div>
                                  {r.nextSteps?.map((s: string, i: number) => (
                                    <div key={i} style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, display: "flex", gap: "6px", marginBottom: "3px" }}>
                                      <span style={{ color: "#059669", fontWeight: 700 }}>{i + 1}.</span> {s}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "6px" }}>{ko ? "이 단계의 결과물" : "Deliverables from this stage"}</div>
                          <div style={{ display: "grid", gap: "4px" }}>
                            {(ko ? [
                              "핵심 고통 패턴 1~2개 (3명 이상 공통)",
                              "초기 타깃 세그먼트 정의 (누구의, 어떤 상황에서)",
                              "현재 대안 목록과 각 대안의 불만족 이유",
                              "\"우리가 해결할 한 가지 문제\" 문장",
                            ] : [
                              "1-2 core pain patterns (3+ people in common)",
                              "Initial target segment (who, in what context)",
                              "Current alternatives and dissatisfaction reasons",
                              "\"The one problem we solve\" statement",
                            ]).map(d => (
                              <div key={d} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "3px" }}><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M4.5 7l1.8 1.8 3.2-3.6" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      </>
                      )}
                    </div>
                  );
                })()}

                {/* ── 성장·리텐션 루프 가이드 (growth_engine) — 페이지네이션 ── */}
                {currentStage.code === "growth_engine" && (() => {
                  const ko = language === "ko";
                  const pg = guideStepIndex;
                  const totalPg = 4;
                  const pgLabels = ko
                    ? ["왜 중요한가", "1. 북극성 지표", "2. 주간 리뷰", "3. 리텐션"]
                    : ["Why", "1. North Star", "2. Weekly Review", "3. Retention"];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 페이지 네비 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex(p => p - 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
                        }}>{ko ? "← 이전" : "← Prev"}</button>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {pgLabels.map((l, i) => (
                            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
                              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
                              background: i === pg ? "#1d3557" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
                              border: "none", cursor: "pointer",
                            }}>{l}</button>
                          ))}
                        </div>
                        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex(p => p + 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
                        }}>{ko ? "다음 →" : "Next →"}</button>
                      </div>

                      {/* PAGE 0 — WHY */}
                      {pg === 0 && (
                      <>
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
                          {ko ? "리텐션 없는 성장은 밑 빠진 독에 물 붓기입니다." : "Growth without retention is filling a leaky bucket."}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
                          {ko ? "MVP를 출시했고 초기 사용자가 생겼다면, 이제 \"이 사람들이 돌아오는가?\"를 증명해야 합니다. 주간 성장률을 체계적으로 추적하고, 가장 큰 레버를 매주 실험해야 합니다." : "If you've launched an MVP and have initial users, now prove they come back. Track weekly growth systematically and experiment on the biggest lever each week."}
                        </div>
                      </div>
                      {/* 3단계 로드맵 미리보기 */}
                      <div style={{ display: "grid", gap: "6px" }}>
                        {(ko ? [
                          { num: 1, title: "북극성 지표 선택", desc: "회사 전체가 추적하는 하나의 핵심 숫자 확정", color: "#059669" },
                          { num: 2, title: "주간 성장 리뷰", desc: "매주 월요일 30분, 지표 확인 + 실험 1개 선택", color: "#2563eb" },
                          { num: 3, title: "리텐션 체크", desc: "사용자가 돌아오는지 먼저 확인 → 그 다음 성장", color: "#7c3aed" },
                        ] : [
                          { num: 1, title: "Choose North Star Metric", desc: "The single number the whole company tracks", color: "#059669" },
                          { num: 2, title: "Weekly Growth Review", desc: "30 min every Monday: metrics + 1 experiment", color: "#2563eb" },
                          { num: 3, title: "Retention Check", desc: "Prove users come back before pushing growth", color: "#7c3aed" },
                        ]).map(s => (
                          <div key={s.num} onClick={() => setGuideStepIndex(s.num)} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", background: `${s.color}04`, border: `1px solid ${s.color}10`, cursor: "pointer" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        ))}
                      </div>
                      </>
                      )}

                      {/* PAGE 1 — 북극성 지표 선택 */}
                      {pg === 1 && (() => {
                        const nsDec = (decisions["growth-engine"] as Record<string, unknown> | undefined);
                        const nsInputs = (nsDec?.inputs as Record<string, unknown>) ?? {};
                        const nsType = (nsInputs.northStarType as string) ?? "";
                        const nsName = (nsInputs.northStarMetricName as string) ?? "";
                        const chooseNs = (val: string) => {
                          d.setDecisions((prev: Record<string, unknown>) => ({
                            ...prev,
                            "growth-engine": {
                              ...(prev["growth-engine"] as Record<string, unknown> ?? {}),
                              stageId: "growth-engine",
                              inputs: { ...((prev["growth-engine"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), northStarType: val },
                            }
                          }));
                        };
                        const setNsName = (val: string) => {
                          d.setDecisions((prev: Record<string, unknown>) => ({
                            ...prev,
                            "growth-engine": {
                              ...(prev["growth-engine"] as Record<string, unknown> ?? {}),
                              stageId: "growth-engine",
                              inputs: { ...((prev["growth-engine"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), northStarMetricName: val },
                            }
                          }));
                        };
                        const nsOptions = ko ? [
                          { id: "saas", type: "SaaS", metric: "주간 활성 사용자(WAU) 또는 MRR", ex: "Slack: 주간 메시지 발송 팀 수" },
                          { id: "marketplace", type: "마켓플레이스", metric: "주간 거래 완료 수(GMV)", ex: "당근: 주간 거래 성사 건수" },
                          { id: "content", type: "콘텐츠", metric: "주간 소비 시간 또는 DAU", ex: "YouTube: 주간 시청 시간" },
                          { id: "commerce", type: "커머스", metric: "월간 반복 구매 고객 수", ex: "마켓컬리: 월 2회 이상 주문 고객" },
                        ] : [
                          { id: "saas", type: "SaaS", metric: "WAU or MRR", ex: "Slack: weekly messaging teams" },
                          { id: "marketplace", type: "Marketplace", metric: "Weekly completed transactions", ex: "Karrot: weekly deals" },
                          { id: "content", type: "Content", metric: "Weekly consumption time or DAU", ex: "YouTube: watch time" },
                          { id: "commerce", type: "Commerce", metric: "Monthly repeat buyers", ex: "Kurly: 2+ orders/month" },
                        ];
                        return (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "북극성 지표를 하나 선택하세요" : "Choose one North Star Metric"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
                            {ko ? "회사 전체가 추적하는 하나의 핵심 숫자. 이 숫자가 올라가면 사업이 건강한 것입니다." : "The single number the whole company tracks. If it goes up, the business is healthy."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "6px" }}>
                          {nsOptions.map(s => {
                            const sel = nsType === s.id;
                            return (
                            <button key={s.id} type="button" onClick={() => chooseNs(s.id)} style={{
                              display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "12px",
                              background: sel ? "rgba(5,150,105,0.08)" : "rgba(5,150,105,0.02)",
                              border: sel ? "2px solid #059669" : "1px solid rgba(5,150,105,0.06)",
                              boxShadow: sel ? "0 0 0 3px rgba(5,150,105,0.08)" : "none",
                              cursor: "pointer", textAlign: "left" as const, transition: "all 0.2s ease", width: "100%",
                            }}>
                              <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: sel ? "rgba(5,150,105,0.15)" : "rgba(5,150,105,0.08)", color: "#059669", whiteSpace: "nowrap" as const, flexShrink: 0 }}>{s.type}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{s.metric}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.ex}</div>
                              </div>
                              {sel && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "#059669", padding: "2px 6px", borderRadius: "4px", flexShrink: 0, marginTop: "2px" }}>✓</span>}
                            </button>
                            );
                          })}
                        </div>
                        {/* 나의 북극성 지표 입력 */}
                        <div style={{ padding: "0 22px 18px" }}>
                          <div style={{ padding: "16px 18px", borderRadius: "14px", background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(5,150,105,0.12)" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                              {ko ? "나의 북극성 지표" : "MY NORTH STAR METRIC"}
                            </div>
                            <input
                              type="text"
                              placeholder={ko
                                ? (nsType === "saas" ? "예: 주간 활성 사용자(WAU)" : nsType === "marketplace" ? "예: 주간 거래 완료 수" : nsType === "content" ? "예: 주간 시청 시간" : nsType === "commerce" ? "예: 월 2회 이상 구매 고객 수" : "위에서 유형을 먼저 선택하세요")
                                : (nsType ? `e.g., ${nsOptions.find(o => o.id === nsType)?.metric ?? "Your metric"}` : "Select a type above first")}
                              value={nsName}
                              onChange={(e) => setNsName(e.target.value)}
                              style={{
                                width: "100%", padding: "10px 14px", borderRadius: "10px",
                                border: "1px solid rgba(5,150,105,0.12)", background: "rgba(248,250,252,0.8)",
                                fontSize: "14px", outline: "none", color: "#0f172a",
                                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = "#059669"; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(5,150,105,0.12)"; }}
                            />
                            <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "6px" }}>
                              {ko ? "자동 저장됩니다. 이 지표가 운영 대시보드에 표시됩니다." : "Auto-saved. This metric will appear on your dashboard."}
                            </div>
                          </div>
                        </div>
                      </div>
                        );
                      })()}

                      {/* PAGE 2 — 주간 성장 리뷰 */}
                      {pg === 2 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "매주 월요일, 30분 성장 리뷰를 하세요" : "Run a 30-min growth review every Monday"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "4px" }}>
                            {ko ? "YC가 가장 강조하는 습관입니다. 주간 5-7% 성장이 목표." : "The habit YC emphasizes most. Target: 5-7% weekly growth."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          {(ko ? [
                            { step: "1", title: "지난주 핵심 지표 확인", detail: "북극성 지표 + 매출 + 신규 가입 + 이탈률" },
                            { step: "2", title: "WoW 성장률 계산", detail: "3주 연속 0% = 위험 신호. 즉시 원인 진단" },
                            { step: "3", title: "이번 주 가장 큰 레버 1개 선택", detail: "성장에 가장 영향을 줄 수 있는 실험 1개만 집중" },
                            { step: "4", title: "실험 결과 기록", detail: "가설 → 실행 → 결과 → 배운 점. 기록 없으면 반복 불가" },
                          ] : [
                            { step: "1", title: "Check last week's metrics", detail: "NSM + revenue + signups + churn" },
                            { step: "2", title: "Calculate WoW growth", detail: "3 weeks at 0% = danger. Diagnose immediately" },
                            { step: "3", title: "Pick ONE biggest lever", detail: "Focus on one experiment that most impacts growth" },
                            { step: "4", title: "Record experiment results", detail: "Hypothesis → Action → Result → Learning" },
                          ]).map(s => (
                            <div key={s.step} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: s.step !== "4" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: "0 22px 16px", padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>{ko ? "AI 활용법 — 주간 리뷰 분석" : "AI — Weekly review analysis"}</div>
                          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, padding: "8px 12px", borderRadius: "8px", background: "rgba(37,99,235,0.03)", fontStyle: "italic" }}>
                            {ko ? "\"이번 주 지표: WAU 1,200(+3%), 신규가입 180(+8%), D7 리텐션 18%, 이탈률 12%. 지난 4주 데이터: [붙여넣기]. 1) 가장 우려되는 지표와 원인 가설 3개, 2) 이번 주 집중할 실험 우선순위 3개를 추천해줘.\"" : "\"This week: WAU 1,200(+3%), signups 180(+8%), D7 retention 18%, churn 12%. Last 4 weeks: [paste]. 1) Most concerning metric + 3 hypotheses, 2) Top 3 experiment priorities for this week.\""}
                          </div>
                        </div>
                      </div>
                      )}

                      {/* PAGE 3 — 리텐션 벤치마크 */}
                      {pg === 3 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
                            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "리텐션이 먼저입니다" : "Retention comes first"}</span>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "4px" }}>
                            {ko ? "리텐션 없이 광고비를 쓰면 돈만 태웁니다. 먼저 사용자가 돌아오는지 확인하세요." : "Spending on ads without retention burns money. First prove users come back."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                          {(ko ? [
                            { period: "D1", good: "40%+", desc: "첫날 재방문" },
                            { period: "D7", good: "20%+", desc: "첫주 유지" },
                            { period: "D30", good: "10%+", desc: "첫달 유지" },
                          ] : [
                            { period: "D1", good: "40%+", desc: "Day 1 return" },
                            { period: "D7", good: "20%+", desc: "Week 1" },
                            { period: "D30", good: "10%+", desc: "Month 1" },
                          ]).map(r => (
                            <div key={r.period} style={{ padding: "12px", borderRadius: "12px", background: "rgba(124,58,237,0.03)", textAlign: "center" as const }}>
                              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const }}>{r.period}</div>
                              <div style={{ fontSize: "18px", fontWeight: 740, color: "#7c3aed" }}>{r.good}</div>
                              <div style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)" }}>{r.desc}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "0 22px 16px", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.55 }}>
                          {ko ? "B2B SaaS는 D30 40%+, B2C 앱은 D30 15%+가 양호. 이 기준에 못 미치면 성장보다 제품 개선에 집중하세요." : "B2B SaaS needs D30 40%+, B2C app D30 15%+. Below this, focus on product improvement, not growth."}
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── MVP 구축 종합 가이드 (mvp_build) — 페이지네이션 ── */}
                {currentStage.code === "mvp_build" && (() => {
                  const ko = language === "ko";
                  type MvpTool = { name: string; desc: string; url: string; free: boolean; tag?: string };
                  const toolCard = (tool: MvpTool, color: string) => (
                    <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: "10px", padding: "10px 12px", borderRadius: "12px", background: `${color}04`, border: `1px solid ${color}10`, textDecoration: "none", color: "inherit" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{tool.name}</span>
                          {tool.free && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: "rgba(5,150,105,0.08)", color: "#059669" }}>{ko ? "무료" : "Free"}</span>}
                          {tool.tag && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: `${color}10`, color }}>{tool.tag}</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginTop: "2px" }}>{tool.desc}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "4px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  );
                  const toolSection = (toolsNode: React.ReactNode, count: number, toolsArr?: MvpTool[], color?: string) => {
                    const c = color ?? "#7c3aed";
                    const preview = toolsArr?.slice(0, 3) ?? [];
                    const hasMore = count > 3;
                    return (
                      <div style={{ marginTop: "4px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
                        {/* 항상 보이는 헤더 + 미리보기 3개 */}
                        <div style={{ padding: "12px 14px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
                            <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.4)", letterSpacing: "0.04em" }}>{ko ? "추천 도구" : "Tools"}</span>
                          </div>
                          <div style={{ display: "grid", gap: "5px" }}>
                            {preview.map(tool => toolCard(tool, c))}
                          </div>
                        </div>
                        {/* 더보기 버튼 (3개 초과 시) */}
                        {hasMore && (
                          <div style={{ padding: "8px 14px 12px" }}>
                            <button type="button" onClick={() => setMvpToolsOpen(!mvpToolsOpen)} style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
                              padding: "7px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)",
                              background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.4)",
                            }}>
                              {mvpToolsOpen ? (ko ? "접기" : "Less") : (ko ? `+${count - 3}개 더보기` : `+${count - 3} more`)}
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: mvpToolsOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
                                <path d="M3 5l4 4 4-4" stroke="rgba(15,23,42,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {mvpToolsOpen && (
                              <div style={{ display: "grid", gap: "5px", marginTop: "6px", animation: "bentoFadeIn 0.2s ease" }}>
                                {toolsArr?.slice(3).map(tool => toolCard(tool, c))}
                              </div>
                            )}
                          </div>
                        )}
                        {!hasMore && <div style={{ height: "12px" }} />}
                      </div>
                    );
                  };

                  const pages = ko ? [
                    // PAGE 0 — 개요
                    { title: "MVP 구축 로드맵", color: "#1d3557", content: (
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "10px" }}>가장 좁은 핵심 워크플로 하나를 해결하는 제품을 출시하세요.</div>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Reid Hoffman: "첫 버전이 창피하지 않다면 너무 늦게 출시한 것이다." Stripe는 7줄의 코드로 시작했습니다. LinkedIn은 런칭 직전 팀이 "Contact Finder를 먼저 만들자"고 했지만 Hoffman은 거절했고 — 7년이 지나도 그 기능은 필요 없었습니다.</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "14px" }}>
                          {[{ num: "2~6주", label: "목표 기간" }, { num: "1개", label: "핵심 워크플로" }, { num: "10명", label: "첫 사용자" }, { num: "~16만원", label: "월 도구비" }].map(s => (
                            <div key={s.label} style={{ padding: "10px", borderRadius: "10px", background: "rgba(29,53,87,0.03)", textAlign: "center" as const }}>
                              <div style={{ fontSize: "18px", fontWeight: 780, color: "var(--primary)" }}>{s.num}</div>
                              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.35)" }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>7단계 순서</div>
                        <div style={{ display: "grid", gap: "4px" }}>
                          {["제품명 & 미션 정하기", "핵심 워크플로 & 화면 설계", "코드 아키텍처 & DB 설계", "백엔드 & 배포 인프라 선택", "AI와 함께 코딩하기", "디자인 & 브랜딩", "랜딩 페이지 & 론칭"].map((s, i) => (
                            <div key={i} onClick={() => { setMvpPage(i + 1); setMvpToolsOpen(false); }} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", cursor: "pointer" }}>
                              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s}</span>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          ))}
                        </div>
                      </div>
                    )},
                    // PAGE 1 — 제품명 & 미션
                    { title: "제품명 & 미션 정하기", color: "#2563eb", content: (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.1)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>앞서 정의한 문제를 제품의 이름과 미션으로 바꾸세요.</div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>문제 정의 단계에서 작성한 한 문장이 랜딩 페이지의 헤드라인이 되고, 투자자에게 하는 첫 마디가 되며, 팀원을 설득하는 무기가 됩니다.</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
                        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
                          {["문제 정의를 기반으로 제품 미션 한 문장 확정", "제품명 후보 5~10개 + .com 도메인 확인", "30초 엘리베이터 피치 작성 (말로 연습해보세요)", "슬로건 1개 확정"].map(t => (
                            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: "7px" }} />
                              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)", marginBottom: "14px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>AI 활용법</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"나는 [타깃]을 위한 [핵심 기능] 제품을 만들려고 해. 1) 미션을 한 문장으로, 2) 슬로건 5개, 3) 제품명 후보 10개 (.com 도메인 가용성 고려), 4) 엘리베이터 피치 30초 버전을 만들어줘."</div>
                        </div>
                        {toolSection(null, 3, [{ name: "Namelix", desc: "AI 브랜드명 생성 + 도메인 확인. 선호도 학습", url: "https://namelix.com", free: true }, { name: "Looka", desc: "이름 + 로고 + 브랜드킷 한 번에. 한국어 지원", url: "https://looka.com", free: false, tag: "$20~" }, { name: "Claude / ChatGPT", desc: "미션, 슬로건, 엘리베이터 피치. 한국어 네이티브", url: "https://claude.ai", free: true, tag: "AI" }], "#2563eb")}
                      </div>
                    )},
                    // PAGE 2 — 워크플로 & 화면 설계
                    { title: "핵심 워크플로 & 화면 설계", color: "#7c3aed", content: (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.1)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>기능 10개를 넣지 마세요. 핵심 워크플로 하나만 완벽하게.</div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>사용자가 가입한 후 "아, 이거 좋다"라고 느끼는 순간까지의 최소 동선을 설계하세요. 이 한 화면에서 가치를 느끼지 못하면 나머지는 의미가 없습니다. Paul Graham: "적은 사람이 절실하게 원하는 것을 선택하라."</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
                        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
                          {["사용자의 핵심 동작(Core Action) 1개 정의", "가입 → Core Action까지 화면 수를 최소화 (3~5 화면 이내)", "각 화면의 와이어프레임을 AI로 생성", "불필요한 화면이 있는지 검토 — 없애도 되면 없애세요"].map(t => (
                            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: "7px" }} />
                              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)", marginBottom: "14px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.04em", marginBottom: "6px" }}>AI 활용법</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"[제품 설명]. 가입 → 핵심 가치 체험까지의 최소 화면 플로우를 설계해줘. 각 화면에 필요한 UI 요소와 사용자 액션을 정의하고, 불필요한 화면을 줄이는 방법을 제안해줘."</div>
                        </div>
                        {toolSection(null, 3, [{ name: "Google Stitch", desc: "텍스트 → UI 디자인 자동 생성. 월 350회 무료", url: "https://stitch.withgoogle.com", free: true, tag: "추천" }, { name: "v0 by Vercel", desc: "프롬프트 → 프로덕션 React+Tailwind 코드 출력", url: "https://v0.app", free: true, tag: "$5/mo" }, { name: "Figma + AI", desc: "화면 설계 업계 표준. Make 기능으로 AI 생성", url: "https://figma.com", free: true }], "#7c3aed")}
                      </div>
                    )},
                    // PAGE 3 — 코드 아키텍처 & DB
                    { title: "코드 아키텍처 & DB 설계", color: "#059669", content: (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(5,150,105,0.05)", border: "1px solid rgba(5,150,105,0.1)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>코드를 한 줄 쓰기 전에 전체 구조를 먼저 잡으세요.</div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>DB 테이블, API, 페이지 구조, 인증 플로우. 이 설계를 건너뛰면 3주 후 "처음부터 다시 만들어야 하는" 상황이 옵니다. AI에게 요구사항을 주면 Mermaid 다이어그램으로 전체 아키텍처를 그려줍니다.</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
                        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
                          {["필요한 DB 테이블과 관계 정의 (AI로 ERD 생성)", "API 엔드포인트 목록 작성", "페이지 구조(라우팅) 설계", "인증 플로우 결정 (이메일/소셜/매직링크)"].map(t => (
                            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669", flexShrink: 0, marginTop: "7px" }} />
                              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.08)", marginBottom: "14px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.04em", marginBottom: "6px" }}>AI 프롬프트</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"[제품 설명]을 만들려고 해. Next.js + Supabase + Vercel 스택으로. 1) 필요한 DB 테이블과 관계, 2) API 라우트 목록, 3) 페이지 구조, 4) 인증 플로우를 설계해줘. Mermaid 다이어그램으로."</div>
                        </div>
                        {toolSection(null, 3, [{ name: "Eraser.io", desc: "AI 시스템 아키텍처 + ERD 다이어그램 자동 생성", url: "https://eraser.io", free: true }, { name: "Supabase Studio", desc: "비주얼 테이블 에디터 + 스키마 관리", url: "https://supabase.com", free: true }, { name: "dbdiagram.io", desc: "간단한 DSL로 DB 다이어그램 생성", url: "https://dbdiagram.io", free: true }], "#059669")}
                      </div>
                    )},
                    // PAGE 4 — 백엔드 & 인프라
                    { title: "백엔드 & 배포 인프라", color: "#d97706", content: (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.1)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>2026년에 서버를 직접 관리하는 건 시간 낭비입니다.</div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>BaaS를 쓰면 인증, DB, 스토리지, 실시간 기능을 코드 몇 줄로 얻습니다. YC 스타트업의 50%+가 React, 25.6%가 Vercel을 사용합니다. 검증된 조합을 선택하세요.</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
                        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
                          {["BaaS 선택 (Supabase 추천 — PostgreSQL + Auth + Storage)", "배포 플랫폼 선택 (Vercel 추천 — Next.js 제로 설정)", "프로젝트 초기 세팅 (npx create-next-app + Supabase 연결)", "환경변수 설정 + 배포 테스트"].map(t => (
                            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706", flexShrink: 0, marginTop: "7px" }} />
                              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        {toolSection(null, 3, [{ name: "Supabase", desc: "PostgreSQL + 인증 + 스토리지 + 실시간. 무료 50K MAU", url: "https://supabase.com", free: true, tag: "DB 추천" }, { name: "Vercel", desc: "Next.js 배포 제로 설정. Edge Function 지원. 무료 시작", url: "https://vercel.com", free: true, tag: "배포 추천" }, { name: "Railway", desc: "사용량 기반 과금. 유휴 시 0원. 인디 해커 선호", url: "https://railway.app", free: false, tag: "$5/mo" }], "#d97706")}
                      </div>
                    )},
                    // PAGE 5 — AI 코딩
                    { title: "AI와 함께 코딩하기", color: "#dc2626", content: (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>1인이 5인 팀의 생산성을 냅니다 — AI 도구가 게임을 바꿨습니다.</div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>Lovable로 프로토타입을 몇 시간 안에 만들고 → 사용자 반응 확인 → 반응이 좋으면 Cursor + Claude Code로 프로덕션을 2~4주에 완성. 프로토타입 코드를 프로덕션으로 옮기지 마세요 — 처음부터 깨끗하게 다시 짜는 게 더 빠릅니다.</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
                        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
                          {["Lovable/Bolt로 작동하는 프로토타입 만들기 (1~2일)", "프로토타입을 5~10명에게 보여주고 반응 확인", "반응이 좋으면 Cursor + Claude Code로 프로덕션 시작", "shadcn/ui 컴포넌트로 UI 구축 + Supabase DB 연결", "매일 배포하고 매일 피드백 받기"].map(t => (
                            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626", flexShrink: 0, marginTop: "7px" }} />
                              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        {toolSection(null, 5, [{ name: "Cursor", desc: "AI 코딩 속도 최강. VS Code 포크. 인라인 편집 + 채팅", url: "https://cursor.com", free: false, tag: "속도 $20/mo" }, { name: "Claude Code", desc: "코드 품질 최강. 토큰 5.5배 절약. 터미널 + IDE 통합", url: "https://claude.ai/code", free: false, tag: "품질 $20/mo" }, { name: "Lovable", desc: "비개발자도 OK. 채팅으로 풀스택 앱 생성. 원클릭 배포", url: "https://lovable.dev", free: true, tag: "프로토타입" }, { name: "Bolt.new", desc: "브라우저에서 즉시 코딩. 설치 불필요. 무료 1M토큰/월", url: "https://bolt.new", free: true }, { name: "GitHub Copilot", desc: "인라인 자동완성 최고. 2,000만+ 유저. 무료 플랜 있음", url: "https://github.com/features/copilot", free: true, tag: "$10/mo" }], "#dc2626")}
                      </div>
                    )},
                    // PAGE 6 — 디자인 & 브랜딩
                    { title: "디자인 & 브랜딩", color: "#0891b2", content: (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.1)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>MVP라도 디자인이 후지면 사용자는 떠납니다.</div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>사용자는 제품의 가치를 기능이 아니라 "느낌"으로 먼저 판단합니다. shadcn/ui를 쓰면 Apple 수준의 컴포넌트를 무료로 얻고, 로고는 AI로 1시간 안에 만들 수 있습니다.</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
                        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
                          {["shadcn/ui 컴포넌트로 전체 UI 통일", "Looka 또는 Canva로 로고 + 파비콘 제작", "브랜드 컬러 2~3색 확정 (primary + accent)", "OG 이미지 (소셜 공유용) 제작"].map(t => (
                            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0891b2", flexShrink: 0, marginTop: "7px" }} />
                              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        {toolSection(null, 4, [{ name: "shadcn/ui", desc: "2026 표준 컴포넌트 라이브러리. Tailwind + Radix. 코드 소유", url: "https://ui.shadcn.com", free: true, tag: "필수" }, { name: "Looka", desc: "AI 로고 + 브랜드킷 한 번에. 한국어 지원", url: "https://looka.com", free: false, tag: "$20~" }, { name: "Canva AI", desc: "마케팅 에셋 만능. 한국어 UI. 무료 티어 충분", url: "https://canva.com", free: true, tag: "한국어" }, { name: "Aceternity UI", desc: "애니메이션 랜딩 컴포넌트. SaaS 페이지에 최적", url: "https://ui.aceternity.com", free: true }], "#0891b2")}
                      </div>
                    )},
                    // PAGE 7 — 랜딩 & 론칭
                    { title: "랜딩 페이지 & 론칭", color: "#1d3557", content: (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(29,53,87,0.05)", border: "1px solid rgba(29,53,87,0.1)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>랜딩 페이지는 24시간 작동하는 영업사원입니다.</div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>헤드라인(무엇), 서브헤딩(왜), 스크린샷(어떻게), CTA(시작) — 이 4가지만 있으면 됩니다. 그리고 Stripe처럼 "노트북 줘봐"라며 직접 설치해주세요.</div>
                        </div>
                        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(29,53,87,0.03)", borderLeft: "3px solid rgba(29,53,87,0.15)", marginBottom: "16px" }}>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6, fontStyle: "italic" }}>"스타트업이 이륙하는 건 저절로 되는 게 아니라 창업자가 밀어붙여서다. Airbnb는 뉴욕에 매주 날아가 집주인을 직접 만났고, 그 30일의 노력이 성공과 실패를 갈랐다." — Paul Graham</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
                        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
                          {["랜딩 페이지 제작 (헤드라인 + 스크린샷 + CTA)", "Product Hunt 론칭 준비 (론칭 데이 전략)", "첫 10명 사용자를 직접 찾아가서 모으기", "SEO 기본 설정 (메타 태그, OG 이미지, sitemap)"].map(t => (
                            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1d3557", flexShrink: 0, marginTop: "7px" }} />
                              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                        {toolSection(null, 4, [{ name: "Framer", desc: "디자이너급 랜딩 페이지. AI 레이아웃 자동 생성", url: "https://framer.com", free: false, tag: "$10/mo" }, { name: "Product Hunt", desc: "글로벌 론칭 플랫폼 #1. 론칭 데이 전략 준비 필수", url: "https://producthunt.com", free: true }, { name: "Hacker News (Show HN)", desc: "기술 커뮤니티 피드백. 폭발적 트래픽 가능", url: "https://news.ycombinator.com", free: true }, { name: "CodeRabbit", desc: "AI 코드 리뷰. GitHub PR 자동 리뷰. 무료", url: "https://coderabbit.ai", free: true, tag: "QA" }], "#1d3557")}
                      </div>
                    )},
                  ] : [
                    // English pages — same structure, shorter
                    { title: "MVP Build Roadmap", color: "#1d3557", content: (<div><div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "10px" }}>Ship a product that solves one core workflow in 2-6 weeks.</div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7 }}>Reid Hoffman: "If you're not embarrassed by the first version, you've launched too late." Navigate through 7 steps using the arrows below.</div></div>) },
                    { title: "Name & Mission", color: "#2563eb", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Explain what your product does in one sentence. This becomes your landing page headline, your first pitch to investors, and your team's north star.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Namelix", desc: "AI brand names + domain check", url: "https://namelix.com", free: true }, "#2563eb")}{toolCard({ name: "Claude / ChatGPT", desc: "Mission, slogan, elevator pitch", url: "https://claude.ai", free: true, tag: "AI" }, "#2563eb")}</div></div>) },
                    { title: "Core Workflow & Wireframe", color: "#7c3aed", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Design the minimum path from signup to "aha moment." One workflow, perfect. Paul Graham: "Build something a small number of people want a large amount."</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Google Stitch", desc: "Text → UI design. 350 free/mo", url: "https://stitch.withgoogle.com", free: true, tag: "Best" }, "#7c3aed")}{toolCard({ name: "v0 by Vercel", desc: "Prompt → production React+Tailwind", url: "https://v0.app", free: true }, "#7c3aed")}</div></div>) },
                    { title: "Architecture & DB Design", color: "#059669", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Design the full structure before writing code. DB tables, API routes, page structure, auth flow. Skip this and you'll rebuild from scratch later.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Eraser.io", desc: "AI architecture + ERD diagrams", url: "https://eraser.io", free: true }, "#059669")}{toolCard({ name: "Supabase Studio", desc: "Visual table editor + schema", url: "https://supabase.com", free: true }, "#059669")}</div></div>) },
                    { title: "Backend & Deployment", color: "#d97706", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Don't manage servers. Use BaaS for auth, DB, storage in a few lines. 50%+ of YC startups use React, 25.6% deploy on Vercel.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Supabase", desc: "PostgreSQL + Auth + Storage. Free 50K MAU", url: "https://supabase.com", free: true, tag: "DB" }, "#d97706")}{toolCard({ name: "Vercel", desc: "Zero-config Next.js deploy", url: "https://vercel.com", free: true, tag: "Deploy" }, "#d97706")}</div></div>) },
                    { title: "Code with AI", color: "#dc2626", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>One person with AI tools = 5-person team. Strategy: Lovable for prototype (hours) → Cursor + Claude Code for production (2-4 weeks).</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Cursor", desc: "Fastest AI coding. VS Code fork", url: "https://cursor.com", free: false, tag: "Speed $20/mo" }, "#dc2626")}{toolCard({ name: "Claude Code", desc: "Best quality. 5.5x fewer tokens", url: "https://claude.ai/code", free: false, tag: "Quality" }, "#dc2626")}{toolCard({ name: "Lovable", desc: "Chat-to-app. One-click deploy", url: "https://lovable.dev", free: true, tag: "Prototype" }, "#dc2626")}</div></div>) },
                    { title: "Design & Branding", color: "#0891b2", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Even an MVP needs good design. Users judge by feel first. shadcn/ui gives Apple-level components for free.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "shadcn/ui", desc: "2026 standard. Tailwind + Radix", url: "https://ui.shadcn.com", free: true, tag: "Must" }, "#0891b2")}{toolCard({ name: "Looka", desc: "AI logo + brand kit", url: "https://looka.com", free: false, tag: "$20~" }, "#0891b2")}</div></div>) },
                    { title: "Landing & Launch", color: "#1d3557", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>"Startups take off because founders make them take off." — Paul Graham. Landing page = 24/7 salesperson. Headline + Screenshot + CTA.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Framer", desc: "Designer-quality landing page", url: "https://framer.com", free: false, tag: "$10/mo" }, "#1d3557")}{toolCard({ name: "Product Hunt", desc: "Global launch platform #1", url: "https://producthunt.com", free: true }, "#1d3557")}</div></div>) },
                  ];

                  const page = pages[mvpPage] ?? pages[0];
                  const total = pages.length;

                  return (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ borderRadius: "20px", border: `1px solid ${page.color}15`, background: `linear-gradient(180deg, ${page.color}04 0%, rgba(255,255,255,0.98) 100%)`, overflow: "hidden" }}>
                        {/* 헤더 */}
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            {mvpPage > 0 && <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: page.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>{mvpPage}</div>}
                            <span style={{ fontSize: "11px", fontWeight: 700, color: page.color, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                              {mvpPage === 0 ? (ko ? "개요" : "Overview") : `Step ${mvpPage} / ${total - 1}`}
                            </span>
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: 720, letterSpacing: "-0.03em", color: "#0f172a" }}>{page.title}</div>
                        </div>
                        {/* 콘텐츠 */}
                        <div style={{ padding: "0 22px 20px" }}>{page.content}</div>
                      </div>

                      {/* 페이지네이션 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
                        <button type="button" onClick={() => { setMvpPage(Math.max(0, mvpPage - 1)); setMvpToolsOpen(false); }} disabled={mvpPage === 0}
                          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: mvpPage === 0 ? "rgba(0,0,0,0.02)" : "white", color: mvpPage === 0 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: mvpPage === 0 ? "default" : "pointer" }}>
                          ← {ko ? "이전" : "Prev"}
                        </button>
                        <div style={{ display: "flex", gap: "5px" }}>
                          {pages.map((_, i) => (
                            <div key={i} onClick={() => { setMvpPage(i); setMvpToolsOpen(false); }} style={{ width: i === mvpPage ? "20px" : "8px", height: "8px", borderRadius: "100px", background: i === mvpPage ? "var(--primary)" : "rgba(0,0,0,0.1)", cursor: "pointer", transition: "all 0.2s ease" }} />
                          ))}
                        </div>
                        <button type="button" onClick={() => { setMvpPage(Math.min(total - 1, mvpPage + 1)); setMvpToolsOpen(false); }} disabled={mvpPage === total - 1}
                          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: mvpPage === total - 1 ? "rgba(0,0,0,0.02)" : "white", color: mvpPage === total - 1 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: mvpPage === total - 1 ? "default" : "pointer" }}>
                          {ko ? "다음" : "Next"} →
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 스타트업 도구·AI 추천 패널 (mvp_build는 자체 가이드에 포함되어 있으므로 제외) ── */}
                {/* ── 스타트업 도구·AI — 접기/펼치기 (mvp_build, launch_gtm 제외) ── */}
                {isStartupCategory && currentStage.code !== "mvp_build" && currentStage.code !== "launch_gtm" && (() => {
                  const stageIdMap: Record<string, string> = {
                    startup_foundation: "startup-foundation", customer_discovery: "customer-discovery",
                    mvp_build: "mvp-build", launch_gtm: "launch-gtm", growth_engine: "growth-engine",
                    company_setup: "company-setup", fundraising_readiness: "fundraising-readiness",
                    venture_certification: "venture-certification",
                  };
                  const mappedStageId = stageIdMap[currentStage.code as string];
                  if (!mappedStageId) return null;
                  const toolkit = getFullToolKit(mappedStageId, selectedIndustryId);
                  if (toolkit.essential.length === 0) return null;
                  const ko = language === "ko";

                  const toolRenderer = (tool: typeof toolkit.essential[0]) => (
                    <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "12px",
                      background: tool.recommended ? "rgba(124,58,237,0.03)" : "rgba(0,0,0,0.01)",
                      border: tool.recommended ? "1px solid rgba(124,58,237,0.08)" : "1px solid rgba(0,0,0,0.04)",
                      textDecoration: "none", color: "inherit",
                    }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: tool.aiPowered ? "rgba(124,58,237,0.08)" : "rgba(15,23,42,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {tool.aiPowered
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6"><path d="M12 2l2 4h4l-3 3 1 5-4-3-4 3 1-5-3-3h4l2-4z"/></svg>
                          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="1.6"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "1px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{tool.name}</span>
                          {tool.aiPowered && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>AI</span>}
                          {tool.koreanSupport && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: "rgba(5,150,105,0.08)", color: "#059669" }}>KR</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{ko ? tool.description.ko : tool.description.en}</div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#7c3aed", marginTop: "2px" }}>{tool.pricing}</div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  );

                  const preview = toolkit.essential.slice(0, 3);
                  const rest = toolkit.essential.slice(3);
                  const hasMore = rest.length > 0;

                  return (
                    <div style={{ marginBottom: "16px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
                      {/* 헤더 + 미리보기 3개 (항상 보임) */}
                      <div style={{ padding: "12px 14px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
                          <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.4)", letterSpacing: "0.04em" }}>{ko ? "추천 도구 · AI" : "Tools"}</span>
                          <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.25)" }}>{ko ? `월 ${toolkit.monthlyCost}` : `${toolkit.monthlyCost}/mo`}</span>
                        </div>
                        <div style={{ display: "grid", gap: "5px" }}>
                          {preview.map(toolRenderer)}
                        </div>
                      </div>
                      {/* 더보기 (3개 초과 시) */}
                      {hasMore && (
                        <div style={{ padding: "8px 14px 12px" }}>
                          <button type="button" onClick={() => setMvpToolsOpen(!mvpToolsOpen)} style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
                            padding: "7px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)",
                            background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.4)",
                          }}>
                            {mvpToolsOpen ? (ko ? "접기" : "Less") : (ko ? `+${rest.length}개 더보기` : `+${rest.length} more`)}
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: mvpToolsOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
                              <path d="M3 5l4 4 4-4" stroke="rgba(15,23,42,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          {mvpToolsOpen && (
                            <div style={{ display: "grid", gap: "5px", marginTop: "6px", animation: "bentoFadeIn 0.2s ease" }}>
                              {rest.map(toolRenderer)}
                              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.04)", display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "2px" }}>
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/></svg>
                                <span style={{ fontSize: "12px", color: "rgba(124,58,237,0.8)", lineHeight: 1.55 }}>{ko ? toolkit.aiTip.ko : toolkit.aiTip.en}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {!hasMore && <div style={{ height: "12px" }} />}
                    </div>
                  );
                })()}

                {/* ── 출시 스택·GTM 가이드 (launch_gtm) — 페이지네이션 ── */}
                {currentStage.code === "launch_gtm" && (() => {
                  const ko = language === "ko";
                  const pg = guideStepIndex;
                  const totalPg = 5;
                  const pgLabels = ko
                    ? ["왜 중요한가", "1. 분석 연결", "2. 결제·전환", "3. 에러 모니터링", "4. 피드백 루프"]
                    : ["Why", "1. Analytics", "2. Billing", "3. Errors", "4. Feedback"];

                  const stepBullets = (items: string[], color: string) => (
                    <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                      {items.map(t => (
                        <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0, marginTop: "7px" }} />
                          <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  );

                  const toolLink = (t: { name: string; desc: string; url: string; color: string }) => (
                    <a key={t.name} href={t.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: `${t.color}04`, border: `1px solid ${t.color}10`, textDecoration: "none", color: "inherit" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{t.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{t.desc}</div>
                      </div>
                    </a>
                  );

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 페이지 네비 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex(p => p - 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
                        }}>{ko ? "← 이전" : "← Prev"}</button>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                          {pgLabels.map((l, i) => (
                            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
                              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
                              background: i === pg ? "#1d3557" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
                              border: "none", cursor: "pointer",
                            }}>{l}</button>
                          ))}
                        </div>
                        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex(p => p + 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
                        }}>{ko ? "다음 →" : "Next →"}</button>
                      </div>

                      {/* PAGE 0 — WHY */}
                      {pg === 0 && (
                      <>
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
                        </div>
                        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
                            {ko ? "계측 없이 성장을 밀면, 소음을 신호로 착각합니다." : "Pushing growth without instrumentation means mistaking noise for signal."}
                          </div>
                          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
                            {ko ? "MVP를 출시했다면, 이제 4가지를 깔아야 합니다: 분석, 결제, 에러 모니터링, 피드백 루프. 이 4가지가 있어야 의미 있는 의사결정이 가능합니다." : "After launching MVP, you need 4 things: analytics, billing, error monitoring, and feedback loop. These 4 enable meaningful decisions."}
                          </div>
                        </div>
                      </div>
                      {/* 4단계 로드맵 미리보기 */}
                      <div style={{ display: "grid", gap: "6px" }}>
                        {(ko ? [
                          { num: 1, title: "분석(Analytics) 연결", desc: "사용자 행동 추적 — 어디서 오고, 뭘 하고, 어디서 떠나는지", color: "#2563eb" },
                          { num: 2, title: "결제 · 전환 흐름 세팅", desc: "\"사람들이 돈을 낼 것인가?\" 이 질문에 답하기", color: "#059669" },
                          { num: 3, title: "에러 모니터링 연결", desc: "사용자가 겪는 에러를 실시간으로 파악", color: "#d97706" },
                          { num: 4, title: "고객 피드백 루프 구축", desc: "불만 고객은 말 없이 떠남 — 채널을 열어야 이유를 앎", color: "#7c3aed" },
                        ] : [
                          { num: 1, title: "Connect Analytics", desc: "Track user behavior — where they come, what they do, where they leave", color: "#2563eb" },
                          { num: 2, title: "Set up Billing", desc: "Answer: \"Will people pay?\"", color: "#059669" },
                          { num: 3, title: "Error Monitoring", desc: "Know what breaks, in real time", color: "#d97706" },
                          { num: 4, title: "Feedback Loop", desc: "Unhappy users leave silently — open a channel", color: "#7c3aed" },
                        ]).map(s => (
                          <div key={s.num} onClick={() => setGuideStepIndex(s.num)} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", background: `${s.color}04`, border: `1px solid ${s.color}10`, cursor: "pointer" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        ))}
                      </div>
                      {/* 완료 기준 */}
                      <div style={{ borderRadius: "16px", border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.95)", padding: "16px 18px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계 완료 기준" : "Completion criteria"}</div>
                        <div style={{ display: "grid", gap: "4px" }}>
                          {(ko ? [
                            "분석 대시보드에서 주간 지표 확인 가능",
                            "결제 또는 전환 흐름이 작동 (테스트 결제 성공)",
                            "에러 발생 시 Slack 알림 수신",
                            "사용자 피드백 채널이 열려있고 첫 피드백 수집 완료",
                          ] : [
                            "Weekly metrics visible in analytics dashboard",
                            "Payment/conversion flow working (test payment success)",
                            "Slack alert on errors",
                            "Feedback channel open with first feedback collected",
                          ]).map(dd => (
                            <div key={dd} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "3px" }}><circle cx="7" cy="7" r="6" stroke="#059669" strokeWidth="1.4"/><path d="M4.5 7l1.8 1.8 3.2-3.6" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span>{dd}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      </>
                      )}

                      {/* PAGE 1 — 분석 (Analytics) */}
                      {pg === 1 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
                          <div>
                            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "분석(Analytics) 연결" : "Connect Analytics"}</div>
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", marginBottom: "12px" }}>
                            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
                              {ko ? "사용자가 어디서 오고, 뭘 클릭하고, 어디서 떠나는지 추적하세요. 가입 전환율, 핵심 기능 사용률, 이탈 지점 — 이 3가지를 첫 주에 볼 수 있어야 합니다. 감이 아닌 데이터로 판단해야 합니다." : "Track where users come from, what they click, where they leave. Signup conversion, core feature usage, drop-off points — see these in week 1."}
                            </div>
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
                          {stepBullets(ko ? [
                            "Mixpanel 또는 PostHog 연결 (이벤트 기반 분석)",
                            "핵심 이벤트 5개 정의: 가입, 핵심액션, 결제, 재방문, 이탈",
                            "퍼널(Funnel) 1개 세팅: 가입 → 핵심 액션 → 재방문",
                            "주간 대시보드 만들기 — 매주 월요일 확인",
                          ] : [
                            "Connect Mixpanel or PostHog (event-based analytics)",
                            "Define 5 core events: signup, core action, payment, return, churn",
                            "Set up 1 funnel: signup → core action → return",
                            "Build weekly dashboard — check every Monday",
                          ], "#2563eb")}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            {toolLink({ name: "Mixpanel", desc: ko ? "이벤트 기반 분석. 무료 20M 이벤트/월" : "Event analytics. Free 20M events/mo", url: "https://mixpanel.com", color: "#7c3aed" })}
                            {toolLink({ name: "PostHog", desc: ko ? "오픈소스. 분석+세션 리플레이+A/B 테스트" : "Open source. Analytics+session replay+A/B", url: "https://posthog.com", color: "#2563eb" })}
                          </div>
                        </div>
                      </div>
                      )}

                      {/* PAGE 2 — 결제 (Billing) */}
                      {pg === 2 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
                          <div>
                            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "결제 · 전환 흐름 세팅" : "Set up billing & conversion"}</div>
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(5,150,105,0.04)", marginBottom: "12px" }}>
                            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
                              {ko ? "무료 사용자가 유료로 전환하는 지점을 설계하세요. 결제가 안 붙어있으면 가장 중요한 질문에 답할 수 없습니다. Stripe는 7줄 코드로 결제를 연동할 수 있습니다." : "Design the point where free users convert to paid. Without billing, you can't answer: \"Will people pay?\" Stripe connects in 7 lines of code."}
                            </div>
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
                          {stepBullets(ko ? [
                            "가격 정책 결정: 무료 / 프리미엄(Free+Pro) / 사용량 기반",
                            "Stripe 연동 — 결제 페이지, 구독 관리, 웹훅 설정",
                            "무료→유료 전환 트리거 설계 (기능 제한 / 사용량 제한 / 시간 제한)",
                            "결제 전환율 추적 이벤트 추가 (가격 페이지 방문 → 결제 시작 → 완료)",
                          ] : [
                            "Decide pricing: free / freemium / usage-based",
                            "Integrate Stripe — checkout, subscription, webhooks",
                            "Design free→paid trigger (feature/usage/time limit)",
                            "Add conversion tracking events",
                          ], "#059669")}
                          {toolLink({ name: "Stripe", desc: ko ? "글로벌 결제 표준. 한국 원화 지원. 7줄 코드로 연동" : "Global payment standard. KRW supported. 7 lines to integrate", url: "https://stripe.com", color: "#635bff" })}
                        </div>
                      </div>
                      )}

                      {/* PAGE 3 — 에러 모니터링 */}
                      {pg === 3 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#d97706", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
                          <div>
                            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "에러 모니터링 연결" : "Connect error monitoring"}</div>
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(217,119,6,0.04)", marginBottom: "12px" }}>
                            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
                              {ko ? "사용자가 에러를 겪으면 말 없이 떠납니다. Sentry를 연결하면 어떤 에러가 어디서 몇 번 발생하는지 실시간으로 알 수 있습니다. 초기 스타트업에서 \"사용자가 안 쓴다\"고 생각한 것이 사실은 \"에러 때문에 못 쓴 것\"인 경우가 매우 많습니다." : "Users leave silently when they hit errors. Sentry shows what errors happen, where, how often."}
                            </div>
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
                          {stepBullets(ko ? [
                            "Sentry 연결 — Next.js SDK 설치 (10분이면 끝)",
                            "Slack 알림 연동 — 에러 발생 시 즉시 알림",
                            "주요 API 응답 시간 모니터링 (Vercel Analytics 무료)",
                            "매일 에러 대시보드 확인 습관 만들기",
                          ] : [
                            "Connect Sentry — Next.js SDK install (10 min)",
                            "Slack alert integration — instant error notifications",
                            "Monitor key API response times (Vercel Analytics free)",
                            "Build daily error dashboard check habit",
                          ], "#d97706")}
                          {toolLink({ name: "Sentry", desc: ko ? "에러 모니터링 표준. 무료 5K 이벤트/월. Next.js 공식 지원" : "Error monitoring standard. Free 5K events/mo. Next.js support", url: "https://sentry.io", color: "#d97706" })}
                        </div>
                      </div>
                      )}

                      {/* PAGE 4 — 고객 피드백 루프 */}
                      {pg === 4 && (
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>4</div>
                          <div>
                            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "고객 피드백 루프 구축" : "Build customer feedback loop"}</div>
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.04)", marginBottom: "12px" }}>
                            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
                              {ko ? "사용자가 불편을 말할 수 있는 채널이 항상 열려 있어야 합니다. 불만 고객은 말하지 않고 떠납니다 — 채널이 없으면 왜 떠났는지 영원히 모릅니다." : "Users must always have a channel to report issues. Unhappy users leave silently — without a channel, you'll never know why."}
                            </div>
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
                          {stepBullets(ko ? [
                            "앱 내 피드백 버튼 추가 (\"의견 보내기\" — 클릭 한 번으로)",
                            "Discord 또는 카카오 오픈채팅방 개설 — 초기 사용자 커뮤니티",
                            "가입 후 24시간 내 환영 이메일 + \"뭐가 불편했나요?\" 질문",
                            "주간 피드백 정리 — AI로 패턴 분석 후 우선순위 결정",
                          ] : [
                            "Add in-app feedback button (one click to send)",
                            "Create Discord or community channel for early users",
                            "Welcome email within 24h + \"What was frustrating?\"",
                            "Weekly feedback digest — AI pattern analysis + prioritize",
                          ], "#7c3aed")}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            {toolLink({ name: "Intercom", desc: ko ? "인앱 채팅 + 이메일 자동화. 스타트업 무료 플랜" : "In-app chat + email. Startup free plan", url: "https://intercom.com", color: "#2563eb" })}
                            {toolLink({ name: "Discord", desc: ko ? "커뮤니티 무료 구축. 초기 사용자와 직접 대화" : "Free community. Talk directly with early users", url: "https://discord.com", color: "#5865F2" })}
                          </div>
                        </div>
                      </div>
                      )}

                      {/* 추천 기술 스택 — 3개 미리보기 + 더보기 */}
                      {(() => {
                        const stack = getRecommendedStack(selectedIndustryId ?? "ai-application");
                        if (!stack) return null;
                        const layerCard = (layer: typeof stack.layers[0], i: number) => (
                          <a key={layer.role} href={layer.url} target="_blank" rel="noopener noreferrer" style={{
                            display: "flex", alignItems: "center", gap: "10px", padding: "8px 0",
                            borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none",
                            textDecoration: "none", color: "inherit",
                          }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `${layer.color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{layer.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "10px", fontWeight: 650, color: layer.color, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{ko ? layer.role : layer.roleEn}</div>
                              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{layer.tool}</div>
                              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{ko ? layer.why.ko : layer.why.en}</div>
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.4)", whiteSpace: "nowrap" as const, flexShrink: 0 }}>{layer.pricing}</div>
                          </a>
                        );
                        const previewLayers = stack.layers.slice(0, 3);
                        const restLayers = stack.layers.slice(3);
                        return (
                          <div style={{ marginTop: "4px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
                            <div style={{ padding: "12px 14px 0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
                                <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.4)", letterSpacing: "0.04em" }}>{ko ? "추천 기술 스택" : "Tech Stack"}</span>
                                <span style={{ fontSize: "10px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: "rgba(124,58,237,0.06)", color: "#7c3aed" }}>2026</span>
                              </div>
                              <div>{previewLayers.map((l, i) => layerCard(l, i))}</div>
                            </div>
                            {restLayers.length > 0 && (
                              <div style={{ padding: "8px 14px 12px" }}>
                                <button type="button" onClick={() => setMvpToolsOpen(!mvpToolsOpen)} style={{
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
                                  padding: "7px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)",
                                  background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.4)",
                                }}>
                                  {mvpToolsOpen ? (ko ? "접기" : "Less") : (ko ? `+${restLayers.length}개 더보기 · 총 월 ${stack.totalMonthlyCost}` : `+${restLayers.length} more · ${stack.totalMonthlyCost}/mo`)}
                                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: mvpToolsOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
                                    <path d="M3 5l4 4 4-4" stroke="rgba(15,23,42,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                                {mvpToolsOpen && (
                                  <div style={{ marginTop: "6px", animation: "bentoFadeIn 0.2s ease" }}>
                                    {restLayers.map((l, i) => layerCard(l, i))}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "8px" }}>
                                      <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(15,23,42,0.02)" }}>
                                        <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "2px" }}>{ko ? "총 월 비용" : "Monthly"}</div>
                                        <div style={{ fontSize: "15px", fontWeight: 740, color: "#0f172a" }}>{stack.totalMonthlyCost}</div>
                                      </div>
                                      <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(5,150,105,0.03)" }}>
                                        <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "2px" }}>{ko ? "크레딧" : "Credits"}</div>
                                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#059669", lineHeight: 1.4 }}>{ko ? stack.startupCredits.ko : stack.startupCredits.en}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {restLayers.length === 0 && <div style={{ height: "12px" }} />}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* 기술 스택 패널은 launch_stack 가이드 내부로 통합됨 */}

                {/* ── 벤처인증 · 정부 지원사업 가이드 (venture_certification) — 페이지네이션 ── */}
                {currentStage.code === "venture_certification" && (() => {
                  const ko = language === "ko";
                  const pg = guideStepIndex;
                  const totalPg = 4;
                  const pgLabels = ko
                    ? ["왜 중요한가", "1. 인증 유형", "2. 혜택 상세", "3. 정부 지원사업"]
                    : ["Why", "1. Cert Types", "2. Benefits", "3. Gov Programs"];
                  const progCard = (p: { name: string; amount: string; detail: string; color: string; url: string }) => (
                    <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "12px",
                      border: `1px solid ${p.color}12`, background: `${p.color}03`, textDecoration: "none", color: "inherit",
                    }}>
                      <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${p.color}0a`, fontSize: "11px", fontWeight: 700, color: p.color, whiteSpace: "nowrap" as const, flexShrink: 0 }}>{p.amount}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "1px" }}>{p.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{p.detail}</div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  );
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 페이지 네비 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex(p => p - 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
                        }}>{ko ? "← 이전" : "← Prev"}</button>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                          {pgLabels.map((l, i) => (
                            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
                              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
                              background: i === pg ? "#1d3557" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
                              border: "none", cursor: "pointer",
                            }}>{l}</button>
                          ))}
                        </div>
                        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex(p => p + 1)} style={{
                          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
                          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
                        }}>{ko ? "다음 →" : "Next →"}</button>
                      </div>

                      {/* PAGE 0 — WHY */}
                      {pg === 0 && (
                      <>
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
                          {ko ? "벤처인증 하나로 수천만원의 세금과 기회를 절약합니다." : "One certification saves millions in tax and unlocks opportunities."}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
                          {ko ? "벤처기업 인증을 받으면 법인세/소득세 50% 감면(5년), 취득세 75% 감면, 스톡옵션 비과세(연 2억), 정부 지원사업 우선 선발 등 핵심 혜택을 받습니다. 인증 없이 같은 비용을 직접 부담하면 초기 자본이 빠르게 소진됩니다. 정부 지원사업은 마감이 정해져 있어, 놓치면 1년을 기다려야 합니다." : "Venture certification gives you 50% tax reduction (5yr), 75% acquisition tax cut, tax-free stock options (₩200M/yr), and priority for government programs. Missing deadlines means waiting a full year."}
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: "6px" }}>
                        {(ko ? [
                          { num: 1, title: "인증 유형 확인", desc: "벤처투자 / 연구개발 / 혁신성장 — 우리 회사에 맞는 유형 선택", color: "#2563eb" },
                          { num: 2, title: "혜택 상세", desc: "세금 감면, 스톡옵션, 투자자 소득공제 등 구체적 금액", color: "#059669" },
                          { num: 3, title: "정부 지원사업 매칭", desc: "TIPS, 예비창업패키지, 초기창업패키지 등 신청 일정", color: "#7c3aed" },
                        ] : [
                          { num: 1, title: "Check Certification Type", desc: "Investment / R&D / Innovation Growth — find your fit", color: "#2563eb" },
                          { num: 2, title: "Detailed Benefits", desc: "Tax cuts, stock options, investor deductions", color: "#059669" },
                          { num: 3, title: "Government Program Match", desc: "TIPS, Pre-startup, Early-stage package deadlines", color: "#7c3aed" },
                        ]).map(s => (
                          <div key={s.num} onClick={() => setGuideStepIndex(s.num)} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", background: `${s.color}04`, border: `1px solid ${s.color}10`, cursor: "pointer" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        ))}
                      </div>
                      </>
                      )}

                      {/* PAGE 1 — 인증 유형 */}
                      {pg === 1 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(ko ? [
                          { type: "벤처투자유형", who: "VC · 액셀러레이터 등 적격 투자기관에서 투자받은 기업", reqs: ["적격 투자기관에서 5,000만원 이상 투자 실적", "자본금 대비 투자 금액 10% 이상"], fast: "가장 빠름 — 투자 실적만 증명하면 됨", color: "#2563eb" },
                          { type: "연구개발유형", who: "기술 R&D에 집중하는 기업 (기업부설연구소 보유)", reqs: ["기업부설연구소 또는 연구개발전담부서 보유", "직전 4분기 R&D비 5,000만원 이상 + 매출의 5~10%", "사업성 평가 우수 판정"], fast: "연구소 필수 — 설립에 2~4주 소요", color: "#7c3aed" },
                          { type: "혁신성장유형", who: "기술성 + 사업성 모두 우수한 고성장 기업", reqs: ["기술성 평가 우수 (기술보증기금 등)", "사업성 평가 우수"], fast: "가장 범용적 — 연구소 없어도 가능", color: "#059669" },
                        ] : [
                          { type: "Investment Type", who: "Companies funded by qualified investors (VC, accelerator)", reqs: ["₩50M+ investment from qualified institutions", "Investment ≥ 10% of capital"], fast: "Fastest — just prove investment", color: "#2563eb" },
                          { type: "R&D Type", who: "Tech companies with R&D labs", reqs: ["Own R&D lab or department", "Last 4Q R&D spend ₩50M+ and 5-10% of revenue", "Business viability assessment pass"], fast: "Lab required — 2-4wk to set up", color: "#7c3aed" },
                          { type: "Innovation Growth", who: "High-growth companies with tech + business excellence", reqs: ["Technology assessment pass (KIBO etc.)", "Business viability assessment pass"], fast: "Most versatile — no lab needed", color: "#059669" },
                        ]).map(t => (
                          <div key={t.type} style={{ borderRadius: "16px", border: `1px solid ${t.color}12`, background: `${t.color}02`, overflow: "hidden" }}>
                            <div style={{ padding: "16px 18px 10px" }}>
                              <div style={{ fontSize: "15px", fontWeight: 700, color: t.color, marginBottom: "4px" }}>{t.type}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>{t.who}</div>
                            </div>
                            <div style={{ padding: "0 18px 12px", display: "grid", gap: "3px" }}>
                              {t.reqs.map(r => (
                                <div key={r} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.45 }}>
                                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: "5px" }} />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ padding: "8px 18px 14px", background: `${t.color}05`, fontSize: "11px", fontWeight: 600, color: t.color }}>
                              {t.fast}
                            </div>
                          </div>
                        ))}
                        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(15,23,42,0.02)", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
                          {ko ? "신청: 벤처확인종합관리시스템(smes.go.kr/venturein). 소요 기간: 최대 45일. 유효기간: 3년 (재인증 필요)." : "Apply: smes.go.kr/venturein. Processing: up to 45 days. Valid: 3 years (renewal required)."}
                        </div>
                      </div>
                      )}

                      {/* PAGE 2 — 혜택 상세 */}
                      {pg === 2 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(ko ? [
                          { title: "법인세 · 소득세 50% 감면", detail: "벤처 인증 후 최초 소득 발생 과세연도부터 5년간 50% 감면. 창업 3년 이내 인증 시 적용.", tag: "5년간", color: "#2563eb" },
                          { title: "취득세 75% 감면", detail: "인증일로부터 4년 이내 사업용 부동산 취득 시 적용. 청년 창업 벤처는 5년.", tag: "부동산", color: "#059669" },
                          { title: "재산세 면제 → 50% 경감", detail: "사업용 부동산: 인증 후 3년간 면제, 이후 2년간 50% 경감.", tag: "5년간", color: "#059669" },
                          { title: "스톡옵션 비과세 연 2억원", detail: "2023년 이후 행사분: 연 2억원, 기업당 누적 5억원까지 비과세. 행사이익 5년 분할 납부 또는 양도 시 일괄 납부 선택 가능.", tag: "핵심", color: "#dc2626" },
                          { title: "개인투자자 소득공제", detail: "벤처 직접 투자 시: 3,000만원 이하 100%, 3,000~5,000만원 70%, 5,000만원 초과 30% 소득공제. 투자 유치에 강력한 인센티브.", tag: "투자 유치", color: "#7c3aed" },
                          { title: "병역특례 · 정책자금 우대", detail: "병역 지정업체 신청 자격, 정책자금 우대 금리, 기술신용보증 우대.", tag: "추가", color: "#d97706" },
                        ] : [
                          { title: "50% Corporate/Income Tax Cut", detail: "5 years from first taxable income after certification. Must certify within 3yr of founding.", tag: "5 years", color: "#2563eb" },
                          { title: "75% Acquisition Tax Cut", detail: "Business real estate acquired within 4yr of certification. 5yr for youth founders.", tag: "Real estate", color: "#059669" },
                          { title: "Property Tax Exemption → 50%", detail: "Business property: 3yr exempt, then 2yr at 50% reduction.", tag: "5 years", color: "#059669" },
                          { title: "Stock Option Tax-Free ₩200M/yr", detail: "Post-2023: ₩200M/yr, ₩500M cumulative per company. 5yr installment or defer to disposal.", tag: "Key", color: "#dc2626" },
                          { title: "Investor Tax Deduction", detail: "Direct investment: 100% for ≤₩30M, 70% for ₩30-50M, 30% for >₩50M income deduction.", tag: "Fundraising", color: "#7c3aed" },
                          { title: "Military Exemption + Policy Funds", detail: "Military service designation eligibility, preferred rates on policy funds.", tag: "Extra", color: "#d97706" },
                        ]).map(b => (
                          <div key={b.title} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "12px", border: `1px solid ${b.color}10`, background: `${b.color}02` }}>
                            <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${b.color}10`, color: b.color, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "2px" }}>{b.tag}</span>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "2px" }}>{b.title}</div>
                              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.45 }}>{b.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      )}

                      {/* PAGE 3 — 정부 지원사업 */}
                      {pg === 3 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "R&D 지원 (TIPS)" : "R&D Support (TIPS)"}</div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { name: "TIPS 일반트랙", amount: "최대 8억원", detail: "R&D 24개월. 149개 운영사가 1~2억 선투자 → 정부 매칭. 2026 접수: 1/26~12/31 상시", color: "#059669", url: "https://www.jointips.or.kr" },
                            { name: "TIPS 딥테크트랙", amount: "최대 15억원", detail: "딥테크 36개월. 12대 신산업분야. 운영사 3억+ 선투자. 2026 접수: 1/26~12/31 상시", color: "#2563eb", url: "https://www.jointips.or.kr" },
                            { name: "TIPS 비R&D 연계", amount: "최대 3억원", detail: "사업화 1.5억 + 해외마케팅 1.5억. TIPS 선정 기업 대상. 총 650억원 규모", color: "#7c3aed", url: "https://www.jointips.or.kr" },
                          ] : [
                            { name: "TIPS General", amount: "Up to ₩800M", detail: "R&D 24mo. 149 operators invest ₩100-200M first → gov match. 2026: Jan 26–Dec 31 rolling", color: "#059669", url: "https://www.jointips.or.kr" },
                            { name: "TIPS Deep Tech", amount: "Up to ₩1.5B", detail: "Deep tech 36mo. 12 industries. Operator invests ₩300M+. 2026: Jan 26–Dec 31 rolling", color: "#2563eb", url: "https://www.jointips.or.kr" },
                            { name: "TIPS Non-R&D", amount: "Up to ₩300M", detail: "Commercialization ₩150M + global marketing ₩150M. For TIPS alumni. ₩65B total", color: "#7c3aed", url: "https://www.jointips.or.kr" },
                          ]).map(p => progCard(p))}
                        </div>

                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginTop: "4px" }}>{ko ? "사업화 지원 패키지" : "Commercialization Packages"}</div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { name: "예비창업패키지 2차", amount: "최대 1억원", detail: "사업자등록 전 예비 창업자. 사업화 자금+멘토링. 접수: ~11/30까지 수시", color: "#2563eb", url: "https://www.k-startup.go.kr" },
                            { name: "AI 바우처", amount: "최대 3억원", detail: "AI 솔루션 도입 비용 70~90% 정부 지원. 2026 수시 모집 (nipa.kr 확인)", color: "#d97706", url: "https://www.nipa.kr" },
                            { name: "데이터바우처", amount: "최대 5천만원", detail: "데이터 구매·가공 비용 지원. 수요기업 수시 모집 (kdata.or.kr)", color: "#7c3aed", url: "https://www.kdata.or.kr" },
                            { name: "창업중심대학", amount: "최대 1억원", detail: "대학 소속 (예비)창업자. 사업화 자금+공간+멘토링. 대학별 수시 모집", color: "#059669", url: "https://www.k-startup.go.kr" },
                          ] : [
                            { name: "Pre-Startup 2nd Round", amount: "Up to ₩100M", detail: "Pre-entrepreneurs. Rolling until Nov 30", color: "#2563eb", url: "https://www.k-startup.go.kr" },
                            { name: "AI Voucher", amount: "Up to ₩300M", detail: "70-90% AI cost covered. 2026 rolling (nipa.kr)", color: "#d97706", url: "https://www.nipa.kr" },
                            { name: "Data Voucher", amount: "Up to ₩50M", detail: "Data purchase/processing. Rolling recruitment", color: "#7c3aed", url: "https://www.kdata.or.kr" },
                            { name: "Startup University", amount: "Up to ₩100M", detail: "University-based founders. Rolling by university", color: "#059669", url: "https://www.k-startup.go.kr" },
                          ]).map(p => progCard(p))}
                        </div>

                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginTop: "4px" }}>{ko ? "창업 경진대회" : "Startup Competitions"}</div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { name: "도전! K-스타트업 2026", amount: "최대 1억원", detail: "국내 최대 규모 경진대회. 예선→본선→왕중왕전. 하반기 접수 예정 (challengek.org)", color: "#2563eb", url: "https://www.challengek.org" },
                            { name: "K-Startup 그랜드챌린지", amount: "상금+비자", detail: "글로벌 스타트업 대상. 한국 시장 진출 지원. 하반기 모집 (연 1회)", color: "#dc2626", url: "https://www.k-startup.go.kr" },
                            { name: "소셜벤처 경연대회", amount: "최대 5천만원", detail: "사회적 가치+비즈니스 모델. 2026 하반기 예정 (sv-hub.co.kr)", color: "#059669", url: "https://www.sv-hub.co.kr" },
                          ] : [
                            { name: "Challenge! K-Startup 2026", amount: "Up to ₩100M", detail: "Korea's largest competition. Applications open H2 (challengek.org)", color: "#2563eb", url: "https://www.challengek.org" },
                            { name: "K-Startup Grand Challenge", amount: "Prize+visa", detail: "Global startups. Korea entry. H2 recruitment (yearly)", color: "#dc2626", url: "https://www.k-startup.go.kr" },
                            { name: "Social Venture Contest", amount: "Up to ₩50M", detail: "Social impact. H2 2026 expected (sv-hub.co.kr)", color: "#059669", url: "https://www.sv-hub.co.kr" },
                          ]).map(p => progCard(p))}
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Franchise Application Guide ── */}
                {(currentStage.code as string) === "franchise_application" && selectedFranchiseBrandId && (() => {
                  const fb = getFranchiseBrandById(selectedFranchiseBrandId);
                  if (!fb) return null;
                  const ko = language === "ko";
                  return (
                    <div style={{ display: "grid", gap: "16px", marginBottom: "20px" }}>
                      {/* Brand header card */}
                      <div style={{
                        borderRadius: "28px",
                        border: "1px solid rgba(255,255,255,0.78)",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
                        boxShadow: "0 12px 28px rgba(17,17,17,0.04)",
                        padding: "24px",
                        display: "grid",
                        gap: "14px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: "18px", fontWeight: 700
                          }}>
                            {fb.name.ko.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>{fb.name[language]}</div>
                            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                              {ko ? "가맹 절차를 단계별로 진행하세요" : "Complete the franchise process step by step"}
                            </div>
                          </div>
                        </div>
                        {fb.franchiseUrl && (
                          <a href={fb.franchiseUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 18px", borderRadius: "999px", background: "var(--primary)", color: "#fff", fontSize: "14px", fontWeight: 600, textDecoration: "none", width: "fit-content" }}>
                            {ko ? `${fb.name.ko} 가맹 상담 바로가기 →` : `${fb.name.en} Franchise Inquiry →`}
                          </a>
                        )}
                        <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", gap: "16px", flexWrap: "wrap" as const }}>
                          <span>{ko ? `창업비용 ${formatFranchiseCost(fb.startupCostWon)}원` : `Startup ${formatFranchiseCost(fb.startupCostWon)}`}</span>
                          <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
                          <span>{ko ? `로열티 ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "만/월" : "없음"}` : `Royalty ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
                        </div>
                      </div>

                      {/* Contract checkpoints */}
                      <div style={{
                        borderRadius: "24px",
                        border: "1px solid rgba(255,255,255,0.78)",
                        background: "rgba(255,255,255,0.86)",
                        boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
                        overflow: "hidden"
                      }}>
                        <div style={{ padding: "18px 22px 14px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                            {ko ? "계약 전 필수 확인 포인트" : "Pre-Contract Must-Check Points"}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                            {ko
                              ? "정보공개서와 계약서에서 아래 항목들을 꼼꼼히 확인하세요. 빨간색은 반드시, 주황색은 중요, 회색은 참고 사항입니다."
                              : "Carefully check these items in the disclosure and contract. Red = must, orange = important, gray = reference."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 18px", display: "grid", gap: "8px" }}>
                          {contractCheckpoints.map((cp) => {
                            const dotColor = cp.riskLevel === "critical" ? "#ff3b30" : cp.riskLevel === "important" ? "#ff9f0a" : "var(--muted)";
                            return (
                              <div key={cp.id} style={{
                                padding: "14px 16px",
                                borderRadius: "14px",
                                border: `1px solid ${cp.riskLevel === "critical" ? "rgba(255,59,48,0.12)" : "var(--border)"}`,
                                background: cp.riskLevel === "critical" ? "rgba(255,59,48,0.03)" : "rgba(255,255,255,0.6)",
                                display: "grid",
                                gap: "4px"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: 8, height: 8, borderRadius: 4, background: dotColor, flexShrink: 0 }} />
                                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{cp.title[language]}</span>
                                </div>
                                <div style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)", paddingLeft: "16px" }}>
                                  {cp.description[language]}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Useful links */}
                      <div style={{
                        borderRadius: "20px",
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.7)",
                        padding: "18px 22px",
                        display: "grid",
                        gap: "10px"
                      }}>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>
                          {ko ? "유용한 링크" : "Useful Links"}
                        </div>
                        {[
                          { label: ko ? "공정거래위원회 정보공개서 조회" : "KFTC Disclosure Lookup", url: "https://franchise.ftc.go.kr" },
                          { label: ko ? "가맹사업법 안내 (생활법령)" : "Franchise Act Guide", url: "https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=647" },
                          { label: ko ? "분쟁조정 신청 (한국프랜차이즈산업협회)" : "Dispute Mediation (KFA)", url: "https://www.ikfa.or.kr/" },
                          { label: ko ? "표준가맹계약서 양식 (공정위)" : "Standard Contract Form (FTC)", url: "https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=203&bbsId=BBSMSTR_000000002321" },
                        ].map((link) => (
                          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)", textDecoration: "none", color: "inherit", fontSize: "13px" }}>
                            <span style={{ fontWeight: 500 }}>{link.label}</span>
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── 프랜차이즈 가맹 일반 가이드 (브랜드 미선택 시) ── */}
                {(currentStage.code as string) === "franchise_application" && !selectedFranchiseBrandId && (() => {
                  const ko = language === "ko";
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 가맹 절차 개요 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(8,145,178,0.1)", background: "linear-gradient(180deg, rgba(8,145,178,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "프랜차이즈 가맹 절차" : "Franchise Application Process"}</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>{ko ? "위에서 브랜드를 선택하면 맞춤 가이드가 표시됩니다. 아래는 일반적인 가맹 절차입니다." : "Select a brand above for a customized guide. Below is the general franchise process."}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px" }}>
                          {(ko ? [
                            { step: "1", title: "가맹 상담 신청", detail: "본사 홈페이지 또는 전화로 상담 예약. 사업 경험·자본금·희망 지역 전달", time: "1~2주" },
                            { step: "2", title: "정보공개서 수령·검토", detail: "가맹본부가 법적 의무로 제공. 가맹점 수·폐업률·영업이익·분쟁 이력 확인", time: "14일 숙려" },
                            { step: "3", title: "기존 가맹점 방문", detail: "정보공개서에 있는 가맹점 3곳 이상 방문. 실제 매출·본사 지원 만족도 질문", time: "1주" },
                            { step: "4", title: "가맹계약 체결", detail: "가맹비·교육비·인테리어비·로열티 조건 확인. 중도 해지 조건 반드시 확인", time: "1일" },
                            { step: "5", title: "본사 교육 이수", detail: "조리법·운영 매뉴얼·POS·위생 교육. 보통 2~4주 소요", time: "2~4주" },
                          ] : [
                            { step: "1", title: "Request consultation", detail: "Via HQ website or phone. Share experience, capital, preferred area", time: "1-2wk" },
                            { step: "2", title: "Review disclosure document", detail: "Legally required. Check store count, closure rate, profit, disputes", time: "14 days" },
                            { step: "3", title: "Visit existing franchisees", detail: "Visit 3+ stores listed in disclosure. Ask about real revenue and HQ support", time: "1wk" },
                            { step: "4", title: "Sign franchise agreement", detail: "Check fees, royalty, interior costs, early termination conditions", time: "1 day" },
                            { step: "5", title: "Complete HQ training", detail: "Recipes, operations, POS, hygiene training. Usually 2-4 weeks", time: "2-4wk" },
                          ]).map(s => (
                            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: s.step !== "5" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0891b2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", marginBottom: "2px" }}>{s.title}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{s.detail}</div>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(8,145,178,0.08)", color: "#0891b2", whiteSpace: "nowrap" as const, flexShrink: 0 }}>{s.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 정보공개서 읽는 법 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "정보공개서 핵심 체크포인트" : "Disclosure Document Key Checks"}</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>{ko ? "계약 전 반드시 확인해야 할 항목입니다. 정보공개서를 꼼꼼히 읽지 않아 분쟁이 발생하는 사례가 매우 많습니다." : "Must-check items before signing. Many disputes arise from not reading the disclosure carefully."}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { severity: "필수", color: "#dc2626", title: "최근 3년 가맹점 개·폐업 수", detail: "폐업률 30% 이상이면 위험 신호. 신규 가맹 대비 폐업 비율 확인" },
                            { severity: "필수", color: "#dc2626", title: "가맹점 평균 영업이익", detail: "본사 제공 수치가 아닌 실제 가맹점에서 확인. 본사 수치와 차이가 크면 주의" },
                            { severity: "필수", color: "#dc2626", title: "가맹비·교육비·보증금 반환 조건", detail: "해지 시 반환 불가 금액과 위약금 확인. 중도 해지 위약금이 총 투자비의 50% 넘으면 주의" },
                            { severity: "주의", color: "#d97706", title: "영업지역 보장 범위", detail: "독점 지역이 있는지, 반경 몇 미터인지, 온라인 판매 포함인지 확인" },
                            { severity: "주의", color: "#d97706", title: "필수 구매 물품 비율", detail: "본사에서만 사야 하는 식자재·소모품 비율. 70% 이상이면 원가 부담 주의" },
                          ] : [
                            { severity: "Must", color: "#dc2626", title: "3-year store open/close count", detail: "30%+ closure rate = danger. Compare new vs closed ratio" },
                            { severity: "Must", color: "#dc2626", title: "Average franchisee profit", detail: "Verify with actual stores, not HQ numbers" },
                            { severity: "Must", color: "#dc2626", title: "Fee/deposit refund conditions", detail: "Check non-refundable amounts and penalty fees" },
                            { severity: "Note", color: "#d97706", title: "Territory protection", detail: "Exclusive zone? Radius? Does it include online?" },
                            { severity: "Note", color: "#d97706", title: "Required purchase ratio", detail: "HQ-only ingredients/supplies ratio. 70%+ = high cost risk" },
                          ]).map(item => (
                            <div key={item.title} style={{ padding: "10px 14px", borderRadius: "12px", border: `1px solid ${item.color}12`, background: `${item.color}03` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 6px", borderRadius: "4px", background: `${item.color}12`, color: item.color }}>{item.severity}</span>
                                <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{item.title}</span>
                              </div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, paddingLeft: "2px" }}>{item.detail}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: "0 22px 16px" }}>
                          <a href="https://franchise.ftc.go.kr" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", borderRadius: "12px", background: "#0891b2", color: "#fff", fontSize: "14px", fontWeight: 650, textDecoration: "none" }}>
                            {ko ? "공정거래위원회 정보공개서 조회" : "FTC Disclosure Lookup"} ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Startup Support Programs (loan_guide stage) ── */}
                {currentStage.code === "loan_guide" && (() => {
                  const ko = language === "ko";
                  // progFilter — hoisted to component top
                  const matched = getMatchedPrograms(startupType);
                  const filtered = progFilter === "all" ? matched : matched.filter(p => p.category === progFilter);
                  const categories: Array<{ id: ProgramCategory | "all"; label: string }> = [
                    { id: "all", label: ko ? "전체" : "All" },
                    { id: "government", label: ko ? "정부" : "Gov" },
                    { id: "private", label: ko ? "민간·재단" : "Private" },
                    { id: "local", label: ko ? "지자체" : "Local" },
                  ];
                  return (
                    <div style={{
                      marginBottom: "18px",
                      borderRadius: "24px",
                      border: "1px solid rgba(255,255,255,0.78)",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
                      boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
                      overflow: "hidden"
                    }}>
                      <div style={{ padding: "18px 22px 14px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                          {ko ? "창업 지원 프로그램" : "Startup Support Programs"}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                          {ko ? "대출, 지원금, 멘토링, 사무공간 등 다양한 프로그램이 있습니다." : "Loans, grants, mentoring, office space and more."}
                        </div>
                        {/* Category filter */}
                        <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
                          {categories.map(cat => {
                            const active = progFilter === cat.id;
                            return (
                              <button key={cat.id} type="button" onClick={() => setProgFilter(cat.id)}
                                style={{ padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: active ? 600 : 500, border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)", background: active ? "rgba(29,53,87,0.06)" : "transparent", color: active ? "var(--primary)" : "var(--muted)", cursor: "pointer" }}>
                                {cat.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                        {filtered.map(prog => {
                          const catColor = getProgramCategoryColor(prog.category);
                          return (
                            <a key={prog.id} href={prog.url} target="_blank" rel="noopener noreferrer" style={{
                              display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "14px",
                              border: "1px solid var(--border)", background: "rgba(255,255,255,0.6)", textDecoration: "none", color: "inherit"
                            }}>
                              <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${catColor}12`, color: catColor, fontSize: "10px", fontWeight: 600, flexShrink: 0, marginTop: "2px", whiteSpace: "nowrap" }}>
                                {getProgramCategoryLabel(prog.category, language)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{prog.name[language]}</div>
                                <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)" }}>{prog.target[language]}</div>
                                {prog.amount && <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", marginTop: "2px" }}>{prog.amount}</div>}
                              </div>
                              <span style={{ fontSize: "13px", color: "var(--primary)", flexShrink: 0, marginTop: "2px" }}>↗</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── K-Startup 라이브 지원사업 (loan_guide stage) ── */}
                {currentStage.code === "loan_guide" && (() => {
                  const ko = language === "ko";

                  // 라이브 데이터 fetch (최초 1회)
                  const loadLivePrograms = async () => {
                    if (liveProgramsData.length > 0 || liveProgramsLoading) return;
                    setLiveProgramsLoading(true);
                    try {
                      const session = await supabase.auth.getSession();
                      const token = session.data.session?.access_token;
                      const keyword = industryCategoryId === "startup-tech" ? "창업" : "소상공인";
                      const res = await fetchLiveSupportPrograms({ keyword, numOfRows: 15 }, token);
                      setLiveProgramsData(res.data.map(p => ({
                        id: p.id,
                        programName: p.programName,
                        organizerName: p.organizerName,
                        supportCategory: p.supportCategory,
                        isOpen: p.isOpen,
                        url: p.url,
                      })));
                    } catch { /* silent */ }
                    setLiveProgramsLoading(false);
                  };

                  // 자동 로드 트리거
                  if (liveProgramsData.length === 0 && !liveProgramsLoading) {
                    void loadLivePrograms();
                  }

                  return liveProgramsData.length > 0 || liveProgramsLoading ? (
                    <div style={{
                      marginBottom: "18px",
                      borderRadius: "24px",
                      border: "1px solid rgba(5,150,105,0.12)",
                      background: "linear-gradient(180deg, rgba(209,250,229,0.15) 0%, rgba(255,255,255,0.9) 100%)",
                      boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: "18px 22px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669", animation: liveProgramsLoading ? "bentoPulse 1.5s infinite" : "none" }} />
                          <span style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
                            {ko ? "실시간 정부 지원사업" : "Live Government Programs"}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                          {ko ? "K-Startup API에서 가져온 현재 공모 중인 프로그램입니다." : "Currently open programs from K-Startup API."}
                        </div>
                      </div>

                      {liveProgramsLoading ? (
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{ padding: "14px", borderRadius: "14px", background: "rgba(0,0,0,0.02)", display: "flex", gap: "12px" }}>
                              <div style={{ width: "60px", height: "14px", borderRadius: "6px", background: "rgba(0,0,0,0.05)" }} />
                              <div style={{ flex: 1, display: "grid", gap: "6px" }}>
                                <div style={{ height: "14px", width: "70%", borderRadius: "6px", background: "rgba(0,0,0,0.05)" }} />
                                <div style={{ height: "12px", width: "50%", borderRadius: "6px", background: "rgba(0,0,0,0.03)" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
                          {liveProgramsData.map(prog => (
                            <a key={prog.id} href={prog.url ?? "#"} target="_blank" rel="noopener noreferrer" style={{
                              display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "14px",
                              border: "1px solid rgba(5,150,105,0.08)", background: "rgba(255,255,255,0.7)", textDecoration: "none", color: "inherit",
                              transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            }}>
                              <div style={{
                                padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, flexShrink: 0, marginTop: "2px", whiteSpace: "nowrap" as const,
                                background: prog.isOpen ? "rgba(5,150,105,0.08)" : "rgba(0,0,0,0.04)",
                                color: prog.isOpen ? "#059669" : "var(--muted)",
                              }}>
                                {prog.isOpen ? (ko ? "공모중" : "Open") : (ko ? "마감" : "Closed")}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{prog.programName}</div>
                                <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)" }}>{prog.organizerName} · {prog.supportCategory}</div>
                              </div>
                              <span style={{ fontSize: "13px", color: "#059669", flexShrink: 0, marginTop: "2px" }}>↗</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* ── Business Plan Generator (loan_guide stage) ── */}
                {currentStage.code === "loan_guide" && (() => {
                  const ko = language === "ko";
                  // bpLoading / bpSections / bpSummary / bpError / bpExpandedIdx — hoisted to component top

                  const generatePlan = async () => {
                    setBpLoading(true);
                    setBpError(null);
                    try {
                      const loc = decisions["location-candidates"];
                      const body = {
                        industry: industryCategoryId,
                        subIndustry: selectedIndustryId ?? "",
                        startupType: startupType ?? "independent",
                        franchiseBrand: selectedFranchiseBrandId ? getFranchiseBrandById(selectedFranchiseBrandId)?.name.ko : undefined,
                        businessModel: selectedBusinessModelId ?? "",
                        capital: selectedBudget ?? 0,
                        targetOpenDate: decisions["budget-setup"]?.inputs?.targetOpenDate ?? "",
                        location: loc?.selectedPrimaryOptionId ?? "",
                        locationScore: loc?.inputs?.score as number | undefined,
                        bepRevenue: savedFinanceSnapshot?.breakEvenRevenue,
                        runway: savedFinanceSnapshot?.survivabilityMonths,
                        riskLevel: savedFinanceSnapshot?.riskLevel,
                        language
                      };
                      const res = await fetch("/api/ai/business-plan/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body)
                      });
                      if (!res.ok) throw new Error(`${res.status}`);
                      const data = await res.json();
                      if (data.error) throw new Error(data.error);
                      setBpSections(data.sections);
                      setBpSummary(data.summary);
                    } catch (err) {
                      setBpError(err instanceof Error ? err.message : "Failed");
                    }
                    setBpLoading(false);
                  };

                  return (
                    <div style={{
                      marginBottom: "18px",
                      borderRadius: "24px",
                      border: "1px solid rgba(29,53,87,0.12)",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(29,53,87,0.03) 100%)",
                      boxShadow: "0 8px 20px rgba(17,17,17,0.04)",
                      overflow: "hidden"
                    }}>
                      <div style={{ padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>
                            📄
                          </div>
                          <div>
                            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                              {ko ? "사업계획서 자동 생성" : "Auto Business Plan"}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {ko ? "Claude Sonnet 4.6 기반 · 입력한 데이터를 활용합니다" : "Powered by Claude Sonnet 4.6 · Uses your roadmap data"}
                            </div>
                          </div>
                        </div>

                        {!bpSections && !bpLoading && (
                          <>
                            <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "14px" }}>
                              {ko
                                ? "지금까지 입력한 업종, 상권, 재무 시뮬레이션 데이터를 기반으로 소진공 정책자금 신청에 적합한 사업계획서를 자동 생성합니다."
                                : "Auto-generates a business plan suitable for SME policy fund applications using your roadmap data."}
                            </div>
                            <button
                              type="button"
                              onClick={generatePlan}
                              style={{
                                width: "100%", padding: "14px", borderRadius: "999px",
                                border: "none", background: "var(--primary)", color: "#fff",
                                fontSize: "15px", fontWeight: 600, cursor: "pointer"
                              }}
                            >
                              {ko ? "사업계획서 생성하기" : "Generate Business Plan"}
                            </button>
                          </>
                        )}

                        {bpLoading && (
                          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: "14px" }}>
                            {ko ? "AI가 사업계획서를 작성 중입니다... (30초~1분)" : "AI is writing your business plan... (30s-1min)"}
                          </div>
                        )}

                        {bpError && (
                          <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.12)", marginTop: "10px" }}>
                            <div style={{ fontSize: "13px", color: "#ff3b30", fontWeight: 600, marginBottom: "4px" }}>
                              {ko ? "생성 실패" : "Generation Failed"}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{bpError}</div>
                            <button type="button" onClick={generatePlan} style={{ marginTop: "8px", padding: "8px 16px", borderRadius: "999px", border: "1px solid var(--border)", background: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                              {ko ? "다시 시도" : "Retry"}
                            </button>
                          </div>
                        )}

                        {bpSections && (
                          <div style={{ marginTop: "10px" }}>
                            {bpSummary && (
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)", marginBottom: "12px", lineHeight: 1.5 }}>{bpSummary}</div>
                            )}
                            <div style={{ display: "grid", gap: "6px" }}>
                              {bpSections.map((sec, idx) => {
                                const expanded = bpExpandedIdx === idx;
                                return (
                                  <div key={idx} style={{ borderRadius: "14px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)", overflow: "hidden" }}>
                                    <button
                                      type="button"
                                      onClick={() => setBpExpandedIdx(expanded ? null : idx)}
                                      style={{
                                        width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        cursor: "pointer", textAlign: "left"
                                      }}
                                    >
                                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{sec.title}</span>
                                      <span style={{ fontSize: "12px", color: "var(--muted)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                                    </button>
                                    {expanded && (
                                      <div style={{ padding: "0 16px 14px", fontSize: "13px", lineHeight: 1.7, color: "var(--muted)", whiteSpace: "pre-line" }}>
                                        {sec.content}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const full = bpSections.map(s => `${s.title}\n\n${s.content}`).join("\n\n---\n\n");
                                navigator.clipboard.writeText(full).catch(() => {});
                              }}
                              style={{
                                marginTop: "12px", width: "100%", padding: "12px",
                                borderRadius: "999px", border: "1px solid var(--primary)",
                                background: "rgba(29,53,87,0.04)", color: "var(--primary)",
                                fontSize: "14px", fontWeight: 600, cursor: "pointer"
                              }}
                            >
                              {ko ? "전체 텍스트 복사하기" : "Copy Full Text"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ── 사업자등록 + 영업허가 절차 가이드 (registration_setup) ── */}
                {currentStage.code === "registration_setup" && (() => {
                  const ko = language === "ko";
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
                      {/* 사업자등록 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.1)", background: "linear-gradient(180deg, rgba(37,99,235,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 650, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 1</div>
                              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "사업자등록" : "Business Registration"}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
                            {ko ? "세무서 또는 홈택스에서 사업자등록증을 발급받아야 합니다. 매장 임대차계약 완료 후 진행하세요." : "Get your business registration certificate from the tax office or Hometax. Proceed after signing your lease."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", marginBottom: "10px" }}>
                            <div>
                              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{ko ? "신청 장소" : "Where"}</div>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 세무서 또는 홈택스" : "Tax office or Hometax"}</div>
                            </div>
                            <a href="https://www.hometax.go.kr" target="_blank" rel="noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "#2563eb", color: "#fff", fontSize: "12px", fontWeight: 650, textDecoration: "none" }}>
                              {ko ? "홈택스" : "Hometax"} ↗
                            </a>
                          </div>
                          {(ko ? [
                            { step: "홈택스 접속 → 사업자등록 신청", detail: "공동인증서 로그인 필요. 없으면 세무서 방문" },
                            { step: "업종코드 입력 (업종별 코드 확인)", detail: "음식: 522111, 카페: 522220, 미용: 961101 등" },
                            { step: "사업장 주소 = 임대차계약서 주소", detail: "계약서 사본 첨부 필수" },
                            { step: "과세유형 선택 (간이/일반)", detail: "매출 8,000만원 이하 예상 시 간이과세 추천" },
                            { step: "제출 → 즉일~3영업일 발급", detail: "등록증 수령 후 사업용 통장 개설" },
                          ] : [
                            { step: "Log into Hometax → Apply", detail: "Certificate login required" },
                            { step: "Enter industry code", detail: "Food: 522111, Cafe: 522220, Beauty: 961101" },
                            { step: "Business address = lease address", detail: "Attach lease copy" },
                            { step: "Choose tax type (simplified/standard)", detail: "Simplified if expected revenue under 80M" },
                            { step: "Submit → Issued in 0-3 days", detail: "Open business account after" },
                          ]).map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: "0 22px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(5,150,105,0.04)", textAlign: "center" as const }}>
                            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "비용" : "Cost"}</div>
                            <div style={{ fontSize: "16px", fontWeight: 740, color: "#059669" }}>{ko ? "무료" : "Free"}</div>
                          </div>
                          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(37,99,235,0.04)", textAlign: "center" as const }}>
                            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
                            <div style={{ fontSize: "16px", fontWeight: 740, color: "#2563eb" }}>1~3{ko ? "일" : "d"}</div>
                          </div>
                        </div>
                      </div>

                      {/* 영업허가/신고 실행 */}
                      <div style={{ borderRadius: "16px", border: "1px solid rgba(234,88,12,0.1)", background: "linear-gradient(180deg, rgba(234,88,12,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(234,88,12,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 650, color: "#ea580c", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 2</div>
                              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "영업허가 · 신고" : "Business Permit Filing"}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
                            {ko ? "사업자등록 완료 후, 업종에 맞는 영업허가 또는 영업신고를 관할 구청에 접수합니다." : "After business registration, file the appropriate permit or notification at your district office."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "12px", background: "rgba(234,88,12,0.04)", marginBottom: "10px" }}>
                            <div>
                              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{ko ? "신청 장소" : "Where"}</div>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 구청 위생과 또는 정부24" : "District Office or Gov24"}</div>
                            </div>
                            <a href="https://www.gov.kr" target="_blank" rel="noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "#ea580c", color: "#fff", fontSize: "12px", fontWeight: 650, textDecoration: "none" }}>
                              {ko ? "정부24" : "Gov24"} ↗
                            </a>
                          </div>
                          {(ko ? [
                            { step: "위생교육 이수 완료 확인", detail: "음식점: 한국외식업중앙회 / 카페: 한국휴게음식업중앙회 온라인 교육 (26,000원)" },
                            { step: "건강진단결과서(보건증) 발급", detail: "관할 보건소 방문. 약 12,000원. 유효기간 1년" },
                            { step: "영업신고서 작성 + 서류 첨부", detail: "위생교육 수료증 + 보건증 + 임대차계약서 + 평면도" },
                            { step: "구청 위생과 접수 또는 정부24 온라인", detail: "현장 점검 후 영업신고증 발급 (7~14일)" },
                          ] : [
                            { step: "Confirm hygiene training completed", detail: "Restaurant: KFIA / Cafe: KCRA online course (₩26K)" },
                            { step: "Get health certificate", detail: "Visit local health center. ~₩12K. Valid 1 year" },
                            { step: "Fill business report + attach docs", detail: "Training cert + health cert + lease + floor plan" },
                            { step: "Submit to district office or Gov24", detail: "On-site inspection → certificate issued (7-14 days)" },
                          ]).map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ea580c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: "0 22px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(234,88,12,0.04)", textAlign: "center" as const }}>
                            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "비용" : "Cost"}</div>
                            <div style={{ fontSize: "16px", fontWeight: 740, color: "#ea580c" }}>~{ko ? "6.6만원" : "₩66K"}</div>
                          </div>
                          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(234,88,12,0.04)", textAlign: "center" as const }}>
                            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
                            <div style={{ fontSize: "16px", fontWeight: 740, color: "#ea580c" }}>7~14{ko ? "일" : "d"}</div>
                          </div>
                        </div>
                        <div style={{ margin: "0 22px 16px", padding: "10px 14px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
                          <div style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.5 }}>
                            {ko ? "⚠ 주방과 객석이 벽·칸막이로 구분되어야 합니다. 건물 용도가 '근린생활시설'인지 사전 확인 필수!" : "⚠ Kitchen and dining must be separated. Verify building use is 'neighborhood facility'!"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 보험·세무 세팅 종합 가이드 (insurance_tax_setup) — 페이지네이션 ── */}
                {currentStage.code === "insurance_tax_setup" && (() => {
                  const ko = language === "ko";
                  const totalPages = 3;
                  const page = insuranceTaxPage;
                  // 업종별 산재보험 요율 (2025~2026 기준)
                  const accidentRateMap: Record<string, { rate: string; category: string }> = {
                    "food": { rate: "0.8%", category: "도소매·음식·숙박업" },
                    "cafe-dessert": { rate: "0.8%", category: "도소매·음식·숙박업" },
                    "retail": { rate: "0.8%", category: "도소매·음식·숙박업" },
                    "beauty": { rate: "0.6%", category: "전문·보건·교육·여가 서비스업" },
                    "fitness": { rate: "0.6%", category: "전문·보건·교육·여가 서비스업" },
                    "education": { rate: "0.6%", category: "전문·보건·교육·여가 서비스업" },
                    "pet": { rate: "0.8%", category: "도소매·음식·숙박업" },
                    "space": { rate: "0.8%", category: "도소매·음식·숙박업" },
                    "living-service": { rate: "0.7%", category: "기타 서비스업" },
                  };
                  const accidentInfo = accidentRateMap[industryCategoryId] ?? { rate: "0.7%", category: "일반 서비스업" };

                  // SF Symbol 스타일 아이콘 컴포넌트
                  const SFIcon = ({ children, bg }: { children: React.ReactNode; bg: string }) => (
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {children}
                    </div>
                  );

                  const pageLabels = [
                    ko ? "4대보험 가입" : "Insurance",
                    ko ? "원천세 설정" : "Withholding",
                    ko ? "급여 방식" : "Payroll",
                  ];

                  return (
                    <div style={{ marginBottom: "14px" }} className="bento-fade-in">
                      {/* ── 페이지 인디케이터 + 탭 ── */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.45)" }}>
                          {page + 1} / {totalPages}
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {pageLabels.map((label, i) => (
                            <button key={i} type="button" onClick={() => setInsuranceTaxPage(i)} style={{
                              padding: "5px 12px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              background: page === i ? "#0561fc" : "rgba(5,97,252,0.06)",
                              color: page === i ? "#fff" : "rgba(15,23,42,0.5)",
                              transition: "all 0.2s ease",
                            }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── PAGE 0: 4대보험 ── */}
                      {page === 0 && (
                      <div style={{ borderRadius: "16px", border: "1px solid rgba(5,97,252,0.06)", background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,244,255,0.5) 100%)", boxShadow: "0 21px 94px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <SFIcon bg="rgba(5,97,252,0.08)">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0561fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                            </SFIcon>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 650, color: "#0561fc", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 1</div>
                              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "4대보험 가입 신고" : "4 Major Insurance Registration"}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
                            {ko ? "직원 채용일로부터 14일 이내에 4대사회보험 정보연계센터에서 통합 신고해야 합니다." : "Register within 14 days of hiring at the 4 Social Insurance Portal."}
                          </div>
                        </div>

                        {/* 요율표 */}
                        <div style={{ padding: "0 22px 14px" }}>
                          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(5,97,252,0.06)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "rgba(5,97,252,0.04)", padding: "8px 12px", fontSize: "10px", fontWeight: 650, color: "rgba(15,23,42,0.45)", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                              <span>{ko ? "보험 종류" : "Insurance"}</span>
                              <span style={{ textAlign: "right" as const }}>{ko ? "사업주 부담" : "Employer"}</span>
                              <span style={{ textAlign: "right" as const }}>{ko ? "근로자 부담" : "Employee"}</span>
                            </div>
                            {[
                              { name: ko ? "국민연금" : "Pension", emp: "4.75%", ee: "4.75%", note: ko ? "2026년 인상 (기존 4.5%)" : "2026 increase (was 4.5%)" },
                              { name: ko ? "건강보험" : "Health", emp: "3.595%", ee: "3.595%", note: ko ? "장기요양보험 별도" : "Long-term care extra" },
                              { name: ko ? "고용보험" : "Employment", emp: "0.9%+α", ee: "0.9%", note: ko ? "α=고용안정사업(규모별)" : "α=stability fund (by size)" },
                              { name: ko ? "산재보험" : "Accident", emp: accidentInfo.rate, ee: "0%", note: ko ? accidentInfo.category : "Industry-specific" },
                            ].map((row, i) => (
                              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "10px 12px", borderTop: "1px solid rgba(5,97,252,0.04)", fontSize: "13px" }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.name}</div>
                                  <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>{row.note}</div>
                                </div>
                                <div style={{ textAlign: "right" as const, fontWeight: 650, color: "#dc2626" }}>{row.emp}</div>
                                <div style={{ textAlign: "right" as const, color: "rgba(15,23,42,0.5)" }}>{row.ee}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 신고 절차 */}
                        <div style={{ padding: "0 22px 14px" }}>
                          {(ko ? [
                            { step: "4대사회보험 정보연계센터 회원가입", detail: "사업자등록번호 + 공동인증서 필요" },
                            { step: "사업장 성립신고 (최초 1회)", detail: "사업 개시일·업종·근로자 수 입력" },
                            { step: "근로자 취득신고 (직원당)", detail: "입사일·보수월액·주민번호 입력" },
                          ] : [
                            { step: "Register at 4insure.or.kr", detail: "Business reg number + certificate needed" },
                            { step: "Business establishment report (once)", detail: "Start date, industry, worker count" },
                            { step: "Worker acquisition report (per employee)", detail: "Start date, monthly salary, ID" },
                          ]).map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#0561fc", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ margin: "0 22px 16px", display: "flex", gap: "8px" }}>
                          <a href="https://www.4insure.or.kr" target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "#0561fc", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 14px rgba(5,97,252,0.25)" }}>
                            {ko ? "4대보험 정보연계센터 →" : "4insure.or.kr →"}
                          </a>
                        </div>
                      </div>
                      )}

                      {/* ── PAGE 1: 원천세 설정 ── */}
                      {page === 1 && (
                      <div style={{ borderRadius: "16px", border: "1px solid rgba(234,88,12,0.08)", background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,249,240,0.5) 100%)", boxShadow: "0 21px 94px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <SFIcon bg="rgba(234,88,12,0.08)">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                            </SFIcon>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 650, color: "#ea580c", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 2</div>
                              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "원천세 설정" : "Withholding Tax Setup"}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
                            {ko ? "매월 급여 지급 시 근로소득 간이세액표에 따라 소득세를 원천징수하고, 다음 달 10일까지 홈택스에 신고·납부합니다." : "Withhold income tax per simplified tax table each payday. Report and pay via Hometax by the 10th of next month."}
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 14px" }}>
                          {(ko ? [
                            { step: "홈택스에서 간이세액표 조회", detail: "급여액 입력 → 원천징수 세액 자동 산출. 부양가족 수에 따라 차등" },
                            { step: "매월 급여일에 원천징수", detail: "급여에서 소득세 + 지방소득세(소득세의 10%) 공제 후 지급" },
                            { step: "다음 달 10일까지 홈택스 신고·납부", detail: "반기 납부 신청 시 7월·1월 연 2회로 간소화 가능 (상시근로자 20인 이하)" },
                          ] : [
                            { step: "Check simplified tax table on Hometax", detail: "Enter salary → auto-calculate withholding. Varies by dependents" },
                            { step: "Withhold on each payday", detail: "Deduct income tax + local tax (10% of income tax) from salary" },
                            { step: "Report by 10th of next month via Hometax", detail: "Semi-annual reporting available for ≤20 employees" },
                          ]).map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ea580c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: "0 22px 16px", display: "flex", gap: "8px" }}>
                          <a href="https://www.hometax.go.kr" target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "#ea580c", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 14px rgba(234,88,12,0.25)" }}>
                            {ko ? "홈택스 간이세액표 →" : "Hometax Tax Table →"}
                          </a>
                        </div>
                      </div>
                      )}

                      {/* ── PAGE 2: 급여 지급 방식 결정 ── */}
                      {page === 2 && (
                      <div style={{ borderRadius: "16px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,255,244,0.5) 100%)", boxShadow: "0 21px 94px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <SFIcon bg="rgba(5,150,105,0.08)">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
                            </SFIcon>
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 650, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 3</div>
                              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "급여 지급 방식 결정" : "Choose Payroll Method"}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
                          {(ko ? [
                            { icon: "📊", title: "수기 관리 (엑셀)", desc: "직원 1~2명 시 가능. 예스폼 급여대장 양식 활용. 4대보험·세금 직접 계산.", cost: "무료", fit: "1~2명" },
                            { icon: "🧑‍💼", title: "세무사 위임", desc: "월 수임료 10~30만원. 급여·4대보험·원천세 전부 대행. 가장 안전한 방법.", cost: "월 10~30만원", fit: "전 규모" },
                            { icon: "💻", title: "급여 SaaS (flex, 알밤 등)", desc: "자동 급여 계산+명세서 발송+4대보험 연동. 직원 수 기반 과금.", cost: "월 0~5만원", fit: "3명+" },
                          ] : [
                            { icon: "📊", title: "Manual (Excel)", desc: "Viable for 1-2 employees. Use payroll templates. Calculate insurance/tax manually.", cost: "Free", fit: "1-2 staff" },
                            { icon: "🧑‍💼", title: "Tax Advisor", desc: "10-30K/mo. Full payroll, insurance, tax handling. Safest option.", cost: "₩10-30K/mo", fit: "All sizes" },
                            { icon: "💻", title: "Payroll SaaS (flex, Albam)", desc: "Auto payroll + payslip + insurance sync. Per-employee pricing.", cost: "₩0-50K/mo", fit: "3+ staff" },
                          ]).map((item, i) => (
                            <div key={i} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(5,150,105,0.06)", background: "rgba(5,150,105,0.02)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                                <span style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>{item.title}</span>
                              </div>
                              <div style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(15,23,42,0.55)", marginBottom: "6px", paddingLeft: "26px" }}>{item.desc}</div>
                              <div style={{ display: "flex", gap: "8px", paddingLeft: "26px" }}>
                                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(5,150,105,0.08)", color: "#059669", fontWeight: 600 }}>{item.cost}</span>
                                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(15,23,42,0.04)", color: "rgba(15,23,42,0.5)", fontWeight: 600 }}>{ko ? "적합" : "Fit"}: {item.fit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}

                      {/* ── 두루누리 지원 안내 (page 0에서만) ── */}
                      {page === 0 && (
                      <div style={{ borderRadius: "12px", padding: "14px 16px", background: "rgba(5,97,252,0.04)", border: "1px solid rgba(5,97,252,0.08)", marginTop: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 650, color: "#0561fc", marginBottom: "4px" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0561fc" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                          {ko ? "두루누리 사회보험료 지원 (10인 미만 사업장)" : "Durunuri Insurance Support (Under 10 employees)"}
                        </div>
                        <div style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(15,23,42,0.55)" }}>
                          {ko
                            ? "월 보수 270만원 미만 신규 가입자의 고용보험·국민연금 보험료 80%를 국가가 최대 36개월 지원합니다. 4대보험 신고 시 '두루누리 지원' 체크만 하면 자동 적용됩니다."
                            : "Government covers 80% of employment + pension insurance for new enrollees earning under 2.7M/mo. Up to 36 months. Just check 'Durunuri support' when filing."}
                        </div>
                        <a href="https://insurancesupport.or.kr" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "6px", fontSize: "12px", fontWeight: 600, color: "#0561fc", textDecoration: "none" }}>
                          {ko ? "두루누리 지원 확인 →" : "Check Durunuri eligibility →"}
                        </a>
                      </div>
                      )}

                      {/* ── 주의사항 (page 0에서만) ── */}
                      {page === 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                        <div style={{ borderRadius: "12px", padding: "12px 14px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ marginTop: "1px", flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
                          <div style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.6 }}>
                            {ko ? "5인 미만 사업장도 4대보험 신고 의무. 1인 고용이라도 미신고 시 가산세 + 소급 납부." : "Even under 5 employees must register. Late filing = penalties + back-payment."}
                          </div>
                        </div>
                        <div style={{ borderRadius: "12px", padding: "12px 14px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ marginTop: "1px", flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
                          <div style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.6 }}>
                            {ko ? "현금 급여 후 미신고는 세무조사 리스크. 국세청 카드 매출 분석(PCI)으로 추적 가능." : "Unreported cash salary = audit risk. NTS tracks via card sales analysis."}
                          </div>
                        </div>
                      </div>
                      )}

                      {/* ── 페이지 네비게이션 ── */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0" }}>
                        <button type="button" disabled={page === 0} onClick={() => setInsuranceTaxPage(p => p - 1)} style={{
                          padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.1)",
                          background: page === 0 ? "rgba(0,0,0,0.02)" : "white",
                          color: page === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: page === 0 ? "default" : "pointer",
                        }}>
                          ← {ko ? "이전" : "Prev"}
                        </button>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} onClick={() => setInsuranceTaxPage(i)} style={{
                              width: i === page ? "20px" : "8px", height: "8px", borderRadius: "100px",
                              background: i === page ? "#0561fc" : "rgba(0,0,0,0.1)",
                              cursor: "pointer", transition: "all 0.2s ease",
                            }} />
                          ))}
                        </div>
                        <button type="button" disabled={page === totalPages - 1} onClick={() => setInsuranceTaxPage(p => p + 1)} style={{
                          padding: "10px 18px", borderRadius: "10px", border: "none",
                          background: page === totalPages - 1 ? "rgba(0,0,0,0.02)" : "#0561fc",
                          color: page === totalPages - 1 ? "rgba(0,0,0,0.2)" : "#fff",
                          fontSize: "13px", fontWeight: 600, cursor: page === totalPages - 1 ? "default" : "pointer",
                          boxShadow: page === totalPages - 1 ? "none" : "0 4px 14px rgba(5,97,252,0.25)",
                        }}>
                          {ko ? "다음" : "Next"} →
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Franchise Supply Structure (vendor_setup only) ── */}
                {currentStage.code === "vendor_setup" && startupType === "franchise" && selectedFranchiseBrandId && (() => {
                  const fb = getFranchiseBrandById(selectedFranchiseBrandId);
                  if (!fb) return null;
                  const ko = language === "ko";
                  const supplyItems = getFranchiseSupplyInfo(fb);
                  const grouped: Record<SupplyType, typeof supplyItems> = {
                    "hq-exclusive": supplyItems.filter(s => s.type === "hq-exclusive"),
                    "hq-designated": supplyItems.filter(s => s.type === "hq-designated"),
                    "free-purchase": supplyItems.filter(s => s.type === "free-purchase")
                  };
                  return (
                    <div style={{
                      marginBottom: "18px",
                      borderRadius: "24px",
                      border: "1px solid rgba(255,255,255,0.78)",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
                      boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
                      overflow: "hidden"
                    }}>
                      <div style={{ padding: "18px 22px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700 }}>
                            {fb.name.ko.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
                              {ko ? `${fb.name.ko} 공급 구조` : `${fb.name.en} Supply Structure`}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {ko ? "본사 공급 vs 자유 구매 항목 안내" : "HQ supply vs free purchase guide"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {(["hq-exclusive", "hq-designated", "free-purchase"] as SupplyType[]).map((type) => {
                        const group = grouped[type];
                        if (group.length === 0) return null;
                        const color = getSupplyTypeColor(type);
                        return (
                          <div key={type} style={{ padding: "0 22px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                              <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
                              <span style={{ fontSize: "13px", fontWeight: 600, color }}>{getSupplyTypeLabel(type, language)}</span>
                            </div>
                            {group.map((item, idx) => (
                              <div key={idx} style={{ padding: "8px 12px", borderRadius: "12px", background: `${color}06`, border: `1px solid ${color}15`, marginBottom: "6px" }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>{item.category[language]}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                                  {item.items.map(i => i[language]).join(" · ")}
                                </div>
                                {item.note && <div style={{ fontSize: "11px", color, marginTop: "3px" }}>{item.note[language]}</div>}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      <div style={{ padding: "10px 22px 16px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
                        {ko
                          ? "※ 자유 구매 항목만 아래 공급업체 가이드에서 직접 선택할 수 있습니다."
                          : "※ Only free-purchase items can be selected from the supplier guide below."}
                      </div>
                    </div>
                  );
                })()}

                {stageGuideContent && currentStage.code !== "pre_launch" && currentStage.code !== "operations_setup" && currentStage.code !== "hiring_setup" && currentStage.code !== "platform_setup" && currentStage.code !== "online_registration" && (currentStage.code as string) !== "franchise_application" && currentStage.code !== "fundraising_readiness" && currentStage.code !== "registration_setup" && currentStage.code !== "insurance_tax_setup" && (() => {
                  const steps = stageGuideContent.steps;
                  const totalSlides = 1 + steps.length;
                  const isOverview = guideStepIndex === 0;
                  const currentStep = isOverview ? null : steps[guideStepIndex - 1];

                  const vendorEl: React.ReactNode = currentStage.code !== "vendor_setup" || guideStepIndex === 0 ? null : (() => {
                  type SupplierItem = { name: string; desc: string; tier: "premium" | "standard" | "budget" };
                  type SupplyCategory = { icon: LucideIcon; label: string; items: SupplierItem[] };
                  const step3Supplies: SupplyCategory[] = [
                    { icon: Cpu, label: language === "ko" ? "세금계산서·경비 관리 도구" : "Invoice & Expense Tools", items: [
                      { name: "홈택스(Hometax)", desc: "국세청 공식 전자 세금계산서 발행 · 무료", tier: "budget" },
                      { name: "비즈플레이(Bizplay)", desc: "세금계산서 + 경비·카드 지출 통합 관리", tier: "standard" },
                      { name: "캐시노트(CashNote)", desc: "소상공인 매출·경비 자동 분류 무료 앱", tier: "budget" },
                    ]},
                  ];
                  const step4Supplies: SupplyCategory[] = [
                    { icon: Package, label: language === "ko" ? "B2B 발주 플랫폼" : "B2B Order Platforms", items: [
                      { name: "마켓컬리 비즈(Kurly Biz)", desc: "식품·소모품 새벽배송 B2B · 소규모 최적", tier: "standard" },
                      { name: "쿠팡 비즈니스", desc: "다품목 발주·로켓배송 · 최저가 비교 가능", tier: "standard" },
                      { name: "aT 한국농수산식품유통공사", desc: "공공 식품 원자재 B2B 조달 포털", tier: "standard" },
                    ]},
                  ];
                  const stepDataMap: Record<string, { [step: number]: SupplyCategory[] }> = {
                    "cafe-dessert": {
                      1: [
                        { icon: Coffee, label: language === "ko" ? "원두 공급처" : "Coffee Beans",
                          items: [
                            { name: "커피빈코리아 B2B", desc: "납품 점유율 국내 1위 · 에스프레소·드립 통합 공급", tier: "standard" },
                            { name: "빈브라더스", desc: "스페셜티 원두 전문 · 서울 트렌디 카페 선호", tier: "premium" },
                            { name: "테라로사", desc: "스페셜티 선구자 · 대용량 B2B · 프리미엄 포지셔닝", tier: "premium" },
                          ],
                        },
                        { icon: Droplets, label: language === "ko" ? "시럽·소스" : "Syrups & Sauces",
                          items: [
                            { name: "모닌(Monin)", desc: "150종+ SKU · 전 세계 카페 기준 시럽", tier: "standard" },
                            { name: "1883 루아(Routin)", desc: "프랑스산 고급 시럽 · 고가 카페 포지셔닝", tier: "premium" },
                            { name: "토라니(Torani)", desc: "가성비 최고 · 대중 시럽 시장 강세", tier: "budget" },
                          ],
                        },
                        { icon: Waves, label: language === "ko" ? "유제품·대체유" : "Dairy & Alternatives",
                          items: [
                            { name: "서울우유 업소용", desc: "국내 점유율 1위 · 안정적 납품 · 월납 계좌이체", tier: "standard" },
                            { name: "매일유업 바리스타", desc: "스팀 발포 최적화 전용 우유", tier: "standard" },
                            { name: "오틀리(Oatly)", desc: "대체유 국내 1위 · 비건 수요 필수 대응", tier: "standard" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Package, label: language === "ko" ? "포장재" : "Packaging",
                          items: [
                            { name: "하나팩", desc: "종이컵·테이크아웃박스 국내 최대 유통", tier: "standard" },
                            { name: "현진팩", desc: "친환경 FSC 포장재 전문 · 2025 트렌드 대응", tier: "standard" },
                            { name: "페이퍼갱", desc: "개성 있는 포장 디자인 · 소량 주문 가능", tier: "standard" },
                          ],
                        },
                        { icon: Droplets, label: language === "ko" ? "위생·청소 소모품" : "Hygiene & Cleaning",
                          items: [
                            { name: "아성다이소 기업구매", desc: "위생 소모품 최저가 · 오프라인·온라인 통합", tier: "budget" },
                            { name: "유한킴벌리 B2B", desc: "키친타올·위생장갑 업소용 대용량 공급", tier: "standard" },
                            { name: "3M 업소용", desc: "수세미·청소용품 전문 · 내구성 업계 최고", tier: "standard" },
                          ],
                        },
                      ],
                    },
                    "food": {
                      1: [
                        { icon: Leaf, label: language === "ko" ? "신선 식재료" : "Fresh Ingredients",
                          items: [
                            { name: "CJ프레시웨이", desc: "식자재 유통 국내 1위 · 중소 음식점 B2B 가능", tier: "standard" },
                            { name: "마켓컬리 비즈", desc: "소규모 식당 최적 · 새벽배송 · 신선도 최고", tier: "standard" },
                            { name: "아워홈 식자재", desc: "전국 물류망 · 냉동·냉장 통합 공급", tier: "standard" },
                          ],
                        },
                        { icon: Flame, label: language === "ko" ? "양념·소스" : "Seasonings & Sauces",
                          items: [
                            { name: "대상 청정원 업소용", desc: "소스 국내 1위 · B2B 전용 대용량 라인", tier: "standard" },
                            { name: "샘표 기업용", desc: "간장·된장 원조 · 전통 발효 소스 라인업", tier: "standard" },
                            { name: "오뚜기 업소용", desc: "마요네즈·케첩·드레싱 압도적 점유율", tier: "budget" },
                          ],
                        },
                        { icon: Layers, label: language === "ko" ? "건식재료·곡물" : "Dry Goods & Grains",
                          items: [
                            { name: "대한제분(곰표)", desc: "대용량 밀가루 · 전국 배송 · B2B 전용 포장", tier: "budget" },
                            { name: "농협 직거래", desc: "산지 직납 프리미엄 쌀·잡곡 · 이천·진상 등", tier: "standard" },
                            { name: "CJ제일제당 B2B", desc: "설탕·전분·쌀가루 등 건식 소재 통합 소싱", tier: "standard" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Package, label: language === "ko" ? "배달 포장재" : "Delivery Packaging",
                          items: [
                            { name: "하나팩", desc: "배달 용기·봉투 국내 최대 유통", tier: "standard" },
                            { name: "원팩(Wonpak)", desc: "1회용 용기·포장 전문 · 배달 전용 라인 강점", tier: "standard" },
                            { name: "현진팩", desc: "친환경 배달 포장재 · 소량 주문 가능", tier: "standard" },
                          ],
                        },
                        { icon: Shield, label: language === "ko" ? "주방 위생 소모품" : "Kitchen Hygiene",
                          items: [
                            { name: "유한킴벌리 B2B", desc: "행주·장갑·주방 위생 업소용 대용량", tier: "standard" },
                            { name: "아성다이소 기업구매", desc: "소모품 비용 최적화 · 다양한 품목 일괄 조달", tier: "budget" },
                            { name: "유한양행 업소용", desc: "주방 세정·살균 전문 · HACCP 대응 가능", tier: "standard" },
                          ],
                        },
                      ],
                    },
                    "beauty": {
                      1: [
                        { icon: Sparkles, label: language === "ko" ? "헤어 시술 약품" : "Hair Treatment Products",
                          items: [
                            { name: "아모레퍼시픽 프로(에이모스)", desc: "미용실 납품 국내 1위 · A/S·교육 지원 최대", tier: "standard" },
                            { name: "로레알 프로(케라스타즈·레드켄)", desc: "글로벌 헤어 1위 · 프리미엄 포지셔닝 필수", tier: "premium" },
                            { name: "웰라 코리아(Wella)", desc: "컬러 약품 글로벌 1위 · 중고가 균형 제품군", tier: "standard" },
                          ],
                        },
                        { icon: Zap, label: language === "ko" ? "전문 도구·기기" : "Professional Tools",
                          items: [
                            { name: "파나소닉 업소용", desc: "드라이어 국내 점유율 1위 · 긴 A/S 보증", tier: "standard" },
                            { name: "다이슨 프로(Dyson Pro)", desc: "2025 트렌드 선두 · SNS 노출 효과 탁월", tier: "premium" },
                            { name: "GHD 코리아", desc: "아이론·드라이어 프리미엄 전문 · 살롱 브랜딩 강화", tier: "premium" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Scissors, label: language === "ko" ? "소모품·부자재" : "Consumables & Supplies",
                          items: [
                            { name: "지에이치 전문부자재", desc: "국내 미용 소모품 최대 유통 · 알파미 계열", tier: "budget" },
                            { name: "리갈(Regal)", desc: "케이프·포일·장갑 전문 · 대량 구매 할인", tier: "budget" },
                            { name: "코스모프로페셔널", desc: "미용 소모품 B2B 플랫폼 · 통합 관리", tier: "standard" },
                          ],
                        },
                        { icon: Shield, label: language === "ko" ? "위생·살균 소모품" : "Hygiene & Sterilization",
                          items: [
                            { name: "유한킴벌리 업소용", desc: "타올·위생 소모품 업소 대용량 · 정기배송", tier: "standard" },
                            { name: "보령헬스케어", desc: "미용업 전용 소독제·살균제 · 피부과 수준 제품", tier: "premium" },
                            { name: "아성다이소 기업구매", desc: "소독 소모품 최저가 · 다품목 일괄 조달", tier: "budget" },
                          ],
                        },
                      ],
                    },
                    "fitness": {
                      1: [
                        { icon: Dumbbell, label: language === "ko" ? "운동 장비" : "Exercise Equipment",
                          items: [
                            { name: "라이프피트니스(Life Fitness)", desc: "글로벌 1위 · 국내 대형 헬스장 표준 브랜드", tier: "premium" },
                            { name: "테크노짐(Technogym)", desc: "이탈리아 명품 장비 · 강남 프리미엄 PT샵 선호", tier: "premium" },
                            { name: "오딘피트니스", desc: "국내 가성비 1위 · 소규모 헬스장·스튜디오 최적", tier: "budget" },
                          ],
                        },
                        { icon: Heart, label: language === "ko" ? "스튜디오 소도구" : "Studio Equipment",
                          items: [
                            { name: "발렉스(Valeo)", desc: "요가·필라테스 소도구 글로벌 표준 브랜드", tier: "standard" },
                            { name: "리복 프로(Reebok Pro)", desc: "스튜디오 전용 소도구 전문 라인", tier: "standard" },
                            { name: "하펜 스포츠", desc: "국내 필라테스 기구 전문 유통", tier: "budget" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Box, label: language === "ko" ? "운영 소모품" : "Operations & Consumables",
                          items: [
                            { name: "케이진 스포츠", desc: "타월·운동 소모품 B2B 전문", tier: "budget" },
                            { name: "유한킴벌리 업소용", desc: "타올·위생 소모품 업소 대용량 · 정기배송", tier: "standard" },
                            { name: "마이단백질(MyProtein) B2B", desc: "보충제 리셀 아이템 · 추가 수익원 확보", tier: "standard" },
                          ],
                        },
                        { icon: Shield, label: language === "ko" ? "위생·청소 용품" : "Hygiene & Cleaning",
                          items: [
                            { name: "3M 업소용", desc: "소독·청소용품 전문 · 내구성 업계 최고", tier: "standard" },
                            { name: "쿠팡 비즈", desc: "소독·위생 소모품 최저가 통합", tier: "budget" },
                            { name: "아성다이소 기업구매", desc: "소모품 비용 최적화 · 다양한 품목 일괄 조달", tier: "budget" },
                          ],
                        },
                      ],
                    },
                    "education": {
                      1: [
                        { icon: BookOpen, label: language === "ko" ? "교재·학습 자료" : "Textbooks & Materials",
                          items: [
                            { name: "천재교육 B2B", desc: "국내 최대 교재 출판 · 학원 직납 서비스", tier: "standard" },
                            { name: "비상교육", desc: "교과서·문제집 전문 · 강사용 교재 직납 가능", tier: "standard" },
                            { name: "메가스터디 교육", desc: "온·오프라인 연계 학습 자료 · 프리미엄 라인", tier: "premium" },
                          ],
                        },
                        { icon: Home, label: language === "ko" ? "학원 집기·가구" : "Furniture & Fixtures",
                          items: [
                            { name: "퍼시스(Persis)", desc: "학원 가구 국내 1위 · 학생 의자·책상 전문", tier: "premium" },
                            { name: "리바트(Livart) 에듀", desc: "아동·청소년 전용 가구 · 안전 인증 우수", tier: "standard" },
                            { name: "코아스(Koas)", desc: "가성비 학원 집기 · 빠른 납품 가능", tier: "budget" },
                          ],
                        },
                      ],
                      2: [
                        { icon: AlignLeft, label: language === "ko" ? "문구·소모품" : "Stationery & Supplies",
                          items: [
                            { name: "모나미 B2B", desc: "국내 문구 1위 · 대량 주문·배송 가능", tier: "budget" },
                            { name: "교보문고 교육자료", desc: "부교재·참고서 도매 공급 · 전국 배송", tier: "standard" },
                            { name: "아성다이소 기업구매", desc: "소모품 비용 최적화 · 품목 다양성 최고", tier: "budget" },
                          ],
                        },
                        { icon: Shield, label: language === "ko" ? "위생·청소 소모품" : "Hygiene & Cleaning",
                          items: [
                            { name: "유한킴벌리 B2B", desc: "키친타올·위생장갑 업소용 대용량 공급", tier: "standard" },
                            { name: "3M 업소용", desc: "청소용품 전문 · 오래 사용해도 안전한 소재", tier: "standard" },
                            { name: "쿠팡 비즈", desc: "위생 소모품 최저가 · 당일 배송 가능", tier: "budget" },
                          ],
                        },
                      ],
                    },
                    "pet": {
                      1: [
                        { icon: Sprout, label: language === "ko" ? "사료·간식" : "Pet Food & Treats",
                          items: [
                            { name: "로얄캐닌(Royal Canin) B2B", desc: "수의사 추천 1위 · 프리미엄 브랜드 신뢰도 최고", tier: "premium" },
                            { name: "힐스(Hill's) 코리아", desc: "처방식·기능식 전문 · 의료 라인 포지셔닝", tier: "premium" },
                            { name: "퓨리나(Purina) B2B", desc: "대중 점유율 1위 · 가성비 통합 제품군", tier: "standard" },
                          ],
                        },
                        { icon: Scissors, label: language === "ko" ? "그루밍 제품" : "Grooming Products",
                          items: [
                            { name: "크리스탈 펫", desc: "국내 그루밍 제품 1위 유통 · B2B 전용 라인", tier: "standard" },
                            { name: "바이오그룸(Biogroom)", desc: "미국산 살롱 전용 그루밍 · 프리미엄 포지셔닝", tier: "premium" },
                            { name: "아이러브펫", desc: "가성비 그루밍 소모품 · 소량·대량 모두 가능", tier: "budget" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Star, label: language === "ko" ? "펫 용품" : "Pet Supplies",
                          items: [
                            { name: "리치펫(Richpet)", desc: "국내 펫 용품 종합 1위 · 다품목 B2B", tier: "standard" },
                            { name: "슈가버블", desc: "프리미엄 펫 케어 · 감성 소비층 타겟", tier: "premium" },
                            { name: "쿠팡 펫 비즈", desc: "소모품 최저가 통합 조달 · 빠른 배송", tier: "budget" },
                          ],
                        },
                        { icon: Shield, label: language === "ko" ? "위생·소독 소모품" : "Hygiene & Disinfection",
                          items: [
                            { name: "비오킬(Biokil) 코리아", desc: "펫 전용 살균·소독제 · 안전 성분 인증", tier: "standard" },
                            { name: "아성다이소 기업구매", desc: "펫 위생 소모품 최저가 일괄 조달", tier: "budget" },
                            { name: "그린톤(Greenton)", desc: "천연 원료 펫 위생 용품 · 알레르기 대응", tier: "premium" },
                          ],
                        },
                      ],
                    },
                    "retail": {
                      1: [
                        { icon: Store, label: language === "ko" ? "상품 소싱" : "Merchandise Sourcing",
                          items: [
                            { name: "온채널(OnChannel)", desc: "국내 최대 도매 B2B 플랫폼 · 품목 최다", tier: "standard" },
                            { name: "동대문 패션타운", desc: "의류·잡화 최대 소싱처 · 직납 협상 가능", tier: "budget" },
                            { name: "무역협회(KITA) B2B", desc: "해외 직수입 연결 · 원산지 다변화", tier: "standard" },
                          ],
                        },
                        { icon: Monitor, label: language === "ko" ? "POS·결제 시스템" : "POS & Payments",
                          items: [
                            { name: "KIS정보통신", desc: "POS 국내 1위 · 카드 단말·포스 통합", tier: "standard" },
                            { name: "토스페이먼츠", desc: "간편결제 최신 솔루션 · 수수료 낮고 연동 쉬움", tier: "standard" },
                            { name: "스마트로(Smartro)", desc: "소형 매장 특화 POS · 간단한 설치", tier: "budget" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Package, label: language === "ko" ? "포장재" : "Packaging",
                          items: [
                            { name: "하나팩", desc: "쇼핑백·포장박스 국내 최대 · 인쇄 주문 가능", tier: "standard" },
                            { name: "한국포장(KPK)", desc: "브랜딩 포장재 전문 · 커스텀 인쇄 특화", tier: "premium" },
                            { name: "페이퍼갱", desc: "친환경 포장 전문 · 소량 커스텀 주문 가능", tier: "standard" },
                          ],
                        },
                        { icon: Layers, label: language === "ko" ? "영수증·POS 소모품" : "Receipt & POS Supplies",
                          items: [
                            { name: "KIS정보통신 소모품", desc: "영수증 용지·POS 소모품 공식 공급", tier: "standard" },
                            { name: "아성다이소 기업구매", desc: "사무 소모품 최저가 · 다양한 품목", tier: "budget" },
                            { name: "쿠팡 비즈", desc: "POS·영수증·쇼핑백 소모품 통합 조달", tier: "budget" },
                          ],
                        },
                      ],
                    },
                    "living-service": {
                      1: [
                        { icon: RefreshCw, label: language === "ko" ? "세탁 기기" : "Laundry Equipment",
                          items: [
                            { name: "LG전자 클로이 B2B", desc: "업소용 세탁기 국내 1위 · A/S 전국 망", tier: "premium" },
                            { name: "삼성전자 업소용", desc: "드럼세탁기 안정적 공급 · A/S 우수", tier: "standard" },
                            { name: "일렉트로룩스(Electrolux)", desc: "유럽 업소용 세탁 브랜드 · 내구성 탁월", tier: "standard" },
                          ],
                        },
                        { icon: Droplets, label: language === "ko" ? "세제·소모품" : "Detergents & Supplies",
                          items: [
                            { name: "P&G 업소용(타이드·다우니)", desc: "글로벌 세탁 브랜드 1위 · 대용량 공급", tier: "standard" },
                            { name: "애경 B2B(퍼실)", desc: "국내 2위 · 대용량 경쟁력 있는 가격", tier: "budget" },
                            { name: "에코버(Ecover) 코리아", desc: "친환경 세제 · 프리미엄 서비스 포지셔닝", tier: "premium" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Package, label: language === "ko" ? "포장재 (세탁물 보호)" : "Laundry Packaging",
                          items: [
                            { name: "삼성포장", desc: "세탁 비닐백·옷걸이 업소용 최대 공급", tier: "standard" },
                            { name: "아성다이소 기업구매", desc: "세탁 소모품 최저가 일괄 조달", tier: "budget" },
                            { name: "쿠팡 비즈", desc: "비닐봉지·옷걸이·비닐커버 최저가 통합 배송", tier: "budget" },
                          ],
                        },
                        { icon: Cpu, label: language === "ko" ? "운영·결제 시스템" : "Operations & POS",
                          items: [
                            { name: "KIS정보통신 POS", desc: "국내 POS 1위 · 매출·재고 통합 관리", tier: "standard" },
                            { name: "워드빌(Wordville)", desc: "세탁물 관리 전용 솔루션 · 업종 특화", tier: "standard" },
                            { name: "나이스페이(Nicepay)", desc: "모바일·키오스크 결제 연동 솔루션", tier: "standard" },
                          ],
                        },
                      ],
                    },
                    "space": {
                      1: [
                        { icon: PanelLeft, label: language === "ko" ? "좌석 집기·가구" : "Seating & Furniture",
                          items: [
                            { name: "퍼시스(Persis)", desc: "독서실 책상 전문 국내 1위 · 맞춤 제작 가능", tier: "premium" },
                            { name: "시디즈(Sidiz)", desc: "인체공학 의자 전문 · 장시간 착석 최적화", tier: "standard" },
                            { name: "코아스(Koas)", desc: "가성비 독서실·사무 가구 · 빠른 납품", tier: "budget" },
                          ],
                        },
                        { icon: Monitor, label: language === "ko" ? "운영·입장 시스템" : "Operations System",
                          items: [
                            { name: "타임키퍼(TimeKeeper)", desc: "스터디카페 전용 키오스크·예약 시스템", tier: "standard" },
                            { name: "스마트인", desc: "스터디카페 운영 솔루션 · 전국 다수 적용", tier: "standard" },
                            { name: "스터디유(StudyU)", desc: "입장 관리·좌석 예약 앱 · 저비용 시작", tier: "budget" },
                          ],
                        },
                      ],
                      2: [
                        { icon: Coffee, label: language === "ko" ? "음료·간식 자판기" : "Vending & Beverages",
                          items: [
                            { name: "롯데네슬레 자판기", desc: "스터디카페 음료 공급 표준 · 무상 설치", tier: "standard" },
                            { name: "동서식품 B2B", desc: "커피·음료 자판기 연계 · 가성비 최고", tier: "budget" },
                            { name: "네스프레소 프로", desc: "캡슐커피 프리미엄 옵션 · 고급 인상 효과", tier: "premium" },
                          ],
                        },
                        { icon: Shield, label: language === "ko" ? "위생·청소 소모품" : "Hygiene & Cleaning",
                          items: [
                            { name: "유한킴벌리 B2B", desc: "화장실·공용공간 위생용품 업소용 공급", tier: "standard" },
                            { name: "아성다이소 기업구매", desc: "청소 소모품 최저가 · 다양한 품목 일괄", tier: "budget" },
                            { name: "쿠팡 비즈", desc: "위생·청소 소모품 통합 조달 · 빠른 배송", tier: "budget" },
                          ],
                        },
                      ],
                    },
                  };
                  const industryStepData = stepDataMap[industryCategoryId] ?? stepDataMap["food"];
                  const stepLabels: Record<number, string> = {
                    1: language === "ko" ? "원자재 공급처 추천" : "Raw Material Suppliers",
                    2: language === "ko" ? "포장재·소모품 추천" : "Packaging & Consumables",
                    3: language === "ko" ? "계약 관리 도구 추천" : "Invoice & Contract Tools",
                    4: language === "ko" ? "발주 플랫폼 추천" : "B2B Order Platforms",
                  };
                  const supplies: SupplyCategory[] =
                    guideStepIndex === 3 ? step3Supplies :
                    guideStepIndex === 4 ? step4Supplies :
                    industryStepData[guideStepIndex] ?? [];
                  if (supplies.length === 0) return null;
                  const urlMap = VENDOR_URL_MAP;
                  const tierConfig = {
                    premium: { bg: "rgba(88,86,214,0.12)", fg: "rgb(88,86,214)", label: language === "ko" ? "프리미엄" : "Premium" },
                    standard: { bg: "rgba(0,122,255,0.1)", fg: "rgb(0,122,255)", label: language === "ko" ? "표준" : "Standard" },
                    budget: { bg: "rgba(52,199,89,0.1)", fg: "rgb(34,167,73)", label: language === "ko" ? "가성비" : "Value" },
                  };
                  const categoryColors = [
                    { bg: "rgba(0,122,255,0.1)",  fg: "rgb(0,122,255)"  },
                    { bg: "rgba(52,199,89,0.1)",  fg: "rgb(34,167,73)"  },
                    { bg: "rgba(255,149,0,0.1)",  fg: "rgb(210,120,0)"  },
                    { bg: "rgba(88,86,214,0.12)", fg: "rgb(88,86,214)"  },
                  ];
                  const stepTip: Record<number, string> = {
                    1: language === "ko" ? "첫 주문 전 반드시 샘플 요청 후 품질 확인. 2~3곳 견적 비교 후 계약하세요." : "Always request samples before the first order. Compare 2–3 quotes before committing.",
                    2: language === "ko" ? "포장재는 최소 2주치 재고를 미리 확보하세요. 납품 지연 시 영업에 직접 영향을 줍니다." : "Keep at least 2 weeks of packaging stock. Delayed delivery can directly impact operations.",
                    3: language === "ko" ? "세금계산서 발행 여부는 계약 전 반드시 확인. 미발행 업체는 부가세 환급이 불가합니다." : "Confirm invoice issuance before signing. Non-issuing vendors forfeit VAT refunds.",
                    4: language === "ko" ? "첫 주 재고는 예상 판매량의 1.5배로 시작해 빠른 품절을 방지하세요." : "Start with 1.5× expected weekly sales volume to avoid early stockouts.",
                  };
                  return (
                    <>
                      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "16px 0 12px" }} />
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                        {stepLabels[guideStepIndex]}
                      </div>
                      {supplies.map((supply, si) => {
                        const catColor = categoryColors[si % categoryColors.length];
                        const Icon = supply.icon;
                        const selKey = `${currentStage.stageId}_s${guideStepIndex}_c${si}`;
                        const selectedName = vendorSelections[selKey] ?? "";
                        const customText = vendorCustomInputs[selKey] ?? "";
                        const etcKey = `__etc__${selKey}`;
                        return (
                          <div key={si} style={{ marginBottom: "10px" }}>
                            <div style={{ fontSize: "11.5px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                              {supply.label}
                            </div>
                            <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}>
                              {supply.items.map((item, ii) => {
                                const tier = tierConfig[item.tier];
                                const isSelected = selectedName === item.name;
                                return (
                                  <div key={ii}>
                                    {ii > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />}
                                    <div
                                      style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px", cursor: "pointer", background: isSelected ? "rgba(0,122,255,0.04)" : "transparent", transition: "background 0.15s" }}
                                      onClick={() => setVendorSelections(prev => ({ ...prev, [selKey]: isSelected ? "" : item.name }))}
                                    >
                                      {/* select indicator */}
                                      <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.18)", background: isSelected ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                        {isSelected && (
                                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: catColor.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: catColor.fg }}>
                                        <Icon size={18} strokeWidth={1.5} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", flexWrap: "wrap" as const }}>
                                          <span style={{ fontSize: "14px", fontWeight: isSelected ? 640 : 590, color: isSelected ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{item.name}</span>
                                          <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "100px", background: tier.bg, color: tier.fg, flexShrink: 0 }}>{tier.label}</span>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{item.desc}</div>
                                      </div>
                                      {urlMap[item.name] && (
                                        <a
                                          href={urlMap[item.name]}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.38)", textDecoration: "none" }}
                                        >
                                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                            <path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {/* 기타 행 */}
                              <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />
                              <div
                                style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px", cursor: "pointer", background: selectedName === etcKey ? "rgba(0,122,255,0.04)" : "transparent", transition: "background 0.15s" }}
                                onClick={() => setVendorSelections(prev => ({ ...prev, [selKey]: selectedName === etcKey ? "" : etcKey }))}
                              >
                                <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", border: selectedName === etcKey ? "none" : "1.5px solid rgba(0,0,0,0.18)", background: selectedName === etcKey ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                  {selectedName === etcKey && (
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                      <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(0,0,0,0.35)" }}>
                                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                                    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/>
                                    <circle cx="4" cy="8.5" r="1.2" fill="currentColor"/>
                                    <circle cx="13" cy="8.5" r="1.2" fill="currentColor"/>
                                  </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "14px", fontWeight: selectedName === etcKey ? 640 : 500, color: selectedName === etcKey ? "rgb(0,122,255)" : "rgba(0,0,0,0.5)", letterSpacing: "-0.2px" }}>
                                    {language === "ko" ? "기타 (직접 입력)" : "Other (specify)"}
                                  </div>
                                  {selectedName === etcKey && (
                                    <input
                                      autoFocus
                                      type="text"
                                      placeholder={language === "ko" ? "업체명을 입력하세요" : "Enter supplier name"}
                                      value={customText}
                                      onClick={e => e.stopPropagation()}
                                      onChange={e => setVendorCustomInputs(prev => ({ ...prev, [selKey]: e.target.value }))}
                                      style={{ marginTop: "6px", width: "100%", fontSize: "13px", padding: "7px 10px", borderRadius: "10px", border: "1.5px solid rgba(0,122,255,0.35)", outline: "none", background: "rgba(0,122,255,0.04)", color: "var(--text)", boxSizing: "border-box" as const }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(0,122,255,0.06)", marginBottom: "4px" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                          <circle cx="7" cy="7" r="6" stroke="rgb(0,122,255)" strokeWidth="1.4"/>
                          <path d="M7 6v4M7 4.5v.5" stroke="rgb(0,122,255)" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>
                          {stepTip[guideStepIndex] ?? (language === "ko" ? "첫 주문 전 반드시 샘플 요청 후 품질 확인하세요." : "Always request samples before the first order.")}
                        </span>
                      </div>
                    </>
                  );
                  })();

                  // ─── operations_setup 인터랙티브 블록 ───
                  const operationsEl: React.ReactNode = (currentStage.code as string) !== "operations_setup" || guideStepIndex === 0 ? null : (() => {
                    type OpsItem = { id: string; name: string; desc: string; color: string; url: string; fee?: string; mau?: string; pros?: string[]; cons?: string[] };
                    const ko = language === "ko";

                    const logisticsItems: OpsItem[] = businessCtx.isDeliveryRelevant
                      ? [
                          { id: "baemin",     name: ko ? "배달의민족" : "Baemin",      desc: ko ? "MAU 2,170만 · 배달앱 1위" : "MAU 21.7M · #1 delivery app",       color: "#00C73C", url: "https://ceo.baemin.com",      fee: ko ? "2.0~7.8% (차등제)" : "2.0~7.8% tiered",    mau: "2,170만", pros: ko ? ["최대 고객 풀", "광고 효과 최대", "포장 주문 동시 운영"] : ["Largest customer pool", "Best ad reach"], cons: ko ? ["포장 수수료 6.8%", "광고 경쟁 치열"] : ["6.8% takeout fee", "Ad competition"] },
                          { id: "coupangeats",name: ko ? "쿠팡이츠" : "Coupang Eats",  desc: ko ? "MAU 1,230만 · 서울 결제액 1위" : "MAU 12.3M · #1 in Seoul GMV", color: "#1460F3", url: "https://store.coupangeats.com", fee: ko ? "2.0~7.8% (차등제)" : "2.0~7.8% tiered",    mau: "1,230만", pros: ko ? ["단건 배달 품질 최고", "와우 멤버십 유입", "포장 수수료 0%"] : ["Best single delivery", "Wow members", "0% takeout"], cons: ko ? ["수도권 외 커버리지 부족", "고가 배달비"] : ["Weak outside metro", "Higher delivery fee"] },
                          { id: "yogiyo",     name: ko ? "요기요" : "Yogiyo",          desc: ko ? "MAU 440만 · 하위 매출 환급 혜택" : "MAU 4.4M · Low-tier refund", color: "#FF5A00", url: "https://ceo.yogiyo.co.kr",    fee: ko ? "4.7~9.7% (건수별)" : "4.7~9.7% per order", mau: "440만",   pros: ko ? ["광고비 부담 적음", "하위 40% 수수료 환급", "초기 매장 적합"] : ["Low ad cost", "Bottom 40% refund"], cons: ko ? ["점유율 하락 추세", "유입량 감소"] : ["Declining market share"] },
                          { id: "ddangyo",    name: ko ? "땡겨요" : "Ddangyo",         desc: ko ? "MAU 345만 · 공공배달앱 1위" : "MAU 3.45M · #1 public app",       color: "#FF6B35", url: "https://www.ddangyo.com",     fee: ko ? "2% 고정" : "2% fixed",                     mau: "345만",   pros: ko ? ["수수료 최저", "공공앱 신뢰감", "서울·경기 강세"] : ["Lowest fee", "Public trust"], cons: ko ? ["전국 커버리지 부족", "유입 제한적"] : ["Limited nationwide", "Lower traffic"] },
                          { id: "naver-order",name: ko ? "네이버 주문" : "Naver Order", desc: ko ? "수수료 ~1.1% · 네이버 검색 연동" : "~1.1% · Naver Search linked", color: "#03C75A", url: "https://new.smartplace.naver.com", fee: ko ? "~1.1% (결제수수료만)" : "~1.1% payment only", mau: "-",   pros: ko ? ["수수료 최저 수준", "네이버 지도·검색 노출", "포장 주문 전환 급증"] : ["Lowest fee", "Naver Maps synergy"], cons: ko ? ["배달 인프라 없음 (포장 전용)", "별도 배달대행 필요"] : ["No delivery infra", "Takeout only"] },
                        ]
                      : isDigitalCategory
                      ? [
                          { id: "smartstore", name: ko ? "네이버 스마트스토어" : "Naver Smartstore", desc: ko ? "MAU 536만 · 쇼핑 검색 1위" : "MAU 5.36M · #1 shopping search", color: "#03C75A", url: "https://sell.smartstore.naver.com", fee: ko ? "주문 1.98~3.74% + 판매 0.91~2.73%" : "Order 1.98~3.74% + Sale 0.91~2.73%", mau: "536만", pros: ko ? ["네이버 검색 노출 최강", "결제 수수료 최저", "쇼핑라이브 가능"] : ["Best Naver search exposure", "Lowest payment fee"], cons: ko ? ["광고 없이 노출 어려움", "경쟁 치열"] : ["Hard to get exposure without ads"] },
                          { id: "coupang-mp", name: ko ? "쿠팡 마켓플레이스" : "Coupang Marketplace", desc: ko ? "MAU 3,339만 · 이커머스 1위" : "MAU 33.4M · #1 ecommerce", color: "#E52222", url: "https://wing.coupang.com", fee: ko ? "4~10.8% + 월 55,000원" : "4~10.8% + ₩55K/mo", mau: "3,339만", pros: ko ? ["최대 트래픽", "로켓그로스 풀필먼트", "와우 멤버십 노출"] : ["Most traffic", "Rocket Growth fulfillment"], cons: ko ? ["월 정액비 부담", "가격 경쟁 심화"] : ["Monthly fee", "Price competition"] },
                          { id: "kakao-store", name: ko ? "카카오톡 스토어" : "KakaoTalk Store", desc: ko ? "카톡 4,700만 사용자 연동" : "Connected to 47M KakaoTalk users", color: "#F9E000", url: "https://store.kakaotalk.com", fee: ko ? "3.3~10% (경로별)" : "3.3~10% by channel", mau: "4,700만", pros: ko ? ["카톡 메시지 마케팅", "선물하기 입점 가능", "간편 결제"] : ["KakaoTalk marketing", "Gift feature"], cons: ko ? ["선물하기 수수료 ~15%", "자체 검색 유입 약함"] : ["~15% gift fee", "Weak search traffic"] },
                          { id: "elevenst",   name: ko ? "11번가" : "11st",             desc: ko ? "MAU 893만 · 신규 셀러 수수료 6%" : "MAU 8.93M · New seller 6%",  color: "#FF0000", url: "https://soffice.11st.co.kr", fee: ko ? "7~13% (카테고리별)" : "7~13% by category", mau: "893만", pros: ko ? ["신규 12개월 수수료 할인", "SKT 멤버십 연계"] : ["12-month new seller discount"], cons: ko ? ["트래픽 감소 추세"] : ["Declining traffic"] },
                          { id: "gmarket",     name: ko ? "G마켓/옥션" : "G-Market/Auction", desc: ko ? "G마켓 MAU 706만 + 옥션 296만" : "G-Market 7.06M + Auction 2.96M MAU", color: "#00A34F", url: "https://www.gmarket.co.kr", fee: ko ? "4~15% (평균 9%)" : "4~15% (avg 9%)", mau: "706만+296만", pros: ko ? ["묶음 배송 시스템", "해외 판매 연동"] : ["Bundle shipping", "Global selling"], cons: ko ? ["트래픽 감소 추세", "수수료 높은 편"] : ["Declining traffic", "Higher fees"] },
                        ]
                      : [
                          { id: "cj",    name: ko ? "CJ대한통운" : "CJ Logistics", desc: ko ? "택배 점유율 1위 · D+1 배송" : "#1 courier · D+1 delivery",           color: "#003C71", url: "https://www.cjlogistics.com", fee: ko ? "소형 1,850원~ (계약)" : "Small ₩1,850+ (contract)", pros: ko ? ["전국 커버리지 최강", "D+1 배송", "편의점 접수"] : ["Best nationwide", "D+1"], cons: ko ? ["초기 물량 적으면 할인 적음"] : ["Low volume = low discount"] },
                          { id: "hanjin",name: ko ? "한진택배" : "Hanjin",          desc: ko ? "중대형 화물 경쟁력" : "Mid-large competitive",                       color: "#FF6600", url: "https://www.hanjin.co.kr",    fee: ko ? "소형 5,000원~" : "Small ₩5,000+",   pros: ko ? ["중대형 화물 강점", "전국 A/S망"] : ["Good for large items"], cons: ko ? ["소형 가격 높음"] : ["Expensive for small items"] },
                          { id: "epost", name: ko ? "우체국택배" : "Korea Post",    desc: ko ? "최저가 · 도서산간 추가 없음" : "Cheapest · No island surcharge",       color: "#004098", url: "https://parcel.epost.go.kr",  fee: ko ? "3kg 이하 2,700원" : "Under 3kg ₩2,700", pros: ko ? ["최저 요금", "도서산간 추가 없음", "우체국 접수"] : ["Cheapest", "No island surcharge"], cons: ko ? ["D+3 배송", "속도 느림"] : ["D+3 delivery", "Slow"] },
                        ];
                    // Alias for backward compatibility with existing render logic
                    const deliveryApps = logisticsItems;

                    const posCheckItems: Array<{ id: string; label: string; hint: string }> = [
                      { id: "menu-check",       label: language === "ko" ? "메뉴·상품 전체 등록 및 가격 확인" : "All items registered with correct prices", hint: language === "ko" ? "옵션·추가 금액·품절 처리도 함께 점검" : "Check options, add-ons and sold-out handling" },
                      { id: "payment-check",    label: language === "ko" ? "카드 실결제 1건 테스트" : "Live card payment test", hint: language === "ko" ? "실제 카드로 결제 후 즉시 취소하세요" : "Use a real card then cancel immediately" },
                      { id: "receipt-check",    label: language === "ko" ? "영수증 출력 확인" : "Receipt printing confirmed", hint: language === "ko" ? "사업자 정보·세금 정보 정확한지 확인" : "Verify business name and tax info are correct" },
                      { id: "settlement-check", label: language === "ko" ? "일 마감·정산 기능 점검" : "Daily closing & settlement tested", hint: language === "ko" ? "정산 금액 = 매출 합계인지 비교 확인" : "Confirm settlement total matches sales total" },
                    ];

                    const snsChannels: OpsItem[] = [
                      { id: "instagram",      name: "인스타그램 비즈니스", desc: ko ? "MAU 2,000만+ · 비주얼 마케팅 필수" : "MAU 20M+ · Visual marketing essential", color: "#C13584", url: "https://business.instagram.com", fee: ko ? "0% (별도 PG 3~4%)" : "0% (PG 3~4%)", mau: "2,000만+", pros: ko ? ["무료 개설", "리스/스토리 바이럴", "쇼핑 태그 연동"] : ["Free", "Reels/Story viral", "Shopping tags"], cons: ko ? ["인앱 결제 미지원", "알고리즘 변동"] : ["No in-app payment", "Algorithm changes"] },
                      { id: "naver-place",    name: "네이버 플레이스",     desc: ko ? "검색 MAU 4,000만+ · 매장 노출 1순위" : "Search MAU 40M+ · #1 store exposure", color: "#03C75A", url: "https://new.smartplace.naver.com", fee: ko ? "무료 (예약 현장결제 0원)" : "Free", mau: "4,000만+", pros: ko ? ["완전 무료", "네이버 검색·지도 노출", "예약·리뷰 통합"] : ["Free", "Naver Search + Maps", "Booking + Reviews"], cons: ko ? ["등록 후 노출까지 시간 소요", "리뷰 관리 필요"] : ["Takes time to rank", "Review management needed"] },
                      { id: "kakao-channel",  name: "카카오 채널",         desc: ko ? "카톡 4,700만 · 메시지 마케팅" : "KakaoTalk 47M · Message marketing",           color: "#F9E000", url: "https://ch.kakao.com", fee: ko ? "채널 무료, 메시지 건당 15~20원" : "Channel free, msg ₩15~20/ea", mau: "4,700만", pros: ko ? ["카톡 푸시 마케팅", "챗봇 무료", "카카오맵 연동"] : ["KakaoTalk push", "Free chatbot"], cons: ko ? ["메시지 비용 누적", "톡스토어 수수료 별도"] : ["Message costs add up"] },
                      { id: "google-business",name: "구글 비즈니스",       desc: ko ? "구글맵 노출 · 외국인 필수" : "Google Maps · Essential for foreigners",           color: "#4285F4", url: "https://business.google.com/ko", fee: ko ? "무료" : "Free", pros: ko ? ["완전 무료", "구글맵 노출", "외국인 접근성"] : ["Free", "Google Maps", "Foreign customers"], cons: ko ? ["한국 내 검색 점유율 낮음"] : ["Low domestic search share"] },
                    ];

                    const renderPlatformCard = (items: OpsItem[], keyPrefix: string, tip: string) => {
                      const selectedCount = items.filter(it => opsSelections[`${keyPrefix}-${it.id}`]).length;
                      return (
                        <>
                          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "16px 0 12px" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                              {keyPrefix === "delivery"
                                ? (businessCtx.isDeliveryRelevant
                                    ? (language === "ko" ? "배달 플랫폼 입점" : "Delivery Platforms")
                                    : isDigitalCategory
                                      ? (language === "ko" ? "판매 플랫폼 선택" : "Sales Platforms")
                                      : (language === "ko" ? "택배사 선택" : "Courier Service"))
                                : (language === "ko" ? "채널 개설 현황" : "Channel Setup")}
                            </span>
                            {selectedCount > 0 && (
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.1)", padding: "2px 8px", borderRadius: "100px" }}>
                                {selectedCount}{language === "ko" ? "개 완료" : " done"}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "grid", gap: "10px" }}>
                            {items.map((item) => {
                              const selKey = `${keyPrefix}-${item.id}`;
                              const isSelected = !!opsSelections[selKey];
                              return (
                                <div key={item.id}
                                  style={{
                                    background: isSelected ? `${item.color}06` : "white",
                                    borderRadius: "18px", overflow: "hidden", cursor: "pointer",
                                    border: isSelected ? `1.5px solid ${item.color}30` : "1px solid rgba(0,0,0,0.06)",
                                    boxShadow: isSelected ? `0 0 0 3px ${item.color}08` : "0 1px 4px rgba(0,0,0,0.03)",
                                    transition: "all 0.2s ease",
                                  }}
                                  onClick={() => setOpsSelections(prev => ({ ...prev, [selKey]: !prev[selKey] }))}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px" }}>
                                    <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.15)", background: isSelected ? item.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                      {isSelected && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${item.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <span style={{ fontSize: "17px", fontWeight: 750, color: item.color }}>{item.name.charAt(0)}</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                        <span style={{ fontSize: "15px", fontWeight: isSelected ? 660 : 600, color: isSelected ? item.color : "var(--text)", letterSpacing: "-0.02em" }}>{item.name}</span>
                                        {item.mau && item.mau !== "-" && (
                                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "6px", background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}>MAU {item.mau}</span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{item.desc}</div>
                                      {item.fee && (
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px", padding: "3px 10px", borderRadius: "8px", background: `${item.color}0a`, fontSize: "11px", fontWeight: 620, color: item.color }}>
                                          {ko ? "수수료" : "Fee"}: {item.fee}
                                        </div>
                                      )}
                                    </div>
                                    <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>
                                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </a>
                                  </div>
                                  {/* 장단점 — 선택 시 펼침 */}
                                  {isSelected && (item.pros?.length || item.cons?.length) && (
                                    <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} className="bento-fade-in">
                                      {item.pros && item.pros.length > 0 && (
                                        <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(5,150,105,0.04)" }}>
                                          <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "장점" : "Pros"}</div>
                                          {item.pros.map((p, pi) => (
                                            <div key={pi} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                                              <span style={{ color: "#059669", flexShrink: 0 }}>+</span> {p}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {item.cons && item.cons.length > 0 && (
                                        <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(220,38,38,0.03)" }}>
                                          <div style={{ fontSize: "10px", fontWeight: 650, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "주의" : "Cons"}</div>
                                          {item.cons.map((c, ci) => (
                                            <div key={ci} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                                              <span style={{ color: "#dc2626", flexShrink: 0 }}>-</span> {c}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(0,122,255,0.06)", marginTop: "10px", marginBottom: "4px" }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="7" cy="7" r="6" stroke="rgb(0,122,255)" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="rgb(0,122,255)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                            <span style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>{tip}</span>
                          </div>
                        </>
                      );
                    };

                    if (guideStepIndex === 1) {
                      return renderPlatformCard(
                        deliveryApps,
                        "delivery",
                        language === "ko"
                          ? "배민·쿠팡이츠 중 하나라도 먼저 입점하고, 나머지는 오픈 후 추가해도 됩니다."
                          : "Start with at least one platform and add others after opening."
                      );
                    }

                    if (guideStepIndex === 2) {
                      const allChecked = posCheckItems.every(c => opsPosChecks[c.id]);
                      return (
                        <>
                          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "16px 0 12px" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                              {language === "ko" ? "POS 점검 체크리스트" : "POS Test Checklist"}
                            </span>
                            {allChecked && (
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgb(52,199,89)", background: "rgba(52,199,89,0.1)", padding: "2px 8px", borderRadius: "100px" }}>
                                {language === "ko" ? "✓ 완료" : "✓ Done"}
                              </span>
                            )}
                          </div>
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}>
                            {posCheckItems.map((check, i) => {
                              const checked = !!opsPosChecks[check.id];
                              return (
                                <div key={check.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "64px" }} />}
                                  <div
                                    style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 18px", cursor: "pointer", background: checked ? "rgba(52,199,89,0.04)" : "transparent", transition: "background 0.15s" }}
                                    onClick={() => setOpsPosChecks(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                                  >
                                    <div style={{ flexShrink: 0, marginTop: "1px", width: "20px", height: "20px", borderRadius: "6px", border: checked ? "none" : "1.5px solid rgba(0,0,0,0.18)", background: checked ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                      {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "14px", fontWeight: checked ? 600 : 500, color: checked ? "rgb(34,167,73)" : "var(--text)", letterSpacing: "-0.2px", textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.7 : 1 }}>{check.label}</div>
                                      {!checked && <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.38)", marginTop: "2px", lineHeight: 1.4 }}>{check.hint}</div>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(255,149,0,0.07)", marginTop: "10px", marginBottom: "4px" }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="7" cy="7" r="6" stroke="rgb(210,120,0)" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="rgb(210,120,0)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                            <span style={{ fontSize: "12px", color: "rgba(150,80,0,0.8)", lineHeight: 1.5 }}>
                              {language === "ko" ? "실결제 테스트 후 반드시 취소 처리하세요. 정산 오류 방지를 위해 오픈 전날 완료를 권장합니다." : "Cancel the test transaction immediately. Complete this the day before opening to avoid settlement errors."}
                            </span>
                          </div>
                        </>
                      );
                    }

                    if (guideStepIndex === 3) {
                      return renderPlatformCard(
                        snsChannels,
                        "sns",
                        language === "ko"
                          ? "네이버 플레이스는 오픈 1주 전에 등록해야 검색 노출이 오픈 당일부터 반영됩니다."
                          : "Register Naver Place at least 1 week before opening for search visibility on day one."
                      );
                    }

                    return null;
                  })();

                  // ── registration_setup: per-step rich enrichment ──────────────
                  const registrationSetupEl: React.ReactNode = (() => {
                    if (currentStage.code !== "registration_setup" || guideStepIndex === 0) return null;

                    const ko = language === "ko";
                    const cat = industryCategoryId;

                    type RegItem = { text: string; sub?: string };
                    type RegSection = { label: string; items: RegItem[] };
                    type RegTrap = { label: string; text: string };
                    type RegLink = { text: string; href: string };
                    type RegStepData = { sections: RegSection[]; traps: RegTrap[]; links: RegLink[] };

                    // ── Step 1: 사업자등록 준비·신청 ──────────────────────────────
                    const step1: RegStepData = {
                      sections: [
                        {
                          label: ko ? "준비물" : "What to bring",
                          items: ko ? [
                            { text: "신분증 원본", sub: "운전면허증 또는 여권" },
                            { text: "임대차계약서 원본", sub: "임차인 = 대표자 본인 명의여야 함. 가족 명의면 전대차 계약서 추가" },
                            cat === "beauty"
                              ? { text: "미용사 면허증", sub: "대표자 본인 또는 고용 직원 면허 모두 사용 가능" }
                              : cat === "fitness"
                                ? { text: "시설 도면(약식)", sub: "면적·공간 배치가 나온 간단한 도면으로도 가능" }
                                : { text: "업종 자격증(선택)", sub: "조리사 면허는 의무 아님 — 단, 식품위생교육 이수증은 3단계에서 필수" },
                            { text: "도장(선택)", sub: "세무서 방문 시 있으면 편리, 없어도 서명으로 대체 가능" },
                          ] : [
                            { text: "Government-issued ID (original)", sub: "Driver's license or passport" },
                            { text: "Lease contract (original)", sub: "Lessee name must match the representative. Add sub-lease doc if under family name." },
                            cat === "beauty"
                              ? { text: "Cosmetology license", sub: "Owner's or employed cosmetologist's license both accepted" }
                              : { text: "Professional license (if applicable)", sub: "Cook's license not mandatory — food hygiene certificate needed at Step 3" },
                            { text: "Seal/stamp (optional)", sub: "Useful at tax office, can be replaced with signature" },
                          ],
                        },
                        {
                          label: ko ? "신청 방법 비교" : "How to register",
                          items: ko ? [
                            { text: "홈택스 온라인 신청 — 추천", sub: "24시간 신청 가능 · 처리 2~3 영업일 · 공동인증서(민간 포함) 필요 · hometax.go.kr → 신청/제출 → 사업자등록신청" },
                            { text: "세무서 직접 방문", sub: "당일 처리 완료 · 복잡한 인허가 업종 창업자에게 추천 · 평일 09:00~18:00" },
                          ] : [
                            { text: "Hometax online — recommended", sub: "24/7 · 2–3 business days · Joint certificate required · hometax.go.kr → Application" },
                            { text: "Tax office in person", sub: "Same-day completion · Recommended for complex permit industries · Weekdays 09:00–18:00" },
                          ],
                        },
                        {
                          label: ko ? "내 업종코드" : "Business code",
                          items: ko ? (
                            cat === "cafe-dessert" ? [
                              { text: "522220 커피음료점업", sub: "카페·테이크아웃 커피 전문점 기본 코드" },
                              { text: "522210 제과점업", sub: "베이커리·디저트 카페 (빵 비중이 크면 이 코드)" },
                              { text: "주류 판매 계획 있으면 → 522111 일반음식점업 추가", sub: "맥주·와인 등 주류를 판다면 업종 추가 등록 필요" },
                            ] : cat === "food" ? [
                              { text: "522111 한식 음식점업", sub: "찌개·구이·한정식 등 한식 위주" },
                              { text: "522121 외국식 음식점업", sub: "이탈리안·일식·중식·양식 등" },
                              { text: "522141 기타 간이음식점업", sub: "분식·포장마차·푸드트럭 형태" },
                            ] : cat === "beauty" ? [
                              { text: "961101 미용업", sub: "헤어 커트·펌·염색 기본 코드" },
                              { text: "961201 피부미용업", sub: "피부관리·반영구·속눈썹" },
                              { text: "961301 기타 미용업", sub: "네일·화장·종합 뷰티 (복합 서비스)" },
                            ] : cat === "fitness" ? [
                              { text: "931001 스포츠 시설 운영업", sub: "헬스장·PT 스튜디오 기본 코드" },
                              { text: "931003 기타 스포츠 시설 운영업", sub: "요가·필라테스·기타 운동 시설" },
                              { text: "무도 종목은 별도 허가 대상", sub: "태권도·유도·합기도 등 → 3단계에서 안내" },
                            ] : [
                              { text: "세무서 방문 시 직원에게 확인 가능", sub: "업종코드 선택을 도와줌 — 잘 모르면 방문 신청 추천" },
                            ]
                          ) : (
                            cat === "cafe-dessert" ? [
                              { text: "522220 — Café & coffee shop", sub: "Main code for cafés and takeout coffee" },
                              { text: "522210 — Bakery", sub: "Use this if baked goods are your primary product" },
                              { text: "Add 522111 (general restaurant) if serving alcohol", sub: "Required for beer/wine sales" },
                            ] : cat === "beauty" ? [
                              { text: "961101 — Hair salon", sub: "Cutting, perming, coloring" },
                              { text: "961201 — Skin care studio", sub: "Facials, semi-permanent, lashes" },
                              { text: "961301 — Other beauty services", sub: "Nail art, makeup, multi-service" },
                            ] : [
                              { text: "522111 — Korean food restaurant", sub: "Korean cuisine" },
                              { text: "522121 — Foreign food restaurant", sub: "Italian, Japanese, Chinese, Western" },
                            ]
                          ),
                        },
                      ],
                      traps: ko ? [
                        { label: "임차인 명의 불일치 → 즉시 반려", text: "계약서의 임차인이 사업자 대표자 본인이 아니면 접수 자체가 거부됩니다. 부모·배우자 명의 계약서라면 반드시 전대차 계약서(전대인 동의 포함)를 추가 준비하세요." },
                        { label: "상호명 상표 분쟁 리스크", text: "기존 상표와 유사한 상호명은 나중에 법적 분쟁이나 간판 교체 비용이 생깁니다. 등록 전 KIPRIS에서 반드시 검색하세요." },
                      ] : [
                        { label: "Lease name mismatch = instant rejection", text: "The lessee on the contract must be the business representative. If it's a family member's name, prepare a sub-lease document with the original lessee's consent." },
                        { label: "Trade name trademark risk", text: "A name similar to an existing trademark can lead to legal disputes and forced rebranding later. Search on KIPRIS before committing." },
                      ],
                      links: ko ? [
                        { text: "국세청 홈택스 — 사업자등록 신청", href: "https://www.hometax.go.kr" },
                        { text: "KIPRIS — 상표·상호 검색", href: "https://www.kipris.or.kr" },
                      ] : [
                        { text: "Hometax — Business registration", href: "https://www.hometax.go.kr" },
                        { text: "KIPRIS — Trademark search", href: "https://www.kipris.or.kr" },
                      ],
                    };

                    // ── Step 2: 과세유형·업종코드 확정 ──────────────────────────
                    const step2: RegStepData = {
                      sections: [
                        {
                          label: ko ? "과세유형 비교 — 등록 전 결정 필수" : "VAT type — must decide before filing",
                          items: ko ? [
                            { text: "간이과세자 — 연 매출 1억 400만원 미만 예상 시", sub: "부가세 납부 부담 낮음. 단, 세금계산서 발급 불가 → B2B 거래가 있으면 선택 금지" },
                            { text: "일반과세자 — 매출 1억+ 또는 초기 투자 큰 경우", sub: "매입세액 전액 환급 가능. 인테리어·설비 1억 투자 시 약 909만원 환급 효과" },
                          ] : [
                            { text: "Simplified VAT — est. revenue < ₩104M", sub: "Lower VAT burden. Cannot issue tax invoices → don't choose if you have B2B clients" },
                            { text: "General VAT — revenue ≥ ₩104M or large initial spend", sub: "Full input VAT refund. ₩100M in fit-out costs → ~₩9M refund" },
                          ],
                        },
                        {
                          label: ko ? "세금 신고 주기 미리 알기" : "Tax filing schedule",
                          items: ko ? [
                            { text: "부가세: 연 2회 (1·7월)", sub: "일반과세자 기준 — 간이과세자는 연 1회(1월)만 신고" },
                            { text: "종합소득세: 매년 5월", sub: "전년도 사업 소득 전체 신고. 세무사 선임 여부에 관계없이 본인 책임" },
                            { text: "원천세: 직원 채용 시 매월 신고", sub: "4대보험 가입도 직원 채용 즉시 의무 — 고용노동부 EDI에서 신고" },
                          ] : [
                            { text: "VAT: twice a year (Jan & Jul)", sub: "General VAT payers — simplified VAT payers file once in January" },
                            { text: "Income tax: every May", sub: "Previous year's total business income. Your responsibility regardless of tax advisor." },
                            { text: "Withholding tax: monthly when you have employees", sub: "4 social insurance plans must also be enrolled immediately upon hiring" },
                          ],
                        },
                        {
                          label: ko ? "세무 처리 방식 선택" : "How to handle taxes",
                          items: ko ? [
                            { text: "직접 신고 (홈택스)", sub: "직원 없고 단순 매출일 때 가능. 무료이나 부가세·종소세 신고 방법 공부 필요" },
                            { text: "세무사(세무대리인) 선임 — 월 5~15만원", sub: "원천세·4대보험·부가세·종소세 전부 위임. 직원 1명 이상이거나 정책자금 신청 예정이면 거의 필수" },
                          ] : [
                            { text: "Self-file via Hometax", sub: "Works if no employees and simple revenue. Free but requires learning VAT/income tax filing." },
                            { text: "Hire a tax accountant — ₩50K–150K/month", sub: "Delegate everything. Nearly essential if you have employees or plan to apply for policy funds." },
                          ],
                        },
                      ],
                      traps: ko ? [
                        { label: "과세유형 변경은 연 1회, 다음 해 1월만 가능", text: "개업 시 잘못 선택하면 최소 1년을 기다려야 바꿀 수 있습니다. 인테리어·설비 투자가 1,000만원 이상이라면 일반과세자를 강하게 권장합니다." },
                        { label: "간이과세자의 세금계산서 발급 불가", text: "납품업체·유통업체와 거래할 때 세금계산서를 요구받으면 간이과세자는 발급이 안 됩니다. B2B 납품이나 기업 거래가 있다면 처음부터 일반과세자로 등록하세요." },
                      ] : [
                        { label: "VAT type change is only possible once a year, in January", text: "If you choose wrong at registration, you wait a full year to change. Strongly recommend General VAT if fit-out exceeds ₩10M." },
                        { label: "Simplified VAT cannot issue tax invoices", text: "If suppliers or corporate clients demand tax invoices, you can't provide them as a simplified VAT payer. Register as General VAT from the start if B2B matters." },
                      ],
                      links: ko ? [
                        { text: "국세청 — 과세유형 선택 안내", href: "https://www.nts.go.kr" },
                        { text: "국세청 세무대리인(세무사) 조회", href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2248" },
                      ] : [
                        { text: "NTS — VAT type guide", href: "https://www.nts.go.kr" },
                        { text: "NTS — Find a tax accountant", href: "https://www.nts.go.kr" },
                      ],
                    };

                    // ── Step 3: 영업신고·위생교육 (업종별 완전히 다름) ────────────
                    const step3Food: RegStepData = {
                      sections: [
                        {
                          label: ko ? "1단계: 식품위생교육 먼저 이수" : "Step A: Food hygiene education first",
                          items: ko ? [
                            { text: "교육 시간: 신규 영업자 6시간 (1일 이수)", sub: "온라인 교육 가능 기관도 있음 — 각 교육원 일정 확인" },
                            { text: "비용: 약 20,000~40,000원", sub: "기관마다 상이 — 한국외식업중앙회·식품위생교육원 등" },
                            { text: "이수증 발급: 교육 당일 또는 다음날", sub: "이 이수증 없이 영업신고 접수 불가" },
                          ] : [
                            { text: "Duration: 6 hours for new operators (1 day)", sub: "Some institutions offer online options — check their schedules" },
                            { text: "Cost: approx. ₩20,000–40,000", sub: "Varies by institution — Korea Restaurant Association, Food Hygiene Education Center, etc." },
                            { text: "Certificate issued same or next day", sub: "Cannot file operating notification without this certificate" },
                          ],
                        },
                        {
                          label: ko ? "2단계: 관할 구청 위생과 영업신고" : "Step B: Operating notification at district office",
                          items: ko ? [
                            { text: "담당 부서: 관할 구청(시청) 위생과 식품위생팀", sub: "정부24 온라인 신청도 가능 (처리 1~3 영업일)" },
                            { text: "준비물: 교육이수증 + 사업자등록증 + 임대차계약서", sub: "시설 평면도, 조리 기구 목록이 필요한 구청도 있음 — 방문 전 전화 확인" },
                            { text: "영업 형태 선택 (중요)", sub: "일반음식점: 주류 판매 가능 / 휴게음식점: 주류 판매 불가 — 맥주·와인 계획이 있으면 반드시 일반음식점" },
                            { text: "처리 기간: 접수 당일~3 영업일", sub: "신고 수리 전 영업 시 영업 정지 또는 과태료" },
                          ] : [
                            { text: "Where: district office health department", sub: "Gov.kr online application also available (1–3 business days)" },
                            { text: "Bring: education cert + business cert + lease", sub: "Some districts also require floor plan and equipment list — call first" },
                            { text: "Choose operating type (critical decision)", sub: "General restaurant: alcohol OK / Snack bar: no alcohol. Must be general restaurant if selling beer/wine." },
                            { text: "Processing time: same day to 3 business days", sub: "Operating before acceptance = potential suspension or fine" },
                          ],
                        },
                      ],
                      traps: ko ? [
                        { label: "위생교육 없이 신고 = 100% 반려", text: "교육이수증은 영업신고의 첫 번째 필수 서류입니다. 신고 방문 전날 교육을 이수하면 이수증을 바로 가져갈 수 있습니다." },
                        { label: "휴게음식점으로 잘못 신고하면 주류 판매 위반", text: "오픈 후 신고 형태 변경이 가능하지만 변경 신고 전 주류를 팔면 식품위생법 위반입니다. 주류 판매 계획이 조금이라도 있으면 처음부터 일반음식점으로 신고하세요." },
                      ] : [
                        { label: "No education cert = 100% rejection", text: "The certificate is the first mandatory document for operating notification. Complete training the day before your district office visit." },
                        { label: "Wrong operating type = alcohol violation", text: "Selling alcohol after registering as a snack bar violates food sanitation law before you can amend the registration. Register as general restaurant from day one if you plan any alcohol sales." },
                      ],
                      links: ko ? [
                        { text: "식품안전나라 — 위생교육 기관 조회", href: "https://www.foodsafetykorea.go.kr" },
                        { text: "정부24 — 음식점 영업신고 온라인 신청", href: "https://www.gov.kr" },
                      ] : [
                        { text: "Food Safety Korea — hygiene education", href: "https://www.foodsafetykorea.go.kr" },
                        { text: "Gov.kr — Restaurant notification (online)", href: "https://www.gov.kr" },
                      ],
                    };

                    const step3Beauty: RegStepData = {
                      sections: [
                        {
                          label: ko ? "면허·시설 기준 사전 확인" : "License & facility requirements",
                          items: ko ? [
                            { text: "미용사 면허 보유자 필수", sub: "대표자 본인 또는 고용 직원 1인 이상 — 면허 없이는 신고 자체 불가" },
                            { text: "복수 서비스 시 면허 분류", sub: "헤어 → 미용사 / 피부관리 → 피부미용사 / 네일 → 네일아트사 자격 각각 필요" },
                            { text: "시설 기준: 세면대·소독기구·조명(150룩스+)", sub: "구청마다 기준이 조금씩 다름 — 방문 전 해당 보건소 전화 확인 필수" },
                            { text: "영업장 도면(약식)", sub: "세면대·시술 의자 위치가 표시된 간략한 스케치도 가능" },
                          ] : [
                            { text: "Licensed cosmetologist required", sub: "Owner's or employee's license — no license means no filing" },
                            { text: "Multiple services = multiple licenses", sub: "Hair → cosmetologist / Skin → esthetician / Nail → nail artist — each required" },
                            { text: "Facility: washbasin, sterilizer, lighting (150 lux+)", sub: "Standards vary by district — call local health center first" },
                            { text: "Floor plan (sketch-level OK)", sub: "Show washbasin and chair positions" },
                          ],
                        },
                        {
                          label: ko ? "보건소·구청 위생과 신고 절차" : "Filing procedure",
                          items: ko ? [
                            { text: "신고 기관: 관할 보건소 또는 구청 위생과", sub: "정부24 온라인 신청도 가능하나 첫 신고는 방문 추천" },
                            { text: "준비물: 미용사 면허증 + 도면 + 사업자등록증 + 임대차계약서", sub: "면허증 복사본 가능, 원본 지참 권장" },
                            { text: "처리 기간: 접수 즉시~당일", sub: "신고 수리증 받은 후 영업 시작 가능" },
                          ] : [
                            { text: "Where: local health center or district hygiene office", sub: "Gov.kr online filing available, but visit recommended for first filing" },
                            { text: "Bring: license + floor plan + business cert + lease", sub: "Copies acceptable, but bring originals just in case" },
                            { text: "Processing: same day", sub: "Can operate after receiving the acceptance notice" },
                          ],
                        },
                      ],
                      traps: ko ? [
                        { label: "면허 없이 영업 = 즉시 폐쇄·형사처벌", text: "미용사 면허 없이 영업하면 즉각 영업 폐쇄 명령이 내려지고 형사처벌 대상이 됩니다. 대표자 면허가 없으면 면허 있는 직원 채용 후 신고하세요." },
                        { label: "구청마다 다른 시설 기준", text: "어떤 구청은 세면대 수, 다른 구청은 독립 탈의 공간을 요구합니다. 인테리어 착공 전에 관할 보건소에 전화로 구체적인 기준을 확인하면 공사 비용 낭비를 막을 수 있습니다." },
                      ] : [
                        { label: "No license = immediate closure + criminal liability", text: "Operating a salon without a licensed cosmetologist triggers immediate closure orders and criminal prosecution. Hire a licensed employee before filing if you lack one." },
                        { label: "Facility standards differ by district", text: "Some districts require specific washbasin counts, others need a separate dressing area. Confirm exact requirements with your local health center before construction." },
                      ],
                      links: ko ? [
                        { text: "보건복지부 — 미용업 신고 안내", href: "https://www.mohw.go.kr" },
                        { text: "정부24 — 미용업 신고 온라인", href: "https://www.gov.kr" },
                      ] : [
                        { text: "MOHW — Cosmetology business guide", href: "https://www.mohw.go.kr" },
                        { text: "Gov.kr — Cosmetology filing (online)", href: "https://www.gov.kr" },
                      ],
                    };

                    const step3Fitness: RegStepData = {
                      sections: [
                        {
                          label: ko ? "신고제 vs 허가제 분기" : "Notification vs permit",
                          items: ko ? [
                            { text: "신고제 (처리 즉시~3일): 일반 헬스장(체력단련장), 수영장(50㎡+), 골프연습장 등", sub: "관할 구청 체육 담당과에 신고서 제출만으로 영업 가능" },
                            { text: "허가제 (처리 2~4주): 무도장 — 태권도·유도·합기도·권투·씨름 등", sub: "허가 심사가 있어 처리 기간이 훨씬 길 수 있음 — 오픈 2개월 전부터 준비" },
                            { text: "시설 기준: 체력단련장 최소 면적 권장 45㎡+", sub: "1인 PT 스튜디오는 소형이어도 가능한 경우 있음 — 관할 구청 사전 확인 필수" },
                          ] : [
                            { text: "Notification (same day–3 days): general gym, pool (50㎡+), golf practice range", sub: "Filing at local sports authority is sufficient" },
                            { text: "Permit required (2–4 weeks): martial arts — taekwondo, judo, boxing, etc.", sub: "Review process takes much longer — start 2 months before planned opening" },
                            { text: "Facility: minimum 45㎡ recommended for fitness centers", sub: "Small PT studios may still qualify — confirm with district office first" },
                          ],
                        },
                        {
                          label: ko ? "신고·허가 절차" : "Filing procedure",
                          items: ko ? [
                            { text: "담당 기관: 관할 시·군·구청 체육 담당과", sub: "문화체육관광부 소관 시설 — 위생과가 아닌 체육 담당 창구 방문" },
                            { text: "준비물: 사업자등록증 + 시설 도면(면적 명시) + 임대차계약서", sub: "허가제는 시설 기준 확인서·안전 관련 서류 추가 필요" },
                            { text: "강사 자격 요건 확인", sub: "생활스포츠지도사 자격증 등 — 종목·규모에 따라 의무 유무 상이, 체육 담당과에 확인" },
                          ] : [
                            { text: "Where: local sports authority (not health department)", sub: "Ministry of Culture, Sports and Tourism oversight — go to the sports division counter" },
                            { text: "Bring: business cert + floor plan (area labeled) + lease", sub: "Permit applications require additional safety and facility standard documents" },
                            { text: "Check instructor qualification requirements", sub: "Sports instructor certificate may be mandatory depending on sport and scale — confirm with district" },
                          ],
                        },
                      ],
                      traps: ko ? [
                        { label: "무도 종목 허가제 — 오픈일 2개월 전 시작해야", text: "태권도·유도·합기도 등 무도 종목은 허가제로, 서류 심사와 현장 검사가 있습니다. 준비가 늦어지면 인테리어 완공 후에도 영업을 못 하는 상황이 생깁니다." },
                        { label: "소형 PT 스튜디오 면적 기준 함정", text: "일부 구청에서 체력단련장 기준으로 최소 면적을 요구합니다. 18~25평 이하 소형 공간이라면 착공 전에 관할 구청에 전화로 영업 가능 여부를 꼭 확인하세요." },
                      ] : [
                        { label: "Martial arts permit — start 2 months before opening", text: "The permit process for martial arts dojangs includes document review and on-site inspection. Late starts can leave you with a finished fit-out and no operating approval." },
                        { label: "Small PT studio area requirement trap", text: "Some districts enforce a minimum floor area for fitness centers. If your space is under 60–80㎡, call the district sports office before construction to confirm operating eligibility." },
                      ],
                      links: ko ? [
                        { text: "문화체육관광부 — 체육시설업 안내", href: "https://www.mcst.go.kr" },
                        { text: "정부24 — 체육시설 신고 온라인", href: "https://www.gov.kr" },
                      ] : [
                        { text: "MCST — Sports facility business guide", href: "https://www.mcst.go.kr" },
                        { text: "Gov.kr — Sports facility filing (online)", href: "https://www.gov.kr" },
                      ],
                    };

                    const step3 = cat === "beauty" ? step3Beauty : cat === "fitness" ? step3Fitness : step3Food;

                    // ── Step 4: 카드가맹·POS·현금영수증 ──────────────────────────
                    const step4: RegStepData = {
                      sections: [
                        {
                          label: ko ? "카드가맹 방법 선택" : "Card merchant registration",
                          items: ko ? [
                            { text: "PG사(결제 대행) — 소규모 창업자 기본 추천", sub: "토스페이먼츠·KCP·나이스페이먼츠 등 / 온라인 신청 3~5 영업일 / 단말기 별도 구매 또는 임대" },
                            { text: "은행 직접 가맹", sub: "신한·국민·하나 등 거래 은행 방문 / 단말기 설치까지 1~2주 / 정산 주기가 PG보다 빠른 경우 있음" },
                            { text: "간편결제 추가 (선택)", sub: "카카오페이·네이버페이·제로페이 — 카드가맹 보완용으로 추가 설정, QR 방식" },
                          ] : [
                            { text: "PG company — recommended for new small businesses", sub: "Toss Payments, KCP, NicePay, etc. / Online application, 3–5 days / Separate terminal purchase or rental" },
                            { text: "Direct bank merchant", sub: "Visit your bank branch / Terminal setup takes 1–2 weeks / Sometimes faster settlement" },
                            { text: "Mobile payment (optional add-on)", sub: "KakaoPay, NaverPay, ZeroPay — supplement card payments, QR-based" },
                          ],
                        },
                        {
                          label: ko ? "현금영수증 가맹 (의무 확인)" : "Cash receipt registration",
                          items: ko ? [
                            { text: "의무 대상: 연 매출 2,400만원 이상 — 음식점·미용실·헬스장 등 포함", sub: "개업 초기에도 예상 매출이 이 기준을 넘으면 의무 등록 대상" },
                            { text: "등록 방법: 홈택스 → 현금영수증 → 가맹점 신청 (무료, 즉시)", sub: "처리 1 영업일 이내" },
                            { text: "소비자 번호 없으면 자진 발급 번호: 010-000-1234", sub: "국세청 지정 번호로 자진 발급하면 의무 이행 인정" },
                          ] : [
                            { text: "Mandatory for: annual revenue ≥ ₩24M — restaurants, salons, gyms included", sub: "Even in the early months, register if you expect to reach this threshold" },
                            { text: "How to register: Hometax → Cash receipt → Merchant application (free, instant)", sub: "Processed within 1 business day" },
                            { text: "If customer has no number: issue to 010-000-1234", sub: "This NTS-designated number counts as voluntary issuance and satisfies the obligation" },
                          ],
                        },
                        {
                          label: ko ? "POS 오픈 전 완성 체크" : "POS pre-opening checklist",
                          items: ko ? [
                            { text: "메뉴·가격 전체 등록 완료", sub: "배달앱 메뉴와 매장 메뉴 일치 여부도 함께 확인" },
                            { text: "영수증 출력 확인: 상호명·사업자번호·부가세 항목 정확한지", sub: "세금계산서 발행 기준 정보가 여기서 나옴" },
                            { text: "실결제 테스트 후 즉시 취소", sub: "오픈 전날 완료 권장 — 테스트 취소 안 하면 정산 오류 발생" },
                            { text: "배달앱 POS 연동 설정 확인", sub: "배민·쿠팡이츠 주문이 POS에 자동 수신되는지 테스트" },
                          ] : [
                            { text: "All menu items and prices entered", sub: "Cross-check delivery app menu vs dine-in menu for consistency" },
                            { text: "Receipt printout check: business name, tax ID, VAT line accurate", sub: "This data is the basis for tax invoice issuance" },
                            { text: "Run a real test transaction and cancel immediately", sub: "Ideally the day before opening — uncanceled test = settlement error" },
                            { text: "Delivery app POS integration test", sub: "Confirm Baemin and Coupang Eats orders arrive automatically in POS" },
                          ],
                        },
                      ],
                      traps: ko ? [
                        { label: "현금영수증 미가맹 = 미발급 금액의 20% 과태료", text: "의무 발급 대상 업종에서 소비자 요청에도 현금영수증을 발급하지 않으면 미발급 금액의 20%가 가산세로 부과됩니다. 개업 당일 홈택스에서 가맹 신청을 완료하세요." },
                        { label: "POS와 카드단말기 호환성 미확인", text: "POS와 카드단말기를 따로 구매하면 연동이 안 되는 경우가 있습니다. 통합 POS 솔루션을 선택하거나 구매 전 반드시 공급사에 호환성을 확인하세요." },
                      ] : [
                        { label: "Unregistered cash receipt merchant: 20% surcharge", text: "Failing to issue a cash receipt despite a customer request triggers a 20% penalty on the unissued amount. Complete the Hometax merchant registration on opening day." },
                        { label: "POS and terminal incompatibility", text: "Buying POS and card terminal from different vendors can result in incompatibility. Choose an integrated POS solution or confirm compatibility with vendors before purchase." },
                      ],
                      links: ko ? [
                        { text: "여신금융협회 — 카드가맹점 신청", href: "https://www.cardsales.or.kr" },
                        { text: "홈택스 — 현금영수증 가맹 신청", href: "https://www.hometax.go.kr" },
                        { text: "토스페이먼츠 — 사업자 가맹 신청", href: "https://www.tosspayments.com" },
                      ] : [
                        { text: "Korea Card Consortium — merchant application", href: "https://www.cardsales.or.kr" },
                        { text: "Hometax — cash receipt merchant", href: "https://www.hometax.go.kr" },
                        { text: "Toss Payments — merchant sign-up", href: "https://www.tosspayments.com" },
                      ],
                    };

                    const stepDataMap: Record<number, RegStepData> = { 1: step1, 2: step2, 3: step3, 4: step4 };
                    const step = stepDataMap[guideStepIndex];
                    if (!step) return null;

                    const sectionLabelStyle = {
                      fontSize: "11px",
                      fontWeight: 700 as const,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase" as const,
                      color: "var(--muted)",
                      marginBottom: "6px",
                    };
                    const itemDotStyle = {
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: "rgba(17,17,17,0.3)", flexShrink: 0, marginTop: "7px",
                    };

                    return (
                      <div style={{ display: "grid", gap: "14px", marginTop: "2px" }}>

                        {/* sections */}
                        {step.sections.map((sec) => (
                          <div key={sec.label}>
                            <div style={sectionLabelStyle}>{sec.label}</div>
                            <div style={{ display: "grid", gap: "7px" }}>
                              {sec.items.map((item) => (
                                <div key={item.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                  <div style={itemDotStyle} />
                                  <div>
                                    <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--primary)", fontWeight: 500 }}>{item.text}</div>
                                    {item.sub && (
                                      <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", marginTop: "1px" }}>{item.sub}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* traps */}
                        {step.traps.length > 0 && (
                          <div style={{ display: "grid", gap: "6px" }}>
                            {step.traps.map((trap) => (
                              <div key={trap.label} style={{ display: "grid", gap: "3px", padding: "11px 13px", borderRadius: "13px", background: "rgba(220,60,30,0.05)", border: "1px solid rgba(200,60,30,0.13)" }}>
                                <div style={{ fontSize: "12px", fontWeight: 640, color: "#b83020" }}>⚠ {trap.label}</div>
                                <div style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--muted)" }}>{trap.text}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* links */}
                        {step.links.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px" }}>
                            {step.links.map((link) => (
                              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--accent)", textDecoration: "none", fontWeight: 500, padding: "6px 12px", borderRadius: "999px", background: "rgba(0,100,220,0.06)", border: "1px solid rgba(0,100,220,0.12)" }}>
                                <span style={{ opacity: 0.7, fontSize: "11px" }}>↗</span>
                                {link.text}
                              </a>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })();


                  return (
                    <div style={styles.guideCard}>
                      {/* pager */}
                      <div style={styles.guidePager}>
                        <span style={styles.guidePagerLabel}>
                          {isOverview
                            ? (language === "ko" ? "개요" : "Overview")
                            : `${guideStepIndex} / ${steps.length}`}
                        </span>
                        <div style={styles.guideDots}>
                          {Array.from({ length: totalSlides }).map((_, i) => (
                            <div
                              key={i}
                              onClick={() => setGuideStepIndex(i)}
                              style={{
                                width: i === guideStepIndex ? "20px" : "6px",
                                height: "6px",
                                borderRadius: "100px",
                                background: i === guideStepIndex ? "var(--primary)" : "rgba(17,17,17,0.15)",
                                cursor: "pointer",
                                transition: "width 0.2s ease"
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {isOverview ? (
                        <>
                          <div style={styles.guideOverline}>
                            {language === "ko" ? "이 단계에서 할 일" : "What to do"}
                          </div>
                          <p style={styles.guideHeadline}>{stageGuideContent.summary}</p>
                          {stageGuideContent.whyNow && (
                            <p style={styles.guideBody}>{stageGuideContent.whyNow}</p>
                          )}
                          {(stageGuideContent.costRange || stageGuideContent.timeEstimate) && (
                            <div style={styles.guideMetaRow}>
                              {stageGuideContent.costRange && (
                                <span style={styles.guideMetaChip}>
                                  {language === "ko" ? "비용 " : "Cost "}{stageGuideContent.costRange}
                                </span>
                              )}
                              {stageGuideContent.timeEstimate && (
                                <span style={styles.guideMetaChip}>
                                  {language === "ko" ? "기간 " : "Time "}{stageGuideContent.timeEstimate}
                                </span>
                              )}
                            </div>
                          )}
                          {stageGuideContent.warnings.map((w, i) => (
                            <div
                              key={i}
                              style={{
                                ...styles.guideWarningItem,
                                background: w.level === "danger"
                                  ? "rgba(220,0,0,0.05)"
                                  : w.level === "info"
                                    ? "rgba(0,100,220,0.05)"
                                    : "rgba(255,160,0,0.07)",
                                color: w.level === "danger" ? "#8a1a1a" : w.level === "info" ? "#1a3a6a" : "#7a5500"
                              }}
                            >
                              {w.text}
                            </div>
                          ))}
                        </>
                      ) : currentStep ? (
                        <>
                          <div style={styles.guideOverline}>
                            {language === "ko" ? `${guideStepIndex}단계` : `Step ${guideStepIndex}`}
                          </div>
                          <div style={styles.guideHeadline}>{currentStep.action}</div>
                          {currentStep.detail && (
                            <p style={styles.guideBody}>{currentStep.detail}</p>
                          )}
                          {currentStep.url && (
                            <a
                              href={currentStep.url}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.guideLinkButton}
                            >
                              {language === "ko" ? "바로가기 →" : "Open →"}
                            </a>
                          )}
                          {currentStep.options && currentStep.options.length > 0 && (() => {
                            const selectionKey = `${currentStage.stageId}_step${guideStepIndex}`;
                            const selected = guideSelections[selectionKey];
                            return (
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, margin: "4px 0 8px" }}>
                                {currentStep.options!.map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setGuideSelections(prev => ({ ...prev, [selectionKey]: opt }))}
                                    style={{
                                      padding: "10px 20px",
                                      borderRadius: "100px",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      border: selected === opt
                                        ? "2px solid var(--primary)"
                                        : "1.5px solid rgba(17,17,17,0.15)",
                                      background: selected === opt
                                        ? "var(--primary)"
                                        : "rgba(255,255,255,0.8)",
                                      color: selected === opt ? "white" : "var(--text)",
                                    }}
                                  >
                                    {selected === opt ? "✓ " : ""}{opt}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                          {currentStep.tip && (
                            <div style={styles.guideTip}>💡 {currentStep.tip}</div>
                          )}
                          {currentStep.cost && (
                            <span style={styles.guideCostBadge}>{currentStep.cost}</span>
                          )}
                        </>
                      ) : null}

                      {vendorEl}
                      {registrationSetupEl}

                      {/* card nav — unified style */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0" }}>
                        <button type="button" disabled={guideStepIndex === 0} onClick={() => setGuideStepIndex(i => Math.max(0, i - 1))} style={{
                          padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.1)",
                          background: guideStepIndex === 0 ? "rgba(0,0,0,0.02)" : "white",
                          color: guideStepIndex === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex === 0 ? "default" : "pointer",
                        }}>
                          ← {language === "ko" ? "이전" : "Prev"}
                        </button>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {Array.from({ length: totalSlides }, (_, i) => (
                            <div key={i} onClick={() => setGuideStepIndex(i)} style={{
                              width: i === guideStepIndex ? "20px" : "8px", height: "8px", borderRadius: "100px",
                              background: i === guideStepIndex ? "#0561fc" : "rgba(0,0,0,0.1)",
                              cursor: "pointer", transition: "all 0.2s ease",
                            }} />
                          ))}
                        </div>
                        <button type="button" disabled={guideStepIndex >= totalSlides - 1} onClick={() => setGuideStepIndex(i => Math.min(totalSlides - 1, i + 1))} style={{
                          padding: "10px 18px", borderRadius: "10px", border: "none",
                          background: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.02)" : "#0561fc",
                          color: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.2)" : "#fff",
                          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex >= totalSlides - 1 ? "default" : "pointer",
                          boxShadow: guideStepIndex >= totalSlides - 1 ? "none" : "0 4px 14px rgba(5,97,252,0.25)",
                        }}>
                          {language === "ko" ? "다음" : "Next"} →
                        </button>
                      </div>
                    </div>
                  );
                })()}


                {/* ── 스토어 및 배송 세팅 가이드 (store_setup) ── */}
                {currentStage.code === "store_setup" && (() => {
                  const ko = language === "ko";
                  // 이전 단계에서 선택한 플랫폼 확인
                  const selectedPlatforms = Object.keys(opsSelections).filter(k => k.startsWith("platform-") && opsSelections[k]).map(k => k.replace("platform-", ""));
                  return (
                    <div style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
                      {/* 선택된 플랫폼 안내 */}
                      {selectedPlatforms.length > 0 && (
                        <div style={{ padding: "12px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)", display: "flex", gap: "8px", alignItems: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#2563eb" strokeWidth="1.4"/><path d="M4.5 7l2 2 3-3" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb" }}>
                            {ko ? `이전 단계에서 선택한 플랫폼: ${selectedPlatforms.length}개 — 아래에서 각 플랫폼의 세부 설정을 완료하세요` : `${selectedPlatforms.length} platforms selected — complete setup for each below`}
                          </span>
                        </div>
                      )}
                      {/* 플랫폼별 스토어 세팅 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "플랫폼별 스토어 세팅" : "Platform Store Setup"}</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "각 플랫폼의 필수 설정 항목을 빠짐없이 완료하세요" : "Complete all required settings for each platform"}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gap: "10px" }}>
                          {[
                            {
                              name: ko ? "네이버 스마트스토어" : "Naver Smartstore",
                              color: "#03C75A", url: "https://sell.smartstore.naver.com",
                              steps: ko ? [
                                "스마트스토어 센터 → 판매자 정보 등록 (사업자등록증 + 통신판매업 신고증)",
                                "스토어 기본 설정: 스토어명, 로고, 대표 이미지, 소개글",
                                "배송 템플릿 설정: 배송비 (무료/조건부/유료), 출고지, 반품지 주소",
                                "교환/반품 정책 작성 (7일 이내 교환/반품, 왕복 택배비 5,000원 등)",
                                "정산 계좌 등록 (법인/개인 계좌 + 세금계산서 발행 설정)",
                                "쇼핑윈도 카테고리 신청 (의류, 식품 등 카테고리별 추가 심사 필요)",
                              ] : [
                                "Register seller info (business registration + telecom filing)",
                                "Store basics: name, logo, cover image, description",
                                "Shipping template: fee policy, warehouse address, return address",
                                "Return/exchange policy (7 days, round-trip ₩5,000, etc.)",
                                "Settlement account registration",
                                "Shopping Window category application if needed",
                              ],
                            },
                            {
                              name: ko ? "쿠팡 마켓플레이스" : "Coupang Marketplace",
                              color: "#1460F3", url: "https://wing.coupang.com",
                              steps: ko ? [
                                "WING 판매자 센터 가입 → 사업자 인증",
                                "상품 등록: 카테고리 선택 → 필수 옵션 입력 (사이즈, 색상 등)",
                                "로켓그로스 입점 검토 (월 55,000원 + 수수료 4~10.8%)",
                                "배송 설정: 일반 배송 vs 로켓그로스 (쿠팡 물류센터 입고)",
                                "로켓그로스 입고 시: 바코드 부착 → 쿠팡 물류센터 택배 발송",
                                "정산 주기 확인: 구매확정 후 영업일 기준 정산 (보통 7~14일)",
                              ] : [
                                "Register on WING Seller Center",
                                "Product listing: category → required options (size, color)",
                                "Rocket Growth enrollment (₩55K/mo + 4~10.8% commission)",
                                "Shipping: standard vs Rocket Growth (Coupang warehouse)",
                                "Rocket Growth: barcode labeling → ship to Coupang warehouse",
                                "Settlement cycle: ~7-14 business days after purchase confirmation",
                              ],
                            },
                            {
                              name: ko ? "11번가" : "11st",
                              color: "#FF0000", url: "https://soffice.11st.co.kr",
                              steps: ko ? [
                                "셀러오피스 가입 → 신규 셀러 수수료 6% 혜택 (12개월)",
                                "상품 등록: 카탈로그 매칭 (기존 상품) 또는 신규 등록",
                                "배송 설정: 기본 배송비 + 도서산간 추가 배송비 설정",
                                "SKT 멤버십 연동 설정 (T멤버십 적립/사용 활성화)",
                                "아마존 글로벌셀링 연동 (해외 판매 시)",
                              ] : [
                                "Register on Seller Office → 6% new seller discount (12 months)",
                                "Product listing: catalog matching or new registration",
                                "Shipping config: base fee + island surcharge",
                                "SKT membership integration",
                                "Amazon global selling integration (for international)",
                              ],
                            },
                          ].map(platform => (
                            <div key={platform.name} style={{ borderRadius: "16px", border: `1px solid ${platform.color}10`, background: `${platform.color}02`, overflow: "hidden" }}>
                              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: platform.name.includes("쿠팡") || platform.name.includes("Coupang") ? platform.color : `${platform.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 750, color: platform.name.includes("쿠팡") || platform.name.includes("Coupang") ? "#fff" : platform.color }}>{platform.name.charAt(0)}</span>
                                  </div>
                                  <span style={{ fontSize: "15px", fontWeight: 660, color: "#0f172a" }}>{platform.name}</span>
                                </div>
                                <a href={platform.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ padding: "5px 12px", borderRadius: "8px", background: platform.color, color: "#fff", fontSize: "11px", fontWeight: 650, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                  {ko ? "바로가기" : "Go"} <svg width="10" height="10" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </a>
                              </div>
                              <div style={{ padding: "0 16px 14px" }}>
                                {platform.steps.map((step, i) => (
                                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "6px 0", borderBottom: i < platform.steps.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none" }}>
                                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: `${platform.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: platform.color, flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
                                    <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 택배사 계약 가이드 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "택배 계약 가이드" : "Courier Contract Guide"}</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "초기에는 우체국택배 → 물량 늘면 계약택배로 전환" : "Start with post office → switch to contract when volume grows"}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {[
                            { name: ko ? "우체국택배 (시작)" : "Korea Post (start)", price: "2,700원~/건", color: "#004098", desc: ko ? "도서산간 추가 없음. 소량에 최적. 우체국 직접 접수" : "No island surcharge. Best for small volume", tag: ko ? "추천: 일 1-5건" : "Rec: 1-5/day", url: "https://parcel.epost.go.kr" },
                            { name: "CJ대한통운", price: "1,850원~/건 (계약)", color: "#003C71", desc: ko ? "점유율 1위. D+1 배송. 편의점 접수. 물량 30건+/월 시 계약 가능" : "#1 courier. D+1. Convenience store pickup", tag: ko ? "추천: 일 5건+" : "Rec: 5+/day", url: "https://www.cjlogistics.com" },
                            { name: ko ? "한진택배" : "Hanjin", price: "3,000원~/건 (계약)", color: "#FF6600", desc: ko ? "중대형 화물 강점. 전국 A/S망" : "Good for mid-large items", tag: ko ? "대형 상품" : "Large items", url: "https://www.hanjin.co.kr" },
                            { name: ko ? "로젠택배" : "Logen", price: "3,000원~/건 (계약)", color: "#2B4C9B", desc: ko ? "계약 할인폭 큰 편. 온라인 접수 편리" : "Good contract discounts", tag: ko ? "가격 협상" : "Negotiate", url: "https://www.ilogen.com" },
                          ].map(c => (
                            <div key={c.name} style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${c.color}10`, background: `${c.color}03` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 660, color: "#0f172a" }}>{c.name}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ fontSize: "10px", fontWeight: 650, padding: "2px 6px", borderRadius: "4px", background: `${c.color}0a`, color: c.color }}>{c.tag}</span>
                                  <a href={c.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ width: "22px", height: "22px", borderRadius: "6px", background: `${c.color}0a`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                                    <svg width="10" height="10" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke={c.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </a>
                                </div>
                              </div>
                              <div style={{ fontSize: "15px", fontWeight: 740, color: c.color, marginBottom: "4px" }}>{c.price}</div>
                              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{c.desc}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ margin: "0 22px 18px", padding: "12px 14px", borderRadius: "12px", background: "rgba(217,119,6,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#d97706" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          <span style={{ fontSize: "12px", color: "rgba(180,95,6,0.8)", lineHeight: 1.55 }}>
                            {ko ? "택배비 협상 팁: 월 30건 이상이면 계약택배 요청 가능. CJ대한통운 1588-1255로 전화하여 '온라인 셀러 계약 택배' 문의하세요. 초기 단가 2,500~3,000원 가능." : "Negotiate tip: CJ Logistics offers contract rates at 30+ shipments/month. Call 1588-1255 for 'online seller contract'. Starting rate ₩2,500-3,000."}
                          </span>
                        </div>
                      </div>

                      {/* 필수 설정 체크리스트 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
                        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", marginBottom: "10px" }}>{ko ? "오픈 전 필수 확인 사항" : "Pre-launch Checklist"}</div>
                        <div style={{ display: "grid", gap: "6px" }}>
                          {(ko ? [
                            { item: "교환/반품 정책을 스토어에 등록했는가?", why: "미등록 시 고객 분쟁 + 플랫폼 패널티" },
                            { item: "배송비 정책이 설정되었는가? (무료/조건부/유료)", why: "배송비 무료 설정 시 상품가에 포함해야 마진 유지" },
                            { item: "정산 계좌가 등록되었는가?", why: "미등록 시 매출금 수령 불가" },
                            { item: "사업자 정보가 정확히 입력되었는가?", why: "사업자등록증과 불일치 시 정산 보류" },
                            { item: "테스트 주문을 해봤는가?", why: "실제 결제→배송→정산 전 과정 1회 테스트 필수" },
                            { item: "고객 문의 응대 채널이 준비되었는가?", why: "채널톡/카카오톡 상담 연동. 24시간 내 응답이 판매자 등급에 영향" },
                          ] : [
                            { item: "Return/exchange policy registered?", why: "No policy = disputes + platform penalties" },
                            { item: "Shipping fee policy set?", why: "Free shipping must be included in product price" },
                            { item: "Settlement account registered?", why: "No account = cannot receive sales revenue" },
                            { item: "Business info matches registration?", why: "Mismatch = settlement hold" },
                            { item: "Test order completed?", why: "Test payment → shipping → settlement flow once" },
                            { item: "Customer inquiry channel ready?", why: "Channel Talk/KakaoTalk. Response within 24h affects seller grade" },
                          ]).map((check, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 10px", borderRadius: "10px", background: "rgba(5,150,105,0.02)" }}>
                              <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "1.5px solid rgba(5,150,105,0.3)", flexShrink: 0, marginTop: "1px" }} />
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{check.item}</div>
                                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", lineHeight: 1.4 }}>{check.why}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 통합 관리 솔루션 팁 */}
                      <div style={{ borderRadius: "16px", padding: "16px 18px", background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.06)" }}>
                        <div style={{ fontSize: "13px", fontWeight: 660, color: "#7c3aed", marginBottom: "6px" }}>{ko ? "멀티 플랫폼 운영 팁" : "Multi-platform Tip"}</div>
                        <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
                          {ko ? "2개 이상 플랫폼 동시 운영 시 재고·주문 통합 관리 솔루션을 사용하세요. 샵링커(shoplinker.co.kr), 올라(allra.co.kr), 셀러허브(sellerhub.co.kr) 등이 주문 수집 + 재고 연동 + 송장 일괄 처리를 지원합니다. 월 3~5만원으로 실수를 줄이고 시간을 절약할 수 있습니다." : "For 2+ platforms, use an order management solution like Shoplinker, Allra, or SellerHub. They sync inventory, collect orders, and batch process invoices. ₩30-50K/month saves time and reduces errors."}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 상품 소싱 가이드 (sourcing_setup) ── */}
                {currentStage.code === "sourcing_setup" && (() => {
                  const ko = language === "ko";
                  const sourcingMethods = [
                    { name: ko ? "국내 도매" : "Domestic Wholesale", capital: ko ? "50~300만원" : "₩500K~3M", color: "#2563eb", pros: ko ? "빠른 배송, 소량 가능" : "Fast shipping, small MOQ", cons: ko ? "마진 낮음, 경쟁 심함" : "Low margin, high competition", platforms: "도매꾹, 온채널, 도매매" },
                    { name: ko ? "해외 직구 (중국)" : "China Import", capital: ko ? "100~500만원" : "₩1M~5M", color: "#d97706", pros: ko ? "원가 최저, 다양한 상품" : "Lowest cost, wide selection", cons: ko ? "배송 2-4주, 품질 관리 어려움" : "2-4 week shipping, QC hard", platforms: "1688.com, 알리바바" },
                    { name: ko ? "OEM/ODM 제작" : "OEM/ODM", capital: ko ? "500~3,000만원" : "₩5M~30M", color: "#7c3aed", pros: ko ? "브랜드 구축 가능, 차별화" : "Brand building, differentiation", cons: ko ? "초기 투자 큼, MOQ 높음" : "High initial cost, high MOQ", platforms: "캐파(CAPA), 바로발주" },
                    { name: ko ? "위탁판매" : "Consignment", capital: ko ? "0~50만원" : "₩0~500K", color: "#059669", pros: ko ? "재고 부담 없음, 초기 비용 최소" : "No inventory risk, minimal cost", cons: ko ? "마진 10-20%, 품질 통제 불가" : "10-20% margin, no QC", platforms: "도매리스트, 셀러나우" },
                  ];

                  return (
                    <div style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
                      {/* 소싱 방법 비교 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "소싱 방법 비교" : "Sourcing Methods"}</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "예산과 목표에 맞는 방법을 선택하세요" : "Choose based on your budget and goals"}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {sourcingMethods.map(m => (
                            <div key={m.name} style={{ padding: "14px", borderRadius: "14px", border: `1px solid ${m.color}10`, background: `${m.color}03` }}>
                              <div style={{ fontSize: "14px", fontWeight: 660, color: m.color, marginBottom: "4px" }}>{m.name}</div>
                              <div style={{ fontSize: "12px", fontWeight: 650, color: "#0f172a", marginBottom: "6px" }}>{ko ? "초기 자본" : "Capital"}: {m.capital}</div>
                              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginBottom: "4px" }}>
                                <span style={{ color: "#059669" }}>+</span> {m.pros}
                              </div>
                              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginBottom: "6px" }}>
                                <span style={{ color: "#dc2626" }}>−</span> {m.cons}
                              </div>
                              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.35)" }}>{m.platforms}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 상세페이지 작성 가이드 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 22px 14px" }}>
                          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "상세페이지 구성 순서" : "Detail Page Structure"}</div>
                          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "전환율을 높이는 검증된 구성" : "Proven structure for higher conversion"}</div>
                        </div>
                        <div style={{ padding: "0 22px 16px" }}>
                          {(ko ? [
                            { step: "1", title: "히어로 이미지", detail: "배경 제거한 깔끔한 메인 컷. 3초 안에 매력 전달", color: "#dc2626" },
                            { step: "2", title: "고객 불안 해소", detail: "교환/반품 정책, 인증 마크, 리뷰 수 강조", color: "#d97706" },
                            { step: "3", title: "상세 스펙 표", detail: "소재, 사이즈, 중량 — 표로 정리. 비교가 쉬워야 구매", color: "#2563eb" },
                            { step: "4", title: "라이프스타일 컷", detail: "실사용 장면. '내가 쓰면 이렇게 되겠구나' 상상 유도", color: "#059669" },
                            { step: "5", title: "리뷰/후기 섹션", detail: "구매자 97.2%가 리뷰 확인. 포토 리뷰가 전환율 3배", color: "#7c3aed" },
                            { step: "6", title: "배송/CS 안내", detail: "배송 소요일, 교환/반품 절차, 고객센터 연락처", color: "#6366f1" },
                          ] : [
                            { step: "1", title: "Hero Image", detail: "Clean main shot. Convey appeal in 3 seconds", color: "#dc2626" },
                            { step: "2", title: "Trust Signals", detail: "Return policy, certifications, review count", color: "#d97706" },
                            { step: "3", title: "Spec Table", detail: "Material, size, weight in a table format", color: "#2563eb" },
                            { step: "4", title: "Lifestyle Shot", detail: "Real usage scenes. Help buyer imagine", color: "#059669" },
                            { step: "5", title: "Reviews", detail: "97.2% check reviews. Photo reviews 3x conversion", color: "#7c3aed" },
                            { step: "6", title: "Shipping/CS", detail: "Delivery time, return process, contact", color: "#6366f1" },
                          ]).map(s => (
                            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "6" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
                                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* AI 도구 추천 */}
                        <div style={{ margin: "0 22px 18px", padding: "12px 14px", borderRadius: "12px", background: "rgba(124,58,237,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          <span style={{ fontSize: "12px", color: "rgba(124,58,237,0.8)", lineHeight: 1.55 }}>
                            {ko ? "AI 상세페이지 도구: 망고보드 AI 디자이너 (mangoboard.net), 미리캔버스 (miricanvas.com), Canva AI. 상품 사진만 넣으면 상세페이지를 자동 생성합니다." : "AI detail page tools: Mangoboard AI, Miricanvas, Canva AI — auto-generate from product photos."}
                          </span>
                        </div>
                      </div>

                      {/* 상품 촬영 팁 */}
                      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "18px 22px" }}>
                        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", marginBottom: "8px" }}>{ko ? "상품 촬영 — 스마트폰으로 충분합니다" : "Product Photos — Smartphone is enough"}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {[
                            { label: ko ? "필수 장비" : "Essential", items: ko ? "스마트폰 + 삼각대(1만원) + 화이트 배경지(5천원)" : "Phone + tripod + white backdrop" },
                            { label: ko ? "조명" : "Lighting", items: ko ? "자연광 최고. 창가에서 촬영. 흐린 날이 최적 (그림자 없음)" : "Natural light best. Overcast = no shadows" },
                            { label: ko ? "각도" : "Angles", items: ko ? "정면 + 45도 + 위에서 + 사용 중 최소 4컷" : "Front + 45° + top + in-use, min 4 shots" },
                            { label: ko ? "후보정" : "Editing", items: ko ? "배경 제거: remove.bg (무료). 보정: Lightroom 무료" : "BG remove: remove.bg. Edit: Lightroom free" },
                          ].map(t => (
                            <div key={t.label} style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(5,150,105,0.03)" }}>
                              <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "3px" }}>{t.label}</div>
                              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.4 }}>{t.items}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 채용 비용 계산기 ── */}
                {currentStage.code === "hiring_setup" && (
                  <div style={{ marginBottom: "16px" }}>
                    <HiringCostCalculator ko={language === "ko"} industryCategoryId={industryCategoryId} />
                  </div>
                )}

                {/* ── 보안 체크리스트 ── */}
                {currentStage.code === "company_setup" && (
                  <div style={{ marginBottom: "16px" }}>
                    <SecurityChecklist
                      ko={language === "ko"}
                      checks={softOpenChecks as Record<string, boolean>}
                      onToggle={(id) => {
                        const prev = softOpenChecks as Record<string, boolean>;
                        const next = { ...prev, [id]: !prev[id] };
                        d.setSoftOpenChecks(next as never);
                      }}
                    />
                  </div>
                )}

                {/* ── 투자 용어 사전 ── */}
                {currentStage.code === "fundraising_readiness" && (
                  <div style={{ marginBottom: "16px" }}>
                    <InvestmentGlossary ko={language === "ko"} />
                  </div>
                )}

                {currentStage.code === "hiring_setup" && (() => {
                  const ko = language === "ko";
                  const totalSlides = 4;
                  const isOverview = guideStepIndex === 0;

                  // ── 공통 스타일 ──
                  const secLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "6px" };
                  const dot: React.CSSProperties = { width: "5px", height: "5px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", flexShrink: 0, marginTop: "6px" };
                  type HItem = { text: string; sub?: string };
                  type HSec = { label: string; items: HItem[] };
                  type HTrap = { label: string; text: string };
                  type HLink = { text: string; href: string; icon?: string; color?: string; desc?: string };
                  type HStep = { headline: string; sections: HSec[]; traps: HTrap[]; links: HLink[] };

                  const steps: HStep[] = [
                    {
                      headline: ko ? "채용 계획 & 공고" : "Staffing plan & job posting",
                      sections: [
                        { label: ko ? "인력 필요 여부 판단" : "Assess staffing needs", items: ko ? [
                          { text: "혼자 가능한 업무량인지 먼저 계산", sub: "피크 타임(점심·저녁) 기준 손님 수 × 처리 시간으로 인원 추정" },
                          { text: "알바 vs 정직원 기준", sub: "주 15시간 미만 → 단기 알바 / 15시간 이상 → 주휴수당 발생 / 40시간 → 정직원 고려" },
                          { text: "초기 권장: 1~2명 알바로 시작", sub: "오픈 초기는 매출 예측이 불확실 — 파트타임으로 유연하게 시작" },
                        ] : [
                          { text: "Calculate your own capacity first", sub: "Peak-time customers × processing time = estimated headcount" },
                          { text: "Part-time vs full-time criteria", sub: "Under 15h/week → short-term / 15h+ → weekly holiday pay kicks in / 40h → consider full-time" },
                          { text: "Recommendation: start with 1–2 part-timers", sub: "Revenue is unpredictable early — stay flexible" },
                        ]},
                        { label: ko ? "채용 공고 플랫폼" : "Where to post", items: ko ? [
                          { text: "알바몬 — 단기·파트타임 전문, 소상공인 무료 공고", sub: "지역·시간대·업종 필터 / 24시간 내 지원자 다수" },
                          { text: "알바천국 — 소규모 매장 최다 이용", sub: "음식점·카페 등록 많음 / 스마트폰 간편 등록 / 네이버 검색 연동" },
                          { text: "당근마켓 '동네 알바' — 지역 주민 즉시 매칭", sub: "무료 / 출퇴근 거리 짧은 알바 선호 시 유리" },
                          { text: "사람인 — 정직원 채용 시 활용", sub: "이력서 기반 / 경력직·장기 고용에 적합" },
                        ] : [
                          { text: "Albamon — part-time specialist", sub: "Free for small owners / Applicants within 24h" },
                          { text: "Albachunguk — most used by small stores", sub: "Popular for restaurants & cafes / Easy mobile posting" },
                          { text: "Karrot 'Local Jobs' — instant local match", sub: "Free / Best for short-commute hires" },
                          { text: "Saramin — best for full-time hiring", sub: "Resume-based / Suitable for experienced, long-term hires" },
                        ]},
                      ],
                      traps: ko ? [
                        { label: "공고에 '최저시급 적용'만 쓰면 지원자가 없다", text: "시급·근무 시간·요일·식사 제공 여부를 구체적으로 써야 지원률이 3배 이상 높아집니다." },
                        { label: "오픈 직전 채용은 위험", text: "교육·적응 기간 없이 오픈 당일부터 일하면 실수가 많습니다. 최소 1~2주 전 채용 권장." },
                      ] : [
                        { label: "Vague wage listings kill applicants", text: "Specify hourly rate, schedule, days, meals — response rates triple with clear details." },
                        { label: "Last-minute hiring before opening is risky", text: "No training before opening day = errors and high turnover. Hire at least 1–2 weeks early." },
                      ],
                      links: ko ? [
                        { text: "알바몬", href: "https://www.albamon.com", icon: "알", color: "#ff6b35", desc: "단기·파트타임 전문, 소상공인 무료 공고" },
                        { text: "알바천국", href: "https://www.alba.co.kr", icon: "천", color: "#ff3b6b", desc: "소규모 매장 최다 이용, 스마트폰 간편 등록" },
                        { text: "당근 동네알바", href: "https://www.daangn.com", icon: "당", color: "#ff6f00", desc: "지역 주민 즉시 매칭, 무료" },
                        { text: "사람인", href: "https://www.saramin.co.kr", icon: "사", color: "#3d7eff", desc: "정직원 채용 시 활용, 이력서 기반" },
                      ] : [
                        { text: "Albamon", href: "https://www.albamon.com", icon: "알", color: "#ff6b35", desc: "Part-time specialist, free for small owners" },
                        { text: "Albachunguk", href: "https://www.alba.co.kr", icon: "천", color: "#ff3b6b", desc: "Most used by small stores, easy mobile posting" },
                        { text: "Karrot Local Jobs", href: "https://www.daangn.com", icon: "당", color: "#ff6f00", desc: "Instant local match, free" },
                        { text: "Saramin", href: "https://www.saramin.co.kr", icon: "사", color: "#3d7eff", desc: "Best for full-time hiring, resume-based" },
                      ],
                    },
                    {
                      headline: ko ? "근로계약서 & 시급 책정" : "Employment contract & wages",
                      sections: [
                        { label: ko ? "근로계약서 필수 기재 항목" : "Mandatory contract items", items: ko ? [
                          { text: "임금 — 시급 또는 월급, 지급일, 지급 방법 명시", sub: "구두 약속 금지 / 미명시 시 법적 분쟁 위험" },
                          { text: "근무 시간·요일 (시작~종료 시각, 휴게 시간 포함)", sub: "4시간 이상 근무 → 30분 이상 휴게 의무 / 8시간 이상 → 1시간 이상" },
                          { text: "업무 내용·근무 장소·계약 기간 (기간제 vs 무기 구분)", sub: "무기 계약은 해고 절차가 더 엄격 — 신중히 결정" },
                          { text: "계약서 2부 작성 → 1부는 반드시 직원에게 교부", sub: "미교부 시 500만원 이하 과태료 발생" },
                        ] : [
                          { text: "Wages — hourly/monthly rate, payment date and method", sub: "No verbal-only agreements / Unspecified payment date = legal risk" },
                          { text: "Work hours and days (start–end time, break time)", sub: "4h+ shift → 30 min break / 8h+ → 1 hour break" },
                          { text: "Job scope, workplace, contract term (fixed vs indefinite)", sub: "Indefinite contracts require stricter dismissal procedures" },
                          { text: "Two copies — one must be given to the employee", sub: "Failing to provide = fine up to ₩5M" },
                        ]},
                        { label: ko ? "2026년 시급 기준" : "2026 wage reference", items: ko ? [
                          { text: "최저시급 10,030원 (2026년 기준)", sub: "주 40시간 × 4.35주 = 월 209시간 → 월 2,096,270원 이상" },
                          { text: "수습기간 90% 감액 적용 조건", sub: "1년 이상 계약 + 수습 3개월 이내에만 가능 / 단순 노무직 제외" },
                          { text: "주휴수당: 주 15시간 이상 개근 시 1일치 임금 추가 지급", sub: "예: 10,030원 × 8시간 = 주휴수당 80,240원 / 포함 여부 계약서에 명시" },
                        ] : [
                          { text: "Minimum wage: ₩10,030/hour (2026)", sub: "40h/week × 4.35 weeks = 209h/month → ≥₩2,096,270/month" },
                          { text: "Probation reduction to 90% only if:", sub: "Contract is 1y+ AND within first 3 months / Excludes simple manual tasks" },
                          { text: "Weekly holiday pay: 1 extra day's wage if worked 15h+/week", sub: "₩10,030 × 8h = ₩80,240 / State clearly if included in hourly rate" },
                        ]},
                      ],
                      traps: ko ? [
                        { label: "수습기간 10% 깎으면 무조건 합법 아님", text: "1년 미만 계약이거나 단순 반복 업무(청소·접시닦기 등)에는 감액 적용 불가. 잘못 적용 시 차액 소급 지급 + 과태료." },
                        { label: "주휴수당 모르는 사장님이 많음", text: "주 15시간 이상 알바에게 주휴수당 미지급 시 임금 체불로 노동청 신고 대상." },
                      ] : [
                        { label: "Probation wage cut isn't always legal", text: "Only valid for 1y+ contracts, not simple manual tasks. Wrong application = back-pay + fine." },
                        { label: "Many owners overlook weekly holiday pay", text: "Skipping it for 15h+ workers = wage theft. Clarify in the contract." },
                      ],
                      links: ko ? [
                        { text: "고용노동부 표준계약서", href: "https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20201200455", icon: "고", color: "#34c759", desc: "공식 근로계약서 무료 다운로드" },
                        { text: "최저임금위원회", href: "https://www.minimumwage.go.kr", icon: "최", color: "#30b0c7", desc: "2026년 최저임금 10,030원 · 모의 계산기" },
                        { text: "노동OK", href: "https://www.nodongok.com", icon: "노", color: "#af52de", desc: "노동부 공식 무료 노무 상담 포털" },
                      ] : [
                        { text: "MOL Standard Contract", href: "https://www.moel.go.kr", icon: "고", color: "#34c759", desc: "Official template, free download" },
                        { text: "Minimum Wage Commission", href: "https://www.minimumwage.go.kr", icon: "최", color: "#30b0c7", desc: "2026 minimum wage ₩10,030 · simulator" },
                        { text: "NodongOK", href: "https://www.nodongok.com", icon: "노", color: "#af52de", desc: "Official free labor consulting portal" },
                      ],
                    },
                    {
                      headline: ko ? "4대보험 & 원천세" : "Social insurance & payroll tax",
                      sections: [
                        { label: ko ? "4대보험 신고 절차" : "Social insurance filing", items: ko ? [
                          { text: "국민연금·건강보험 — 채용일로부터 14일 이내 취득 신고", sub: "국민건강보험공단 EDI 또는 4insure.or.kr 통합 신고 / 사업주·근로자 각 50% 부담" },
                          { text: "고용보험·산재보험 — 근로복지공단에 신고", sub: "고용보험: 사업주+근로자 공동 부담 / 산재보험: 사업주 100% 부담" },
                          { text: "월 보험료 개략 (월급 2,096,270원 기준)", sub: "국민연금 약 94,300원 + 건강보험 약 74,700원 + 고용보험 약 18,900원 = 사업주 부담 합계 약 19만원" },
                          { text: "4대보험 정보연계센터에서 한 번에 통합 신고 가능", sub: "www.4insure.or.kr / 최초 신고 후 변경도 동일 경로" },
                        ] : [
                          { text: "Pension & Health Insurance — report within 14 days of hire", sub: "File at nhis.or.kr or 4insure.or.kr / Employer and employee each pay 50%" },
                          { text: "Employment & Workers' Comp — file with KWCWS", sub: "Employment: shared / Workers' comp: 100% employer burden" },
                          { text: "Monthly premium estimate (₩2,096,270 base)", sub: "Pension ≈₩94K + Health ≈₩75K + Employment ≈₩19K = employer share ≈₩190K" },
                          { text: "Integrated filing at 4insure.or.kr", sub: "File all 4 at once / Same portal for changes" },
                        ]},
                        { label: ko ? "원천세 (급여 세금 처리)" : "Payroll tax withholding", items: ko ? [
                          { text: "근로소득 원천세: 매월 급여 지급 시 세액 공제 후 지급", sub: "국세청 간이세액표 기준 / 다음 달 10일까지 홈택스 납부 의무" },
                          { text: "일용직 알바: 일당 150,000원 이하 비과세 (2026년 기준)", sub: "15만원 초과분에만 세금 / 3개월 이상 고용 시 일용직 아님 → 근로소득세 적용" },
                          { text: "연말정산: 다음 해 2월 근로자 대신 처리 의무", sub: "소규모 사업자도 예외 없음 / 세무사 선임 시 대부분 위임 가능" },
                        ] : [
                          { text: "Withhold income tax from each paycheck", sub: "Based on NTS simplified tax table / Pay via Hometax by 10th of following month" },
                          { text: "Daily workers: tax-exempt if daily wage ≤₩150,000", sub: "3+ months = no longer 'daily' → income tax applies" },
                          { text: "Year-end settlement: reconcile in February on employees' behalf", sub: "No exceptions for small businesses / CPA handles this if you have one" },
                        ]},
                      ],
                      traps: ko ? [
                        { label: "5인 미만 사업장도 4대보험 의무", text: "1인 고용 시에도 신고 의무가 있습니다. 위반 시 소급 납부 + 가산세가 붙습니다." },
                        { label: "현금 급여 후 신고 누락은 세무조사 리스크", text: "국세청 카드 매출 분석(PCI)으로 비용 처리 여부 추적 가능. 미신고 시 나중에 더 큰 문제가 생깁니다." },
                      ] : [
                        { label: "Social insurance mandatory even for 1 employee", text: "Required from the very first hire. Violations = back payment + penalties." },
                        { label: "Cash wages without reporting = audit risk", text: "NTS tracks unreported labor costs via PCI analysis." },
                      ],
                      links: ko ? [
                        { text: "4대보험 정보연계센터", href: "https://www.4insure.or.kr", icon: "4대", color: "#007aff", desc: "국민연금·건강보험·고용·산재 통합 신고" },
                        { text: "홈택스", href: "https://www.hometax.go.kr", icon: "홈", color: "#5856d6", desc: "원천세 신고·납부, 사업자 등록 확인" },
                        { text: "국민건강보험공단", href: "https://www.nhis.or.kr", icon: "건", color: "#ff9f0a", desc: "직원 보험료 조회·납부" },
                      ] : [
                        { text: "Social Insurance Portal", href: "https://www.4insure.or.kr", icon: "4대", color: "#007aff", desc: "File all 4 social insurances at once" },
                        { text: "Hometax", href: "https://www.hometax.go.kr", icon: "홈", color: "#5856d6", desc: "Withholding tax filing and business registration" },
                        { text: "NHIS", href: "https://www.nhis.or.kr", icon: "건", color: "#ff9f0a", desc: "Employee premium lookup and payment" },
                      ],
                    },
                  ];

                  const currentStep = isOverview ? null : steps[guideStepIndex - 1];

                  return (
                    <div style={styles.guideCard}>
                      {/* 페이저 */}
                      <div style={styles.guidePager}>
                        <span style={styles.guidePagerLabel}>
                          {isOverview ? (ko ? "개요" : "Overview") : `${guideStepIndex} / ${steps.length}`}
                        </span>
                        <div style={styles.guideDots}>
                          {Array.from({ length: totalSlides }).map((_, i) => (
                            <div key={i} onClick={() => setGuideStepIndex(i)} style={{
                              width: i === guideStepIndex ? "20px" : "6px",
                              height: "6px", borderRadius: "100px",
                              background: i === guideStepIndex ? "var(--primary)" : "rgba(17,17,17,0.15)",
                              cursor: "pointer", transition: "width 0.2s ease",
                            }} />
                          ))}
                        </div>
                      </div>

                      {isOverview ? (
                        <>
                          <div style={styles.guideOverline}>{ko ? "이 단계에서 할 일" : "What to do in this stage"}</div>
                          <div style={styles.guideHeadline}>{ko ? "직원·알바 채용부터 법적 절차까지" : "From hiring to legal compliance"}</div>
                          <p style={styles.guideBody}>
                            {ko
                              ? "처음 직원을 뽑는 사장님들이 가장 많이 실수하는 단계입니다. 어디서 구하는지, 계약서는 어떻게 쓰는지, 4대보험은 어떻게 처리하는지 — 모든 것을 이 단계에서 해결하세요."
                              : "This is where first-time owners make the most mistakes. Where to find staff, how to write contracts, how to handle insurance — solve it all here."}
                          </p>
                        </>
                      ) : currentStep ? (
                        <>
                          <div style={styles.guideOverline}>{ko ? `${guideStepIndex}단계` : `Step ${guideStepIndex}`}</div>
                          <div style={styles.guideHeadline}>{currentStep.headline}</div>
                          {/* sections */}
                          <div style={{ display: "grid", gap: "14px" }}>
                            {currentStep.sections.map((sec) => (
                              <div key={sec.label} style={{ display: "grid", gap: "10px" }}>
                                <div style={secLabel}>{sec.label}</div>
                                <div style={{ display: "grid", gap: "7px" }}>
                                  {sec.items.map((item) => (
                                    <div key={item.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                      <div style={dot} />
                                      <div>
                                        <div style={{ fontSize: "13px", lineHeight: 1.5, fontWeight: 500 }}>{item.text}</div>
                                        {item.sub && <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", marginTop: "1px" }}>{item.sub}</div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* traps */}
                          {currentStep.traps.length > 0 && (
                            <div style={{ display: "grid", gap: "6px", marginTop: "4px" }}>
                              {currentStep.traps.map((trap) => (
                                <div key={trap.label} style={{ padding: "11px 13px", borderRadius: "13px", background: "rgba(220,60,30,0.05)", border: "1px solid rgba(200,60,30,0.13)" }}>
                                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#b83020", marginBottom: "3px" }}>⚠ {trap.label}</div>
                                  <div style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--muted)" }}>{trap.text}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* links */}
                          {currentStep.links.length > 0 && (
                            <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden", background: "#fff", marginTop: "4px" }}>
                              {currentStep.links.map((link, idx) => (
                                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "12px 14px",
                                    borderBottom: idx < currentStep.links.length - 1 ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                                    textDecoration: "none", color: "inherit", background: "transparent",
                                    transition: "background 0.12s",
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,0,0,0.025)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                                >
                                  {link.icon && (
                                    <div style={{
                                      width: "40px", height: "40px", borderRadius: "9px",
                                      background: link.color ?? "#007aff", flexShrink: 0,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      fontSize: link.icon.length > 1 ? "10px" : "14px",
                                      fontWeight: 700, color: "#fff",
                                      letterSpacing: link.icon.length > 1 ? "-0.5px" : "0",
                                    }}>
                                      {link.icon}
                                    </div>
                                  )}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--primary)", marginBottom: "1px" }}>{link.text}</div>
                                    {link.desc && <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{link.desc}</div>}
                                  </div>
                                  <div style={{ fontSize: "16px", color: "rgba(0,0,0,0.2)", flexShrink: 0 }}>›</div>
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      ) : null}

                      {/* 카드 네비 — unified style */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0" }}>
                        <button type="button" disabled={guideStepIndex === 0} onClick={() => setGuideStepIndex(i => Math.max(0, i - 1))} style={{
                          padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.1)",
                          background: guideStepIndex === 0 ? "rgba(0,0,0,0.02)" : "white",
                          color: guideStepIndex === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
                          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex === 0 ? "default" : "pointer",
                        }}>
                          ← {ko ? "이전" : "Prev"}
                        </button>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {Array.from({ length: totalSlides }, (_, i) => (
                            <div key={i} onClick={() => setGuideStepIndex(i)} style={{
                              width: i === guideStepIndex ? "20px" : "8px", height: "8px", borderRadius: "100px",
                              background: i === guideStepIndex ? "#0561fc" : "rgba(0,0,0,0.1)",
                              cursor: "pointer", transition: "all 0.2s ease",
                            }} />
                          ))}
                        </div>
                        <button type="button" disabled={guideStepIndex >= totalSlides - 1} onClick={() => setGuideStepIndex(i => Math.min(totalSlides - 1, i + 1))} style={{
                          padding: "10px 18px", borderRadius: "10px", border: "none",
                          background: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.02)" : "#0561fc",
                          color: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.2)" : "#fff",
                          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex >= totalSlides - 1 ? "default" : "pointer",
                          boxShadow: guideStepIndex >= totalSlides - 1 ? "none" : "0 4px 14px rgba(5,97,252,0.25)",
                        }}>
                          {ko ? "다음" : "Next"} →
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {currentStage.code === "operations_setup" && (() => {
                  type OpsDetail = { id: string; name: string; tagline: string; color: string; url: string; pros: string[]; cons: string[]; icon?: React.ReactNode };

                  const deliveryPlatforms: OpsDetail[] = [
                    {
                      id: "baemin", name: "배달의민족", color: "#00C73C", url: "https://ceo.baemin.com",
                      tagline: "국내 배달앱 점유율 1위 · 월 8,000만 건+",
                      pros: ["국내 점유율 약 60%, 가장 많은 주문량 확보 가능", "사장님 앱으로 메뉴·주문·정산 직관적 관리", "울트라콜·오픈리스트 등 다양한 광고 상품 제공"],
                      cons: ["중개 수수료 6.8% + 결제 수수료 별도", "광고비 경쟁이 치열해 초기 노출 비용 부담 가능"],
                    },
                    {
                      id: "coupangeats", name: "쿠팡이츠", color: "#E52222", url: "https://store.coupangeats.com",
                      tagline: "단건 배달 전문 · 빠른 배달 이미지",
                      pros: ["단건 배달로 배달 품질과 고객 만족도 업계 최고", "쿠팡 브랜드 신뢰도 연계, 신규 고객 유입 용이", "로켓배달 이미지로 속도 중시 고객층 흡수"],
                      cons: ["수수료 약 9.8%로 3사 중 가장 높은 편", "단건 구조라 라이더 확보가 불안정할 수 있음"],
                    },
                    {
                      id: "yogiyo", name: "요기요", color: "#FF5A00", url: "https://partner.yogiyo.co.kr",
                      tagline: "GS리테일 운영 · 요기패스 구독 차별화",
                      pros: ["요기패스 구독 고객에게 우선 노출 혜택", "입점 심사 속도가 비교적 빠른 편", "GS25·GS슈퍼마켓 오프라인 제휴 혜택 연계"],
                      cons: ["시장 점유율 하락 추세 (약 10~15%)", "배민·쿠팡이츠 대비 광고 효율 낮을 수 있음"],
                    },
                    {
                      id: "naver-order", name: "네이버 주문", color: "#03C75A", url: "https://new.smartplace.naver.com",
                      tagline: "스마트플레이스 연동 · 검색 노출 시너지",
                      pros: ["네이버 지도·검색 결과에 주문 버튼 자동 연동", "포장·예약 주문 수요에 강점", "중개 수수료 없음, 결제 수수료만 부담"],
                      cons: ["자체 배달망 없어 외부 라이더 서비스 별도 연동 필요", "배달 기능보다 포장·테이블 주문에 더 적합"],
                    },
                  ];

                  const posSystems: OpsDetail[] = [
                    {
                      id: "toss",  name: "토스페이먼츠", color: "#1A6CF6", url: "https://www.tosspayments.com",
                      tagline: "간편 설치 · 정산 D+1 · 스타트업 최다 선택",
                      pros: ["단말기 무료 제공, 설치·설정 30분 이내 완료", "정산이 다음날 입금(D+1)으로 현금 흐름 유리", "카드·간편결제(카카오·네이버·애플페이) 한 번에 처리", "대시보드에서 매출 통계·정산 내역 실시간 확인"],
                      cons: ["재고 관리·주방 디스플레이 등 고급 기능 없음", "배달앱 연동은 추가 솔루션 필요"],
                    },
                    {
                      id: "kis",   name: "KIS정보통신", color: "#1E3A8A", url: "https://www.kisinfo.co.kr",
                      tagline: "국내 POS 시장 1위 · 전국 A/S망",
                      pros: ["전국 방문 A/S망으로 고장 시 빠른 처리", "배달의민족·쿠팡이츠 주문 자동 수신 연동", "업종별 전용 모듈 (카페·음식점·소매 등)"],
                      cons: ["초기 구매 또는 렌탈 비용 발생 (월 3~8만원)", "UI가 구식, 익히는 데 시간 소요"],
                    },
                    {
                      id: "orderplace", name: "오더플레이스", color: "#00B85E", url: "https://www.orderplace.co.kr",
                      tagline: "F&B 특화 태블릿 POS · 배달앱 연동 강점",
                      pros: ["배달앱 3사(배민·쿠팡이츠·요기요) 주문 통합 수신", "테이블 관리·주방 디스플레이(KDS) 연동", "태블릿 기반으로 공간 유연성 높음"],
                      cons: ["월 구독료 발생 (약 3~5만원)", "소매·서비스업보다 F&B 업종에 특화"],
                    },
                    {
                      id: "smartro", name: "스마트로", color: "#FF6B2B", url: "https://www.smartro.co.kr",
                      tagline: "소규모 매장 특화 · 간단 카드 단말기",
                      pros: ["카드 단말기 위주로 초기 비용 최소화 가능", "VAN 수수료 기반, 별도 월정액 없음", "소규모 단일 업장에 최적화"],
                      cons: ["재고·메뉴 관리 등 POS 고급 기능 부족", "배달앱 연동·주방 디스플레이 없음"],
                    },
                    {
                      id: "ipos", name: "아임포스", color: "#7C3AED", url: "https://www.ipos.co.kr",
                      tagline: "태블릿 기반 저비용 POS · 통계 기능 포함",
                      pros: ["초기 비용 최소화, 태블릿 + 앱으로 즉시 시작", "배달앱 연동, 매출 통계, 재고 관리 기본 제공", "요금제가 다양해 규모에 맞게 선택 가능"],
                      cons: ["고급 기능(주방 디스플레이 등)은 유료 업그레이드", "대형 매장 멀티 단말 환경에는 비적합"],
                    },
                  ];

                  const posChecks: Array<{ id: string; label: string; detail: string; hint: string }> = [
                    { id: "menu-check",       label: "메뉴·상품 전체 등록 및 가격 확인",  detail: "옵션, 추가 금액, 품절 여부까지 전체 점검", hint: "POS에서 직접 주문 1건 넣어보며 흐름 확인" },
                    { id: "payment-check",    label: "카드 실결제 1건 테스트",            detail: "실제 카드로 결제 후 즉시 취소 처리",        hint: "취소 처리 안 하면 오픈 전 매출로 잡힘" },
                    { id: "receipt-check",    label: "영수증 출력 및 내용 확인",          detail: "사업자명, 사업자번호, 부가세 금액 정확한지", hint: "세금계산서 발행 시 이 정보가 기준이 됨" },
                    { id: "settlement-check", label: "일 마감·정산 시뮬레이션",          detail: "정산 금액 = 실 매출 합계인지 비교",          hint: "오픈 후 정산 오류 발생 시 수정 복잡함" },
                  ];

                  const snsChannels: OpsDetail[] = [
                    {
                      id: "instagram", name: "인스타그램 비즈니스", color: "#C13584", url: "https://business.instagram.com",
                      tagline: "비주얼 마케팅 핵심 · 팔로워 기반 단골화",
                      pros: ["F&B·뷰티·라이프 업종 SNS 마케팅 1위 채널", "릴스·스토리로 콘텐츠 비용 대비 바이럴 효과 탁월", "팔로워가 곧 단골 — 재방문율과 객단가에 직결"],
                      cons: ["지속적인 콘텐츠 업로드 없으면 알고리즘 노출 감소", "팔로워 0에서 시작, 성과 나오기까지 2~3개월 소요"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <radialGradient id="ig-a" cx="0.35" cy="1.08" r="1.4" gradientUnits="objectBoundingBox">
                              <stop offset="0" stopColor="#FFD676"/>
                              <stop offset="0.25" stopColor="#F4A51C"/>
                              <stop offset="0.5" stopColor="#F15245"/>
                              <stop offset="0.75" stopColor="#D92E7F"/>
                              <stop offset="1" stopColor="#9B36B7"/>
                            </radialGradient>
                            <radialGradient id="ig-b" cx="0.15" cy="-0.08" r="0.6" gradientUnits="objectBoundingBox">
                              <stop offset="0" stopColor="#4168C9"/>
                              <stop offset="1" stopColor="#4168C9" stopOpacity="0"/>
                            </radialGradient>
                          </defs>
                          <rect width="42" height="42" fill="url(#ig-a)"/>
                          <rect width="42" height="42" fill="url(#ig-b)"/>
                          <rect x="8" y="8" width="26" height="26" rx="6" stroke="white" strokeWidth="2.5" fill="none"/>
                          <circle cx="21" cy="21" r="6.5" stroke="white" strokeWidth="2.5" fill="none"/>
                          <circle cx="29.5" cy="12.5" r="1.8" fill="white"/>
                        </svg>
                      ),
                    },
                    {
                      id: "naver-place", name: "네이버 플레이스", color: "#03C75A", url: "https://new.smartplace.naver.com",
                      tagline: "한국인 검색→방문 핵심 채널 · 리뷰 통합",
                      pros: ["'맛집 검색'의 80%가 네이버로, 미등록 시 검색 자체 불가", "예약·리뷰·메뉴·영업시간 한 곳에서 통합 관리", "스마트콜 연동으로 전화 발신 지역 분석 가능"],
                      cons: ["등록 후 검색 노출까지 최대 7일 소요 — 오픈 1주 전 등록 필수", "리뷰 관리 소홀 시 별점 하락이 방문율에 즉각 영향"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" fill="#03C75A"/>
                          <path d="M5 6H8.4L13.6 14V6H19V18H15.6L10.4 10V18H5V6Z" fill="white"/>
                        </svg>
                      ),
                    },
                    {
                      id: "kakao-channel", name: "카카오 채널", color: "#F9E000", url: "https://ch.kakao.com",
                      tagline: "카카오톡 직접 발송 · 카카오맵 연동",
                      pros: ["단골 고객에게 카카오톡 메시지 직접 발송 가능", "카카오맵 장소 노출, 예약·상담 채팅 기능 기본 제공", "채널 개설 자체는 무료"],
                      cons: ["친구(팔로워) 유치가 어렵고 초기 메시지 도달 제한", "메시지 발송 건당 비용 발생 (건당 약 15~30원)"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" fill="#FAE100"/>
                          <ellipse cx="12" cy="11.5" rx="7.5" ry="6" fill="#3C1E1E"/>
                          <polygon points="10,17 8,21.5 14,18.5" fill="#3C1E1E"/>
                        </svg>
                      ),
                    },
                    {
                      id: "google-business", name: "구글 비즈니스", color: "#4285F4", url: "https://business.google.com/ko",
                      tagline: "구글 검색·지도 노출 · 외국인 고객 필수",
                      pros: ["구글맵 노출로 외국인 관광객 접근성 업계 최고", "무료 운영, 리뷰·Q&A·예약·메시지 연동", "구글 검색 '내 주변 가게' 결과에 자동 노출"],
                      cons: ["국내 이용률은 네이버 대비 낮음 (내국인 검색 효과 제한)", "허위 리뷰 대응 절차가 복잡한 편"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" fill="white"/>
                          <path fill="#4285F4" d="M21.8 12.2c0-.72-.06-1.42-.18-2.09H12v3.95h5.47c-.24 1.27-.96 2.35-2.04 3.07v2.55h3.3c1.94-1.78 3.07-4.41 3.07-7.48z"/>
                          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.3-2.56c-.9.6-2.05.95-3.31.95-2.54 0-4.7-1.71-5.47-4.02H3.13v2.64C4.76 19.89 8.18 22 12 22z"/>
                          <path fill="#FBBC05" d="M6.53 13.94c-.2-.6-.31-1.24-.31-1.94s.11-1.34.31-1.94V7.42H3.13A9.97 9.97 0 002 12c0 1.61.39 3.14 1.07 4.5l3.46-2.56z"/>
                          <path fill="#EA4335" d="M12 6.04c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.95 3.09 14.7 2 12 2 8.18 2 4.76 4.11 3.13 7.42l3.4 2.64C7.3 7.75 9.46 6.04 12 6.04z"/>
                        </svg>
                      ),
                    },
                  ];

                  const steps = [
                    { key: "delivery", title: language === "ko" ? "배달앱 입점 등록" : "Delivery App Registration",    subtitle: language === "ko" ? "첫 주문이 들어오는 채널을 오픈 전에 열어두세요. 심사에 2~5 영업일 소요됩니다." : "Open your order channels before launch. Approval takes 2–5 business days.", taskId: "delivery-app-registered" },
                    { key: "pos",      title: language === "ko" ? "POS 실거래 테스트" : "POS Live Test",              subtitle: language === "ko" ? "오픈 전날 완료 강력 권장. 실결제 테스트 후 반드시 즉시 취소 처리하세요." : "Strongly recommended the day before opening. Cancel the test transaction immediately.", taskId: "pos-live" },
                    { key: "sns",      title: language === "ko" ? "SNS·플레이스 채널 개설" : "SNS & Place Setup",     subtitle: language === "ko" ? "네이버 플레이스는 노출까지 최대 7일 — 지금 바로 등록하세요." : "Naver Place takes up to 7 days to appear in search — register now.", taskId: "sns-setup" },
                  ];

                  const currentOpsStep = steps[opsStep];
                  const tasks = taskMap["operations-setup"] ?? [];
                  const isTaskDone = (id: string) => tasks.find(t => t.taskId === id)?.status === "completed";

                  const renderDetail = (items: OpsDetail[], prefix: string) => (
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                      {items.map((item, i) => {
                        const isSelected = !!opsSelections[`${prefix}-${item.id}`];
                        const isDark = item.color === "#F9E000";
                        return (
                          <div key={item.id}>
                            {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)" }} />}
                            {/* 메인 행 */}
                            <div
                              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "15px 20px 10px", cursor: "pointer", background: isSelected ? "rgba(0,122,255,0.04)" : "white", transition: "background 0.15s" }}
                              onClick={() => setOpsSelections(prev => ({ ...prev, [`${prefix}-${item.id}`]: !prev[`${prefix}-${item.id}`] }))}
                            >
                              <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: isSelected ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                {isSelected && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              {item.icon ? (
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0, overflow: "hidden", boxShadow: `0 3px 10px ${item.color}50` }}>
                                  {item.icon}
                                </div>
                              ) : (
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px ${item.color}50` }}>
                                  <span style={{ fontSize: "18px", fontWeight: 800, color: isDark ? "rgba(0,0,0,0.7)" : "white" }}>{item.name.charAt(0)}</span>
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "15px", fontWeight: isSelected ? 650 : 590, color: isSelected ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{item.name}</div>
                                <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginTop: "1px" }}>{item.tagline}</div>
                              </div>
                              <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </a>
                            </div>
                            {/* 장단점 */}
                            <div style={{ padding: "0 20px 14px 78px" }}>
                              {item.pros.map((pro, pi) => (
                                <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                                  <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "rgb(34,167,73)", marginTop: "1px" }}>✓</span>
                                  <span style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.45 }}>{pro}</span>
                                </div>
                              ))}
                              {item.cons.map((con, ci) => (
                                <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                                  <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "rgb(210,120,0)", marginTop: "1px" }}>—</span>
                                  <span style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.42)", lineHeight: 1.45 }}>{con}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );

                  const renderPos = () => {
                    const checkedCount = posChecks.filter(c => opsPosChecks[c.id]).length;
                    const selectedPosSystem = posSystems.find(s => opsSelections[`pos-system-${s.id}`]);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                        {/* ── POS란? ── */}
                        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                          <div style={{ padding: "18px 20px 6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(88,86,214,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="7.5" rx="1.5" stroke="rgb(88,86,214)" strokeWidth="1.3"/><path d="M4.5 10.5v1M9.5 10.5v1M3 11.5h8" stroke="rgb(88,86,214)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                              </div>
                              <span style={{ fontSize: "13px", fontWeight: 680, color: "rgb(88,86,214)", letterSpacing: "-0.1px" }}>POS란?</span>
                            </div>
                            {([
                              { Icon: CreditCard,   color: "rgb(0,122,255)",   bg: "rgba(0,122,255,0.1)",   text: language === "ko" ? "결제 처리 — 카드·현금·간편결제를 한 단말에서 처리하고 자동 정산" : "Payment processing — card, cash, and mobile pay in one terminal" },
                              { Icon: ClipboardList, color: "rgb(255,149,0)",  bg: "rgba(255,149,0,0.1)",   text: language === "ko" ? "메뉴·재고 관리 — 상품 등록, 품절 처리, 재고 수량 추적" : "Menu & inventory management — item registration, sold-out, stock tracking" },
                              { Icon: BarChart2,    color: "rgb(52,199,89)",   bg: "rgba(52,199,89,0.12)",  text: language === "ko" ? "매출 통계 — 시간대별·메뉴별 매출, 일·월 정산 리포트 자동 생성" : "Sales analytics — hourly/item sales, daily/monthly settlement reports" },
                              { Icon: Bike,         color: "rgb(88,86,214)",   bg: "rgba(88,86,214,0.1)",   text: language === "ko" ? "배달앱 연동 — 배민·쿠팡이츠 주문이 POS로 자동 수신 (제품마다 다름)" : "Delivery integration — auto-receive Baemin/CoupangEats orders (varies by product)" },
                            ] as const).map(({ Icon, color, bg, text }, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 0", borderTop: "0.5px solid rgba(0,0,0,0.07)" }}>
                                <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Icon size={17} strokeWidth={1.6} color={color} />
                                </div>
                                <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>{text}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ padding: "12px 20px", background: "rgba(88,86,214,0.04)", borderTop: "0.5px solid rgba(88,86,214,0.1)" }}>
                            <span style={{ fontSize: "12px", color: "rgba(88,86,214,0.75)", lineHeight: 1.5 }}>
                              {language === "ko" ? "업종에 따라 필요한 기능이 다릅니다. 아래에서 내 업종에 맞는 제품을 골라보세요." : "Different businesses need different features. Choose the right product below."}
                            </span>
                          </div>
                        </div>

                        {/* ── POS 시스템 선택 ── */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                              {language === "ko" ? "POS 시스템 선택" : "Choose a POS System"}
                            </span>
                            {selectedPosSystem && (
                              <span style={{ fontSize: "11px", fontWeight: 650, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.1)", padding: "2px 9px", borderRadius: "100px" }}>
                                {selectedPosSystem.name} {language === "ko" ? "선택됨" : "selected"}
                              </span>
                            )}
                          </div>
                          {renderDetail(posSystems, "pos-system")}
                        </div>

                        {/* ── 실거래 테스트 체크리스트 ── */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                              {language === "ko" ? "실거래 테스트 체크리스트" : "Live Test Checklist"}
                            </span>
                            {checkedCount === posChecks.length
                              ? <span style={{ fontSize: "11px", fontWeight: 650, color: "rgb(34,167,73)", background: "rgba(52,199,89,0.12)", padding: "2px 9px", borderRadius: "100px" }}>✓ {language === "ko" ? "완료" : "Done"}</span>
                              : <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.35)" }}>{checkedCount} / {posChecks.length}</span>
                            }
                          </div>
                          <div style={{ height: "3px", borderRadius: "100px", background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "10px" }}>
                            <div style={{ height: "100%", width: `${(checkedCount / posChecks.length) * 100}%`, background: "rgb(52,199,89)", borderRadius: "100px", transition: "width 0.35s ease" }} />
                          </div>
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            {posChecks.map((check, i) => {
                              const checked = !!opsPosChecks[check.id];
                              return (
                                <div key={check.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "58px" }} />}
                                  <div
                                    style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: checked ? "rgba(52,199,89,0.03)" : "white", transition: "background 0.15s" }}
                                    onClick={() => setOpsPosChecks(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                                  >
                                    <div style={{ flexShrink: 0, marginTop: "2px", width: "22px", height: "22px", borderRadius: "7px", border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: checked ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                      {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "15px", fontWeight: 500, color: checked ? "rgba(0,0,0,0.3)" : "var(--text)", textDecoration: checked ? "line-through" : "none", letterSpacing: "-0.2px", transition: "all 0.15s" }}>{check.label}</div>
                                      <div style={{ fontSize: "12.5px", color: checked ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.45)", marginTop: "3px", lineHeight: 1.45 }}>{check.detail}</div>
                                      {!checked && <div style={{ fontSize: "11.5px", color: "rgba(180,100,0,0.85)", marginTop: "6px", padding: "5px 10px", borderRadius: "8px", background: "rgba(255,149,0,0.07)", lineHeight: 1.4 }}>💡 {check.hint}</div>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  };

                  return (
                    <div style={{ marginBottom: "20px" }}>
                      {/* 헤더 */}
                      <div style={{ marginBottom: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: isTaskDone(currentOpsStep.taskId) ? "rgba(52,199,89,0.14)" : "rgba(0,122,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {isTaskDone(currentOpsStep.taskId)
                              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4.5" stroke="rgb(34,167,73)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              : <span style={{ fontSize: "11px", fontWeight: 750, color: "rgb(0,122,255)", letterSpacing: "-0.5px" }}>0{opsStep + 1}</span>
                            }
                          </div>
                          <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 660, letterSpacing: "-0.5px", color: "var(--text)" }}>{currentOpsStep.title}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(0,0,0,0.48)", lineHeight: 1.55, paddingLeft: "40px" }}>{currentOpsStep.subtitle}</p>
                      </div>

                      {/* 컨텐츠 */}
                      {opsStep === 0 && renderDetail(deliveryPlatforms, "delivery")}
                      {opsStep === 1 && renderPos()}
                      {opsStep === 2 && renderDetail(snsChannels, "sns")}

                      {/* 네비게이션 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "18px" }}>
                        <button
                          type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: opsStep === 0 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: opsStep === 0 ? "default" : "pointer", padding: "8px 4px", pointerEvents: opsStep === 0 ? "none" : "auto" }}
                          onClick={() => setOpsStep(s => s - 1)}
                        >← {language === "ko" ? "이전" : "Back"}</button>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} onClick={() => setOpsStep(i)} style={{ width: i === opsStep ? "20px" : "6px", height: "6px", borderRadius: "100px", background: i === opsStep ? "rgb(0,122,255)" : "rgba(17,17,17,0.15)", cursor: "pointer", transition: "width 0.2s ease" }} />
                          ))}
                        </div>
                        <button
                          type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: opsStep === 2 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: opsStep === 2 ? "default" : "pointer", padding: "8px 4px", pointerEvents: opsStep === 2 ? "none" : "auto" }}
                          onClick={() => setOpsStep(s => s + 1)}
                        >{language === "ko" ? "다음" : "Next"} →</button>
                      </div>
                    </div>
                  );
                })()}

                {currentStage.code === "pre_launch" && (() => {
                  const catLabel: Record<string, string> = {
                    food: "식당", "cafe-dessert": "카페", beauty: "뷰티샵",
                    retail: "리테일 매장", fitness: "피트니스", "online-digital": "온라인몰",
                  };
                  const bizLabel = catLabel[industryCategoryId] ?? "매장";

                  const guestTypes = [
                    { id: "guest-family",     label: "가족 / 친한 지인",                  desc: "솔직한 피드백의 최고 소스 — 창피함 없이 날카롭게 말해줄 사람 우선" },
                    { id: "guest-neighbor",   label: "동네 주민 / 이웃",                  desc: "잠재 단골 고객 — 오픈 후에도 가장 자주 올 수 있는 사람들" },
                    { id: "guest-influencer", label: "인스타 팔로워 / 마이크로 인플루언서", desc: "SNS 바이럴 효과 — 팔로워 1,000~10,000명 수준 권장" },
                    { id: "guest-peer",       label: "업계 지인 / 블로거",                desc: "전문적 관점의 날카로운 피드백 — 개업 전 마지막 검증" },
                  ];

                  const pricingOptions = [
                    { id: "free",     label: "무료 제공",    badge: "인상 최대화",  desc: "최고의 첫인상. 재료비만 부담하되 솔직한 피드백을 최대로 확보.",       tip: "예상 인원 × 원가로 예산 책정" },
                    { id: "discount", label: "30–50% 할인",  badge: "균형적 선택",  desc: "결제 흐름·POS까지 실 테스트 가능. 부담 없이 많은 인원 초대.",         tip: "수수료·포인트 적립 포함 전체 결제 흐름 검증" },
                    { id: "full",     label: "정가 운영",    badge: "실전 그대로",  desc: "할인·이벤트를 아껴뒀다 본오픈에 사용. 실수익 구조 그대로 테스트.",     tip: "사은품·경품은 본오픈용으로 보류" },
                  ];

                  const industryDayChecks: Record<string, { id: string; label: string; detail: string }[]> = {
                    food: [
                      { id: "day-inventory",    label: "식재료·재고 수량 확인 (예상 인원 1.5배)",  detail: "핵심 재료 부족 없도록 여유분 확보" },
                      { id: "day-order-timing", label: "주문 → 서빙 소요 시간 기록",               detail: "목표 시간 대비 지연 구간 파악" },
                      { id: "day-delivery",     label: "배달앱 주문 수신 & 처리 테스트",           detail: "배민·쿠팡이츠 연동 상태 확인" },
                    ],
                    "cafe-dessert": [
                      { id: "day-inventory",    label: "식재료·원두·재료 수량 확인 (1.5배 여유분)", detail: "시그니처 메뉴 소재 부족 없도록" },
                      { id: "day-order-timing", label: "주문 → 제조 → 픽업 소요 시간 기록",        detail: "피크 타임 가상 시나리오로 테스트" },
                      { id: "day-display",      label: "디저트·음료 디스플레이 & 조명 확인",        detail: "인스타 촬영 욕구를 자극하는 구도 연출" },
                    ],
                    beauty: [
                      { id: "day-booking-system", label: "네이버·카카오 예약 시스템 정상 작동 확인", detail: "예약→확정→알림 문자 전체 흐름 테스트" },
                      { id: "day-no-show",        label: "노쇼 방지 예치금·알림 시스템 테스트",     detail: "예약금 자동 수령 및 확인 메시지 발송 여부" },
                      { id: "day-service-time",   label: "시술 시간 vs 예약 간격 검증",             detail: "실제 시술 소요 → 다음 예약과 간격이 충분한지 확인" },
                    ],
                    retail: [
                      { id: "day-display",        label: "상품 진열·동선 최종 점검",              detail: "주력 상품이 눈에 잘 띄는 위치에 배치됐는지 확인" },
                      { id: "day-inventory",      label: "재고 수량·진열 일치 여부 확인",         detail: "품절 상품 진열 금지, 인기 예상 상품 충분히 확보" },
                      { id: "day-checkout-test",  label: "결제·영수증·포장재 준비 확인",          detail: "봉투·테이프·영수증 용지 충분한지 확인" },
                    ],
                    fitness: [
                      { id: "day-equipment", label: "운동 기구·시설 안전 점검",             detail: "모든 기구 작동 확인, 파손·안전 위험 요소 제거" },
                      { id: "day-crm",       label: "회원 관리·예약 시스템(CRM) 테스트",    detail: "출입 통제·락커 배정·수업 예약 흐름 전체 테스트" },
                      { id: "day-class",     label: "시범 클래스·PT 체험 진행 준비",        detail: "수업 흐름·강사 지도 품질 사전 검증" },
                    ],
                    "online-digital": [
                      { id: "day-checkout-online", label: "결제 → 주문 완료 흐름 전체 테스트",   detail: "카드·간편결제 실 결제 후 취소로 검증" },
                      { id: "day-cs",              label: "CS 채널(채팅·전화) 응답 속도 테스트", detail: "문의 접수 → 응답까지 목표 시간 내 처리 가능한지 확인" },
                      { id: "day-fulfillment",     label: "주문 → 포장 → 발송 처리 흐름 확인", detail: "운송장 출력, 포장 속도, 배송 추적 연동 테스트" },
                    ],
                  };

                  const universalDayChecks = [
                    { id: "day-cleanliness",    label: "매장·시설 청결 & 위생 최종 점검",      detail: "바닥·테이블·화장실·쓰레기통 모두 점검, 소독" },
                    { id: "day-staff-briefing", label: "직원 역할 배분 & 브리핑",              detail: "포지션·응대 멘트·비상 대응 방법 공유" },
                    { id: "day-pos",            label: "POS & 결제 단말기 정상 작동 확인",     detail: "카드·현금·간편결제(카카오·네이버·토스) 테스트 결제 후 즉시 취소" },
                    { id: "day-ambiance",       label: "조명·음악·온도·향기 설정",             detail: "원하는 브랜드 분위기 연출, 손님 입장 전 최종 확인" },
                    { id: "day-observation",    label: "운영 중 병목 & 손님 반응 관찰",        detail: "표정·대화·남기는 것·오래 머무는 곳 실시간 기록" },
                    { id: "day-payment",        label: "결제 오류·지연 여부 체크",             detail: "영수증 출력, 결제 완료 문자 발송 여부 확인" },
                    { id: "day-feedback-card",  label: "피드백 카드 수거 & 정리",              detail: "무기명 가능 → 솔직한 의견 유도" },
                    { id: "day-debrief",        label: "직원 회의 진행",                       detail: "잘된 점 3가지 + 개선점 3가지 모두 발언하게 하기" },
                    { id: "day-settlement",     label: "일 마감 & 정산 확인",                  detail: "실 매출과 POS 금액 일치 여부, 정산 오류 체크" },
                    { id: "day-sns",            label: "SNS 콘텐츠 촬영 & 업로드",            detail: "당일 감성 콘텐츠 → 인스타·네이버 포스팅" },
                  ];
                  const extraDayChecks = industryDayChecks[industryCategoryId] ?? [];
                  const allDayChecks = [...extraDayChecks, ...universalDayChecks];

                  const industryFeedback: Record<string, { id: string; label: string }[]> = {
                    food:           [{ id: "feedback-taste", label: "맛·음식 품질 피드백 수집" },          { id: "feedback-menu",       label: "메뉴 다양성·구성 피드백 수집" }],
                    "cafe-dessert": [{ id: "feedback-taste", label: "맛·음료 & 디저트 품질 피드백 수집" }, { id: "feedback-menu",       label: "메뉴·시즌 구성 피드백 수집" }],
                    beauty:         [{ id: "feedback-quality", label: "시술 퀄리티·기술력 피드백 수집" },  { id: "feedback-booking",    label: "예약·대기·동선 편의성 피드백 수집" }],
                    retail:         [{ id: "feedback-product", label: "상품 구성·품질 피드백 수집" },       { id: "feedback-display",    label: "진열·동선 편의성 피드백 수집" }],
                    fitness:        [{ id: "feedback-facility", label: "시설·기구 만족도 피드백 수집" },    { id: "feedback-instructor", label: "강사·PT 품질 피드백 수집" }],
                    "online-digital": [{ id: "feedback-ux", label: "구매 흐름·UI/UX 피드백 수집" },         { id: "feedback-product",    label: "상품 설명·사진 품질 피드백 수집" }],
                  };
                  const allFeedbackItems = [
                    ...(industryFeedback[industryCategoryId] ?? []),
                    { id: "feedback-service",  label: "서비스 속도·친절도 피드백 수집" },
                    { id: "feedback-price",    label: "가격 만족도 피드백 수집" },
                    { id: "feedback-ambiance", label: "공간·분위기·인테리어 피드백 수집" },
                  ];

                  const coreImproveLabel: Record<string, string> = {
                    food: "메뉴·레시피", "cafe-dessert": "메뉴·레시피", beauty: "시술·서비스",
                    retail: "상품 구성·진열", fitness: "프로그램·시설", "online-digital": "상품·UX",
                  };
                  const improvementItems = [
                    { id: "improve-core",    label: `피드백 기반 ${coreImproveLabel[industryCategoryId] ?? "핵심 서비스"} 개선 완료`,  detail: "피드백에서 반복 언급된 항목 최우선 개선" },
                    { id: "improve-service", label: "서비스 흐름 & 직원 동선 재배치 완료",                                              detail: "병목 구간 제거, 담당 역할 재조정" },
                    { id: "improve-staff",   label: "약점 파악 기반 직원 재교육 완료",                                                  detail: "미숙한 부분 집중 훈련, 응대 스크립트 보완" },
                  ];

                  const grandOpeningItems = [
                    { id: "final-naver",     label: "네이버 플레이스 오픈 포스팅 예약",       detail: "사진·메뉴·영업시간 최신화 후 오픈 당일 발행 예약" },
                    { id: "final-instagram", label: "인스타그램 그랜드 오픈 콘텐츠 예약",     detail: "릴스·카드뉴스 오픈 당일 자동 업로드 설정" },
                    { id: "final-kakao",     label: "카카오 채널 오픈 알림 발송",             detail: "팔로워 전체 메시지 — 소프트오픈 때 모은 DB 활용" },
                    { id: "final-event",     label: "오픈 기념 이벤트 준비 완료",             detail: "할인·사은품·스탬프·팔로우 이벤트 중 1가지 이상" },
                  ];

                  const softSteps = [
                    { title: "손님 초대 & 행사 기획",      subtitle: `${bizLabel} 소프트오픈에 누구를 초대하고 어떤 방식으로 진행할지 결정합니다` },
                    { title: "당일 운영 체크리스트",        subtitle: `${bizLabel} 운영의 모든 요소를 실전 그대로 점검합니다` },
                    { title: "피드백 분석 & 본오픈 준비",   subtitle: "수집된 피드백으로 개선하고, 본오픈을 완벽히 준비합니다" },
                  ];
                  const curSoftStep = softSteps[softOpenStep];

                  const renderCheckRow = (id: string, label: string, detail: string, accent = "rgb(0,122,255)") => {
                    const checked = !!softOpenChecks[id];
                    return (
                      <div key={id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: checked ? `${accent}0A` : "white", transition: "background 0.15s" }}
                        onClick={() => setSoftOpenChecks(prev => ({ ...prev, [id]: !prev[id] }))}
                      >
                        <div style={{ flexShrink: 0, marginTop: "2px", width: "22px", height: "22px", borderRadius: "7px", border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: checked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                          {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14.5px", fontWeight: 500, color: checked ? "rgba(0,0,0,0.3)" : "var(--text)", textDecoration: checked ? "line-through" : "none", lineHeight: 1.4, letterSpacing: "-0.2px", transition: "all 0.15s" }}>{label}</div>
                          {detail && !checked && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{detail}</div>}
                        </div>
                      </div>
                    );
                  };

                  const renderSection = (title: string, items: { id: string; label: string; detail: string }[], accent = "rgb(0,122,255)") => (
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                      <div style={{ padding: "14px 20px 6px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{title}</div>
                      </div>
                      {items.map((item, i) => (
                        <div key={item.id}>
                          {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "56px" }} />}
                          {renderCheckRow(item.id, item.label, item.detail, accent)}
                        </div>
                      ))}
                    </div>
                  );

                  return (
                    <div style={{ marginBottom: "20px" }}>
                      {/* 헤더 */}
                      <div style={{ marginBottom: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(0,122,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "11px", fontWeight: 750, color: "rgb(0,122,255)", letterSpacing: "-0.5px" }}>0{softOpenStep + 1}</span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 660, letterSpacing: "-0.5px", color: "var(--text)" }}>{curSoftStep.title}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(0,0,0,0.48)", lineHeight: 1.55, paddingLeft: "40px" }}>{curSoftStep.subtitle}</p>
                      </div>

                      {/* ── Step 0: 손님 초대 & 행사 기획 ── */}
                      {softOpenStep === 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {/* 초대 대상 */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            <div style={{ padding: "14px 20px 6px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>초대 대상 선택</div>
                            </div>
                            {guestTypes.map((g, i) => {
                              const selected = !!softOpenChecks[g.id];
                              return (
                                <div key={g.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)" }} />}
                                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 20px", cursor: "pointer", background: selected ? "rgba(0,122,255,0.04)" : "white", transition: "background 0.15s" }}
                                    onClick={() => setSoftOpenChecks(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
                                  >
                                    <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: selected ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: selected ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                      {selected && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "15px", fontWeight: selected ? 640 : 560, color: selected ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{g.label}</div>
                                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "1px", lineHeight: 1.45 }}>{g.desc}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ padding: "10px 20px 14px" }}>
                              <div style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5, padding: "8px 12px", borderRadius: "10px", background: "rgba(0,122,255,0.06)" }}>
                                💡 적정 인원: 예상 하루 고객의 50–70% 수준. 너무 많으면 운영 혼선, 너무 적으면 피드백 데이터 부족
                              </div>
                            </div>
                          </div>

                          {/* 가격 전략 */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            <div style={{ padding: "14px 20px 6px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>가격 전략</div>
                            </div>
                            {pricingOptions.map((opt, i) => {
                              const sel = softOpenPricing === opt.id;
                              return (
                                <div key={opt.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)" }} />}
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: sel ? "rgba(0,122,255,0.04)" : "white", transition: "background 0.15s" }}
                                    onClick={() => setSoftOpenPricing(sel ? "" : opt.id)}
                                  >
                                    <div style={{ flexShrink: 0, marginTop: "3px", width: "20px", height: "20px", borderRadius: "50%", border: sel ? "6px solid rgb(0,122,255)" : "1.5px solid rgba(0,0,0,0.25)", transition: "all 0.2s" }} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                        <span style={{ fontSize: "15px", fontWeight: sel ? 650 : 560, color: sel ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{opt.label}</span>
                                        <span style={{ fontSize: "11px", fontWeight: 650, color: sel ? "rgb(0,122,255)" : "rgba(0,0,0,0.4)", background: sel ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.06)", padding: "2px 8px", borderRadius: "100px" }}>{opt.badge}</span>
                                      </div>
                                      <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", lineHeight: 1.45 }}>{opt.desc}</div>
                                      {sel && <div style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", marginTop: "6px", padding: "6px 10px", borderRadius: "8px", background: "rgba(0,122,255,0.07)", lineHeight: 1.45 }}>💡 {opt.tip}</div>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 피드백 설계 가이드 — Apple style */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            {/* 헤더 */}
                            <div style={{ padding: "20px 20px 16px" }}>
                              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Feedback Design</div>
                              <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px", lineHeight: 1.25 }}>피드백 설계 가이드</div>
                              <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "4px", lineHeight: 1.5 }}>소프트 오픈 전 피드백 폼을 설계해두면 본오픈 개선에 직접 활용할 수 있습니다.</div>
                            </div>

                            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />

                            {/* 무엇을 물어볼까 */}
                            <div style={{ padding: "18px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                    <rect x="2" y="3" width="12" height="1.4" rx="0.7" fill="rgba(0,0,0,0.55)"/>
                                    <rect x="2" y="7.3" width="9" height="1.4" rx="0.7" fill="rgba(0,0,0,0.55)"/>
                                    <rect x="2" y="11.6" width="10.5" height="1.4" rx="0.7" fill="rgba(0,0,0,0.55)"/>
                                  </svg>
                                  <span style={{ fontSize: "15px", fontWeight: 640, color: "var(--text)", letterSpacing: "-0.3px" }}>무엇을 물어볼까</span>
                                </div>
                                <span style={{ fontSize: "11.5px", fontWeight: 500, color: "rgba(0,0,0,0.35)" }}>5–7개 권장</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                                {[
                                  { label: (() => { const m: Record<string, string> = { food: "맛·간·양", "cafe-dessert": "맛·음료 퀄리티·당도", beauty: "시술 결과·지속력", retail: "상품 퀄리티·구색", fitness: "수업 강도·강사", "online-digital": "상품 정보·UX" }; return m[industryCategoryId] ?? "핵심 품질"; })(), desc: "업종 핵심 항목", highlight: true },
                                  { label: "서비스·응대 속도", desc: "친절도, 처리 시간" },
                                  { label: "가격 적정성", desc: "품질 대비 체감 가치" },
                                  { label: "공간·분위기", desc: "청결, 동선, 조명, 온도" },
                                  { label: "재방문 의향 (1–5점)", desc: "가장 정직한 종합 지표" },
                                  { label: "좋았던 점 / 아쉬운 점", desc: "주관식 1–2개" },
                                ].map((item, i, arr) => (
                                  <div key={i}>
                                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 0 0 0" }} />}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: item.highlight ? "rgb(0,122,255)" : "rgba(0,0,0,0.2)", flexShrink: 0 }} />
                                        <span style={{ fontSize: "14px", fontWeight: item.highlight ? 600 : 450, color: item.highlight ? "var(--text)" : "rgba(0,0,0,0.75)", letterSpacing: "-0.2px" }}>{item.label}</span>
                                      </div>
                                      <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", letterSpacing: "-0.1px", textAlign: "right" as const, maxWidth: "120px" }}>{item.desc}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />

                            {/* 어떻게 수집할까 */}
                            <div style={{ padding: "18px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <path d="M8 2v7.5M5 7l3 3 3-3" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 11.5v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span style={{ fontSize: "15px", fontWeight: 640, color: "var(--text)", letterSpacing: "-0.3px" }}>어떻게 수집할까</span>
                              </div>
                              {[
                                { method: "QR 코드 + 카카오폼", tip: "테이블·영수증에 부착. 익명 응답률 최고", badge: "추천" },
                                { method: "종이 피드백 카드", tip: "QR 어색한 손님층 병행 사용" },
                                { method: "퇴장 시 구두 인터뷰", tip: "'가장 아쉬운 점 한 가지만' 단문 질문" },
                              ].map((item, i) => (
                                <div key={i}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span style={{ fontSize: "14px", fontWeight: 450, color: "rgba(0,0,0,0.75)", letterSpacing: "-0.2px" }}>{item.method}</span>
                                      {item.badge && (
                                        <span style={{ fontSize: "10.5px", fontWeight: 600, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.08)", padding: "2px 8px", borderRadius: "100px", letterSpacing: "0" }}>{item.badge}</span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", textAlign: "right" as const, maxWidth: "130px", lineHeight: 1.4 }}>{item.tip}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />

                            {/* 어떻게 정리할까 */}
                            <div style={{ padding: "18px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <rect x="2" y="9" width="3" height="5" rx="1" fill="rgba(0,0,0,0.55)"/>
                                  <rect x="6.5" y="6" width="3" height="8" rx="1" fill="rgba(0,0,0,0.55)"/>
                                  <rect x="11" y="3" width="3" height="11" rx="1" fill="rgba(0,0,0,0.55)"/>
                                </svg>
                                <span style={{ fontSize: "15px", fontWeight: 640, color: "var(--text)", letterSpacing: "-0.3px" }}>어떻게 정리할까</span>
                              </div>
                              {[
                                { num: "1", label: "항목별 평균 점수", desc: "재방문 3점 미만 → 최우선 개선" },
                                { num: "2", label: "반복 키워드 추출", desc: "주관식 2회 이상 언급 묶기" },
                                { num: "3", label: "즉시 · 1개월 · 장기 분류", desc: "본오픈 전 / 운영 중 / 다음 시즌" },
                              ].map((item, i) => (
                                <div key={i}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                      <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,0.25)", width: "14px", textAlign: "center" as const, flexShrink: 0 }}>{item.num}</span>
                                      <span style={{ fontSize: "14px", fontWeight: 450, color: "rgba(0,0,0,0.75)", letterSpacing: "-0.2px" }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", textAlign: "right" as const, maxWidth: "130px", lineHeight: 1.4 }}>{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 사전 준비 */}
                          {renderSection("사전 준비", [
                            { id: "prep-feedback-form", label: "피드백 카드 또는 QR 폼 제작 완료",  detail: "5–7가지 항목으로 간결하게. 무기명으로 솔직한 답변 유도" },
                            { id: "prep-invite-sent",   label: "초대장 발송 완료",                  detail: "날짜·주소·혜택(무료/할인) 명시. 카카오·인스타 DM 활용" },
                            { id: "prep-sns-plan",      label: "당일 SNS 콘텐츠 촬영 계획 수립",   detail: "오픈 전 매장 컷·준비 과정·첫 손님 맞이 순간 등 사전 계획" },
                          ])}
                        </div>
                      )}

                      {/* ── Step 1: 당일 운영 체크리스트 ── */}
                      {softOpenStep === 1 && (() => {
                        const pre  = allDayChecks.slice(0, extraDayChecks.length + 4); // industry + cleanliness/briefing/pos/ambiance
                        const mid  = allDayChecks.filter(c => ["day-observation", "day-payment"].includes(c.id));
                        const post = allDayChecks.filter(c => ["day-feedback-card", "day-debrief", "day-settlement", "day-sns"].includes(c.id));
                        const preItems  = [...extraDayChecks, universalDayChecks[0], universalDayChecks[1], universalDayChecks[2], universalDayChecks[3]];
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {renderSection("오픈 전 준비", preItems)}
                            {renderSection("운영 중 관찰", [universalDayChecks[4], universalDayChecks[5]], "rgb(255,149,0)")}
                            {renderSection("마감 후 정리", [universalDayChecks[6], universalDayChecks[7], universalDayChecks[8], universalDayChecks[9]], "rgb(52,199,89)")}
                          </div>
                        );
                      })()}

                      {/* ── Step 2: 피드백 분석 & 본오픈 준비 ── */}
                      {softOpenStep === 2 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {renderSection("피드백 수집 확인", allFeedbackItems.map(f => ({ ...f, detail: "" })), "rgb(0,122,255)")}
                          {renderSection("개선 사항 반영", improvementItems, "rgb(255,149,0)")}
                          {/* 본오픈 마케팅 준비 — 건너뜀 옵션 포함 */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            <div style={{ padding: "14px 20px 6px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>본오픈 마케팅 준비</div>
                            </div>
                            {grandOpeningItems.map((item, i) => {
                              const checked = !!softOpenChecks[item.id];
                              const skipped = !!softOpenSkips[item.id];
                              const accent = "rgb(52,199,89)";
                              return (
                                <div key={item.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "56px" }} />}
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", background: skipped ? "rgba(0,0,0,0.02)" : checked ? `${accent}0A` : "white", transition: "background 0.15s" }}>
                                    {/* 체크박스 */}
                                    <div
                                      style={{ flexShrink: 0, marginTop: "2px", width: "22px", height: "22px", borderRadius: "7px", border: checked ? "none" : skipped ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(0,0,0,0.2)", background: checked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: skipped ? "default" : "pointer", opacity: skipped ? 0.35 : 1 }}
                                      onClick={() => { if (!skipped) setSoftOpenChecks(prev => ({ ...prev, [item.id]: !prev[item.id] })); }}
                                    >
                                      {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    {/* 텍스트 */}
                                    <div
                                      style={{ flex: 1, cursor: skipped ? "default" : "pointer" }}
                                      onClick={() => { if (!skipped) setSoftOpenChecks(prev => ({ ...prev, [item.id]: !prev[item.id] })); }}
                                    >
                                      <div style={{ fontSize: "14.5px", fontWeight: 500, color: skipped ? "rgba(0,0,0,0.25)" : checked ? "rgba(0,0,0,0.3)" : "var(--text)", textDecoration: checked || skipped ? "line-through" : "none", lineHeight: 1.4, letterSpacing: "-0.2px", transition: "all 0.15s" }}>{item.label}</div>
                                      {item.detail && !checked && !skipped && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{item.detail}</div>}
                                    </div>
                                    {/* 건너뜀 버튼 */}
                                    {!checked && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSoftOpenSkips(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                                          if (softOpenChecks[item.id]) setSoftOpenChecks(prev => ({ ...prev, [item.id]: false }));
                                        }}
                                        style={{ flexShrink: 0, fontSize: "11.5px", fontWeight: 600, color: skipped ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.28)", background: skipped ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "8px", padding: "4px 9px", cursor: "pointer", whiteSpace: "nowrap" as const, marginTop: "1px", transition: "all 0.15s" }}
                                      >
                                        {skipped ? "취소" : "건너뜀"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 네비게이션 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "18px" }}>
                        <button type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: softOpenStep === 0 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: softOpenStep === 0 ? "default" : "pointer", padding: "8px 4px", pointerEvents: softOpenStep === 0 ? "none" : "auto" }}
                          onClick={() => setSoftOpenStep(s => s - 1)}
                        >← {language === "ko" ? "이전" : "Back"}</button>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} onClick={() => setSoftOpenStep(i)} style={{ width: i === softOpenStep ? "20px" : "6px", height: "6px", borderRadius: "100px", background: i === softOpenStep ? "rgb(0,122,255)" : "rgba(17,17,17,0.15)", cursor: "pointer", transition: "width 0.2s ease" }} />
                          ))}
                        </div>
                        <button type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: softOpenStep === 2 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: softOpenStep === 2 ? "default" : "pointer", padding: "8px 4px", pointerEvents: softOpenStep === 2 ? "none" : "auto" }}
                          onClick={() => setSoftOpenStep(s => s + 1)}
                        >{language === "ko" ? "다음" : "Next"} →</button>
                      </div>
                    </div>
                  );
                })()}

                {currentStage.code === "construction_setup" && (() => {
                  // Supabase 인테리어 가이드 로딩 (세부 업종별)
                  // 업종 변경 시 리로드를 위해 categoryId를 키로 사용
                  const loadDbGuides = async () => {
                    try {
                      const { loadInteriorGuides } = await import("@build-up/shared");
                      const result = await loadInteriorGuides(supabase, industryCategoryId, selectedIndustryId);
                      if (result.materials.length > 0 || result.concepts.length > 0) {
                        setInteriorGuidesData(result);
                      } else {
                        setInteriorGuidesData(null); // Supabase에 데이터 없으면 null → 하드코딩 폴백
                      }
                    } catch {
                      setInteriorGuidesData(null);
                    }
                    setInteriorGuidesLoaded(true);
                  };
                  if (!interiorGuidesLoaded) void loadDbGuides();

                  // 업종별 자재·컨셉 데이터 (하드코딩 폴백)
                  type MaterialItem = { icon: LucideIcon; name: string; desc: string };
                  type ConceptItem = { id: string; icon: LucideIcon; name: string; desc: string; tags: string[] };
                  type CategoryData = { materials: MaterialItem[]; concepts: ConceptItem[]; contractorKeyword: string };

                  const categoryDataMap: Record<string, CategoryData> = {
                    "cafe-dessert": {
                      materials: [
                        { icon: Layers, name: "시멘트 질감 마감재 (마이크로토핑)", desc: "노출 콘크리트 느낌 셀프 시공 가능 — 인더스트리얼·모던 감성 모두 사용" },
                        { icon: PanelLeft, name: "오픈형 원목 선반 + 철제 브래킷", desc: "원두·컵·소품 디스플레이. FSC 인증 목재 권장 (2025 친환경 트렌드)" },
                        { icon: Gem, name: "세라믹/엔지니어드 스톤 상판", desc: "카운터 상판 — 석영 90%+ 프리미엄 마감재. 열·스크래치·오염 내성 최고" },
                        { icon: Lightbulb, name: "LED 레일 조명 (2700~3000K 전구색)", desc: "카운터·선반 강조. 색온도가 음식·음료 색감 결정 — 전구색 필수" },
                        { icon: VolumeX, name: "방음·단열 복합 패널", desc: "주거 혼합 상권 야간 영업 민원 방지. 내장 흡음재 + 마감 압축재 이중 구조" },
                        { icon: Grid3X3, name: "미끄럼 방지 논슬립 타일/에폭시", desc: "카페 물기 특성상 필수. 논슬립 타일 또는 에폭시 코팅 — 정사각 600각 강마루도 트렌드" },
                      ],
                      concepts: [
                        { id: "industrial", icon: Factory, name: "미니멀 인더스트리얼", desc: "노출 콘크리트·철제 구조·원목 믹스매치. 강철+알루미늄+원목 상판 조합이 핵심", tags: ["20-30대 남성", "SNS 바이럴", "넓은 공간"] },
                        { id: "natural", icon: Leaf, name: "내추럴 빈티지 우드", desc: "FSC 원목·라탄·린넨·식물. 2025 바이오필릭 트렌드 — 심리 안정 효과, 재방문율 높음", tags: ["여성 선호", "재방문율", "힐링·웰빙"] },
                        { id: "parisian", icon: Coffee, name: "파리지앵 비스트로", desc: "대리석 상판·황동 소품·파스텔 벽. 엔지니어드 스톤 대리석 패턴 활용. 포토존 강점", tags: ["디저트 특화", "SNS 포토존", "프리미엄"] },
                        { id: "scandi", icon: Compass, name: "모던 스칸디나비안", desc: "화이트+우드+패브릭+모카 무스 계열(Pantone 2025). 밝은 채광 극대화, 넓어 보이는 공간감", tags: ["패밀리 친화", "밝은 채광", "전 연령 무난"] },
                      ],
                      contractorKeyword: "카페 인테리어 전문",
                    },
                    "food": {
                      materials: [
                        { icon: Wind, name: "스테인리스 상업용 후드·배기 시스템", desc: "법적 의무 — 풍량 계산 선행 필요. 주방 폭 최소 1900mm 확보 후 설계" },
                        { icon: Grid3X3, name: "내열 세라믹 타일 (주방 벽·바닥)", desc: "기름때·고열 내성. 줄눈 방오 처리 필수 — 청소 난이도 결정 요인" },
                        { icon: Shield, name: "방화 석고보드 (주방 인접 벽)", desc: "소방법 의무 자재 — 소방 심사 전 반드시 확인. 두께·등급 구분 있음" },
                        { icon: Zap, name: "대용량 전기 배선·분전반", desc: "상업용 주방 장비 전용 분전반 선행 공사 필수. 인테리어 착수 전 전기 설계" },
                        { icon: Droplets, name: "에폭시 바닥재 (주방·홀 경계)", desc: "방수·물매 시공 필수. 하수구 위치 먼저 결정 — 청소 동선이 여기서 결정됨" },
                        { icon: VolumeX, name: "방음·흡음재 (홀)", desc: "조리 소음·냉방기 소음 차단. 야간 영업 민원 방지 — 다중 레이어 구조 권장" },
                      ],
                      concepts: [
                        { id: "modern-hanok", icon: Home, name: "모던 한옥 퓨전", desc: "한지·나무·석재 믹스. 전통과 현대 조화 — 외국인 관광객 많은 상권에서 차별화 강점", tags: ["외국인 친화", "30-50대", "관광지 상권"] },
                        { id: "casual-pocha", icon: Beer, name: "캐주얼 포차·분식", desc: "자연 목재·빈티지 간판·원색 포인트. 친근하고 활기찬 분위기 — 저녁·회식 수요 최강", tags: ["저녁·야간 강점", "회식 수요", "가성비"] },
                        { id: "izakaya", icon: Wine, name: "클린 이자카야", desc: "다크 우드+간접조명+줄 전구. 2025 MZ세대 외식 트렌드 1순위 — SNS 바이럴 용이", tags: ["20-30대", "SNS 바이럴", "야간 강점"] },
                        { id: "farm", icon: Sprout, name: "팜투테이블 내추럴", desc: "식물·내추럴 소재·따뜻한 조명. 건강·유기농 이미지 — 객단가 올리기에 유리한 포지셔닝", tags: ["건강 이미지", "여성 선호", "객단가 상승"] },
                      ],
                      contractorKeyword: "음식점 인테리어 전문",
                    },
                    "beauty": {
                      materials: [
                        { icon: Scan, name: "대형 경대 거울 + 간접조명", desc: "고객 만족도 직결 — 강화 안전유리 + 간접조명으로 입체감과 고급감 동시 연출" },
                        { icon: Droplets, name: "샴푸대 전용 수전·배관", desc: "미용 시설 전용 설비. 위치 변경이 어려우므로 시공 전 배관 계획 확정 필수" },
                        { icon: Grid3X3, name: "미끄럼 방지 타일 (샴푸 구역)", desc: "물기 잦은 공간 안전 필수. 600각 정사각 타일 + 방오 줄눈 처리" },
                        { icon: Paintbrush, name: "저VOC 페인트 + 인테리어 필름", desc: "화학약품 사용 공간 — 저VOC 필수. 필름 마감으로 벽면 패턴·질감 다양하게 표현 가능" },
                        { icon: VolumeX, name: "방음재 (드라이어·음악 소음)", desc: "드라이어 소음 등 고객 불편 최소화. 흡음 패널 또는 흡음 벽지 시공" },
                        { icon: Leaf, name: "대나무·코르크 등 친환경 자재", desc: "2025 뷰티샵 핵심 트렌드 — 천연 소재로 공기질 개선 + 브랜드 감성 차별화" },
                      ],
                      concepts: [
                        { id: "clean-modern", icon: Sparkles, name: "클린 모던 화이트", desc: "흰 벽+원목 선반+포인트 컬러. 웨인스코팅 기둥 마감으로 고급감 — 청결·신뢰 이미지 1위", tags: ["청결 이미지", "연령 무관", "신뢰감"] },
                        { id: "botanic", icon: Flower2, name: "내추럴 보타닉 살롱", desc: "식물+원목+간접조명. 2025 바이오필릭 트렌드 정점 — 프리미엄 힐링 살롱 포지셔닝", tags: ["프리미엄", "힐링", "여성 선호"] },
                        { id: "luxury-black", icon: Crown, name: "럭셔리 블랙 & 골드", desc: "다크 톤+황동+대리석 포인트. 고급 헤어샵 포지셔닝 — 객단가 상승·재방문 고객 확보", tags: ["고단가", "프리미엄", "강남·홍대"] },
                        { id: "mocha-pink", icon: Heart, name: "모카 무스 & 핑크 파스텔", desc: "2025 Pantone 모카 무스 계열 + 파스텔. 따뜻한 베이지·핑크 — 네일·스킨 샵 최강 컨셉", tags: ["네일·피부 특화", "SNS 포토존", "20-30대 여성"] },
                      ],
                      contractorKeyword: "미용실 헤어샵 인테리어",
                    },
                    "fitness": {
                      materials: [
                        { icon: Layers, name: "충격 흡수 고무 바닥재 (헬스장)", desc: "운동화 마모·소음·충격 흡수. 두께 10~20mm — 장비 무게별 등급 선택 필수" },
                        { icon: PanelLeft, name: "강화마루 + 바닥 단열필름 (스튜디오)", desc: "필라테스·요가 맨발 운동 — 강화마루가 내구성·고급감 최적. 단열로 겨울 냉기 차단" },
                        { icon: Maximize2, name: "전신 거울 (강화 안전유리)", desc: "동작 확인 필수 — 공간 여유 시 간접조명 추가로 입체감 연출. 좁은 공간은 벽 밀착 설치" },
                        { icon: VolumeX, name: "방음·흡음 다층 구조 자재", desc: "음악·운동 소음 차단. 내부는 고흡음율 자재, 마감은 얇고 단단한 압축재 조합이 정석" },
                        { icon: Wind, name: "에어 서큘레이터 + 환기 시스템", desc: "다수 사용자 땀 환기 필수. 환기량 부족은 가장 많은 불만 요인 — 설계 단계 반영 필수" },
                        { icon: DoorOpen, name: "스테인리스 파티션·로커 (탈의실)", desc: "내구성 + 위생 최우선 소재. 탈의실은 고객 만족도 직결 공간 — 투자 아끼지 말 것" },
                      ],
                      concepts: [
                        { id: "clean-sport", icon: Dumbbell, name: "클린 모던 스포티", desc: "흰 벽+밝은 조명+원목 포인트. 청결·건강 이미지 극대화 — 신규 회원 첫인상 결정", tags: ["청결 이미지", "전 연령", "밝은 공간"] },
                        { id: "industrial-sport", icon: Factory, name: "인더스트리얼 퍼포먼스", desc: "노출 콘크리트+철제+형광 포인트. 퍼포먼스·강도 이미지 강조 — 헬스장·크로스핏 최적", tags: ["남성 선호", "고강도 운동", "에너지"] },
                        { id: "healing-studio", icon: Waves, name: "힐링 내추럴 스튜디오", desc: "따뜻한 우드+식물+부드러운 간접조명. 심리 안정·웰니스 — 요가·필라테스·명상 전용 컨셉", tags: ["요가·필라테스", "여성 선호", "웰니스"] },
                        { id: "premium-pt", icon: Award, name: "하이엔드 프리미엄 PT", desc: "대리석 포인트+블랙+디자인 조명. 1:1 PT·소수 정예 — 고단가 포지셔닝, 신뢰감 극대화", tags: ["1:1 PT", "고단가", "강남·서래마을"] },
                      ],
                      contractorKeyword: "피트니스 스튜디오 인테리어",
                    },
                    "education": {
                      materials: [
                        { icon: Shield, name: "방염 인증 마감재 (벽지·천장재)", desc: "다중이용시설 법규 의무 — 불특정 다수 이용 공간 모두 방염 필수. 미준수 시 영업 정지" },
                        { icon: DoorOpen, name: "방음 도어 (간살+유리 조합)", desc: "수업 중 외부 소음 차단. 간살에 유리 부착으로 방음+채광 동시 확보 — 2025 트렌드" },
                        { icon: Lightbulb, name: "기능성 조명 (4000K 주백색)", desc: "학습 집중력 최적 색온도. 어두운 조명·눈부심 모두 집중력 저하 원인 — 조도 계산 필수" },
                        { icon: Paintbrush, name: "단색 계열 저채도 페인트 + 포인트 벽면", desc: "집중력 향상 환경 — 벽 한 면에만 포인트 컬러 적용하는 것이 현재 학원 인테리어 정석" },
                        { icon: VolumeX, name: "방음재·흡음재 (강의실)", desc: "집중력에 방음이 가장 큰 영향. 다층 구조 흡음 패널 + 방음 도어 조합 권장" },
                        { icon: Layers, name: "내마모 LVT·강마루 바닥재", desc: "의자 끌기 소음·마모 내성. 학생 다수 이용 → 내구성 최우선, 청소 용이성 고려" },
                      ],
                      concepts: [
                        { id: "clean-academic", icon: BookOpen, name: "클린 아카데믹", desc: "화이트+그레이 계열+집중력 최적화 조명. 학부모 신뢰감·청결 이미지 1위 컨셉", tags: ["학부모 신뢰", "집중력 최적화", "입시 학원"] },
                        { id: "creative-studio", icon: Palette, name: "모던 창의 스튜디오", desc: "컬러 포인트 벽면+오픈 수납+밝은 조명. 예체능·코딩·창의 학원 — 활기찬 분위기", tags: ["예체능·코딩", "창의적 환경", "어린이"] },
                        { id: "premium-private", icon: Award, name: "프리미엄 소수정예", desc: "원목+고급 조명+독립 공간 설계. 1:1 과외·소규모 클래스 — 고단가 포지셔닝 필수 컨셉", tags: ["소수 정예", "고단가", "강남·대치"] },
                        { id: "kids-bright", icon: Star, name: "활기찬 키즈 클래스", desc: "밝은 안전 컬러+라운드 가구+내구성 자재. 어린이 대상 학원 — 안전·위생 최우선", tags: ["어린이 대상", "안전 자재", "학부모 만족"] },
                      ],
                      contractorKeyword: "학원 교육시설 인테리어",
                    },
                    "pet": {
                      materials: [
                        { icon: Grid3X3, name: "항균·미끄럼 방지 세라믹 타일", desc: "동물 발 보호 + 위생 청소 용이. 배뇨 실수 스며들지 않는 무공극 타일 필수" },
                        { icon: Layers, name: "고탄성 쿠션 바닥재 (운동·대기 구역)", desc: "높은 곳 착지 충격 흡수 → 관절 보호. 2중 쿠션층 기준 두께 8mm 이상 권장" },
                        { icon: Shield, name: "방수·항균 벽 마감재", desc: "배변·물 튀김 대응. 타이벡·천연 펄프 계열 친환경 항균 마감재 — 2025 펫 인테리어 핵심" },
                        { icon: Droplets, name: "스테인리스 그루밍 테이블·배수 시스템", desc: "목욕·그루밍 전용 배수 설계 — 위치 변경 어려움. 배수구 경사도(물매) 사전 계획 필수" },
                        { icon: Scan, name: "강화 유리 케이지·전시 구역", desc: "동물 분리·위생 관리. 강화 안전유리로 고객이 안쪽을 볼 수 있어 구매 전환율 상승" },
                        { icon: Wind, name: "환기·탈취 시스템 (필수 설비)", desc: "동물 냄새 제거가 고객 재방문 결정 요인 1위. 설계 단계에서 환기 용량 반드시 계산" },
                      ],
                      concepts: [
                        { id: "clean-white", icon: Sparkles, name: "클린 화이트 + 파스텔", desc: "흰 벽+파스텔 포인트. 위생·청결 이미지 극대화 — 보호자 신뢰감 가장 높은 컨셉", tags: ["청결 신뢰", "보호자 만족", "전 연령"] },
                        { id: "natural-wood", icon: Trees, name: "내추럴 원목 펫샵", desc: "원목+베이지+따뜻한 조명. 동물 친화적 분위기 — 중·고가 포지셔닝, 반려동물 가족 감성", tags: ["중·고가", "감성 소비", "재방문율"] },
                        { id: "pop-colorful", icon: Palette, name: "팝아트 컬러풀", desc: "밝은 원색+귀여운 그래픽. 접근성·바이럴 마케팅 강점 — 어린 자녀 동반 가족 어필", tags: ["접근성", "SNS 바이럴", "가족 고객"] },
                        { id: "premium-grooming", icon: Scissors, name: "미니멀 프리미엄 그루밍", desc: "블랙+화이트+황동 포인트. 고급 그루밍 살롱 포지셔닝 — 펫 미용 전문관 차별화", tags: ["고단가", "프리미엄 그루밍", "강남·성수"] },
                      ],
                      contractorKeyword: "펫샵 동물병원 인테리어",
                    },
                    "retail": {
                      materials: [
                        { icon: Grid3X3, name: "정사각 타일형 강마루 (600각)", desc: "2024-2025 리테일 바닥 메가 트렌드 — 타일 질감+내구성+청소 편의 삼박자" },
                        { icon: Film, name: "인테리어 필름 (벽면·집기 마감)", desc: "무몰딩 마감 트렌드 — 내오염성·내구성 뛰어남. 다양한 패턴·질감으로 브랜드 감성 구현" },
                        { icon: AlignLeft, name: "이동식 진열 시스템 (슬롯월·행거)", desc: "트렌드·시즌 변화에 따른 레이아웃 변경 필수. 고정 진열대 최소화가 현재 리테일 정석" },
                        { icon: Lightbulb, name: "스팟 LED + 레일 조명 시스템", desc: "상품 강조 조명 — 색연색지수(CRI) 90 이상 권장. 상품 색감 왜곡 최소화" },
                        { icon: Scan, name: "강화 유리 쇼케이스·진열장", desc: "고가 상품·뷰티·액세서리 진열 필수. 잠금 기능+LED 내장형이 현재 표준" },
                        { icon: Shield, name: "방염 벽지·마감재", desc: "다중이용시설 법규 — 연면적 관계없이 상업 매장은 방염 자재 적용 권장" },
                      ],
                      concepts: [
                        { id: "editorial", icon: Store, name: "에디토리얼 미니멀", desc: "화이트+그레이+중성 톤. 상품이 주인공 — 공간 비움으로 브랜드 밀도 극대화", tags: ["상품 강조", "브랜드 신뢰", "라이프스타일"] },
                        { id: "warm-natural", icon: Home, name: "웜톤 내추럴", desc: "원목+베이지+모카 무스(Pantone 2025). 친근하고 따뜻한 분위기 — 전 연령 재방문율", tags: ["전 연령", "재방문율", "동네 매장"] },
                        { id: "bold-brand", icon: Megaphone, name: "볼드 브랜딩 컬러", desc: "시그니처 컬러 포인트+강한 사이니지. 골목 가시성 확보 — SNS 바이럴+브랜드 각인", tags: ["브랜드 구축", "SNS", "독립 매장"] },
                        { id: "experience", icon: LayoutGrid, name: "체험형 쇼룸 (Shop-in-Shop)", desc: "매장 내 체험 존+전시 공간 구분. 2025 오프라인 리테일 1순위 트렌드 — 구매 전환율 상승", tags: ["체험 마케팅", "전환율 상승", "대형 매장"] },
                      ],
                      contractorKeyword: "소매점 리테일 매장 인테리어",
                    },
                    "living-service": {
                      materials: [
                        { icon: Droplets, name: "내수·방수 PVC·에폭시 바닥재", desc: "세탁기 진동·물기·세제 내성 필수. 물매 시공(경사도)으로 배수 원활하게" },
                        { icon: Table2, name: "스테인리스 카운터·작업대", desc: "세탁물·소품 처리 위생 관리. 내식성·내오염성 최강 소재 — 의류 오염 전이 방지" },
                        { icon: Shield, name: "방염 마감재 (벽·천장)", desc: "다중이용시설 법규 의무. 세탁 화학품 인화성 고려 — 방염 인증 필수" },
                        { icon: Lightbulb, name: "절전형 LED 조명 (5000K 주광색)", desc: "장시간 영업 전기료 절감 핵심. 작업 공간은 밝은 주광색 — 세탁물 색감 확인 용이" },
                        { icon: Wind, name: "환기 시스템 (세탁 화학품 배기)", desc: "세탁 용제 환기 필수 — 실내 공기질이 고객 체류 시간 결정. 배기 용량 사전 계산" },
                        { icon: Film, name: "내구성 인테리어 필름 (집기 마감)", desc: "잦은 접촉·세탁 용제 내성. 내오염성 필름으로 집기 수명 연장 + 청결 이미지 유지" },
                      ],
                      concepts: [
                        { id: "clean-tech", icon: Cpu, name: "클린 테크 화이트", desc: "흰 벽+스테인리스+그린·블루 포인트. 위생·기술력 이미지 — 고객 신뢰 가장 높은 컨셉", tags: ["위생 신뢰", "청결 이미지", "전 연령"] },
                        { id: "natural-laundry", icon: Leaf, name: "내추럴 라운드리", desc: "원목+화이트+식물. 친근하고 깔끔한 동네 세탁소 감성 — 커뮤니티 기반 재방문 유도", tags: ["동네 친화", "재방문", "패밀리"] },
                        { id: "modern-minimal", icon: Box, name: "모던 미니멀 그레이", desc: "회색 계열+깔끔한 동선+사이니지. 도심 편의형 프리미엄 세탁 — 직장인 고객 어필", tags: ["직장인", "도심 상권", "프리미엄"] },
                        { id: "local-brand", icon: Store, name: "로컬 브랜딩 강화", desc: "시그니처 컬러+강한 외부 사이니지. 골목 랜드마크화 — 구전·SNS 바이럴로 고객 확장", tags: ["랜드마크", "SNS 바이럴", "골목 상권"] },
                      ],
                      contractorKeyword: "생활서비스 상가 인테리어",
                    },
                    "space": {
                      materials: [
                        { icon: Shield, name: "방염 마감재 (벽지·천장재)", desc: "다중이용시설 필수 — 연면적 1000㎡ 이상은 불연·방염 의무. 사전 소방 확인 필수" },
                        { icon: DoorOpen, name: "방음 도어 (간살+유리문)", desc: "개별 룸 방음 핵심 자재. 유리 부착으로 방음+채광 확보 — 2025 스터디카페 표준" },
                        { icon: VolumeX, name: "흡음 패널 (룸 내부)", desc: "룸 내 에코·울림 차단. 내장 고흡음 + 마감 압축재 조합. 집중력 유지에 직결" },
                        { icon: PanelLeft, name: "우드 템바보드 벽장재", desc: "따뜻하고 감각적인 분위기 — 2024-2025 스터디카페 트렌드 벽장재 1위" },
                        { icon: Lightbulb, name: "개별 룸 독립 조명 (온오프 각각)", desc: "개인화 환경 — 룸별 밝기 조절 가능해야 고객 만족도 상승. 4000K 주백색 기본" },
                        { icon: Plug, name: "멀티탭·USB 충전 인프라", desc: "각 좌석 전원 공급 필수. 콘센트 위치가 좌석 만족도 결정 — 설계 단계 확정 필요" },
                      ],
                      concepts: [
                        { id: "modern-study", icon: BookOpen, name: "모던 스터디 (네이비+화이트)", desc: "차분한 네이비·화이트 혼합+원목. 집중력 1순위 컬러 조합 — 스터디카페 최다 선택 컨셉", tags: ["집중력 최강", "수험생", "장시간 체류"] },
                        { id: "cafe-study", icon: Coffee, name: "카페 감성 스터디", desc: "원목+무드 조명+식물+템바보드. 분위기 좋은 스터디 공간 — SNS 바이럴로 신규 고객 유입", tags: ["SNS 바이럴", "감성 소비", "장시간 체류"] },
                        { id: "premium-seminar", icon: Monitor, name: "프리미엄 세미나룸", desc: "대리석 포인트+블랙+화이트보드·스크린. 기업 교육·스터디그룹 — 시간당 단가 높음", tags: ["기업 고객", "고단가", "세미나"] },
                        { id: "healing-study", icon: Leaf, name: "힐링 내추럴", desc: "베이지+원목+식물+부드러운 조명. 스트레스 없는 공부 환경 — 장시간 체류율 가장 높음", tags: ["힐링", "장시간 체류", "20-30대"] },
                      ],
                      contractorKeyword: "스터디카페 공간 인테리어",
                    },
                    "online-digital": {
                      materials: [
                        { icon: Monitor, name: "노트북 (업무용)", desc: "일반 사무: LG gram·삼성 갤럭시북 (90~160만). 디자인: MacBook Pro M4 (250~500만). 개발: ThinkPad T (120~200만)" },
                        { icon: Maximize2, name: "모니터 (듀얼 추천)", desc: "삼성 S27 FHD (20~40만), LG 울트라와이드 34\" (40~60만). 디자인: Dell UltraSharp 4K (60~80만)" },
                        { icon: Table2, name: "사무 데스크", desc: "데스커 15~50만 (소규모 최적), 이케아 5~30만 (초기 가성비), 퍼시스 30~150만 (법인)" },
                        { icon: Gem, name: "인체공학 의자", desc: "시디즈 T50 (50~70만), 듀오백 D-ZERO (10~15만 가성비), 허먼밀러 에어론 (150~220만 프리미엄)" },
                        { icon: Wifi, name: "네트워크 장비", desc: "ipTIME 기업용 공유기 (5~15만), 시놀로지 NAS (30~80만). 안정적 인터넷이 운영 핵심" },
                        { icon: Box, name: "포장·물류 장비", desc: "라벨프린터 BIXOLON (15~40만), 포장재 박스코리아·올패키징몰. 풀필먼트: 쿠팡 로켓그로스·품고" },
                      ],
                      concepts: [
                        { id: "minimal-home", icon: Home, name: "미니멀 홈오피스", desc: "데스커+이케아 조합. 최소 비용으로 쾌적한 작업 환경 — 1인 이커머스 최적", tags: ["1인 운영", "최저 비용", "홈오피스"] },
                        { id: "shared-office", icon: Users, name: "공유오피스 활용", desc: "패스트파이브·위워크·스파크플러스. 초기 보증금 부담 없이 시작 — 네트워크 효과 보너스", tags: ["보증금 절약", "네트워킹", "2~5인 팀"] },
                        { id: "studio-setup", icon: Camera, name: "촬영 스튜디오 겸용", desc: "조명+배경지+삼각대 세팅. 상품 촬영이 매출 직결 — 자체 스튜디오로 외주비 절약", tags: ["상품 촬영", "SNS 콘텐츠", "브랜드 구축"] },
                        { id: "warehouse-office", icon: Package, name: "소형 창고+사무 겸용", desc: "재고 보관+포장+사무를 한 공간에. 임대료 절약 — 월 50~100만원대 소형 창고 활용", tags: ["재고 관리", "물류 효율", "성장기"] },
                      ],
                      contractorKeyword: "사무실 인테리어 소형",
                    },
                    "startup-tech": {
                      materials: [
                        { icon: Monitor, name: "개발용 노트북", desc: "MacBook Pro M4 Pro (280~350만, ARM 네이티브), ThinkPad T (120~200만, 리눅스 최적), Dell XPS (150~250만)" },
                        { icon: Maximize2, name: "외장 모니터 (듀얼/울트라와이드)", desc: "LG 울트라와이드 34\" (40~60만) 개발자 필수. 디자인: Dell UltraSharp 4K. BenQ PD2706U (60~80만)" },
                        { icon: Table2, name: "사무 가구 (데스크·의자)", desc: "퍼시스/코아스 (법인 대량), 데스커 (소규모), 시디즈 T80 (80~120만), 허먼밀러 에어론 (150~220만)" },
                        { icon: Wifi, name: "서버·네트워크·클라우드", desc: "AWS/GCP/Vercel 클라우드. ipTIME 기업공유기. 시놀로지 NAS. 기가비트 인터넷 필수" },
                        { icon: Lightbulb, name: "회의실 장비", desc: "LG 시네빔 프로젝터 (50~150만), 삼성 Flip 전자칠판 (300~500만), 로지텍 Rally 화상회의 (100~200만)" },
                        { icon: Cpu, name: "SaaS 구독 스택", desc: "Notion·Slack·Figma·GitHub·Linear·Vercel. 월 인당 5~15만원. Adobe CC 디자인팀 월 6만~" },
                      ],
                      concepts: [
                        { id: "garage-mvp", icon: Zap, name: "개러지 MVP 모드", desc: "최소 장비+공유오피스. 검증 전까지 고정비 최소화 — 시드 전 스타트업 정석", tags: ["시드 전", "최소 비용", "빠른 검증"] },
                        { id: "modern-office", icon: Cpu, name: "모던 테크 오피스", desc: "코아스 시스템가구+허먼밀러 의자+대형 모니터. IT기업 표준 환경 — 채용 경쟁력", tags: ["채용 경쟁력", "5~15인", "시리즈A+"] },
                        { id: "hybrid-remote", icon: Globe, name: "하이브리드 리모트", desc: "핵심 장비만 사무실 + 재택 장비 지원. Notion·Slack·Zoom 기반 — 고정비 대폭 절감", tags: ["리모트", "고정비 절감", "글로벌 팀"] },
                        { id: "design-studio", icon: Palette, name: "크리에이티브 스튜디오", desc: "iMac 24\"+듀얼모니터+Adobe CC. 디자인·영상 중심 스타트업 — 컬러 정확도 필수", tags: ["디자인 중심", "영상 제작", "크리에이티브"] },
                      ],
                      contractorKeyword: "IT 스타트업 사무실 인테리어",
                    },
                  };

                  const catData = categoryDataMap[industryCategoryId] ?? categoryDataMap["food"];
                  // Supabase 데이터가 있으면 우선 사용, 없으면 하드코딩 폴백
                  const iconMap: Record<string, LucideIcon> = { Layers, Lightbulb, Factory, Wind, Package, Shield, Droplets, Palette, Monitor, Leaf, Zap, Globe, Star, Home, Heart, Sparkles, PanelLeft, Table2, Box, Frame, Trees: Leaf, Diamond: Gem, GlassWater: Droplets, ScanFace: Scan, Armchair: Home, Footprints: Bike, Maximize: Maximize2, MonitorUp: Monitor, ShieldOff: Shield, Code: Cpu, Eye: Scan, UtensilsCrossed: Coffee, ChefHat: Award, Minimize: Layers, TreePine: Leaf, PaintBucket: Paintbrush, Wine };
                  const dbMaterials = interiorGuidesData?.materials?.map((m) => ({
                    icon: iconMap[m.iconName ?? ""] ?? Layers,
                    name: language === "ko" ? m.nameKo : (m.nameEn ?? m.nameKo),
                    desc: language === "ko" ? m.descriptionKo : (m.descriptionEn ?? m.descriptionKo),
                  })) ?? [];
                  const dbConcepts = interiorGuidesData?.concepts?.map((c) => ({
                    id: c.id,
                    icon: iconMap[c.iconName ?? ""] ?? Layers,
                    name: language === "ko" ? c.nameKo : (c.nameEn ?? c.nameKo),
                    desc: language === "ko" ? c.descriptionKo : (c.descriptionEn ?? c.descriptionKo),
                    tags: c.tags,
                  })) ?? [];
                  const materials = dbMaterials.length > 0 ? dbMaterials : catData.materials;
                  const concepts = dbConcepts.length > 0 ? dbConcepts : catData.concepts;
                  const contractorKeyword = catData.contractorKeyword;
                  const regionLabel = preferredRegion ?? (language === "ko" ? "선택한 상권" : "your area");

                  return (
                    <>
                      {/* ── 자재 추천 ── */}
                      {(() => {
                        // Apple iOS system color palette — 6색 순환
                        const iconColors = [
                          { bg: "rgba(0,122,255,0.1)",   fg: "rgb(0,122,255)"   }, // blue
                          { bg: "rgba(52,199,89,0.1)",   fg: "rgb(34,167,73)"   }, // green
                          { bg: "rgba(255,149,0,0.1)",   fg: "rgb(210,120,0)"   }, // orange
                          { bg: "rgba(88,86,214,0.12)",  fg: "rgb(88,86,214)"   }, // indigo
                          { bg: "rgba(90,200,250,0.14)", fg: "rgb(0,160,210)"   }, // teal
                          { bg: "rgba(255,45,85,0.1)",   fg: "rgb(220,40,75)"   }, // pink
                        ];
                        return (
                          <div style={{ marginBottom: "28px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
                                {language === "ko"
                                  ? (industryCategoryId === "online-digital" || industryCategoryId === "startup-tech" ? "핵심 장비 · 집기" : "핵심 자재 · 집기")
                                  : "Key Materials & Equipment"}
                              </span>
                              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                {language === "ko" ? `${materials.length}가지` : `${materials.length} items`}
                              </span>
                            </div>
                            {/* 단일 컨테이너 카드 — Apple grouped list 스타일 */}
                            <div style={{
                              background: "white",
                              borderRadius: "20px",
                              overflow: "hidden",
                              boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                            }}>
                              {materials.map((m, i) => {
                                const color = iconColors[i % iconColors.length];
                                return (
                                  <div key={m.name}>
                                    {i > 0 && (
                                      /* inset hairline divider — 아이콘 오른쪽에서 시작 */
                                      <div style={{
                                        height: "0.5px",
                                        background: "rgba(0,0,0,0.08)",
                                        marginLeft: "68px",
                                      }} />
                                    )}
                                    <div style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "14px",
                                      padding: "13px 18px",
                                    }}>
                                      {/* 시멘틱 컬러 아이콘 배지 */}
                                      <div style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "10px",
                                        background: color.bg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        color: color.fg,
                                      }}>
                                        <m.icon size={18} strokeWidth={1.5} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "2px" }}>
                                          {m.name}
                                        </div>
                                        <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>
                                          {m.desc}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── 공간 디자인 컨셉 ── */}
                      {(() => {
                        // Apple 시스템 컬러 — 컨셉 카드용
                        const conceptColors = [
                          { bg: "rgba(0,122,255,0.1)",   fg: "rgb(0,122,255)"   }, // blue
                          { bg: "rgba(52,199,89,0.1)",   fg: "rgb(34,167,73)"   }, // green
                          { bg: "rgba(255,149,0,0.1)",   fg: "rgb(210,120,0)"   }, // orange
                          { bg: "rgba(88,86,214,0.12)",  fg: "rgb(88,86,214)"   }, // indigo
                        ];
                        return (
                          <div style={{ marginBottom: "28px" }}>
                            <div style={{ marginBottom: "6px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
                                {language === "ko" ? "공간 디자인 컨셉" : "Design Concept"}
                              </span>
                            </div>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "14px", lineHeight: 1.5 }}>
                              {language === "ko" ? "방향을 선택해두면 업체 미팅 때 기준점이 됩니다." : "Choose a direction to guide contractor meetings."}
                            </div>

                            {/* 2열 그리드 */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                              {concepts.map((c, i) => {
                                const picked = selectedInteriorConcept === c.id;
                                const color = conceptColors[i % conceptColors.length];
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedInteriorConcept(picked ? null : c.id)}
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-start",
                                      padding: "16px",
                                      borderRadius: "20px",
                                      border: "none",
                                      outline: picked ? "2.5px solid var(--primary)" : "none",
                                      background: picked ? "white" : "white",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      boxShadow: picked
                                        ? "0 4px 20px rgba(0,0,0,0.1)"
                                        : "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                                      transition: "box-shadow 0.18s ease, outline 0.18s ease",
                                      position: "relative",
                                    }}
                                  >
                                    {/* 아이콘 배지 (상단) */}
                                    <div style={{
                                      width: "48px",
                                      height: "48px",
                                      borderRadius: "14px",
                                      background: picked
                                        ? color.bg.replace("0.1", "0.18").replace("0.12", "0.2")
                                        : color.bg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginBottom: "12px",
                                      color: color.fg,
                                      transition: "background 0.18s ease",
                                    }}>
                                      <c.icon size={22} strokeWidth={1.5} />
                                    </div>

                                    {/* 제목 */}
                                    <div style={{
                                      fontSize: "13.5px",
                                      fontWeight: 640,
                                      color: "var(--text)",
                                      letterSpacing: "-0.3px",
                                      marginBottom: "5px",
                                      lineHeight: 1.3,
                                    }}>
                                      {c.name}
                                    </div>

                                    {/* 설명 */}
                                    <div style={{
                                      fontSize: "12px",
                                      color: "rgba(0,0,0,0.42)",
                                      lineHeight: 1.5,
                                      marginBottom: "10px",
                                      flex: 1,
                                    }}>
                                      {c.desc}
                                    </div>

                                    {/* 태그 */}
                                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                      {c.tags.slice(0, 2).map((t) => (
                                        <span key={t} style={{
                                          fontSize: "10.5px",
                                          fontWeight: 500,
                                          padding: "2px 8px",
                                          borderRadius: "100px",
                                          background: picked
                                            ? color.bg.replace("0.1", "0.14").replace("0.12", "0.16")
                                            : "rgba(0,0,0,0.05)",
                                          color: picked ? color.fg : "rgba(0,0,0,0.4)",
                                          transition: "background 0.18s ease, color 0.18s ease",
                                        }}>{t}</span>
                                      ))}
                                    </div>

                                    {/* 선택됐을 때 우측 상단 체크 */}
                                    {picked && (
                                      <div style={{
                                        position: "absolute",
                                        top: "14px",
                                        right: "14px",
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        background: "var(--primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}>
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── 인테리어 업체 추천 ── */}
                      <div style={{ marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "14px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                            {language === "ko" ? `${regionLabel} 인테리어 업체` : "Local Contractors"}
                          </span>
                          {contractors.length > 0 && (
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {language === "ko" ? "AI 웹 검색 기반" : "via AI search"}
                            </span>
                          )}
                        </div>

                        {contractorsLoading ? (
                          /* 로딩 — Apple shimmer 스켈레톤 */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            overflow: "hidden",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                          }}>
                            {[0, 1, 2].map((i) => (
                              <div key={i}>
                                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "68px" }} />}
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px" }}>
                                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", flexShrink: 0 }} />
                                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
                                    <div style={{ height: "13px", width: "50%", borderRadius: "6px", background: "rgba(0,0,0,0.05)" }} />
                                    <div style={{ height: "11px", width: "80%", borderRadius: "6px", background: "rgba(0,0,0,0.04)" }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : contractors.length > 0 ? (
                          /* 업체 목록 — Apple grouped list */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            overflow: "hidden",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                          }}>
                            {contractors.map((c, i) => (
                              <div key={c.id}>
                                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />}
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px" }}>

                                  {/* 순위 배지 — Apple blue tint */}
                                  <div style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "10px",
                                    background: "rgba(0,122,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    color: "rgb(0,122,255)",
                                    letterSpacing: "-0.5px",
                                  }}>
                                    {i + 1}
                                  </div>

                                  {/* 텍스트 */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "2px" }}>
                                      {c.name}
                                    </div>
                                    {c.description && (
                                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45, marginBottom: "2px" }}>
                                        {c.description}
                                      </div>
                                    )}
                                    {c.address && (
                                      <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {c.address}
                                      </div>
                                    )}
                                  </div>

                                  {/* 액션 버튼 — 전화 / 지도 */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                    {c.phone && (
                                      <a
                                        href={`tel:${c.phone}`}
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "50%",
                                          background: "rgba(0,122,255,0.1)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "rgb(0,122,255)",
                                        }}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                                        </svg>
                                      </a>
                                    )}
                                    {c.mapUrl ? (
                                      <a
                                        href={c.mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "50%",
                                          background: "rgba(52,199,89,0.1)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "rgb(34,167,73)",
                                        }}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                        </svg>
                                      </a>
                                    ) : (
                                      <div style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        background: "rgba(0,0,0,0.04)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "rgba(0,0,0,0.2)",
                                      }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : preferredRegion ? (
                          /* 결과 없음 → 재시도 */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            padding: "28px 20px",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                            textAlign: "center",
                          }}>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "16px" }}>
                              {language === "ko" ? "업체 정보를 불러오지 못했어요." : "Couldn't load contractor info."}
                            </div>
                            <button
                              type="button"
                              onClick={() => setContractorsRetryKey((k) => k + 1)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                fontWeight: 600,
                                padding: "9px 20px",
                                borderRadius: "100px",
                                background: "rgba(0,122,255,0.1)",
                                color: "rgb(0,122,255)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                              </svg>
                              {language === "ko" ? "다시 검색" : "Retry"}
                            </button>
                          </div>
                        ) : (
                          /* 상권 미설정 */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            padding: "28px 20px",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                            textAlign: "center",
                          }}>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", lineHeight: 1.6 }}>
                              {language === "ko" ? "상권을 설정하면 근처 업체를 자동으로 찾아드려요." : "Set your area to find nearby contractors."}
                            </div>
                          </div>
                        )}

                        {/* 견적 팁 — Apple inline info style */}
                        <div style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          background: "rgba(0,122,255,0.06)",
                          marginTop: "10px",
                        }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                            <circle cx="7" cy="7" r="6" stroke="rgb(0,122,255)" strokeWidth="1.4"/>
                            <path d="M7 6v4M7 4.5v.5" stroke="rgb(0,122,255)" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          <span style={{ fontSize: "12.5px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>
                            {language === "ko"
                              ? "최소 2~3곳 견적을 비교하고, 견적서에 자재 사양·브랜드·규격이 명시됐는지 확인하세요."
                              : "Compare 2–3 quotes and verify material brand, grade, and dimensions are specified."}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {currentStage.code === "biz_registration" && (() => {
                  const bizInfoStyle = { display: "flex", flexDirection: "column" as const, gap: "6px" };
                  const bizCardStyle = { background: "rgba(0,0,0,0.03)", borderRadius: "14px", padding: "14px 16px" };
                  const bizSectionTitle = { fontSize: "12px", fontWeight: 700 as const, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" };
                  const bizTag = (color: string) => ({ display: "inline-block", fontSize: "11px", fontWeight: 600 as const, padding: "2px 8px", borderRadius: "20px", background: `${color}18`, color });
                  const infoRow = { display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "13px", lineHeight: 1.5 as const, color: "rgba(0,0,0,0.7)" };
                  const dot = <span style={{ flexShrink: 0, marginTop: "6px", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", display: "inline-block" }} />;

                  const bizCodes: Record<string, { code: string; name: string; note: string }[]> = {
                    food: [
                      { code: "522111", name: "한식 음식점업", note: "찌개·구이·한정식 등 일반 한식" },
                      { code: "522121", name: "외국식 음식점업", note: "이탈리안·일식·중식 등" },
                      { code: "522141", name: "기타 간이음식점업", note: "분식·포장마차·푸드트럭" },
                    ],
                    "cafe-dessert": [
                      { code: "522220", name: "커피 음료점업", note: "카페·테이크아웃 커피 전문점" },
                      { code: "522290", name: "기타 비알코올음료점업", note: "버블티·착즙주스·스무디" },
                      { code: "522210", name: "제과점업", note: "베이커리·디저트 카페" },
                    ],
                    beauty: [
                      { code: "961101", name: "미용업", note: "헤어 커트·펌·염색" },
                      { code: "961201", name: "피부미용업", note: "피부관리·반영구·속눈썹" },
                      { code: "961301", name: "기타 미용업", note: "네일·화장·종합 뷰티" },
                    ],
                    "online-digital": [
                      { code: "479901", name: "전자상거래 소매업", note: "스마트스토어·쿠팡 판매" },
                      { code: "749901", name: "기타 전문 서비스업", note: "디지털 콘텐츠·컨설팅" },
                    ],
                    retail: [
                      { code: "523110", name: "종합소매업", note: "편의점·슈퍼마켓·잡화점" },
                      { code: "524110", name: "섬유·의복 소매업", note: "의류·패션 소매" },
                      { code: "524900", name: "기타 상품 전문 소매업", note: "생활잡화·건강식품 등" },
                    ],
                    fitness: [
                      { code: "912110", name: "체육시설 운영업", note: "헬스장·필라테스·요가" },
                      { code: "912120", name: "골프장 운영업", note: "스크린골프·연습장" },
                    ],
                    education: [
                      { code: "856101", name: "일반 교과학원", note: "학원·과외 교습소" },
                      { code: "856901", name: "기타 기술 및 직업훈련 학원", note: "코딩·어학·직업 교육" },
                    ],
                    pet: [
                      { code: "462420", name: "애완동물 및 관련용품 소매업", note: "펫샵·용품 판매" },
                      { code: "961909", name: "기타 개인 서비스업", note: "펫 미용·호텔·돌봄" },
                    ],
                    "living-service": [
                      { code: "961020", name: "세탁업", note: "세탁·빨래방" },
                      { code: "952100", name: "전기·전자제품 수리업", note: "기기 수리" },
                    ],
                    space: [
                      { code: "551001", name: "숙박업", note: "게스트하우스·민박" },
                      { code: "681099", name: "기타 부동산 임대업", note: "공유오피스·스터디카페" },
                    ],
                    "startup-tech": [
                      { code: "620201", name: "컴퓨터 프로그래밍 서비스업", note: "소프트웨어 개발·SaaS" },
                      { code: "620209", name: "기타 정보기술 서비스업", note: "AI·핀테크·플랫폼" },
                    ],
                  };
                  const codes = bizCodes[industryCategoryId] ?? bizCodes["food"];

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "8px" }}>

                      {/* ── 상호명 입력 ── */}
                      <div style={bizInfoStyle}>
                        <div style={bizSectionTitle}>{language === "ko" ? "상호명 (가게 이름)" : "Store name"}</div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>
                          {language === "ko"
                            ? "사업자등록증에 기재할 상호명을 입력하세요. 나중에 수정할 수 있습니다."
                            : "Enter the name as it will appear on your business registration. You can change it later."}
                        </div>
                        <input
                          type="text"
                          value={storeName}
                          onChange={(e) => {
                            setStoreName(e.target.value);
                            localStorage.setItem("storeName", e.target.value);
                          }}
                          placeholder={language === "ko" ? "예: 홍길동 떡볶이, 카페 온도" : "e.g. Happy Café, Sunrise Bakery"}
                          style={{ border: storeName ? "1.5px solid #34c759" : "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none", background: "rgba(255,255,255,0.8)", width: "100%", boxSizing: "border-box" as const }}
                        />
                        {storeName && (
                          <div style={{ fontSize: "12px", color: "#34c759", fontWeight: 600, marginTop: "4px" }}>
                            {language === "ko" ? `저장됨: "${storeName}"` : `Saved: "${storeName}"`}
                          </div>
                        )}
                      </div>

                      {/* ── 사업자등록 방법 ── */}
                      <div style={bizInfoStyle}>
                        <div style={bizSectionTitle}>{language === "ko" ? "사업자등록 방법 선택" : "How to register"}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {[
                            {
                              title: language === "ko" ? "홈택스 온라인" : "Hometax (online)",
                              badge: language === "ko" ? "추천" : "Recommended",
                              color: "#34c759",
                              points: language === "ko"
                                ? ["24시간 신청 가능", "처리 기간 2~3일", "공동인증서(구 공인인증서) 필요", "국세청 홈택스 → 신청/제출 → 사업자등록신청"]
                                : ["24/7 submission", "2–3 day processing", "Requires joint certificate", "Hometax → Application → Business Registration"]
                            },
                            {
                              title: language === "ko" ? "세무서 직접 방문" : "Tax office visit",
                              badge: language === "ko" ? "즉시 처리" : "Same-day",
                              color: "#007aff",
                              points: language === "ko"
                                ? ["처리 당일 완료", "복잡한 인허가 업종 추천", "준비물: 신분증 + 임대차계약서", "평일 09:00~18:00, 주민등록등본 선택"]
                                : ["Same-day completion", "Best for complex permits", "Bring: ID + lease contract", "Weekdays 09:00–18:00"]
                            }
                          ].map((m) => (
                            <div key={m.title} style={{ ...bizCardStyle, position: "relative" as const }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700 }}>{m.title}</span>
                                <span style={bizTag(m.color)}>{m.badge}</span>
                              </div>
                              {m.points.map((p) => (
                                <div key={p} style={{ ...infoRow, marginBottom: "3px" }}>{dot}<span>{p}</span></div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── 업종코드 & 과세유형 ── */}
                      <div style={bizInfoStyle}>
                        <div style={bizSectionTitle}>{language === "ko" ? "업종코드 & 과세유형" : "Business code & tax type"}</div>
                        <div style={bizCardStyle}>
                          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                            {language === "ko" ? "업종에 맞는 코드를 선택하세요. 잘 모르면 세무서 직원에게 물어보면 됩니다." : "Choose the code that best fits your business."}
                          </div>
                          {codes.map((c) => (
                            <div key={c.code} style={{ display: "flex", gap: "8px", padding: "7px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                              <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "#007aff", flexShrink: 0, paddingTop: "1px" }}>{c.code}</span>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600 }}>{c.name}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{c.note}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                          {[
                            {
                              type: language === "ko" ? "간이과세자" : "Simplified VAT",
                              cond: language === "ko" ? "연 매출 1억 400만원 미만 예상" : "Est. annual revenue < ₩104M",
                              pros: language === "ko" ? "세금계산서 발행 의무 없음 · 부가세 부담 낮음" : "No invoice issuance · lower VAT burden",
                              color: "#34c759"
                            },
                            {
                              type: language === "ko" ? "일반과세자" : "General VAT",
                              cond: language === "ko" ? "연 매출 1억 400만원 이상 or 매입세액 환급 필요 시" : "Revenue ≥ ₩104M or need input VAT refund",
                              pros: language === "ko" ? "매입세금계산서 전액 환급 가능 · 기업 거래 유리" : "Full input VAT refund · better for B2B",
                              color: "#007aff"
                            }
                          ].map((v) => (
                            <div key={v.type} style={bizCardStyle}>
                              <div style={{ ...bizTag(v.color), marginBottom: "6px" }}>{v.type}</div>
                              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>{v.cond}</div>
                              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{v.pros}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── 사업용 통장 ── */}
                      <div style={bizInfoStyle}>
                        <div style={bizSectionTitle}>{language === "ko" ? "사업용 통장 개설" : "Business bank account"}</div>
                        <div style={{ ...bizCardStyle, display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="8" cy="8" r="6.5" stroke="#ff9f0a" strokeWidth="1.4"/><path d="M8 5.5V8.5M8 10v.5" stroke="#ff9f0a" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          <div style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(0,0,0,0.7)" }}>
                            {language === "ko"
                              ? "개인 통장과 사업 통장은 반드시 분리하세요. 세무조사 시 사업 비용 입증이 안 되면 전부 과세 대상이 됩니다."
                              : "Keep personal and business accounts strictly separate. Mixed accounts make it impossible to prove deductible expenses during tax audits."}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { bank: "기업은행 IBK", desc: "소상공인 특화 상품 다수 · 정책자금 연계 유리 · 전국 지점", badge: "정책자금 연계" },
                            { bank: "카카오뱅크 사업자", desc: "비대면 즉시 개설 · 수수료 0원 · 앱 거래 관리 간편", badge: "비대면 추천" },
                            { bank: "우리은행 위비기업", desc: "지역 네트워크 강점 · 세무사·노무사 무료 상담 서비스 포함", badge: "상담 서비스" },
                          ] : [
                            { bank: "IBK Industrial Bank", desc: "Best for policy fund connections · many SME products", badge: "Policy funds" },
                            { bank: "KakaoBank Business", desc: "Instant non-face-to-face opening · zero fees · easy app management", badge: "Digital" },
                            { bank: "Woori Bank", desc: "Free tax/labor consultation included · regional network", badge: "Consulting" },
                          ]).map((b) => (
                            <div key={b.bank} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600 }}>{b.bank}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{b.desc}</div>
                              </div>
                              <span style={bizTag("#007aff")}>{b.badge}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", padding: "4px 2px" }}>
                          {language === "ko" ? "준비물: 사업자등록증 원본, 대표자 신분증, 도장(선택)" : "Bring: business registration certificate, ID, seal (optional)"}
                        </div>
                      </div>

                      {/* ── 세무대리인 결정 — 실제 선택 ── */}
                      <div style={bizInfoStyle}>
                        <div style={bizSectionTitle}>{language === "ko" ? "세무 처리 방식 선택" : "How will you handle taxes?"}</div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>
                          {language === "ko"
                            ? "어떤 선택이든 유효합니다. 아래에서 본인 상황에 맞는 방식을 선택하면 완료 처리됩니다."
                            : "Both are valid. Choose one based on your situation to mark this step done."}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {[
                            {
                              id: "self" as const,
                              title: language === "ko" ? "직접 신고로 진행" : "Self-file",
                              desc: language === "ko" ? "홈택스로 부가세·종합소득세 직접 신고. 직원 없고 매출이 단순할 때 적합합니다." : "File VAT and income tax yourself via Hometax. Works well if you have no staff and simple revenue.",
                              when: language === "ko" ? "적합한 경우: 직원 없음 · 연 매출 3,000만원 미만 · 업종 단순" : "Good if: no employees · revenue < ₩30M · simple business",
                              color: "#34c759"
                            },
                            {
                              id: "cpa" as const,
                              title: language === "ko" ? "세무사(세무대리인) 선임 예정" : "Hire a tax accountant",
                              desc: language === "ko" ? "기장료 월 5~15만원. 원천세·4대보험·부가세·소득세 전부 위임합니다." : "Monthly ₩50K–150K. Delegate payroll tax, VAT, and income tax filing.",
                              when: language === "ko" ? "권장 경우: 직원 1명 이상 · 매출 5,000만원+ 예상 · 정책자금 신청 예정" : "Recommended if: any employees · revenue > ₩50M · applying for policy funds",
                              color: "#007aff"
                            }
                          ].map((opt) => {
                            const selected = cpaDecision === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  const next = selected ? null : opt.id;
                                  setCpaDecision(next);
                                  if (next) localStorage.setItem("cpaDecision", next);
                                  else localStorage.removeItem("cpaDecision");
                                }}
                                style={{
                                  textAlign: "left" as const,
                                  padding: "14px 16px",
                                  borderRadius: "14px",
                                  border: selected ? `1.5px solid ${opt.color}` : "1.5px solid rgba(0,0,0,0.08)",
                                  background: selected ? `${opt.color}08` : "rgba(0,0,0,0.02)",
                                  cursor: "pointer",
                                  transition: "all 0.15s"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                  <div style={{
                                    width: "16px", height: "16px", borderRadius: "50%",
                                    border: selected ? `4.5px solid ${opt.color}` : "1.5px solid rgba(0,0,0,0.2)",
                                    flexShrink: 0, transition: "all 0.15s"
                                  }} />
                                  <span style={{ fontSize: "14px", fontWeight: 700, color: selected ? opt.color : "inherit" }}>{opt.title}</span>
                                </div>
                                <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.5, paddingLeft: "24px" }}>{opt.desc}</div>
                                <div style={{ fontSize: "12px", color: selected ? opt.color : "var(--muted)", lineHeight: 1.4, paddingLeft: "24px", marginTop: "4px", fontWeight: selected ? 500 : 400 }}>{opt.when}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {currentStage.code === "pre_launch_final" && (() => {
                  const s = { display: "flex", flexDirection: "column" as const, gap: "6px" };
                  const card = { background: "rgba(0,0,0,0.03)", borderRadius: "14px", padding: "14px 16px" };
                  const secTitle = { fontSize: "12px", fontWeight: 700 as const, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" };
                  const tag = (c: string) => ({ display: "inline-block" as const, fontSize: "11px", fontWeight: 600 as const, padding: "2px 8px", borderRadius: "20px", background: `${c}18`, color: c });
                  const infoR = { display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "13px", lineHeight: 1.5 as const, color: "rgba(0,0,0,0.7)" };
                  const d = <span style={{ flexShrink: 0, marginTop: "6px", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", display: "inline-block" }} />;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "8px" }}>

                      {/* ── 초도 발주 전략 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "초도 발주 & 재고 전략" : "First inventory order strategy"}</div>
                        <div style={card}>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                            {language === "ko" ? "얼마나 주문할까?" : "How much to order?"}
                          </div>
                          {(language === "ko" ? [
                            "오픈 첫 2주 예상 매출의 60~70% 수준으로 발주하세요.",
                            "신선 식재료(채소·육류·유제품)는 3~5일치 이하로 제한하세요.",
                            "포장재·소모품은 1개월치 여유 있게 확보하세요.",
                            "첫 주문 후 실제 소진율을 보고 다음 발주량을 조정하세요.",
                            "재고 손실 허용 마진: 매출의 5~8% 이내로 설정하세요.",
                          ] : [
                            "Order 60–70% of estimated first 2-week sales.",
                            "Cap fresh ingredients (produce, meat, dairy) at 3–5 days supply.",
                            "Stock 1 month of packaging and consumables.",
                            "Adjust next order based on actual turnover from week 1.",
                            "Set waste/loss budget at 5–8% of expected sales.",
                          ]).map((p) => <div key={p} style={{ ...infoR, marginBottom: "4px" }}>{d}<span>{p}</span></div>)}
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                          {(language === "ko"
                            ? ["유통기한 긴 재료 먼저 발주", "냉동 vs 냉장 비율 확인", "결제조건(현금/카드/월납) 협의"]
                            : ["Order shelf-stable items first", "Confirm freeze/chill split", "Negotiate payment terms"]
                          ).map((t) => (
                            <span key={t} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", background: "rgba(0,122,255,0.07)", color: "#007aff", fontWeight: 500 }}>{t}</span>
                          ))}
                        </div>
                      </div>

                      {/* ── 오픈 당일 역할 배분 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "오픈 당일 역할 배분" : "Opening day roles"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { role: "입구·홀 안내", task: "고객 맞이, 웨이팅 관리, 주문 안내", color: "#007aff" },
                            { role: "주문·카운터", task: "POS 결제, 주문 확인, 포장 대응", color: "#34c759" },
                            { role: "주방·제조", task: "음식/음료 제조, 플레이팅, 품질 관리", color: "#ff9f0a" },
                            { role: "서빙·후처리", task: "서빙, 테이블 정리, 재고 보충", color: "#af52de" },
                          ] : [
                            { role: "Door / Floor", task: "Welcome guests, manage wait, seat direction", color: "#007aff" },
                            { role: "Counter / POS", task: "Take orders, process payments, handle packaging", color: "#34c759" },
                            { role: "Kitchen / Prep", task: "Food/drink prep, plating, quality check", color: "#ff9f0a" },
                            { role: "Serving / Cleanup", task: "Serve, clear tables, restock supplies", color: "#af52de" },
                          ]).map((r) => (
                            <div key={r.role} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)", alignItems: "flex-start" }}>
                              <span style={tag(r.color)}>{r.role}</span>
                              <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.4, paddingTop: "2px" }}>{r.task}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", padding: "2px" }}>
                          {language === "ko" ? "1인 운영이라면 주문→제조→서빙 순서를 미리 연습하세요. 첫 러시(rush)가 가장 힘듭니다." : "If running solo, rehearse the order→prep→serve sequence. The first rush is the hardest."}
                        </div>
                      </div>

                      {/* ── SNS 오픈 예고 전략 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "SNS 오픈 예고 전략" : "SNS teaser strategy"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { when: "오픈 2주 전", what: "매장 공사·세팅 과정 사진/영상 (behind the scenes)", platform: "인스타 릴스" },
                            { when: "오픈 1주 전", what: "메뉴 소개 + 오픈 날짜 공지 + 이벤트(첫 방문 할인 등)", platform: "인스타·카카오" },
                            { when: "오픈 당일", what: "라이브 스토리 + 영수증 이벤트 + 네이버 플레이스 등록 완료", platform: "전 채널" },
                          ] : [
                            { when: "2 weeks before", what: "Behind-the-scenes setup & construction photos/videos", platform: "Instagram Reels" },
                            { when: "1 week before", what: "Menu reveal + opening date + opening event (discount, etc.)", platform: "Instagram · KakaoTalk" },
                            { when: "Opening day", what: "Live stories + receipt event + Naver Place registration complete", platform: "All channels" },
                          ]).map((row) => (
                            <div key={row.when} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                              <div style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "#ff9f0a", width: "70px", paddingTop: "2px" }}>{row.when}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>{row.what}</div>
                                <div style={{ fontSize: "11px", color: "var(--muted)" }}>{row.platform}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {currentStage.code === "first_month_check" && (() => {
                  const s = { display: "flex", flexDirection: "column" as const, gap: "6px" };
                  const card = { background: "rgba(0,0,0,0.03)", borderRadius: "14px", padding: "14px 16px" };
                  const secTitle = { fontSize: "12px", fontWeight: 700 as const, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" };
                  const tag = (c: string) => ({ display: "inline-block" as const, fontSize: "11px", fontWeight: 600 as const, padding: "2px 8px", borderRadius: "20px", background: `${c}18`, color: c });
                  const infoR = { display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "13px", lineHeight: 1.5 as const, color: "rgba(0,0,0,0.7)" };
                  const d = <span style={{ flexShrink: 0, marginTop: "6px", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", display: "inline-block" }} />;

                  const fixedCosts = (monthlyCosts as { rent: number; labor: number; utilities: number }).rent
                    + (monthlyCosts as { rent: number; labor: number; utilities: number }).labor
                    + (monthlyCosts as { rent: number; labor: number; utilities: number }).utilities;
                  const emergencyTarget = fixedCosts > 0 ? fixedCosts * 1.5 : null;
                  const fmt = (n: number) => `${Math.round(n / 10000).toLocaleString()}만원`;

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "8px" }}>

                      {/* ── 비상금 계산 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "비상금 목표 계산" : "Emergency reserve target"}</div>
                        {emergencyTarget ? (
                          <div style={{ ...card, background: "rgba(52,199,89,0.06)", border: "0.5px solid rgba(52,199,89,0.25)" }}>
                            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>
                              {language === "ko" ? "분석 결과 (입력된 월 고정비 기준)" : "Based on your monthly fixed costs"}
                            </div>
                            <div style={{ fontSize: "22px", fontWeight: 700, color: "#34c759", marginBottom: "4px" }}>
                              {fmt(emergencyTarget)}
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}>
                              {language === "ko"
                                ? `임대료(${fmt((monthlyCosts as {rent:number}).rent)}) + 인건비(${fmt((monthlyCosts as {labor:number}).labor)}) + 공과금(${fmt((monthlyCosts as {utilities:number}).utilities)}) × 1.5배`
                                : `Rent + Labor + Utilities × 1.5`}
                            </div>
                          </div>
                        ) : (
                          <div style={card}>
                            <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                              {language === "ko"
                                ? "내 가게 현황 화면에서 월 비용을 입력하면 비상금 목표액을 자동으로 계산해드립니다."
                                : "Enter your monthly costs in the My Store screen to auto-calculate your target emergency reserve."}
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "8px" }}>
                              {language === "ko" ? "기본 원칙: 월 고정비 × 1.5개월치" : "Rule of thumb: monthly fixed costs × 1.5 months"}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── 현금흐름 기록 도구 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "현금흐름 기록 도구 선택" : "Cash flow tracking tool"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { name: "캐시노트 (CashNote)", desc: "카드사·POS 연동 자동 집계 · 일별 매출 무료 확인 · 소상공인 1위 앱", badge: "가장 쉬움", color: "#34c759" },
                            { name: "build.up 내 가게 현황", desc: "이 앱에서 바로 기록 · 일별 매출 + 비용 구조 + KPI 자동 분석", badge: "지금 바로", color: "#007aff" },
                            { name: "엑셀·구글 스프레드시트", desc: "자유도 최고 · 직접 수식 관리 · 별도 학습 필요", badge: "고급 사용자", color: "#ff9f0a" },
                          ] : [
                            { name: "CashNote", desc: "Auto-sync with card networks/POS · free daily sales tracking · #1 app for Korean small biz", badge: "Easiest", color: "#34c759" },
                            { name: "build.up My Store", desc: "Record directly in this app · daily sales + cost structure + KPI analysis", badge: "Start now", color: "#007aff" },
                            { name: "Excel / Google Sheets", desc: "Maximum flexibility · custom formulas · requires more setup", badge: "Power users", color: "#ff9f0a" },
                          ]).map((t) => (
                            <div key={t.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                              <div style={{ flex: 1, marginRight: "8px" }}>
                                <div style={{ fontSize: "13px", fontWeight: 600 }}>{t.name}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{t.desc}</div>
                              </div>
                              <span style={tag(t.color)}>{t.badge}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── 첫 달 생존 원칙 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "개업 첫 달 — 가장 중요한 것들" : "First month survival priorities"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(language === "ko" ? [
                            { icon: "📊", title: "매일 매출·비용 기록", desc: "감이 아닌 숫자로 판단해야 합니다. 하루라도 빠지면 데이터가 끊깁니다." },
                            { icon: "💬", title: "고객 피드백 첫 2주 내 수집", desc: "불만 고객은 말하지 않고 떠납니다. 설문지·리뷰 요청을 적극 활용하세요." },
                            { icon: "⚠️", title: "원가율을 주 단위로 점검", desc: "식재료 낭비·도난·비율 오류가 생기는 건 항상 초반입니다." },
                            { icon: "📱", title: "네이버 플레이스 리뷰 관리", desc: "초기 리뷰 10개가 검색 노출을 결정합니다. 방문 고객에게 리뷰 요청하세요." },
                            { icon: "🚨", title: "적자여도 3개월은 지켜봐라", desc: "오픈 초기 적자는 정상입니다. 단, 매주 숫자가 개선되고 있어야 합니다." },
                          ] : [
                            { icon: "📊", title: "Record sales + costs every day", desc: "Decisions based on data, not gut feeling. Missing a day breaks your tracking." },
                            { icon: "💬", title: "Collect feedback in the first 2 weeks", desc: "Unhappy customers leave without saying a word. Actively request reviews." },
                            { icon: "⚠️", title: "Check food cost ratio weekly", desc: "Waste, theft, and ratio errors always appear in the first weeks." },
                            { icon: "📱", title: "Manage Naver Place reviews", desc: "Your first 10 reviews determine search visibility. Ask every visitor." },
                            { icon: "🚨", title: "A loss in month 1 is normal", desc: "But numbers must be improving week by week. If not, diagnose immediately." },
                          ]).map((item) => (
                            <div key={item.title} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)", alignItems: "flex-start" }}>
                              <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>{item.icon}</span>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{item.title}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{item.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {(() => {
                  const visibleTasks = stageTasks.filter((t) => t.taskId !== "cpa-decision-made");
                  const visibleDone = visibleTasks.filter((t) => isPreLaunch ? (preLaunchDoneMap[t.taskId] ?? false) : t.status === "completed").length;
                  if (visibleTasks.length === 0) return null;
                  return (
                    <div style={styles.taskProgress}>
                      {language === "ko" ? `${visibleDone} / ${visibleTasks.length} 완료` : `${visibleDone} of ${visibleTasks.length} done`}
                    </div>
                  );
                })()}
                <div style={styles.taskChecklist}>
                  {stageTasks.filter((task) =>
                    // Tasks handled by inline UI — hidden from generic checklist
                    task.taskId !== "cpa-decision-made"
                  ).map((task) => {
                    const done = isPreLaunch
                      ? (preLaunchDoneMap[task.taskId] ?? false)
                      : task.status === "completed";
                    return (
                      <button
                        key={task.taskId}
                        type="button"
                        style={{
                          ...styles.taskCheckItem,
                          ...(done ? styles.taskCheckItemDone : {}),
                          ...(isPreLaunch ? { cursor: "default" } : {})
                        }}
                        onClick={() => !isPreLaunch && handleTaskToggle(stageId, task.taskId)}
                      >
                        <div style={{
                          ...styles.taskCheckCircle,
                          ...(done ? styles.taskCheckCircleDone : {})
                        }}>
                          {done && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            ...styles.taskCheckTitle,
                            ...(done ? styles.taskCheckTitleDone : {})
                          }}>
                            {localizeTaskTitle(task.taskId, language) ?? task.title}
                          </div>
                          {!done && currentStage.code === "construction_setup" && (() => {
                            const hints: Record<string, string> = {
                              "contractor-selected": language === "ko"
                                ? "위 자재 목록과 선택한 컨셉을 업체에 전달하면 더 정확한 견적을 받을 수 있어요."
                                : "Share the material list and chosen concept above for more accurate quotes.",
                              "design-approved": language === "ko"
                                ? "도면에 전기·배관·조명 위치가 반영됐는지 확인하세요. 시공 시작 후 변경은 추가 비용이 발생합니다."
                                : "Verify electrical, plumbing, and lighting positions are in the drawings before work starts.",
                              "construction-complete": language === "ko"
                                ? "현장 점검 시 자재 사양·마감 품질·누수·전기 작동 여부를 항목별로 체크하세요."
                                : "During walkthrough, check material specs, finish quality, leaks, and electrical operation.",
                            };
                            const hint = hints[task.taskId];
                            return hint ? (
                              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4, marginTop: "3px" }}>{hint}</div>
                            ) : null;
                          })()}
                        </div>
                        {task.estimatedMinutes && !done && (
                          <div style={{ ...styles.taskProgress, flexShrink: 0 }}>{task.estimatedMinutes}{language === "ko" ? "분" : "m"}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={styles.stageFooter}>
                  {prevTraversedStage ? (
                    <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
                      {language === "ko" ? "← 이전 단계" : "← Back"}
                    </button>
                  ) : null}
                  {correctedProgressPercent >= 100 ? (
                    <button
                      type="button"
                      disabled={saveStatus === "saving"}
                      style={{
                        ...styles.primaryButton,
                        opacity: saveStatus === "saving" ? 0.6 : 1,
                        background: saveStatus === "saved" ? "#34c759" : saveStatus === "error" ? "#ff3b30" : undefined,
                        transition: "background 0.2s, opacity 0.2s",
                      }}
                      onClick={async () => {
                        setSaveStatus("saving");
                        try {
                          await persistCurrentState();
                          setSaveStatus("saved");
                          setTimeout(() => setSaveStatus("idle"), 2000);
                        } catch {
                          setSaveStatus("error");
                          setTimeout(() => setSaveStatus("idle"), 2500);
                        }
                      }}
                    >
                      {saveStatus === "saving"
                        ? (language === "ko" ? "저장 중…" : "Saving…")
                        : saveStatus === "saved"
                        ? (language === "ko" ? "저장됨 ✓" : "Saved ✓")
                        : saveStatus === "error"
                        ? (language === "ko" ? "저장 실패 — 다시 시도" : "Save failed — retry")
                        : (language === "ko" ? "수정 내용 저장" : "Save changes")}
                    </button>
                  ) : stageId === "first-month-check" ? (
                    <button
                      type="button"
                      style={{ ...styles.primaryButton, opacity: allDone ? 1 : 0.45, background: allDone ? "linear-gradient(135deg, #34c759, #30a84e)" : undefined }}
                      onClick={() => { handleStageContinue(stageId); handleLaunchBusiness(); }}
                      disabled={!allDone}
                    >
                      {language === "ko" ? "개업 시작하기" : "Launch my business"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={{ ...styles.primaryButton, opacity: allDone ? 1 : 0.45 }}
                      onClick={() => handleStageContinue(stageId)}
                      disabled={!allDone}
                    >
                      {language === "ko" ? "다음 단계로" : "Continue"}
                    </button>
                  )}
                  <button type="button" style={styles.button} onClick={resetDemo}>
                    {copy.common.resetDemo}
                  </button>
                </div>
              </>
            );
          })() : isGuideStage ? (
            currentStage.code === "tax_guide" ? (() => {
              // ── 업종별 절세 포인트 데이터 ──
              const taxTipsMap: Record<string, { label: string; detail: string }[]> = {
                food: [
                  { label: "식재료·소모품 전액 비용처리", detail: "원재료, 포장재, 냅킨, 위생용품 등 매입 세금계산서·카드영수증 필수 보관" },
                  { label: "배달 수수료 비용처리", detail: "배민·쿠팡이츠 수수료는 전액 사업 비용. 월 정산서 파일로 보관" },
                  { label: "인테리어비 5년 감가상각", detail: "전액 즉시 공제 불가. 5년 정액/정률 감가상각으로 분산 처리" },
                  { label: "유니폼·작업복 비용처리", detail: "직원 전용 의류는 복리후생비로 전액 처리 가능" },
                ],
                "cafe-dessert": [
                  { label: "원두·식재료 매입세금계산서 챙기기", detail: "거래처에 사업자등록증 전달하고 세금계산서 발급 요청. VAT 환급 핵심" },
                  { label: "에스프레소 머신 등 고가장비 감가상각", detail: "300만 원 이상 장비는 5년 이상 감가상각. 소모품(필터, 청소용품)은 즉시 처리" },
                  { label: "인테리어비 5년 감가상각", detail: "카페 특성상 인테리어 비중 높음. 감가상각 스케줄 세무사와 설정" },
                  { label: "배달·픽업 포장재 전액 비용처리", detail: "컵, 홀더, 봉투 등 포장재 구입 영수증 전량 보관" },
                ],
                beauty: [
                  { label: "시술 소모품 전액 비용처리", detail: "필러, 왁스, 시술 재료 등 소모품은 매입 즉시 전액 비용처리" },
                  { label: "기기·장비 감가상각", detail: "레이저, 피부관리 기기 등 고가 장비는 내용연수에 따라 감가상각" },
                  { label: "위생용품·소모품 비용처리", detail: "장갑, 마스크, 소독제 등 위생 소모품 전액 처리" },
                  { label: "고객 홍보비 비용처리", detail: "SNS 광고비, 이벤트 비용, 촬영비 전액 광고선전비 처리" },
                ],
                retail: [
                  { label: "매입 원가 정확히 기록", detail: "재고 매입 세금계산서 전량 보관. 매출원가 계산 기준이 됨" },
                  { label: "재고 손모·폐기 비용처리", detail: "폐기 시 사진·폐기확인서 보관하면 손실 비용처리 가능" },
                  { label: "매장 집기 감가상각", detail: "진열대, 냉장쇼케이스 등 집기는 5년 감가상각" },
                  { label: "플랫폼 수수료 비용처리", detail: "스마트스토어, 쿠팡 수수료 정산내역 월별 보관" },
                ],
                fitness: [
                  { label: "수업 장비·운동기구 감가상각", detail: "트레드밀, 웨이트 기구 등 내용연수 5년 기준 감가상각" },
                  { label: "강사 인건비 원천세 처리", detail: "프리랜서 강사 3.3% 원천징수 의무. 급여 지급 시 즉시 신고" },
                  { label: "수업 영상·홍보 콘텐츠 비용처리", detail: "촬영, 편집, 플랫폼 구독비 전액 광고선전비·교육비 처리" },
                  { label: "소모품(수건, 위생용품) 비용처리", detail: "회원 제공 소모품 전액 복리후생비 또는 소모품비로 처리" },
                ],
                "online-digital": [
                  { label: "서버·클라우드·SaaS 비용처리", detail: "AWS, 카페24, 솔루션 구독료 전액 통신비·지급수수료로 처리" },
                  { label: "플랫폼 수수료 비용처리", detail: "스마트스토어·쿠팡·크몽 수수료 정산서 월별 보관" },
                  { label: "광고비 전액 비용처리", detail: "네이버·구글·메타 광고비 세금계산서 or 신용카드 영수증 보관" },
                  { label: "프리랜서 용역비 원천세 처리", detail: "디자이너, 개발자 외주 시 3.3% 원천징수 후 다음달 10일 납부" },
                ],
                education: [
                  { label: "교재·학습자료 매입비 비용처리", detail: "교재, 문제집, 인쇄물 구매 영수증 전량 보관. 교육비 또는 소모품비 처리" },
                  { label: "강사 인건비 원천세 처리", detail: "프리랜서 강사 3.3% 원천징수 의무. 정규직은 근로소득세. 매월 10일 홈택스 신고" },
                  { label: "학원 시설비 감가상각", detail: "책상·칠판·프로젝터 등 집기는 5년 감가상각. 300만원 미만 소액은 즉시 비용처리" },
                  { label: "온라인 교육 플랫폼 비용처리", detail: "Zoom, 구글 워크스페이스, LMS 구독료 전액 통신비·지급수수료 처리" },
                ],
                pet: [
                  { label: "반려동물 사료·소모품 전액 비용처리", detail: "사료, 간식, 위생용품, 장난감 등 매입 영수증 보관. 매출원가 또는 소모품비" },
                  { label: "의료·미용 장비 감가상각", detail: "미용 테이블, 드라이어, 욕조 등 장비는 5년 기준 감가상각" },
                  { label: "위생·살균 소모품 비용처리", detail: "살균제, 일회용 장갑, 타올 등 위생용품 전액 소모품비 처리" },
                  { label: "수의사 자문료·위탁 비용처리", detail: "건강 관리 자문, 예방접종 위탁 시 전문가 용역비 비용처리 가능" },
                ],
                "living-service": [
                  { label: "세제·세탁용품 전액 비용처리", detail: "업소용 세제, 유연제 등 소모품 매입 영수증 보관" },
                  { label: "장비 수리·유지비 비용처리", detail: "세탁기·건조기 수리비, AS 비용 전액 수선유지비 처리" },
                  { label: "차량 유류비 비용처리", detail: "배달·출장 서비스 시 차량 유류비, 주차비 전액 비용처리" },
                ],
                space: [
                  { label: "공간 임대료 전액 비용처리", detail: "건물 월세, 관리비, 공과금 전액 임차료·지급임차료 처리" },
                  { label: "인테리어·비품 감가상각", detail: "소파, 책상, 파티션 등 비품 5년 감가상각. 300만원 미만 즉시 비용" },
                  { label: "Wi-Fi·CCTV 구독료 비용처리", detail: "통신비·보안 비용으로 전액 처리 가능" },
                ],
                "startup-tech": [
                  { label: "클라우드·SaaS 구독료 전액 비용처리", detail: "AWS, Vercel, GitHub, Notion 등 구독료 전액 지급수수료 처리" },
                  { label: "인건비 세액공제 (R&D)", detail: "연구인력개발비 세액공제 최대 25%. 벤처인증 시 추가 혜택" },
                  { label: "법인카드 사용 의무화", detail: "모든 경비를 법인카드로 결제. 개인카드 사용 시 비용 불인정 위험" },
                  { label: "스톡옵션 비과세 활용", detail: "벤처기업 인증 후 부여 시 행사 차익 연 5천만원 비과세" },
                ],
              };
              const taxTips = taxTipsMap[industryCategoryId] ?? taxTipsMap["food"];

              const taxCheckItems = [
                { id: "tc-hometax",  label: "홈택스 사업자 회원가입",       detail: "hometax.go.kr → 사업자 공인인증서 가입. 세금계산서 발행·조회 필수" },
                { id: "tc-bizcard",  label: "사업용 카드 별도 개설",         detail: "개인 카드 혼용 시 비용처리 불인정 위험. 전용 카드 1개 이상 필수" },
                { id: "tc-pos",      label: "카드단말기 국세청 신고",         detail: "홈택스 → 사업장 현황신고 → 결제단말기 신고. 미신고 시 가산세" },
                { id: "tc-cash",     label: "현금영수증 가맹점 등록",         detail: "소비자 요청 시 의무 발급. 미등록 시 건당 5% 과태료" },
                { id: "tc-receipt",  label: "매입 영수증 보관 체계 수립",     detail: "앱(삼쩜삼·자비스) 또는 월별 폴더로 분류. 5년간 보관 의무" },
                { id: "tc-vat-type", label: "과세유형 확인 (일반 / 간이)",   detail: "직전연도 매출 8,000만 원 미만이면 간이과세 가능. 세무사 상담 권장" },
              ];
              const tcChecked = taxCheckItems.filter(t => taxChecks[t.id]).length;

              const taxSchedule = [
                { tax: "부가가치세", timing: "1월·7월 25일", cycle: "반기", note: "간이과세자는 1월만" },
                { tax: "종합소득세", timing: "5월 31일",    cycle: "연 1회", note: "성실신고 대상자는 6월" },
                { tax: "원천세",    timing: "매월 10일",    cycle: "월납",  note: "직원 고용 시만 해당" },
                { tax: "4대보험",   timing: "매월 10일",    cycle: "월납",  note: "직원 고용 시만 해당" },
              ];

              const cpaNeeded = [
                { condition: "직원 고용",              reason: "4대보험·원천세 신고 오류 가능성 높음. 월 수임료 < 가산세" },
                { condition: "연 매출 1억 원 초과 예상", reason: "일반과세 전환·부가세·종소세 복잡도 급증" },
                { condition: "인테리어 비용 3,000만 원+", reason: "감가상각 스케줄 오류 시 수년간 비용 누락" },
                { condition: "복수 사업장 운영",         reason: "사업장별 세금 분리 신고 필요" },
              ];

              return (
                <>
                  <article style={styles.step}>
                    <div style={styles.stepMeta}>세무</div>
                    <div style={styles.stepTitle}>{activeGuide?.title ?? "세무 기본 가이드"}</div>
                    <div style={styles.stepBody}>{activeGuide?.summary ?? "오픈 전후 꼭 확인해야 할 세무 기초를 단계별로 정리합니다."}</div>
                    {activeGuide && (
                      <div style={activeGuideFreshness.tone === "critical" ? styles.criticalText : activeGuideFreshness.tone === "warning" ? styles.warningText : styles.freshnessText}>
                        {activeGuideFreshness.summary}
                      </div>
                    )}

                    {/* 신고 일정표 */}
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "20px" }}>
                      <div style={{ padding: "20px 20px 14px" }}>
                        <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Tax Calendar</div>
                        <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>신고 일정표</div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>놓치면 가산세. 미리 캘린더에 등록해두세요.</div>
                      </div>
                      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
                      {taxSchedule.map((row, i) => (
                        <div key={i}>
                          {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
                          <div style={{ display: "flex", alignItems: "center", padding: "13px 20px", gap: "12px" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14.5px", fontWeight: 560, color: "var(--text)", letterSpacing: "-0.2px" }}>{row.tax}</div>
                              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", marginTop: "2px" }}>{row.note}</div>
                            </div>
                            <div style={{ textAlign: "right" as const }}>
                              <div style={{ fontSize: "13.5px", fontWeight: 620, color: "rgb(0,122,255)", letterSpacing: "-0.2px" }}>{row.timing}</div>
                              <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.38)", marginTop: "2px" }}>{row.cycle}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 오픈 전 필수 세팅 체크리스트 */}
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
                      <div style={{ padding: "20px 20px 14px" }}>
                        <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Must-Do</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>오픈 전 필수 세팅</div>
                          <div style={{ fontSize: "13px", fontWeight: 620, color: tcChecked === taxCheckItems.length ? "rgb(52,199,89)" : "rgba(0,0,0,0.35)", transition: "color 0.2s" }}>{tcChecked} / {taxCheckItems.length}</div>
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>놓치면 나중에 가산세·과태료로 돌아옵니다.</div>
                      </div>
                      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
                      {taxCheckItems.map((item, i) => {
                        const done = !!taxChecks[item.id];
                        return (
                          <div key={item.id}>
                            {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: done ? "rgba(52,199,89,0.04)" : "white", transition: "background 0.15s" }}
                              onClick={() => setTaxChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                              <div style={{ flexShrink: 0, marginTop: "1px", width: "22px", height: "22px", borderRadius: "7px", border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: done ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14.5px", fontWeight: 500, color: done ? "rgba(0,0,0,0.28)" : "var(--text)", textDecoration: done ? "line-through" : "none", letterSpacing: "-0.2px", lineHeight: 1.4, transition: "all 0.15s" }}>{item.label}</div>
                                {!done && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{item.detail}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 절세 포인트 */}
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
                      <div style={{ padding: "20px 20px 14px" }}>
                        <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Tax Savings</div>
                        <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>절세 포인트</div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>비용처리만 잘해도 세금이 달라집니다.</div>
                      </div>
                      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
                      {taxTips.map((tip, i) => (
                        <div key={i}>
                          {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
                          <div style={{ padding: "14px 20px" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: 560, color: "var(--text)", letterSpacing: "-0.2px", marginBottom: "4px" }}>{tip.label}</div>
                            <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.45)", lineHeight: 1.5 }}>{tip.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 세무사가 필요한 순간 */}
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
                      <div style={{ padding: "20px 20px 14px" }}>
                        <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>When to Hire</div>
                        <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>세무사가 필요한 순간</div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>이 조건 중 하나라도 해당되면 혼자 하지 마세요.</div>
                      </div>
                      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
                      {cpaNeeded.map((item, i) => (
                        <div key={i}>
                          {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "13px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgb(255,59,48)", flexShrink: 0 }} />
                              <span style={{ fontSize: "14px", fontWeight: 570, color: "var(--text)", letterSpacing: "-0.2px" }}>{item.condition}</span>
                            </div>
                            <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", textAlign: "right" as const, lineHeight: 1.45 }}>{item.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Q&A */}
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" }}>
                      <div style={{ padding: "20px 20px 14px" }}>
                        <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Tax Q&A</div>
                        <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" }}>세무 질문하기</div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>세금 신고, 비용처리, 증빙 등 궁금한 점을 물어보세요.</div>
                      </div>
                      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />
                      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <textarea
                          value={guideQuestion}
                          onChange={(e) => { setGuideQuestion(e.target.value); setKnowledgeQaText(""); setKnowledgeQaError(""); }}
                          placeholder="예: 인테리어 비용은 전액 비용처리가 되나요?"
                          style={{ ...styles.textarea, ...styles.aiTextarea, borderRadius: "12px" }}
                        />
                        <button
                          type="button"
                          style={{ alignSelf: "flex-end", fontSize: "14px", fontWeight: 600, color: guideQuestion.trim() ? "white" : "rgba(0,0,0,0.3)", background: guideQuestion.trim() ? "rgb(0,122,255)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "10px", padding: "9px 18px", cursor: guideQuestion.trim() ? "pointer" : "default", transition: "all 0.2s" }}
                          onClick={() => handleKnowledgeQuestion("tax")}
                          disabled={!guideQuestion.trim() || knowledgeQaStatus === "loading"}
                        >
                          {knowledgeQaStatus === "loading" ? "답변 중..." : "질문하기"}
                        </button>
                        {knowledgeQaError && <div style={styles.warningText}>{knowledgeQaError}</div>}
                        {(knowledgeQaText || knowledgeQaStatus === "loading") && (
                          <div style={{ borderRadius: "14px", background: "rgba(0,122,255,0.04)", border: "0.5px solid rgba(0,122,255,0.15)", padding: "14px 16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,80,200,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>AI 답변 · 2026 지식베이스 기반</div>
                            <div style={{ fontSize: "14px", color: "rgba(0,0,0,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
                              {knowledgeQaText}
                              {knowledgeQaStatus === "loading" && <span style={{ display: "inline-block", width: "2px", height: "14px", background: "rgba(0,122,255,0.7)", marginLeft: "2px", verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" }} />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                  <div style={styles.stageFooter}>
                    {prevTraversedStage && (
                      <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
                        {language === "ko" ? "← 이전 단계" : "← Back"}
                      </button>
                    )}
                    <button type="button" style={{ ...styles.primaryButton }} onClick={() => handleVerificationContinue("tax-guide")}>
                      {copy.home.markTaxReviewed}
                    </button>
                  </div>
                </>
              );
            })() : (
            (() => {
              // ── 정책자금 종류 ──
              const loanFunds = [
                { name: "성장기반자금", target: "소공인 (제조업 10인 미만)", rate: "3.56%", limit: "최대 7천만 원", tag: "" },
                { name: "일반경영안정자금", target: "업력 무관 소상공인 전체", rate: "3.56%", limit: "최대 7천만 원", tag: "" },
                { name: "혁신성장촉진자금", target: "수출·매출 성장 기업", rate: "3.36%", limit: "최대 1억 원", tag: "우대" },
                { name: "청년고용연계자금", target: "만 39세 이하 청년 창업자", rate: "2.96%", limit: "최대 7천만 원", tag: "청년" },
                { name: "청년전용창업자금 (중진공)", target: "만 39세 이하 · 업력 3년 미만", rate: "2.5% 고정", limit: "최대 1억 원 (제조 2억)", tag: "청년" },
                { name: "재도전특별자금", target: "재창업자 (폐업 이력 있음)", rate: "3.36~4.56%", limit: "최대 7천만 원", tag: "" },
                { name: "긴급경영안정자금", target: "재해·경영위기 피해 사업자", rate: "2.0~2.96%", limit: "최대 7천만 원", tag: "긴급" },
              ];

              // ── 자격 요건 체크리스트 ──
              const eligChecks = [
                { id: "elig-biz", label: "사업자등록증 발급 완료", detail: "개인사업자 또는 법인 모두 가능. 업력 무관 지원 가능 (자금별 상이)" },
                { id: "elig-noTax", label: "국세·지방세 체납 없음", detail: "체납 이력이 있으면 즉시 탈락. 홈택스에서 납세증명서 미리 확인" },
                { id: "elig-credit", label: "신용점수 확인 (NCB 기준)", detail: "일반 자금은 특별 제한 없음. 신용취약자금은 839점 이하 대상" },
                { id: "elig-noOverlap", label: "동일 정책자금 중복 수령 없음", detail: "소진공·중진공 동일 계열 자금은 중복 지원 불가. 기존 대출 상환 상태 확인" },
                { id: "elig-industry", label: "업종 제한 확인", detail: "유흥업·도박 등 일부 업종 제외. 소진공 홈페이지에서 자금별 제외 업종 확인" },
                { id: "elig-region", label: "사업장 소재지 확인", detail: "비수도권 소재 시 우대금리 0.2~0.5%p 추가 적용 가능" },
              ];
              const eligDone = eligChecks.filter(c => loanChecks[c.id]).length;

              // ── 준비 서류 체크리스트 ──
              const docChecks = [
                { id: "doc-biz", label: "사업자등록증 사본", detail: "국세청 홈택스 또는 정부24에서 발급" },
                { id: "doc-vat", label: "부가세 과세표준증명원", detail: "홈택스 → 민원증명 → 부가가치세 과세표준증명. 창업 초기는 생략 가능" },
                { id: "doc-revenue", label: "매출 증빙 (카드매출·세금계산서)", detail: "카드 결제 내역 또는 세금계산서 합계표. 최근 6개월~1년치" },
                { id: "doc-id", label: "신분증 사본", detail: "대표자 주민등록증 또는 운전면허증" },
                { id: "doc-bank", label: "사업용 통장 사본", detail: "사업 관련 입출금 내역이 있는 통장. 개인통장 혼용 시 불이익 가능" },
                { id: "doc-plan", label: "사업계획서", detail: "소진공 신청 시 필수. 창업 목적·예상 매출·자금 사용 계획 포함. A4 3~5장 권장" },
                { id: "doc-tax", label: "납세증명서 (국세·지방세)", detail: "정부24 또는 홈택스에서 발급. 체납 없음을 증명" },
              ];
              const docDone = docChecks.filter(c => loanChecks[c.id]).length;

              // ── 승인률 높이는 전략 ──
              const approvalTips = [
                { title: "사업계획서가 당락을 가릅니다", body: "심사관은 '이 사람이 돈을 갚을 수 있는가'를 봅니다. 매출 목표를 구체적 수치(예: 월 매출 300만 원 목표, 좌석 수 20석 × 객단가 × 회전율)로 뒷받침하세요." },
                { title: "매출 감소 사유는 반드시 설명하세요", body: "코로나·인테리어 공사 등 외부 요인이 있다면 소명 자료를 첨부하세요. 설명 없는 매출 감소는 탈락 원인 1위입니다." },
                { title: "기존 대출 총액을 미리 파악하세요", body: "금융기관 대출 + 정책자금 기존 수령액 합산이 지원 한도를 초과하면 탈락합니다. 신용정보원(credit.or.kr)에서 조회 가능합니다." },
                { title: "소진공 상담사를 적극 활용하세요", body: "신청 전 소진공 지역 센터 방문 상담(무료)을 받으면 부족한 서류나 사업계획서 보완 포인트를 미리 알 수 있습니다." },
              ];

              // ── 우대금리 조건 ──
              const preferentialRates = [
                { condition: "제로페이·온누리상품권 가맹점", discount: "0.2%p 인하" },
                { condition: "자영업자 고용보험 가입자", discount: "0.2%p 인하" },
                { condition: "비수도권 사업장 소재", discount: "0.2~0.5%p 인하" },
                { condition: "사회적기업·협동조합 인증", discount: "별도 우대 적용" },
                { condition: "청년 창업자 (만 39세 이하)", discount: "청년 전용 자금 별도 운용" },
              ];

              const cardStyle = { background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" };
              const cardHeaderStyle = { padding: "20px 20px 14px" };
              const cardLabelStyle = { fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" };
              const cardTitleStyle = { fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" };
              const cardSubStyle = { fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" };
              const dividerMain = { height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" };
              const dividerSub = { height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" };

              return (
                <>
                  <article style={styles.step}>
                    <div style={styles.stepMeta}>대출</div>
                    <div style={styles.stepTitle}>사업 대출 완전 가이드</div>
                    <div style={styles.stepBody}>2026년 최신 정책자금 정보를 바탕으로, 초보 창업자도 쉽고 확실하게 신청할 수 있도록 도와드립니다.</div>

                    {/* Card 1: 정책자금 한눈에 보기 */}
                    <div style={{ ...cardStyle, marginTop: "20px" }}>
                      <div style={cardHeaderStyle}>
                        <div style={cardLabelStyle}>Policy Funds · 2026</div>
                        <div style={cardTitleStyle}>정책자금 한눈에 보기</div>
                        <div style={cardSubStyle}>소진공·중진공 주요 자금 — 금리 낮은 순으로 비교하세요.</div>
                      </div>
                      <div style={dividerMain} />
                      {/* Header row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", padding: "8px 20px", gap: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em" }}>자금명 / 대상</div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em", textAlign: "center" as const }}>금리</div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em", textAlign: "right" as const }}>한도</div>
                      </div>
                      <div style={dividerMain} />
                      {loanFunds.map((fund, i) => (
                        <div key={i}>
                          {i > 0 && <div style={dividerSub} />}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", padding: "13px 20px", gap: "8px", alignItems: "center" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "14px", fontWeight: 560, color: "var(--text)", letterSpacing: "-0.2px" }}>{fund.name}</span>
                                {fund.tag && <span style={{ fontSize: "10px", fontWeight: 700, color: fund.tag === "청년" ? "rgb(0,122,255)" : fund.tag === "긴급" ? "rgb(255,59,48)" : "rgb(52,199,89)", background: fund.tag === "청년" ? "rgba(0,122,255,0.1)" : fund.tag === "긴급" ? "rgba(255,59,48,0.1)" : "rgba(52,199,89,0.1)", borderRadius: "5px", padding: "1px 5px" }}>{fund.tag}</span>}
                              </div>
                              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginTop: "2px" }}>{fund.target}</div>
                            </div>
                            <div style={{ textAlign: "center" as const, fontSize: "14px", fontWeight: 640, color: "rgb(0,122,255)", letterSpacing: "-0.2px" }}>{fund.rate}</div>
                            <div style={{ textAlign: "right" as const, fontSize: "12.5px", color: "rgba(0,0,0,0.55)", letterSpacing: "-0.1px" }}>{fund.limit}</div>
                          </div>
                        </div>
                      ))}
                      <div style={dividerMain} />
                      <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)" }}>신청: ols.semas.or.kr (소진공) · 중진공 지역본부 상담</div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(0,0,0,0.3)" }}>2026 총 3.36조원 규모</div>
                      </div>
                    </div>

                    {/* Card 2: 자격 요건 확인 */}
                    <div style={cardStyle}>
                      <div style={cardHeaderStyle}>
                        <div style={cardLabelStyle}>Eligibility Check</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={cardTitleStyle}>자격 요건 확인</div>
                          <div style={{ fontSize: "13px", fontWeight: 620, color: eligDone === eligChecks.length ? "rgb(52,199,89)" : "rgba(0,0,0,0.35)", transition: "color 0.2s" }}>{eligDone} / {eligChecks.length}</div>
                        </div>
                        <div style={cardSubStyle}>신청 전 아래 조건을 모두 충족하는지 확인하세요.</div>
                      </div>
                      <div style={dividerMain} />
                      {eligChecks.map((item, i) => {
                        const done = !!loanChecks[item.id];
                        return (
                          <div key={item.id}>
                            {i > 0 && <div style={dividerSub} />}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: done ? "rgba(52,199,89,0.04)" : "white", transition: "background 0.15s" }}
                              onClick={() => setLoanChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                              <div style={{ flexShrink: 0, marginTop: "1px", width: "22px", height: "22px", borderRadius: "7px", border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: done ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14.5px", fontWeight: 500, color: done ? "rgba(0,0,0,0.28)" : "var(--text)", textDecoration: done ? "line-through" : "none", letterSpacing: "-0.2px", lineHeight: 1.4, transition: "all 0.15s" }}>{item.label}</div>
                                {!done && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{item.detail}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Card 3: 신청 준비 서류 */}
                    <div style={cardStyle}>
                      <div style={cardHeaderStyle}>
                        <div style={cardLabelStyle}>Required Docs</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={cardTitleStyle}>신청 준비 서류</div>
                          <div style={{ fontSize: "13px", fontWeight: 620, color: docDone === docChecks.length ? "rgb(52,199,89)" : "rgba(0,0,0,0.35)", transition: "color 0.2s" }}>{docDone} / {docChecks.length}</div>
                        </div>
                        <div style={cardSubStyle}>서류 누락이 탈락의 두 번째 원인입니다. 미리 준비하세요.</div>
                      </div>
                      <div style={dividerMain} />
                      {docChecks.map((item, i) => {
                        const done = !!loanChecks[item.id];
                        return (
                          <div key={item.id}>
                            {i > 0 && <div style={dividerSub} />}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: done ? "rgba(52,199,89,0.04)" : "white", transition: "background 0.15s" }}
                              onClick={() => setLoanChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                              <div style={{ flexShrink: 0, marginTop: "1px", width: "22px", height: "22px", borderRadius: "7px", border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: done ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14.5px", fontWeight: 500, color: done ? "rgba(0,0,0,0.28)" : "var(--text)", textDecoration: done ? "line-through" : "none", letterSpacing: "-0.2px", lineHeight: 1.4, transition: "all 0.15s" }}>{item.label}</div>
                                {!done && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{item.detail}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Card 4: 승인률 높이는 전략 */}
                    <div style={cardStyle}>
                      <div style={cardHeaderStyle}>
                        <div style={cardLabelStyle}>Approval Strategy</div>
                        <div style={cardTitleStyle}>승인률 높이는 전략</div>
                        <div style={cardSubStyle}>심사관이 실제로 보는 것들입니다.</div>
                      </div>
                      <div style={dividerMain} />
                      {approvalTips.map((tip, i) => (
                        <div key={i}>
                          {i > 0 && <div style={dividerSub} />}
                          <div style={{ padding: "15px 20px" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: 580, color: "var(--text)", letterSpacing: "-0.2px", marginBottom: "5px", lineHeight: 1.4 }}>{tip.title}</div>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", lineHeight: 1.6 }}>{tip.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card 5: 우대금리 받는 방법 */}
                    <div style={cardStyle}>
                      <div style={cardHeaderStyle}>
                        <div style={cardLabelStyle}>Preferential Rate</div>
                        <div style={cardTitleStyle}>우대금리 받는 방법</div>
                        <div style={cardSubStyle}>해당 조건이 있으면 금리를 추가로 낮출 수 있습니다.</div>
                      </div>
                      <div style={dividerMain} />
                      {preferentialRates.map((item, i) => (
                        <div key={i}>
                          {i > 0 && <div style={dividerSub} />}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", gap: "16px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.2px" }}>{item.condition}</div>
                            <div style={{ flexShrink: 0, fontSize: "13.5px", fontWeight: 640, color: "rgb(0,122,255)", letterSpacing: "-0.1px" }}>{item.discount}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card 6: AI Q&A */}
                    <div style={cardStyle}>
                      <div style={cardHeaderStyle}>
                        <div style={cardLabelStyle}>Loan Q&A</div>
                        <div style={cardTitleStyle}>대출 질문하기</div>
                        <div style={cardSubStyle}>자격 요건, 서류, 금리 등 궁금한 점을 물어보세요.</div>
                      </div>
                      <div style={dividerMain} />
                      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {savedGuideQaSnapshot && (
                          <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "4px" }}>최근 질문</div>
                            <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.5 }}>{savedGuideQaSnapshot.question}</div>
                          </div>
                        )}
                        <textarea
                          value={guideQuestion}
                          onChange={(e) => setGuideQuestion(e.target.value)}
                          placeholder="예: 창업 6개월째인데 성장기반자금 신청이 가능한가요?"
                          style={{ ...styles.textarea, ...styles.aiTextarea, borderRadius: "12px" }}
                        />
                        <button
                          type="button"
                          style={{ alignSelf: "flex-end", fontSize: "14px", fontWeight: 600, color: guideQuestion.trim() ? "white" : "rgba(0,0,0,0.3)", background: guideQuestion.trim() ? "rgb(0,122,255)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "10px", padding: "9px 18px", cursor: guideQuestion.trim() ? "pointer" : "default", transition: "all 0.2s" }}
                          onClick={() => handleKnowledgeQuestion("loan")}
                          disabled={!guideQuestion.trim() || knowledgeQaStatus === "loading"}
                        >
                          {knowledgeQaStatus === "loading" ? "답변 중..." : "질문하기"}
                        </button>
                        {knowledgeQaError && <div style={styles.warningText}>{knowledgeQaError}</div>}
                        {(knowledgeQaText || knowledgeQaStatus === "loading") && (
                          <div style={{ borderRadius: "14px", background: "rgba(0,122,255,0.04)", border: "0.5px solid rgba(0,122,255,0.15)", padding: "14px 16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,80,200,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>AI 답변 · 2026 지식베이스 기반</div>
                            <div style={{ fontSize: "14px", color: "rgba(0,0,0,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
                              {knowledgeQaText}
                              {knowledgeQaStatus === "loading" && <span style={{ display: "inline-block", width: "2px", height: "14px", background: "rgba(0,122,255,0.7)", marginLeft: "2px", verticalAlign: "text-bottom" }} />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                  <div style={styles.stageFooter}>
                    {prevTraversedStage && (
                      <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
                        {language === "ko" ? "← 이전 단계" : "← Back"}
                      </button>
                    )}
                    <button type="button" style={{ ...styles.primaryButton }} onClick={() => handleVerificationContinue("loan-guide")}>
                      {copy.home.markLoanReviewed}
                    </button>
                  </div>
                </>
              );
            })()
          )
          ) : (
            <>
              {!businessLaunched && roadmap.completedStageIds.includes("first-month-check") ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "6px 0" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                    {language === "ko" ? "모든 준비가 완료됐습니다." : "You're ready to open."}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
                    {language === "ko"
                      ? "이제 build.up과 함께 실제 운영을 시작하세요. 매출·비용·손익분기점을 함께 추적합니다."
                      : "Start your real operations with build.up. Track daily revenue, costs, and break-even together."}
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.primaryButton, background: "linear-gradient(135deg, #34c759, #30a84e)", marginTop: "4px" }}
                    onClick={handleLaunchBusiness}
                  >
                    {language === "ko" ? "가오픈 시작하기" : "Start soft opening"}
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.primaryButton }}
                    onClick={handleLaunchBusiness}
                  >
                    {language === "ko" ? "정식 개업 시작하기" : "Grand opening"}
                  </button>
                </div>
              ) : businessLaunched ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 600 }}>
                    {language === "ko" ? "개업 중 — 매출을 기록하고 있어요." : "Open for business"}
                  </div>
                  <button type="button" style={styles.primaryButton} onClick={() => navigateToSurface("analytics")}>
                    {language === "ko" ? "내 가게 현황 보기" : "View my store analytics"}
                  </button>
                </div>
              ) : (
                <>
                  <div style={styles.helper}>{copy.home.completeStarterLoop}</div>
                  <div style={styles.pillRow}>
                    <div style={styles.pill}>
                      {language === "ko" ? "선택 업종" : "Selected industry"} {decisions["industry-selection"]?.selectedPrimaryOptionId ?? "-"}
                    </div>
                    <div style={styles.pill}>
                      {copy.home.startupType} {String(decisions["startup-type"]?.selectedPrimaryOptionId ?? "-")}
                    </div>
                    <div style={styles.pill}>
                      {language === "ko" ? "운영 방식" : "Model"} {decisions["business-model"]?.selectedPrimaryOptionId ?? "-"}
                    </div>
                    <div style={styles.pill}>
                      {copy.home.capital}{" "}
                      {typeof decisions["budget-setup"]?.inputs?.capital === "number"
                        ? formatBudgetPresetLabel(decisions["budget-setup"]?.inputs?.capital as number, language)
                        : "-"}
                    </div>
                    <div style={styles.pill}>
                      {language === "ko" ? "상권" : "Market"} {decisions["location-candidates"]?.selectedPrimaryOptionId ?? "-"}
                    </div>
                  </div>
                </>
              )}
              <div style={styles.pillRow}>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          )}
        </article>
      </section>
        )}
    </>
  );
}
