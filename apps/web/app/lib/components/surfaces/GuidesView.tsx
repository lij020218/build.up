"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { useProfileStore } from "../../stores/profile-store";
import { OwnerProfileChips, ageFromBirthYear } from "../dashboard/OwnerProfileChips";
import {
  getMatchedProgramsV2,
  getRecommendedPrograms,
  getApplicationStatusLabel,
  getProgramCategoryLabel,
  getProgramBonusFactors,
  isFundableProgram,
  type StartupProgram,
  type ProgramCategory,
  type ApplicationStatus,
  type MatchCriteria,
} from "@foundone/shared";
import { ExternalLink, Award, Calendar, Building2, Target, Sparkles, AlertCircle, Wand2, MapPin, Lightbulb, Search, FileText } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { FundingScoreModal, type FundingScore } from "./FundingScoreModal";
import { FundingPlanModal, type PlanUserPayload } from "./FundingPlanModal";

/**
 * GuidesView — 펀딩 페이지 (Midnight Blue 디자인 철학)
 *
 * 디자인 토큰 (보고서·로드맵 단계와 통일):
 *   - MIDNIGHT #191970 단색 + 1px outline + 살짝 틴트 배경
 *   - 사이드 컬러 strip 금지 — outline + soft tint
 *   - lucide stroke 1.5, round caps
 *   - bento-card hover transition
 */

const MIDNIGHT = "#191970";
const MIDNIGHT_DEEP = "#0f0f4a";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_BORDER_LIGHT = "rgba(25,25,112,0.08)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_TINT = "rgba(25,25,112,0.04)";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "rgba(15,23,42,0.55)";
const TEXT_SUBTLE = "rgba(15,23,42,0.45)";
const GREEN = "#1d3557";
const AMBER = "#191970";
const RED = "#b64c4c";

type CategoryFilter = "all" | ProgramCategory;
type StatusFilter = "all" | ApplicationStatus;

// 검색 별칭 — 한글로 쳐도 영문 표기 기관/사업이 잡히도록 (예: "카이스트" → "kaist")
const SEARCH_ALIASES: Record<string, string> = {
  "카이스트": "kaist", "케이스트": "kaist", "포스텍": "postech", "유니스트": "unist",
  "지스트": "gist", "디지스트": "dgist", "서울대": "snu", "연세대": "yonsei", "고려대": "korea",
  "네이버": "naver", "카카오": "kakao", "삼성": "samsung", "현대": "hyundai", "엘지": "lg",
  "에스케이": "sk", "티아이피에스": "tips", "팁스": "tips",
};

const INDUSTRY_LABEL_KO: Record<string, string> = {
  food: "음식", "cafe-dessert": "카페·디저트", retail: "소매·유통", beauty: "뷰티",
  fitness: "피트니스", education: "교육", pet: "반려동물", "living-service": "생활서비스",
  space: "공간", "online-digital": "온라인", "startup-tech": "기술창업",
};

// 라이브 공고 클라이언트 캐시 — 재방문 시 네트워크 응답 전이라도 직전 결과(342개) 즉시 복원.
const LIVE_CACHE_KEY = "foundone.funding.live.v1";
const LIVE_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — 서버 Data Cache 와 동일 주기

// ── 파운드원 1차 창업지원금 (앱 내부 신청) — 접수 기간·발표일은 서버(/api/funding/apply)와 동일 ──
const GRANT_PROGRAM_ID = "foundone-startup-grant-1";
const GRANT_APPLY_OPEN = "2026-06-15";
const GRANT_APPLY_CLOSE = "2026-08-15";
const GRANT_ANNOUNCE = "2026-08-22";
/** 현재 KST 날짜 (YYYY-MM-DD). */
function kstTodayStr(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
type GrantWindowState = "before" | "open" | "closed";
function grantWindowState(today = kstTodayStr()): GrantWindowState {
  if (today < GRANT_APPLY_OPEN) return "before";
  if (today > GRANT_APPLY_CLOSE) return "closed";
  return "open";
}
function fmtDot(iso: string): string {
  return iso.replaceAll("-", ".");
}

export function GuidesView() {
  const d = useDashboardCtx();
  const {
    language,
    startupType,
    selectedBudget,
    preferredRegionInput,
    businessLaunched,
    industryCategoryId,
  } = d;
  const businessLaunchedDate = (d as { businessLaunchedDate?: string | null }).businessLaunchedDate ?? null;
  const storeName = (d as { storeName?: string }).storeName ?? "";
  const selectedSpecialtyId = (d as { selectedSpecialtyId?: string }).selectedSpecialtyId;
  const selectedIndustryId = (d as { selectedIndustryId?: string }).selectedIndustryId;
  const products = ((d as { products?: unknown[] }).products as unknown[] | undefined) ?? [];
  const taxSettings = (d as { taxSettings?: { vatType?: string; hasEmployees?: boolean } }).taxSettings;
  // 지원사업 매칭 보강 — 출생연도·신용·폐업·장애 (로컬 영속 profile-store, primitive selector = 안전).
  const ownerBirthYear = useProfileStore((s) => s.ownerBirthYear);
  const ownerNcbScore = useProfileStore((s) => s.ownerNcbScore);
  const ownerConsideringClosure = useProfileStore((s) => s.ownerConsideringClosure);
  const ownerIsDisabledOwner = useProfileStore((s) => s.ownerIsDisabledOwner);

  // ⚠️ 이전: useStoreInfoStore + useInterviewStore 직접 구독 → React #185 무한 렌더 루프 발생
  //  (Zustand persist hydration + 다중 셀렉터가 어디선가 setState 무한 루프 유발).
  //  방어적으로 *제거* — AI 점수 보기에 store-info / interview 데이터는 *없어도* 동작.
  //  필요 시 추후 안정적인 selector 설계 후 재도입.
  const ko = language === "ko";

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // 지역/업종/연령 필터 (라이브+큐레이션 공통)
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<"all" | "youth" | "senior">("all");

  // ── 라이브 공고 병합 (기업마당 + K-Startup) — 키 없거나 실패 시 큐레이션 폴백 ──
  //   /api/funding/live 가 큐레이션+라이브를 이미 병합해 반환. 로드 전엔 정적 큐레이션 사용.
  const [livePrograms, setLivePrograms] = useState<StartupProgram[] | null>(null);
  useEffect(() => {
    let alive = true;
    // (a) 직전 라이브 결과 즉시 복원 — 네트워크 응답 전이라도 342개 바로 표시(깜빡임 제거).
    try {
      const raw = localStorage.getItem(LIVE_CACHE_KEY);
      if (raw) {
        const c = JSON.parse(raw) as { at: number; programs: StartupProgram[] };
        if (c && Array.isArray(c.programs) && c.programs.length > 0 && Date.now() - c.at < LIVE_CACHE_TTL_MS) {
          setLivePrograms(c.programs);
        }
      }
    } catch { /* ignore — 캐시 손상/미지원 */ }
    // (b) 최신 라이브 페치 → 갱신 + 캐시 저장.
    (async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/funding/live", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (alive && Array.isArray(data.programs)) {
          setLivePrograms(data.programs as StartupProgram[]);
          try {
            localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({ at: Date.now(), programs: data.programs }));
          } catch { /* quota 초과 등 — 무시 */ }
        }
      } catch { /* graceful — 정적 큐레이션 폴백 */ }
    })();
    return () => { alive = false; };
  }, []);
  /**
   * 추천 모드 — 사용자 지침 (2026-05-11):
   *  "사용자의 업종, 현 상황, 매출, 사업 규모 크기 등을 고려해서 사용자에게 적합한 지원 프로그램을
   *   추천하는 버튼을 만들라. AI 필요없이 코딩으로만." → 토글 형태. ON 시 matchScore 상위 N개만 노출.
   */
  const [recommendMode, setRecommendMode] = useState(false);
  const RECOMMEND_TOP_N = 6;

  // ── 사장님 상황 신호 — 위기 시 운영자금 우선, 성장 시 투자 우선 ──
  const employees = (d.employees as { id: string }[] | undefined) ?? [];
  const dailyEntries = (d.dailyEntries as { date: string; sales: number }[] | undefined) ?? [];
  const monthlyCosts = (d.monthlyCosts as Record<string, number> | undefined);
  const initialOperatingCapital = (d as { initialOperatingCapital?: number }).initialOperatingCapital;

  // 런웨이 추정 (간단 — 자본금 / 월 burn)
  const runwayMonths: number | undefined = useMemo(() => {
    const cash = initialOperatingCapital;
    if (!cash || cash <= 0 || !monthlyCosts) return undefined;
    const totalCost = Object.values(monthlyCosts).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
    if (totalCost <= 0) return undefined;
    // 최근 7일 매출 평균 → 월 환산
    const sorted = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    if (last7.length === 0) return cash / totalCost; // 매출 없으면 burn = cost
    const avg = last7.reduce((s, e) => s + e.sales, 0) / last7.length;
    const monthlyRev = avg * 26;
    const burn = Math.max(1, totalCost - monthlyRev);
    return Math.round((cash / burn) * 10) / 10;
  }, [initialOperatingCapital, monthlyCosts, dailyEntries]);

  // 주간 매출 변화율
  const weeklySalesChangePct: number | undefined = useMemo(() => {
    if (dailyEntries.length < 14) return undefined;
    const sorted = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    const prev7 = sorted.slice(-14, -7);
    const avg7 = last7.reduce((s, e) => s + e.sales, 0) / Math.max(1, last7.length);
    const avgPrev = prev7.reduce((s, e) => s + e.sales, 0) / Math.max(1, prev7.length);
    if (avgPrev <= 0) return undefined;
    return Math.round(((avg7 - avgPrev) / avgPrev) * 1000) / 10;
  }, [dailyEntries]);

  // ── 유저 프로필 + 상황 → 매칭 기준 ──
  const criteria: MatchCriteria = useMemo(() => {
    const businessYears = businessLaunchedDate
      ? Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / (365 * 86400000)))
      : 0;
    // 매출 (월 환산) — 사업 규모 매칭에 사용
    const sortedEntries = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sortedEntries.slice(-7);
    const avgDaily = last7.length > 0
      ? last7.reduce((s, e) => s + e.sales, 0) / last7.length
      : 0;
    const monthlyAvgRevenue = avgDaily > 0 ? Math.round(avgDaily * 26) : 0;
    const hasUserSales = dailyEntries.some((e) => e.sales > 0);
    return {
      startupType,
      industryCategoryId,
      businessYears: businessLaunched ? businessYears : 0,
      region: preferredRegionInput || undefined,
      capital: selectedBudget ?? undefined,
      businessStage: businessLaunched ? (businessYears >= 3 ? "growth" : "early") : "pre-startup",
      runwayMonths,
      weeklySalesChangePct,
      employeesCount: employees.length,
      monthlyAvgRevenue: monthlyAvgRevenue > 0 ? monthlyAvgRevenue : undefined,
      hasUserSales,
      // 사장님 프로필 보강 (청년/시니어/신용취약/폐업/장애 정책자금 매칭 활성화)
      age: ageFromBirthYear(ownerBirthYear),
      ncbScore: ownerNcbScore,
      consideringClosure: ownerConsideringClosure,
      isDisabledOwner: ownerIsDisabledOwner,
    };
  }, [startupType, industryCategoryId, businessLaunchedDate, businessLaunched, preferredRegionInput, selectedBudget, runwayMonths, weeklySalesChangePct, employees.length, dailyEntries, ownerBirthYear, ownerNcbScore, ownerConsideringClosure, ownerIsDisabledOwner]);

  // ⚠️ 마감된 프로그램은 펀딩 페이지에서 숨김 (2026-05-11).
  //  데이터(startup-programs.ts)는 보존 — 대부분 매년 동일 시기 재공고이므로
  //  내년에는 applicationDeadline·applicationStatus만 갱신하면 자동 노출.
  //  사용자 요청 시 hard delete 옵션도 있음.
  const matchedAll = useMemo(
    () => getMatchedProgramsV2(criteria, livePrograms ?? undefined).filter((p) => p.applicationStatus !== "closed"),
    [criteria, livePrograms],
  );

  // ─── 파운드원 창업지원금 신청 ───
  const [applyModalProgram, setApplyModalProgram] = useState<StartupProgram | null>(null);
  const [grantApplied, setGrantApplied] = useState<boolean | null>(null);

  // 본인 신청 여부 — 마운트 시 1회 조회 + 원격(다른 기기 신청) 변경 시 재조회(버튼 "신청 완료" 표시용).
  const loadGrantApplied = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/funding/apply?programId=${GRANT_PROGRAM_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const j = await res.json();
      setGrantApplied(!!j.applied);
    } catch { /* graceful — 미로그인/네트워크 시 미적용으로 둠 */ }
  }, []);
  useEffect(() => {
    void loadGrantApplied();
    // program_applications 는 Zustand 밖 독립 hydrate — usePersistence realtime 이
    //   buildup:remote-data-changed 를 발행하면 신청 상태를 재조회해 다른 기기 신청을 반영.
    const onRemote = () => { void loadGrantApplied(); };
    window.addEventListener("buildup:remote-data-changed", onRemote);
    return () => { window.removeEventListener("buildup:remote-data-changed", onRemote); };
  }, [loadGrantApplied]);

  // 신청 시 함께 보낼 현 사업체 스냅샷 (이름·아이디어 보강용 지표).
  const applySnapshot = useMemo(() => {
    const sorted = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    const prev7 = sorted.slice(-14, -7);
    const avgSales7 = last7.length ? last7.reduce((s, e) => s + e.sales, 0) / last7.length : 0;
    const monthlyAvgRevenue = avgSales7 > 0 ? Math.round(avgSales7 * 26) : null;
    const hasUserSales = dailyEntries.some((e) => e.sales > 0);
    // 손님·사용자 수 (있을 때만) — 스타트업·SaaS 는 사용자 수, 오프라인은 손님 수.
    const custOf = (e: { customers?: number }) => (typeof e.customers === "number" ? e.customers : null);
    const last7Cust = last7.map((e) => custOf(e as { customers?: number })).filter((n): n is number => n != null);
    const prev7Cust = prev7.map((e) => custOf(e as { customers?: number })).filter((n): n is number => n != null);
    const recentCustomers = last7Cust.length ? Math.round(last7Cust.reduce((s, n) => s + n, 0) / last7Cust.length) : null;
    let customerChangePct: number | null = null;
    if (last7Cust.length && prev7Cust.length) {
      const a = last7Cust.reduce((s, n) => s + n, 0) / last7Cust.length;
      const p = prev7Cust.reduce((s, n) => s + n, 0) / prev7Cust.length;
      if (p > 0) customerChangePct = Math.round(((a - p) / p) * 1000) / 10;
    }
    return {
      storeName: storeName || null,
      industryCategoryId: industryCategoryId || null,
      businessLaunched: !!businessLaunched,
      businessLaunchedDate: businessLaunchedDate || null,
      monthlyAvgRevenue,
      hasUserSales,
      weeklySalesChangePct: weeklySalesChangePct ?? null,
      recentCustomers,
      customerChangePct,
      employeesCount: employees.length,
    };
  }, [dailyEntries, storeName, industryCategoryId, businessLaunched, businessLaunchedDate, weeklySalesChangePct, employees.length]);

  // ─── 공고 맞춤 사업계획서 모달 (2026-08-14, 주 2회) ───
  const [planModalProgram, setPlanModalProgram] = useState<StartupProgram | null>(null);
  const planUserPayload = useMemo<PlanUserPayload>(() => ({
    industry: industryCategoryId || "",
    subIndustry: selectedIndustryId || selectedSpecialtyId || "",
    startupType: startupType || "independent",
    businessModel: (d as { businessModel?: string }).businessModel ?? "",
    capital: selectedBudget ?? 0,
    targetOpenDate: businessLaunchedDate ?? "",
    location: preferredRegionInput || undefined,
    language: ko ? "ko" : "en",
  }), [industryCategoryId, selectedIndustryId, selectedSpecialtyId, startupType, d, selectedBudget, businessLaunchedDate, preferredRegionInput, ko]);

  // ─── AI 점수 보기 모달 상태 ───
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<FundingScore | null>(null);
  const [scoreProgramName, setScoreProgramName] = useState("");

  const handleScoreClick = async (program: StartupProgram & { matchScore: number; eligible: boolean }) => {
    const lang: "ko" | "en" = ko ? "ko" : "en";
    setScoreModalOpen(true);
    setScoreLoading(true);
    setScoreError(null);
    setScoreResult(null);
    setScoreProgramName(program.name[lang]);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setScoreError(ko ? "로그인 세션이 만료됐어요. 새로고침 후 다시 시도해주세요." : "Session expired. Refresh and retry.");
        setScoreLoading(false);
        return;
      }

      const res = await fetch("/api/ai/funding/score", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          program: {
            name: program.name[lang],
            organizer: program.organizer[lang],
            category: program.category,
            target: program.target[lang],
            benefit: program.benefit[lang],
            amount: program.amount,
            season: program.season[lang],
            requiredDocs: program.requiredDocs?.map((d) => d[lang]),
            eligibility: undefined,
          },
          user: (() => {
            // ─── 매출 집계 (최근 7일 평균 + 26영업일 환산) ───
            const recent7 = dailyEntries.slice(-7);
            const avgDailySales = recent7.length > 0
              ? Math.round(recent7.reduce((s, e) => s + e.sales, 0) / recent7.length)
              : 0;
            const monthlyAvgRevenue = avgDailySales > 0 ? avgDailySales * 26 : 0;
            const hasUserSales = dailyEntries.some((e) => e.sales > 0);

            // ─── P&L (월 환산) ───
            const mc = monthlyCosts ?? {};
            const totalMonthlyCost = Object.values(mc).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
            const monthlyProfit = monthlyAvgRevenue - totalMonthlyCost;
            // 프라임코스트 = 식재료 + 인건비 (월 환산 매출 대비 %)
            const primeRatePct = monthlyAvgRevenue > 0
              ? Math.round(((Number(mc.ingredients ?? 0) + Number(mc.labor ?? 0)) / monthlyAvgRevenue) * 1000) / 10
              : undefined;

            // ─── 사장님 나이 (생년월일 등록 시 — 현재 store 에 없으면 undefined) ───
            const ageRaw = (d as { sajangAge?: number; userAge?: number }).sajangAge
              ?? (d as { userAge?: number }).userAge;

            // ─── 과세 유형 매핑 ───
            const taxType: "general" | "simplified" | "exempt" | undefined =
              taxSettings?.vatType === "general" ? "general"
              : taxSettings?.vatType === "simplified" ? "simplified"
              : taxSettings?.vatType === "exempt" ? "exempt"
              : undefined;

            return {
              // identity
              storeName: storeName || undefined,
              industryCategoryId,
              subIndustryId: selectedIndustryId,
              selectedSpecialtyId,
              startupType,
              // location
              region: preferredRegionInput || undefined,
              // demographics
              age: typeof ageRaw === "number" ? ageRaw : undefined,
              // stage
              businessYears: criteria.businessYears,
              daysSinceLaunch: businessLaunchedDate
                ? Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / 86400000)
                : undefined,
              hasBizRegistration: businessLaunched,
              bizRegistrationDate: businessLaunchedDate ?? undefined,
              // financial
              capital: selectedBudget ?? undefined,
              runwayMonths: criteria.runwayMonths,
              // sales
              avgDailySales: avgDailySales > 0 ? avgDailySales : undefined,
              weeklySalesChangePct: criteria.weeklySalesChangePct,
              monthlyAvgRevenue: monthlyAvgRevenue > 0 ? monthlyAvgRevenue : undefined,
              hasUserSales,
              // P&L
              monthlyCosts: mc as {
                ingredients?: number; labor?: number; rent?: number;
                utilities?: number; sga?: number; marketing?: number;
                other?: number; interest?: number;
              },
              totalMonthlyCost: totalMonthlyCost > 0 ? totalMonthlyCost : undefined,
              monthlyProfit: hasUserSales ? monthlyProfit : undefined,
              primeRatePct,
              // employees
              employeesCount: criteria.employeesCount,
              // validation evidence — products 만 (interview store 제거)
              productsCount: products.length,
              hasMVP: products.length > 0 || hasUserSales,
              // tax / regulatory
              taxType,
              // system pre-match
              matchScore: program.matchScore,
              eligible: program.eligible,
            };
          })(),
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "AI 평가 실패" }));
        const msg = res.status === 429
          ? (errBody.error || (ko ? "오늘의 평가 횟수를 모두 사용했어요. 내일 다시 시도해주세요." : "Daily limit reached"))
          : (errBody.error || (ko ? "AI 평가 실패" : "Evaluation failed"));
        setScoreError(msg);
        setScoreLoading(false);
        return;
      }

      const data = (await res.json()) as { ok: boolean; result: FundingScore };
      setScoreResult(data.result);
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : (ko ? "네트워크 오류" : "Network error"));
    } finally {
      setScoreLoading(false);
    }
  };

  // 추천 전용 (개인화 점수만으로 상위 N개 — 마감 부스트·status 부스트 제외)
  const recommended = useMemo(
    () => recommendMode ? getRecommendedPrograms(criteria, RECOMMEND_TOP_N, 25, livePrograms ?? undefined) : [],
    [recommendMode, criteria, livePrograms],
  );

  // 검색 — 사업명·기관명·대상 텍스트(ko/en)에서 매칭. 한글 별칭(카이스트→kaist) 확장.
  const searchTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const extra = Object.entries(SEARCH_ALIASES)
      .filter(([k]) => searchQuery.includes(k))
      .map(([, v]) => v);
    return [q, ...extra];
  }, [searchQuery]);

  const passFilters = (p: StartupProgram & { eligible?: boolean }) => {
    if (searchTerms.length > 0) {
      const hay = `${p.name.ko} ${p.name.en} ${p.organizer.ko} ${p.organizer.en} ${p.target.ko}`.toLowerCase();
      if (!searchTerms.some((t) => hay.includes(t))) return false;
    } else if (p.eligible === false) {
      // 2026-06-30 사장님 신고: 미용실인데 AI스타트업·모빌리티/로보틱스·딥테크·스타트업파크가 뜸.
      //   getMatchedProgramsV2 가 업종·대상 불일치를 eligible=false 로 표시하지만, 기본 브라우즈
      //   리스트가 그걸 안 걸러 점수 낮게라도 노출되던 누수. 검색이 아닌 일반 브라우즈에서는 제외.
      //   (검색 시에는 사용자가 명시적으로 찾는 것이라 전부 노출 유지.)
      return false;
    }
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter !== "all" && p.applicationStatus !== statusFilter) return false;
    // 지역: 프로그램이 전국(undefined)이면 통과, 지역 제한이 있으면 선택 지역 포함해야
    if (regionFilter !== "all" && p.regions && !p.regions.includes(regionFilter)) return false;
    // 업종: 전업종(undefined)이면 통과, 제한 있으면 선택 업종 포함해야
    if (industryFilter !== "all" && p.industries && !p.industries.includes(industryFilter)) return false;
    // 연령: 청년전용(maxAge≤39만) / 시니어(연령제한 없음 = 누구나)
    if (ageFilter === "youth" && (!p.maxAge || p.maxAge > 39)) return false;
    if (ageFilter === "senior" && p.maxAge != null) return false;
    return true;
  };
  const filtered = useMemo(() => {
    const base = (recommendMode ? recommended : matchedAll).filter(passFilters);
    // 파운드원 자체 운영 지원사업(앱 내부 신청)은 노출될 때 항상 맨 위 고정.
    const idx = base.findIndex((p) => p.id === GRANT_PROGRAM_ID);
    if (idx > 0) base.unshift(base.splice(idx, 1)[0]);
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedAll, recommended, categoryFilter, statusFilter, regionFilter, industryFilter, ageFilter, recommendMode, searchTerms]);

  const stats = useMemo(() => {
    // matchedAll 단계에서 이미 마감 제외됨. open + upcoming 합이 total 과 일치하도록
    // applicationStatus undefined 인 프로그램은 "open" 으로 디폴트 (상시·매월 류).
    const open = matchedAll.filter((p) => (p.applicationStatus ?? "open") === "open").length;
    const upcoming = matchedAll.filter((p) => p.applicationStatus === "upcoming").length;
    const eligible = matchedAll.filter((p) => p.eligible).length;
    return { total: matchedAll.length, open, upcoming, eligible };
  }, [matchedAll]);

  const categoryOptions: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "government", label: ko ? "정부" : "Gov" },
    { id: "local", label: ko ? "지자체" : "Local" },
    { id: "private", label: ko ? "민간·재단" : "Private" },
    { id: "corporate", label: ko ? "대기업" : "Corp" },
    { id: "competition", label: ko ? "대회" : "Contest" },
  ];

  const statusOptions: { id: StatusFilter; label: string }[] = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "open", label: ko ? "신청 가능" : "Open" },
    { id: "upcoming", label: ko ? "공고 예정" : "Upcoming" },
    // "마감" 옵션은 제거 (2026-05-11) — 마감 프로그램은 matchedAll 단계에서 이미 필터됨
  ];

  const REGIONS_KO = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  const industryOptions: { id: string; label: string }[] = [
    { id: "all", label: ko ? "전 업종" : "All industries" },
    { id: "food", label: ko ? "음식" : "Food" },
    { id: "cafe-dessert", label: ko ? "카페·디저트" : "Cafe" },
    { id: "retail", label: ko ? "소매·유통" : "Retail" },
    { id: "beauty", label: ko ? "뷰티" : "Beauty" },
    { id: "fitness", label: ko ? "피트니스" : "Fitness" },
    { id: "education", label: ko ? "교육" : "Education" },
    { id: "pet", label: ko ? "반려동물" : "Pet" },
    { id: "living-service", label: ko ? "생활서비스" : "Living" },
    { id: "space", label: ko ? "공간" : "Space" },
    { id: "online-digital", label: ko ? "온라인·이커머스" : "Online" },
    { id: "startup-tech", label: ko ? "기술창업" : "Tech" },
  ];
  const ageOptions: { id: "all" | "youth" | "senior"; label: string }[] = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "youth", label: ko ? "청년 (만 39세 이하)" : "Youth ≤39" },
    { id: "senior", label: ko ? "연령 무관" : "No age limit" },
  ];

  return (
    <main style={pageStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* ── 1. Header (4 surface 공통 패턴) ── */}
        <header style={headerStyle}>
          <div style={eyebrowStyle}>{ko ? "FUNDING" : "FUNDING"}</div>
          <h1 style={titleStyle}>
            {ko ? "내 조건에 맞는 펀딩 기회" : "Funding matched to you"}
          </h1>
          <p style={subtitleStyle}>
            {ko
              ? "정부 지원금 · VC 투자 · 민간기업 협업까지 한 곳에서. 업종·지역·창업 유형으로 자동 매칭하고, 신청 가능·마감 임박 순으로 정렬합니다."
              : "Government grants, VC funding, and corporate programs — all in one place. Auto-matched to your industry, region, and stage."}
          </p>
        </header>

        {/* ── 2. Stats KPI ── */}
        <div style={kpiGridStyle}>
          <KpiCard
            label={ko ? "전체" : "Total"}
            value={String(stats.total)}
            sub={ko ? "등록된 프로그램" : "Registered"}
            tone="neutral"
          />
          <KpiCard
            label={ko ? "신청 가능" : "Open"}
            value={String(stats.open)}
            sub={ko ? "지금 접수 중" : "Accepting now"}
            tone="success"
          />
          <KpiCard
            label={ko ? "공고 예정" : "Upcoming"}
            value={String(stats.upcoming)}
            sub={ko ? "일정 확인" : "Check schedule"}
            tone="warning"
          />
          <KpiCard
            label={ko ? "내게 적합" : "Eligible"}
            value={String(stats.eligible)}
            sub={ko ? "자격 조건 만족" : "You qualify"}
            tone="primary"
          />
        </div>

        {/* ── 3. 추천 버튼 — 사장님 업종·상황·매출·규모 기반 상위 N개 자동 선별 ── */}
        <div style={recommendBarStyle}>
          <button
            type="button"
            onClick={() => setRecommendMode((v) => !v)}
            aria-pressed={recommendMode}
            style={{
              ...recommendBtnStyle,
              background: recommendMode ? "#191970" : "#fff",
              color: recommendMode ? "#fff" : "#191970",
              boxShadow: recommendMode
                ? "0 4px 12px rgba(25,25,112,0.28)"
                : "0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            <Sparkles size={14} strokeWidth={1.8} />
            <span>
              {recommendMode
                ? (ko ? `추천 모드 · TOP ${RECOMMEND_TOP_N}` : `Recommend mode · TOP ${RECOMMEND_TOP_N}`)
                : (ko ? "내게 가장 잘 맞는 프로그램 추천" : "Recommend best-fit programs")}
            </span>
          </button>
          {recommendMode && (
            <div style={recommendNoteStyle}>
              {ko
                ? `업종(${industryCategoryId || "—"}) · 단계(${criteria.businessStage}) · 매출/규모 · 런웨이 종합 점수 기준 상위 ${RECOMMEND_TOP_N}개`
                : `Top ${RECOMMEND_TOP_N} by industry · stage · revenue / size · runway match score`}
            </div>
          )}
        </div>

        {/* ── 3.5 매칭 보강 입력 — 출생연도·신용·폐업·장애 (로컬 저장, 청년/시니어/신용취약/폐업 매칭) ── */}
        <div style={{ display: "grid", gap: "6px", padding: "0 2px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#5A6BAE", letterSpacing: "0.02em" }}>
            {ko ? "내 정보 추가 (선택) — 더 정확한 추천 · 기기에만 저장" : "Add your info (optional) — better matches, stored on device"}
          </div>
          {/* 넛지 — 출생연도 미입력 시 청년·시니어 매칭 가치 안내 (미드나이트 톤·라인 아이콘) */}
          {ownerBirthYear == null && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              fontSize: "12px", color: MIDNIGHT, fontWeight: 500, lineHeight: 1.5,
              padding: "9px 12px", borderRadius: "10px",
              background: MIDNIGHT_TINT, border: `1px solid ${MIDNIGHT_BORDER_LIGHT}`,
            }}>
              <Lightbulb size={14} strokeWidth={1.6} style={{ flexShrink: 0, marginTop: 1, color: MIDNIGHT, opacity: 0.7 }} />
              <span>{ko
                ? "출생연도를 알려주시면 청년(만 39세 이하)·시니어(40세+) 전용 지원사업을 더 정확히 찾아드려요"
                : "Add your birth year to surface youth (≤39) and senior (40+) programs"}</span>
            </div>
          )}
          <OwnerProfileChips ko={ko} />
        </div>

        {/* ── 4. Filters ── */}
        <div style={filterCardStyle} className="bento-card">
          {/* 검색 — 사업명·기관명(예: 카이스트, 서울시, TIPS) */}
          <div style={searchWrapStyle}>
            <Search size={15} strokeWidth={1.8} style={{ color: TEXT_SUBTLE, flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ko ? "사업명·기관 검색 (예: 카이스트, 서울시, TIPS)" : "Search by program or organizer"}
              style={searchInputStyle}
              aria-label={ko ? "펀딩 검색" : "Search funding"}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={searchClearStyle}
                aria-label={ko ? "검색어 지우기" : "Clear"}
              >✕</button>
            )}
          </div>
          <FilterGroup
            label={ko ? "분류" : "Category"}
            options={categoryOptions}
            active={categoryFilter}
            onChange={(v) => setCategoryFilter(v as CategoryFilter)}
          />
          <FilterGroup
            label={ko ? "상태" : "Status"}
            options={statusOptions}
            active={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
          />
          <FilterGroup
            label={ko ? "연령" : "Age"}
            options={ageOptions}
            active={ageFilter}
            onChange={(v) => setAgeFilter(v as "all" | "youth" | "senior")}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#5A6BAE" }}>{ko ? "지역" : "Region"}</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">{ko ? "전국" : "Nationwide"}</option>
                {REGIONS_KO.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#5A6BAE" }}>{ko ? "업종" : "Industry"}</span>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                style={selectStyle}
              >
                {industryOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* ── 4. Program list ── */}
        {filtered.length === 0 ? (
          <div style={emptyBoxStyle}>
            <AlertCircle size={18} strokeWidth={1.5} style={{ color: TEXT_MUTED, marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>
              {ko
                ? "조건에 맞는 펀딩이 없습니다. 필터를 조정해보세요."
                : "No funding matches the current filters."}
            </div>
          </div>
        ) : (
          <div style={listGridStyle}>
            {filtered.map((program, idx) => (
              <ProgramCard
                key={program.id}
                program={program}
                ko={ko}
                onScoreClick={() => handleScoreClick(program)}
                onPlanClick={() => setPlanModalProgram(program)}
                onApplyClick={() => setApplyModalProgram(program)}
                applyState={{ windowState: grantWindowState(), applied: grantApplied === true }}
                rank={recommendMode ? idx + 1 : undefined}
                showReasons={recommendMode}
              />
            ))}
          </div>
        )}

        {/* ── 5. Footnote ── */}
        <div style={footnoteStyle}>
          {ko
            ? "데이터 기준: 2026년 · 실제 공고·마감은 각 기관 공식 사이트에서 최종 확인 부탁드립니다."
            : "Data as of 2026. Always verify dates and eligibility at each program's official page."}
        </div>
      </div>

      {/* AI 점수 보기 모달 */}
      <FundingScoreModal
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        programName={scoreProgramName}
        loading={scoreLoading}
        error={scoreError}
        result={scoreResult}
        ko={ko}
      />

      {/* 공고 맞춤 사업계획서 모달 */}
      <FundingPlanModal
        program={planModalProgram}
        ko={ko}
        userPayload={planUserPayload}
        onClose={() => setPlanModalProgram(null)}
      />

      {/* 창업지원금 신청 모달 */}
      <GrantApplyModal
        program={applyModalProgram}
        ko={ko}
        storeName={storeName}
        snapshot={applySnapshot}
        alreadyApplied={grantApplied === true}
        windowState={grantWindowState()}
        onClose={() => setApplyModalProgram(null)}
        onApplied={() => setGrantApplied(true)}
      />
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "neutral" | "success" | "warning" | "primary";
}) {
  const toneColor =
    tone === "success" ? GREEN
      : tone === "warning" ? AMBER
        : tone === "primary" ? MIDNIGHT_DEEP
          : TEXT_PRIMARY;
  return (
    <div style={kpiCardStyle} className="bento-card">
      <div style={kpiLabelStyle}>{label}</div>
      <div style={{ ...kpiValueStyle, color: toneColor }}>{value}</div>
      <div style={kpiSubStyle}>{sub}</div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={filterLabelStyle}>{label}</div>
      <div style={filterRowStyle}>
        {options.map((opt) => {
          const isActive = opt.id === active;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              style={{
                ...chipStyle,
                background: isActive ? MIDNIGHT : "white",
                color: isActive ? "white" : TEXT_PRIMARY,
                borderColor: isActive ? MIDNIGHT : "rgba(15,23,42,0.10)",
                fontWeight: isActive ? 700 : 600,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgramCard({
  program,
  ko,
  onScoreClick,
  onPlanClick,
  onApplyClick,
  applyState,
  rank,
  showReasons,
}: {
  program: StartupProgram & {
    matchScore: number;
    personalFitScore?: number;
    eligible: boolean;
    daysUntilDeadline?: number;
    matchReasons?: { kind: string; ko: string; en: string; weight: number }[];
  };
  ko: boolean;
  onScoreClick: () => void;
  /** 공고 맞춤 사업계획서 모달 오픈 (자금지원형만, 주 2회) */
  onPlanClick?: () => void;
  /** 앱 내부 신청(internalApply)형 카드의 "신청하기" 클릭 — 신청 모달 오픈 */
  onApplyClick?: () => void;
  /** 앱 내부 신청형 카드의 접수 기간/신청완료 상태 */
  applyState?: { windowState: "before" | "open" | "closed"; applied: boolean };
  /** 추천 모드일 때 1-based 순위 — 카드 좌상단에 "N순위" 배지 표시 */
  rank?: number;
  /** 추천 모드일 때 "왜 추천?" 사유 칩 노출 */
  showReasons?: boolean;
}) {
  const lang = ko ? "ko" : "en";
  const statusInfo = getApplicationStatusLabel(program.applicationStatus, lang);
  const catLabel = getProgramCategoryLabel(program.category, lang);
  // 피칭형 자금지원만 AI 점수·유리점 노출 (행사·교육·시설형은 점수 무의미 → 일관성·정확성)
  const fundable = isFundableProgram(program.name.ko, program.category);

  // 상태별 미드나이트 톤 매핑 (다채로운 컬러 → midnight 통일, 상태만 의미 컬러)
  const statusColor = program.applicationStatus === "open" ? GREEN
    : program.applicationStatus === "upcoming" ? AMBER
      : program.applicationStatus === "closed" ? "rgba(15,23,42,0.4)"
        : MIDNIGHT;

  const handleOpen = () => {
    if (program.url) {
      window.open(program.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article
      style={{
        ...programCardStyle,
        opacity: program.eligible ? 1 : 0.7,
        ...(rank === 1 ? { borderColor: MIDNIGHT, boxShadow: "0 4px 16px rgba(25,25,112,0.18)" } : {}),
      }}
      className="bento-card"
    >
      {/* Top: status + category + highlight */}
      <div style={cardTopRowStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {rank !== undefined && (
            <span style={{
              ...badgeStyle,
              color: "#fff",
              background: rank === 1 ? MIDNIGHT : rank === 2 ? "#4a4a8a" : rank === 3 ? "#7878b0" : "rgba(15,23,42,0.55)",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}>
              {ko ? `${rank}순위` : `#${rank}`}
            </span>
          )}
          <span style={{ ...badgeStyle, color: statusColor, background: `${statusColor}10`, fontWeight: 700 }}>
            {statusInfo.label}
          </span>
          <span style={{ ...badgeStyle, color: MIDNIGHT, background: MIDNIGHT_TINT }}>
            {catLabel}
          </span>
          {program.highlight && (
            <span style={{ ...badgeStyle, color: AMBER, background: "rgba(25,25,112,0.08)", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Sparkles size={10} strokeWidth={1.5} />
              {ko ? "추천" : "Featured"}
            </span>
          )}
          {/* D-N 마감 임박 배지 — 7일 이내일 때만 강조 */}
          {program.daysUntilDeadline != null && program.daysUntilDeadline >= 0 && program.daysUntilDeadline <= 14 && (
            <span style={{
              ...badgeStyle,
              color: program.daysUntilDeadline <= 3 ? RED : program.daysUntilDeadline <= 7 ? AMBER : MIDNIGHT,
              background: program.daysUntilDeadline <= 3 ? "rgba(182,76,76,0.08)"
                : program.daysUntilDeadline <= 7 ? "rgba(25,25,112,0.08)"
                : MIDNIGHT_TINT,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}>
              <AlertCircle size={10} strokeWidth={1.8} />
              {program.daysUntilDeadline === 0
                ? (ko ? "오늘 마감" : "Due today")
                : `D-${program.daysUntilDeadline}`}
            </span>
          )}
        </div>
        {!program.eligible && (
          <div style={{ fontSize: 11, color: RED, fontWeight: 600 }}>
            {ko ? "자격 확인 필요" : "Check eligibility"}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 style={progNameStyle}>{program.name[lang]}</h3>

      {/* "왜 추천?" — 추천 모드에서만, 매칭 사유 칩 */}
      {showReasons && program.matchReasons && program.matchReasons.length > 0 && (
        <div style={reasonChipsWrapStyle}>
          <span style={reasonChipsLabelStyle}>{ko ? "왜 추천?" : "Why?"}</span>
          {program.matchReasons.map((r, i) => (
            <span key={i} style={reasonChipStyle}>
              {ko ? r.ko : r.en}
            </span>
          ))}
        </div>
      )}

      {/* Organizer */}
      <div style={progMetaRowStyle}>
        <Building2 size={12} strokeWidth={1.5} style={{ color: TEXT_SUBTLE, flexShrink: 0 }} />
        <span>{program.organizer[lang]}</span>
      </div>

      {/* Target */}
      <div style={progMetaRowStyle}>
        <Target size={12} strokeWidth={1.5} style={{ color: TEXT_SUBTLE, flexShrink: 0 }} />
        <span>{program.target[lang]}</span>
      </div>

      {/* 차원 배지 — 지역·업종·연령. 제한 없으면 "전국·전 업종·연령 무관"으로 *항상* 명시(누락처럼 안 보이게). */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {/* 지역 */}
        {program.regions && program.regions.length > 0
          ? program.regions.slice(0, 3).map((r) => (
              <span key={r} style={dimBadgeStyle}><MapPin size={9} strokeWidth={1.8} style={{ flexShrink: 0 }} />{r}</span>
            ))
          : <span style={dimBadgeMutedStyle}><MapPin size={9} strokeWidth={1.8} style={{ flexShrink: 0 }} />{ko ? "전국" : "Nationwide"}</span>}
        {/* 업종 */}
        {program.industries && program.industries.length > 0
          ? program.industries.slice(0, 2).map((i) => <span key={i} style={dimBadgeStyle}>{INDUSTRY_LABEL_KO[i] ?? i}</span>)
          : <span style={dimBadgeMutedStyle}>{ko ? "전 업종" : "All industries"}</span>}
        {/* 연령 */}
        {program.maxAge != null
          ? <span style={dimBadgeStyle}>{ko ? `만 ${program.maxAge}세 이하` : `≤${program.maxAge}y`}</span>
          : <span style={dimBadgeMutedStyle}>{ko ? "연령 무관" : "Any age"}</span>}
      </div>

      {/* Benefit */}
      <div style={benefitBoxStyle}>
        <div style={benefitLabelStyle}>{ko ? "지원 내용" : "Benefit"}</div>
        <div style={benefitTextStyle}>{program.benefit[lang]}</div>
        {program.amount && (
          <div style={amountRowStyle}>
            <Award size={13} strokeWidth={1.5} style={{ color: MIDNIGHT, flexShrink: 0 }} />
            <span style={amountTextStyle}>{program.amount}</span>
          </div>
        )}
      </div>

      {/* Season / deadline */}
      <div style={progMetaRowStyle}>
        <Calendar size={12} strokeWidth={1.5} style={{ color: TEXT_SUBTLE, flexShrink: 0 }} />
        <span>{program.season[lang]}</span>
      </div>

      {/* 유리한 점 — 이 지원사업 가점 요소(비수도권·청년·특허·벤처인증 등). 자금지원형만. */}
      {fundable && (() => {
        const bonus = getProgramBonusFactors(program.name.ko, program.category).slice(0, 4);
        if (bonus.length === 0) return null;
        return (
          <div style={bonusRowStyle}>
            <span style={bonusLabelStyle}>{ko ? "유리한 점" : "Bonus"}</span>
            {bonus.map((b) => (
              <span key={b.key} style={bonusChipStyle}>+{b.label}</span>
            ))}
          </div>
        );
      })()}

      {/* Required docs */}
      {program.requiredDocs && program.requiredDocs.length > 0 && (
        <div style={docsRowStyle}>
          <div style={docsLabelStyle}>{ko ? "필요 서류" : "Required"}</div>
          <div style={docsListStyle}>
            {program.requiredDocs.map((doc) => doc[lang]).join(" · ")}
          </div>
        </div>
      )}

      {/* CTA — AI 점수 보기(자금지원형만) + 공식 사이트 */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {fundable && (
          <button
            type="button"
            onClick={onScoreClick}
            style={{
              ...ctaSecondaryStyle,
              flexShrink: 0,
            }}
            aria-label={ko ? "AI 점수 보기" : "View AI score"}
          >
            <Wand2 size={13} strokeWidth={1.6} />
            {ko ? "AI 점수 보기" : "AI score"}
          </button>
        )}
        {fundable && onPlanClick && (
          <button
            type="button"
            onClick={onPlanClick}
            style={{ ...ctaSecondaryStyle, flexShrink: 0 }}
            aria-label={ko ? "공고 맞춤 사업계획서" : "Tailored business plan"}
          >
            <FileText size={13} strokeWidth={1.6} />
            {ko ? "맞춤 계획서" : "Plan draft"}
          </button>
        )}
        {program.internalApply ? (() => {
          // 앱 내부 신청 — 외부 URL 없이 현 사업체로 바로 신청.
          const ws = applyState?.windowState ?? "open";
          const applied = applyState?.applied ?? false;
          const disabled = ws === "before" || ws === "closed";
          const label = applied
            ? (ko ? "신청 완료 ✓" : "Applied ✓")
            : ws === "before"
              ? (ko ? `${fmtDot(GRANT_APPLY_OPEN)} 신청 시작` : `Opens ${GRANT_APPLY_OPEN}`)
              : ws === "closed"
                ? (ko ? "신청 마감" : "Closed")
                : (ko ? "신청하기" : "Apply now");
          return (
            <button
              type="button"
              onClick={() => { if (!disabled) onApplyClick?.(); }}
              disabled={disabled}
              style={{
                ...ctaSecondaryStyle,
                flex: 1,
                ...(applied
                  ? { background: "white", color: MIDNIGHT, border: `1px solid ${MIDNIGHT_BORDER}`, boxShadow: "none" }
                  : {}),
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <Award size={13} strokeWidth={1.6} />
              {label}
            </button>
          );
        })() : (
          <button
            type="button"
            onClick={handleOpen}
            disabled={!program.url}
            style={{
              ...ctaButtonStyle,
              flex: 1,
              opacity: program.url ? 1 : 0.5,
              cursor: program.url ? "pointer" : "not-allowed",
            }}
          >
            {ko ? "공식 사이트에서 신청하기" : "Apply at official site"}
            <ExternalLink size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </article>
  );
}

// ─── 파운드원 창업지원금 신청 모달 ───
function GrantApplyModal({
  program,
  ko,
  storeName,
  snapshot,
  alreadyApplied,
  windowState,
  onClose,
  onApplied,
}: {
  program: StartupProgram | null;
  ko: boolean;
  storeName: string;
  snapshot: Record<string, unknown>;
  alreadyApplied: boolean;
  windowState: "before" | "open" | "closed";
  onClose: () => void;
  onApplied: () => void;
}) {
  const [pitch, setPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 모달이 열릴 때마다(프로그램 변경) 입력·상태 초기화.
  useEffect(() => {
    if (program) { setPitch(""); setError(null); setDone(false); setSubmitting(false); }
  }, [program?.id]);

  if (!program) return null;

  const name = program.name[ko ? "ko" : "en"];
  const canApply = windowState === "open";

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setError(ko ? "로그인 세션이 만료됐어요. 새로고침 후 다시 시도해주세요." : "Session expired. Refresh and retry.");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/funding/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ programId: program.id, pitch: pitch.trim() || undefined, snapshot }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error ?? (ko ? "신청에 실패했어요. 잠시 후 다시 시도해주세요." : "Failed. Try again."));
        setSubmitting(false);
        return;
      }
      setDone(true);
      onApplied();
    } catch {
      setError(ko ? "네트워크 오류예요. 잠시 후 다시 시도해주세요." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={modalOverlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalCardStyle} role="dialog" aria-modal="true">
        {done ? (
          <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: MIDNIGHT, margin: "0 0 8px" }}>{ko ? "신청 완료!" : "Applied!"}</h3>
            <p style={{ fontSize: 13.5, color: TEXT_SUBTLE, lineHeight: 1.6, margin: "0 0 18px" }}>
              {ko
                ? `${storeName || "회원님의 사업체"}로 신청이 접수됐어요. 선정 결과는 ${fmtDot(GRANT_ANNOUNCE)}에 발표됩니다. 그때까지 열정을 잃지 마세요!`
                : `Submitted for ${storeName || "your business"}. Results will be announced on ${GRANT_ANNOUNCE}.`}
            </p>
            <button type="button" onClick={onClose} style={{ ...ctaSecondaryStyle, width: "100%", marginTop: 0 }}>{ko ? "확인" : "Done"}</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: MIDNIGHT, margin: "0 0 4px" }}>{name}</h3>
            <p style={{ fontSize: 12.5, color: TEXT_SUBTLE, margin: "0 0 14px" }}>
              {ko
                ? `신청 ${fmtDot(GRANT_APPLY_OPEN)}~${fmtDot(GRANT_APPLY_CLOSE)} · 발표 ${fmtDot(GRANT_ANNOUNCE)} · 1팀 100만원`
                : `Apply ${GRANT_APPLY_OPEN}–${GRANT_APPLY_CLOSE} · Results ${GRANT_ANNOUNCE}`}
            </p>

            <div style={{ background: MIDNIGHT_TINT, borderRadius: 12, padding: "13px 15px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: TEXT_SUBTLE, marginBottom: 3 }}>{ko ? "신청할 사업체" : "Applying as"}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: MIDNIGHT }}>{storeName || (ko ? "(사업체 이름 미입력)" : "(no business name)")}</div>
              <div style={{ fontSize: 12, color: TEXT_SUBTLE, marginTop: 6, lineHeight: 1.5 }}>
                {ko ? "현재 사업체 정보(최근 매출·사용자 수 변화 등)가 함께 전달돼요." : "Your current business snapshot is included."}
              </div>
            </div>

            {alreadyApplied && (
              <div style={{ fontSize: 12.5, color: AMBER, background: "rgba(25,25,112,0.07)", borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
                {ko ? "이미 신청한 사업체예요. 다시 제출하면 내용이 최신으로 갱신돼요." : "Already applied — resubmitting updates your entry."}
              </div>
            )}

            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
              {ko ? "사업 아이디어와 열정 (선택)" : "Your idea & passion (optional)"}
            </label>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder={ko ? "어떤 사업을, 왜 하고 있는지 / 무엇에 열정을 쏟고 있는지 한두 줄로 적어주세요. 심사에서 가장 중요하게 봐요." : "Tell us about your idea and what you're passionate about."}
              style={modalTextareaStyle}
            />

            {windowState === "before" && (
              <div style={{ fontSize: 12.5, color: TEXT_SUBTLE, marginTop: 10 }}>{ko ? `신청은 ${fmtDot(GRANT_APPLY_OPEN)}부터 가능해요.` : `Opens ${GRANT_APPLY_OPEN}.`}</div>
            )}
            {windowState === "closed" && (
              <div style={{ fontSize: 12.5, color: RED, marginTop: 10 }}>{ko ? "신청이 마감되었어요." : "Applications are closed."}</div>
            )}
            {error && <div style={{ fontSize: 12.5, color: RED, marginTop: 10 }}>{error}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={onClose} style={{ ...ctaButtonStyle, flex: 1, marginTop: 0 }}>{ko ? "취소" : "Cancel"}</button>
              <button
                type="button"
                onClick={submit}
                disabled={!canApply || submitting}
                style={{ ...ctaSecondaryStyle, flex: 1.4, marginTop: 0, opacity: !canApply || submitting ? 0.55 : 1, cursor: !canApply || submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? (ko ? "신청 중…" : "Submitting…") : (ko ? "예, 신청할게요" : "Yes, apply")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Styles — Midnight Blue 디자인 철학
// ═══════════════════════════════════════════════════════════════════════

// ── 4 surface (보고서·마케팅·프랜차이즈·펀딩) 공통 page/header 패턴 ──
const pageStyle: React.CSSProperties = {
  width: "min(960px, calc(100vw - 32px))",
  margin: "0 auto",
  padding: "24px 0 80px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 4,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.65,
  letterSpacing: "0.12em",
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 750,
  letterSpacing: "-0.025em",
  color: TEXT_PRIMARY,
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: TEXT_MUTED,
  lineHeight: 1.55,
  margin: 0,
  maxWidth: 580,
};

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};

const kpiCardStyle: React.CSSProperties = {
  background: "white",
  border: `1px solid ${MIDNIGHT_BORDER_LIGHT}`,
  borderRadius: 16,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: TEXT_SUBTLE,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 750,
  letterSpacing: "-0.03em",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.05,
  marginTop: 2,
};

const kpiSubStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: TEXT_SUBTLE,
  marginTop: 1,
};

const filterCardStyle: React.CSSProperties = {
  background: MIDNIGHT_SOFT,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 18,
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const searchWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 12,
  background: "#fff",
  border: `1px solid ${MIDNIGHT_BORDER}`,
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13.5,
  color: "#0f172a",
  fontWeight: 500,
};

const searchClearStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 18,
  height: 18,
  borderRadius: 9,
  border: "none",
  background: "rgba(15,23,42,0.06)",
  color: TEXT_MUTED,
  fontSize: 10,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

const selectStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "#0f172a",
  padding: "7px 10px",
  borderRadius: 9,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  background: "#fff",
  cursor: "pointer",
  minWidth: 120,
};

const dimBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  fontSize: 10.5,
  fontWeight: 600,
  color: MIDNIGHT,
  padding: "2px 8px",
  borderRadius: 999,
  background: MIDNIGHT_SOFT,
  border: `1px solid ${MIDNIGHT_BORDER_LIGHT}`,
  whiteSpace: "nowrap",
};

// 제한 없음(전국·전업종·연령무관) — 흐린 톤으로 "열려있음" 표현(누락이 아님)
const dimBadgeMutedStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  fontSize: 10.5,
  fontWeight: 500,
  color: TEXT_SUBTLE,
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.03)",
  border: "1px solid rgba(15,23,42,0.06)",
  whiteSpace: "nowrap",
};

const bonusRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 5,
  flexWrap: "wrap",
  alignItems: "center",
  paddingTop: 2,
};

const bonusLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: GREEN,
  letterSpacing: "0.02em",
};

const bonusChipStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: GREEN,
  padding: "2px 7px",
  borderRadius: 999,
  background: "rgba(29,53,87,0.06)",
  border: "1px solid rgba(29,53,87,0.16)",
  whiteSpace: "nowrap",
};

const filterLabelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.7,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const filterRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chipStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "7px 14px",
  borderRadius: 9999,
  border: "1px solid",
  cursor: "pointer",
  transition: "all 0.18s ease",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
};

const listGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 12,
};

// ─── 추천 버튼 ─────────────────────────────────────────────────
const recommendBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const recommendBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 18px",
  borderRadius: 999,
  border: "1px solid rgba(25,25,112,0.18)",
  fontSize: 13.5,
  fontWeight: 650,
  letterSpacing: "-0.005em",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background .15s, color .15s, transform .12s, box-shadow .2s",
};

const recommendNoteStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  letterSpacing: "-0.005em",
  fontWeight: 500,
};

// ─── "왜 추천?" 매칭 사유 칩 ──────────────────────────────────
const reasonChipsWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 5,
  margin: "2px 0 4px",
};

const reasonChipsLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(25,25,112,0.55)",
  marginRight: 2,
};

const reasonChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 8px",
  borderRadius: 999,
  background: "rgba(25,25,112,0.06)",
  color: "#191970",
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "-0.005em",
};

const programCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "20px 20px 18px",
  borderRadius: 18,
  background: "white",
  border: `1px solid ${MIDNIGHT_BORDER_LIGHT}`,
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
};

const cardTopRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
};

const badgeStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  padding: "3px 9px",
  borderRadius: 9999,
  letterSpacing: "0.005em",
};

const progNameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: TEXT_PRIMARY,
  margin: "4px 0 2px",
  lineHeight: 1.35,
};

const progMetaRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  fontSize: 12.5,
  color: TEXT_MUTED,
  lineHeight: 1.5,
};

const benefitBoxStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "12px 14px",
  borderRadius: 12,
  background: MIDNIGHT_TINT,
  border: `1px solid ${MIDNIGHT_BORDER_LIGHT}`,
  marginTop: 4,
};

const benefitLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.7,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const benefitTextStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: TEXT_PRIMARY,
};

const amountRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  marginTop: 2,
};

const amountTextStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: MIDNIGHT_DEEP,
  letterSpacing: "-0.01em",
};

const docsRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  fontSize: 11.5,
  color: TEXT_MUTED,
  lineHeight: 1.45,
  paddingTop: 4,
};

const docsLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  color: TEXT_SUBTLE,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontSize: 10.5,
  flexShrink: 0,
};

const docsListStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const ctaButtonStyle: React.CSSProperties = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  padding: "10px 14px",
  borderRadius: 10,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  background: "white",
  color: MIDNIGHT,
  transition: "all 0.18s ease",
  fontFamily: "inherit",
  cursor: "pointer",
};

// AI 점수 보기 — 강조 톤 (미드나이트 fill + sparkle 아이콘)
const ctaSecondaryStyle: React.CSSProperties = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  fontSize: 12.5,
  fontWeight: 700,
  padding: "10px 13px",
  borderRadius: 10,
  border: "none",
  background: MIDNIGHT,
  color: "white",
  transition: "all 0.18s ease",
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "-0.005em",
  boxShadow: "0 2px 8px rgba(25,25,112,0.18)",
};

// 창업지원금 신청 모달
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.32)",
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 1000,
};

const modalCardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: "22px 22px 20px",
  width: "100%",
  maxWidth: 440,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 12px 48px rgba(15,23,42,0.22)",
  fontFamily: "inherit",
};

const modalTextareaStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 12,
  padding: "11px 13px",
  fontSize: 13.5,
  fontFamily: "inherit",
  color: TEXT_PRIMARY,
  resize: "vertical",
  outline: "none",
  lineHeight: 1.55,
};

const emptyBoxStyle: React.CSSProperties = {
  padding: "48px 20px",
  textAlign: "center",
  borderRadius: 16,
  background: MIDNIGHT_TINT,
  border: `1px dashed ${MIDNIGHT_BORDER}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const footnoteStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 11.5,
  color: TEXT_SUBTLE,
  textAlign: "center",
  lineHeight: 1.5,
};
