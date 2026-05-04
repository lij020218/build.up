"use client";

/**
 * Sticky 좌측 TOC — 섹션 anchor 점프.
 * 페이지 우측에 메인 컨텐츠, 좌측에 TOC.
 */

import { PALETTE } from "./styles";

type Props = {
  items: Array<{ id: string; label: string }>;
  ko: boolean;
};

export function StickyTOC({ items, ko }: Props) {
  return (
    <nav
      aria-label={ko ? "내 가게 섹션 목차" : "My Store TOC"}
      style={{
        position: "sticky" as const,
        top: 16,
        alignSelf: "flex-start" as const,
        width: 200,
        flexShrink: 0,
        padding: "16px 12px",
        borderRadius: 14,
        background: "white",
        border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
        boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
        display: "flex",
        flexDirection: "column" as const,
        gap: 2,
      }}
    >
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: PALETTE.MIDNIGHT,
        opacity: 0.55,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        padding: "4px 10px 8px",
      }}>
        {ko ? "섹션" : "Sections"}
      </div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: PALETTE.MIDNIGHT_DEEP,
            padding: "7px 10px",
            borderRadius: 8,
            textDecoration: "none",
            transition: "background 0.15s ease",
            letterSpacing: "-0.005em",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = PALETTE.MIDNIGHT_8; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
