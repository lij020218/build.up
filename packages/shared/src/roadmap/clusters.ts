/**
 * 클러스터 정의 + 세부 업종 → 클러스터 매핑.
 *
 *  ── 핵심 아이디어 ───────────────────────────────────────────
 *  같은 카테고리(예: startup-tech) 안에서도 자본 구조와 핵심 활동이 극단적으로 다른
 *  세부 업종이 섞여 있다. 1인 인디가 만드는 일정 앱과 시리즈A 받은 반도체 팀이
 *  같은 14단계 로드맵을 따라가면 절반 이상의 단계가 무의미하거나 누락이다.
 *
 *  → 71개 세부 업종을 "클러스터" 단위로 묶어, 각 클러스터마다 적합한 단계 시퀀스를
 *     주고, 운영 모드(인디·부트스트랩·시드·시리즈A)에 따라 일부 단계를 스킵 가능하게.
 *  ────────────────────────────────────────────────────────
 */

/** 11개 클러스터 — startup-tech 4 + 오프라인 9 + 온라인 1 + 프랜차이즈 (기존 분기) */
export type ClusterId =
  // ── Startup-tech 4 ──
  | "tech-software"          // ai-application, developer-tools, b2b-saas, fintech, healthtech, security
  | "tech-hardware"          // hardware-iot — NPI (EVT/DVT/PVT) + BOM + KC/CE/FCC + EMS
  | "tech-deeptech-lab"      // robotics-physical-ai, biotech-medtech — lab + 임상/필드테스트
  | "tech-extreme-deeptech"  // semiconductor, climate-energy — EDA·MPW·tape-out·foundry
  // ── Offline 9 ──
  | "offline-food"           // 음식점·외식
  | "offline-cafe"           // 카페·디저트
  | "offline-retail"         // 소매·편의·라이프스타일
  | "offline-beauty"         // 미용·뷰티 서비스
  | "offline-fitness"        // 피트니스·헬스케어
  | "offline-education"      // 교육·학원·스터디
  | "offline-pet"            // 반려동물 서비스
  | "offline-living"         // 생활 서비스 (세탁·청소·수리)
  | "offline-space"          // 공간 임대·게스트 등
  // ── Online 1 ──
  | "online-digital";        // 스마트스토어·디지털상품·크리에이터 등 (모두 비슷한 흐름)

/** 71개 세부 업종 → 클러스터 매핑 */
export const CLUSTER_BY_SUB_INDUSTRY: Record<string, ClusterId> = {
  // ── food (6) ──
  "korean-casual": "offline-food",
  "delivery-meals": "offline-food",
  "salad-healthy": "offline-food",
  "ramen-noodle": "offline-food",
  "chicken-burger": "offline-food",
  "western-pasta-brunch": "offline-food",

  // ── cafe-dessert (6) ──
  "takeout-coffee": "offline-cafe",
  "specialty-coffee": "offline-cafe",
  "dessert-cafe": "offline-cafe",
  "bakery-studio": "offline-cafe",
  "icecream-bingsu": "offline-cafe",
  "self-serve-cafe": "offline-cafe",

  // ── retail (6) ──
  "convenience-small": "offline-retail",
  "lifestyle-goods": "offline-retail",
  "beauty-supplies": "offline-retail",
  "fashion-accessories": "offline-retail",
  "health-food-store": "offline-retail",
  "unmanned-retail": "offline-retail",

  // ── beauty (6) ──
  "hair-salon": "offline-beauty",
  "nail-studio": "offline-beauty",
  "skin-care-room": "offline-beauty",
  "waxing-studio": "offline-beauty",
  "eyelash-brow": "offline-beauty",
  "makeup-bridal": "offline-beauty",

  // ── fitness (6) ──
  "pilates-studio": "offline-fitness",
  "pt-gym": "offline-fitness",
  "yoga-studio": "offline-fitness",
  "crossfit-box": "offline-fitness",
  "golf-studio": "offline-fitness",
  "unmanned-fitness": "offline-fitness",

  // ── education (6) ──
  "study-room": "offline-education",
  "kids-academy": "offline-education",
  "adult-class": "offline-education",
  "language-academy": "offline-education",
  "coding-class": "offline-education",
  "small-study-room": "offline-education",

  // ── pet (6) ──
  "pet-grooming": "offline-pet",
  "pet-supplies": "offline-pet",
  "pet-hotel": "offline-pet",
  "pet-cafe": "offline-pet",
  "pet-training-school": "offline-pet",

  // ── living-service (6) ──
  "laundry-service": "offline-living",
  "cleaning-service": "offline-living",
  "repair-service": "offline-living",
  "self-laundry": "offline-living",
  "print-copy": "offline-living",
  "device-repair": "offline-living",

  // ── space (6) ──
  "guesthouse": "offline-space",
  "rental-studio": "offline-space",
  "party-room": "offline-space",
  "study-cafe-space": "offline-space",
  "shared-office": "offline-space",
  "practice-room": "offline-space",

  // ── online-digital (6) ──
  "smart-store": "online-digital",
  "digital-products": "online-digital",
  "creator-service": "online-digital",
  "consignment-commerce": "online-digital",
  "newsletter-membership": "online-digital",
  "global-buying": "online-digital",

  // ── startup-tech: software (6) ──
  "ai-application": "tech-software",
  "developer-tools": "tech-software",
  "b2b-saas": "tech-software",
  "fintech-startup": "tech-software",
  "healthtech-startup": "tech-software",
  "security-startup": "tech-software",

  // ── startup-tech: hardware (1) ──
  "hardware-iot": "tech-hardware",

  // ── startup-tech: deep-tech with lab (2) ──
  "robotics-physical-ai": "tech-deeptech-lab",
  "biotech-medtech": "tech-deeptech-lab",

  // ── startup-tech: extreme deep-tech (2) ──
  "semiconductor": "tech-extreme-deeptech",
  "climate-energy": "tech-extreme-deeptech",
};

/** 클러스터 → 카테고리 (UI/AI 프롬프트에서 폴백 콘텐츠 lookup 용) */
export const CATEGORY_BY_CLUSTER: Record<ClusterId, string> = {
  "tech-software": "startup-tech",
  "tech-hardware": "startup-tech",
  "tech-deeptech-lab": "startup-tech",
  "tech-extreme-deeptech": "startup-tech",
  "offline-food": "food",
  "offline-cafe": "cafe-dessert",
  "offline-retail": "retail",
  "offline-beauty": "beauty",
  "offline-fitness": "fitness",
  "offline-education": "education",
  "offline-pet": "pet",
  "offline-living": "living-service",
  "offline-space": "space",
  "online-digital": "online-digital",
};

/**
 * 클러스터 라벨 — UI 표시용
 */
export const CLUSTER_LABEL: Record<ClusterId, { ko: string; en: string }> = {
  "tech-software": { ko: "소프트웨어 스타트업", en: "Software Startup" },
  "tech-hardware": { ko: "하드웨어·IoT 스타트업", en: "Hardware / IoT Startup" },
  "tech-deeptech-lab": { ko: "딥테크·랩 기반 스타트업", en: "Deep-tech (Lab) Startup" },
  "tech-extreme-deeptech": { ko: "극(極)자본 딥테크 스타트업", en: "Extreme Deep-tech Startup" },
  "offline-food": { ko: "음식점·외식", en: "Food & Restaurant" },
  "offline-cafe": { ko: "카페·디저트", en: "Cafe & Dessert" },
  "offline-retail": { ko: "소매·편의", en: "Retail" },
  "offline-beauty": { ko: "미용·뷰티", en: "Beauty" },
  "offline-fitness": { ko: "피트니스", en: "Fitness" },
  "offline-education": { ko: "교육·학원", en: "Education" },
  "offline-pet": { ko: "반려동물 서비스", en: "Pet Services" },
  "offline-living": { ko: "생활 서비스", en: "Living Services" },
  "offline-space": { ko: "공간 임대", en: "Space Rental" },
  "online-digital": { ko: "온라인·디지털", en: "Online & Digital" },
};

/** sub-industry → cluster 룩업 헬퍼 (없으면 카테고리 기반 폴백) */
export function getClusterForSubIndustry(
  subIndustryId: string | undefined,
  industryCategoryId: string,
): ClusterId | null {
  if (subIndustryId && CLUSTER_BY_SUB_INDUSTRY[subIndustryId]) {
    return CLUSTER_BY_SUB_INDUSTRY[subIndustryId];
  }
  // 카테고리 기반 폴백 — 세부 업종 미선택 시
  switch (industryCategoryId) {
    case "startup-tech": return "tech-software"; // 가장 일반적
    case "food": return "offline-food";
    case "cafe-dessert": return "offline-cafe";
    case "retail": return "offline-retail";
    case "beauty": return "offline-beauty";
    case "fitness": return "offline-fitness";
    case "education": return "offline-education";
    case "pet": return "offline-pet";
    case "living-service": return "offline-living";
    case "space": return "offline-space";
    case "online-digital": return "online-digital";
    default: return null;
  }
}

/** 클러스터가 startup-tech 카테고리에 속하는지 */
export function isStartupCluster(cluster: ClusterId): boolean {
  return cluster.startsWith("tech-");
}

/** 클러스터가 오프라인인지 */
export function isOfflineCluster(cluster: ClusterId): boolean {
  return cluster.startsWith("offline-");
}

// ─────────────────────────────────────────────────────────────
//  운영 모드별 단계 가시성 — Phase 4 솔로 분기
// ─────────────────────────────────────────────────────────────

/** 운영 모드 — BudgetSetupStage 에서 사용자가 선택 */
export type OperatingMode = "indie" | "bootstrap" | "seed" | "seriesA";

/** stage 가시성 — required (필수) / optional (선택) / skip (자동 스킵) */
export type StageVisibility = "required" | "optional" | "skip";

/**
 * 운영 모드별 stage 가시성 매트릭스.
 *
 *  ⚠️ 핵심 원칙: 어떤 모드에서도 stage 를 숨기지 않는다.
 *      1인 인디도 자금이 필요할 수 있다 — 단, "맞는 자금원" 이 다를 뿐 (공모전·1인 창업 지원금 등).
 *      기본 정책: 모든 stage 가 모든 모드에서 required. 콘텐츠 내부에서 모드별 분기.
 *
 *  콘텐츠 분기 가이드 (FundraisingReadinessStage 등에서 사용):
 *    • indie: 예비창업패키지·1인 창조기업·공모전·크라우드펀딩 강조
 *    • bootstrap: 청년창업사관학교·소진공 정책자금·TIPS 1억
 *    • seed: VC·시리즈A 본격 펀딩
 *    • seriesA+: 글로벌 펀드·후속 자금·M&A
 */
export const STAGE_VISIBILITY_BY_MODE: Record<OperatingMode, Record<string, StageVisibility>> = {
  indie: {},     // 모두 required — 콘텐츠로 분기
  bootstrap: {}, // 모두 required
  seed: {},      // 모두 required
  seriesA: {},   // 모두 required
};

/**
 * 특정 stage 가 운영 모드에서 어떻게 표시되어야 하는지 결정.
 * 현재 정책: 모든 stage 항상 required (모드별 분기는 콘텐츠 레이어에서).
 */
export function getStageVisibility(
  mode: OperatingMode,
  stageId: string,
): StageVisibility {
  return STAGE_VISIBILITY_BY_MODE[mode]?.[stageId] ?? "required";
}
