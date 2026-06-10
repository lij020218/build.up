/**
 * Cashflow 평균 일매출 분모 — 경과 캘린더 일수 검증 (2026-06-10, P1-3).
 *
 *  버그 패턴: computeAverageDailySales 가 합계를 *entry 개수* 로 나눔.
 *    14일 윈도우에 2일치(각 100K)만 입력 → 200K/2 = 100K/일 (7배 과대) →
 *    유입 과대 → detectCrisis 가 현금 위기를 놓침.
 *
 *  Fix: 분모 = MIN(windowDays, 가장 이른 입력일~오늘 경과 일수).
 *    "입력 안 한 날 = 0" → 보수적(과소) 추정 → 위기 감지 보호.
 *
 *  private 함수라 공개 projectCashflow 를 통해 행동 검증:
 *    수수료 0% · 부가세 off · 단일 채널 100% 비율 → 영업일 inflow == avgDailySales.
 */

import { describe, expect, it } from "vitest";
import { projectCashflow, type DailyEntry } from "../app/lib/services/cashflow-projection";
import type { SalesChannel } from "../app/lib/stores/cashflow-store";

const zeroFeeChannel: SalesChannel = {
  id: "cash",
  label: { ko: "현금", en: "Cash" },
  salesRatio: 100,
  commissionRate: 0,
  paymentFeeRate: 0,
  settlementDays: 0,
  isActive: true,
};

function firstBusinessDayInflow(entries: DailyEntry[], today: Date): number {
  const proj = projectCashflow({
    currentBalance: 0,
    recentDailyEntries: entries,
    salesChannels: [zeroFeeChannel],
    fixedExpenses: [],
    vatReserveEnabled: false,
    projectionDays: 14,
    today,
  });
  // 첫 영업일(주말 아님) 의 inflow = avgDailySales (수수료/부가세 0 이므로)
  const firstBiz = proj.find((p) => !p.isWeekend);
  return firstBiz?.inflow ?? 0;
}

describe("cashflow 평균 일매출 — 경과 일수 분모", () => {
  it("14일 윈도우에 2일치(각 100K)만 입력 → 일평균 ≈ 합계/경과일수, NOT 합계/2", () => {
    // 입력: 6/01, 6/02 각 100K. 오늘 = 6/14 → 경과 14일.
    // 옛 버그: 200K/2 = 100K/일. Fix: 200K/14 ≈ 14.3K/일.
    const entries: DailyEntry[] = [
      { date: "2026-06-01", sales: 100_000, customers: 10 },
      { date: "2026-06-02", sales: 100_000, customers: 10 },
    ];
    const inflow = firstBusinessDayInflow(entries, new Date(2026, 5, 14));
    // 200K / 14 ≈ 14,285
    expect(inflow).toBeLessThan(20_000);
    expect(inflow).toBeGreaterThan(10_000);
    // 결정적으로: 옛 버그 값(100K)의 절반 미만이어야 함 (과대추정 제거 확인)
    expect(inflow).toBeLessThan(50_000);
  });

  it("연속 14일 풀 입력(각 100K) → 일평균 == 100K (분모 14, 정상)", () => {
    const entries: DailyEntry[] = [];
    for (let day = 1; day <= 14; day++) {
      entries.push({ date: `2026-06-${String(day).padStart(2, "0")}`, sales: 100_000, customers: 10 });
    }
    const inflow = firstBusinessDayInflow(entries, new Date(2026, 5, 14));
    expect(inflow).toBe(100_000);
  });

  it("입력 없음 → 일평균 0 (NaN/위기 오탐 방지)", () => {
    const inflow = firstBusinessDayInflow([], new Date(2026, 5, 14));
    expect(inflow).toBe(0);
  });

  it("오늘 단 하루 입력 → 분모 1 (그대로 반영, 과소도 과대도 아님)", () => {
    const entries: DailyEntry[] = [{ date: "2026-06-14", sales: 80_000, customers: 8 }];
    const inflow = firstBusinessDayInflow(entries, new Date(2026, 5, 14));
    expect(inflow).toBe(80_000);
  });
});
