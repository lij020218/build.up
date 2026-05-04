"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Compass, Sunrise, Sun, Moon, AlertTriangle, ChevronRight, Sparkles, BarChart3 } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import { CountUp } from "./animations";
import { PALETTE, MOTION, CHART_COLORS } from "./operationalStyles";
import { useMorningBriefingBrain } from "../../hooks/useMorningBriefingBrain";
import { resolveHero, type Hero } from "./MorningBriefing";
import { getBusinessDay } from "../../utils/business-day";

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
  const wowDelta = prev14Total > 0 ? ((last14Total - prev14Total) / prev14Total) * 100 : 0;

  // 런웨이 계산 (간단 버전)
  const monthlyCosts = (d.monthlyCosts ?? {}) as Record<string, number>;
  const totalMonthlyBurn = Object.values(monthlyCosts).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const capitalKrw = ((d.selectedBudget as number | undefined) ?? 0) + ((d.initialOperatingCapital as number | undefined) ?? 0);
  const runwayMonths = totalMonthlyBurn > 0 ? capitalKrw / totalMonthlyBurn : 99;

  const heroMetric: { label: string; value: number; format: (n: number) => string; delta: number; deltaLabel: string; tone: "good" | "warn" | "bad" } = useMemo(() => {
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
    // 자영업: 오늘 매출 (없으면 14일 평균)
    const todaySales = todayEntry?.sales ?? 0;
    const avg14 = last14.length > 0 ? last14Total / last14.length : 0;
    const value = todaySales > 0 ? todaySales : avg14;
    const valueLabel = todaySales > 0 ? (ko ? "오늘 매출" : "Today's sales") : (ko ? "일 평균 (14일)" : "Daily avg (14d)");
    const tone: "good" | "warn" | "bad" = wowDelta >= 5 ? "good" : wowDelta >= -5 ? "warn" : "bad";
    return {
      label: valueLabel,
      value,
      format: (n) => fmtKrw(n, ko),
      delta: wowDelta,
      deltaLabel: ko ? "지난 2주 평균 대비" : "vs prev 2 weeks",
      tone,
    };
  }, [isStartup, runwayMonths, wowDelta, todayEntry, last14Total, last14.length, ko]);

  // ─── Sparkline 데이터 (last 14 days normalized) ───
  const sparkline = useMemo(() => {
    if (last14.length < 2) return null;
    const values = last14.map((e) => e.sales);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);
    const W = 320;
    const H = 64;
    const pad = 4;
    const points = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
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
    return { path, fillPath, points, W, H };
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
    // 디버그 로그 — "왜 거기로 갔지?" 추적용 (auto-clear 가능)
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
        handled = focusBySelector("[data-user-activity]");
        // 사용자 카드를 못 찾으면 매출 카드로 폴백 (객단가·고객수가 매출 카드 안에 함께 표시됨)
        if (!handled) handled = focusBySelector("[data-sales-input]");
        break;
      case "cashflow":
        handled = focusBySelector("[data-cashflow-hero]");
        break;
      case "costs":
        handled = focusBySelector("[data-cost-structure]");
        break;
      case "marketing":
        // 마케팅 라우트가 아직 별도 페이지면 사용자 변화 카드(효과 검증) 또는 매출 카드로 안내
        handled = focusBySelector("[data-user-activity]") || focusBySelector("[data-sales-input]");
        break;
    }
    // 어떤 이유로든 타깃 카드를 못 찾으면 fallback — 매출 입력 카드로
    if (!handled) {
      handled = focusBySelector("[data-sales-input]", { focusInput: true });
    }
    // 그것도 실패하면 최후 수단으로 페이지 스크롤
    if (!handled) {
      window.scrollBy({ top: 320, behavior: "smooth" });
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
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: PALETTE.MIDNIGHT, opacity: 0.65, marginBottom: "3px" }}>
            {now.toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short", month: "short", day: "numeric" })} · {ko ? (isStartup ? "스타트업 모드" : isOnline ? "온라인 모드" : "운영 모드") : "Operations"}
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
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: PALETTE.MIDNIGHT, opacity: 0.7, marginBottom: "6px" }}>
            {heroMetric.label}
          </div>
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

        {/* Sparkline */}
        {sparkline ? (
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: PALETTE.MUTED_45, marginBottom: "6px" }}>
              {ko ? "최근 14일 매출" : "Last 14 days"}
            </div>
            <svg width="100%" viewBox={`0 0 ${sparkline.W} ${sparkline.H}`} preserveAspectRatio="none" style={{ display: "block", height: "64px" }}>
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
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* End dot */}
              <motion.circle
                cx={sparkline.points[sparkline.points.length - 1].x}
                cy={sparkline.points[sparkline.points.length - 1].y}
                r={3.5}
                fill={PALETTE.MIDNIGHT}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10.5px", fontWeight: 600, color: PALETTE.MUTED_45 }}>
              <span>{last14[0]?.date.slice(5).replace("-", "/") ?? ""}</span>
              <span>{last14[last14.length - 1]?.date.slice(5).replace("-", "/") ?? ""}</span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", justifyContent: "center", color: PALETTE.MUTED_45, fontSize: "12.5px", fontWeight: 600 }}>
            {ko ? "매출을 7일 이상 입력하면 트렌드 차트가 보입니다" : "Log 7+ days to see trend"}
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
          <button
            type="button"
            onClick={handleBriefingCta}
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
              cursor: "pointer",
              textAlign: "left" as const,
              transition: "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
              boxShadow: "0 1px 2px rgba(25,25,112,0.03)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
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
              <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: briefing.tone === "crisis" ? PALETTE.DANGER : briefing.tone === "warning" ? PALETTE.WARN : PALETTE.MIDNIGHT, opacity: 0.78, marginBottom: "3px" }}>
                {ko ? briefing.tagKo : briefing.tagEn}
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
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              fontSize: "12px", fontWeight: 700,
              padding: "6px 11px", borderRadius: "999px",
              background: briefing.tone === "crisis" ? PALETTE.DANGER : briefing.tone === "warning" ? PALETTE.WARN : PALETTE.MIDNIGHT,
              color: "#fff",
              flexShrink: 0,
              alignSelf: "center",
              boxShadow: briefing.tone === "crisis" ? "0 2px 6px rgba(255,59,48,0.25)" : briefing.tone === "warning" ? "0 2px 6px rgba(255,159,10,0.25)" : "0 2px 6px rgba(25,25,112,0.22)",
            }}>
              {ko ? briefing.ctaKo : briefing.ctaEn}
              <ChevronRight size={12} strokeWidth={2.4} />
            </div>
          </button>
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
