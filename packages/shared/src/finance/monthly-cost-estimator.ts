/**
 * 월 운영비 통합 추정 — FinancialReviewStage용.
 *
 * 각 로드맵 단계에서 수집된 결정값을 통합해 월 비용 8개 필드를 자동 추정.
 * 우선순위:
 *   1. 사용자가 직접 입력한 값 (UserOverrides)
 *   2. 이전 로드맵 단계의 결정값 (StageInputs)
 *   3. 업종 평균 fallback
 */

import { resolveBusinessContext } from "../business-context";
import { calculateMonthlyTeamLaborCost, getDefaultStaffPlan, type StaffPlan } from "./hiring-cost";
import { estimateMonthlyRent, estimateRentByPyeongOnly, type RentEstimate } from "./rent-estimator";
import {
  estimateMonthlySgaFromOperations,
  type OperationsSelections,
  type SgaBreakdownItem,
} from "../constants/delivery-platform-fees";

/** 운영 대시보드와 일치하는 8개 비용 필드 */
export type MonthlyCostFields = {
  ingredients: number; // 식자재·매출원가 (COGS)
  labor: number;       // 인건비 (4대보험 포함)
  rent: number;        // 임대료 + 관리비
  utilities: number;   // 공과금 (전기·가스·수도·통신)
  sga: number;         // 배달수수료·POS·카드수수료
  marketing: number;   // 마케팅·광고
  other: number;       // 기타
  interest: number;    // 대출 이자
};

/** 로드맵 단계에서 수집 가능한 원천 입력값 */
export type StageInputs = {
  /** industry-selection · 업종 ID (food / cafe-dessert / ...) */
  categoryId: string;
  /** location-candidates · 선택된 상권 ID */
  selectedDistrictId?: string | null;
  /** 사용자 지정 평수 (없으면 업종 권장) */
  customPyeong?: number;
  /** 예상 월 매출 (원) — COGS·SGA 계산의 기준 */
  expectedMonthlyRevenueKrw?: number;
  /**
   * 사장이 vendor-setup 단계에서 직접 입력한 월 식자재(또는 매입원가) 합계 (원).
   * 있으면 매출 × cogsRate 추정을 덮어씀. source = "stage-derived".
   */
  ingredientsMonthlyKrw?: number;
  /**
   * 사장이 vendor-setup 단계에서 직접 입력한 매출 대비 원가율 (0~1).
   * ingredientsMonthlyKrw 가 없을 때만 사용. 있으면 매출 × 이 비율 = 원가.
   */
  ingredientsCogsRate?: number;
  /** 인력 계획 (hiring-setup 단계) */
  staffPlan?: StaffPlan;
  /** 운영 설정 (operations-setup 단계) */
  operations?: OperationsSelections;
  /** 대출 정보 (loan-guide 단계) */
  loan?: {
    amountKrw?: number;
    annualRatePercent?: number;
  };
  /** 프랜차이즈 정보 (franchise-application) */
  franchise?: {
    monthlyRoyaltyKrw?: number;
  };
};

/** 사용자가 UI에서 직접 오버라이드한 값 (최우선) */
export type UserOverrides = Partial<MonthlyCostFields>;

/** 각 필드의 추정 근거 */
export type CostSource =
  | "user-input"
  | "stage-derived"
  | "industry-average"
  | "insufficient-data";

export type MonthlyCostEstimate = {
  fields: MonthlyCostFields;
  sources: Record<keyof MonthlyCostFields, CostSource>;
  /** 상세 근거·브레이크다운 */
  details: {
    rent: RentEstimate | null;
    sga: { total: number; breakdown: SgaBreakdownItem[] };
    labor: { fullTimeCost: number; partTimeCost: number; total: number };
  };
};

// ─── 업종 평균 fallback (rent 제외) ──────────────────────────────────────
// 단위: 원. 상권 미선택 시 이 값들로 채움.

const INDUSTRY_AVERAGE: Record<string, Partial<MonthlyCostFields>> = {
  food:             { utilities: 450_000, marketing: 400_000, other: 300_000 },
  "cafe-dessert":   { utilities: 380_000, marketing: 300_000, other: 250_000 },
  retail:           { utilities: 300_000, marketing: 350_000, other: 200_000 },
  beauty:           { utilities: 350_000, marketing: 300_000, other: 200_000 },
  pet:              { utilities: 320_000, marketing: 250_000, other: 200_000 },
  fitness:          { utilities: 500_000, marketing: 400_000, other: 300_000 },
  education:        { utilities: 400_000, marketing: 500_000, other: 250_000 },
  space:            { utilities: 600_000, marketing: 200_000, other: 200_000 },
  // 스타트업/온라인은 재택·코워킹 가정 — utilities 0 (사용자가 사무실 있으면 직접 입력)
  "online-digital": { utilities: 0,       marketing: 800_000, other: 200_000 },
  "startup-tech":   { utilities: 0,       marketing: 500_000, other: 400_000 },
  "living-service": { utilities: 250_000, marketing: 200_000, other: 150_000 },
};

const DEFAULT_EXPECTED_REVENUE_KRW: Record<string, number> = {
  food:             30_000_000,
  "cafe-dessert":   20_000_000,
  retail:           25_000_000,
  beauty:           15_000_000,
  pet:              12_000_000,
  fitness:          18_000_000,
  education:        20_000_000,
  space:            10_000_000,
  "online-digital": 15_000_000,
  "startup-tech":   10_000_000,
  "living-service": 12_000_000,
};

// ─── 월 이자 계산 ────────────────────────────────────────────────────────

/**
 * 월 이자 = 대출원금 × 연이율 / 12.
 * 원금균등상환/원리금균등상환 등 상환 방식 차이는 여기선 추정치 목적으로 단순화.
 */
export function calculateMonthlyInterest(amountKrw: number, annualRatePercent: number): number {
  if (amountKrw <= 0 || annualRatePercent <= 0) return 0;
  return Math.round((amountKrw * annualRatePercent) / 100 / 12);
}

// ─── 메인 함수 ───────────────────────────────────────────────────────────

/**
 * 로드맵 단계 결정값 → 월 비용 8개 필드 자동 추정.
 *
 * @param stages 각 로드맵 단계에서 수집된 원천 입력값
 * @param overrides 사용자가 UI에서 직접 수정한 값 (최우선)
 */
export function estimateMonthlyCosts(
  stages: StageInputs,
  overrides: UserOverrides = {},
): MonthlyCostEstimate {
  const ctx = resolveBusinessContext(stages.categoryId);
  const categoryId = stages.categoryId;
  const expectedRevenue =
    stages.expectedMonthlyRevenueKrw ?? DEFAULT_EXPECTED_REVENUE_KRW[categoryId] ?? 20_000_000;

  // ── rent ──
  // 스타트업/온라인 업종은 기본적으로 사무실 임대료 X (재택·코워킹 가정).
  // 사용자가 명시적으로 overrides.rent 를 넣은 경우만 반영.
  // 참고: 음식점/소매/뷰티 등 오프라인 업종만 자동 추정.
  const isPlaceless = categoryId === "startup-tech" || categoryId === "online-digital";
  const rentDetail = !isPlaceless && stages.selectedDistrictId
    ? estimateMonthlyRent(stages.selectedDistrictId, categoryId, stages.customPyeong)
    : (!isPlaceless && stages.customPyeong
        ? estimateRentByPyeongOnly(stages.customPyeong, "mid")
        : null);

  const rentFromStage = rentDetail ? rentDetail.monthlyRentKrw + rentDetail.managementFeeKrw : 0;

  // ── labor ──
  // staffPlan 출처 구분:
  //   · stages.staffPlan 이 채워져 있으면 = HiringSetupStage 에서 사장이 직접 입력 → "stage-derived"
  //   · undefined 면 = 카테고리 평균치 폴백 → "industry-average" 라벨 (절대 "이전 단계 기반" 으로 위장 X)
  const userStaffPlan = stages.staffPlan;
  const staffPlan = userStaffPlan ?? getDefaultStaffPlan(categoryId);
  const laborDetail = calculateMonthlyTeamLaborCost(staffPlan);
  const laborFromStage = laborDetail.total;

  // ── ingredients (COGS) ──
  // 우선순위 (사용자 메시지 2026-05-04: "990만원은 누구 머리에서 나온거야?" — 카테고리 평균 ×
  //   default 매출을 "이전 단계 기반" 으로 위장하던 문제 수정):
  //   1) 사장이 vendor-setup 에서 입력한 월 원가 합계(ingredientsMonthlyKrw) → stage-derived
  //   2) 사장이 입력한 매출 대비 원가율(ingredientsCogsRate) × expectedRevenue → stage-derived
  //   3) 둘 다 없으면 업종 평균 × default 매출 → industry-average (정직한 라벨)
  const userIngredientsMonthly = stages.ingredientsMonthlyKrw;
  const userCogsRate = stages.ingredientsCogsRate;
  const cogsRate = userCogsRate ?? getCogsRate(ctx.expenseMode, categoryId);
  const ingredientsFromStage =
    userIngredientsMonthly != null
      ? Math.round(userIngredientsMonthly)
      : Math.round(expectedRevenue * cogsRate);
  const ingredientsUserProvided = userIngredientsMonthly != null || userCogsRate != null;

  // ── sga (운영 수수료) ──
  const sgaDetail = stages.operations
    ? estimateMonthlySgaFromOperations(stages.operations, expectedRevenue)
    : { total: 0, breakdown: [] as SgaBreakdownItem[] };
  let sgaFromStage = sgaDetail.total;
  // 프랜차이즈 로열티가 있으면 sga에 추가
  if (stages.franchise?.monthlyRoyaltyKrw) {
    sgaFromStage += stages.franchise.monthlyRoyaltyKrw;
    sgaDetail.breakdown.push({
      label: "프랜차이즈 로열티",
      amount: stages.franchise.monthlyRoyaltyKrw,
      type: "commission",
    });
  }

  // ── utilities · marketing · other ── 업종 평균 fallback
  const avgs = INDUSTRY_AVERAGE[categoryId] ?? INDUSTRY_AVERAGE.food;
  const utilitiesFromAvg = avgs.utilities ?? 0;
  const marketingFromAvg = avgs.marketing ?? 0;
  const otherFromAvg = avgs.other ?? 0;

  // ── interest ── 대출 있을 때만
  const interestFromStage = stages.loan?.amountKrw && stages.loan?.annualRatePercent
    ? calculateMonthlyInterest(stages.loan.amountKrw, stages.loan.annualRatePercent)
    : 0;

  // ── 최종 값 결정 (overrides > stage > fallback) ──
  const fields: MonthlyCostFields = {
    ingredients: overrides.ingredients ?? ingredientsFromStage,
    labor:       overrides.labor       ?? laborFromStage,
    rent:        overrides.rent        ?? rentFromStage,
    utilities:   overrides.utilities   ?? utilitiesFromAvg,
    sga:         overrides.sga         ?? sgaFromStage,
    marketing:   overrides.marketing   ?? marketingFromAvg,
    other:       overrides.other       ?? otherFromAvg,
    interest:    overrides.interest    ?? interestFromStage,
  };

  const sources: Record<keyof MonthlyCostFields, CostSource> = {
    ingredients: overrides.ingredients != null ? "user-input" : (ingredientsUserProvided ? "stage-derived" : "industry-average"),
    labor:       overrides.labor       != null ? "user-input" : (userStaffPlan ? "stage-derived" : "industry-average"),
    rent:        overrides.rent        != null ? "user-input" : (rentFromStage > 0 ? "stage-derived" : "insufficient-data"),
    utilities:   overrides.utilities   != null ? "user-input" : "industry-average",
    sga:         overrides.sga         != null ? "user-input" : (sgaFromStage > 0 ? "stage-derived" : "insufficient-data"),
    marketing:   overrides.marketing   != null ? "user-input" : "industry-average",
    other:       overrides.other       != null ? "user-input" : "industry-average",
    interest:    overrides.interest    != null ? "user-input" : (interestFromStage > 0 ? "stage-derived" : "insufficient-data"),
  };

  return {
    fields,
    sources,
    details: { rent: rentDetail, sga: sgaDetail, labor: laborDetail },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** 업종·비용 모드에 따른 COGS 비율 (매출 대비 %) */
function getCogsRate(expenseMode: string, categoryId: string): number {
  // expenseMode 기반 기본 원가율
  const byMode: Record<string, number> = {
    "food-cogs": 0.33,  // 외식업 식재료 + 포장재
    purchase:    0.55,  // 리테일 상품 매입
    supply:      0.18,  // 뷰티·펫 시술재료·소모품
    facility:    0.10,  // 피트니스·공간 시설유지
    content:     0.08,  // 교육 교재·콘텐츠
    infra:       0.15,  // 스타트업 서버·SaaS
    general:     0.20,  // 일반
  };
  return byMode[expenseMode] ?? 0.25;
}
