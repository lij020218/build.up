"use client";

type HealthLevel = "good" | "caution" | "danger";

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
};

const health = (val: number, good: number, caution: number): HealthLevel =>
  val <= good ? "good" : val <= caution ? "caution" : "danger";
const hColor = (h: HealthLevel) =>
  h === "good" ? "#34c759" : h === "caution" ? "#ff9f0a" : "#ff3b30";

export function PLHeroCard({
  totalSales, totalCosts, netProfit, bepProgress,
  ingredientRatio, laborRatio, rentRatio, primeCost,
  projectedProfit, workingDays, ko, fmt,
  prevMonthSales, prevMonthCosts,
  breakEvenDailySales, todaySales, todayBepProgress,
  daysAboveBreakEven, totalDaysRecorded,
  cogsLabel,
}: Props) {
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
  const hasDanger = hasData && hasCosts && (
    health(safeIngredientRatio, 35, 40) === "danger" ||
    health(safeLaborRatio, 30, 35) === "danger" ||
    health(safePrimeCost, 60, 65) === "danger" ||
    netProfit < 0
  );

  const currentMonth = new Date().toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "long" });

  const ratios = [
    { label: cogsLabel ? cogsLabel[ko ? "ko" : "en"] : (ko ? "재료비" : "Food"), value: safeIngredientRatio, target: "30-35%", benchmark: 32, h: hasCosts ? health(safeIngredientRatio, 35, 40) : ("good" as HealthLevel) },
    { label: ko ? "인건비" : "Labor", value: safeLaborRatio, target: "~30%", benchmark: 28, h: hasCosts ? health(safeLaborRatio, 30, 35) : ("good" as HealthLevel) },
    { label: ko ? "임대료" : "Rent", value: safeRentRatio, target: "~10%", benchmark: 9, h: hasCosts ? health(safeRentRatio, 10, 15) : ("good" as HealthLevel) },
    { label: ko ? "원가율" : "Prime", value: safePrimeCost, target: "~60%", benchmark: 58, h: hasCosts ? health(safePrimeCost, 60, 65) : ("good" as HealthLevel) },
  ];

  /* diagnostics with specific actions */
  const diag: { text: string; ok: boolean }[] = [];
  if (hasData && !hasCosts) {
    // 매출은 있지만 비용 미입력
    diag.push({ text: ko
      ? "월 비용(재료비·인건비·임대료)을 입력하면 손익 분석과 비용 구조 진단이 시작됩니다"
      : "Enter monthly costs (ingredients, labor, rent) to unlock P&L analysis and cost diagnostics", ok: true });
  } else if (hasData && hasCosts) {
    if (health(safePrimeCost, 60, 65) === "danger") {
      const gap = safePrimeCost - 65;
      diag.push({ text: ko
        ? `원가율 ${safePrimeCost.toFixed(1)}% (목표 65%). 상위 3개 메뉴 원가를 ${Math.ceil(gap)}%p 낮추면 달성`
        : `Prime cost ${safePrimeCost.toFixed(1)}% (target 65%). Cut top 3 menu costs by ${Math.ceil(gap)}%p`, ok: false });
    }
    if (health(safeIngredientRatio, 35, 40) === "danger")
      diag.push({ text: ko ? `재료비 ${safeIngredientRatio.toFixed(1)}%. 식재료 납품가 재협상 또는 메뉴 가격 조정 필요` : `Food cost ${safeIngredientRatio.toFixed(1)}%. Renegotiate supplier prices or adjust menu pricing`, ok: false });
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
      {/* danger banner */}
      {hasDanger && (
        <div style={{ padding: "10px 16px", background: "rgba(255,59,48,0.05)", borderRadius: "12px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px" }}>⚠</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#ff3b30" }}>
            {ko ? "비용 구조 점검 필요" : "Cost structure alert"}
          </span>
        </div>
      )}

      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={eyebrow}>{currentMonth} {ko ? "손익" : "P&L"}</div>
        {hasData && hasCosts && (
          <div style={{ fontSize: "12px", color: projectedProfit >= 0 ? "#34c759" : "#ff3b30", fontWeight: 600 }}>
            {ko ? "월말 예상" : "Projected"} {projectedProfit >= 0 ? "+" : ""}{fmt(projectedProfit)}
          </div>
        )}
      </div>

      {hasData ? (
        <>
          {/* 3 hero metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "rgba(0,0,0,0.04)", borderRadius: "16px", overflow: "hidden", marginTop: "8px" }}>
            {[
              { label: ko ? "매출" : "Revenue", value: fmt(totalSales), color: "#1d3557", change: pctChange(totalSales, prevMonthSales) },
              { label: ko ? "비용" : "Costs", value: fmt(totalCosts), color: "#86868b", change: pctChange(totalCosts, prevMonthCosts) },
              { label: ko ? "순이익" : "Profit", value: `${netProfit >= 0 ? "+" : ""}${fmt(netProfit)}`, color: netProfit >= 0 ? "#34c759" : "#ff3b30", change: pctChange(netProfit, prevProfit) },
            ].map((m) => (
              <div key={m.label} style={{ background: "rgba(255,255,255,0.9)", padding: "16px 12px", textAlign: "center" as const }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#86868b", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{m.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 750, color: m.color, letterSpacing: "-0.03em", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                {m.change != null && (
                  <div style={{ fontSize: "11px", fontWeight: 600, color: m.label === (ko ? "비용" : "Costs") ? (m.change <= 0 ? "#177245" : "#b42318") : (m.change >= 0 ? "#177245" : "#b42318"), marginTop: "2px" }}>
                    {m.change >= 0 ? "↑" : "↓"}{Math.abs(m.change)}% {ko ? "전월" : "MoM"}
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
                <span style={{ fontSize: "11px", fontWeight: 700, color: bepProgress >= 100 ? "#34c759" : "#007aff", fontVariantNumeric: "tabular-nums" }}>
                  {bepProgress.toFixed(0)}%
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "3px",
                  width: `${bepProgress}%`,
                  background: bepProgress >= 100 ? "#34c759" : "#007aff",
                  transition: "width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
                }} />
              </div>
            </div>
          )}

          {/* daily BEP real-time tracking */}
          {breakEvenDailySales != null && breakEvenDailySales > 0 && (
            <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "12px", background: todayBepProgress != null && todayBepProgress >= 100 ? "rgba(52,199,89,0.05)" : "rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#86868b" }}>
                  {ko ? "오늘 손익분기" : "Today's BEP"}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: todayBepProgress != null && todayBepProgress >= 100 ? "#34c759" : "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(todaySales ?? 0)} / {fmt(breakEvenDailySales)}
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "3px",
                  width: `${todayBepProgress ?? 0}%`,
                  background: todayBepProgress != null && todayBepProgress >= 100 ? "#34c759" : "#2563eb",
                  transition: "width 0.5s ease",
                }} />
              </div>
              {daysAboveBreakEven != null && totalDaysRecorded != null && totalDaysRecorded > 0 && (
                <div style={{ fontSize: "11px", color: "#86868b", marginTop: "6px" }}>
                  {ko
                    ? `이번 달 ${totalDaysRecorded}일 중 ${daysAboveBreakEven}일 달성`
                    : `${daysAboveBreakEven} of ${totalDaysRecorded} days above BEP`}
                </div>
              )}
            </div>
          )}

          {/* ratio bars */}
          {hasCosts && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
              {ratios.map((r) => (
                <div key={r.label} style={{ padding: "8px 10px", background: "rgba(0,0,0,0.02)", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#86868b" }}>{r.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: hColor(r.h), fontVariantNumeric: "tabular-nums" }}>
                      {r.value.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ position: "relative", height: "3px", borderRadius: "2px", background: `${hColor(r.h)}18`, marginTop: "6px", overflow: "visible" }}>
                    <div style={{
                      height: "100%", borderRadius: "2px",
                      width: `${Math.min(r.value, 100)}%`,
                      background: hColor(r.h),
                      transition: "width 0.4s ease",
                    }} />
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
              ))}
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
  borderRadius: "24px",
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
