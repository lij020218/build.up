"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

export function WeeklySummaryCard() {
  const d = useDashboardCtx();
  const { language, dailyEntries } = d;

  const ko = language === "ko";
  const entries = dailyEntries as { date: string; sales: number; customers: number }[];
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(now); thisMonday.setDate(now.getDate() + mondayOffset); thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday); lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday); lastSunday.setDate(lastSunday.getDate() - 1);

  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  const thisWeek = entries.filter(e => e.date >= toIso(thisMonday) && e.date <= todayIso);
  const lastWeek = entries.filter(e => e.date >= toIso(lastMonday) && e.date <= toIso(lastSunday));

  if (thisWeek.length < 2) return null;

  const thisTotal = thisWeek.reduce((s, e) => s + e.sales, 0);
  const lastTotal = lastWeek.reduce((s, e) => s + e.sales, 0);
  const thisCust = thisWeek.reduce((s, e) => s + e.customers, 0);
  const avgSales = Math.round(thisTotal / thisWeek.length);
  const avgCust = thisWeek.length > 0 ? Math.round(thisCust / thisWeek.length) : 0;
  const change = lastTotal > 0 ? Math.round((thisTotal - lastTotal) / lastTotal * 100) : 0;
  const best = thisWeek.reduce((a, b) => a.sales > b.sales ? a : b);
  const bestLabel = new Date(best.date + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short", month: "short", day: "numeric" });

  const fmtW = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}\ub9cc\uc6d0` : `${Math.round(n).toLocaleString()}\uc6d0`;

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
      <div style={{ padding: "18px 22px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            {ko ? "\uc8fc\uac04 \uc694\uc57d" : "Weekly Summary"}
          </div>
          {lastTotal > 0 && (
            <div style={{
              fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "8px",
              background: change >= 0 ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)",
              color: change >= 0 ? "#34c759" : "#ff3b30",
            }}>
              {change >= 0 ? "\u2191" : "\u2193"} {Math.abs(change)}% {ko ? "\uc804\uc8fc \ub300\ube44" : "vs last week"}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "\uc774\ubc88 \uc8fc \ub9e4\ucd9c" : "This week"}</div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>{fmtW(thisTotal)}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "\uc77c\ud3c9\uade0 \ub9e4\ucd9c" : "Daily avg"}</div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>{fmtW(avgSales)}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "\uc77c\ud3c9\uade0 \uace0\uac1d" : "Avg customers"}</div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>{avgCust}{ko ? "\uba85" : " pax"}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{ko ? "\ucd5c\uace0 \ub9e4\ucd9c\uc77c" : "Best day"}</div>
            <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.2px" }}>{bestLabel}</div>
            <div style={{ fontSize: "12px", color: "#007aff", fontWeight: 600 }}>{fmtW(best.sales)}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
