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

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // 구독 활성화 (upsert)
  const { error: subError } = await supabase
    .from("buildup_subscriptions")
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
  await supabase.from("buildup_payments").insert({
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
