"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  franchiseBrands,
  computeOverallScore,
  formatFranchiseCost,
  getScoreColor,
  getScoreLabel,
} from "@build-up/shared";
import { FranchiseDetailModal } from "./FranchiseDetailModal";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_BORDER_LIGHT = "rgba(25,25,112,0.08)";
const MIDNIGHT_TINT = "rgba(25,25,112,0.04)";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "rgba(15,23,42,0.55)";
const TEXT_SUBTLE = "rgba(15,23,42,0.45)";

export function FranchiseView() {
  const { language } = useDashboardCtx();
  const ko = language === "ko";
  const allBrands = franchiseBrands;
  const categories = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "cafe-dessert", label: ko ? "카페·디저트" : "Cafe" },
    { id: "food", label: ko ? "음식" : "Food" },
    { id: "retail", label: ko ? "소매" : "Retail" },
    { id: "beauty", label: ko ? "뷰티" : "Beauty" },
    { id: "fitness", label: ko ? "피트니스" : "Fitness" },
    { id: "education", label: ko ? "교육" : "Education" },
    { id: "pet", label: ko ? "반려동물" : "Pet" },
    { id: "living-service", label: ko ? "생활서비스" : "Living" },
    { id: "space", label: ko ? "공간" : "Space" },
  ];
  const [filterCat, setFilterCat] = useState("all");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const filtered = filterCat === "all" ? allBrands : allBrands.filter(b => b.categoryId === filterCat);
  const sorted = [...filtered].sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores));
  const selectedBrand = selectedBrandId ? allBrands.find(b => b.id === selectedBrandId) ?? null : null;

  return (
    <main style={pageStyle}>
      {/* Header — 4 surface 공통 패턴 */}
      <header style={headerStyle}>
        <div style={eyebrowStyle}>{ko ? "FRANCHISE" : "FRANCHISE"}</div>
        <h1 style={titleStyle}>
          {ko ? "프랜차이즈 브랜드" : "Franchise Brands"}
        </h1>
        <p style={subtitleStyle}>
          {ko
            ? `${allBrands.length}개 브랜드의 수익성·안정성·창업비용을 비교하세요. 카드를 클릭하면 점수·장단점·출처가 담긴 상세 페이지가 열립니다.`
            : `Compare profitability, stability, and startup costs across ${allBrands.length} brands. Click any card for detailed scores, pros/cons, and sources.`}
        </p>
      </header>

      {/* Category filter chips — midnight 톤 통일 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
        {categories.map(cat => {
          const active = filterCat === cat.id;
          const count = cat.id === "all" ? allBrands.length : allBrands.filter(b => b.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCat(cat.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 9999,
                border: `1px solid ${active ? MIDNIGHT : "rgba(15,23,42,0.10)"}`,
                background: active ? MIDNIGHT : "white",
                color: active ? "white" : TEXT_PRIMARY,
                fontSize: 12,
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.18s ease",
                fontFamily: "inherit",
              }}
            >
              {cat.label} <span style={{ fontSize: 11, opacity: active ? 0.8 : 0.5, marginLeft: 2 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Brand cards grid */}
      <div className="bento-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {sorted.map(fb => {
          const overall = computeOverallScore(fb.scores);
          const hasDetailedData = !!(fb.sources?.length || fb.pros || fb.cons);

          return (
            <button
              key={fb.id}
              type="button"
              onClick={() => setSelectedBrandId(fb.id)}
              className="bento-card"
              style={{
                display: "grid",
                gap: 10,
                padding: "20px 20px 18px",
                borderRadius: 18,
                border: `1px solid ${MIDNIGHT_BORDER_LIGHT}`,
                background: "white",
                cursor: "pointer",
                textAlign: "left" as const,
                transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                fontFamily: "inherit",
              }}
            >
              {/* Row 1: Name + score */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {fb.name[language]}
                    {hasDetailedData && (
                      <span title={ko ? "상세 데이터 보강" : "Detailed data available"} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "999px", background: "rgba(34,197,94,0.1)", color: "#15803d", fontWeight: 600 }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: "13px", color: "var(--muted)", lineHeight: 1.4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                  }}>{fb.tagline[language]}</div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 24,
                  background: `conic-gradient(${getScoreColor(overall)} ${overall * 3.6}deg, rgba(0,0,0,0.04) 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 19, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1, color: getScoreColor(overall) }}>{overall}</span>
                    <span style={{ fontSize: "7px", color: "var(--muted)" }}>{getScoreLabel(overall, language)}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Key metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                {[
                  { l: ko ? "창업비용" : "Startup", v: formatFranchiseCost(fb.startupCostWon) },
                  { l: ko ? "연매출" : "Revenue", v: formatFranchiseCost(fb.avgAnnualRevenueWon) },
                  { l: ko ? "폐점률" : "Closure", v: `${fb.closureRate}%` },
                  { l: ko ? "매장수" : "Stores", v: fb.storeCount.toLocaleString() },
                ].map(m => (
                  <div key={m.l} style={{ padding: "6px 4px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", textAlign: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{m.v}</div>
                    <div style={{ fontSize: "9px", color: "var(--muted)" }}>{m.l}</div>
                  </div>
                ))}
              </div>

              {/* Row 3: Score bars */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
                {[
                  { l: ko ? "수익" : "Profit", v: fb.scores.profitability },
                  { l: ko ? "안정" : "Stable", v: fb.scores.stability },
                  { l: ko ? "진입" : "Access", v: fb.scores.accessibility },
                  { l: ko ? "브랜드" : "Brand", v: fb.scores.brandPower },
                  { l: ko ? "지원" : "Support", v: fb.scores.support },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: "center" }}>
                    <div style={{ height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.04)", marginBottom: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${s.v}%`, height: "100%", borderRadius: "2px", background: getScoreColor(s.v) }} />
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--muted)" }}>{s.l}</div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: getScoreColor(s.v) }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Row 4: Click hint */}
              <div style={{ marginTop: 2, fontSize: 11, color: TEXT_MUTED, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  {ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}
                  {fb.monthlyRoyalty > 0 && (ko ? ` · 로열티 ${fb.monthlyRoyalty}만/월` : ` · ${fb.monthlyRoyalty}K/mo`)}
                </span>
                <span style={{ color: MIDNIGHT, fontWeight: 700 }}>
                  {ko ? "상세보기 →" : "View detail →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div style={emptyBoxStyle}>
          <div style={{ fontSize: 13, color: TEXT_MUTED }}>
            {ko ? "이 카테고리에 등록된 프랜차이즈가 없습니다." : "No franchises in this category."}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedBrand && (
        <FranchiseDetailModal
          brand={selectedBrand}
          language={language}
          onClose={() => setSelectedBrandId(null)}
        />
      )}
    </main>
  );
}

// ── 4 surface 공통 page/header 패턴 ──
const pageStyle: React.CSSProperties = {
  maxWidth: "960px",   // width: "min(960px, calc(100vw-32px))" 는 부모 padding 을 무시해 ~992px 뷰포트에서 오버플로우 발생
  width: "100%",
  margin: "0 auto",
  padding: "24px 0 80px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 4,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.65,
  letterSpacing: "0.12em",
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 750,
  letterSpacing: "-0.025em",
  color: TEXT_PRIMARY,
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: TEXT_MUTED,
  lineHeight: 1.55,
  margin: 0,
  maxWidth: 640,
};

const emptyBoxStyle: React.CSSProperties = {
  padding: "48px 20px",
  textAlign: "center",
  borderRadius: 16,
  background: MIDNIGHT_TINT,
  border: `1px dashed ${MIDNIGHT_BORDER}`,
};
