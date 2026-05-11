/**
 * 일별 매출/고객 데이터 — 날짜 기반 윈도우 헬퍼 SSOT.
 *
 *  ── 왜 이 모듈이 필요한가 ─────────────────────────────────────
 *  사장님이 매출을 며칠치만 입력하는 케이스가 잦다.
 *  대시보드 곳곳에서 `entries.slice(-7)` 같은 *entry-count* 슬라이스를 7일 윈도우로
 *  잘못 취급하다 보니 다음과 같은 거짓 숫자가 화면에 노출됨:
 *
 *    · "최근 7일 매출 40만원" — 실제론 2일치 합계
 *    · "일 평균 13명" — 26 ÷ 입력 2일 (경과 7일 무시)
 *    · "월 예상 390명" — 거짓 외삽
 *    · 손익분기 285만원/일 — cogsRate 폭주
 *
 *  ── 원칙 ─────────────────────────────────────────────────
 *  1. 시간 윈도우는 *날짜* 로 자른다 (entry 개수 아님).
 *  2. 일 평균의 분모는 *경과 캘린더 일수* (입력 안 한 날 = 0 으로 자연 반영).
 *  3. 입력 데이터 일수가 윈도우의 절반 미만이면 신뢰도 표기 (sparse).
 *  ─────────────────────────────────────────────────────────
 */

export type DailyEntryShape = {
  date: string;       // ISO YYYY-MM-DD
  sales: number;
  customers?: number;
};

/** 오늘 자정 (KST 기준 단순화 — Date 가 로컬 타임존이라 그대로 사용) */
function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 두 날짜 사이 캘린더 일수 차이 (절대값, 0+) */
function dayDiff(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * 오늘로부터 N일 *이내* entry. (오늘 포함)
 *   예: entriesInLastDays(entries, 7) → 오늘부터 6일 전까지 7일치
 */
export function entriesInLastDays<T extends DailyEntryShape>(
  entries: T[],
  daysAgo: number,
): T[] {
  if (daysAgo <= 0) return [];
  const today = todayMidnight();
  const fromMs = today.getTime() - (daysAgo - 1) * 86_400_000;
  return entries.filter((e) => {
    const t = new Date(e.date).getTime();
    return t >= fromMs && t <= today.getTime() + 86_400_000 - 1;
  });
}

/**
 * 오늘로부터 [fromAgo, toAgo) 일 사이 entry. (이전 기간 비교용)
 *   예: entriesInWindow(entries, 14, 7) → 14일 전~8일 전 사이 7일
 */
export function entriesInWindow<T extends DailyEntryShape>(
  entries: T[],
  fromAgo: number,
  toAgo: number,
): T[] {
  if (fromAgo <= toAgo) return [];
  const today = todayMidnight();
  const fromMs = today.getTime() - (fromAgo - 1) * 86_400_000;
  const toMs = today.getTime() - (toAgo - 1) * 86_400_000;
  return entries.filter((e) => {
    const t = new Date(e.date).getTime();
    return t >= fromMs && t < toMs;
  });
}

/**
 * 경과 캘린더 일수 — entry 개수 아님.
 *   anchor: 기준 시작일 (개업일 / 첫 entry 등). null 이면 entry 의 가장 이른 날짜.
 *   max: 상한 (기본 30, 너무 오래된 데이터로 평균 잡지 않게).
 *   minimum: 하한 (기본 1, 0 나눗셈 방지).
 */
export function calendarElapsedDays(
  entries: DailyEntryShape[],
  options: { anchor?: string | null; max?: number; min?: number } = {},
): number {
  const max = options.max ?? 30;
  const min = options.min ?? 1;
  const today = todayMidnight();
  let anchorDate: Date | null = null;
  if (options.anchor) {
    anchorDate = new Date(options.anchor);
    anchorDate.setHours(0, 0, 0, 0);
  } else if (entries.length > 0) {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    anchorDate = new Date(sorted[0].date);
    anchorDate.setHours(0, 0, 0, 0);
  }
  if (!anchorDate) return min;
  const days = dayDiff(anchorDate, today) + 1;
  return Math.max(min, Math.min(max, days));
}

/**
 * 정직한 일 평균 — 분모는 MAX(entry 개수, 경과 일수).
 *   sparse 데이터일 때 과대 추정 방지.
 */
export function honestDailyAverage(
  entries: DailyEntryShape[],
  selector: (e: DailyEntryShape) => number,
  options: { anchor?: string | null; max?: number } = {},
): { avg: number; denominator: number; sumValue: number; sparse: boolean } {
  const sumValue = entries.reduce((s, e) => s + selector(e), 0);
  const elapsed = calendarElapsedDays(entries, options);
  const entryCount = entries.filter((e) => selector(e) > 0).length;
  const denominator = Math.max(entryCount, elapsed, 1);
  const avg = sumValue / denominator;
  const sparse = entryCount < elapsed / 2;
  return { avg, denominator, sumValue, sparse };
}

/**
 * 매출/고객 신뢰도 평가.
 *   sparse: entry 일수가 윈도우의 절반 미만 → UI 에 "추정" 또는 "N일 입력" 표기 권장.
 */
export function dataSparsityRatio(
  entriesInWindow: DailyEntryShape[],
  windowDays: number,
): { entries: number; ratio: number; sparse: boolean } {
  const real = entriesInWindow.filter((e) => e.sales > 0 || (e.customers ?? 0) > 0).length;
  const ratio = windowDays > 0 ? real / windowDays : 0;
  return { entries: real, ratio, sparse: ratio < 0.5 };
}
