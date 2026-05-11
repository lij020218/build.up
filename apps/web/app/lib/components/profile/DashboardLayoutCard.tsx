"use client";

/**
 * DashboardLayoutCard — 마이페이지에서 사장님이 대시보드 카드를 켜고 끄는 설정.
 *
 *  ── 디자인 원칙 ──────────────────────────────────────────────
 *  · ProfileView 의 기존 card / sectionLabel / row 토큰과 동일.
 *  · iOS 스위치 패턴 (32×20px, midnight 강조).
 *  · essential 카드는 카탈로그에 없어서 처음부터 렌더 안 됨 — 사장님이 실수로 핵심 카드를 못 끄게.
 *  · 카테고리별로 묶어서 표시 (Hero → Daily → Coaching) — 어디 카드인지 인지 도움.
 *  ────────────────────────────────────────────────────────────
 */

import React from "react";
import { useProfileStore } from "../../stores/profile-store";
import {
  getHidableCards,
  type DashboardCardMeta,
  type DashboardCardCategory,
} from "../../dashboard-cards-meta";

const CATEGORY_LABEL_KO: Record<DashboardCardCategory, string> = {
  hero: "Hero · 최상단",
  daily: "Daily Hub · 매일 보는 상태",
  coaching: "Coaching · 오늘 할 일",
  deepdive: "Deep Dive · 깊이 보기",
};

const CATEGORY_LABEL_EN: Record<DashboardCardCategory, string> = {
  hero: "Hero · Top",
  daily: "Daily Hub",
  coaching: "Coaching",
  deepdive: "Deep Dive",
};

export function DashboardLayoutCard({ ko }: { ko: boolean }) {
  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const toggleHiddenCard = useProfileStore((s) => s.toggleHiddenCard);
  const setHiddenCards = useProfileStore((s) => s.setHiddenCards);

  const hidableCards = getHidableCards();
  const grouped = hidableCards.reduce<Record<DashboardCardCategory, DashboardCardMeta[]>>(
    (acc, c) => {
      (acc[c.category] ||= []).push(c);
      return acc;
    },
    {} as Record<DashboardCardCategory, DashboardCardMeta[]>,
  );

  const hiddenCount = hiddenCards.length;
  const totalCount = hidableCards.length;

  return (
    <article style={{
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.06)",
      borderRadius: "14px",
      padding: 0,
      overflow: "hidden",
      marginTop: "12px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 18px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
      }}>
        <div style={{ display: "grid", gap: "4px", flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.07em",
          }}>
            {ko ? "대시보드 카드 표시" : "Dashboard cards"}
          </div>
          <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.7)", lineHeight: 1.5 }}>
            {ko
              ? "매일 보고 싶은 카드만 켜두세요. 끈 카드는 다시 켤 때까지 안 보입니다."
              : "Enable cards you want to see daily. Disabled cards stay hidden."}
          </div>
        </div>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setHiddenCards([])}
            style={{
              fontSize: "11.5px",
              fontWeight: 650,
              padding: "6px 11px",
              borderRadius: "8px",
              border: "1px solid rgba(25,25,112,0.16)",
              background: "rgba(25,25,112,0.04)",
              color: "#191970",
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            {ko ? `전체 켜기 (${hiddenCount}개 숨김)` : `Show all (${hiddenCount} hidden)`}
          </button>
        )}
      </div>

      {/* Status */}
      <div style={{
        padding: "10px 18px",
        background: "rgba(25,25,112,0.025)",
        fontSize: "12px",
        color: "rgba(0,0,0,0.6)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
      }}>
        {ko
          ? `현재 ${totalCount - hiddenCount} / ${totalCount} 카드 표시 중 (핵심 카드 제외)`
          : `Showing ${totalCount - hiddenCount} / ${totalCount} cards (essentials excluded)`}
      </div>

      {/* Grouped toggles */}
      {(Object.keys(grouped) as DashboardCardCategory[]).map((cat) => (
        <div key={cat}>
          <div style={{
            padding: "12px 18px 6px",
            fontSize: "10.5px",
            fontWeight: 700,
            color: "rgba(0,0,0,0.42)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
          }}>
            {ko ? CATEGORY_LABEL_KO[cat] : CATEGORY_LABEL_EN[cat]}
          </div>
          {grouped[cat].map((c, idx, arr) => {
            const isVisible = !hiddenCards.includes(c.id);
            const isLast = idx === arr.length - 1;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleHiddenCard(c.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.05)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "rgba(0,0,0,0.86)", letterSpacing: "-0.01em" }}>
                    {ko ? c.labelKo : c.labelEn}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.48)", marginTop: "2px", lineHeight: 1.5 }}>
                    {ko ? c.hintKo : c.hintEn}
                  </div>
                </div>
                {/* iOS-style toggle switch */}
                <div
                  role="switch"
                  aria-checked={isVisible}
                  style={{
                    flexShrink: 0,
                    width: "36px",
                    height: "22px",
                    borderRadius: "999px",
                    background: isVisible ? "#191970" : "rgba(0,0,0,0.16)",
                    position: "relative" as const,
                    transition: "background 0.18s ease",
                  }}
                >
                  <div style={{
                    position: "absolute" as const,
                    top: "2px",
                    left: isVisible ? "16px" : "2px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                    transition: "left 0.18s ease",
                  }} />
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </article>
  );
}
