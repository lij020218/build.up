"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";

/**
 * 정산 예정 타임라인 — 다음 7일 예상 입금 표시
 * 카드매출: D+2일 정산 (매출의 약 85% 추정)
 * 배달앱: D+3~5일 정산
 *
 * ※ 추정치입니다. 카드사·PG사 정책에 따라 실제 입금액/일자가 다를 수 있습니다.
 */
export function CashFlowForecastCard() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const { dailyEntries, deliveryPlatforms } = d;

  if (!d.businessLaunched || !dailyEntries || dailyEntries.length === 0) return null;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 최근 14일 매출에서 정산 예정일 계산
  const deposits: Array<{ date: string; label: string; amount: number; type: "card" | "delivery" | "online"; dayLabel: string }> = [];

  const hasDelivery = deliveryPlatforms && deliveryPlatforms.length > 0;
  const deliveryRatio = hasDelivery ? 0.25 : 0; // 배달 매출 비율 추정 (25%)
  const cardRatio = 0.85; // 카드 결제 비율 추정

  for (const entry of dailyEntries) {
    const saleDate = new Date(entry.date);
    const sales = entry.sales;
    if (sales <= 0) continue;

    // 카드 정산: D+2
    const cardSettleDate = new Date(saleDate);
    cardSettleDate.setDate(cardSettleDate.getDate() + 2);
    // 주말 건너뛰기 (토→월, 일→월)
    if (cardSettleDate.getDay() === 0) cardSettleDate.setDate(cardSettleDate.getDate() + 1);
    if (cardSettleDate.getDay() === 6) cardSettleDate.setDate(cardSettleDate.getDate() + 2);

    const cardSettleStr = cardSettleDate.toISOString().slice(0, 10);
    if (cardSettleStr >= todayStr && cardSettleStr <= new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)) {
      const cardAmount = Math.round(sales * cardRatio * (1 - deliveryRatio));
      if (cardAmount > 0) {
        deposits.push({
          date: cardSettleStr,
          label: ko ? `${entry.date.slice(5)} 카드매출 정산` : `Card settlement for ${entry.date.slice(5)}`,
          amount: cardAmount,
          type: "card",
          dayLabel: formatDayLabel(cardSettleDate, ko),
        });
      }
    }

    // 배달앱 정산: D+4 (평균)
    if (hasDelivery) {
      const dlvSettleDate = new Date(saleDate);
      dlvSettleDate.setDate(dlvSettleDate.getDate() + 4);
      if (dlvSettleDate.getDay() === 0) dlvSettleDate.setDate(dlvSettleDate.getDate() + 1);
      if (dlvSettleDate.getDay() === 6) dlvSettleDate.setDate(dlvSettleDate.getDate() + 2);

      const dlvSettleStr = dlvSettleDate.toISOString().slice(0, 10);
      if (dlvSettleStr >= todayStr && dlvSettleStr <= new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)) {
        const dlvAmount = Math.round(sales * deliveryRatio * 0.9); // 배달앱 수수료 ~10% 제외
        if (dlvAmount > 0) {
          deposits.push({
            date: dlvSettleStr,
            label: ko ? `${entry.date.slice(5)} 배달앱 정산` : `Delivery settlement for ${entry.date.slice(5)}`,
            amount: dlvAmount,
            type: "delivery",
            dayLabel: formatDayLabel(dlvSettleDate, ko),
          });
        }
      }
    }
  }

  // 날짜순 정렬
  deposits.sort((a, b) => a.date.localeCompare(b.date));

  if (deposits.length === 0) return null;

  // 총 예상 입금
  const totalExpected = deposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <article style={{
      borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)",
      background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)",
      padding: "18px 22px", overflow: "hidden",
    }} className="bento-card bento-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
            {ko ? "정산 예정" : "Expected Deposits"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{ko ? "다음 7일" : "Next 7 days"}</div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontSize: "18px", fontWeight: 740, color: "#059669", letterSpacing: "-0.02em" }}>
            {formatAmount(totalExpected)}
          </div>
          <div style={{ fontSize: "10px", color: "var(--muted)" }}>{ko ? "추정치" : "Estimated"}</div>
        </div>
      </div>

      {/* 타임라인 (리스트 형태) */}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
        {deposits.slice(0, 8).map((dep, i) => {
          const isToday = dep.date === todayStr;
          const typeColor = dep.type === "card" ? "#2563eb" : dep.type === "delivery" ? "#d97706" : "#7c3aed";
          return (
            <div key={`${dep.date}-${dep.type}-${i}`} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 12px", borderRadius: "10px",
              background: isToday ? "rgba(5,150,105,0.04)" : "transparent",
              border: isToday ? "1px solid rgba(5,150,105,0.1)" : "none",
            }}>
              <div style={{ width: "36px", textAlign: "center" as const, flexShrink: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: isToday ? "#059669" : "#0f172a" }}>{dep.dayLabel}</div>
              </div>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: typeColor, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: "12px", color: "rgba(15,23,42,0.6)", fontWeight: 500 }}>{dep.label}</div>
              <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a", flexShrink: 0 }}>{formatAmount(dep.amount)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "8px", fontSize: "10px", color: "rgba(15,23,42,0.3)", textAlign: "center" as const }}>
        {ko ? "※ 카드사·PG사 정책에 따라 실제 입금액과 1~2일 오차가 발생할 수 있습니다" : "※ Actual amounts/dates may differ by 1-2 days based on card company policies"}
      </div>
    </article>
  );
}

function formatDayLabel(date: Date, ko: boolean): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateStr = date.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === todayStr) return ko ? "오늘" : "Today";
  if (dateStr === tomorrow.toISOString().slice(0, 10)) return ko ? "내일" : "Tmrw";

  const days = ko ? ["일", "월", "화", "수", "목", "금", "토"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${date.getDate()}(${days[date.getDay()]})`;
}

function formatAmount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}만`;
  return n.toLocaleString() + "원";
}
