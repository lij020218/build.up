/**
 * tossplace-revenue-bridge.ts
 *
 * tossplace_payments → DailyAggregateEntry 변환 (KST 기준).
 * portone-revenue-bridge.ts 와 동일 인터페이스.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type TossDailyEntry = {
  date: string;
  sales: number;
  customers: number;
  source: "tossplace";
  paymentCount: number;
  cancelledCount: number;
};

export async function getTossPlaceDailyEntries(
  supabase: SupabaseClient,
  userId: string,
  options: { from?: string; until?: string } = {}
): Promise<TossDailyEntry[]> {
  const until = options.until ? new Date(options.until) : new Date();
  const from = options.from
    ? new Date(options.from)
    : new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("tossplace_payments")
    .select("amount, approved_at, cancelled_at")
    .eq("user_id", userId)
    .gte("approved_at", from.toISOString())
    .lte("approved_at", until.toISOString())
    .order("approved_at", { ascending: true });

  if (error) throw new Error(`[tossplace-bridge] ${error.message}`);
  if (!data) return [];

  const buckets = new Map<string, TossDailyEntry>();
  for (const row of data) {
    if (!row.approved_at) continue;
    const dateKst = toKstDate(row.approved_at);
    let bucket = buckets.get(dateKst);
    if (!bucket) {
      bucket = { date: dateKst, sales: 0, customers: 0, source: "tossplace", paymentCount: 0, cancelledCount: 0 };
      buckets.set(dateKst, bucket);
    }
    if (row.cancelled_at) {
      // tossplace_payments 도 결제 1건=row 1개(onConflict:"id") 모델 — 취소 시 같은 row 에
      // cancelled_at 만 세팅된다. 이 매출은 가산된 적이 없으므로 차감 금지(음수·과소계상 방지). skip.
      bucket.cancelledCount += 1;
    } else {
      bucket.sales += Number(row.amount ?? 0);
      bucket.customers += 1;
      bucket.paymentCount += 1;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function toKstDate(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}
