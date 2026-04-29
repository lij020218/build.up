/**
 * POST /api/webhooks/stripe/[uid]
 *
 * Stripe 가 구독 생성/결제/취소/환불 이벤트를 호출하는 webhook.
 * 사장님별 path (uid = user_id) 로 라우팅.
 *
 * Stripe Signature 명세 (Stripe-Signature: t=...,v1=...) 준수.
 *  https://stripe.com/docs/webhooks/signatures
 *
 * 흐름:
 *   1. uid 로 stripe_connections 조회 (활성 + webhook_secret 등록 시 시그니처 검증)
 *   2. Stripe-Signature 헤더 → HMAC-SHA256 timing-safe 검증
 *   3. event.id 멱등성 체크 (stripe_webhook_log)
 *   4. 정규화 (normalizeStripeEvent) → subscription_events 에 upsert
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../_lib/envelope-crypto";
import { normalizeStripeEvent, persistSubscriptionEvent } from "../../../_lib/subscription-events";

export const runtime = "nodejs";
export const maxDuration = 30;

type StripeEvent = {
  id: string;
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  if (!uid || uid.length < 8) {
    return NextResponse.json({ error: "invalid uid" }, { status: 404 });
  }

  const rawBody = await request.text();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "DB config" }, { status: 500 });
  }

  // ── 1. 사장님 연결 조회 ──
  const { data: conn, error: connErr } = await supabase
    .from("stripe_connections")
    .select(
      "user_id, status, encrypted_webhook_secret, webhook_secret_iv, webhook_secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version"
    )
    .eq("user_id", uid)
    .maybeSingle();

  if (connErr || !conn || conn.status !== "active") {
    // 알 수 없는 사장님 / 비활성 — 200 (Stripe 무한 재시도 방지)
    return NextResponse.json({ ok: true, ignored: "unknown user" });
  }

  // ── 2. Stripe Signature 검증 ──
  const sigHeader = request.headers.get("stripe-signature") ?? "";
  if (conn.encrypted_webhook_secret && sigHeader) {
    let webhookSecret: string;
    try {
      webhookSecret = envelopeDecrypt({
        encryptedSecret: conn.encrypted_webhook_secret,
        secretIv: conn.webhook_secret_iv as string,
        secretAuthTag: conn.webhook_secret_auth_tag as string,
        encryptedDek: conn.encrypted_dek,
        dekIv: conn.dek_iv,
        dekAuthTag: conn.dek_auth_tag,
        kekVersion: conn.kek_version,
      });
    } catch {
      return NextResponse.json({ error: "decrypt webhook secret" }, { status: 500 });
    }

    const valid = verifyStripeSignature({
      secret: webhookSecret,
      signatureHeader: sigHeader,
      body: rawBody,
      toleranceSeconds: 300,
    });
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  // ── 3. 파싱 ──
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // ── 4. 멱등 ──
  const { data: dup } = await supabase
    .from("stripe_webhook_log")
    .select("webhook_id")
    .eq("webhook_id", event.id)
    .maybeSingle();
  if (dup) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // ── 5. 정규화 + 저장 ──
  const normalized = normalizeStripeEvent(event);
  if (!normalized) {
    // 처리 대상 아닌 이벤트 (예: invoice.created 같은 정보성) — 멱등 로그만
    await supabase.from("stripe_webhook_log").insert({
      webhook_id: event.id, user_id: uid, event_type: event.type,
    });
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const result = await persistSubscriptionEvent(supabase, uid, normalized);
  if (result.error) {
    return NextResponse.json({ error: "persist failed", detail: result.error }, { status: 500 });
  }

  await supabase.from("stripe_webhook_log").insert({
    webhook_id: event.id, user_id: uid, event_type: event.type,
  });
  await supabase
    .from("stripe_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", uid);

  return NextResponse.json({ ok: true, processed: normalized.eventType });
}

/**
 * Stripe Signature 검증.
 *  Stripe-Signature 헤더 형식: "t=<timestamp>,v1=<hex sig>,v1=<...>"
 *  signed payload: "<timestamp>.<raw-body>"
 *  HMAC-SHA256(secret, signed) → hex
 */
function verifyStripeSignature(args: {
  secret: string;
  signatureHeader: string;
  body: string;
  toleranceSeconds: number;
}): boolean {
  const parts = args.signatureHeader.split(",").map((p) => p.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!tPart || v1Sigs.length === 0) return false;

  const ts = parseInt(tPart.slice(2), 10);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > args.toleranceSeconds) return false;

  const signed = `${ts}.${args.body}`;
  const expected = createHmac("sha256", args.secret).update(signed).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  for (const sig of v1Sigs) {
    let providedBuf: Buffer;
    try { providedBuf = Buffer.from(sig, "hex"); } catch { continue; }
    if (providedBuf.length === expectedBuf.length && timingSafeEqual(providedBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}
