"use client";

/**
 * 오늘의 관리 — 재고 관리 + 팀 현황 카드 2-up (2026-07-21 사장님 지시 v2).
 *
 * v1 은 [재고 부족 N건][직원 N명] 요약 타일이었으나, 아래의 실제 카드(재고 관리·팀 현황)와
 * 중복이라 제거 — 실카드를 이 자리(오늘의 요약 바로 아래)로 승격. 카드·분기 로직은
 * Tier1_5Coaching 의 opsCards 를 그대로 이동 (business-context + industry-card-matrix SSOT).
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { InventoryOpsCard } from "../InventoryOpsCard";
import { CustomerSummaryCard } from "../CustomerSummaryCard";
import { TeamCard } from "../TeamCard";
import { useProfileStore } from "../../../stores/profile-store";
import { shouldShowCardByIndustry } from "../../../industry-card-matrix";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
};

export function TodayManagementSection({ d, c, ko, fmt }: Props) {
  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const hide = (id: string) => hiddenCards.includes(id);
  const showByMatrix = (cardId: import("../../../industry-card-matrix").CardId): boolean => {
    if (hide(cardId)) return false;
    return shouldShowCardByIndustry(cardId, d.industryCategoryId as import("../../../industry-card-matrix").IndustryId | undefined);
  };

  // ── Tier1_5 opsCards 이동분 — 분기 원칙 (web SSOT: business-context.ts) ──
  //   showInventoryCard=true  (food/cafe/retail/pet/beauty 등)  → 재고 카드
  //   showInventoryCard=false (fitness/education/space)         → 고객 카드가 그 자리 대체
  const showInventory = !c.usesSubscriptions && d.businessCtx.showInventoryCard && showByMatrix("inventory-ops");
  const showCustomer = !c.usesSubscriptions && d.businessCtx.showCustomerCard && !hide("customer-summary");
  const showTeam = showByMatrix("team-card");

  const cards: React.ReactNode[] = [];
  if (showInventory) {
    // 2026-07-25 v2 (사장님 지시): 대시보드 카드는 **원래 기능 그대로** 유지 —
    //   재고 확인·판매±·추가·CSV 전부 여기서 가능. "자세히 →" 만 오퍼링 페이지(/offerings)로.
    //   (v1 에서 요약 카드로 줄였다가 복원 — 기존에 되던 것은 계속 돼야 한다.)
    const menuCardActive = showByMatrix("menu-profitability");
    const invForCard = menuCardActive ? c.inventory.filter((i) => i.itemType !== "product") : c.inventory;
    const lowStockForCard = menuCardActive ? c.lowStockItems.filter((i) => i.itemType !== "product") : c.lowStockItems;
    cards.push(
      <InventoryOpsCard key="inv" ko={ko} inventory={invForCard} lowStockItems={lowStockForCard} d={d} detailHref="/offerings" />,
    );
  }
  if (showCustomer && !showInventory) {
    cards.push(<CustomerSummaryCard key="customer" d={d} ko={ko} fmt={fmt} />);
  }
  if (showTeam) {
    cards.push(<TeamCard key="team" d={d} c={c} ko={ko} fmt={fmt} />);
  }

  if (cards.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 750, color: "rgba(15,23,42,0.55)", letterSpacing: "0.01em", padding: "2px 2px 0" }}>
        {ko ? "오늘의 관리" : "Today's operations"}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: c.isWide && cards.length === 2 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
          gap: "12px",
          alignItems: "stretch",
        }}
      >
        {cards}
      </div>
    </div>
  );
}
