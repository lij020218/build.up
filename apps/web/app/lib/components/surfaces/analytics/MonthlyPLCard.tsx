"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

/** Format number as Korean currency */
const fmt = (n: number) =>
  n >= 10000
    ? `${Math.round(n / 10000).toLocaleString()}\ub9cc\uc6d0`
    : `${Math.round(n).toLocaleString()}\uc6d0`;

const pct = (n: number) => `${n.toFixed(1)}%`;

type HealthLevel = "good" | "caution" | "danger";

const health = (val: number, good: number, caution: number): HealthLevel =>
  val <= good ? "good" : val <= caution ? "caution" : "danger";

const healthColor = (h: HealthLevel) =>
  h === "good" ? "#34c759" : h === "caution" ? "#ff9f0a" : "#ff3b30";

export function MonthlyPLCard() {
  const d = useDashboardCtx();
  const { language, dailyEntries, monthlyCosts } = d;

  const ko = language === "ko";

  // -- Derived metrics (same as AnalyticsSurface top-level) --
  const currentMonth = new Date().toISOString().slice(0, 7);
  type DE = { date: string; sales: number; customers: number };
  const monthEntries = (dailyEntries as DE[]).filter((e) => e.date.startsWith(currentMonth));
  const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
  const workingDays = monthEntries.length;
  const { ingredients, labor, rent, utilities, other } = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
  const totalCosts = ingredients + labor + rent + utilities + other;
  const ingredientRatio = totalSales > 0 ? (ingredients / totalSales) * 100 : 0;
  const laborRatio = totalSales > 0 ? (labor / totalSales) * 100 : 0;
  const primeCost = ingredientRatio + laborRatio;
  const rentRatio = totalSales > 0 ? (rent / totalSales) * 100 : 0;
  const netProfit = totalSales - totalCosts;
  const bepProgress = totalCosts > 0 ? Math.min(100, (totalSales / totalCosts) * 100) : 0;

  const ingHealth = health(ingredientRatio, 35, 40);
  const labHealth = health(laborRatio, 30, 35);
  const primeHealth = health(primeCost, 60, 65);
  const rentHealth = health(rentRatio, 10, 15);

  // Projection
  const todayDate = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const remainDays = daysInMonth - todayDate;
  const avgDailySalesNum = workingDays > 0 ? totalSales / workingDays : 0;
  const projectedSales = workingDays > 0 ? totalSales + avgDailySalesNum * remainDays : 0;
  const projectedProfit = projectedSales - totalCosts;
  const hasDangerZone = ingHealth === "danger" || labHealth === "danger" || rentHealth === "danger" || primeHealth === "danger" || (totalSales > 0 && netProfit < 0);

  // Diagnostics
  const diagnostics: string[] = [];
  if (totalSales > 0) {
    if (primeHealth === "danger") diagnostics.push(ko
      ? `Prime Cost(\uc6d0\uac00\uc728+\uc778\uac74\ube44\uc728)\uac00 ${pct(primeCost)}\uc785\ub2c8\ub2e4. 65% \uc774\ud558\ub97c \uc720\uc9c0\ud574\uc57c \uc784\ub300\ub8cc\xb7\uc138\uae08\uc744 \ub0b4\uace0 \uc218\uc775\uc774 \ub0a8\uc2b5\ub2c8\ub2e4.`
      : `Prime Cost is ${pct(primeCost)}. Keep it under 65% to have margin left after rent and taxes.`);
    if (ingHealth !== "good") diagnostics.push(ko
      ? `\uc7ac\ub8cc\ube44\uc728\uc774 ${pct(ingredientRatio)}\uc785\ub2c8\ub2e4. 30~35%\ub97c \ubaa9\ud45c\ub85c \uba54\ub274 \uc6d0\uac00\ub97c \uc810\uac80\ud558\uc138\uc694.`
      : `Food cost ratio is ${pct(ingredientRatio)}. Target 30\u201335% and review menu costs.`);
    if (labHealth !== "good") diagnostics.push(ko
      ? `\uc778\uac74\ube44\uc728\uc774 ${pct(laborRatio)}\uc785\ub2c8\ub2e4. 30% \uc774\ud558\ub97c \uc720\uc9c0\ud574\uc57c \uc218\uc775\uc774 \ub0a9\ub2c8\ub2e4. \uc2a4\ucf00\uc904 \ucd5c\uc801\ud654\ub97c \uac80\ud1a0\ud558\uc138\uc694.`
      : `Labor ratio is ${pct(laborRatio)}. Keep it under 30% to stay profitable. Review staff scheduling.`);
    if (rentHealth !== "good") diagnostics.push(ko
      ? `\uc784\ub300\ub8cc \ube44\uc728\uc774 ${pct(rentRatio)}\uc785\ub2c8\ub2e4. 10% \uc774\ud558\ub97c \uad8c\uc7a5\ud569\ub2c8\ub2e4. \ub9e4\ucd9c \uc99d\ub300\uac00 \uc2dc\uae09\ud569\ub2c8\ub2e4.`
      : `Rent ratio is ${pct(rentRatio)}. Under 10% is recommended \u2014 focus on increasing revenue.`);
    if (netProfit < 0) diagnostics.push(ko
      ? `\uc774\ubc88 \ub2ec \uc608\uc0c1 \uc801\uc790\uc785\ub2c8\ub2e4(${fmt(Math.abs(netProfit))}). \ube44\uc6a9 \uad6c\uc870\ub97c \uc810\uac80\ud558\uc138\uc694.`
      : `Projected loss this month (${fmt(Math.abs(netProfit))}). Review your cost structure.`);
    if (diagnostics.length === 0) diagnostics.push(ko
      ? "\uc9c0\ud45c\uac00 \ubaa8\ub450 \uac74\uac15\ud55c \ubc94\uc704\uc5d0 \uc788\uc2b5\ub2c8\ub2e4. \uc774 \uad6c\uc870\ub97c \uc720\uc9c0\ud558\uc138\uc694."
      : "All metrics are in healthy range. Keep up the good work.");
  }

  const hasData = totalSales > 0;
  const hasCosts = totalCosts > 0;

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
      {/* \uc704\ud5d8 \uacbd\ubcf4 \ubc30\ub108 */}
      {hasDangerZone && hasData && (
        <div style={{ padding: "11px 20px", background: "rgba(255,59,48,0.05)", borderBottom: "0.5px solid rgba(255,59,48,0.12)", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M7 1L13 12H1L7 1Z" stroke="#ff3b30" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
            <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="7" cy="10.5" r="0.7" fill="#ff3b30"/>
          </svg>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#ff3b30", lineHeight: 1.4 }}>
            {ko ? "\ube44\uc6a9 \uad6c\uc870\uc5d0 \uc704\ud5d8 \uc2e0\ud638\uac00 \uc788\uc2b5\ub2c8\ub2e4. \uc544\ub798 \uc9c4\ub2e8\uc744 \ud655\uc778\ud558\uc138\uc694." : "Cost structure alert. Review diagnostics below."}
          </span>
        </div>
      )}

      {/* \ud5e4\ub354 */}
      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
          {ko ? `${new Date().getMonth() + 1}\uc6d4 \uc190\uc775` : `${new Date().toLocaleString("en", { month: "long" })} P&L`}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "3px", flexWrap: "wrap" as const }}>
          {workingDays > 0 && (
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {ko ? `${workingDays}\uc77c \uc6b4\uc601 \uae30\ub85d` : `${workingDays} days recorded`}
            </div>
          )}
          {projectedSales > 0 && (
            <div style={{ fontSize: "12px", color: projectedProfit >= 0 ? "#34c759" : "#ff3b30", fontWeight: 600 }}>
              {ko
                ? `\uc6d4\ub9d0 \uc608\uc0c1 ${projectedProfit >= 0 ? "+" : ""}${fmt(projectedProfit)}`
                : `Projected month-end ${projectedProfit >= 0 ? "+" : ""}${fmt(projectedProfit)}`}
            </div>
          )}
        </div>
      </div>

      {/* 3-col \ud575\uc2ec \uc9c0\ud45c */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "0.5px solid rgba(0,0,0,0.08)", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        {[
          { label: ko ? "\ucd1d \ub9e4\ucd9c" : "Revenue", value: hasData ? fmt(totalSales) : "\u2014", color: "inherit" as const, prefix: "" },
          { label: ko ? "\ucd1d \ube44\uc6a9" : "Costs", value: hasCosts ? fmt(totalCosts) : "\u2014", color: "inherit" as const, prefix: "" },
          {
            label: ko ? "\uc21c\uc774\uc775" : "Net profit",
            value: hasData && hasCosts ? fmt(Math.abs(netProfit)) : "\u2014",
            color: (hasData && hasCosts ? (netProfit >= 0 ? "#34c759" : "#ff3b30") : "inherit") as string,
            prefix: hasData && hasCosts ? (netProfit >= 0 ? "+" : "\u2212") : "",
          },
        ].map((m, idx) => (
          <div key={m.label} style={{ padding: "18px 14px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "8px" }}>
              {m.label}
            </div>
            <div style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.5px", color: m.color, lineHeight: 1.1 }}>
              {m.prefix}{m.value}
            </div>
          </div>
        ))}
      </div>

      {/* BEP + \ube44\uc728 \uadf8\ub9ac\ub4dc */}
      {hasData && hasCosts && (
        <div style={{ padding: "16px 22px 4px", display: "flex", flexDirection: "column" as const, gap: "14px" }}>
          {/* \uc190\uc775\ubd84\uae30\uc810 \ubc14 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.03em" }}>
                {ko ? "\uc190\uc775\ubd84\uae30\uc810 \ub2ec\uc131\ub960" : "Break-even progress"}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: bepProgress >= 100 ? "#34c759" : "#007aff" }}>
                {bepProgress.toFixed(0)}%{bepProgress >= 100 ? (ko ? " \xb7 \ub2ec\uc131 \u2713" : " \xb7 Hit \u2713") : ""}
              </span>
            </div>
            <div style={{ height: "5px", borderRadius: "3px", background: "rgba(0,0,0,0.07)", overflow: "hidden" as const }}>
              <div style={{ height: "100%", borderRadius: "3px", width: `${Math.min(100, bepProgress)}%`, background: bepProgress >= 100 ? "#34c759" : "#007aff", transition: "width 0.5s ease" }} />
            </div>
          </div>
          {/* \ube44\uc728 2x2 \uadf8\ub9ac\ub4dc */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: ko ? "\uc6d0\uac00\uc728" : "Food cost", value: ingredientRatio, good: 35, caution: 40 },
              { label: ko ? "\uc778\uac74\ube44\uc728" : "Labor", value: laborRatio, good: 30, caution: 35 },
              { label: ko ? "\uc784\ub300\ub8cc\uc728" : "Rent", value: rentRatio, good: 10, caution: 15 },
              { label: "Prime Cost", value: primeCost, good: 60, caution: 65 },
            ].map(row => {
              const h = health(row.value, row.good, row.caution);
              return (
                <div key={row.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.03em" }}>{row.label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: healthColor(h) }}>{pct(row.value)}</span>
                  </div>
                  <div style={{ height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.07)", overflow: "hidden" as const }}>
                    <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(100, (row.value / (row.caution * 1.5)) * 100)}%`, background: healthColor(h), transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* \uc9c4\ub2e8 \uba54\uc2dc\uc9c0 */}
      {diagnostics.length > 0 && hasData && (
        <div style={{ padding: "12px 22px 18px", display: "flex", flexDirection: "column" as const, gap: "6px" }}>
          {diagnostics.map((msg, i) => {
            const isWarn = msg.includes("\uc704\ud5d8") || msg.includes("\uc801\uc790") || msg.includes("Danger") || msg.includes("loss");
            return (
              <div key={i} style={{
                display: "flex", gap: "8px", padding: "10px 12px", borderRadius: "10px",
                background: isWarn ? "rgba(255,59,48,0.05)" : "rgba(52,199,89,0.05)",
                border: `0.5px solid ${isWarn ? "rgba(255,59,48,0.15)" : "rgba(52,199,89,0.15)"}`,
                fontSize: "12px", lineHeight: 1.5, color: "rgba(0,0,0,0.72)",
              }}>
                {isWarn
                  ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M7 1.5L12.5 12H1.5L7 1.5Z" stroke="#ff3b30" strokeWidth="1.4" strokeLinejoin="round" fill="none"/><line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10.5" r="0.65" fill="#ff3b30"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }}><polyline points="2,7 5,10 11,3" stroke="#34c759" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                }
                {msg}
              </div>
            );
          })}
        </div>
      )}

      {/* \ube48 \uc0c1\ud0dc */}
      {!hasData && (
        <div style={{ padding: "16px 22px 20px" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
            {ko ? "\uc544\ub798\uc5d0\uc11c \uc624\ub298 \ub9e4\ucd9c\uacfc \ube44\uc6a9\uc744 \uc785\ub825\ud558\uba74 \uc190\uc775\uc774 \uc2e4\uc2dc\uac04 \uacc4\uc0b0\ub429\ub2c8\ub2e4." : "Enter today's sales and costs below to see your P&L in real time."}
          </div>
        </div>
      )}
    </article>
  );
}
