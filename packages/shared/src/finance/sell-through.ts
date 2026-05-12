/**
 * sell-through.ts — 소매 Sell-Through Rate SSOT.
 *
 *  ── 자료 (Agent B 12 자료, 2026-05-13) ─────────────────────────────────
 *  Lightspeed·Shopify·Square Retail·TruRating·i-boss·Fanruan — 소매 daily KPI #1.
 *
 *  공식: sell-through = (monthlySold / (stock + monthlySold)) × 100
 *    · 80%+ excellent (Lightspeed)
 *    · 60-80% healthy
 *    · <60% slow mover
 *    · <20% 또는 monthlySold=0 → dead stock (단종/할인)
 *  ────────────────────────────────────────────────────────────────────
 */

export type SellThroughProduct = {
  id: string;
  name: string;
  category?: string;
  price: number;
  cost: number;
  stock: number;
  monthlySold: number;
};

export type ProductWithRate = SellThroughProduct & { rate: number };

/** 단일 상품 sell-through rate (정수 %). */
export function sellThroughRate(product: SellThroughProduct): number {
  const denominator = product.stock + product.monthlySold;
  if (denominator <= 0) return 0;
  return Math.round((product.monthlySold / denominator) * 100);
}

/** 전체 상품 평균 sell-through rate. */
export function averageSellThrough(products: readonly SellThroughProduct[]): number {
  if (products.length === 0) return 0;
  const sum = products.reduce((s, p) => s + sellThroughRate(p), 0);
  return Math.round(sum / products.length);
}

/** Top N best seller (월 판매 수량 기준 desc). */
export function topSellers(
  products: readonly SellThroughProduct[],
  n: number = 5,
): ProductWithRate[] {
  return [...products]
    .map((p) => ({ ...p, rate: sellThroughRate(p) }))
    .sort((a, b) => b.monthlySold - a.monthlySold)
    .slice(0, n);
}

/**
 * Dead stock 식별.
 *  조건: 재고 있는데 (stock > 0) sell-through < 20% 또는 monthlySold == 0.
 *  Lightspeed: dead stock = capital locked. 단종/할인 결정 필요.
 */
export function deadStock(products: readonly SellThroughProduct[]): ProductWithRate[] {
  return products
    .map((p) => ({ ...p, rate: sellThroughRate(p) }))
    .filter((p) => p.stock > 0 && (p.rate < 20 || p.monthlySold === 0));
}

/**
 * 품절 임박 — top seller 중 stock / monthlySold < ratio (기본 0.3, 한 달 안 떨어짐).
 *  Lightspeed safety stock policy: lead time + 7일 buffer.
 */
export function lowStock(
  products: readonly SellThroughProduct[],
  ratio: number = 0.3,
): ProductWithRate[] {
  return products
    .map((p) => ({ ...p, rate: sellThroughRate(p) }))
    .filter((p) => p.monthlySold > 0 && p.stock > 0 && p.stock / p.monthlySold < ratio);
}

/**
 * Top N 상품의 매출 비중 (전체 매출 대비 %).
 *  >60% = 집중 risk (Pareto 80/20 — 의존도 분산 필요).
 */
export function topNRevenueShare(
  products: readonly SellThroughProduct[],
  n: number = 5,
): { top: number; total: number; sharePct: number } {
  const withRate = products.map((p) => ({ revenue: p.monthlySold * p.price }));
  const total = withRate.reduce((s, p) => s + p.revenue, 0);
  const topN = [...withRate].sort((a, b) => b.revenue - a.revenue).slice(0, n);
  const top = topN.reduce((s, p) => s + p.revenue, 0);
  const sharePct = total > 0 ? Math.round((top / total) * 100) : 0;
  return { top, total, sharePct };
}

/**
 * Dead stock 묶인 자본 (cost 기준) — 만원 단위 환산은 호출 측.
 */
export function deadStockCapital(products: readonly SellThroughProduct[]): number {
  return deadStock(products).reduce((s, p) => s + p.stock * p.cost, 0);
}
