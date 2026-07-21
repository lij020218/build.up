"use client";

/**
 * 오늘의 요약 — 사장님 지시 v2 (2026-07-21).
 *
 *   [AI 경영 코칭 ─────────────────── 전체 폭]
 *   [매출 흐름 (7일, 넓게)] [고객 변화]   ← 같은 높이, 남는 공간 없음
 *
 * 원칙:
 *  · 차트 2개는 기존 ActivitySnapshotCard·UserActivityCard 재사용(데일리 허브에서 이동).
 *  · AI 코칭 카드는 CEOMorningHero 의 brain(resolveHero)을 그대로 요약 표시 —
 *    [자세히 보기]가 전체 브리핑(CEOMorningHero)을 아래에 펼친다 (정보 유실 0).
 *  · 높이 통일은 .dash-area-sc/.dash-area-cc 의 flex+100% 스트레치(operationalStyles).
 */

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { ActivitySnapshotCard } from "../ActivitySnapshotCard";
import { UserActivityCard } from "../UserActivityCard";
import { CEOMorningHero } from "../CEOMorningHero";
import { useMorningBriefingBrain } from "../../../hooks/useMorningBriefingBrain";
import { resolveHero, type Hero } from "../heroInsight";
import { useProfileStore } from "../../../stores/profile-store";

const MIDNIGHT = "#191970";
const DANGER = "#b64c4c";

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

  const isCrisisTone = briefing.tone === "crisis";

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 750, color: "rgba(15,23,42,0.55)", letterSpacing: "0.01em", padding: "2px 2px 0" }}>
        {ko ? "오늘의 요약" : "Today at a glance"}
      </div>

      {/* ① AI 경영 코칭 — 첫 줄 전체 폭. brain 요약 + [자세히 보기](아래에 전체 브리핑 펼침) */}
      <div style={{
          background: isCrisisTone
            ? "linear-gradient(180deg, rgba(182,76,76,0.05) 0%, #ffffff 60%)"
            : "linear-gradient(135deg, #F7F8FE 0%, #ffffff 55%)",
          border: isCrisisTone ? "1px solid rgba(182,76,76,0.25)" : "1px solid rgba(25,25,112,0.12)",
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap" as const,
          minWidth: 0,
        }}>
          <div style={{ flex: "1 1 420px", minWidth: 0, display: "grid", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" as const }}>
              <span style={{
                width: 24, height: 24, borderRadius: 8, background: "rgba(25,25,112,0.08)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Sparkles size={13.5} strokeWidth={1.8} color={MIDNIGHT} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: MIDNIGHT, letterSpacing: "0.04em" }}>
                {ko ? "AI 경영 코칭" : "AI Coaching"}
              </span>
              <span style={{
                padding: "2px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                background: isCrisisTone ? "rgba(182,76,76,0.10)" : "rgba(25,25,112,0.06)",
                color: isCrisisTone ? DANGER : "rgba(25,25,112,0.75)",
              }}>{ko ? briefing.tagKo : briefing.tagEn}</span>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 750, color: "#10104a", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
              {ko ? briefing.analysisKo : briefing.analysisEn}
            </div>
            <div style={{
              fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.55,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
            }}>
              {ko ? briefing.actionKo : briefing.actionEn}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleBriefing}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
              padding: "9px 16px", borderRadius: 11, border: "none",
              background: MIDNIGHT, color: "#fff", fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 2px 8px rgba(25,25,112,0.22)",
            }}
          >
            {briefingExpanded ? (ko ? "접기" : "Collapse") : (ko ? "자세히 보기" : "Details")}
            {briefingExpanded ? <ChevronUp size={13} strokeWidth={2.4} /> : <ChevronDown size={13} strokeWidth={2.4} />}
          </button>
        </div>

      {/* ①-b [자세히 보기] 펼침 — 기존 AI 경영 브리핑(CEOMorningHero) 그대로, 카드 바로 아래 */}
      {briefingExpanded && <CEOMorningHero d={d} />}

      {/* ②·③ 차트 2장 — 같은 높이 스트레치 */}
      <div className="dash-charts-grid">
        {/* ② 매출 흐름 (7일) — 기존 카드 재사용, 고객 변화와 같은 높이로 스트레치 */}
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

        {/* ③ 고객 변화 (7일) — 기존 카드 재사용 (업종 어휘 자동) */}
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
