"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { starterIndustryOptions, localizeRecommendationItem } from "@foundone/shared";
import { BP } from "../../breakpoints";
import { getKstMonthKey } from "../../utils/business-day";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { supabase } from "../../../../lib/supabase";
import { useStoreInfoStore } from "../../stores/store-info-store";
import { deriveRegionFromAddress } from "../../utils/region";
import { CardNewsStudio } from "./CardNewsStudio";
import {
  useMarketingStore,
  CHANNEL_LIST,
  RECOMMENDED_CHANNELS,
  type MarketingChannel,
  type CampaignRecord,
  type MarketingPlay,
  type CasesSource,
  type MemeItem,
  type MemePackCache,
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
const CASES_INFLIGHT = new Map<string, Promise<unknown>>();

/** 실행 신호 계측 — fire-and-forget. 실패는 UX 에 절대 개입하지 않음 (2026-07-25). */
function logMarketingEvent(event: "copy_click" | "meme_origin_click") {
  void (async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      await fetch("/api/ai/marketing/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weekKey: getIsoWeekKey(), event }),
      });
    } catch { /* 계측 실패는 무시 */ }
  })();
}


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
  const curMonth = getKstMonthKey();

  // 동네 라벨 — deliverables 지역 키워드 실주입용 (LLM "○○동" 빈칸 사고 방지, 2026-07-25)
  const addressRoad = useStoreInfoStore((s) => s.addressRoad);
  const region = useMemo(() => deriveRegionFromAddress(addressRoad), [addressRoad]);

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
  const isMobile = viewportWidth < BP.sm;

  // 마케팅 장부(KPI+지출 추적) — 기본 접힘 (2026-07-24 개편: 실행이 주인공, 장부는 요약 한 줄)
  const [ledgerOpen, setLedgerOpen] = useState(false);

  // ── Recommended channels for this business type
  const recommended = RECOMMENDED_CHANNELS[categoryId] ?? RECOMMENDED_CHANNELS["food"];

  // ── This month's campaigns
  const monthCampaigns = mkt.campaigns.filter((c) => c.month === curMonth);
  const totalSpend = monthCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalAttrRevenue = monthCampaigns.reduce((s, c) => s + (c.attributedRevenue ?? 0), 0);
  const blendedRoas = totalSpend > 0 ? totalAttrRevenue / totalSpend : 0;
  const activeChannels = [...new Set(monthCampaigns.map((c) => c.channel))];





  // ── 마케팅 작업하기 = 업종 최신 성공사례·트렌드 → 내 사업 적용 (주 1회 생성 · persist 캐싱)
  const [plays, setPlays] = useState<MarketingPlay[]>(mkt.casesCache?.plays ?? []);
  const [casesSources, setCasesSources] = useState<CasesSource[]>(mkt.casesCache?.sources ?? []);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [casesNonce, setCasesNonce] = useState(0);

  useEffect(() => {
    const weekKey = getIsoWeekKey();
    const contextKey = [d.storeName ?? "내가게", subIndustryId ?? categoryId, d.language].join("|");

    // 캐시 히트 — 동일 주차·context·실제 데이터·수동 재생성 안 됨 → fetch 스킵
    // plays[0].mission 체크: v1(설명형) 로컬 캐시는 미스 처리해 v2(미션·실행물) 재조회 (서버 캐시 키도 v2).
    const cache = mkt.casesCache;
    if (
      casesNonce === 0
      && cache
      && cache.weekKey === weekKey
      && cache.contextKey === contextKey
      && Array.isArray(cache.plays)
      && cache.plays.length > 0
      && !!cache.plays[0]?.mission
    ) {
      setPlays(cache.plays);
      setCasesSources(cache.sources ?? []);
      return;
    }

    const inflightKey = `${weekKey}|${contextKey}`;
    let cancelled = false;
    setCasesLoading(true);

    const existing = CASES_INFLIGHT.get(inflightKey);
    const promise = existing ?? (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error(ko ? "로그인 세션이 만료됐어요." : "Session expired.") as Error;
      const res = await fetch("/api/ai/marketing/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          storeName: d.storeName,
          region,
          industryCategoryId: categoryId,
          subIndustryId,
          subIndustryLabel,
          monthlyRevenueWon: mtdRevenueWon > 0 ? mtdRevenueWon : undefined,
          monthlySpendWon: totalSpend > 0 ? totalSpend : undefined,
          blendedRoas: blendedRoas > 0 ? blendedRoas : undefined,
          activeChannels: activeChannels.length > 0 ? activeChannels : undefined,
          currentStageLabel: d.businessLaunched ? (ko ? "운영 중" : "Operating") : (ko ? "오픈 준비" : "Pre-launch"),
          launchDate: d.selectedOpenDate ?? null,
          hasUserSales: mtdRevenueWon > 0,
          salesTrendPct,
          language: d.language,
          force: casesNonce > 0,
        }),
      });
      if (!res.ok) {
        let raw = `HTTP ${res.status}`;
        try { const b = await res.json(); if (b?.error) raw = String(b.error); } catch { /* ignore */ }
        const e = new Error(raw) as Error & { status?: number };
        e.status = res.status;
        throw e;
      }
      const data = await res.json();
      const got: MarketingPlay[] = Array.isArray(data.plays) ? data.plays : [];
      const srcs: CasesSource[] = Array.isArray(data.sources) ? data.sources : [];
      if (got.length > 0) mkt.setCasesCache({ weekKey, contextKey, plays: got, sources: srcs });
      return { plays: got, sources: srcs };
    })();
    if (!existing) {
      CASES_INFLIGHT.set(inflightKey, promise);
      promise.finally(() => CASES_INFLIGHT.delete(inflightKey));
    }

    setCasesError(null);
    promise
      .then((result) => {
        if (cancelled) return;
        const r = result as { plays: MarketingPlay[]; sources: CasesSource[] };
        setPlays(r.plays);
        setCasesSources(r.sources);
        if (r.plays.length === 0) {
          setCasesError(ko ? "사례를 받아오지 못했어요. 잠시 후 다시 시도해주세요." : "Could not load cases. Try again later.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[MarketingSurface] cases fetch failed:", err);
          const status = (err as { status?: number })?.status ?? 0;
          setCasesError(humanizeAiError(err instanceof Error ? err.message : String(err), status, ko));
        }
      })
      .finally(() => { if (!cancelled) setCasesLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.storeName, subIndustryId, categoryId, d.language, casesNonce]);

  // ── 주간 밈·챌린지 팩 (전역 주 1회 수집 — /api/ai/marketing/meme-pack) ──
  // 생성이 아니라 DB 읽기(저비용). 캐시: 같은 주차·같은 업종·fresh 면 스킵.
  const [memePack, setMemePack] = useState<MemePackCache | null>(mkt.memePackCache);
  useEffect(() => {
    const weekKey = getIsoWeekKey();
    const cache = mkt.memePackCache;
    if (cache && cache.weekKey === weekKey && !cache.stale && cache.categoryId === categoryId && cache.items.length > 0) {
      setMemePack(cache);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;
        const res = await fetch(`/api/ai/marketing/meme-pack?categoryId=${encodeURIComponent(categoryId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const j = await res.json();
        if (cancelled || !Array.isArray(j.items) || j.items.length === 0) return;
        const next: MemePackCache = {
          weekKey: typeof j.weekKey === "string" ? j.weekKey : weekKey,
          stale: !!j.stale,
          categoryId,
          items: j.items as MemeItem[],
          generatedAt: typeof j.generatedAt === "string" ? j.generatedAt : new Date().toISOString(),
        };
        setMemePack(next);
        mkt.setMemePackCache(next);
      } catch { /* graceful — 이전 캐시/빈 상태 유지 */ }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // ── 플레이 "했어요" 체크 (실행→측정 피드백 루프) ──
  const currentWeekKey = getIsoWeekKey();
  const [doneTitles, setDoneTitles] = useState<Set<string>>(new Set());
  // 주간 플레이 체크 hydrate — 마운트/주차 변경 시 1회 + 원격 변경(다른 기기) 수신 시 재조회.
  const loadProgress = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/ai/marketing/play-progress?weekKey=${currentWeekKey}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const j = await res.json();
      if (Array.isArray(j.done)) setDoneTitles(new Set(j.done as string[]));
    } catch { /* graceful */ }
  }, [currentWeekKey]);
  useEffect(() => {
    void loadProgress();
    // marketing_play_progress 는 Zustand 밖 독립 hydrate — usePersistence 의 realtime 구독이
    //   buildup:remote-data-changed 를 발행하면 재조회해 다른 기기 체크가 즉시 반영되게 한다.
    const onRemote = () => { void loadProgress(); };
    window.addEventListener("buildup:remote-data-changed", onRemote);
    return () => { window.removeEventListener("buildup:remote-data-changed", onRemote); };
  }, [loadProgress]);

  const toggleDone = async (title: string) => {
    const next = new Set(doneTitles);
    const willDo = !next.has(title);
    if (willDo) next.add(title); else next.delete(title);
    setDoneTitles(next); // optimistic
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      await fetch("/api/ai/marketing/play-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weekKey: currentWeekKey, playTitle: title, done: willDo }),
      });
    } catch { /* 낙관적 유지 */ }
  };

  // 최근 매출 추세 — cases 엔진 피드백(지난주 실행 후 숫자 변화)용
  const salesTrendPct = useMemo(() => {
    const entries = ((d.dailyEntries ?? []) as Array<{ date: string; sales: number }>).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length < 14) return undefined;
    const last7 = entries.slice(-7), prev7 = entries.slice(-14, -7);
    const a = last7.reduce((s, e) => s + e.sales, 0) / 7, p = prev7.reduce((s, e) => s + e.sales, 0) / 7;
    if (p <= 0) return undefined;
    return Math.round(((a - p) / p) * 1000) / 10;
  }, [d.dailyEntries]);

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
  const canRegenerateCases = casesError !== null || plays.length === 0;
  const handleRegenerateCases = () => {
    if (!canRegenerateCases || casesLoading) return;
    setCasesError(null);
    mkt.setCasesCache(null);
    setCasesNonce((n) => n + 1);
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
    void d.flushStoreDataImmediate?.(); // 즉시 서버 동기화(기기 간 즉시 반영)
  };

  const handleDeleteCampaign = (id: string) => {
    mkt.setCampaigns(mkt.campaigns.filter((c) => c.id !== id));
    void d.flushStoreDataImmediate?.();
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
          fontSize: 14, color: "var(--muted)",
          lineHeight: 1.55, margin: 0, maxWidth: 580,
        }}>
          {ko
            ? "이번 주에 딱 하나. 읽을 건 줄이고, 바로 쓸 것만 드려요."
            : "Just one thing this week — less to read, more to use right away."}
        </p>
      </header>

      {/* ━━━ 섹션 1: 이번 주 핵심 1가지 + 채널 진행도 (단일 엔진) ━━━ */}
      <MarketingFocus
        plays={plays}
        loading={casesLoading}
        error={casesError}
        sources={casesSources}
        ko={ko}
        hasStore={!!d.storeName}
        activeChannels={activeChannels}
        categoryId={categoryId}
        canRefresh={canRegenerateCases}
        onRefresh={handleRegenerateCases}
        doneTitles={doneTitles}
        onToggleDone={toggleDone}
      />

      {/* ━━━ 섹션 1.2: 이번 주 밈·챌린지 (2026-07-24 신설 — 전역 주간 팩, 원본만·개사 없음) ━━━ */}
      <MemeLane pack={memePack} ko={ko} />

      {/* ━━━ 섹션 1.5: 카드뉴스 만들기 (2026-07-21 신설 — 지금 무료, 9월부터 프로 전용) ━━━ */}
      <CardNewsStudio
        ko={ko}
        storeName={d.storeName ?? ""}
        industryCategoryId={categoryId}
        subIndustryId={subIndustryId}
        subIndustryLabel={subIndustryLabel}
        isOperating={!!d.businessLaunched}
        dailyEntries={(d.dailyEntries ?? []) as Array<{ sales: number; customers: number }>}
      />

      {/* ━━━ 섹션 2+3: 마케팅 장부 (2026-07-24 개편 — 기본 접힘, 요약 한 줄이 먼저 말한다) ━━━ */}
      <article style={solidCard}>
        <button
          type="button"
          onClick={() => setLedgerOpen((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left" as const,
          }}
        >
          <div>
            <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "2px" }}>
              {ko ? "마케팅 장부" : "Marketing Ledger"}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
              {ko
                ? `이달 ${totalSpend > 0 ? fmt(totalSpend) : "0원"} · ROAS ${blendedRoas > 0 ? `${blendedRoas.toFixed(1)}x` : "—"} · 채널 ${activeChannels.length}개`
                : `MTD ${totalSpend > 0 ? fmt(totalSpend) : "0"} · ROAS ${blendedRoas > 0 ? `${blendedRoas.toFixed(1)}x` : "—"} · ${activeChannels.length} channels`}
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={2} color="var(--muted)" style={{ flexShrink: 0, transform: ledgerOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>
      </article>

      {ledgerOpen && (<>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "10px" }}>
        <div style={{ ...kpiCard, borderColor: "rgba(59,92,140,0.1)" }}>
          <div style={kpiLabel}>
            {ko ? "이달 마케팅 지출" : "SPEND MTD"}
          </div>
          {totalSpend > 0 ? (
            <div style={{ ...kpiValue, color: "#3b5c8c" }}>{fmt(totalSpend)}</div>
          ) : (
            <div style={kpiHint}>{ko ? "캠페인 추가 시 집계" : "Add campaigns to track"}</div>
          )}
        </div>
        <div style={{ ...kpiCard, borderColor: "rgba(25,25,112,0.1)" }}>
          <div style={kpiLabel}>ROAS</div>
          {blendedRoas > 0 ? (
            <div style={{ ...kpiValue, color: blendedRoas >= 1 ? "#1d3557" : "#b64c4c" }}>
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
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)", marginLeft: "6px" }}>
                {ko ? "개" : ""}
              </span>
            </div>
          ) : (
            <div style={kpiHint}>{ko ? "아직 없음" : "None yet"}</div>
          )}
        </div>
      </div>


      {/* ━━━ 섹션 3: 채널별 지출 추적 ━━━ */}
      <article style={solidCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "2px" }}>
              {ko ? "지출 추적" : "Spend Tracking"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {ko ? "채널별 마케팅 지출" : "Channel Spend"}
            </div>
          </div>
          <button type="button" onClick={() => mkt.setCampFormOpen(!mkt.campFormOpen)} style={{
            fontSize: "12px", fontWeight: 640, color: "#3b5c8c", background: "none", border: "none", cursor: "pointer",
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
                background: active ? "rgba(25,25,112,0.08)" : "rgba(15,23,42,0.03)",
                color: active ? "#1d3557" : "rgba(15,23,42,0.4)",
                border: active ? "1px solid rgba(25,25,112,0.15)" : "1px solid rgba(15,23,42,0.04)",
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
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>
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
            border: "1px dashed rgba(59,92,140,0.15)", background: "transparent",
            cursor: "pointer", fontSize: "13px", color: "var(--muted)", fontWeight: 500,
            marginBottom: "12px",
          }}>
            {ko ? "마케팅 지출을 기록하면 ROI를 추적할 수 있어요" : "Log marketing spend to track ROI"}
          </button>
        ) : null}

        {/* 캠페인 추가 폼 */}
        {mkt.campFormOpen && (
          <div style={{
            padding: "14px", borderRadius: "14px",
            background: "rgba(59,92,140,0.02)", border: "1px solid rgba(59,92,140,0.08)",
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
              background: mkt.campSpend ? "linear-gradient(135deg, #3b5c8c 0%, #a855f7 100%)" : "rgba(15,23,42,0.06)",
              color: mkt.campSpend ? "#fff" : "rgba(15,23,42,0.3)",
              fontSize: "13px", fontWeight: 650,
            }}>
              {ko ? "추가" : "Add"}
            </button>
          </div>
        )}
      </article>
      </>)}
    </main>
  );
}

// ─── 공통 스타일 (앱 전역 토큰 기반 · Apple HIG) ───
// 기준: styles.card(radius 28px), AnalyticsSurface(KPI radius 18px)
// 액센트: 블루 #3b5c8c(중립 포커스), 미드나잇 네이비 #1d3557/#191970, 벽돌 danger #b64c4c.
// 신호등 컬러 금지 — 성공/효과는 네이비 농담으로 표현(초록 사용 X).

const COLOR_ACCENT = "#3b5c8c";           // Apple 포커스·코칭 강조
const COLOR_SUCCESS = "#1d3557";          // 미드나잇 네이비 — 성공 사례·효과 (초록 아님)
const COLOR_NEUTRAL_TEXT = "var(--text)"; // #111
const COLOR_NEUTRAL_MUTED = "var(--muted)"; // #5b616e

// 이번 주 핵심 1가지 + 채널 진행도 (단일 마케팅 엔진의 진입 섹션)
function MarketingFocus({
  plays, loading, error, sources, ko, hasStore, activeChannels, categoryId, canRefresh, onRefresh, doneTitles, onToggleDone,
}: {
  plays: MarketingPlay[];
  loading: boolean;
  error: string | null;
  sources: CasesSource[];
  ko: boolean;
  hasStore: boolean;
  activeChannels: MarketingChannel[];
  categoryId: string;
  canRefresh: boolean;
  onRefresh: () => void;
  doneTitles: Set<string>;
  onToggleDone: (title: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const hero = plays[0];
  const rest = plays.slice(1);

  return (
    <article style={solidCard}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(59,92,140,0.75)", marginBottom: "2px" }}>
            {ko ? "이번 주 마케팅" : "This Week"}
          </div>
          <div style={{ fontSize: "17px", fontWeight: 750, color: "var(--text)", letterSpacing: "-0.02em" }}>
            {ko ? "딱 이거 하나만 하세요" : "Just do this one thing"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.5 }}>
            {ko ? "내 업종 최신 성공사례로 고른 가장 중요한 1가지. 한 번에 한 채널씩." : "The single most important move, from real cases in your industry."}
          </div>
          {/* AI 기본법 생성물 표시 — 사례 요약·적용 방법은 생성형 AI 가 웹 조사 후 합성한 내용 */}
          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginTop: "3px" }}>
            {ko ? "생성형 AI가 웹 사례를 조사·요약한 내용입니다 — 실행 전 출처를 확인하세요." : "Summarized by generative AI from web research — verify sources before acting."}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!canRefresh || loading}
          title={canRefresh ? (ko ? "다시 찾기" : "Refresh") : (ko ? "이미 최신이에요" : "Up to date")}
          aria-label={ko ? "다시 찾기" : "Refresh"}
          style={{
            flexShrink: 0, width: "34px", height: "34px", borderRadius: "10px",
            border: "1px solid var(--border)", background: "var(--surface-strong)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: canRefresh && !loading ? "pointer" : "not-allowed", opacity: canRefresh && !loading ? 1 : 0.45,
          }}
        >
          <RefreshCw size={14} strokeWidth={2} color="#3b5c8c" style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
        </button>
      </div>

      {hasStore && <ChannelProgress activeChannels={activeChannels} categoryId={categoryId} ko={ko} />}

      {loading && !hero && (
        <div style={{ padding: "28px 16px", textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
          {ko ? "내 업종 성공사례를 조사하고 실행물을 만들고 있어요… (최대 1분, 주 1회)" : "Researching cases and drafting your materials… (up to 1 min, once a week)"}
        </div>
      )}
      {!loading && error && !hero && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(182,76,76,0.06)", fontSize: "13px", color: "#b64c4c", lineHeight: 1.5 }}>{error}</div>
      )}
      {!loading && !error && !hero && !hasStore && (
        <div style={{ padding: "22px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
            {ko ? "가게 정보를 입력하면 맞춤 추천을 시작해요" : "Add your store to start"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
            {ko ? "마이페이지 > 가게 정보에서 상호·업종을 입력해 주세요." : "Set your store name and industry in Profile."}
          </div>
        </div>
      )}

      {hero && (
        <>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#3b5c8c", margin: "2px 0 8px" }}>
            {ko ? "이번 주 핵심 1가지" : "Top priority this week"}
          </div>
          <PlayBlock p={hero} ko={ko} hero done={doneTitles.has(hero.title)} onToggleDone={onToggleDone} />
          {rest.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: "12px",
                  border: "1px solid var(--border)", background: "var(--surface-strong)",
                  fontSize: "13px", fontWeight: 600, color: "var(--text)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "inherit",
                }}
              >
                {showMore
                  ? (ko ? "접기" : "Show less")
                  : (ko ? `이번 주 추가 플레이 ${rest.length}개 더 보기` : `${rest.length} more plays`)}
                <ChevronRight size={14} strokeWidth={2} style={{ transform: showMore ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {showMore && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                  {rest.map((p, i) => <PlayBlock key={i} p={p} ko={ko} done={doneTitles.has(p.title)} onToggleDone={onToggleDone} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {sources.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--muted)" }}>{ko ? "출처" : "Sources"}</span>
          {sources.slice(0, 5).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#3b5c8c", textDecoration: "none", background: "rgba(59,92,140,0.06)", padding: "2px 8px", borderRadius: "6px" }}>{s.name}</a>
          ))}
        </div>
      )}
    </article>
  );
}

// 이번 주 밈·챌린지 레인 — 업자용 소스(고구마팜·캐릿 등)에서 주 1회 수집한 전역 팩.
// 원칙(2026-07-24): 원본 설명 + 원본 링크만 보여주고 적용은 사장님 몫 — AI 개사 금지.
function MemeLane({ pack, ko }: { pack: MemePackCache | null; ko: boolean }) {
  if (!pack || pack.items.length === 0) return null; // 팩 없으면 섹션 자체를 숨김 — 빈 껍데기 금지
  const kindLabel = (k: MemeItem["kind"]) =>
    k === "meme" ? (ko ? "밈" : "Meme") : k === "challenge" ? (ko ? "챌린지" : "Challenge") : (ko ? "포맷" : "Format");
  return (
    <article style={solidCard}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
            <span style={{ fontSize: "10px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(59,92,140,0.75)" }}>
              {ko ? "이번 주 밈·챌린지" : "Memes & challenges"}
            </span>
            {pack.stale && (
              <span style={{ fontSize: "10px", fontWeight: 650, color: "var(--muted)", background: "rgba(17,17,17,0.05)", padding: "2px 7px", borderRadius: "6px" }}>
                {ko ? "지난주 소재" : "Last week"}
              </span>
            )}
          </div>
          <div style={{ fontSize: "17px", fontWeight: 750, color: "var(--text)", letterSpacing: "-0.02em" }}>
            {ko ? "요즘 도는 것들" : "What's circulating now"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.5 }}>
            {ko
              ? "마케터들이 보는 트렌드 매체에서 매주 자동 수집 — 원본만 보여드려요. 적용은 사장님 몫."
              : "Collected weekly from trend media marketers actually read — originals only."}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", overflowX: "auto" as const, paddingBottom: "6px", WebkitOverflowScrolling: "touch" as const }}>
        {pack.items.map((it, i) => (
          <div
            key={`${it.title}-${i}`}
            style={{
              minWidth: "218px", maxWidth: "218px", display: "flex", flexDirection: "column" as const, gap: "6px",
              padding: "14px", borderRadius: "14px", border: "1px solid var(--border)", background: "#fff",
            }}
          >
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted)" }}>
              {kindLabel(it.kind)} · {it.sourceName}
              {it.publishedAt ? <span style={{ fontWeight: 500 }}> · {it.publishedAt.slice(5).replace("-", "/")}</span> : null}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>{it.title}</div>
            <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.55 }}>{it.originDesc}</div>
            {it.originExample && (
              <div style={{ fontSize: "11.5px", color: "#3b5c8c", lineHeight: 1.5, fontStyle: "italic" as const }}>
                {ko ? "원문 활용례: " : "From source: "}{it.originExample}
              </div>
            )}
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingTop: "8px" }}>
              {it.effortLabel ? (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#3b5c8c", background: "rgba(59,92,140,0.08)", padding: "3px 8px", borderRadius: "999px" }}>
                  {it.effortLabel}
                </span>
              ) : <span />}
              <a
                href={it.originUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logMarketingEvent("meme_origin_click")}
                style={{ fontSize: "12px", fontWeight: 700, color: "#3b5c8c", textDecoration: "none" }}
              >
                {ko ? "원본 보기 →" : "View original →"}
              </a>
            </div>
            <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#3b5c8c", borderTop: "1px dashed var(--border)", paddingTop: "8px" }}>
              {it.applyHint}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

// 채널 진행도 — 리서치 우선순위(네이버 플레이스 → 인스타 → 업종 추천)로 "다음 한 채널" 안내.
// 2026-07-24 개편: 기본 접힘 — 요약 한 줄("지금은 X")만 보이고, 펼치면 칩·설명.
function ChannelProgress({ activeChannels, categoryId, ko }: { activeChannels: MarketingChannel[]; categoryId: string; ko: boolean }) {
  const [open, setOpen] = useState(false);
  const rec = RECOMMENDED_CHANNELS[categoryId] ?? RECOMMENDED_CHANNELS["food"];
  const ordered: MarketingChannel[] = [];
  for (const c of (["naver-place", "instagram", ...rec] as MarketingChannel[])) {
    if (!ordered.includes(c)) ordered.push(c);
  }
  const top = ordered.slice(0, 4);
  const activeSet = new Set(activeChannels);
  const next = top.find((c) => !activeSet.has(c));
  const labelOf = (c: MarketingChannel) => {
    const m = CHANNEL_LIST.find((x) => x.key === c);
    return m ? (ko ? m.label.ko : m.label.en) : c;
  };
  return (
    <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "14px", background: "rgba(59,92,140,0.03)", border: "1px solid rgba(59,92,140,0.08)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
          background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left" as const,
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 600 }}>
          <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "var(--muted)", marginRight: "8px" }}>
            {ko ? "채널 우선순위" : "Channel"}
          </span>
          {next
            ? (ko ? `지금은 ${labelOf(next)} — 한 번에 하나씩` : `Now: ${labelOf(next)}`)
            : (ko ? "상위 채널 모두 활성" : "All core channels active")}
        </span>
        <ChevronRight size={13} strokeWidth={2} color="var(--muted)" style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (<>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
        {top.map((c) => {
          const done = activeSet.has(c);
          const isNext = c === next;
          const color = done ? "#1d3557" : isNext ? "#3b5c8c" : "var(--muted)";
          const bg = done ? "rgba(25,25,112,0.08)" : isNext ? "rgba(59,92,140,0.10)" : "rgba(17,17,17,0.03)";
          return (
            <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11.5px", fontWeight: 600, color, background: bg, border: `1px solid ${color}22`, padding: "4px 9px", borderRadius: "8px" }}>
              {done ? "✓" : isNext ? "→" : ""} {labelOf(c)}
            </span>
          );
        })}
      </div>
      {next && (
        <div style={{ fontSize: "12px", color: "var(--text)", marginTop: "9px", lineHeight: 1.5 }}>
          <b style={{ color: "#3b5c8c", fontWeight: 680 }}>{ko ? "다음: " : "Next: "}</b>
          {ko ? `${labelOf(next)}부터 집중해보세요. 모든 채널 동시에 X.` : `Focus on ${labelOf(next)} next — not all channels at once.`}
        </div>
      )}
      </>)}
    </div>
  );
}

// 복사 실행물 한 줄 — "적용 3단계" 를 "버튼" 으로 바꾸는 단위. 클릭 → 클립보드 + 1.6초 확인 표시.
function CopyRow({ label, content, ko }: { label: string; content: string; ko: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      logMarketingEvent("copy_click"); // "쓸 재료였는가"의 직접 신호
    } catch { /* 클립보드 권한 거부 — 조용히 무시 (내용은 화면에 보임) */ }
  };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      background: "rgba(59,92,140,0.04)", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px 12px",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12.5px", fontWeight: 650, color: "var(--text)" }}>{label}</div>
        <div style={{ fontSize: "11.5px", color: "var(--muted)", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
          {content}
        </div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          flexShrink: 0, fontSize: "12px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
          padding: "7px 13px", borderRadius: "9px",
          border: copied ? "1px solid #1d3557" : "1px solid rgba(59,92,140,0.3)",
          background: copied ? "rgba(25,25,112,0.08)" : "#fff",
          color: copied ? "#1d3557" : "#3b5c8c",
        }}
      >
        {copied ? (ko ? "✓ 복사됨" : "✓ Copied") : (ko ? "복사" : "Copy")}
      </button>
    </div>
  );
}

// 마케팅 플레이 카드 (2026-07-24 v2 — "읽는 보고서" → "쓸 재료"):
//   보이는 것 = 미션 한 문장 + 시간 배지 + 복사 실행물 버튼 + "했어요".
//   설명(사례 근거·단계·효과·도구)은 "왜 이걸 하래요?" 접기 뒤로 — 지우지 않고 강요만 없앰.
//   구캐시(v1, mission 없음)는 steps 폴백 렌더로 하위호환.
function PlayBlock({ p, ko, done, onToggleDone, hero }: { p: MarketingPlay; ko: boolean; done?: boolean; onToggleDone?: (title: string) => void; hero?: boolean }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const isCase = p.kind === "case";
  const accent = isCase ? "#1d3557" : "#3b5c8c";
  const kindLabel = isCase ? (ko ? "검증된 사례" : "Proven case") : (ko ? "지금 뜨는 트렌드" : "Trending now");
  const mission = p.mission || p.title;
  const deliverables = p.deliverables ?? [];
  const hasDeliverables = deliverables.length > 0;
  const upper = "uppercase" as const;
  return (
    <div style={{ borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface-strong)", padding: "15px 16px" }}>
      {/* 배지 줄 — 시간이 제일 앞 (사장님의 첫 질문은 "얼마나 걸리는데") */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
        {p.timeLabel && (
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: "#1d3557", color: "#fff" }}>
            ⏱ {p.timeLabel}
          </span>
        )}
        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: `${accent}12`, color: accent }}>{kindLabel}</span>
        {isCase && p.source.brand && <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)" }}>{p.source.brand}</span>}
      </div>

      {/* 미션 한 문장 — 첫 화면의 주인공 */}
      <div style={{ fontSize: hero ? "19px" : "15px", fontWeight: 750, color: "var(--text)", letterSpacing: "-0.015em", lineHeight: 1.35, textWrap: "balance" as const }}>
        {mission}
      </div>

      {/* 실행물 — 복사 버튼 (v2) / 구캐시는 기존 단계 폴백 */}
      {hasDeliverables ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
          {deliverables.map((dv, i) => <CopyRow key={i} label={dv.label} content={dv.content} ko={ko} />)}
        </div>
      ) : (
        <ol style={{ margin: "12px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "7px" }}>
          {p.application.steps.map((s, i) => (
            <li key={i} style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.5, display: "flex", gap: "9px", alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, width: "19px", height: "19px", borderRadius: "6px", background: "#1d3557", color: "#fff", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{s}</span>
            </li>
          ))}
        </ol>
      )}

      {/* "왜 이걸 하래요?" — 근거는 지우지 않고 접는다 (신뢰는 원하는 사람만) */}
      <button
        type="button"
        onClick={() => setWhyOpen((v) => !v)}
        style={{
          marginTop: "12px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
          background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer",
          padding: "10px 2px 0", fontFamily: "inherit", fontSize: "12.5px", fontWeight: 650, color: "var(--muted)", textAlign: "left" as const,
        }}
      >
        {ko ? "왜 이걸 하래요?" : "Why this?"}
        <ChevronRight size={13} strokeWidth={2} style={{ flexShrink: 0, transform: whyOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {whyOpen && (
        <div style={{ marginTop: "10px", padding: "12px 13px", borderRadius: "12px", background: `${accent}05`, display: "flex", flexDirection: "column", gap: "9px" }}>
          <div>
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: upper, color: accent, marginBottom: "5px" }}>
              {isCase ? (ko ? "이렇게 했어요" : "What they did") : (ko ? "지금 이게 통해요" : "What's working")}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.55 }}>{p.source.whatHappened}</div>
            {p.source.whyItWorked && (
              <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.55, marginTop: "5px" }}>
                <b style={{ color: accent, fontWeight: 680 }}>{ko ? "왜 통했나 " : "Why "}</b>{p.source.whyItWorked}
              </div>
            )}
            {(p.source.metric || p.source.url) && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "7px", flexWrap: "wrap" }}>
                {p.source.metric && <span style={{ fontSize: "11px", fontWeight: 700, color: accent, background: `${accent}10`, padding: "2px 8px", borderRadius: "6px" }}>{p.source.metric}</span>}
                {p.source.url && <a href={p.source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: accent, textDecoration: "none" }}>{ko ? "출처 보기 →" : "Source →"}</a>}
              </div>
            )}
          </div>
          {hasDeliverables && p.application.steps.length > 0 && (
            <div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: upper, color: "#1d3557", marginBottom: "5px" }}>
                {ko ? "자세한 순서" : "Detailed steps"}
              </div>
              <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {p.application.steps.map((s, i) => (
                  <li key={i} style={{ fontSize: "12.5px", color: "var(--text)", lineHeight: 1.5, display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: "17px", height: "17px", borderRadius: "5px", background: "#1d3557", color: "#fff", fontSize: "10px", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}>{i + 1}</span>
                    <span style={{ flex: 1 }}>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {p.application.expectedEffect && (
            <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.5, padding: "9px 11px", borderRadius: "10px", background: "rgba(25,25,112,0.05)" }}>
              <b style={{ color: "#1d3557", fontWeight: 680 }}>{ko ? "기대 효과 " : "Impact "}</b>{p.application.expectedEffect}
            </div>
          )}
          {p.tools.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.tools.map((t, i) => {
                const tc = t.tier === "free" ? "#1d3557" : "#3b5c8c";
                const tl = t.tier === "free" ? (ko ? "무료" : "Free") : t.tier === "paid" ? (ko ? "유료" : "Paid") : (ko ? "부분무료" : "Freemium");
                const inner = (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 600, color: "var(--text)", border: `1px solid ${tc}22`, background: `${tc}08`, padding: "4px 9px", borderRadius: "8px" }}>
                    {t.name}
                    <span style={{ fontSize: "9.5px", fontWeight: 700, color: tc }}>{tl}</span>
                  </span>
                );
                return t.url ? <a key={i} href={t.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a> : <span key={i}>{inner}</span>;
              })}
            </div>
          )}
        </div>
      )}

      {onToggleDone && (
        <button
          type="button"
          onClick={() => onToggleDone(p.title)}
          style={{
            marginTop: "12px", width: "100%", padding: "10px 14px", borderRadius: "10px",
            fontSize: "13px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
            border: done ? "1px solid #1d3557" : "1px solid var(--border)",
            background: done ? "rgba(25,25,112,0.10)" : "var(--surface-strong)",
            color: done ? "#1d3557" : "var(--text)",
          }}
        >
          {done
            ? (ko ? "✓ 이번 주에 했어요" : "✓ Done this week")
            : (ko ? "이거 했어요 — 다음 주 추천에 반영" : "Mark done — shapes next week")}
        </button>
      )}
    </div>
  );
}

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
