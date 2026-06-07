import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { PortOneClient } from "../../_lib/portone-client";

export const runtime = "nodejs";

const PREMIUM_PRICE_KRW = Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_KRW ?? 19900);

function getMerchantClient() {
  const secret = process.env.PORTONE_MERCHANT_API_SECRET;
  if (!secret) throw new Error("PORTONE_MERCHANT_API_SECRET not configured");
  return new PortOneClient({ apiSecret: secret });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({
    key: `billing-verify:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  let body: { paymentId?: string; billingKey?: string; billingMethodLabel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { paymentId, billingKey, billingMethodLabel } = body;
  if (!paymentId) return NextResponse.json({ error: "paymentId is required" }, { status: 400 });

  let payment;
  try {
    const client = getMerchantClient();
    payment = await client.getPayment(paymentId);
  } catch (err) {
    console.error("[billing/verify] PortOne API error:", err);
    return NextResponse.json({ error: "결제 조회에 실패했습니다." }, { status: 502 });
  }

  if (payment.status !== "PAID") {
    return NextResponse.json({ error: `결제가 완료되지 않았습니다. 상태: ${payment.status}` }, { status: 400 });
  }
  if (payment.amount.total !== PREMIUM_PRICE_KRW) {
    console.error(`[billing/verify] Amount mismatch: expected ${PREMIUM_PRICE_KRW}, got ${payment.amount.total}`);
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  // 결제-사용자 바인딩: 체크아웃에서 customer.customerId 에 심은 userId 가 필수.
  // 없으면 소유권 검증 불가 — 거부.
  if (!payment.customer?.id) {
    console.error(`[billing/verify] Missing customer.id for paymentId=${paymentId}`);
    return NextResponse.json({ error: "결제 소유권을 확인할 수 없습니다." }, { status: 400 });
  }
  if (payment.customer.id !== auth.userId) {
    console.error(`[billing/verify] Customer mismatch: payment customer=${payment.customer.id}, caller=${auth.userId}`);
    return NextResponse.json({ error: "결제자와 로그인 사용자가 일치하지 않습니다." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });

  // setMonth overflow 방지 (1/31 → 3/3 버그): 다음 달 말일로 계산
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(1);
  periodEnd.setMonth(periodEnd.getMonth() + 2);
  periodEnd.setDate(0); // 다음 달의 0일 = 이번 달 말일

  // 멱등 게이트: payments insert 를 먼저 수행 (portone_payment_id UNIQUE 제약으로 동시 요청 차단).
  // SELECT → INSERT 비원자적 체크 대신 DB 제약을 atomic gate 로 사용.
  const { error: payInsertErr } = await supabase.from("foundone_payments").insert({
    user_id: auth.userId,
    portone_payment_id: paymentId,
    amount: payment.amount.total,
    currency: payment.currency ?? "KRW",
    status: "PAID",
    plan: "premium",
    paid_at: payment.paidAt ?? now.toISOString(),
  });

  if (payInsertErr) {
    // 23505 = unique_violation — 이미 처리된 결제
    if (payInsertErr.code === "23505") {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 409 });
    }
    console.error("[billing/verify] Payment insert error:", payInsertErr);
    return NextResponse.json({ error: "결제 이력 저장에 실패했습니다." }, { status: 500 });
  }

  // 구독 활성화 (payments insert 성공 후에만 도달)
  const { error: subError } = await supabase
    .from("foundone_subscriptions")
    .upsert({
      user_id: auth.userId,
      plan: "premium",
      status: "active",
      billing_key: billingKey ?? null,
      billing_method_label: billingMethodLabel ?? null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: "user_id" });

  if (subError) {
    console.error("[billing/verify] DB subscription upsert error:", subError);
    // 결제 이력은 이미 기록됐으므로 수동 복구 가능. 클라이언트에 재시도 안내.
    return NextResponse.json({ error: "구독 정보 저장에 실패했습니다. 고객센터에 문의해 주세요." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    plan: "premium",
    currentPeriodEnd: periodEnd.toISOString(),
  });
}
