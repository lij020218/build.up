/**
 * POST /api/webhooks/custom/[uid]
 *
 * 자체 결제/회원 시스템을 가진 고객사가 직접 우리 서비스에 이벤트를 보낼 때.
 * (B2B SaaS — Stripe/Toss/PortOne 같은 표준 결제사 대신 자체 시스템)
 *
 * Authorization: Bearer <custom_webhook_token>  ← custom_connections.token_hash 와 비교
 *
 * Body 스펙:
 *   {
 *     "eventType": "subscription.created" | "subscription.updated" | "subscription.canceled"
 *                | "payment.succeeded" | "payment.failed" | "refund.created",
 *     "externalEventId": string,                     // 멱등 키 (필수)
 *     "occurredAt": ISO8601,
 *     "customerId"?: string,
 *     "subscriptionId"?: string,
 *     "planId"?: string,
 *     "planName"?: string,
 *     "amount"?: number,                              // 원 단위
 *     "currency"?: "KRW" | "USD" | "JPY" | ...
 *   }
 */

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import {
  persistSubscriptionEvent,
  type NormalizedSubscriptionEvent,
  type SubscriptionEventType,
} from "../../../_lib/subscription-events";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_TYPES: SubscriptionEventType[] = [
  "subscription.created", "subscription.updated", "subscription.canceled",
  "payment.succeeded", "payment.failed", "refund.created",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  if (!uid || uid.length < 8) {
    return NextResponse.json({ error: "invalid uid" }, { status: 404 });
  }

  // ── 토큰 추출 (Authorization: Bearer ...) ──
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }
  const providedToken = match[1].trim();

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "DB config" }, { status: 500 });

  // ── 사장님 토큰 조회 ──
  const { data: conn } = await supabase
    .from("custom_connections")
    .select("user_id, token_hash, status")
    .eq("user_id", uid)
    .maybeSingle();

  if (!conn || conn.status !== "active") {
    return NextResponse.json({ error: "unknown user" }, { status: 401 });
  }

  // 토큰 해시 비교 (timing-safe)
  const providedHash = createHash("sha256").update(providedToken).digest();
  const storedHash = Buffer.from(conn.token_hash as string, "hex");
  if (providedHash.length !== storedHash.length || !timingSafeEqual(providedHash, storedHash)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  // ── Body 파싱 ──
  let body: {
    eventType?: string;
    externalEventId?: string;
    occurredAt?: string;
    customerId?: string;
    subscriptionId?: string;
    planId?: string;
    planName?: string;
    amount?: number;
    currency?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.eventType || !ALLOWED_TYPES.includes(body.eventType as SubscriptionEventType)) {
    return NextResponse.json({ error: "invalid eventType", allowed: ALLOWED_TYPES }, { status: 400 });
  }
  if (!body.externalEventId) {
    return NextResponse.json({ error: "missing externalEventId" }, { status: 400 });
  }

  const event: NormalizedSubscriptionEvent = {
    provider: "custom",
    externalEventId: body.externalEventId,
    eventType: body.eventType as SubscriptionEventType,
    externalCustomerId: body.customerId ?? null,
    externalSubscriptionId: body.subscriptionId ?? null,
    externalPlanId: body.planId ?? null,
    planName: body.planName ?? null,
    amount: body.amount ?? 0,
    currency: body.currency ?? "KRW",
    occurredAt: body.occurredAt ?? new Date().toISOString(),
    raw: body,
  };

  const result = await persistSubscriptionEvent(supabase, uid, event);
  if (result.error) {
    return NextResponse.json({ error: "persist failed", detail: result.error }, { status: 500 });
  }
  await supabase
    .from("custom_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", uid);

  return NextResponse.json({ ok: true, processed: event.eventType });
}
