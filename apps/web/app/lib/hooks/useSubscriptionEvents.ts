"use client";

/**
 * useSubscriptionEvents — Stripe / Toss / PortOne / Custom 으로부터 들어온
 * 정규화된 구독 이벤트를 직접 Supabase 에서 읽어 대시보드 지표로 가공.
 *
 * 사용처: 구독제 사장님의 SubscriptionPlanManager / SaaS 핵심 지표 / MRR 트렌드.
 *
 * 반환:
 *   - mrr (이번 달 payment.succeeded 합)
 *   - mrrPrev (전월 동기간)
 *   - newSubscribersMTD (subscription.created 건수)
 *   - canceledMTD (subscription.canceled 건수)
 *   - paymentFailedMTD (payment.failed 건수)
 *   - refundsMTD (refund.created 합)
 *   - byProvider (provider 별 분포)
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type SubscriptionMetric = {
  loading: boolean;
  authed: boolean;
  // 핵심 지표
  mrr: number;                                    // 이번 달 결제 성공 합 (원)
  mrrPrev: number;                                // 전월 동기간
  mrrGrowthPct: number | null;                    // (mrr - prev) / prev * 100
  newSubscribersMTD: number;
  canceledMTD: number;
  paymentFailedMTD: number;
  refundsMTD: number;
  // raw events (최근 90일)
  events: SubscriptionEventRow[];
  byProvider: Record<string, number>;             // provider → 이벤트 수
  lastFetched: number | null;
  error: string | null;
  refetch: () => Promise<void>;
};

export type SubscriptionEventRow = {
  id: string;
  provider: "stripe" | "toss" | "portone" | "custom";
  event_type: string;
  external_event_id: string;
  external_customer_id: string | null;
  external_subscription_id: string | null;
  external_plan_id: string | null;
  plan_name: string | null;
  amount: number;
  currency: string;
  occurred_at: string;
};

const REFETCH_INTERVAL = 5 * 60 * 1000;          // 5분

export function useSubscriptionEvents(): SubscriptionMetric {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [events, setEvents] = useState<SubscriptionEventRow[]>([]);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) {
        setAuthed(false);
        setEvents([]);
        setLoading(false);
        return;
      }
      setAuthed(true);

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error: qErr } = await supabase
        .from("subscription_events")
        .select("id, provider, event_type, external_event_id, external_customer_id, external_subscription_id, external_plan_id, plan_name, amount, currency, occurred_at")
        .eq("user_id", userId)
        .gte("occurred_at", ninetyDaysAgo)
        .order("occurred_at", { ascending: false })
        .limit(500);

      if (qErr) {
        setError(qErr.message);
        setEvents([]);
      } else {
        setError(null);
        setEvents((data ?? []) as SubscriptionEventRow[]);
        setLastFetched(Date.now());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchEvents();
      }
    }, REFETCH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // ── 집계 ──
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonth = new Date(now); prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const dayOfMonth = now.getDate();

  let mrr = 0, mrrPrev = 0;
  let newSubs = 0, canceled = 0, failed = 0, refunds = 0;
  const byProvider: Record<string, number> = {};

  for (const e of events) {
    const month = e.occurred_at.slice(0, 7);
    const day = parseInt(e.occurred_at.slice(8, 10), 10);
    byProvider[e.provider] = (byProvider[e.provider] ?? 0) + 1;

    if (e.event_type === "payment.succeeded") {
      if (month === thisMonthKey) mrr += e.amount;
      else if (month === prevMonthKey && day <= dayOfMonth) mrrPrev += e.amount;
    } else if (e.event_type === "subscription.created" && month === thisMonthKey) {
      newSubs += 1;
    } else if (e.event_type === "subscription.canceled" && month === thisMonthKey) {
      canceled += 1;
    } else if (e.event_type === "payment.failed" && month === thisMonthKey) {
      failed += 1;
    } else if (e.event_type === "refund.created" && month === thisMonthKey) {
      refunds += e.amount;
    }
  }

  const mrrGrowthPct = mrrPrev > 0 ? Math.round(((mrr - mrrPrev) / mrrPrev) * 100) : null;

  return {
    loading,
    authed,
    mrr,
    mrrPrev,
    mrrGrowthPct,
    newSubscribersMTD: newSubs,
    canceledMTD: canceled,
    paymentFailedMTD: failed,
    refundsMTD: refunds,
    events,
    byProvider,
    lastFetched,
    error,
    refetch: fetchEvents,
  };
}
