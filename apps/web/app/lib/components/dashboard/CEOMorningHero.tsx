"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Compass, Sunrise, Sun, Moon, AlertTriangle, ChevronRight, Sparkles, BarChart3, FileText, Settings2, Check } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import { CountUp } from "./animations";
import { PALETTE, MOTION, CHART_COLORS } from "./operationalStyles";
import { useMorningBriefingBrain } from "../../hooks/useMorningBriefingBrain";
import { resolveHero, InsightStack, PRIORITY_META, resolveInsightCtaTarget, type Hero } from "./MorningBriefing";
import { getBusinessDay, isBusinessDayClosed, dailyReportActiveTimeLabel } from "../../utils/business-day";
import { useProfileStore } from "../../stores/profile-store";

// ─── North Star Metric 옵션 (사장님이 직접 고르는 단 1개 숫자) ────
//  YC: "팀 전원이 외울 만큼 단 하나". 자동 (auto) 은 현재 로직 유지 (스타트업→런웨이, 외식→매출).
type NorthStarKey =
  | "auto"
  | "todaySales"
  | "avgDailySales14d"
  | "weeklySales7d"
  | "customers"
  | "aov"
  | "monthlyProfit"
  | "runway"
  | "mrr";

const NSM_OPTIONS_KO: Array<{ key: NorthStarKey; label: string; hint: string; showFor?: "subs" }> = [
  { key: "auto",              label: "자동 (추천)",        hint: "업종에 맞게 자동 선택 — 스타트업: 런웨이, 외식·서비스: 일 매출" },
  { key: "todaySales",        label: "오늘 매출",          hint: "오늘 등록된 매출 합계 (입력 전엔 14일 평균)" },
  { key: "avgDailySales14d",  label: "일 평균 매출 (14일)", hint: "최근 14일 매출의 일평균. 일별 변동성 큰 경우 추천" },
  { key: "weeklySales7d",     label: "이번 주 매출",        hint: "최근 7일 매출 합계. 주 단위 사이클이 명확한 경우" },
  { key: "customers",         label: "오늘 손님 수",        hint: "오늘 등록된 손님 수. 객수 중심 사업 (카페·서비스)" },
  { key: "aov",               label: "객단가",             hint: "1인당 평균 매출. 객단가 끌어올리기 중심 사장님" },
  { key: "monthlyProfit",     label: "이번 달 순익",        hint: "이번 달 매출 - 비용. 흑자 전환이 NSM인 경우" },
  { key: "runway",            label: "런웨이 (개월)",       hint: "현금 / 월 burn — Paul Graham Default Alive. 스타트업·자본 위기 시" },
  { key: "mrr",               label: "MRR (월간 반복 매출)", hint: "구독제 운영 시. 신규 - 이탈 + 확장 = 순 MRR", showFor: "subs" },
];

type Props = { d: DashboardHook };
type DailyEntry = { date: string; sales: number; customers: number };

/**
 * ────────────────────────────────────────────────────────────────────────
 * CEOMorningHero — 운영 대시보드 최상단 hero.
 *
 * 거장 리서치 기반:
 *  · Bezos Day-1: 가장 중요한 숫자 1개 + Why now
 *  · Brian Chesky founder mode: 오늘의 단일 우선순위
 *  · 토스 이승건: PMF·retention·DAU 한 화면 (한국 founder 톤)
 *  · Linear/Stripe 2026: 미니멀 카드 + 인라인 sparkline
 *
 * IA:
 *  Row 1: 시간대별 인사 + 사명/매장명 + 오늘 날짜
 *  Row 2: 메인 메트릭 (런웨이 또는 일 매출) + 14일 sparkline + delta tag
 *  Row 3: 오늘의 단일 행동 카드 (anomaly 우선, 없으면 weekly review)
 *
 * Visual:
 *  · 미드나이트 그라디언트 배경 (#191970 → #0f0f4a)
 *  · 화이트 카드 + glassmorphism subtle
 *  · framer-motion stagger entrance (0.075s tight rhythm)
 *  · CountUp 숫자
 *  · SVG sparkline with gradient fill
 *
 * 의도적 minimalism — 사용자가 5초 안에 "오늘 어떤 상태인가?" 파악.
 * ────────────────────────────────────────────────────────────────────────
 */
export function CEOMorningHero({ d }: Props) {
  const ko = d.language === "ko";
  const isStartup = d.industryCategoryId === "startup-tech";
  const isOnline = d.industryCategoryId === "online-digital";
  const northStarMetric = useProfileStore((s) => s.northStarMetric) as NorthStarKey | null;
  const setNorthStarMetric = useProfileStore((s) => s.setNorthStarMetric);
  const usesSubscriptions = (d.usesSubscriptions as boolean | undefined) ?? false;
  const [nsmPickerOpen, setNsmPickerOpen] = useState(false);
  const [nsmAnchor, setNsmAnchor] = useState<{ top: number; left: number } | null>(null);
  const nsmButtonRef = useRef<HTMLButtonElement | null>(null);
  const nsmPopoverRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // 외부 클릭 시 NSM picker 닫기 + ESC 키 + 스크롤·리사이즈 시 위치 재계산
  useEffect(() => {
    if (!nsmPickerOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (nsmButtonRef.current?.contains(target)) return;
      if (nsmPopoverRef.current?.contains(target)) return;
      setNsmPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNsmPickerOpen(false); };
    const reposition = () => {
      const rect = nsmButtonRef.current?.getBoundingClientRect();
      if (rect) setNsmAnchor({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    reposition();
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [nsmPickerOpen]);

  // ─── 시간대 인식 ───
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const period: "dawn" | "morning" | "afternoon" | "evening" | "night" =
    hour < 5 ? "night" : hour < 11 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "night";

  const greeting = useMemo(() => {
    const name = (d.storeName as string) || (ko ? "사장님" : "Founder");
    if (ko) {
      switch (period) {
        case "morning": return { line1: `좋은 아침입니다, ${name}.`, line2: "오늘의 가장 중요한 숫자부터 보겠습니다." };
        case "afternoon": return { line1: `${name}, 오후 점검 시간입니다.`, line2: "오늘 진행은 어떻게 되고 있나요?" };
        case "evening": return { line1: `${name}, 오늘 정리할 때입니다.`, line2: "내일을 더 잘 보내기 위해 한 번만 더 봅니다." };
        default: return { line1: `${name}.`, line2: "지금이라도 한 번 짚고 갑시다." };
      }
    }
    switch (period) {
      case "morning": return { line1: `Good morning, ${name}.`, line2: "Let's start with what matters most today." };
      case "afternoon": return { line1: `${name}, midday check.`, line2: "How is today shaping up?" };
      case "evening": return { line1: `${name}, time to reflect.`, line2: "One last look so tomorrow goes better." };
      default: return { line1: `${name}.`, line2: "Worth a quick check-in even now." };
    }
  }, [period, d.storeName, ko]);

  const PeriodIcon = period === "morning" ? Sunrise : period === "afternoon" ? Sun : period === "evening" ? Sunrise : Moon;

  // ─── 메인 메트릭 결정: 스타트업이면 런웨이, 자영업이면 일 매출 ───
  // ⚠️ ASC 정렬 (시간순) — sparkline·last14 비교를 위해.
  // 0매출 entry도 정당한 데이터 (휴무일) → 필터링 안 함.
  const dailyEntriesRaw = (d.dailyEntries ?? []) as DailyEntry[];
  const dailyEntries = useMemo(
    () => [...dailyEntriesRaw].sort((a, b) => a.date.localeCompare(b.date)),
    [dailyEntriesRaw]
  );
  const last14 = dailyEntries.slice(-14);

  const todayIso = getBusinessDay(now, { categoryId: d.industryCategoryId, closeTime: d.businessCloseTime });
  const todayEntry = dailyEntries.find((e) => e.date === todayIso);

  const last14Total = last14.reduce((s, e) => s + e.sales, 0);
  const prev14 = dailyEntries.slice(-28, -14);
  const prev14Total = prev14.reduce((s, e) => s + e.sales, 0);
  // wow delta — 양쪽 모두 *기록된 entry* 가 충분할 때만 (≥7) 계산. 그 외엔 0% 표시 (오해 방지).
  const wowDelta = (prev14Total > 0 && prev14.length >= 7 && last14.length >= 7)
    ? ((last14Total - prev14Total) / prev14Total) * 100
    : 0;

  // 런웨이 계산 (간단 버전)
  const monthlyCosts = (d.monthlyCosts ?? {}) as Record<string, number>;
  const totalMonthlyBurn = Object.values(monthlyCosts).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const capitalKrw = ((d.selectedBudget as number | undefined) ?? 0) + ((d.initialOperatingCapital as number | undefined) ?? 0);
  const runwayMonths = totalMonthlyBurn > 0 ? capitalKrw / totalMonthlyBurn : 99;

  // ── 사장님이 직접 고른 NSM (있으면) 우선 적용 ──────────────────────
  //   ⚠️ CRITICAL (2026-05-11): 모든 계산은 *날짜 기반 윈도우* 사용.
  //   `dailyEntries.slice(-7)` 같은 entry-count 슬라이스는 사장님이 입력 안 한 날을
  //   무시해서 잘못된 합계·평균이 나옴 (이전 사용자 신고: "이번 주 매출 40만원" 거짓 수치).
  //   "auto" 또는 null → 아래 기존 로직 fallback.
  // ─────────────────────────────────────────────────────────────────
  type HeroMetric = { label: string; value: number; format: (n: number) => string; delta: number; deltaLabel: string; tone: "good" | "warn" | "bad" };
  const nsmOverride = useMemo<HeroMetric | null>(() => {
    if (!northStarMetric || northStarMetric === "auto") return null;

    const tonePos = (delta: number): "good" | "warn" | "bad" =>
      delta >= 5 ? "good" : delta >= -5 ? "warn" : "bad";

    // 날짜 기반 윈도우 헬퍼 — entry-count slice 가 아니라 *오늘로부터 N일 이내*.
    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    const dayMs = 86_400_000;
    const entriesInDays = (daysAgo: number) => {
      const fromMs = todayMidnight.getTime() - daysAgo * dayMs;
      return dailyEntries.filter((e) => new Date(e.date).getTime() >= fromMs);
    };
    const entriesBetween = (fromAgo: number, toAgo: number) => {
      const fromMs = todayMidnight.getTime() - fromAgo * dayMs;
      const toMs = todayMidnight.getTime() - toAgo * dayMs;
      return dailyEntries.filter((e) => {
        const t = new Date(e.date).getTime();
        return t >= fromMs && t < toMs;
      });
    };

    switch (northStarMetric) {
      case "todaySales": {
        const todaySales = todayEntry?.sales ?? 0;
        return {
          label: ko ? "오늘 매출" : "Today's Sales",
          value: todaySales,
          format: (n) => fmtKrw(n, ko),
          delta: wowDelta,
          deltaLabel: ko ? "지난 2주 평균 대비" : "vs prev 2 weeks",
          tone: tonePos(wowDelta),
        };
      }
      case "avgDailySales14d": {
        // 분모는 *경과일수* (14일) — entry 개수 아님. 입력 안 한 날은 0 으로 자연 반영.
        const win = entriesInDays(14);
        const winWithSales = win.filter((e) => e.sales > 0);
        const sum = win.reduce((s, e) => s + e.sales, 0);
        const avg = sum / 14;
        const sparseSuffix = winWithSales.length < 7
          ? (ko ? ` · ${winWithSales.length}일 입력` : ` · ${winWithSales.length}d only`)
          : "";
        return {
          label: (ko ? "일 평균 매출 (14일)" : "Daily Avg (14d)") + sparseSuffix,
          value: avg,
          format: (n) => fmtKrw(n, ko),
          delta: wowDelta,
          deltaLabel: ko ? "지난 2주 대비" : "vs prev 2 weeks",
          tone: tonePos(wowDelta),
        };
      }
      case "weeklySales7d": {
        // 최근 7일 — *날짜 기준* (입력 안 한 날 = 0). 이전 7일 (8~14일 전) 과 비교.
        const last7 = entriesInDays(7);
        const last7WithSales = last7.filter((e) => e.sales > 0);
        const last7Total = last7.reduce((s, e) => s + e.sales, 0);
        const prev7 = entriesBetween(14, 7);
        const prev7Total = prev7.reduce((s, e) => s + e.sales, 0);
        const delta = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total) * 100 : 0;
        // 입력 일수 < 4 면 "추정 신뢰도 낮음" 표기 (사장님이 "거짓 숫자" 로 인지하는 케이스 방지)
        const sparseSuffix = last7WithSales.length < 4
          ? (ko ? ` · ${last7WithSales.length}일 입력` : ` · ${last7WithSales.length}d only`)
          : "";
        return {
          label: (ko ? "최근 7일 매출 합계" : "Last 7d Sales") + sparseSuffix,
          value: last7Total,
          format: (n) => fmtKrw(n, ko),
          delta,
          deltaLabel: ko ? "직전 7일 대비" : "vs prev 7d",
          tone: tonePos(delta),
        };
      }
      case "customers": {
        const todayCust = todayEntry?.customers ?? 0;
        const last14Cust = entriesInDays(14).reduce((s, e) => s + (e.customers ?? 0), 0);
        const prev14Cust = entriesBetween(28, 14).reduce((s, e) => s + (e.customers ?? 0), 0);
        const delta = prev14Cust > 0 ? ((last14Cust - prev14Cust) / prev14Cust) * 100 : 0;
        return {
          label: ko ? "오늘 손님 수" : "Today's Customers",
          value: todayCust,
          format: (n) => `${Math.round(n).toLocaleString()}${ko ? "명" : ""}`,
          delta,
          deltaLabel: ko ? "지난 2주 손님 대비" : "vs prev 2 weeks",
          tone: tonePos(delta),
        };
      }
      case "aov": {
        const last14Sales = entriesInDays(14).reduce((s, e) => s + e.sales, 0);
        const last14Cust = entriesInDays(14).reduce((s, e) => s + (e.customers ?? 0), 0);
        const aov = last14Cust > 0 ? last14Sales / last14Cust : 0;
        const prev14Sales = entriesBetween(28, 14).reduce((s, e) => s + e.sales, 0);
        const prev14Cust = entriesBetween(28, 14).reduce((s, e) => s + (e.customers ?? 0), 0);
        const prevAov = prev14Cust > 0 ? prev14Sales / prev14Cust : 0;
        const delta = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0;
        return {
          label: ko ? "객단가 (14일 평균)" : "Avg Ticket (14d)",
          value: aov,
          format: (n) => fmtKrw(n, ko),
          delta,
          deltaLabel: ko ? "지난 2주 대비" : "vs prev 2 weeks",
          tone: tonePos(delta),
        };
      }
      case "monthlyProfit": {
        // 진행 중인 달 — 14일 매출의 *날짜 분모* 평균 × 30 - 월 비용 (보수적 근사)
        const last14Sales = entriesInDays(14).reduce((s, e) => s + e.sales, 0);
        const avg14 = last14Sales / 14;
        const projMonthlySales = avg14 * 30;
        const profit = projMonthlySales - totalMonthlyBurn;
        return {
          label: ko ? "이번 달 예상 순익" : "Est. Monthly Profit",
          value: profit,
          format: (n) => fmtKrw(n, ko),
          delta: 0,
          deltaLabel: ko ? "14일 평균 × 30 추정" : "14d avg × 30 est.",
          tone: profit >= 0 ? "good" : profit >= -totalMonthlyBurn * 0.2 ? "warn" : "bad",
        };
      }
      case "runway": {
        return {
          label: ko ? "런웨이 (남은 개월)" : "Runway (months)",
          value: runwayMonths,
          format: (n) => n >= 99 ? (ko ? "충분" : "Healthy") : `${n.toFixed(1)}${ko ? "개월" : " mo"}`,
          delta: 0,
          deltaLabel: ko ? "현금 ÷ 월 burn" : "cash ÷ monthly burn",
          tone: runwayMonths < 6 ? "bad" : runwayMonths < 12 ? "warn" : "good",
        };
      }
      case "mrr": {
        // MRR — 14일 매출 합계 × 30/14 환산 (간단 추정. 정확한 산정은 SaaSKeyMetricsCard 참조)
        const last14Sales = entriesInDays(14).reduce((s, e) => s + e.sales, 0);
        const mrr = last14Sales * (30 / 14);
        return {
          label: ko ? "MRR (월간 반복 매출)" : "MRR",
          value: mrr,
          format: (n) => fmtKrw(n, ko),
          delta: wowDelta,
          deltaLabel: ko ? "지난 2주 매출 대비" : "vs prev 2 weeks",
          tone: tonePos(wowDelta),
        };
      }
      default:
        return null;
    }
  }, [northStarMetric, todayEntry, dailyEntries, runwayMonths, totalMonthlyBurn, wowDelta, ko]);

  const heroMetric: HeroMetric = useMemo(() => {
    if (nsmOverride) return nsmOverride;
    if (isStartup) {
      // 스타트업: 런웨이 (개월) 우선
      const tone: "good" | "warn" | "bad" =
        runwayMonths < 6 ? "bad" : runwayMonths < 12 ? "warn" : "good";
      return {
        label: ko ? "런웨이 (남은 개월)" : "Runway (months)",
        value: runwayMonths,
        format: (n) => n >= 99 ? (ko ? "충분" : "Healthy") : `${n.toFixed(1)}${ko ? "개월" : " mo"}`,
        delta: wowDelta,
        deltaLabel: ko ? "지난 2주 매출 대비" : "vs prev 2 weeks",
        tone,
      };
    }
    // 자영업: 오늘 매출 (없으면 캘린더 일수 기준 평균)
    //
    //  ⚠️ 사용자 보고 (2026-05-08): 1일 입력 200K → 14일 평균 200K 로 잘못 표시되던 버그.
    //     원인: `last14Total / last14.length` — entry 수 (1) 로만 나눔.
    //     수정: 분모를 *경과 캘린더 일수* 로 — 입력 안 한 날은 0매출로 자연 반영.
    const todaySales = todayEntry?.sales ?? 0;
    // 첫 entry 부터 오늘까지의 *캘린더 일수* (1~14 클램프)
    const earliestDate = last14.length > 0 ? new Date(last14[0].date) : null;
    const todayDate = new Date();
    const calendarDaysCovered = earliestDate
      ? Math.min(14, Math.max(1, Math.floor((todayDate.getTime() - earliestDate.getTime()) / 86400000) + 1))
      : 0;
    const avg14 = calendarDaysCovered > 0 ? last14Total / calendarDaysCovered : 0;
    const value = todaySales > 0 ? todaySales : avg14;
    const dayLabel = calendarDaysCovered > 0 && calendarDaysCovered < 14
      ? `${calendarDaysCovered}일`
      : "14일";
    const valueLabel = todaySales > 0
      ? (ko ? "오늘 매출" : "Today's sales")
      : (ko ? `일 평균 (${dayLabel})` : `Daily avg (${dayLabel})`);
    const tone: "good" | "warn" | "bad" = wowDelta >= 5 ? "good" : wowDelta >= -5 ? "warn" : "bad";
    return {
      label: valueLabel,
      value,
      format: (n) => fmtKrw(n, ko),
      delta: wowDelta,
      deltaLabel: ko ? "지난 2주 평균 대비" : "vs prev 2 weeks",
      tone,
    };
  }, [nsmOverride, isStartup, runwayMonths, wowDelta, todayEntry, last14Total, last14.length, ko]);

  // ─── Sparkline 데이터 (입력된 매출 entry 만) ───
  //  ⚠️ FIX (2026-05-11): 이전엔 last14 의 0 값 entry 도 그렸음 → 12일 0 + 2일 값
  //     → 거의 flat 그래프로 보여 사장님이 "버그" 로 인지.
  //  Fix: sales > 0 entry 만 사용. 데이터 < 3 일 면 sparkline 대신 empty state.
  //       y 축 정규화 시 min/max padding 으로 flat 보임 방지 (값이 거의 같아도 약간 변동).
  const sparkline = useMemo(() => {
    const realEntries = last14.filter((e) => e.sales > 0);
    if (realEntries.length < 3) return null;  // 3개 미만이면 추세 의미 없음
    const values = realEntries.map((e) => e.sales);
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    // 값이 거의 같아도 시각적 변동을 위해 ±5% padding
    const valuePad = Math.max(rawMax * 0.05, 1);
    const max = rawMax + valuePad;
    const min = Math.max(0, rawMin - valuePad);
    const range = Math.max(max - min, 1);
    const W = 320;
    const H = 64;
    const pad = 6;
    const points = values.map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (W - pad * 2);
      const y = pad + (1 - (v - min) / range) * (H - pad * 2);
      return { x, y, v };
    });
    // Smooth curve via cubic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cx1 = prev.x + (cur.x - prev.x) / 2;
      const cx2 = prev.x + (cur.x - prev.x) / 2;
      path += ` C ${cx1} ${prev.y}, ${cx2} ${cur.y}, ${cur.x} ${cur.y}`;
    }
    const fillPath = `${path} L ${points[points.length - 1].x} ${H - pad} L ${points[0].x} ${H - pad} Z`;
    return { path, fillPath, points, W, H, entryCount: realEntries.length };
  }, [last14]);

  // ─── AI 모닝 브리핑 두뇌 (MorningBriefing 과 SAME 데이터·로직 공유) ───
  // 데이터 기반 우선순위: cashflow 위기 → 룰 기반 이상 → 긴급 재주문 → AI Top Action → 일반 agent → 업종 인사이트 → fallback
  // → 모두 dataSource 명시되어 hallucination 방지 (LLM 호출은 aiTopAction에만 한정)
  const brain = useMorningBriefingBrain(d);
  const briefing: Hero = useMemo(() => resolveHero({
    ko,
    cashflowCrisis: brain.cashflowCrisis,
    topAnomaly: brain.topAnomaly,
    anomalyContext: brain.anomalyContext,
    topProposal: brain.topProposal,
    aiTopAction: brain.aiTopAction,
    industryInsight: brain.industryInsight,
    businessLaunched: brain.businessLaunched,
    daysSinceLastSalesEntry: brain.daysSinceLastSalesEntry,
    totalEntries: brain.totalEntries,
    monthlyBurn: brain.monthlyBurn,
    categoryId: d.industryCategoryId,
  }), [ko, brain, d.industryCategoryId]);

  // ─── Industry insights → Hero spec 변환 (모든 hero source 에서 stack 노출용) ───
  // 사용자 요청 (2026-05-08): 운영 대시보드 최상단 AI 카드에 *3개 추천* 펼치기 기능 노출.
  // 사용자 요청 (2026-05-08-2): 각 카드 버튼은 인사이트 *고유 액션* 으로 — "매출 기록하기" 일괄 X.
  const allInsightSpecs = useMemo<Omit<Hero, "relatedSpecs">[]>(() => {
    const ii = brain.industryInsight;
    if (!ii || !Array.isArray(ii.insights) || ii.insights.length === 0) return [];
    const cat = d.industryCategoryId;
    const isDigital = cat === "startup-tech" || cat === "online-digital";
    return ii.insights.map((it) => {
      // AI 가 직접 지정한 targetCard 가 있으면 그게 최우선 — 키워드 라우팅보다 신뢰도 높음.
      const target = resolveInsightCtaTarget(it.category, it.body, it.action, isDigital, it.targetCard);
      // ⚠️ 버튼 라벨은 LLM 이 만든 *고유 액션* 사용 ("재방문잡기" / "구조점검" 등) — 일괄 라벨 X
      const ctaLabel = it.action || "확인하기";
      return {
        source: "industry" as const,
        tone: "neutral" as const,
        tagKo: "오늘의 인사이트",
        tagEn: "Today's insight",
        analysisKo: it.headline ? `${it.headline}. ${it.body}` : it.body,
        analysisEn: it.headline ? `${it.headline}. ${it.body}` : it.body,
        // action 은 InsightStack 의 캡션 — 버튼과 중복 방지 위해 빈 값 (캡션 미노출)
        actionKo: "",
        actionEn: "",
        ctaKo: ctaLabel,
        ctaEn: ctaLabel,
        ctaTarget: target,
        sourceLabel: it.sourceLabel,
        priority: it.priority,
      };
    });
  }, [brain.industryInsight, d.industryCategoryId]);

  // 스택 표시 리스트 — briefing 이 industry source 면 첫 인사이트는 hero 라 1번부터, 그 외는 모두
  const stackList = briefing.source === "industry" ? allInsightSpecs.slice(1) : allInsightSpecs;

  // CTA 클릭 핸들러 — briefing.ctaTarget(인사이트가 가리키는 실제 카드)에 따라 디스패치.
  // 매출 입력이 목적이면 input에 자동 포커스, 그 외엔 카드를 1.1초간 ring 하이라이트로 강조.
  // 모든 분기에서 fallback 보장 — 클릭이 무반응으로 끝나지 않게 (거짓 기능 금지).
  const focusBySelector = (selector: string, opts: { focusInput?: boolean } = {}) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (opts.focusInput) {
      window.setTimeout(() => {
        const input = el.querySelector<HTMLInputElement>('input[inputmode="numeric"], input[type="number"], input[type="text"]');
        input?.focus();
      }, 450);
    }
    flashHighlight(el);
    return true;
  };

  const handleBriefingCta = () => {
    // 디버그 로그 — "왜 거기로 갔지?" 추적용
    console.info("[buildup] handleBriefingCta", {
      source: briefing.source,
      ctaTarget: briefing.ctaTarget,
      ctaLabel: ko ? briefing.ctaKo : briefing.ctaEn,
    });
    let handled = false;
    switch (briefing.ctaTarget) {
      case "sales":
        handled = focusBySelector("[data-sales-input]", { focusInput: true });
        break;
      case "users":
        handled = focusBySelector("[data-user-activity]")
          || focusBySelector("[data-first-customers-card]");
        break;
      case "cashflow":
        handled = focusBySelector("[data-cashflow-hero]");
        break;
      case "costs":
        // 현재 surface 에 비용 관련 카드(P&L·구조 시각화)가 보이면 그쪽 우선.
        // 못 찾으면 analytics(내 가게) surface 로 전환 + 비용 *관리* 카드로 정확 스크롤.
        handled = focusBySelector("[data-cost-structure]")
          || focusBySelector("[data-pl-hero]");
        if (!handled && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bup:navigate-feature", {
            detail: { surface: "analytics", selector: "[data-cost-management]" },
          }));
          handled = true;
        }
        break;
      case "inventory":
        // 재료·메뉴·재고·재주문 → 재고 관리 카드 (사용자 지침: "메뉴 관련이면 재고 관리 카드")
        handled = focusBySelector("[data-inventory-card]");
        break;
      case "team":
        // 직원·노무·4대보험·퇴직금 → 팀 관리 카드
        handled = focusBySelector("[data-team-card]");
        break;
      case "primeCost":
        // 프라임코스트 합계 점검 → Prime Cost 카드 (외식·카페).
        // 없으면 analytics surface 의 비용 관리 카드로 폴백.
        handled = focusBySelector("[data-prime-cost-card]");
        if (!handled && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bup:navigate-feature", {
            detail: { surface: "analytics", selector: "[data-cost-management]" },
          }));
          handled = true;
        }
        break;
      case "operations":
        handled = focusBySelector("[data-ops-rituals]");
        break;
      case "marketing":
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bup:navigate-feature", {
            detail: { surface: "marketing" },
          }));
          handled = true;
        }
        break;
    }
    // 타깃 카드를 못 찾았다고 무조건 매출로 보내지 않는다. ctaTarget 별 정직 fallback.
    if (!handled) {
      if (briefing.ctaTarget === "sales") {
        handled = focusBySelector("[data-sales-input]", { focusInput: true });
      } else {
        // 마지막 안전망 — 페이지 상단으로 스크롤. 매출로 떨어뜨리지 않음.
        window.scrollTo({ top: 0, behavior: "smooth" });
        handled = true;
      }
    }
  };

  const briefingUrgent = briefing.tone === "crisis" || briefing.tone === "warning";

  const toneColor = heroMetric.tone === "good" ? PALETTE.SUCCESS : heroMetric.tone === "warn" ? PALETTE.WARN : PALETTE.DANGER;

  // ─── 거장 리서치: Bezos-style anomaly narrative ───
  // 단순 % delta 대신 한국어 자연 narrative — "오늘 매출 X, 어제보다 N배, 평소 대비 Y%"
  const narrative = useMemo(() => {
    if (isStartup) return null; // startup은 런웨이 메인 — narrative 별도 안 만듦
    const todaySales = todayEntry?.sales ?? 0;
    if (todaySales === 0) return null;
    const yesterdayIso = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
    const yesterday = dailyEntries.find((e) => e.date === yesterdayIso)?.sales ?? 0;
    const avg = last14.length > 0 ? last14Total / last14.length : 0;
    const yPct = yesterday > 0 ? ((todaySales - yesterday) / yesterday) * 100 : 0;
    const aPct = avg > 0 ? ((todaySales - avg) / avg) * 100 : 0;
    // 가장 큰 비교를 골라 narrative 작성
    if (Math.abs(yPct) > 30 && yesterday > 0) {
      const dir = yPct > 0 ? (ko ? "위" : "above") : (ko ? "아래" : "below");
      return ko
        ? `어제보다 ${Math.abs(yPct).toFixed(0)}% ${dir} — 평소 평균 대비 ${aPct >= 0 ? "+" : ""}${aPct.toFixed(0)}%.`
        : `${Math.abs(yPct).toFixed(0)}% ${dir} yesterday · ${aPct >= 0 ? "+" : ""}${aPct.toFixed(0)}% vs avg.`;
    }
    if (Math.abs(aPct) > 15) {
      return ko
        ? `평소 평균 대비 ${aPct >= 0 ? "+" : ""}${aPct.toFixed(0)}% — 14일 트렌드 확인 권장.`
        : `${aPct >= 0 ? "+" : ""}${aPct.toFixed(0)}% vs avg — check the 14-day trend.`;
    }
    return ko ? "평소 흐름 안에서 안정적." : "Stable within normal flow.";
  }, [isStartup, todayEntry, dailyEntries, last14, last14Total, now, ko]);

  // ─── framer-motion variants (Apple stock easing) ───
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: MOTION.STAGGER.normal, delayChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: MOTION.DURATION.base, ease: [...MOTION.EASE_SMOOTH] as [number, number, number, number] } },
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        position: "relative",
        borderRadius: "24px",
        padding: "28px 28px 24px",
        // ⚡ 연한 미드나이트 틴트 — Apple/Linear 톤. 텍스트는 어둡게.
        background: "linear-gradient(135deg, #F7F8FE 0%, #EEF0FB 50%, #E5E8F7 100%)",
        color: PALETTE.INK,
        overflow: "hidden",
        border: "1px solid rgba(25,25,112,0.08)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 32px rgba(25,25,112,0.06)",
      }}
    >
      {/* Soft ambient glow — subtle */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: -140,
          right: -100,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(91,107,255,0.10) 0%, rgba(91,107,255,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Row 1 — 인사 + 저장 상태 표시 */}
      <motion.div variants={itemVariants} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "22px", position: "relative", zIndex: 1 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: PALETTE.MIDNIGHT_8,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <PeriodIcon size={18} strokeWidth={1.5} color={PALETTE.MIDNIGHT} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: PALETTE.MIDNIGHT, opacity: 0.65, marginBottom: "3px", display: "flex", flexWrap: "wrap" as const, alignItems: "center", gap: "8px" }}>
            <span>{now.toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short", month: "short", day: "numeric" })} · {ko ? (isStartup ? "스타트업 모드" : isOnline ? "온라인 모드" : "운영 모드") : "Operations"}</span>
            {brain.businessLaunched && brain.daysSinceLaunch != null && (
              <span style={{
                padding: "2px 8px", borderRadius: "999px",
                background: PALETTE.MIDNIGHT, color: "white",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
              }}>
                {ko ? `운영 ${brain.daysSinceLaunch + 1}일째` : `Day ${brain.daysSinceLaunch + 1}`}
              </span>
            )}
            {brain.phase !== "pre-launch" && (
              <span style={{
                padding: "2px 8px", borderRadius: "999px",
                background: "rgba(25,25,112,0.08)", color: PALETTE.MIDNIGHT,
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
              }}>
                {ko
                  ? brain.phase === "early" ? "초기 (PMF·고객확보)"
                    : brain.phase === "growth" ? "성장 (안정화)"
                    : "성숙 (효율·확장)"
                  : brain.phase === "early" ? "Early"
                    : brain.phase === "growth" ? "Growth"
                    : "Mature"}
              </span>
            )}
            {brain.salesTrend.direction !== "insufficient" && brain.salesTrend.changePct != null && (
              <span style={{
                padding: "2px 8px", borderRadius: "999px",
                background: brain.salesTrend.direction === "improving" ? "rgba(5,150,105,0.10)"
                  : brain.salesTrend.direction === "declining" ? "rgba(220,38,38,0.10)"
                  : "rgba(15,23,42,0.06)",
                color: brain.salesTrend.direction === "improving" ? "#059669"
                  : brain.salesTrend.direction === "declining" ? "#dc2626"
                  : "rgba(15,23,42,0.6)",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
              }}>
                {brain.salesTrend.direction === "improving" ? "↗" : brain.salesTrend.direction === "declining" ? "↘" : "→"}
                {" "}{brain.salesTrend.changePct >= 0 ? "+" : ""}{brain.salesTrend.changePct}%
                {ko ? " 주간매출" : " WoW"}
              </span>
            )}
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.35, color: PALETTE.MIDNIGHT_DEEP }}>
            {greeting.line1}
          </div>
          <div style={{ fontSize: "13.5px", color: PALETTE.MUTED, marginTop: "2px", lineHeight: 1.5 }}>
            {greeting.line2}
          </div>
        </div>
        {/* 저장 상태 pill — saving/saved/error 시에만 표시 */}
        {d.persistStatus && d.persistStatus !== "idle" && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "4px 10px", borderRadius: "999px",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.01em",
            background:
              d.persistStatus === "saving" ? "rgba(25,25,112,0.08)" :
              d.persistStatus === "saved" ? "rgba(52,199,89,0.10)" :
              "rgba(255,59,48,0.10)",
            color:
              d.persistStatus === "saving" ? PALETTE.MIDNIGHT :
              d.persistStatus === "saved" ? PALETTE.SUCCESS :
              PALETTE.DANGER,
            flexShrink: 0,
            alignSelf: "flex-start",
            whiteSpace: "nowrap" as const,
          }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: "currentColor",
              animation: d.persistStatus === "saving" ? "pulse 1.2s ease-in-out infinite" : undefined,
            }} />
            {d.persistStatus === "saving" ? (ko ? "저장 중" : "Saving") :
              d.persistStatus === "saved" ? (ko ? "저장됨" : "Saved") :
              (ko ? "저장 실패 — 새로고침" : "Save failed")}
          </div>
        )}

        {/* 오늘의 보고서 진입 버튼 — 영업 종료 후만 활성화 */}
        <DailyReportButton ko={ko} d={d} />
      </motion.div>

      {/* Row 2 — 메인 메트릭 + sparkline */}
      <motion.div variants={itemVariants} style={{
        background: "#ffffff",
        color: PALETTE.INK,
        borderRadius: "18px",
        padding: "20px 22px",
        display: "flex",
        gap: "20px",
        alignItems: "stretch",
        flexWrap: "wrap" as const,
        position: "relative",
        zIndex: 1,
        border: "1px solid rgba(25,25,112,0.06)",
        boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
      }}>
        {/* Metric */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: PALETTE.MIDNIGHT, opacity: 0.7 }}>
              {heroMetric.label}
            </div>
            <button
              type="button"
              ref={nsmButtonRef}
              onClick={() => setNsmPickerOpen((v) => !v)}
              aria-label={ko ? "북극성 지표 변경" : "Change North Star metric"}
              title={ko ? "내 사업의 단 1개 숫자 — 클릭해서 변경" : "Your single number — click to change"}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "22px", height: "22px", borderRadius: "999px",
                border: "1px solid rgba(25,25,112,0.12)",
                background: nsmPickerOpen ? "rgba(25,25,112,0.08)" : "rgba(25,25,112,0.03)",
                color: PALETTE.MIDNIGHT, opacity: 0.7,
                cursor: "pointer", padding: 0,
                transition: "background 0.15s ease, opacity 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = nsmPickerOpen ? "1" : "0.7"; }}
            >
              <Settings2 size={11} strokeWidth={2} />
            </button>
          </div>

          {/* NSM Picker Popover — Portal 로 document.body 에 렌더 (stacking context 격리, 2026-05-11 fix)
              이전: position absolute → 부모 hero 의 stacking context 안에 갇혀 z-index 50 이 효과 없었음 */}
          {nsmPickerOpen && mounted && nsmAnchor && createPortal(
            <div
              ref={nsmPopoverRef}
              role="dialog"
              aria-label={ko ? "북극성 지표 선택" : "Select North Star"}
              style={{
                position: "absolute",
                top: nsmAnchor.top,
                left: nsmAnchor.left,
                zIndex: 9999,
                width: "min(360px, calc(100vw - 48px))",
                background: "#fff",
                border: "1px solid rgba(25,25,112,0.10)",
                borderRadius: "14px",
                boxShadow: "0 1px 3px rgba(25,25,112,0.06), 0 16px 40px rgba(25,25,112,0.18)",
                padding: "10px",
                display: "grid", gap: "2px",
                maxHeight: "min(440px, calc(100vh - 120px))",
                overflowY: "auto" as const,
                fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
              }}
            >
              <div style={{
                padding: "6px 10px 8px", fontSize: "10.5px", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase" as const,
                color: PALETTE.MIDNIGHT, opacity: 0.6,
              }}>
                {ko ? "내 사업의 단 1개 숫자" : "Your single number"}
              </div>
              {NSM_OPTIONS_KO
                .filter((opt) => !opt.showFor || (opt.showFor === "subs" && usesSubscriptions))
                .map((opt) => {
                  const isActive = (northStarMetric ?? "auto") === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setNorthStarMetric(opt.key === "auto" ? null : opt.key);
                        setNsmPickerOpen(false);
                      }}
                      style={{
                        display: "grid", gridTemplateColumns: "16px 1fr", columnGap: "10px",
                        alignItems: "start", textAlign: "left" as const,
                        padding: "10px 12px", borderRadius: "10px",
                        border: "none",
                        background: isActive ? "rgba(25,25,112,0.06)" : "transparent",
                        cursor: "pointer",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(25,25,112,0.03)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{
                        width: "16px", height: "16px", marginTop: "2px",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isActive && <Check size={14} strokeWidth={2.4} color={PALETTE.MIDNIGHT_DEEP} />}
                      </div>
                      <div style={{ display: "grid", gap: "2px" }}>
                        <div style={{
                          fontSize: "13px", fontWeight: 650,
                          color: isActive ? PALETTE.MIDNIGHT_DEEP : "#0f172a",
                          letterSpacing: "-0.01em",
                        }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: "11.5px", color: PALETTE.MUTED, lineHeight: 1.5 }}>
                          {opt.hint}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>,
            document.body
          )}
          <div style={{ fontSize: "clamp(34px, 5vw, 44px)", fontWeight: 700, letterSpacing: "-0.045em", color: PALETTE.MIDNIGHT_DEEP, lineHeight: 1, fontVariantNumeric: "tabular-nums" as const }}>
            <CountUp to={heroMetric.value} duration={1.0} format={heroMetric.format} />
          </div>
          {/* delta */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "10px", padding: "5px 11px", borderRadius: "999px", background: heroMetric.tone === "good" ? PALETTE.SUCCESS_8 : heroMetric.tone === "warn" ? PALETTE.WARN_8 : PALETTE.DANGER_8, color: toneColor }}>
            {heroMetric.delta >= 0 ? <ArrowUpRight size={13} strokeWidth={2.4} /> : <ArrowDownRight size={13} strokeWidth={2.4} />}
            <span style={{ fontSize: "12.5px", fontWeight: 700, fontVariantNumeric: "tabular-nums" as const }}>
              {heroMetric.delta >= 0 ? "+" : ""}{heroMetric.delta.toFixed(1)}%
            </span>
            <span style={{ fontSize: "11.5px", fontWeight: 600, opacity: 0.75 }}>{heroMetric.deltaLabel}</span>
          </div>
          {/* Bezos-style narrative — "어제보다 N% 위 — 평소 대비 +M%" */}
          {narrative && (
            <div style={{ fontSize: "12.5px", color: PALETTE.MUTED, marginTop: "8px", lineHeight: 1.5, fontWeight: 500 }}>
              {narrative}
            </div>
          )}
        </div>

        {/* Sparkline — 입력된 매출일만 (0인 날 제외, 2026-05-11 fix) */}
        {sparkline ? (
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: PALETTE.MUTED_45, marginBottom: "6px" }}>
              {ko ? `입력한 매출 (${sparkline.entryCount}일)` : `Logged sales (${sparkline.entryCount}d)`}
            </div>
            <svg width="100%" viewBox={`0 0 ${sparkline.W} ${sparkline.H}`} preserveAspectRatio="none" style={{ display: "block", height: "64px", overflow: "visible" }}>
              <defs>
                <linearGradient id="ceoSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.gradients.primary.from} />
                  <stop offset="100%" stopColor={CHART_COLORS.gradients.primary.to} />
                </linearGradient>
              </defs>
              <motion.path
                d={sparkline.fillPath}
                fill="url(#ceoSpark)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              />
              <motion.path
                d={sparkline.path}
                fill="none"
                stroke={PALETTE.MIDNIGHT}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* 각 입력 지점 dot — 변동을 시각적으로 명확히 표시 */}
              {sparkline.points.map((p, i) => {
                const isLast = i === sparkline.points.length - 1;
                return (
                  <motion.circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={isLast ? 3.8 : 2.4}
                    fill={isLast ? PALETTE.MIDNIGHT : "#fff"}
                    stroke={PALETTE.MIDNIGHT}
                    strokeWidth={isLast ? 0 : 1.5}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                );
              })}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10.5px", fontWeight: 600, color: PALETTE.MUTED_45 }}>
              <span>{last14.filter((e) => e.sales > 0)[0]?.date.slice(5).replace("-", "/") ?? ""}</span>
              <span>{last14.filter((e) => e.sales > 0).slice(-1)[0]?.date.slice(5).replace("-", "/") ?? ""}</span>
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1, minWidth: 240,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: PALETTE.MUTED_45, fontSize: "12.5px", fontWeight: 600,
            padding: "12px 8px",
            background: "rgba(25,25,112,0.025)",
            borderRadius: "12px",
            border: "1px dashed rgba(25,25,112,0.10)",
          }}>
            <BarChart3 size={18} strokeWidth={1.6} style={{ marginBottom: "6px", opacity: 0.5 }} />
            <div style={{ fontSize: "12.5px", fontWeight: 650, color: "rgba(15,23,42,0.5)" }}>
              {ko ? "매출 3일 이상 입력하면 추세가 보입니다" : "Log 3+ days to see trend"}
            </div>
            <div style={{ fontSize: "11px", fontWeight: 500, color: PALETTE.MUTED_45, marginTop: "3px" }}>
              {ko ? `현재 ${last14.filter((e) => e.sales > 0).length}일 입력됨` : `${last14.filter((e) => e.sales > 0).length} day(s) logged`}
            </div>
          </div>
        )}
      </motion.div>

      {/* Row 3 — AI 경영 브리핑 (cashflow 위기·이상 신호·AI 액션·업종 인사이트 통합) */}
      {/* 데이터 0건 시 첫 기록 입력 폼으로 분기 (0매출 entry는 정당한 데이터로 취급) */}
      <motion.div variants={itemVariants} style={{
        marginTop: "12px",
        position: "relative",
        zIndex: 1,
      }}>
        {brain.hasNoData ? (
          // ── 데이터 0건: 인라인 첫 기록 폼 ──
          <div style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid rgba(25,25,112,0.10)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap" as const,
            boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: PALETTE.MIDNIGHT_8,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <BarChart3 size={17} strokeWidth={1.5} color={PALETTE.MIDNIGHT} />
            </div>
            <div style={{ flex: "1 1 auto", minWidth: 200 }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: PALETTE.MIDNIGHT, opacity: 0.72, marginBottom: "2px" }}>
                {ko ? "오늘의 첫 기록" : "Your first entry"}
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, letterSpacing: "-0.01em", color: PALETTE.MIDNIGHT_DEEP, lineHeight: 1.4 }}>
                {ko ? (isStartup ? "매출 + 사용자 수 입력하면 AI 경영 브리핑 시작" : "매출 + 고객 수 입력하면 AI 경영 브리핑 시작") : (isStartup ? "Sales + users → AI briefing" : "Sales + customers → AI briefing")}
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const raw = (d.dailySalesInput as string | undefined) ?? "";
                console.info("[buildup hero] form submit", { sales: raw, customers: d.dailyCustomersInput, hasHandler: typeof d.handleAddDailyEntry });
                // 빈 input만 차단 — "0"은 정당한 입력 (휴무일·매출 없음).
                if (raw === "") return;
                if (typeof d.handleAddDailyEntry === "function") {
                  d.handleAddDailyEntry();
                } else {
                  console.error("[buildup hero] handleAddDailyEntry is not a function!", d.handleAddDailyEntry);
                }
              }}
              style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}
            >
              <input
                type="text"
                inputMode="numeric"
                placeholder={ko ? "매출 만원" : "Sales (10K)"}
                value={(d.dailySalesInput as string | undefined) ?? ""}
                onChange={(e) => {
                  if (typeof d.setDailySalesInput === "function") {
                    d.setDailySalesInput(e.target.value);
                  } else {
                    console.error("[buildup hero] setDailySalesInput is not a function!");
                  }
                }}
                style={{ width: 110, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(25,25,112,0.14)", fontSize: 13, fontWeight: 600, color: PALETTE.INK, outline: "none", fontVariantNumeric: "tabular-nums" as const, background: "#fafbfe" }}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder={ko ? (isStartup ? "사용자 명" : "고객 명") : (isStartup ? "Users" : "Cust.")}
                value={(d.dailyCustomersInput as string | undefined) ?? ""}
                onChange={(e) => d.setDailyCustomersInput?.(e.target.value)}
                style={{ width: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(25,25,112,0.14)", fontSize: 13, fontWeight: 600, color: PALETTE.INK, outline: "none", fontVariantNumeric: "tabular-nums" as const, background: "#fafbfe" }}
              />
              {(() => {
                // 빈 input만 비활성 — "0"은 정당한 입력 (휴무일).
                const isValid = ((d.dailySalesInput as string | undefined) ?? "") !== "";
                return (
                  <button
                    type="submit"
                    disabled={!isValid}
                    style={{
                      padding: "8px 14px", borderRadius: "999px",
                      border: "none",
                      background: isValid ? PALETTE.MIDNIGHT : "rgba(25,25,112,0.18)",
                      color: "#fff",
                      fontSize: 12, fontWeight: 700, letterSpacing: "-0.005em",
                      cursor: isValid ? "pointer" : "default",
                      boxShadow: isValid ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                      transition: "background 0.18s ease, transform 0.15s ease",
                    }}
                  >
                    {ko ? "기록" : "Log"}
                  </button>
                );
              })()}
            </form>
          </div>
        ) : (
          // ── 데이터 있음: AI 경영 브리핑 narrative + CTA ──
          //
          // ⚠️ CRITICAL (2026-05-11): 사용자 신고 — "배너 어디를 눌러도 이동됨. 확인하기 버튼을 눌러야만 이동해야 함."
          //   종래엔 outer <button> 이 모든 영역(분석·행동·태그·뱃지)을 감싸 click hit-area 폭주.
          //   해결: 외곽은 *비클릭* <div> 로 변경. 우측 pill 만 진짜 <button> 으로 격리.
          <div
            style={{
              width: "100%",
              background: briefing.tone === "crisis"
                ? "rgba(255,59,48,0.05)"
                : briefing.tone === "warning"
                  ? "rgba(255,159,10,0.04)"
                  : "#ffffff",
              border: briefing.tone === "crisis"
                ? "1px solid rgba(255,59,48,0.22)"
                : briefing.tone === "warning"
                  ? "1px solid rgba(255,159,10,0.20)"
                  : "1px solid rgba(25,25,112,0.08)",
              borderRadius: "14px",
              padding: "14px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              color: PALETTE.INK,
              textAlign: "left" as const,
              boxShadow: "0 1px 2px rgba(25,25,112,0.03)",
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: briefing.tone === "crisis"
                ? "rgba(255,59,48,0.10)"
                : briefing.tone === "warning"
                  ? "rgba(255,159,10,0.10)"
                  : PALETTE.MIDNIGHT_8,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              marginTop: 2,
            }}>
              {briefing.tone === "crisis" || briefing.tone === "warning"
                ? <AlertTriangle size={17} strokeWidth={2.2} color={briefing.tone === "crisis" ? PALETTE.DANGER : PALETTE.WARN} />
                : briefing.source === "ai-action" || briefing.source === "agent"
                  ? <Sparkles size={17} strokeWidth={1.5} color={PALETTE.MIDNIGHT} />
                  : <Compass size={17} strokeWidth={1.5} color={PALETTE.MIDNIGHT} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" as const }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: briefing.tone === "crisis" ? PALETTE.DANGER : briefing.tone === "warning" ? PALETTE.WARN : PALETTE.MIDNIGHT, opacity: 0.78 }}>
                  {ko ? briefing.tagKo : briefing.tagEn}
                </span>
                {briefing.priority && (
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "2px 8px", borderRadius: "999px",
                    background: PRIORITY_META[briefing.priority].bg,
                    color: PRIORITY_META[briefing.priority].color,
                    fontSize: "10px", fontWeight: 700,
                  }}>
                    {PRIORITY_META[briefing.priority].label}
                  </span>
                )}
                {/* 경영 건강 점수 — Tier 0 카드 → Hero 헤더 통합 (2026-05-11 AI 의회 결정).
                    사장님이 모닝 브리핑 첫 시선에 *종합 건강도* 한눈 인지. dot 색·grade·점수 한 줄. */}
                {d.businessLaunched && d.businessHealthScore && d.businessHealthScore !== "unknown" && (
                  <HealthScoreBadge grade={d.businessHealthScore} ko={ko} />
                )}
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 600, letterSpacing: "-0.005em", lineHeight: 1.5, color: PALETTE.INK, marginBottom: "4px" }}>
                {ko ? briefing.analysisKo : briefing.analysisEn}
              </div>
              <div style={{ fontSize: "12.5px", color: PALETTE.MUTED, lineHeight: 1.5, fontWeight: 500 }}>
                {ko ? briefing.actionKo : briefing.actionEn}
              </div>
              {briefing.referencedCase && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px", padding: "2px 8px", borderRadius: "999px", background: PALETTE.MIDNIGHT_8, color: PALETTE.MIDNIGHT, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.02em" }}>
                  {ko ? "사례:" : "Case:"} {briefing.referencedCase.name}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleBriefingCta}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontSize: "12px", fontWeight: 700,
                padding: "6px 11px", borderRadius: "999px",
                border: "none",
                background: briefing.tone === "crisis" ? PALETTE.DANGER : briefing.tone === "warning" ? PALETTE.WARN : PALETTE.MIDNIGHT,
                color: "#fff",
                cursor: "pointer",
                flexShrink: 0,
                alignSelf: "center",
                boxShadow: briefing.tone === "crisis" ? "0 2px 6px rgba(255,59,48,0.25)" : briefing.tone === "warning" ? "0 2px 6px rgba(255,159,10,0.25)" : "0 2px 6px rgba(25,25,112,0.22)",
                transition: "transform 0.15s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {ko ? briefing.ctaKo : briefing.ctaEn}
              <ChevronRight size={12} strokeWidth={2.4} />
            </button>
          </div>
        )}

        {/* ═══════════════ AI 추천 카드 스택 (industry insights) ═══════════════
            briefing 카드 아래에 우선순위 배지 단 미니 카드 2-3개 펼치기 노출.
            briefing 이 industry source 면 첫 인사이트는 hero 라 1번부터, 그 외는 모두. */}
        {stackList.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <InsightStack related={stackList} ko={ko} />
          </div>
        )}
      </motion.div>
    </motion.section>
  );
}

// ─── Helpers ───
// 타깃 카드를 1.2초간 미드나이트 ring으로 강조 — 사용자가 "어디로 갔는지" 즉시 인지.
function flashHighlight(el: HTMLElement) {
  const prevTransition = el.style.transition;
  const prevBoxShadow = el.style.boxShadow;
  el.style.transition = "box-shadow 0.35s ease";
  el.style.boxShadow = "0 0 0 3px rgba(25,25,112,0.32), 0 12px 36px -8px rgba(25,25,112,0.28)";
  window.setTimeout(() => {
    el.style.boxShadow = prevBoxShadow;
    window.setTimeout(() => {
      el.style.transition = prevTransition;
    }, 400);
  }, 1100);
}

function fmtKrw(n: number, ko: boolean): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  if (n >= 100_000_000) return ko ? `${(n / 100_000_000).toFixed(1)}억원` : `₩${(n / 100_000_000).toFixed(1)}B`;
  if (n >= 10_000) return ko ? `${Math.round(n / 10_000).toLocaleString()}만원` : `₩${Math.round(n / 10_000).toLocaleString()}M`;
  return ko ? `${Math.round(n).toLocaleString()}원` : `₩${Math.round(n).toLocaleString()}`;
}

/**
 * HealthScoreBadge — 모닝 브리핑 헤더 inline 건강 점수 pill.
 *
 *  ── 2026-05-11 (AI 의회 결정) ──────────────────────────────────────
 *  종전: BusinessHealthScoreCard 별도 카드 (Tier 0, 180px 높이 차지)
 *        → 매출/고객 그래프가 fold 아래로 밀려나는 부작용.
 *  통합: 모닝 브리핑 헤더에 작은 pill 로 임베드. 사장님은 첫 시선에 *건강 grade*
 *        를 보고, AI 코칭이 *왜 그 grade 인지* 분석/액션으로 연결.
 *  ──────────────────────────────────────────────────────────────────
 *
 *  디자인:
 *   · 8px dot + glow (Apple Health 톤)
 *   · grade 라벨 (건강/주의/위험) + 점수 숫자
 *   · 색조: GREEN/AMBER/ROSE × 0.08 tint background — 시각 부담 최소
 *   · grade 별 텍스트 색은 진한 톤 (가독성)
 */
function HealthScoreBadge({
  grade,
  ko,
}: {
  grade: "healthy" | "caution" | "danger";
  ko: boolean;
}) {
  // 점수·라벨·색 — BusinessHealthScoreCard SSOT 와 동일 매핑
  const score = grade === "healthy" ? 85 : grade === "caution" ? 55 : 30;
  const label = grade === "healthy" ? (ko ? "건강" : "Healthy")
    : grade === "caution" ? (ko ? "주의" : "Caution")
    : (ko ? "위험" : "Danger");
  const dotColor = grade === "healthy" ? "#059669"
    : grade === "caution" ? "#d97706"
    : "#dc2626";
  const bgColor = grade === "healthy" ? "rgba(5,150,105,0.08)"
    : grade === "caution" ? "rgba(217,119,6,0.08)"
    : "rgba(220,38,38,0.08)";
  const textColor = grade === "healthy" ? "#047857"
    : grade === "caution" ? "#a16207"
    : "#b91c1c";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px 3px 7px",
        borderRadius: "999px",
        background: bgColor,
        border: `0.5px solid ${dotColor}1f`,
        fontSize: "10.5px",
        fontWeight: 700,
        color: textColor,
        letterSpacing: "-0.005em",
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums" as const,
      }}
      title={ko
        ? `경영 건강 점수 ${score}/100 — ${label}`
        : `Business Health ${score}/100 — ${label}`}
    >
      <span style={{
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: dotColor,
        boxShadow: `0 0 0 2.5px ${dotColor}22`,
        flexShrink: 0,
      }} />
      <span>{ko ? "건강도" : "Health"}</span>
      <span style={{ opacity: 0.55, fontWeight: 600 }}>·</span>
      <span>{label} {score}</span>
    </span>
  );
}

/**
 * 오늘의 보고서 진입 버튼 — 영업 종료 후만 활성.
 *
 * 사용자 결정 (2026-05-04):
 *   - 일일 보고서는 영업 종료 시점부터 의미 있음 (그 전엔 데이터 미완)
 *   - 스타트업·온라인은 21:00 KST, 그 외는 closeTime + 30분
 *   - 영업 중엔 비활성 + "21:00 활성화" 안내, 영업 종료 후엔 활성 + reports surface 진입
 */
function DailyReportButton({ ko, d }: { ko: boolean; d: DashboardHook }) {
  const businessCloseTime = useProfileStore((s) => s.businessCloseTime);
  const ctx = { categoryId: d.industryCategoryId, closeTime: businessCloseTime };
  const closed = isBusinessDayClosed(new Date(), ctx);
  const activeAt = dailyReportActiveTimeLabel(ctx);

  // 사용자 요청 (2026-05-08): 보고서 페이지는 *항상* 진입 가능. 자물쇠/비활성 X.
  // 영업 종료 전에는 부제로 "{activeAt} 자동 도착 예정" 만 안내.
  return (
    <button
      type="button"
      onClick={() => d.navigateToSurface("reports")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 10,
        border: `1px solid ${PALETTE.MIDNIGHT}`,
        background: PALETTE.MIDNIGHT,
        color: "white",
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
        transition: "all 0.15s ease",
      }}
      title={closed
        ? (ko ? "오늘의 보고서로 이동" : "Open today's report")
        : (ko ? `${activeAt} 자동 도착 예정 (지금도 미리보기 가능)` : `Auto-delivers at ${activeAt}`)}
    >
      <FileText size={12} strokeWidth={1.8} />
      {ko ? "오늘의 보고서" : "Today's report"}
    </button>
  );
}
