"use client";

import { useMemo, useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, GitBranch, AlertTriangle } from "lucide-react";

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

type Props = {
  ko: boolean;
  monthlySales: number;
  monthlyCosts: MonthlyCosts;
  capitalLeft: number;
};

/**
 * What-If 경영 시나리오 시뮬레이터.
 * 슬라이더로 매출/비용 조정 → 월 순익, 런웨이, BEP 실시간 재계산.
 * "진단"에서 "의사결정"으로 진화.
 */
export function WhatIfSimulator({ ko, monthlySales, monthlyCosts, capitalLeft }: Props) {
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

  const [showSecondOrder, setShowSecondOrder] = useState(false);

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

    // 재료비 -15%+
    if (ingredientsMult <= 85) {
      const delta = 100 - ingredientsMult;
      chain.push({
        trigger: ko ? `재료비 ${delta}% 감소` : `Ingredients -${delta}%`,
        firstOrder: ko ? "월 순익 +" : "Monthly net +",
        nextEffects: [
          ko ? "품질 저하 가능 (원재료 등급·공급처 변경 시)" : "Quality may drop (if grade/supplier changes)",
          ko ? "리뷰 점수 하락 → 고객 이탈 가능" : "Review scores may drop → customer churn",
          ko ? "대안: 낭비·재고 관리로 재료비 줄이는 게 안전" : "Safer: cut via waste management, not grade",
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
  }, [salesMult, ingredientsMult, laborMult, rentMult, marketingMult, ko]);

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
    { label: { ko: "매출", en: "Revenue" }, value: salesMult, setValue: setSalesMult, baseAmount: monthlySales, direction: "positive" },
    { label: { ko: "재료비", en: "Ingredients" }, value: ingredientsMult, setValue: setIngredientsMult, baseAmount: monthlyCosts.ingredients, direction: "negative" },
    { label: { ko: "인건비", en: "Labor" }, value: laborMult, setValue: setLaborMult, baseAmount: monthlyCosts.labor, direction: "negative" },
    { label: { ko: "임대료", en: "Rent" }, value: rentMult, setValue: setRentMult, baseAmount: monthlyCosts.rent, direction: "negative" },
    { label: { ko: "마케팅비", en: "Marketing" }, value: marketingMult, setValue: setMarketingMult, baseAmount: monthlyCosts.marketing, direction: "negative" },
  ];

  return (
    <section style={card} className="bento-card">
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={eyebrow}>{ko ? "What-If 시뮬레이터" : "What-If Simulator"}</div>
          <div style={title}>{ko ? "만약 이렇게 바꾸면?" : "What if we change..."}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginTop: "4px" }}>
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
          ? (scenario.net > currentNet ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.04)")
          : "rgba(15,23,42,0.03)",
        border: `1px solid ${hasChanges ? (scenario.net > currentNet ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.1)") : "rgba(15,23,42,0.04)"}`,
        marginBottom: "16px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <div>
            <div style={metricLabel}>{ko ? "월 순익 변화" : "Monthly net Δ"}</div>
            <div style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: scenario.net >= 0 ? "#059669" : "#dc2626",
              lineHeight: 1.1,
            }}>
              {scenario.net >= 0 ? "+" : ""}{fmt(scenario.net)}
            </div>
            {hasChanges && netDelta !== 0 && (
              <div style={{ fontSize: "11px", fontWeight: 650, color: netDelta > 0 ? "#059669" : "#dc2626", marginTop: "2px" }}>
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
              color: scenario.runway < 0 ? "#059669" : scenario.runway >= 6 ? "#059669" : scenario.runway >= 3 ? "#d97706" : "#dc2626",
              lineHeight: 1.1,
            }}>
              {scenario.runway < 0 ? (ko ? "∞" : "∞") : `${scenario.runway}${ko ? "개월" : "mo"}`}
            </div>
            {hasChanges && runwayDelta !== 0 && currentRunway >= 0 && (
              <div style={{ fontSize: "11px", fontWeight: 650, color: runwayDelta > 0 ? "#059669" : "#dc2626", marginTop: "2px" }}>
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
              color: scenario.bep <= 80 ? "#059669" : scenario.bep <= 95 ? "#d97706" : "#dc2626",
              lineHeight: 1.1,
            }}>
              {Math.round(scenario.bep)}%
            </div>
            <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>
              {ko ? "매출 대비" : "of revenue"}
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
                  <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)" }}>
                    {fmt(s.baseAmount)} → <span style={{ color: delta !== 0 ? (isGoodDirection ? "#059669" : "#dc2626") : "rgba(15,23,42,0.5)", fontWeight: 650 }}>
                      {fmt(newAmount)}
                    </span>
                  </span>
                </div>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: delta === 0 ? "rgba(15,23,42,0.5)" : isGoodDirection ? "#059669" : "#dc2626",
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
                  accentColor: delta === 0 ? "#94a3b8" : isGoodDirection ? "#059669" : "#dc2626",
                }}
              />
              {amountDelta !== 0 && (
                <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)", marginTop: "2px", textAlign: "right" }}>
                  {s.direction === "positive" ? (ko ? "월 매출 기여" : "Monthly revenue impact") : (ko ? "월 절감/증가" : "Monthly savings/increase")}: <span style={{ color: isGoodDirection ? "#059669" : "#dc2626", fontWeight: 650 }}>
                    {amountDelta > 0 ? "+" : ""}{fmt(amountDelta)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 인사이트 메시지 */}
      {hasChanges && (
        <div style={{
          marginTop: "14px",
          padding: "10px 12px",
          borderRadius: "10px",
          background: "rgba(37,99,235,0.04)",
          border: "1px solid rgba(37,99,235,0.08)",
          fontSize: "12px",
          color: "rgba(15,23,42,0.7)",
          lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 660, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Lightbulb size={12} strokeWidth={1.5} color="#f59e0b" />
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
              background: "rgba(15,23,42,0.02)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(15,23,42,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(15,23,42,0.02)";
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
                const bg = item.severity === "high" ? "rgba(220,38,38,0.03)" : "rgba(217,119,6,0.03)";
                const border = item.severity === "high" ? "rgba(220,38,38,0.1)" : "rgba(217,119,6,0.1)";
                const badgeColor = item.severity === "high" ? "#b91c1c" : "#b45309";

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
                color: "rgba(15,23,42,0.5)",
                lineHeight: 1.5,
                background: "rgba(15,23,42,0.02)",
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
    </section>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "24px",
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
  color: "rgba(15,23,42,0.4)",
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
  color: "rgba(15,23,42,0.4)",
  marginBottom: "4px",
};
