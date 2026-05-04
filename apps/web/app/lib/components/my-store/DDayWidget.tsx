"use client";

/**
 * D-Day 통합 위젯 — 모든 섹션의 만료/갱신을 한 곳에 통합.
 * 사장이 매일 안 보지만 한 달에 1~2번 들어와 "D-30 이내 무엇이 다가오나" 확인.
 *
 * 산수만 (LLM 0).
 */

import { useState, useMemo } from "react";
import { Bell, ChevronRight, ChevronDown } from "lucide-react";
import { PALETTE, ddayPill } from "./styles";

export type DDayItem = {
  /** 섹션 (anchor 점프) */
  sectionId: string;
  sectionLabel: string;
  itemTitle: string;
  /** 만료/갱신/종료 일자 */
  date: string;
  /** 종류 라벨 (예: 인허가/보험/임대차/SaaS/IP) */
  kindLabel: string;
};

type Props = {
  items: DDayItem[];
  ko: boolean;
};

function daysUntil(s: string): number {
  const target = new Date(`${s}T00:00:00`);
  if (isNaN(target.getTime())) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function DDayWidget({ items, ko }: Props) {
  const [open, setOpen] = useState(false);

  const sorted = useMemo(() => {
    return [...items]
      .map((i) => ({ ...i, days: daysUntil(i.date) }))
      .filter((i) => isFinite(i.days))
      .sort((a, b) => a.days - b.days);
  }, [items]);

  const within30 = sorted.filter((i) => i.days <= 30 && i.days >= -7);
  const overdue = sorted.filter((i) => i.days < -7);
  const totalUrgent = within30.length + overdue.length;

  if (totalUrgent === 0 && sorted.length === 0) return null;

  return (
    <div style={{
      position: "sticky" as const,
      top: 16,
      zIndex: 30,
      alignSelf: "flex-end",
      marginBottom: 16,
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 999,
          border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
          background: totalUrgent > 0 ? "rgba(255,159,10,0.10)" : "white",
          color: totalUrgent > 0 ? PALETTE.WARN : PALETTE.MIDNIGHT_DEEP,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(25,25,112,0.08)",
          fontFamily: "inherit",
        }}
      >
        <Bell size={13} strokeWidth={1.5} />
        {totalUrgent > 0
          ? (ko ? `30일 이내 ${totalUrgent}건` : `${totalUrgent} due ≤30d`)
          : (ko ? `다음 만료 ${sorted.length}건` : `${sorted.length} upcoming`)}
        {open ? <ChevronDown size={12} strokeWidth={1.5} /> : <ChevronRight size={12} strokeWidth={1.5} />}
      </button>

      {open && (
        <div style={{
          marginTop: 8,
          background: "white",
          border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
          borderRadius: 14,
          boxShadow: "0 12px 32px rgba(25,25,112,0.12)",
          padding: 12,
          width: 360,
          maxHeight: 480,
          overflowY: "auto" as const,
          display: "flex",
          flexDirection: "column" as const,
          gap: 6,
        }}>
          {sorted.length === 0 && (
            <div style={{ padding: "20px 16px", textAlign: "center" as const, fontSize: 12.5, color: PALETTE.MUTED }}>
              {ko ? "추적 중인 만료 항목이 없습니다" : "No expirations to track"}
            </div>
          )}
          {sorted.map((i, idx) => (
            <a
              key={idx}
              href={`#${i.sectionId}`}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center" as const,
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: i.days <= 7 ? "rgba(255,59,48,0.04)" : i.days <= 30 ? "rgba(255,159,10,0.04)" : "transparent",
                textDecoration: "none",
                color: PALETTE.INK,
                transition: "background 0.15s ease",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: PALETTE.MIDNIGHT, opacity: 0.7, letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 2 }}>
                  {i.kindLabel} · {i.sectionLabel}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: PALETTE.MIDNIGHT_DEEP, letterSpacing: "-0.01em", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {i.itemTitle}
                </div>
                <div style={{ fontSize: 11, color: PALETTE.HINT, fontWeight: 500, fontVariantNumeric: "tabular-nums" as const, marginTop: 1 }}>
                  {i.date}
                </div>
              </div>
              <span style={ddayPill(i.days)}>
                {i.days < 0 ? `D+${-i.days}` : i.days === 0 ? (ko ? "오늘" : "Today") : `D-${i.days}`}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
