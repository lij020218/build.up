"use client";

import { useEffect, useState } from "react";
import { Calendar, CalendarCheck, X } from "lucide-react";
import { getKstDate } from "../../utils/business-day";

type Props = {
  ko: boolean;
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

const LS_WEEKLY_DISMISS = "foundone-ritual-weekly-dismissed";
const LS_MONTHLY_DISMISS = "foundone-ritual-monthly-dismissed";

type RitualKind = "weekly" | "monthly" | null;

export function RitualBanner({ ko }: Props) {
  const [ritual, setRitual] = useState<RitualKind>(null);

  useEffect(() => {
    const now = new Date();
    const today = getKstDate(now);
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
    const today = getKstDate(new Date());
    if (ritual === "weekly") {
      localStorage.setItem(LS_WEEKLY_DISMISS, today);
    } else {
      localStorage.setItem(LS_MONTHLY_DISMISS, today.slice(0, 7));
    }
    setRitual(null);
  };

  const config = ritual === "weekly"
    ? {
        Icon: Calendar,
        color: "#191970",
        bg: "rgba(25,25,112,0.04)",
        border: "rgba(25,25,112,0.12)",
        titleKo: "이번 주 목표를 세워보세요",
        titleEn: "Set your goal for this week",
        descKo: "지난주 하이라이트를 돌아보고 이번 주 한 가지 집중 목표를 정해보세요.",
        descEn: "Review last week's highlights and set this week's one focus.",
      }
    : {
        Icon: CalendarCheck,
        color: "#7c3aed",
        bg: "rgba(124,58,237,0.04)",
        border: "rgba(124,58,237,0.12)",
        titleKo: "지난달 리포트를 확인해보세요",
        titleEn: "Review last month's report",
        descKo: "손익·현금흐름·마일스톤을 함께 훑어보고 다음 달 예산을 조정하세요.",
        descEn: "Review P&L, cash flow, milestones — adjust next month's budget.",
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
