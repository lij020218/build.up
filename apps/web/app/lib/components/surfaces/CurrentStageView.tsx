"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { usePageNavStore } from "../../stores/page-nav-store";
import { styles } from "../../styles";
import { VentureCertificationStage } from "../stages/startup/VentureCertificationStage";
import { CompanySetupStage } from "../stages/startup/CompanySetupStage";
import { GrowthEngineStage } from "../stages/startup/GrowthEngineStage";
import { LaunchGtmStage } from "../stages/startup/LaunchGtmStage";
import { GoLiveStage } from "../stages/startup/GoLiveStage";
import { StartupFoundationStage } from "../stages/startup/StartupFoundationStage";
import { CustomerDiscoveryStage } from "../stages/startup/CustomerDiscoveryStage";
import { MvpBuildStage } from "../stages/startup/MvpBuildStage";
import { FundraisingReadinessStage } from "../stages/startup/FundraisingReadinessStage";
// ── Cluster B: Hardware/IoT NPI ──
import { HardwarePrototypeStage } from "../stages/startup/HardwarePrototypeStage";
import { BomSupplyChainStage } from "../stages/startup/BomSupplyChainStage";
import { CertificationKcCeStage } from "../stages/startup/CertificationKcCeStage";
import { ManufacturingPartnerStage } from "../stages/startup/ManufacturingPartnerStage";
// ── Cluster C: Deep Tech Lab (로보틱스/바이오) ──
import { LabSetupStage } from "../stages/startup/LabSetupStage";
import { PrototypeIterationStage } from "../stages/startup/PrototypeIterationStage";
import { FieldOrClinicalTestStage } from "../stages/startup/FieldOrClinicalTestStage";
import { RegulatorySubmissionStage } from "../stages/startup/RegulatorySubmissionStage";
// ── Cluster D: Extreme Deep Tech (반도체/클린테크) ──
import { EdaToolingSetupStage } from "../stages/startup/EdaToolingSetupStage";
import { MpwOrPilotTapeOutStage } from "../stages/startup/MpwOrPilotTapeOutStage";
import { PackagingAndTestStage } from "../stages/startup/PackagingAndTestStage";
import { PartnerFoundationOrPilotLineStage } from "../stages/startup/PartnerFoundationOrPilotLineStage";
import { OnlineRegistrationStage } from "../stages/online/OnlineRegistrationStage";
import { PlatformSetupStage } from "../stages/online/PlatformSetupStage";
import { OnlineMarketingStage } from "../stages/online/OnlineMarketingStage";
import { StoreSetupStage } from "../stages/online/StoreSetupStage";
import { SourcingSetupStage } from "../stages/online/SourcingSetupStage";
import { RegistrationSetupStage } from "../stages/offline/RegistrationSetupStage";
import { InsuranceTaxSetupStage } from "../stages/offline/InsuranceTaxSetupStage";
import { VendorSetupStage } from "../stages/offline/VendorSetupStage";
import { OperationsSetupStage } from "../stages/offline/OperationsSetupStage";
import { BizRegistrationPanel } from "../stages/offline/BizRegistrationPanel";
import { PreLaunchStage } from "../stages/offline/PreLaunchStage";
import { ConstructionSetupStage } from "../stages/offline/ConstructionSetupStage";
import { FRANCHISE_INTERIOR_DATA } from "../stages/offline/franchise-interior-data";
import { PreLaunchFinalStage } from "../stages/shared-tail/PreLaunchFinalStage";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import { TAX_GUIDE_CONTENT, PERMIT_CHECK_CONTENT, CONTRACT_REVIEW_CONTENT, HIRING_SETUP_CONTENT } from "@foundone/shared";
import { LoanGuideStage } from "../stages/shared-tail/LoanGuideStage";
import { FinancialReviewStage } from "../stages/shared-tail/FinancialReviewStage";
import { StageGuideViewer } from "../stages/shared/StageGuideViewer";
import { TargetCustomerStage } from "../stages/shared/TargetCustomerStage";
import { MenuDesignStage } from "../stages/shared/MenuDesignStage";
import { FranchiseApplicationStage } from "../stages/franchise/FranchiseApplicationStage";
import { AuroraBackground } from "../../../../components/ui/aurora-background";
import { FranchiseSupplyPanel } from "../stages/franchise/FranchiseSupplyPanel";
import { StartupToolkitPanel } from "../stages/startup/StartupToolkitPanel";
import { IndustrySelectionStage } from "../stages/selection/IndustrySelectionStage";
import { StartupTypeSelectionStage } from "../stages/selection/StartupTypeSelectionStage";
import { BusinessModelSelectionStage } from "../stages/selection/BusinessModelSelectionStage";
import { BudgetSetupStage } from "../stages/selection/BudgetSetupStage";
import { LocationCandidatesStage } from "../stages/selection/LocationCandidatesStage";
import {
  formatBudgetPresetLabel,
  formatStageType,
  getFranchiseBrandById,
  localizeTaskTitle,
} from "@foundone/shared";
import { Star, Store, Lock, ChevronLeft, ChevronRight } from "lucide-react";
// SecurityChecklist 는 LaunchGtmStage 내부에서 collapsible 로 직접 import.
// import { SecurityChecklist } from "../knowledge/SecurityChecklist";
import { InvestmentGlossary } from "../knowledge/InvestmentGlossary";
import { getKstDate } from "../../utils/business-day";

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
    allStagesDone, pathTotalStages, pathStepNumber,
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
    preLaunchVisibleIds,
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
    handleTaskToggle, handleStageContinue, handleStageEdit, handleLaunchBusiness,
    handleVerificationContinue,
    openFinanceFromSummary,
    // Save
    saveStatus, setSaveStatus,
    // Reset (확인 모달은 starter-stage-demo 최상단에서 전역 렌더)
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

  // 페이지형 스테이지의 현재 페이지 — StartupPageNav 가 publish. 마지막 페이지 전이면 푸터를
  //   "다음 단계로" 대신 "다음 페이지" 로 전환(페이지 건너뛰기·미열람 advance 방지).
  const pageNav = usePageNavStore((s) => s.nav);
  const hasMoreReadingPages = !!pageNav && pageNav.page < pageNav.totalPages - 1;

  // 단계 "안"의 페이지 이동 — 콘텐츠 레벨(밝은 블루·점 표시). 단계 "밖" 이동(푸터의 딥네이비
  //   "다음 단계로")과 위치·색·단어("페이지" vs "단계")로 분리해 혼동 방지. 단계 끝 콘텐츠에 배치.
  const PAGE_BLUE = "#2563eb";
  const pageNavBlock = pageNav && pageNav.totalPages > 1 ? (() => {
    const atFirst = pageNav.page <= 0;
    const atLast = pageNav.page >= pageNav.totalPages - 1;
    const go = (p: number) => { pageNav.onChange(p); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
        padding: "9px 12px", marginBottom: "10px", borderRadius: "14px",
        border: `1px solid ${PAGE_BLUE}2e`, background: `${PAGE_BLUE}0d`,
      }}>
        <button type="button" disabled={atFirst} onClick={() => go(pageNav.page - 1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "1px", border: "none", background: "transparent",
            color: atFirst ? `${PAGE_BLUE}55` : PAGE_BLUE, fontSize: "13px", fontWeight: 600,
            cursor: atFirst ? "default" : "pointer", padding: "4px 4px", fontFamily: "inherit" }}>
          <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />{language === "ko" ? "이전 페이지" : "Prev"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            {Array.from({ length: pageNav.totalPages }).map((_, i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: "50%",
                background: i <= pageNav.page ? PAGE_BLUE : `${PAGE_BLUE}40` }} />
            ))}
          </div>
          <span style={{ fontSize: "12px", color: "#1d3a8a", fontWeight: 600, whiteSpace: "nowrap" }}>
            {language === "ko" ? `페이지 ${pageNav.page + 1}/${pageNav.totalPages}` : `${pageNav.page + 1}/${pageNav.totalPages}`}
          </span>
        </div>
        <button type="button" disabled={atLast} onClick={() => go(pageNav.page + 1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "1px", border: "none",
            background: atLast ? "transparent" : `${PAGE_BLUE}1a`,
            color: atLast ? `${PAGE_BLUE}55` : PAGE_BLUE, fontSize: "13px", fontWeight: 700,
            borderRadius: "10px", cursor: atLast ? "default" : "pointer", padding: "6px 12px", fontFamily: "inherit" }}>
          {language === "ko" ? "다음 페이지" : "Next"}<ChevronRight size={15} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
    );
  })() : null;

  // ── 로컬 상태 (DashboardContext에 포함되지 않는 것들) ──
  const [mvpPage, setMvpPage] = useState(0);
  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);
  const [insuranceTaxPage, setInsuranceTaxPage] = useState(0);
  const [interiorGuidesData, setInteriorGuidesData] = useState<{ materials: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }>; concepts: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }> } | null>(null);
  const [interiorGuidesLoaded, setInteriorGuidesLoaded] = useState(false);
  const [mvpToolsOpen, setMvpToolsOpen] = useState(false);

  // Computed locals (originally defined in the parent component)
  const isStartupCategory = industryCategoryId === "startup-tech";

  return (
    <>
      {/* 초기화 확인 모달은 starter-stage-demo 최상단으로 이관(모든 surface 에서 동작).
          여기서 중복 렌더하면 모달이 2개 마운트돼 confirm 이 executeResetDemo 를 두 번 호출. */}
      {businessLaunched && !viewingStageId ? (() => {
          const ko = language === "ko";
          const currentMonth = getKstDate(new Date()).slice(0, 7);
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
          const today2 = getKstDate(new Date());
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
                  <button type="button" style={{ fontSize: "12px", color: "#3b5c8c", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => navigateToSurface("analytics")}>
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
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: netProfit2 >= 0 ? "rgba(29,53,87,0.08)" : "rgba(182,76,76,0.08)" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>{ko ? "예상 손익" : "Est. profit"}</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: netProfit2 >= 0 ? "#1d3557" : "#b64c4c" }}>{netProfit2 >= 0 ? "+" : ""}{fmt2(netProfit2)}</span>
                      </div>
                    )}
                  </>
                )}
              </article>

              {/* 오늘 매출 입력 */}
              <article style={{ ...styles.card, gap: "14px" }}>
                {todayEntry2 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1d3557", flexShrink: 0 }} />
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
                  background: "rgba(29,53,87,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "24px",
                }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="18" fill="#1d3557"/>
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
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1d3557" }}>100%</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "100%", background: "#1d3557", borderRadius: "999px" }} />
                  </div>
                </div>

                {/* CTA 버튼 */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, justifyContent: "center" }}>
                  <button
                    type="button"
                    // ⚠️ handleLaunchBusiness를 사용해야 함 — Supabase 저장 + localStorage + Zustand 동기화 보장.
                    // 이전엔 인라인 구현이라 Supabase 저장이 빠져 새로고침 시 businessLaunched=false 로 복구되는 버그가 있었음.
                    onClick={handleLaunchBusiness}
                    style={{
                      padding: "13px 28px", borderRadius: "999px",
                      // 2026-05-19: 운영 대시보드의 메인 액센트 (PALETTE.MIDNIGHT) 로 통일.
                      // 종전 #3b5c8c (애플 블루) 는 운영 대시보드 톤과 어울리지 않았음.
                      background: "#191970", color: "#fff",
                      border: "none", fontSize: "15px", fontWeight: 700,
                      cursor: "pointer", letterSpacing: "-0.2px",
                      boxShadow: "0 4px 14px rgba(25,25,112,0.25)",
                    }}
                  >
                    {ko ? "운영 대시보드로 이동" : "Go to Operational Dashboard"}
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
                      <div style={{ fontSize: "18px", fontWeight: 720, color: "#1d3557", letterSpacing: "-0.3px" }}>{item.value}</div>
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
                  background: i < pathStepNumber - 1 ? "var(--primary, #1d3557)" : i === pathStepNumber - 1 ? "rgba(29,53,87,0.35)" : "rgba(0,0,0,0.06)",
                  transition: "background 0.3s ease",
                }} />
              ))}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" as const, fontVariantNumeric: "tabular-nums" }}>
              {pathStepNumber}/{pathTotalStages} · {formatStageType(currentStage.type, language)}
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
            <>
              {/* 2026-06-26 SSOT 전환: 콘텐츠는 @foundone/shared contract-review(웹·iOS 공통).
                  footer 게이팅(9대 핵심 조항 + 서명 완료)은 여기서 유지(tax-guide 패턴). */}
              <StageContentRenderer content={CONTRACT_REVIEW_CONTENT} />
              {(() => {
                const gate = CONTRACT_REVIEW_CONTENT.pages.flatMap((p) => p.sections).find((s) => s.kind === "gateChecklist");
                const ids = gate && gate.kind === "gateChecklist" ? gate.items.map((i) => i.id) : [];
                const checks = d.contractSubChecks ?? {};
                const doneCount = ids.filter((id) => checks[`__final:${id}`]).length;
                const allClause = ids.length > 0 && doneCount === ids.length;
                const signed = !!checks["__final:signed"];
                const canContinue = allClause && signed;
                const isStageCompleted = !!decisions["contract-review"]?.completedAt && isViewingPastStage;
                const editStatus = d.editSaveStatus?.stageId === "contract-review" ? d.editSaveStatus.status : null;
                const editLabel = editStatus === "saving" ? (language === "ko" ? "저장 중..." : "Saving...")
                  : editStatus === "saved" ? (language === "ko" ? "✓ 수정 완료" : "✓ Saved")
                  : editStatus === "error" ? (language === "ko" ? "⚠ 다시 시도" : "⚠ Retry")
                  : (language === "ko" ? "✓ 수정 저장" : "✓ Save edits");
                const continueLabel = !allClause
                  ? (language === "ko" ? `↑ 9대 핵심 조항 ${doneCount}/${ids.length}` : `↑ Clauses ${doneCount}/${ids.length}`)
                  : !signed
                    ? (language === "ko" ? "↑ 서명 완료 토글을 켜세요" : "↑ Toggle 'signed'")
                    : (language === "ko" ? "계약 검토 완료 — 다음 단계로" : "Contract reviewed — continue");
                return (
                  <div style={styles.stageFooter}>
                    <button type="button" style={styles.button} onClick={() => {
                      if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
                      else setViewingStageId(null);
                    }}>
                      {language === "ko" ? "← 이전 단계" : "← Back"}
                    </button>
                    {isStageCompleted && (
                      <button
                        type="button"
                        style={{ ...styles.primaryButton, opacity: canContinue && editStatus !== "saving" ? 1 : 0.5, background: editStatus === "error" ? "#b64c4c" : "#1d3557", cursor: editStatus === "saving" ? "wait" : "pointer" }}
                        disabled={editStatus === "saving"}
                        onClick={() => { if (!canContinue) return; void handleStageEdit("contract-review"); }}
                      >
                        {editLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      style={{ ...styles.primaryButton, opacity: canContinue ? 1 : 0.45, cursor: canContinue ? "pointer" : "not-allowed" }}
                      disabled={!canContinue}
                      onClick={() => { if (!canContinue) return; handleContractContinue(); }}
                    >
                      {continueLabel}
                    </button>
                    <button type="button" style={styles.button} onClick={resetDemo}>
                      {copy.common.resetDemo}
                    </button>
                  </div>
                );
              })()}
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
            currentStage.code === "go_live" ||
            currentStage.code === "growth_engine" ||
            currentStage.code === "company_setup" ||
            currentStage.code === "fundraising_readiness" ||
            currentStage.code === "venture_certification" ||
            currentStage.code === "biz_registration" ||
            currentStage.code === "pre_launch_final" ||
            currentStage.code === "financial_review" ||
            // ── Cluster B: Hardware/IoT NPI 4 ──
            currentStage.code === "hardware_prototype" ||
            currentStage.code === "bom_supply_chain" ||
            currentStage.code === "certification_kc_ce" ||
            currentStage.code === "manufacturing_partner" ||
            // ── Cluster C: Deep Tech Lab 4 ──
            currentStage.code === "lab_setup" ||
            currentStage.code === "prototype_iteration" ||
            currentStage.code === "field_or_clinical_test" ||
            currentStage.code === "regulatory_submission" ||
            // ── Cluster D: Extreme Deep Tech 4 ──
            currentStage.code === "eda_tooling_setup" ||
            currentStage.code === "mpw_or_pilot_tape_out" ||
            currentStage.code === "packaging_and_test" ||
            currentStage.code === "partner_foundation_or_pilot_line" ||
            (currentStage.code as string) === "franchise_application" ||
            (currentStage.code as string) === "target_customer_definition" ||
            (currentStage.code as string) === "menu_design"
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
              go_live: "go-live",
              growth_engine: "growth-engine",
              company_setup: "company-setup",
              fundraising_readiness: "fundraising-readiness",
              venture_certification: "venture-certification",
              biz_registration: "biz-registration",
              pre_launch_final: "pre-launch-final",
              // Cluster B
              hardware_prototype: "hardware-prototype",
              bom_supply_chain: "bom-supply-chain",
              certification_kc_ce: "certification-kc-ce",
              manufacturing_partner: "manufacturing-partner",
              // Cluster C
              lab_setup: "lab-setup",
              prototype_iteration: "prototype-iteration",
              field_or_clinical_test: "field-or-clinical-test",
              regulatory_submission: "regulatory-submission",
              // Cluster D
              eda_tooling_setup: "eda-tooling-setup",
              mpw_or_pilot_tape_out: "mpw-or-pilot-tape-out",
              packaging_and_test: "packaging-and-test",
              partner_foundation_or_pilot_line: "partner-foundation-or-pilot-line",
            };
            const stageId = stageIdMap[currentStage.code] ?? currentStage.code.replace(/_/g, "-");
            const rawStageTasks = taskMap[stageId] ?? [];
            // 2026-05-12 P1 fix: contract-review 의 septic-tank-checked 는 음식·카페 한정.
            //  비음식 업종 사장님이 정화조 항목 의무 체크하도록 강제하지 않도록 필터.
            const FOOD_LIKE = new Set(["food", "cafe-dessert"]);
            const stageTasks = rawStageTasks.filter((t) => {
              if (stageId === "contract-review" && t.taskId === "septic-tank-checked") {
                return industryCategoryId ? FOOD_LIKE.has(industryCategoryId) : true;
              }
              return true;
            });
            // 2026-05-12 P1 fix: go-live 의 apple/google App Store + launch-day-monitored 는
            //  required:false 옵션 태스크. 종전 UI 100% 룰 때문에 웹 전용 startup 사장님이
            //  Apple/Google 체크 안 하면 advance 못 했음. 옵션 태스크는 UI 에는 표시하되
            //  게이트에서는 제외 — backend rule(2개 required)과 일치.
            const GATE_OPTIONAL_TASKS = new Set([
              "apple-app-store-submitted",
              "google-play-submitted",
              "launch-day-monitored",
            ]);
            // ⚠️ 2026-05-18 fix (사장님 신고: biz-registration 에서 task 2/2 완료해도 다음 비활성):
            //   종전엔 go-live 만 명시적 GATE_OPTIONAL_TASKS 필터 적용. 다른 stage 의 required:false
            //   task (예: biz-registration 의 cpa-decision-made) 가 gateTasks 에 포함되어 allDone
            //   계산에 영향. UI counter 는 required:true 만 세는데 gate 는 모든 task 검사해서 불일치.
            //   모든 stage 에서 *required:true 만* 게이트로 사용. starterTaskMap.required 플래그를 신뢰.
            const gateTasks = stageId === "go-live"
              ? stageTasks.filter((t) => !GATE_OPTIONAL_TASKS.has(t.taskId) && (t.required !== false))
              : stageTasks.filter((t) => t.required !== false);
            const isPreLaunch = stageId === "pre-launch";
            const preLaunchDoneMap: Record<string, boolean> = isPreLaunch ? (() => {
              // ⚠️ 100% 룰 — 사용자가 "실제로 본" 모든 체크 항목이 체크돼야 task 완료.
              //    PreLaunchStage 가 useEffect 로 visible IDs 를 store 에 push 함.
              //    visible IDs 가 null 이면 사용자가 아직 페이지를 안 봤다는 뜻 — task 미완료.
              const guestSel = ["guest-family","guest-neighbor","guest-influencer","guest-peer"].some(k => softOpenChecks[k]);
              const prepDone = ["prep-feedback-form","prep-invite-sent","prep-sns-plan"].every(k => softOpenChecks[k]);

              const visible = preLaunchVisibleIds;
              // visible 이 null 이면 아직 PreLaunchStage 미렌더 → 모든 task 미완료
              if (!visible) {
                return {
                  "soft-open-done":     guestSel && softOpenPricing !== "" && prepDone,
                  "feedback-collected": false,
                  "final-checklist":    false,
                };
              }
              // ── feedback-collected: 사용자가 본 모든 day-* 항목 100% 체크 ──
              const allDayChecked = visible.dayIds.length > 0 && visible.dayIds.every(id => softOpenChecks[id]);

              // ── final-checklist: 사용자가 본 모든 feedback-* 100% 체크 + 모든 final-* resolved (체크 또는 skip) + 적어도 1개 final 체크 ──
              const allFeedbackChecked = visible.feedbackIds.length > 0 && visible.feedbackIds.every(id => softOpenChecks[id]);
              const allFinalResolved = visible.finalIds.length > 0 && visible.finalIds.every(id => softOpenChecks[id] || softOpenSkips[id]);
              const finalAtLeastOne  = visible.finalIds.some(id => softOpenChecks[id]);

              return {
                "soft-open-done":     guestSel && softOpenPricing !== "" && prepDone,
                "feedback-collected": allDayChecked,
                "final-checklist":    allFeedbackChecked && allFinalResolved && finalAtLeastOne,
              };
            })() : {};
            // gate 계산은 gateTasks (옵션 태스크 제외), UI 표시·체크리스트는 stageTasks
            // PreLaunch 는 *자동완료 (visible IDs) OR 직접 토글* 둘 다 인정 (2026-05-19 fix).
            const completedCount = gateTasks.filter((t) => isPreLaunch
              ? ((preLaunchDoneMap[t.taskId] ?? false) || t.status === "completed")
              : t.status === "completed",
            ).length;
            const allDone = gateTasks.length > 0 && completedCount === gateTasks.length;
            return (
              <>
                <div style={styles.helper}>{localizedCurrentStage.goal}</div>

                {/* ── 사업자·통신판매 등록 가이드 (online_registration) ── */}
                {currentStage.code === "online_registration" && <OnlineRegistrationStage />}

                {/* ── 판매 플랫폼 선택 (platform_setup — 온라인/디지털 업종) ── */}
                {currentStage.code === "platform_setup" && <PlatformSetupStage />}

                {/* ── 마케팅 및 론칭 가이드 (online_marketing) ── */}
                {currentStage.code === "online_marketing" && <OnlineMarketingStage />}

                {/* ── 인허가 사전 확인 (permit_check) — SSOT 공통 렌더(web↔iOS). footer는 generic taskMap 게이팅 유지. ── */}
                {currentStage.code === "permit_check" && <StageContentRenderer content={PERMIT_CHECK_CONTENT} />}

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
                {isStartupCategory && currentStage.code !== "mvp_build" && currentStage.code !== "launch_gtm" && (
                  <StartupToolkitPanel />
                )}


                {/* ── 출시 스택·GTM (분리됨) ── */}
                {currentStage.code === "launch_gtm" && <LaunchGtmStage />}

                {/* ── 실제 출시 (Go Live) — 별도 stage ── */}
                {currentStage.code === "go_live" && <GoLiveStage />}

                {/* 기술 스택 패널은 launch_stack 가이드 내부로 통합됨 */}

                {/* ── 벤처인증 · 정부 지원사업 (분리됨) ── */}
                {currentStage.code === "venture_certification" && <VentureCertificationStage />}

                {/* ── Cluster B: Hardware/IoT NPI 4단계 ── */}
                {currentStage.code === "hardware_prototype" && <HardwarePrototypeStage />}
                {currentStage.code === "bom_supply_chain" && <BomSupplyChainStage />}
                {currentStage.code === "certification_kc_ce" && <CertificationKcCeStage />}
                {currentStage.code === "manufacturing_partner" && <ManufacturingPartnerStage />}

                {/* ── Cluster C: Deep Tech Lab (로보틱스/바이오) 4단계 ── */}
                {currentStage.code === "lab_setup" && <LabSetupStage />}
                {currentStage.code === "prototype_iteration" && <PrototypeIterationStage />}
                {currentStage.code === "field_or_clinical_test" && <FieldOrClinicalTestStage />}
                {currentStage.code === "regulatory_submission" && <RegulatorySubmissionStage />}

                {/* ── Cluster D: Extreme Deep Tech (반도체/클린테크) 4단계 ── */}
                {currentStage.code === "eda_tooling_setup" && <EdaToolingSetupStage />}
                {currentStage.code === "mpw_or_pilot_tape_out" && <MpwOrPilotTapeOutStage />}
                {currentStage.code === "packaging_and_test" && <PackagingAndTestStage />}
                {currentStage.code === "partner_foundation_or_pilot_line" && <PartnerFoundationOrPilotLineStage />}

                {/* ── Franchise Application Guide ── */}
                {(currentStage.code as string) === "franchise_application" && <FranchiseApplicationStage />}

                {/* ── loan_guide stage: support programs + live programs + business plan ── */}
                {currentStage.code === "loan_guide" && <LoanGuideStage />}

                {/* ── financial_review stage: 월 운영비 자동 집계·확인 (b+c 하이브리드 UI) ── */}
                {currentStage.code === "financial_review" && <FinancialReviewStage />}


                {/* ── 사업자등록 + 영업허가 절차 가이드 (registration_setup) ── */}
                {currentStage.code === "registration_setup" && <RegistrationSetupStage />}

                {/* ── 보험·세무 세팅 종합 가이드 (insurance_tax_setup) — 페이지네이션 ── */}
                {currentStage.code === "insurance_tax_setup" && <InsuranceTaxSetupStage />}

                {/* ── Franchise Supply Structure (vendor_setup only) ── */}
                {currentStage.code === "vendor_setup" && startupType === "franchise" && selectedFranchiseBrandId && (
                  <FranchiseSupplyPanel />
                )}

                {/* ── Independent / non-franchise vendor setup — sub-industry-aware Korean vendor & equipment data ── */}
                {currentStage.code === "vendor_setup" && startupType !== "franchise" && (
                  <VendorSetupStage />
                )}

                {stageGuideContent && currentStage.code !== "pre_launch" && currentStage.code !== "operations_setup" && currentStage.code !== "hiring_setup" && currentStage.code !== "platform_setup" && currentStage.code !== "online_registration" && (currentStage.code as string) !== "franchise_application" && currentStage.code !== "fundraising_readiness" && currentStage.code !== "registration_setup" && currentStage.code !== "insurance_tax_setup" && currentStage.code !== "loan_guide" && (currentStage.code as string) !== "financial_review" && currentStage.code !== "vendor_setup" && (currentStage.code as string) !== "target_customer_definition" && (currentStage.code as string) !== "menu_design" && (
                  <StageGuideViewer />
                )}


                {/* ── 스토어 및 배송 세팅 가이드 (store_setup) ── */}
                {currentStage.code === "store_setup" && <StoreSetupStage />}

                {/* ── 상품 소싱 가이드 (sourcing_setup) ── */}
                {currentStage.code === "sourcing_setup" && <SourcingSetupStage />}

                {/* ── 채용 비용 계산기 — HiringSetupStage 의 페이지 2 (계약서) 안으로 통합됨 ── */}

                {/* 보안 체크리스트 — launch_gtm 자동 렌더 제거.
                   LaunchGtmStage 의 Page 1 (출시 스택) 안에서 collapsible 버튼으로 접근. */}

                {/* ── 투자 용어 사전 ── */}
                {currentStage.code === "fundraising_readiness" && (
                  <div style={{ marginBottom: "16px" }}>
                    <InvestmentGlossary ko={language === "ko"} />
                  </div>
                )}

                {/* 2026-06-26 SSOT 전환: 콘텐츠는 @foundone/shared hiring-setup(웹·iOS 공통). generic taskMap footer 게이팅 유지. */}
                {currentStage.code === "hiring_setup" && <StageContentRenderer content={HIRING_SETUP_CONTENT} />}

                {currentStage.code === "operations_setup" && <OperationsSetupStage />}

                {currentStage.code === "pre_launch" && <PreLaunchStage />}

                {currentStage.code === "construction_setup" && <ConstructionSetupStage />}

                {currentStage.code === "biz_registration" && <BizRegistrationPanel />}

                {currentStage.code === "pre_launch_final" && <PreLaunchFinalStage />}

                {/* ── 타깃 고객 정의 (target_customer_definition) — shared, 2026-05-14 신규 ── */}
                {currentStage.code === "target_customer_definition" && <TargetCustomerStage />}

                {/* ── 메뉴/서비스 라인업 (menu_design) — offline, cluster-aware, 2026-05-14 신규 ── */}
                {currentStage.code === "menu_design" && <MenuDesignStage />}

                {(() => {
                  const visibleTasks = stageTasks.filter((t) => t.taskId !== "cpa-decision-made");
                  const visibleDone = visibleTasks.filter((t) => isPreLaunch
                    ? ((preLaunchDoneMap[t.taskId] ?? false) || t.status === "completed")
                    : t.status === "completed",
                  ).length;
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
                    // ⚠️ 2026-05-19 fix (사장님 신고: "페이지 체크리스트 다 했는데 자동 안 됨 — 토글이라도 되게"):
                    //   PreLaunch task 도 task.status 직접 토글 가능 + 자동 완료 (visible IDs)
                    //   path 도 그대로 인정. 둘 중 하나라도 true 면 done 표시.
                    const done = isPreLaunch
                      ? ((preLaunchDoneMap[task.taskId] ?? false) || task.status === "completed")
                      : task.status === "completed";

                    // ── 입력 기반 task 게이팅 ──────────────────────────────────────
                    //  특정 task 는 사용자가 본문에서 입력값을 채워야만 체크 가능.
                    //  예: "problem-defined" 는 decisions.startup-foundation.inputs.problemStatement 가
                    //  비어있지 않아야 함. 비어있으면 클릭해도 체크 안 되고 hint 표시.
                    type GateResult = { blocked: true; hint: { ko: string; en: string } } | { blocked: false };
                    const checkTaskGate = (): GateResult => {
                      if (task.taskId === "problem-defined") {
                        const stmt = (decisions["startup-foundation"]?.inputs?.problemStatement as string | undefined)?.trim();
                        if (!stmt || stmt.length < 10) {
                          return {
                            blocked: true,
                            hint: {
                              ko: "↑ 1단계 페이지에서 핵심 문제를 한 문장(10자 이상)으로 입력해야 체크할 수 있어요. 작성한 내용은 자동 저장됩니다.",
                              en: "↑ Fill in your problem statement (10+ chars) on Step 1 page first. Your input auto-saves.",
                            },
                          };
                        }
                      }
                      return { blocked: false };
                    };
                    const gate = checkTaskGate();

                    // ⚠️ 2026-05-19 fix: PreLaunch task 도 다른 stage 처럼 *직접 토글 가능*.
                    //   페이지 2/4 의 체크리스트 (자동 완료 path) 도 그대로 작동. 둘 중 하나로 완료 가능.
                    const preLaunchHint = isPreLaunch && !done
                      ? (language === "ko"
                        ? "위 페이지의 체크리스트를 다 채우면 자동 완료, 또는 여기 직접 체크"
                        : "Auto-completes from page checklist above — or check here directly")
                      : null;

                    return (
                      <button
                        key={task.taskId}
                        type="button"
                        title={preLaunchHint ?? undefined}
                        style={{
                          ...styles.taskCheckItem,
                          ...(done ? styles.taskCheckItemDone : {}),
                          ...(gate.blocked && !done ? { opacity: 0.6, cursor: "not-allowed" } : {}),
                        }}
                        onClick={() => {
                          // 게이트가 막혔으면 본문 입력 영역으로 스크롤·점프
                          if (gate.blocked && !done) {
                            const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                              `[data-task-input="${task.taskId}"]`,
                            );
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                              setTimeout(() => el.focus(), 400);
                            }
                            return;
                          }
                          handleTaskToggle(stageId, task.taskId);
                        }}
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
                            {(() => {
                              // ── 본사 지정 시공 프랜차이즈 → construction-setup 체크리스트 분기 ──
                              const franchiseData = currentStage.code === "construction_setup" && startupType === "franchise" && selectedFranchiseBrandId
                                ? FRANCHISE_INTERIOR_DATA[selectedFranchiseBrandId]
                                : undefined;
                              if (franchiseData?.flexibility === "strict") {
                                const franchiseLabels: Record<string, { ko: string; en: string }> = {
                                  "interior-concept-selected": {
                                    ko: "본사 표준 BI 컨셉 확인 (위 카드에서 본사 방향 선택)",
                                    en: "Confirm HQ standard BI concept (pick closest direction above)",
                                  },
                                  "contractor-selected": {
                                    ko: "본사 가맹 담당자에게 시공 일정·비용 분담 협의 완료",
                                    en: "Confirm timing and cost-sharing with HQ franchise manager",
                                  },
                                  "design-approved": {
                                    ko: "본사 표준 도면·자재·집기 패키지 승인 (점주 변경 불가)",
                                    en: "Approve HQ standard drawings, materials, and equipment package (no owner edits)",
                                  },
                                  "construction-complete": {
                                    ko: "본사 지정 시공업체 시공 완료 + 본사 감리·BI 검수 통과",
                                    en: "HQ-mandated contractor finishes + HQ inspection / BI audit passes",
                                  },
                                  "fire-health-parallel": {
                                    ko: "공사 중 소방필증·보건증 병행 신청 (본사 매뉴얼 따름)",
                                    en: "File fire safety / health certificates during construction (per HQ manual)",
                                  },
                                };
                                const override = franchiseLabels[task.taskId];
                                if (override) return language === "ko" ? override.ko : override.en;
                              }
                              return localizeTaskTitle(task.taskId, language, industryCategoryId || d.industryCategoryId) ?? task.title;
                            })()}
                          </div>
                          {!done && gate.blocked && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#b64c4c",
                                lineHeight: 1.5,
                                marginTop: "4px",
                                fontWeight: 600,
                              }}
                            >
                              {language === "ko" ? gate.hint.ko : gate.hint.en}
                            </div>
                          )}
                          {!done && preLaunchHint && (
                            <div
                              style={{
                                fontSize: "11.5px",
                                color: "var(--muted)",
                                lineHeight: 1.5,
                                marginTop: "4px",
                                fontWeight: 500,
                              }}
                            >
                              ↑ {preLaunchHint}
                            </div>
                          )}
                          {!done && currentStage.code === "construction_setup" && (() => {
                            const franchiseData = startupType === "franchise" && selectedFranchiseBrandId
                              ? FRANCHISE_INTERIOR_DATA[selectedFranchiseBrandId]
                              : undefined;
                            const isStrictFranchise = franchiseData?.flexibility === "strict";

                            const hints: Record<string, string> = isStrictFranchise ? {
                              "interior-concept-selected": language === "ko"
                                ? "본사 표준 BI 컨셉이 정해져 있어 자유 선택은 불가하지만, 위 컨셉 카드에서 본사 가이드와 가까운 방향을 골라두면 협의·점주 의견 정리에 도움 돼요."
                                : "The HQ BI concept is fixed, but pick the closest direction in the cards above to align discussions with HQ.",
                              "contractor-selected": language === "ko"
                                ? "외부 업체 견적·시공이 불가능합니다. 본사 가맹 담당자가 표준 시공 일정과 비용 분담(본사 부담 vs 점주 부담)을 안내해 줍니다."
                                : "External contractors not allowed. The HQ franchise manager defines timing and cost-sharing.",
                              "design-approved": language === "ko"
                                ? "본사가 도면·자재·집기를 일괄 공급하므로 점주 임의 변경은 계약 위반 사유가 될 수 있어요. 본사 패키지 명세서를 받아 보관하세요."
                                : "HQ supplies all drawings/materials/equipment in a fixed package — owner edits may breach the franchise contract.",
                              "construction-complete": language === "ko"
                                ? "본사 감리(현장 점검)와 BI 검수가 끝나야 오픈 승인을 받을 수 있어요. 시공 후 사진·체크리스트를 본사에 제출하세요."
                                : "HQ inspection and BI audit must pass before opening — submit post-construction photos & checklist to HQ.",
                              "fire-health-parallel": language === "ko"
                                ? "본사가 소방·위생 매뉴얼을 제공하지만, 신청자(영업자)는 점주 본인입니다. 보건증은 인테리어와 무관하므로 미리 받아 두세요."
                                : "HQ provides the fire/health manual, but the applicant is the owner. Get the health card early — it's independent of construction.",
                            } : {
                              "interior-concept-selected": language === "ko"
                                ? "위 컨셉 카드에서 하나를 클릭하면 자동으로 체크돼요. 업체 미팅에서 기준점이 됩니다."
                                : "Click one of the concept cards above — it auto-checks and becomes the reference for contractor meetings.",
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
                {pageNavBlock}
                <div style={styles.stageFooter}>
                  {/* ⚠️ 항상 노출 — null 이면 로드맵으로 복귀 */}
                  <button type="button" style={styles.button} onClick={() => {
                    if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
                    else setViewingStageId(null);
                  }}>
                    {language === "ko" ? "← 이전 단계" : "← Back"}
                  </button>
                  {/* ⚠️ 2026-06-26 fix (사장님 신고: "마지막 단계에서 개업 시작 버튼이 활성화 안 됨"):
                       pre-launch-final 의 required_tasks 5개를 모두 체크하면 buildRoadmapState 가
                       이 단계를 completedStageIds 에 넣어 correctedProgressPercent 가 100 이 됨
                       (completedAt 없이 규칙만으로 완료 판정 — workflow.ts evaluateStageCompletion).
                       그 결과 아래 분기에서 "🚀 개업하기" 대신 "수정 내용 저장" 버튼이 떠서
                       사용자가 런칭을 트리거할 수 없었음. 아직 개업(businessLaunched) 전이라면
                       final 단계에서는 항상 런칭 버튼 분기로 떨어지게 예외 처리. */}
                  {hasMoreReadingPages ? (
                    /* 단계 advance 게이트: 아직 읽을 페이지가 남음 → "다음 단계로" 대신 잠금 힌트.
                       페이지 이동은 위 콘텐츠 영역의 페이지 네비로 (단계 이동과 시각적으로 분리). */
                    <div style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "11px 16px", fontSize: "13px", fontWeight: 600,
                      color: "rgba(25,25,112,0.5)", marginLeft: "auto",
                    }}>
                      <Lock size={13} strokeWidth={2.2} aria-hidden />
                      {language === "ko"
                        ? `마지막 페이지에서 다음 단계로 (${pageNav!.page + 1}/${pageNav!.totalPages})`
                        : `Continue on the last page (${pageNav!.page + 1}/${pageNav!.totalPages})`}
                    </div>
                  ) : correctedProgressPercent >= 100 && !(stageId === "pre-launch-final" && !businessLaunched) ? (
                    <button
                      type="button"
                      disabled={saveStatus === "saving"}
                      style={{
                        ...styles.primaryButton,
                        opacity: saveStatus === "saving" ? 0.6 : 1,
                        background: saveStatus === "saved" ? "#1d3557" : saveStatus === "error" ? "#b64c4c" : undefined,
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
                  ) : stageId === "pre-launch-final" ? (
                    <button
                      type="button"
                      style={{ ...styles.primaryButton, opacity: allDone ? 1 : 0.45, background: allDone ? "linear-gradient(135deg, #1d3557, #30a84e)" : undefined }}
                      onClick={() => { handleStageContinue(stageId); handleLaunchBusiness(); }}
                      disabled={!allDone}
                    >
                      {language === "ko"
                        ? (industryCategoryId === "startup-tech" ? "🚀 런칭하기" : "🚀 개업하기")
                        : (industryCategoryId === "startup-tech" ? "🚀 Launch" : "🚀 Open store")}
                    </button>
                  ) : (
                    (() => {
                      // ⚠️ 두 버튼 동시 표시 (사용자 요청 2026-05-03):
                      //   - "✓ 수정 저장": handleStageEdit — 다른 단계 영향 X, 같은 화면 유지.
                      //   - "다음 단계로": handleStageContinue — 다음 stage 로 advance.
                      // editSaveStatus 동기화: saving → "저장 중...", saved → "✓ 수정 완료" (2초 후 복귀).
                      //
                      // ⚠️ 수정 저장 표시 조건 (2026-05-17 사장님 신고):
                      //   "처음 보는 단계에 수정 저장 버튼이 떠 있다 — 완료 후 수정 들어왔을 때만 떠야 함"
                      //   completedAt 만으로 판단하면 chain backfill / 데모 시드로 자동 set 된 경우에도
                      //   첫 진입 화면에 버튼이 보임. 그래서 isViewingPastStage 추가 — 사용자가 명시적으로
                      //   "이미 지나간 다른 stage 를 보러 진입한 경우" 에만 표시 (currentStageId 화면 X).
                      const isStageCompleted = !!decisions[stageId]?.completedAt && isViewingPastStage;
                      const editStatus = d.editSaveStatus?.stageId === stageId ? d.editSaveStatus.status : null;
                      const editLabel = editStatus === "saving"
                        ? (language === "ko" ? "저장 중..." : "Saving...")
                        : editStatus === "saved"
                          ? (language === "ko" ? "✓ 수정 완료" : "✓ Saved")
                          : editStatus === "error"
                            ? (language === "ko" ? "⚠ 다시 시도" : "⚠ Retry")
                            : (language === "ko" ? "✓ 수정 저장" : "✓ Save edits");
                      const editBg = editStatus === "saved"
                        ? "#1d3557"
                        : editStatus === "error"
                          ? "#b64c4c"
                          : "#1d3557";
                      return (
                        <>
                          {isStageCompleted && (
                            <button
                              type="button"
                              style={{
                                ...styles.primaryButton,
                                opacity: allDone && editStatus !== "saving" ? 1 : 0.5,
                                background: editBg,
                                cursor: editStatus === "saving" ? "wait" : "pointer",
                              }}
                              onClick={() => { void handleStageEdit(stageId); }}
                              disabled={!allDone || editStatus === "saving"}
                            >
                              {editLabel}
                            </button>
                          )}
                          <button
                            type="button"
                            style={{
                              ...styles.primaryButton,
                              opacity: allDone ? 1 : 0.45,
                            }}
                            onClick={() => handleStageContinue(stageId)}
                            disabled={!allDone}
                          >
                            {language === "ko" ? "다음 단계로" : "Continue"}
                          </button>
                        </>
                      );
                    })()
                  )}
                  <button type="button" style={styles.button} onClick={resetDemo}>
                    {copy.common.resetDemo}
                  </button>
                </div>
              </>
            );
          })() : isGuideStage ? (
            currentStage.code === "tax_guide" ? (
              <>
                {/* 2026-06-25 SSOT 전환: 콘텐츠는 @foundone/shared tax-guide(웹·iOS 공통).
                    footer 게이팅(필수 세팅 체크리스트 완료)은 여기서 유지. */}
                <StageContentRenderer content={TAX_GUIDE_CONTENT} />
                {(() => {
                  const taxItems = (TAX_GUIDE_CONTENT.byCategory[industryCategoryId ?? "food"] ?? TAX_GUIDE_CONTENT.byCategory["food"]).taxChecklist ?? [];
                  const taxAllDone = taxItems.length > 0 && taxItems.every((t) => taxChecks[t.id]);
                  const doneCount = taxItems.filter((t) => taxChecks[t.id]).length;
                  return (
                    <div style={styles.stageFooter}>
                      <button type="button" style={styles.button} onClick={() => {
                        if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
                        else setViewingStageId(null);
                      }}>
                        {language === "ko" ? "← 이전 단계" : "← Back"}
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.primaryButton, opacity: taxAllDone ? 1 : 0.45, cursor: taxAllDone ? "pointer" : "not-allowed" }}
                        title={taxAllDone ? undefined : (language === "ko" ? `필수 세팅 ${doneCount}/${taxItems.length} — 「필수 세팅」 탭에서 모두 체크 후 진행` : `Complete all ${taxItems.length} setup items first`)}
                        onClick={() => { if (!taxAllDone) return; handleVerificationContinue("tax-guide"); }}
                        disabled={!taxAllDone}
                      >
                        {taxAllDone ? copy.home.markTaxReviewed : (language === "ko" ? `↑ 필수 세팅 ${doneCount}/${taxItems.length}` : `↑ Setup ${doneCount}/${taxItems.length}`)}
                      </button>
                    </div>
                  );
                })()}
              </>
            ) : currentStage.code === "loan_guide" ? (
              <>
                <LoanGuideStage />
                {/* 2026-05-12 P0 fix (사장님 신고): 종전엔 버튼 게이트 없어 페이지 열자마자 클릭 시
                    즉시 advance + reviewed:true 저장 (정부 지원사업 0초 검토 가능).
                    LoanGuideStage 가 loanChecks["loan-final-review"] 명시적 confirmation 박스를
                    렌더하고, 여기서 그 값을 읽어 disabled 게이트. (TaxGuideStage 패턴과 동일.) */}
                {(() => {
                  const loanReviewed = !!loanChecks["loan-final-review"];
                  return (
                    <div style={styles.stageFooter}>
                      <button type="button" style={styles.button} onClick={() => {
                        if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
                        else setViewingStageId(null);
                      }}>
                        {language === "ko" ? "← 이전 단계" : "← Back"}
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.primaryButton,
                          opacity: loanReviewed ? 1 : 0.45,
                          cursor: loanReviewed ? "pointer" : "not-allowed",
                        }}
                        title={loanReviewed ? undefined : (language === "ko" ? "위 「검토했습니다」 박스 체크 후 진행 가능" : "Tick the 'I have reviewed' box above first")}
                        onClick={() => {
                          if (!loanReviewed) return; // 게이트
                          handleVerificationContinue("loan-guide");
                        }}
                        disabled={!loanReviewed}
                      >
                        {loanReviewed
                          ? copy.home.markLoanReviewed
                          : (language === "ko" ? "↑ 검토 완료 박스 먼저 체크" : "↑ Tick the review box first")}
                      </button>
                    </div>
                  );
                })()}
              </>
            ) : (
            (() => {
              // ── (legacy fallback for other guide stages) ──
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
                                {fund.tag && <span style={{ fontSize: "10px", fontWeight: 700, color: fund.tag === "청년" ? "rgb(59,92,140)" : fund.tag === "긴급" ? "rgb(182,76,76)" : "rgb(29,53,87)", background: fund.tag === "청년" ? "rgba(59,92,140,0.1)" : fund.tag === "긴급" ? "rgba(182,76,76,0.1)" : "rgba(29,53,87,0.1)", borderRadius: "5px", padding: "1px 5px" }}>{fund.tag}</span>}
                              </div>
                              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginTop: "2px" }}>{fund.target}</div>
                            </div>
                            <div style={{ textAlign: "center" as const, fontSize: "14px", fontWeight: 640, color: "rgb(59,92,140)", letterSpacing: "-0.2px" }}>{fund.rate}</div>
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
                          <div style={{ fontSize: "13px", fontWeight: 620, color: eligDone === eligChecks.length ? "rgb(29,53,87)" : "rgba(0,0,0,0.35)", transition: "color 0.2s" }}>{eligDone} / {eligChecks.length}</div>
                        </div>
                        <div style={cardSubStyle}>신청 전 아래 조건을 모두 충족하는지 확인하세요.</div>
                      </div>
                      <div style={dividerMain} />
                      {eligChecks.map((item, i) => {
                        const done = !!loanChecks[item.id];
                        return (
                          <div key={item.id}>
                            {i > 0 && <div style={dividerSub} />}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: done ? "rgba(29,53,87,0.04)" : "white", transition: "background 0.15s" }}
                              onClick={() => setLoanChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                              <div style={{ flexShrink: 0, marginTop: "1px", width: "22px", height: "22px", borderRadius: "7px", border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: done ? "rgb(29,53,87)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
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
                          <div style={{ fontSize: "13px", fontWeight: 620, color: docDone === docChecks.length ? "rgb(29,53,87)" : "rgba(0,0,0,0.35)", transition: "color 0.2s" }}>{docDone} / {docChecks.length}</div>
                        </div>
                        <div style={cardSubStyle}>서류 누락이 탈락의 두 번째 원인입니다. 미리 준비하세요.</div>
                      </div>
                      <div style={dividerMain} />
                      {docChecks.map((item, i) => {
                        const done = !!loanChecks[item.id];
                        return (
                          <div key={item.id}>
                            {i > 0 && <div style={dividerSub} />}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: done ? "rgba(29,53,87,0.04)" : "white", transition: "background 0.15s" }}
                              onClick={() => setLoanChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                              <div style={{ flexShrink: 0, marginTop: "1px", width: "22px", height: "22px", borderRadius: "7px", border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: done ? "rgb(29,53,87)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
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
                            <div style={{ flexShrink: 0, fontSize: "13.5px", fontWeight: 640, color: "rgb(59,92,140)", letterSpacing: "-0.1px" }}>{item.discount}</div>
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
                          style={{ alignSelf: "flex-end", fontSize: "14px", fontWeight: 600, color: guideQuestion.trim() ? "white" : "rgba(0,0,0,0.3)", background: guideQuestion.trim() ? "rgb(59,92,140)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "10px", padding: "9px 18px", cursor: guideQuestion.trim() ? "pointer" : "default", transition: "all 0.2s" }}
                          onClick={() => handleKnowledgeQuestion("loan")}
                          disabled={!guideQuestion.trim() || knowledgeQaStatus === "loading"}
                        >
                          {knowledgeQaStatus === "loading" ? "답변 중..." : "질문하기"}
                        </button>
                        {knowledgeQaError && <div style={styles.warningText}>{knowledgeQaError}</div>}
                        {(knowledgeQaText || knowledgeQaStatus === "loading") && (
                          <div style={{ borderRadius: "14px", background: "rgba(59,92,140,0.04)", border: "0.5px solid rgba(59,92,140,0.15)", padding: "14px 16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,80,200,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>AI 답변 · 2026 지식베이스 기반</div>
                            <div style={{ fontSize: "14px", color: "rgba(0,0,0,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
                              {knowledgeQaText}
                              {knowledgeQaStatus === "loading" && <span style={{ display: "inline-block", width: "2px", height: "14px", background: "rgba(59,92,140,0.7)", marginLeft: "2px", verticalAlign: "text-bottom" }} />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                  <div style={styles.stageFooter}>
                    <button type="button" style={styles.button} onClick={() => {
                      if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
                      else setViewingStageId(null);
                    }}>
                      {language === "ko" ? "← 이전 단계" : "← Back"}
                    </button>
                    {/* 2026-05-12 P0 fix: 레거시 fallback 도 게이트 (자격 + 서류 100% 체크 필요) */}
                    {(() => {
                      const legacyReady = eligDone === eligChecks.length && docDone === docChecks.length;
                      return (
                        <button
                          type="button"
                          style={{
                            ...styles.primaryButton,
                            opacity: legacyReady ? 1 : 0.45,
                            cursor: legacyReady ? "pointer" : "not-allowed",
                          }}
                          title={legacyReady ? undefined : (language === "ko" ? `자격 ${eligDone}/${eligChecks.length} + 서류 ${docDone}/${docChecks.length} 모두 체크 필요` : `Complete ${eligDone}/${eligChecks.length} eligibility + ${docDone}/${docChecks.length} docs`)}
                          onClick={() => {
                            if (!legacyReady) return;
                            handleVerificationContinue("loan-guide");
                          }}
                          disabled={!legacyReady}
                        >
                          {legacyReady
                            ? copy.home.markLoanReviewed
                            : (language === "ko" ? `↑ 체크 ${eligDone + docDone}/${eligChecks.length + docChecks.length}` : `↑ Check ${eligDone + docDone}/${eligChecks.length + docChecks.length}`)}
                        </button>
                      );
                    })()}
                  </div>
                </>
              );
            })()
          )
          ) : (
            <>
              {!businessLaunched && roadmap.completedStageIds.includes("pre-launch-final") ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "6px 0" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                    {language === "ko" ? "모든 준비가 완료됐습니다." : "You're ready to open."}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
                    {language === "ko"
                      ? "이제 Found.One과 함께 실제 운영을 시작하세요. 매출·비용·손익분기점을 함께 추적합니다."
                      : "Start your real operations with Found.One. Track daily revenue, costs, and break-even together."}
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.primaryButton, background: "linear-gradient(135deg, #1d3557, #30a84e)", marginTop: "4px" }}
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
