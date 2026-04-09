"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  calculateSalesBreakdown,
  calculateMoM,
  calculateMonthlyPnL,
} from "@build-up/shared";
import type { DailyEntry, MonthlyCosts } from "../../useDashboard";
import { BarChart3, PenLine, Target } from "lucide-react";
import { useRoadmapStore } from "../../stores/roadmap-store";

// ─── Constants ──────────────────────────────────────────────────────────────

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif";
const PRIMARY = "#1d3557";
const GREEN = "#34C759";
const YELLOW = "#FF9F0A";
const RED = "#FF3B30";
const LABEL_COLOR = "rgba(15,23,42,0.4)";
const CARD_RATIO = 0.85; // rough card-payment ratio for deposit estimate

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatWon(v: number, ko: boolean): string {
  if (ko) {
    if (Math.abs(v) >= 100_000_000)
      return `${(v / 100_000_000).toFixed(1)}억`;
    if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}만`;
    return `${v.toLocaleString("ko-KR")}원`;
  }
  if (Math.abs(v) >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString("en-US");
}

function trafficLight(
  value: number,
  greenMax: number,
  yellowMax: number,
): string {
  if (value < greenMax) return GREEN;
  if (value <= yellowMax) return YELLOW;
  return RED;
}

function changeArrow(pct: number): string {
  if (pct > 0) return `+${pct.toFixed(1)}%`;
  if (pct < 0) return `${pct.toFixed(1)}%`;
  return "0%";
}

function changeColor(pct: number): string {
  if (pct > 0) return GREEN;
  if (pct < 0) return RED;
  return LABEL_COLOR;
}

function getYesterday(entries: DailyEntry[]): DailyEntry | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0];
}

function getSameWeekdayLastWeek(
  entries: DailyEntry[],
  referenceDate: string,
): DailyEntry | null {
  const ref = new Date(referenceDate);
  const target = new Date(ref);
  target.setDate(target.getDate() - 7);
  const targetStr = target.toISOString().slice(0, 10);
  return entries.find((e) => e.date === targetStr) ?? null;
}

function generateFallbackInsight(
  breakdown: ReturnType<typeof calculateSalesBreakdown>,
  yesterdaySales: number,
  sameWeekdayChange: number | null,
  ko: boolean,
): string {
  if (!breakdown) {
    return ko
      ? "매출 데이터가 쌓이면 매일 아침 경영 브리핑을 드리겠습니다."
      : "Once you log sales, you'll receive a daily business briefing here.";
  }

  const salesStr = formatWon(yesterdaySales, ko);
  const weekStr = sameWeekdayChange !== null ? `${sameWeekdayChange > 0 ? "+" : ""}${sameWeekdayChange.toFixed(0)}%` : null;

  // 매출 변화의 주된 원인을 문장으로 설명
  if (breakdown.primaryDriver === "ticket" && Math.abs(breakdown.avgTicketChange) > 3) {
    const dir = breakdown.avgTicketChange > 0;
    return ko
      ? `어제 매출 ${salesStr}${weekStr ? ` (전주 대비 ${weekStr})` : ""}. ${dir ? "객단가가 올랐습니다. 세트메뉴나 추가 주문이 늘고 있는지 확인해보세요." : "객단가가 떨어졌습니다. 메뉴 구성이나 가격 전략을 점검하세요."}`
      : `Yesterday's sales were ${salesStr}${weekStr ? ` (${weekStr} vs last week)` : ""}. ${dir ? "Average ticket is up — check if upselling is working." : "Average ticket dropped — review menu mix and pricing."}`;
  }

  if (breakdown.primaryDriver === "customers" && Math.abs(breakdown.customersChange) > 3) {
    const dir = breakdown.customersChange > 0;
    return ko
      ? `어제 매출 ${salesStr}${weekStr ? ` (전주 대비 ${weekStr})` : ""}. ${dir ? "방문 고객이 늘고 있습니다. 이 추세를 유지할 마케팅을 준비하세요." : "고객수가 줄고 있습니다. 단골 이탈이 없는지 점검이 필요합니다."}`
      : `Yesterday's sales were ${salesStr}${weekStr ? ` (${weekStr} vs last week)` : ""}. ${dir ? "Foot traffic is growing — prepare marketing to sustain this." : "Customer count is dropping — check if regulars are churning."}`;
  }

  if (breakdown.primaryDriver === "both") {
    return ko
      ? `어제 매출 ${salesStr}${weekStr ? ` (전주 대비 ${weekStr})` : ""}. 고객수와 객단가 모두 변동이 있습니다. 주간 추세를 좀 더 지켜보세요.`
      : `Yesterday's sales were ${salesStr}${weekStr ? ` (${weekStr} vs last week)` : ""}. Both traffic and ticket size shifted — monitor the weekly trend.`;
  }

  if (weekStr) {
    return ko
      ? `어제 매출 ${salesStr}, 전주 동요일 대비 ${weekStr}입니다. 안정적인 흐름이니 현재 운영을 유지하세요.`
      : `Yesterday's sales were ${salesStr}, ${weekStr} vs the same day last week. Steady operations — maintain your current approach.`;
  }

  return ko
    ? "안정적인 영업 흐름입니다. 현재 운영 기조를 유지하세요."
    : "Operations are running steady. Maintain your current approach.";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MorningBriefing() {
  const d = useDashboardCtx();

  const ko = d.language === "ko";
  const entries = (d.dailyEntries ?? []) as DailyEntry[];
  const costs = (d.monthlyCosts ?? {
    ingredients: 0,
    labor: 0,
    rent: 0,
    utilities: 0,
    other: 0,
  }) as MonthlyCosts;

  // ── Yesterday's data
  const yesterday = getYesterday(entries);
  const yesterdaySales = yesterday?.sales ?? 0;
  const yesterdayCustomers = yesterday?.customers ?? 0;

  // ── Same weekday last week comparison
  const sameWeekday = yesterday
    ? getSameWeekdayLastWeek(entries, yesterday.date)
    : null;
  const weekdayChange =
    sameWeekday && sameWeekday.sales > 0
      ? ((yesterdaySales - sameWeekday.sales) / sameWeekday.sales) * 100
      : null;

  // ── Monthly P&L for operating margin and prime cost
  const pnl = calculateMonthlyPnL(entries, costs);
  const operatingMargin = pnl.operatingMargin;
  const totalSales = pnl.totalRevenue;
  const primeCostPct =
    totalSales > 0
      ? ((costs.ingredients + costs.labor) / totalSales) * 100
      : 0;

  // ── Estimated deposit (card settlement, ~D+2)
  const estDeposit = Math.round(yesterdaySales * CARD_RATIO);

  // ── AI Insight
  const breakdown = calculateSalesBreakdown(entries, "week");
  const aiInsight = d.aiActions?.insight;
  const insightText =
    aiInsight ||
    generateFallbackInsight(
      breakdown,
      yesterdaySales,
      weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      ko,
    );

  // ── Has any data to show?
  const hasData = entries.length > 0;
  const hasCosts =
    costs.ingredients + costs.labor + costs.rent + costs.utilities + costs.other >
    0;

  // ── Startup detection
  const isStartup = d.industryCategoryId === "startup-tech" || (d.businessCtx as Record<string, unknown>)?.categoryId === "startup-tech";

  // ── Startup-specific calculations
  const monthlyBurn = costs.ingredients + costs.labor + costs.rent + costs.utilities + costs.other;
  const selectedBudget = (d.selectedBudget ?? 0) as number;
  const runway = monthlyBurn > 0 ? Math.round(selectedBudget / monthlyBurn * 10) / 10 : 0;
  const userChange = sameWeekday && sameWeekday.customers > 0
    ? ((yesterdayCustomers - sameWeekday.customers) / sameWeekday.customers) * 100
    : null;

  // ── KPI cards config
  type KpiCard = {
    label: string;
    value: string;
    change: number | null;
    changeLabel: string;
    color?: string;
    hint?: string;
  };

  const kpis: KpiCard[] = isStartup ? [
    {
      label: ko ? "매출 / MRR" : "REVENUE / MRR",
      value: hasData ? formatWon(yesterdaySales, ko) : "--",
      change: weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter revenue") : undefined,
    },
    {
      label: ko ? "사용자" : "USERS",
      value: hasData ? yesterdayCustomers.toLocaleString(ko ? "ko-KR" : "en-US") : "--",
      change: userChange !== null ? Math.round(userChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "사용자 수를 입력하세요" : "Enter users") : undefined,
    },
    {
      label: ko ? "번레이트" : "BURN RATE",
      value: hasCosts ? formatWon(monthlyBurn, ko) + (ko ? "/월" : "/mo") : "--",
      change: null,
      changeLabel: ko ? "월 총 비용" : "monthly total",
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
    },
    {
      label: ko ? "런웨이" : "RUNWAY",
      value: hasCosts && selectedBudget > 0 ? `${runway}${ko ? "개월" : "mo"}` : "--",
      change: null,
      changeLabel: ko ? "예산 ÷ 번레이트" : "budget ÷ burn",
      color: hasCosts && selectedBudget > 0
        ? runway <= 3 ? RED : runway <= 6 ? YELLOW : GREEN
        : undefined,
      hint: !hasCosts || selectedBudget <= 0 ? (ko ? "예산과 비용을 입력하세요" : "Enter budget & costs") : undefined,
    },
  ] : [
    {
      label: ko ? "어제 매출" : "YESTERDAY",
      value: hasData ? formatWon(yesterdaySales, ko) : "--",
      change: weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter sales") : undefined,
    },
    {
      label: ko ? "영업이익률" : "OP. MARGIN",
      value: hasCosts ? `${operatingMargin.toFixed(1)}%` : "--",
      change: null,
      changeLabel: "",
      color: hasCosts
        ? trafficLight(100 - operatingMargin, 85, 95)
        : undefined,
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
    },
    {
      label: ko ? "원가율" : "PRIME COST",
      value: hasCosts ? `${primeCostPct.toFixed(1)}%` : "--",
      change: null,
      changeLabel: "",
      color: hasCosts ? trafficLight(primeCostPct, 60, 65) : undefined,
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
    },
    {
      label: ko ? "카드 정산 예정" : "EST. DEPOSIT",
      value: hasData ? formatWon(estDeposit, ko) : "--",
      change: null,
      changeLabel: ko ? "D+2 예상" : "D+2 est.",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter sales") : undefined,
    },
  ];

  // ── 오늘 매출 미입력 여부 확인
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(e => e.date === todayStr);
  const needsInput = !todayEntry;

  // ── Empty state → 아름다운 입력 유도 카드
  if (!hasData) {
    return (
      <section style={sectionStyle}>
        {/* 입력 유도 카드 */}
        <div style={{
          borderRadius: "24px",
          padding: "40px 32px",
          background: "linear-gradient(135deg, rgba(29,53,87,0.03) 0%, rgba(52,199,89,0.04) 100%)",
          border: "1px solid rgba(29,53,87,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          textAlign: "center" as const,
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "linear-gradient(135deg, #1d3557 0%, #2d4a7a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(29,53,87,0.2)",
          }}>
            <BarChart3 size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <h2 style={{
            fontSize: "20px", fontWeight: 700, color: "#0f172a",
            letterSpacing: "-0.02em", marginBottom: "8px",
          }}>
            {ko ? "첫 매출을 기록해 보세요" : "Record your first sales"}
          </h2>
          <p style={{
            fontSize: "14px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6,
            maxWidth: "340px", margin: "0 auto 24px",
          }}>
            {ko
              ? (isStartup ? "매출과 사용자 수를 입력하면 AI가 매일 경영 브리핑을 제공합니다." : "매출과 고객 수를 입력하면 AI가 매일 경영 브리핑을 제공합니다.")
              : (isStartup ? "Enter revenue and user count to unlock daily AI briefings." : "Enter sales and customers to unlock daily AI business briefings.")}
          </p>

          {/* 인라인 입력 필드 */}
          <div style={{
            display: "flex", gap: "10px", justifyContent: "center",
            flexWrap: "wrap" as const, maxWidth: "420px", margin: "0 auto",
          }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder={ko ? (isStartup ? "매출/MRR (만원)" : "매출 (만원)") : (isStartup ? "Revenue (만원)" : "Sales (만원)")}
              value={d.dailySalesInput}
              onChange={(e) => d.setDailySalesInput(e.target.value)}
              style={{
                flex: "1 1 120px", padding: "14px 16px", borderRadius: "14px",
                border: "1.5px solid rgba(29,53,87,0.12)", background: "rgba(255,255,255,0.9)",
                fontSize: "15px", fontWeight: 600, fontFamily: FONT_STACK,
                outline: "none", textAlign: "center" as const,
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(29,53,87,0.12)"; }}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder={ko ? (isStartup ? "사용자 수" : "고객 수") : (isStartup ? "Users" : "Customers")}
              value={d.dailyCustomersInput}
              onChange={(e) => d.setDailyCustomersInput(e.target.value)}
              style={{
                flex: "1 1 100px", padding: "14px 16px", borderRadius: "14px",
                border: "1.5px solid rgba(29,53,87,0.12)", background: "rgba(255,255,255,0.9)",
                fontSize: "15px", fontWeight: 600, fontFamily: FONT_STACK,
                outline: "none", textAlign: "center" as const,
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(29,53,87,0.12)"; }}
            />
            <button
              type="button"
              onClick={() => d.handleAddDailyEntry()}
              disabled={!d.dailySalesInput}
              style={{
                flex: "0 0 auto", padding: "14px 28px", borderRadius: "14px",
                border: "none", background: d.dailySalesInput ? PRIMARY : "rgba(15,23,42,0.08)",
                color: d.dailySalesInput ? "#fff" : "rgba(15,23,42,0.3)",
                fontSize: "15px", fontWeight: 700, cursor: d.dailySalesInput ? "pointer" : "default",
                fontFamily: FONT_STACK,
                boxShadow: d.dailySalesInput ? "0 4px 14px rgba(29,53,87,0.25)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {ko ? "기록" : "Save"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      {/* ── 오늘 매출 미입력 시 상단 입력 바 ── */}
      {needsInput && (
        <div style={{
          borderRadius: "12px",
          padding: "8px 14px",
          background: "linear-gradient(135deg, rgba(29,53,87,0.03) 0%, rgba(52,199,89,0.02) 100%)",
          border: "1px solid rgba(29,53,87,0.06)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: PRIMARY, whiteSpace: "nowrap" as const, display: "flex", alignItems: "center", gap: "4px" }}>
            <PenLine size={12} strokeWidth={2} />
            {ko ? "오늘" : "Today"}
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder={ko ? (isStartup ? "매출/MRR" : "매출 (만원)") : (isStartup ? "Revenue" : "Sales (만원)")}
            value={d.dailySalesInput}
            onChange={(e) => d.setDailySalesInput(e.target.value)}
            style={{
              flex: "1 1 100px", padding: "7px 12px", borderRadius: "8px",
              border: "1px solid rgba(29,53,87,0.08)", background: "rgba(255,255,255,0.9)",
              fontSize: "13px", fontWeight: 600, fontFamily: FONT_STACK,
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(29,53,87,0.08)"; }}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder={ko ? (isStartup ? "사용자" : "고객수") : (isStartup ? "Users" : "Cust.")}
            value={d.dailyCustomersInput}
            onChange={(e) => d.setDailyCustomersInput(e.target.value)}
            style={{
              flex: "0 1 72px", padding: "7px 12px", borderRadius: "8px",
              border: "1px solid rgba(29,53,87,0.08)", background: "rgba(255,255,255,0.9)",
              fontSize: "13px", fontWeight: 600, fontFamily: FONT_STACK,
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(29,53,87,0.08)"; }}
          />
          <button
            type="button"
            onClick={() => d.handleAddDailyEntry()}
            disabled={!d.dailySalesInput}
            style={{
              padding: "7px 16px", borderRadius: "8px",
              border: "none", background: d.dailySalesInput ? PRIMARY : "rgba(15,23,42,0.05)",
              color: d.dailySalesInput ? "#fff" : "rgba(15,23,42,0.2)",
              fontSize: "12px", fontWeight: 700, cursor: d.dailySalesInput ? "pointer" : "default",
              fontFamily: FONT_STACK, whiteSpace: "nowrap" as const,
              boxShadow: d.dailySalesInput ? "0 2px 6px rgba(29,53,87,0.18)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {ko ? "기록" : "Save"}
          </button>
        </div>
      )}

      {/* ── AI Briefing Card ── */}
      <div style={briefingCardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "6px",
          }}
        >
          <div style={aiBadgeStyle}>AI</div>
          <span style={aiBadgeLabelStyle}>
            {ko ? "모닝 브리핑" : "Morning Briefing"}
          </span>
        </div>
        <p style={insightTextStyle}>{insightText}</p>
      </div>

      {/* ── 4 Hero KPI Cards ── */}
      <div className="morning-kpi-grid" style={gridStyle}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{kpi.label}</div>
            <div
              className="num-animate"
              style={{
                ...kpiValueStyle,
                color: kpi.color ?? PRIMARY,
              }}
            >
              {kpi.value}
            </div>
            {kpi.change !== null && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: changeColor(kpi.change),
                  marginTop: "4px",
                  fontFamily: FONT_STACK,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {changeArrow(kpi.change)}{" "}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: LABEL_COLOR,
                  }}
                >
                  {kpi.changeLabel}
                </span>
              </div>
            )}
            {kpi.change === null && kpi.changeLabel && !kpi.hint && (
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: LABEL_COLOR,
                  marginTop: "6px",
                  letterSpacing: "0.02em",
                }}
              >
                {kpi.changeLabel}
              </div>
            )}
            {kpi.hint && (
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#FF9F0A",
                  marginTop: "6px",
                  letterSpacing: "0.01em",
                }}
              >
                {kpi.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── 북극성 지표 카드 ── */}
      {(() => {
        const rdDecisions = useRoadmapStore.getState().decisions;
        const geInputs = (rdDecisions["growth-engine"] as Record<string, unknown> | undefined)?.inputs as Record<string, unknown> | undefined;
        const nsType = (geInputs?.northStarType as string) ?? "";
        const nsName = (geInputs?.northStarMetricName as string) ?? "";
        if (!nsType && !nsName) return null;
        const typeLabel: Record<string, { ko: string; en: string }> = {
          saas: { ko: "SaaS", en: "SaaS" },
          marketplace: { ko: "마켓플레이스", en: "Marketplace" },
          content: { ko: "콘텐츠", en: "Content" },
          commerce: { ko: "커머스", en: "Commerce" },
        };
        const tl = typeLabel[nsType];
        return (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 16px", borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(5,150,105,0.04) 0%, rgba(5,150,105,0.01) 100%)",
            border: "1px solid rgba(5,150,105,0.1)",
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "9px",
              background: "rgba(5,150,105,0.08)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Target size={16} color="#059669" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                {ko ? "북극성 지표" : "NORTH STAR"}{tl ? ` · ${ko ? tl.ko : tl.en}` : ""}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 680, color: "#0f172a", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {nsName || (ko ? "지표명을 입력하세요" : "Set your metric name")}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 7일 매출 미니 차트 ── */}
      {(() => {
        const sorted = [...entries]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);
        if (sorted.length < 2) return null;

        const maxSales = Math.max(...sorted.map(e => e.sales), 1);
        const avgSales = sorted.reduce((s, e) => s + e.sales, 0) / sorted.length;
        const dayLabels = ko
          ? ["일", "월", "화", "수", "목", "금", "토"]
          : ["S", "M", "T", "W", "T", "F", "S"];

        return (
          <div style={{
            borderRadius: "20px",
            padding: "18px 20px",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.025)",
          }}>
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase" as const, color: LABEL_COLOR,
              }}>
                {ko ? "최근 7일 매출" : "LAST 7 DAYS"}
              </div>
              <div style={{
                fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.5)",
              }}>
                {ko ? `일평균 ${formatWon(avgSales, ko)}` : `Avg ${formatWon(avgSales, ko)}/day`}
              </div>
            </div>

            {/* 바 차트 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${sorted.length}, 1fr)`,
              gap: "6px",
              alignItems: "end",
              height: "160px",
              position: "relative" as const,
            }}>
              {/* 평균선 */}
              <div style={{
                position: "absolute" as const,
                left: 0, right: 0,
                bottom: `${(avgSales / maxSales) * 100}%`,
                height: "1px",
                background: "rgba(15,23,42,0.08)",
                borderTop: "1px dashed rgba(15,23,42,0.12)",
                zIndex: 1,
              }} />

              {sorted.map((entry, i) => {
                const height = maxSales > 0 ? (entry.sales / maxSales) * 100 : 0;
                const isToday = entry.date === new Date().toISOString().slice(0, 10);
                const isYesterday = i === sorted.length - 1 && !isToday;
                const dayOfWeek = new Date(entry.date).getDay();
                const barColor = isToday
                  ? PRIMARY
                  : entry.sales >= avgSales
                    ? "rgba(52,199,89,0.65)"
                    : "rgba(15,23,42,0.12)";

                return (
                  <div key={entry.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    {/* 매출 라벨 (호버 없이 항상 표시 — 마지막 2개만) */}
                    {(isToday || isYesterday) && (
                      <div style={{
                        fontSize: "10px", fontWeight: 600,
                        color: isToday ? PRIMARY : "rgba(15,23,42,0.5)",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap" as const,
                      }}>
                        {formatWon(entry.sales, ko)}
                      </div>
                    )}

                    {/* 바 */}
                    <div style={{
                      width: "100%",
                      maxWidth: "32px",
                      height: `${Math.max(height, 3)}%`,
                      borderRadius: "6px 6px 4px 4px",
                      background: barColor,
                      transition: "height 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                      position: "relative" as const,
                      ...(isToday ? { boxShadow: `0 2px 8px ${PRIMARY}30` } : {}),
                    }} />

                    {/* 요일 라벨 */}
                    <div style={{
                      fontSize: "10px",
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? PRIMARY : "rgba(15,23,42,0.35)",
                      lineHeight: 1,
                    }}>
                      {dayLabels[dayOfWeek]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Keyframes + responsive grid ── */}
      <style>{`
        @keyframes numberSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .num-animate {
          animation: numberSlideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @media (max-width: 640px) {
          .morning-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  fontFamily: FONT_STACK,
};

const briefingCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  padding: "18px 20px",
  background:
    "linear-gradient(135deg, rgba(219,234,254,0.28) 0%, rgba(209,250,229,0.18) 100%)",
  border: "1px solid rgba(0,0,0,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const aiBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "16px",
  borderRadius: "4px",
  background: "linear-gradient(135deg, #1d3557, #457b9d)",
  color: "#fff",
  fontSize: "8px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  lineHeight: 1,
};

const aiBadgeLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: LABEL_COLOR,
};

const insightTextStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: 1.55,
  color: "rgba(15,23,42,0.7)",
  margin: 0,
  fontFamily: FONT_STACK,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "10px",
};

// Responsive: we use a CSS media query via <style> for 2-col mobile,
// but also set a min-width to ensure graceful degradation.
// For inline-style only approach, the grid will naturally wrap via
// the container query below.

const kpiCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  padding: "18px 16px",
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow:
    "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.025)",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  minWidth: 0,
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: LABEL_COLOR,
  marginBottom: "8px",
  lineHeight: 1,
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 36px)",
  fontWeight: 750,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
  fontFamily: FONT_STACK,
  color: PRIMARY,
};
