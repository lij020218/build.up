"use client";

import { useState } from "react";
import { INVESTMENT_TERMS, TERM_CATEGORIES, getTermsByCategory, searchTerms, getKoreaSpecificTerms, type TermCategory } from "@foundone/shared";

type Props = { ko: boolean };

export function InvestmentGlossary({ ko }: Props) {
  const [activeCategory, setActiveCategory] = useState<TermCategory | "all" | "korea">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = searchQuery
    ? searchTerms(searchQuery, ko ? "ko" : "en")
    : activeCategory === "all"
      ? INVESTMENT_TERMS
      : activeCategory === "korea"
        ? getKoreaSpecificTerms()
        : getTermsByCategory(activeCategory as TermCategory);

  const dangerColor = { safe: "#059669", caution: "#d97706", danger: "#dc2626" };
  const dangerLabel = {
    safe: ko ? "안전" : "Safe",
    caution: ko ? "주의" : "Caution",
    danger: ko ? "위험 — 변호사 검토 필수" : "Danger — lawyer review required",
  };

  return (
    <div style={card}>
      {/* 헤더 */}
      <div style={{ marginBottom: "4px" }}>
        <div style={eyebrow}>{ko ? "투자 용어 사전" : "Investment Glossary"}</div>
        <div style={title}>{ko ? "한국 스타트업 투자의 핵심 용어" : "Key Korean Startup Investment Terms"}</div>
      </div>

      {/* 검색 */}
      <div style={{ position: "relative" as const, marginTop: "10px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.3)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={ko ? "용어 검색..." : "Search terms..."}
          style={{ ...searchInput, paddingLeft: "36px" }}
        />
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "10px" }}>
        <button type="button" onClick={() => { setActiveCategory("all"); setSearchQuery(""); }} style={{
          ...filterBtn, background: activeCategory === "all" ? "#0f172a" : "transparent",
          color: activeCategory === "all" ? "#fff" : "rgba(15,23,42,0.4)",
        }}>{ko ? "전체" : "All"}</button>
        <button type="button" onClick={() => { setActiveCategory("korea"); setSearchQuery(""); }} style={{
          ...filterBtn, background: activeCategory === "korea" ? "#dc2626" : "transparent",
          color: activeCategory === "korea" ? "#fff" : "rgba(15,23,42,0.4)",
          border: activeCategory !== "korea" ? "1px solid rgba(220,38,38,0.15)" : "1px solid transparent",
        }}>🇰🇷 {ko ? "한국 특유" : "Korea"}</button>
        {TERM_CATEGORIES.map(cat => (
          <button key={cat.id} type="button" onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }} style={{
            ...filterBtn, background: activeCategory === cat.id ? cat.color : "transparent",
            color: activeCategory === cat.id ? "#fff" : "rgba(15,23,42,0.4)",
          }}>{ko ? cat.label.ko : cat.label.en}</button>
        ))}
      </div>

      {/* 용어 카드 */}
      <div style={{ display: "grid", gap: "8px", marginTop: "12px", maxHeight: "450px", overflowY: "auto" }}>
        {filtered.map(term => {
          const isExpanded = expandedId === term.id;
          const catInfo = TERM_CATEGORIES.find(c => c.id === term.category);
          return (
            <div key={term.id} onClick={() => setExpandedId(isExpanded ? null : term.id)} style={{
              borderRadius: "16px", overflow: "hidden", cursor: "pointer",
              border: isExpanded ? `1.5px solid ${catInfo?.color ?? "#0f172a"}20` : "1px solid rgba(15,23,42,0.04)",
              background: isExpanded ? `${catInfo?.color ?? "#0f172a"}03` : "rgba(255,255,255,0.6)",
              transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
            }}>
              {/* 기본 행 */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 660, color: "#0f172a" }}>
                      {ko ? term.term.ko : term.term.en}
                    </span>
                    {term.dangerLevel && (
                      <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 6px", borderRadius: "4px", background: `${dangerColor[term.dangerLevel]}10`, color: dangerColor[term.dangerLevel] }}>
                        {dangerLabel[term.dangerLevel]}
                      </span>
                    )}
                    {term.koreaSpecific && (
                      <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: "rgba(220,38,38,0.06)", color: "#dc2626" }}>KR</span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>
                    {ko ? term.shortDef.ko : term.shortDef.en}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
                  <path d="M3 5l4 4 4-4" stroke="rgba(15,23,42,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* 확장 영역 */}
              {isExpanded && (
                <div style={{ padding: "0 14px 14px" }} className="bento-fade-in">
                  <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(15,23,42,0.02)", marginBottom: "8px" }}>
                    <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.65)", lineHeight: 1.65 }}>
                      {ko ? term.longDef.ko : term.longDef.en}
                    </div>
                  </div>
                  {term.example && (
                    <div style={{ padding: "10px 14px", borderRadius: "12px", background: `${catInfo?.color ?? "#0f172a"}04`, border: `1px solid ${catInfo?.color ?? "#0f172a"}08` }}>
                      <div style={{ fontSize: "10px", fontWeight: 650, color: catInfo?.color ?? "#0f172a", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>
                        {ko ? "예시" : "Example"}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                        {ko ? term.example.ko : term.example.en}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  borderRadius: "22px", padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
  border: "1px solid rgba(15,23,42,0.05)",
  boxShadow: "0 2px 12px rgba(15,23,42,0.03), 0 1px 0 rgba(255,255,255,0.8) inset",
};
const eyebrow: React.CSSProperties = { fontSize: "11px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,23,42,0.4)" };
const title: React.CSSProperties = { fontSize: "18px", fontWeight: 740, letterSpacing: "-0.03em", color: "#0f172a", lineHeight: 1.2 };
const searchInput: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1.5px solid rgba(15,23,42,0.06)",
  fontSize: "14px", outline: "none", background: "rgba(255,255,255,0.8)",
  transition: "border-color 0.2s ease",
};
const filterBtn: React.CSSProperties = {
  padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.06)",
  fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap",
};
