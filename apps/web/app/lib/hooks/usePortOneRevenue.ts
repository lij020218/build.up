"use client";

/**
 * usePortOneRevenue — 사장님의 PortOne 자동 동기화 매출 데이터 hook.
 *
 * - GET /api/integrations/portone/daily 호출
 * - 30분마다 자동 refetch (포어그라운드일 때만)
 * - 연결 안 한 사장님: { connected: false, entries: [] } 즉시 반환 (네트워크 호출 없음)
 *
 * 사용처: 대시보드 매출 흐름 카드 → 수동 입력과 merge 해서 표시.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type PortOneDailyEntry = {
  date: string;          // YYYY-MM-DD KST
  sales: number;
  customers: number;
  source: "portone";
  paymentCount: number;
  cancelledCount: number;
};

export type PortOneRevenueState = {
  loading: boolean;
  connected: boolean;       // 사장님이 PortOne 연결한 상태인지
  entries: PortOneDailyEntry[];
  lastFetched: number | null;
  error: string | null;
  refetch: () => Promise<void>;
};

const REFETCH_INTERVAL = 30 * 60 * 1000;         // 30분
const STATUS_CACHE_KEY = "foundone-portone-status-v1";

export function usePortOneRevenue(fromDays = 30): PortOneRevenueState {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean>(() => {
    // 첫 렌더 시 캐시된 상태 사용 → 깜빡임 방지
    if (typeof window === "undefined") return false;
    try {
      const cached = localStorage.getItem(STATUS_CACHE_KEY);
      return cached === "true";
    } catch {
      return false;
    }
  });
  const [entries, setEntries] = useState<PortOneDailyEntry[]>([]);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refetch = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) {
        setConnected(false);
        setEntries([]);
        setLoading(false);
        return;
      }

      // 1. 상태 확인 (연결 안 했으면 daily 조회 skip)
      const statusRes = await fetch("/api/integrations/portone/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const statusJson = (await statusRes.json()) as {
        ok: boolean; connected?: boolean; status?: string;
      };
      const isConnected = !!(statusJson.ok && statusJson.connected && statusJson.status === "active");
      setConnected(isConnected);
      try { localStorage.setItem(STATUS_CACHE_KEY, String(isConnected)); } catch { /* ignore */ }

      if (!isConnected) {
        setEntries([]);
        setLoading(false);
        return;
      }

      // 2. 일별 매출 조회
      const dailyRes = await fetch(`/api/integrations/portone/daily?fromDays=${fromDays}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const dailyJson = (await dailyRes.json()) as {
        ok: boolean; entries?: PortOneDailyEntry[]; error?: string;
      };
      if (!dailyJson.ok) {
        setError(dailyJson.error ?? "fetch failed");
        return;
      }
      setEntries(dailyJson.entries ?? []);
      setLastFetched(Date.now());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [fromDays]);

  // 마운트 시 1회 + 주기적 refetch
  useEffect(() => {
    void refetch();
    const id = setInterval(() => {
      // 탭이 활성 상태일 때만
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void refetch();
      }
    }, REFETCH_INTERVAL);
    return () => clearInterval(id);
  }, [refetch]);

  // 탭 다시 보임 → 즉시 refetch (오래된 데이터 방지)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.visibilityState === "visible" && lastFetched) {
        const age = Date.now() - lastFetched;
        if (age > REFETCH_INTERVAL) void refetch();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [lastFetched, refetch]);

  return { loading, connected, entries, lastFetched, error, refetch };
}
