/**
 * 구독 이벤트 정규화 — 모든 결제사(Stripe / Toss / PortOne / Custom) 공통 스키마.
 *
 * 사용 흐름:
 *   1. 각 provider webhook 핸들러가 자기 raw event 파싱
 *   2. provider-specific normalizer 로 NormalizedSubscriptionEvent 생성
 *   3. persistSubscriptionEvent() 호출 → subscription_events 에 upsert (멱등)
 *
 * 대시보드는 subscription_events 만 읽으면 결제사 종류 무관하게 일관 데이터.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionEventType =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "payment.succeeded"
  | "payment.failed"
  | "refund.created";

export type SubscriptionProvider = "stripe" | "toss" | "portone" | "custom";

export type NormalizedSubscriptionEvent = {
  provider: SubscriptionProvider;
  externalEventId: string;                  // 결제사 발급 고유 id (멱등 키)
  eventType: SubscriptionEventType;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  externalPlanId?: string | null;
  planName?: string | null;
  amount?: number;                          // 최소 단위 (원). Stripe 는 cents → 원 환산은 호출자 책임.
  currency?: string;                        // 기본 KRW
  occurredAt: string;                       // ISO8601
  raw: unknown;                             // 원본 페이로드
};

/**
 * 정규화 이벤트를 subscription_events 에 upsert (provider+externalEventId 멱등).
 * 반환값: 신규 insert 면 true, 이미 있던 dup 이면 false.
 */
export async function persistSubscriptionEvent(
  supabase: SupabaseClient,
  userId: string,
  event: NormalizedSubscriptionEvent
): Promise<{ inserted: boolean; error?: string }> {
  const { error } = await supabase.from("subscription_events").upsert(
    {
      user_id: userId,
      provider: event.provider,
      event_type: event.eventType,
      external_event_id: event.externalEventId,
      external_customer_id: event.externalCustomerId ?? null,
      external_subscription_id: event.externalSubscriptionId ?? null,
      external_plan_id: event.externalPlanId ?? null,
      plan_name: event.planName ?? null,
      amount: event.amount ?? 0,
      currency: event.currency ?? "KRW",
      occurred_at: event.occurredAt,
      raw: event.raw as Record<string, unknown>,
    },
    { onConflict: "provider,external_event_id", ignoreDuplicates: true }
  );

  if (error) {
    return { inserted: false, error: error.message };
  }
  return { inserted: true };
}

// ─── Stripe normalizer ───────────────────────────────────────────────────
// Stripe Event 의 type → 정규화 type 매핑.
const STRIPE_EVENT_MAP: Record<string, SubscriptionEventType> = {
  "customer.subscription.created":  "subscription.created",
  "customer.subscription.updated":  "subscription.updated",
  "customer.subscription.deleted":  "subscription.canceled",
  "invoice.paid":                   "payment.succeeded",
  "invoice.payment_succeeded":      "payment.succeeded",
  "invoice.payment_failed":         "payment.failed",
  "charge.refunded":                "refund.created",
};

export function normalizeStripeEvent(stripeEvent: {
  id: string;
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
}): NormalizedSubscriptionEvent | null {
  const eventType = STRIPE_EVENT_MAP[stripeEvent.type];
  if (!eventType) return null;

  const obj = stripeEvent.data.object as Record<string, unknown>;
  const customer = (obj.customer as string | null) ?? null;
  const subscription =
    (obj.subscription as string | null) ?? (obj.id as string | null) ?? null;

  // amount: invoice/charge 는 amount_paid 또는 amount(cents) → 원 환산 (KRW 라면 1, USD 라면 *환율 필요)
  // KRW 가맹점은 Stripe 가 amount 를 정수 원 단위로 청구 (decimal-less).
  const rawAmount = (obj.amount_paid ?? obj.amount ?? obj.amount_total ?? 0) as number;
  const currency = ((obj.currency as string | undefined) ?? "krw").toUpperCase();
  // KRW 는 zero-decimal currency (원 단위 그대로). USD 는 cent 단위.
  const amount = currency === "KRW" || currency === "JPY" ? rawAmount : Math.round(rawAmount / 100);

  // plan: subscription items 의 첫 plan
  let planName: string | null = null;
  let externalPlanId: string | null = null;
  const items = (obj.items as { data?: Array<{ price?: { id?: string; nickname?: string; product?: string } }> } | undefined)?.data;
  if (items && items.length > 0) {
    const price = items[0].price;
    externalPlanId = price?.id ?? null;
    planName = price?.nickname ?? null;
  }

  return {
    provider: "stripe",
    externalEventId: stripeEvent.id,
    eventType,
    externalCustomerId: customer,
    externalSubscriptionId: subscription,
    externalPlanId,
    planName,
    amount,
    currency,
    occurredAt: new Date(stripeEvent.created * 1000).toISOString(),
    raw: stripeEvent,
  };
}

// ─── Toss Payments normalizer ────────────────────────────────────────────
// Toss webhook event 의 status → 정규화 type 매핑.
//   reference: https://docs.tosspayments.com/reference#webhook
const TOSS_STATUS_MAP: Record<string, SubscriptionEventType> = {
  "DONE":            "payment.succeeded",
  "CANCELED":        "refund.created",
  "PARTIAL_CANCELED": "refund.created",
  "ABORTED":         "payment.failed",
  "EXPIRED":         "payment.failed",
};

export function normalizeTossEvent(tossEvent: {
  eventType?: string;        // "PAYMENT_STATUS_CHANGED" 등
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
}): NormalizedSubscriptionEvent | null {
  const status = tossEvent.data.status ?? "";
  const eventType = TOSS_STATUS_MAP[status];
  if (!eventType) return null;

  // Toss 는 빌링키(billingKey) 가 구독 식별자 역할
  const subscriptionId = tossEvent.data.billingKey ?? null;
  const customerId = tossEvent.data.customerKey ?? null;

  return {
    provider: "toss",
    externalEventId: tossEvent.data.paymentKey ?? `${tossEvent.data.orderId}-${status}`,
    eventType,
    externalCustomerId: customerId,
    externalSubscriptionId: subscriptionId,
    externalPlanId: null,
    planName: tossEvent.data.orderName ?? null,
    amount: tossEvent.data.totalAmount ?? 0,
    currency: tossEvent.data.currency ?? "KRW",
    occurredAt: tossEvent.data.approvedAt ?? tossEvent.data.requestedAt ?? new Date().toISOString(),
    raw: tossEvent,
  };
}
