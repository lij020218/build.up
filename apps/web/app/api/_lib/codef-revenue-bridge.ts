/**
 * codef-revenue-bridge.ts
 *
 * codef_card_sales(여신금융협회 카드 매입내역) → DailyAggregateEntry 변환 (KST 기준).
 * tossplace-revenue-bridge.ts 와 동일 인터페이스.
 *
 * "카드사 통합" 매출 기준 — 사장님 사업자번호로 발생한 모든 카드매출(온·오프·배달앱 포함)의 슈퍼셋.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type CodefDailyEntry = {
  date: string;
  sales: number;
  customers: number;
  source: "codef";
  paymentCount: number;
  cancelledCount: number;
};

/** status 문자열이 취소를 의미하는지 (카드사·CODEF 표기 편차 방어). */
function isCancelled(status: unknown): boolean {
  if (typeof status !== "string") return false;
  const s = status.toLowerCase();
  return s.includes("cancel") || s.includes("취소") || s.includes("환불") || s.includes("refund");
}

export async function getCodefCardDailyEntries(
  supabase: SupabaseClient,
  userId: string,
  options: { from?: string; until?: string } = {}
): Promise<CodefDailyEntry[]> {
  const until = options.until ? new Date(options.until) : new Date();
  const from = options.from
    ? new Date(options.from)
    : new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("codef_card_sales")
    .select("amount, approved_at, status")
    .eq("user_id", userId)
    .gte("approved_at", from.toISOString())
    .lte("approved_at", until.toISOString())
    .order("approved_at", { ascending: true });

  if (error) throw new Error(`[codef-bridge] ${error.message}`);
  if (!data) return [];

  const buckets = new Map<string, CodefDailyEntry>();
  for (const row of data) {
    if (!row.approved_at) continue;
    const dateKst = toKstDate(row.approved_at);
    let bucket = buckets.get(dateKst);
    if (!bucket) {
      bucket = { date: dateKst, sales: 0, customers: 0, source: "codef", paymentCount: 0, cancelledCount: 0 };
      buckets.set(dateKst, bucket);
    }
    if (isCancelled(row.status)) {
      bucket.sales -= Number(row.amount ?? 0);
      bucket.customers = Math.max(0, bucket.customers - 1);
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
