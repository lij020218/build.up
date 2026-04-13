// @ts-nocheck
"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

/** Format number as Korean currency (e.g. 12만원) */
const fmt = (n: number) =>
  n >= 10000
    ? `${Math.round(n / 10000).toLocaleString()}\ub9cc\uc6d0`
    : `${Math.round(n).toLocaleString()}\uc6d0`;

export function DailySalesInputCard() {
  const d = useDashboardCtx();
  const _d = d as any;
  const {
    language, dailyEntries,
    dailySalesInput, setDailySalesInput,
    dailyCustomersInput, setDailyCustomersInput,
    dailyDateInput, setDailyDateInput,
    handleAddDailyEntry,
  } = _d;

  const ko = language === "ko";
  const todayStr = new Date().toISOString().slice(0, 10);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const entryMap = Object.fromEntries(
    (dailyEntries as { date: string; sales: number; customers: number }[]).map(e => [e.date, { sales: e.sales, customers: e.customers }])
  );
  const bars = last7.map(date => ({
    date,
    sales: entryMap[date]?.sales ?? 0,
    customers: entryMap[date]?.customers ?? 0,
    label: ko
      ? new Date(date + "T12:00:00").toLocaleDateString("ko-KR", { weekday: "narrow" })
      : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
    isToday: date === todayStr,
  }));
  const maxSales = Math.max(...bars.map(b => b.sales), 1);
  const hasAny = bars.some(b => b.sales > 0);
  const weekTotal = bars.reduce((s, b) => s + b.sales, 0);
  const todayEntry = entryMap[todayStr];
  const chartH = 56;
  const inputFieldStyle: React.CSSProperties = {
    border: "1px solid rgba(17,17,17,0.08)",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "15px",
    outline: "none",
    background: "rgba(255,255,255,0.9)",
    flex: 1,
    minWidth: 0,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      borderRadius: "24px",
      border: "1px solid rgba(17,17,17,0.06)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.82))",
      backdropFilter: "blur(16px)",
      boxShadow: "0 8px 24px rgba(17,17,17,0.04)",
      overflow: "hidden",
      marginBottom: "8px",
    }}>
      {/* \uc0c1\ub2e8: \ucc28\ud2b8 \uc601\uc5ed */}
      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            {ko ? "\ucd5c\uadfc 7\uc77c \ub9e4\ucd9c" : "Last 7 Days"}
          </div>
          {hasAny && (
            <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--text)" }}>
              {fmt(weekTotal)}
            </div>
          )}
        </div>

        {/* \ubc14 \ucc28\ud2b8 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: `${chartH + 28}px` }}>
          {bars.map(bar => {
            const barH = bar.sales > 0 ? Math.max(5, (bar.sales / maxSales) * chartH) : 0;
            return (
              <div key={bar.date} style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
                <div style={{
                  fontSize: "9px", fontWeight: 700, marginBottom: "3px", lineHeight: 1,
                  color: bar.isToday ? "#007aff" : bar.sales > 0 ? "rgba(0,0,0,0.45)" : "transparent",
                  minHeight: "10px",
                }}>
                  {bar.sales > 0 ? `${Math.round(bar.sales / 10000)}` : ""}
                </div>
                <div style={{ width: "100%", height: `${chartH}px`, display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    height: bar.sales > 0 ? `${barH}px` : "2px",
                    borderRadius: "5px 5px 2px 2px",
                    background: bar.isToday ? "#007aff" : bar.sales > 0 ? "rgba(0,122,255,0.16)" : "rgba(0,0,0,0.04)",
                    transition: "height 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
                  }} />
                </div>
                <div style={{
                  fontSize: "10px", fontWeight: bar.isToday ? 700 : 500, marginTop: "5px",
                  color: bar.isToday ? "#007aff" : "var(--muted)",
                }}>
                  {bar.label}
                </div>
              </div>
            );
          })}
        </div>
        {!hasAny && (
          <div style={{ textAlign: "center" as const, fontSize: "13px", color: "var(--muted)", padding: "12px 0 4px" }}>
            {ko ? "\uc544\ub798\uc5d0\uc11c \uc624\ub298 \ub9e4\ucd9c\uc744 \uc785\ub825\ud558\uc138\uc694" : "Enter today's sales below"}
          </div>
        )}
      </div>

      {/* \uad6c\ubd84\uc120 */}
      <div style={{ height: "0.5px", background: "rgba(17,17,17,0.06)" }} />

      {/* \ud558\ub2e8: \uc785\ub825 \uc601\uc5ed */}
      <div style={{ padding: "16px 22px 18px", background: "rgba(0,0,0,0.015)" }}>
        {todayEntry ? (
          /* 오늘 이미 입력됨 → 요약 표시 */
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", marginBottom: "2px" }}>
                {ko ? "\uc624\ub298 \uae30\ub85d" : "Today"}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {fmt(todayEntry.sales)}
                {todayEntry.customers > 0 && (
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", marginLeft: "8px" }}>
                    {todayEntry.customers}{ko ? "\uba85" : " pax"} · {ko ? "\uac1d\ub2e8\uac00" : "avg"} {fmt(todayEntry.sales / todayEntry.customers)}
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={() => { setDailyDateInput(todayStr); setDailySalesInput(String(Math.round(todayEntry.sales / 10000))); setDailyCustomersInput(String(todayEntry.customers)); }}
              aria-label={ko ? "\uc624\ub298 \ub9e4\ucd9c \uc218\uc815" : "Edit today's sales"}
              style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer" }}>
              {ko ? "\uc218\uc815" : "Edit"}
            </button>
          </div>
        ) : (
          /* 오늘 미입력 → 입력 폼 */
          <>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", marginBottom: "10px" }}>
              {ko ? "\uc624\ub298 \ub9e4\ucd9c \uc785\ub825" : "Log today's sales"}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="date" value={dailyDateInput} onChange={(e) => setDailyDateInput(e.target.value)}
                aria-label={ko ? "\ub9e4\ucd9c \ub0a0\uc9dc" : "Sales date"}
                style={{ ...inputFieldStyle, flex: "0 0 auto", width: "140px" }} />
              <input type="text" inputMode="numeric" value={dailySalesInput}
                onChange={(e) => setDailySalesInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={ko ? "\ub9e4\ucd9c \ub9cc\uc6d0" : "Sales \ub9cc\uc6d0"}
                aria-label={ko ? "\ub9e4\ucd9c \uae08\uc561 (\ub9cc\uc6d0)" : "Sales amount (10K KRW)"}
                style={inputFieldStyle} />
              <input type="text" inputMode="numeric" value={dailyCustomersInput}
                onChange={(e) => setDailyCustomersInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={ko ? "\uace0\uac1d \uc218" : "Customers"}
                aria-label={ko ? "\uace0\uac1d \uc218" : "Number of customers"}
                style={{ ...inputFieldStyle, flex: "0 0 90px" }} />
              <button type="button"
                style={{
                  borderRadius: "12px", border: "none",
                  background: dailySalesInput ? "var(--primary)" : "rgba(0,0,0,0.06)",
                  color: dailySalesInput ? "#fff" : "var(--muted)",
                  padding: "10px 18px", fontSize: "14px", fontWeight: 600,
                  cursor: dailySalesInput ? "pointer" : "default",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onClick={handleAddDailyEntry}
                disabled={!dailySalesInput}>
                {ko ? "\uc800\uc7a5" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
