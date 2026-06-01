/**
 * POST /api/webhooks/portone/[uid]
 *
 * 포트원이 결제 발생/취소 시 호출하는 webhook.
 * 사장님별 path (uid = user_id) 로 라우팅 → 어느 사장님 데이터인지 즉시 식별.
 *
 * Standard Webhooks 명세 (webhook-id, webhook-timestamp, webhook-signature) 준수.
 *
 * 흐름:
 *   1. uid 로 portone_connections 조회 (활성 + webhook_secret 등록 필요)
 *   2. raw body + 헤더 → HMAC-SHA256 시그니처 검증
 *   3. webhook-id 멱등성 체크 (이미 처리한 webhook 이면 200 즉시 반환)
 *   4. 이벤트 타입에 따라 GET /payments/{paymentId} 호출하여 상세 가져오기
 *   5. portone_payments 에 upsert
 *
 * NOTE: 본 PoC 단계에서는 webhook secret 자체 등록 UI 가 아직 없음.
 *       사장님이 포트원 콘솔에서 webhook URL 만 등록하고, secret 은 별도 환경변수 또는
 *       portone_connections 컬럼 추가로 관리. 일단 secret 검증 PASS 옵션 제공.
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../_lib/envelope-crypto";
import { PortOneClient, type PortOnePayment } from "../../../_lib/portone-client";

export const runtime = "nodejs";
export const maxDuration = 30;

// 포트원 webhook 페이로드
type WebhookEvent = {
  type: string;             // Transaction.Paid, Transaction.Cancelled, etc.
  timestamp: string;
  data: {
    storeId?: string;
    paymentId?: string;
    transactionId?: string;
    cancellationId?: string;
    billingKey?: string;
  };
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  if (!uid || uid.length < 8) {
    return NextResponse.json({ error: "invalid uid" }, { status: 404 });
  }

  // raw body 가져오기 (시그니처 검증용 — JSON parse 후엔 늦음)
  const rawBody = await request.text();

  // ── 1. 사장님 연결 조회 ──
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "DB config" }, { status: 500 });
  }
  const { data: conn, error: connErr } = await supabase
    .from("portone_connections")
    .select(
      "user_id, store_id, encrypted_secret, secret_iv, secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version, status"
    )
    .eq("user_id", uid)
    .maybeSingle();

  if (connErr || !conn || conn.status !== "active") {
    // 알 수 없는 사장님 — 200 OK (포트원 재시도 안 함)
    return NextResponse.json({ ok: true, ignored: "unknown user" });
  }

  // ── 2. 시그니처 검증 (Standard Webhooks) ──
  const webhookId = request.headers.get("webhook-id") ?? "";
  const webhookTs = request.headers.get("webhook-timestamp") ?? "";
  const webhookSig = request.headers.get("webhook-signature") ?? "";

  // 시그니처 검증 — fail-closed.
  //   secret 미설정 또는 시그니처 헤더 누락 시 처리 거부(401). 검증 안 된 이벤트를
  //   신뢰하면 uid(=user_id)만 아는 공격자가 위조 매출/결제 이벤트를 주입할 수 있음.
  //   매출 데이터는 폴링 경로(GET /payments)로 복구되므로 거부해도 유실 없음.
  //   ⚠️ 프로덕션 필수: PORTONE_WEBHOOK_SECRET 환경변수 등록.
  const webhookSecretRaw = await loadWebhookSecret(supabase, uid);
  if (!webhookSecretRaw) {
    console.error("[webhooks/portone] PORTONE_WEBHOOK_SECRET 미설정 — 웹훅 거부 (fail-closed)");
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });
  }
  if (!webhookId || !webhookTs || !webhookSig) {
    return NextResponse.json({ error: "missing signature headers" }, { status: 401 });
  }
  // 2026-05-27 보안 (P1-3): timestamp 5분 만료 — replay attack 방어.
  const tsSec = Number(webhookTs);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(tsSec) || Math.abs(nowSec - tsSec) > 300) {
    return NextResponse.json({ error: "timestamp out of window" }, { status: 401 });
  }
  const valid = verifyStandardWebhook({
    secret: webhookSecretRaw,
    id: webhookId,
    timestamp: webhookTs,
    signature: webhookSig,
    body: rawBody,
  });
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // ── 3. 멱등성 (webhook-id 중복) ──
  if (webhookId) {
    const { data: dup } = await supabase
      .from("portone_webhook_log")
      .select("webhook_id")
      .eq("webhook_id", webhookId)
      .maybeSingle();
    if (dup) {
      return NextResponse.json({ ok: true, deduped: true });
    }
  }

  // ── 4. 이벤트 파싱 ──
  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // ── 5. 결제 이벤트만 처리 ──
  const paymentEvents = ["Transaction.Paid", "Transaction.PartialCancelled", "Transaction.Cancelled", "Transaction.VirtualAccountIssued"];
  if (!paymentEvents.includes(event.type)) {
    // 멱등 로그만 남기고 200
    if (webhookId) {
      await supabase.from("portone_webhook_log").insert({
        webhook_id: webhookId,
        user_id: uid,
        event_type: event.type,
        payment_id: event.data?.paymentId ?? null,
      });
    }
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const paymentId = event.data?.paymentId;
  if (!paymentId) {
    return NextResponse.json({ error: "no paymentId" }, { status: 400 });
  }

  // ── 6. 사장님 Secret 복호화 → 상세 조회 → upsert ──
  let secret: string;
  try {
    secret = envelopeDecrypt({
      encryptedSecret: conn.encrypted_secret,
      secretIv: conn.secret_iv,
      secretAuthTag: conn.secret_auth_tag,
      encryptedDek: conn.encrypted_dek,
      dekIv: conn.dek_iv,
      dekAuthTag: conn.dek_auth_tag,
      kekVersion: conn.kek_version,
    });
  } catch (e) {
    console.error("[portone webhook] decrypt failed", e);
    return NextResponse.json({ error: "decrypt" }, { status: 500 });
  }

  const client = new PortOneClient({ apiSecret: secret, storeId: conn.store_id ?? undefined });
  let payment: PortOnePayment;
  try {
    payment = await client.getPayment(paymentId);
  } catch (e) {
    console.error("[portone webhook] get payment failed", e);
    // 200 으로 반환 — 포트원 무한 재시도 방지 (다음 polling 에서 잡힘)
    return NextResponse.json({ ok: true, error: "fetch failed", willRetryViaPolling: true });
  }

  const { error: upErr } = await supabase.from("portone_payments").upsert(
    {
      id: payment.id,
      user_id: uid,
      payment_id: payment.paymentId,
      transaction_id: payment.transactionId ?? null,
      status: payment.status,
      amount_total: Math.round(payment.amount?.total ?? 0),
      amount_tax_free: Math.round(payment.amount?.taxFree ?? 0),
      amount_vat: Math.round(payment.amount?.vat ?? 0),
      currency: payment.currency ?? "KRW",
      customer_id: payment.customer?.id ?? null,
      customer_email: payment.customer?.email ?? null,
      paid_at: payment.paidAt ?? null,
      cancelled_at: payment.cancelledAt ?? null,
      pg_provider: payment.channel?.pgProvider ?? null,
      method_type: payment.method?.type ?? null,
      raw: payment,
    },
    { onConflict: "id" }
  );

  if (upErr) {
    console.error("[portone webhook] upsert failed", upErr);
    return NextResponse.json({ error: "db upsert" }, { status: 500 });
  }

  // 멱등성 로그 + last_sync_at 업데이트
  if (webhookId) {
    await supabase.from("portone_webhook_log").insert({
      webhook_id: webhookId,
      user_id: uid,
      event_type: event.type,
      payment_id: paymentId,
    });
  }
  await supabase
    .from("portone_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", uid);

  return NextResponse.json({ ok: true, processed: event.type, paymentId });
}

// ─── 내부 ─────────────────────────────────────────────────────────────

/**
 * 사장님별 webhook secret 조회.
 * Phase 1: 환경변수 PORTONE_WEBHOOK_SECRET (글로벌 fallback).
 * Phase 2: portone_connections 에 webhook_secret_encrypted 컬럼 추가 + 봉투 복호화.
 */
async function loadWebhookSecret(
  _supabase: ReturnType<typeof getSupabaseAdmin>,
  _userId: string
): Promise<string | null> {
  return process.env.PORTONE_WEBHOOK_SECRET ?? null;
}

/**
 * Standard Webhooks 시그니처 검증.
 *  signature header 형식: "v1,<base64(HMAC-SHA256)> v1,<...>"
 *  signed payload: "<webhook-id>.<webhook-timestamp>.<raw-body>"
 */
function verifyStandardWebhook(args: {
  secret: string;
  id: string;
  timestamp: string;
  signature: string;
  body: string;
}): boolean {
  // 시그니처 헤더는 공백으로 분리된 여러 v1 시그니처일 수 있음
  const sigs = args.signature.split(" ").filter((s) => s.startsWith("v1,"));
  if (sigs.length === 0) return false;

  // 비밀 키는 보통 "whsec_..." 접두사. 디코딩 시 접두사 제거 + base64 가정.
  const secretRaw = args.secret.startsWith("whsec_") ? args.secret.slice(6) : args.secret;
  let key: Buffer;
  try {
    key = Buffer.from(secretRaw, "base64");
  } catch {
    return false;
  }

  const signed = `${args.id}.${args.timestamp}.${args.body}`;
  const expected = createHmac("sha256", key).update(signed).digest("base64");
  const expectedBuf = Buffer.from(expected, "base64");

  for (const sig of sigs) {
    const provided = sig.slice(3); // "v1," 이후
    let providedBuf: Buffer;
    try {
      providedBuf = Buffer.from(provided, "base64");
    } catch {
      continue;
    }
    if (providedBuf.length === expectedBuf.length && timingSafeEqual(providedBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}
