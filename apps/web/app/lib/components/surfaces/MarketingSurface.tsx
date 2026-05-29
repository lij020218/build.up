"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { starterIndustryOptions, localizeRecommendationItem } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { supabase } from "../../../../lib/supabase";
import {
  useMarketingStore,
  CHANNEL_LIST,
  RECOMMENDED_CHANNELS,
  type MarketingChannel,
  type CampaignRecord,
  type TrendItem,
} from "../../stores/marketing-store";

const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return "—";
  const abs = Math.abs(Math.round(n));
  if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
};

// ── Module-level in-flight dedup ──
// StrictMode 이중 마운트 / 빠른 탭 전환 시 동일 요청을 두 번 하지 않도록.
// 같은 키의 fetch가 이미 돌고 있으면 그 Promise를 공유해 결과만 재사용.
const TREND_INFLIGHT = new Map<string, Promise<unknown>>();
const COACH_INFLIGHT = new Map<string, Promise<unknown>>();

// AI 에러 → 사용자 친화 메시지. raw 에 API 키·청구 정보 포함 가능 → 노출 금지.
function humanizeAiError(raw: string, status: number, ko: boolean): string {
  const lower = raw.toLowerCase();
  if (lower.includes("credit balance") || lower.includes("billing") || lower.includes("payment_required") || status === 402) {
    return ko
      ? "AI 일시 중단 — 관리자에게 문의해주세요 (서비스 점검 중)."
      : "AI temporarily unavailable — contact admin.";
  }
  if (lower.includes("rate") && (lower.includes("limit") || lower.includes("exceeded"))) {
    return ko ? "AI 호출이 잠시 몰렸어요. 1분 뒤 다시 시도해주세요." : "AI is busy. Try again in a minute.";
  }
  if (lower.includes("overloaded") || status === 529) {
    return ko ? "AI 서버 일시 과부하. 잠시 후 다시 시도해주세요." : "AI overloaded. Try again shortly.";
  }
  if (lower.includes("invalid api") || lower.includes("authentication") || status === 401) {
    return ko ? "AI 인증 오류 — 관리자에게 문의해주세요." : "AI auth error — contact admin.";
  }
  return ko ? "AI 응답을 받지 못했어요. 잠시 후 다시 시도해주세요." : "Could not load AI response. Try again later.";
}

/** ISO 8601 주차 키 — "2026-W19" 형태. KST 기준 단순화 (한국 사장님 사용 가정). */
function getIsoWeekKey(): string {
  const now = new Date();
  // KST → UTC 보정 후 ISO week 계산
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const d = new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function MarketingSurface() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const mkt = useMarketingStore();
  const categoryId = d.industryCategoryId || "food";
  const subIndustryId = d.selectedIndustryId || null; // 세부업종 (starterIndustryOptions.id)
  const curMonth = new Date().toISOString().slice(0, 7);

  // ── 세부업종 fine-grained 라벨 (예: "Korean Meals / Casual Dining" → "한식/백반·가정식")
  const subIndustryLabel = useMemo(() => {
    if (!subIndustryId) return null;
    const raw = starterIndustryOptions.find((o) => o.id === subIndustryId);
    if (!raw) return null;
    return localizeRecommendationItem(raw, d.language).title;
  }, [subIndustryId, d.language]);

  // ── MTD 매출 (이번 달 dailyEntries 합산)
  const mtdRevenueWon = useMemo(() => {
    const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number }>;
    return entries
      .filter((e) => e.date?.startsWith?.(curMonth))
      .reduce((s, e) => s + (e.sales ?? 0), 0);
  }, [d.dailyEntries, curMonth]);

  // ── Viewport responsive
  const [viewportWidth, setViewportWidth] = useState(1440);
  useEffect(() => {
    const h = () => setViewportWidth(window.innerWidth);
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const isMobile = viewportWidth < 640;

  // ── Recommended channels for this business type
  const recommended = RECOMMENDED_CHANNELS[categoryId] ?? RECOMMENDED_CHANNELS["food"];

  // ── This month's campaigns
  const monthCampaigns = mkt.campaigns.filter((c) => c.month === curMonth);
  const totalSpend = monthCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalAttrRevenue = monthCampaigns.reduce((s, c) => s + (c.attributedRevenue ?? 0), 0);
  const blendedRoas = totalSpend > 0 ? totalAttrRevenue / totalSpend : 0;
  const activeChannels = [...new Set(monthCampaigns.map((c) => c.channel))];

  // ── Trends
  type TrendSource = { name: string; url: string; publishedDate?: string };
  type TrendMeta = {
    usedDataLab?: boolean;
    usedNaverBlog?: boolean;
    usedTavily?: boolean;
    usedYoutube?: boolean;
    youtubeVideos?: number;
    webSearches?: number;
  };
  const [trends, setTrends] = useState<TrendItem[]>(mkt.trendCache?.trends ?? []);
  const [trendSources, setTrendSources] = useState<TrendSource[]>([]);
  const [trendMeta, setTrendMeta] = useState<TrendMeta | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [focusedTrendIdx, setFocusedTrendIdx] = useState(0);
  // 수동 재생성 nonce — bump 시 useEffect 가 캐시 무시하고 새로 fetch
  const [trendNonce, setTrendNonce] = useState(0);

  // ── 가게 맞춤 마케팅 코칭 (트렌드와 독립, 하루 1회 생성 · zustand persist 캐싱)
  type CoachTool = { name: string; purpose: string; tier: "free" | "paid" | "freemium"; url?: string };
  type CoachAction = {
    priority: "now" | "this-week" | "this-month";
    title: string;
    why: string;
    howToExecute: string[];
    expectedImpact: string;
    tools: CoachTool[];
  };
  const [coachActions, setCoachActions] = useState<CoachAction[]>(mkt.coachCache?.actions ?? []);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  // 수동 재생성 nonce — bump 시 useEffect 가 캐시 무시하고 새로 fetch
  const [coachNonce, setCoachNonce] = useState(0);

  useEffect(() => {
    // KST 기준 날짜 — coach와 동일. UTC 쓰면 자정 9시간 앞당겨져 오전에 캐시가 부정확.
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    // 캐시 키 — sub-industry가 있으면 그걸로, 없으면 카테고리 fallback
    const cacheKey = subIndustryId || categoryId;
    // 캐시 히트 조건: 날짜·키 일치 + 실제 데이터 + 수동 재생성 트리거 안 됨
    const cacheHit = trendNonce === 0
      && mkt.trendCache
      && mkt.trendCache.date === today
      && mkt.trendCache.businessType === cacheKey
      && Array.isArray(mkt.trendCache.trends)
      && mkt.trendCache.trends.length > 0;
    if (cacheHit) {
      setTrends(mkt.trendCache!.trends);
      return;
    }
    // In-flight dedup — 같은 키의 요청이 이미 돌고 있으면 그걸 공유
    const inflightKey = `${today}|${cacheKey}|${d.language}`;
    let cancelled = false;
    setTrendLoading(true);

    const existing = TREND_INFLIGHT.get(inflightKey);
    const promise = existing ?? (async () => {
      const res = await fetch("/api/ai/marketing/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subIndustryId,
          businessType: categoryId,
          language: d.language,
        }),
      });
      if (!res.ok) {
        // raw 에러 본문 추출 — humanize 로 변환해 사용자에게 노출
        let raw = `HTTP ${res.status}`;
        try { const body = await res.json(); if (body?.error) raw = String(body.error); } catch { /* ignore */ }
        const e = new Error(raw) as Error & { status?: number };
        e.status = res.status;
        throw e;
      }
      const data = await res.json();
      const items: TrendItem[] = Array.isArray(data.trends) ? data.trends : [];
      // 빈 응답은 캐시하지 않음 — 다음 mount 때 재시도 보장
      if (items.length > 0) {
        mkt.setTrendCache({ date: today, businessType: cacheKey, trends: items });
      }
      return { trends: items, sources: data.sources ?? [], meta: data.meta ?? null };
    })();
    if (!existing) {
      TREND_INFLIGHT.set(inflightKey, promise);
      promise.finally(() => TREND_INFLIGHT.delete(inflightKey));
    }

    setTrendError(null);
    promise
      .then((result) => {
        if (cancelled || !result) return;
        const typed = result as { trends: TrendItem[]; sources: unknown; meta: unknown };
        setTrends(typed.trends);
        setFocusedTrendIdx(0);
        setTrendSources(Array.isArray(typed.sources) ? typed.sources as Array<{ name: string; url: string; publishedDate?: string }> : []);
        setTrendMeta((typed.meta ?? null) as TrendMeta | null);
        // 응답이 빈 배열인 경우 — API 가 silent fail 했을 수 있음. 사용자에게 신호 전달.
        if (typed.trends.length === 0) {
          setTrendError(ko ? "트렌드를 받아오지 못했어요. 잠시 후 다시 시도해주세요." : "Could not load trends. Try again later.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[MarketingSurface] trend fetch failed:", err);
          const status = (err as { status?: number })?.status ?? 0;
          const raw = err instanceof Error ? err.message : String(err);
          setTrendError(humanizeAiError(raw, status, ko));
        }
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, subIndustryId, d.language, trendNonce]);

  // ── 가게 맞춤 코칭 fetch — *주 1회* 재생성 (2026-05-11 사용자 요청, 이전 daily → weekly)
  //
  // 캐시 무효화 조건:
  // 1. ISO 주차가 바뀜 (매주 월요일 시작) → 새로 생성
  // 2. contextKey 바뀜 (가게 전환·세부업종 변경·언어 변경) → 새로 생성
  // 매장 매출·ROAS·채널 변경은 같은 주차 안엔 재생성 트리거하지 않음 (코칭 깊이 유지)
  useEffect(() => {
    if (!d.storeName) return; // 가게명 없으면 스킵

    const weekKey = getIsoWeekKey();
    const contextKey = [d.storeName, subIndustryId ?? categoryId, d.language].join("|");

    // 캐시 히트 — 같은 주차, 동일 context, 실제 데이터 존재, 수동 재생성 트리거 안 됨 → fetch 스킵
    const cache = mkt.coachCache;
    if (
      coachNonce === 0
      && cache
      && cache.weekKey === weekKey
      && cache.contextKey === contextKey
      && Array.isArray(cache.actions)
      && cache.actions.length > 0
    ) {
      setCoachActions(cache.actions);
      return;
    }

    // In-flight dedup — 이중 마운트 · 빠른 탭 전환 시 하나의 fetch만 실행
    const inflightKey = `${weekKey}|${contextKey}`;
    let cancelled = false;
    setCoachLoading(true);

    const existing = COACH_INFLIGHT.get(inflightKey);
    const promise = existing ?? (async () => {
      // ── 인증 헤더 — Supabase Bearer (서버가 user_id 별로 캐시) ──
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error(ko ? "로그인 세션이 만료됐어요." : "Session expired.") as Error;
      }
      const res = await fetch("/api/ai/marketing/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          storeName: d.storeName,
          industryCategoryId: categoryId,
          subIndustryId,
          subIndustryLabel,
          monthlyRevenueWon: mtdRevenueWon > 0 ? mtdRevenueWon : undefined,
          monthlySpendWon: totalSpend > 0 ? totalSpend : undefined,
          blendedRoas: blendedRoas > 0 ? blendedRoas : undefined,
          activeChannels: activeChannels.length > 0 ? activeChannels : undefined,
          currentStageLabel: d.businessLaunched ? (ko ? "운영 중" : "Operating") : (ko ? "오픈 준비" : "Pre-launch"),
          launchDate: d.selectedOpenDate ?? null,
          language: d.language,
          // coachNonce > 0 → 사용자가 재생성 버튼 눌렀음 → 서버 캐시 무시
          force: coachNonce > 0,
        }),
      });
      if (!res.ok) {
        let raw = `HTTP ${res.status}`;
        try { const body = await res.json(); if (body?.error) raw = String(body.error); } catch { /* ignore */ }
        const e = new Error(raw) as Error & { status?: number };
        e.status = res.status;
        throw e;
      }
      const data = await res.json();
      const actions: CoachAction[] = Array.isArray(data.actions) ? data.actions : [];
      if (actions.length > 0) {
        mkt.setCoachCache({ weekKey, contextKey, actions });
      }
      return actions;
    })();
    if (!existing) {
      COACH_INFLIGHT.set(inflightKey, promise);
      promise.finally(() => COACH_INFLIGHT.delete(inflightKey));
    }

    setCoachError(null);
    promise
      .then((result) => {
        if (cancelled) return;
        const actions = result as CoachAction[];
        setCoachActions(actions);
        if (actions.length === 0) {
          setCoachError(ko ? "맞춤 코칭을 받아오지 못했어요. 잠시 후 다시 시도해주세요." : "Could not load coaching. Try again later.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[MarketingSurface] coach fetch failed:", err);
          const status = (err as { status?: number })?.status ?? 0;
          const raw = err instanceof Error ? err.message : String(err);
          setCoachError(humanizeAiError(raw, status, ko));
        }
      })
      .finally(() => {
        if (!cancelled) setCoachLoading(false);
      });

    return () => { cancelled = true; };
  // 재호출 트리거: 가게명·세부업종·언어 변경 또는 수동 재생성 nonce bump
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.storeName, subIndustryId, categoryId, d.language, coachNonce]);

  // ── Add campaign handler
  // 수동 재생성 — 캐시 무효화 + nonce bump → useEffect 가 새로 fetch.
  //
  //  ⚠️ 사용자 지침 (2026-05-11): "이미 콘텐츠가 정상적으로 나왔다면 재생성 작동 X.
  //   비용이 나갈 수 있어. 진짜 문제가 있을 때만 동작" → canRegenerate* 로 게이팅.
  //
  //  허용 조건 (둘 중 하나만 만족하면 OK):
  //   1. 콘텐츠가 비어있다 (length === 0) — 사장님이 아무것도 못 본 상황
  //   2. 명시적 에러가 있다 (trendError / coachError) — 사장님이 실패를 직접 봤음
  //  정상 표시 중이면 버튼 disabled — 비용 낭비·중복 LLM 호출 차단.
  const canRegenerateTrend = trendError !== null || trends.length === 0;
  const canRegenerateCoach = coachError !== null || coachActions.length === 0;

  const handleRegenerateTrend = () => {
    if (!canRegenerateTrend || trendLoading) return;
    setTrendError(null);
    mkt.setTrendCache(null);
    setTrendNonce((n) => n + 1);
  };
  const handleRegenerateCoach = () => {
    if (!canRegenerateCoach || coachLoading || !d.storeName) return;
    setCoachError(null);
    mkt.setCoachCache(null);
    setCoachNonce((n) => n + 1);
  };

  const handleAddCampaign = () => {
    const spend = parseInt(mkt.campSpend.replace(/[^0-9]/g, ""), 10);
    if (!spend || isNaN(spend)) return;
    const revenue = parseInt((mkt.campRevenue || "0").replace(/[^0-9]/g, ""), 10);
    const record: CampaignRecord = {
      id: `camp-${Date.now()}`,
      channel: mkt.campChannel,
      month: curMonth,
      spend: spend * 10000, // 만원 입력
      attributedRevenue: revenue > 0 ? revenue * 10000 : undefined,
      note: mkt.campNote || undefined,
    };
    mkt.setCampaigns([...mkt.campaigns, record]);
    mkt.setCampSpend("");
    mkt.setCampRevenue("");
    mkt.setCampNote("");
    mkt.setCampFormOpen(false);
  };

  const handleDeleteCampaign = (id: string) => {
    mkt.setCampaigns(mkt.campaigns.filter((c) => c.id !== id));
  };

  const formatBadge: Record<string, { ko: string; en: string; color: string }> = {
    reel: { ko: "릴스", en: "Reel", color: "#e040fb" },
    story: { ko: "스토리", en: "Story", color: "#ff6d00" },
    short: { ko: "숏츠", en: "Short", color: "#ff1744" },
    post: { ko: "포스트", en: "Post", color: "#2979ff" },
    blog: { ko: "블로그", en: "Blog", color: "#00c853" },
    // 2026-05-12: 마케팅 캠페인 사례 모드 추가
    campaign: { ko: "캠페인", en: "Campaign", color: "#7c3aed" }, // 보라색 — "학습용 사례" 신호
    ad: { ko: "광고 사례", en: "Ad case", color: "#0891b2" },     // 청록색 — "분석 가능한 광고"
  };

  /** 조회수 포맷 — 1.2M / 850K / 12K 식으로 압축 표시. */
  const fmtViews = (n: number | undefined): string => {
    if (!n || n <= 0) return "";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return String(n);
  };

  return (
    <main style={{
      width: "min(1080px, calc(100vw - 32px))",
      margin: "0 auto", padding: "24px 0 80px",
      display: "flex", flexDirection: "column", gap: 18,
    }}>
      {/* spin keyframe — 재생성 버튼 아이콘 회전용 */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Header — 4 surface 공통 패턴 */}
      <header style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#191970", opacity: 0.65,
          letterSpacing: "0.12em",
        }}>
          {ko ? "MARKETING" : "MARKETING"}
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 750, letterSpacing: "-0.025em",
          color: "#0f172a", margin: 0,
        }}>
          {ko ? "내 가게 마케팅" : "Marketing"}
        </h1>
        <p style={{
          fontSize: 14, color: "rgba(15,23,42,0.55)",
          lineHeight: 1.55, margin: 0, maxWidth: 580,
        }}>
          {ko
            ? "지출·ROAS·활성 채널을 한눈에. 업종 트렌드와 가게 맞춤 액션을 매일 새로 정리해 드려요."
            : "Spend, ROAS, and active channels at a glance — with daily-refreshed trends and store-tailored actions."}
        </p>
      </header>

      {/* ━━━ 섹션 1: Overview KPI ━━━ */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "10px" }}>
        <div style={{ ...kpiCard, borderColor: "rgba(0,122,255,0.1)" }}>
          <div style={kpiLabel}>
            {ko ? "이달 마케팅 지출" : "SPEND MTD"}
          </div>
          {totalSpend > 0 ? (
            <div style={{ ...kpiValue, color: "#007aff" }}>{fmt(totalSpend)}</div>
          ) : (
            <div style={kpiHint}>{ko ? "캠페인 추가 시 집계" : "Add campaigns to track"}</div>
          )}
        </div>
        <div style={{ ...kpiCard, borderColor: "rgba(52,199,89,0.1)" }}>
          <div style={kpiLabel}>ROAS</div>
          {blendedRoas > 0 ? (
            <div style={{ ...kpiValue, color: blendedRoas >= 1 ? "#34c759" : "#dc2626" }}>
              {blendedRoas.toFixed(1)}x
            </div>
          ) : (
            <div style={kpiHint}>{ko ? "매출 기여 입력 시 계산" : "Log revenue to compute"}</div>
          )}
        </div>
        <div style={{ ...kpiCard, borderColor: "rgba(15,23,42,0.08)" }}>
          <div style={kpiLabel}>
            {ko ? "활성 채널" : "CHANNELS"}
          </div>
          {activeChannels.length > 0 ? (
            <div style={{ ...kpiValue, color: "var(--text)" }}>
              {activeChannels.length}
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(15,23,42,0.45)", marginLeft: "6px" }}>
                {ko ? "개" : ""}
              </span>
            </div>
          ) : (
            <div style={kpiHint}>{ko ? "아직 없음" : "None yet"}</div>
          )}
        </div>
      </div>

      {/* ━━━ 섹션 1-B: 내 가게 맞춤 마케팅 코칭 ━━━ */}
      <article style={solidCard}>
        <div style={{ marginBottom: coachActions.length > 0 ? "14px" : "6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#34c759", marginBottom: "2px" }}>
              {ko ? "내 가게 맞춤 코칭" : "Your Store Coaching"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {ko
                  ? (d.storeName ? `${d.storeName}에 지금 필요한 액션` : "가게 맞춤 마케팅")
                  : "Actions for your store right now"}
              </div>
              {coachLoading && (
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#34c759", padding: "3px 9px", borderRadius: "8px", background: "rgba(52,199,89,0.08)" }}>
                  {ko ? "분석 중" : "Analyzing"}
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.5 }}>
              {ko
                ? "업종 · 채널 · ROAS · 단계를 반영해 우선순위 3개를 제안합니다. 매주 새로 생성."
                : "Three prioritized actions based on your industry, channels, ROAS, and stage. Refreshed weekly."}
            </div>
          </div>
          {/* 수동 재생성 버튼 — 콘텐츠 비어있거나 에러일 때만 활성. 정상이면 disabled (비용 보호). */}
          <button
            type="button"
            onClick={handleRegenerateCoach}
            disabled={coachLoading || !d.storeName || !canRegenerateCoach}
            aria-label={ko ? "코칭 재생성" : "Regenerate coaching"}
            title={
              !canRegenerateCoach
                ? (ko ? "코칭이 정상 표시 중이라 재생성 비활성. 매주 자동 갱신됩니다." : "Coaching is healthy — regenerate disabled. Auto-refreshes weekly.")
                : (ko ? "코칭을 지금 다시 생성합니다 (캐시 무시)" : "Regenerate coaching now (bypass cache)")
            }
            style={{
              flexShrink: 0,
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "6px 10px", borderRadius: "8px",
              border: "1px solid rgba(52,199,89,0.20)",
              background: coachLoading ? "rgba(52,199,89,0.04)" : "rgba(52,199,89,0.08)",
              color: "#1F7A4C",
              fontSize: "11.5px", fontWeight: 650,
              cursor: coachLoading || !d.storeName || !canRegenerateCoach ? "not-allowed" : "pointer",
              opacity: coachLoading || !d.storeName || !canRegenerateCoach ? 0.45 : 1,
              transition: "all 0.15s ease",
              whiteSpace: "nowrap" as const,
            }}
          >
            <RefreshCw size={12} strokeWidth={2} style={{ animation: coachLoading ? "spin 1s linear infinite" : undefined }} />
            {ko ? "재생성" : "Regenerate"}
          </button>
        </div>

        {coachActions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {coachActions.map((action, ai) => {
              const priorityMeta = action.priority === "now"
                ? { label: ko ? "지금" : "Now", color: "#ff3b30" }
                : action.priority === "this-week"
                ? { label: ko ? "이번 주" : "This week", color: "#ff9f0a" }
                : { label: ko ? "이번 달" : "This month", color: "#34c759" };
              return (
                <div key={ai} style={{
                  padding: "16px",
                  borderRadius: "16px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 4px rgba(17,17,17,0.02)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" as const }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const,
                      padding: "3px 8px", borderRadius: "6px",
                      background: `${priorityMeta.color}14`, color: priorityMeta.color,
                    }}>{priorityMeta.label}</span>
                    <span style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", flex: 1, minWidth: 0 }}>
                      {action.title}
                    </span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.55, marginBottom: "10px" }}>
                    <span style={{ fontWeight: 680, color: "#34c759", marginRight: "4px" }}>
                      {ko ? "왜" : "Why"}
                    </span>
                    {action.why}
                  </div>

                  {Array.isArray(action.howToExecute) && action.howToExecute.length > 0 && (
                    <div style={{
                      padding: "12px 14px", borderRadius: "12px",
                      background: "rgba(0,122,255,0.04)", border: "1px solid rgba(0,122,255,0.1)",
                      marginBottom: "8px",
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#007aff", marginBottom: "6px" }}>
                        {ko ? "오늘 바로 실행" : "Execute Today"}
                      </div>
                      <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {action.howToExecute.map((step, si) => (
                          <li key={si} style={{ fontSize: "12.5px", color: "var(--text)", lineHeight: 1.55 }}>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {action.expectedImpact && (
                    <div style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.5, marginBottom: Array.isArray(action.tools) && action.tools.length > 0 ? "10px" : 0 }}>
                      <span style={{ fontWeight: 680, color: "#34c759", marginRight: "4px" }}>
                        {ko ? "기대 효과" : "Impact"}
                      </span>
                      {action.expectedImpact}
                    </div>
                  )}

                  {Array.isArray(action.tools) && action.tools.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {action.tools.map((tool, ti) => {
                        const tierColor = tool.tier === "free" ? "#34c759" : tool.tier === "paid" ? "#007aff" : "#ff9f0a";
                        const tierLabel = tool.tier === "free" ? (ko ? "무료" : "Free") : tool.tier === "paid" ? (ko ? "유료" : "Paid") : (ko ? "부분 무료" : "Freemium");
                        const chip = (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            fontSize: "11.5px", fontWeight: 600,
                            padding: "4px 9px", borderRadius: "8px",
                            background: `${tierColor}10`, color: tierColor,
                            border: `1px solid ${tierColor}26`,
                          }}>
                            <span style={{ fontWeight: 700 }}>{tool.name}</span>
                            <span style={{ fontSize: "9.5px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", background: `${tierColor}1a` }}>
                              {tierLabel}
                            </span>
                            <span style={{ color: "var(--muted)", fontWeight: 500 }}>— {tool.purpose}</span>
                          </span>
                        );
                        return tool.url ? (
                          <a key={ti} href={tool.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            {chip}
                          </a>
                        ) : (
                          <span key={ti}>{chip}</span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : coachLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                padding: "16px", borderRadius: "14px",
                background: "rgba(17,17,17,0.02)", border: "1px solid rgba(17,17,17,0.04)",
              }}>
                <div style={{ height: "14px", width: "50%", borderRadius: "4px", background: "rgba(52,199,89,0.08)", marginBottom: "10px" }} />
                <div style={{ height: "11px", width: "90%", borderRadius: "4px", background: "rgba(17,17,17,0.04)", marginBottom: "6px" }} />
                <div style={{ height: "11px", width: "70%", borderRadius: "4px", background: "rgba(17,17,17,0.04)" }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: "20px", borderRadius: "14px",
            background: coachError ? "rgba(255,59,48,0.04)" : "rgba(17,17,17,0.02)",
            border: coachError ? "1px solid rgba(255,59,48,0.16)" : "1px solid rgba(17,17,17,0.04)",
            textAlign: "center" as const, color: coachError ? "#9F1A2D" : "var(--muted)",
            fontSize: "12.5px", lineHeight: 1.5,
          }}>
            {!d.storeName
              ? (ko ? "가게 정보를 먼저 입력해주세요 — 프로필에서 상호와 업종을 설정하면 맞춤 코칭이 나타납니다." : "Set up your store profile first — add your store name and industry to see personalized coaching.")
              : coachError
                ? coachError
                : (ko ? "코칭을 생성하지 못했어요. 새로고침 후 다시 시도해주세요." : "Unable to generate coaching. Please refresh.")}
          </div>
        )}
      </article>

      {/* ━━━ 섹션 2: 오늘의 트렌드 ━━━ */}
      <article style={solidCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: trends.length > 0 ? "16px" : "8px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(0,122,255,0.65)", marginBottom: "2px" }}>
              {ko ? "AI 트렌드" : "AI Trends"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {ko ? "오늘의 마케팅 트렌드" : "Today's Marketing Trends"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginTop: "2px", lineHeight: 1.5 }}>
              {ko ? "업종별 맞춤 콘텐츠 아이디어 5개" : "5 content ideas curated for your industry"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {trendLoading && (
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#007aff", padding: "4px 10px", borderRadius: "8px", background: "rgba(0,122,255,0.08)" }}>
                {ko ? "분석 중" : "Loading"}
              </div>
            )}
            {/* 수동 재생성 버튼 — 트렌드가 비어있거나 에러일 때만 활성. 정상이면 disabled (비용 보호). */}
            <button
              type="button"
              onClick={handleRegenerateTrend}
              disabled={trendLoading || !canRegenerateTrend}
              aria-label={ko ? "트렌드 재생성" : "Regenerate trends"}
              title={
                !canRegenerateTrend
                  ? (ko ? "트렌드가 정상 표시 중이라 재생성 비활성. 매일 자동 갱신됩니다." : "Trends are healthy — regenerate disabled. Auto-refreshes daily.")
                  : (ko ? "트렌드를 지금 다시 생성합니다 (캐시 무시)" : "Regenerate trends now (bypass cache)")
              }
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "6px 10px", borderRadius: "8px",
                border: "1px solid rgba(0,122,255,0.20)",
                background: trendLoading ? "rgba(0,122,255,0.04)" : "rgba(0,122,255,0.08)",
                color: "#1F46A8",
                fontSize: "11.5px", fontWeight: 650,
                cursor: trendLoading || !canRegenerateTrend ? "not-allowed" : "pointer",
                opacity: trendLoading || !canRegenerateTrend ? 0.45 : 1,
                transition: "all 0.15s ease",
                whiteSpace: "nowrap" as const,
              }}
            >
              <RefreshCw size={12} strokeWidth={2} style={{ animation: trendLoading ? "spin 1s linear infinite" : undefined }} />
              {ko ? "재생성" : "Regenerate"}
            </button>
          </div>
        </div>

        {/* 근거 소스 배지 — 어떤 데이터가 실제로 반영되었는지 투명하게.
            "실시간 트렌딩" 강한 표현은 YouTube Data API (KR mostPopular) 가 실제로 동작했을 때만. */}
        {trends.length > 0 && trendMeta && (trendMeta.usedYoutube || trendMeta.usedDataLab || trendMeta.usedNaverBlog || trendMeta.usedTavily || (trendMeta.webSearches ?? 0) > 0) && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "6px",
            marginBottom: "14px", padding: "10px 12px",
            borderRadius: "10px", background: "rgba(52,199,89,0.04)",
            border: "1px solid rgba(52,199,89,0.1)",
          }}>
            <span style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.04em", color: "rgba(52,199,89,0.8)", textTransform: "uppercase" as const, marginRight: "4px" }}>
              {trendMeta.usedYoutube
                ? (ko ? "실시간 트렌딩" : "Live trending")
                : (ko ? "최근 검색·요약 기반" : "Recent search/summary")}
            </span>
            {trendMeta.usedYoutube && (
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(255,0,0,0.08)", color: "#cc0000" }}>
                {ko ? `YouTube ${trendMeta.youtubeVideos ?? 0}건` : `YouTube ${trendMeta.youtubeVideos ?? 0}`}
              </span>
            )}
            {trendMeta.usedDataLab && (
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(52,199,89,0.08)", color: "#34c759" }}>
                {ko ? "네이버 DataLab" : "Naver DataLab"}
              </span>
            )}
            {trendMeta.usedNaverBlog && (
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(52,199,89,0.08)", color: "#34c759" }}>
                {ko ? "네이버 블로그" : "Naver Blog"}
              </span>
            )}
            {trendMeta.usedTavily && (
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(52,199,89,0.08)", color: "#34c759" }}>
                {ko ? "웹 검색 요약" : "Web summary"}
              </span>
            )}
            {(trendMeta.webSearches ?? 0) > 0 && (
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(52,199,89,0.08)", color: "#34c759" }}>
                {ko ? `Claude 웹검색 ${trendMeta.webSearches}회` : `${trendMeta.webSearches} searches`}
              </span>
            )}
          </div>
        )}

        {trends.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {trends.map((trend, i) => {
              const badge = formatBadge[trend.format] ?? formatBadge.post;
              const isFocused = i === focusedTrendIdx;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFocusedTrendIdx(i)}
                  style={{
                    textAlign: "left" as const,
                    padding: "14px 16px",
                    borderRadius: "16px",
                    background: isFocused ? "rgba(0,122,255,0.05)" : "var(--surface)",
                    border: isFocused ? "1px solid rgba(0,122,255,0.3)" : "1px solid var(--border)",
                    boxShadow: isFocused
                      ? "0 2px 10px rgba(0,122,255,0.1)"
                      : "0 1px 4px rgba(17,17,17,0.02)",
                    cursor: "pointer",
                    transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                    display: "block",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 700,
                      width: "18px", height: "18px", borderRadius: "6px",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: isFocused ? "#007aff" : "rgba(17,17,17,0.08)",
                      color: isFocused ? "#fff" : "var(--muted)",
                    }}>{i + 1}</span>
                    <span style={{ fontSize: "14.5px", fontWeight: 680, color: "var(--text)", letterSpacing: "-0.01em", flex: 1 }}>
                      {trend.title}
                    </span>
                    <span style={{
                      fontSize: "10px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px",
                      background: `${badge.color}12`, color: badge.color,
                    }}>
                      {ko ? badge.ko : badge.en}
                    </span>
                    <ChevronRight
                      size={16}
                      strokeWidth={1.8}
                      color={isFocused ? "#007aff" : "rgba(17,17,17,0.3)"}
                      style={{
                        transition: "transform 0.2s ease",
                        transform: isFocused ? "translateX(2px)" : "translateX(0)",
                        flexShrink: 0,
                      }}
                    />
                  </div>
                  {/* 2026-05-12: 캠페인 사례 모드 — 브랜드명/캠페인명/조회수를 카드 상단 메타 라인으로 노출.
                      "이게 어떤 브랜드의 어떤 캠페인이고 얼마나 화제인지" 를 사장님이 5초 안에 파악. */}
                  {(trend.brandName || trend.campaignName || trend.viewCount) && (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "6px", fontSize: "11px" }}>
                      {trend.brandName && (
                        <span style={{ fontWeight: 700, color: "#7c3aed", padding: "2px 7px", borderRadius: "5px", background: "rgba(124,58,237,0.08)" }}>
                          {trend.brandName}
                        </span>
                      )}
                      {trend.campaignName && trend.campaignName !== trend.title && (
                        <span style={{ fontWeight: 600, color: "rgba(15,23,42,0.65)" }}>
                          {ko ? `캠페인: ${trend.campaignName}` : `Campaign: ${trend.campaignName}`}
                        </span>
                      )}
                      {trend.viewCount && trend.viewCount > 0 && (
                        <span style={{ fontWeight: 700, color: "#cc0000", padding: "2px 7px", borderRadius: "5px", background: "rgba(255,0,0,0.06)" }}>
                          ▶ {fmtViews(trend.viewCount)}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.55)", marginBottom: "4px", lineHeight: 1.5 }}>
                    {trend.reason}
                  </div>
                  {/* 2026-05-12: lesson 우선 — "이 업종에 왜 의미 있는지" 가 핵심.
                      contentIdea 는 실행 전술 (하위 보조). lesson 없으면 contentIdea 만 표시. */}
                  {trend.lesson && (
                    <div style={{
                      fontSize: "12.5px", fontWeight: 600, color: "#7c3aed",
                      lineHeight: 1.5, marginBottom: "4px",
                      padding: "6px 10px", borderRadius: "8px",
                      background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)",
                    }}>
                      💡 {trend.lesson}
                    </div>
                  )}
                  <div style={{ fontSize: "12.5px", fontWeight: 540, color: "var(--text)", lineHeight: 1.5, marginBottom: "6px" }}>
                    {trend.contentIdea}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                    {trend.hashtags.map((tag) => (
                      <span key={tag} style={{
                        fontSize: "10.5px", fontWeight: 600, padding: "1.5px 7px", borderRadius: "5px",
                        background: "rgba(0,122,255,0.05)", color: "#007aff",
                      }}>
                        {tag}
                      </span>
                    ))}
                    {trend.referenceUrl && (() => {
                      const url = trend.referenceUrl;
                      const isYoutube = /youtube\.com|youtu\.be/.test(url);
                      const isInsta = /instagram\.com/.test(url);
                      const label = isYoutube
                        ? (ko ? "▶ 유튜브 영상" : "▶ YouTube")
                        : isInsta
                          ? (ko ? "▶ 인스타 영상" : "▶ Instagram")
                          : (ko ? "▶ 영상 보기" : "▶ Watch");
                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: isYoutube ? "#cc0000" : "#007aff",
                            textDecoration: "none",
                            marginLeft: "auto",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: isYoutube ? "rgba(255,0,0,0.06)" : "rgba(0,122,255,0.06)",
                          }}
                        >
                          {label}
                        </a>
                      );
                    })()}
                  </div>
                </button>
              );
            })}
          </div>
        ) : trendLoading ? (
          // 로딩 중 — 스켈레톤 3개
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                padding: "16px",
                borderRadius: "14px",
                background: "rgba(15,23,42,0.02)",
                border: "1px solid rgba(15,23,42,0.04)",
              }}>
                <div style={{ height: "14px", width: "60%", borderRadius: "4px", background: "rgba(0,122,255,0.08)", marginBottom: "10px" }} />
                <div style={{ height: "11px", width: "90%", borderRadius: "4px", background: "rgba(15,23,42,0.04)", marginBottom: "6px" }} />
                <div style={{ height: "11px", width: "75%", borderRadius: "4px", background: "rgba(15,23,42,0.04)" }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: "20px",
            borderRadius: "14px",
            background: trendError ? "rgba(255,59,48,0.04)" : "rgba(15,23,42,0.02)",
            border: trendError ? "1px solid rgba(255,59,48,0.16)" : "1px solid rgba(15,23,42,0.04)",
            textAlign: "center" as const,
            color: trendError ? "#9F1A2D" : "rgba(15,23,42,0.5)",
            fontSize: "12.5px",
            lineHeight: 1.5,
          }}>
            {trendError
              ? trendError
              : (ko
                ? "트렌드 생성이 잠시 지연되고 있어요. 새로고침 후 다시 시도해주세요."
                : "Trend generation is delayed. Please refresh and try again.")}
          </div>
        )}

        {/* 출처 리스트 — 투명성: Claude가 뭘 읽고 만들었는지 */}
        {trendSources.length > 0 && (
          <div style={{
            marginTop: "14px", paddingTop: "14px",
            borderTop: "1px solid rgba(15,23,42,0.06)",
          }}>
            <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.06em", color: "rgba(15,23,42,0.4)", textTransform: "uppercase" as const, marginBottom: "8px" }}>
              {ko ? "참조 출처" : "Sources"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {trendSources.slice(0, 6).map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: "11.5px", color: "rgba(15,23,42,0.55)", textDecoration: "none",
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "4px 0", lineHeight: 1.4,
                }}>
                  <span style={{ color: "rgba(15,23,42,0.3)" }}>·</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {s.name}
                  </span>
                  {s.publishedDate && (
                    <span style={{ fontSize: "10px", color: "rgba(15,23,42,0.3)" }}>{s.publishedDate}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* ━━━ 섹션 2-B: 마케팅 작업하기 (선택된 트렌드의 실행 가이드) ━━━ */}
      {trends.length > 0 && (() => {
        const focused = trends[focusedTrendIdx];
        if (!focused) return null;
        const hasPlaybook = Array.isArray(focused.howToExecute) && focused.howToExecute.length > 0;
        const hasTools = Array.isArray(focused.tools) && focused.tools.length > 0;
        const hasCase = focused.strategyExample || focused.effectiveness;
        if (!hasPlaybook && !hasTools && !hasCase) return null;
        const badge = formatBadge[focused.format] ?? formatBadge.post;
        return (
          <article style={solidCard}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(0,122,255,0.75)", marginBottom: "2px" }}>
                {ko ? "마케팅 작업하기" : "Execute"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {ko ? `#${focusedTrendIdx + 1} ${focused.title}` : `#${focusedTrendIdx + 1} ${focused.title}`}
                </div>
                <span style={{
                  fontSize: "10px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px",
                  background: `${badge.color}12`, color: badge.color,
                }}>
                  {ko ? badge.ko : badge.en}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.5 }}>
                {ko
                  ? "위 트렌드를 클릭하면 해당 트렌드의 실행 가이드로 전환됩니다."
                  : "Click a trend above to switch to its playbook."}
              </div>
            </div>

            {/* 실행 플레이북 */}
            {hasPlaybook && (
              <div style={{
                marginBottom: "12px", padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(0,122,255,0.04)", border: "1px solid rgba(0,122,255,0.1)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#007aff", marginBottom: "10px" }}>
                  {ko ? "오늘 바로 따라하기" : "Playbook · Do This Today"}
                </div>
                <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {focused.howToExecute!.map((step, si) => (
                    <li key={si} style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.55, display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <span style={{
                        flexShrink: 0, width: "20px", height: "20px", borderRadius: "6px",
                        background: "#007aff", color: "#fff",
                        fontSize: "11px", fontWeight: 700,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        marginTop: "1px",
                      }}>{si + 1}</span>
                      <span style={{ flex: 1 }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 성공 사례 + 효과 */}
            {hasCase && (
              <div style={{
                marginBottom: "12px", padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.1)",
                display: "flex", flexDirection: "column", gap: "8px",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#34c759" }}>
                  {ko ? "왜 이렇게 해야 하나 — 브랜드 사례·효과" : "Why It Works — Brand Case & Impact"}
                </div>
                {focused.strategyExample && (
                  <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.55 }}>
                    <span style={{ fontWeight: 680, color: "#34c759", marginRight: "4px" }}>
                      {ko ? "사례" : "Case"}
                    </span>
                    {focused.strategyExample}
                  </div>
                )}
                {focused.effectiveness && (
                  <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.55 }}>
                    <span style={{ fontWeight: 680, color: "#34c759", marginRight: "4px" }}>
                      {ko ? "기대 효과" : "Impact"}
                    </span>
                    {focused.effectiveness}
                  </div>
                )}
              </div>
            )}

            {/* 추천 도구 */}
            {hasTools && (
              <div style={{
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(17,17,17,0.02)", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "10px" }}>
                  {ko ? "추천 도구" : "Recommended Tools"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {focused.tools!.map((tool, ti) => {
                    const tierColor = tool.tier === "free" ? "#34c759" : "#007aff";
                    const tierLabel = tool.tier === "free" ? (ko ? "무료" : "Free") : tool.tier === "paid" ? (ko ? "유료" : "Paid") : (ko ? "부분 무료" : "Freemium");
                    const inner = (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 12px", borderRadius: "10px",
                        background: "var(--surface-strong)", border: `1px solid ${tierColor}22`,
                        transition: "background 0.15s ease",
                      }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", minWidth: 0 }}>
                          {tool.name}
                        </span>
                        <span style={{
                          fontSize: "10px", fontWeight: 700,
                          padding: "2px 7px", borderRadius: "5px",
                          background: `${tierColor}14`, color: tierColor,
                          flexShrink: 0,
                        }}>
                          {tierLabel}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--muted)", flex: 1, lineHeight: 1.4 }}>
                          {tool.purpose}
                        </span>
                        {tool.url && (
                          <span style={{ fontSize: "11px", fontWeight: 600, color: tierColor, flexShrink: 0 }}>
                            →
                          </span>
                        )}
                      </div>
                    );
                    return tool.url ? (
                      <a key={ti} href={tool.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        {inner}
                      </a>
                    ) : (
                      <div key={ti}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        );
      })()}

      {/* ━━━ 섹션 3: 채널별 지출 추적 ━━━ */}
      <article style={solidCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(15,23,42,0.4)", marginBottom: "2px" }}>
              {ko ? "지출 추적" : "Spend Tracking"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {ko ? "채널별 마케팅 지출" : "Channel Spend"}
            </div>
          </div>
          <button type="button" onClick={() => mkt.setCampFormOpen(!mkt.campFormOpen)} style={{
            fontSize: "12px", fontWeight: 640, color: "#007aff", background: "none", border: "none", cursor: "pointer",
          }}>
            {mkt.campFormOpen ? (ko ? "닫기" : "Close") : (ko ? "+ 캠페인 추가" : "+ Add Campaign")}
          </button>
        </div>

        {/* 추천 채널 칩 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {recommended.map((ch) => {
            const meta = CHANNEL_LIST.find((c) => c.key === ch);
            if (!meta) return null;
            const active = activeChannels.includes(ch);
            const MetaIcon = meta.Icon;
            return (
              <span key={ch} style={{
                fontSize: "11px", fontWeight: 620, padding: "4px 10px", borderRadius: "8px",
                background: active ? "rgba(52,199,89,0.08)" : "rgba(15,23,42,0.03)",
                color: active ? "#34c759" : "rgba(15,23,42,0.4)",
                border: active ? "1px solid rgba(52,199,89,0.15)" : "1px solid rgba(15,23,42,0.04)",
                display: "inline-flex", alignItems: "center", gap: "4px",
              }}>
                <MetaIcon size={12} strokeWidth={1.5} />
                {ko ? meta.label.ko : meta.label.en}
              </span>
            );
          })}
        </div>

        {/* 캠페인 리스트 */}
        {monthCampaigns.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
            {monthCampaigns.map((camp) => {
              const meta = CHANNEL_LIST.find((c) => c.key === camp.channel);
              const roi = camp.spend > 0 && camp.attributedRevenue ? (camp.attributedRevenue / camp.spend).toFixed(1) : null;
              return (
                <div key={camp.id} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "12px",
                  background: "rgba(15,23,42,0.015)", border: "1px solid rgba(15,23,42,0.04)",
                }}>
                  {(() => {
                    const MetaIcon = meta?.Icon;
                    return MetaIcon ? <MetaIcon size={16} strokeWidth={1.5} color={meta?.iconColor} /> : null;
                  })()}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 640, color: "var(--text)" }}>
                      {ko ? (meta?.label.ko ?? camp.channel) : (meta?.label.en ?? camp.channel)}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)" }}>
                      {fmt(camp.spend)}
                      {camp.attributedRevenue ? ` → ${fmt(camp.attributedRevenue)}` : ""}
                      {roi ? ` (${roi}x)` : ""}
                    </div>
                  </div>
                  <button type="button" onClick={() => handleDeleteCampaign(camp.id)} style={{
                    width: "24px", height: "24px", borderRadius: "6px", border: "none",
                    background: "rgba(15,23,42,0.04)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="rgba(15,23,42,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : !mkt.campFormOpen ? (
          <button type="button" onClick={() => mkt.setCampFormOpen(true)} style={{
            width: "100%", padding: "16px", borderRadius: "14px",
            border: "1px dashed rgba(0,122,255,0.15)", background: "transparent",
            cursor: "pointer", fontSize: "13px", color: "rgba(15,23,42,0.4)", fontWeight: 500,
            marginBottom: "12px",
          }}>
            {ko ? "마케팅 지출을 기록하면 ROI를 추적할 수 있어요" : "Log marketing spend to track ROI"}
          </button>
        ) : null}

        {/* 캠페인 추가 폼 */}
        {mkt.campFormOpen && (
          <div style={{
            padding: "14px", borderRadius: "14px",
            background: "rgba(0,122,255,0.02)", border: "1px solid rgba(0,122,255,0.08)",
            display: "flex", flexDirection: "column", gap: "8px",
          }}>
            <select value={mkt.campChannel} onChange={(e) => mkt.setCampChannel(e.target.value as MarketingChannel)}
              style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}>
              {CHANNEL_LIST.map((ch) => (
                <option key={ch.key} value={ch.key}>{ko ? ch.label.ko : ch.label.en}</option>
              ))}
            </select>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "8px" }}>
              <input type="text" inputMode="numeric" placeholder={ko ? "지출 (만원)" : "Spend (만원)"}
                value={mkt.campSpend} onChange={(e) => mkt.setCampSpend(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
              />
              <input type="text" inputMode="numeric" placeholder={ko ? "매출 기여 (만원)" : "Revenue (만원)"}
                value={mkt.campRevenue} onChange={(e) => mkt.setCampRevenue(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
              />
            </div>
            <button type="button" onClick={handleAddCampaign} disabled={!mkt.campSpend} style={{
              padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer",
              background: mkt.campSpend ? "linear-gradient(135deg, #007aff 0%, #a855f7 100%)" : "rgba(15,23,42,0.06)",
              color: mkt.campSpend ? "#fff" : "rgba(15,23,42,0.3)",
              fontSize: "13px", fontWeight: 650,
            }}>
              {ko ? "추가" : "Add"}
            </button>
          </div>
        )}
      </article>
    </main>
  );
}

// ─── 공통 스타일 (앱 전역 토큰 기반 · Apple HIG) ───
// 기준: styles.card(radius 28px), AnalyticsSurface(KPI radius 18px)
// 액센트: iOS 시스템 색 (블루 #007aff, 그린 #34c759, 오렌지 #ff9f0a, 레드 #ff3b30)

const COLOR_ACCENT = "#007aff";           // Apple 포커스·코칭 강조
const COLOR_SUCCESS = "#34c759";          // iOS green — 성공 사례·효과
const COLOR_NEUTRAL_TEXT = "var(--text)"; // #111
const COLOR_NEUTRAL_MUTED = "var(--muted)"; // #5b616e

const solidCard: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid var(--border)",
  background: "var(--surface-strong)",
  padding: "22px",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 4px 16px rgba(17,17,17,0.04)",
  backdropFilter: "blur(18px)" as const,
  WebkitBackdropFilter: "blur(18px)" as const,
};

const kpiCard: React.CSSProperties = {
  padding: "16px 18px",
  borderRadius: "18px",
  background: "var(--surface-strong)",
  border: "1px solid var(--border)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 2px 8px rgba(17,17,17,0.03)",
  backdropFilter: "blur(12px)" as const,
  WebkitBackdropFilter: "blur(12px)" as const,
  minHeight: "86px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center" as const,
};

const kpiLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 650,
  color: COLOR_NEUTRAL_MUTED,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

const kpiValue: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 720,
  letterSpacing: "-0.03em",
  fontVariantNumeric: "tabular-nums" as const,
  lineHeight: 1.1,
};

const kpiHint: React.CSSProperties = {
  fontSize: "12.5px",
  fontWeight: 500,
  color: COLOR_NEUTRAL_MUTED,
  lineHeight: 1.5,
};
