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

/**
 * 인사이트 우선순위 — 사장님 화면에 우선순위 배지로 노출.
 * `high` 1개 + `medium` 1개 + `low` 1개 가 표준 (정확히 3개).
 */
export type InsightPriority = "high" | "medium" | "low";

export type SingleInsight = {
  headline: string;
  body: string;
  /** CTA 라벨 — "매출 기록하기" 같은 짧은 동사구 */
  action: string;
  category: "revenue" | "cost" | "marketing" | "operations" | "growth";
  /**
   * AI 가 직접 지정한 도착 카드 (2026-05-11).
   *  종전엔 category + 키워드 기반 라우팅 (fragile — "조리" 같은 단어가 inventory 로
   *  잘못 매칭되는 사용자 보고 케이스). 이제 LLM 프롬프트에 카드 카탈로그를 명시
   *  제공하고 직접 선택받음. HeroCtaTarget (MorningBriefing.tsx) 와 SSOT 일치.
   */
  targetCard?: "sales" | "users" | "cashflow" | "costs" | "inventory" | "team" | "primeCost" | "marketing" | "operations";
  priority: InsightPriority;
  /** 인사이트 출처 라벨 (Perplexity·Glean 패턴, UI 작은 배지) */
  sourceLabel?: string;
};

export type IndustryInsight = {
  /**
   * 우선순위 정렬된 인사이트 3개 (high → medium → low).
   * 카드 스택 UI: 기본은 high 만 노출, 펼치면 3개 모두.
   */
  insights: SingleInsight[];
  /**
   * 묶음 신뢰도 (0~1). 0.65 미만이면 전체 비표시 (환각 가드).
   */
  confidence?: number;
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
  /** 최근 7일 vs 직전 7일 매출 변화율 (%). 음수=하락, 양수=상승. */
  weeklySalesChangePct?: number;
  /** 객단가 (sales/customers) — 한국 외식업 핵심 지표 */
  avgTicketSize?: number;
  /** 비용 비율들 (모두 월 환산 매출 기준 %) */
  costRatios?: {
    ingredient?: number;
    labor?: number;
    rent?: number;
    prime?: number;
  };
  /** 가장 약한 요일의 매출이 일평균의 몇 % 인지 (피크/저점 식별) */
  weakestDayPct?: number;
  /** 부족 재고 수 */
  lowStockCount?: number;
  /** 직원 수 */
  employeesCount?: number;
  /** 현금 런웨이 (개월) */
  runwayMonths?: number;
};

// v16 — 2026-05-09 케이스 카탈로그 77 → 124 (성심당·런던베이글뮤지엄·Manus·Lovable·Cursor 등).
const CACHE_KEY_PREFIX = "foundone-industry-insight-v16:";

// 같은 키로 동시에 여러 mount (Strict Mode / 다중 caller) 가 fetch 하지 않도록 in-flight 공유.
const INSIGHT_INFLIGHT = new Map<string, Promise<IndustryInsight | null>>();

function cacheKey(input: { categoryId: string }): string {
  // ⚠️ 키에 *오늘 자정 KST* 까지 안정 — categoryId + 날짜만.
  //    초기 hasUserSales 가 false→true 로 전환되며 키가 바뀌어 매 refresh 마다 fresh fetch 가
  //    발생하던 버그 (사용자 보고 2026-05-08) 방지.
  //
  //    KST 기준 자정 — 사용자가 새벽 1시에 봐도 "어제" 의 인사이트가 나오면 안 됨.
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  return `${CACHE_KEY_PREFIX}${input.categoryId}:${date}`;
}

// localStorage 사용 — 다중 탭 / 브라우저 재시작에서도 유지 (하루 1회 비용 절감 보장).
// 키에 오늘 날짜 포함이라 자정 지나면 자동 만료.
function loadCached(key: string): IndustryInsight | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IndustryInsight>;
    // 형태 검증 — 옛 형식 (`headline`/`body`/`action` 단일) 자동 무효화
    if (!Array.isArray(parsed.insights) || parsed.insights.length === 0) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed as IndustryInsight;
  } catch {
    return null;
  }
}

function saveCache(key: string, insight: IndustryInsight): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(insight));
    // 옛 날짜 키 자동 청소 — 늘어나는 storage 방지
    cleanupOldCacheKeys(key);
  } catch {
    // ignore
  }
}

/** 오늘(KST) 날짜가 아닌 옛 캐시 키들 자동 삭제 */
function cleanupOldCacheKeys(currentKey: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    // ⚠️ cacheKey 가 KST 기준이니 cleanup 도 *반드시 KST 동일* 사용.
    //    UTC 사용 시 두 날짜 불일치 → 방금 저장한 키도 삭제되는 버그 (2026-05-08 사용자 보고).
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(CACHE_KEY_PREFIX)) continue;
      if (k === currentKey) continue;
      // 키 끝의 YYYY-MM-DD 가 오늘(KST) 이 아니면 삭제
      if (!k.endsWith(`:${today}`)) {
        localStorage.removeItem(k);
      }
    }
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

    const key = cacheKey({ categoryId: input.categoryId });
    // 하루 1회만 생성 — localStorage 캐시. 키에 오늘 날짜 포함이라 자정 지나면 자동 무효.
    const cached = loadCached(key);
    if (cached) {
      console.info(`[industry-insight] cache HIT (${key})`, {
        insights: cached.insights?.length ?? 0,
        confidence: cached.confidence,
      });
      setInsight(cached);
      return;
    }
    console.info(`[industry-insight] cache MISS (${key}) — fetching new`);

    let cancelled = false;

    // ─── 동시 fetch 중복 방지 ───
    //   같은 key 로 이미 in-flight 중이면 그 Promise 를 공유. (StrictMode dev 의 effect 중복 + 다중 caller 방어)
    const inflight = INSIGHT_INFLIGHT.get(key);
    const promise: Promise<IndustryInsight | null> = inflight ?? (async () => {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return null;

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
            weeklySalesChangePct: input.weeklySalesChangePct,
            avgTicketSize: input.avgTicketSize,
            costRatios: input.costRatios,
            weakestDayPct: input.weakestDayPct,
            lowStockCount: input.lowStockCount,
            employeesCount: input.employeesCount,
            runwayMonths: input.runwayMonths,
          }),
        });
        if (!res.ok) {
          if (res.status === 402) {
            console.warn("[industry-insight] AI 크레딧 잔액 부족 — Console 에서 충전 필요.");
          }
          return null;
        }
        const data = (await res.json()) as IndustryInsight;
        // 응답 즉시 캐시에 저장 — 동시 caller 도 다음 mount 부터는 cache hit
        saveCache(key, data);
        console.info(`[industry-insight] saved to cache (${key})`);
        return data;
      } catch (e) {
        console.warn("[industry-insight] fetch failed:", e instanceof Error ? e.message : e);
        return null;
      }
    })();

    if (!inflight) INSIGHT_INFLIGHT.set(key, promise);

    promise
      .then((data) => {
        if (cancelled) return;
        if (data) {
          console.info("[industry-insight] received", {
            insights: data.insights?.length ?? 0,
            confidence: data.confidence,
            priorities: (data.insights ?? []).map((i) => i.priority),
            firstHeadline: data.insights?.[0]?.headline,
          });
          setInsight(data);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        // in-flight 정리 (다음 mount 가 새로 fetch 할 수 있도록 — 단, 이 시점엔 보통 캐시 히트)
        INSIGHT_INFLIGHT.delete(key);
      });

    return () => {
      cancelled = true;
    };
  }, [
    input.enabled,
    input.categoryId,
    input.hasUserSales,
    input.avgDailySales,
    input.daysSinceLaunch,
    input.weeklySalesChangePct,
    input.avgTicketSize,
    input.costRatios?.ingredient,
    input.costRatios?.labor,
    input.costRatios?.rent,
    input.costRatios?.prime,
    input.weakestDayPct,
    input.lowStockCount,
    input.employeesCount,
    input.runwayMonths,
  ]);

  return { insight, loading, error };
}
