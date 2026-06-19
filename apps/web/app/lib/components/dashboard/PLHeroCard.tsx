"use client";

import { AnimatedProgressBar, CountUp } from "./animations";
import {
  HEALTH_COLORS,
  COST_RATIO_THRESHOLDS,
  gradeKpi,
  type HealthGrade,
} from "@foundone/shared";

type Props = {
  totalSales: number;
  totalCosts: number;
  netProfit: number;
  bepProgress: number;
  ingredientRatio: number;
  laborRatio: number;
  rentRatio: number;
  /** @deprecated 2026-05-13 — 원가율 SSOT 는 CostStructureCard. 이 prop 은 받지만 사용 안 함 (caller 호환 유지). */
  primeCost?: number;
  projectedProfit: number;
  workingDays: number;
  ko: boolean;
  fmt: (n: number) => string;
  prevMonthSales?: number;
  prevMonthCosts?: number;
  breakEvenDailySales?: number;
  /** 월간 손익분기 매출 목표 (원) — 손익분기 카드의 *분모* 명시 */
  breakEvenMonthlySales?: number;
  todaySales?: number;
  todayBepProgress?: number;
  daysAboveBreakEven?: number;
  totalDaysRecorded?: number;
  /**
   * SSOT(cost-ratios.ts) 의 신뢰도 플래그.
   *  false 면 days<7 또는 매출 표본부족 → 모든 비율 0. UI 는 "—" 와 데이터 보강 안내 표시.
   *  종전엔 "재료비 0.0%" / "임대료 0.0%" 가 *실제 0%* 처럼 노출되어 사용자 혼란.
   */
  ratiosReady?: boolean;
  /** 월 환산 매출 — 비율 계산의 *실제 분모* (근거 라인 표시용) */
  monthlyRevenueEquivalent?: number;
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
  // primeCost 임계값 제거됨 (2026-05-13) — CostStructureCard 가 SSOT.
};
const hColor = (g: HealthGrade) => HEALTH_COLORS[g].dot;

export function PLHeroCard({
  totalSales, totalCosts, netProfit, bepProgress,
  ingredientRatio, laborRatio, rentRatio,
  projectedProfit, workingDays, ko, fmt,
  prevMonthSales, prevMonthCosts,
  breakEvenDailySales, breakEvenMonthlySales,
  todaySales, todayBepProgress,
  daysAboveBreakEven, totalDaysRecorded,
  ratiosReady,
  monthlyRevenueEquivalent,
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
  // 2026-05-13: primeCost 위험 판단 제거 — CostStructureCard (SSOT) 가 게이지로 일임.
  //   PLHeroCard 는 자기 직접 영역 (재료비/인건비/임대료/순익) 위험만 판단.
  // suppress unused warning for backward-compat prop (caller 가 여전히 전달)
  // (primeCost prop 은 더 이상 사용 안 하지만 호환성을 위해 type 에 남김)
  // "danger" 상응 = warning 또는 critical (4단계로 정밀화)
  const isDanger = (g: HealthGrade) => g === "warning" || g === "critical";
  const hasDanger = hasData && hasCosts && (
    isDanger(gradeKpi(safeIngredientRatio, T.ingredient)) ||
    isDanger(gradeKpi(safeLaborRatio, T.labor)) ||
    isDanger(gradeKpi(safeRentRatio, T.rent)) ||
    netProfit < 0
  );

  const currentMonth = new Date().toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "long" });

  // 2026-05-13: "원가율 (Prime)" 항목 제거됨 — CostStructureCard (Tier 2) 에 게이지로 SSOT 통합.
  //   재료비 + 인건비 가 여기에 이미 있으므로 그 합 (원가율) 은 시각적 중복. 사장님 인지 부하 ↓.
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
  ];

  /* diagnostics with specific actions */
  const diag: { text: string; ok: boolean }[] = [];
  if (hasData && !hasCosts) {
    // 매출은 있지만 비용 미입력
    diag.push({ text: ko
      ? `월 비용(${ingredientsLabel.ko}·${laborLabel.ko}·${rentLabel.ko})을 입력하면 손익 분석과 비용 구조 진단이 시작됩니다`
      : `Enter monthly costs (${ingredientsLabel.en}, ${laborLabel.en}, ${rentLabel.en}) to unlock P&L analysis`, ok: true });
  } else if (hasData && hasCosts) {
    // 2026-05-13: 원가율(Prime) 진단 제거 — CostStructureCard 가 SSOT.
    //   식자재 진단 (아래) 이 원가율 분해의 핵심이므로 정보 손실 없음.
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
    <div style={card} data-pl-hero>
      {/* header — eyebrow + (옵션) 위험 점 표시 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={eyebrow}>{currentMonth} {ko ? "손익" : "P&L"}</div>
          {hasDanger && (
            <span
              title={ko ? "비용 구조 점검 필요" : "Cost structure alert"}
              style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#b64c4c", flexShrink: 0 }}
            />
          )}
        </div>
      </div>

      {hasData ? (
        <>
          {/* 3 hero metrics — 미드나이트 톤으로 통일 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "rgba(25,25,112,0.08)", borderRadius: "14px", overflow: "hidden", marginTop: "10px", border: "1px solid rgba(25,25,112,0.06)" }}>
            {[
              { label: ko ? "매출" : "Revenue", raw: totalSales, signed: false, color: "#191970", change: pctChange(totalSales, prevMonthSales), projection: undefined as number | undefined },
              { label: ko ? "비용" : "Costs", raw: totalCosts, signed: false, color: "rgba(15,23,42,0.7)", change: pctChange(totalCosts, prevMonthCosts), projection: undefined },
              { label: ko ? "순이익" : "Profit", raw: netProfit, signed: true, color: netProfit >= 0 ? "#0f172a" : "#b64c4c", change: pctChange(netProfit, prevProfit), projection: hasCosts ? projectedProfit : undefined },
            ].map((m) => (
              <div key={m.label} style={{ background: "#ffffff", padding: "16px 12px", textAlign: "center" as const }}>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#191970", opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{m.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: m.color, letterSpacing: "-0.03em", marginTop: "4px", fontVariantNumeric: "tabular-nums" as const }}>
                  {m.signed && m.raw >= 0 && "+"}
                  <CountUp to={m.raw} duration={1.0} format={fmt} />
                </div>
                {m.change != null && (
                  <div style={{ fontSize: "11px", fontWeight: 700, color: m.label === (ko ? "비용" : "Costs") ? (m.change <= 0 ? "#1d3557" : "#b64c4c") : (m.change >= 0 ? "#1d3557" : "#b64c4c"), marginTop: "3px", letterSpacing: "-0.005em" }}>
                    {m.change >= 0 ? "↑" : "↓"}{Math.abs(m.change)}% {ko ? "전월" : "MoM"}
                  </div>
                )}
                {m.projection != null && (
                  <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: m.change != null ? "4px" : "6px", letterSpacing: "-0.005em" }}>
                    {ko ? "월말" : "EoM"} <span style={{ fontWeight: 700, color: m.projection >= 0 ? "#1d3557" : "#b64c4c" }}>{m.projection >= 0 ? "+" : ""}{fmt(m.projection)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 월간 BEP progress — 월 환산 매출 / 월 비용 */}
          {hasCosts && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "baseline" }}>
                <span style={{ fontSize: "11.5px", color: "#191970", opacity: 0.7, fontWeight: 600 }}>
                  {ko ? "월간 손익분기 달성" : "Monthly break-even"}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: bepProgress >= 100 ? "#1d3557" : "#191970", fontVariantNumeric: "tabular-nums" as const }}>
                  <CountUp to={bepProgress} duration={1.0} format={(n) => `${Math.round(n)}%`} />
                </span>
              </div>
              <AnimatedProgressBar
                pct={bepProgress}
                color={bepProgress >= 100 ? "#1d3557" : "#191970"}
                trackColor="rgba(25,25,112,0.08)"
                height={6}
                borderRadius={3}
                delay={0.4}
                duration={1.1}
              />
              {/* 분자·분모 명시 — 사용자가 *왜 N%인지* 즉시 이해 */}
              {monthlyRevenueEquivalent != null && (
                <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "5px", letterSpacing: "-0.005em" }}>
                  {ko
                    ? `월 환산 매출 ${fmt(monthlyRevenueEquivalent)}`
                    : `Monthly equiv. revenue ${fmt(monthlyRevenueEquivalent)}`}
                  {" · "}
                  {ko ? `월 비용 ${fmt(totalCosts)}` : `Monthly cost ${fmt(totalCosts)}`}
                  {breakEvenMonthlySales != null && breakEvenMonthlySales > 0 && (
                    <>
                      {" · "}
                      {ko
                        ? `목표 ${fmt(breakEvenMonthlySales)}`
                        : `Target ${fmt(breakEvenMonthlySales)}`}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* daily BEP real-time tracking */}
          {breakEvenDailySales != null && breakEvenDailySales > 0 && (
            <div style={{
              marginTop: "12px",
              padding: "11px 13px",
              borderRadius: "12px",
              background: todayBepProgress != null && todayBepProgress >= 100 ? "rgba(29,53,87,0.05)" : "rgba(25,25,112,0.03)",
              border: todayBepProgress != null && todayBepProgress >= 100 ? "1px solid rgba(29,53,87,0.16)" : "1px solid rgba(25,25,112,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#191970", opacity: 0.7 }}>
                  {ko ? "오늘 일일 손익분기" : "Today's daily BEP"}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: todayBepProgress != null && todayBepProgress >= 100 ? "#1d3557" : "#0f0f4a", fontVariantNumeric: "tabular-nums" as const }}>
                  {(() => {
                    const gap = (todaySales ?? 0) - breakEvenDailySales;
                    if (gap >= 0) return ko ? `BEP +${fmt(gap)} 초과` : `BEP +${fmt(gap)}`;
                    return ko ? `BEP까지 ${fmt(Math.abs(gap))} 남음` : `${fmt(Math.abs(gap))} to BEP`;
                  })()}
                </span>
              </div>
              {/* 일일 BEP 분자·분모 명시 */}
              <div style={{ fontSize: "10.5px", color: "var(--muted)", marginBottom: "7px", letterSpacing: "-0.005em" }}>
                {ko
                  ? `오늘 매출 ${fmt(todaySales ?? 0)} / 일일 BEP 목표 ${fmt(breakEvenDailySales)}`
                  : `Today ${fmt(todaySales ?? 0)} / Daily BEP target ${fmt(breakEvenDailySales)}`}
              </div>
              <AnimatedProgressBar
                pct={todayBepProgress ?? 0}
                color={todayBepProgress != null && todayBepProgress >= 100 ? "#1d3557" : "#191970"}
                trackColor="rgba(25,25,112,0.08)"
                height={6}
                borderRadius={3}
                delay={0.5}
                duration={0.95}
              />
              {daysAboveBreakEven != null && totalDaysRecorded != null && totalDaysRecorded > 0 && (
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "7px", fontWeight: 500 }}>
                  {ko
                    ? `이번 달 ${totalDaysRecorded}일 중 ${daysAboveBreakEven}일 달성`
                    : `${daysAboveBreakEven} of ${totalDaysRecorded} days above BEP`}
                </div>
              )}
            </div>
          )}

          {/* ratio bars — ratiosReady=false 면 "—" + 데이터 보강 안내로 대체.
              종전엔 SSOT 가 ready=false 일 때 0 반환 → UI 가 "재료비 0.0%" 로 *실제 0%* 처럼 노출 (사용자 혼란). */}
          {hasCosts && ratiosReady === false && (
            <div style={{
              marginTop: "12px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(25,25,112,0.04)",
              border: "1px dashed rgba(25,25,112,0.18)",
              display: "flex", alignItems: "flex-start", gap: "8px",
            }}>
              <span style={{ fontSize: "12px", lineHeight: 1.4, color: "#191970", opacity: 0.7, flexShrink: 0 }}>ⓘ</span>
              <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>
                {ko ? (
                  <>
                    <b style={{ color: "#0f172a" }}>비용 비율은 아직 계산되지 않았습니다.</b>
                    <br />
                    {workingDays < 7
                      ? `매출 ${workingDays}일치만 입력됨 — 7일+ 입력 후 정확한 ${ingredientsLabel.ko}·${laborLabel.ko}·${rentLabel.ko} 비율이 표시됩니다.`
                      : "월 환산 매출이 비용 대비 너무 작아 비율 신뢰 불가. 매출을 더 입력하거나 월말까지 데이터를 모아주세요."}
                  </>
                ) : (
                  <>
                    <b style={{ color: "#0f172a" }}>Cost ratios not yet computed.</b>
                    <br />
                    {workingDays < 7
                      ? `Only ${workingDays} day(s) of sales — need 7+ for reliable ${ingredientsLabel.en}/${laborLabel.en}/${rentLabel.en} ratios.`
                      : "Sample too small vs. costs — add more sales entries."}
                  </>
                )}
              </div>
            </div>
          )}
          {hasCosts && ratiosReady !== false && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
              {ratios.map((r) => {
                const isOutlier = r.value > 200 || r.value < 0;
                const isZero = r.value <= 0;
                return (
                <div key={r.label} style={{ padding: "10px 12px", background: "rgba(25,25,112,0.025)", borderRadius: "10px", border: "1px solid rgba(25,25,112,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.6)", fontWeight: 600 }}>{r.label}</span>
                    <span style={{
                      fontSize: "12px", fontWeight: 700,
                      color: isOutlier ? "rgba(15,23,42,0.4)" : isZero ? "rgba(15,23,42,0.4)" : hColor(r.h),
                      fontVariantNumeric: "tabular-nums" as const,
                      letterSpacing: "-0.005em",
                    }}>
                      {isOutlier ? (ko ? "확인 필요" : "Check data")
                        : isZero ? (ko ? "미입력" : "Not entered")
                        : `${r.value.toFixed(1)}%`}
                    </span>
                  </div>
                  <div style={{ position: "relative", marginTop: "6px" }}>
                    <AnimatedProgressBar
                      pct={isOutlier || isZero ? 0 : Math.min(r.value, 100)}
                      color={hColor(r.h)}
                      trackColor={`${hColor(r.h)}14`}
                      height={3}
                      borderRadius={2}
                      delay={0.55}
                      duration={0.85}
                    />
                    {/* benchmark marker */}
                    <div style={{
                      position: "absolute", top: "-2px",
                      left: `${Math.min(r.benchmark, 100)}%`,
                      width: "1.5px", height: "7px",
                      background: "rgba(25,25,112,0.45)",
                    }} title={`${ko ? "업계 평균" : "Industry avg"} ${r.benchmark}%`} />
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(25,25,112,0.45)", marginTop: "4px", fontWeight: 500 }}>
                    {ko ? "업계" : "avg"} {r.benchmark}%
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* diagnostics */}
          {diag.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px", marginTop: "14px" }}>
              {diag.map((d, i) => (
                <div key={i} style={{
                  fontSize: "12.5px", lineHeight: 1.5, padding: "10px 12px", borderRadius: "10px",
                  background: d.ok ? "rgba(29,53,87,0.06)" : "rgba(182,76,76,0.05)",
                  color: d.ok ? "#1d3557" : "#b64c4c",
                  border: d.ok ? "1px solid rgba(29,53,87,0.18)" : "1px solid rgba(182,76,76,0.18)",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                }}>
                  <span style={{ fontSize: "13px", lineHeight: 1.4, flexShrink: 0 }}>{d.ok ? "✓" : "⚠"}</span>
                  <span>{d.text}</span>
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

/* ─── Styles — 미드나이트 톤으로 통일 (CashflowHeroCard와 같은 카드 patterns) ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "22px",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
  display: "flex",
  flexDirection: "column",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#191970",
  opacity: 0.7,
};
