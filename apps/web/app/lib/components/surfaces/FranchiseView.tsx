"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import {
  franchiseBrands,
  computeOverallScore,
  formatFranchiseCost,
  getScoreColor,
  getScoreLabel,
  getFranchiseSupplyInfo,
  getSupplyTypeColor,
} from "@build-up/shared";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = filterCat === "all" ? allBrands : allBrands.filter(b => b.categoryId === filterCat);
  const sorted = [...filtered].sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores));

  return (
    <section style={styles.section}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "8px" }}>
          {ko ? "프랜차이즈 브랜드" : "Franchise Brands"}
        </div>
        <div style={{ fontSize: "16px", lineHeight: 1.6, color: "var(--muted)", maxWidth: "560px" }}>
          {ko
            ? "각 브랜드의 수익성, 안정성, 창업비용을 비교하고 나에게 맞는 프랜차이즈를 찾아보세요."
            : "Compare profitability, stability, and startup costs to find the right franchise for you."}
        </div>
      </div>

      {/* Category filter chips */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {categories.map(cat => {
          const active = filterCat === cat.id;
          const count = cat.id === "all" ? allBrands.length : allBrands.filter(b => b.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setFilterCat(cat.id); setExpandedId(null); }}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                background: active ? "rgba(29,53,87,0.06)" : "rgba(255,255,255,0.7)",
                color: active ? "var(--primary)" : "var(--muted)",
                fontSize: "13px",
                fontWeight: active ? 600 : 500,
                cursor: "pointer"
              }}
            >
              {cat.label} <span style={{ fontSize: "11px", opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Brand cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
        {sorted.map(fb => {
          const overall = computeOverallScore(fb.scores);
          const expanded = expandedId === fb.id;
          const supplyInfo = getFranchiseSupplyInfo(fb);

          return (
            <button
              key={fb.id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : fb.id)}
              style={{
                display: "grid",
                gap: expanded ? "14px" : "10px",
                padding: "20px",
                borderRadius: "24px",
                border: expanded ? "2px solid var(--primary)" : "1px solid var(--border)",
                background: expanded ? "rgba(29,53,87,0.03)" : "rgba(255,255,255,0.82)",
                boxShadow: expanded ? "0 0 0 4px rgba(29,53,87,0.05)" : "0 2px 8px rgba(17,17,17,0.03)",
                cursor: "pointer",
                textAlign: "left" as const,
                transition: "all 0.2s ease"
              }}
            >
              {/* Row 1: Name + score */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "3px" }}>{fb.name[language]}</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.4 }}>{fb.tagline[language]}</div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 24,
                  background: `conic-gradient(${getScoreColor(overall)} ${overall * 3.6}deg, rgba(0,0,0,0.04) 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 19, background: expanded ? "rgba(255,255,255,0.95)" : "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
                  <div key={m.l} style={{ padding: "6px 4px", borderRadius: "8px", background: expanded ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
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

              {/* Expanded: Details */}
              {expanded && (
                <>
                  {/* Roadmap notes */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "8px" }}>
                      {ko ? "특이사항" : "Key Notes"}
                    </div>
                    {fb.roadmapNotes[language].map((note, i) => (
                      <div key={i} style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", display: "flex", gap: "5px", marginBottom: "3px" }}>
                        <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>

                  {/* Supply structure summary */}
                  {supplyInfo.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "8px" }}>
                        {ko ? "공급 구조" : "Supply Structure"}
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const }}>
                        {supplyInfo.map((s, i) => (
                          <span key={i} style={{
                            fontSize: "10px", fontWeight: 500, padding: "3px 8px", borderRadius: "6px",
                            background: `${getSupplyTypeColor(s.type)}10`, color: getSupplyTypeColor(s.type),
                            border: `1px solid ${getSupplyTypeColor(s.type)}20`
                          }}>
                            {s.category[language]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost + CTA */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const, borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", gap: "10px", flex: 1, alignItems: "center" }}>
                      <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
                      <span>·</span>
                      <span>{ko ? `로열티 ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "만/월" : "없음"}` : `Royalty ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
                    </div>
                    {fb.franchiseUrl && (
                      <a
                        href={fb.franchiseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: "8px 16px", borderRadius: "999px",
                          background: "var(--primary)", color: "#fff",
                          fontSize: "12px", fontWeight: 600,
                          textDecoration: "none", whiteSpace: "nowrap"
                        }}
                      >
                        {ko ? "가맹 문의 →" : "Inquiry →"}
                      </a>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
          {ko ? "이 카테고리에 등록된 프랜차이즈가 없습니다." : "No franchises in this category."}
        </div>
      )}
    </section>
  );
}
