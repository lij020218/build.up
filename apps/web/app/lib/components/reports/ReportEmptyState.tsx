"use client";

/**
 * ReportEmptyState — 보고서 데이터 부족 / 영업 중 안내 카드.
 *
 * 두 변형:
 *  - kind="insufficient": 매출 entries 부족 → 입력 CTA + 진행률
 *  - kind="business-open": 일일 보고서가 영업 종료 후에만 활성화 → 활성화 시각 표시
 */

import { CalendarClock, BarChart3 } from "lucide-react";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";

type Props =
  | {
      ko: boolean;
      kind: "insufficient";
      period: "day" | "week" | "month" | "quarter";
      entriesCount: number;
      requiredCount?: number;
    }
  | {
      ko: boolean;
      kind: "business-open";
      activeAt: string; // "21:00" 등
    };

export function ReportEmptyState(props: Props) {
  const ko = props.ko;

  if (props.kind === "business-open") {
    return (
      <div style={cardStyle}>
        <div style={iconWrap}>
          <CalendarClock size={20} strokeWidth={1.5} style={{ color: MIDNIGHT }} />
        </div>
        <div style={titleStyle}>
          {ko ? "오늘 영업이 아직 끝나지 않았어요" : "Today's business hours haven't ended"}
        </div>
        <div style={subtitleStyle}>
          {ko
            ? `${props.activeAt} 이후 일일 보고서가 준비됩니다. 그때까지 매출은 계속 누적되고 있어요.`
            : `Daily report becomes available after ${props.activeAt}. Sales keep accumulating until then.`}
        </div>
        <div style={chipStyle}>
          <span style={{ fontWeight: 700, color: MIDNIGHT }}>{props.activeAt} {ko ? "활성화" : "active"}</span>
        </div>
      </div>
    );
  }

  // insufficient
  const required = props.requiredCount ?? (props.period === "week" ? 7 : props.period === "day" ? 1 : 1);
  const have = props.entriesCount;
  const pct = Math.min(100, Math.round((have / required) * 100));
  const periodLabel = props.period === "day" ? (ko ? "일일" : "Daily")
    : props.period === "week" ? (ko ? "주간" : "Weekly")
    : props.period === "month" ? (ko ? "월간" : "Monthly")
    : (ko ? "분기" : "Quarterly");

  const dispatchSalesEntry = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("bup:navigate-feature", {
      detail: { surface: "operations" as never },
    }));
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>("[data-sales-input]");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const prevShadow = el.style.boxShadow;
      el.style.transition = "box-shadow 0.4s cubic-bezier(0.22,1,0.36,1)";
      el.style.boxShadow = "0 0 0 4px rgba(45,212,191,0.45), 0 12px 32px rgba(45,212,191,0.2)";
      window.setTimeout(() => { el.style.boxShadow = prevShadow; }, 1400);
    }, 360);
  };

  return (
    <div style={cardStyle}>
      <div style={iconWrap}>
        <BarChart3 size={20} strokeWidth={1.5} style={{ color: MIDNIGHT }} />
      </div>
      <div style={titleStyle}>
        {ko ? `${periodLabel} 보고서를 만들기엔 데이터가 조금 부족해요` : `Need a bit more data for ${periodLabel.toLowerCase()} report`}
      </div>
      <div style={subtitleStyle}>
        {ko
          ? props.period === "day"
            ? "오늘 매출을 한 번 입력하면 첫 일일 보고서가 만들어집니다."
            : `${have}/${required}일 데이터 모임. ${required - have}일 더 입력하면 ${periodLabel} 보고서가 채워집니다.`
          : props.period === "day"
            ? "Log today's sales once to generate your first daily report."
            : `${have}/${required} days collected. ${required - have} more days to complete ${periodLabel.toLowerCase()} report.`}
      </div>

      {props.period !== "day" && required > 1 && (
        <div style={progressTrack}>
          <div style={{ ...progressFill, width: `${pct}%` }} />
        </div>
      )}

      <button type="button" onClick={dispatchSalesEntry} style={ctaStyle}>
        {ko ? "지금 매출 입력하기 →" : "Log sales now →"}
      </button>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 18,
  padding: "32px 28px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 12,
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
};

const iconWrap: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: MIDNIGHT_SOFT,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 4,
};

const titleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
  lineHeight: 1.4,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "rgba(15,23,42,0.6)",
  lineHeight: 1.6,
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "6px 12px",
  borderRadius: 999,
  background: MIDNIGHT_SOFT,
  fontSize: 12,
  marginTop: 6,
};

const progressTrack: React.CSSProperties = {
  width: "100%",
  height: 6,
  background: "rgba(15,23,42,0.06)",
  borderRadius: 999,
  overflow: "hidden",
  marginTop: 4,
};

const progressFill: React.CSSProperties = {
  height: "100%",
  background: MIDNIGHT,
  borderRadius: 999,
  transition: "width 0.4s ease",
};

const ctaStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: MIDNIGHT,
  color: "white",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};
