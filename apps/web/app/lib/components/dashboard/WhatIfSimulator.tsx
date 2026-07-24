"use client";

import { useMemo, useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, GitBranch, AlertTriangle } from "lucide-react";
import { projectTwelveMonths, GROWTH_SCENARIOS, type GrowthScenarioId } from "../../finance-sim";

type MonthlyCosts = {
  ingredients: number;
  labor: number;
  rent: number;
  utilities: number;
  sga: number;
  marketing: number;
  other: number;
  interest: number;
};

type ExpenseFieldLabel = {
  fieldKey: string;
  label: { ko: string; en: string };
};

type Props = {
  ko: boolean;
  monthlySales: number;
  monthlyCosts: MonthlyCosts;
  capitalLeft: number;
  /**
   * 업종별 비용 항목 라벨 (business-context.ts 의 expenseFields).
   * 미전달 시 음식점 디폴트 라벨로 fallback.
   * 스타트업이면 ingredients 라벨이 "서버·클라우드·SaaS" 등으로 자동 분기됨.
   */
  expenseFields?: ExpenseFieldLabel[];
  /** 재무 페이지 전용 — 레버 시나리오에 성장률을 얹은 12개월 현금 투영 섹션 표시 (2026-07-24) */
  showProjection?: boolean;
};

/**
 * What-If 경영 시나리오 시뮬레이터.
 * 슬라이더로 매출/비용 조정 → 월 순익, 런웨이, BEP 실시간 재계산.
 * "진단"에서 "의사결정"으로 진화.
 */
export function WhatIfSimulator({ ko, monthlySales, monthlyCosts, capitalLeft, expenseFields, showProjection }: Props) {
  // 업종별 라벨 lookup — 카테고리에 따라 ingredients = "재료비"/"서버·SaaS"/"매입원가" 등으로 분기
  const labelFor = (fieldKey: string, fallback: { ko: string; en: string }) => {
    const found = expenseFields?.find((f) => f.fieldKey === fieldKey);
    return found?.label ?? fallback;
  };
  // 배수 조정 (100% = 현재값)
  const [salesMult, setSalesMult] = useState(100);
  const [ingredientsMult, setIngredientsMult] = useState(100);
  const [laborMult, setLaborMult] = useState(100);
  const [rentMult, setRentMult] = useState(100);
  const [marketingMult, setMarketingMult] = useState(100);

  const scenario = useMemo(() => {
    const newSales = monthlySales * (salesMult / 100);
    const newIngredients = monthlyCosts.ingredients * (ingredientsMult / 100);
    const newLabor = monthlyCosts.labor * (laborMult / 100);
    const newRent = monthlyCosts.rent * (rentMult / 100);
    const newMarketing = monthlyCosts.marketing * (marketingMult / 100);
    const fixedOther = monthlyCosts.utilities + monthlyCosts.sga + monthlyCosts.other + monthlyCosts.interest;
    const newTotalCosts = newIngredients + newLabor + newRent + newMarketing + fixedOther;
    const newNet = newSales - newTotalCosts;
    const newRunway = newNet < 0 && capitalLeft > 0
      ? Math.max(0, Math.floor(capitalLeft / Math.abs(newNet)))
      : -1;
    const bep = newSales > 0 ? (newTotalCosts / newSales) * 100 : 0;

    return {
      sales: newSales,
      totalCosts: newTotalCosts,
      net: newNet,
      runway: newRunway,
      bep,
      // 12개월 투영용 분해 — 변동비(재료·매입)는 매출 비례, 나머지는 고정 (2026-07-24)
      variableCosts: newIngredients,
      fixedCosts: newTotalCosts - newIngredients,
    };
  }, [monthlySales, monthlyCosts, capitalLeft, salesMult, ingredientsMult, laborMult, rentMult, marketingMult]);

  // 현재 실적 대비 변화
  const currentTotalCosts = monthlyCosts.ingredients + monthlyCosts.labor + monthlyCosts.rent
    + monthlyCosts.utilities + monthlyCosts.sga + monthlyCosts.marketing + monthlyCosts.other + monthlyCosts.interest;
  const currentNet = monthlySales - currentTotalCosts;
  const netDelta = scenario.net - currentNet;
  const currentRunway = currentNet < 0 && capitalLeft > 0
    ? Math.max(0, Math.floor(capitalLeft / Math.abs(currentNet)))
    : -1;
  const runwayDelta = scenario.runway - currentRunway;

  const hasChanges = salesMult !== 100 || ingredientsMult !== 100 || laborMult !== 100 || rentMult !== 100 || marketingMult !== 100;

  // ── 12개월 현금 투영 (재무 페이지 전용, finance-sim SSOT) ──
  const [growthSel, setGrowthSel] = useState<GrowthScenarioId>("base");
  const projection = useMemo(() => {
    if (!showProjection) return null;
    const growth = GROWTH_SCENARIOS.find((g) => g.id === growthSel) ?? GROWTH_SCENARIOS[1];
    return projectTwelveMonths({
      startCash: capitalLeft,
      monthlySales: scenario.sales,
      variableCostRatio: scenario.sales > 0 ? scenario.variableCosts / scenario.sales : 0,
      monthlyFixedCosts: scenario.fixedCosts,
      growthRatePct: growth.growthRatePct,
    });
  }, [showProjection, growthSel, scenario, capitalLeft]);

  const [showSecondOrder, setShowSecondOrder] = useState(false);

  // ── 시나리오 현실성 평가 (자연어 해석) ─────────────
  // 3400% 같은 비현실 숫자가 단독으로 노출되지 않도록 "공격적/비현실적" 라벨 + 이유 문장으로 해석.
  // 거장 인용: Munger "Invert" — "이게 현실에서 실패할 시나리오인가?" 부터 묻는다.
  const realism = useMemo(() => {
    const revChange = salesMult - 100;       // -50 ~ +100
    const ingChange = ingredientsMult - 100; // -70 ~ +50
    const labChange = laborMult - 100;
    const rentChange = rentMult - 100;
    const mktChange = marketingMult - 100;

    const intensity = Math.abs(revChange) + Math.abs(ingChange) + Math.abs(labChange) + Math.abs(rentChange) + Math.abs(mktChange);

    const ingLabel = labelFor("ingredients", { ko: "재료비", en: "Ingredients" });

    const flags: { ko: string; en: string }[] = [];
    if (revChange >= 50 && ingChange <= -30) {
      flags.push({
        ko: `매출 +${revChange}% 와 ${ingLabel.ko} ${Math.abs(ingChange)}% 절감을 동시에 — 실무에선 거의 불가능합니다`,
        en: `Sales +${revChange}% AND ${ingLabel.en} -${Math.abs(ingChange)}% together — almost impossible in practice`,
      });
    }
    if (revChange >= 80) {
      flags.push({
        ko: `매출 +${revChange}% — 가격 인상만으론 불가능 (수요 탄력성 -0.5 가정 시 가격 ${(revChange / 0.5).toFixed(0)}% 인상 필요)`,
        en: `Sales +${revChange}% — price hike alone won't work (would need +${(revChange / 0.5).toFixed(0)}% price w/ -0.5 elasticity)`,
      });
    }
    if (rentChange <= -50) {
      flags.push({
        ko: `임대료 ${Math.abs(rentChange)}% 인하 — 이전·재계약 외엔 비현실적`,
        en: `Rent -${Math.abs(rentChange)}% — only realistic via relocation/renegotiation`,
      });
    }
    const costCutsCount = [ingChange, labChange, rentChange, mktChange].filter(c => c <= -20).length;
    if (costCutsCount >= 3) {
      flags.push({
        ko: `비용 ${costCutsCount}개 항목을 동시에 -20% 이상 — 실행 가능성 낮음`,
        en: `${costCutsCount} cost categories -20%+ at once — low feasibility`,
      });
    }

    let level: "realistic" | "aggressive" | "unrealistic";
    if (flags.length >= 2 || intensity >= 200) level = "unrealistic";
    else if (flags.length >= 1 || intensity >= 100) level = "aggressive";
    else level = "realistic";

    return { level, intensity, flags };
  }, [salesMult, ingredientsMult, laborMult, rentMult, marketingMult, expenseFields]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2차 결과 전개 (Munger Second-Order Thinking) ─────────
  // 1차 결정이 "그 다음" 어떤 연쇄 효과를 일으킬지 문장으로 전개.
  // 수치 반영은 안 하고 경고·인지 유도 중심 (사용자 판단 공간 유지).
  const secondOrderChain = useMemo(() => {
    const chain: Array<{
      trigger: string;
      firstOrder: string;   // 이미 계산된 직접 효과
      nextEffects: string[]; // 2차·3차 효과 설명
      severity: "low" | "medium" | "high";
    }> = [];

    // 인건비 -10%+
    if (laborMult <= 90) {
      const delta = 100 - laborMult;
      chain.push({
        trigger: ko ? `인건비 ${delta}% 감소` : `Labor -${delta}%`,
        firstOrder: ko ? "월 순익 +" : "Monthly net +",
        nextEffects: [
          ko ? "서비스 속도·품질 저하 가능 (직원 피로↑)" : "Service speed/quality may drop (staff fatigue↑)",
          ko ? "리뷰 평점 0.2~0.4점 하락 → 신규 유입 5~15% 감소" : "Review rating drops 0.2-0.4 → new visits -5-15%",
          ko ? "장기: 핵심 직원 이직 위험" : "Long-term: key staff attrition risk",
        ],
        severity: delta >= 20 ? "high" : "medium",
      });
    }

    // 마케팅비 -15%+
    if (marketingMult <= 85) {
      const delta = 100 - marketingMult;
      chain.push({
        trigger: ko ? `마케팅비 ${delta}% 감소` : `Marketing -${delta}%`,
        firstOrder: ko ? "월 순익 +" : "Monthly net +",
        nextEffects: [
          ko ? "노출 감소 → 신규 고객 10~20% 감소 (2-3개월 시차)" : "Exposure drops → new customers -10-20% (2-3 month lag)",
          ko ? "단골 유지율에는 단기 영향 없음" : "No short-term impact on repeat rate",
          ko ? "경쟁사 대비 점유율 하락 가능" : "Market share vs competitors may slip",
        ],
        severity: delta >= 30 ? "high" : "medium",
      });
    }

    // ingredients -15%+ — 라벨은 업종별로 동적 (예: "재료비"/"서버·SaaS"/"매입원가")
    if (ingredientsMult <= 85) {
      const delta = 100 - ingredientsMult;
      const ingLabel = labelFor("ingredients", { ko: "재료비", en: "Ingredients" });
      chain.push({
        trigger: ko ? `${ingLabel.ko} ${delta}% 감소` : `${ingLabel.en} -${delta}%`,
        firstOrder: ko ? "월 순익 +" : "Monthly net +",
        nextEffects: [
          ko ? "품질·신뢰성 저하 가능 (등급·공급처 변경 시)" : "Quality/reliability may drop (if grade/supplier changes)",
          ko ? "리뷰·만족도 하락 → 고객 이탈 가능" : "Review/satisfaction may drop → customer churn",
          ko ? `대안: 낭비·재고 관리로 ${ingLabel.ko} 줄이는 게 안전` : `Safer: cut via waste/inventory management, not grade`,
        ],
        severity: delta >= 20 ? "high" : "medium",
      });
    }

    // 매출 +10%+ (대개 가격 인상 가정)
    if (salesMult >= 110) {
      const delta = salesMult - 100;
      chain.push({
        trigger: ko ? `매출 ${delta}% 증가 (가격 인상 가정)` : `Sales +${delta}% (price hike assumed)`,
        firstOrder: ko ? "월 매출 +" : "Monthly sales +",
        nextEffects: [
          ko ? "수요 가격탄력성 ≈ -0.5 → 고객 수 5~10% 감소 가능" : "Price elasticity ≈ -0.5 → customer -5-10%",
          ko ? "기존 단골 이탈 위험 (가격 민감 구간)" : "Risk of losing price-sensitive regulars",
          ko ? "순 효과는 실제로 +5~15%일 수 있음 (예측치보다 낮음)" : "Net effect may be +5-15% (lower than projected)",
        ],
        severity: delta >= 20 ? "high" : "medium",
      });
    }

    // 임대료 -20%+ (이전 가정)
    if (rentMult <= 80) {
      const delta = 100 - rentMult;
      chain.push({
        trigger: ko ? `임대료 ${delta}% 감소` : `Rent -${delta}%`,
        firstOrder: ko ? "월 순익 +" : "Monthly net +",
        nextEffects: [
          ko ? "현실적으로는 이전이 필요 (계약 갱신 기회 외엔 협상 어려움)" : "Realistically requires relocation",
          ko ? "이전 비용: 보증금·권리금·인테리어 재투자" : "Moving cost: deposit, interior reinvestment",
          ko ? "상권 변경 시 고객 이탈 20~50% (1호점 단골층 이동 어려움)" : "New area → 20-50% customer loss",
        ],
        severity: "high",
      });
    }

    return chain;
  }, [salesMult, ingredientsMult, laborMult, rentMult, marketingMult, ko, expenseFields]);

  const hasSecondOrderConcerns = secondOrderChain.length > 0;

  const reset = () => {
    setSalesMult(100);
    setIngredientsMult(100);
    setLaborMult(100);
    setRentMult(100);
    setMarketingMult(100);
  };

  const fmt = (n: number) => {
    const abs = Math.abs(Math.round(n));
    if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`;
    return `${abs.toLocaleString()}원`;
  };

  const sliders: Array<{
    label: { ko: string; en: string };
    value: number;
    setValue: (v: number) => void;
    baseAmount: number;
    direction: "positive" | "negative"; // positive = 높이면 좋음, negative = 낮추면 좋음
  }> = [
    { label: { ko: "매출", en: "Revenue" }, value: salesMult, setValue: setSalesMult, baseAmount: monthlySales, direction: "positive" as const },
    { label: labelFor("ingredients", { ko: "재료비", en: "Ingredients" }), value: ingredientsMult, setValue: setIngredientsMult, baseAmount: monthlyCosts.ingredients, direction: "negative" as const },
    { label: labelFor("labor", { ko: "인건비", en: "Labor" }), value: laborMult, setValue: setLaborMult, baseAmount: monthlyCosts.labor, direction: "negative" as const },
    { label: labelFor("rent", { ko: "임대료", en: "Rent" }), value: rentMult, setValue: setRentMult, baseAmount: monthlyCosts.rent, direction: "negative" as const },
    { label: labelFor("marketing", { ko: "마케팅비", en: "Marketing" }), value: marketingMult, setValue: setMarketingMult, baseAmount: monthlyCosts.marketing, direction: "negative" as const },
  ]
  // ⚠ baseAmount 가 0 인 비용 항목은 슬라이더 숨김 (스타트업이 "임대료 0원" 슬라이더 보는 것 방지).
  //    매출은 항상 노출 (시나리오 도구의 핵심).
  .filter((s) => s.label.ko === "매출" || s.label.en === "Revenue" || (s.baseAmount ?? 0) > 0);

  return (
    <section style={card} className="bento-card">
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={eyebrow}>{ko ? "What-If 시뮬레이터" : "What-If Simulator"}</div>
          <div style={title}>{ko ? "만약 이렇게 바꾸면?" : "What if we change..."}</div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            {ko
              ? "슬라이더로 비용·매출을 조정하고 월 순익과 런웨이가 어떻게 변하는지 확인하세요."
              : "Drag sliders to adjust costs/revenue and see how profit and runway change."}
          </div>
        </div>
        {hasChanges && (
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(15,23,42,0.1)",
              background: "rgba(255,255,255,0.7)",
              fontSize: "11px",
              fontWeight: 650,
              color: "rgba(15,23,42,0.6)",
              cursor: "pointer",
            }}
          >
            {ko ? "↺ 초기화" : "↺ Reset"}
          </button>
        )}
      </div>

      {/* 결과 요약 — 현재 vs 시나리오 */}
      <div style={{
        padding: "14px",
        borderRadius: "14px",
        background: hasChanges
          ? (scenario.net > currentNet ? "rgba(25,25,112,0.06)" : "rgba(182,76,76,0.04)")
          : "rgba(25,25,112,0.035)",
        border: `1px solid ${hasChanges ? (scenario.net > currentNet ? "rgba(25,25,112,0.12)" : "rgba(182,76,76,0.1)") : "rgba(25,25,112,0.04)"}`,
        marginBottom: "16px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <div>
            <div style={metricLabel}>{ko ? "월 순익 변화" : "Monthly net Δ"}</div>
            <div style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: scenario.net >= 0 ? "#1d3557" : "#b64c4c",
              lineHeight: 1.1,
            }}>
              {scenario.net >= 0 ? "+" : ""}{fmt(scenario.net)}
            </div>
            {hasChanges && netDelta !== 0 && (
              <div style={{ fontSize: "11px", fontWeight: 650, color: netDelta > 0 ? "#1d3557" : "#b64c4c", marginTop: "2px" }}>
                {netDelta > 0 ? "▲" : "▼"} {fmt(Math.abs(netDelta))} {ko ? "변화" : "change"}
              </div>
            )}
          </div>
          <div>
            <div style={metricLabel}>{ko ? "런웨이" : "Runway"}</div>
            <div style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: scenario.runway < 0 ? "#1d3557" : scenario.runway >= 6 ? "#1d3557" : scenario.runway >= 3 ? "#191970" : "#b64c4c",
              lineHeight: 1.1,
            }}>
              {scenario.runway < 0 ? (ko ? "∞" : "∞") : `${scenario.runway}${ko ? "개월" : "mo"}`}
            </div>
            {hasChanges && runwayDelta !== 0 && currentRunway >= 0 && (
              <div style={{ fontSize: "11px", fontWeight: 650, color: runwayDelta > 0 ? "#1d3557" : "#b64c4c", marginTop: "2px" }}>
                {runwayDelta > 0 ? "▲" : "▼"} {Math.abs(runwayDelta)}{ko ? "개월" : "mo"}
              </div>
            )}
          </div>
          <div>
            <div style={metricLabel}>{ko ? "비용률" : "Cost ratio"}</div>
            <div style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: scenario.bep <= 80 ? "#1d3557" : scenario.bep <= 95 ? "#191970" : "#b64c4c",
              lineHeight: 1.1,
            }}>
              {/* 매출이 비용 대비 너무 작으면 비율이 1000% 를 훨씬 초과 → 사용자에겐 무의미한 숫자.
                  300% 초과 시 "300%+" 로 표기하고 시각적으로 적자 강조. */}
              {scenario.bep > 300 ? "300%+" : `${Math.round(scenario.bep)}%`}
            </div>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
              {scenario.bep > 300
                ? (ko ? "매출 대비 적자 과다" : "deep loss vs revenue")
                : (ko ? "매출 대비" : "of revenue")}
            </div>
          </div>
        </div>
      </div>

      {/* 슬라이더 그룹 */}
      <div style={{ display: "grid", gap: "12px" }}>
        {sliders.map((s) => {
          const delta = s.value - 100;
          const isGoodDirection = (s.direction === "positive" && delta > 0) || (s.direction === "negative" && delta < 0);
          const newAmount = s.baseAmount * (s.value / 100);
          const amountDelta = newAmount - s.baseAmount;

          return (
            <div key={s.label.ko}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 650, color: "#0f172a" }}>
                    {s.label[ko ? "ko" : "en"]}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {fmt(s.baseAmount)} → <span style={{ color: delta !== 0 ? (isGoodDirection ? "#1d3557" : "#b64c4c") : "rgba(15,23,42,0.5)", fontWeight: 650 }}>
                      {fmt(newAmount)}
                    </span>
                  </span>
                </div>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: delta === 0 ? "rgba(15,23,42,0.5)" : isGoodDirection ? "#1d3557" : "#b64c4c",
                  minWidth: "52px",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {delta > 0 ? "+" : ""}{delta}%
                </div>
              </div>
              <input
                type="range"
                min={s.direction === "positive" ? 50 : 30}
                max={s.direction === "positive" ? 200 : 150}
                step={5}
                value={s.value}
                onChange={(e) => s.setValue(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "4px",
                  cursor: "pointer",
                  accentColor: delta === 0 ? "#94a3b8" : isGoodDirection ? "#1d3557" : "#b64c4c",
                }}
              />
              {amountDelta !== 0 && (
                <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px", textAlign: "right" }}>
                  {s.direction === "positive" ? (ko ? "월 매출 기여" : "Monthly revenue impact") : (ko ? "월 절감/증가" : "Monthly savings/increase")}: <span style={{ color: isGoodDirection ? "#1d3557" : "#b64c4c", fontWeight: 650 }}>
                    {amountDelta > 0 ? "+" : ""}{fmt(amountDelta)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 시나리오 현실성 자연어 해석 ── */}
      {hasChanges && realism.level !== "realistic" && (
        <div
          style={{
            marginTop: "14px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: realism.level === "unrealistic" ? "rgba(182,76,76,0.05)" : "rgba(25,25,112,0.05)",
            border: `1px solid ${realism.level === "unrealistic" ? "rgba(182,76,76,0.14)" : "rgba(25,25,112,0.14)"}`,
            fontSize: "12px",
            color: "rgba(15,23,42,0.75)",
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <AlertTriangle size={12} strokeWidth={1.6} color={realism.level === "unrealistic" ? "#b64c4c" : "#191970"} />
            <span style={{ fontWeight: 700, color: realism.level === "unrealistic" ? "#b64c4c" : "#191970", fontSize: "12px" }}>
              {realism.level === "unrealistic"
                ? (ko ? "비현실적 시나리오 — 숫자만 보지 마세요" : "Unrealistic scenario — don't trust the numbers alone")
                : (ko ? "공격적 시나리오 — 실행 난이도 높음" : "Aggressive scenario — hard to execute")}
            </span>
          </div>
          <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55, paddingLeft: "18px" }}>
            {realism.flags.length > 0
              ? realism.flags.map((f, i) => (
                  <div key={i} style={{ marginTop: i > 0 ? "3px" : 0 }}>· {ko ? f.ko : f.en}</div>
                ))
              : (ko
                  ? "여러 변수를 동시에 큰 폭으로 움직이고 있어요 — 현장에서 한 번에 다 바꾸기 어렵습니다."
                  : "You're moving many variables at once — hard to execute simultaneously in the field.")}
          </div>
        </div>
      )}

      {/* 인사이트 메시지 */}
      {hasChanges && (
        <div style={{
          marginTop: "10px",
          padding: "10px 12px",
          borderRadius: "10px",
          background: "rgba(25,25,112,0.04)",
          border: "1px solid rgba(25,25,112,0.08)",
          fontSize: "12px",
          color: "rgba(15,23,42,0.7)",
          lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 660, color: "#191970", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Lightbulb size={12} strokeWidth={1.5} color="#191970" />
            {ko ? "인사이트:" : "Insight:"}
          </span>{" "}
          {scenario.net > currentNet
            ? (ko
                ? `이 시나리오는 월 ${fmt(netDelta)} 더 남깁니다. ${runwayDelta > 0 ? `런웨이가 ${runwayDelta}개월 늘어납니다.` : ""} 실행 방안을 고민해보세요.`
                : `This scenario saves ${fmt(netDelta)} monthly. ${runwayDelta > 0 ? `Runway extends by ${runwayDelta} months.` : ""} Consider how to execute it.`)
            : scenario.net < currentNet
              ? (ko
                  ? `이 시나리오는 월 ${fmt(Math.abs(netDelta))} 손해입니다. ${runwayDelta < 0 ? `런웨이가 ${Math.abs(runwayDelta)}개월 줄어듭니다.` : ""}`
                  : `This scenario loses ${fmt(Math.abs(netDelta))} monthly. ${runwayDelta < 0 ? `Runway shortens by ${Math.abs(runwayDelta)} months.` : ""}`)
              : (ko ? "순익 변화가 없습니다. 다른 조합을 시도해보세요." : "No profit change. Try a different combination.")}
        </div>
      )}

      {/* ═══════════════ 2차 결과 전개 (Munger Second-Order) ═══════════════ */}
      {hasChanges && hasSecondOrderConcerns && (
        <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            onClick={() => setShowSecondOrder(!showSecondOrder)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(15,23,42,0.08)",
              background: "rgba(25,25,112,0.025)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(25,25,112,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(25,25,112,0.025)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <GitBranch size={14} strokeWidth={1.5} color="rgba(15,23,42,0.55)" />
              <span style={{ fontSize: "12.5px", fontWeight: 650, color: "rgba(15,23,42,0.7)" }}>
                {ko
                  ? `그 다음엔? — ${secondOrderChain.length}개 연쇄 효과`
                  : `Then what? — ${secondOrderChain.length} cascade effects`}
              </span>
            </div>
            {showSecondOrder ? (
              <ChevronUp size={13} strokeWidth={1.8} color="rgba(15,23,42,0.5)" />
            ) : (
              <ChevronDown size={13} strokeWidth={1.8} color="rgba(15,23,42,0.5)" />
            )}
          </button>

          {showSecondOrder && (
            <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
              {secondOrderChain.map((item, idx) => {
                const bg = item.severity === "high" ? "rgba(182,76,76,0.03)" : "rgba(25,25,112,0.03)";
                const border = item.severity === "high" ? "rgba(182,76,76,0.1)" : "rgba(25,25,112,0.1)";
                const badgeColor = item.severity === "high" ? "#b64c4c" : "#191970";

                return (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: bg,
                      border: `1px solid ${border}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <AlertTriangle size={13} strokeWidth={1.5} color={badgeColor} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: badgeColor, letterSpacing: "-0.01em" }}>
                        {item.trigger}
                      </span>
                    </div>
                    <div style={{ display: "grid", gap: "4px", marginLeft: "21px" }}>
                      {item.nextEffects.map((effect, ei) => (
                        <div
                          key={ei}
                          style={{
                            fontSize: "11.5px",
                            color: "rgba(15,23,42,0.65)",
                            lineHeight: 1.55,
                            display: "flex",
                            gap: "6px",
                            alignItems: "flex-start",
                          }}
                        >
                          <span style={{ color: badgeColor, fontWeight: 700, flexShrink: 0 }}>
                            {ei + 1}차 →
                          </span>
                          <span>{effect}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div style={{
                padding: "8px 12px",
                fontSize: "11px",
                color: "var(--muted)",
                lineHeight: 1.5,
                background: "rgba(25,25,112,0.025)",
                borderRadius: "8px",
                fontWeight: 500,
              }}>
                {ko
                  ? "Munger: \"1차 결과만 보지 말고 그 다음까지 물어봐라.\" 이 경고는 순익 계산에 반영하지 않았어요 — 판단은 당신의 몫."
                  : "Munger: \"Ask what happens next, not just first-order.\" These warnings aren't subtracted — the call is yours."}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 12개월 현금 투영 (재무 페이지 전용) — 가정 유지 시 산술 결과, 예측 아님 ── */}
      {showProjection && projection && (
        <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(15,23,42,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: "12px", fontWeight: 750, color: "#191970", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              {ko ? "12개월 현금 투영" : "12-month cash projection"}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {GROWTH_SCENARIOS.map((g) => (
                <button key={g.id} type="button" onClick={() => setGrowthSel(g.id)}
                  style={{
                    fontSize: "11px", fontWeight: 650, padding: "5px 11px", borderRadius: 999, cursor: "pointer",
                    border: `1px solid ${growthSel === g.id ? "#191970" : "rgba(15,23,42,0.12)"}`,
                    background: growthSel === g.id ? "rgba(25,25,112,0.08)" : "transparent",
                    color: growthSel === g.id ? "#191970" : "var(--muted)",
                  }}>
                  {ko ? g.ko : g.en}
                </button>
              ))}
            </div>
          </div>

          {/* 월별 현금 막대 — 음수 월은 벽돌 */}
          {(() => {
            const maxAbs = Math.max(1, ...projection.points.map((pt) => Math.abs(pt.endCash)));
            return (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 96, marginBottom: 6 }}>
                {projection.points.map((pt) => {
                  const h = Math.max(4, Math.round((Math.abs(pt.endCash) / maxAbs) * 88));
                  const neg = pt.endCash < 0;
                  return (
                    <div key={pt.month} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3 }}>
                      <div title={`${pt.month}${ko ? "개월" : "mo"}: ${fmt(pt.endCash)}`}
                        style={{ width: "100%", height: h, borderRadius: 5, background: neg ? "rgba(182,76,76,0.75)" : "rgba(25,25,112,0.55)", alignSelf: "flex-end" }} />
                      <span style={{ fontSize: 8.5, color: "var(--muted)" }}>{pt.month}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 판독 — 소진/흑자/12개월 말 */}
          <div style={{ display: "grid", gap: 6 }}>
            {projection.cashOutMonth != null ? (
              <div style={{ fontSize: "12.5px", fontWeight: 650, color: "#b64c4c" }}>
                {ko
                  ? `이 가정이면 ${projection.cashOutMonth}개월차에 현금이 소진돼요 (부족 ${fmt(projection.shortfall ?? 0)}).`
                  : `Cash runs out in month ${projection.cashOutMonth} (short ${fmt(projection.shortfall ?? 0)}).`}
                {" "}
                <a href="/guides" style={{ color: "#191970", fontWeight: 700, textDecoration: "none" }}>
                  {ko ? "정책자금·대출 알아보기 →" : "Explore funding →"}
                </a>
              </div>
            ) : (
              <div style={{ fontSize: "12.5px", fontWeight: 650, color: "#1d3557" }}>
                {ko ? `12개월 내 현금 소진 없음 · 12개월 말 ${fmt(projection.finalCash)}` : `No cash-out within 12 months · ends at ${fmt(projection.finalCash)}`}
              </div>
            )}
            {projection.breakEvenMonth != null && projection.breakEvenMonth > 1 && (
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)" }}>
                {ko ? `월 순익 흑자 전환: ${projection.breakEvenMonth}개월차 (성장 가정 기준)` : `Monthly net turns positive in month ${projection.breakEvenMonth}`}
              </div>
            )}
            <div style={{ fontSize: "10.5px", color: "rgba(15,23,42,0.45)", lineHeight: 1.5 }}>
              {ko
                ? "가정 기반 산술 투영이에요(예측 아님) — 위 레버·성장 가정이 유지된다고 가정합니다. 단기 정밀 예측은 13주 자금흐름을 보세요."
                : "Arithmetic projection under the assumptions above — not a forecast. See the 13-week view for near-term precision."}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(243,246,251,0.91))",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 18px 42px rgba(15, 23, 42, 0.038)",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "2px",
};

const title: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  lineHeight: 1.1,
};

const metricLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 650,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "4px",
};
