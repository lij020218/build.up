import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { PortOneClient } from "../../_lib/portone-client";
import { payWithBillingKey, billingMethodLabelFrom } from "../../_lib/portone-billing";
import {
  PREMIUM_PRICE_KRW, PREMIUM_ORDER_NAME, addOneMonth, recordPaymentIdempotent,
} from "../../_lib/subscription";
import { BILLING_BACKEND_ENABLED } from "../../../../lib/billing-gate";

export const runtime = "nodejs";

/**
 * 정기결제 구독 시작.
 *   클라이언트가 requestIssueBillingKey 로 빌링키를 발급받아 전달 → 서버가
 *   (1) 소유권 검증 → (2) 첫 달 즉시 청구 → (3) 구독 활성화 + 빌링키 보관.
 *   이후 갱신은 /api/cron/billing-renew 가 빌링키로 자동 청구.
 */
export async function POST(request: Request) {
  // 출시 정책 가드: 9월 유료화 전엔 실제 과금 경로 전면 차단(fail-closed, 서버 전용 플래그).
  if (!BILLING_BACKEND_ENABLED) {
    return NextResponse.json({ error: "billing not enabled" }, { status: 503 });
  }
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `billing-subscribe:${auth.userId}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  let body: { billingKey?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const billingKey = body.billingKey?.trim();
  if (!billingKey) return NextResponse.json({ error: "billingKey is required" }, { status: 400 });

  const apiSecret = process.env.PORTONE_MERCHANT_API_SECRET;
  if (!apiSecret) {
    console.error("[billing/subscribe] PORTONE_MERCHANT_API_SECRET 미설정");
    return NextResponse.json({ error: "결제 설정 오류" }, { status: 503 });
  }
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || undefined;

  // 1. 빌링키 소유권 검증 — 타인 카드(빌링키)로 청구 방지.
  try {
    const client = new PortOneClient({ apiSecret, storeId });
    const bk = await client.getBillingKey(billingKey);
    if (bk.customer?.id && bk.customer.id !== auth.userId) {
      console.error(`[billing/subscribe] 빌링키 소유자 불일치: bk=${bk.customer.id} caller=${auth.userId}`);
      return NextResponse.json({ error: "빌링키 소유자가 일치하지 않습니다." }, { status: 403 });
    }
  } catch (err) {
    console.error("[billing/subscribe] 빌링키 조회 실패:", err);
    return NextResponse.json({ error: "빌링키 확인에 실패했습니다." }, { status: 502 });
  }

  // 2. 첫 달 즉시 청구.
  const paymentId = `sub-${crypto.randomUUID()}`;
  let payment;
  try {
    payment = await payWithBillingKey({
      apiSecret, storeId,
      paymentId, billingKey,
      orderName: PREMIUM_ORDER_NAME,
      amount: PREMIUM_PRICE_KRW,
      customerId: auth.userId,
    });
  } catch (err) {
    console.error("[billing/subscribe] 첫 결제 실패:", err);
    return NextResponse.json({ error: "결제에 실패했습니다. 카드 정보를 확인해 주세요." }, { status: 402 });
  }
  if (payment.status !== "PAID") {
    return NextResponse.json({ error: `결제가 완료되지 않았습니다 (${payment.status}).` }, { status: 402 });
  }
  if (payment.amount?.total !== PREMIUM_PRICE_KRW) {
    console.error(`[billing/subscribe] 금액 불일치: ${payment.amount?.total} != ${PREMIUM_PRICE_KRW}`);
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });

  // 3. 결제 이력 멱등 기록 (UNIQUE gate).
  const rec = await recordPaymentIdempotent(supabase, {
    userId: auth.userId,
    portonePaymentId: payment.paymentId || paymentId,
    amount: payment.amount.total,
    currency: payment.currency ?? "KRW",
    paidAt: payment.paidAt,
  });
  if (rec === "error") return NextResponse.json({ error: "결제 이력 저장 실패" }, { status: 500 });

  // 4. 구독 활성화 + 빌링키 보관.
  const now = new Date();
  const periodEnd = addOneMonth(now);
  const label = billingMethodLabelFrom(payment);
  const { error: subErr } = await supabase.from("foundone_subscriptions").upsert({
    user_id: auth.userId,
    plan: "premium",
    status: "active",
    billing_key: billingKey,
    billing_method_label: label,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    renewal_failure_count: 0,
    last_renewal_attempt_at: now.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: "user_id" });

  if (subErr) {
    console.error("[billing/subscribe] 구독 활성화 실패:", subErr);
    return NextResponse.json({ error: "구독 정보 저장에 실패했습니다. 고객센터에 문의해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: "premium", currentPeriodEnd: periodEnd.toISOString() });
}
