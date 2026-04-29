"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowDownRight, ArrowUpRight, Calendar } from "lucide-react";
import { useCashflowStore } from "../../stores/cashflow-store";
import type { DayProjection } from "../../services/cashflow-projection";

type Props = {
  ko: boolean;
  projections: DayProjection[];
  onClose: () => void;
};

/**
 * 14일 상세 현금흐름 시트.
 * - 일별 이벤트 상세 (입금/지출)
 * - 채널별 수수료 임팩트
 * - 고정비 캘린더 요약
 */
export function CashflowDetailSheet({ ko, projections, onClose }: Props) {
  const { salesChannels, fixedExpenses, currentBalance, vatReserveEnabled } = useCashflowStore();

  // SSR-safe portal mount + body 스크롤 잠금
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 14일 요약
  const totalInflow = projections.reduce((s, p) => s + p.inflow, 0);
  const totalOutflow = projections.reduce((s, p) => s + p.outflow, 0);
  const netChange = totalInflow - totalOutflow;

  // 채널별 14일 예상 입금 (비활성 제외)
  const activeChannels = salesChannels.filter((c) => c.isActive && c.salesRatio > 0);
  const channelTotals = activeChannels.map((c) => {
    const total = projections.reduce((s, p) => {
      const ev = p.events.find((e) => e.sourceChannel === c.id);
      return s + (ev?.amount ?? 0);
    }, 0);
    return { channel: c, total };
  });

  // 고정비 요약
  const expenseTotals = fixedExpenses
    .filter((e) => e.isActive)
    .map((e) => {
      const total = projections.reduce((s, p) => {
        const ev = p.events.find((ev) => ev.sourceExpenseId === e.id);
        return s + (ev?.amount ?? 0);
      }, 0);
      return { expense: e, total };
    })
    .sort((a, b) => b.total - a.total);

  if (!mounted) return null;

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(15,23,42,0.4)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "92vh",
          borderRadius: "28px 28px 0 0",
          background: "#fff",
          boxShadow: "0 -10px 60px rgba(15,23,42,0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: "18px 20px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(15,23,42,0.05)",
          }}
        >
          <div>
            <div style={eyebrow}>{ko ? "현금흐름 상세" : "Cash-flow Details"}</div>
            <div style={title}>{ko ? "앞으로 14일" : "Next 14 days"}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={closeBtn}
            aria-label={ko ? "닫기" : "Close"}
          >
            <X size={18} strokeWidth={1.8} color="rgba(15,23,42,0.5)" />
          </button>
        </div>

        {/* 본문 스크롤 */}
        <div style={{ overflowY: "auto", flex: 1, padding: "18px 20px 28px" }}>
          {/* 14일 요약 */}
          <div
            style={{
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(15,23,42,0.03)",
              marginBottom: "18px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            <SummaryMetric
              label={ko ? "총 입금 예상" : "Total inflow"}
              value={formatWon(totalInflow)}
              color="#059669"
            />
            <SummaryMetric
              label={ko ? "총 지출 예상" : "Total outflow"}
              value={formatWon(totalOutflow)}
              color="#b91c1c"
            />
            <SummaryMetric
              label={ko ? "순 변화" : "Net change"}
              value={`${netChange >= 0 ? "+" : ""}${formatWon(Math.abs(netChange))}`}
              color={netChange >= 0 ? "#059669" : "#b91c1c"}
            />
          </div>

          {vatReserveEnabled && (
            <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", marginBottom: "14px", padding: "8px 12px", background: "rgba(37,99,235,0.04)", borderRadius: "8px" }}>
              {ko
                ? "※ 부가세 10% 적립이 활성화되어 있어요. 입금액에서 10%를 미리 뺀 실가용 금액이 표시됩니다."
                : "※ 10% VAT reserve enabled. Displayed amounts have 10% deducted for tax."}
            </div>
          )}

          {/* 채널별 입금 예상 */}
          {channelTotals.length > 0 && (
            <section style={{ marginBottom: "20px" }}>
              <div style={sectionTitle}>
                <ArrowDownRight size={14} strokeWidth={1.8} color="#059669" />
                {ko ? "채널별 입금 예상 (14일)" : "Inflow by channel (14d)"}
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {channelTotals.map(({ channel, total }) => {
                  const maxChannelTotal = Math.max(...channelTotals.map((c) => c.total), 1);
                  const pct = Math.round((total / maxChannelTotal) * 100);
                  return (
                    <div key={channel.id} style={channelRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>
                            {channel.label[ko ? "ko" : "en"]}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                            +{formatWon(total)}
                          </span>
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.5)", marginBottom: "4px", display: "flex", gap: "10px" }}>
                          <span>{ko ? `정산 D+${channel.settlementDays}` : `Settlement D+${channel.settlementDays}`}</span>
                          {(channel.commissionRate + channel.paymentFeeRate) > 0 && (
                            <span>
                              {ko ? `수수료` : `Fee`} {(channel.commissionRate + channel.paymentFeeRate).toFixed(1)}%
                            </span>
                          )}
                          <span>{channel.salesRatio}%</span>
                        </div>
                        <div style={{ height: "3px", background: "rgba(15,23,42,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#059669", borderRadius: "2px" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 고정비 캘린더 */}
          {expenseTotals.length > 0 && (
            <section style={{ marginBottom: "20px" }}>
              <div style={sectionTitle}>
                <ArrowUpRight size={14} strokeWidth={1.8} color="#b91c1c" />
                {ko ? "고정비 지출 예정 (14일)" : "Fixed expenses (14d)"}
              </div>
              <div style={{ display: "grid", gap: "4px" }}>
                {expenseTotals.map(({ expense, total }) => (
                  <div key={expense.id} style={expenseRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>
                        {expense.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)" }}>
                        {ko ? `매월 ${expense.dayOfMonth}일` : `Day ${expense.dayOfMonth} of month`}
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: total > 0 ? "#b91c1c" : "rgba(15,23,42,0.3)", fontVariantNumeric: "tabular-nums" }}>
                      {total > 0 ? `−${formatWon(total)}` : (ko ? "해당없음" : "—")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 일별 타임라인 */}
          <section>
            <div style={sectionTitle}>
              <Calendar size={14} strokeWidth={1.8} color="rgba(15,23,42,0.5)" />
              {ko ? "일별 타임라인" : "Daily timeline"}
            </div>
            <div style={{ display: "grid", gap: "2px" }}>
              {projections.map((p, idx) => {
                const hasEvents = p.events.length > 0;
                const date = new Date(p.date);
                const dayNames = ko
                  ? ["일", "월", "화", "수", "목", "금", "토"]
                  : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const isToday = idx === 0;
                const isNegative = p.endBalance < 0;

                return (
                  <div
                    key={p.date}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: isToday
                        ? "rgba(37,99,235,0.04)"
                        : isNegative
                          ? "rgba(220,38,38,0.03)"
                          : hasEvents
                            ? "rgba(255,255,255,0.8)"
                            : "transparent",
                      border: isToday
                        ? "1px solid rgba(37,99,235,0.1)"
                        : isNegative
                          ? "1px solid rgba(220,38,38,0.08)"
                          : "1px solid transparent",
                    }}
                  >
                    <div style={{ width: "56px", flexShrink: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: isToday ? "#2563eb" : "rgba(15,23,42,0.6)" }}>
                        {isToday ? (ko ? "오늘" : "Today") : p.date.slice(5)}
                      </div>
                      <div style={{ fontSize: "10px", color: p.isWeekend ? "#b91c1c" : "rgba(15,23,42,0.4)", fontWeight: 600 }}>
                        {dayNames[p.dayOfWeek]}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {p.events.length === 0 ? (
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)" }}>
                          {ko ? "예정 이벤트 없음" : "No events"}
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: "2px" }}>
                          {p.events.slice(0, 3).map((e) => (
                            <div
                              key={e.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "11px",
                                alignItems: "baseline",
                              }}
                            >
                              <span style={{ color: "rgba(15,23,42,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                                {e.label[ko ? "ko" : "en"]}
                              </span>
                              <span
                                style={{
                                  fontWeight: 650,
                                  color: e.type === "inflow" ? "#059669" : "#b91c1c",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {e.type === "inflow" ? "+" : "−"}
                                {formatWon(e.amount)}
                              </span>
                            </div>
                          ))}
                          {p.events.length > 3 && (
                            <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)" }}>
                              +{p.events.length - 3} {ko ? "더" : "more"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", minWidth: "80px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: isNegative ? "#b91c1c" : "#0f172a",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatWon(p.endBalance)}
                      </div>
                      <div style={{ fontSize: "9px", color: "rgba(15,23,42,0.4)", fontWeight: 600 }}>
                        {ko ? "잔고" : "Balance"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  // Portal — stacking context 탈출
  return createPortal(content, document.body);
}

function SummaryMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(15,23,42,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "15px", fontWeight: 720, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function formatWon(n: number): string {
  const abs = Math.abs(Math.round(n));
  if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`;
  return `${abs.toLocaleString()}원`;
}

// ─── Styles ───

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
};

const title: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  marginTop: "2px",
};

const closeBtn: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "rgba(15,23,42,0.04)",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: "10px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const channelRow: React.CSSProperties = {
  display: "flex",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(15,23,42,0.02)",
  border: "1px solid rgba(15,23,42,0.04)",
};

const expenseRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(15,23,42,0.02)",
  border: "1px solid rgba(15,23,42,0.04)",
};
