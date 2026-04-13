"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { VentureCertificationStage } from "../stages/startup/VentureCertificationStage";
import { CompanySetupStage } from "../stages/startup/CompanySetupStage";
import { GrowthEngineStage } from "../stages/startup/GrowthEngineStage";
import { LaunchGtmStage } from "../stages/startup/LaunchGtmStage";
import { StartupFoundationStage } from "../stages/startup/StartupFoundationStage";
import { CustomerDiscoveryStage } from "../stages/startup/CustomerDiscoveryStage";
import { MvpBuildStage } from "../stages/startup/MvpBuildStage";
import { FundraisingReadinessStage } from "../stages/startup/FundraisingReadinessStage";
import { OnlineRegistrationStage } from "../stages/online/OnlineRegistrationStage";
import { PlatformSetupStage } from "../stages/online/PlatformSetupStage";
import { OnlineMarketingStage } from "../stages/online/OnlineMarketingStage";
import { StoreSetupStage } from "../stages/online/StoreSetupStage";
import { SourcingSetupStage } from "../stages/online/SourcingSetupStage";
import { RegistrationSetupStage } from "../stages/offline/RegistrationSetupStage";
import { InsuranceTaxSetupStage } from "../stages/offline/InsuranceTaxSetupStage";
import { HiringSetupStage } from "../stages/offline/HiringSetupStage";
import { OperationsSetupStage } from "../stages/offline/OperationsSetupStage";
import { PreLaunchStage } from "../stages/offline/PreLaunchStage";
import { ConstructionSetupStage } from "../stages/offline/ConstructionSetupStage";
import { PreLaunchFinalStage } from "../stages/shared-tail/PreLaunchFinalStage";
import { FirstMonthCheckStage } from "../stages/shared-tail/FirstMonthCheckStage";
import { TaxGuideStage } from "../stages/shared-tail/TaxGuideStage";
import { LoanGuideStage } from "../stages/shared-tail/LoanGuideStage";
import { FranchiseApplicationStage } from "../stages/franchise/FranchiseApplicationStage";
import { IndustrySelectionStage } from "../stages/selection/IndustrySelectionStage";
import { ContractReviewStage } from "../stages/selection/ContractReviewStage";
import { StartupTypeSelectionStage } from "../stages/selection/StartupTypeSelectionStage";
import { BusinessModelSelectionStage } from "../stages/selection/BusinessModelSelectionStage";
import { BudgetSetupStage } from "../stages/selection/BudgetSetupStage";
import { LocationCandidatesStage } from "../stages/selection/LocationCandidatesStage";
import {
  formatBudgetPresetLabel,
  formatStageType,
  getFranchiseBrandById,
  getFranchiseSupplyInfo,
  getFullToolKit,
  getMatchedPrograms,
  getProgramCategoryColor,
  getProgramCategoryLabel,
  getRecommendedStack,
  getSupplyTypeColor,
  getSupplyTypeLabel,
  localizeTaskTitle,
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
            <IndustrySelectionStage />
          ) : currentStage.code === "startup_type" ? (
            <StartupTypeSelectionStage />
          ) : currentStage.code === "business_model" ? (
            <BusinessModelSelectionStage />
          ) : currentStage.code === "budget_setup" ? (
            <BudgetSetupStage />
          ) : currentStage.code === "location_candidates" ? (
            <LocationCandidatesStage />
          ) : currentStage.code === "contract_review" ? (
            <ContractReviewStage />
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
                {currentStage.code === "online_registration" && <OnlineRegistrationStage />}

                {/* ── 판매 플랫폼 선택 (platform_setup — 온라인/디지털 업종) ── */}
                {currentStage.code === "platform_setup" && <PlatformSetupStage />}

                {/* ── 마케팅 및 론칭 가이드 (online_marketing) ── */}
                {currentStage.code === "online_marketing" && <OnlineMarketingStage />}

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

                {/* ── 스타트업 법인설립 (분리됨) ── */}
                {currentStage.code === "company_setup" && <CompanySetupStage />}

                {/* ── TIPS/정부지원 + 사업계획서 (fundraising_readiness, 분리됨) ── */}
                {currentStage.code === "fundraising_readiness" && <FundraisingReadinessStage />}

                {/* ── 창업팀·기본 구조 (분리됨) ── */}
                {currentStage.code === "startup_foundation" && <StartupFoundationStage />}

                {/* ── 고객 발굴·문제 검증 (분리됨) ── */}
                {currentStage.code === "customer_discovery" && <CustomerDiscoveryStage />}

                {/* ── 성장·리텐션 루프 (분리됨) ── */}
                {currentStage.code === "growth_engine" && <GrowthEngineStage />}
                {/* ── growth_engine REMOVED — below kept for reference during migration ── */}

                {/* ── MVP 구축 종합 가이드 (분리됨) ── */}
                {currentStage.code === "mvp_build" && <MvpBuildStage />}

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

                {/* ── 출시 스택·GTM (분리됨) ── */}
                {currentStage.code === "launch_gtm" && <LaunchGtmStage />}

                {/* 기술 스택 패널은 launch_stack 가이드 내부로 통합됨 */}

                {/* ── 벤처인증 · 정부 지원사업 (분리됨) ── */}
                {currentStage.code === "venture_certification" && <VentureCertificationStage />}

                {/* ── Franchise Application Guide ── */}
                {(currentStage.code as string) === "franchise_application" && <FranchiseApplicationStage />}

                {/* ── loan_guide stage: support programs + live programs + business plan ── */}
                {currentStage.code === "loan_guide" && <LoanGuideStage />}


                {/* ── 사업자등록 + 영업허가 절차 가이드 (registration_setup) ── */}
                {currentStage.code === "registration_setup" && <RegistrationSetupStage />}

                {/* ── 보험·세무 세팅 종합 가이드 (insurance_tax_setup) — 페이지네이션 ── */}
                {currentStage.code === "insurance_tax_setup" && <InsuranceTaxSetupStage />}

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
                {currentStage.code === "store_setup" && <StoreSetupStage />}

                {/* ── 상품 소싱 가이드 (sourcing_setup) ── */}
                {currentStage.code === "sourcing_setup" && <SourcingSetupStage />}

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

                {currentStage.code === "hiring_setup" && <HiringSetupStage />}

                {currentStage.code === "operations_setup" && <OperationsSetupStage />}

                {currentStage.code === "pre_launch" && <PreLaunchStage />}

                {currentStage.code === "construction_setup" && <ConstructionSetupStage />}

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

                {currentStage.code === "pre_launch_final" && <PreLaunchFinalStage />}

                {currentStage.code === "first_month_check" && <FirstMonthCheckStage />}

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
                            {localizeTaskTitle(task.taskId, language, industryCategoryId || d.industryCategoryId) ?? task.title}
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
            currentStage.code === "tax_guide" ? (
              <TaxGuideStage />
            ) : (
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
