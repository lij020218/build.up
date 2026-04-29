"use client";

import { AnimatedProgressBar, CountUp } from "./animations";
import {
  HEALTH_COLORS,
  COST_RATIO_THRESHOLDS,
  gradeKpi,
  type HealthGrade,
} from "@build-up/shared";

type Props = {
  totalSales: number;
  totalCosts: number;
  netProfit: number;
  bepProgress: number;
  ingredientRatio: number;
  laborRatio: number;
  rentRatio: number;
  primeCost: number;
  projectedProfit: number;
  workingDays: number;
  ko: boolean;
  fmt: (n: number) => string;
  prevMonthSales?: number;
  prevMonthCosts?: number;
  breakEvenDailySales?: number;
  todaySales?: number;
  todayBepProgress?: number;
  daysAboveBreakEven?: number;
  totalDaysRecorded?: number;
  /** 업종별 COGS 레이블 (기본: 재료비/Food) */
  cogsLabel?: { ko: string; en: string };
  /**
   * 업종별 비용 라벨 (business-context.ts 의 expenseFields).
   * 미전달 시 음식점 디폴트 라벨로 fallback.
   * 스타트업이면 ingredients = "서버·SaaS" / labor = "인건비" 등으로 자동 분기.
   */
  expenseFields?: Array<{ fieldKey: string; label: { ko: string; en: string } }>;
};

// SSOT 통합: 모든 임계값은 unified-health.ts/COST_RATIO_THRESHOLDS 참조
// → 같은 65% 가 PLHeroCard / CostCompositionDonutCard / AI 프롬프트에서 동일 판정
const FOOD_THR = COST_RATIO_THRESHOLDS.restaurant;
const T = {
  ingredient: FOOD_THR.ingredients!,  // healthy 35 / caution 40 / warning 45
  labor:      FOOD_THR.labor!,        // healthy 25 / caution 33 / warning 40
  rent:       FOOD_THR.rent!,         // healthy 8  / caution 12 / warning 15
  primeCost:  FOOD_THR.primeCost!,    // healthy 65 / caution 70 / warning 75
};
const hColor = (g: HealthGrade) => HEALTH_COLORS[g].dot;

export function PLHeroCard({
  totalSales, totalCosts, netProfit, bepProgress,
  ingredientRatio, laborRatio, rentRatio, primeCost,
  projectedProfit, workingDays, ko, fmt,
  prevMonthSales, prevMonthCosts,
  breakEvenDailySales, todaySales, todayBepProgress,
  daysAboveBreakEven, totalDaysRecorded,
  cogsLabel,
  expenseFields,
}: Props) {
  // 업종별 라벨 lookup (없으면 fallback)
  const labelOf = (fieldKey: string, fallback: { ko: string; en: string }) => {
    const found = expenseFields?.find((f) => f.fieldKey === fieldKey);
    return found?.label ?? fallback;
  };
  const ingredientsLabel = cogsLabel ?? labelOf("ingredients", { ko: "재료비", en: "Food" });
  const laborLabel = labelOf("labor", { ko: "인건비", en: "Labor" });
  const rentLabel = labelOf("rent", { ko: "임대료", en: "Rent" });
  const prevProfit = prevMonthSales != null && prevMonthCosts != null ? prevMonthSales - prevMonthCosts : undefined;
  const pctChange = (cur: number, prev: number | undefined) =>
    prev && prev > 0 ? Math.round(((cur - prev) / prev) * 100) : undefined;
  const hasData = totalSales > 0;
  const hasCosts = totalCosts > 0;
  // NaN 방지: 비용 미입력 시 0으로 대체
  const safeIngredientRatio = isFinite(ingredientRatio) ? ingredientRatio : 0;
  const safeLaborRatio = isFinite(laborRatio) ? laborRatio : 0;
  const safeRentRatio = isFinite(rentRatio) ? rentRatio : 0;
  const safePrimeCost = isFinite(primeCost) ? primeCost : 0;
  // "danger" 상응 = warning 또는 critical (4단계로 정밀화)
  const isDanger = (g: HealthGrade) => g === "warning" || g === "critical";
  const hasDanger = hasData && hasCosts && (
    isDanger(gradeKpi(safeIngredientRatio, T.ingredient)) ||
    isDanger(gradeKpi(safeLaborRatio, T.labor)) ||
    isDanger(gradeKpi(safePrimeCost, T.primeCost)) ||
    netProfit < 0
  );

  const currentMonth = new Date().toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "long" });

  const ratios = [
    { label: ingredientsLabel[ko ? "ko" : "en"],
      value: safeIngredientRatio, target: `${T.ingredient.healthy}-${T.ingredient.caution}%`,
      benchmark: T.ingredient.healthy,
      h: hasCosts ? gradeKpi(safeIngredientRatio, T.ingredient) : ("healthy" as HealthGrade) },
    { label: laborLabel[ko ? "ko" : "en"],
      value: safeLaborRatio, target: `~${T.labor.healthy}-${T.labor.caution}%`,
      benchmark: T.labor.healthy,
      h: hasCosts ? gradeKpi(safeLaborRatio, T.labor) : ("healthy" as HealthGrade) },
    { label: rentLabel[ko ? "ko" : "en"],
      value: safeRentRatio, target: `~${T.rent.healthy}-${T.rent.caution}%`,
      benchmark: T.rent.healthy,
      h: hasCosts ? gradeKpi(safeRentRatio, T.rent) : ("healthy" as HealthGrade) },
    { label: ko ? "원가율" : "Prime",
      value: safePrimeCost, target: `~${T.primeCost.healthy}%`,
      benchmark: T.primeCost.healthy - 2,
      h: hasCosts ? gradeKpi(safePrimeCost, T.primeCost) : ("healthy" as HealthGrade) },
  ];

  /* diagnostics with specific actions */
  const diag: { text: string; ok: boolean }[] = [];
  if (hasData && !hasCosts) {
    // 매출은 있지만 비용 미입력
    diag.push({ text: ko
      ? `월 비용(${ingredientsLabel.ko}·${laborLabel.ko}·${rentLabel.ko})을 입력하면 손익 분석과 비용 구조 진단이 시작됩니다`
      : `Enter monthly costs (${ingredientsLabel.en}, ${laborLabel.en}, ${rentLabel.en}) to unlock P&L analysis`, ok: true });
  } else if (hasData && hasCosts) {
    if (isDanger(gradeKpi(safePrimeCost, T.primeCost))) {
      const gap = safePrimeCost - T.primeCost.healthy;
      diag.push({ text: ko
        ? `원가율 ${safePrimeCost.toFixed(1)}% (목표 ${T.primeCost.healthy}%). 상위 3개 메뉴 원가를 ${Math.ceil(gap)}%p 낮추면 달성`
        : `Prime cost ${safePrimeCost.toFixed(1)}% (target ${T.primeCost.healthy}%). Cut top 3 menu costs by ${Math.ceil(gap)}%p`, ok: false });
    }
    if (isDanger(gradeKpi(safeIngredientRatio, T.ingredient)))
      diag.push({ text: ko
        ? `${ingredientsLabel.ko} ${safeIngredientRatio.toFixed(1)}%. 공급가 재협상·대체 공급처 검토 또는 단가 조정 필요`
        : `${ingredientsLabel.en} ${safeIngredientRatio.toFixed(1)}%. Renegotiate suppliers or adjust pricing`, ok: false });
    if (netProfit < 0) {
      const dailyDeficit = Math.round(Math.abs(netProfit) / 26);
      diag.push({ text: ko
        ? `이달 적자 ${fmt(Math.abs(netProfit))}. 일매출 ${fmt(dailyDeficit)} 추가 필요`
        : `Projected loss ${fmt(Math.abs(netProfit))}. Need ${fmt(dailyDeficit)} more daily`, ok: false });
    }
    if (diag.length === 0)
      diag.push({ text: ko ? "모든 지표 건강 범위. 이 구조를 유지하세요" : "All metrics healthy. Maintain this structure", ok: true });
  }

  return (
    <div style={card}>
      {/* header — eyebrow + (옵션) 위험 점 표시 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={eyebrow}>{currentMonth} {ko ? "손익" : "P&L"}</div>
          {hasDanger && (
            <span
              title={ko ? "비용 구조 점검 필요" : "Cost structure alert"}
              style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff3b30", flexShrink: 0 }}
            />
          )}
        </div>
      </div>

      {hasData ? (
        <>
          {/* 3 hero metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "rgba(0,0,0,0.04)", borderRadius: "16px", overflow: "hidden", marginTop: "8px" }}>
            {[
              { label: ko ? "매출" : "Revenue", raw: totalSales, signed: false, color: "#1d3557", change: pctChange(totalSales, prevMonthSales), projection: undefined as number | undefined },
              { label: ko ? "비용" : "Costs", raw: totalCosts, signed: false, color: "#86868b", change: pctChange(totalCosts, prevMonthCosts), projection: undefined },
              { label: ko ? "순이익" : "Profit", raw: netProfit, signed: true, color: netProfit >= 0 ? "#34c759" : "#ff3b30", change: pctChange(netProfit, prevProfit), projection: hasCosts ? projectedProfit : undefined },
            ].map((m) => (
              <div key={m.label} style={{ background: "rgba(255,255,255,0.9)", padding: "16px 12px", textAlign: "center" as const }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#86868b", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{m.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: m.color, letterSpacing: "-0.03em", marginTop: "4px" }}>
                  {m.signed && m.raw >= 0 && "+"}
                  <CountUp to={m.raw} duration={1.0} format={fmt} />
                </div>
                {m.change != null && (
                  <div style={{ fontSize: "11px", fontWeight: 600, color: m.label === (ko ? "비용" : "Costs") ? (m.change <= 0 ? "#177245" : "#b42318") : (m.change >= 0 ? "#177245" : "#b42318"), marginTop: "2px" }}>
                    {m.change >= 0 ? "↑" : "↓"}{Math.abs(m.change)}% {ko ? "전월" : "MoM"}
                  </div>
                )}
                {m.projection != null && (
                  <div style={{ fontSize: "10.5px", color: "rgba(15,23,42,0.45)", marginTop: m.change != null ? "4px" : "6px", letterSpacing: "-0.005em" }}>
                    {ko ? "월말" : "EoM"} <span style={{ fontWeight: 650, color: m.projection >= 0 ? "#177245" : "#b42318" }}>{m.projection >= 0 ? "+" : ""}{fmt(m.projection)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* BEP progress */}
          {hasCosts && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#86868b" }}>{ko ? "손익분기 달성" : "Break-even"}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: bepProgress >= 100 ? "#34c759" : "#007aff" }}>
                  <CountUp to={bepProgress} duration={1.0} format={(n) => `${Math.round(n)}%`} />
                </span>
              </div>
              <AnimatedProgressBar
                pct={bepProgress}
                color={bepProgress >= 100 ? "#34c759" : "#007aff"}
                height={6}
                borderRadius={3}
                delay={0.4}
                duration={1.1}
              />
            </div>
          )}

          {/* daily BEP real-time tracking
              - 매출 SSOT 원칙: "오늘 매출 원숫자" 는 ActivitySnapshotCard 가 책임진다.
              - 여기선 BEP 까지 격차 (gap) 만 보여줘서 같은 숫자가 두 번 나오지 않게.
              - 미달성: "BEP까지 X만원 남음", 달성: "BEP +Y만원 초과" */}
          {breakEvenDailySales != null && breakEvenDailySales > 0 && (
            <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "12px", background: todayBepProgress != null && todayBepProgress >= 100 ? "rgba(52,199,89,0.05)" : "rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#86868b" }}>
                  {ko ? "오늘 손익분기" : "Today's BEP"}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: todayBepProgress != null && todayBepProgress >= 100 ? "#34c759" : "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                  {(() => {
                    const gap = (todaySales ?? 0) - breakEvenDailySales;
                    if (gap >= 0) return ko ? `BEP +${fmt(gap)} 초과` : `BEP +${fmt(gap)}`;
                    return ko ? `BEP까지 ${fmt(Math.abs(gap))} 남음` : `${fmt(Math.abs(gap))} to BEP`;
                  })()}
                </span>
              </div>
              <AnimatedProgressBar
                pct={todayBepProgress ?? 0}
                color={todayBepProgress != null && todayBepProgress >= 100 ? "#34c759" : "#2563eb"}
                height={6}
                borderRadius={3}
                delay={0.5}
                duration={0.95}
              />
              {daysAboveBreakEven != null && totalDaysRecorded != null && totalDaysRecorded > 0 && (
                <div style={{ fontSize: "11px", color: "#86868b", marginTop: "6px" }}>
                  {ko
                    ? `이번 달 ${totalDaysRecorded}일 중 ${daysAboveBreakEven}일 달성`
                    : `${daysAboveBreakEven} of ${totalDaysRecorded} days above BEP`}
                </div>
              )}
            </div>
          )}

          {/* ratio bars — 이상치(200% 초과)는 "데이터 확인 필요"로 대체 */}
          {hasCosts && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
              {ratios.map((r) => {
                const isOutlier = r.value > 200 || r.value < 0;
                return (
                <div key={r.label} style={{ padding: "8px 10px", background: "rgba(0,0,0,0.02)", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#86868b" }}>{r.label}</span>
                    <span style={{
                      fontSize: "12px", fontWeight: 700,
                      color: isOutlier ? "#86868b" : hColor(r.h),
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {isOutlier ? (ko ? "확인 필요" : "Check data") : `${r.value.toFixed(1)}%`}
                    </span>
                  </div>
                  <div style={{ position: "relative", marginTop: "6px" }}>
                    <AnimatedProgressBar
                      pct={isOutlier ? 0 : Math.min(r.value, 100)}
                      color={hColor(r.h)}
                      trackColor={`${hColor(r.h)}18`}
                      height={3}
                      borderRadius={2}
                      delay={0.55}
                      duration={0.85}
                    />
                    {/* benchmark marker */}
                    <div style={{
                      position: "absolute", top: "-2px",
                      left: `${Math.min(r.benchmark, 100)}%`,
                      width: "1px", height: "7px",
                      background: "rgba(0,0,0,0.3)",
                    }} title={`${ko ? "업계 평균" : "Industry avg"} ${r.benchmark}%`} />
                  </div>
                  <div style={{ fontSize: "9px", color: "rgba(0,0,0,0.3)", marginTop: "3px" }}>
                    {ko ? "업계" : "avg"} {r.benchmark}%
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* diagnostics */}
          {diag.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px", marginTop: "12px" }}>
              {diag.map((d, i) => (
                <div key={i} style={{
                  fontSize: "12px", lineHeight: 1.4, padding: "8px 10px", borderRadius: "8px",
                  background: d.ok ? "rgba(52,199,89,0.06)" : "rgba(255,59,48,0.05)",
                  color: d.ok ? "#248a3d" : "#ff3b30",
                }}>
                  {d.ok ? "✓" : "⚠"} {d.text}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "32px 0", textAlign: "center" as const }}>
          <div style={{ fontSize: "14px", color: "#86868b" }}>
            {ko ? "매출 데이터를 입력하면 손익 현황이 표시됩니다" : "Enter sales data to see P&L analysis"}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
  border: "1px solid rgba(17,17,17,0.06)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 24px rgba(17,17,17,0.035)",
  display: "flex",
  flexDirection: "column",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#86868b",
};
