/**
 * 재고 발주 주기 점검 — 과주문 (over-ordering) 검출 SSOT.
 *
 *  ── 문제 (사장님 신고 2026-05-11) ──────────────────────────────────────
 *   "한 달에 한 번 주문하는 재고인데, 발주 임계를 한참 위로 유지하는 경우 (예:
 *    100개씩 주문 + 20개 임계 → 한 달 지나도 50-60개 남음) 발주 시기를 재검토해야 함."
 *
 *  → 과주문 신호. 자금이 *재고에 묶임* + 식자재면 *폐기 위험*. 사장님이
 *    발주량 줄이거나 주기 늘리도록 안내 필요.
 *
 *  ── 기존 시스템 한계 ──────────────────────────────────────────────────
 *   현재 발주 알림은 "재고 ≤ 임계" 만 검출 → *부족* 신호만 본다.
 *   *과주문* 신호는 sajangnim 이 직접 알아채야 하는데, 보통 못 본다 (자금 묶임이
 *   투명하지 않음). 본 모듈이 그 사각지대를 메움.
 *
 *  ── 알고리즘 (Toyota TPS 7 wastes 중 "재고 과잉" 검출) ────────────────
 *   1. lastOrderedAt 있고, 그 시점부터 cycleThresholdDays (디폴트 30일) 이상 경과
 *   2. 현재 quantity > minThreshold × overstockMultiplier (디폴트 2.5)
 *      → 임계 2.5배 이상 남았는데 한 달이 지난 = 회전 속도 매우 느림
 *   3. dailyUsage 있으면 실제 소모량 검증: expected = dailyUsage × days
 *      실제 소모량 < expected × 0.4 (40% 이하만 빠짐) = 명백한 과주문
 *  ────────────────────────────────────────────────────────────────────────
 */

export type InventoryItemForCycle = {
  id: string;
  name: string;
  /** 현재 재고 수량 */
  quantity: number;
  /** 발주 임계 (이 이하로 떨어지면 재주문) */
  minThreshold?: number;
  /** 마지막 발주 시점 (ISO 날짜) */
  lastOrderedAt?: string;
  /** 일 평균 소모량 (선택 — 있으면 정밀도 ↑) */
  dailyUsage?: number;
  /** 단가 (선택 — 잉여 자금 규모 추정용) */
  unitCost?: number;
  category?: string;
  unit?: string;
};

export type OverstockSeverity = "watch" | "alert";

export type OverstockAlert = {
  itemId: string;
  itemName: string;
  category?: string;
  unit?: string;
  /** 마지막 발주 후 경과 일수 */
  daysSinceOrder: number;
  /** 현재 재고 */
  currentQuantity: number;
  /** 발주 임계 */
  threshold: number;
  /** 권장 행동 */
  recommendation: "reduce-quantity" | "extend-cycle" | "review";
  /** 한 줄 사유 (한국어) */
  reasonKo: string;
  reasonEn: string;
  /** 잉여 추정 (현재 재고 - 임계 × 1.5 = 적정 안전재고 대비 초과량) */
  excessUnits: number;
  /** 잉여 자금 추정 (excessUnits × unitCost, unitCost 없으면 null) */
  excessCostKrw: number | null;
  /** 신뢰도 — dailyUsage 있으면 high, 없으면 medium */
  severity: OverstockSeverity;
};

export type DetectOverstockOptions = {
  /** 발주 주기 임계 (일) — 이 이상 지났는데도 재고 많으면 검출. 디폴트 30 */
  cycleThresholdDays?: number;
  /** 임계 대비 몇 배 초과여야 과주문으로 볼지. 디폴트 2.0 — 사장님 신고 케이스
   *  (임계 20 / 한 달 후 50-60 남음) 둘 다 잡힘 */
  overstockMultiplier?: number;
  /** dailyUsage 있을 때 *남은 일수* (quantity/dailyUsage) 가 며칠 이상이면 alert 격상.
   *  한 달 사이클 가정 시 14일 = 절반 이상 남음 = 명백한 과주문. */
  alertRemainingDaysCutoff?: number;
  /** 기준 시각 (테스트용 주입) */
  today?: Date;
};

/**
 * 과주문 (overstock) 품목 검출.
 *
 *  반환: OverstockAlert[] — daysSinceOrder 큰 순 + excessUnits 큰 순으로 정렬.
 *  사장님이 가장 *오래 묶여있는* 자금부터 본다.
 */
export function detectOverstockItems(
  items: InventoryItemForCycle[],
  options: DetectOverstockOptions = {},
): OverstockAlert[] {
  const cycleThresholdDays = options.cycleThresholdDays ?? 30;
  const overstockMultiplier = options.overstockMultiplier ?? 2.0;
  const alertRemainingDaysCutoff = options.alertRemainingDaysCutoff ?? 14;
  const today = options.today ?? new Date();

  const alerts: OverstockAlert[] = [];

  for (const item of items) {
    // 가드: 임계 미설정 → 비교 불가
    const threshold = item.minThreshold ?? 0;
    if (threshold <= 0) continue;
    // 가드: 발주 이력 없음
    if (!item.lastOrderedAt) continue;

    const lastOrderTime = new Date(item.lastOrderedAt).getTime();
    if (!Number.isFinite(lastOrderTime)) continue;

    const daysSinceOrder = Math.floor((today.getTime() - lastOrderTime) / 86_400_000);
    if (daysSinceOrder < cycleThresholdDays) continue;

    // 핵심 조건: 임계 × multiplier 초과 (디폴트 2배)
    if (item.quantity <= threshold * overstockMultiplier) continue;

    // dailyUsage 있으면 *남은 일수* 검증 — 절반 이상 남았으면 명백한 과주문 (alert)
    let severity: OverstockSeverity = "watch";
    let usageReason = "";
    let remainingDays: number | null = null;
    if (item.dailyUsage != null && item.dailyUsage > 0) {
      remainingDays = Math.round(item.quantity / item.dailyUsage);
      if (remainingDays >= alertRemainingDaysCutoff) {
        // 한 달 사이클인데 14+ 일 더 갈 양이 남음 = 발주량/주기 명백히 과함
        severity = "alert";
        usageReason = ` · 현재 재고로 ${remainingDays}일 더 사용 가능`;
      }
    }

    // 잉여 추정 — 적정 안전재고 = threshold × 1.5. 그걸 넘어가는 분량이 잉여.
    const safeStockTarget = Math.round(threshold * 1.5);
    const excessUnits = Math.max(0, item.quantity - safeStockTarget);
    const excessCostKrw = item.unitCost != null ? Math.round(excessUnits * item.unitCost) : null;

    // 권장 행동
    const recommendation: OverstockAlert["recommendation"] =
      severity === "alert" ? "reduce-quantity"
      : daysSinceOrder >= cycleThresholdDays * 1.5 ? "extend-cycle"
      : "review";

    const ratio = (item.quantity / threshold).toFixed(1);
    const reasonKo =
      `${daysSinceOrder}일 전 발주 — 현재 ${item.quantity}${item.unit ?? "개"} 남음 (임계 ${threshold}${item.unit ?? "개"} 의 ${ratio}배)` +
      usageReason;
    const reasonEn =
      `Ordered ${daysSinceOrder} days ago — ${item.quantity}${item.unit ?? ""} left (${ratio}× threshold)` +
      (remainingDays != null && severity === "alert" ? ` · ${remainingDays} more days of stock` : "");

    alerts.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      unit: item.unit,
      daysSinceOrder,
      currentQuantity: item.quantity,
      threshold,
      recommendation,
      reasonKo,
      reasonEn,
      excessUnits,
      excessCostKrw,
      severity,
    });
  }

  // 정렬: alert 우선 → 잉여 자금 큰 순 → 경과 일수 큰 순
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "alert" ? -1 : 1;
    const aValue = a.excessCostKrw ?? 0;
    const bValue = b.excessCostKrw ?? 0;
    if (aValue !== bValue) return bValue - aValue;
    return b.daysSinceOrder - a.daysSinceOrder;
  });

  return alerts;
}

/**
 * 권장 발주량 — 과주문 검출 시 사장님께 "다음번엔 N개로 줄이세요" 안내용.
 *
 *  단순 휴리스틱:
 *   · dailyUsage 알면 → cycleThresholdDays × dailyUsage × 1.2 (20% 버퍼)
 *   · 모르면 → 현재 발주량을 추정 못함, null 반환
 *
 *  ⚠️ 이건 *권장값* 일 뿐 — 실제 사장님 컨텍스트 (공급처 MOQ, 할인 등) 모름.
 */
export function suggestReorderQuantity(
  item: InventoryItemForCycle,
  cycleThresholdDays: number = 30,
): number | null {
  if (item.dailyUsage == null || item.dailyUsage <= 0) return null;
  return Math.ceil(cycleThresholdDays * item.dailyUsage * 1.2);
}
