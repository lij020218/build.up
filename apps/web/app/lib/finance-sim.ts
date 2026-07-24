/**
 * 12개월 재무 투영 SSOT (2026-07-24 재무 페이지 신설).
 *
 *  what-if 레버(WhatIfSimulator)로 조정된 "월 구조"에 성장 시나리오를 얹어 12개월을 투영한다.
 *  · 변동비(재료비 등)는 매출에 비례, 나머지는 고정 — 월 단위 산술 (일 단위 정밀은 13주 예측 담당)
 *  · 정직성: 예측이 아니라 "가정 유지 시 산술 결과". 화면에 반드시 가정 라벨 병기.
 *  · 결정론: LLM·외부 API 없음. 경계값은 테스트로 잠근다.
 *
 *  iOS 미러: FinanceSim.swift (동일 수식 — 드리프트 금지).
 */

export type TwelveMonthInput = {
  /** 시작 현금(운영 예비자금 잔여, 원). 음수 입력은 0 취급 */
  startCash: number;
  /** 1개월차 매출 가정(원) — 레버 적용 후 값 */
  monthlySales: number;
  /** 매출 대비 변동비 비율 (0~1). 재료비/매입원가 등 */
  variableCostRatio: number;
  /** 월 고정비 합(원) — 인건비·임대료·마케팅·기타 (레버 적용 후) */
  monthlyFixedCosts: number;
  /** 월 매출 성장률(%) — 보수 -2 / 기준 0 / 낙관 +3 등 */
  growthRatePct: number;
};

export type MonthPoint = {
  month: number;      // 1..12
  sales: number;
  net: number;        // 월 순익 (매출 − 변동비 − 고정비)
  endCash: number;    // 월말 누적 현금
};

export type TwelveMonthResult = {
  points: MonthPoint[];
  /** 현금이 처음 음수가 되는 월 (1..12) — 없으면 null */
  cashOutMonth: number | null;
  /** 월 순익이 처음 0 이상이 되는 월 — 없으면 null (이미 흑자면 1) */
  breakEvenMonth: number | null;
  /** 12개월 말 현금 */
  finalCash: number;
  /** cashOutMonth 시점까지의 누적 부족액(원, 양수) — 조달 필요 규모 안내용 */
  shortfall: number | null;
};

export function projectTwelveMonths(input: TwelveMonthInput): TwelveMonthResult {
  const startCash = Math.max(0, input.startCash || 0);
  const ratio = Math.min(1, Math.max(0, input.variableCostRatio || 0));
  const fixed = Math.max(0, input.monthlyFixedCosts || 0);
  const g = (input.growthRatePct || 0) / 100;

  const points: MonthPoint[] = [];
  let cash = startCash;
  let cashOutMonth: number | null = null;
  let breakEvenMonth: number | null = null;
  let shortfall: number | null = null;

  for (let m = 1; m <= 12; m++) {
    const sales = Math.max(0, (input.monthlySales || 0) * Math.pow(1 + g, m - 1));
    const net = sales - sales * ratio - fixed;
    cash += net;
    if (breakEvenMonth == null && net >= 0) breakEvenMonth = m;
    if (cashOutMonth == null && cash < 0) {
      cashOutMonth = m;
      shortfall = Math.abs(cash);
    }
    points.push({ month: m, sales: Math.round(sales), net: Math.round(net), endCash: Math.round(cash) });
  }

  return {
    points,
    cashOutMonth,
    breakEvenMonth,
    finalCash: Math.round(cash),
    shortfall: shortfall != null ? Math.round(shortfall) : null,
  };
}

/** 시나리오 프리셋 — 보수/기준/낙관 월 성장률(%). 임의 숫자 아님을 라벨로 명시(단순 가정). */
export const GROWTH_SCENARIOS = [
  { id: "conservative", growthRatePct: -2, ko: "보수 (월 -2%)", en: "Conservative (-2%/mo)" },
  { id: "base", growthRatePct: 0, ko: "기준 (현재 유지)", en: "Base (flat)" },
  { id: "optimistic", growthRatePct: 3, ko: "낙관 (월 +3%)", en: "Optimistic (+3%/mo)" },
] as const;
export type GrowthScenarioId = (typeof GROWTH_SCENARIOS)[number]["id"];
