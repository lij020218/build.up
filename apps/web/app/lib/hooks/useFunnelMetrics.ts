"use client";

/**
 * useFunnelMetrics — v_saas_funnel_unified 에서 mode 별 funnel 4주치 시계열 fetch +
 *   현재 주 수동 입력 upsert.
 *
 * SSOT: supabase/migrations/20260519_000001_funnel_metrics.sql
 *
 *   v_saas_funnel_unified  (manual > ga4 > webhook 우선순위)
 *     ↓ SELECT (auth.uid() RLS)
 *   ConversionFunnelCard (mode 'commerce' | 'saas')
 *     ↑ upsert
 *   saas_funnel_manual_weekly  (Phase 1 수동 입력)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type FunnelMode = "commerce" | "saas";

export type FunnelRow = {
  week_start: string; // YYYY-MM-DD (ISO week, 월요일 기준)
  mode: FunnelMode;
  step_1: number;
  step_2: number;
  step_3: number;
  step_4: number;
  source: "manual" | "ga4" | "webhook" | "none";
};

export type UseFunnelMetricsResult = {
  rows: FunnelRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** 이번 주 (월요일 기준) saas_funnel_manual_weekly 에 upsert. 성공 시 자동 refetch. */
  save: (steps: [number, number, number, number]) => Promise<void>;
};

/** 현재 시각의 ISO week 의 월요일 (KST 환경 가정, JS Date 로컬 사용). */
function isoWeekMonday(now: Date = new Date()): string {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // 0 = Mon
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  // 로컬 일자 → YYYY-MM-DD (TZ shift 회피)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function useFunnelMetrics(mode: FunnelMode): UseFunnelMetricsResult {
  const [rows, setRows] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const fetchRows = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session?.user) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from("v_saas_funnel_unified")
        .select("week_start, mode, step_1, step_2, step_3, step_4, source")
        .eq("mode", mode)
        .order("week_start", { ascending: false })
        .limit(4);
      if (err) {
        setError(err.message);
        setRows([]);
      } else {
        setRows((data ?? []) as FunnelRow[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
      setRows([]);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [mode]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const save = useCallback(
    async (steps: [number, number, number, number]) => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess?.session?.user;
      if (!user) throw new Error("not authenticated");

      const weekStart = isoWeekMonday();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from("saas_funnel_manual_weekly")
        .upsert(
          {
            user_id: user.id,
            week_start: weekStart,
            mode,
            step_1: steps[0],
            step_2: steps[1],
            step_3: steps[2],
            step_4: steps[3],
          },
          { onConflict: "user_id,week_start" },
        );
      if (err) throw new Error(err.message);
      // 저장 후 view 재조회 — manual 이 ga4·webhook 우선이라 최신값으로 갱신.
      await fetchRows();
    },
    [mode, fetchRows],
  );

  return { rows, loading, error, refetch: fetchRows, save };
}
