/**
 * 경영 건강 점수 SSOT — 한국 SMB 맞춤 0-100 합성 점수.
 *
 *  ── 출처 (2026-05-11 웹 조사) ───────────────────────────────────────
 *   · FinHealth Network: SMB 4-dim (Liquidity / Profitability / Solvency / Efficiency)
 *   · NetSuite: Top 15 SMB KPIs · current ratio · cash flow ratio · profit margin
 *   · Altman Z'-score (private SMB 변형): 미세기업은 *liquidity + profitability* 가 강한 폐업 예측 지표
 *   · Toast POS / Restaurant365: 외식 prime cost 55-65% 표준 + 운영자 일일 추적 권장
 *   · StockTitan: 6-dim composite + 3-yr 가중 평균 (변동 평활)
 *   · Phoenix Strategy: 성장기업 cash runway 7 metrics — 흑자부도 회피 핵심
 *  ────────────────────────────────────────────────────────────────────
 *
 *  ── build.up 의 SMB 맥락 (왜 기존 모델 그대로 못 쓰는가) ────────────
 *   1. SMB 는 균형재무 (자산·부채) 데이터 없음 → 표준 current ratio 적용 불가.
 *      대체: *런웨이 (현금 / 월 burn)* 가 SMB 의 사실상 유동성 지표.
 *   2. 한국 SMB 폐업 원인 1위 = 흑자부도 (장부 흑자인데 통장 비어있음).
 *      → *현금 안전성* 을 단일 dimension 으로 분리. 다른 차원보다 가중치 ↑.
 *   3. 외식: prime cost 가 dominant. 소매·뷰티는 마진. 온라인은 정산 risk.
 *      → 업종별 가중치 분기 + dimension 자체도 일부 X.
 *   4. 사장님 데이터 입력 빈도 / 신뢰도 = *score 자체의 신뢰도*. 데이터 빈약하면
 *      "unknown" 으로 빠지지 않고 "데이터 보강" 안내. 메타 정보로 노출.
 *  ────────────────────────────────────────────────────────────────────
 */

import { calculateCostRatios } from "./cost-ratios";

// ─── Tier 임계값 ──────────────────────────────────────────────────────
//   80+ : 건강 / 65-80 : 양호 / 45-65 : 주의 / 25-45 : 위험 / <25 : 긴급
//   기존 3-tier 와 호환 (healthy/caution/danger). 더 세밀한 5-tier 옵션 함께 제공.

export const HEALTH_SCORE_TIER = {
  HEALTHY_MIN: 70,    // 70+ = 건강 (UI 녹색 dot)
  CAUTION_MIN: 45,    // 45-70 = 주의 (UI 앰버 dot)
  // < 45 = 위험 (UI 레드 dot)
} as const;

/**
 * ⚠️ unified-health.ts 의 `HealthGrade` (4-tier: healthy/caution/warning/critical) 와
 *  *별개 type*. 본 score 는 SMB 종합 3-tier 등급 (healthy/caution/danger) + unknown.
 *  이름 충돌 방지: `HealthScoreGrade`.
 */
export type HealthScoreGrade = "healthy" | "caution" | "danger" | "unknown";

/**
 * ⚠️ unified-health.ts 의 `gradeFromScore` (4-tier) 와 별개. SMB 종합 3-tier 등급 매핑.
 */
export function gradeFromHealthScore(score: number): HealthScoreGrade {
  if (!Number.isFinite(score) || score < 0) return "unknown";
  if (score >= HEALTH_SCORE_TIER.HEALTHY_MIN) return "healthy";
  if (score >= HEALTH_SCORE_TIER.CAUTION_MIN) return "caution";
  return "danger";
}

// ─── 입력 ─────────────────────────────────────────────────────────────

export type HealthScoreInput = {
  /** 업종 카테고리 — 가중치 분기에 사용 */
  industryCategoryId?: string;
  /** dailyEntries.totalSales 합 (입력된 일수치). 매출 표본. */
  totalRevenue: number;
  /** dailyEntries.length — 입력 일수 */
  workingDays: number;
  /** 월 비용 (8개 항목 합) — ingredients/labor/rent/utilities/sga/marketing/other/interest */
  monthlyCosts: {
    ingredients?: number;
    labor?: number;
    rent?: number;
    utilities?: number;
    sga?: number;
    marketing?: number;
    other?: number;
    interest?: number;
  };
  /** 직원 등록 여부 — 4대보험·퇴직 burden 자동 가산 (prime-cost SSOT 와 정합) */
  hasEmployees: boolean;
  /** 통장 잔고 (원) — 런웨이 계산용. 0 또는 미입력이면 데이터 부족. */
  currentBalance?: number;
  /** 주간 매출 변화율 (%) — 최근 7일 vs 직전 7일 (insufficient 면 undefined) */
  weeklySalesChangePct?: number;
  /** 운영 시작일로부터 경과 일수 — 매출 입력률 계산 (workingDays / daysSinceLaunch) */
  daysSinceLaunch?: number;
  /** 사장님이 자본금 입력 (선택) — 안 입력해도 currentBalance 로 런웨이 계산 */
  initialCapital?: number;
};

// ─── 출력 ─────────────────────────────────────────────────────────────

export type DimensionScore = {
  /** dimension 식별자 */
  key: "cashSafety" | "profitability" | "costEfficiency" | "salesTrend" | "dataConfidence";
  /** 한국어 라벨 */
  labelKo: string;
  /** 영어 라벨 */
  labelEn: string;
  /** 0-100 점수 — 미산정 시 null */
  score: number | null;
  /** 가중치 (0-1) */
  weight: number;
  /** 차원별 해석 (예: "런웨이 4개월 — 주의") */
  reasonKo: string;
  reasonEn: string;
};

export type HealthScoreResult = {
  /** 종합 점수 (0-100) — 신뢰도 낮으면 null */
  score: number | null;
  /** 종합 등급 (UI dot 색) */
  grade: HealthScoreGrade;
  /** 차원별 분해 (radar chart 데이터 + 진단 라인 생성용) */
  dimensions: DimensionScore[];
  /** 점수의 *신뢰도* 자체 (0-100). 50 미만이면 UI 가 점수 옆 ⚠ 표시 권장. */
  confidence: number;
  /** 사용자가 입력해야 할 데이터 (점수 정밀도 향상) — UI 가 "데이터 보강" CTA 로 활용 */
  missingDataKo: string[];
  missingDataEn: string[];
};

// ─── 가중치 (업종별) ──────────────────────────────────────────────────
//   합 1.0. 외식·카페·서비스 다 미세 차이.
//   * 모든 업종에서 cashSafety 가 가장 큼 — 한국 SMB 폐업 1위 = 흑자부도.

type Weights = Record<DimensionScore["key"], number>;

function getWeights(categoryId?: string): Weights {
  const cat = (categoryId ?? "").toLowerCase();

  // 외식·카페·디저트 — prime cost 가 dominant → cost efficiency 가중치 ↑
  if (cat === "food" || cat === "cafe-dessert") {
    return {
      cashSafety: 0.30,
      profitability: 0.25,
      costEfficiency: 0.25,
      salesTrend: 0.10,
      dataConfidence: 0.10,
    };
  }
  // 온라인·이커머스 — 매출 성장 트렌드 가중치 ↑ (PG 정산 risk 별도)
  if (cat === "online-digital" || cat === "ecommerce") {
    return {
      cashSafety: 0.30,
      profitability: 0.20,
      costEfficiency: 0.15,
      salesTrend: 0.25,
      dataConfidence: 0.10,
    };
  }
  // 스타트업·SaaS — 런웨이 압도적, 매출 성장 비중 ↑
  if (cat === "startup-tech" || cat === "saas") {
    return {
      cashSafety: 0.40,
      profitability: 0.10,
      costEfficiency: 0.15,
      salesTrend: 0.25,
      dataConfidence: 0.10,
    };
  }
  // 소매·뷰티·펫·헬스·교육 등 일반
  return {
    cashSafety: 0.30,
    profitability: 0.25,
    costEfficiency: 0.20,
    salesTrend: 0.15,
    dataConfidence: 0.10,
  };
}

// ─── 차원별 산정 ──────────────────────────────────────────────────────

/** 1) 현금 안전성 — 런웨이 (개월) 기반.
 *  미입력 시 null (가중치 재분배).
 *  > 12개월 → 100  ·  6-12 → 75  ·  3-6 → 50  ·  1-3 → 25  ·  <1 → 0
 */
function scoreCashSafety(
  currentBalance: number | undefined,
  monthlyCostsTotal: number,
  monthlyRev: number,
): { score: number | null; reasonKo: string; reasonEn: string } {
  if (currentBalance == null || currentBalance <= 0) {
    return {
      score: null,
      reasonKo: "통장 잔고 미입력 — 런웨이 계산 불가",
      reasonEn: "No bank balance — runway unknown",
    };
  }
  if (monthlyCostsTotal <= 0) {
    return {
      score: 100,
      reasonKo: "월 비용 0 — 현금 압박 없음",
      reasonEn: "No monthly costs — no cash pressure",
    };
  }
  // 월 burn = 비용 - 매출. 흑자(매출>비용)면 burn 0 으로 간주 → 최대 점수.
  const monthlyBurn = Math.max(0, monthlyCostsTotal - monthlyRev);
  if (monthlyBurn === 0) {
    return {
      score: 100,
      reasonKo: "흑자 운영 — 현금 안전",
      reasonEn: "Profitable — cash safe",
    };
  }
  const runwayMonths = currentBalance / monthlyBurn;
  let score: number;
  if (runwayMonths >= 12) score = 100;
  else if (runwayMonths >= 6) score = 75 + ((runwayMonths - 6) / 6) * 25;
  else if (runwayMonths >= 3) score = 50 + ((runwayMonths - 3) / 3) * 25;
  else if (runwayMonths >= 1) score = 25 + ((runwayMonths - 1) / 2) * 25;
  else score = Math.max(0, runwayMonths * 25);
  const m = runwayMonths.toFixed(1);
  return {
    score: Math.round(score),
    reasonKo: `런웨이 ${m}개월 — ${runwayMonths >= 12 ? "매우 안전" : runwayMonths >= 6 ? "안전" : runwayMonths >= 3 ? "주의" : "위험"}`,
    reasonEn: `Runway ${m}mo — ${runwayMonths >= 12 ? "very safe" : runwayMonths >= 6 ? "safe" : runwayMonths >= 3 ? "watch" : "critical"}`,
  };
}

/** 2) 수익성 — 영업이익률 ((월매출 - 월비용) / 월매출). */
function scoreProfitability(
  monthlyRev: number,
  monthlyCostsTotal: number,
  ready: boolean,
): { score: number | null; reasonKo: string; reasonEn: string } {
  if (!ready || monthlyRev <= 0) {
    return { score: null, reasonKo: "매출 데이터 부족", reasonEn: "Insufficient sales data" };
  }
  const margin = ((monthlyRev - monthlyCostsTotal) / monthlyRev) * 100;
  let score: number;
  if (margin >= 15) score = 100;
  else if (margin >= 10) score = 80 + ((margin - 10) / 5) * 20;
  else if (margin >= 5) score = 60 + ((margin - 5) / 5) * 20;
  else if (margin >= 0) score = 40 + (margin / 5) * 20;
  else if (margin >= -10) score = 20 + ((margin + 10) / 10) * 20;
  else if (margin >= -25) score = (margin + 25) / 15 * 20;
  else score = 0;
  const pct = margin.toFixed(1);
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    reasonKo: `영업이익률 ${pct}% — ${margin >= 10 ? "우수" : margin >= 5 ? "양호" : margin >= 0 ? "보통" : "적자"}`,
    reasonEn: `Margin ${pct}% — ${margin >= 10 ? "excellent" : margin >= 5 ? "good" : margin >= 0 ? "ok" : "loss"}`,
  };
}

/** 3) 비용 효율성 — 외식: 프라임코스트 비율. 그 외: 총비용/매출 비율. */
function scoreCostEfficiency(
  monthlyRev: number,
  monthlyCosts: HealthScoreInput["monthlyCosts"],
  categoryId: string,
  hasEmployees: boolean,
  ready: boolean,
): { score: number | null; reasonKo: string; reasonEn: string } {
  if (!ready || monthlyRev <= 0) {
    return { score: null, reasonKo: "비용 비율 계산 불가", reasonEn: "Cost ratios unavailable" };
  }
  const cat = categoryId.toLowerCase();
  const isFoodService = cat === "food" || cat === "cafe-dessert";

  if (isFoodService) {
    // 외식: prime cost = 식자재 + 인건비 (burden 포함). 55-65% 적정.
    const ingredients = monthlyCosts.ingredients ?? 0;
    const labor = (monthlyCosts.labor ?? 0) * (hasEmployees ? 1.185 : 1); // 4대보험·퇴직 가산
    const primeRate = ((ingredients + labor) / monthlyRev) * 100;
    let score: number;
    if (primeRate <= 55) score = 100;
    else if (primeRate <= 60) score = 85 + ((60 - primeRate) / 5) * 15;
    else if (primeRate <= 65) score = 65 + ((65 - primeRate) / 5) * 20;
    else if (primeRate <= 70) score = 40 + ((70 - primeRate) / 5) * 25;
    else if (primeRate <= 80) score = 15 + ((80 - primeRate) / 10) * 25;
    else score = 0;
    return {
      score: Math.round(Math.max(0, Math.min(100, score))),
      reasonKo: `프라임코스트 ${primeRate.toFixed(1)}% — ${primeRate <= 60 ? "우수" : primeRate <= 65 ? "적정" : primeRate <= 70 ? "주의" : "위험"}`,
      reasonEn: `Prime cost ${primeRate.toFixed(1)}% — ${primeRate <= 60 ? "excellent" : primeRate <= 65 ? "ok" : primeRate <= 70 ? "watch" : "critical"}`,
    };
  }

  // 비외식: 총 비용 / 매출. 80% 이하 우수, 100% 초과 적자.
  const total = Object.values(monthlyCosts).reduce(
    (s, v) => s + (typeof v === "number" ? v : 0),
    0,
  );
  const costRate = (total / monthlyRev) * 100;
  let score: number;
  if (costRate <= 70) score = 100;
  else if (costRate <= 85) score = 70 + ((85 - costRate) / 15) * 30;
  else if (costRate <= 100) score = 40 + ((100 - costRate) / 15) * 30;
  else if (costRate <= 130) score = ((130 - costRate) / 30) * 40;
  else score = 0;
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    reasonKo: `비용/매출 ${costRate.toFixed(1)}% — ${costRate <= 80 ? "효율" : costRate <= 100 ? "주의" : "적자"}`,
    reasonEn: `Cost/sales ${costRate.toFixed(1)}% — ${costRate <= 80 ? "efficient" : costRate <= 100 ? "watch" : "loss"}`,
  };
}

/** 4) 매출 추세 — 주간 변화율 기반. insufficient 면 null. */
function scoreSalesTrend(
  weeklyChangePct: number | undefined,
): { score: number | null; reasonKo: string; reasonEn: string } {
  if (weeklyChangePct == null || !Number.isFinite(weeklyChangePct)) {
    return {
      score: null,
      reasonKo: "주간 매출 비교 데이터 부족 (14일+ 필요)",
      reasonEn: "Not enough data for weekly trend (need 14+ days)",
    };
  }
  let score: number;
  if (weeklyChangePct >= 15) score = 100;
  else if (weeklyChangePct >= 5) score = 75 + ((weeklyChangePct - 5) / 10) * 25;
  else if (weeklyChangePct >= -5) score = 50 + ((weeklyChangePct + 5) / 10) * 25;
  else if (weeklyChangePct >= -15) score = 25 + ((weeklyChangePct + 15) / 10) * 25;
  else if (weeklyChangePct >= -30) score = ((weeklyChangePct + 30) / 15) * 25;
  else score = 0;
  const dir = weeklyChangePct >= 5 ? "↑" : weeklyChangePct <= -5 ? "↓" : "→";
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    reasonKo: `주간 매출 ${dir} ${weeklyChangePct >= 0 ? "+" : ""}${weeklyChangePct.toFixed(0)}%`,
    reasonEn: `Weekly sales ${dir} ${weeklyChangePct >= 0 ? "+" : ""}${weeklyChangePct.toFixed(0)}%`,
  };
}

/** 5) 데이터 신뢰도 — 매출 입력률·기간. 모델 자체의 신뢰도. */
function scoreDataConfidence(
  workingDays: number,
  daysSinceLaunch: number | undefined,
  hasBalance: boolean,
  hasCosts: boolean,
): { score: number; reasonKo: string; reasonEn: string } {
  // 30일 기준 최대. days 가 30 넘으면 100, 그 미만은 비례.
  const inputRate = Math.min(1, workingDays / 30);
  // 입력률 × 80 + (잔고 입력 보너스 +10) + (비용 입력 보너스 +10)
  let score = inputRate * 80;
  if (hasBalance) score += 10;
  if (hasCosts) score += 10;
  const inputRatePct = Math.round(inputRate * 100);
  const reasonKo = workingDays < 7
    ? `매출 입력 ${workingDays}일치 — 신뢰도 매우 낮음 (7일+ 권장)`
    : workingDays < 14
      ? `매출 ${workingDays}일치 — 신뢰도 보통 (14일+ 시 안정)`
      : `매출 입력률 ${inputRatePct}%${hasBalance ? " · 잔고 ✓" : " · 잔고 ✗"}${hasCosts ? " · 비용 ✓" : " · 비용 ✗"}`;
  const reasonEn = workingDays < 7
    ? `${workingDays} sales days — very low confidence`
    : workingDays < 14
      ? `${workingDays} sales days — moderate confidence`
      : `Input rate ${inputRatePct}%${hasBalance ? " · balance ✓" : ""}${hasCosts ? " · costs ✓" : ""}`;
  return {
    score: Math.round(Math.min(100, score)),
    reasonKo,
    reasonEn,
  };
}

// ─── 메인 ─────────────────────────────────────────────────────────────

/**
 * 종합 건강 점수 계산.
 *
 *  알고리즘:
 *   1. 5개 차원 점수 산정 (각 null 가능)
 *   2. null 차원은 *가중치 재분배* (다른 차원 가중치 비례 분배). 점수가 거짓 폭주 안 함.
 *   3. 가중평균 → 종합 점수 (0-100)
 *   4. 종합 신뢰도 = 데이터 신뢰도 차원의 점수 (모델 자체 신뢰도)
 *   5. score 가 너무 적은 차원 (≤ 1 개 산정 가능) 일 때 종합 점수 null 반환
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const weights = getWeights(input.industryCategoryId);
  const categoryId = input.industryCategoryId ?? "";

  // 비용 합계 + ratios 신뢰도 (cost-ratios SSOT)
  const monthlyCostsTotal = Object.values(input.monthlyCosts).reduce(
    (s, v) => s + (typeof v === "number" ? v : 0),
    0,
  );
  const ratios = calculateCostRatios({
    costs: {
      ingredients: input.monthlyCosts.ingredients ?? 0,
      labor: input.monthlyCosts.labor ?? 0,
      rent: input.monthlyCosts.rent ?? 0,
      utilities: input.monthlyCosts.utilities ?? 0,
      sga: input.monthlyCosts.sga ?? 0,
      marketing: input.monthlyCosts.marketing ?? 0,
      other: input.monthlyCosts.other ?? 0,
    },
    totalRevenue: input.totalRevenue,
    days: input.workingDays,
  });
  const monthlyRev = ratios.monthlyRevenueEquivalent;

  // 차원별 산정
  const cashSafety = scoreCashSafety(input.currentBalance, monthlyCostsTotal, monthlyRev);
  const profitability = scoreProfitability(monthlyRev, monthlyCostsTotal, ratios.ready);
  const costEfficiency = scoreCostEfficiency(
    monthlyRev, input.monthlyCosts, categoryId, input.hasEmployees, ratios.ready,
  );
  const salesTrend = scoreSalesTrend(input.weeklySalesChangePct);
  const dataConfidence = scoreDataConfidence(
    input.workingDays,
    input.daysSinceLaunch,
    (input.currentBalance ?? 0) > 0,
    monthlyCostsTotal > 0,
  );

  const dimensions: DimensionScore[] = [
    {
      key: "cashSafety",
      labelKo: "현금 안전성",
      labelEn: "Cash Safety",
      score: cashSafety.score,
      weight: weights.cashSafety,
      reasonKo: cashSafety.reasonKo,
      reasonEn: cashSafety.reasonEn,
    },
    {
      key: "profitability",
      labelKo: "수익성",
      labelEn: "Profitability",
      score: profitability.score,
      weight: weights.profitability,
      reasonKo: profitability.reasonKo,
      reasonEn: profitability.reasonEn,
    },
    {
      key: "costEfficiency",
      labelKo: "비용 효율",
      labelEn: "Cost Efficiency",
      score: costEfficiency.score,
      weight: weights.costEfficiency,
      reasonKo: costEfficiency.reasonKo,
      reasonEn: costEfficiency.reasonEn,
    },
    {
      key: "salesTrend",
      labelKo: "매출 추세",
      labelEn: "Sales Trend",
      score: salesTrend.score,
      weight: weights.salesTrend,
      reasonKo: salesTrend.reasonKo,
      reasonEn: salesTrend.reasonEn,
    },
    {
      key: "dataConfidence",
      labelKo: "데이터 신뢰도",
      labelEn: "Data Confidence",
      score: dataConfidence.score,
      weight: weights.dataConfidence,
      reasonKo: dataConfidence.reasonKo,
      reasonEn: dataConfidence.reasonEn,
    },
  ];

  // null 차원 가중치 재분배 — 합 1.0 유지
  const validDims = dimensions.filter((d) => d.score != null);
  const nullWeightSum = dimensions
    .filter((d) => d.score == null)
    .reduce((s, d) => s + d.weight, 0);
  const totalValidWeight = validDims.reduce((s, d) => s + d.weight, 0);

  // 데이터 너무 부족 (점수 산정 가능 차원이 dataConfidence 외 0-1 개) → score null
  const scoringDimsExcludingConfidence = validDims.filter((d) => d.key !== "dataConfidence").length;
  if (scoringDimsExcludingConfidence === 0 || totalValidWeight === 0) {
    return {
      score: null,
      grade: "unknown",
      dimensions,
      confidence: dataConfidence.score,
      missingDataKo: buildMissingData(input, monthlyCostsTotal, "ko"),
      missingDataEn: buildMissingData(input, monthlyCostsTotal, "en"),
    };
  }

  // 가중평균 (null 차원 가중치를 valid 차원에 비례 재분배)
  const composite = validDims.reduce((sum, d) => {
    const redistributedWeight = d.weight + (nullWeightSum * d.weight) / totalValidWeight;
    return sum + (d.score ?? 0) * redistributedWeight;
  }, 0);
  const score = Math.round(Math.max(0, Math.min(100, composite)));

  return {
    score,
    grade: gradeFromHealthScore(score),
    dimensions,
    confidence: dataConfidence.score,
    missingDataKo: buildMissingData(input, monthlyCostsTotal, "ko"),
    missingDataEn: buildMissingData(input, monthlyCostsTotal, "en"),
  };
}

/** UI 가 사장님께 보여줄 "데이터 보강" 안내 리스트 */
function buildMissingData(
  input: HealthScoreInput,
  monthlyCostsTotal: number,
  lang: "ko" | "en",
): string[] {
  const items: string[] = [];
  if (input.workingDays < 14) {
    items.push(lang === "ko"
      ? `매출 ${14 - input.workingDays}일 더 입력하면 추세 분석 가능`
      : `Log ${14 - input.workingDays} more sales days for trend analysis`);
  }
  if ((input.currentBalance ?? 0) <= 0) {
    items.push(lang === "ko"
      ? "통장 잔고 입력 (현금흐름 설정) — 런웨이 계산"
      : "Enter bank balance (cashflow setup) — runway calc");
  }
  if (monthlyCostsTotal <= 0) {
    items.push(lang === "ko"
      ? "월 비용 입력 (식자재·인건비·임대료 등) — 손익 분석"
      : "Enter monthly costs — P&L analysis");
  }
  return items.slice(0, 3);
}
