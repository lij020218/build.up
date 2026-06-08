/**
 * portone-revenue-bridge.ts
 *
 * portone_payments (raw 결제 이력) → DailyEntry (대시보드 매출 흐름) 변환.
 *
 *  - 입력: 사장님 user_id, 기간
 *  - 처리: PAID 만 가산, CANCELLED/PARTIAL_CANCELLED 만큼 차감
 *  - 출력: { date: "YYYY-MM-DD", sales, customers }[]
 *  - 시간대: KST (Asia/Seoul) 기준 일자 grouping
 *
 * 매출 흐름 카드의 ManualEntry 와 충돌하지 않게 source: "portone" 필드로 구분.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type DailyAggregateEntry = {
  date: string;        // YYYY-MM-DD (KST)
  sales: number;       // 원
  customers: number;   // 결제 건수 (대략적인 고객 수 proxy)
  source: "portone";   // ManualEntry 와 구분
  /** 메타: 어떤 결제들이 합쳐졌는지 (디버깅·UI tooltip 용) */
  paymentCount: number;
  cancelledCount: number;
};

export type PortOneDailyOptions = {
  /** ISO datetime — 기본: 오늘로부터 30일 전 */
  from?: string;
  /** ISO datetime — 기본: 지금 */
  until?: string;
};

/**
 * PortOne 결제 데이터를 일별로 집계.
 * supabase 는 service_role 또는 사장님 본인 세션 둘 다 OK (RLS 통과).
 */
export async function getPortOneDailyEntries(
  supabase: SupabaseClient,
  userId: string,
  options: PortOneDailyOptions = {}
): Promise<DailyAggregateEntry[]> {
  const until = options.until ? new Date(options.until) : new Date();
  const from = options.from
    ? new Date(options.from)
    : new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);

  // PAID, PARTIAL_CANCELLED, CANCELLED 만 의미 있음
  const { data, error } = await supabase
    .from("portone_payments")
    .select("status, amount_total, paid_at, cancelled_at")
    .eq("user_id", userId)
    .gte("paid_at", from.toISOString())
    .lte("paid_at", until.toISOString())
    .order("paid_at", { ascending: true });

  if (error) {
    throw new Error(`[portone-bridge] query failed: ${error.message}`);
  }
  if (!data) return [];

  // 일자별 버킷 — KST 기준
  const buckets = new Map<string, DailyAggregateEntry>();

  for (const row of data) {
    if (!row.paid_at) continue;
    const dateKst = toKstDate(row.paid_at);
    let bucket = buckets.get(dateKst);
    if (!bucket) {
      bucket = {
        date: dateKst,
        sales: 0,
        customers: 0,
        source: "portone",
        paymentCount: 0,
        cancelledCount: 0,
      };
      buckets.set(dateKst, bucket);
    }

    if (row.status === "PAID") {
      bucket.sales += Number(row.amount_total ?? 0);
      bucket.customers += 1;
      bucket.paymentCount += 1;
    } else if (row.status === "CANCELLED") {
      // 전체 환불: portone_payments 는 결제 1건=row 1개(onConflict:"id") 모델이라
      // PAID→CANCELLED 전이 시 같은 row 의 status 만 바뀐다. 즉 이 매출은 애초에
      // 가산된 적이 없으므로 *차감하면 안 된다*(차감 시 음수·과소계상). 그냥 0 기여로 skip.
      bucket.cancelledCount += 1;
    } else if (row.status === "PARTIAL_CANCELLED") {
      // 부분 환불: amount_total 이 환불 후 잔액 — 그냥 그대로 가산 (이중 처리 방지)
      bucket.sales += Number(row.amount_total ?? 0);
      bucket.customers += 1;
      bucket.paymentCount += 1;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 매출 흐름 카드의 ManualEntry 와 PortOne AutoEntry 를 합치는 정책.
 *  - 같은 날짜에 둘 다 있으면 PortOne 이 우선 (실제 결제 데이터)
 *  - PortOne 이 없는 날은 Manual 그대로
 *  - 둘 다 없으면 미입력
 *
 * 이 함수는 클라이언트 사이드 (대시보드) 에서 호출.
 */
export type ManualDailyEntry = {
  date: string;
  sales: number;
  customers: number;
};

export type MergedDailyEntry = ManualDailyEntry & {
  source: "manual" | "portone" | "merged";
  portoneOverride?: boolean;
};

export function mergeManualWithPortOne(
  manual: ManualDailyEntry[],
  portone: DailyAggregateEntry[]
): MergedDailyEntry[] {
  const merged = new Map<string, MergedDailyEntry>();

  for (const m of manual) {
    merged.set(m.date, { ...m, source: "manual" });
  }
  for (const p of portone) {
    const existing = merged.get(p.date);
    if (existing) {
      // PortOne 우선
      merged.set(p.date, {
        date: p.date,
        sales: p.sales,
        customers: p.customers,
        source: "portone",
        portoneOverride: true,
      });
    } else {
      merged.set(p.date, {
        date: p.date,
        sales: p.sales,
        customers: p.customers,
        source: "portone",
      });
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── 유틸 ──────────────────────────────────────────────────────────────

/**
 * ISO datetime → KST(UTC+9) 기준 YYYY-MM-DD
 * (Date.toLocaleDateString 의 timezone 옵션은 환경마다 차이 있어 직접 변환)
 */
function toKstDate(iso: string): string {
  const d = new Date(iso);
  // KST = UTC + 9h
  const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
