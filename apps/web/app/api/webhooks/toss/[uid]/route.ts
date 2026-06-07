/**
 * POST /api/webhooks/toss/[uid]
 *
 * Toss Payments 가 결제 상태 변경 (DONE / CANCELED / ABORTED 등) 시 호출하는 webhook.
 * 사장님별 path (uid = user_id) 로 라우팅.
 *
 * Toss 는 별도 Standard Webhooks 시그니처는 없고, IP allowlist + Secret Key 로 검증을 권장.
 * (https://docs.tosspayments.com/reference#webhook)
 *
 * 본 구현은 멱등성 (paymentKey + status) 와 정규화 변환 위주.
 *
 * 흐름:
 *   1. uid 로 toss_connections 조회
 *   2. event.data.paymentKey 멱등성 체크
 *   3. normalizeTossEvent → subscription_events upsert
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeDecrypt, type EnvelopedSecret } from "../../../_lib/envelope-crypto";
import { normalizeTossEvent, persistSubscriptionEvent } from "../../../_lib/subscription-events";

export const runtime = "nodejs";
export const maxDuration = 30;

type TossEvent = {
  eventType?: string;
  createdAt?: string;
  data: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    totalAmount?: number;
    currency?: string;
    approvedAt?: string;
    requestedAt?: string;
    customerKey?: string;
    billingKey?: string;
    orderName?: string;
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

  const rawBody = await request.text();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "DB config" }, { status: 500 });
  }

  // ── 1. 사장님 연결 조회 (webhook secret 봉투 포함) ──
  const { data: conn, error: connErr } = await supabase
    .from("toss_connections")
    .select("user_id, status, encrypted_webhook_secret, webhook_secret_iv, webhook_secret_auth_tag, webhook_secret_dek_enc, webhook_secret_dek_iv, webhook_secret_dek_auth_tag, kek_version")
    .eq("user_id", uid)
    .maybeSingle();

  if (connErr || !conn || conn.status !== "active") {
    return NextResponse.json({ ok: true, ignored: "unknown user" });
  }

  // ── 0. HMAC 시그니처 검증 — fail-closed ──
  //   사장님별 webhook secret(봉투암호화) 우선, 없으면 글로벌 env fallback.
  //   secret 미설정 또는 시그니처 헤더 누락 시 거부 — uid 만 아는 공격자의 위조 이벤트 주입 차단.
  const tossSecret = loadTossWebhookSecret(conn);
  const tossSig = request.headers.get("tosspayments-webhook-signature");
  const tossTime = request.headers.get("tosspayments-webhook-transmission-time");
  if (!tossSecret) {
    console.error("[webhooks/toss] webhook secret 미설정/복호화 실패 — 웹훅 거부 (fail-closed)");
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });
  }
  if (!tossSig || !tossTime) {
    return NextResponse.json({ error: "missing signature headers" }, { status: 401 });
  }
  // 2026-05-27 보안 (P1-3): transmission-time 5분 만료 검증 — replay attack 방어.
  const tsMs = Date.parse(tossTime);
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    return NextResponse.json({ error: "transmission time out of window" }, { status: 401 });
  }
  if (!verifyTossWebhook({ secret: tossSecret, signature: tossSig, transmissionTime: tossTime, body: rawBody })) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // ── 2. 파싱 ──
  let event: TossEvent;
  try {
    event = JSON.parse(rawBody) as TossEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // ── 3. 멱등 (paymentKey + status 조합을 webhook id 로 사용) ──
  const paymentKey = event.data.paymentKey ?? `${event.data.orderId}-${event.data.status}`;
  const dedupId = `${paymentKey}:${event.data.status ?? "unknown"}`;

  const { data: dup } = await supabase
    .from("toss_webhook_log")
    .select("webhook_id")
    .eq("webhook_id", dedupId)
    .maybeSingle();
  if (dup) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // ── 4. 정규화 + 저장 ──
  const normalized = normalizeTossEvent(event);
  if (!normalized) {
    await supabase.from("toss_webhook_log").insert({
      webhook_id: dedupId, user_id: uid, event_type: event.data.status,
    });
    return NextResponse.json({ ok: true, ignored: event.data.status });
  }

  const result = await persistSubscriptionEvent(supabase, uid, normalized);
  if (result.error) {
    console.error("[webhooks/toss] persist failed:", result.error);
    return NextResponse.json({ error: "persist failed" }, { status: 500 });
  }

  await supabase.from("toss_webhook_log").insert({
    webhook_id: dedupId, user_id: uid, event_type: event.data.status,
  });
  await supabase
    .from("toss_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", uid);

  return NextResponse.json({ ok: true, processed: normalized.eventType });
}

// ─── 내부 ─────────────────────────────────────────────────────────────

type TossConnRow = {
  encrypted_webhook_secret?: string | null;
  webhook_secret_iv?: string | null;
  webhook_secret_auth_tag?: string | null;
  webhook_secret_dek_enc?: string | null;
  webhook_secret_dek_iv?: string | null;
  webhook_secret_dek_auth_tag?: string | null;
  kek_version?: number | null;
};

/**
 * 사장님별 Toss webhook secret 로드 (portone loadWebhookSecret 패턴, fail-closed).
 *  1순위: toss_connections.encrypted_webhook_secret (+ 전용 DEK) 봉투 복호화.
 *  fallback: 글로벌 env TOSS_WEBHOOK_SECRET (사장님별 enc 미설정 시에만 — 하위호환).
 *
 *  ⚠️ enc 가 존재하는데 복호화 실패(KEK 오류 등)하면 env fallback 하지 않고 null(fail-closed).
 */
function loadTossWebhookSecret(conn: TossConnRow): string | null {
  if (conn.encrypted_webhook_secret && conn.webhook_secret_dek_enc) {
    try {
      return envelopeDecrypt({
        encryptedSecret: conn.encrypted_webhook_secret,
        secretIv: conn.webhook_secret_iv as string,
        secretAuthTag: conn.webhook_secret_auth_tag as string,
        encryptedDek: conn.webhook_secret_dek_enc,
        dekIv: conn.webhook_secret_dek_iv as string,
        dekAuthTag: conn.webhook_secret_dek_auth_tag as string,
        kekVersion: conn.kek_version ?? 1,
      } as EnvelopedSecret);
    } catch {
      console.error("[webhooks/toss] webhook secret 복호화 실패 — fail-closed, env fallback 안 함");
      return null;
    }
  }
  // 사장님별 enc 미설정 → 글로벌 env fallback (하위호환).
  return process.env.TOSS_WEBHOOK_SECRET ?? null;
}

/**
 * Toss Payments 웹훅 서명 검증.
 * signed: "{rawBody}:{tosspayments-webhook-transmission-time}"
 * header: "v1:{base64(HMAC-SHA256)} v1:{...}"
 */
function verifyTossWebhook(args: {
  secret: string;
  signature: string;
  transmissionTime: string;
  body: string;
}): boolean {
  const sigs = args.signature.split(" ").filter((s) => s.startsWith("v1:"));
  if (sigs.length === 0) return false;

  const signed = `${args.body}:${args.transmissionTime}`;
  const expected = createHmac("sha256", args.secret).update(signed).digest("base64");
  const expectedBuf = Buffer.from(expected, "base64");

  for (const sig of sigs) {
    const provided = sig.slice(3); // "v1:" 이후
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
