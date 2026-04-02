"use client";

import { useState } from "react";

type DailyEntry = { date: string; sales: number; customers: number };

type Props = {
  dailyEntries: DailyEntry[];
  ko: boolean;
  fmt: (n: number) => string;
  onDateClick?: (date: string) => void;
};

export function RevenueCalendar({ dailyEntries, ko, fmt, onDateClick }: Props) {
  const [offset, setOffset] = useState(0); // 0 = current month, -1 = prev, etc.
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthLabel = viewDate.toLocaleDateString(ko ? "ko-KR" : "en-US", { year: "numeric", month: "long" });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = now.toISOString().slice(0, 10);

  const entryMap: Record<string, DailyEntry> = {};
  for (const e of dailyEntries) {
    if (e.date.startsWith(monthKey)) entryMap[e.date] = e;
  }

  const salesValues = Object.values(entryMap).map((e) => e.sales).filter((v) => v > 0);
  const sorted = [...salesValues].sort((a, b) => a - b);
  const q25 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;

  const monthTotal = salesValues.reduce((s, v) => s + v, 0);
  const loggedDays = salesValues.length;

  const getCellColor = (sales: number) => {
    if (sales <= 0) return "transparent";
    if (sales >= q75 && q75 > 0) return "rgba(37,99,235,0.18)";
    if (sales <= q25 && q25 > 0) return "rgba(239,68,68,0.12)";
    return "rgba(15,23,42,0.06)";
  };

  const weekdays = ko
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  const cells: Array<{ day: number | null; dateStr: string }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, dateStr: "" });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: `${monthKey}-${String(d).padStart(2, "0")}` });
  }

  const [popover, setPopover] = useState<string | null>(null);

  return (
    <section style={card}>
      {/* header */}
      <div style={header}>
        <div>
          <div style={eyebrow}>{ko ? "매출 캘린더" : "Revenue Calendar"}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
            <span style={titleStyle}>{monthLabel}</span>
            {loggedDays > 0 && (
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(15,23,42,0.5)" }}>
                {fmt(monthTotal)} · {loggedDays}{ko ? "일 기록" : "d logged"}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button type="button" onClick={() => setOffset((o) => o - 1)} style={navBtn}>←</button>
          {offset !== 0 && (
            <button type="button" onClick={() => setOffset(0)} style={navBtn}>
              {ko ? "이번달" : "Today"}
            </button>
          )}
          <button type="button" onClick={() => setOffset((o) => Math.min(o + 1, 0))} disabled={offset >= 0} style={{ ...navBtn, opacity: offset >= 0 ? 0.3 : 1 }}>→</button>
        </div>
      </div>

      {/* legend */}
      <div style={legend}>
        <span style={legendItem}><span style={{ ...legendDot, background: "rgba(37,99,235,0.18)" }} />{ko ? "상위 25%" : "Top 25%"}</span>
        <span style={legendItem}><span style={{ ...legendDot, background: "rgba(15,23,42,0.06)" }} />{ko ? "중간" : "Mid"}</span>
        <span style={legendItem}><span style={{ ...legendDot, background: "rgba(239,68,68,0.12)" }} />{ko ? "하위 25%" : "Bottom 25%"}</span>
        <span style={legendItem}><span style={{ ...legendDot, background: "transparent", border: "1px dashed rgba(15,23,42,0.15)" }} />{ko ? "미입력" : "No data"}</span>
      </div>

      {/* weekday headers */}
      <div style={grid}>
        {weekdays.map((w, i) => (
          <div key={`h-${i}`} style={weekdayHeader}>{w}</div>
        ))}

        {/* day cells */}
        {cells.map((cell, i) => {
          if (!cell.day) return <div key={`e-${i}`} />;
          const entry = entryMap[cell.dateStr];
          const sales = entry?.sales ?? 0;
          const isToday = cell.dateStr === todayStr;
          const isFuture = cell.dateStr > todayStr;
          const isEmpty = !entry && !isFuture;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => {
                if (onDateClick) onDateClick(cell.dateStr);
                setPopover(popover === cell.dateStr ? null : cell.dateStr);
              }}
              style={{
                ...dayCell,
                background: isFuture ? "transparent" : getCellColor(sales),
                border: isToday ? "2px solid rgba(15,23,42,0.72)" : isEmpty ? "1px dashed rgba(15,23,42,0.10)" : "1px solid transparent",
                opacity: isFuture ? 0.3 : 1,
                position: "relative",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: isToday ? 700 : 500, color: isToday ? "#0f172a" : "rgba(15,23,42,0.6)" }}>
                {cell.day}
              </div>
              {sales > 0 && (
                <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.72)", marginTop: "1px", fontVariantNumeric: "tabular-nums" }}>
                  {sales >= 10000 ? `${Math.round(sales / 10000)}만` : `${Math.round(sales / 1000)}천`}
                </div>
              )}
              {isEmpty && !isFuture && (
                <div style={{ fontSize: "9px", color: "rgba(15,23,42,0.28)", marginTop: "1px" }}>—</div>
              )}

              {/* popover */}
              {popover === cell.dateStr && entry && (
                <div style={popoverStyle}>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>{fmt(entry.sales)}</div>
                  {entry.customers > 0 && (
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginTop: "2px" }}>
                      {entry.customers}{ko ? "명" : " pax"} · {ko ? "객단가" : "avg"} {fmt(entry.sales / entry.customers)}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "28px",
  padding: "24px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 100%)",
  border: "1px solid rgba(15,23,42,0.06)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.03)",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.44)",
};

const titleStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "#0f172a",
};

const navBtn: React.CSSProperties = {
  background: "rgba(15,23,42,0.04)",
  border: "none",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  color: "rgba(15,23,42,0.6)",
};

const legend: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "12px",
  flexWrap: "wrap",
};

const legendItem: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "10px",
  color: "rgba(15,23,42,0.48)",
};

const legendDot: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "3px",
  display: "inline-block",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "4px",
};

const weekdayHeader: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "rgba(15,23,42,0.36)",
  textAlign: "center",
  padding: "4px 0",
};

const dayCell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 2px",
  borderRadius: "10px",
  cursor: "pointer",
  minHeight: "48px",
  transition: "background 0.15s ease",
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 6px)",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#0f172a",
  color: "#fff",
  borderRadius: "10px",
  padding: "8px 12px",
  whiteSpace: "nowrap",
  zIndex: 10,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
};
