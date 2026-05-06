"use client";

/**
 * useUnifiedSaasMetrics — 스타트업 사장님 제품의 사용자 수 자동 수집 통합 훅.
 *
 * 데이터 출처: v_saas_metrics_unified view (소스 우선순위 적용 — ga4 > amplitude > webhook > manual)
 *   하나의 (user, date) 당 1줄 → DailyKpiStrip 셀에 즉시 주입 가능.
 *
 * 사용처: OperationalDashboard 의 DailyKpiStrip values 매핑.
 *
 * 가드: 스타트업 업종이 아니면 빈 결과 반환 (네트워크 호출 X).
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";

export type SaasDailyEntry = {
  date: string;
  source: string;
  active_users: number | null;
  weekly_active_users: number | null;
  monthly_active_users: number | null;
  new_users: number | null;
  signups: number | null;
  churns: number | null;
  cumulative_users: number | null;
};

export type UnifiedSaasMetricsState = {
  loading: boolean;
  /** 최소 1개 채널이라도 연결되어 데이터가 있는지 */
  anyConnected: boolean;
  entries: SaasDailyEntry[];
  /** 어제(또는 가장 최근) 일자의 지표 (DailyKpiStrip 즉시 표시용) */
  latest: SaasDailyEntry | null;
  /** 7일 평균 / 30일 누적 등 가공 */
  avg7DayDau: number | null;
  total30DayNewUsers: number | null;
  refetch: () => Promise<void>;
};

const REFETCH_INTERVAL = 30 * 60 * 1000;

export function useUnifiedSaasMetrics(opts: {
  industryCategoryId?: string | null;
  fromDays?: number;
}): UnifiedSaasMetricsState {
  const isStartup = opts.industryCategoryId === "startup-tech";
  const fromDays = opts.fromDays ?? 30;

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<SaasDailyEntry[]>([]);
  const inFlight = useRef(false);

  const refetch = useCallback(async () => {
    if (!isStartup || inFlight.current) return;
    inFlight.current = true;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) {
        setEntries([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/integrations/saas-metrics/daily?fromDays=${fromDays}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        setEntries([]);
        return;
      }
      const d = await res.json();
      if (d.ok && Array.isArray(d.entries)) {
        setEntries(d.entries as SaasDailyEntry[]);
      }
    } catch {
      /* keep prior */
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [isStartup, fromDays]);

  useEffect(() => {
    if (!isStartup) {
      setLoading(false);
      setEntries([]);
      return;
    }
    void refetch();
    const id = setInterval(() => void refetch(), REFETCH_INTERVAL);
    return () => clearInterval(id);
  }, [isStartup, refetch]);

  // 가공
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const last7 = sorted.slice(-7);
  const avg7DayDau =
    last7.length > 0
      ? Math.round(
          (last7.reduce((s, r) => s + (r.active_users ?? 0), 0) / last7.length) * 10,
        ) / 10
      : null;
  const total30DayNewUsers =
    sorted.length > 0 ? sorted.reduce((s, r) => s + (r.new_users ?? 0), 0) : null;

  return {
    loading,
    anyConnected: entries.length > 0,
    entries: sorted,
    latest,
    avg7DayDau,
    total30DayNewUsers,
    refetch,
  };
}
