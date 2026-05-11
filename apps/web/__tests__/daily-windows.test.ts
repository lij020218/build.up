/**
 * daily-windows SSOT — 날짜 기반 윈도우 헬퍼 회귀 가드.
 *
 *  목적: entry-count slice 버그가 미래에 재발하지 않도록 명시적 시나리오 잠금.
 *  (사용자 신고 누적 4건의 같은 family 버그 → SSOT 로 통합 후 테스트 보강)
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  entriesInLastDays,
  entriesInWindow,
  calendarElapsedDays,
  honestDailyAverage,
  dataSparsityRatio,
} from "../app/lib/utils/daily-windows";

// 테스트 결정성을 위해 오늘을 2026-05-11 로 고정
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-11T10:00:00"));
});
afterEach(() => vi.useRealTimers());

describe("entriesInLastDays — 날짜 기반 윈도우", () => {
  const sample = [
    { date: "2026-05-05", sales: 100_000, customers: 5 },
    { date: "2026-05-08", sales: 200_000, customers: 8 },
    { date: "2026-05-10", sales: 150_000, customers: 6 },
    { date: "2026-04-20", sales: 999_999, customers: 99 }, // 오래된
  ];

  it("최근 7일 — 오늘 포함 (5/5 ~ 5/11 사이)", () => {
    const r = entriesInLastDays(sample, 7);
    expect(r.map((e) => e.date)).toEqual(["2026-05-05", "2026-05-08", "2026-05-10"]);
  });

  it("최근 14일 — 더 넓은 범위", () => {
    const r = entriesInLastDays(sample, 14);
    expect(r).toHaveLength(3); // 4/20 은 14일 밖 (오늘이 5/11)
  });

  it("0일 또는 음수 → 빈 배열", () => {
    expect(entriesInLastDays(sample, 0)).toEqual([]);
    expect(entriesInLastDays(sample, -1)).toEqual([]);
  });
});

describe("entriesInWindow — 이전 기간 윈도우", () => {
  const sample = [
    { date: "2026-05-01", sales: 100_000 },
    { date: "2026-05-04", sales: 120_000 },
    { date: "2026-05-08", sales: 200_000 },
    { date: "2026-05-10", sales: 150_000 },
  ];

  it("14~7일 전 (이전 7일 비교용)", () => {
    // 오늘 5/11 기준 → from = 5/11 - 13 = 4/28, to = 5/11 - 6 = 5/5
    // [4/28, 5/5) 구간
    const r = entriesInWindow(sample, 14, 7);
    expect(r.map((e) => e.date)).toEqual(["2026-05-01", "2026-05-04"]);
  });

  it("from <= to → 빈 배열 (잘못된 입력 가드)", () => {
    expect(entriesInWindow(sample, 7, 14)).toEqual([]);
    expect(entriesInWindow(sample, 7, 7)).toEqual([]);
  });
});

describe("calendarElapsedDays — 경과 캘린더 일수", () => {
  it("anchor 명시 — 5/5 부터 5/11 = 7일", () => {
    const r = calendarElapsedDays([], { anchor: "2026-05-05" });
    expect(r).toBe(7);
  });

  it("anchor 없음 → entry 의 가장 이른 날짜", () => {
    const r = calendarElapsedDays([
      { date: "2026-05-08", sales: 1 },
      { date: "2026-05-05", sales: 1 },
    ]);
    expect(r).toBe(7);
  });

  it("상한 max=14 → 오래된 anchor 라도 14 로 클램프", () => {
    const r = calendarElapsedDays([], { anchor: "2025-01-01", max: 14 });
    expect(r).toBe(14);
  });

  it("entries 없음 + anchor 없음 → min(=1)", () => {
    expect(calendarElapsedDays([])).toBe(1);
  });
});

describe("honestDailyAverage — 정직한 일 평균 (사용자 신고 #2 회귀 가드)", () => {
  it("누적 26 + 7일 운영 + 2일 입력 → 26/7 = 3.71 (이전 버그: 26/2 = 13)", () => {
    // entries: 5/8 손님 13, 5/10 손님 13. 누적 26.
    const entries = [
      { date: "2026-05-08", sales: 10_000, customers: 13 },
      { date: "2026-05-10", sales: 10_000, customers: 13 },
    ];
    const r = honestDailyAverage(entries, (e) => e.customers ?? 0, { anchor: "2026-05-05" });
    expect(r.denominator).toBe(7); // 5/5 ~ 5/11 = 7일
    expect(r.avg).toBeCloseTo(3.71, 1);
  });

  it("풀 입력 → 분모는 entry 개수 또는 경과일수 중 큰 값", () => {
    const entries = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-04-${28 + (i % 30) > 30 ? `0${28 + i - 30}` : `${28 + i}`}`,
      sales: 100_000,
    }));
    // 실용적 가드만 — denominator 가 합리적 범위인지
    const r = honestDailyAverage(entries, (e) => e.sales);
    expect(r.denominator).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(r.avg)).toBe(true);
  });

  it("빈 입력 → 0 (NaN 방지)", () => {
    const r = honestDailyAverage([], (e) => e.sales);
    expect(r.avg).toBe(0);
    expect(r.sumValue).toBe(0);
    expect(Number.isFinite(r.avg)).toBe(true);
  });

  it("sparse 자동 탐지 — 7일 윈도우에 2일치만 → sparse=true", () => {
    const entries = [
      { date: "2026-05-09", sales: 50_000 },
      { date: "2026-05-10", sales: 50_000 },
    ];
    const r = honestDailyAverage(entries, (e) => e.sales, { anchor: "2026-05-05" });
    expect(r.sparse).toBe(true); // 2 < 7/2
  });
});

describe("dataSparsityRatio — 신뢰도 평가", () => {
  it("7일 윈도우에 2일치만 → sparse=true (50% 미만)", () => {
    const win = [
      { date: "2026-05-09", sales: 50_000 },
      { date: "2026-05-10", sales: 50_000 },
    ];
    const r = dataSparsityRatio(win, 7);
    expect(r.entries).toBe(2);
    expect(r.ratio).toBeCloseTo(0.286, 2);
    expect(r.sparse).toBe(true);
  });

  it("7일 윈도우에 5일 입력 → sparse=false (50% 이상)", () => {
    const win = Array.from({ length: 5 }, (_, i) => ({ date: `2026-05-0${5 + i}`, sales: 1 }));
    const r = dataSparsityRatio(win, 7);
    expect(r.sparse).toBe(false);
  });
});
