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
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
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

  // ── 1. 사장님 연결 조회 ──
  const { data: conn, error: connErr } = await supabase
    .from("toss_connections")
    .select("user_id, status")
    .eq("user_id", uid)
    .maybeSingle();

  if (connErr || !conn || conn.status !== "active") {
    return NextResponse.json({ ok: true, ignored: "unknown user" });
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
    return NextResponse.json({ error: "persist failed", detail: result.error }, { status: 500 });
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
