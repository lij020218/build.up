"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  franchiseBrandsAll,
  computeOverallScore,
  formatFranchiseCost,
  getScoreColor,
  getScoreLabel,
} from "@foundone/shared";
import { FranchiseDetailModal } from "./FranchiseDetailModal";
import { Search, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";

/** 목록 페이지 크기 — 20행씩 "더 보기" (iOS FranchiseView franchisePageSize 동일, 2026-08-19) */
const PAGE_SIZE = 20;

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
  const allBrands = franchiseBrandsAll;
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
  const [searchQuery, setSearchQueryRaw] = useState("");
  const setSearchQuery = (v: string) => { setSearchQueryRaw(v); setVisibleCount(PAGE_SIZE); };
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const q = searchQuery.trim().toLowerCase();
  const filtered = allBrands.filter(b => {
    if (filterCat !== "all" && b.categoryId !== filterCat) return false;
    if (q) {
      const hay = `${b.name.ko} ${b.name.en} ${b.tagline.ko} ${b.tagline.en}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  // 큐레이션(편집 검증) 우선 → 그 다음 종합 점수. 공정위 자동 브랜드는 뒤에서 점수순.
  const sorted = [...filtered].sort((a, b) => {
    const ta = a.tier === "kftc" ? 1 : 0, tb = b.tier === "kftc" ? 1 : 0;
    if (ta !== tb) return ta - tb;
    return computeOverallScore(b.scores) - computeOverallScore(a.scores);
  });
  const visible = sorted.slice(0, visibleCount);
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

      {/* 검색 — 브랜드명·태그라인 (예: 교촌, BBQ, 메가커피) */}
      <div style={searchWrapStyle}>
        <Search size={15} strokeWidth={1.8} style={{ color: TEXT_SUBTLE, flexShrink: 0 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={ko ? "브랜드 검색 (예: 교촌, BBQ, 메가커피)" : "Search brands"}
          style={searchInputStyle}
          aria-label={ko ? "프랜차이즈 검색" : "Search franchises"}
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")} style={searchClearStyle} aria-label={ko ? "지우기" : "Clear"}>✕</button>
        )}
      </div>

      {/* Category filter chips — midnight 톤 통일 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
        {categories.map(cat => {
          const active = filterCat === cat.id;
          const count = cat.id === "all" ? allBrands.length : allBrands.filter(b => b.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setFilterCat(cat.id); setVisibleCount(PAGE_SIZE); }}
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

      {/* Brand rows — 컴팩트 한 줄(브랜드 · 카테고리 · 종합 · 창업비용 · 폐점률 + chevron).
          2026-08-19 밀도 정리: 4 지표 그리드 + 5 점수 바는 FranchiseDetailModal 에 이미 있음 → 행에서 제거. iOS 동일 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map(fb => {
          const overall = computeOverallScore(fb.scores);
          const isKftc = fb.tier === "kftc";
          const catLabel = categories.find(c => c.id === fb.categoryId)?.label ?? fb.categoryId;
          const closureColor = fb.closureRate >= 20 ? "#b64c4c" : fb.closureRate >= 10 ? MIDNIGHT : TEXT_PRIMARY;

          return (
            <button
              key={fb.id}
              type="button"
              onClick={() => setSelectedBrandId(fb.id)}
              className="bento-card"
              style={rowStyle}
            >
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {fb.name[language]}
                  </span>
                  <span style={rowChipStyle}>{catLabel}</span>
                  {isKftc && (
                    <span title={ko ? "공정위 공개데이터 자동 수록 · 점수는 실데이터 산출" : "Auto-listed from KFTC open data"} style={{ ...rowChipStyle, color: "rgba(25,25,112,0.7)" }}>
                      {ko ? "공정위" : "KFTC"}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: TEXT_MUTED, flexWrap: "wrap" }}>
                  <span>{ko ? "창업비용" : "Startup"} <strong style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{fb.startupCostWon > 0 ? formatFranchiseCost(fb.startupCostWon) : "—"}</strong></span>
                  <span>{ko ? "폐점률" : "Closure"} <strong style={{ color: closureColor, fontWeight: 700 }}>{fb.closureRate > 0 ? `${fb.closureRate}%` : "—"}</strong></span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1, color: getScoreColor(overall) }}>{overall}</span>
                <span style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{getScoreLabel(overall, language)}</span>
              </div>
              <ChevronRight size={16} strokeWidth={2} style={{ color: TEXT_SUBTLE, flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {visibleCount < sorted.length && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "11px 26px", borderRadius: 999, border: `1px solid ${MIDNIGHT_BORDER}`,
              background: "white", color: MIDNIGHT, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {ko ? `더 보기 ${Math.min(PAGE_SIZE, sorted.length - visibleCount)}개 (${visible.length}/${sorted.length})` : `Show ${Math.min(PAGE_SIZE, sorted.length - visibleCount)} more (${visible.length}/${sorted.length})`}
            <ChevronDown size={13} strokeWidth={2} />
          </button>
        </div>
      )}

      {sorted.length === 0 && (
        <div style={emptyBoxStyle}>
          <div style={{ fontSize: 13, color: TEXT_MUTED }}>
            {q
              ? (ko ? `'${searchQuery.trim()}' 검색 결과가 없습니다.` : `No results for '${searchQuery.trim()}'.`)
              : (ko ? "이 카테고리에 등록된 프랜차이즈가 없습니다." : "No franchises in this category.")}
          </div>
        </div>
      )}

      {/* 한 줄 각주 — iOS disclaimerFootnote 미러 */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11.5, color: TEXT_MUTED, lineHeight: 1.5 }}>
        <AlertTriangle size={12} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.7, flexShrink: 0, marginTop: 2 }} />
        <span>
          {ko
            ? "비교 예시 데이터 — 계약 전 공정위 정보공개서(franchise.ftc.go.kr)로 본사명·점포수·매출·폐점률(20%+ 위험) 직접 확인"
            : "Comparison data only — verify HQ, store count, revenue and closure rate (20%+ = risk) on the KFTC disclosure site before signing."}
        </span>
      </div>

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

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 14,
  border: `1px solid ${MIDNIGHT_BORDER_LIGHT}`,
  background: "white",
  cursor: "pointer",
  textAlign: "left" as const,
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  fontFamily: "inherit",
  width: "100%",
};

const rowChipStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "2px 7px",
  borderRadius: 999,
  background: "rgba(25,25,112,0.06)",
  color: MIDNIGHT,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const emptyBoxStyle: React.CSSProperties = {
  padding: "48px 20px",
  textAlign: "center",
  borderRadius: 16,
  background: MIDNIGHT_TINT,
  border: `1px dashed ${MIDNIGHT_BORDER}`,
};

// ── 검색 — 펀딩 페이지와 톤 통일(흰 배경·라운드·미드나잇 보더) ──
const searchWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  background: "white",
  maxWidth: 420,
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13.5,
  color: TEXT_PRIMARY,
  fontFamily: "inherit",
  padding: 0,
};

const searchClearStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 9999,
  border: "none",
  background: MIDNIGHT_TINT,
  color: TEXT_MUTED,
  fontSize: 11,
  cursor: "pointer",
  lineHeight: 1,
};
