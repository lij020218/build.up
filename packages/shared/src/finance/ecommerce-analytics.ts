/**
 * ecommerce-analytics.ts — 이커머스 CVR·ROAS·반품률 SSOT (Phase 2f).
 *
 *  자료 (Agent B 11): Polar·Shopify·Daymark·OSC 쿠팡·Sellerking·BigCommerce.
 *
 *  공식:
 *    · CVR = conversions / clicks × 100 (Shopify 1.4% 평균, 2.5%+ 우수)
 *    · ROAS = conversionValue / spend × 100 (쿠팡 가이드 300%+, 500%+ elite)
 *    · 반품률 = returnAmount / convValue × 100 (Polar 20-30% 평균)
 */

export type AdSpendRecord = {
  id?: string;
  date: string;
  channel: string;
  spend: number;
  clicks?: number;
  conversions: number;
  conversionValue: number;
};

export type ReturnRecord = {
  id?: string;
  date: string;
  orderAmount: number;
  reason?: string;
};

export type AdAggregate = {
  spend: number;
  clicks: number;
  conversions: number;
  convValue: number;
  cvr: number;
  roas: number;
};

/** N일 윈도우 필터 (date inclusive). */
export function filterByWindow<T extends { date: string }>(
  items: readonly T[],
  windowDays: number,
  now: Date = new Date(),
): T[] {
  const nowMs = now.getTime();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const cutoff = new Date(nowMs - windowDays * 86400000).toISOString().slice(0, 10);
  return items.filter((a) => a.date >= cutoff && a.date <= todayStr);
}

/** 전체 합계 — spend/clicks/conversions/convValue/cvr/roas. */
export function aggregateAds(ads: readonly AdSpendRecord[]): AdAggregate {
  const spend = ads.reduce((s, a) => s + a.spend, 0);
  const clicks = ads.reduce((s, a) => s + (a.clicks ?? 0), 0);
  const conversions = ads.reduce((s, a) => s + a.conversions, 0);
  const convValue = ads.reduce((s, a) => s + a.conversionValue, 0);
  const cvr = clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : 0;
  const roas = spend > 0 ? Math.round((convValue / spend) * 100) : 0;
  return { spend, clicks, conversions, convValue, cvr, roas };
}

/** 채널별 aggregate. */
export type ChannelStats = AdAggregate & { channel: string };

export function aggregateByChannel(ads: readonly AdSpendRecord[]): ChannelStats[] {
  const map = new Map<string, AdSpendRecord[]>();
  for (const a of ads) {
    const arr = map.get(a.channel) ?? [];
    arr.push(a);
    map.set(a.channel, arr);
  }
  return Array.from(map.entries())
    .map(([channel, group]) => ({ channel, ...aggregateAds(group) }))
    .sort((a, b) => b.spend - a.spend);
}

/** 반품률 — returnAmount / convValue × 100. */
export function returnRate(
  returns: readonly ReturnRecord[],
  convValue: number,
): { count: number; amount: number; rate: number } {
  const amount = returns.reduce((s, r) => s + r.orderAmount, 0);
  const rate = convValue > 0
    ? Math.round((amount / convValue) * 100 * 10) / 10
    : 0;
  return { count: returns.length, amount, rate };
}

/** 반품 사유 top N. */
export function topReturnReasons(
  returns: readonly ReturnRecord[],
  n: number = 3,
): Array<{ reason: string; count: number }> {
  const counts = new Map<string, number>();
  for (const r of returns) {
    const key = r.reason ?? "기타";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * ROAS 평가 (한국 이커머스 기준 — Sellerking/OSC 쿠팡).
 */
export type RoasGrade = "elite" | "good" | "ok" | "low" | "critical";

export function gradeRoas(roas: number): RoasGrade {
  if (roas >= 500) return "elite";
  if (roas >= 400) return "good";
  if (roas >= 300) return "ok";
  if (roas >= 200) return "low";
  return "critical";
}

/** CVR 평가 (Shopify 평균 1.4%). */
export type CvrGrade = "elite" | "good" | "average" | "low";

export function gradeCvr(cvr: number): CvrGrade {
  if (cvr >= 3.0) return "elite";
  if (cvr >= 2.0) return "good";
  if (cvr >= 1.0) return "average";
  return "low";
}
