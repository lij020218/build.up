import type { DailyEntry, MonthlyCosts } from "../../stores/finance-store";
import { getKstDate } from "../../utils/business-day";

export type LaunchedBusinessSummary = {
  currentMonth: string;
  today: string;
  monthEntries: DailyEntry[];
  totalSales: number;
  totalCustomers: number;
  workingDays: number;
  averageDailySales: number;
  averageTicket: number;
  totalCosts: number;
  netProfit: number;
  todayEntry: DailyEntry | undefined;
};

export function calculateLaunchedBusinessSummary(
  dailyEntries: DailyEntry[],
  monthlyCosts: MonthlyCosts,
  now = new Date(),
): LaunchedBusinessSummary {
  const currentMonth = getKstDate(now).slice(0, 7);
  const today = getKstDate(now);
  const monthEntries = dailyEntries.filter((entry) => entry.date.startsWith(currentMonth));
  const totalSales = monthEntries.reduce((sum, entry) => sum + entry.sales, 0);
  const totalCustomers = monthEntries.reduce((sum, entry) => sum + entry.customers, 0);
  const workingDays = monthEntries.length;
  const averageDailySales = workingDays > 0 ? Math.round(totalSales / workingDays) : 0;
  const averageTicket = totalCustomers > 0 ? Math.round(totalSales / totalCustomers) : 0;

  // Preserve the existing launched-summary P&L surface: it only reflected the legacy
  // five visible cost buckets, not newer sga/marketing/interest fields.
  const totalCosts =
    monthlyCosts.ingredients +
    monthlyCosts.labor +
    monthlyCosts.rent +
    monthlyCosts.utilities +
    monthlyCosts.other;

  return {
    currentMonth,
    today,
    monthEntries,
    totalSales,
    totalCustomers,
    workingDays,
    averageDailySales,
    averageTicket,
    totalCosts,
    netProfit: totalSales - totalCosts,
    todayEntry: dailyEntries.find((entry) => entry.date === today),
  };
}
