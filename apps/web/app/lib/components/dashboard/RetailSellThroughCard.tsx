"use client";

/**
 * RetailSellThroughCard — 소매 sell-through + best seller + dead stock (Phase 2d).
 *
 *  ── 왜 만들었나 (2026-05-13) ──────────────────────────────────────────
 *  Agent B 12 자료 (Lightspeed·Shopify·Square Retail·TruRating·i-boss·Fanruan)
 *  합의: 소매 사장님 daily KPI #1 = *sell-through rate*. 한국 SaaS 거의 부재
 *  (오늘얼마·캐시노트는 매출 중심) → build.up 차별점.
 *
 *  공식:
 *    Sell-through rate = (월 판매 수량 / (현재 재고 + 월 판매)) × 100
 *      80%+ = excellent (Lightspeed)
 *      60-80% = healthy
 *      <60% = slow mover
 *      <20% 또는 monthlySold=0 → dead stock (단종/할인 권고)
 *
 *  ── build.up 데이터 인벤토리 (ARCHITECTURE 체크리스트) ───────────────
 *  · useOperationsStore.products / unifiedProducts
 *    { id, name, category, price, cost, stock, monthlySold }
 *  · 두 store 머지 (legacy products + 신규 unifiedProducts)
 *  · 시즌 D-day 데이터 별도 store 없음 (v2)
 *
 *  ── 카드 구조 ───────────────────────────────────────────────────────
 *  ① 상황: Top 5 best seller + sell-through rate
 *  ② 대비: Dead stock 카운트 + 품절 임박 카운트
 *  ③ 행동: top 1 (dead stock 5+ / top seller 품절 임박 / 모두 양호 → 확장)
 *
 *  ── 출처 ──────────────────────────────────────────────────────────
 *  · Lightspeed 5 KPIs for Inventory (sell-through)
 *  · Shopify retail metrics + ABC analysis
 *  · 한국 i-boss 의류매장 재고관리 (dead stock 빈도 高)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { ShoppingBag, AlertTriangle, Package, TrendingUp, Sparkles } from "lucide-react";
import { useOperationsStore } from "../../stores";
// 2026-05-13 — SSOT (sell-through.ts, 14 unit tests 검증)
//   Lightspeed·Shopify·Square Retail·TruRating 표준 — 단일 검증된 공식.
import {
  sellThroughRate,
  averageSellThrough,
  topSellers as ssotTopSellers,
  deadStock as ssotDeadStock,
  lowStock as ssotLowStock,
  topNRevenueShare,
  deadStockCapital,
  type SellThroughProduct,
} from "@build-up/shared";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

// 카드 내부에서 *category 표시용* 필드 유지 — SSOT 타입은 category optional.
type ProductLite = SellThroughProduct & { category: string };

export function RetailSellThroughCard({ ko, industryCategoryId }: Props) {
  const products = useOperationsStore((s) => s.products);
  const unifiedProducts = useOperationsStore((s) => s.unifiedProducts);

  if (industryCategoryId !== "retail") return null;

  // 두 store 머지 — id 중복 시 unifiedProducts 우선 (더 정교한 데이터)
  const all: ProductLite[] = useMemo(() => {
    const byId = new Map<string, ProductLite>();
    for (const p of products ?? []) {
      byId.set(p.id, {
        id: p.id, name: p.name, category: p.category ?? "",
        price: p.price ?? 0, cost: p.cost ?? 0, stock: p.stock ?? 0, monthlySold: p.monthlySold ?? 0,
      });
    }
    for (const p of unifiedProducts ?? []) {
      byId.set(p.id, {
        id: p.id, name: p.name, category: p.category ?? "",
        price: p.price ?? 0, cost: p.cost ?? 0, stock: p.stock ?? 0, monthlySold: p.monthlySold ?? 0,
      });
    }
    return Array.from(byId.values());
  }, [products, unifiedProducts]);

  if (all.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><ShoppingBag size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "Sell-Through · 소매" : "Sell-Through · Retail"}</div>
        </header>
        <div style={{ padding: "20px 0", textAlign: "center" as const, color: "rgba(15,23,42,0.5)", fontSize: 13 }}>
          {ko ? "상품 데이터를 입력하면 sell-through rate + best seller + dead stock 분석 (내 가게 > 상품 관리)" : "Enter product data for sell-through analysis"}
        </div>
      </article>
    );
  }

  const analysis = useMemo(() => {
    // 2026-05-13 — SSOT (sell-through.ts) 적용. 카드는 *컴포지션* + UX 결정.
    //   sellThroughRate · topSellers · deadStock · lowStock · topNRevenueShare ·
    //   averageSellThrough · deadStockCapital — 모두 14 unit tests 검증.

    // 각 상품에 rate 부여 (UI 표시·정렬용 — render 측 즉시 사용)
    const withRate = all.map((p) => ({ ...p, rate: sellThroughRate(p) }));
    const topSellers = ssotTopSellers(all, 5);
    const deadStock = ssotDeadStock(all);
    const lowStock = ssotLowStock(all, 0.3);
    const avgRate = averageSellThrough(all);
    const { sharePct: top5RevShare } = topNRevenueShare(all, 5);

    // top action
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    if (deadStock.length >= 5) {
      // 자본 묶임 = deadStockCapital SSOT (Lightspeed: dead stock = capital locked).
      const deadValue = Math.round(deadStockCapital(all) / 10000);
      topAction = {
        kind: "critical",
        headline: ko
          ? `Dead stock ${deadStock.length}개 — 자본 약 ${deadValue.toLocaleString()}만원 묶임`
          : `${deadStock.length} dead stock items — ~${deadValue}만 capital locked`,
        action: ko
          ? "이번 주: ① 30%+ 할인·번들·온라인 처분 ② 단종 결정 (cost 회수 우선) ③ 추후 발주 ABC analysis 도입"
          : "This week: ① 30%+ markdown ② discontinue decisions ③ adopt ABC analysis",
      };
    } else if (lowStock.length >= 3) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `품절 임박 ${lowStock.length}개 — 매출 손실 risk`
          : `${lowStock.length} items low stock`,
        action: ko
          ? "오늘: ① 공급처 발주 + 리드타임 확인 ② best seller 안전 재고 (lead time + 7일 buffer) 정책 도입"
          : "Today: ① supplier order + lead time ② safety stock policy",
      };
    } else if (avgRate < 40 && all.length >= 5) {
      topAction = {
        kind: "warning",
        headline: ko
          ? `전체 평균 sell-through ${avgRate}% — Lightspeed 표준 60% 미달`
          : `Avg sell-through ${avgRate}% — below 60% standard`,
        action: ko
          ? "이번 달: ① top 5 매출 비중 분석 (현재 ${top5RevShare}%) ② Pareto 80/20 적용 — 하위 30% 단종"
          : "This month: ① top 5 share analysis ② Pareto 80/20",
      };
    } else if (top5RevShare > 60) {
      topAction = {
        kind: "warning",
        headline: ko
          ? `Top 5 매출 비중 ${top5RevShare}% — 집중 risk`
          : `Top 5 share ${top5RevShare}% — concentration risk`,
        action: ko
          ? "이번 분기: ① top seller 공급처 backup ② mid-tier 상품 마케팅 강화 (의존도 분산)"
          : "This Q: ① supplier backup ② mid-tier marketing",
      };
    } else if (avgRate >= 70) {
      topAction = {
        kind: "good",
        headline: ko
          ? `평균 sell-through ${avgRate}% — Lightspeed 상위 quartile`
          : `Avg ${avgRate}% — Lightspeed top quartile`,
        action: ko ? "이번 분기: 신규 상품 라인 확장 (인접 카테고리·시즌)" : "This Q: expand product line",
      };
    }

    return { withRate, topSellers, deadStock, lowStock, avgRate, top5RevShare, topAction };
  }, [all, ko]);

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><ShoppingBag size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>
          {ko ? "Sell-Through · 소매" : "Sell-Through · Retail"}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko ? `상품 ${all.length}개 · 평균 ${analysis.avgRate}%` : `${all.length} SKU · avg ${analysis.avgRate}%`}
        </span>
      </header>

      {/* ① 상황 — 3 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <StatBox
          label={ko ? "Dead Stock" : "Dead stock"}
          value={`${analysis.deadStock.length}개`}
          tone={analysis.deadStock.length >= 5 ? "critical" : analysis.deadStock.length >= 1 ? "warning" : "good"}
          icon={<AlertTriangle size={12} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "품절 임박" : "Low stock"}
          value={`${analysis.lowStock.length}개`}
          tone={analysis.lowStock.length >= 3 ? "critical" : analysis.lowStock.length >= 1 ? "warning" : "good"}
          icon={<Package size={12} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "Top 5 매출 %" : "Top 5 rev %"}
          value={`${analysis.top5RevShare}%`}
          tone={analysis.top5RevShare > 70 ? "warning" : "notable"}
          icon={<TrendingUp size={12} strokeWidth={2.2} />}
        />
      </div>

      {/* ② 대비 — Best Seller Top 5 (테이블 형식) */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em",
          textTransform: "uppercase" as const, marginBottom: 8,
        }}>
          {ko ? "Top 5 Best Seller (월 판매 + sell-through)" : "Top 5 Best Sellers"}
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {analysis.topSellers.map((p, i) => {
            const rateColor = p.rate >= 80 ? "#059669" : p.rate >= 60 ? "#b45309" : "#b91c1c";
            return (
              <div key={p.id} style={{
                display: "grid", gridTemplateColumns: "16px 1fr auto auto", gap: 10, alignItems: "center",
                padding: "8px 10px", borderRadius: 8,
                background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.06)",
              }}>
                <span style={{ fontSize: 11, color: "rgba(15,23,42,0.4)", fontWeight: 700 }}>{i + 1}</span>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", fontVariantNumeric: "tabular-nums" }}>
                  {ko ? `${p.monthlySold.toLocaleString()}개/월` : `${p.monthlySold}/mo`}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: rateColor, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" as const }}>
                  {p.rate}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ③ 행동 */}
      {analysis.topAction && (
        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: actionColors[analysis.topAction.kind].bg,
          border: `1px solid ${actionColors[analysis.topAction.kind].border}`,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: actionColors[analysis.topAction.kind].text, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>
            {ko ? "오늘 가장 중요한 행동" : "Today's #1 action"}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>
            {analysis.topAction.headline}
          </div>
          <div style={{ fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
            {analysis.topAction.action}
          </div>
        </div>
      )}

      <div style={footerStyle}>
        <Sparkles size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko
          ? "Lightspeed sell-through + Shopify ABC + i-boss 의류매장 재고관리 — 한국 SaaS 거의 부재 차별점"
          : "Lightspeed · Shopify · i-boss — KR SaaS rare differentiator"}
      </div>
    </article>
  );
}

// ─── helpers (재사용) ─────────────────────────────────────────────────

function StatBox({
  label, value, tone, icon,
}: {
  label: string; value: string;
  tone: "critical" | "warning" | "good" | "notable";
  icon: React.ReactNode;
}) {
  const c = {
    critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
    warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
    good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
    notable: { bg: `${MIDNIGHT}08`, border: `${MIDNIGHT}22`, text: MIDNIGHT },
  }[tone];
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 11,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ color: c.text }}>{icon}</span>
        <div style={{ fontSize: 10, fontWeight: 700, color: c.text, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: c.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

const actionColors = {
  critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
  warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
  good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
} as const;

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  padding: "22px 24px",
  display: "flex", flexDirection: "column" as const, gap: 14,
};

const headerRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
};

const iconBadge: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
  color: "white",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.75,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const footerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center",
  fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.5,
  padding: "8px 12px", borderRadius: 9,
  background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
};
