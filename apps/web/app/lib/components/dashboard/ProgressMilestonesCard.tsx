"use client";

import { useMemo } from "react";
import { Target, TrendingUp, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DailyEntry } from "../../stores/finance-store";
import { getKstDate } from "../../utils/business-day";

type Props = {
  ko: boolean;
  dailyEntries: DailyEntry[];
  healthScore: number;
  bepProgress: number;
  completedStages: number;
};

type Milestone = {
  id: string;
  titleKo: string;
  titleEn: string;
  captionKo: string;
  captionEn: string;
  current: number;
  target: number;
  Icon: LucideIcon;
  color: string;
};

/**
 * Progress Milestones — Hook Model의 "Self Reward" (마스터리·달성감).
 *
 * 상시 표시되는 핵심 목표 4개의 진행도 시각화.
 * 달성한 것 ✓ + 다음 목표 진행도 바.
 *
 * MilestoneToast(이벤트 기반)와 차이:
 * - MilestoneToast = 달성 순간 축하 팝업
 * - ProgressMilestones = 상시 "어디까지 왔는지" 지도
 *
 * 스트레스 최소화:
 * - 최대 4개 목표만 (피로 방지)
 * - 완료된 것 먼저 (성취감) + 다음 목표
 * - 메시지 긍정 프레이밍
 */
export function ProgressMilestonesCard({
  ko,
  dailyEntries,
  healthScore,
  bepProgress,
  completedStages,
}: Props) {
  // 연속 기록 일수 (streak)
  const streak = useMemo(() => {
    if (dailyEntries.length === 0) return 0;
    const dates = new Set(dailyEntries.map((e) => e.date));
    const cursor = new Date();
    let count = 0;
    // 오늘 안 기록했으면 어제부터
    if (!dates.has(getKstDate(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    for (;;) {
      const dateStr = getKstDate(cursor);
      if (dates.has(dateStr)) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
      if (count > 365) break;
    }
    return count;
  }, [dailyEntries]);

  const totalEntries = dailyEntries.length;

  // 핵심 마일스톤 정의 — 게이미피케이션 streak 2개(7일/30일) 제거.
  // 의미 있는 비즈니스 지표(BEP·건강도) 만 유지. 사용자 피드백: "사장님은 게임하러 온 게 아냐."
  const milestones: Milestone[] = [
    {
      id: "bep-reached",
      titleKo: "손익분기 달성",
      titleEn: "Break-even",
      captionKo: "이번 달 매출 = 비용",
      captionEn: "Month revenue = costs",
      current: Math.min(bepProgress, 100),
      target: 100,
      Icon: TrendingUp,
      color: "#1d3557",
    },
    {
      id: "health-80",
      titleKo: "건강한 가게 (80점)",
      titleEn: "Healthy business (80)",
      captionKo: "경영 건강도 상위",
      captionEn: "Top tier health",
      current: Math.min(healthScore, 80),
      target: 80,
      Icon: ShieldCheck,
      color: "#1d3557",
    },
  ];

  // 로드맵 단계가 있으면 대체 or 5번째
  if (completedStages > 0 && completedStages < 15) {
    milestones.push({
      id: "roadmap",
      titleKo: "로드맵 진행",
      titleEn: "Roadmap progress",
      captionKo: `${completedStages}/15 단계 완료`,
      captionEn: `${completedStages}/15 stages`,
      current: completedStages,
      target: 15,
      Icon: Target,
      color: "#191970",
    });
  }

  // 완료 먼저, 미완료는 진행도 순
  const sorted = [...milestones].sort((a, b) => {
    const aDone = a.current >= a.target ? 1 : 0;
    const bDone = b.current >= b.target ? 1 : 0;
    if (aDone !== bDone) return bDone - aDone;
    return (b.current / b.target) - (a.current / a.target);
  });

  const visible = sorted.slice(0, 4);
  const completedCount = milestones.filter((m) => m.current >= m.target).length;

  return (
    <section
      style={{
        borderRadius: "20px",
        padding: "20px 22px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,253,0.9) 100%)",
        border: "1px solid rgba(15,23,42,0.05)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset",
      }}
      className="bento-card"
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 650,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--muted)",
              marginBottom: "2px",
            }}
          >
            {ko ? "성장 목표" : "Progress"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {ko ? "어디까지 왔나요?" : "How far you've come"}
          </div>
        </div>
        {completedCount > 0 && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(25,25,112,0.08)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#1d3557",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <CheckCircle2 size={11} strokeWidth={1.8} />
            {completedCount}{ko ? "개 달성" : " done"}
          </div>
        )}
      </div>

      {/* 마일스톤 리스트 */}
      <div style={{ display: "grid", gap: "10px" }}>
        {visible.map((m) => {
          const isDone = m.current >= m.target;
          const pct = Math.round((m.current / m.target) * 100);
          return (
            <div
              key={m.id}
              style={{
                padding: "10px 12px",
                borderRadius: "11px",
                background: isDone ? `${m.color}08` : "rgba(25,25,112,0.025)",
                border: `1px solid ${isDone ? `${m.color}1f` : "rgba(25,25,112,0.04)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    background: isDone ? `${m.color}18` : "rgba(25,25,112,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={14} strokeWidth={1.8} color={m.color} />
                  ) : (
                    <m.Icon size={14} strokeWidth={1.5} color="rgba(15,23,42,0.5)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 660,
                      color: isDone ? m.color : "#0f172a",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {ko ? m.titleKo : m.titleEn}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      marginTop: "1px",
                    }}
                  >
                    {ko ? m.captionKo : m.captionEn}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDone ? m.color : "rgba(15,23,42,0.5)",
                    fontVariantNumeric: "tabular-nums" as const,
                  }}
                >
                  {isDone ? "✓" : `${pct}%`}
                </div>
              </div>
              {!isDone && (
                <div
                  style={{
                    height: "4px",
                    background: "rgba(25,25,112,0.05)",
                    borderRadius: "2px",
                    overflow: "hidden" as const,
                    marginLeft: "36px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: m.color,
                      borderRadius: "2px",
                      opacity: 0.7,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 메시지 */}
      <div
        style={{
          marginTop: "12px",
          fontSize: "11px",
          color: "var(--muted)",
          lineHeight: 1.5,
          textAlign: "center" as const,
          fontWeight: 500,
        }}
      >
        {completedCount === 0
          ? (ko
              ? "첫 매출을 기록하면 이 지도가 채워집니다."
              : "Log your first sale to start filling this map.")
          : completedCount < 3
            ? (ko
                ? "한 걸음씩 꾸준히. 다음 목표도 곧 달성하실 거예요."
                : "Step by step. You'll reach the next one soon.")
            : (ko
                ? "정말 잘 가고 있어요. 이 페이스를 유지하세요."
                : "You're doing great. Keep this pace.")}
      </div>

      {/* 총 기록 일수 */}
      {totalEntries > 0 && (
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid rgba(15,23,42,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--muted)",
          }}
        >
          <span>{ko ? "총 기록 일수" : "Total logged"}</span>
          <span style={{ fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" as const }}>
            {totalEntries}{ko ? "일" : " days"}
          </span>
        </div>
      )}
    </section>
  );
}
