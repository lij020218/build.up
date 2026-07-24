"use client";

/**
 * FinanceSurface — "재무" 탭 (2026-07-24 신설, 보고서와 완전 분리).
 *
 *  정체성: 유일하게 비어 있던 "미래·판단" 축. 회고(보고서 탭)와 사용 맥락이 달라 독립.
 *   ① 이번 달 손익분기 트래커 (월간 진행 흡수 — 기준 = 월 비용 합, 미입력 시 잠금)
 *   ② 생존 보드 + 13주 자금흐름 (대시보드 Tier2 이관)
 *   ③ 12개월 시뮬레이션 — What-If 레버 + 성장 시나리오 (Tier4 What-If 이관·확장, finance-sim SSOT)
 *   ④ 매출 예측 (Tier5 이관)
 *
 *  정직성: 투영은 "가정 유지 시 산술"(예측 아님) — 시뮬 카드에 라벨 병기. 데이터 없으면 잠금.
 *  iOS 미러: FinanceView.swift
 */

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { useDashboardComputed } from "../../hooks/useDashboardComputed";
import { Cashflow13WeekForecastCard } from "../dashboard/Cashflow13WeekForecastCard";
import { SurvivalBoardCard } from "../dashboard/SurvivalBoardCard";
import { WhatIfSimulator } from "../dashboard/WhatIfSimulator";
import { ForecastCard } from "../dashboard/ForecastCard";

const MIDNIGHT = "#191970";

const finCard: React.CSSProperties = {
  background: "white", borderRadius: 16, border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04)", padding: "16px 18px",
};
const finLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 750, color: MIDNIGHT, letterSpacing: "0.04em", textTransform: "uppercase",
};

export function FinanceSurface() {
  const d = useDashboardCtx();
  const c = useDashboardComputed(d);
  const ko = d.language === "ko";

  return (
    <main style={{ width: "min(1080px, calc(100vw - 32px))", margin: "0 auto", padding: "24px 0 80px", display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.65, letterSpacing: "0.12em" }}>FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 750, letterSpacing: "-0.025em", color: "#0f172a", margin: 0 }}>
          {ko ? "재무" : "Finance"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
          {ko
            ? "이번 달 손익분기, 13주 자금흐름, 12개월 시뮬레이션 — 앞으로 어떻게 되는지, 뭘 바꾸면 달라지는지. 모든 수치는 사장님 입력 데이터 기반."
            : "Break-even, 13-week cash flow, 12-month simulation — where you're heading and what changes it. Grounded in your inputs only."}
        </p>
      </header>

      {/* ① 이번 달 손익분기 트래커 */}
      {(() => {
        const bep = c.totalCosts;
        if (bep <= 0) {
          return (
            <div style={finCard}>
              <div style={finLabel}>{ko ? "이번 달 손익분기" : "This month vs break-even"}</div>
              <div style={{ fontSize: 13, color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
                {ko ? "월 비용(임대료·인건비 등)을 입력하면 손익분기 진행률이 계산돼요. — 내 가게 > 비용 관리" : "Enter monthly costs to track break-even progress."}
              </div>
            </div>
          );
        }
        const pct = Math.min(100, Math.round((c.totalSales / bep) * 100));
        const now = new Date();
        const daysLeft = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate());
        const remaining = Math.max(0, bep - c.totalSales);
        const pace = Math.round(remaining / daysLeft);
        const over = c.totalSales >= bep;
        return (
          <div style={finCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
              <div style={finLabel}>{ko ? "이번 달 손익분기" : "This month vs break-even"}</div>
              <span style={{ fontSize: 13, fontWeight: 750, color: over ? "#1d3557" : MIDNIGHT }}>
                {pct}% {over ? (ko ? "· 손익분기 달성" : "· reached") : ""}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(25,25,112,0.08)", margin: "10px 0 8px" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: over ? "#1d3557" : MIDNIGHT, transition: "width .3s" }} />
            </div>
            <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>
              {ko
                ? over
                  ? `누적 매출이 이번 달 비용 합(${Math.round(bep / 10_000).toLocaleString()}만원)을 넘었어요.`
                  : `손익분기까지 ${Math.round(remaining / 10_000).toLocaleString()}만원 · 남은 ${daysLeft}일 기준 하루 ${Math.round(pace / 10_000).toLocaleString()}만원 페이스 필요`
                : over ? "Cumulative sales passed this month's total costs." : `${Math.round(remaining / 10_000).toLocaleString()}0k to go · need ~${Math.round(pace / 10_000).toLocaleString()}0k/day`}
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(15,23,42,0.42)", marginTop: 6 }}>
              {ko ? "기준 = 이번 달 비용 합계(사장님 입력). 원가는 판매 비례라 실제 분기점과 다를 수 있어요." : "Baseline = your entered monthly costs."}
            </div>
          </div>
        );
      })()}

      {/* ② 생존 보드 + 13주 자금흐름 (대시보드에서 이관) */}
      <SurvivalBoardCard
        ko={ko}
        isStartupCompany={c.isStartupCompany}
        runwayMonths={c.runwayMonths}
        capitalLeft={c.capitalLeft}
        weeklySalesChange={c.weeklySalesChange}
        weeklySignalLabel={c.weeklySignalLabel}
        healthLabel={c.healthLabel}
        healthTone={c.healthTone}
        topRiskLabel={c.topRiskLabel}
        focusMessage={c.focusMessage}
        d={d}
        totalSales={c.totalSales}
        netProfit={c.netProfit}
        totalCosts={c.totalCosts}
        healthScoreNumeric={c.healthScore}
      />
      <Cashflow13WeekForecastCard
        ko={ko}
        dailyEntries={c.allEntries as Array<{ date: string; sales: number; customers: number }>}
        fallbackMonthlyCostsTotal={c.totalCosts}
      />

      {/* ③ 12개월 시뮬레이션 — what-if 레버 + 성장 시나리오 */}
      {(c.totalSales > 0 || c.totalCosts > 0) && (
        <WhatIfSimulator
          ko={ko}
          monthlySales={c.totalSales}
          monthlyCosts={d.monthlyCosts as {
            ingredients: number; labor: number; rent: number; utilities: number;
            sga: number; marketing: number; other: number; interest: number;
          }}
          capitalLeft={c.capitalLeft}
          expenseFields={d.businessCtx.expenseFields?.map((f) => ({ fieldKey: f.fieldKey, label: f.label }))}
          showProjection
        />
      )}

      {/* ④ 매출 예측 */}
      {c.allEntries.length >= 3 && (
        <ForecastCard
          ko={ko}
          dailyEntries={c.allEntries}
          monthlyCosts={d.monthlyCosts as never}
          capitalLeft={c.capitalLeft}
          breakEvenDailySales={c.breakEvenDailySales}
          industryCategoryId={d.industryCategoryId}
          initialOperatingCapital={d.initialOperatingCapital}
        />
      )}
    </main>
  );
}
