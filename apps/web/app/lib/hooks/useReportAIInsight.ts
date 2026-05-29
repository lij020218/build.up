"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { getReportInsightCache, setReportInsightCache, makeSnapshotHash } from "@foundone/shared";
import type { ReportSnapshot, ReportPeriod } from "./useReportSnapshot";
import type { MorningBriefingBrain } from "./useMorningBriefingBrain";
import type { ReportInsightInput } from "@foundone/ai";
import { getKstDate } from "../utils/business-day";

function buildPeriodKey(period: ReportPeriod, now: Date): string {
  if (period === "day") {
    return getKstDate(now);
  }
  if (period === "week") {
    const dow = now.getDay();
    const monOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + monOffset);
    const year = monday.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNum = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNum).padStart(2, "0")}`;
  }
  if (period === "month") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  // quarter
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

function resolveIndustryLabel(categoryId?: string): string {
  const map: Record<string, string> = {
    "food": "외식",
    "cafe": "카페",
    "restaurant": "식당",
    "retail": "소매",
    "beauty": "미용",
    "fitness": "피트니스",
    "education": "교육",
    "service": "서비스",
  };
  if (!categoryId) return "소상공인";
  for (const [key, label] of Object.entries(map)) {
    if (categoryId.toLowerCase().includes(key)) return label;
  }
  return categoryId;
}

export type ReportAIInsightState = {
  insight: string | null;
  loading: boolean;
};

export function useReportAIInsight(
  snap: ReportSnapshot,
  brain: MorningBriefingBrain,
  industryCategoryId: string | undefined,
  referenceNow?: Date
): ReportAIInsightState {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (snap.insufficientData) {
      setInsight(null);
      setLoading(false);
      return;
    }

    const now = referenceNow ?? new Date();
    const periodKey = buildPeriodKey(snap.period, now);
    const hash = makeSnapshotHash(snap.revenueKrw, snap.costsKrw, snap.primeRatePct);

    let cancelled = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchInsight() {
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !session.user?.id || cancelled) return;

        const userId = session.user.id;

        // 1. 캐시 조회
        const cached = await getReportInsightCache(
          supabase,
          userId,
          snap.period,
          periodKey,
          hash
        );

        if (cached && !cancelled) {
          setInsight(cached);
          setLoading(false);
          return;
        }

        if (cancelled) return;

        // 2. AI 호출
        const input: ReportInsightInput = {
          period: snap.period,
          periodLabel: snap.label,
          revenue: snap.revenueKrw,
          revenuePrev: snap.prevRevenueKrw,
          revenueChangePct: snap.revenueChangePct,
          marginPct: snap.marginPct,
          primeCostPct: snap.primeRatePct,
          runway: null,
          topCostItem: resolveTopCostItem(snap),
          anomaly: brain.topAnomaly?.headline ?? null,
          industry: resolveIndustryLabel(industryCategoryId),
          phase: brain.phase,
        };

        const res = await fetch("/api/ai/report/insight", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        if (!res.ok || cancelled) return;

        const data = await res.json() as { insight?: string };
        if (!data.insight || cancelled) return;

        // 3. 캐시 저장 (실패해도 무시)
        setReportInsightCache(supabase, userId, snap.period, periodKey, hash, data.insight).catch(() => {});

        setInsight(data.insight);
      } catch {
        // 오류 시 카드 비표시 — 사용자에게 에러 노출하지 않음
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInsight();

    return () => {
      cancelled = true;
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.period, snap.revenueKrw, snap.costsKrw, snap.primeRatePct, snap.insufficientData]);

  return { insight, loading };
}

function resolveTopCostItem(snap: ReportSnapshot): string | null {
  const { ingredients, labor, rent, utilities, other } = snap.costBreakdown;
  const entries: [string, number][] = [
    ["재료비", ingredients],
    ["인건비", labor],
    ["임대료", rent],
    ["공과금", utilities],
    ["기타", other],
  ];
  const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a), ["", 0]);
  return top[1] > 0 ? top[0] : null;
}
