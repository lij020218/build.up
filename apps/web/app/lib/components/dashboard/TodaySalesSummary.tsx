"use client";

import type { DashboardHook } from "../../useDashboard";

export function TodaySalesSummary({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = (d.dailyEntries as Array<{ date: string; sales: number; customers: number }>)
    .find((e) => e.date === todayStr);

  // 판매 상품 목록
  const invProducts = (d.inventory as Array<{ id: string; name: string; sellingPrice?: number; itemType?: string }>)
    .filter((item) => item.itemType === "product" && (item.sellingPrice ?? 0) > 0)
    .map((item) => ({ id: item.id, name: item.name, price: item.sellingPrice ?? 0 }));
  const standaloneProducts = (d.products as unknown as Array<{ id: string; name: string; price: number }>)
    .filter((p) => p.price > 0)
    .map((p) => ({ id: p.id, name: p.name, price: p.price }));
  const seen = new Set<string>();
  const products = [...invProducts, ...standaloneProducts].filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  if (products.length === 0) return null;

  const ps = (todayEntry as { productSales?: Record<string, number> } | undefined)?.productSales;
  const soldEntries = ps ? Object.entries(ps).filter(([, qty]) => qty > 0) : [];
  const totalSold = soldEntries.reduce((s, [, q]) => s + q, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,23,42,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
        {ko ? "오늘 상품 판매" : "Today's product sales"}
      </div>

      {soldEntries.length > 0 ? (
        <>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
            {soldEntries.map(([id, qty]) => {
              const p = products.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div key={id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", borderRadius: "10px", background: "rgba(15,23,42,0.02)",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", fontVariantNumeric: "tabular-nums" }}>
                    {qty}{ko ? "개" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)" }}>
            {ko ? `총 ${totalSold}개 판매` : `${totalSold} total sold`}
          </div>
        </>
      ) : (
        <div style={{ padding: "20px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.015)", border: "1px solid rgba(15,23,42,0.04)", textAlign: "center" as const }}>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.3)", lineHeight: 1.5 }}>
            {ko ? "상품별 매출을 입력하면\n판매 수량이 여기에 표시됩니다" : "Product sales will\nappear here"}
          </div>
        </div>
      )}
    </div>
  );
}
