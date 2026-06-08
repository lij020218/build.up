/**
 * 매출 브리지 취소 처리 회귀 가드 (2026-06-09).
 *   portone_payments / tossplace_payments 는 결제 1건=row 1개(onConflict:"id") 모델이라
 *   취소 시 같은 row 의 status/cancelled_at 만 바뀐다. 따라서 취소액을 "차감"하면
 *   *가산된 적 없는 금액*을 빼서 매출이 음수/과소가 된다. 취소 row 는 skip 해야 한다.
 *   (CODEF 브리지는 승인/취소가 별도 ledger 2건이라 차감이 맞음 — 여기 대상 아님.)
 */
import { describe, it, expect } from "vitest";
import { getPortOneDailyEntries } from "../app/api/_lib/portone-revenue-bridge";
import { getTossPlaceDailyEntries } from "../app/api/_lib/tossplace-revenue-bridge";

// PostgREST 빌더는 thenable + 체이닝. 최종 .order() 가 {data,error} 로 resolve.
function mockSupabase(rows: unknown[]) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "gte", "lte"]) builder[m] = () => builder;
  builder.order = () => Promise.resolve({ data: rows, error: null });
  return { from: () => builder } as never;
}

describe("portone 매출 브리지 — 취소 처리", () => {
  it("CANCELLED 는 차감하지 않고 0 기여 (PAID 만 합산)", async () => {
    const rows = [
      { status: "PAID", amount_total: 30000, paid_at: "2026-06-01T03:00:00Z", cancelled_at: null },
      { status: "CANCELLED", amount_total: 50000, paid_at: "2026-06-01T05:00:00Z", cancelled_at: "2026-06-02T00:00:00Z" },
    ];
    const result = await getPortOneDailyEntries(mockSupabase(rows), "u1");
    expect(result.length).toBe(1);            // 같은 KST 날짜 버킷
    expect(result[0].sales).toBe(30000);      // 이전 버그였다면 -20000
    expect(result[0].cancelledCount).toBe(1);
  });

  it("취소만 있는 날은 0 (음수 금지)", async () => {
    const rows = [
      { status: "CANCELLED", amount_total: 50000, paid_at: "2026-06-03T05:00:00Z", cancelled_at: "2026-06-04T00:00:00Z" },
    ];
    const result = await getPortOneDailyEntries(mockSupabase(rows), "u1");
    expect(result[0].sales).toBe(0);
  });

  it("PARTIAL_CANCELLED 는 잔액(amount_total)으로 가산", async () => {
    const rows = [
      { status: "PARTIAL_CANCELLED", amount_total: 12000, paid_at: "2026-06-05T03:00:00Z", cancelled_at: "2026-06-05T06:00:00Z" },
    ];
    const result = await getPortOneDailyEntries(mockSupabase(rows), "u1");
    expect(result[0].sales).toBe(12000);
  });
});

describe("tossplace 매출 브리지 — 취소 처리", () => {
  it("cancelled_at 있는 결제는 차감하지 않음", async () => {
    const rows = [
      { amount: 20000, approved_at: "2026-06-01T03:00:00Z", cancelled_at: null },
      { amount: 40000, approved_at: "2026-06-01T04:00:00Z", cancelled_at: "2026-06-02T00:00:00Z" },
    ];
    const result = await getTossPlaceDailyEntries(mockSupabase(rows), "u1");
    expect(result[0].sales).toBe(20000);      // 이전 버그였다면 -20000
  });
});
