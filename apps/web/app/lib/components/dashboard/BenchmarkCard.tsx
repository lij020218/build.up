"use client";

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  detectBusinessSituation,
  matchCaseStudies,
  calculateCostRatios,
  type BusinessSituation,
  type CaseStudy,
} from "@build-up/shared";
import { Lightbulb } from "lucide-react";

// ─── 상황 라벨 매핑 ─────────────────────────────────────────────────────────

const SITUATION_LABELS: Record<BusinessSituation, { ko: string; en: string }> = {
  "funding-crisis": { ko: "생존 전략", en: "Survival" },
  "pmf-not-found": { ko: "시장 검증", en: "PMF Search" },
  "revenue-decline": { ko: "매출 회복", en: "Revenue Recovery" },
  "competitor-pressure": { ko: "경쟁 돌파", en: "Competition" },
  "cost-crisis": { ko: "비용 구조 개선", en: "Cost Fix" },
  "scaling-decision": { ko: "성장 전략", en: "Scaling" },
  "small-biz-turnaround": { ko: "경영 반전", en: "Turnaround" },
  "talent-acquisition": { ko: "인재 확보", en: "Hiring" },
  "marketing-stagnant": { ko: "마케팅 돌파", en: "Marketing" },
  "menu-fatigue": { ko: "메뉴 혁신", en: "Menu Innovation" },
  "delivery-dependency": { ko: "배달 의존 탈피", en: "Delivery Risk" },
  "seasonal-slump": { ko: "비수기 대응", en: "Seasonal Dip" },
  "expansion-ready": { ko: "확장 준비", en: "Expansion" },
  "staff-crisis": { ko: "인력 위기", en: "Staff Crisis" },
  "rent-crisis": { ko: "임대료 위기", en: "Rent Crisis" },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function BenchmarkCard() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;
  const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number } | undefined;
  const catId = d.industryCategoryId ?? d.selectedIndustryCategoryId ?? "food";
  const empCount = (d.employees as Array<unknown>)?.length ?? 0;

  const result = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthEntries = entries.filter(e => e.date.startsWith(currentMonth));
    const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
    const costs = mc ?? { ingredients: 0, labor: 0, rent: 0, utilities: 0, sga: 0, marketing: 0, other: 0, interest: 0 };
    const totalCosts = (costs.ingredients ?? 0) + (costs.labor ?? 0) + (costs.rent ?? 0) + (costs.utilities ?? 0) + (costs.sga ?? 0) + (costs.marketing ?? 0) + (costs.other ?? 0) + (costs.interest ?? 0);

    // 전주 대비 매출 변화
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const recent7 = sorted.slice(-7);
    const prev7 = sorted.slice(-14, -7);
    const r7 = recent7.reduce((s, e) => s + e.sales, 0);
    const p7 = prev7.reduce((s, e) => s + e.sales, 0);
    const weeklyChange = p7 > 0 ? ((r7 - p7) / p7) * 100 : 0;

    // 비용 비율 — cost-ratios.ts SSOT (월간 비용 ÷ 월 환산 매출, 부분월 입력 보정)
    const ratios = calculateCostRatios({
      costs: {
        ingredients: costs.ingredients ?? 0, labor: costs.labor ?? 0, rent: costs.rent ?? 0,
        utilities: costs.utilities ?? 0, sga: costs.sga ?? 0, marketing: costs.marketing ?? 0,
        other: costs.other ?? 0,
      },
      totalRevenue: totalSales,
      days: monthEntries.length,
    });
    const primePct = ratios.primeCostRatio;
    const rentPct = totalSales > 0 ? ratios.rentRatio : undefined;

    const launchDate = (d as Record<string, unknown>).businessLaunchedDate as string | null ?? null;
    const daysSinceLaunch = launchDate
      ? Math.max(0, Math.round((Date.now() - new Date(launchDate).getTime()) / 86400000))
      : 30;

    // 런웨이 계산
    const budget = d.selectedBudget ?? 0;
    const monthlyNet = totalSales - totalCosts;
    const capitalLeft = Math.max(0, budget - totalCosts * (daysSinceLaunch / 30));
    const runway = totalCosts > 0 && monthlyNet < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(monthlyNet))) : -1;

    // 상황 진단
    const situation = detectBusinessSituation({
      categoryId: catId,
      monthlySales: totalSales,
      primeRate: primePct,
      weeklyChange,
      runway,
      daysSinceLaunch,
      employeeCount: empCount,
      rentRatio: rentPct,
    });

    if (!situation) return null;

    const cases = matchCaseStudies(situation, catId).slice(0, 2);
    const label = SITUATION_LABELS[situation] ?? { ko: "경영 전략", en: "Strategy" };

    return { situation, label, cases };
  }, [entries, mc, catId, empCount, d.selectedBudget]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Empty ────────────────────────────────────────────────────────────────

  if (!result || result.cases.length === 0) {
    return (
      <div style={card}>
        <div style={headerRow}>
          <Lightbulb size={14} strokeWidth={1.5} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} />
          <span style={cardTitle}>{ko ? "벤치마킹" : "Benchmarking"}</span>
        </div>
        <div style={emptyState}>
          {ko
            ? "매출 데이터가 쌓이면 비슷한 상황에서 성공한 기업의 전략을 추천합니다"
            : "As data accumulates, we'll recommend strategies from companies that succeeded in similar situations"}
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={card}>
      <div style={headerRow}>
        <Lightbulb size={14} strokeWidth={1.5} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} />
        <span style={cardTitle}>{ko ? "벤치마킹" : "Benchmarking"}</span>
        <span style={situationBadge}>{ko ? result.label.ko : result.label.en}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {result.cases.map((c: CaseStudy) => (
          <div key={c.company} style={caseCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{
                fontSize: "14px", fontWeight: 720, color: "#0f172a",
                letterSpacing: "-0.01em",
              }}>
                {c.company}
              </span>
            </div>

            <div style={{
              fontSize: "13px", fontWeight: 500, color: "rgba(15,23,42,0.7)",
              lineHeight: 1.55, marginBottom: "8px",
            }}>
              {c.oneLiner}
            </div>

            <div style={{
              fontSize: "12px", fontWeight: 600, color: "#191970",
              padding: "6px 10px", borderRadius: "8px",
              background: "rgba(25,25,112,0.04)",
              border: "1px solid rgba(25,25,112,0.06)",
              lineHeight: 1.4,
              display: "flex", alignItems: "flex-start", gap: "6px",
            }}>
              <Lightbulb size={12} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{c.lesson}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "20px",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: "16px",
  gap: "6px",
};

const cardTitle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#191970",
  opacity: 0.7,
  flex: 1,
};

const situationBadge: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  padding: "3px 9px",
  borderRadius: "999px",
  background: "#191970",
  color: "#ffffff",
  letterSpacing: "0.02em",
  boxShadow: "0 2px 6px rgba(25,25,112,0.22)",
};

const emptyState: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(25,25,112,0.55)",
  textAlign: "center",
  padding: "24px 16px",
  lineHeight: 1.55,
  fontWeight: 500,
};

const caseCard: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#ffffff",
  border: "1px solid rgba(25,25,112,0.08)",
  boxShadow: "0 1px 2px rgba(25,25,112,0.03)",
};
