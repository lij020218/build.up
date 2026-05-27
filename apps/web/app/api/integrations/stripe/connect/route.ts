/**
 * POST   /api/integrations/stripe/connect      — Secret + Webhook Secret 등록
 * DELETE /api/integrations/stripe/connect      — 연결 해제
 *
 * Stripe API Secret + Webhook Signing Secret(whsec_...) 을 봉투 암호화로 저장.
 * 가벼운 검증은 webhook 첫 수신 시 자동 (실패 시 last_sync_error 기록).
 *
 * Body (POST):
 *   { apiSecret: string, webhookSecret?: string, accountId?: string }
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeEncrypt, isKekAvailable, maskSecret } from "../../../_lib/envelope-crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({
    key: `stripe-connect:${auth.userId}`, limit: 5, windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요.",
  });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  if (!isKekAvailable(1)) {
    return NextResponse.json({
      ok: false, code: "KEK_MISSING",
      error: "서버 암호화 키가 설정되지 않았습니다. (env: PORTONE_KEK_BASE64)",
    }, { status: 500 });
  }

  let body: { apiSecret?: string; webhookSecret?: string; accountId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const apiSecret = (body.apiSecret ?? "").trim();
  const webhookSecret = body.webhookSecret?.trim() || undefined;
  const accountId = body.accountId?.trim() || undefined;

  if (!apiSecret || !apiSecret.startsWith("sk_") || apiSecret.length < 30) {
    return NextResponse.json({
      ok: false, code: "INVALID_FORMAT",
      error: "Stripe Secret Key 형식이 올바르지 않습니다 (sk_live_... 또는 sk_test_...).",
    }, { status: 400 });
  }
  if (webhookSecret && !webhookSecret.startsWith("whsec_")) {
    return NextResponse.json({
      ok: false, code: "INVALID_WEBHOOK_FORMAT",
      error: "Webhook Signing Secret 은 whsec_ 로 시작해야 합니다.",
    }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB config" }, { status: 500 });

  // 봉투 암호화
  const apiEnc = envelopeEncrypt(apiSecret, 1);
  const webhookEnc = webhookSecret ? envelopeEncrypt(webhookSecret, 1) : null;

  // 동일 user 가 다시 연결 시 upsert. webhook secret 도 같은 DEK 로 묶어서 단순화.
  const row: Record<string, unknown> = {
    user_id: auth.userId,
    encrypted_secret: apiEnc.encryptedSecret,
    secret_iv: apiEnc.secretIv,
    secret_auth_tag: apiEnc.secretAuthTag,
    encrypted_dek: apiEnc.encryptedDek,
    dek_iv: apiEnc.dekIv,
    dek_auth_tag: apiEnc.dekAuthTag,
    kek_version: apiEnc.kekVersion,
    secret_mask: maskSecret(apiSecret),
    status: "active",
    account_id: accountId ?? null,
    last_validated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (webhookEnc) {
    row.encrypted_webhook_secret = webhookEnc.encryptedSecret;
    row.webhook_secret_iv = webhookEnc.secretIv;
    row.webhook_secret_auth_tag = webhookEnc.secretAuthTag;
    // webhook secret 의 DEK 는 apiSecret 과 동일 (같은 KEK 사용).
  }

  const { error: upErr } = await supabase
    .from("stripe_connections")
    .upsert(row, { onConflict: "user_id" });
  if (upErr) {
    return NextResponse.json({ ok: false, error: "저장 실패: " + upErr.message }, { status: 500 });
  }

  // webhook URL 안내
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://buildup.example.com").replace(/\/$/, "");
  return NextResponse.json({
    ok: true,
    status: "active",
    maskedSecret: maskSecret(apiSecret),
    webhookUrl: `${baseUrl}/api/webhooks/stripe/${auth.userId}`,
    instructions: webhookSecret
      ? "Stripe 콘솔 → Developers → Webhooks → 위 URL 등록 + Signing secret 일치 확인"
      : "Stripe 콘솔 → Developers → Webhooks → 위 URL 등록 후 Signing secret 추가 등록 권장",
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB config" }, { status: 500 });

  const { error } = await supabase
    .from("stripe_connections")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("user_id", auth.userId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
