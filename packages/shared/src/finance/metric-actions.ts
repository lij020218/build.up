/**
 * metric-actions.ts — 핵심 지표 → "그래서 뭘 해야 하지" 추천
 *
 * 디자인 철학: 지표를 쏟아붓지 않는다. 각 지표는 반드시 다음 행동(Next Action)이 따라온다.
 *
 *  - 단일 책임: 지표 값과 컨텍스트만 받아서 행동 문구를 반환 (UI 완전 분리)
 *  - 우선순위: critical > warning > healthy. 위험한 것부터 표시.
 *  - 구체적: "비용 줄이세요" 가 아니라 "월 고정비 15% 줄이면 2.1x로 개선됩니다"
 */

import type { StartupMetrics, StartupMetricHealth } from "./startup-metrics";
import {
  BURN_MULTIPLE_BENCHMARK,
  WOW_GROWTH_BENCHMARK,
  CMGR_BENCHMARK,
  RUNWAY_BENCHMARK,
  RULE_OF_40_BENCHMARK,
  MAGIC_NUMBER_BENCHMARK,
  REPEAT_PURCHASE_BENCHMARK,
  getMetricHealth,
  getDefaultAliveHealth,
} from "./startup-metrics";

// ════════════════════════════════════════════════════════════════════════
// 1. 타입
// ════════════════════════════════════════════════════════════════════════

export type MetricAction = {
  metricKey: keyof StartupMetrics;
  health: StartupMetricHealth;
  /** 한 줄 진단 (예: "Burn Multiple 3.2x — 위험") */
  headline: string;
  /** 다음 행동 (예: "월 고정비 15% 줄이면 2.1x로 개선됩니다") */
  action: string;
  /** 근거·벤치마크 (예: "Sacks 기준: <2x 양호") */
  rationale: string;
  /** 정렬 우선순위 (낮을수록 먼저). critical=0, warning=1, healthy=2 */
  priority: number;
};

export type StartupContext = {
  /** 월 고정비 (rent + labor + utilities + sga) */
  monthlyFixedCosts?: number;
  /** 월 매출 */
  monthlyRevenue?: number;
  /** S&M 지출 */
  salesMarketingSpend?: number;
  /** 업종 */
  industry?: "saas" | "ecommerce" | "restaurant" | "service" | "general";
  /** 어느 채널에 집중되어 있는지 (있으면 다변화 멘트에 활용) */
  dominantChannel?: string;
};

const PRIORITY: Record<StartupMetricHealth, number> = {
  critical: 0,
  warning: 1,
  healthy: 2,
};

// ════════════════════════════════════════════════════════════════════════
// 2. 개별 지표 → 액션
// ════════════════════════════════════════════════════════════════════════

function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
function fmtX(n: number, digits = 1): string {
  return `${n.toFixed(digits)}x`;
}
function fmtMonths(n: number): string {
  return `${n.toFixed(1)}개월`;
}
function fmtKRW(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
  return `${Math.round(n).toLocaleString()}원`;
}

function actionForBurnMultiple(value: number, ctx: StartupContext): MetricAction {
  const health = getMetricHealth("burnMultiple", value);
  const bench = BURN_MULTIPLE_BENCHMARK;
  let headline: string;
  let action: string;

  if (value === 0) {
    headline = "Burn Multiple — 흑자 운영";
    action = "현 수준의 자본 효율을 유지하며 성장 투자에 재배분할 수 있습니다.";
  } else if (health === "critical") {
    headline = `Burn Multiple ${fmtX(value)} — 위험`;
    if (ctx.monthlyFixedCosts && ctx.monthlyFixedCosts > 0) {
      const target = ctx.monthlyFixedCosts * 0.85;
      action =
        `월 고정비 15% 절감(${fmtKRW(ctx.monthlyFixedCosts)} → ${fmtKRW(target)})하거나 ` +
        `Net New ARR 을 50% 늘려야 ${fmtX(bench.warning)} 이하로 회복됩니다.`;
    } else {
      action = "월 고정비를 15% 절감하거나 Net New ARR 을 50% 늘리세요.";
    }
  } else if (health === "warning") {
    headline = `Burn Multiple ${fmtX(value)} — 주의`;
    action = "신규 ARR 증가 속도가 자본 소진 속도보다 빠르도록 만드세요. (목표 <1x)";
  } else {
    headline = `Burn Multiple ${fmtX(value)} — 양호`;
    action = "현 수준 유지. 성장 가속 시점에 추가 투자를 검토하세요.";
  }
  return {
    metricKey: "burnMultiple",
    health,
    headline,
    action,
    rationale: `Sacks 기준: <${fmtX(bench.healthy)} 양호 / <${fmtX(bench.warning)} 보통 / >${fmtX(bench.critical)} 위험`,
    priority: PRIORITY[health],
  };
}

function actionForCMGR(value: number, ctx: StartupContext): MetricAction {
  const health = getMetricHealth("cmgr", value);
  let headline: string;
  let action: string;

  if (health === "critical") {
    headline = `월 성장률 ${fmtPct(value)} — 정체`;
    const channelHint = ctx.dominantChannel ? ` 현재 ${ctx.dominantChannel} 채널에 집중되어 있습니다.` : "";
    action = `고객 획득 채널을 다변화하세요.${channelHint} YC 기준 월 ${CMGR_BENCHMARK.healthy}% 이상이 건강합니다.`;
  } else if (health === "warning") {
    headline = `월 성장률 ${fmtPct(value)} — 보통`;
    action = "성장 가속을 위해 가장 잘 작동하는 채널의 예산을 2배 늘려 검증하세요.";
  } else {
    headline = `월 성장률 ${fmtPct(value)} — 양호`;
    action = "현 성장률 유지. 다음 달도 같은 속도로 가면 4개월 내 매출 1.5배.";
  }
  return {
    metricKey: "cmgr",
    health,
    headline,
    action,
    rationale: `YC 기준: ${CMGR_BENCHMARK.healthy}%+ 양호 / ${CMGR_BENCHMARK.warning}%+ 보통 / 0% 이하 정체`,
    priority: PRIORITY[health],
  };
}

function actionForWoWGrowth(value: number): MetricAction {
  const health = getMetricHealth("wowGrowth", value);
  let headline: string;
  let action: string;

  if (health === "critical") {
    headline = `주간 성장 ${fmtPct(value)} — 위험`;
    action = "이번 주 가장 큰 매출 하락 요인 1개를 찾아 다음 주 안에 대응하세요.";
  } else if (health === "warning") {
    headline = `주간 성장 ${fmtPct(value)} — 보통`;
    action = "YC 기준 주 5-7% 까지 끌어올리세요. 작은 실험 1개를 매주 돌리세요.";
  } else {
    headline = `주간 성장 ${fmtPct(value)} — 양호`;
    action = "지금의 성장 가설을 문서화하고, 같은 실험을 1개 더 복제하세요.";
  }
  return {
    metricKey: "wowGrowth",
    health,
    headline,
    action,
    rationale: "Paul Graham (YC): 주 5-7% 좋음, 10% 매우 좋음",
    priority: PRIORITY[health],
  };
}

function actionForRunway(value: number): MetricAction {
  const health = getMetricHealth("runwayMonths", value);
  let headline: string;
  let action: string;

  if (health === "critical") {
    headline = `런웨이 ${fmtMonths(value)} — 긴급`;
    action = "지금 자금 조달 또는 비용 30%+ 절감을 시작하세요. 6개월 미만은 협상력이 급락합니다.";
  } else if (health === "warning") {
    headline = `런웨이 ${fmtMonths(value)} — 주의`;
    action = "다음 라운드 준비를 시작할 시점입니다. (한국 VC 권장 18-24개월)";
  } else {
    headline = `런웨이 ${fmtMonths(value)} — 안정`;
    action = "안정 구간. 이 시점에 성장 가설 검증에 적극 투자할 수 있습니다.";
  }
  return {
    metricKey: "runwayMonths",
    health,
    headline,
    action,
    rationale: `한국 VC 권장: ${RUNWAY_BENCHMARK.healthy}+ 안정 / ${RUNWAY_BENCHMARK.warning}+ 주의 / <${RUNWAY_BENCHMARK.critical} 긴급`,
    priority: PRIORITY[health],
  };
}

function actionForRuleOf40(value: number): MetricAction {
  const health = getMetricHealth("ruleOf40", value);
  let headline: string;
  let action: string;

  if (health === "critical") {
    headline = `Rule of 40 ${fmtPct(value, 0)} — 비효율`;
    action = "성장률 또는 영업이익률 중 한쪽을 끌어올려 합 40% 를 넘겨야 합니다.";
  } else if (health === "warning") {
    headline = `Rule of 40 ${fmtPct(value, 0)} — 보통`;
    action = "마진을 5%p 개선하거나 성장률을 5%p 끌어올리는 1개 레버를 정하세요.";
  } else {
    headline = `Rule of 40 ${fmtPct(value, 0)} — 우수`;
    action = "투자자 관점에서 매력적인 구간. 이 균형을 깨지 않는 선에서 가속하세요.";
  }
  return {
    metricKey: "ruleOf40",
    health,
    headline,
    action,
    rationale: `Brad Feld: ≥${RULE_OF_40_BENCHMARK.healthy}% 우수 / ≥${RULE_OF_40_BENCHMARK.warning}% 보통`,
    priority: PRIORITY[health],
  };
}

function actionForMagicNumber(value: number): MetricAction {
  const health = getMetricHealth("magicNumber", value);
  let headline: string;
  let action: string;

  if (health === "critical") {
    headline = `Magic Number ${fmtX(value, 2)} — 비효율`;
    action = "S&M 1원당 신규 ARR 회수가 부족합니다. 가장 효율 낮은 채널부터 정리하세요.";
  } else if (health === "warning") {
    headline = `Magic Number ${fmtX(value, 2)} — 보통`;
    action = "성과 좋은 채널에 예산을 집중하고 효율 낮은 채널은 단계적으로 축소하세요.";
  } else {
    headline = `Magic Number ${fmtX(value, 2)} — 가속 가능`;
    action = "S&M 효율이 우수합니다. 예산을 점진적으로 늘려 성장 레버를 키우세요.";
  }
  return {
    metricKey: "magicNumber",
    health,
    headline,
    action,
    rationale: `Scale VP: ≥${MAGIC_NUMBER_BENCHMARK.healthy}x 가속 / ≥${MAGIC_NUMBER_BENCHMARK.warning}x 양호`,
    priority: PRIORITY[health],
  };
}

function actionForDefaultAlive(alive: boolean): MetricAction {
  const health = getDefaultAliveHealth(alive);
  if (alive) {
    return {
      metricKey: "defaultAlive",
      health,
      headline: "Default Alive — 자력 흑자 가능",
      action: "현 성장률 유지 시 잔고 소진 전 흑자 도달. 추가 투자 없이도 생존 가능합니다.",
      rationale: "Paul Graham (2015): YC 권장 운영 8-9개월 후 적용",
      priority: PRIORITY[health],
    };
  }
  return {
    metricKey: "defaultAlive",
    health,
    headline: "⚠️ Default Dead — 자력 흑자 불가",
    action: "현 성장률로는 자금 소진 전 흑자 전환이 어렵습니다. 비용 절감 또는 성장 가속이 필요합니다.",
    rationale: "Paul Graham (2015) — Default Alive vs Dead 자가 진단",
    priority: PRIORITY[health],
  };
}

function actionForAOV(value: number, ctx: StartupContext): MetricAction {
  // AOV 는 절대 벤치마크가 어렵 → 단순 표시 (warning 폴백)
  const health: StartupMetricHealth = "healthy";
  const headline = `평균 객단가 ${fmtKRW(value)}`;
  const action = ctx.industry === "ecommerce"
    ? "객단가를 10% 올리는 번들/추천 1개를 다음 캠페인에 넣어보세요."
    : "객단가 추세를 주간 단위로 관찰하고, 변화 원인을 기록하세요.";
  return {
    metricKey: "aov",
    health,
    headline,
    action,
    rationale: "AOV 는 절대 기준 없음 — 자체 추세 비교가 핵심",
    priority: PRIORITY[health],
  };
}

function actionForRepeatPurchase(value: number): MetricAction {
  const health = getMetricHealth("repeatPurchaseRate", value);
  let headline: string;
  let action: string;

  if (health === "critical") {
    headline = `재구매율 ${fmtPct(value, 0)} — 낮음`;
    action = "첫 구매 후 14일 내 재구매 트리거(쿠폰·리뷰 요청 등) 1개를 도입하세요.";
  } else if (health === "warning") {
    headline = `재구매율 ${fmtPct(value, 0)} — 보통`;
    action = "재구매 고객 vs 1회 구매 고객의 첫 경험 차이를 인터뷰 5건으로 확인하세요.";
  } else {
    headline = `재구매율 ${fmtPct(value, 0)} — 우수`;
    action = "재구매 동인을 문서화하고 신규 고객 온보딩에 동일 패턴을 이식하세요.";
  }
  return {
    metricKey: "repeatPurchaseRate",
    health,
    headline,
    action,
    rationale: `Shopify 표준: ≥${REPEAT_PURCHASE_BENCHMARK.healthy}% 우수 / ≥${REPEAT_PURCHASE_BENCHMARK.warning}% 보통`,
    priority: PRIORITY[health],
  };
}

// ════════════════════════════════════════════════════════════════════════
// 3. 메인 — getMetricActions
// ════════════════════════════════════════════════════════════════════════

/**
 * 모든 가용 지표에 대한 Next Action 묶음.
 * 우선순위(위험→양호) 순으로 정렬.
 *
 *  - null 인 지표는 건너뜀 (데이터 부족 → 노이즈 방지)
 *  - 호출자가 상위 N 개만 잘라서 표시 (보통 3~5개)
 */
export function getMetricActions(
  metrics: StartupMetrics,
  ctx: StartupContext = {}
): MetricAction[] {
  const out: MetricAction[] = [];

  if (metrics.burnMultiple != null) out.push(actionForBurnMultiple(metrics.burnMultiple, ctx));
  if (metrics.cmgr != null) out.push(actionForCMGR(metrics.cmgr, ctx));
  if (metrics.wowGrowth != null) out.push(actionForWoWGrowth(metrics.wowGrowth));
  if (metrics.runwayMonths != null) out.push(actionForRunway(metrics.runwayMonths));
  if (metrics.ruleOf40 != null) out.push(actionForRuleOf40(metrics.ruleOf40));
  if (metrics.magicNumber != null) out.push(actionForMagicNumber(metrics.magicNumber));
  if (metrics.defaultAlive != null) out.push(actionForDefaultAlive(metrics.defaultAlive));
  if (metrics.aov != null) out.push(actionForAOV(metrics.aov, ctx));
  if (metrics.repeatPurchaseRate != null) out.push(actionForRepeatPurchase(metrics.repeatPurchaseRate));

  return out.sort((a, b) => a.priority - b.priority);
}
