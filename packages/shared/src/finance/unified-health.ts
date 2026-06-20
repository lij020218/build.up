/**
 * unified-health.ts — 사업 건강도 점수 산정 단일 진실의 출처 (SSOT)
 *
 * ─── 학술·실무 근거 ──────────────────────────────────────────────────────
 * 본 모듈은 임의 magic number 대신 다음 표준을 결합한 합성 지표를 산출합니다.
 *
 * 1) OECD/JRC Handbook on Composite Indicators (2008) — 정규화·가중치·집계 표준
 * 2) CFA Institute 5대 비율 (수익성·유동성·효율성·지급능력·성장성)
 * 3) Altman Z''-Score (1995, 비제조·신흥시장 변형) — 비상장 SMB 적용
 * 4) Piotroski F-Score (2000) — 9개 binary 펀더멘털 지표
 * 5) David Sacks Burn Multiple — 스타트업 효율성
 * 6) Paul Graham "Default Alive vs Dead" (2015) — 자가 진단 기준
 * 7) 한국은행 금융안정보고서 — 한계기업(이자보상배율 <1) / 취약차주 / LTI
 * 8) 한국농촌경제연구원(KREI) 2024 외식업체 경영실태조사 (식자재 40.7%, 인건비 33.9%, 임차료 8.4%, 영업이익률 8.7%)
 * 9) FICO 5단계 + Bell curve ±0.7σ → 4단계 컷오프 (75/55/35)
 *
 * ─── 4영역 가중합 구조 ──────────────────────────────────────────────────
 * Score(0~100) = w_C·Cash + w_P·Profitability + w_E·Efficiency + w_G·Growth
 *
 * 업종별 기본 가중치 (사업 단계로 미세 보정):
 *   restaurant 40/30/15/15  | retail 35/25/25/15
 *   service    30/30/20/20  | saas   40/15/25/20
 *   general    35/30/20/15
 *
 * ─── 데이터 부족 처리 ──────────────────────────────────────────────────
 * 추정/imputation 으로 가짜 점수를 만들지 않는다.
 * 한 영역 전체 결측 → 그 영역 가중치 = 0, 나머지 가중치 재정규화.
 * 결측 영역이 있을 때 grade = "unknown".
 *
 * 한 곳에서만 임계값을 변경하면 시스템 전체가 일관되게 반영됩니다.
 * (대시보드 카드, AI 프롬프트, 알림, 라이프사이클 트리거 모두)
 */

import type { DailyEntry, MonthlyCosts } from "./dashboard";
import { calculateMonthlyPnL, normalizeCosts } from "./dashboard";
import { calculateBreakEven, calculateCostRatios } from "./cost-ratios";

// ════════════════════════════════════════════════════════════════════════
// 1. 등급·색상 (모든 시스템 단일화)
// ════════════════════════════════════════════════════════════════════════

export type HealthGrade = "healthy" | "caution" | "warning" | "critical" | "unknown";

/**
 * 4단계 등급 컷오프 (FICO 5단계 + Bell curve ±0.7σ 기반)
 *  healthy  ≥75 (p75+, 상위 15.9%)
 *  caution  55-74 (중간 상위)
 *  warning  35-54 (중간 하위)
 *  critical <35 (하위 15.9%)
 */
export const SCORE_CUTOFFS = {
  healthy: 75,
  caution: 55,
  warning: 35,
  // critical = anything below warning
} as const;

/**
 * 단일 점수 → 등급 매핑 (전 시스템에서 이 함수만 사용)
 */
export function gradeFromScore(score: number): HealthGrade {
  if (!Number.isFinite(score)) return "unknown";
  if (score >= SCORE_CUTOFFS.healthy) return "healthy";
  if (score >= SCORE_CUTOFFS.caution) return "caution";
  if (score >= SCORE_CUTOFFS.warning) return "warning";
  return "critical";
}

/**
 * 통일 색상 팔레트 (Tailwind v3 base + WCAG 대비 검증)
 *  - 모든 컴포넌트(HealthSignal, CostCompositionDonutCard, PLHeroCard, CashflowHeroCard)
 *    이 동일한 색상을 참조해야 함.
 *  - dot 은 진한 색, bg 는 옅은 그라디언트, text 는 다크 톤.
 */
export const HEALTH_COLORS: Record<HealthGrade, {
  bg: string;       // 배지 배경 (gradient or rgba)
  border: string;   // 테두리
  text: string;     // 라벨 텍스트
  dot: string;      // 점/슬라이스 채움
  glow: string;     // 펄스/그림자
}> = {
  // ⚠️ 신호등 컬러(빨강/노랑/초록) 금지 — 메모리 디자인 원칙.
  //   healthy→warning 은 미드나잇 네이비(#191970) 농담(옅음=양호, 짙음=위험)으로 정도를 표현하고,
  //   "긴급(critical)" 1단계에서만 차분한 벽돌 danger(#b64c4c)로 경고. 색만으로 구분하지 말고
  //   라벨(건강/주의/위험/긴급)·아이콘을 항상 동반할 것(색각 접근성).
  healthy: {
    bg: "linear-gradient(135deg, rgba(25,25,112,0.05), rgba(25,25,112,0.02))",
    border: "rgba(25,25,112,0.14)",
    text: "#1d3557",                 // midnight-ink (가독성)
    dot: "rgba(25,25,112,0.38)",     // 옅은 네이비 = 양호
    glow: "rgba(25,25,112,0.18)",
  },
  caution: {
    bg: "linear-gradient(135deg, rgba(25,25,112,0.07), rgba(25,25,112,0.03))",
    border: "rgba(25,25,112,0.18)",
    text: "#1d3557",
    dot: "rgba(25,25,112,0.58)",     // 중간 네이비
    glow: "rgba(25,25,112,0.26)",
  },
  warning: {
    bg: "linear-gradient(135deg, rgba(25,25,112,0.10), rgba(25,25,112,0.04))",
    border: "rgba(25,25,112,0.24)",
    text: "#191970",                 // midnight 풀톤
    dot: "rgba(25,25,112,0.85)",     // 짙은 네이비 = 위험 임박
    glow: "rgba(25,25,112,0.34)",
  },
  critical: {
    bg: "linear-gradient(135deg, rgba(182,76,76,0.10), rgba(182,76,76,0.04))",
    border: "rgba(182,76,76,0.32)",
    text: "#b64c4c",                 // 위험 1색 (--danger 벽돌)
    dot: "#b64c4c",
    glow: "rgba(182,76,76,0.45)",
  },
  unknown: {
    bg: "rgba(15,23,42,0.03)",
    border: "rgba(15,23,42,0.05)",
    text: "rgba(15,23,42,0.5)",
    dot: "rgba(15,23,42,0.2)",
    glow: "rgba(15,23,42,0.15)",
  },
};

export const HEALTH_LABEL_KO: Record<HealthGrade, string> = {
  healthy: "건강",
  caution: "주의",
  warning: "위험",
  critical: "긴급",
  unknown: "분석 준비 중",
};
export const HEALTH_LABEL_EN: Record<HealthGrade, string> = {
  healthy: "Healthy",
  caution: "Caution",
  warning: "Warning",
  critical: "Critical",
  unknown: "Analyzing",
};

// ════════════════════════════════════════════════════════════════════════
// 2. KPI 임계값 — 한국 시장 데이터 기반 (출처 명시)
// ════════════════════════════════════════════════════════════════════════

/**
 * KPI 임계값 단위 규약:
 *  - 모든 비율은 "% (백분율)" — primeCost: 65 = 65%
 *  - "lowerIsBetter" 가 true 면 작을수록 건강 (비용 비율 등)
 *  - "higherIsBetter" 가 true 면 클수록 건강 (마진, 런웨이 등)
 *
 * threshold 의미:
 *  - lowerIsBetter:  value <= healthy → healthy / <= caution → caution / <= warning → warning / else → critical
 *  - higherIsBetter: value >= healthy → healthy / >= caution → caution / >= warning → warning / else → critical
 */
export type KpiThreshold = {
  healthy: number;
  caution: number;
  warning: number;
  unit: "percent" | "months" | "ratio" | "currency_krw" | "count";
  direction: "lowerIsBetter" | "higherIsBetter";
  source: string; // 출처 (감사 가능성)
};

export type IndustryGroup =
  | "restaurant"      // 외식업 (한식·일식·양식·분식·주점)
  | "cafe"            // 카페·베이커리·디저트
  | "retail"          // 소매업 (편의점·의류·생활용품)
  | "ecommerce"       // 온라인 쇼핑몰
  | "beauty"          // 미용·헤어살롱 (디자이너 커미션 구조로 인건비 비중 높음 — service 와 별도)
  | "service"         // 필라테스·학원·세탁 등 일반 대인 서비스
  | "saas"            // SaaS·소프트웨어·플랫폼
  | "general";        // 분류 미지정 (보수적 기본값)

/**
 * 업종별 비용 비율 임계값 (KREI 2024 외식업체 경영실태조사 + 업계 표준)
 *
 * 외식업 평균 (2024): 식재료 40.7-44.5%, 인건비 33.9%, 임차료 8.4%, 영업이익률 8.7%
 *  → 한국 외식업 현실은 "글로벌 황금률 65%"를 이미 초과한 수준.
 *  → 그래도 학술 표준대로 65% 를 healthy 컷오프로 유지 (목표선).
 */
export const COST_RATIO_THRESHOLDS: Record<
  IndustryGroup,
  Partial<Record<"ingredients" | "labor" | "primeCost" | "rent" | "marketing" | "delivery", KpiThreshold>>
> = {
  restaurant: {
    ingredients: { healthy: 35, caution: 40, warning: 45, unit: "percent", direction: "lowerIsBetter",
      source: "KREI 2024 외식업체 경영실태조사 (평균 40.7%)" },
    labor:       { healthy: 25, caution: 33, warning: 40, unit: "percent", direction: "lowerIsBetter",
      source: "KREI 2024 외식업체 경영실태조사 (평균 33.9%)" },
    primeCost:   { healthy: 65, caution: 70, warning: 75, unit: "percent", direction: "lowerIsBetter",
      source: "한국외식산업경영연구원 / Toast POS 황금률 65%" },
    rent:        { healthy: 8,  caution: 12, warning: 15, unit: "percent", direction: "lowerIsBetter",
      source: "KREI 2024 (평균 8.4%) / Paytronix 5-15%" },
    marketing:   { healthy: 5,  caution: 8,  warning: 12, unit: "percent", direction: "lowerIsBetter",
      source: "외식업 표준 5-8%" },
    delivery:    { healthy: 17, caution: 22, warning: 27, unit: "percent", direction: "lowerIsBetter",
      source: "공정위 2024 분석 (배달앱 총수수료 16.9-29.3%)" },
  },
  cafe: {
    ingredients: { healthy: 30, caution: 35, warning: 40, unit: "percent", direction: "lowerIsBetter",
      source: "카페 평균 25-35% (KB자영업분석)" },
    labor:       { healthy: 22, caution: 28, warning: 35, unit: "percent", direction: "lowerIsBetter",
      source: "카페 인건비 20-28%" },
    primeCost:   { healthy: 60, caution: 65, warning: 72, unit: "percent", direction: "lowerIsBetter",
      source: "카페 황금률 (외식보다 5%p 낮게)" },
    rent:        { healthy: 10, caution: 15, warning: 20, unit: "percent", direction: "lowerIsBetter",
      source: "카페 임차료 10-18%" },
  },
  retail: {
    ingredients: { healthy: 65, caution: 70, warning: 75, unit: "percent", direction: "lowerIsBetter",
      source: "소매 매입원가 50-65% (편의점 평균 ~75%)" },
    labor:       { healthy: 12, caution: 18, warning: 25, unit: "percent", direction: "lowerIsBetter",
      source: "소매업 인건비 10-20% (Glasswallet)" },
    rent:        { healthy: 8,  caution: 12, warning: 18, unit: "percent", direction: "lowerIsBetter",
      source: "소매업 임차료 8-15%" },
  },
  ecommerce: {
    ingredients: { healthy: 50, caution: 60, warning: 70, unit: "percent", direction: "lowerIsBetter",
      source: "이커머스 매입원가 (KPMG 2024)" },
    marketing:   { healthy: 12, caution: 18, warning: 25, unit: "percent", direction: "lowerIsBetter",
      source: "이커머스 광고비 (의류 카테고리 ROAS 1000% 기준)" },
  },
  beauty: {
    // 미용실은 디자이너 커미션(수익배분 ~30%/인 + 기본급) 구조라 일반 서비스업보다 인건비 비중이 구조적으로 높다.
    labor:       { healthy: 45, caution: 55, warning: 65, unit: "percent", direction: "lowerIsBetter",
      source: "미용 디자이너 커미션 구조 (인건비 45-55%, 수익배분 ~30%/인)" },
    rent:        { healthy: 12, caution: 18, warning: 25, unit: "percent", direction: "lowerIsBetter",
      source: "미용실 임차료 표준" },
  },
  service: {
    labor:       { healthy: 35, caution: 45, warning: 55, unit: "percent", direction: "lowerIsBetter",
      source: "서비스업 인건비 30-50% (Glasswallet)" },
    rent:        { healthy: 12, caution: 18, warning: 25, unit: "percent", direction: "lowerIsBetter",
      source: "서비스업 표준" },
  },
  saas: {
    ingredients: { healthy: 25, caution: 35, warning: 45, unit: "percent", direction: "lowerIsBetter",
      source: "SaaS COGS (호스팅·CDN·CS) — Gross Margin 75%+ 목표" },
    labor:       { healthy: 50, caution: 60, warning: 70, unit: "percent", direction: "lowerIsBetter",
      source: "SaaS 인건비 50-70% (a16z)" },
  },
  general: {
    ingredients: { healthy: 40, caution: 50, warning: 60, unit: "percent", direction: "lowerIsBetter",
      source: "보수적 기본값 (업종 미지정)" },
    labor:       { healthy: 30, caution: 40, warning: 50, unit: "percent", direction: "lowerIsBetter",
      source: "보수적 기본값" },
    primeCost:   { healthy: 65, caution: 72, warning: 80, unit: "percent", direction: "lowerIsBetter",
      source: "보수적 기본값" },
    rent:        { healthy: 10, caution: 15, warning: 20, unit: "percent", direction: "lowerIsBetter",
      source: "보수적 기본값" },
  },
};

/**
 * 공통 위기 신호 (전 업종) — 한국은행·CFA·a16z·Sacks·YC 표준
 */
export const COMMON_THRESHOLDS = {
  // 영업이익률 % (CFA + KREI 2024 평균 8.7%)
  operatingMargin: {
    healthy: 10, caution: 5, warning: 0,
    unit: "percent" as const, direction: "higherIsBetter" as const,
    source: "KREI 2024 외식업 평균 8.7% / CFA Operating Margin",
  },
  // 매출총이익률 %
  grossMargin: {
    healthy: 50, caution: 35, warning: 20,
    unit: "percent" as const, direction: "higherIsBetter" as const,
    source: "CFA / 외식 60%·소매 40%·SaaS 75% 평균",
  },
  // 현금 런웨이 (개월) — 한국 VC 권장 (ZUZU, Pre-seed 18-24개월)
  runwayMonths: {
    healthy: 18, caution: 12, warning: 6,
    unit: "months" as const, direction: "higherIsBetter" as const,
    source: "한국 VC 권장 (ZUZU·클로브) Pre-seed 18-24개월 / Series A 21개월",
  },
  // 이자보상배율 (한국은행 한계기업 정의: <1)
  interestCoverage: {
    healthy: 3, caution: 1.5, warning: 1,
    unit: "ratio" as const, direction: "higherIsBetter" as const,
    source: "한국은행 한계기업 정의 (3년 연속 <1)",
  },
  // 매출 추세 % (전월 대비, 자영업자 평균 -12.8% 감소)
  salesGrowthMoM: {
    healthy: 0, caution: -5, warning: -15,
    unit: "percent" as const, direction: "higherIsBetter" as const,
    source: "자영업자 평균 매출 감소 -12.8% (2024)",
  },
  // 손익분기 달성률 (월 기록일 중 BEP 초과일 비율 %)
  breakEvenRatio: {
    healthy: 70, caution: 50, warning: 30,
    unit: "percent" as const, direction: "higherIsBetter" as const,
    source: "외식업 일평균 매출 표준 / BEP 도달 빈도",
  },
} satisfies Record<string, KpiThreshold>;

// ════════════════════════════════════════════════════════════════════════
// 3. 단일 KPI → 등급 매핑 (모든 인라인 dot 이 사용)
// ════════════════════════════════════════════════════════════════════════

/**
 * KPI 값 + 임계값 → 등급
 *
 * 예) gradeKpi(68, COST_RATIO_THRESHOLDS.restaurant.primeCost!) → "caution"
 *     (외식업 프라임코스트 65 healthy / 70 caution / 75 warning / >75 critical)
 */
export function gradeKpi(value: number, t: KpiThreshold): HealthGrade {
  if (!Number.isFinite(value)) return "unknown";
  const { healthy, caution, warning, direction } = t;
  if (direction === "higherIsBetter") {
    if (value >= healthy) return "healthy";
    if (value >= caution) return "caution";
    if (value >= warning) return "warning";
    return "critical";
  }
  // lowerIsBetter
  if (value <= healthy) return "healthy";
  if (value <= caution) return "caution";
  if (value <= warning) return "warning";
  return "critical";
}

/**
 * KPI 값 → 0~100 점수 (영역 점수 계산용 정규화)
 *
 * 4단계를 [100, 75, 50, 25, 0] 앵커로 보고 선형 보간.
 * (학술적으로는 percentile 정규화가 이상적이나, 자체 사용자 표본이 충분히 쌓일 때까지는
 *  앵커-보간이 OECD/JRC handbook 의 "min-max with reference points" 와 동치)
 */
export function scoreKpi(value: number, t: KpiThreshold): number {
  if (!Number.isFinite(value)) return NaN;
  const { healthy, caution, warning, direction } = t;
  // 임계값 정렬 — direction 에 따라 단조 증가/감소
  const better = direction === "higherIsBetter" ? value : -value;
  const h = direction === "higherIsBetter" ? healthy : -healthy;
  const c = direction === "higherIsBetter" ? caution : -caution;
  const w = direction === "higherIsBetter" ? warning : -warning;
  // 앵커: better >= h → 100  / >= c → 75  / >= w → 50  / 그 이하 → 25 ~ 0
  if (better >= h) return 100;
  if (better >= c) return 75 + ((better - c) / (h - c)) * 25;
  if (better >= w) return 50 + ((better - w) / (c - w)) * 25;
  // critical 영역 — w 이하: w~(w-extra) 구간을 50→0 으로 더 떨어뜨림
  const extra = Math.abs(c - w); // critical 폭은 caution-warning 폭과 동일하다고 가정
  if (better >= w - extra) return Math.max(0, 25 + ((better - (w - extra)) / extra) * 25);
  return 0;
}

// ════════════════════════════════════════════════════════════════════════
// 4. 영역별 점수 (Cash / Profit / Efficiency / Growth)
// ════════════════════════════════════════════════════════════════════════

export type DomainScore = {
  score: number;            // 0~100 (NaN if missing)
  grade: HealthGrade;
  components: Array<{       // 각 KPI 의 점수와 가중치
    name: string;
    value: number;
    score: number;
    weight: number;
    grade: HealthGrade;
  }>;
  missingCount: number;     // 결측 KPI 수
  totalCount: number;
};

export type DomainKey = "cash" | "profit" | "efficiency" | "growth";

/**
 * 영역 점수 = sum(KPI 점수 × 가중치) / sum(가중치)
 * 결측(NaN) 인 KPI 는 가중치 0 처리.
 * 가용 KPI 가 50% 미만이면 영역 score=NaN, grade="unknown".
 */
function aggregateDomain(name: string, components: Array<{
  name: string; value: number; score: number; weight: number;
}>): DomainScore {
  const valid = components.filter((c) => Number.isFinite(c.score));
  const total = components.length;
  if (total === 0 || valid.length / total < 0.5) {
    return {
      score: NaN, grade: "unknown",
      components: components.map((c) => ({ ...c, grade: "unknown" })),
      missingCount: total - valid.length, totalCount: total,
    };
  }
  const wSum = valid.reduce((s, c) => s + c.weight, 0);
  const score = wSum > 0
    ? valid.reduce((s, c) => s + c.score * c.weight, 0) / wSum
    : NaN;
  return {
    score: Math.round(score * 10) / 10,
    grade: gradeFromScore(score),
    components: components.map((c) => ({
      ...c,
      grade: Number.isFinite(c.score) ? gradeFromScore(c.score) : "unknown",
    })),
    missingCount: total - valid.length,
    totalCount: total,
  };
}

// ── (A) Cash 영역 ──
//   런웨이 (50%) + 이자보상배율 (30%) + Quick Ratio 대용으로 영업현금흐름/총비용 (20%)
function scoreDomainCash(input: {
  runwayMonths: number | null;
  interestCoverage: number | null;
  cashOpsRatio: number | null; // 영업현금흐름/월총비용 (Quick Ratio 대용)
}): DomainScore {
  const runwayScore = input.runwayMonths != null
    ? scoreKpi(input.runwayMonths, COMMON_THRESHOLDS.runwayMonths)
    : NaN;
  const icScore = input.interestCoverage != null
    ? scoreKpi(input.interestCoverage, COMMON_THRESHOLDS.interestCoverage)
    : NaN;
  // 영업현금흐름/총비용 임계값 (>=1.5 healthy / 1.0 caution / 0.5 warning)
  const cashOpsScore = input.cashOpsRatio != null
    ? scoreKpi(input.cashOpsRatio, {
        healthy: 1.5, caution: 1.0, warning: 0.5,
        unit: "ratio", direction: "higherIsBetter",
        source: "Quick Ratio 대용 (영업현금흐름/월총비용)",
      })
    : NaN;
  return aggregateDomain("cash", [
    { name: "현금 런웨이", value: input.runwayMonths ?? NaN, score: runwayScore, weight: 0.5 },
    { name: "이자보상배율", value: input.interestCoverage ?? NaN, score: icScore, weight: 0.3 },
    { name: "현금흐름 비율", value: input.cashOpsRatio ?? NaN, score: cashOpsScore, weight: 0.2 },
  ]);
}

// ── (B) Profitability 영역 ──
//   영업이익률 (40%) + 매출총이익률 (30%) + 프라임코스트(외식)/마진(소매) (30%)
function scoreDomainProfit(input: {
  operatingMargin: number | null;
  grossMargin: number | null;
  primeCostRatio: number | null;
  industry: IndustryGroup;
}): DomainScore {
  const opScore = input.operatingMargin != null
    ? scoreKpi(input.operatingMargin, COMMON_THRESHOLDS.operatingMargin)
    : NaN;
  const gmScore = input.grossMargin != null
    ? scoreKpi(input.grossMargin, COMMON_THRESHOLDS.grossMargin)
    : NaN;

  // 외식·카페만 프라임코스트 적용. 그 외 업종은 grossMargin 가중치 흡수.
  const isFoodLike = input.industry === "restaurant" || input.industry === "cafe";
  const pcThreshold = isFoodLike
    ? COST_RATIO_THRESHOLDS[input.industry]?.primeCost
    : undefined;
  const pcScore = (isFoodLike && input.primeCostRatio != null && pcThreshold)
    ? scoreKpi(input.primeCostRatio, pcThreshold)
    : NaN;

  return aggregateDomain("profit", [
    { name: "영업이익률", value: input.operatingMargin ?? NaN, score: opScore, weight: 0.40 },
    { name: "매출총이익률", value: input.grossMargin ?? NaN, score: gmScore, weight: isFoodLike ? 0.30 : 0.60 },
    { name: "프라임 코스트", value: input.primeCostRatio ?? NaN, score: pcScore, weight: isFoodLike ? 0.30 : 0 },
  ].filter((c) => c.weight > 0));
}

// ── (C) Efficiency 영역 ──
//   비용/매출 비율 (50%) + 손익분기 달성률 (50%)
function scoreDomainEfficiency(input: {
  costToRevenueRatio: number | null;  // 0~100+ %
  breakEvenRatio: number | null;      // 0~100 %
}): DomainScore {
  // 비용/매출 임계값: 90% healthy / 95% caution / 105% warning
  const ctrScore = input.costToRevenueRatio != null
    ? scoreKpi(input.costToRevenueRatio, {
        healthy: 90, caution: 95, warning: 105,
        unit: "percent", direction: "lowerIsBetter",
        source: "비용/매출 비율 (영업이익률 +10%, +5%, -5% 와 동치)",
      })
    : NaN;
  const beScore = input.breakEvenRatio != null
    ? scoreKpi(input.breakEvenRatio, COMMON_THRESHOLDS.breakEvenRatio)
    : NaN;
  return aggregateDomain("efficiency", [
    { name: "비용 효율", value: input.costToRevenueRatio ?? NaN, score: ctrScore, weight: 0.5 },
    { name: "손익분기 달성률", value: input.breakEvenRatio ?? NaN, score: beScore, weight: 0.5 },
  ]);
}

// ── (D) Growth 영역 ──
//   매출 성장률 MoM (100%)
function scoreDomainGrowth(input: {
  salesGrowthMoM: number | null;
}): DomainScore {
  const gScore = input.salesGrowthMoM != null
    ? scoreKpi(input.salesGrowthMoM, COMMON_THRESHOLDS.salesGrowthMoM)
    : NaN;
  return aggregateDomain("growth", [
    { name: "매출 성장률", value: input.salesGrowthMoM ?? NaN, score: gScore, weight: 1.0 },
  ]);
}

// ════════════════════════════════════════════════════════════════════════
// 5. 업종·단계별 가중치
// ════════════════════════════════════════════════════════════════════════

/** 사업 단계 (가중치 보정용) — lifecycle/stages.ts 의 BusinessMaturity 와 다른 개념 */
export type BusinessMaturity = "pre-rev" | "early" | "growth" | "mature";

const BASE_WEIGHTS: Record<IndustryGroup, Record<DomainKey, number>> = {
  restaurant: { cash: 0.40, profit: 0.30, efficiency: 0.15, growth: 0.15 },
  cafe:       { cash: 0.40, profit: 0.30, efficiency: 0.15, growth: 0.15 },
  retail:     { cash: 0.35, profit: 0.25, efficiency: 0.25, growth: 0.15 },
  ecommerce:  { cash: 0.30, profit: 0.25, efficiency: 0.20, growth: 0.25 },
  beauty:     { cash: 0.30, profit: 0.30, efficiency: 0.20, growth: 0.20 }, // service 와 동일 가중치
  service:    { cash: 0.30, profit: 0.30, efficiency: 0.20, growth: 0.20 },
  saas:       { cash: 0.40, profit: 0.15, efficiency: 0.25, growth: 0.20 },
  general:    { cash: 0.35, profit: 0.30, efficiency: 0.20, growth: 0.15 },
};

const STAGE_DELTA: Record<BusinessMaturity, Record<DomainKey, number>> = {
  // 초기일수록 cash↑, 성숙할수록 profit↑
  "pre-rev": { cash: +0.10, growth: +0.05, profit: -0.10, efficiency: -0.05 },
  "early":   { cash: +0.05, growth: +0.05, profit: -0.05, efficiency: -0.05 },
  "growth":  { cash:  0,    growth:  0,    profit:  0,    efficiency:  0 },
  "mature":  { cash: -0.10, growth: -0.05, profit: +0.10, efficiency: +0.05 },
};

export function getDomainWeights(
  industry: IndustryGroup,
  stage: BusinessMaturity = "growth"
): Record<DomainKey, number> {
  const base = BASE_WEIGHTS[industry] ?? BASE_WEIGHTS.general;
  const delta = STAGE_DELTA[stage];
  const raw = {
    cash: Math.max(0.05, base.cash + delta.cash),
    profit: Math.max(0.05, base.profit + delta.profit),
    efficiency: Math.max(0.05, base.efficiency + delta.efficiency),
    growth: Math.max(0.05, base.growth + delta.growth),
  };
  // 합 = 1 로 재정규화
  const sum = raw.cash + raw.profit + raw.efficiency + raw.growth;
  return {
    cash: raw.cash / sum,
    profit: raw.profit / sum,
    efficiency: raw.efficiency / sum,
    growth: raw.growth / sum,
  };
}

// ════════════════════════════════════════════════════════════════════════
// 6. 보조 학술 지표 (점수에 직접 반영하지 않고 별도 표시)
// ════════════════════════════════════════════════════════════════════════

/**
 * Altman Z''-Score (1995) — 비제조·신흥시장 변형
 *  Z'' = 6.56·X1 + 3.26·X2 + 6.72·X3 + 1.05·X4
 *    X1 = 운전자본 / 총자산
 *    X2 = 이익잉여금 / 총자산
 *    X3 = EBIT / 총자산
 *    X4 = 장부가 자본 / 총부채
 *  컷오프: > 2.6 안전 / 1.1-2.6 회색 / < 1.1 위험
 *
 * 자영업자는 일반적으로 X2(이익잉여금)·X4(자본) 데이터가 없거나 부정확.
 * 가용 데이터만으로 단순 변형 계산. 데이터 부족 시 null 반환.
 */
export function calculateAltmanZDoublePrime(input: {
  workingCapital: number;
  totalAssets: number;
  retainedEarnings: number;
  ebit: number;
  bookEquity: number;
  totalLiabilities: number;
}): { score: number; grade: HealthGrade; zone: "safe" | "grey" | "distress" } | null {
  const { workingCapital, totalAssets, retainedEarnings, ebit, bookEquity, totalLiabilities } = input;
  if (totalAssets <= 0 || totalLiabilities <= 0) return null;
  const x1 = workingCapital / totalAssets;
  const x2 = retainedEarnings / totalAssets;
  const x3 = ebit / totalAssets;
  const x4 = bookEquity / totalLiabilities;
  const z = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4;
  const zone: "safe" | "grey" | "distress" =
    z > 2.6 ? "safe" : z >= 1.1 ? "grey" : "distress";
  const grade: HealthGrade =
    zone === "safe" ? "healthy" : zone === "grey" ? "caution" : "critical";
  return { score: Math.round(z * 100) / 100, grade, zone };
}

/**
 * Default Alive vs Default Dead (Paul Graham 2015)
 *  현 비용 그대로, 최근 매출 성장률 그대로 가면 잔고 0 이 되기 전에 흑자 도달?
 *
 *  계산: 매월 Revenue × (1+g) / Expense 일정 가정.
 *        Cash 가 0 되기 전에 Revenue ≥ Expense 면 Default Alive.
 *
 *  YC 권장: 운영 8-9개월 이후 적용.
 */
export function calculateDefaultAlive(input: {
  monthlyRevenue: number;
  monthlyExpense: number;
  monthlyGrowthRate: number;  // 0.07 = 7%
  cashOnHand: number;
  maxMonths?: number;          // 기본 36개월 시뮬레이션
}): { alive: boolean; monthsToBreakEven: number | null; monthsToZero: number | null } | null {
  const { monthlyRevenue, monthlyExpense, monthlyGrowthRate, cashOnHand } = input;
  if (monthlyExpense <= 0) return null;
  const max = input.maxMonths ?? 36;

  let rev = monthlyRevenue;
  let cash = cashOnHand;
  let monthsToBreakEven: number | null = null;
  let monthsToZero: number | null = null;

  for (let m = 0; m < max; m++) {
    if (rev >= monthlyExpense && monthsToBreakEven === null) monthsToBreakEven = m;
    cash += rev - monthlyExpense;
    if (cash <= 0 && monthsToZero === null) monthsToZero = m + 1;
    if (monthsToBreakEven !== null) return { alive: true, monthsToBreakEven, monthsToZero: null };
    if (monthsToZero !== null) return { alive: false, monthsToBreakEven: null, monthsToZero };
    rev *= (1 + monthlyGrowthRate);
  }
  // 36개월 내 둘 다 발생 안 함 — 흑자 도달 못했으나 현금도 안 마름 → 회색
  return { alive: false, monthsToBreakEven: null, monthsToZero: null };
}

// ════════════════════════════════════════════════════════════════════════
// 7. 메인 계산 — calculateUnifiedHealthScore
// ════════════════════════════════════════════════════════════════════════

export type UnifiedHealthInput = {
  dailyEntries: DailyEntry[];
  monthlyCosts: MonthlyCosts;
  industry?: IndustryGroup;
  stage?: BusinessMaturity;
  // 옵션 — 있으면 정밀도 ↑
  previousMonthRevenue?: number;
  currentCash?: number;
  deliverySales?: Record<string, number>;
};

export type UnifiedHealthResult = {
  score: number;                // 0-100 (NaN 가능)
  grade: HealthGrade;
  domains: Record<DomainKey, DomainScore>;
  weights: Record<DomainKey, number>;
  missingDomains: DomainKey[];   // 가중치 재정규화에서 0이 된 영역
  ready: boolean;                // 점수를 사용자에게 보여줘도 되는가
  readinessReason?: string;      // ready=false 일 때 무엇이 부족한지
  // 보조 지표
  defaultAlive?: { alive: boolean; monthsToBreakEven: number | null; monthsToZero: number | null };
};

/**
 * 사업 건강도 통합 계산 (모든 시스템이 호출하는 단일 진입점)
 */
export function calculateUnifiedHealthScore(input: UnifiedHealthInput): UnifiedHealthResult {
  const industry = input.industry ?? "general";
  const stage = input.stage ?? "growth";
  const costs = normalizeCosts(input.monthlyCosts);
  const pnl = calculateMonthlyPnL(input.dailyEntries, costs, input.deliverySales);
  const days = input.dailyEntries.length;
  const totalCosts = pnl.totalCosts + (costs.interest ?? 0);
  const monthlyBurn = totalCosts - pnl.totalRevenue;

  // ─── KPI 추출 (값이 신뢰 불가하면 null) ───
  const hasRevenue = pnl.totalRevenue > 0;
  const hasCosts = totalCosts > 0;
  const hasEnoughDays = days >= 7;

  const operatingMargin = hasRevenue && hasCosts ? pnl.operatingMargin : null;
  const grossMargin = hasRevenue && costs.ingredients > 0 ? pnl.grossMargin : null;
  // 비용 비율 — cost-ratios.ts SSOT, 월 환산 매출 기준 (기간 정합 보장)
  const ratios = calculateCostRatios({
    costs,
    totalRevenue: pnl.totalRevenue,
    days,
  });
  const primeCostRatio = hasRevenue && (costs.ingredients > 0 || costs.labor > 0)
    ? ratios.primeCostRatio
    : null;
  const costToRevenueRatio = hasRevenue && hasCosts ? ratios.costToRevenueRatio : null;

  // 손익분기 달성률 — cost-ratios.ts SSOT (dashboard.ts 와 동일 공식 보장)
  let breakEvenRatio: number | null = null;
  if (hasRevenue && hasCosts && hasEnoughDays) {
    const bep = calculateBreakEven({
      monthlyIngredients: costs.ingredients,
      monthlyFixedCosts:
        costs.rent + costs.labor + costs.utilities + costs.sga + costs.marketing + costs.other,
      totalRevenue: pnl.totalRevenue,
      days,
      fallbackCogsRate: 0.33,
    });
    if (bep.computable) {
      const daysAbove = input.dailyEntries.filter((e) => e.sales >= bep.breakEvenDaily).length;
      breakEvenRatio = (daysAbove / days) * 100;
    }
  }

  // 현금 런웨이 (입력 시에만)
  let runwayMonths: number | null = null;
  if (input.currentCash != null && input.currentCash > 0) {
    runwayMonths = monthlyBurn > 0
      ? input.currentCash / monthlyBurn
      : 99; // 흑자 → 사실상 무한, 99로 cap
  }

  // 이자보상배율 (이자 + 영업이익 모두 있을 때)
  const interestCoverage = costs.interest > 0 && pnl.operatingProfit !== 0
    ? pnl.operatingProfit / costs.interest
    : null;

  // 영업현금흐름/총비용 (Quick Ratio 대용)
  const cashOpsRatio = hasCosts ? pnl.netCashFlow / totalCosts + 1 : null;
  // (= netCashFlow / totalCosts + 1 = (totalRevenue - interest) / totalCosts. 1이면 손익분기.)
  // 사실상 매출/총비용 변형으로, 평소엔 1 근처. 1.5+ healthy.

  // 매출 성장률 (전월 대비)
  const salesGrowthMoM = (input.previousMonthRevenue && input.previousMonthRevenue > 0)
    ? ((pnl.totalRevenue - input.previousMonthRevenue) / input.previousMonthRevenue) * 100
    : null;

  // ─── 영역별 점수 ───
  const domains: Record<DomainKey, DomainScore> = {
    cash: scoreDomainCash({ runwayMonths, interestCoverage, cashOpsRatio }),
    profit: scoreDomainProfit({ operatingMargin, grossMargin, primeCostRatio, industry }),
    efficiency: scoreDomainEfficiency({ costToRevenueRatio, breakEvenRatio }),
    growth: scoreDomainGrowth({ salesGrowthMoM }),
  };

  // ─── 가중치 (결측 영역 가중치 0 → 재정규화) ───
  const baseWeights = getDomainWeights(industry, stage);
  const missingDomains: DomainKey[] = (Object.keys(domains) as DomainKey[])
    .filter((k) => !Number.isFinite(domains[k].score));
  const adjusted = (Object.keys(baseWeights) as DomainKey[]).reduce<Record<DomainKey, number>>(
    (acc, k) => {
      acc[k] = missingDomains.includes(k) ? 0 : baseWeights[k];
      return acc;
    },
    { cash: 0, profit: 0, efficiency: 0, growth: 0 }
  );
  const wSum = adjusted.cash + adjusted.profit + adjusted.efficiency + adjusted.growth;
  const weights = wSum > 0
    ? {
        cash: adjusted.cash / wSum,
        profit: adjusted.profit / wSum,
        efficiency: adjusted.efficiency / wSum,
        growth: adjusted.growth / wSum,
      }
    : adjusted;

  // ─── 최종 점수 ───
  const score = wSum > 0
    ? (Object.keys(domains) as DomainKey[])
        .filter((k) => Number.isFinite(domains[k].score))
        .reduce((s, k) => s + domains[k].score * weights[k], 0)
    : NaN;

  // ─── ready 판정: 데이터 충분성 게이트 ───
  // healthy/critical 같은 단정적 등급을 사용자에게 보여주려면:
  //  - 매출 7일+, 비용 입력, 최소 2개 영역 가용
  const hasMostDomains = (4 - missingDomains.length) >= 2;
  const ready = hasEnoughDays && hasCosts && hasMostDomains && Number.isFinite(score);
  let readinessReason: string | undefined;
  if (!ready) {
    if (!hasEnoughDays) readinessReason = `매출 ${days}일 / 7일 필요`;
    else if (!hasCosts) readinessReason = "월 비용을 한 번 입력해 주세요";
    else if (!hasMostDomains) readinessReason = "주요 지표가 부족해요";
  }

  // ─── 보조: Default Alive ───
  let defaultAlive: UnifiedHealthResult["defaultAlive"];
  if (input.currentCash != null && pnl.totalRevenue > 0 && totalCosts > 0 && salesGrowthMoM != null) {
    const dav = calculateDefaultAlive({
      monthlyRevenue: pnl.totalRevenue,
      monthlyExpense: totalCosts,
      monthlyGrowthRate: salesGrowthMoM / 100,
      cashOnHand: input.currentCash,
    });
    if (dav) defaultAlive = dav;
  }

  return {
    score: Number.isFinite(score) ? Math.round(score * 10) / 10 : NaN,
    grade: ready ? gradeFromScore(score) : "unknown",
    domains,
    weights,
    missingDomains,
    ready,
    readinessReason,
    defaultAlive,
  };
}

// ════════════════════════════════════════════════════════════════════════
// 8. 외부 노출 helpers (구 코드 호환용)
// ════════════════════════════════════════════════════════════════════════

/**
 * 업종 ID(industryCategoryId) → IndustryGroup 매핑
 * (UI 컴포넌트의 COST_RATIOS 키와 호환)
 */
export function mapIndustryToGroup(industryCategoryId?: string): IndustryGroup {
  if (!industryCategoryId) return "general";
  const id = industryCategoryId.toLowerCase();
  if (id.includes("cafe") || id.includes("dessert") || id.includes("bakery")) return "cafe";
  if (id.includes("food") || id.includes("restaurant") || id.includes("bar")) return "restaurant";
  if (id.includes("online") || id.includes("digital") || id.includes("ecom")) return "ecommerce";
  if (id.includes("retail") || id.includes("convenience") || id.includes("apparel")) return "retail";
  if (id.includes("startup") || id.includes("tech") || id.includes("saas")) return "saas";
  // 미용·헤어살롱은 디자이너 커미션 구조라 일반 서비스업과 인건비 임계값이 달라 별도 그룹.
  if (id.includes("beauty") || id.includes("hair") || id.includes("salon")) return "beauty";
  if (id.includes("fitness") || id.includes("education")
    || id.includes("pet") || id.includes("living-service") || id.includes("space")) return "service";
  return "general";
}

/**
 * 비용 카테고리 + 업종 → KPI 임계값 조회 (CostCompositionDonutCard 가 사용)
 */
export function getCostThreshold(
  category: "ingredients" | "labor" | "rent" | "marketing" | "primeCost" | "delivery",
  industry: IndustryGroup
): KpiThreshold | undefined {
  return COST_RATIO_THRESHOLDS[industry]?.[category]
    ?? COST_RATIO_THRESHOLDS.general[category]
    ?? COST_RATIO_THRESHOLDS.restaurant[category];
}
