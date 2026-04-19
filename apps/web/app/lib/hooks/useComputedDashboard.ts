"use client";

import {
  formatBudgetPresetLabel,
  formatStartupType,
  getIndustryCategoryIdByOptionId,
  localizeRecommendationItem,
  localizeStage,
  localizeStarterStepCard,
  resolveBusinessContext,
  starterOpenDatePresets,
  starterStepCards,
} from "@build-up/shared";
import {
  useProfileStore,
  useRoadmapStore,
  useFinanceStore,
  useAiStore,
} from "../stores";
import { GUIDE_STAGE_CODES, SURFACE_HREFS } from "../constants";
import type { DashboardDeps, DashboardSurface } from "../types";
import type {
  DailyEntry,
  MonthlyCosts,
  CostSnapshot,
} from "../stores/finance-store";

// ────────────────────────────────────────────────────────
// useComputedDashboard
// Pure derived / computed values extracted from useDashboard
// ────────────────────────────────────────────────────────

export function useComputedDashboard(
  deps: DashboardDeps,
  surface: DashboardSurface,
) {
  const { language, copy, router } = deps;

  // ── Zustand stores ──
  const {
    selectedIndustryId,
    selectedIndustryCategoryId,
    selectedBusinessModelId,
    selectedBudget,
    selectedOpenDate,
    selectedLocationId,
    startupType,
    selectedFranchiseBrandId,
    storeName,
    profile,
    businessLaunched,
    businessLaunchedDate,
  } = useProfileStore();

  const {
    decisions,
    roadmap,
    viewingStageId,
  } = useRoadmapStore();

  const {
    dailyEntries,
    monthlyCosts,
    costHistory,
    setShowFinancePanel,
  } = useFinanceStore();

  const {
    permitGuides,
    taxGuides,
    loanGuides,
  } = useAiStore();

  // ── Stage navigation ──
  const displayedStageId = viewingStageId ?? roadmap.currentStageId;

  const currentStage =
    roadmap.stages.find((stage) => stage.stageId === displayedStageId) ??
    roadmap.stages[0];

  const traversedStages = roadmap.stages.filter(
    (s) => s.status === "completed" || s.stageId === roadmap.currentStageId,
  );

  const traversedIndex = traversedStages.findIndex(
    (s) => s.stageId === displayedStageId,
  );

  const prevTraversedStage =
    traversedIndex > 0 ? traversedStages[traversedIndex - 1] : null;

  const nextTraversedStage =
    traversedIndex >= 0 && traversedIndex < traversedStages.length - 1
      ? traversedStages[traversedIndex + 1]
      : null;

  const isViewingPastStage =
    viewingStageId !== null && viewingStageId !== roadmap.currentStageId;

  // ── Step completion predicates ──
  const canCompleteIndustryStep = Boolean(selectedIndustryId);
  const canCompleteStartupTypeStep = Boolean(startupType);
  const canCompleteBusinessModelStep = Boolean(selectedBusinessModelId);
  const canCompleteBudgetStep = Boolean(selectedBudget && selectedOpenDate);
  const canCompleteLocationStep = Boolean(selectedLocationId);

  // ── Guide flags ──
  const hasPermitGuide = permitGuides.length > 0;
  const hasTaxGuide = taxGuides.length > 0;
  const hasLoanGuide = loanGuides.length > 0;

  // ── Industry category ──
  const preferredRegion = profile?.preferredRegions?.[0];

  const industryCategoryId =
    getIndustryCategoryIdByOptionId(
      selectedIndustryId ??
        profile?.subIndustryId ??
        decisions["industry-selection"]?.selectedPrimaryOptionId,
    ) ??
    (decisions["industry-selection"]?.inputs?.categoryId as
      | string
      | undefined) ??
    selectedIndustryCategoryId ??
    "food";

  const businessCtx = resolveBusinessContext(industryCategoryId);
  const isDigitalCategory =
    industryCategoryId === "online-digital" ||
    industryCategoryId === "startup-tech";
  const isStartupCategory = industryCategoryId === "startup-tech";

  // ── Path stage filtering ──
  const onlineOnlyIds = new Set([
    "platform-setup",
    "online-registration",
    "sourcing-setup",
    "store-setup",
    "online-marketing",
  ]);
  const startupOnlyIds = new Set([
    "startup-foundation",
    "customer-discovery",
    "mvp-build",
    "launch-gtm",
    "growth-engine",
    "company-setup",
    "fundraising-readiness",
    "venture-certification",
  ]);
  const offlineOnlyIds = new Set([
    "permit-check",
    "location-candidates",
    "contract-review",
    "construction-setup",
    "vendor-setup",
    "registration-setup",
    "insurance-tax-setup",
    "hiring-setup",
    "operations-setup",
    "pre-launch",
  ]);
  const franchiseOnlyIds = new Set(["franchise-application"]);

  const isPathStage = (stageId: string): boolean => {
    if (isStartupCategory) {
      if (
        onlineOnlyIds.has(stageId) ||
        offlineOnlyIds.has(stageId) ||
        franchiseOnlyIds.has(stageId)
      )
        return false;
      return true;
    }
    if (isDigitalCategory) {
      if (offlineOnlyIds.has(stageId) || startupOnlyIds.has(stageId))
        return false;
      if (franchiseOnlyIds.has(stageId) && startupType !== "franchise")
        return false;
      return true;
    }
    if (onlineOnlyIds.has(stageId) || startupOnlyIds.has(stageId)) return false;
    if (franchiseOnlyIds.has(stageId) && startupType !== "franchise")
      return false;
    return true;
  };

  const pathStageIds = new Set(
    roadmap.stages.filter((s) => isPathStage(s.stageId)).map((s) => s.stageId),
  );
  const pathTotalStages = pathStageIds.size;

  const completedCount = roadmap.completedStageIds.filter((id) =>
    pathStageIds.has(id),
  ).length;
  const correctedProgressPercent =
    pathTotalStages > 0
      ? Math.min(100, Math.round((completedCount / pathTotalStages) * 100))
      : 0;
  const allStagesDone = completedCount >= pathTotalStages;

  // ── Business health score ──
  const businessHealthScore: "healthy" | "caution" | "danger" | "unknown" =
    (() => {
      if (!businessLaunched) return "unknown";
      const entries = dailyEntries as DailyEntry[];
      const mc = monthlyCosts as MonthlyCosts;
      const totalCost =
        mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;

      if (entries.length < 7) return "unknown";
      if (totalCost === 0) return "unknown";
      if (mc.rent === 0) return "unknown";

      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const recent30 = sorted.slice(-30);
      const totalRev = recent30.reduce((s, e) => s + e.sales, 0);

      if (totalRev === 0) return "danger";

      const monthlyNet = totalRev - totalCost;
      const primeRate = (mc.ingredients + mc.labor) / totalRev;
      const rentRate = mc.rent / totalRev;

      const costTrend =
        (costHistory as CostSnapshot[]).length >= 3
          ? (() => {
              const s = [...(costHistory as CostSnapshot[])]
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-3);
              const tots = s.map(
                (c) =>
                  c.ingredients + c.labor + c.rent + c.utilities + c.other,
              );
              return tots[2] > tots[1] && tots[1] > tots[0];
            })()
          : false;

      // danger
      if (monthlyNet < 0 && primeRate > 0.65) return "danger";
      if (rentRate > 0.2) return "danger";

      // caution
      if (monthlyNet < 0) return "caution";
      if (primeRate > 0.6) return "caution";
      if (rentRate > 0.15) return "caution";
      if (costTrend) return "caution";
      if (
        (industryCategoryId === "food" ||
          industryCategoryId === "cafe-dessert") &&
        mc.ingredients === 0
      )
        return "caution";

      return "healthy";
    })();

  // ── Localized stage ──
  const localizedCurrentStage = localizeStage(
    currentStage,
    language,
    industryCategoryId,
  );

  const isGuideStage = GUIDE_STAGE_CODES.includes(
    currentStage.code as (typeof GUIDE_STAGE_CODES)[number],
  );

  const isFreshAccount =
    !profile?.subIndustryId &&
    !profile?.businessModelId &&
    completedCount === 0 &&
    currentStage.code === "industry_selection";

  // ── Summary labels ──
  const startupSummary = [
    profile?.subIndustryId
      ? localizeRecommendationItem(
          { id: profile.subIndustryId, title: profile.subIndustryId },
          language,
        ).title
      : undefined,
    profile?.startupType
      ? formatStartupType(profile.startupType, language)
      : undefined,
    profile?.businessModelId
      ? localizeRecommendationItem(
          {
            id: profile.businessModelId,
            title: profile.businessModelId,
          },
          language,
        ).title
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const selectedIndustryLabel =
    selectedIndustryId ??
    profile?.subIndustryId ??
    decisions["industry-selection"]?.selectedPrimaryOptionId
      ? localizeRecommendationItem(
          {
            id:
              selectedIndustryId ??
              profile?.subIndustryId ??
              decisions["industry-selection"]?.selectedPrimaryOptionId ??
              "",
            title:
              selectedIndustryId ??
              profile?.subIndustryId ??
              decisions["industry-selection"]?.selectedPrimaryOptionId ??
              "",
          },
          language,
        ).title
      : copy.common.notSetYet;

  // ── Next step summary ──
  const nextStepSummary =
    currentStage.code === "industry_selection"
      ? copy.home.nextStepIndustry
      : currentStage.code === "startup_type"
        ? copy.home.nextStepStartupType
        : currentStage.code === "business_model"
          ? copy.home.nextStepModel
          : currentStage.code === "budget_setup"
            ? copy.home.nextStepBudget
            : currentStage.code === "startup_foundation"
              ? language === "ko"
                ? "공동창업 구조와 지분, 법인 설립 방향을 먼저 정리하세요."
                : "Lock founder roles, equity, and company setup first."
              : currentStage.code === "customer_discovery"
                ? language === "ko"
                  ? "인터뷰로 반복되는 문제와 첫 타겟 고객을 좁히세요."
                  : "Use interviews to narrow the first customer and pain wedge."
                : currentStage.code === "mvp_build"
                  ? language === "ko"
                    ? "핵심 워크플로 하나를 해결하는 MVP를 빠르게 출시하세요."
                    : "Ship the smallest MVP that solves one core workflow."
                  : currentStage.code === "launch_gtm"
                    ? language === "ko"
                      ? "분석·결제·GTM 채널을 깔고 첫 고객 확보 실험을 시작하세요."
                      : "Install analytics, billing, and GTM channel before pushing growth."
                    : currentStage.code === "growth_engine"
                      ? language === "ko"
                        ? "북극성 지표와 유지율을 함께 보는 주간 리뷰를 시작하세요."
                        : "Start a weekly review for north-star growth and retention."
                      : currentStage.code === "company_setup"
                        ? language === "ko"
                          ? "법인 설립·세무사 선임·보안 기본기를 완료하세요."
                          : "Complete incorporation, tax advisor, and security basics."
                        : currentStage.code === "fundraising_readiness"
                          ? language === "ko"
                            ? "런웨이와 마일스톤을 기준으로 투자 필요성을 정리하세요."
                            : "Model runway and milestones before you fundraise."
                          : currentStage.code === "venture_certification"
                            ? language === "ko"
                              ? "벤처인증과 정부 지원사업을 매칭하여 비희석 자금을 확보하세요."
                              : "Match to venture certification and government programs for non-dilutive funding."
                            : currentStage.code === "location_candidates"
                              ? copy.home.nextStepLocation
                              : currentStage.code === "contract_review"
                                ? copy.home.nextStepContract
                                : currentStage.code === "tax_guide"
                                  ? copy.home.nextStepTax
                                  : currentStage.code === "loan_guide"
                                    ? copy.home.nextStepLoan
                                    : currentStage.code === "biz_registration"
                                      ? language === "ko"
                                        ? "사업자등록과 금융 세팅을 완료하세요."
                                        : "Finalize business registration and banking."
                                      : currentStage.code ===
                                          "pre_launch_final"
                                        ? language === "ko"
                                          ? "초도 재고 입고, 직원 교육, SNS 예고를 마치세요."
                                          : "Receive inventory, brief staff, and post a teaser."
                                        : currentStage.code ===
                                            "first_month_check"
                                          ? language === "ko"
                                            ? "현금흐름 기록 방법을 정하고 개업을 시작하세요."
                                            : "Set up cash flow tracking and launch your business."
                                          : copy.home.nextStepDone;

  // ── Location labels (category-aware) ──
  const locationRegionLabel = isStartupCategory
    ? language === "ko"
      ? "선호 허브 지역"
      : "Preferred founder hub"
    : isDigitalCategory
      ? language === "ko"
        ? "희망 운영 지역"
        : "Preferred base region"
      : language === "ko"
        ? "희망 지역"
        : "Preferred region";

  const locationHelpText = isStartupCategory
    ? language === "ko"
      ? "스타트업은 상권보다 팀 채용, 고객 인터뷰, 커뮤니티 접근성이 더 중요합니다. 선호 허브를 적어두면 참고 정보로 활용합니다."
      : "For startups, founder talent, customer access, and community matter more than storefront traffic. We use your preferred hub as reference only."
    : isDigitalCategory
      ? language === "ko"
        ? "운영하고 싶은 권역을 적으면 작업·보관·택배 흐름 기준으로 거점 3곳을 추천하고, 직접 생각한 거점도 점검해드립니다."
        : "Enter your target area to see three operating-base suggestions focused on storage, packing, and logistics."
      : language === "ko"
        ? "원하는 지역을 적으면 추천 상권 3곳을 보여드리고, 직접 생각한 상권도 점수로 점검해드립니다."
        : "Enter your target region to see three suggested markets, or score a market you already have in mind.";

  const locationRecommendedLabel = isStartupCategory
    ? language === "ko"
      ? "추천 허브 보기"
      : "Suggested hubs"
    : isDigitalCategory
      ? language === "ko"
        ? "추천 거점 보기"
        : "Recommended bases"
      : language === "ko"
        ? "추천 상권 보기"
        : "Recommended markets";

  const locationDirectLabel = isStartupCategory
    ? language === "ko"
      ? "직접 입력하기"
      : "My own hub"
    : isDigitalCategory
      ? language === "ko"
        ? "직접 입력하기"
        : "My own base"
      : language === "ko"
        ? "직접 입력하기"
        : "My own market";

  const locationInputPlaceholder = isStartupCategory
    ? language === "ko"
      ? "예: 판교, 강남, 성수, 원격"
      : "Example: Pangyo, Gangnam, Seongsu, remote"
    : isDigitalCategory
      ? language === "ko"
        ? "예: 구로, 동대문, 일산"
        : "Example: Guro, Dongdaemun, Ilsan"
      : language === "ko"
        ? "예: 성수동, 수원 영통, 부산 전포"
        : "Example: Seongsu, Pangyo, Jeonpo";

  const customLocationLabel = isStartupCategory
    ? language === "ko"
      ? "직접 생각한 허브"
      : "Your chosen hub"
    : isDigitalCategory
      ? language === "ko"
        ? "직접 생각한 운영 거점"
        : "Your chosen base"
      : language === "ko"
        ? "직접 생각한 상권"
        : "Your chosen market";

  const customLocationPlaceholder = isStartupCategory
    ? language === "ko"
      ? "예: 판교 공유오피스, 원격 팀"
      : "Example: Pangyo coworking, remote team"
    : isDigitalCategory
      ? language === "ko"
        ? "예: 구로 물류센터 인근, 집 근처 작업실"
        : "Example: near Guro logistics, home studio"
      : language === "ko"
        ? "예: 성수역 3번 출구 근처"
        : "Example: near Seongsu Station exit 3";

  const customLocationReasonPlaceholder = isStartupCategory
    ? language === "ko"
      ? "왜 이 허브를 생각했는지 적어주세요."
      : "Why are you considering this hub?"
    : isDigitalCategory
      ? language === "ko"
        ? "왜 이 거점을 생각했는지 적어주세요."
        : "Why are you considering this base?"
      : language === "ko"
        ? "왜 이 상권을 생각했는지 적어주세요."
        : "Why are you considering this market?";

  const scoreLocationLabel = isStartupCategory
    ? language === "ko"
      ? "이 허브 평가하기"
      : "Score this hub"
    : isDigitalCategory
      ? language === "ko"
        ? "이 거점 평가하기"
        : "Score this base"
      : language === "ko"
        ? "이 상권 평가하기"
        : "Score this market";

  const selectedLocationDetailLabel = isStartupCategory
    ? language === "ko"
      ? "선택한 허브 자세히 보기"
      : "Selected hub details"
    : isDigitalCategory
      ? language === "ko"
        ? "선택한 운영 거점 자세히 보기"
        : "Selected base details"
      : language === "ko"
        ? "선택한 상권 자세히 보기"
        : "Selected market details";

  // ── Budget / date helpers ──
  const sliderBudgetValue = selectedBudget ?? 1000000;

  const activeBudgetLabel =
    typeof selectedBudget === "number"
      ? formatBudgetPresetLabel(selectedBudget, language)
      : language === "ko"
        ? "아직 입력하지 않음"
        : "Not set yet";

  const activeOpenDatePreset =
    starterOpenDatePresets.find((date) => date.value === selectedOpenDate) ??
    null;

  // ── Surface / navigation ──
  const activeSurface = surface;

  const currentStageIndex = roadmap.stages.findIndex(
    (stage) => stage.stageId === currentStage.stageId,
  );

  const roadmapPreviewStages = roadmap.stages.slice(
    currentStageIndex >= 0 ? currentStageIndex : 0,
    (currentStageIndex >= 0 ? currentStageIndex : 0) + 2,
  );

  const nextRoadmapStage = roadmapPreviewStages[1] ?? null;

  const homePrinciples = starterStepCards
    .slice(0, 3)
    .map((card) => localizeStarterStepCard(card, language));

  const surfaceTabs = [
    { id: "home" as const, label: language === "ko" ? "홈" : "Home" },
    {
      id: "current" as const,
      label: language === "ko" ? "현재 단계" : "Current step",
    },
    {
      id: "roadmap" as const,
      label: language === "ko" ? "로드맵" : "Roadmap",
    },
    {
      id: "guides" as const,
      label: language === "ko" ? "가이드" : "Guides",
    },
    {
      id: "franchise" as const,
      label: language === "ko" ? "프랜차이즈" : "Franchise",
    },
    {
      id: "marketing" as const,
      label: language === "ko" ? "마케팅" : "Marketing",
    },
    {
      id: "analytics" as const,
      label: language === "ko" ? "내 가게" : "My store",
    },
    {
      id: "profile" as const,
      label: language === "ko" ? "내 정보" : "Profile",
    },
  ];

  const navigateToSurface = (nextSurface: DashboardSurface) => {
    router.push(SURFACE_HREFS[nextSurface]);
  };

  const openFinanceFromSummary = () => {
    setShowFinancePanel(true);
    router.push("/guides?panel=finance");
  };

  return {
    // stage navigation
    displayedStageId,
    currentStage,
    localizedCurrentStage,
    traversedStages,
    traversedIndex,
    prevTraversedStage,
    nextTraversedStage,
    isViewingPastStage,

    // path filtering
    isPathStage,
    pathStageIds,
    pathTotalStages,

    // progress
    completedCount,
    correctedProgressPercent,
    allStagesDone,

    // step completion predicates
    canCompleteIndustryStep,
    canCompleteStartupTypeStep,
    canCompleteBusinessModelStep,
    canCompleteBudgetStep,
    canCompleteLocationStep,

    // guides
    hasPermitGuide,
    hasTaxGuide,
    hasLoanGuide,

    // business health
    businessHealthScore,

    // industry / business context
    industryCategoryId,
    isDigitalCategory,
    isStartupCategory,
    businessCtx,
    preferredRegion,

    // localized stage info
    isGuideStage,
    isFreshAccount,

    // summary labels
    startupSummary,
    selectedIndustryLabel,
    nextStepSummary,

    // location labels
    locationRegionLabel,
    locationHelpText,
    locationRecommendedLabel,
    locationDirectLabel,
    locationInputPlaceholder,
    customLocationLabel,
    customLocationPlaceholder,
    customLocationReasonPlaceholder,
    scoreLocationLabel,
    selectedLocationDetailLabel,

    // budget
    sliderBudgetValue,
    activeBudgetLabel,
    activeOpenDatePreset,

    // surface / navigation
    activeSurface,
    surfaceTabs,
    navigateToSurface,
    openFinanceFromSummary,

    // roadmap preview
    currentStageIndex,
    roadmapPreviewStages,
    nextRoadmapStage,
    homePrinciples,
  };
}
