"use client";

import { useEffect, useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import { getKstDate } from "../../utils/business-day";

export function ProductSalesEntry({
  d,
  ko,
  fmt,
  onSalesApplied,
  /** 외부에서 펼침 상태 강제 — "+ 오늘 입력" 클릭 시 자동 펼침에 사용 */
  forceExpanded,
}: {
  d: DashboardHook;
  ko: boolean;
  fmt: (n: number) => string;
  onSalesApplied?: (sales: number, customers: number) => void;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});

  // forceExpanded prop 변경 시 internal state 동기화
  // (true → 펼침, false 가 들어오면 닫지 않음 — 사용자 자체 토글 보존)
  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  // 판매 상품: inventory에서 itemType=product이거나, products 배열에서 가져옴
  const invProducts = (d.inventory as Array<{ id: string; name: string; sellingPrice?: number; itemType?: string; unitCost?: number }>)
    .filter((item) => item.itemType === "product" && (item.sellingPrice ?? 0) > 0)
    .map((item) => ({ id: item.id, name: item.name, price: item.sellingPrice ?? 0 }));

  const standaloneProducts = (d.products as unknown as Array<{ id: string; name: string; price: number; cost: number }>)
    .filter((p) => p.price > 0)
    .map((p) => ({ id: p.id, name: p.name, price: p.price }));

  // 중복 제거 (이름 기준)
  const seen = new Set<string>();
  const products = [...invProducts, ...standaloneProducts].filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  if (products.length === 0) return null;

  const totalFromProducts = Object.entries(soldCounts).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p?.price ?? 0) * qty;
  }, 0);

  const handleTap = (id: string) => {
    setSoldCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleMinus = (id: string) => {
    setSoldCounts((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) > 0) next[id] = (next[id] ?? 0) - 1;
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const handleApply = () => {
    if (totalFromProducts <= 0) return;

    // 1. 매출 입력 필드에 값 세팅
    const inManWon = String(Math.round(totalFromProducts / 10000));
    d.setDailySalesInput(inManWon);
    const totalQty = Object.values(soldCounts).reduce((s, v) => s + v, 0);
    d.setDailyCustomersInput(String(totalQty));

    // 2. 바로 저장 실행
    const entryDate = d.dailyDateInput || getKstDate();
    const allE = d.dailyEntries as Array<{ date: string; sales: number; customers: number; productSales?: Record<string, number> }>;
    const existing = allE.find((e) => e.date === entryDate);

    // 상품별 판매 기록 합산
    const prevProductSales: Record<string, number> = existing?.productSales ?? {};
    const mergedProductSales: Record<string, number> = { ...prevProductSales };
    for (const [id, qty] of Object.entries(soldCounts)) {
      if (qty > 0) mergedProductSales[id] = (mergedProductSales[id] ?? 0) + qty;
    }

    const entry = {
      date: entryDate,
      sales: (existing?.sales ?? 0) + totalFromProducts,
      customers: (existing?.customers ?? 0) + totalQty,
      productSales: mergedProductSales,
    };
    const next = [...allE.filter((e) => e.date !== entry.date), entry].sort((a, b) => b.date.localeCompare(a.date));
    d.setDailyEntries(next);
    try { localStorage.setItem("dailyEntries", JSON.stringify(next)); } catch {}

    // 3. 재고 차감
    const currentInv = d.inventory as Array<{ id: string; quantity: number; itemType?: string; [k: string]: unknown }>;
    const updated = currentInv.map((item) => {
      const sold = soldCounts[item.id];
      if (sold && sold > 0 && item.itemType === "product") {
        return { ...item, quantity: Math.max(0, item.quantity - sold) };
      }
      return item;
    });
    if (updated.some((item, i) => item !== currentInv[i])) {
      d.saveInventory(updated as never);
    }

    // 4. 반응 콜백 + 입력 필드 초기화
    if (totalFromProducts > 0 && onSalesApplied) {
      onSalesApplied(entry.sales, entry.customers);
    }
    d.setDailySalesInput("");
    d.setDailyCustomersInput("");
    setSoldCounts({});
  };

  return (
    <div style={{
      marginTop: "12px", borderRadius: "16px",
      background: expanded ? "rgba(255,255,255,0.98)" : "rgba(25,25,112,0.025)",
      border: expanded ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(15,23,42,0.04)",
      overflow: expanded ? "visible" : "hidden", transition: "all 0.2s ease",
    }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="12" rx="3" stroke="rgba(15,23,42,0.45)" strokeWidth="1.2" fill="none" />
            <path d="M2 7h14" stroke="rgba(15,23,42,0.45)" strokeWidth="1.2" />
            <path d="M6 7v8M10 7v8" stroke="rgba(15,23,42,0.45)" strokeWidth="1.2" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>
            {ko ? "상품별 매출 입력" : "Sales by product"}
          </span>
          {!expanded && totalFromProducts > 0 && (
            <span style={{ fontSize: "12px", fontWeight: 650, color: "#191970" }}>
              {fmt(totalFromProducts)}
            </span>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          <path d="M3.5 5.5L7 9l3.5-3.5" stroke="rgba(15,23,42,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (() => {
        // 오늘 기록된 상품별 판매 내역 (이전에 저장된 것)
        const todayLog = (d.dailyEntries as Array<{ date: string; sales: number; customers: number; productSales?: Record<string, number> }>)
          .find((e) => e.date === d.dailyDateInput || e.date === getKstDate());
        const savedProductSales = (todayLog as { productSales?: Record<string, number> } | undefined)?.productSales;

        return (
        <div style={{ padding: "0 16px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {/* 드롭다운 셀렉터 */}
              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => setPickerOpen(!pickerOpen)} style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", borderRadius: "12px",
                  border: pickerOpen ? "1.5px solid #191970" : "1px solid rgba(15,23,42,0.1)",
                  background: "#fff", cursor: "pointer", transition: "all 0.15s ease",
                }}>
                  <span style={{ fontSize: "14px", color: pickerOpen ? "#191970" : "rgba(15,23,42,0.45)" }}>
                    {ko ? "상품을 선택하세요" : "Select a product"}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.2s", transform: pickerOpen ? "rotate(180deg)" : "rotate(0)" }}>
                    <path d="M3.5 5.5L7 9l3.5-3.5" stroke={pickerOpen ? "#191970" : "rgba(15,23,42,0.35)"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* 드롭다운 목록 */}
                {pickerOpen && (
                  <div style={{
                    marginTop: "4px",
                    maxHeight: "220px", overflowY: "auto",
                    borderRadius: "14px", background: "#fff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
                  }}>
                    {products.map((p) => {
                      const alreadyAdded = (soldCounts[p.id] ?? 0) > 0;
                      return (
                        <button key={p.id} type="button"
                          onClick={() => { handleTap(p.id); setPickerOpen(false); }}
                          style={{
                            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "12px 14px", border: "none", borderBottom: "1px solid rgba(15,23,42,0.04)",
                            background: alreadyAdded ? "rgba(25,25,112,0.03)" : "transparent",
                            cursor: "pointer", transition: "background 0.1s ease",
                            textAlign: "left" as const,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "1px" }}>{fmt(p.price ?? 0)}</div>
                          </div>
                          {alreadyAdded ? (
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#191970", background: "rgba(25,25,112,0.08)", borderRadius: "6px", padding: "2px 8px" }}>
                              {soldCounts[p.id]}{ko ? "개 추가됨" : " added"}
                            </span>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 3.5v9M3.5 8h9" stroke="rgba(15,23,42,0.3)" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 선택된 상품 수량 입력 */}
              {Object.entries(soldCounts).filter(([, qty]) => qty > 0).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                  {Object.entries(soldCounts).filter(([, qty]) => qty > 0).map(([id]) => {
                    const p = products.find((x) => x.id === id);
                    if (!p) return null;
                    const count = soldCounts[id] ?? 0;
                    return (
                      <div key={id} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 12px", borderRadius: "12px",
                        background: "rgba(25,25,112,0.035)",
                        border: "1px solid rgba(25,25,112,0.1)",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a" }}>{p.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{fmt(p.price ?? 0)} × {count} = {fmt((p.price ?? 0) * count)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", borderRadius: "9px", overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", background: "#fff" }}>
                          <button type="button" onClick={() => handleMinus(id)}
                            style={{ width: "32px", height: "34px", border: "none", cursor: "pointer", background: "transparent", fontSize: "15px", fontWeight: 500, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <input type="text" inputMode="numeric" value={String(count)}
                            onChange={(e) => { const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10); setSoldCounts((prev) => ({ ...prev, [id]: Number.isNaN(val) ? 0 : Math.max(0, val) })); }}
                            style={{ width: "40px", height: "34px", border: "none", borderLeft: "1px solid rgba(15,23,42,0.06)", borderRight: "1px solid rgba(15,23,42,0.06)", textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#191970", outline: "none", background: "transparent", fontVariantNumeric: "tabular-nums" }} />
                          <button type="button" onClick={() => handleTap(id)}
                            style={{ width: "32px", height: "34px", border: "none", cursor: "pointer", background: "transparent", fontSize: "15px", fontWeight: 500, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                        {/* 삭제 버튼 */}
                        <button type="button" onClick={() => setSoldCounts((prev) => { const next = { ...prev }; delete next[id]; return next; })}
                          style={{ width: "28px", height: "28px", borderRadius: "8px", border: "none", background: "rgba(25,25,112,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 3l6 6M9 3l-6 6" stroke="rgba(15,23,42,0.35)" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* total + apply */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", borderRadius: "12px",
                background: totalFromProducts > 0 ? "rgba(25,25,112,0.05)" : "rgba(25,25,112,0.025)",
                border: totalFromProducts > 0 ? "1px solid rgba(25,25,112,0.1)" : "1px solid transparent",
              }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>
                    {ko ? "합계" : "Total"}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: totalFromProducts > 0 ? "#0f172a" : "rgba(15,23,42,0.25)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", marginTop: "2px" }}>
                    {totalFromProducts > 0 ? fmt(totalFromProducts) : "—"}
                  </div>
                </div>
                <button type="button" onClick={handleApply} disabled={totalFromProducts <= 0}
                  style={{ fontSize: "13px", fontWeight: 650, padding: "10px 18px", borderRadius: "10px", border: "none", cursor: totalFromProducts > 0 ? "pointer" : "default", background: totalFromProducts > 0 ? "#0f172a" : "rgba(25,25,112,0.05)", color: totalFromProducts > 0 ? "#fff" : "rgba(15,23,42,0.3)", transition: "all 0.15s ease" }}>
                  {ko ? "매출에 반영" : "Apply"}
                </button>
              </div>
            </div>

        </div>
        );
      })()}
    </div>
  );
}
