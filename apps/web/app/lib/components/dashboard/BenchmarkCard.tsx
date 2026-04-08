"use client";

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { COST_RATIOS } from "@build-up/shared";
import { Compass } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type BenchmarkItem = {
  label: string;
  yours: string;
  benchmark: string;
  status: "good" | "caution" | "behind";
  tip: string;
};

// ─── Component ──────────────────────────────────────────────────────────────

export function BenchmarkCard() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;
  const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number } | undefined;
  const catId = d.industryCategoryId ?? d.selectedIndustryCategoryId ?? "food";
  const aiInsight = d.aiActions?.insight;

  const items = useMemo<BenchmarkItem[]>(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthEntries = entries.filter(e => e.date.startsWith(currentMonth));
    const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
    const totalCustomers = monthEntries.reduce((s, e) => s + e.customers, 0);
    const costs = mc ?? { ingredients: 0, labor: 0, rent: 0, utilities: 0, other: 0 };
    const totalCosts = costs.ingredients + costs.labor + costs.rent + costs.utilities + costs.other;
    const hasSales = totalSales > 0;
    const hasCosts = totalCosts > 0;

    // 업종별 벤치마크 가져오기
    const ratios = (COST_RATIOS as Record<string, Record<string, unknown>>)[catId];
    const ingRange = (ratios?.ingredients ?? ratios?.cogs ?? ratios?.supplies ?? ratios?.infra ?? [30, 35]) as readonly [number, number];
    const laborRange = (ratios?.labor ?? [25, 30]) as readonly [number, number];
    const primeMax = (ratios?.primeCostMax ?? 65) as number;

    const result: BenchmarkItem[] = [];

    if (hasSales && hasCosts) {
      // 프라임코스트
      const prime = ((costs.ingredients + costs.labor) / totalSales) * 100;
      const primeBench = primeMax;
      result.push({
        label: ko ? "프라임코스트" : "Prime Cost",
        yours: `${prime.toFixed(0)}%`,
        benchmark: `${primeBench}%${ko ? " 이하" : " or less"}`,
        status: prime <= primeBench - 5 ? "good" : prime <= primeBench ? "caution" : "behind",
        tip: prime <= primeBench
          ? (ko ? "업종 평균 이내입니다. 이 수준을 유지하세요." : "Within industry average. Maintain this level.")
          : (ko ? `${(prime - primeBench).toFixed(0)}%p 초과. 재료비 또는 인건비 절감이 필요합니다.` : `${(prime - primeBench).toFixed(0)}%p over. Reduce ingredients or labor costs.`),
      });

      // 재료비율
      const ingRatio = (costs.ingredients / totalSales) * 100;
      result.push({
        label: ko ? "재료비율" : "COGS Ratio",
        yours: `${ingRatio.toFixed(0)}%`,
        benchmark: `${ingRange[0]}–${ingRange[1]}%`,
        status: ingRatio <= ingRange[1] ? "good" : ingRatio <= ingRange[1] + 5 ? "caution" : "behind",
        tip: ingRatio <= ingRange[1]
          ? (ko ? "적정 범위입니다." : "Within range.")
          : (ko ? "업종 평균보다 높습니다. 공급처 단가를 재점검하세요." : "Above average. Review supplier pricing."),
      });

      // 인건비율
      const laborRatio = (costs.labor / totalSales) * 100;
      result.push({
        label: ko ? "인건비율" : "Labor Ratio",
        yours: `${laborRatio.toFixed(0)}%`,
        benchmark: `${laborRange[0]}–${laborRange[1]}%`,
        status: laborRatio <= laborRange[1] ? "good" : laborRatio <= laborRange[1] + 5 ? "caution" : "behind",
        tip: laborRatio <= laborRange[1]
          ? (ko ? "적정 범위입니다." : "Within range.")
          : (ko ? "인건비가 높습니다. 피크타임 인력 배치를 최적화하세요." : "High labor. Optimize peak-hour staffing."),
      });
    }

    if (hasSales && totalCustomers > 0) {
      // 객단가
      const avgTicket = totalSales / totalCustomers;
      const benchTicket = catId === "cafe-dessert" ? 5500 : catId === "food" ? 12000 : catId === "beauty" ? 35000 : catId === "fitness" ? 80000 : 15000;
      result.push({
        label: ko ? "객단가" : "Avg Ticket",
        yours: `${Math.round(avgTicket / 100) * 100}${ko ? "원" : "₩"}`,
        benchmark: `${Math.round(benchTicket / 1000)}${ko ? "천원대" : "K avg"}`,
        status: avgTicket >= benchTicket * 0.9 ? "good" : avgTicket >= benchTicket * 0.7 ? "caution" : "behind",
        tip: avgTicket >= benchTicket * 0.9
          ? (ko ? "업종 평균 이상입니다." : "Above average.")
          : (ko ? "세트메뉴나 추가 판매로 객단가를 높여보세요." : "Try set menus or upselling to increase ticket."),
      });
    }

    return result;
  }, [entries, mc, catId, ko]);

  // ─── Empty state ──────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div style={card}>
        <div style={headerRow}>
          <Compass size={14} strokeWidth={2} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} />
          <span style={cardTitle}>{ko ? "벤치마크" : "Benchmark"}</span>
        </div>
        <div style={emptyState}>
          {ko
            ? "매출과 비용을 입력하면 업종 평균과 비교 분석이 시작됩니다"
            : "Enter sales and costs to see how you compare to industry averages"}
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={card}>
      <div style={headerRow}>
        <Compass size={14} strokeWidth={2} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} />
        <span style={cardTitle}>{ko ? "업종 벤치마크" : "Industry Benchmark"}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map((item) => (
          <div key={item.label} style={rowStyle}>
            {/* Label + status dot */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "90px" }}>
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                background: item.status === "good" ? "#34C759" : item.status === "caution" ? "#FF9F0A" : "#FF3B30",
                boxShadow: `0 0 6px ${item.status === "good" ? "#34C75940" : item.status === "caution" ? "#FF9F0A40" : "#FF3B3040"}`,
              }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.7)" }}>{item.label}</span>
            </div>

            {/* Yours vs Benchmark */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flex: 1, justifyContent: "flex-end" }}>
              <span style={{
                fontSize: "15px", fontWeight: 720, fontVariantNumeric: "tabular-nums",
                color: item.status === "good" ? "#34C759" : item.status === "caution" ? "#FF9F0A" : "#FF3B30",
                letterSpacing: "-0.02em",
              }}>
                {item.yours}
              </span>
              <span style={{ fontSize: "10px", color: "rgba(15,23,42,0.35)" }}>
                / {item.benchmark}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AI 팁 (첫 번째 behind 항목) */}
      {(() => {
        const behindItem = items.find(i => i.status === "behind") ?? items.find(i => i.status === "caution");
        const tip = behindItem?.tip ?? aiInsight;
        if (!tip) return null;
        return (
          <div style={{
            marginTop: "14px", padding: "10px 12px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(29,53,87,0.03) 0%, rgba(52,199,89,0.02) 100%)",
            border: "1px solid rgba(29,53,87,0.05)",
          }}>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(29,53,87,0.4)", marginBottom: "4px" }}>
              AI TIP
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
              {tip}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "20px",
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.025)",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: "16px",
};

const cardTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
};

const emptyState: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(15,23,42,0.35)",
  textAlign: "center",
  padding: "24px 16px",
  lineHeight: 1.5,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};
