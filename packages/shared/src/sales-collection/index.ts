/* ─────────────────────────────────────────────
 *  sales-collection/index.ts
 *  매출 데이터 집계·변환 유틸리티
 * ───────────────────────────────────────────── */

export * from "./types";

import type { CollectedSale, CollectedDailySummary, SalesDataSource } from "./types";

/**
 * 수집된 매출 데이터를 일별로 집계
 */
export function aggregateCollectedSales(sales: CollectedSale[]): CollectedDailySummary[] {
  const byDate = new Map<string, CollectedSale[]>();
  for (const sale of sales) {
    const existing = byDate.get(sale.date) ?? [];
    existing.push(sale);
    byDate.set(sale.date, existing);
  }

  const result: CollectedDailySummary[] = [];
  for (const [date, daySales] of byDate.entries()) {
    const bySource: Record<SalesDataSource, number> = {
      manual: 0,
      "card-crefia": 0,
      "cash-receipt": 0,
      "delivery-app": 0,
      "tax-invoice": 0,
    };

    let totalAmount = 0;
    let totalFee = 0;
    let cardCount = 0;
    let cashReceiptCount = 0;
    let deliveryCount = 0;

    for (const s of daySales) {
      totalAmount += s.amount;
      totalFee += s.fee ?? 0;
      bySource[s.source] = (bySource[s.source] ?? 0) + s.amount;
      if (s.source === "card-crefia") cardCount++;
      if (s.source === "cash-receipt") cashReceiptCount++;
      if (s.source === "delivery-app") deliveryCount++;
    }

    result.push({
      date,
      totalAmount,
      totalFee,
      netAmount: totalAmount - totalFee,
      bySource,
      cardCount,
      cashReceiptCount,
      deliveryCount,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 수수료 분석 — 소스별 수수료 합산
 */
export function calculateFees(sales: CollectedSale[]): {
  totalFees: number;
  totalAmount: number;
  feeRate: number;
  bySource: Record<string, { amount: number; fees: number; feeRate: number }>;
} {
  const bySource: Record<string, { amount: number; fees: number }> = {};
  let totalFees = 0;
  let totalAmount = 0;

  for (const s of sales) {
    totalAmount += s.amount;
    totalFees += s.fee ?? 0;
    const key = s.source;
    if (!bySource[key]) bySource[key] = { amount: 0, fees: 0 };
    bySource[key].amount += s.amount;
    bySource[key].fees += s.fee ?? 0;
  }

  const result: Record<string, { amount: number; fees: number; feeRate: number }> = {};
  for (const [key, val] of Object.entries(bySource)) {
    result[key] = {
      ...val,
      feeRate: val.amount > 0 ? Math.round((val.fees / val.amount) * 1000) / 10 : 0,
    };
  }

  return {
    totalFees,
    totalAmount,
    feeRate: totalAmount > 0 ? Math.round((totalFees / totalAmount) * 1000) / 10 : 0,
    bySource: result,
  };
}
