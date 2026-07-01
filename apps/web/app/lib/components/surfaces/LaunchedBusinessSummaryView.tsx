"use client";

import type { DailyEntry, MonthlyCosts } from "../../stores/finance-store";
import { styles } from "../../styles";
import type { DashboardSurface } from "../../types";
import { calculateLaunchedBusinessSummary } from "./launched-business-summary";

type LaunchedBusinessSummaryViewProps = {
  language: "ko" | "en";
  storeName: string;
  dailyEntries: DailyEntry[];
  monthlyCosts: MonthlyCosts;
  dailyDateInput: string;
  setDailyDateInput: (value: string) => void;
  dailySalesInput: string;
  setDailySalesInput: (value: string) => void;
  dailyCustomersInput: string;
  setDailyCustomersInput: (value: string) => void;
  handleAddDailyEntry: () => void;
  navigateToSurface: (surface: DashboardSurface) => void;
};

export function LaunchedBusinessSummaryView({
  language,
  storeName,
  dailyEntries,
  monthlyCosts,
  dailyDateInput,
  setDailyDateInput,
  dailySalesInput,
  setDailySalesInput,
  dailyCustomersInput,
  setDailyCustomersInput,
  handleAddDailyEntry,
  navigateToSurface,
}: LaunchedBusinessSummaryViewProps) {
  const ko = language === "ko";
  const {
    monthEntries,
    totalSales,
    averageDailySales,
    averageTicket,
    totalCosts,
    netProfit,
    todayEntry,
  } = calculateLaunchedBusinessSummary(dailyEntries, monthlyCosts);
  const inputStyle = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "15px",
    outline: "none",
    background: "rgba(255,255,255,0.8)",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const formatMoney = (value: number) =>
    value >= 10000 ? `${Math.round(value / 10000).toLocaleString()}만원` : `${Math.round(value).toLocaleString()}원`;

  return (
    <section style={styles.section}>
      <div style={styles.sectionTitle}>{storeName || (ko ? "내 가게 운영" : "My Store")}</div>

      <article style={{ ...styles.card, gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
            {ko ? `${new Date().getMonth() + 1}월 현황` : `${new Date().toLocaleString("en", { month: "long" })} status`}
          </div>
          <button type="button" style={{ fontSize: "12px", color: "#3b5c8c", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => navigateToSurface("analytics")}>
            {ko ? "전체 보기 →" : "Full view →"}
          </button>
        </div>
        {totalSales === 0 ? (
          <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
            {ko ? "이번 달 매출 기록이 없습니다. 아래에서 오늘 매출을 입력하세요." : "No entries this month. Add today's sales below."}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { label: ko ? "이번달 매출" : "Monthly sales", value: formatMoney(totalSales) },
                { label: ko ? "하루 평균" : "Daily avg", value: formatMoney(averageDailySales) },
                { label: ko ? "객단가" : "Avg ticket", value: averageTicket > 0 ? formatMoney(averageTicket) : "—" },
              ].map((item) => (
                <div key={item.label} style={{ background: "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "12px 10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{item.label}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>
            {totalCosts > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: netProfit >= 0 ? "rgba(29,53,87,0.08)" : "rgba(182,76,76,0.08)" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{ko ? "예상 손익" : "Est. profit"}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: netProfit >= 0 ? "#1d3557" : "#b64c4c" }}>{netProfit >= 0 ? "+" : ""}{formatMoney(netProfit)}</span>
              </div>
            )}
          </>
        )}
      </article>

      <article style={{ ...styles.card, gap: "14px" }}>
        {todayEntry ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1d3557", flexShrink: 0 }} />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {ko ? `오늘 입력 완료 — ${formatMoney(todayEntry.sales)}` : `Today logged — ${formatMoney(todayEntry.sales)}`}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
            {ko ? "오늘 매출 입력" : "Log today's sales"}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="date" value={dailyDateInput} onChange={(event) => setDailyDateInput(event.target.value)} style={{ ...inputStyle, width: "auto", flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="text" inputMode="numeric" value={dailySalesInput} onChange={(event) => setDailySalesInput(event.target.value.replace(/[^0-9]/g, ""))} placeholder={ko ? "매출 (예: 45)" : "Sales (e.g. 45)"} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" inputMode="numeric" value={dailyCustomersInput} onChange={(event) => setDailyCustomersInput(event.target.value.replace(/[^0-9]/g, ""))} placeholder={ko ? "고객 수 (예: 32)" : "Customers (e.g. 32)"} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <button type="button" style={{ ...styles.primaryButton, opacity: dailySalesInput ? 1 : 0.45 }} onClick={handleAddDailyEntry} disabled={!dailySalesInput}>
          {ko ? "기록하기" : "Save entry"}
        </button>
        {monthEntries.slice(0, 5).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px", marginTop: "4px" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{ko ? "최근 기록" : "Recent"}</div>
            {monthEntries.slice(0, 5).map((entry) => (
              <div key={entry.date} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.03)", fontSize: "13px" }}>
                <span style={{ color: "var(--muted)" }}>{entry.date.slice(5).replace("-", "/")}</span>
                <span style={{ fontWeight: 600 }}>{formatMoney(entry.sales)}</span>
                <span style={{ color: "var(--muted)" }}>{entry.customers > 0 ? `${entry.customers}명 · ${formatMoney(entry.sales / entry.customers)}` : "-"}</span>
              </div>
            ))}
          </div>
        )}
      </article>

      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" style={{ ...styles.primaryButton, flex: 1 }} onClick={() => navigateToSurface("analytics")}>
          {ko ? "내 가게 현황 전체 보기" : "Full store analytics"}
        </button>
        <button type="button" style={{ ...styles.button, width: "fit-content" }} onClick={() => navigateToSurface("roadmap")}>
          {ko ? "로드맵" : "Roadmap"}
        </button>
      </div>
    </section>
  );
}
