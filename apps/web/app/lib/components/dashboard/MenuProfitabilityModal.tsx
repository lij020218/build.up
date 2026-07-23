"use client";

/**
 * MenuProfitabilityModal — 메뉴·서비스 수익성 상세 팝업 (2026-07-22 사장님 지시).
 *
 *  통합 '메뉴·재료 관리' 카드의 [자세히 보기] → 이 팝업.
 *  舊 MenuProfitabilityCard(홈 카드, e7294cf0 에서 흡수·삭제)의 분석을 팝업으로 재배치:
 *  KPI(메뉴 수·평균 원가율·평균 객단가) + 메뉴별 원가율·마진 전체 목록 + 황금률 초과 경보
 *  (인상 권장가) + 마진 기여 상위. 원가는 레시피(BOM) 있으면 재료 합산 — recipe-cost SSOT.
 *
 *  색: 신호등 금지 — 양호=미드나잇, 위험=벽돌(#b64c4c).
 */

import { useMemo } from "react";
import { X, AlertTriangle, TrendingUp } from "lucide-react";
import type { InventoryItem } from "../../stores/operations-store";
import { menuCostPerServing } from "../../recipe-cost";

const MIDNIGHT = "#191970";
const BRICK = "#b64c4c";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

type Props = {
  ko: boolean;
  menus: InventoryItem[];
  materials: InventoryItem[];
  goldenMax: number; // 음식·카페 33 / 서비스 25
  noun: string;      // "메뉴" | "서비스 메뉴"
  onClose: () => void;
};

function won(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return `₩${Math.round(n).toLocaleString()}`;
}

export function MenuProfitabilityModal({ ko, menus, materials, goldenMax, noun, onClose }: Props) {
  const metrics = useMemo(() => menus.map((m) => {
    const cost = menuCostPerServing(m, materials);
    const ratio = m.sellingPrice > 0 ? (cost / m.sellingPrice) * 100 : 0;
    return {
      id: m.id, name: m.name, category: m.displayCategory ?? "",
      price: m.sellingPrice, cost, ratio,
      margin: (m.sellingPrice || 0) - cost,
      sold: m.monthlySold ?? 0,
      hasRecipe: (m.recipe?.length ?? 0) > 0,
    };
  }), [menus, materials]);

  const totalRevenue = metrics.reduce((s, m) => s + m.price, 0);
  const totalCost = metrics.reduce((s, m) => s + m.cost, 0);
  const avgRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
  const avgPrice = metrics.length > 0 ? totalRevenue / metrics.length : 0;
  const overItems = metrics.filter((m) => m.price > 0 && m.ratio > goldenMax).sort((a, b) => b.ratio - a.ratio);
  const topMargin = [...metrics].sort((a, b) => b.margin - a.margin).slice(0, 3);
  const sorted = [...metrics].sort((a, b) => b.ratio - a.ratio); // 원가율 높은(위험) 순

  const ratioColor = (r: number) => (r > goldenMax ? BRICK : MIDNIGHT);

  return (
    <div
      role="dialog" aria-modal="true" aria-label={ko ? `${noun} 수익성 상세` : "Profitability detail"}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 28px", boxShadow: "0 -8px 40px rgba(15,23,42,0.2)" }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>{ko ? `${noun} 수익성 상세` : "Profitability"}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              {ko ? "판매가 · 원가(레시피 자동) · 원가율 · 마진" : "Price · cost · ratio · margin"}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* KPI 3칸 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          <Tile label={ko ? `${noun} 수` : "Items"} value={`${metrics.length}${ko ? "개" : ""}`} />
          <Tile label={ko ? "평균 원가율" : "Avg ratio"} value={`${avgRatio.toFixed(0)}%`}
            tone={avgRatio > goldenMax ? "brick" : "midnight"} sub={ko ? `황금률 ${goldenMax}%` : `golden ${goldenMax}%`} />
          <Tile label={ko ? "평균 객단가" : "Avg price"} value={won(avgPrice)} />
        </div>

        {/* 황금률 초과 경보 + 인상 권장가 */}
        {overItems.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "10.5px", fontWeight: 700, color: BRICK, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              <AlertTriangle size={12} strokeWidth={2.4} />
              {ko ? `원가율 ${goldenMax}% 초과 ${overItems.length}개` : `${overItems.length} over ${goldenMax}%`}
            </div>
            {overItems.map((m) => {
              const targetPrice = m.cost > 0 ? Math.ceil(m.cost / (goldenMax / 100) / 100) * 100 : 0;
              return (
                <div key={m.id} style={{ padding: "9px 11px", borderRadius: 10, border: "1px solid rgba(182,76,76,0.18)", background: "rgba(182,76,76,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: INK }}>{m.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: BRICK }}>{m.ratio.toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(182,76,76,0.75)", marginTop: 2 }}>
                    {ko
                      ? `${won(m.price)} 판매 · ${won(m.cost)} 원가 → 단가 ${won(targetPrice)} 로 인상 권장`
                      : `${won(m.price)} · ${won(m.cost)} cost → raise to ${won(targetPrice)}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 메뉴별 상세 목록 (원가율 높은 순) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
            {ko ? `${noun}별 원가율·마진` : "Per-item detail"}
          </div>
          {sorted.map((m) => (
            <div key={m.id} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(25,25,112,0.025)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 650, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  {m.category && <span style={{ fontSize: "9.5px", fontWeight: 600, padding: "1px 6px", borderRadius: 8, background: "rgba(25,25,112,0.06)", color: MUTED, flexShrink: 0 }}>{m.category}</span>}
                </div>
                {m.price > 0 && (
                  <span style={{ fontSize: 12.5, fontWeight: 750, color: ratioColor(m.ratio), flexShrink: 0 }}>{m.ratio.toFixed(0)}%</span>
                )}
              </div>
              {/* 원가율 바 */}
              {m.price > 0 && (
                <div style={{ height: 3, borderRadius: 2, background: "rgba(0,0,0,0.07)", margin: "6px 0" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${Math.max(0, Math.min(100, m.ratio))}%`, background: ratioColor(m.ratio) }} />
                </div>
              )}
              <div style={{ fontSize: 11, color: MUTED }}>
                {ko
                  ? `판매 ${won(m.price)} · 원가 ${m.cost > 0 ? won(m.cost) : "미입력"}${m.hasRecipe ? " (레시피)" : ""} · 마진 ${won(m.margin)}${m.sold > 0 ? ` · 이달 ${m.sold}개` : ""}`
                  : `${won(m.price)} · cost ${m.cost > 0 ? won(m.cost) : "N/A"} · margin ${won(m.margin)}`}
              </div>
            </div>
          ))}
        </div>

        {/* 마진 기여 상위 (효자) */}
        {topMargin.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              <TrendingUp size={12} strokeWidth={2.4} />
              {ko ? "마진 기여 상위" : "Top margin"}
            </div>
            {topMargin.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "7px 11px", borderRadius: 9, background: "rgba(25,25,112,0.025)" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: INK }}>{m.name}</span>
                <span style={{ fontSize: "11.5px", color: MUTED }}>
                  {ko ? `마진 ${won(m.margin)} · 원가율 ${m.ratio.toFixed(0)}%` : `${won(m.margin)} · ${m.ratio.toFixed(0)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, sub, tone = "midnight" }: { label: string; value: string; sub?: string; tone?: "midnight" | "brick" }) {
  return (
    <div style={{ padding: "11px 10px", borderRadius: 12, background: "rgba(25,25,112,0.03)", display: "flex", flexDirection: "column", gap: 2, alignItems: "center", textAlign: "center" }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: tone === "brick" ? BRICK : MIDNIGHT, letterSpacing: "-0.4px", lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: "10.5px", fontWeight: 600, color: INK }}>{label}</span>
      {sub && <span style={{ fontSize: "9.5px", color: MUTED }}>{sub}</span>}
    </div>
  );
}
