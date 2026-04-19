"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import { ProductSalesEntry } from "./ProductSalesEntry";
import { TodaySalesSummary } from "./TodaySalesSummary";
import {
  activityCard,
  activityHeader,
  sectionEyebrow,
  activityTitle,
  activityStatRail,
  activityMiniStat,
  activityMiniLabel,
  activityMiniValue,
  activityChartWrap,
  activityBarCol,
  activityBarTrack,
  activityBarFill,
  activityBarLabel,
} from "./operationalStyles";

type DailyEntry = { date: string; sales: number; customers: number };

export function ActivitySnapshotCard({
  d,
  ko,
  todayStr,
  recent7Entries,
  recent7Sales,
  weeklySalesChange,
  todayEntry,
  avgDailySales,
  fmt,
  onOpenCalendar,
}: {
  d: DashboardHook;
  ko: boolean;
  todayStr: string;
  recent7Entries: DailyEntry[];
  recent7Sales: number;
  weeklySalesChange: number;
  todayEntry: DailyEntry | null;
  avgDailySales: number;
  fmt: (n: number) => string;
  onOpenCalendar: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [postEntryReaction, setPostEntryReaction] = useState<string | null>(null);

  // suppress unused variable warning
  void postEntryReaction;

  // 매출 입력 후 즉시 반응 생성 (AI 호출 없이 수식 기반)
  const generatePostEntryReaction = (sales: number, customers: number) => {
    const allE = d.dailyEntries as DailyEntry[];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yEntry = allE.find(e => e.date === yesterday.toISOString().slice(0, 10));

    // BEP 비교
    const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
    const fixedDaily = (mc.labor + mc.rent + mc.utilities + mc.other) / 26;
    const totalRev = allE.reduce((s, e) => s + e.sales, 0);
    const cogsRate = totalRev > 0 ? mc.ingredients / totalRev : 0.33;
    const bepDaily = cogsRate < 1 ? Math.round(fixedDaily / (1 - cogsRate)) : 0;

    // 어제 대비
    if (yEntry && yEntry.sales > 0) {
      const diff = Math.round(((sales - yEntry.sales) / yEntry.sales) * 100);
      if (sales >= bepDaily && diff >= 0) {
        return ko ? `BEP 달성 + 어제 대비 +${diff}%. 좋은 하루입니다` : `Above BEP + ${diff}% vs yesterday. Good day`;
      }
      if (sales >= bepDaily) {
        return ko ? `BEP 달성. 어제보다 ${Math.abs(diff)}% 하락했지만 흑자 구간` : `Above BEP but ${Math.abs(diff)}% below yesterday`;
      }
      if (diff >= 10) {
        return ko ? `어제 대비 +${diff}% 상승. BEP까지 ${fmt(bepDaily - sales)} 부족` : `+${diff}% vs yesterday. ${fmt(bepDaily - sales)} short of BEP`;
      }
    }

    // BEP만 비교
    if (bepDaily > 0 && sales >= bepDaily) {
      return ko ? `오늘 BEP 달성. 이 페이스면 월 흑자 가능` : `BEP reached today. On track for monthly profit`;
    }
    if (bepDaily > 0 && sales > 0) {
      const gap = bepDaily - sales;
      return ko ? `BEP까지 ${fmt(gap)} 부족. 내일 ${fmt(Math.round(gap * 0.5))} 더 올리면 주간 균형` : `${fmt(gap)} short of BEP`;
    }

    // 기본
    if (customers > 0 && sales > 0) {
      const ticket = Math.round(sales / customers);
      return ko ? `객단가 ${fmt(ticket)}. 기록 완료` : `Avg ticket ${fmt(ticket)}. Logged`;
    }
    return ko ? "기록 완료" : "Logged";
  };

  const last7 = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
  const entryMap = Object.fromEntries(recent7Entries.map((entry) => [entry.date, entry]));
  const bars = last7.map((date) => ({
    date,
    sales: entryMap[date]?.sales ?? 0,
    label: new Date(`${date}T12:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", {
      weekday: ko ? "narrow" : "short",
    }),
    isToday: date === todayStr,
  }));
  const maxSales = Math.max(...bars.map((bar) => bar.sales), 1);

  return (
    <section style={activityCard} className="bento-card">
      <div style={activityHeader}>
        <div>
          <div style={sectionEyebrow}>{ko ? "오늘 + 최근 7일" : "Today + last 7 days"}</div>
          <div style={activityTitle}>{ko ? "매출 흐름과 오늘 입력" : "Revenue flow and today's log"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={activityStatRail}>
            <div style={activityMiniStat}>
              <div style={activityMiniLabel}>{ko ? "최근 7일" : "Last 7 days"}</div>
              <div style={activityMiniValue}>{fmt(recent7Sales)}</div>
            </div>
            <div style={activityMiniStat}>
              <div style={activityMiniLabel}>{ko ? "주간 변화" : "Weekly change"}</div>
              <div style={{ ...activityMiniValue, color: weeklySalesChange >= 0 ? "#177245" : "#b42318" }}>
                {weeklySalesChange >= 0 ? "+" : ""}{weeklySalesChange}%
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCalendar}
            title={ko ? "매출 캘린더" : "Revenue calendar"}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "34px", height: "34px", borderRadius: "9px",
              border: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.82)",
              cursor: "pointer", flexShrink: 0, transition: "background 0.15s ease",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" fill="none" />
              <path d="M2 6.5h12" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" />
              <path d="M5.5 1.5v3M10.5 1.5v3" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="5.5" cy="9.5" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="8" cy="9.5" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="10.5" cy="9.5" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="5.5" cy="11.75" r="0.75" fill="rgba(15,23,42,0.45)" />
              <circle cx="8" cy="11.75" r="0.75" fill="rgba(15,23,42,0.45)" />
            </svg>
          </button>
        </div>
      </div>

      <div style={activityChartWrap}>
        {bars.map((bar, barIdx) => {
          const height = bar.sales > 0 ? Math.max(8, (bar.sales / maxSales) * 100) : 4;
          const isSelected = d.dailyDateInput === bar.date;
          return (
            <div key={bar.date} style={{ ...activityBarCol, cursor: "pointer", position: "relative" as const }} onClick={() => {
              const allE = d.dailyEntries as DailyEntry[];
              const entry = allE.find(e => e.date === bar.date);
              d.setDailyDateInput(bar.date);
              if (entry) {
                d.setDailySalesInput(String(Math.round(entry.sales / 10000)));
                d.setDailyCustomersInput(String(entry.customers));
              } else {
                d.setDailySalesInput("");
                d.setDailyCustomersInput("");
              }
            }}>
              {/* 바 위 금액은 아래 라벨로만 표시 — 떠있는 pill 제거 */}
              <div style={{ ...activityBarTrack, height: "120px" }}>
                <div
                  className="bento-meter-fill"
                  style={{
                    ...activityBarFill,
                    height,
                    background: bar.isToday
                      ? "linear-gradient(180deg, #0561fc 0%, rgba(5,97,252,0.6) 100%)"
                      : isSelected
                        ? "linear-gradient(180deg, #0561fc 0%, rgba(5,97,252,0.4) 100%)"
                        : bar.sales > 0
                          ? "linear-gradient(180deg, rgba(5,97,252,0.25) 0%, rgba(5,97,252,0.08) 100%)"
                          : "linear-gradient(180deg, rgba(5,97,252,0.06) 0%, rgba(5,97,252,0.02) 100%)",
                    borderRadius: "8px 8px 4px 4px",
                    boxShadow: bar.isToday ? "0 -4px 14px rgba(5,97,252,0.2)" : isSelected ? "0 -2px 8px rgba(5,97,252,0.1)" : "none",
                    transition: "height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, background 0.3s ease",
                    animationDelay: `${barIdx * 80}ms`,
                  }}
                />
              </div>
              {bar.sales > 0 && (
                <div style={{ fontSize: "10px", fontWeight: 650, color: bar.isToday || isSelected ? "#0561fc" : "rgba(15,23,42,0.3)", marginBottom: "1px", fontVariantNumeric: "tabular-nums" as const, transition: "color 0.2s ease" }}>
                  {bar.sales >= 10000 ? `${Math.round(bar.sales / 10000)}만` : ""}
                </div>
              )}
              <div style={{
                ...activityBarLabel,
                color: bar.isToday ? "#0561fc" : isSelected ? "#0f172a" : "rgba(15,23,42,0.38)",
                fontWeight: bar.isToday || isSelected ? 650 : 500,
                transition: "color 0.2s ease",
              }}>{bar.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── 구분선 ── */}
      <div style={{ height: "1px", background: "rgba(5,97,252,0.06)", margin: "8px 0" }} />

      {/* ── 오늘 입력 + 판매 현황 (풀폭 2열) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignItems: "start" }}>
        {/* ── 왼쪽: 오늘 상태 + 입력/수정 폼 ── */}
        <div>
        {(() => {
          const allE = d.dailyEntries as DailyEntry[];
          const isEditing = editMode;
          const isToday = d.dailyDateInput === todayStr;

          // streak
          let streak = 0;
          const checkDate = new Date();
          if (!todayEntry) checkDate.setDate(checkDate.getDate() - 1);
          for (let i = 0; i < 365; i++) {
            const ds = checkDate.toISOString().slice(0, 10);
            if (allE.some(e => e.date === ds)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
            else break;
          }

          // missed days
          const missedDays: string[] = [];
          for (let i = 0; i < 3; i++) {
            const dt = new Date(); dt.setDate(dt.getDate() - i);
            const ds = dt.toISOString().slice(0, 10);
            if (!allE.some(e => e.date === ds)) missedDays.push(ds);
          }

          // yesterday comparison
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const yEntry = allE.find(e => e.date === yesterday.toISOString().slice(0, 10));
          const yesterdayDiff = todayEntry && yEntry && yEntry.sales > 0
            ? Math.round(((todayEntry.sales - yEntry.sales) / yEntry.sales) * 100)
            : null;

          // 수정 모드 진입
          const enterEdit = (dateStr: string) => {
            const entry = allE.find(e => e.date === dateStr);
            d.setDailyDateInput(dateStr);
            if (entry) {
              d.setDailySalesInput(String(Math.round(entry.sales / 10000)));
              d.setDailyCustomersInput(String(entry.customers));
              setEditMode(true);
            } else {
              d.setDailySalesInput("");
              d.setDailyCustomersInput("");
              setEditMode(false);
            }
          };

          // 삭제
          const handleDelete = (dateStr: string) => {
            const next = allE.filter(e => e.date !== dateStr);
            d.setDailyEntries(next);
            try { localStorage.setItem("dailyEntries", JSON.stringify(next)); } catch {}
            d.setDailySalesInput("");
            d.setDailyCustomersInput("");
            d.setDailyDateInput(todayStr);
            setEditMode(false);
          };

          return (
            <>
              {/* ── 오늘 상태 + 입력 통합 카드 (Apple 스타일) ── */}
              <div style={{ borderRadius: "16px", overflow: "hidden", background: todayEntry ? "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(232,245,233,0.3) 100%)" : "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,244,255,0.4) 100%)", border: `1px solid ${todayEntry ? "rgba(5,150,105,0.08)" : "rgba(5,97,252,0.06)"}`, boxShadow: "0 21px 94px rgba(0,0,0,0.03)" }}>

                {/* 상단: 오늘 매출 히어로 */}
                <div style={{ padding: "20px 22px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: todayEntry ? "#059669" : "#0561fc", boxShadow: todayEntry ? "0 0 8px rgba(5,150,105,0.4)" : "0 0 8px rgba(5,97,252,0.3)" }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(15,23,42,0.5)" }}>
                        {isToday ? (ko ? "오늘" : "Today") : new Date(d.dailyDateInput + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "long", day: "numeric" })}
                      </span>
                      {streak >= 3 && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#e85d04", background: "rgba(232,93,4,0.08)", borderRadius: "8px", padding: "2px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Flame size={11} strokeWidth={1.5} />
                          {streak}{ko ? "일 연속" : "d"}
                        </span>
                      )}
                      {missedDays.length >= 2 && <span style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626", background: "rgba(220,38,38,0.06)", borderRadius: "8px", padding: "2px 10px" }}>{missedDays.length}{ko ? "일째 미기록" : "d missed"}</span>}
                    </div>
                    <input type="date" value={d.dailyDateInput} onChange={(event) => enterEdit(event.target.value)}
                      style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(5,97,252,0.08)", background: "rgba(255,255,255,0.8)", color: "#0f172a", fontWeight: 500 }} />
                  </div>

                  {todayEntry ? (
                    <div>
                      <div style={{ fontSize: "36px", fontWeight: 780, letterSpacing: "-0.05em", color: "#0f172a", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const }} className="bento-number">{fmt(todayEntry.sales)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                        {yesterdayDiff != null && (
                          <span style={{ fontSize: "12px", fontWeight: 650, padding: "3px 10px", borderRadius: "8px", background: yesterdayDiff >= 0 ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.06)", color: yesterdayDiff >= 0 ? "#059669" : "#dc2626" }}>
                            {yesterdayDiff >= 0 ? "↑" : "↓"} {Math.abs(yesterdayDiff)}% {ko ? "어제 대비" : "vs yesterday"}
                          </span>
                        )}
                        <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)" }}>
                          {todayEntry.customers > 0 ? (ko ? `${todayEntry.customers}명 · 객단가 ${fmt(todayEntry.sales / todayEntry.customers)}` : `${todayEntry.customers} · avg ${fmt(todayEntry.sales / todayEntry.customers)}`) : ""}
                        </span>
                        <button type="button" onClick={() => enterEdit(todayStr)} style={{ fontSize: "12px", fontWeight: 600, color: "#0561fc", background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto" }}>{ko ? "수정" : "Edit"}</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 650, color: "rgba(15,23,42,0.3)", lineHeight: 1.3, marginBottom: "4px" }}>{ko ? "미입력" : "Not logged"}</div>
                      <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.35)" }}>{ko ? "상단 입력 바에서 오늘 매출을 기록하세요" : "Use the input bar above to log today's sales"}</div>
                    </div>
                  )}
                </div>

                {/* 하단: 수정 폼 — 기존 데이터 편집 시에만 표시 (신규 입력은 상단 모닝 브리핑) */}
                {isEditing && (
                  <div style={{ padding: "0 22px 16px", borderTop: "1px solid rgba(5,97,252,0.04)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ position: "relative" as const, flex: 1 }}>
                        <input type="text" inputMode="numeric" value={d.dailySalesInput}
                          onChange={(event) => d.setDailySalesInput(event.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="0"
                          style={{ width: "100%", fontSize: "16px", fontWeight: 650, padding: "10px 40px 10px 12px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.08)", background: "rgba(255,255,255,0.9)", color: "#0f172a", fontVariantNumeric: "tabular-nums" as const, outline: "none" }} />
                        <span style={{ position: "absolute" as const, right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "rgba(15,23,42,0.3)", fontWeight: 600 }}>{ko ? "만원" : "₩"}</span>
                      </div>
                      <div style={{ position: "relative" as const, flex: "0 0 90px" }}>
                        <input type="text" inputMode="numeric" value={d.dailyCustomersInput}
                          onChange={(event) => d.setDailyCustomersInput(event.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="0"
                          style={{ width: "100%", fontSize: "16px", fontWeight: 650, padding: "10px 28px 10px 12px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.08)", background: "rgba(255,255,255,0.9)", color: "#0f172a", fontVariantNumeric: "tabular-nums" as const, outline: "none" }} />
                        <span style={{ position: "absolute" as const, right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "rgba(15,23,42,0.3)", fontWeight: 600 }}>{ko ? "명" : ""}</span>
                      </div>
                      <button type="button" onClick={() => {
                        d.handleAddDailyEntry();
                        setEditMode(false);
                      }} disabled={!d.dailySalesInput}
                        style={{
                          flex: "0 0 auto", padding: "10px 16px", borderRadius: "10px", border: "none",
                          background: d.dailySalesInput ? "#0561fc" : "rgba(5,97,252,0.06)",
                          color: d.dailySalesInput ? "#fff" : "rgba(15,23,42,0.25)",
                          fontSize: "13px", fontWeight: 650, cursor: d.dailySalesInput ? "pointer" : "default",
                          transition: "all 0.2s ease", whiteSpace: "nowrap" as const,
                        }} className="bento-btn">
                        {ko ? "수정" : "Update"}
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      <button type="button" onClick={() => handleDelete(d.dailyDateInput)}
                        style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                        {ko ? "삭제" : "Delete"}
                      </button>
                      <button type="button" onClick={() => { d.setDailySalesInput(""); d.setDailyCustomersInput(""); d.setDailyDateInput(todayStr); setEditMode(false); }}
                        style={{ fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.4)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                        {ko ? "취소" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ── 상품별 매출 입력 (접히는 영역) ── */}
        <ProductSalesEntry d={d} ko={ko} fmt={fmt} onSalesApplied={(sales, customers) => {
          setPostEntryReaction(generatePostEntryReaction(sales, customers));
          setTimeout(() => setPostEntryReaction(null), 8000);
        }} />
        </div>

        {/* ── 오른쪽: 오늘 판매 현황 ── */}
        <TodaySalesSummary d={d} ko={ko} fmt={fmt} />
      </div>
    </section>
  );
}
