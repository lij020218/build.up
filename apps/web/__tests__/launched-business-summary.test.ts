import { describe, expect, it } from "vitest";
import { calculateLaunchedBusinessSummary } from "../app/lib/components/surfaces/launched-business-summary";
import type { DailyEntry, MonthlyCosts } from "../app/lib/stores/finance-store";

const costs: MonthlyCosts = {
  ingredients: 100,
  labor: 200,
  rent: 300,
  utilities: 40,
  sga: 999,
  marketing: 888,
  other: 60,
  interest: 777,
};

describe("calculateLaunchedBusinessSummary", () => {
  it("KST current month entries drive sales, averages, and today's entry", () => {
    const entries: DailyEntry[] = [
      { date: "2026-06-30", sales: 9999, customers: 99 },
      { date: "2026-07-01", sales: 1000, customers: 10 },
      { date: "2026-07-02", sales: 2000, customers: 5 },
    ];

    const summary = calculateLaunchedBusinessSummary(
      entries,
      costs,
      new Date("2026-06-30T15:30:00Z"),
    );

    expect(summary.currentMonth).toBe("2026-07");
    expect(summary.today).toBe("2026-07-01");
    expect(summary.monthEntries.map((entry) => entry.date)).toEqual(["2026-07-01", "2026-07-02"]);
    expect(summary.totalSales).toBe(3000);
    expect(summary.totalCustomers).toBe(15);
    expect(summary.workingDays).toBe(2);
    expect(summary.averageDailySales).toBe(1500);
    expect(summary.averageTicket).toBe(200);
    expect(summary.todayEntry?.sales).toBe(1000);
  });

  it("preserves the launched-summary legacy cost basis", () => {
    const summary = calculateLaunchedBusinessSummary(
      [{ date: "2026-07-01", sales: 2000, customers: 4 }],
      costs,
      new Date("2026-07-01T03:00:00Z"),
    );

    expect(summary.totalCosts).toBe(700);
    expect(summary.netProfit).toBe(1300);
  });

  it("returns zero averages for empty month data", () => {
    const summary = calculateLaunchedBusinessSummary([], costs, new Date("2026-07-01T03:00:00Z"));

    expect(summary.totalSales).toBe(0);
    expect(summary.totalCustomers).toBe(0);
    expect(summary.workingDays).toBe(0);
    expect(summary.averageDailySales).toBe(0);
    expect(summary.averageTicket).toBe(0);
    expect(summary.todayEntry).toBeUndefined();
  });
});
