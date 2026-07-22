"use client";

/**
 * MenuProfitabilityCard — 메뉴·서비스 라인업 수익성 (음식·카페·서비스 전용).
 *
 *  ── 왜 만들었나 (2026-06-23) ──────────────────────────────────────────
 *  로드맵 menu-design 에서 입력한 메뉴(판매가·원가)가 재고 카드에 "재고 0개" 로 묻혀
 *  의미가 깨졌다(메뉴 ≠ 재고). 메뉴는 *판매 품목* → per-item 원가율·마진으로 별도 표시.
 *  "비표시가 아니라 맞게 표시" 원칙 + 새 카드 막추가 금지의 정당한 예외(의미 구분).
 *
 *  ── 데이터 (위조 0) ───────────────────────────────────────────────────
 *  useOperationsStore.inventory 중 itemType==="product" (menu-design syncMenuToInventory 가 기록).
 *  지표: 판매가·원가 → 원가율(=원가/판매가) · 마진(=판매가−원가). 평균 원가율 · 메뉴 수 · 평균 객단가.
 *  황금률(음식·카페 33% / 서비스 25%) 초과 메뉴 = 벽돌 경보.
 *
 *  ── forward-compat (메뉴 엔지니어링) ─────────────────────────────────
 *  정통 메뉴 엔지니어링 매트릭스는 *인기도(판매량) × 수익성(마진)* 2축(Toast·R365·meez).
 *  메뉴별 판매량(monthlySold) 이 쌓이면 스타/간판메뉴/퍼즐/도그 4분면으로 업그레이드 —
 *  지금은 판매량 데이터가 없어 위조하지 않고 마진·원가율 단일축으로만 표시(가짜숫자 금지).
 *
 *  색: 신호등 금지 — 양호=미드나잇, 위험=벽돌(#b64c4c).
 */

import { useMemo } from "react";
import { UtensilsCrossed, Coffee, Sparkles, AlertTriangle, TrendingUp } from "lucide-react";
import { useOperationsStore } from "../../stores";
import { menuCostPerServing } from "../../recipe-cost";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.10)";
const BRICK = "#b64c4c";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

type Props = { ko: boolean; industryCategoryId?: string };

type Cluster = "food" | "cafe" | "service" | "other";

function clusterOf(categoryId?: string): Cluster {
  switch (categoryId) {
    case "food": return "food";
    case "cafe-dessert": return "cafe";
    case "beauty":
    case "fitness":
    case "pet":
    case "education":
    case "living-service":
    case "space":
      return "service";
    default: return "other";
  }
}

/** 정확한 원화 표시 — 반올림 최소화. */
function won(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return `₩${Math.round(n).toLocaleString()}`;
}

export function MenuProfitabilityCard({ ko, industryCategoryId }: Props) {
  const inventory = useOperationsStore((s) => s.inventory);
  const cluster = clusterOf(industryCategoryId);

  // 로드맵 menu-design → syncMenuToInventory 가 product 로 기록한 항목만.
  const menu = useMemo(
    () => inventory.filter((i) => i.itemType === "product"),
    [inventory],
  );
  // 재료(material) — 레시피 원가 계산용.
  const materials = useMemo(() => inventory.filter((i) => i.itemType === "material"), [inventory]);
  // 메뉴 원가 = 레시피 있으면 재료 합산(자동), 없으면 수동 unitCost. (2026-07-22 레시피/BOM)
  const costOf = (m: (typeof menu)[number]) => menuCostPerServing(m, materials);

  // 빈 카드 금지 — 메뉴 입력 전이면 렌더 안 함.
  if (menu.length === 0) return null;

  const noun = cluster === "cafe" ? (ko ? "음료" : "Drinks")
    : cluster === "service" ? (ko ? "서비스" : "Services")
    : (ko ? "메뉴" : "Menu");
  const goldenMax = cluster === "service" ? 25 : 33; // 서비스 객단가 원가율 25% / 음식·카페 33%
  const Icon = cluster === "cafe" ? Coffee : cluster === "service" ? Sparkles : UtensilsCrossed;

  const totalRevenue = menu.reduce((s, m) => s + (m.sellingPrice || 0), 0);
  const totalCost = menu.reduce((s, m) => s + costOf(m), 0);
  const avgRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
  const avgPrice = menu.length > 0 ? totalRevenue / menu.length : 0;

  const withMetrics = menu.map((m) => {
    const cost = costOf(m);
    const ratio = m.sellingPrice > 0 ? (cost / m.sellingPrice) * 100 : 0;
    const margin = (m.sellingPrice || 0) - cost;
    return { id: m.id, name: m.name, price: m.sellingPrice, cost, ratio, margin };
  });

  // 원가율 초과(저수익) — 황금률 넘는 메뉴, 비율 높은 순.
  const overItems = withMetrics
    .filter((m) => m.price > 0 && m.ratio > goldenMax)
    .sort((a, b) => b.ratio - a.ratio);

  // 마진 기여 상위 — 효자 메뉴.
  const topMargin = [...withMetrics].sort((a, b) => b.margin - a.margin).slice(0, 3);

  const avgRatioWarn = avgRatio > goldenMax;

  return (
    <article
      data-menu-profitability-card
      style={{
        borderRadius: "20px",
        border: `1px solid ${MIDNIGHT_BORDER}`,
        background: "white",
        padding: "20px 22px",
        boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* 헤더 */}
      <header style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(25,25,112,0.08)" }}>
          <Icon size={17} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {ko ? `${noun} 수익성` : `${noun} profitability`}
          </div>
          <div style={{ fontSize: "11.5px", fontWeight: 500, color: MUTED }}>
            {ko ? "판매가 · 원가 · 원가율 · 마진" : "Price · cost · ratio · margin"}
          </div>
        </div>
      </header>

      {/* KPI 3칸 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        <KpiTile label={ko ? `${noun} 수` : "Items"} value={`${menu.length}${ko ? "개" : ""}`} />
        <KpiTile
          label={ko ? "평균 원가율" : "Avg cost ratio"}
          value={`${avgRatio.toFixed(0)}%`}
          tone={avgRatioWarn ? "brick" : "midnight"}
          sub={ko ? `황금률 ${goldenMax}%` : `golden ${goldenMax}%`}
        />
        <KpiTile label={ko ? "평균 객단가" : "Avg price"} value={won(avgPrice)} />
      </div>

      {/* 원가율 초과 메뉴 경보 (벽돌) */}
      {overItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "10.5px", fontWeight: 700, color: BRICK, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            <AlertTriangle size={12} strokeWidth={2.4} />
            {ko ? `원가율 ${goldenMax}% 초과 ${overItems.length}개` : `${overItems.length} over ${goldenMax}%`}
          </div>
          {overItems.slice(0, 3).map((m) => {
            const targetPrice = m.cost > 0 ? Math.ceil(m.cost / (goldenMax / 100) / 100) * 100 : 0;
            return (
              <div key={m.id} style={{ padding: "9px 11px", borderRadius: "10px", border: "1px solid rgba(182,76,76,0.18)", background: "rgba(182,76,76,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: INK }}>{m.name}</span>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: BRICK }}>{m.ratio.toFixed(0)}%</span>
                </div>
                <div style={{ fontSize: "11px", color: "rgba(182,76,76,0.75)", marginTop: 2 }}>
                  {ko
                    ? `${won(m.price)} 판매 · ${won(m.cost)} 원가 → 단가 ${won(targetPrice)} 로 인상 권장`
                    : `${won(m.price)} price · ${won(m.cost)} cost → raise to ${won(targetPrice)}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 마진 기여 상위 (효자 메뉴) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          <TrendingUp size={12} strokeWidth={2.4} />
          {ko ? "마진 기여 상위" : "Top margin"}
        </div>
        {topMargin.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "7px 11px", borderRadius: "9px", background: "rgba(25,25,112,0.025)" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: INK }}>{m.name}</span>
            <span style={{ fontSize: "11.5px", color: MUTED }}>
              {ko ? `마진 ${won(m.margin)} · 원가율 ${m.ratio.toFixed(0)}%` : `${won(m.margin)} · ${m.ratio.toFixed(0)}%`}
            </span>
          </div>
        ))}
      </div>

      {/* forward-compat 안내 — 판매량 쌓이면 메뉴 엔지니어링 */}
      <div style={{ fontSize: "10.5px", color: "rgba(15,23,42,0.42)", lineHeight: 1.5, borderTop: `1px dashed ${MIDNIGHT_BORDER}`, paddingTop: 10 }}>
        {ko
          ? "판매량이 쌓이면 인기 × 수익으로 ‘스타·간판·퍼즐·정리’ 메뉴를 자동 분류합니다."
          : "As sales accrue, items auto-classify by popularity × profit (stars / plowhorses / puzzles / dogs)."}
      </div>
    </article>
  );
}

function KpiTile({ label, value, sub, tone = "midnight" }: { label: string; value: string; sub?: string; tone?: "midnight" | "brick" }) {
  const color = tone === "brick" ? BRICK : MIDNIGHT;
  return (
    <div style={{ padding: "11px 10px", borderRadius: "12px", background: "rgba(25,25,112,0.03)", display: "flex", flexDirection: "column", gap: 2, alignItems: "center", textAlign: "center" }}>
      <span style={{ fontSize: "19px", fontWeight: 800, color, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: "10.5px", fontWeight: 600, color: INK }}>{label}</span>
      {sub && <span style={{ fontSize: "9.5px", color: MUTED }}>{sub}</span>}
    </div>
  );
}
