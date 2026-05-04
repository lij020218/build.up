"use client";

/**
 * SuccessCasesShowcase — 모드별 검증된 5개 전설 사례 풀 디스플레이.
 *
 * 모드 (인디·부트스트랩·시드·시리즈A) 별로 SUCCESS_CASES_BY_MODE 데이터를
 * 큰 카드로 보여줌. ModePathCard 안에서도, 사례 전용 페이지에서도 재사용 가능.
 */

import { Trophy, ExternalLink, MapPin, User } from "lucide-react";
import {
  getSuccessCases,
  MODE_DISPLAY_INFO,
  type OperatingMode,
} from "@build-up/shared";

const MIDNIGHT = "#191970";

const HEADLINE_BY_MODE: Record<OperatingMode, { ko: string; en: string }> = {
  indie: {
    ko: "1인 인디의 전설들 — 실리콘밸리·디지털 노마드 검증된 솔로 founders",
    en: "Solo Indie Legends — Verified solo founders worldwide",
  },
  bootstrap: {
    ko: "부트스트랩 전설 — VC 0원으로 IPO·매각까지 간 회사들",
    en: "Bootstrap Legends — Zero-VC companies that reached IPO/acquisition",
  },
  seed: {
    ko: "시드 → 시리즈A 표준 — Notion · Stripe · Cursor · Linear · Figma 의 시작",
    en: "Seed → Series A Standards — How Notion, Stripe, Cursor, Linear, Figma started",
  },
  seriesA: {
    ko: "시리즈A 이후 폭발 — Cursor · Anthropic · Perplexity · Vercel · Notion 의 스케일링",
    en: "Series A → Beyond — Cursor, Anthropic, Perplexity, Vercel, Notion scaling",
  },
};

export type SuccessCasesShowcaseProps = {
  mode: OperatingMode;
  ko?: boolean;
  /** 컴팩트 모드 — ModePathCard 안에서 쓸 때 */
  compact?: boolean;
};

export function SuccessCasesShowcase({ mode, ko = true, compact = false }: SuccessCasesShowcaseProps) {
  const cases = getSuccessCases(mode);
  if (!cases || cases.length === 0) return null;

  const modeLabel = ko ? MODE_DISPLAY_INFO[mode].ko : MODE_DISPLAY_INFO[mode].en;
  const headline = ko ? HEADLINE_BY_MODE[mode].ko : HEADLINE_BY_MODE[mode].en;

  return (
    <div
      style={{
        padding: compact ? "16px 18px" : "24px 26px",
        borderRadius: "16px",
        background: compact ? `${MIDNIGHT}06` : "white",
        border: `1px solid ${compact ? `${MIDNIGHT}1A` : "rgba(0,0,0,0.06)"}`,
        marginTop: compact ? "4px" : 0,
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <Trophy size={compact ? 14 : 16} strokeWidth={2.4} style={{ color: MIDNIGHT }} />
        <div
          style={{
            fontSize: compact ? "11px" : "12px",
            fontWeight: 700,
            color: MIDNIGHT,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          {ko ? `${modeLabel} 전설 사례` : `${modeLabel} Legends`}
        </div>
      </div>
      <div
        style={{
          fontSize: compact ? "13.5px" : "16px",
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: "-0.01em",
          marginBottom: compact ? "12px" : "20px",
          lineHeight: 1.45,
        }}
      >
        {headline}
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: compact ? "10px" : "14px" }}>
        {cases.map((c) => (
          <div
            key={c.id}
            style={{
              padding: compact ? "14px 16px" : "18px 20px",
              borderRadius: "12px",
              background: "white",
              border: `1px solid rgba(0,0,0,0.06)`,
              boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
            }}
          >
            {/* 회사명 + 시작 연도 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const, marginBottom: "6px" }}>
              <div
                style={{
                  fontSize: compact ? "14.5px" : "16px",
                  fontWeight: 700,
                  color: MIDNIGHT,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.3,
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: `${MIDNIGHT}10`,
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: MIDNIGHT,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {c.startYear}~
              </div>
              {c.industry && (
                <div
                  style={{
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.04)",
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "rgba(15,23,42,0.55)",
                  }}
                >
                  {c.industry}
                </div>
              )}
            </div>

            {/* 창업자 + 위치 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" as const, marginBottom: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11.5px",
                  color: "rgba(15,23,42,0.6)",
                  fontWeight: 600,
                }}
              >
                <User size={11} strokeWidth={2.2} />
                {c.founder}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11.5px",
                  color: "rgba(15,23,42,0.5)",
                }}
              >
                <MapPin size={11} strokeWidth={2.2} />
                {c.location}
              </div>
            </div>

            {/* 한 줄 요약 */}
            <div
              style={{
                fontSize: compact ? "12.5px" : "13.5px",
                color: "rgba(15,23,42,0.72)",
                lineHeight: 1.6,
                marginBottom: "10px",
              }}
            >
              {c.tagline}
            </div>

            {/* 메트릭 그리드 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: compact
                  ? "repeat(auto-fit, minmax(120px, 1fr))"
                  : "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "6px",
                marginBottom: "10px",
              }}
            >
              {c.metrics.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: compact ? "8px 10px" : "10px 12px",
                    borderRadius: "8px",
                    background: `${MIDNIGHT}05`,
                    border: `1px solid ${MIDNIGHT}10`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "9.5px",
                      fontWeight: 700,
                      color: "rgba(25,25,112,0.55)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase" as const,
                      marginBottom: "2px",
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: compact ? "12.5px" : "13.5px",
                      fontWeight: 700,
                      color: MIDNIGHT,
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.3,
                    }}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* 교훈 */}
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: `${MIDNIGHT}06`,
                borderLeft: `3px solid ${MIDNIGHT}50`,
                fontSize: "12px",
                color: "rgba(15,23,42,0.78)",
                lineHeight: 1.55,
                marginBottom: "8px",
              }}
            >
              <strong style={{ fontWeight: 700, color: MIDNIGHT }}>
                {ko ? "핵심 교훈:" : "Key lesson:"}
              </strong>{" "}
              {c.lesson}
            </div>

            {/* 출처 */}
            <a
              href={c.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                color: "rgba(15,23,42,0.5)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <ExternalLink size={10} strokeWidth={2.2} />
              {c.sourceLabel}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
