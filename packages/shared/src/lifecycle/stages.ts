// ─── 생애주기 로드맵 확장 ────────────────────────────────────────────────────
// 기존 10단계 창업 준비 로드맵 이후, 운영 → 성장 → 위기/전환 → 폐업/재창업까지
// 사업 전 생애주기를 커버합니다.
//
// UX 원칙:
// - 사용자의 현재 단계만 강조하고 나머지는 가볍게 표시합니다.
// - 각 단계는 "왜 지금 이게 중요한지" 한 줄로 설명합니다.
// - 폐업 단계는 부정적이지 않게, "정리와 재시작"으로 프레이밍합니다.

import type { FreshnessMeta } from "../types/freshness";

// ─── 타입 ────────────────────────────────────────────────────────────────────

export type LifecyclePhase = "preparation" | "launch" | "growth" | "maturity" | "transition";

export type LifecycleStage = {
  id: string;
  phase: LifecyclePhase;
  title: { ko: string; en: string };
  /** 한 줄 설명 — "왜 지금 이게 중요한지" */
  whyNow: { ko: string; en: string };
  /** 이 단계의 핵심 질문 1개 */
  keyQuestion: { ko: string; en: string };
  /** 주요 체크리스트 (3~5개, 과하지 않게) */
  checklist: Array<{
    id: string;
    label: { ko: string; en: string };
  }>;
  /** 이 단계에서 활성화되는 도구/기능 */
  enabledFeatures: string[];
  /** 이 단계 진입 조건 */
  entryCondition: LifecycleEntryCondition;
  /** 예상 소요 기간 */
  duration: { ko: string; en: string };
};

export type LifecycleEntryCondition =
  | { kind: "business_launched" }
  | { kind: "months_in_business"; months: number }
  | { kind: "manual_trigger"; triggerLabel: { ko: string; en: string } }
  | { kind: "health_score_below"; threshold: number };

// ─── 생애주기 단계 정의 ─────────────────────────────────────────────────────

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  // ── Phase: Launch (오픈 후 0~3개월) ──
  {
    id: "first-90-days",
    phase: "launch",
    title: { ko: "오픈 후 90일", en: "First 90 Days" },
    whyNow: {
      ko: "자영업의 70%가 첫 3개월에 운영 패턴이 결정됩니다",
      en: "70% of small businesses establish their operating patterns in the first 90 days",
    },
    keyQuestion: {
      ko: "손익분기를 언제 넘을 수 있을까?",
      en: "When will I break even?",
    },
    checklist: [
      { id: "daily-recording", label: { ko: "매일 매출·고객수 기록 시작", en: "Start daily sales/customer recording" } },
      { id: "first-month-costs", label: { ko: "첫 달 실제 비용 파악 완료", en: "Identify actual first-month costs" } },
      { id: "customer-feedback", label: { ko: "단골 고객 3명 이상 확보", en: "Secure 3+ regular customers" } },
      { id: "breakeven-check", label: { ko: "손익분기 매출 달성 여부 확인", en: "Check break-even achievement" } },
    ],
    enabledFeatures: ["dashboard", "daily-entry", "cost-tracking", "health-check"],
    entryCondition: { kind: "business_launched" },
    duration: { ko: "약 3개월", en: "~3 months" },
  },

  // ── Phase: Growth (3~12개월) ──
  {
    id: "stabilization",
    phase: "growth",
    title: { ko: "안정화 단계", en: "Stabilization" },
    whyNow: {
      ko: "초기 혼란이 지나고 수익 구조를 최적화할 시기입니다",
      en: "Initial chaos has passed — time to optimize your revenue structure",
    },
    keyQuestion: {
      ko: "어디서 비용을 줄이고 매출을 늘릴 수 있을까?",
      en: "Where can I cut costs and increase revenue?",
    },
    checklist: [
      { id: "cost-optimization", label: { ko: "비용 구조 1차 최적화", en: "First cost structure optimization" } },
      { id: "menu-review", label: { ko: "메뉴/상품 수익성 분석", en: "Menu/product profitability analysis" } },
      { id: "marketing-basics", label: { ko: "기본 마케팅 채널 확보", en: "Establish basic marketing channels" } },
      { id: "tax-first-filing", label: { ko: "첫 세금 신고 완료", en: "Complete first tax filing" } },
    ],
    enabledFeatures: ["dashboard", "pnl-report", "tax-calendar", "forecast"],
    entryCondition: { kind: "months_in_business", months: 3 },
    duration: { ko: "3~12개월", en: "3-12 months" },
  },
  {
    id: "growth-push",
    phase: "growth",
    title: { ko: "성장 가속", en: "Growth Acceleration" },
    whyNow: {
      ko: "안정적인 운영 기반 위에 매출을 확대할 시기입니다",
      en: "Build on your stable operations to scale revenue",
    },
    keyQuestion: {
      ko: "추가 투자 없이 매출을 20% 늘릴 수 있을까?",
      en: "Can I grow revenue 20% without additional investment?",
    },
    checklist: [
      { id: "delivery-expansion", label: { ko: "배달/온라인 채널 확장 검토", en: "Review delivery/online channel expansion" } },
      { id: "customer-retention", label: { ko: "재방문율 측정 및 개선", en: "Measure and improve return rate" } },
      { id: "hiring-decision", label: { ko: "직원 추가 고용 여부 판단", en: "Evaluate additional hiring" } },
    ],
    enabledFeatures: ["dashboard", "pnl-report", "forecast", "programs-match"],
    entryCondition: { kind: "months_in_business", months: 12 },
    duration: { ko: "12~24개월", en: "12-24 months" },
  },

  // ── Phase: Maturity (2년+) ──
  {
    id: "sustainable-ops",
    phase: "maturity",
    title: { ko: "지속 가능한 운영", en: "Sustainable Operations" },
    whyNow: {
      ko: "2년 생존을 넘기셨습니다. 장기 안정성을 확보할 시기입니다",
      en: "You survived 2 years. Time to secure long-term stability",
    },
    keyQuestion: {
      ko: "이 사업을 5년 후에도 계속할 수 있을까?",
      en: "Can I sustain this business for 5+ years?",
    },
    checklist: [
      { id: "annual-review", label: { ko: "연간 사업 성과 리뷰", en: "Annual business performance review" } },
      { id: "system-automation", label: { ko: "반복 업무 자동화/시스템화", en: "Automate repetitive tasks" } },
      { id: "succession-plan", label: { ko: "비상 시 운영 계획 수립", en: "Emergency operation plan" } },
    ],
    enabledFeatures: ["dashboard", "pnl-report", "forecast", "business-plan"],
    entryCondition: { kind: "months_in_business", months: 24 },
    duration: { ko: "2년 이후", en: "2+ years" },
  },

  // ── Phase: Transition (위기/전환/폐업) ──
  {
    id: "pivot-or-close",
    phase: "transition",
    title: { ko: "전환 또는 정리", en: "Pivot or Wind Down" },
    whyNow: {
      ko: "어려운 결정이지만, 빠른 판단이 손실을 줄입니다",
      en: "A tough decision, but quick judgment reduces losses",
    },
    keyQuestion: {
      ko: "사업을 전환할까, 정리할까?",
      en: "Should I pivot or wind down?",
    },
    checklist: [
      { id: "loss-assessment", label: { ko: "현재 손실 규모 정확히 파악", en: "Assess exact loss amount" } },
      { id: "pivot-feasibility", label: { ko: "업종 전환 가능성 검토", en: "Evaluate pivot feasibility" } },
      { id: "closure-cost", label: { ko: "폐업 시 비용·절차 확인", en: "Check closure costs and procedures" } },
      { id: "support-programs", label: { ko: "희망리턴패키지 등 지원 확인", en: "Check Hope Return Package eligibility" } },
    ],
    enabledFeatures: ["dashboard", "programs-match", "contract-analysis"],
    entryCondition: { kind: "health_score_below", threshold: 25 },
    duration: { ko: "1~3개월", en: "1-3 months" },
  },
  {
    id: "clean-closure",
    phase: "transition",
    title: { ko: "깔끔한 정리", en: "Clean Closure" },
    whyNow: {
      ko: "폐업도 전략적으로 하면 재기의 발판이 됩니다",
      en: "A strategic closure becomes a springboard for restart",
    },
    keyQuestion: {
      ko: "빚을 최소화하고 깔끔하게 정리할 수 있을까?",
      en: "Can I minimize debt and close cleanly?",
    },
    checklist: [
      { id: "tax-closure", label: { ko: "세무서 폐업 신고", en: "File closure with tax office" } },
      { id: "insurance-cancel", label: { ko: "4대 보험 해지 처리", en: "Cancel insurance policies" } },
      { id: "lease-settlement", label: { ko: "임대차 계약 정산", en: "Settle lease agreement" } },
      { id: "inventory-disposal", label: { ko: "재고·집기 처분", en: "Dispose inventory and fixtures" } },
      { id: "restart-plan", label: { ko: "재창업/재취업 계획 수립", en: "Plan restart or re-employment" } },
    ],
    enabledFeatures: ["programs-match", "contract-analysis", "tax-calendar"],
    entryCondition: {
      kind: "manual_trigger",
      triggerLabel: { ko: "폐업 정리를 시작합니다", en: "Start closure process" },
    },
    duration: { ko: "1~2개월", en: "1-2 months" },
  },
];

// ─── 유틸 함수 ──────────────────────────────────────────────────────────────

/** 사용자의 현재 생애주기 단계를 판별합니다 */
export function determineCurrentLifecycleStage(input: {
  businessLaunched: boolean;
  monthsInBusiness: number;
  healthScore: number;
  manualPhase?: string; // 사용자가 수동으로 선택한 단계
}): LifecycleStage {
  // 수동 선택 우선
  if (input.manualPhase) {
    const manual = LIFECYCLE_STAGES.find((s) => s.id === input.manualPhase);
    if (manual) return manual;
  }

  // 위기 감지 (건강 점수 25 미만)
  if (input.businessLaunched && input.healthScore > 0 && input.healthScore < 25) {
    return LIFECYCLE_STAGES.find((s) => s.id === "pivot-or-close")!;
  }

  if (!input.businessLaunched) {
    // preparation 단계는 기존 로드맵이 담당하므로, launch 첫 단계를 대기 상태로
    return LIFECYCLE_STAGES[0]; // first-90-days
  }

  // 영업 기간 기반 판별 (뒤에서부터 검색 → 가장 높은 조건 매치)
  const timeBasedStages = LIFECYCLE_STAGES
    .filter((s) => s.entryCondition.kind === "months_in_business")
    .sort((a, b) => {
      const aMonths = (a.entryCondition as { months: number }).months;
      const bMonths = (b.entryCondition as { months: number }).months;
      return bMonths - aMonths;
    });

  for (const stage of timeBasedStages) {
    const required = (stage.entryCondition as { months: number }).months;
    if (input.monthsInBusiness >= required) return stage;
  }

  return LIFECYCLE_STAGES[0]; // fallback
}

/** 위상(phase) 라벨 */
export function getPhaseLabel(phase: LifecyclePhase, lang: "ko" | "en" = "ko"): string {
  const labels: Record<LifecyclePhase, { ko: string; en: string }> = {
    preparation: { ko: "창업 준비", en: "Preparation" },
    launch: { ko: "오픈 초기", en: "Launch" },
    growth: { ko: "성장", en: "Growth" },
    maturity: { ko: "안정 운영", en: "Maturity" },
    transition: { ko: "전환·정리", en: "Transition" },
  };
  return labels[phase][lang];
}

/** 위상 색상 (차분한 톤) */
export function getPhaseColor(phase: LifecyclePhase): string {
  const colors: Record<LifecyclePhase, string> = {
    preparation: "#8e8e93",
    launch: "#007aff",
    growth: "#34c759",
    maturity: "#5856d6",
    transition: "#ff9500",
  };
  return colors[phase];
}
