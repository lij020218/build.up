"use client";

/**
 * 오늘의 요약 — 사장님 목업(2026-07-21) 1:1 구조.
 *
 *   [오늘 매출 타일]  [오늘 고객 타일]  [AI 경영 코칭 카드]
 *   [매출 추이 (7일) ───────────────]  [고객 추이 (7일)]
 *
 * 원칙:
 *  · 카드 신설 아님 — 차트 2개는 기존 ActivitySnapshotCard·UserActivityCard 재사용(이동).
 *  · AI 코칭 카드는 CEOMorningHero 의 brain(resolveHero)을 그대로 요약 표시 —
 *    [자세히 보기]가 전체 브리핑(CEOMorningHero)을 아래에 펼친다 (정보 유실 0).
 *  · 가짜 숫자 금지 — 오늘 기록 없으면 "—", 어제 기록 없으면 delta 미표시.
 *  · 레이아웃은 .dash-summary-grid(@container, 콘텐츠 폭 기준) — 좁으면 1열 스택.
 */

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { ActivitySnapshotCard } from "../ActivitySnapshotCard";
import { UserActivityCard } from "../UserActivityCard";
import { useMorningBriefingBrain } from "../../../hooks/useMorningBriefingBrain";
import { resolveHero, type Hero } from "../heroInsight";
import { useProfileStore } from "../../../stores/profile-store";

const MIDNIGHT = "#191970";
const DANGER = "#b64c4c";

const tileStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 16,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 0,
};

function StatTile({ label, value, unit, chip, chipTone, sub }: {
  label: string;
  value: string;
  unit?: string;
  chip?: string;
  /** 위험만 벽돌 — 그 외 네이비 농담 (신호등 금지) */
  chipTone?: "midnight" | "danger";
  sub?: string;
}) {
  return (
    <div style={tileStyle}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(25,25,112,0.62)", letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontSize: "clamp(26px, 2.6vw, 32px)", fontWeight: 750, letterSpacing: "-0.03em", color: "#10104a", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {unit && <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(16,16,74,0.75)" }}>{unit}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 22 }}>
        {chip && (
          <span style={{
            display: "inline-flex", alignItems: "center", padding: "2.5px 9px", borderRadius: 999,
            fontSize: 11.5, fontWeight: 700,
            background: chipTone === "danger" ? "rgba(182,76,76,0.10)" : "rgba(25,25,112,0.07)",
            color: chipTone === "danger" ? DANGER : MIDNIGHT,
          }}>{chip}</span>
        )}
        {sub && <span style={{ fontSize: 11.5, color: "rgba(15,23,42,0.5)" }}>{sub}</span>}
      </div>
    </div>
  );
}

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  onOpenCalendar: () => void;
  briefingExpanded: boolean;
  onToggleBriefing: () => void;
};

export function TodaySummarySection({ d, c, ko, fmt, onOpenCalendar, briefingExpanded, onToggleBriefing }: Props) {
  // CEOMorningHero 와 동일한 brain — 요약 카드와 전체 브리핑이 같은 신호를 말하게 한다.
  const brain = useMorningBriefingBrain(d);
  const briefing: Hero = useMemo(() => resolveHero({
    ko,
    cashflowCrisis: brain.cashflowCrisis,
    topAnomaly: brain.topAnomaly,
    industryRule: brain.industryRule,
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

  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const showUserActivity = !hiddenCards.includes("user-activity");

  // ── 오늘 매출·고객 (기록 없으면 — · delta 는 비교값 있을 때만) ──
  const today = c.todayEntry;
  const entries = c.recent7Entries;
  const yesterday = entries.length >= 2 ? entries[entries.length - 2] : undefined;
  const salesDeltaPct = today && yesterday && yesterday.sales > 0
    ? Math.round(((today.sales - yesterday.sales) / yesterday.sales) * 100)
    : null;
  const custDelta = today && yesterday ? today.customers - yesterday.customers : null;
  const customerNoun = ko ? "오늘 고객 수" : "Customers today";

  const isCrisisTone = briefing.tone === "crisis";

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 750, color: "rgba(15,23,42,0.55)", letterSpacing: "0.01em", padding: "2px 2px 0" }}>
        {ko ? "오늘의 요약" : "Today at a glance"}
      </div>

      <div className="dash-summary-grid">
        {/* ① 오늘 매출 */}
        <div className="dash-area-st" style={{ display: "flex", minWidth: 0 }}>
          <div style={{ flex: 1, display: "flex" }}>
            <div style={{ flex: 1 }}>
              <StatTile
                label={ko ? "오늘 매출" : "Sales today"}
                value={today ? fmt(today.sales) : "—"}
                unit={today ? (ko ? "원" : "") : undefined}
                chip={salesDeltaPct === null ? undefined : `${salesDeltaPct >= 0 ? "+" : ""}${salesDeltaPct}% ${ko ? "어제 대비" : "vs yesterday"}`}
                chipTone={salesDeltaPct !== null && salesDeltaPct < 0 ? "danger" : "midnight"}
                sub={today ? undefined : (ko ? "오늘 기록 전" : "No entry yet")}
              />
            </div>
          </div>
        </div>

        {/* ② 오늘 고객 */}
        <div className="dash-area-ct" style={{ display: "flex", minWidth: 0 }}>
          <div style={{ flex: 1 }}>
            <StatTile
              label={customerNoun}
              value={today ? String(today.customers) : "—"}
              unit={today ? (ko ? "명" : "") : undefined}
              chip={custDelta === null ? undefined : `${custDelta >= 0 ? "+" : ""}${custDelta}${ko ? "명 어제 대비" : " vs yesterday"}`}
              chipTone={custDelta !== null && custDelta < 0 ? "danger" : "midnight"}
              sub={today ? undefined : (ko ? "오늘 기록 전" : "No entry yet")}
            />
          </div>
        </div>

        {/* ③ AI 경영 코칭 — brain 요약 + 자세히 보기(전체 브리핑 펼침) */}
        <div className="dash-area-ai" style={{
          ...tileStyle,
          gap: 8,
          background: isCrisisTone
            ? "linear-gradient(180deg, rgba(182,76,76,0.05) 0%, #ffffff 55%)"
            : "linear-gradient(135deg, #F7F8FE 0%, #ffffff 60%)",
          border: isCrisisTone ? "1px solid rgba(182,76,76,0.25)" : "1px solid rgba(25,25,112,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 7, background: "rgba(25,25,112,0.08)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Sparkles size={12.5} strokeWidth={1.8} color={MIDNIGHT} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: MIDNIGHT, letterSpacing: "0.04em" }}>
              {ko ? "AI 경영 코칭" : "AI Coaching"}
            </span>
            <span style={{
              padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
              background: isCrisisTone ? "rgba(182,76,76,0.10)" : "rgba(25,25,112,0.06)",
              color: isCrisisTone ? DANGER : "rgba(25,25,112,0.75)",
            }}>{ko ? briefing.tagKo : briefing.tagEn}</span>
          </div>
          <div style={{
            fontSize: 13.5, fontWeight: 750, color: "#10104a", lineHeight: 1.45, letterSpacing: "-0.01em",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
          }}>
            {ko ? briefing.analysisKo : briefing.analysisEn}
          </div>
          <div style={{
            fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
          }}>
            {ko ? briefing.actionKo : briefing.actionEn}
          </div>
          <button
            type="button"
            onClick={onToggleBriefing}
            style={{
              marginTop: "auto", alignSelf: "flex-end",
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 10, border: "none",
              background: MIDNIGHT, color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 2px 8px rgba(25,25,112,0.22)",
            }}
          >
            {briefingExpanded ? (ko ? "접기" : "Collapse") : (ko ? "자세히 보기" : "Details")}
            {briefingExpanded ? <ChevronUp size={13} strokeWidth={2.4} /> : <ChevronDown size={13} strokeWidth={2.4} />}
          </button>
        </div>

        {/* ④ 매출 추이 (7일) — 기존 카드 재사용 */}
        <div className="dash-area-sc" style={{ minWidth: 0 }}>
          <ActivitySnapshotCard
            d={d}
            ko={ko}
            todayStr={c.todayStr}
            recent7Entries={c.recent7Entries}
            recent7Sales={c.recent7Sales}
            weeklySalesChange={c.weeklySalesChange}
            todayEntry={c.todayEntry}
            avgDailySales={c.avgDailySales}
            fmt={fmt}
            onOpenCalendar={onOpenCalendar}
          />
        </div>

        {/* ⑤ 고객 추이 (7일) — 기존 카드 재사용 (업종 어휘 자동) */}
        {showUserActivity && (
          <div className="dash-area-cc" style={{ minWidth: 0 }}>
            <UserActivityCard
              d={d}
              ko={ko}
              todayStr={c.todayStr}
              recent7Entries={c.recent7Entries}
              todayEntry={c.todayEntry}
              fmt={fmt}
            />
          </div>
        )}
      </div>
    </div>
  );
}
