"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  buildOperatingSimulation,
  buildWhatIfScenarios,
  formatKRW,
  type OperatingSimulationResult,
  type WhatIfScenario,
} from "@build-up/shared";
import { useDashboard } from "../lib/useDashboard";

type Tab = "pnl" | "cashflow" | "costs" | "scenario";

export default function AnalysisPageWrapper() {
  return <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f5f5f7" }} />}><AnalysisPage /></Suspense>;
}

function AnalysisPage() {
  const d = useDashboard("analytics");
  const router = useRouter();
  const ko = d.language === "ko";
  const [activeTab, setActiveTab] = useState<Tab>("pnl");

  const sim = useMemo<OperatingSimulationResult | null>(() => {
    try {
      return buildOperatingSimulation({
        dailyEntries: d.dailyEntries as Array<{ date: string; sales: number; customers: number }>,
        monthlyCosts: d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number },
        costHistory: d.costHistory as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>,
        capital: d.selectedBudget ?? 0,
        launchDate: typeof window !== "undefined" ? localStorage.getItem("businessLaunchedDate") : null,
      });
    } catch { return null; }
  }, [d.dailyEntries, d.monthlyCosts, d.costHistory, d.selectedBudget]);

  const scenarios = useMemo<WhatIfScenario[]>(() => {
    try {
      return buildWhatIfScenarios({
        dailyEntries: d.dailyEntries as Array<{ date: string; sales: number; customers: number }>,
        monthlyCosts: d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number },
        costHistory: d.costHistory as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>,
        capital: d.selectedBudget ?? 0,
        launchDate: typeof window !== "undefined" ? localStorage.getItem("businessLaunchedDate") : null,
      }, ko ? "ko" : "en");
    } catch { return []; }
  }, [d.dailyEntries, d.monthlyCosts, d.costHistory, d.selectedBudget, ko]);

  if (!sim) {
    return (
      <div style={shell}>
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "15px", color: "rgba(15,23,42,0.45)" }}>
            {ko ? "분석에 필요한 데이터가 부족합니다. 매출을 7일 이상 기록한 후 다시 확인하세요." : "Not enough data. Log at least 7 days of sales."}
          </div>
          <button type="button" onClick={() => router.push("/")} style={backBtn}>
            {ko ? "← 홈으로" : "← Home"}
          </button>
        </div>
      </div>
    );
  }

  const fmt = formatKRW;
  const { forecast, sensitivity, roiDecomposition: roi, dataQuality } = sim;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "pnl", label: ko ? "손익 구조" : "P&L Structure" },
    { id: "cashflow", label: ko ? "현금 흐름" : "Cash Flow" },
    { id: "costs", label: ko ? "비용 분석" : "Cost Analysis" },
    { id: "scenario", label: ko ? "시나리오" : "Scenarios" },
  ];

  return (
    <div style={shell}>
      {/* ── Header ── */}
      <div style={header}>
        <button type="button" onClick={() => router.push("/")} style={backBtn}>
          ← {ko ? "홈" : "Home"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={confidenceBadge(dataQuality.confidenceLevel)}>
            {ko ? "신뢰도" : "Confidence"}: {dataQuality.confidenceLevel === "high" ? (ko ? "높음" : "High") : dataQuality.confidenceLevel === "medium" ? (ko ? "보통" : "Medium") : (ko ? "낮음" : "Low")}
            {` · ${dataQuality.totalDays}${ko ? "일 데이터" : "d data"}`}
          </span>
        </div>
      </div>

      {/* ── Hero: 핵심 숫자 하나 + AI 한줄 ── */}
      <div style={heroSection}>
        <div style={heroEyebrow}>{ko ? "경영 분석" : "Business Analysis"}</div>
        <div style={heroRow}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              {ko ? "다음 달 예상 순이익" : "Next month projected profit"}
            </div>
            <div style={{ fontSize: "36px", fontWeight: 780, letterSpacing: "-0.03em", color: forecast.nextMonthProfit >= 0 ? "#177245" : "#b42318", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>
              {forecast.nextMonthProfit >= 0 ? "+" : ""}{fmt(forecast.nextMonthProfit)}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginTop: "4px" }}>
              {ko ? `매출 ${fmt(forecast.nextMonthRevenue)} − 비용 ${fmt(forecast.nextMonthCosts)}` : `Revenue ${fmt(forecast.nextMonthRevenue)} − Costs ${fmt(forecast.nextMonthCosts)}`}
            </div>
          </div>
          {/* 민감도 경고 */}
          <div style={leverageBox}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(15,23,42,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {ko ? "영업레버리지" : "Op. Leverage"}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 750, color: "#0f172a", fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>
              {sensitivity.operatingLeverage}x
            </div>
            <div style={{ fontSize: "12px", color: sensitivity.revenueDropImpact < -20 ? "#b42318" : "rgba(15,23,42,0.5)", marginTop: "2px" }}>
              {ko ? `매출 -10% → 이익 ${sensitivity.revenueDropImpact}%` : `Rev -10% → Profit ${sensitivity.revenueDropImpact}%`}
            </div>
          </div>
        </div>

        {/* ROI 요약 */}
        <div style={roiRow}>
          {[
            { label: ko ? "월 투자수익률" : "Monthly ROI", value: `${roi.monthlyROI}%` },
            { label: ko ? "이익률" : "Margin", value: `${roi.profitMargin}%` },
            { label: ko ? "자산회전" : "Turnover", value: `${roi.assetTurnover}x` },
            { label: ko ? "투자금 회수" : "Payback", value: roi.paybackMonths ? `${roi.paybackMonths}${ko ? "개월" : "mo"}` : "—" },
          ].map((item) => (
            <div key={item.label} style={roiCard}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>{item.label}</div>
              <div style={{ fontSize: "17px", fontWeight: 720, color: "#0f172a", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{ ...tabBtn, ...(activeTab === t.id ? tabActive : tabInactive) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={tabContent}>
        {activeTab === "pnl" && <PnlTab sim={sim} ko={ko} fmt={fmt} />}
        {activeTab === "cashflow" && <CashFlowTab sim={sim} ko={ko} fmt={fmt} />}
        {activeTab === "costs" && <CostTab sim={sim} ko={ko} fmt={fmt} />}
        {activeTab === "scenario" && <ScenarioTab scenarios={scenarios} ko={ko} fmt={fmt} />}
      </div>
    </div>
  );
}

/* ═══ Tab Components ═══ */

function PnlTab({ sim, ko, fmt }: { sim: OperatingSimulationResult; ko: boolean; fmt: (n: number) => string }) {
  const f = sim.forecast;
  const s = sim.sensitivity.stressTest;

  // P&L 워터폴 항목
  const waterfall = [
    { label: ko ? "예상 매출" : "Revenue", value: f.nextMonthRevenue, type: "positive" as const },
    { label: ko ? "재료비" : "COGS", value: -Math.round(f.nextMonthRevenue * 0.33), type: "negative" as const },
    { label: ko ? "인건비" : "Labor", value: -Math.round(f.nextMonthCosts * 0.35), type: "negative" as const },
    { label: ko ? "임대료" : "Rent", value: -Math.round(f.nextMonthCosts * 0.2), type: "negative" as const },
    { label: ko ? "기타" : "Other", value: -Math.round(f.nextMonthCosts * 0.12), type: "negative" as const },
    { label: ko ? "순이익" : "Profit", value: f.nextMonthProfit, type: f.nextMonthProfit >= 0 ? "positive" as const : "negative" as const },
  ];
  const maxVal = Math.max(...waterfall.map((w) => Math.abs(w.value)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "24px" }}>
      {/* waterfall chart */}
      <div>
        <div style={sectionLabel}>{ko ? "손익 워터폴" : "P&L Waterfall"}</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", marginTop: "12px" }}>
          {waterfall.map((w) => (
            <div key={w.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "60px", fontSize: "12px", color: "rgba(15,23,42,0.5)", flexShrink: 0, textAlign: "right" as const }}>{w.label}</div>
              <div style={{ flex: 1, height: "20px", borderRadius: "4px", background: "rgba(15,23,42,0.03)", overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", borderRadius: "4px",
                  width: `${(Math.abs(w.value) / maxVal) * 100}%`,
                  background: w.type === "positive" ? "#177245" : "#b42318",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ width: "72px", fontSize: "13px", fontWeight: 650, fontVariantNumeric: "tabular-nums", color: w.type === "positive" ? "#177245" : "#b42318", textAlign: "right" as const }}>
                {w.value >= 0 ? "+" : ""}{fmt(w.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-scenario stress test */}
      <div>
        <div style={sectionLabel}>{ko ? "시나리오별 순이익" : "Scenario Profits"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
          {[s.worst, s.base, s.best].map((sc) => (
            <div key={sc.label} style={scenarioCard}>
              <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.45)", fontWeight: 600 }}>{sc.label}</div>
              <div style={{ fontSize: "20px", fontWeight: 740, color: sc.profit >= 0 ? "#177245" : "#b42318", fontVariantNumeric: "tabular-nums", marginTop: "6px" }}>
                {sc.profit >= 0 ? "+" : ""}{fmt(sc.profit)}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>
                {ko ? "매출" : "Rev"} {fmt(sc.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CashFlowTab({ sim, ko, fmt }: { sim: OperatingSimulationResult; ko: boolean; fmt: (n: number) => string }) {
  const f = sim.forecast;
  const roi = sim.roiDecomposition;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "24px" }}>
      {/* forecast */}
      <div>
        <div style={sectionLabel}>{ko ? "현금흐름 예측" : "Cash Flow Forecast"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
          <MetricCard label={ko ? "예상 유입 (매출)" : "Inflow (Revenue)"} value={fmt(f.nextMonthRevenue)} color="#177245" />
          <MetricCard label={ko ? "예상 유출 (비용)" : "Outflow (Costs)"} value={fmt(f.nextMonthCosts)} color="#b42318" />
          <MetricCard label={ko ? "순 현금흐름" : "Net Cash Flow"} value={`${f.nextMonthProfit >= 0 ? "+" : ""}${fmt(f.nextMonthProfit)}`} color={f.nextMonthProfit >= 0 ? "#177245" : "#b42318"} />
          <MetricCard label={ko ? "투자금 회수까지" : "Payback"} value={roi.paybackMonths ? `${roi.paybackMonths}${ko ? "개월" : " months"}` : (ko ? "현재 적자" : "Currently loss")} color={roi.paybackMonths ? "#0f172a" : "#b42318"} />
        </div>
      </div>

      {/* day-of-week pattern */}
      <div>
        <div style={sectionLabel}>{ko ? "요일별 매출 패턴" : "Day-of-Week Pattern"}</div>
        <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "80px", marginTop: "12px" }}>
          {f.dayOfWeekAvg.map((val, i) => {
            const max = Math.max(...f.dayOfWeekAvg, 1);
            const h = Math.max(4, (val / max) * 68);
            const labels = ko ? ["일", "월", "화", "수", "목", "금", "토"] : ["S", "M", "T", "W", "T", "F", "S"];
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "flex-end" }}>
                {val > 0 && <div style={{ fontSize: "9px", fontWeight: 600, color: "rgba(15,23,42,0.4)", marginBottom: "2px", fontVariantNumeric: "tabular-nums" }}>{Math.round(val / 10000)}</div>}
                <div style={{ width: "100%", height: `${h}px`, borderRadius: "4px 4px 2px 2px", background: i === 0 || i === 6 ? "rgba(37,99,235,0.12)" : "rgba(15,23,42,0.12)", transition: "height 0.4s ease" }} />
                <div style={{ fontSize: "10px", fontWeight: 500, color: "rgba(15,23,42,0.4)", marginTop: "4px" }}>{labels[i]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "8px", textAlign: "center" as const }}>
          {ko ? `주간 성장률: ${f.weeklyGrowthRate >= 0 ? "+" : ""}${f.weeklyGrowthRate}%` : `Weekly growth: ${f.weeklyGrowthRate >= 0 ? "+" : ""}${f.weeklyGrowthRate}%`}
        </div>
      </div>

      {/* ROI decomposition */}
      <div>
        <div style={sectionLabel}>{ko ? "투자수익률 분해 (ROI)" : "ROI Decomposition"}</div>
        <div style={{ padding: "16px", background: "rgba(15,23,42,0.025)", borderRadius: "16px", marginTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "15px", fontWeight: 650 }}>
            <span>{ko ? "ROI" : "ROI"}</span>
            <span style={{ color: "#0f172a" }}>{sim.roiDecomposition.investmentReturn}%</span>
            <span style={{ color: "rgba(15,23,42,0.3)" }}>=</span>
            <span>{ko ? "이익률" : "Margin"} {sim.roiDecomposition.profitMargin}%</span>
            <span style={{ color: "rgba(15,23,42,0.3)" }}>×</span>
            <span>{ko ? "회전" : "Turn"} {sim.roiDecomposition.assetTurnover}x</span>
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", marginTop: "8px", textAlign: "center" as const, lineHeight: 1.5 }}>
            {ko
              ? "이익률은 매출 대비 얼마나 남기는지, 회전율은 투자금 대비 얼마나 파는지를 의미합니다"
              : "Margin shows how much you keep per sale. Turnover shows how efficiently your investment generates revenue."}
          </div>
        </div>
      </div>
    </div>
  );
}

function CostTab({ sim, ko, fmt }: { sim: OperatingSimulationResult; ko: boolean; fmt: (n: number) => string }) {
  const sens = sim.sensitivity;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "24px" }}>
      {/* cost sensitivity table */}
      <div>
        <div style={sectionLabel}>{ko ? "비용 민감도 (5% 증가 시 영향)" : "Cost Sensitivity (5% increase impact)"}</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px", marginTop: "12px" }}>
          {sens.costSensitivity.map((c) => (
            <div key={c.costName} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "12px", background: "rgba(15,23,42,0.02)" }}>
              <div style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>{c.costName}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", fontVariantNumeric: "tabular-nums" }}>
                {fmt(c.currentAmount)}{ko ? "/월" : "/mo"}
              </div>
              <div style={{ fontSize: "12px", color: "#b42318", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>
                {ko ? "순이익" : "Profit"} {fmt(c.profitImpact)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* operating leverage explanation */}
      <div style={{ padding: "20px", borderRadius: "18px", background: sens.operatingLeverage > 3 ? "rgba(180,35,24,0.04)" : "rgba(15,23,42,0.025)", border: sens.operatingLeverage > 3 ? "1px solid rgba(180,35,24,0.08)" : "1px solid transparent" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
          {ko ? "영업레버리지 해석" : "Operating Leverage Explained"}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6, marginTop: "8px" }}>
          {ko
            ? `현재 영업레버리지는 ${sens.operatingLeverage}x입니다. 이는 매출이 10% 변하면 이익이 ${Math.abs(sens.revenueDropImpact)}% 변한다는 뜻입니다. ${sens.operatingLeverage > 3 ? "고정비(임대료+인건비) 비중이 높아 매출 변동에 매우 민감합니다. 고정비를 줄이거나 매출을 늘려 레버리지를 낮추는 것이 안정성의 핵심입니다." : "안정적인 수준입니다. 현재 비용 구조를 유지하세요."}`
            : `Operating leverage is ${sens.operatingLeverage}x. A 10% revenue change causes a ${Math.abs(sens.revenueDropImpact)}% profit change. ${sens.operatingLeverage > 3 ? "High fixed costs make your business sensitive to revenue swings. Reducing fixed costs or increasing revenue lowers this leverage." : "This is a stable level. Maintain your current cost structure."}`}
        </div>
      </div>
    </div>
  );
}

function ScenarioTab({ scenarios, ko, fmt }: { scenarios: WhatIfScenario[]; ko: boolean; fmt: (n: number) => string }) {
  if (scenarios.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "rgba(15,23,42,0.4)", fontSize: "13px" }}>
        {ko ? "시나리오를 계산할 데이터가 부족합니다" : "Not enough data for scenarios"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
      <div style={sectionLabel}>{ko ? "이렇게 하면 어떻게 될까?" : "What if...?"}</div>
      {scenarios.map((sc) => (
        <div key={sc.label} style={scenarioFullCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{sc.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginTop: "2px" }}>{sc.description}</div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 740, color: sc.delta >= 0 ? "#177245" : "#b42318", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
              {sc.delta >= 0 ? "+" : ""}{fmt(sc.delta)}{ko ? "/월" : "/mo"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <div style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", background: "rgba(15,23,42,0.03)" }}>
              <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)" }}>{ko ? "현재 순이익" : "Current"}</div>
              <div style={{ fontSize: "14px", fontWeight: 650, fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>{fmt(sc.baseProfit)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: "14px", color: "rgba(15,23,42,0.3)" }}>→</div>
            <div style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", background: sc.newProfit >= 0 ? "rgba(23,114,69,0.04)" : "rgba(180,35,24,0.04)" }}>
              <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)" }}>{ko ? "변경 후" : "After"}</div>
              <div style={{ fontSize: "14px", fontWeight: 650, color: sc.newProfit >= 0 ? "#177245" : "#b42318", fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>{fmt(sc.newProfit)}</div>
            </div>
          </div>
          {/* BEP change */}
          {sc.baseBepDaily !== sc.newBepDaily && (
            <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginTop: "8px" }}>
              {ko ? "BEP 일매출" : "BEP daily"}: {fmt(sc.baseBepDaily)} → {fmt(sc.newBepDaily)}
            </div>
          )}
          {/* assumptions */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginTop: "8px" }}>
            {sc.assumptions.map((a) => (
              <span key={a} style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)", background: "rgba(15,23,42,0.04)", borderRadius: "4px", padding: "2px 6px" }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "8px", lineHeight: 1.5, textAlign: "center" as const }}>
        {ko
          ? "모든 시나리오는 현재 실적 데이터 기반으로 계산됩니다. AI가 생성한 숫자가 아닙니다."
          : "All scenarios are calculated from your actual data. No AI-generated numbers."}
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.025)" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: 720, color, fontVariantNumeric: "tabular-nums", marginTop: "6px" }}>{value}</div>
    </div>
  );
}

/* ─── Styles ─── */

const shell: React.CSSProperties = {
  maxWidth: "720px",
  margin: "0 auto",
  padding: "24px 20px 80px",
  minHeight: "100vh",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
};

const backBtn: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#2563eb",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "8px 0",
};

const confidenceBadge = (level: string): React.CSSProperties => ({
  fontSize: "11px",
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: "8px",
  background: level === "high" ? "rgba(23,114,69,0.08)" : level === "medium" ? "rgba(229,133,8,0.08)" : "rgba(180,35,24,0.08)",
  color: level === "high" ? "#177245" : level === "medium" ? "#b54708" : "#b42318",
});

const heroSection: React.CSSProperties = {
  marginBottom: "24px",
};

const heroEyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
  marginBottom: "12px",
};

const heroRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
};

const leverageBox: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: "16px",
  background: "rgba(15,23,42,0.03)",
  textAlign: "center",
  flexShrink: 0,
};

const roiRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "8px",
  marginTop: "16px",
};

const roiCard: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(15,23,42,0.025)",
};

const tabBar: React.CSSProperties = {
  display: "flex",
  gap: "4px",
  padding: "4px",
  borderRadius: "14px",
  background: "rgba(15,23,42,0.04)",
  marginBottom: "20px",
};

const tabBtn: React.CSSProperties = {
  flex: 1,
  fontSize: "13px",
  fontWeight: 600,
  border: "none",
  borderRadius: "10px",
  padding: "10px 0",
  cursor: "pointer",
  transition: "all 0.15s ease",
  textAlign: "center",
};

const tabActive: React.CSSProperties = {
  background: "#fff",
  color: "#0f172a",
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
};

const tabInactive: React.CSSProperties = {
  background: "transparent",
  color: "rgba(15,23,42,0.45)",
};

const tabContent: React.CSSProperties = {};

const sectionLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
};

const scenarioCard: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "14px",
  background: "rgba(15,23,42,0.025)",
};

const scenarioFullCard: React.CSSProperties = {
  padding: "18px 20px",
  borderRadius: "18px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
  border: "1px solid rgba(15,23,42,0.06)",
};
