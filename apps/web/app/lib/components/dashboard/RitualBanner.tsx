"use client";

import { useEffect, useState } from "react";
import { Calendar, CalendarCheck, X } from "lucide-react";

type Props = {
  ko: boolean;
  onOpenWeekly: () => void;
  onOpenMonthly: () => void;
};

/**
 * Ritual Banner — 경영 리추얼 라우팅.
 *
 * 매주 월요일 오전: "지난주 리뷰 + 이번주 계획" 프롬프트
 * 매월 1-3일 오전: "월간 리포트 검토" 프롬프트
 *
 * 저녁 Time Log는 이미 MorningBriefing 내부에 있음.
 *
 * Dismiss: 주 단위/월 단위 localStorage 저장. 해당 기간엔 다시 안 나옴.
 */

const LS_WEEKLY_DISMISS = "buildup-ritual-weekly-dismissed";
const LS_MONTHLY_DISMISS = "buildup-ritual-monthly-dismissed";

type RitualKind = "weekly" | "monthly" | null;

export function RitualBanner({ ko, onOpenWeekly, onOpenMonthly }: Props) {
  const [ritual, setRitual] = useState<RitualKind>(null);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const dayOfMonth = now.getDate();

    // 월간 (매월 1-3일, 오전 6시~정오)
    if (dayOfMonth >= 1 && dayOfMonth <= 3 && hour >= 6 && hour < 12) {
      const dismissedMonth = typeof localStorage !== "undefined"
        ? localStorage.getItem(LS_MONTHLY_DISMISS)
        : null;
      const thisMonth = today.slice(0, 7);
      if (dismissedMonth !== thisMonth) {
        setRitual("monthly");
        return;
      }
    }

    // 주간 (월요일 오전 6시~정오)
    if (dayOfWeek === 1 && hour >= 6 && hour < 12) {
      const dismissedWeek = typeof localStorage !== "undefined"
        ? localStorage.getItem(LS_WEEKLY_DISMISS)
        : null;
      // 이번 주 월요일 날짜
      if (dismissedWeek !== today) {
        setRitual("weekly");
        return;
      }
    }

    setRitual(null);
  }, []);

  if (!ritual) return null;

  const handleDismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (ritual === "weekly") {
      localStorage.setItem(LS_WEEKLY_DISMISS, today);
    } else {
      localStorage.setItem(LS_MONTHLY_DISMISS, today.slice(0, 7));
    }
    setRitual(null);
  };

  const handleOpen = () => {
    if (ritual === "weekly") onOpenWeekly();
    else onOpenMonthly();
  };

  const config = ritual === "weekly"
    ? {
        Icon: Calendar,
        color: "#2563eb",
        bg: "rgba(37,99,235,0.04)",
        border: "rgba(37,99,235,0.12)",
        titleKo: "이번 주 계획 세우기 (15분)",
        titleEn: "Plan this week (15 min)",
        descKo: "지난주 하이라이트를 돌아보고 이번 주 한 가지 집중 목표를 정해보세요.",
        descEn: "Review last week's highlights and set this week's one focus.",
        ctaKo: "주간 리뷰 열기",
        ctaEn: "Open weekly review",
      }
    : {
        Icon: CalendarCheck,
        color: "#7c3aed",
        bg: "rgba(124,58,237,0.04)",
        border: "rgba(124,58,237,0.12)",
        titleKo: "지난달 리포트 준비됐어요 (30분)",
        titleEn: "Last month's report is ready (30 min)",
        descKo: "손익·현금흐름·마일스톤을 함께 훑어보고 다음 달 예산을 조정하세요.",
        descEn: "Review P&L, cash flow, milestones — adjust next month's budget.",
        ctaKo: "월간 리포트 열기",
        ctaEn: "Open monthly report",
      };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "14px",
        background: config.bg,
        border: `1px solid ${config.border}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "9px",
          background: `${config.color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <config.Icon size={16} strokeWidth={1.5} color={config.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 660, color: "#0f172a", letterSpacing: "-0.01em" }}>
          {ko ? config.titleKo : config.titleEn}
        </div>
        <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", marginTop: "1px", lineHeight: 1.5 }}>
          {ko ? config.descKo : config.descEn}
        </div>
      </div>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          padding: "7px 12px",
          borderRadius: "8px",
          border: "none",
          background: config.color,
          color: "#fff",
          fontSize: "12px",
          fontWeight: 650,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        {ko ? config.ctaKo : config.ctaEn}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={ko ? "닫기" : "Dismiss"}
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "7px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(15,23,42,0.4)",
          flexShrink: 0,
        }}
      >
        <X size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}
