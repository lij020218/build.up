"use client";

import React, { useMemo, useState } from "react";
import { RADIUS } from "./operationalStyles";
import { useStartupMetrics } from "../../hooks/useStartupMetrics";
import { useFinanceStore, useOperationsStore } from "../../stores";
import type { MetricCard, StartupMetricHealth } from "@build-up/shared";

/**
 * StartupHealthSection — 스타트업 전용 핵심 지표 패널.
 *
 * **렌더 분기**: industryCategoryId 가 startup/tech/saas 계열일 때만 노출.
 *   - 외식·서비스·온라인 셀러 등 소상공인 업종은 NULL 반환.
 *   - 이유: 이 카드의 지표(Burn Multiple, Runway, Default Alive, Magic Number,
 *     Rule of 40)는 VC-funded SaaS/tech 스타트업의 어휘. 한식집·카페 사장님께
 *     "Default Alive / Paul Graham (2015)" 같은 표현은 의미·맥락이 어긋남.
 *   - 소상공인용 상태 점검은 DailyOpsRitualCard, DailyImprovementCard,
 *     이번 주 점검(DeepDiveSection) 이 이미 그 역할을 함.
 *
 * 페이지 디자인 철학에 정렬:
 *  - 카드 = 순백 + hairline + ambient shadow (lavender-mist 페이지 위에 띄움)
 *  - 액센트 = 미드나잇 네이비-보라 (#1E2A55) — Build.UP 시그니처
 *  - 큰 숫자는 미드나잇 통일, 톤 색은 status pill 에만 (시각 피로 방지)
 */

// ─── Brand palette (페이지 스크린샷 기반) ────────────────────────────
const MIDNIGHT = "#1E2A55";          // 시그니처 네이비-보라 (버튼·강조)
const MIDNIGHT_DEEP = "#141C3D";     // 큰 숫자·헤딩
const MIDNIGHT_SOFT = "#5A6BAE";     // eyebrow·muted text
const TEXT_BODY = "#1A1F36";         // body
const TEXT_MUTED = "#6B7393";        // benchmark·미세 캡션
const SURFACE_CARD = "#FFFFFF";
const SURFACE_LAVENDER = "#F4F5FB";  // 차분한 강조 박스
const HAIRLINE = "rgba(30,42,85,0.08)";
const HAIRLINE_HOVER = "rgba(30,42,85,0.16)";

type Tone = {
  pillBg: string;
  pillText: string;
  dot: string;
  label: string;
};

const TONE: Record<StartupMetricHealth | "unknown", Tone> = {
  healthy: {
    pillBg: "#EEF1FA",
    pillText: "#1E2A55",
    dot: "#3B5BBF",
    label: "좋아요",
  },
  warning: {
    // 페이지 어디에도 진한 경고색이 없음 → cream amber 톤 (정보성 highlight 와 동질감)
    pillBg: "#FFF6E5",
    pillText: "#8A5B11",
    dot: "#D69121",
    label: "살펴보세요",
  },
  critical: {
    pillBg: "#FCEEF1",
    pillText: "#8E1E33",
    dot: "#B42E47",
    label: "지금 챙기세요",
  },
  unknown: {
    pillBg: "#F1F2F7",
    pillText: "#5A6BAE",
    dot: "#A8AECB",
    label: "데이터 모으는 중",
  },
};

const TREND_GLYPH: Record<MetricCard["trend"], string> = {
  up: "↗",
  down: "↘",
  stable: "→",
};

export function StartupHealthSection({ ko = true }: { ko?: boolean }) {
  const { cards, actions, notReadyReason, industry } = useStartupMetrics();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  // 2026-05-12 ARR per Employee — 실리콘밸리 2026 새 표준 (SaaStr "$500K = 새 $200K").
  //   30+ 자료 (High Alpha·ICONIQ State of GTM 2026·SaaStr·Lean AI Leaderboard) 합의:
  //   린팀 = 시리즈 A/B fundraise signal. Cursor $3.3M/FTE, Lovable $2M/FTE 표준화.
  //   별도 카드 추가 X (인지 부하 고려) — 기존 5칸 grid 에 6번째 셀 흡수.
  const dailyEntries = useFinanceStore((s) => s.dailyEntries);
  const employees = useOperationsStore((s) => s.employees);
  const arrPerEmployeeCell = useMemo(() => {
    if (industry !== "saas") return null;
    // ARR proxy: 최근 30일 매출 × 12. 정확한 ARR (구독 MRR) 가 있으면 더 정확하나
    // build.up 은 매출 단일 trackER — 보수적 proxy 가 합리적.
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 86400000);
    const last30Sales = (dailyEntries ?? [])
      .filter((e) => new Date(e.date) >= cutoff)
      .reduce((s, e) => s + (e.sales ?? 0), 0);
    const arrKrw = last30Sales * 12;
    const fteCount = (employees?.length ?? 0) + 1; // 사장님 포함
    if (arrKrw <= 0 || fteCount <= 0) return null;
    const arrPerFte = arrKrw / fteCount;
    // 환산: ₩ → 만원 표시. 한국 시리즈 A baseline ~3억/FTE, elite 10억+ (Cursor·Lovable급).
    const arrPerFteManwon = Math.round(arrPerFte / 10000);
    // Health 임계 (한국 시리즈 A·B 환산):
    //   < 1억 (10,000만) → critical
    //   1-3억 → warning
    //   3억+ → healthy
    const health: StartupMetricHealth =
      arrPerFteManwon < 10_000 ? "critical"
        : arrPerFteManwon < 30_000 ? "warning"
          : "healthy";
    const formatted =
      arrPerFteManwon >= 10_000
        ? `${(arrPerFteManwon / 10_000).toFixed(1)}억/명`
        : `${arrPerFteManwon.toLocaleString()}만/명`;
    return {
      key: "arrPerEmployee",
      name: ko ? "1인당 ARR (린팀 효율)" : "ARR per FTE",
      formatted,
      health,
      benchmark: ko
        ? `SaaStr "$500K=새 $200K" · Cursor $3.3M·Lovable $2M (FTE 포함 사장님)`
        : `SaaStr 2026: $500K is new $200K`,
      trend: "stable" as const,
      fteCount,
    };
  }, [industry, dailyEntries, employees, ko]);

  // ── 렌더 분기: 스타트업/SaaS/tech 계열만 ───────────────────────────────
  // industry === "saas" 는 industryCategoryId 가 "startup"|"tech"|"saas"
  // 부분문자열을 포함할 때만 매핑됨 (useStartupMetrics::inferMetricIndustry).
  // 한식집·카페·뷰티 등은 "restaurant" / "service" / "general" 로 매핑되어
  // 이 카드를 보지 않음 → 다른 SMB 카드(DailyOpsRitualCard 등) 가 그 자리.
  if (industry !== "saas") return null;
  if (cards.length === 0) return null;

  const actionsByKey = new Map(actions.map((a) => [a.metricKey, a]));

  return (
    <section style={section} className="bento-card">
      <header style={header}>
        <div style={eyebrow}>{ko ? "오늘의 우리 가게" : "Today's snapshot"}</div>
        <div style={title}>{ko ? "지금 살펴봐야 할 것" : "What to check now"}</div>
      </header>

      {notReadyReason && (
        <div style={notReady}>
          {ko ? notReadyReason : "Add more sales data to unlock metrics"}
        </div>
      )}

      <div style={grid}>
        {/* 2026-05-12: ARR per Employee 셀 (실리콘밸리 SaaStr "$500K=새 $200K") —
            기존 5칸 + 추가 1칸 = 6칸. 별도 카드 X (인지 부하 고려). */}
        {arrPerEmployeeCell && (() => {
          const c = arrPerEmployeeCell;
          const tone = TONE[c.health];
          return (
            <div
              key={c.key}
              style={{
                ...metricCard,
                borderColor: HAIRLINE,
                cursor: "default",
              }}
            >
              <div style={cardHead}>
                <span style={cardLabel}>{c.name}</span>
              </div>
              <div style={cardValue}>{c.formatted}</div>
              <div style={cardFooter}>
                <span style={{ ...statusPill, background: tone.pillBg, color: tone.pillText }}>
                  <span style={{ ...dot, background: tone.dot }} />
                  {tone.label}
                </span>
                <span style={cardBenchmark}>{c.benchmark}</span>
              </div>
            </div>
          );
        })()}
        {cards.slice(0, 5).map((card) => {
          const tone = TONE[card.health];
          const isOpen = expandedKey === card.key;
          const isHover = hoverKey === card.key;
          const action = actionsByKey.get(card.key);
          return (
            <button
              key={card.key}
              onClick={() => setExpandedKey(isOpen ? null : card.key)}
              onMouseEnter={() => setHoverKey(card.key)}
              onMouseLeave={() => setHoverKey(null)}
              style={{
                ...metricCard,
                borderColor: isOpen || isHover ? HAIRLINE_HOVER : HAIRLINE,
                transform: isHover && !isOpen ? "translateY(-1px)" : "translateY(0)",
                boxShadow: isHover || isOpen
                  ? "0 6px 22px rgba(30,42,85,0.07), 0 1px 2px rgba(30,42,85,0.04)"
                  : "0 1px 2px rgba(30,42,85,0.03)",
              }}
              aria-expanded={isOpen}
            >
              <div style={cardHead}>
                <span style={cardLabel}>{card.name}</span>
                <span style={trendGlyph} aria-hidden>{TREND_GLYPH[card.trend]}</span>
              </div>

              <div style={cardValue}>{card.formatted}</div>

              <div style={cardFooter}>
                <span style={{ ...statusPill, background: tone.pillBg, color: tone.pillText }}>
                  <span style={{ ...dot, background: tone.dot }} />
                  {tone.label}
                </span>
                <span style={cardBenchmark}>{card.benchmark}</span>
              </div>

              {isOpen && action && (
                <div style={detailBlock} onClick={(e) => e.stopPropagation()}>
                  <div style={detailHeadline}>{action.headline}</div>
                  <div style={detailAction}>{action.action}</div>
                  <div style={detailRationale}>{action.rationale}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 가장 위험한 1순위 — 무조건 표시 */}
      {actions[0] && actions[0].health !== "healthy" && (
        <div style={topAlert}>
          <span style={{ ...dot, background: TONE[actions[0].health].dot, marginTop: "6px" }} />
          <div style={{ display: "grid", gap: "3px", flex: 1, minWidth: 0 }}>
            <div style={topAlertEyebrow}>먼저 챙겨야 할 것</div>
            <div style={topAlertHead}>{actions[0].headline}</div>
            <div style={topAlertBody}>{actions[0].action}</div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const section: React.CSSProperties = {
  borderRadius: `${RADIUS.OUTER_CARD}px`,
  padding: "24px",
  background: SURFACE_CARD,
  border: `1px solid ${HAIRLINE}`,
  boxShadow: "0 1px 2px rgba(30,42,85,0.03), 0 8px 28px rgba(30,42,85,0.04)",
  display: "grid",
  gap: "16px",
};

const header: React.CSSProperties = { display: "grid", gap: "4px" };

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: MIDNIGHT_SOFT,
};

const title: React.CSSProperties = {
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  color: MIDNIGHT_DEEP,
};

const notReady: React.CSSProperties = {
  fontSize: "11.5px",
  color: MIDNIGHT_SOFT,
  padding: "10px 12px",
  borderRadius: `${RADIUS.BADGE}px`,
  background: SURFACE_LAVENDER,
  border: `1px dashed ${HAIRLINE_HOVER}`,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
};

const metricCard: React.CSSProperties = {
  borderRadius: `${RADIUS.INNER_BLOCK}px`,
  padding: "16px",
  background: SURFACE_CARD,
  border: "1px solid",
  display: "grid",
  gap: "11px",
  textAlign: "left",
  cursor: "pointer",
  transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
  font: "inherit",
  appearance: "none",
};

const cardHead: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const cardLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: MIDNIGHT_SOFT,
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const trendGlyph: React.CSSProperties = {
  fontSize: "12px",
  color: MIDNIGHT_SOFT,
  fontWeight: 600,
  opacity: 0.55,
};

const cardValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  letterSpacing: "-0.035em",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.05,
  color: MIDNIGHT_DEEP,
};

const cardFooter: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "flex-start",
};

const statusPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "3px 9px",
  borderRadius: "999px",
  fontSize: "10.5px",
  fontWeight: 600,
  letterSpacing: "0.01em",
  lineHeight: 1.4,
};

const cardBenchmark: React.CSSProperties = {
  fontSize: "11px",
  color: TEXT_MUTED,
  lineHeight: 1.4,
};

const detailBlock: React.CSSProperties = {
  marginTop: "4px",
  paddingTop: "12px",
  borderTop: `1px solid ${HAIRLINE}`,
  display: "grid",
  gap: "5px",
};

const detailHeadline: React.CSSProperties = {
  fontSize: "12.5px",
  fontWeight: 700,
  color: MIDNIGHT_DEEP,
  letterSpacing: "-0.01em",
};

const detailAction: React.CSSProperties = {
  fontSize: "12px",
  color: TEXT_BODY,
  lineHeight: 1.5,
};

const detailRationale: React.CSSProperties = {
  fontSize: "10.5px",
  color: TEXT_MUTED,
  lineHeight: 1.45,
};

const dot: React.CSSProperties = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  flexShrink: 0,
  display: "inline-block",
};

const topAlert: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "14px 16px",
  borderRadius: `${RADIUS.INNER_BLOCK}px`,
  background: SURFACE_LAVENDER,
  border: `1px solid ${HAIRLINE}`,
};

const topAlertEyebrow: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: MIDNIGHT_SOFT,
};

const topAlertHead: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: MIDNIGHT_DEEP,
  letterSpacing: "-0.01em",
};

const topAlertBody: React.CSSProperties = {
  fontSize: "11.5px",
  color: TEXT_BODY,
  lineHeight: 1.5,
};
