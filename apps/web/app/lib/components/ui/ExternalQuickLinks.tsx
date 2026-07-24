"use client";

/**
 * ExternalQuickLinks — 외부 공식 사이트 바로가기 카드 (2026-07-24 사장님 지시).
 *
 *  세금(홈택스)·직원(구인구직) 등 "여기서 하는 일의 다음 행동"이 외부 공식 사이트일 때,
 *  일관된 pill 링크 줄로 안내한다. Build.UP 토큰(미드나잇 액센트·미니멀·타이포 중심).
 *
 *  URL 정책: 공식 자사 도메인만(프랜차이즈 URL 정책과 동일). primary 1개 = 채움 버튼,
 *  나머지 = 아웃라인 pill. badge 는 "정부·무료" 같은 짧은 보조 표기.
 */

import { ExternalLink } from "lucide-react";

const MIDNIGHT = "#191970";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

export type QuickLink = {
  label: string;
  url: string;
  /** true 면 미드나잇 채움(대표 링크 1개 권장) */
  primary?: boolean;
  /** "정부·무료" 등 4자 내외 보조 배지 */
  badge?: string;
};

type Props = {
  title: string;
  caption?: string;
  links: QuickLink[];
};

export function ExternalQuickLinks({ title, caption, links }: Props) {
  return (
    <div style={{
      background: "white", borderRadius: 16, border: "1px solid rgba(25,25,112,0.10)",
      boxShadow: "0 1px 3px rgba(25,25,112,0.04)", padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 750, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {title}
        </div>
        {caption && (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{caption}</div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            style={l.primary ? {
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 12, background: MIDNIGHT, color: "white",
              fontSize: 13.5, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 2px 8px rgba(25,25,112,0.22)",
            } : {
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 12,
              border: "1px solid rgba(25,25,112,0.16)", background: "rgba(25,25,112,0.03)",
              color: INK, fontSize: 13, fontWeight: 650, textDecoration: "none",
            }}
          >
            {l.label}
            {l.badge && (
              <span style={{
                fontSize: 9.5, fontWeight: 750, padding: "1px 6px", borderRadius: 8,
                background: l.primary ? "rgba(255,255,255,0.18)" : "rgba(25,25,112,0.08)",
                color: l.primary ? "white" : MIDNIGHT,
              }}>{l.badge}</span>
            )}
            <ExternalLink size={12} strokeWidth={2.2} style={{ opacity: 0.75 }} />
          </a>
        ))}
      </div>
    </div>
  );
}
