"use client";

/**
 * 오늘의 관리 — 재고 관리 + 팀 현황 카드 2-up (2026-07-21 사장님 지시 v2).
 *
 * v1 은 [재고 부족 N건][직원 N명] 요약 타일이었으나, 아래의 실제 카드(재고 관리·팀 현황)와
 * 중복이라 제거 — 실카드를 이 자리(오늘의 요약 바로 아래)로 승격. 카드·분기 로직은
 * Tier1_5Coaching 의 opsCards 를 그대로 이동 (business-context + industry-card-matrix SSOT).
 */

import Link from "next/link";
import { resolveOfferingKind, offeringMeta } from "@foundone/shared";
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
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

// 오퍼링 요약 카드 — 대시보드에는 신호(부족·품목 수)만, 작업은 /offerings 에서.
//   라벨은 업종별(메뉴·재료/상품·재고/…) — SSOT offering-kinds.ts.
function OfferingsSummaryCard({ d, c, ko }: { d: DashboardHook; c: DashboardComputed; ko: boolean }) {
  const kind = resolveOfferingKind(d.selectedIndustryId || null, d.industryCategoryId);
  if (kind === "hidden") return null;
  const meta = offeringMeta(kind);
  const label = ko ? meta.tabLabel.ko : meta.tabLabel.en;
  const itemCount = c.inventory.length;
  const lowCount = c.lowStockItems.length;

  // 발견성 (2026-07-25 사장님 우려): "재고 관리가 여기로 간 걸 인지 못한다" —
  //   요약 문장에 재고 어휘를 업종별로 명시해 홈에서 재고 신호가 계속 보이게 한다.
  const isStockKind = kind === "menu-bom" || kind === "stocked-goods" || kind === "service-menu";
  const stockWord = kind === "menu-bom" ? (ko ? "재료 재고" : "Ingredient stock")
    : kind === "service-menu" ? (ko ? "소모품 재고" : "Supplies stock")
    : (ko ? "재고" : "Stock");
  const productCount = c.inventory.filter((i) => i.itemType === "product").length;
  return (
    <Link
      href="/offerings"
      style={{
        display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
        background: "white", borderRadius: 16, border: "1px solid rgba(25,25,112,0.10)",
        boxShadow: "0 1px 3px rgba(25,25,112,0.04)", padding: "16px 18px",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 750, color: "#191970", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 650, color: "#0f172a" }}>
          {itemCount === 0
            ? (ko ? "아직 등록된 항목이 없어요 — 첫 항목을 추가해 보세요" : "Nothing registered yet")
            : !isStockKind
              ? (ko ? `${meta.unitLabel.ko} ${productCount}개 등록 · 판매 기록 관리` : `${productCount} registered`)
              : lowCount > 0
                ? (ko ? `${stockWord} — 발주 필요 ${lowCount}건 · 전체 ${itemCount}개 품목` : `${stockWord}: ${lowCount} low · ${itemCount} items`)
                : (ko ? `${stockWord} — 전체 ${itemCount}개 품목 · 발주 필요 없음` : `${stockWord}: ${itemCount} items · none low`)}
        </div>
      </div>
      <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: "#191970" }}>
        {ko ? "관리하기 →" : "Manage →"}
      </span>
    </Link>
  );
}

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
    // 2026-07-25 개편: 재고·메뉴 CRUD 는 독립 페이지(/offerings)로 이관 — 사장님 피드백
    //   "따로 페이지로 빼달라". 대시보드에는 이상 신호 요약 + 진입만 남긴다 (재무 분리와 동일 패턴).
    cards.push(<OfferingsSummaryCard key="inv" d={d} c={c} ko={ko} />);
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
