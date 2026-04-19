"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

/**
 * Industry Daily Insight hook.
 *
 * 매일 1회 업종·사용자 맥락 기반 경영 인사이트 로드.
 * sessionStorage 캐시 (24h) — 동일 날짜면 재사용.
 *
 * 사용 예: TodaysFocusCard에서 "데이터 없음" 상태의 fallback으로
 */

export type IndustryInsight = {
  headline: string;
  body: string;
  action: string;
  category: "revenue" | "cost" | "marketing" | "operations" | "growth";
  generatedAt: string;
  benchmark: {
    avgMonthly: number | null;
    top10Monthly: number | null;
    bottom10Monthly: number | null;
  } | null;
};

type Input = {
  categoryId: string;
  hasUserSales: boolean;
  avgDailySales?: number;
  daysSinceLaunch?: number;
  enabled: boolean;
};

const CACHE_KEY_PREFIX = "buildup-industry-insight:";

function cacheKey(input: { categoryId: string; hasUserSales: boolean }): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${CACHE_KEY_PREFIX}${input.categoryId}:${input.hasUserSales ? "u" : "n"}:${date}`;
}

function loadCached(key: string): IndustryInsight | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as IndustryInsight;
  } catch {
    return null;
  }
}

function saveCache(key: string, insight: IndustryInsight): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(insight));
  } catch {
    // ignore
  }
}

export function useIndustryInsight(input: Input): {
  insight: IndustryInsight | null;
  loading: boolean;
  error: string | null;
} {
  const [insight, setInsight] = useState<IndustryInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.enabled || !input.categoryId) return;

    const key = cacheKey({ categoryId: input.categoryId, hasUserSales: input.hasUserSales });
    const cached = loadCached(key);
    if (cached) {
      setInsight(cached);
      return;
    }

    let cancelled = false;

    const fetchInsight = async () => {
      setLoading(true);
      setError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) {
          // 인증 없으면 fallback 메시지로 넘김 (컴포넌트에서 처리)
          setLoading(false);
          return;
        }

        const res = await fetch("/api/ai/insights/industry-daily", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categoryId: input.categoryId,
            hasUserSales: input.hasUserSales,
            avgDailySales: input.avgDailySales,
            daysSinceLaunch: input.daysSinceLaunch,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (!cancelled) setError(errData.error ?? "Failed to load insight");
          return;
        }

        const data = (await res.json()) as IndustryInsight;
        if (!cancelled) {
          setInsight(data);
          saveCache(key, data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchInsight();

    return () => {
      cancelled = true;
    };
  }, [input.enabled, input.categoryId, input.hasUserSales, input.avgDailySales, input.daysSinceLaunch]);

  return { insight, loading, error };
}
