/**
 * GET /api/cron/billing-renew
 *
 * 매일 1회 Vercel cron. 만료된(또는 임박한) 프리미엄 구독을 빌링키로 자동 갱신.
 *
 * 상태 전이:
 *   active,  만료, cancel_at_period_end=false  → 빌링키 청구
 *        성공 → 기간 +1개월, status=active, 실패카운트=0
 *        실패 → status=past_due, 실패카운트+1 (다음날 재시도)
 *   past_due → 재청구 (성공 시 active 복귀)
 *   실패카운트 ≥ RENEWAL_MAX_FAILURES → plan=free, status=canceled (dunning 종료)
 *   cancel_at_period_end=true 이고 만료 → plan=free, status=canceled (청구 안 함)
 *
 * 인증: Vercel cron 의 Authorization: Bearer <CRON_SECRET>.
 */
import { NextResponse } from "next/server";
import { getCronSecret } from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { payWithBillingKey, billingMethodLabelFrom } from "../../_lib/portone-billing";
import {
  PREMIUM_PRICE_KRW, PREMIUM_ORDER_NAME, RENEWAL_MAX_FAILURES,
  addOneMonth, recordPaymentIdempotent,
} from "../../_lib/subscription";
import { BILLING_BACKEND_ENABLED } from "../../../../lib/billing-gate";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PER_RUN = 100;

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = getCronSecret();
  if (!secret) return false;
  return timingSafeEqualStr(token, secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 출시 정책 가드: 9월 유료화 전엔 자동 갱신 과금 비활성(fail-closed). 크론은 돌되 no-op.
  if (!BILLING_BACKEND_ENABLED) {
    return NextResponse.json({ ok: true, disabled: true, charged: 0, note: "billing backend disabled" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Missing SERVICE_ROLE_KEY" }, { status: 500 });

  const apiSecret = process.env.PORTONE_MERCHANT_API_SECRET;
  if (!apiSecret) return NextResponse.json({ error: "PORTONE_MERCHANT_API_SECRET 미설정" }, { status: 503 });
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || undefined;

  const now = new Date();
  // 만료됐거나 6시간 내 임박한 활성/연체 구독 (lapse 최소화).
  const dueBefore = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
  const { data: subs, error } = await supabase
    .from("foundone_subscriptions")
    .select("user_id, status, billing_key, cancel_at_period_end, current_period_end, renewal_failure_count, last_renewal_attempt_at")
    .eq("plan", "premium")
    .in("status", ["active", "past_due"])
    .lte("current_period_end", dueBefore)
    .order("current_period_end", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error("[billing-renew] 조회 실패:", error.message);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  let renewed = 0, canceled = 0, failed = 0, skipped = 0;

  for (const sub of subs ?? []) {
    // 같은 날 이미 시도했으면 skip (중복 청구 방지).
    if (sub.last_renewal_attempt_at) {
      const last = new Date(sub.last_renewal_attempt_at);
      if (last.toDateString() === now.toDateString()) { skipped++; continue; }
    }

    // 취소 예약 + 만료 → 청구 없이 해지.
    if (sub.cancel_at_period_end) {
      await supabase.from("foundone_subscriptions").update({
        plan: "free", status: "canceled", updated_at: now.toISOString(),
      }).eq("user_id", sub.user_id);
      canceled++;
      continue;
    }

    // 빌링키 없음 → 갱신 불가 → 해지.
    if (!sub.billing_key) {
      await supabase.from("foundone_subscriptions").update({
        plan: "free", status: "canceled", updated_at: now.toISOString(),
      }).eq("user_id", sub.user_id);
      canceled++;
      continue;
    }

    const paymentId = `renew-${crypto.randomUUID()}`;
    try {
      const payment = await payWithBillingKey({
        apiSecret, storeId,
        paymentId, billingKey: sub.billing_key,
        orderName: PREMIUM_ORDER_NAME,
        amount: PREMIUM_PRICE_KRW,
        customerId: sub.user_id,
      });
      if (payment.status !== "PAID") throw new Error(`status=${payment.status}`);

      await recordPaymentIdempotent(supabase, {
        userId: sub.user_id,
        portonePaymentId: payment.paymentId || paymentId,
        amount: payment.amount?.total ?? PREMIUM_PRICE_KRW,
        currency: payment.currency ?? "KRW",
        paidAt: payment.paidAt,
      });

      const label = billingMethodLabelFrom(payment);
      const periodEnd = addOneMonth(now);
      await supabase.from("foundone_subscriptions").update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        renewal_failure_count: 0,
        last_renewal_attempt_at: now.toISOString(),
        ...(label ? { billing_method_label: label } : {}),
        updated_at: now.toISOString(),
      }).eq("user_id", sub.user_id);
      renewed++;
    } catch (err) {
      const nextCount = (sub.renewal_failure_count ?? 0) + 1;
      const exhausted = nextCount >= RENEWAL_MAX_FAILURES;
      console.warn(`[billing-renew] 갱신 실패 user=${sub.user_id} count=${nextCount} exhausted=${exhausted}:`, (err as Error).message);
      await supabase.from("foundone_subscriptions").update({
        status: exhausted ? "canceled" : "past_due",
        ...(exhausted ? { plan: "free" } : {}),
        renewal_failure_count: nextCount,
        last_renewal_attempt_at: now.toISOString(),
        updated_at: now.toISOString(),
      }).eq("user_id", sub.user_id);
      if (exhausted) canceled++; else failed++;
    }
  }

  return NextResponse.json({ ok: true, processed: subs?.length ?? 0, renewed, canceled, failed, skipped });
}
