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
  calculateCostRatios,
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
  // ⚠ profile.preferredRegions 만 보면 빈 문자열·미하이드레이트·legacy [""] 케이스에서 undefined.
  //   → contractor 검색·맵 등이 silent fail. locationDecision 의 모든 가용 소스를 fallback chain.
  const _locationDec = decisions["location-candidates"];
  const _profileRegion = profile?.preferredRegions?.[0]?.trim();
  const _inputRegion =
    typeof _locationDec?.inputs?.preferredRegion === "string"
      ? _locationDec.inputs.preferredRegion.trim()
      : "";
  const _customRegion =
    typeof _locationDec?.inputs?.customMarketName === "string"
      ? _locationDec.inputs.customMarketName.trim()
      : "";
  const _finalTitleRegion =
    typeof _locationDec?.inputs?.finalMarketTitle === "string"
      ? _locationDec.inputs.finalMarketTitle.trim()
      : "";
  const preferredRegion: string | undefined =
    (_profileRegion && _profileRegion.length > 0 ? _profileRegion : null)
    ?? (_inputRegion.length > 0 ? _inputRegion : null)
    ?? (_customRegion.length > 0 ? _customRegion : null)
    ?? (_finalTitleRegion.length > 0 ? _finalTitleRegion : null)
    ?? _locationDec?.selectedPrimaryOptionId
    ?? undefined;

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
    "go-live",
    "growth-engine",
    "company-setup",
    "fundraising-readiness",
    "venture-certification",
    // Cluster B: Hardware/IoT NPI 4
    "hardware-prototype",
    "bom-supply-chain",
    "certification-kc-ce",
    "manufacturing-partner",
    // Cluster C: Deep Tech Lab 4
    "lab-setup",
    "prototype-iteration",
    "field-or-clinical-test",
    "regulatory-submission",
    // Cluster D: Extreme Deep Tech 4
    "eda-tooling-setup",
    "mpw-or-pilot-tape-out",
    "packaging-and-test",
    "partner-foundation-or-pilot-line",
  ]);

  // ── 클러스터별 stage 가시성 — 다른 클러스터의 단계는 숨김 ──
  const clusterBStages = new Set(["hardware-prototype", "bom-supply-chain", "certification-kc-ce", "manufacturing-partner"]);
  const clusterCStages = new Set(["lab-setup", "prototype-iteration", "field-or-clinical-test", "regulatory-submission"]);
  const clusterDStages = new Set(["eda-tooling-setup", "mpw-or-pilot-tape-out", "packaging-and-test", "partner-foundation-or-pilot-line"]);
  const allClusterStages = new Set([...clusterBStages, ...clusterCStages, ...clusterDStages]);

  const subInd = selectedIndustryId ?? "";
  const isClusterB = subInd === "hardware-iot";
  const isClusterC = subInd === "robotics-physical-ai" || subInd === "biotech-medtech";
  const isClusterD = subInd === "semiconductor" || subInd === "climate-energy";
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
      // ── 클러스터 단계는 해당 sub-industry 만 표시 ──
      // hardware-iot → Cluster B / robotics·biotech → Cluster C / 반도체·클린테크 → Cluster D
      if (clusterBStages.has(stageId)) return isClusterB;
      if (clusterCStages.has(stageId)) return isClusterC;
      if (clusterDStages.has(stageId)) return isClusterD;
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
    if (allClusterStages.has(stageId)) return false;
    if (franchiseOnlyIds.has(stageId) && startupType !== "franchise")
      return false;
    return true;
  };

  // ── Path 정렬: 단계 정의 순서대로 사용자 경로의 visible stages 만 추림 ──
  // stepNumber/totalSteps 는 정의 시점의 hardcoded 값이라 path마다 의미가 다름.
  // pathStepNumber/pathTotalStages 는 사용자 path에서의 실제 위치를 동적 계산.
  const pathStageList = roadmap.stages.filter((s) => isPathStage(s.stageId));
  const pathStageIds = new Set(pathStageList.map((s) => s.stageId));
  const pathTotalStages = pathStageList.length;

  const rawCompletedCount = roadmap.completedStageIds.filter((id) =>
    pathStageIds.has(id),
  ).length;

  // ── 런치 완료된 가게 보호 장치 ──
  // 1) 유저가 이미 `businessLaunched=true`로 오픈했다면 로드맵은 반드시 완료 상태로 표시해야 한다.
  // 2) 그렇지 않으면 신규 stage 추가·autosave 레이스·hydration 실패 등으로
  //    persist된 completedStageIds가 줄어들면서 "0단계로 리셋"되는 증상이 발생함.
  // 3) UI 레이어에서 강제로 끌어올리되, 실제 복구는 usePersistence.connectAndLoad에서 수행.
  //
  // ⚠️ 일관성 sanity check: businessLaunched=true 인데 로드맵에 진행이 0개이면
  //    이건 "stale launched flag" — 데모 초기화는 됐는데 user_store_data 의 businessLaunched
  //    flag wipe 가 실패했거나 (RLS / 비인증 / 부분 실패), 다른 데이터와 동기화가 깨진 상태.
  //    이런 경우 override 를 적용하면 "현재 단계 = 첫 단계" + "21/21 완료" 모순 화면이 보임.
  //    플래그를 stale 로 간주하고 override 를 끈다 (실제 자가복구는 connectAndLoad 가 수행).
  const launchedFlagLooksStale = businessLaunched && rawCompletedCount === 0;
  const effectiveLaunched = businessLaunched && !launchedFlagLooksStale;

  const completedCount = effectiveLaunched
    ? pathTotalStages
    : rawCompletedCount;
  const correctedProgressPercent =
    pathTotalStages > 0
      ? Math.min(100, Math.round((completedCount / pathTotalStages) * 100))
      : effectiveLaunched
        ? 100
        : 0;
  // ⚠️ pathTotalStages > 0 guard 필수.
  //   pathTotalStages=0 (초기 렌더 race / hydration 미완 / 잘못된 카테고리 필터) 인 경우
  //   `0 >= 0 = true` 라 allStagesDone 가 true 로 잘못 평가되어 "20단계 완료" 화면이
  //   reset 직후 잠깐 노출되는 버그가 있었음.
  const allStagesDone =
    effectiveLaunched ||
    (pathTotalStages > 0 && completedCount >= pathTotalStages);

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

      // 비율 — cost-ratios.ts SSOT (월간 비용 ÷ 월 환산 매출, 30일 미만 입력 보정)
      const _ratios = calculateCostRatios({
        costs: {
          ingredients: mc.ingredients ?? 0, labor: mc.labor ?? 0, rent: mc.rent ?? 0,
          utilities: mc.utilities ?? 0,
          sga: (mc as { sga?: number }).sga ?? 0,
          marketing: (mc as { marketing?: number }).marketing ?? 0,
          other: mc.other ?? 0,
        },
        totalRevenue: totalRev,
        days: recent30.length,
      });
      // monthlyNet — 월 환산 매출 vs 월 비용 (이전엔 N일치 매출 - 월 비용 → 항상 적자처럼)
      const monthlyNet = _ratios.monthlyRevenueEquivalent - totalCost;
      const primeRate = _ratios.primeCostRatio / 100;
      const rentRate = _ratios.rentRatio / 100;

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
                                          ? "5개 핵심 액션을 끝내고 운영 대시보드로 이동하세요."
                                          : "Finish 5 core actions and move to the operations dashboard."
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

  // ─── Nav 가시성 분기 (사장님 요청 2026-05-09) ───
  //   pre-launch (로드맵 진행 중): 홈 / 현재 단계 / 로드맵 / 프랜차이즈 / 내 정보 (5개)
  //   post-launch (오픈 후):       전체 9개 (펀딩·마케팅·보고서·내 가게 추가 노출)
  //
  //   배경: 로드맵 단계일 때 9개 탭 모두 노출하면 인지 부하 ↑ + 미완 단계에서 운영 surface
  //         (마케팅·보고서) 진입해도 빈 화면 — 사장님이 "지금 어디에 집중해야 하는지" 길 잃음.
  //         '오픈 전엔 로드맵 따라만, 오픈 후엔 운영 도구 풀세트' 라는 명확한 페이즈 분리.
  //
  //   "현재 단계" 는 이미 종래대로 pre-launch 만 — 로드맵 탭이 post-launch 에서 그 역할 흡수.
  const showCurrentTab = !businessLaunched;

  const surfaceTabs = [
    { id: "home" as const, label: language === "ko" ? "홈" : "Home" },
    ...(showCurrentTab
      ? [{
          id: "current" as const,
          label: language === "ko" ? "현재 단계" : "Current step",
        }]
      : []),
    {
      id: "roadmap" as const,
      label: language === "ko" ? "로드맵" : "Roadmap",
    },
    // 펀딩 — 로드맵에 정책자금 단계 들어있고, post-launch 후엔 별도 surface 로 깊이 탐색
    ...(businessLaunched
      ? [{ id: "guides" as const, label: language === "ko" ? "펀딩" : "Funding" }]
      : []),
    {
      id: "franchise" as const,
      label: language === "ko" ? "프랜차이즈" : "Franchise",
    },
    // 마케팅·보고서·내 가게 — 운영 데이터 (매출·고객·비용) 가 있어야 의미 있는 surface.
    //   pre-launch 엔 데이터 0 → 빈 화면만 보이므로 숨김.
    ...(businessLaunched
      ? [
          { id: "marketing" as const, label: language === "ko" ? "마케팅" : "Marketing" },
          { id: "reports" as const,   label: language === "ko" ? "보고서" : "Reports" },
          { id: "analytics" as const, label: language === "ko" ? "내 가게" : "My store" },
        ]
      : []),
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
    // ── 사용자 path에서의 현재 단계 위치 (1-based). Hardcoded stepNumber 보다 정확. ──
    pathStepNumber: currentStage
      ? pathStageList.findIndex((s) => s.stageId === currentStage.stageId) + 1
      : 0,

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
