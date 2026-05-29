"use client";

/**
 * AvgTicketUpsellCard — 객단가 업셀/크로스셀 자동 제안.
 *
 * **분기 / 노출 조건**:
 *   - 외식·카페·뷰티·소매·피트니스·교육 (객단가 개념이 있는 업종)
 *   - 메뉴/상품 1개 이상 등록되어 있을 때
 *
 * 핵심 가치:
 *   1. 사장님 메뉴 분포 자동 분석 (가격 갭 / 짐 메뉴 / 황금 메뉴)
 *   2. 업종별 검증된 패턴 4개 추천 (세트·사이드·프리미엄·로열티)
 *   3. 각 제안에 예상 효과 (객단가 +N%) 명시
 *   4. AI 호출 0원 — 룰 기반 즉시 응답
 *
 * 디자인: Found.One 토큰.
 */

import { useMemo, useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { suggestUpsells, type UpsellSuggestion, type MenuItemInput } from "@foundone/shared";

const MIDNIGHT_DEEP = "#141C3D";
const MIDNIGHT_SOFT = "#5A6BAE";
const TEXT_BODY = "#1A1F36";
const TEXT_MUTED = "#6B7393";
const SURFACE_LAVENDER = "#F4F5FB";
const HAIRLINE = "rgba(30,42,85,0.08)";
const HAIRLINE_STRONG = "rgba(30,42,85,0.16)";
const SKY = "#3B5BBF";
const SKY_BG = "#EAF2FF";
const AMBER_BG = "#FFF6E5";

const ELIGIBLE_INDUSTRIES = ["food", "cafe-dessert", "beauty", "retail", "fitness", "education"];

type Props = {
  ko: boolean;
  industryCategoryId?: string | null;
  /** 객단가 (원) — 매출 ÷ 고객수 */
  currentAvgTicket?: number | null;
  /** 메뉴/상품 (products + unifiedProducts + serviceMenuItems normalize) */
  menuItems: MenuItemInput[];
};

export function AvgTicketUpsellCard({ ko, industryCategoryId, currentAvgTicket, menuItems }: Props) {
  if (!industryCategoryId || !ELIGIBLE_INDUSTRIES.includes(industryCategoryId)) return null;

  const [expanded, setExpanded] = useState<string | null>(null);

  const suggestions = useMemo<UpsellSuggestion[]>(
    () =>
      suggestUpsells({
        industryCategoryId,
        menuItems,
        currentAvgTicket,
      }),
    [industryCategoryId, menuItems, currentAvgTicket],
  );

  if (suggestions.length === 0) return null;

  const isMenuEmpty = menuItems.length === 0;

  return (
    <article style={section}>
      <header style={{ display: "grid", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "grid", gap: "4px", flex: 1, minWidth: 0 }}>
            <div style={eyebrow}>{ko ? "객단가 업셀 제안" : "Avg Ticket Upsell"}</div>
            <div style={title}>
              {ko ? "객단가 +10–20% 올리는 길" : "Lift avg ticket +10–20%"}
            </div>
            <div style={{ fontSize: "12px", color: TEXT_MUTED, lineHeight: 1.55, marginTop: "2px" }}>
              {ko
                ? `사장님 메뉴와 ${industryDisplayName(industryCategoryId)} 업종 패턴 매칭 기반 추천 — 회전율은 그대로 둔 채 매출만 +10–20%.`
                : "Pattern-matched to your industry — same traffic, +10–20% revenue."}
            </div>
          </div>
          {currentAvgTicket != null && currentAvgTicket > 0 && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: SKY_BG,
                border: `1px solid ${HAIRLINE}`,
                minWidth: "100px",
                textAlign: "center" as const,
              }}
            >
              <TrendingUp size={18} strokeWidth={2} color={SKY} style={{ marginBottom: "2px" }} />
              <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                {ko ? "현재 객단가" : "Avg"}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: MIDNIGHT_DEEP, letterSpacing: "-0.02em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {formatWonShort(currentAvgTicket)}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 메뉴 비어있을 때 nudge */}
      {isMenuEmpty && (
        <div style={emptyNudge}>
          <Sparkles size={14} strokeWidth={2} color={MIDNIGHT_SOFT} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "11.5px", color: TEXT_BODY, lineHeight: 1.55 }}>
            {ko
              ? "메뉴를 등록하시면 사장님 가게 메뉴 분포에 맞춘 더 구체적인 업셀 제안이 가능합니다. 일단 업종 일반 패턴부터 보세요."
              : "Register your menu for personalized suggestions. General patterns shown."}
          </div>
        </div>
      )}

      {/* 제안 카드들 */}
      <div style={{ display: "grid", gap: "8px" }}>
        {suggestions.map((s, i) => {
          const isOpen = expanded === s.id;
          const isPrimary = i === 0;
          return (
            <div
              key={s.id}
              style={{
                ...suggestionCard,
                border: isPrimary ? `1.5px solid ${HAIRLINE_STRONG}` : `1px solid ${HAIRLINE}`,
                background: isPrimary ? SKY_BG : "#fff",
              }}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : s.id)}
                style={suggestionHeader}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                    {isPrimary && <Sparkles size={11} strokeWidth={2.5} color={SKY} />}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: SKY,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      {typeLabel(s.type, ko)}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: AMBER_BG,
                        color: "#8A5B11",
                      }}
                    >
                      {s.expectedImpactKo}
                    </span>
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT_DEEP, letterSpacing: "-0.01em", lineHeight: 1.4 }}>
                    {s.headlineKo}
                  </div>
                </div>
                {isOpen ? <ChevronUp size={14} color={MIDNIGHT_SOFT} /> : <ChevronDown size={14} color={MIDNIGHT_SOFT} />}
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: "10px 14px 14px",
                    borderTop: `1px solid ${HAIRLINE}`,
                    fontSize: "12px",
                    color: TEXT_BODY,
                    lineHeight: 1.6,
                  }}
                >
                  {s.actionKo}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div
        style={{
          fontSize: "10.5px",
          color: TEXT_MUTED,
          lineHeight: 1.55,
          paddingTop: "8px",
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        {ko
          ? "객단가 +10% = 매출 +10% (Bain·Square 검증). 한 가지부터 1주일 실험하시고 효과 확인 후 다음 단계로."
          : "Avg ticket +10% = revenue +10%. Try one tactic for a week, then iterate."}
      </div>
    </article>
  );
}

function industryDisplayName(id: string): string {
  return {
    food: "외식",
    "cafe-dessert": "카페·디저트",
    beauty: "뷰티",
    retail: "소매",
    fitness: "피트니스",
    education: "교육",
  }[id] ?? id;
}

function typeLabel(type: UpsellSuggestion["type"], ko: boolean): string {
  if (!ko) return type;
  return {
    "set-bundle": "세트 묶음",
    "side-add": "사이드 추가",
    "premium-tier": "프리미엄 옵션",
    "drink-pairing": "음료 페어링",
    "size-up": "사이즈 업",
    loyalty: "단골 락인",
    "menu-rename": "메뉴 가치화",
  }[type];
}

function formatWonShort(won: number): string {
  if (won >= 10_000) return `${Math.round(won / 1_000) / 10}만원`;
  return `${Math.round(won).toLocaleString()}원`;
}

// ─── styles ────────────────────────────────────────────────────────

const section: React.CSSProperties = {
  padding: "22px 24px",
  background: "#fff",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(30,42,85,0.03), 0 8px 28px rgba(30,42,85,0.04)",
  display: "grid",
  gap: "14px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SKY,
};

const title: React.CSSProperties = {
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  color: MIDNIGHT_DEEP,
};

const emptyNudge: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: SURFACE_LAVENDER,
  border: `1px dashed ${HAIRLINE_STRONG}`,
};

const suggestionCard: React.CSSProperties = {
  borderRadius: "12px",
  overflow: "hidden",
};

const suggestionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  width: "100%",
  padding: "12px 14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left" as const,
};
