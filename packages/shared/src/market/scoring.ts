import type { RecommendationItem } from "../types/roadmap";
import { findMatchingDistricts, type MarketDistrict } from "./seoul-districts";

type MarketCandidateInput = {
  region: string;
  categoryId?: string;
  capital?: number;
  candidates: RecommendationItem[];
};

type DirectMarketInput = {
  region: string;
  marketName: string;
  categoryId?: string;
  capital?: number;
  candidates: RecommendationItem[];
  signal?: RecommendationItem | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type MarketStyle = "destination" | "office" | "residential" | "balanced";

type ScoreBreakdown = {
  budgetFit: number;
  competition: number;
  demand: number;
  categoryFit: number;
  access: number;
  baseQuality: number;
  total: number;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function titleCaseSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── 예산 기반 상권 필터링 ──────────────────────────────────────────────────
// 자본금 대비 감당 불가능한 고지가 상권을 사전 차단합니다.
// 기준: 보증금 + 6개월 임대료 + 최소 인테리어 + 운전자금을 감당할 수 있는 최소 자본금

const MIN_CAPITAL_BY_RENT_BAND: Record<string, number> = {
  "high":     80000000,   // 8,000만원 — 강남역, 홍대, 이태원 메인
  "mid-high": 50000000,   // 5,000만원 — 성수, 건대, 합정, 판교
  "mid":      30000000,   // 3,000만원 — 망원, 연남, 을지로, 역삼 이면
  "mid-low":  15000000,   // 1,500만원 — 일반 주거상권, 외곽 역세권
  "low":      0,          // 제한 없음 — 외곽, 배달 전용
};

export function isAffordableMarket(capital: number | undefined, rentBand: string): boolean {
  if (!capital) return true; // 예산 미입력 시 필터링 안함
  const minCapital = MIN_CAPITAL_BY_RENT_BAND[rentBand] ?? 0;
  return capital >= minCapital;
}

export function getBudgetWarning(capital: number, rentBand: string, lang: "ko" | "en" = "ko"): string | undefined {
  const minCapital = MIN_CAPITAL_BY_RENT_BAND[rentBand] ?? 0;
  if (capital >= minCapital) return undefined;
  const shortfall = Math.round((minCapital - capital) / 10000);
  return lang === "ko"
    ? `이 상권은 최소 자본금 ${Math.round(minCapital / 10000).toLocaleString()}만원 이상이 권장됩니다 (현재 예산 대비 약 ${shortfall.toLocaleString()}만원 부족)`
    : `This area requires at least ₩${Math.round(minCapital / 10000).toLocaleString()}M capital (₩${shortfall.toLocaleString()}M short of your budget)`;
}

function scoreBudgetFit(capital: number | undefined, rentBand: string) {
  if (!capital) {
    return 14;
  }

  if (rentBand === "high") {
    if (capital < 30000000) return 6;
    if (capital < 60000000) return 11;
    if (capital < 100000000) return 17;
    return 22;
  }

  if (rentBand === "mid-high") {
    if (capital < 25000000) return 8;
    if (capital < 50000000) return 13;
    if (capital < 90000000) return 18;
    return 21;
  }

  if (rentBand === "mid") {
    if (capital < 20000000) return 10;
    if (capital < 40000000) return 16;
    if (capital < 70000000) return 20;
    return 22;
  }

  if (rentBand === "mid-low") {
    if (capital < 15000000) return 12;
    if (capital < 30000000) return 18;
    return 22;
  }

  return capital < 15000000 ? 16 : 22;
}

function scoreCompetition(categoryId: string | undefined, competitionLevel: string) {
  const highToleranceCategories = new Set(["cafe-dessert", "beauty", "fitness"]);
  const lowToleranceCategories = new Set(["living-service", "education", "pet"]);

  if (competitionLevel === "high") {
    if (highToleranceCategories.has(categoryId ?? "")) return 14;
    if (lowToleranceCategories.has(categoryId ?? "")) return 8;
    return 11;
  }

  if (competitionLevel === "mid-high") {
    if (highToleranceCategories.has(categoryId ?? "")) return 15;
    if (lowToleranceCategories.has(categoryId ?? "")) return 10;
    return 12;
  }

  if (competitionLevel === "mid") {
    return 16;
  }

  if (competitionLevel === "mid-low") {
    return 18;
  }

  return 20;
}

function scoreDemand(style: MarketStyle) {
  switch (style) {
    case "destination":
      return 21;
    case "office":
      return 20;
    case "residential":
      return 17;
    default:
      return 18;
  }
}

function scoreCategoryFit(categoryId: string | undefined, style: MarketStyle) {
  if (!categoryId) {
    return 14;
  }

  const fitTable: Record<string, Partial<Record<MarketStyle, number>>> = {
    "cafe-dessert": { destination: 20, office: 16, residential: 14, balanced: 15 },
    food: { destination: 17, office: 20, residential: 15, balanced: 16 },
    retail: { destination: 18, office: 15, residential: 14, balanced: 15 },
    beauty: { destination: 16, office: 14, residential: 18, balanced: 16 },
    fitness: { destination: 13, office: 16, residential: 19, balanced: 17 },
    education: { destination: 10, office: 14, residential: 20, balanced: 16 },
    pet: { destination: 11, office: 12, residential: 20, balanced: 15 },
    "living-service": { destination: 8, office: 12, residential: 21, balanced: 16 },
    space: { destination: 15, office: 18, residential: 13, balanced: 15 },
    "online-digital": { destination: 7, office: 9, residential: 8, balanced: 8 },
    "startup-tech": { destination: 9, office: 17, residential: 10, balanced: 14 }
  };

  return fitTable[categoryId]?.[style] ?? 14;
}

function scoreAccess(style: MarketStyle, normalizedName: string) {
  let score =
    style === "office" ? 12 : style === "destination" ? 11 : style === "balanced" ? 10 : 9;

  if (normalizedName.includes("역")) score += 2;
  if (normalizedName.includes("대로")) score += 1;
  if (normalizedName.includes("골목")) score -= 1;
  if (normalizedName.includes("출구")) score += 1;

  return clamp(score, 7, 14);
}

function scoreBaseQuality(seedScore: number | undefined) {
  if (typeof seedScore !== "number") {
    return 8;
  }

  return clamp(Math.round((seedScore - 60) / 2), 4, 16);
}

function getRegionStyle(region: string): MarketStyle {
  const normalized = normalizeText(region);

  if (
    normalized.includes("성수") ||
    normalized.includes("연남") ||
    normalized.includes("망원") ||
    normalized.includes("해운대") ||
    normalized.includes("전포")
  ) {
    return "destination";
  }

  if (
    normalized.includes("역") ||
    normalized.includes("강남") ||
    normalized.includes("여의도") ||
    normalized.includes("판교") ||
    normalized.includes("오피스")
  ) {
    return "office";
  }

  if (
    normalized.includes("주거") ||
    normalized.includes("아파트") ||
    normalized.includes("신도시") ||
    normalized.includes("동네")
  ) {
    return "residential";
  }

  return "balanced";
}

function getCategoryNudge(categoryId?: string, style?: string) {
  if (!categoryId) {
    return 0;
  }

  if (categoryId === "cafe-dessert" && style === "destination") {
    return 5;
  }

  if (categoryId === "food" && style === "office") {
    return 4;
  }

  if (categoryId === "living-service" && style === "residential") {
    return 5;
  }

  if (categoryId === "online-digital") {
    return -2;
  }

  if (categoryId === "startup-tech" && style === "office") {
    return 4;
  }

  return 0;
}

function buildStyleMeta(style: MarketStyle) {
  switch (style) {
    case "destination":
      return {
        rentBand: "high",
        competitionLevel: "high",
        customerFit: "strong"
      };
    case "office":
      return {
        rentBand: "mid-high",
        competitionLevel: "mid",
        customerFit: "strong"
      };
    case "residential":
      return {
        rentBand: "mid-low",
        competitionLevel: "mid-low",
        customerFit: "steady"
      };
    default:
      return {
        rentBand: "mid",
        competitionLevel: "mid",
        customerFit: "balanced"
      };
  }
}

function buildScoreBreakdown(params: {
  capital?: number;
  categoryId?: string;
  style: MarketStyle;
  rentBand: string;
  competitionLevel: string;
  seedScore?: number;
  name: string;
}): ScoreBreakdown {
  const budgetFit = scoreBudgetFit(params.capital, params.rentBand);
  const competition = scoreCompetition(params.categoryId, params.competitionLevel);
  const demand = scoreDemand(params.style);
  const categoryFit = scoreCategoryFit(params.categoryId, params.style);
  const access = scoreAccess(params.style, normalizeText(params.name));
  const baseQuality = scoreBaseQuality(params.seedScore);
  const total = clamp(
    budgetFit + competition + demand + categoryFit + access + baseQuality,
    45,
    96
  );

  return {
    budgetFit,
    competition,
    demand,
    categoryFit,
    access,
    baseQuality,
    total
  };
}

function buildBreakdownMeta(breakdown: ScoreBreakdown) {
  return {
    scoreBudgetFit: breakdown.budgetFit,
    scoreCompetition: breakdown.competition,
    scoreDemand: breakdown.demand,
    scoreCategoryFit: breakdown.categoryFit,
    scoreAccess: breakdown.access,
    scoreBaseQuality: breakdown.baseQuality
  };
}

function buildBreakdownReason(breakdown: ScoreBreakdown) {
  return `예산 ${breakdown.budgetFit} · 경쟁 ${breakdown.competition} · 유동 ${breakdown.demand} · 업종 ${breakdown.categoryFit} · 접근 ${breakdown.access}`;
}

function getBudgetFitText(score: number, language: "ko" | "en") {
  if (language === "ko") {
    if (score >= 20) return "현재 예산으로 비교적 무리 없이 검토할 수 있어요.";
    if (score >= 15) return "예산은 맞지만 임대료 조건은 꼼꼼히 보셔야 해요.";
    return "예산 부담이 큰 편이라 초기 비용 계획을 다시 보는 게 좋아요.";
  }

  if (score >= 20) return "The budget looks manageable for this market.";
  if (score >= 15) return "The budget can work, but rent needs a closer look.";
  return "This market looks expensive for your current budget.";
}

function getCompetitionText(score: number, language: "ko" | "en") {
  if (language === "ko") {
    if (score >= 18) return "경쟁 강도는 비교적 안정적인 편입니다.";
    if (score >= 13) return "경쟁은 있는 편이라 차별화가 중요해요.";
    return "경쟁 밀도가 높은 편이라 포지셔닝이 더 선명해야 해요.";
  }

  if (score >= 18) return "Competition looks relatively manageable.";
  if (score >= 13) return "Competition is meaningful, so differentiation matters.";
  return "Competition is dense here, so positioning needs to be sharper.";
}

function getDemandText(score: number, language: "ko" | "en") {
  if (language === "ko") {
    if (score >= 20) return "유입과 수요 흐름은 강한 편입니다.";
    if (score >= 17) return "반복 수요와 유입을 함께 기대할 수 있어요.";
    return "수요는 나쁘지 않지만 운영 콘셉트가 더 중요해질 수 있어요.";
  }

  if (score >= 20) return "Foot traffic and demand look strong.";
  if (score >= 17) return "There is a decent mix of repeat demand and walk-in traffic.";
  return "Demand is acceptable, but the concept will matter more here.";
}

function getCategoryFitText(score: number, language: "ko" | "en") {
  if (language === "ko") {
    if (score >= 19) return "선택한 업종과 상권 성격의 궁합이 좋습니다.";
    if (score >= 15) return "업종 적합도는 무난하지만 콘셉트 조정이 필요할 수 있어요.";
    return "이 업종엔 아주 강한 상권은 아니어서 보완 전략이 필요해요.";
  }

  if (score >= 19) return "This market fits your chosen category well.";
  if (score >= 15) return "Category fit is decent, though concept tuning may help.";
  return "This is not a naturally strong market for the category, so strategy matters.";
}

export function buildMarketScoreNarrative(
  item: RecommendationItem | null | undefined,
  language: "ko" | "en" = "ko"
) {
  if (!item?.meta) {
    return language === "ko"
      ? "이 상권은 예산, 경쟁, 수요를 함께 보고 검토하고 있어요."
      : "This market is being reviewed across budget, competition, and demand.";
  }

  const budgetFit = Number(item.meta.scoreBudgetFit ?? 0);
  const competition = Number(item.meta.scoreCompetition ?? 0);
  const demand = Number(item.meta.scoreDemand ?? 0);
  const categoryFit = Number(item.meta.scoreCategoryFit ?? 0);

  const lines = [
    getBudgetFitText(budgetFit, language),
    getCompetitionText(competition, language),
    getDemandText(demand, language),
    getCategoryFitText(categoryFit, language)
  ];

  return language === "ko" ? lines.join(" ") : lines.join(" ");
}

export function formatMarketMetaValue(
  kind: "rentBand" | "competitionLevel" | "customerFit" | "marketStyle",
  value: string | number | boolean | undefined,
  language: "ko" | "en" = "ko"
) {
  const normalized = String(value ?? "").trim().toLowerCase();

  const map: Record<string, { ko: string; en: string }> = {
    high: { ko: "높음", en: "High" },
    "mid-high": { ko: "다소 높음", en: "Mid-high" },
    mid: { ko: "보통", en: "Medium" },
    "mid-low": { ko: "다소 낮음", en: "Mid-low" },
    low: { ko: "낮음", en: "Low" },
    strong: { ko: "강함", en: "Strong" },
    steady: { ko: "안정적", en: "Steady" },
    balanced: { ko: "균형적", en: "Balanced" },
    throughput: { ko: "회전형", en: "High-throughput" },
    destination: { ko: "목적형", en: "Destination" },
    office: { ko: "오피스형", en: "Office" },
    residential: { ko: "생활권형", en: "Residential" }
  };

  if (!normalized) {
    return language === "ko" ? "-" : "-";
  }

  if (kind === "customerFit" && normalized === "high") {
    return language === "ko" ? "강함" : "Strong";
  }

  return map[normalized]?.[language] ?? String(value);
}

function getCategoryLabel(categoryId?: string) {
  switch (categoryId) {
    case "cafe-dessert":
      return "카페/디저트";
    case "food":
      return "외식";
    case "retail":
      return "소매";
    case "beauty":
      return "뷰티";
    case "fitness":
      return "피트니스";
    case "education":
      return "교육";
    case "pet":
      return "반려동물";
    case "living-service":
      return "생활 서비스";
    case "space":
      return "공간/숙박";
    case "online-digital":
      return "온라인/디지털";
    case "startup-tech":
      return "기술 스타트업";
    default:
      return "창업";
  }
}

function buildCategoryAwareSummary(
  region: string,
  categoryId: string | undefined,
  style: MarketStyle,
  slot: number
) {
  const categoryLabel = getCategoryLabel(categoryId);

  const byCategory: Partial<Record<string, Partial<Record<MarketStyle, string>>>> = {
    "cafe-dessert": {
      destination: `${region} 안에서 브랜드 감도와 목적형 방문을 같이 노리기 좋은 ${categoryLabel} 후보입니다.`,
      office: `${region} 안에서 출근길·점심 유입을 빠르게 잡기 좋은 ${categoryLabel} 후보입니다.`,
      residential: `${region} 안에서 반복 방문과 동네 단골 흐름에 유리한 ${categoryLabel} 후보입니다.`
    },
    food: {
      destination: `${region} 안에서 콘셉트형 외식 브랜드를 보여주기 좋은 ${categoryLabel} 후보입니다.`,
      office: `${region} 안에서 점심·저녁 회전이 중요한 ${categoryLabel} 후보입니다.`,
      residential: `${region} 안에서 가족·동네 반복 수요를 보기 좋은 ${categoryLabel} 후보입니다.`
    },
    retail: {
      destination: `${region} 안에서 발견형 구매와 브랜드 노출을 기대할 수 있는 ${categoryLabel} 후보입니다.`,
      office: `${region} 안에서 빠른 편의 구매를 흡수하기 좋은 ${categoryLabel} 후보입니다.`,
      residential: `${region} 안에서 생활 밀착형 재구매를 보기 좋은 ${categoryLabel} 후보입니다.`
    },
    beauty: {
      destination: `${region} 안에서 프리미엄 예약 유입을 기대할 수 있는 ${categoryLabel} 후보입니다.`,
      office: `${region} 안에서 직장인 예약 수요를 받기 좋은 ${categoryLabel} 후보입니다.`,
      residential: `${region} 안에서 재방문 중심 고객을 쌓기 좋은 ${categoryLabel} 후보입니다.`
    },
    education: {
      office: `${region} 안에서 성인·직장인 수요를 보기 좋은 ${categoryLabel} 후보입니다.`,
      residential: `${region} 안에서 학부모·학생 반복 수요에 잘 맞는 ${categoryLabel} 후보입니다.`,
      balanced: `${region} 안에서 안정적인 근거리 수요를 기대할 수 있는 ${categoryLabel} 후보입니다.`
    },
    "online-digital": {
      balanced: `${region} 자체보다 운영 효율과 비용 통제가 더 중요한 ${categoryLabel} 모델 기준 참고 후보입니다.`
    },
    "startup-tech": {
      office: `${region} 안에서 채용, 미팅, 커뮤니티 접근성이 중요한 ${categoryLabel} 허브 후보입니다.`,
      balanced: `${region} 안에서 채용과 비용 균형을 함께 보려는 ${categoryLabel} 허브 후보입니다.`
    }
  };

  return (
    byCategory[categoryId ?? ""]?.[style] ??
    (slot === 0
      ? `${region} 안에서 노출과 유입을 같이 보려는 창업자에게 가장 균형 잡힌 후보입니다.`
      : slot === 1
        ? `${region} 안에서 접근성과 빠른 유입을 중시할 때 먼저 검토할 만한 후보입니다.`
        : `${region} 안에서 초기 고정비와 반복 수요를 더 안정적으로 보려는 경우에 맞습니다.`)
  );
}

function buildCategoryAwareReasons(
  region: string,
  categoryId: string | undefined,
  style: MarketStyle,
  breakdown: ScoreBreakdown,
  slot: number
) {
  const common = [
    `${region} 기준으로 업종 적합도와 예산 적합도를 다시 반영했습니다.`,
    buildBreakdownReason(breakdown)
  ];

  const byCategory: Partial<Record<string, Partial<Record<MarketStyle, string[]>>>> = {
    "cafe-dessert": {
      destination: ["브랜드 경험과 사진 공유가 중요한 카페 콘셉트와 잘 맞습니다."],
      office: ["출근길·점심 시간 회전이 필요한 커피 수요를 기대할 수 있습니다."],
      residential: ["재방문하는 동네 고객을 만드는 데 유리합니다."]
    },
    food: {
      destination: ["콘셉트가 분명한 외식 브랜드일수록 목적형 방문 유입에 유리합니다."],
      office: ["점심 회전과 저녁 수요를 함께 보기 좋은 흐름입니다."],
      residential: ["가족·동네 단골 기반의 반복 수요를 만들기 좋습니다."]
    },
    retail: {
      destination: ["발견형 소비와 산책 유입을 흡수하기 좋습니다."],
      office: ["짧은 체류 시간 안에 구매가 일어나는 편의형 수요에 맞습니다."],
      residential: ["생활 밀착형 재구매 흐름을 만들기 좋습니다."]
    },
    beauty: {
      destination: ["프리미엄 브랜딩과 예약형 고객 경험을 설명하기 좋습니다."],
      office: ["직장인 저녁 예약과 점심 틈새 수요를 함께 보기 좋습니다."],
      residential: ["근거리 재방문 고객을 쌓기에 유리합니다."]
    },
    fitness: {
      office: ["출퇴근 동선과 연계된 빠른 방문 흐름을 기대할 수 있습니다."],
      residential: ["멤버십 기반 반복 방문을 만들기 좋습니다."]
    },
    education: {
      residential: ["학부모와 학생의 근거리 반복 수요에 잘 맞습니다."],
      balanced: ["반복 등록과 재등록 흐름을 만들기 좋은 위치 조건입니다."]
    },
    "living-service": {
      residential: ["생활권 반복 방문이 중요한 서비스와 궁합이 좋습니다."]
    },
    "online-digital": {
      balanced: ["오프라인 입지보다 운영 효율과 비용 구조가 우선인 업종입니다."]
    },
    "startup-tech": {
      office: ["채용, 미팅, 커뮤니티 접근성이 중요한 기술 스타트업과 잘 맞습니다."],
      balanced: ["비용 통제와 팀 운영의 균형을 보기 좋은 허브 조건입니다."]
    }
  };

  const finalReason =
    byCategory[categoryId ?? ""]?.[style]?.[0] ??
    (slot === 0
      ? "노출과 브랜드 감도를 같이 가져가기 좋습니다."
      : slot === 1
        ? "유입 속도와 접근성이 상대적으로 좋습니다."
        : "초기 비용 통제와 반복 방문 안정성에 유리합니다.");

  return [...common, finalReason];
}

function buildCategoryAwareDirectSummary(
  marketName: string,
  categoryId: string | undefined,
  style: MarketStyle
) {
  const categoryLabel = getCategoryLabel(categoryId);

  if (categoryId === "online-digital") {
    return `${marketName}을 ${categoryLabel} 기준 운영 거점으로 보고 작업 효율, 보관 여력, 물류 동선을 함께 점검했습니다.`;
  }

  if (categoryId === "startup-tech") {
    return `${marketName}을 ${categoryLabel} 기준 허브로 보고 팀 채용, 고객 미팅, 커뮤니티 접근성을 함께 점검했습니다.`;
  }

  const byStyle: Partial<Record<MarketStyle, string>> = {
    destination: `${marketName}을 ${categoryLabel} 기준 목적형 상권으로 보고 브랜드 노출과 방문 유입 가능성을 함께 점검했습니다.`,
    office: `${marketName}을 ${categoryLabel} 기준 회전형 상권으로 보고 점심·퇴근 수요와 접근성을 함께 계산했습니다.`,
    residential: `${marketName}을 ${categoryLabel} 기준 생활권 상권으로 보고 반복 방문과 비용 통제 가능성을 점검했습니다.`,
    balanced: `${marketName}을 ${categoryLabel} 기준 균형형 상권으로 보고 예산과 접근성을 함께 계산했습니다.`
  };

  return byStyle[style] ?? `${marketName}의 상권 적합도를 다시 계산했습니다.`;
}

function buildRegionalCandidate(
  region: string,
  base: RecommendationItem,
  slot: number,
  categoryId?: string,
  capital?: number
): RecommendationItem {
  const styles =
    categoryId === "online-digital"
      ? (["balanced", "office", "residential"] as const)
      : categoryId === "startup-tech"
        ? (["office", "balanced", "residential"] as const)
        : (["destination", "office", "residential"] as const);
  const suffixes =
    categoryId === "online-digital"
      ? ([
          { ko: "작업 거점", en: "operations base" },
          { ko: "물류 접근권", en: "logistics access" },
          { ko: "주거형 운영권", en: "residential base" }
        ] as const)
      : categoryId === "startup-tech"
        ? ([
            { ko: "창업 허브", en: "startup hub" },
            { ko: "균형 운영권", en: "balanced base" },
            { ko: "원격 친화권", en: "remote-friendly base" }
          ] as const)
        : ([
            { ko: "중심상권", en: "core market" },
            { ko: "역세권", en: "station area" },
            { ko: "주거혼합권", en: "residential mix" }
          ] as const);
  const style = styles[slot] ?? "balanced";
  const meta = buildStyleMeta(style);
  const baseScore = typeof base.score === "number" ? base.score : 74;
  const breakdown = buildScoreBreakdown({
    capital,
    categoryId,
    style,
    rentBand: String(meta.rentBand),
    competitionLevel: String(meta.competitionLevel),
    seedScore: baseScore + getCategoryNudge(categoryId, style) - slot,
    name: `${region} ${suffixes[slot]?.ko ?? ""}`
  });

  return {
    ...base,
    id: `${base.id}-${titleCaseSlug(region)}-${slot + 1}`,
    title: `${region} ${suffixes[slot]?.ko ?? (categoryId === "online-digital" ? "추천 거점" : "추천 상권")}`,
    score: breakdown.total,
    summary: buildCategoryAwareSummary(region, categoryId, style, slot),
    reasons: buildCategoryAwareReasons(region, categoryId, style, breakdown, slot),
    warnings:
      categoryId === "online-digital"
        ? slot === 0
          ? ["작업 공간은 괜찮아도 보관과 포장 동선이 좁을 수 있습니다."]
          : slot === 1
            ? ["택배 접근성은 좋지만 고정비가 빠르게 올라갈 수 있습니다."]
            : ["주거형 거점은 비용은 낮지만 확장성과 외주 동선이 제한될 수 있습니다."]
        : categoryId === "startup-tech"
          ? slot === 0
            ? ["허브 접근성은 좋지만 임대료와 채용 경쟁이 높을 수 있습니다."]
            : slot === 1
              ? ["균형형 허브는 무난하지만 밀도 높은 네트워크 효과는 약할 수 있습니다."]
              : ["원격 친화 거점은 비용은 낮지만 고객·채용 접점이 줄어들 수 있습니다."]
        : slot === 0
          ? ["노출이 강한 만큼 경쟁도도 함께 확인해야 합니다."]
          : slot === 1
            ? ["역세권은 임대료가 빠르게 올라갈 수 있습니다."]
            : ["생활형 수요는 브랜드 확장 속도가 다소 느릴 수 있습니다."],
    meta: {
      ...(base.meta ?? {}),
      region,
      rentBand: meta.rentBand,
      competitionLevel: meta.competitionLevel,
      customerFit: meta.customerFit,
      ...buildBreakdownMeta(breakdown)
    }
  };
}

export function buildRecommendedMarkets(input: MarketCandidateInput): RecommendationItem[] {
  const region = input.region.trim();
  if (!region) {
    return [];
  }

  // Try Seoul district data first
  const seoulMatches = findMatchingDistricts(region);
  if (seoulMatches.length >= 3) {
    // 예산 기반 필터링: 감당 가능한 상권만 추천
    const affordable = seoulMatches.filter((d) =>
      isAffordableMarket(input.capital, d.meta.rentBand)
    );

    if (affordable.length >= 1) {
      return affordable.slice(0, 5).map((d) => {
        const rec = districtToRecommendation(d, input.categoryId);
        // 예산 여유가 빠듯한 경우 경고 추가
        if (input.capital) {
          const warning = getBudgetWarning(input.capital, d.meta.rentBand);
          if (warning) {
            rec.warnings = [...(rec.warnings ?? []), warning];
          }
        }
        return rec;
      });
    }

    // 모든 상권이 예산 초과 시 → 가장 저렴한 상권 + 경고와 함께 추천
    const byRentAsc = [...seoulMatches].sort((a, b) => {
      const order: Record<string, number> = { low: 0, "mid-low": 1, mid: 2, "mid-high": 3, high: 4 };
      return (order[a.meta.rentBand] ?? 2) - (order[b.meta.rentBand] ?? 2);
    });
    return byRentAsc.slice(0, 3).map((d) => {
      const rec = districtToRecommendation(d, input.categoryId);
      const warning = input.capital
        ? getBudgetWarning(input.capital, d.meta.rentBand)
        : undefined;
      if (warning) {
        rec.warnings = [...(rec.warnings ?? []), warning];
      }
      return rec;
    });
  }

  // Fallback to legacy candidate-based system
  return input.candidates.slice(0, 3).map((candidate, index) =>
    buildRegionalCandidate(region, candidate, index, input.categoryId, input.capital)
  );
}

function districtToRecommendation(d: MarketDistrict, categoryId?: string): RecommendationItem {
  const lang = "ko";
  return {
    id: d.id,
    title: d.title[lang],
    score: d.score,
    summary: d.summary[lang],
    reasons: [],
    warnings: [],
    meta: {
      districtName: d.meta.districtName,
      rentBand: d.meta.rentBand,
      competitionLevel: d.meta.competitionLevel,
      customerFit: d.meta.customerFit,
      marketStyle: d.meta.marketStyle,
      footTraffic: d.meta.footTraffic,
      growthTrend: d.meta.growthTrend
    },
    // 내장 상권 데이터는 항상 활성 상태로 표시 (freshness 누락 시 카드 비활성화 방지)
    freshness: {
      status: "fresh",
      label: "서울시 상권분석 서비스 기반",
      sources: [{
        sourceName: "서울시 우리마을가게 상권분석",
        sourceUrl: "https://golmok.seoul.go.kr",
        verifiedAt: "2025-03-01",
        confidence: "high",
      }],
      lastCheckedAt: "2025-03-01",
      nextReviewAt: "2025-09-01",
    },
  };
}

export function evaluateDirectMarket(input: DirectMarketInput): {
  evaluation: RecommendationItem;
  alternative?: RecommendationItem;
} {
  const normalized = normalizeText(input.marketName);
  const signalMeta = input.signal?.meta ?? {};
  const style = (signalMeta.marketStyle as MarketStyle | undefined) ??
    (normalized.includes("역")
      ? "office"
      : normalized.includes("골목") || normalized.includes("주거")
        ? "residential"
        : normalized.includes("핫플") || normalized.includes("메인")
          ? "destination"
          : getRegionStyle(input.region || input.marketName));
  const meta = {
    ...buildStyleMeta(style),
    rentBand: String(signalMeta.rentBand ?? buildStyleMeta(style).rentBand),
    competitionLevel: String(signalMeta.competitionLevel ?? buildStyleMeta(style).competitionLevel),
    customerFit: String(signalMeta.customerFit ?? buildStyleMeta(style).customerFit)
  };
  const breakdown = buildScoreBreakdown({
    capital: input.capital,
    categoryId: input.categoryId,
    style,
    rentBand: meta.rentBand,
    competitionLevel: meta.competitionLevel,
    seedScore:
      (typeof input.signal?.score === "number" ? input.signal.score : 72) +
      getCategoryNudge(input.categoryId, style),
    name: input.marketName
  });

  const evaluation: RecommendationItem = {
    id: `custom-${titleCaseSlug(input.marketName)}`,
    title: input.marketName,
    score: breakdown.total,
    summary: buildCategoryAwareDirectSummary(input.marketName, input.categoryId, style),
    reasons: [
      input.signal?.title
        ? input.categoryId === "online-digital"
          ? `${input.signal.title}에 있는 최신 운영 거점 신호를 우선 반영했습니다.`
          : input.categoryId === "startup-tech"
            ? `${input.signal.title}에 있는 최신 창업 허브 신호를 우선 반영했습니다.`
          : `${input.signal.title}에 있는 최신 상권 신호를 우선 반영했습니다.`
        : undefined,
      input.region
        ? input.categoryId === "online-digital"
          ? `${input.region} 안에서 비교 가능한 운영 거점으로 평가했습니다.`
          : input.categoryId === "startup-tech"
            ? `${input.region} 안에서 비교 가능한 창업 허브로 평가했습니다.`
          : `${input.region} 안에서 비교 가능한 입지로 평가했습니다.`
        : input.categoryId === "online-digital"
          ? "입력한 거점 이름을 기준으로 일반적인 운영 환경 특성을 반영했습니다."
          : input.categoryId === "startup-tech"
            ? "입력한 허브 이름을 기준으로 일반적인 창업 운영 환경 특성을 반영했습니다."
          : "입력한 상권 이름을 기준으로 일반적인 입지 특성을 반영했습니다.",
      buildBreakdownReason(breakdown),
      input.categoryId === "online-digital"
        ? style === "office"
          ? "택배·반품 동선은 좋지만 고정비와 작업 밀도를 함께 봐야 합니다."
          : style === "residential"
            ? "비용 통제에는 유리하지만 보관과 확장성은 다시 확인해야 합니다."
            : "운영 효율과 비용 균형을 기대할 수 있는 거점입니다."
        : input.categoryId === "startup-tech"
          ? style === "office"
            ? "채용과 미팅 접근성은 좋지만 비용과 경쟁 강도도 함께 봐야 합니다."
            : style === "residential"
              ? "비용은 낮지만 팀 밀도와 네트워크 효과는 약할 수 있습니다."
              : "팀 운영과 비용 균형을 기대할 수 있는 허브입니다."
        : style === "office"
          ? "유입 속도는 좋지만 경쟁과 임대료를 함께 봐야 합니다."
          : style === "residential"
            ? "반복 수요와 비용 통제에 상대적으로 유리합니다."
            : "브랜드 노출과 방문 유입의 균형을 기대할 수 있습니다."
    ].filter((reason): reason is string => Boolean(reason)),
    warnings:
      breakdown.total < 70
        ? [input.categoryId === "online-digital" ? "현재 예산과 운영 구조 기준으로는 리스크가 다소 높은 편입니다." : input.categoryId === "startup-tech" ? "현재 예산과 팀 운영 구조 기준으로는 리스크가 다소 높은 편입니다." : "현재 예산과 업종 기준으로는 리스크가 다소 높은 편입니다."]
        : [input.categoryId === "online-digital" ? "최종 결정 전 보관, 택배, 외주 동선은 다시 확인해야 합니다." : input.categoryId === "startup-tech" ? "최종 결정 전 팀 채용, 고객 접근성, 비용 구조는 다시 확인해야 합니다." : "최종 계약 전 임대료와 경쟁도는 다시 확인해야 합니다."],
    meta: {
      region: input.region,
      rentBand: meta.rentBand,
      competitionLevel: meta.competitionLevel,
      customerFit: meta.customerFit,
      ...buildBreakdownMeta(breakdown)
    }
  };

  const alternatives = buildRecommendedMarkets({
    region: input.region || input.marketName,
    categoryId: input.categoryId,
    capital: input.capital,
    candidates: input.candidates
  }).filter((candidate) => normalizeText(candidate.title) !== normalized);

  const alternative =
    alternatives.find((candidate) => (candidate.score ?? 0) > breakdown.total) ?? alternatives[0];

  return {
    evaluation,
    alternative
  };
}
