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
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { ActivitySnapshotCard } from "../ActivitySnapshotCard";
import { UserActivityCard } from "../UserActivityCard";
import { CEOMorningHero } from "../CEOMorningHero";
import { useMorningBriefingBrain } from "../../../hooks/useMorningBriefingBrain";
import { resolveHero, type Hero } from "../heroInsight";
import { dispatchHeroCta } from "../heroCta";
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
  // 데이터가 없을 땐(drucker 폴백) AI 흉내를 내지 않고 "매출 기록" 버튼만 둔다.
  const isEmptyState = briefing.source === "drucker";
  // AI 액션은 actionKo 가 제목(≤10자)·analysisKo 가 이유. 이상 신호·위기 히어로는 반대.
  const isAiAction = briefing.source === "ai-action";
  const titleText = ko
    ? (isAiAction ? briefing.actionKo : briefing.analysisKo)
    : (isAiAction ? briefing.actionEn : briefing.analysisEn);
  const reasonText = ko
    ? (isAiAction ? briefing.analysisKo : briefing.actionKo)
    : (isAiAction ? briefing.analysisEn : briefing.actionEn);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 750, color: "rgba(15,23,42,0.55)", letterSpacing: "0.01em", padding: "2px 2px 0" }}>
        {ko ? "오늘의 요약" : "Today at a glance"}
      </div>

      {/* ① 오늘 할 일 — B안 (2026-09-12 사장님 승인).
          종전: 스파클 아이콘 + "AI 경영 코칭" + 태그 칩 + 진단 문단 + 행동 2줄 + [자세히 보기] 버튼.
          운영 DB 실측(7/1~9/11): 코칭 116회 생성, 피드백 0건, 실행 표시 0건 — 문단에 반응한 사람이 없다.
          로그인 화면의 약속("오늘 할 일 하나")대로: 제목 + 이유 2줄 + 버튼 하나. 진단 전문은 [자세히]로. */}
      <div style={{
          background: "var(--surface)",
          border: isCrisisTone ? "1px solid rgba(182,76,76,0.35)" : "0.5px solid rgba(17,19,26,0.07)",
          borderRadius: "var(--card-radius)",
          boxShadow: "0 3px 10px rgba(17,19,26,0.05)",
          padding: "18px 20px",
          display: "grid",
          gap: 10,
          minWidth: 0,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
              {ko ? "오늘 할 일" : "Today's one thing"}
            </span>
            <button
              type="button"
              onClick={onToggleBriefing}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--primary)" }}
            >
              {briefingExpanded ? (ko ? "접기" : "Collapse") : (ko ? "자세히" : "Details")}
            </button>
          </div>

          {isEmptyState ? (
            <div style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.5 }}>
              {ko ? "매출 한 건만 기록하면 내일부터 오늘 할 일을 골라 드립니다." : "Log one sale and we will pick your one thing from tomorrow."}
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1.35, letterSpacing: "-0.01em",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
              }}>
                {titleText}
              </div>
              <div style={{
                fontSize: 15, color: "var(--muted)", lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
              }}>
                {reasonText}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => dispatchHeroCta(briefing)}
            style={{
              width: "100%", minHeight: 48, borderRadius: 10, border: "none",
              background: isCrisisTone ? DANGER : MIDNIGHT, color: "#fff", fontSize: 16, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {ko ? briefing.ctaKo : briefing.ctaEn}
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
