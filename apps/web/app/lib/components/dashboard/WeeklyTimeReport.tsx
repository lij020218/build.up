"use client";

import { useMemo } from "react";
import { Users, Wrench, Megaphone, Clock } from "lucide-react";
import { useTimeLogStore, weeklyAverage, recordStreak } from "../../stores/time-log-store";
import { EmptyStateCard } from "./EmptyStateCard";

type Props = {
  ko: boolean;
};

/**
 * 주간 Time Log 리포트.
 *
 * 7일 이상 기록 쌓이면 시간 사용 패턴 표시.
 * - 카테고리별 평균 비율 (막대 + 숫자)
 * - 연속 기록 일수
 * - 통찰 한 줄 (가장 많이 쓴 영역 + 간단한 질문)
 *
 * 7일 미만: EmptyStateCard로 기대감 유도.
 */
export function WeeklyTimeReport({ ko }: Props) {
  const entries = useTimeLogStore((s) => s.entries);

  const avg = useMemo(() => weeklyAverage(entries), [entries]);
  const streak = useMemo(() => recordStreak(entries), [entries]);

  if (!avg || avg.days < 3) {
    return (
      <EmptyStateCard
        ko={ko}
        eyebrow={ko ? "시간 패턴" : "Time Pattern"}
        title={ko ? "3일 이상 체크인하면 패턴이 열려요" : "Pattern unlocks after 3 check-ins"}
        description={ko
          ? "매일 저녁 30초. 고객 응대·운영·마케팅 어디에 시간을 썼는지 기록하면 주간 패턴을 보여드려요."
          : "30 seconds each evening. Log where your time went — weekly patterns appear after 3 days."}
        Icon={Clock}
        progress={{
          current: avg?.days ?? 0,
          target: 3,
          unitKo: "일",
          unitEn: "days",
        }}
      />
    );
  }

  const categories = [
    { key: "customer", Icon: Users, color: "#191970", labelKo: "고객 응대", labelEn: "Customer", pct: avg.customerAvg },
    { key: "operations", Icon: Wrench, color: "#191970", labelKo: "운영·관리", labelEn: "Operations", pct: avg.operationsAvg },
    { key: "marketing", Icon: Megaphone, color: "#7c3aed", labelKo: "마케팅·성장", labelEn: "Marketing", pct: avg.marketingAvg },
    { key: "other", Icon: Clock, color: "#64748b", labelKo: "기타", labelEn: "Other", pct: avg.otherAvg },
  ];
  const sorted = [...categories].sort((a, b) => b.pct - a.pct);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  // 통찰 메시지
  const insight = (() => {
    if (top.pct >= 50) {
      return ko
        ? `${top.labelKo} 비중이 ${top.pct}%로 과반입니다. 다른 영역 시간이 부족하지 않은지 점검해보세요.`
        : `${top.labelEn} takes over ${top.pct}% — check if other areas are underserved.`;
    }
    if (avg.marketingAvg < 10) {
      return ko
        ? "마케팅·성장에 쓰는 시간이 10% 미만입니다. 당장 고객이 있더라도 다음 달 고객을 만들 여유가 필요해요."
        : "Less than 10% on marketing. Even with today's customers, you need time for next month's.";
    }
    if (avg.operationsAvg < 15) {
      return ko
        ? "운영·관리 시간이 적네요. 월말 회계나 재고 정리가 밀리고 있지 않은지 확인하세요."
        : "Operations time is low — check if month-end accounting or inventory are backing up.";
    }
    return ko
      ? `${top.labelKo} 시간이 가장 많네요. 이 비율이 지금 단계에 적절한가요?`
      : `Most time on ${top.labelEn.toLowerCase()}. Is this ratio right for your stage?`;
  })();

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
              color: "rgba(15,23,42,0.4)",
              marginBottom: "2px",
            }}
          >
            {ko ? "주간 시간 패턴" : "Weekly Time Pattern"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {ko ? `최근 ${avg.days}일 평균` : `Avg over ${avg.days} days`}
          </div>
        </div>
        {streak >= 3 && (
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
            {streak}{ko ? "일 연속" : "d streak"}
          </div>
        )}
      </div>

      {/* 카테고리 막대 */}
      <div style={{ display: "grid", gap: "10px" }}>
        {categories.map((cat) => (
          <div key={cat.key}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <cat.Icon size={12} strokeWidth={1.5} color={cat.color} />
                <span style={{ fontSize: "11.5px", fontWeight: 620, color: "rgba(15,23,42,0.7)" }}>
                  {ko ? cat.labelKo : cat.labelEn}
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: cat.color, fontVariantNumeric: "tabular-nums" }}>
                {cat.pct}%
              </span>
            </div>
            <div
              style={{
                height: "5px",
                background: "rgba(25,25,112,0.04)",
                borderRadius: "3px",
                overflow: "hidden" as const,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${cat.pct}%`,
                  background: cat.color,
                  borderRadius: "3px",
                  transition: "width 0.4s ease",
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 통찰 메시지 */}
      <div
        style={{
          marginTop: "14px",
          padding: "10px 12px",
          borderRadius: "10px",
          background: "rgba(25,25,112,0.025)",
          fontSize: "12px",
          lineHeight: 1.55,
          color: "rgba(15,23,42,0.7)",
        }}
      >
        {insight}
      </div>
    </section>
  );
}
