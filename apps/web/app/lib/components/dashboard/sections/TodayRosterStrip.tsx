"use client";

/**
 * TodayRosterStrip — 홈 "오늘 출근" 가로 카드 줄 (2026-09-14).
 *
 * iOS 미러: apps/ios/Sources/FoundOneFeatures/Today/TodayRosterStrip.swift
 * 판정 SSOT: packages/shared/src/team/today-roster.ts (iOS BUTodayRoster)
 *
 * 왜 가로 카드인가 (사장님 요청):
 *  종전 홈 직원 구획은 "함께 일하는 사람 3명" 한 줄이었다. 숫자는 오늘 무엇을 할지
 *  알려주지 않는다. 아침에 알고 싶은 건 **누가 몇 시에 오는가**와 **왔는가** 둘뿐이다.
 *  사람당 카드 하나, 이른 시간부터 왼쪽에.
 *
 * 상태는 색이 아니라 아이콘 + 글자로 구분한다(색맹·흑백 출력에서도 읽히게).
 */

import { CheckCircle2, Check, Clock3, CalendarDays } from "lucide-react";
import { shortTime, type TodayRosterEntry } from "@foundone/shared";

const CARD_W = 156;

function hhmm(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 근무 시간 — 배정이 없으면 실제 출근 시각(대타). 둘 다 없으면 지어내지 않는다. */
function timeLine(e: TodayRosterEntry, ko: boolean): string {
  if (e.startTime && e.endTime) return `${shortTime(e.startTime)} – ${shortTime(e.endTime)}`;
  if (e.clockInAt) {
    const t = hhmm(e.clockInAt);
    if (t) return ko ? `${t} 출근` : `In ${t}`;
  }
  return ko ? "근무 시간 미정" : "No shift set";
}

function statusMeta(status: TodayRosterEntry["status"], ko: boolean) {
  switch (status) {
    case "working":   return { label: ko ? "출근 완료" : "Clocked in", Icon: CheckCircle2, strong: true };
    case "done":      return { label: ko ? "퇴근" : "Clocked out", Icon: Check, strong: false };
    case "scheduled": return { label: ko ? "출근 전" : "Not yet", Icon: Clock3, strong: false };
    case "leave":     return { label: ko ? "연차" : "On leave", Icon: CalendarDays, strong: false };
    default:          return { label: ko ? "휴무" : "Off", Icon: CalendarDays, strong: false };
  }
}

export function TodayRosterStrip({
  entries,
  ko,
  onSelect,
}: {
  entries: TodayRosterEntry[];
  ko: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        // 카드 그림자가 잘리지 않도록 세로 여유를 준다.
        padding: "4px 2px 10px",
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {entries.map((e) => {
        const { label, Icon, strong } = statusMeta(e.status, ko);
        return (
          <button
            key={e.memberUserId}
            type="button"
            onClick={onSelect}
            style={{
              flex: `0 0 ${CARD_W}px`,
              scrollSnapAlign: "start",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              padding: "13px 14px",
              background: "var(--surface)",
              border: "0.5px solid rgba(17,19,26,0.07)",
              borderRadius: "var(--card-radius)",
              boxShadow: "0 3px 10px rgba(17,19,26,0.05)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 650, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {e.name}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {timeLine(e, ko)}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: strong ? "var(--primary)" : "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={13} strokeWidth={2.4} />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
