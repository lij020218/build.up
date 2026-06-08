/**
 * subscription.ts — 구독 활성화/갱신 공용 로직 (subscribe 라우트 + renew cron 공유).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const PREMIUM_PRICE_KRW = Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_KRW ?? 19900);
export const PREMIUM_ORDER_NAME = "Found.One 프리미엄 1개월";
/** 갱신 연속 실패가 이 횟수에 도달하면 구독 해지(free). */
export const RENEWAL_MAX_FAILURES = 3;

/**
 * 기준일에서 +1개월 (월말 오버플로 클램프).
 *   1/31 + 1개월 → 2/28(말일). setMonth 의 3/3 롤오버 버그 회피.
 */
export function addOneMonth(from: Date): Date {
  const d = new Date(from);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() < day) d.setDate(0); // 다음 달이 더 짧으면 말일로 클램프
  return d;
}

/**
 * 결제 이력을 멱등하게 기록. portone_payment_id UNIQUE 제약을 atomic gate 로 사용.
 *  - "ok": 신규 기록 성공
 *  - "duplicate": 이미 처리된 결제(23505) — 호출처는 구독 활성화 skip 가능
 *  - "error": 기타 DB 오류
 */
export async function recordPaymentIdempotent(
  supabase: SupabaseClient,
  p: { userId: string; portonePaymentId: string; amount: number; currency?: string; status?: string; paidAt?: string },
): Promise<"ok" | "duplicate" | "error"> {
  const { error } = await supabase.from("foundone_payments").insert({
    user_id: p.userId,
    portone_payment_id: p.portonePaymentId,
    amount: p.amount,
    currency: p.currency ?? "KRW",
    status: p.status ?? "PAID",
    plan: "premium",
    paid_at: p.paidAt ?? new Date().toISOString(),
  });
  if (!error) return "ok";
  if (error.code === "23505") return "duplicate";
  return "error";
}
