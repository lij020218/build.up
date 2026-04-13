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
