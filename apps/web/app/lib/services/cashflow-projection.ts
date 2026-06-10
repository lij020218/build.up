/**
 * Cash-flow Projection 엔진.
 * 14일 현금흐름 예측 + 위기 감지.
 *
 * 원리:
 * - 최근 N일(기본 14) 평균 일매출 × 채널별 비율 × (1 - 수수료) → 정산일별 입금
 * - 고정비 캘린더: dayOfMonth가 예측 범위 안에 들어오면 차감
 * - 현재 잔고 + 누적 순흐름 = 일별 종료 잔고
 * - 크라이시스 임계일 내 음수 발생 시 경고
 */

import type { SalesChannel, FixedExpenseSchedule } from "../stores/cashflow-store";

export type DailyEntry = { date: string; sales: number; customers: number };

export type CashflowEvent = {
  id: string;
  type: "inflow" | "outflow";
  amount: number;
  label: { ko: string; en: string };
  sourceChannel?: string;        // salesChannel id
  sourceExpenseId?: string;       // fixedExpense id
};

export type DayProjection = {
  date: string;                   // ISO "2026-04-18"
  dayOfWeek: number;              // 0 (Sun) ~ 6 (Sat)
  isWeekend: boolean;
  inflow: number;
  outflow: number;
  startBalance: number;
  endBalance: number;
  events: CashflowEvent[];
};

export type CrisisDetection = {
  willCrisis: boolean;
  crisisDay: string | null;        // ISO date where balance goes negative (first)
  daysUntilCrisis: number | null;   // 오늘로부터 며칠 후
  shortfallAmount: number;          // 크라이시스일 결손 절대값
  safeDays: number;                 // 안전하게 유지되는 일수 (크라이시스 직전까지)
  lowestBalance: number;            // 14일 중 최저 잔고
  lowestDay: string | null;         // 최저 잔고 날짜
};

export type ProjectionInput = {
  currentBalance: number;
  recentDailyEntries: DailyEntry[];
  salesChannels: SalesChannel[];
  fixedExpenses: FixedExpenseSchedule[];
  vatReserveEnabled: boolean;       // 매출의 N% 부가세 적립 (vatRate 로 비율 지정)
  /** 부가세율 — 일반 0.10 / 간이 0.03 평균. 미지정 시 0.10. */
  vatRate?: number;
  projectionDays?: number;          // 기본 14
  today?: Date;                      // 테스트용 주입
  /**
   * Fallback 월 고정비 총액 (사용자가 cashflow-store 의 fixedExpenses 를 별도 설정 안 했지만
   * 대시보드 monthlyCosts 에 비용 입력은 있을 때).
   * fixedExpenses 가 비어있고 이 값이 > 0 이면 영업일에 균등 분배해 outflow 로 반영.
   * 사용자 실제 데이터를 기반으로 가짜 예측 곡선 방지.
   */
  fallbackMonthlyCostsTotal?: number;
};

/**
 * 영업일(월~금) 기준으로 정산일 조정.
 * 정산 예정일이 주말이면 다음 월요일로 이월.
 */
function toBusinessDay(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() + 1); // Sun → Mon
  else if (day === 6) d.setDate(d.getDate() + 2); // Sat → Mon
  return d;
}

/**
 * ISO "YYYY-MM-DD" 문자열로 변환 (로컬 타임존 기준).
 */
function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 최근 N일 평균 일매출 계산.
 *
 *  ⚠️ 분모는 *경과 캘린더 일수* — entry 개수로 나누면 안 됨.
 *     버그 패턴: 14일 윈도우에 2일치만 입력 → 합계/2 → 일평균 7배 과대 →
 *     유입(inflow) 과대 → detectCrisis 가 현금 위기를 놓침 (보수성 원칙 위배).
 *     "입력 안 한 날 = 0" 으로 자연 반영해 과소(보수) 추정 — useMorningBriefingBrain
 *     의 avgDailySales7 / daily-avg-elapsed-days.test.ts 와 동일 방식.
 *
 *  분모 = MIN(windowDays, 가장 이른 입력일 ~ 오늘 경과 일수), 최소 1.
 *  기록 기간이 0/음수면 0 반환 (계산 불가 가드).
 */
function computeAverageDailySales(entries: DailyEntry[], windowDays: number = 14, today: Date = new Date()): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-windowDays);
  if (recent.length === 0) return 0;
  const sum = recent.reduce((s, e) => s + e.sales, 0);
  // 윈도우 내 가장 이른 입력일부터 오늘까지 경과한 캘린더 일수 (입력 안 한 날도 분모에 포함).
  //  ⚠️ today 는 projectCashflow 에서 주입 (테스트 결정성 + 주입된 기준일 일관성).
  const earliestMs = new Date(`${recent[0].date}T00:00:00`).getTime();
  const todayMs = new Date(`${toIso(today)}T00:00:00`).getTime();
  if (!Number.isFinite(earliestMs) || !Number.isFinite(todayMs)) return 0;
  const elapsedDays = Math.floor((todayMs - earliestMs) / 86_400_000) + 1;
  const denominator = Math.min(windowDays, Math.max(1, elapsedDays));
  if (denominator <= 0) return 0;
  return sum / denominator;
}

/**
 * 어떤 날짜(`predictDate`)에 들어올 예상 입금 = 이전 N일 중 settlementDays 일 전 매출의 정산.
 * 단순화: 평균 일매출 × 채널 비율 × (1 - 수수료).
 */
function computeDayInflow(
  predictDate: Date,
  averageDailySales: number,
  channels: SalesChannel[],
  vatReserveEnabled: boolean,
  vatRate: number = 0.10  // 일반과세 10%. simplified 면 호출 측에서 0.03 전달.
): CashflowEvent[] {
  const events: CashflowEvent[] = [];

  for (const channel of channels) {
    if (!channel.isActive || channel.salesRatio <= 0) continue;

    // 이 채널의 매출은 settlementDays 전 발생 → 오늘 정산
    // "오늘 들어올 돈 = 옛날 매출 × 비율 × (1 - 수수료)"
    const grossAmount = averageDailySales * (channel.salesRatio / 100);
    if (grossAmount <= 0) continue;

    // 수수료 & PG 수수료 차감
    const feeRate = (channel.commissionRate + channel.paymentFeeRate) / 100;
    let netAmount = grossAmount * (1 - feeRate);

    // 부가세 적립 — 일반과세 10% / 간이과세 ~3% (호출 측에서 vatRate 결정)
    if (vatReserveEnabled) {
      netAmount = netAmount * (1 - vatRate);
    }

    // 정산일 조정 (주말 회피) — predictDate 자체가 영업일이어야 함
    // 여기서는 이미 영업일 변환된 날짜만 들어온다고 가정
    events.push({
      id: `inflow-${channel.id}-${toIso(predictDate)}`,
      type: "inflow",
      amount: Math.round(netAmount),
      label: {
        ko: `${channel.label.ko} 정산`,
        en: `${channel.label.en} settlement`,
      },
      sourceChannel: channel.id,
    });
  }

  return events;
}

/**
 * 특정 날짜에 발생할 고정비 이벤트.
 */
function computeDayOutflow(
  predictDate: Date,
  expenses: FixedExpenseSchedule[]
): CashflowEvent[] {
  const events: CashflowEvent[] = [];
  const dayOfMonth = predictDate.getDate();
  // 말일 처리: 사용자가 31일 설정했는데 그 달이 28/30일만 있으면 말일에 발생
  const lastDayOfMonth = new Date(predictDate.getFullYear(), predictDate.getMonth() + 1, 0).getDate();

  for (const expense of expenses) {
    if (!expense.isActive || expense.amount <= 0) continue;
    const triggers =
      expense.dayOfMonth === dayOfMonth ||
      (expense.dayOfMonth > lastDayOfMonth && dayOfMonth === lastDayOfMonth);
    if (!triggers) continue;

    events.push({
      id: `outflow-${expense.id}-${toIso(predictDate)}`,
      type: "outflow",
      amount: expense.amount,
      label: {
        ko: expense.label,
        en: expense.label, // 사용자 입력은 한글일 확률 높음, en 번역은 라벨러 뒤 처리
      },
      sourceExpenseId: expense.id,
    });
  }

  return events;
}

/**
 * 메인: 14일 예측 시퀀스 생성.
 */
export function projectCashflow(input: ProjectionInput): DayProjection[] {
  const { currentBalance, recentDailyEntries, salesChannels, fixedExpenses, vatReserveEnabled, fallbackMonthlyCostsTotal } = input;
  const vatRate = input.vatRate ?? 0.10;
  const projectionDays = input.projectionDays ?? 14;
  const today = input.today ? new Date(input.today) : new Date();
  today.setHours(0, 0, 0, 0);

  const avgDailySales = computeAverageDailySales(recentDailyEntries, 14, today);
  const projections: DayProjection[] = [];
  let runningBalance = currentBalance;

  // ── Fallback outflow: fixedExpenses 비어있고 사용자 monthlyCosts 입력은 있을 때
  //    월 비용을 26 영업일에 균등 분배해 일일 outflow 로 반영 (가짜 예측 방지)
  const useFallbackOutflow = fixedExpenses.length === 0 && (fallbackMonthlyCostsTotal ?? 0) > 0;
  const fallbackDailyOutflow = useFallbackOutflow
    ? Math.round((fallbackMonthlyCostsTotal as number) / 26)
    : 0;

  for (let i = 0; i < projectionDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Inflow는 영업일에만 (주말엔 정산 이월)
    const inflowEvents = isWeekend
      ? []
      : computeDayInflow(date, avgDailySales, salesChannels, vatReserveEnabled, vatRate);
    // Outflow는 모든 날 (고정비는 주말도 발생 가능 — 예: 월세 25일이 토요일이어도 이체)
    const outflowEvents = computeDayOutflow(date, fixedExpenses);

    // Fallback: fixedExpenses 비어있을 때 월 비용을 영업일에 균등 분배
    if (useFallbackOutflow && !isWeekend && fallbackDailyOutflow > 0) {
      outflowEvents.push({
        id: `outflow-fallback-${toIso(date)}`,
        type: "outflow",
        amount: fallbackDailyOutflow,
        label: { ko: "월 고정비 (일할)", en: "Daily fixed costs" },
      });
    }

    const dayInflow = inflowEvents.reduce((s, e) => s + e.amount, 0);
    const dayOutflow = outflowEvents.reduce((s, e) => s + e.amount, 0);

    const startBalance = runningBalance;
    const endBalance = startBalance + dayInflow - dayOutflow;
    runningBalance = endBalance;

    projections.push({
      date: toIso(date),
      dayOfWeek,
      isWeekend,
      inflow: dayInflow,
      outflow: dayOutflow,
      startBalance,
      endBalance,
      events: [...inflowEvents, ...outflowEvents],
    });
  }

  return projections;
}

/**
 * 위기 감지: `thresholdDays` 내 잔고가 음수로 가는 첫 날짜.
 */
export function detectCrisis(
  projections: DayProjection[],
  thresholdDays: number = 3
): CrisisDetection {
  const within = projections.slice(0, thresholdDays);
  const negative = within.find((p) => p.endBalance < 0);

  // 14일 전체 중 최저 잔고
  let lowestBalance = projections[0]?.startBalance ?? 0;
  let lowestDay: string | null = null;
  for (const p of projections) {
    if (p.endBalance < lowestBalance) {
      lowestBalance = p.endBalance;
      lowestDay = p.date;
    }
  }

  if (!negative) {
    // 크라이시스 내엔 안전, 하지만 전체 14일 중엔 음수 가능
    const fullScanNegative = projections.find((p) => p.endBalance < 0);
    const safeDays = fullScanNegative
      ? projections.findIndex((p) => p.date === fullScanNegative.date)
      : projections.length;
    return {
      willCrisis: false,
      crisisDay: null,
      daysUntilCrisis: fullScanNegative ? projections.findIndex((p) => p.date === fullScanNegative.date) : null,
      shortfallAmount: fullScanNegative ? Math.abs(fullScanNegative.endBalance) : 0,
      safeDays,
      lowestBalance,
      lowestDay,
    };
  }

  const crisisIndex = projections.findIndex((p) => p.date === negative.date);
  return {
    willCrisis: true,
    crisisDay: negative.date,
    daysUntilCrisis: crisisIndex,
    shortfallAmount: Math.abs(negative.endBalance),
    safeDays: crisisIndex,
    lowestBalance,
    lowestDay,
  };
}

/**
 * 헬퍼: 다음 주요 이벤트 (입금/지출) 찾기.
 */
export function findUpcomingEvents(
  projections: DayProjection[],
  limit: number = 5
): { nextInflow: CashflowEvent & { date: string } | null; nextOutflow: CashflowEvent & { date: string } | null; upcoming: Array<CashflowEvent & { date: string }> } {
  const flatEvents: Array<CashflowEvent & { date: string }> = [];
  for (const p of projections) {
    for (const e of p.events) {
      flatEvents.push({ ...e, date: p.date });
    }
  }
  const sorted = flatEvents.sort((a, b) => a.date.localeCompare(b.date));

  const nextInflow = sorted.find((e) => e.type === "inflow") ?? null;
  const nextOutflow = sorted.find((e) => e.type === "outflow") ?? null;

  return {
    nextInflow,
    nextOutflow,
    upcoming: sorted.slice(0, limit),
  };
}

/**
 * 헬퍼: 채널 비율 합계 (validation용).
 */
export function sumActiveChannelRatios(channels: SalesChannel[]): number {
  return channels.filter((c) => c.isActive).reduce((s, c) => s + c.salesRatio, 0);
}

/**
 * 수수료 임팩트 계산 (대시보드 "실입금 vs 총매출" 표시용).
 */
export function computeChannelImpact(
  channel: SalesChannel,
  monthlyGrossSales: number
): { gross: number; commission: number; paymentFee: number; net: number } {
  const gross = monthlyGrossSales * (channel.salesRatio / 100);
  const commission = gross * (channel.commissionRate / 100);
  const paymentFee = gross * (channel.paymentFeeRate / 100);
  const net = gross - commission - paymentFee;
  return { gross, commission, paymentFee, net };
}
