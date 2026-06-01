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

  // 결제-사용자 바인딩: 체크아웃에서 customer.customerId 에 심은 userId 가
  // 호출자와 다르면 거부 (남의 결제를 내 구독으로 활성화하는 도용 차단).
  if (payment.customer?.id && payment.customer.id !== auth.userId) {
    console.error(`[billing/verify] Customer mismatch: payment customer=${payment.customer.id}, caller=${auth.userId}`);
    return NextResponse.json({ error: "결제자와 로그인 사용자가 일치하지 않습니다." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });

  // 중복 결제 차단: 동일 portone_payment_id 가 이미 처리됐으면 거부
  // (하나의 PAID 결제 ID 를 여러 계정이 재사용해 프리미엄을 무료 획득하는 것 방지).
  const { data: existingPayment } = await supabase
    .from("foundone_payments")
    .select("id, user_id")
    .eq("portone_payment_id", paymentId)
    .maybeSingle();
  if (existingPayment) {
    console.error(`[billing/verify] Duplicate paymentId reuse: ${paymentId} (orig user=${existingPayment.user_id}, caller=${auth.userId})`);
    return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 409 });
  }
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // 구독 활성화 (upsert)
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
    return NextResponse.json({ error: "구독 정보 저장에 실패했습니다." }, { status: 500 });
  }

  // 결제 이력 기록
  await supabase.from("foundone_payments").insert({
    user_id: auth.userId,
    portone_payment_id: paymentId,
    amount: payment.amount.total,
    currency: payment.currency ?? "KRW",
    status: "PAID",
    plan: "premium",
    paid_at: payment.paidAt ?? now.toISOString(),
  }).throwOnError();

  return NextResponse.json({
    ok: true,
    plan: "premium",
    currentPeriodEnd: periodEnd.toISOString(),
  });
}
