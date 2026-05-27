/**
 * POST   /api/integrations/toss/connect    — Toss Payments Secret Key 등록
 * DELETE /api/integrations/toss/connect    — 연결 해제
 *
 * Body (POST):
 *   { apiSecret: string, clientKey?: string }
 *
 * Toss 는 표준 Standard Webhooks 시그니처가 없어 별도 webhook secret 입력란 생략.
 * IP allowlist + dedupe 로 보호.
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
    key: `toss-connect:${auth.userId}`, limit: 5, windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요.",
  });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  if (!isKekAvailable(1)) {
    return NextResponse.json({
      ok: false, code: "KEK_MISSING",
      error: "서버 암호화 키가 설정되지 않았습니다. (env: PORTONE_KEK_BASE64)",
    }, { status: 500 });
  }

  let body: { apiSecret?: string; clientKey?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const apiSecret = (body.apiSecret ?? "").trim();
  const clientKey = body.clientKey?.trim() || undefined;

  // Toss Secret Key 형식: test_sk_... / live_sk_... (참고: https://docs.tosspayments.com/reference#API_Key)
  if (!apiSecret || !/^(test|live)_sk_/.test(apiSecret) || apiSecret.length < 30) {
    return NextResponse.json({
      ok: false, code: "INVALID_FORMAT",
      error: "Toss Secret Key 형식이 올바르지 않습니다 (test_sk_... / live_sk_...).",
    }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB config" }, { status: 500 });

  const apiEnc = envelopeEncrypt(apiSecret, 1);
  const { error: upErr } = await supabase
    .from("toss_connections")
    .upsert({
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
      client_key: clientKey ?? null,
      last_validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://buildup.example.com").replace(/\/$/, "");
  return NextResponse.json({
    ok: true,
    status: "active",
    maskedSecret: maskSecret(apiSecret),
    webhookUrl: `${baseUrl}/api/webhooks/toss/${auth.userId}`,
    instructions: "토스페이먼츠 콘솔 → 개발자센터 → Webhook → 위 URL 등록",
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB config" }, { status: 500 });

  const { error } = await supabase
    .from("toss_connections")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("user_id", auth.userId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
