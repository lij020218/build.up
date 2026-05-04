"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import { EmptyStateCard } from "./EmptyStateCard";

type DailyEntry = { date: string; sales: number; customers: number };

type Props = {
  d: DashboardHook;
  ko: boolean;
  fmt: (n: number) => string;
};

export function WeeklyReport({ d, ko, fmt }: Props) {
  const [expanded, setExpanded] = useState(false);
  const entries = d.dailyEntries as DailyEntry[];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + mondayOffset);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(lastSunday.getDate() - 1);

  const toIso = (dt: Date) => dt.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const thisWeek = entries.filter((e) => e.date >= toIso(thisMonday) && e.date <= todayStr);
  const lastWeek = entries.filter((e) => e.date >= toIso(lastMonday) && e.date <= toIso(lastSunday));

  if (thisWeek.length < 2 && lastWeek.length < 2) {
    const current = Math.max(thisWeek.length, lastWeek.length);
    return (
      <EmptyStateCard
        ko={ko}
        eyebrow={ko ? "주간 리포트" : "Weekly Report"}
        title={ko ? "이번 주 기록이 쌓이면 보여드려요" : "Weekly summary opens after 2 days of logging"}
        description={ko
          ? "이번 주 vs 지난 주 매출·고객 비교, 최고/최저 매출일까지 한눈에 확인할 수 있어요."
          : "Compare this week vs last, see peak and slow days at a glance."}
        Icon={CalendarDays}
        progress={{
          current,
          target: 2,
          unitKo: "일",
          unitEn: "days",
        }}
      />
    );
  }

  const thisTotal = thisWeek.reduce((s, e) => s + e.sales, 0);
  const lastTotal = lastWeek.reduce((s, e) => s + e.sales, 0);
  const thisCust = thisWeek.reduce((s, e) => s + e.customers, 0);
  const lastCust = lastWeek.reduce((s, e) => s + e.customers, 0);

  const salesChange = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;
  const custChange = lastCust > 0 ? Math.round(((thisCust - lastCust) / lastCust) * 100) : 0;

  const avgDaily = thisWeek.length > 0 ? Math.round(thisTotal / thisWeek.length) : 0;
  const avgTicket = thisCust > 0 ? Math.round(thisTotal / thisCust) : 0;
  const bestDay = thisWeek.length > 0 ? thisWeek.reduce((a, b) => (a.sales > b.sales ? a : b)) : null;
  const worstDay = thisWeek.length > 0 ? thisWeek.reduce((a, b) => (a.sales < b.sales ? a : b)) : null;

  const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number };
  const weeklyCosts = ((mc.ingredients ?? 0) + (mc.labor ?? 0) + (mc.rent ?? 0) + (mc.utilities ?? 0) + (mc.sga ?? 0) + (mc.marketing ?? 0) + (mc.other ?? 0) + (mc.interest ?? 0)) / 4.34;
  const weeklyProfit = thisTotal - weeklyCosts;

  const dateRange = `${new Date(toIso(thisMonday) + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" })} — ${new Date(todayStr + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" })}`;

  /* AI summary */
  const aiInsight = d.aiActions?.insight;

  return (
    <section style={card} data-weekly-report>
      <button type="button" onClick={() => setExpanded(!expanded)} style={headerBtn}>
        <div>
          <div style={eyebrow}>{ko ? "주간 리포트" : "Weekly Report"}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
            <span style={titleStyle}>{dateRange}</span>
            {lastTotal > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 700, color: salesChange >= 0 ? "#177245" : "#b42318", background: salesChange >= 0 ? "rgba(23,114,69,0.08)" : "rgba(180,35,24,0.08)", borderRadius: "6px", padding: "2px 8px" }}>
                {salesChange >= 0 ? "↑" : "↓"}{Math.abs(salesChange)}%
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: "18px", color: "rgba(15,23,42,0.3)", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          ▾
        </span>
      </button>

      {expanded && (
        <div style={body}>
          {/* KPI grid */}
          <div style={kpiGrid}>
            <KPI label={ko ? "주간 매출" : "Weekly sales"} value={fmt(thisTotal)} change={salesChange} lastTotal={lastTotal} ko={ko} />
            <KPI label={ko ? "일평균" : "Daily avg"} value={fmt(avgDaily)} ko={ko} />
            <KPI label={ko ? "고객 수" : "Customers"} value={`${thisCust}${ko ? "명" : ""}`} change={custChange} lastTotal={lastCust} ko={ko} />
            <KPI label={ko ? "객단가" : "Avg ticket"} value={fmt(avgTicket)} ko={ko} />
            <KPI label={ko ? "주간 손익" : "Weekly P&L"} value={`${weeklyProfit >= 0 ? "+" : ""}${fmt(weeklyProfit)}`} color={weeklyProfit >= 0 ? "#177245" : "#b42318"} ko={ko} />
            {bestDay && (
              <KPI
                label={ko ? "최고 매출일" : "Best day"}
                value={new Date(bestDay.date + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short", day: "numeric" })}
                sub={fmt(bestDay.sales)}
                ko={ko}
              />
            )}
          </div>

          {/* daily breakdown */}
          <div style={breakdownSection}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,23,42,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
              {ko ? "일별 상세" : "Daily breakdown"}
            </div>
            {thisWeek.map((e) => {
              const pct = thisTotal > 0 ? (e.sales / thisTotal) * 100 : 0;
              return (
                <div key={e.date} style={breakdownRow}>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", width: "36px", flexShrink: 0 }}>
                    {new Date(e.date + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}
                  </div>
                  <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(25,25,112,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "3px", background: e.date === bestDay?.date ? "#191970" : "rgba(15,23,42,0.18)", width: `${pct}%`, transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, fontVariantNumeric: "tabular-nums", width: "64px", textAlign: "right" as const }}>
                    {fmt(e.sales)}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", width: "40px", textAlign: "right" as const }}>
                    {e.customers}{ko ? "명" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI insight */}
          {aiInsight && (
            <div style={insightBox}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#191970", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "4px" }}>
                AI Insight
              </div>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.72)", lineHeight: 1.5 }}>{aiInsight}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function KPI({ label, value, change, lastTotal, sub, color, ko }: {
  label: string; value: string; change?: number; lastTotal?: number; sub?: string; color?: string; ko: boolean;
}) {
  return (
    <div style={kpiCard}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>{label}</div>
      <div style={{ fontSize: "17px", fontWeight: 720, color: color || "#0f172a", letterSpacing: "-0.02em", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", fontWeight: 600, color: "#191970", marginTop: "1px" }}>{sub}</div>}
      {change != null && lastTotal != null && lastTotal > 0 && (
        <div style={{ fontSize: "11px", fontWeight: 600, color: change >= 0 ? "#177245" : "#b42318", marginTop: "2px" }}>
          {change >= 0 ? "↑" : "↓"}{Math.abs(change)}% {ko ? "전주" : "WoW"}
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "28px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 100%)",
  border: "1px solid rgba(15,23,42,0.06)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.03)",
  overflow: "hidden",
};

const headerBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.44)",
};

const titleStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f172a",
};

const body: React.CSSProperties = {
  padding: "0 24px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "8px",
};

const kpiCard: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  background: "rgba(25,25,112,0.025)",
};

const breakdownSection: React.CSSProperties = {};

const breakdownRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 0",
};

const insightBox: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "14px",
  background: "rgba(25,25,112,0.04)",
  border: "1px solid rgba(25,25,112,0.08)",
};
