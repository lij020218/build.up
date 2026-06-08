"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import { ProductSalesEntry } from "./ProductSalesEntry";
import { SubscriptionPlanEntry } from "./SubscriptionPlanEntry";
import { TodaySalesSummary } from "./TodaySalesSummary";
import { activityCard } from "./operationalStyles";
import { AnimatedBar, CountUp } from "./animations";
import { useUnifiedRevenue, revenueSourceLabel } from "../../hooks/useUnifiedRevenue";
import { RevenueBasisChooser } from "./RevenueBasisChooser";
import { calculateBreakEven } from "@foundone/shared";
import { getKstDate } from "../../utils/business-day";

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
  const [showBasis, setShowBasis] = useState(false);

  // suppress unused variable warnings
  void postEntryReaction;
  void weeklySalesChange; // SurvivalBoard로 소유권 이관 (25.04.20)

  // ── 업종별 라벨 분기 — 음식점/소매(객수·명) vs 스타트업/구독(사용자) vs 온라인(주문) ──
  const categoryId = (d.businessCtx as { categoryId?: string } | undefined)?.categoryId ?? "";
  const isStartupCat = categoryId === "startup-tech";
  const isOnlineCat = categoryId === "online-digital";
  const usesSubs = !!d.usesSubscriptions;
  const salesLabel = ko
    ? (usesSubs ? "MRR" : "매출")
    : (usesSubs ? "MRR" : "Sales");
  // 단위 (한국은 만원, EN 은 ₩ 표기 그대로) — 통화는 업종 무관 동일
  const salesUnit = ko ? "만원" : "₩";
  // 사용자수 종류
  const userKindKo = usesSubs || isStartupCat ? "사용자" : isOnlineCat ? "주문" : "고객";
  const userKindEn = usesSubs || isStartupCat ? "Users" : isOnlineCat ? "Orders" : "Cust.";
  const userKind = ko ? userKindKo : userKindEn;
  // suffix (한국 단위) — "사용자 N명" / "주문 N건" / "고객 N명"
  const userUnitKo = isOnlineCat ? "건" : "명";
  const userUnitSuffix = ko ? userUnitKo : "";
  // 평균 단가 라벨 — ARPU(SaaS) / 객단가(default) / 주문단가(online)
  const avgTicketLabel = ko
    ? (usesSubs ? "ARPU" : isOnlineCat ? "주문단가" : "객단가")
    : (usesSubs ? "ARPU" : isOnlineCat ? "AOV" : "Avg ticket");

  // 매출 입력 후 즉시 반응 생성 (AI 호출 없이 수식 기반)
  const generatePostEntryReaction = (sales: number, customers: number) => {
    const allE = d.dailyEntries as DailyEntry[];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yEntry = allE.find(e => e.date === getKstDate(yesterday));

    // BEP 비교 — cost-ratios.ts SSOT (dashboard.ts:calculateHealthMetrics 와 동일 결과 보장)
    const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number; sga?: number; marketing?: number };
    const totalRev = allE.reduce((s, e) => s + e.sales, 0);
    const bep = calculateBreakEven({
      monthlyIngredients: mc.ingredients,
      monthlyFixedCosts: mc.labor + mc.rent + mc.utilities + mc.other + (mc.sga ?? 0) + (mc.marketing ?? 0),
      totalRevenue: totalRev,
      days: allE.length,
      fallbackCogsRate: 0.33,
    });
    const bepDaily = bep.breakEvenDaily;

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
      return ko ? `${avgTicketLabel} ${fmt(ticket)}. 기록 완료` : `${avgTicketLabel} ${fmt(ticket)}. Logged`;
    }
    return ko ? "기록 완료" : "Logged";
  };

  // ── 통합 자동 매출 (PortOne·TOSS Place·CSV·CODEF — 사장님이 연결한 출처들) ──
  // 같은 날 자동 + manual 둘 다 있으면 자동 우선 (실제 결제 데이터).
  const unifiedRev = useUnifiedRevenue(30);
  const portoneMap = Object.fromEntries(unifiedRev.entries.map((e) => [e.date, e]));

  const last7 = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return getKstDate(date);
  });
  const entryMap = Object.fromEntries(recent7Entries.map((entry) => [entry.date, entry]));
  const bars = last7.map((date) => {
    const auto = portoneMap[date];
    const manual = entryMap[date];
    const sales = auto?.sales ?? manual?.sales ?? 0;
    return {
      date,
      sales,
      label: new Date(`${date}T12:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", {
        weekday: ko ? "narrow" : "short",
      }),
      isToday: date === todayStr,
      isAuto: !!auto,                   // PortOne 자동 데이터인지
      hasManualOverride: !!manual && !auto,
    };
  });
  // ── 일 손익분기 (BEP daily) — 매출 흐름에 흑/적자 가이드 라인 표시용 ──
  // cost-ratios.ts SSOT 사용 — dashboard 의 다른 BEP 표시값과 일치 보장.
  const bepDailyForChart = (() => {
    const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number; sga?: number; marketing?: number; interest?: number };
    const allE = d.dailyEntries as DailyEntry[];
    const totalRev = allE.reduce((s, e) => s + e.sales, 0);
    const bep = calculateBreakEven({
      monthlyIngredients: mc.ingredients,
      monthlyFixedCosts:
        mc.labor + mc.rent + mc.utilities + mc.other +
        (mc.sga ?? 0) + (mc.marketing ?? 0) + (mc.interest ?? 0),
      totalRevenue: totalRev,
      days: allE.length,
      fallbackCogsRate: 0.33,
    });
    return bep.breakEvenDaily;
  })();
  const showBepLine = bepDailyForChart > 0;
  // BEP 라인을 maxSales 보다 살짝 위로 빼서 잘리지 않도록 trackMax 보정 (BEP 가 차트 max 보다 클 때)
  const maxSales = Math.max(
    ...bars.map((bar) => bar.sales),
    showBepLine ? bepDailyForChart * 1.15 : 1,
    1,
  );
  const bepHeightPct = showBepLine ? (bepDailyForChart / maxSales) * 100 : 0;

  // ── 오늘/선택 매출 hero 숫자 결정 ──
  const heroBar = bars.find((b) => b.date === d.dailyDateInput) ?? bars.find((b) => b.isToday) ?? bars[bars.length - 1];
  const heroSales = heroBar?.sales ?? 0;
  const heroIsToday = heroBar?.isToday ?? false;
  const heroDateObj = heroBar ? new Date(`${heroBar.date}T12:00:00`) : new Date();
  const heroDateLabel = heroIsToday
    ? (ko ? "오늘" : "Today")
    : heroDateObj.toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "long", day: "numeric" });

  return (
    <section style={activityCard} className="bento-card" data-sales-input>
      {/* ── 헤더: eyebrow + hero 숫자 + CTA pill + 캘린더 ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "11px", fontWeight: 650, letterSpacing: "0.08em",
            textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "6px",
            display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const,
          }}>
            <span>{ko ? "매출 흐름 · 최근 7일" : "Revenue flow · last 7 days"}</span>
            {unifiedRev.anyConnected && (() => {
              const hasChoice = unifiedRev.cardOverlap || unifiedRev.sources.popbill;
              return (
              <button
                type="button"
                onClick={hasChoice ? () => setShowBasis((v) => !v) : undefined}
                title={ko
                  ? `자동 동기화 중: ${connectedSourceList(unifiedRev.sources, ko)}${unifiedRev.lastFetched ? ` · 마지막 ${formatRelativeTime(unifiedRev.lastFetched, ko)}` : ""}${hasChoice ? " · 탭하여 집계 기준 변경" : ""}`
                  : `Auto-synced: ${connectedSourceList(unifiedRev.sources, ko)}${unifiedRev.lastFetched ? ` · last ${formatRelativeTime(unifiedRev.lastFetched, ko)}` : ""}${hasChoice ? " · tap to change basis" : ""}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "2px 8px", borderRadius: "999px",
                  background: "linear-gradient(135deg, rgba(25,25,112,0.06), rgba(59,92,140,0.04))",
                  border: "0.5px solid rgba(25,25,112,0.18)",
                  fontSize: "9.5px", fontWeight: 700,
                  color: "#191970",
                  letterSpacing: "0.04em",
                  textTransform: "none" as const,
                  cursor: hasChoice ? "pointer" : "default",
                }}
              >
                <span style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: "#1d3557",
                  boxShadow: "0 0 4px rgba(25,25,112,0.5)",
                }} />
                {ko ? `자동 ${connectedSourceCount(unifiedRev.sources)}곳` : `Auto ${connectedSourceCount(unifiedRev.sources)} src`}
                {hasChoice && <span style={{ opacity: 0.6, marginLeft: 1 }}>{showBasis ? "▾" : "›"}</span>}
              </button>
              );
            })()}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)", letterSpacing: "-0.005em" }}>
              {heroDateLabel}
            </span>
            <span style={{
              fontSize: "clamp(26px, 3.5vw, 32px)", fontWeight: 700,
              letterSpacing: "-0.04em", color: "#0f172a",
              fontVariantNumeric: "tabular-nums" as const, lineHeight: 1.05,
            }}>
              {heroSales > 0 ? fmt(heroSales) : "—"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onOpenCalendar}
            title={ko ? "매출 캘린더" : "Revenue calendar"}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", borderRadius: "9px",
              border: "1px solid rgba(15,23,42,0.08)",
              background: "rgba(255,255,255,0.82)",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" fill="none" />
              <path d="M2 6.5h12" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" />
              <path d="M5.5 1.5v3M10.5 1.5v3" stroke="rgba(15,23,42,0.55)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 매출 집계 기준 선택 패널 (자동 N곳 배지 탭 시) ── */}
      {showBasis && (
        <RevenueBasisChooser
          ko={ko}
          sources={unifiedRev.sources}
          basis={unifiedRev.basis}
          cardOverlap={unifiedRev.cardOverlap}
          onClose={() => setShowBasis(false)}
          onSaved={() => { void (d as { flushStoreDataImmediate?: () => Promise<void> }).flushStoreDataImmediate?.(); }}
        />
      )}

      {/* ── 차트: 항상 표시. 0매출 막대도 그라데이션 슬롯으로 보임. ──
          1일만 기록해도 그 막대가 즉시 활성화되고, 옆 슬롯들은 비어있어도 일평균·예상 월매출이 계산됨. */}
      {(() => {
        const daysWithSales = bars.filter((b) => b.sales > 0).length;
        const noData = daysWithSales === 0;

        return (
        <>
        {/* 데이터 없을 때만 막대 차트 위에 작은 hint 띠 (차트는 항상 보임) */}
        {noData && (
          <div style={{
            margin: "0 0 12px",
            padding: "10px 14px",
            borderRadius: "12px",
            background: "linear-gradient(90deg, rgba(25,25,112,0.04) 0%, rgba(25,25,112,0.07) 100%)",
            border: "1px dashed rgba(25,25,112,0.16)",
            display: "flex", alignItems: "center", gap: "10px",
            fontSize: "12.5px", color: "#191970", lineHeight: 1.5,
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 22, height: 22, borderRadius: "999px",
              background: "rgba(25,25,112,0.10)",
              fontSize: "11px", fontWeight: 700, color: "#191970",
              flexShrink: 0,
            }}>!</span>
            <span style={{ flex: 1 }}>
              {ko
                ? <>오늘 매출 한 번만 기록해도 <strong>일평균·성장률·예상 월매출</strong>이 즉시 계산됩니다.</>
                : <>One entry unlocks <strong>daily avg, growth, and monthly projection</strong>.</>}
            </span>
          </div>
        )}

        <div style={{ position: "relative" as const }}>
        {/* ── BEP 가이드 라인 — 일 손익분기 가로선 (Profit Gap 시각화) ──
            막대가 이 선 위면 흑자, 아래면 적자. 사용자가 "어제 흑자였나?" 직관적 인지. */}
        {showBepLine && (
          <div
            style={{
              position: "absolute" as const,
              // 바 트랙 (140px) 의 시작점 = 라벨(15px) + margin(10px) = 25px from top
              top: `${25 + (140 - (bepHeightPct / 100) * 140)}px`,
              left: "4px",
              right: "4px",
              height: "0",
              borderTop: "1.5px dashed rgba(182,76,76,0.45)",
              pointerEvents: "none" as const,
              zIndex: 1,
            }}
          >
            <span
              style={{
                position: "absolute" as const,
                top: "-9px",
                right: 0,
                background: "rgba(255,255,255,0.95)",
                color: "#b64c4c",
                fontSize: "9.5px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "999px",
                border: "1px solid rgba(182,76,76,0.25)",
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap" as const,
                lineHeight: 1.3,
              }}
            >
              {ko ? `손익분기 ${fmt(bepDailyForChart)}/일` : `BEP ${fmt(bepDailyForChart)}/d`}
            </span>
          </div>
        )}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "16px",
          alignItems: "end",
          padding: "0 4px",
        }}>
        {bars.map((bar, barIdx) => {
          const height = bar.sales > 0 ? Math.max(6, (bar.sales / maxSales) * 100) : 3;
          const isSelected = d.dailyDateInput === bar.date;
          const isHighlight = bar.isToday || isSelected;
          // 흑자/적자 컬러: BEP 라인 있고 매출 기록이 있을 때만 적용 (선택 시에는 진한 indigo 유지)
          const profitable = showBepLine && bar.sales > 0 && bar.sales >= bepDailyForChart;
          const lossy = showBepLine && bar.sales > 0 && bar.sales < bepDailyForChart;
          const dateObj = new Date(`${bar.date}T12:00:00`);
          const monthDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

          return (
            <button
              key={bar.date}
              type="button"
              onClick={() => {
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
              }}
              style={{
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                gap: 0,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                width: "100%",
              }}
            >
              {/* 바 위 금액 라벨 */}
              <div style={{
                fontSize: "11px",
                fontWeight: isHighlight ? 700 : 500,
                letterSpacing: "-0.01em",
                color: isHighlight ? "#191970" : "rgba(17,17,17,0.32)",
                fontVariantNumeric: "tabular-nums" as const,
                minHeight: "15px",
                marginBottom: "10px",
                transition: "color 0.2s ease, font-weight 0.2s ease",
              }}>
                {bar.sales >= 10000 ? `₩${Math.round(bar.sales / 10000).toLocaleString()}만` : ""}
              </div>

              {/* 바 트랙 — 고정 140px 높이 컨테이너, 바는 28px 고정 너비 */}
              <div style={{
                width: "100%",
                height: "140px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}>
                <AnimatedBar
                  heightPct={height}
                  delay={0.25 + barIdx * 0.06}
                  duration={0.7}
                  style={{
                    width: "28px",
                    minHeight: "6px",
                    borderRadius: "10px 10px 3px 3px",
                    // 우선순위: 선택/오늘 (진한 indigo) > 흑자(soft green) > 적자(soft red) > 기본(회색)
                    background: isHighlight
                      ? "linear-gradient(180deg, #191970 0%, #2d4a6b 100%)"
                      : profitable
                        ? "linear-gradient(180deg, #1d3557 0%, #1d3557 100%)"
                        : lossy
                          ? "linear-gradient(180deg, #b64c4c 0%, #b64c4c 100%)"
                          : "linear-gradient(180deg, #e8ebef 0%, #eff2f5 100%)",
                    boxShadow: isHighlight
                      ? "0 -3px 12px rgba(25,25,112,0.14)"
                      : profitable
                        ? "0 -2px 8px rgba(22,163,74,0.16)"
                        : lossy
                          ? "0 -2px 8px rgba(182,76,76,0.14)"
                          : "none",
                    transition: "background 0.25s ease, box-shadow 0.25s ease",
                  }}
                />
              </div>

              {/* X축 2줄 — 요일(굵게) + 날짜(연하게) */}
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "3px", marginTop: "12px" }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: isHighlight ? 700 : 500,
                  color: isHighlight ? "#0f172a" : "rgba(17,17,17,0.42)",
                  letterSpacing: "-0.005em",
                  transition: "color 0.2s ease",
                }}>
                  {bar.label}
                </span>
                <span style={{
                  fontSize: "10.5px",
                  fontWeight: 500,
                  color: isHighlight ? "rgba(17,17,17,0.5)" : "rgba(17,17,17,0.28)",
                  fontVariantNumeric: "tabular-nums" as const,
                  letterSpacing: "-0.005em",
                }}>
                  {monthDay}
                </span>
              </div>
            </button>
          );
        })}
        </div>
        </div>
        </>
        );
      })()}

      {/* ── 푸터: 7일 합계 + Profit Gap 카운터 (BEP 라인 있을 때만) ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        marginTop: "14px", paddingTop: "14px",
        borderTop: "1px solid rgba(15,23,42,0.05)",
        fontSize: "11.5px", color: "var(--muted)",
        flexWrap: "wrap" as const,
      }}>
        <span>
          {ko ? "7일 합계 " : "7-day total "}
          <CountUp
            to={recent7Sales}
            duration={1.0}
            format={fmt}
            style={{ color: "#0f172a", fontWeight: 650, letterSpacing: "-0.005em" }}
          />
        </span>
        {showBepLine && (() => {
          const profitDays = bars.filter((b) => b.sales > 0 && b.sales >= bepDailyForChart).length;
          const lossDays = bars.filter((b) => b.sales > 0 && b.sales < bepDailyForChart).length;
          if (profitDays + lossDays === 0) return null;
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "linear-gradient(180deg, #1d3557 0%, #1d3557 100%)" }} />
                <span style={{ color: "#1d3557", fontWeight: 700, fontVariantNumeric: "tabular-nums" as const }}>{profitDays}</span>
                <span>{ko ? "흑자" : "profit"}</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "linear-gradient(180deg, #b64c4c 0%, #b64c4c 100%)" }} />
                <span style={{ color: "#b64c4c", fontWeight: 700, fontVariantNumeric: "tabular-nums" as const }}>{lossDays}</span>
                <span>{ko ? "적자" : "loss"}</span>
              </span>
            </span>
          );
        })()}
      </div>

      {/* ── 채널별 매출 내역 (자동수집 연결 시) — 어느 채널에서 얼마 들어왔는지 ── */}
      {unifiedRev.breakdown.length > 0 && (
        <div style={{
          marginTop: "12px", padding: "12px 14px",
          borderRadius: "12px",
          background: "rgba(25,25,112,0.025)",
          border: "0.5px solid rgba(25,25,112,0.10)",
        }}>
          <div style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em",
            textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "8px",
          }}>
            {ko ? "채널별 매출 · 최근 30일" : "By channel · last 30d"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
            {unifiedRev.breakdown.map((item) => (
              <div key={item.source} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12.5px", color: "#3a3f4b", minWidth: 0 }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1d3557", flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{revenueSourceLabel(item.source, ko)}</span>
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" as const, flexShrink: 0 }}>
                  {fmt(Math.round(item.sales))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 구분선 ── */}
      <div style={{ height: "1px", background: "rgba(25,25,112,0.06)", margin: "8px 0" }} />

      {/* ── 오늘 입력 + 판매 현황 — TodaySalesSummary 가 렌더할 상품 있을 때만 2-col, 없으면 풀폭 ── */}
      {(() => {
        const invCount = (d.inventory as Array<{ sellingPrice?: number; itemType?: string }>)
          .filter((item) => item.itemType === "product" && (item.sellingPrice ?? 0) > 0).length;
        const stdCount = (d.products as unknown as Array<{ price?: number }>)
          .filter((p) => (p.price ?? 0) > 0).length;
        const hasProductSummary = invCount + stdCount > 0;
        return (
      <div style={{ display: "grid", gridTemplateColumns: hasProductSummary ? "1fr 1fr" : "1fr", gap: "14px", alignItems: "start" }}>
        {/* ── 왼쪽: 오늘 상태 + 입력/수정 폼 (구독제 사장님은 SubscriptionPlanEntry 만 사용 → 숨김) ── */}
        <div>
        {!usesSubs && (() => {
          const allE = d.dailyEntries as DailyEntry[];
          const isEditing = editMode;
          const isToday = d.dailyDateInput === todayStr;

          // streak
          let streak = 0;
          const checkDate = new Date();
          if (!todayEntry) checkDate.setDate(checkDate.getDate() - 1);
          for (let i = 0; i < 365; i++) {
            const ds = getKstDate(checkDate);
            if (allE.some(e => e.date === ds)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
            else break;
          }

          // missed days
          const missedDays: string[] = [];
          for (let i = 0; i < 3; i++) {
            const dt = new Date(); dt.setDate(dt.getDate() - i);
            const ds = getKstDate(dt);
            if (!allE.some(e => e.date === ds)) missedDays.push(ds);
          }

          // yesterday comparison
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const yEntry = allE.find(e => e.date === getKstDate(yesterday));
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
              <div style={{ borderRadius: "16px", overflow: "hidden", background: todayEntry ? "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,242,250,0.3) 100%)" : "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,244,255,0.4) 100%)", border: `1px solid ${todayEntry ? "rgba(25,25,112,0.08)" : "rgba(25,25,112,0.06)"}`, boxShadow: "0 21px 94px rgba(0,0,0,0.03)" }}>

                {/* 상단: 오늘 매출 히어로 */}
                <div style={{ padding: "20px 22px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: todayEntry ? "#1d3557" : "#191970", boxShadow: todayEntry ? "0 0 8px rgba(25,25,112,0.4)" : "0 0 8px rgba(25,25,112,0.3)" }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>
                        {isToday ? (ko ? "오늘" : "Today") : new Date(d.dailyDateInput + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "long", day: "numeric" })}
                      </span>
                      {streak >= 3 && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#191970", background: "rgba(232,93,4,0.08)", borderRadius: "8px", padding: "2px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Flame size={11} strokeWidth={1.5} />
                          {streak}{ko ? "일 연속" : "d"}
                        </span>
                      )}
                      {missedDays.length >= 2 && <span style={{ fontSize: "11px", fontWeight: 600, color: "#b64c4c", background: "rgba(182,76,76,0.06)", borderRadius: "8px", padding: "2px 10px" }}>{missedDays.length}{ko ? "일째 미기록" : "d missed"}</span>}
                    </div>
                    <input type="date" value={d.dailyDateInput} onChange={(event) => enterEdit(event.target.value)}
                      style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(25,25,112,0.08)", background: "rgba(255,255,255,0.8)", color: "#0f172a", fontWeight: 500 }} />
                  </div>

                  {todayEntry ? (
                    <div>
                      <div style={{ fontSize: "36px", fontWeight: 780, letterSpacing: "-0.05em", color: "#0f172a", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const }} className="bento-number">{fmt(todayEntry.sales)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                        {yesterdayDiff != null && (
                          <span style={{ fontSize: "12px", fontWeight: 650, padding: "3px 10px", borderRadius: "8px", background: yesterdayDiff >= 0 ? "rgba(25,25,112,0.08)" : "rgba(182,76,76,0.06)", color: yesterdayDiff >= 0 ? "#1d3557" : "#b64c4c" }}>
                            {yesterdayDiff >= 0 ? "↑" : "↓"} {Math.abs(yesterdayDiff)}% {ko ? "어제 대비" : "vs yesterday"}
                          </span>
                        )}
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          {todayEntry.customers > 0 ? (ko ? `${todayEntry.customers}${userUnitSuffix} · ${avgTicketLabel} ${fmt(todayEntry.sales / todayEntry.customers)}` : `${todayEntry.customers} ${userKindEn} · ${avgTicketLabel} ${fmt(todayEntry.sales / todayEntry.customers)}`) : ""}
                        </span>
                        <button type="button" onClick={() => enterEdit(todayStr)} style={{ fontSize: "12px", fontWeight: 600, color: "#191970", background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto" }}>{ko ? "수정" : "Edit"}</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Apple-style 인라인 1-step 입력 (soft-fill 필드 + system blue pill) ── */
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (d.dailySalesInput) {
                          if (!d.dailyDateInput) d.setDailyDateInput(todayStr);
                          d.handleAddDailyEntry();
                          setEditMode(false);
                        }
                      }}
                      style={{ marginTop: "2px" }}
                    >
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {/* 매출 — 큰 숫자 soft-fill */}
                        <label style={{ position: "relative" as const, flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            value={d.dailySalesInput}
                            onChange={(event) => {
                              if (!d.dailyDateInput) d.setDailyDateInput(todayStr);
                              d.setDailySalesInput(event.target.value.replace(/[^0-9]/g, ""));
                            }}
                            placeholder="0"
                            aria-label={ko ? `오늘 ${salesLabel} (${salesUnit})` : `Today's ${salesLabel}`}
                            style={{
                              width: "100%",
                              fontSize: "22px",
                              fontWeight: 600,
                              padding: "12px 54px 12px 16px",
                              borderRadius: "12px",
                              border: "none",
                              background: "rgba(118,118,128,0.08)",
                              color: "#0f172a",
                              fontVariantNumeric: "tabular-nums" as const,
                              outline: "none",
                              letterSpacing: "-0.022em",
                              transition: "background 0.18s ease",
                            }}
                            onFocus={(event) => { event.currentTarget.style.background = "rgba(118,118,128,0.12)"; }}
                            onBlur={(event) => { event.currentTarget.style.background = "rgba(118,118,128,0.08)"; }}
                          />
                          <span style={{ position: "absolute" as const, right: "16px", fontSize: "13px", color: "rgba(60,60,67,0.55)", fontWeight: 500, pointerEvents: "none" as const }}>
                            {salesUnit}
                          </span>
                        </label>

                        {/* 사용자/주문/객수 — 보조 */}
                        <label style={{ position: "relative" as const, width: "98px", display: "flex", alignItems: "center" }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={d.dailyCustomersInput}
                            onChange={(event) => d.setDailyCustomersInput(event.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="0"
                            aria-label={userKind}
                            style={{
                              width: "100%",
                              fontSize: "17px",
                              fontWeight: 500,
                              padding: "12px 28px 12px 14px",
                              borderRadius: "12px",
                              border: "none",
                              background: "rgba(118,118,128,0.08)",
                              color: "#0f172a",
                              fontVariantNumeric: "tabular-nums" as const,
                              outline: "none",
                              letterSpacing: "-0.012em",
                              transition: "background 0.18s ease",
                            }}
                            onFocus={(event) => { event.currentTarget.style.background = "rgba(118,118,128,0.12)"; }}
                            onBlur={(event) => { event.currentTarget.style.background = "rgba(118,118,128,0.08)"; }}
                          />
                          <span style={{ position: "absolute" as const, right: "13px", fontSize: "12px", color: "rgba(60,60,67,0.55)", fontWeight: 500, pointerEvents: "none" as const }}>
                            {userUnitSuffix}
                          </span>
                        </label>

                        {/* Submit — system blue pill */}
                        <button
                          type="submit"
                          disabled={!d.dailySalesInput}
                          style={{
                            padding: "10px 18px",
                            borderRadius: "999px",
                            border: "none",
                            background: d.dailySalesInput
                              ? "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)"
                              : "rgba(118,118,128,0.12)",
                            color: d.dailySalesInput ? "#fff" : "rgba(60,60,67,0.32)",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: d.dailySalesInput ? "pointer" : "default",
                            whiteSpace: "nowrap" as const,
                            letterSpacing: "-0.01em",
                            transition: "background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease",
                            height: "44px",
                            boxShadow: d.dailySalesInput ? "0 2px 8px rgba(30,42,85,0.18)" : "none",
                          }}
                          onMouseDown={(event) => { if (d.dailySalesInput) event.currentTarget.style.transform = "scale(0.97)"; }}
                          onMouseUp={(event) => { event.currentTarget.style.transform = "scale(1)"; }}
                          onMouseLeave={(event) => { event.currentTarget.style.transform = "scale(1)"; }}
                        >
                          {ko ? "기록" : "Log"}
                        </button>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "rgba(60,60,67,0.45)", marginTop: "10px", letterSpacing: "-0.005em" }}>
                        {ko ? `Enter ↵ 로 저장 · ${userKindKo}는 비워둬도 OK` : `Press ↵ to save · ${userKindEn} optional`}
                      </div>
                    </form>
                  )}
                </div>

                {/* 하단: 수정 폼 — 기존 데이터 편집 시에만 표시 (신규 입력은 상단 모닝 브리핑) */}
                {isEditing && (
                  <div style={{ padding: "0 22px 16px", borderTop: "1px solid rgba(25,25,112,0.04)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ position: "relative" as const, flex: 1 }}>
                        <input type="text" inputMode="numeric" value={d.dailySalesInput}
                          onChange={(event) => d.setDailySalesInput(event.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="0"
                          style={{ width: "100%", fontSize: "16px", fontWeight: 650, padding: "10px 40px 10px 12px", borderRadius: "10px", border: "1px solid rgba(25,25,112,0.08)", background: "rgba(255,255,255,0.9)", color: "#0f172a", fontVariantNumeric: "tabular-nums" as const, outline: "none" }} />
                        <span style={{ position: "absolute" as const, right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>{salesUnit}</span>
                      </div>
                      <div style={{ position: "relative" as const, flex: "0 0 90px" }}>
                        <input type="text" inputMode="numeric" value={d.dailyCustomersInput}
                          onChange={(event) => d.setDailyCustomersInput(event.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="0"
                          aria-label={userKind}
                          style={{ width: "100%", fontSize: "16px", fontWeight: 650, padding: "10px 28px 10px 12px", borderRadius: "10px", border: "1px solid rgba(25,25,112,0.08)", background: "rgba(255,255,255,0.9)", color: "#0f172a", fontVariantNumeric: "tabular-nums" as const, outline: "none" }} />
                        <span style={{ position: "absolute" as const, right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>{userUnitSuffix}</span>
                      </div>
                      <button type="button" onClick={() => {
                        d.handleAddDailyEntry();
                        setEditMode(false);
                      }} disabled={!d.dailySalesInput}
                        style={{
                          flex: "0 0 auto", padding: "10px 16px", borderRadius: "10px", border: "none",
                          background: d.dailySalesInput
                            ? "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)"
                            : "rgba(25,25,112,0.06)",
                          color: d.dailySalesInput ? "#fff" : "rgba(15,23,42,0.25)",
                          fontSize: "13px", fontWeight: 650, cursor: d.dailySalesInput ? "pointer" : "default",
                          transition: "all 0.2s ease", whiteSpace: "nowrap" as const,
                          boxShadow: d.dailySalesInput ? "0 2px 8px rgba(30,42,85,0.18)" : "none",
                        }} className="bento-btn">
                        {ko ? "수정" : "Update"}
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      <button type="button" onClick={() => handleDelete(d.dailyDateInput)}
                        style={{ fontSize: "11px", fontWeight: 600, color: "#b64c4c", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                        {ko ? "삭제" : "Delete"}
                      </button>
                      <button type="button" onClick={() => { d.setDailySalesInput(""); d.setDailyCustomersInput(""); d.setDailyDateInput(todayStr); setEditMode(false); }}
                        style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                        {ko ? "취소" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ── 상품별 매출 입력 (자영업 — 메뉴/상품 등록 시) ──
            "+ 오늘 입력" 클릭(editMode=true) 시 자동 펼쳐짐. 구독제는 ProductSales 숨김. */}
        {!usesSubs && (
          <ProductSalesEntry
            d={d}
            ko={ko}
            fmt={fmt}
            forceExpanded={editMode}
            onSalesApplied={(sales, customers) => {
              setPostEntryReaction(generatePostEntryReaction(sales, customers));
              setTimeout(() => setPostEntryReaction(null), 8000);
            }}
          />
        )}

        {/* ── 구독 플랜별 가입/이탈 (구독제 사장님만) ──
            usesSubscriptions=true 일 때만 노출. 구독제는 핵심 입력이므로 항상 펼친 상태. */}
        {d.usesSubscriptions && (
          <SubscriptionPlanEntry
            d={d}
            ko={ko}
            fmt={fmt}
            forceExpanded
          />
        )}
        </div>

        {/* ── 오른쪽: 오늘 판매 현황 (상품 등록 시만) ── */}
        {hasProductSummary && <TodaySalesSummary d={d} ko={ko} fmt={fmt} />}
      </div>
        );
      })()}
    </section>
  );
}

// ─── 통합 출처 라벨 helper ─────────────────────────────────────────
function connectedSourceList(s: { portone: boolean; tossplace: boolean; codef: boolean; csv: boolean }, ko: boolean): string {
  const list: string[] = [];
  if (s.portone) list.push(ko ? "포트원" : "PortOne");
  if (s.tossplace) list.push("TOSS Place");
  if (s.codef) list.push(ko ? "10개 카드사 (CODEF)" : "10 cards");
  if (s.csv) list.push("CSV");
  return list.join(" · ");
}
function connectedSourceCount(s: { portone: boolean; tossplace: boolean; codef: boolean; csv: boolean }): number {
  return Number(s.portone) + Number(s.tossplace) + Number(s.codef) + Number(s.csv);
}

// ─── 마지막 N분 전 라벨 ─────────────────────────────────────
function formatRelativeTime(ts: number, ko: boolean): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return ko ? "방금" : "just now";
  if (minutes < 60) return ko ? `${minutes}분 전` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return ko ? `${hours}시간 전` : `${hours}h ago`;
  return ko ? `${Math.floor(hours / 24)}일 전` : `${Math.floor(hours / 24)}d ago`;
}
