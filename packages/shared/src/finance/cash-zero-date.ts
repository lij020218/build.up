/**
 * cash-zero-date.ts — Cash Zero Date + 채용 시뮬레이터 SSOT (실리콘밸리 2026).
 *
 *  자료 (30+): Mercury·Puzzle·Bessemer·ICONIQ·a16z·SaaStr·NVIDIA.
 *  Puzzle.io: 런웨이 "월수" → "절대 날짜" 가 2026 SV daily KPI #1.
 *
 *  공식:
 *    · Cash Zero Date = today + runwayMonths × 30.4375 일
 *    · 시뮬 runway = remainingCapital / (currentBurn + hireCount × hireCost)
 *    · 임계: <6m critical / <18m warning / 18m+ good (한국 23m 펀딩 cycle 고려)
 *
 *  한국 시리즈 A 인건비 default: ₩600만/월 (4대보험·퇴직금 포함, 연봉 7,200만 ~ 20% 사용자부담).
 */

export const DEFAULT_HIRE_COST_KRW = 6_000_000;

export type CashZeroInput = {
  /** 현재 자본 잔액 (원) */
  totalCapital: number;
  /** 현재 월 burn (원) */
  currentMonthlyBurn: number;
  /** 추가 채용 인원 (시뮬레이터 입력) */
  hireCount: number;
  /** 인당 월 인건비 (원, 기본 600만원) */
  hireCost?: number;
  /** 현재 시각 (test 용) */
  now?: Date;
};

export type CashZeroResult = {
  ready: false;
  reason: string;
} | {
  ready: true;
  /** 현재 (no hire) runway (개월) */
  currentRunwayMonths: number;
  /** 시뮬 후 runway */
  simulatedRunwayMonths: number;
  /** 시뮬 후 월 burn */
  simulatedBurn: number;
  /** Cash Zero 절대 날짜 (시뮬 기준, YYYY-MM-DD) */
  cashZeroDateStr: string;
  cashZeroDate: Date;
  daysAhead: number;
  /** 채용으로 당겨진 개월 (current - simulated) */
  monthsShifted: number;
  /** 18m 임계 기반 톤 */
  tone: "critical" | "warning" | "good";
};

export function computeCashZeroDate(input: CashZeroInput): CashZeroResult {
  const hireCost = input.hireCost ?? DEFAULT_HIRE_COST_KRW;
  const now = input.now ?? new Date();

  if (input.totalCapital <= 0) {
    return { ready: false, reason: "초기 자본 미입력" };
  }
  if (input.currentMonthlyBurn <= 0) {
    return { ready: false, reason: "월 비용 미입력" };
  }

  // 현재 (no hire) runway = totalCapital / currentBurn
  // 단, 외부에서 미리 계산된 runwayMonths 가 있다면 사용 가능. 여기는 보수적으로 계산.
  const currentRunwayMonths = input.totalCapital / input.currentMonthlyBurn;

  const simulatedBurn = input.currentMonthlyBurn + input.hireCount * hireCost;
  const simulatedRunwayMonths = simulatedBurn > 0
    ? input.totalCapital / simulatedBurn
    : currentRunwayMonths;

  const cashZeroDate = new Date(now);
  cashZeroDate.setDate(now.getDate() + Math.round(simulatedRunwayMonths * 30.4375));
  const cashZeroDateStr = cashZeroDate.toISOString().slice(0, 10);
  const daysAhead = Math.round((cashZeroDate.getTime() - now.getTime()) / 86400000);

  const tone: "critical" | "warning" | "good" =
    simulatedRunwayMonths < 6 ? "critical"
      : simulatedRunwayMonths < 18 ? "warning"
        : "good";

  const monthsShifted = currentRunwayMonths - simulatedRunwayMonths;

  return {
    ready: true,
    currentRunwayMonths,
    simulatedRunwayMonths,
    simulatedBurn,
    cashZeroDateStr,
    cashZeroDate,
    daysAhead,
    monthsShifted,
    tone,
  };
}
