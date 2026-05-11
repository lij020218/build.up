/**
 * 일 평균·월 예상 — 경과 영업일수 분모 검증.
 *
 *  버그 패턴 (2026-05-11 사용자 신고):
 *    누적 26명 + 7일 운영했는데 2일치만 입력 → daysRecorded=2 → 26/2=13 → 월 390 (잘못)
 *
 *  Fix 원칙:
 *    분모 = MAX(entry 개수, 경과 영업일수)
 *    "입력 안 한 날 = 0" 으로 자연 반영 — 과대 추정 방지 (보수적).
 *
 *  Note: useDashboardComputed.tsx 의 SSOT 로직을 그대로 검증하는 순수 함수 테스트.
 */

import { describe, expect, it } from "vitest";

/**
 * SSOT 로직 미러 — useDashboardComputed.tsx 와 동일 공식.
 *  변경 시 양쪽 같이 수정 필요.
 */
function computeAvgDaily(
  cumulativeTotal: number,
  entryCount: number,
  options: {
    todayIso: string;
    businessLaunchedDate?: string | null;
    currentMonth: string;       // "2026-05"
  },
): { avgDaily: number; denominator: number; calendarElapsed: number } {
  const { todayIso, businessLaunchedDate, currentMonth } = options;
  const monthStartDate = new Date(`${currentMonth}-01T00:00:00`);
  const todayDate = new Date(`${todayIso}T00:00:00`);
  const businessStart = businessLaunchedDate ? new Date(`${businessLaunchedDate}T00:00:00`) : null;
  const effectiveStart =
    businessStart && businessStart > monthStartDate ? businessStart : monthStartDate;
  const days = Math.floor((todayDate.getTime() - effectiveStart.getTime()) / 86_400_000) + 1;
  const calendarElapsed = Math.max(1, Math.min(31, days));
  const denominator = Math.max(entryCount, calendarElapsed);
  const avgDaily = denominator > 0 ? cumulativeTotal / denominator : 0;
  return { avgDaily, denominator, calendarElapsed };
}

describe("일 평균 계산 — 경과 영업일수 분모 (사용자 신고 케이스 2026-05-11)", () => {
  it("누적 26 + 7일 운영 + 2일치 입력 → 일 평균 ~3.7 (이전 버그: 13)", () => {
    const r = computeAvgDaily(26, 2, {
      todayIso: "2026-05-11",
      businessLaunchedDate: "2026-05-05",
      currentMonth: "2026-05",
    });
    expect(r.denominator).toBe(7); // 5/5 ~ 5/11 = 7일 경과
    expect(r.avgDaily).toBeCloseTo(3.71, 1);
    expect(Math.round(r.avgDaily * 30)).toBeLessThan(150); // 월 예상 합리적
  });

  it("막 개업한 사장님 1일치 입력 → 입력값 그대로 (1로 나눔)", () => {
    const r = computeAvgDaily(15, 1, {
      todayIso: "2026-05-11",
      businessLaunchedDate: "2026-05-11",
      currentMonth: "2026-05",
    });
    expect(r.denominator).toBe(1);
    expect(r.avgDaily).toBe(15);
  });

  it("월 중반 개업 + 풀 입력 7일 → 분모 7", () => {
    const r = computeAvgDaily(140, 7, {
      todayIso: "2026-05-11",
      businessLaunchedDate: "2026-05-05",
      currentMonth: "2026-05",
    });
    expect(r.denominator).toBe(7);
    expect(r.avgDaily).toBe(20);
  });

  it("개업일 미입력 + 월초부터 운영 + 11일째 입력 5일치 → 분모 11", () => {
    const r = computeAvgDaily(100, 5, {
      todayIso: "2026-05-11",
      businessLaunchedDate: null,
      currentMonth: "2026-05",
    });
    expect(r.denominator).toBe(11);
    expect(r.avgDaily).toBeCloseTo(9.09, 1);
  });

  it("개업일이 지난 달 → 이 달 월초가 시작점", () => {
    const r = computeAvgDaily(200, 5, {
      todayIso: "2026-05-08",
      businessLaunchedDate: "2024-03-15",
      currentMonth: "2026-05",
    });
    expect(r.denominator).toBe(8); // 5/1 ~ 5/8
    expect(r.avgDaily).toBe(25);
  });

  it("매출 0 또는 빈 입력 → 평균 0 (NaN 방지)", () => {
    const r = computeAvgDaily(0, 0, {
      todayIso: "2026-05-11",
      businessLaunchedDate: "2026-05-11",
      currentMonth: "2026-05",
    });
    expect(r.avgDaily).toBe(0);
    expect(Number.isFinite(r.avgDaily)).toBe(true);
  });

  it("회귀 가드 — 분모는 항상 max(entry, calendar elapsed) 이상 (과대 평균 방지)", () => {
    // 비현실적 케이스: 1일치만 거대 입력했을 때 그게 일 평균으로 잡히면 안 됨
    const cases = [
      { cum: 1000, entry: 1, today: "2026-05-15", launched: "2026-05-01" }, // 15일 경과, 1일 입력
      { cum: 500, entry: 3, today: "2026-05-20", launched: "2026-05-03" },  // 18일 경과, 3일 입력
    ];
    for (const c of cases) {
      const r = computeAvgDaily(c.cum, c.entry, {
        todayIso: c.today,
        businessLaunchedDate: c.launched,
        currentMonth: "2026-05",
      });
      // 분모는 calendar elapsed 와 같거나 커야 함
      expect(r.denominator).toBeGreaterThanOrEqual(r.calendarElapsed);
      // 평균 × 30 은 누적의 3 배를 넘으면 안 됨 (입력 1일치로 월 예상 폭주 방지 가드)
      expect(r.avgDaily * 30).toBeLessThan(c.cum * 3.5);
    }
  });
});
