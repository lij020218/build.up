"use client";

/**
 * UserActivityCard — 사용자(고객·주문) 변화 카드.
 *
 * IA:
 *  - Header (sticky)
 *  - Hero: 총 누적 + 오늘 신규 inline badge
 *  - Milestone ring (다음 목표까지 % 진행) — 데이터 적어도 시각 풍부
 *  - 3-mini-stat 그리드 (오늘 / 일 평균 / 월 예상)
 *  - Sparkline (2일+) or empty illustration (1일 이하)
 *  - Footer: WoW · 객단가 · DoD
 *
 * Apple Health · Stripe Sigma 톤 — 라이트 미드나이트 그라디언트 + 단일 색 가중.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, TrendingUp, TrendingDown, Minus, Sparkles, Target, Calendar,
  Sprout, Leaf, TreePine, Rocket, Gem, Star, Trophy, Crown,
  type LucideIcon,
} from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import { CountUp } from "./animations";
import { activityCard } from "./operationalStyles";
import { shiftIsoDate } from "../../utils/business-day";

type DailyEntry = { date: string; sales: number; customers: number };

type Props = {
  d: DashboardHook;
  ko: boolean;
  todayStr: string;
  recent7Entries: DailyEntry[];
  todayEntry: DailyEntry | null;
  fmt: (n: number) => string;
};

// 마일스톤 목표 — 현재 누적치보다 한 단계 위 (애플 SF Symbols 톤 lucide 아이콘)
type Milestone = { target: number; label: string; Icon: LucideIcon };
function nextMilestone(current: number): Milestone {
  const tiers: Milestone[] = [
    { target: 10,    label: "첫 10명",     Icon: Sprout },
    { target: 50,    label: "50명 돌파",    Icon: Leaf },
    { target: 100,   label: "100명 클럽",   Icon: TreePine },
    { target: 500,   label: "500명 돌파",   Icon: Rocket },
    { target: 1000,  label: "1,000명",      Icon: Gem },
    { target: 5000,  label: "5,000명",      Icon: Star },
    { target: 10000, label: "10,000명",     Icon: Trophy },
    { target: 50000, label: "50,000명",     Icon: Crown },
  ];
  for (const t of tiers) {
    if (current < t.target) return t;
  }
  const nextTarget = Math.ceil(current / 10000) * 10000 + 10000;
  return { target: nextTarget, label: `${nextTarget.toLocaleString()}명`, Icon: Crown };
}

export function UserActivityCard({ d, ko, todayStr, recent7Entries, todayEntry, fmt }: Props) {
  // ── 업종별 라벨 분기 ──
  const categoryId = (d.businessCtx as { categoryId?: string } | undefined)?.categoryId ?? "";
  const isStartupCat = categoryId === "startup-tech";
  const isOnlineCat = categoryId === "online-digital";
  const usesSubs = !!d.usesSubscriptions;

  const userKindKo = usesSubs || isStartupCat ? "사용자" : isOnlineCat ? "주문" : "고객";
  const userKindEn = usesSubs || isStartupCat ? "Users" : isOnlineCat ? "Orders" : "Customers";
  const userKind = ko ? userKindKo : userKindEn;
  const userUnitSuffix = ko ? (isOnlineCat ? "건" : "명") : "";
  const avgTicketLabel = ko
    ? (usesSubs ? "ARPU" : isOnlineCat ? "주문단가" : "객단가")
    : (usesSubs ? "ARPU" : isOnlineCat ? "AOV" : "Avg ticket");

  // ── 7일 슬롯 ──
  // ⚠️ 2026-05-27 fix (버그 #2): todayStr (영업일) 기준으로 역산.
  //   기존: `new Date(); setDate(-6+i); getKstDate()` → 달력 KST 기준 7일.
  //   카페·바 22:30~01:30 시간대에 todayStr 가 다음 영업일로 롤오버되면 last7 마지막 슬롯
  //   ("오늘") 이 사라지고 isToday 가 어떤 막대에도 매치되지 않던 버그.
  const last7 = Array.from({ length: 7 }, (_, index) => shiftIsoDate(todayStr, index - 6));
  const entryMap = Object.fromEntries(recent7Entries.map((e) => [e.date, e]));
  const bars = last7.map((date) => {
    const entry = entryMap[date];
    return {
      date,
      customers: entry?.customers ?? 0,
      sales: entry?.sales ?? 0,
      isToday: date === todayStr,
    };
  });

  const allEntries = (d.dailyEntries as DailyEntry[]) ?? [];
  const recent7Customers = bars.reduce((s, b) => s + b.customers, 0);
  const prev7Entries = (() => {
    const sorted = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-14, -7);
  })();
  const prev7Customers = prev7Entries.reduce((s, e) => s + e.customers, 0);
  const wowDelta = prev7Customers > 0
    ? Math.round(((recent7Customers - prev7Customers) / prev7Customers) * 100)
    : null;

  // ⚠️ 2026-05-27 fix (버그 #1): todayStr (영업일) 기준 -1일.
  const yesterdayIso = shiftIsoDate(todayStr, -1);
  const yesterdayEntry = entryMap[yesterdayIso];
  const dodDelta = todayEntry && yesterdayEntry && yesterdayEntry.customers > 0
    ? Math.round(((todayEntry.customers - yesterdayEntry.customers) / yesterdayEntry.customers) * 100)
    : null;

  const todayCustomers = todayEntry?.customers ?? 0;
  const todaySales = todayEntry?.sales ?? 0;
  const todayAvgTicket = todayCustomers > 0 ? Math.round(todaySales / todayCustomers) : 0;

  const cumulativeTotal = allEntries.reduce((s, e) => s + (e.customers ?? 0), 0);

  const daysWithData = bars.filter((b) => b.customers > 0).length;
  const daysRecorded = allEntries.filter((e) => (e.customers ?? 0) > 0).length;

  // ── 평균·예상 ─────────────────────────────────────────────────
  // ⚠️ CRITICAL FIX (2026-05-11): entry 개수가 아니라 *경과 영업일수* 로 나눠야 함.
  //   사용자 보고: 누적 26명, 7일+ 운영했는데 2일치만 입력 → daysRecorded=2 → dailyAvg=13 → 월 390 (잘못)
  //   같은 버그가 CEOMorningHero 매출 쪽에서 2026-05-08 fix 됐는데, 이쪽 (고객) 은 누락.
  //
  //   분모 우선순위:
  //    (1) businessLaunchedDate 기준 경과일 — 가장 정확 (사장님이 등록한 개업일)
  //    (2) 첫 entry 날짜 기준 경과일 — fallback (개업일 미입력 시)
  //    상한: 14일 — 그 이상 운영했어도 직전 2주 추세로 보는 게 더 의미 있음
  //   입력 안 한 날은 *0명* 으로 자연 반영 (보수적 — 과대 추정 방지).
  const businessLaunchedDate = (d as { businessLaunchedDate?: string | null }).businessLaunchedDate ?? null;
  const sortedEntries = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));
  const earliestEntryDate = sortedEntries[0]?.date;
  const todayMs = new Date().getTime();
  const referenceDate = businessLaunchedDate ?? earliestEntryDate ?? null;
  const elapsedDays = referenceDate
    ? Math.min(14, Math.max(1, Math.floor((todayMs - new Date(referenceDate).getTime()) / 86_400_000) + 1))
    : Math.max(1, daysRecorded);
  const dailyAvg = elapsedDays > 0 ? Math.round(cumulativeTotal / elapsedDays) : 0;
  // 데이터 신뢰도 — 경과일 대비 입력 일수 비율. 50% 미만이면 추정치 표시 (신뢰도 낮음).
  const dataConfidence = elapsedDays > 0 ? Math.min(1, daysRecorded / elapsedDays) : 0;
  const isLowConfidence = dataConfidence < 0.5 && daysRecorded > 0;
  const monthlyProjected = dailyAvg * 30;

  // ── 마일스톤 ──
  const milestone = nextMilestone(cumulativeTotal);
  const milestonePct = Math.min(100, (cumulativeTotal / milestone.target) * 100);

  // ── Sparkline ──
  const sparkline = useMemo(() => {
    const values = bars.map((b) => b.customers);
    if (daysWithData < 2) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);
    const W = 280;
    const H = 64;
    const pad = 6;
    const points = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = pad + (1 - (v - min) / range) * (H - pad * 2);
      return { x, y, v, i, isToday: bars[i].isToday };
    });
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
  }, [bars, daysWithData]);

  // ── 마일스톤 ring 도형 (60px) ──
  const ringSize = 56;
  const ringStroke = 6;
  const ringR = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringR;
  const ringDash = (milestonePct / 100) * ringCirc;

  return (
    <section style={{ ...activityCard, position: "relative" as const, overflow: "hidden" as const }} className="bento-card" data-user-activity>
      {/* Ambient glow — 우측 상단 미드나이트 hue (subtle depth) */}
      <div aria-hidden style={{
        position: "absolute" as const,
        top: -80, right: -60,
        width: 200, height: 200,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,107,255,0.08) 0%, rgba(91,107,255,0) 70%)",
        pointerEvents: "none" as const,
      }} />

      {/* ── 헤더 ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase" as const, color: "#191970", opacity: 0.7,
        position: "relative" as const, zIndex: 1,
      }}>
        <Users size={12} strokeWidth={1.5} />
        {ko ? `${userKind} 변화` : `${userKind} Trend`}
        <span style={{ fontSize: "10.5px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.02em", textTransform: "none" as const, marginLeft: "auto" }}>
          {ko ? "최근 7일" : "Last 7d"}
        </span>
      </div>

      {/* ── Hero: 총 누적 (좌) + 마일스톤 ring (우) ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginTop: "12px",
        position: "relative" as const,
        zIndex: 1,
      }}>
        {/* 좌: 총 누적 + 오늘 +N badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#191970", opacity: 0.65, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "4px" }}>
            {ko ? `총 누적 ${userKindKo}` : `Cumulative ${userKindEn}`}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.045em", color: "#0f0f4a", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const }}>
              <CountUp to={cumulativeTotal} duration={1.0} format={(n) => Math.round(n).toLocaleString()} />
            </span>
            {userUnitSuffix && (
              <span style={{ fontSize: "16px", fontWeight: 600, color: "rgba(15,23,42,0.5)", letterSpacing: "-0.02em" }}>
                {userUnitSuffix}
              </span>
            )}
            {todayCustomers > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "3px",
                padding: "3px 9px", borderRadius: "999px",
                fontSize: "11.5px", fontWeight: 700,
                background: "rgba(52,199,89,0.10)",
                color: "#0e7c3a",
                fontVariantNumeric: "tabular-nums" as const,
                letterSpacing: "-0.005em",
              }}>
                <TrendingUp size={11} strokeWidth={1.5} />
                +{todayCustomers}{userUnitSuffix}
                <span style={{ fontWeight: 500, opacity: 0.75 }}>{ko ? "오늘" : "today"}</span>
              </span>
            )}
          </div>
        </div>

        {/* 우: 마일스톤 ring */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          flexShrink: 0,
        }}>
          <div style={{ position: "relative" as const, width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
              {/* track */}
              <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="rgba(25,25,112,0.10)" strokeWidth={ringStroke} />
              {/* progress */}
              <motion.circle
                cx={ringSize / 2} cy={ringSize / 2} r={ringR}
                fill="none"
                stroke="#191970"
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                initial={{ strokeDashoffset: ringCirc }}
                animate={{ strokeDashoffset: ringCirc - ringDash }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ transform: `rotate(-90deg)`, transformOrigin: "center" }}
              />
            </svg>
            <div style={{
              position: "absolute" as const,
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10.5px",
              fontWeight: 700,
              color: "#0f0f4a",
              fontVariantNumeric: "tabular-nums" as const,
              letterSpacing: "-0.01em",
            }}>
              {Math.round(milestonePct)}%
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "2px", minWidth: 70 }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(25,25,112,0.55)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              {ko ? "다음 목표" : "Next goal"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 700, color: "#0f0f4a", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
              <milestone.Icon size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "#191970", flexShrink: 0 }} />
              {ko ? milestone.label : `${milestone.target.toLocaleString()}`}
            </span>
            <span style={{ fontSize: "10.5px", fontWeight: 600, color: "rgba(15,23,42,0.5)", fontVariantNumeric: "tabular-nums" as const }}>
              {ko ? `${(milestone.target - cumulativeTotal).toLocaleString()}${userUnitSuffix} 남음` : `${(milestone.target - cumulativeTotal).toLocaleString()} to go`}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3-mini-stat 그리드 ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        marginTop: "14px",
        position: "relative" as const,
        zIndex: 1,
      }}>
        {/* 일 평균 — 누적 / 경과 영업일수 (entry 개수 아님) */}
        <div
          style={miniStat}
          title={ko
            ? `누적 ${cumulativeTotal.toLocaleString()}${userUnitSuffix} ÷ 경과 ${elapsedDays}일 = 일 평균${isLowConfidence ? ` · 입력 ${daysRecorded}일치 (신뢰도 낮음)` : ""}`
            : `${cumulativeTotal.toLocaleString()} cumulative ÷ ${elapsedDays} elapsed days${isLowConfidence ? ` · only ${daysRecorded} entered` : ""}`}
        >
          <div style={miniStatLabel}>
            <Calendar size={11} strokeWidth={1.5} />
            {ko ? "일 평균" : "Daily avg"}
            {isLowConfidence && <span style={{ fontSize: "9px", color: "rgba(15,23,42,0.4)", fontWeight: 600, marginLeft: "2px" }}>~</span>}
          </div>
          <div style={miniStatValue}>
            {dailyAvg > 0 ? dailyAvg.toLocaleString() : "—"}
            {dailyAvg > 0 && userUnitSuffix && <span style={miniStatUnit}>{userUnitSuffix}</span>}
          </div>
        </div>
        {/* 월 예상 — 일평균 × 30 */}
        <div
          style={miniStat}
          title={ko
            ? `일 평균 ${dailyAvg.toLocaleString()} × 30일 = 월 예상${isLowConfidence ? ` · ${daysRecorded}일치 입력 기준 (참고)` : ""}`
            : `Daily avg ${dailyAvg.toLocaleString()} × 30 days${isLowConfidence ? ` · based on ${daysRecorded} days only` : ""}`}
        >
          <div style={miniStatLabel}>
            <Target size={11} strokeWidth={1.5} />
            {ko ? "월 예상" : "Monthly est"}
            {isLowConfidence && <span style={{ fontSize: "9px", color: "rgba(15,23,42,0.4)", fontWeight: 600, marginLeft: "2px" }}>~</span>}
          </div>
          <div style={miniStatValue}>
            {monthlyProjected > 0 ? monthlyProjected.toLocaleString() : "—"}
            {monthlyProjected > 0 && userUnitSuffix && <span style={miniStatUnit}>{userUnitSuffix}</span>}
          </div>
        </div>
        {/* 객단가 / ARPU */}
        <div style={miniStat}>
          <div style={miniStatLabel}>
            <Sparkles size={11} strokeWidth={1.5} />
            {avgTicketLabel}
          </div>
          <div style={miniStatValue}>
            {todayAvgTicket > 0 ? fmt(todayAvgTicket) : "—"}
          </div>
        </div>
      </div>

      {/* ── Sparkline (2일+) or 첫 기록 인사이트 (1일 이하) ── */}
      <div style={{ marginTop: "14px", position: "relative" as const, zIndex: 1, flex: 1, minHeight: 0 }}>
        {sparkline ? (
          <>
            <svg width="100%" viewBox={`0 0 ${sparkline.W} ${sparkline.H}`} preserveAspectRatio="none" style={{ display: "block", height: "64px" }}>
              <defs>
                <linearGradient id="userActSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(25,25,112,0.32)" />
                  <stop offset="100%" stopColor="rgba(25,25,112,0)" />
                </linearGradient>
              </defs>
              <motion.path d={sparkline.fillPath} fill="url(#userActSpark)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }} />
              <motion.path d={sparkline.path} fill="none" stroke="#191970"
                strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }} />
              {sparkline.points.map((pt) => (
                pt.v > 0 ? (
                  <motion.circle key={pt.i} cx={pt.x} cy={pt.y}
                    r={pt.isToday ? 4 : 2.5}
                    fill={pt.isToday ? "#191970" : "#ffffff"}
                    stroke="#191970"
                    strokeWidth={pt.isToday ? 0 : 1.6}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 + pt.i * 0.04, ease: [0.16, 1, 0.3, 1] }} />
                ) : null
              ))}
              {(() => {
                const todayPoint = sparkline.points.find((p) => p.isToday && p.v > 0);
                if (!todayPoint) return null;
                return (
                  <motion.circle cx={todayPoint.x} cy={todayPoint.y} r={4}
                    fill="none" stroke="rgba(25,25,112,0.35)" strokeWidth={1.5}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.5 }} />
                );
              })()}
            </svg>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
              marginTop: "4px", fontSize: "10.5px",
              color: "rgba(15,23,42,0.42)", fontWeight: 600,
            }}>
              {bars.map((b) => {
                const dayLabel = new Date(`${b.date}T12:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: ko ? "narrow" : "short" });
                return (
                  <span key={b.date} style={{
                    textAlign: "center" as const,
                    color: b.isToday ? "#191970" : "rgba(15,23,42,0.42)",
                    fontWeight: b.isToday ? 700 : 600,
                  }}>
                    {dayLabel}
                  </span>
                );
              })}
            </div>
          </>
        ) : daysRecorded === 1 ? (
          // 1일만 기록된 상태 — 첫 기록 축하 + 다음 기록 유도
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(25,25,112,0.05) 0%, rgba(91,107,255,0.06) 100%)",
              border: "1px solid rgba(25,25,112,0.12)",
              display: "flex", alignItems: "center", gap: "12px",
            }}
          >
            <div style={{
              flexShrink: 0, width: 38, height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #191970 0%, #3636A8 100%)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
              fontSize: "18px",
            }}>
              <Sparkles size={18} strokeWidth={1.5} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f0f4a", letterSpacing: "-0.01em", lineHeight: 1.3, marginBottom: "2px" }}>
                {ko ? "첫 기록 완료! 추세는 내일부터" : "First entry logged. Trend builds tomorrow"}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                {ko
                  ? <>2일째부터 곡선이 그려지고 <strong style={{ color: "#191970" }}>일 평균·전주 대비</strong>가 자동 계산됩니다.</>
                  : <>From day 2, the trend curve appears and <strong style={{ color: "#191970" }}>weekly comparisons</strong> auto-calculate.</>}
              </div>
            </div>
          </motion.div>
        ) : (
          // 데이터 0건
          <div style={{
            padding: "18px 16px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(25,25,112,0.04) 0%, rgba(25,25,112,0.07) 100%)",
            border: "1px dashed rgba(25,25,112,0.18)",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div style={{
              flexShrink: 0, width: 36, height: 36,
              borderRadius: "50%",
              background: "rgba(25,25,112,0.10)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users size={17} strokeWidth={1.5} color="#191970" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f0f4a", letterSpacing: "-0.01em", marginBottom: "2px" }}>
                {ko ? `오늘 ${userKindKo} 수 기록 시작` : `Start logging ${userKindEn.toLowerCase()}`}
              </div>
              <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                {ko
                  ? <>매출 흐름 카드에서 매출과 함께 입력하면 <strong>일평균·{avgTicketLabel}·트렌드</strong>가 자동 계산됩니다.</>
                  : <>Log alongside sales to unlock <strong>daily avg, {avgTicketLabel}, trend</strong>.</>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 푸터: 7일 신규 + WoW + DoD ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginTop: "12px", paddingTop: "12px",
        borderTop: "1px solid rgba(25,25,112,0.06)",
        fontSize: "11.5px", color: "rgba(15,23,42,0.55)",
        flexWrap: "wrap" as const,
        position: "relative" as const, zIndex: 1,
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#191970", opacity: 0.55, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
            {ko ? "7D" : "7D"}
          </span>
          <span style={{ fontWeight: 700, color: "#0f0f4a", fontVariantNumeric: "tabular-nums" as const, letterSpacing: "-0.005em" }}>
            +<CountUp to={recent7Customers} duration={1.0} format={(n) => Math.round(n).toLocaleString()} />
          </span>
          {userUnitSuffix && <span style={{ fontWeight: 600, color: "rgba(15,23,42,0.45)" }}>{userUnitSuffix}</span>}
        </span>

        {dodDelta != null && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "3px",
            padding: "3px 9px", borderRadius: "999px",
            fontSize: "10.5px", fontWeight: 700,
            background: dodDelta >= 0 ? "rgba(52,199,89,0.10)" : "rgba(255,59,48,0.10)",
            color: dodDelta >= 0 ? "#0e7c3a" : "#b32419",
            fontVariantNumeric: "tabular-nums" as const,
          }}>
            {dodDelta >= 0 ? <TrendingUp size={10} strokeWidth={1.5} /> : <TrendingDown size={10} strokeWidth={1.5} />}
            {dodDelta >= 0 ? "+" : ""}{dodDelta}% <span style={{ fontWeight: 500, opacity: 0.7 }}>{ko ? "어제비" : "DoD"}</span>
          </span>
        )}

        {wowDelta != null && (
          <span style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: "3px",
            padding: "3px 9px", borderRadius: "999px",
            fontSize: "10.5px", fontWeight: 700,
            background: wowDelta >= 0 ? "rgba(52,199,89,0.10)" : wowDelta <= -1 ? "rgba(255,59,48,0.10)" : "rgba(25,25,112,0.06)",
            color: wowDelta >= 0 ? "#0e7c3a" : wowDelta <= -1 ? "#b32419" : "rgba(25,25,112,0.55)",
            fontVariantNumeric: "tabular-nums" as const,
          }}>
            {wowDelta >= 0 ? <TrendingUp size={10} strokeWidth={1.5} /> : wowDelta <= -1 ? <TrendingDown size={10} strokeWidth={1.5} /> : <Minus size={10} strokeWidth={1.5} />}
            {wowDelta >= 0 ? "+" : ""}{wowDelta}% <span style={{ fontWeight: 500, opacity: 0.7 }}>{ko ? "전주비" : "WoW"}</span>
          </span>
        )}
      </div>
    </section>
  );
}

// ─── Mini stat tile styles ───────────────────────────────────────────
const miniStat: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "12px",
  background: "rgba(25,25,112,0.03)",
  border: "1px solid rgba(25,25,112,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  minWidth: 0,
};

const miniStatLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "10px",
  fontWeight: 700,
  color: "#191970",
  opacity: 0.7,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const miniStatValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#0f0f4a",
  letterSpacing: "-0.025em",
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
  display: "flex",
  alignItems: "baseline",
  gap: "3px",
};

const miniStatUnit: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "rgba(15,23,42,0.5)",
};
