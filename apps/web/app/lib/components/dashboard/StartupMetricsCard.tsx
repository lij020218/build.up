"use client";

import React from "react";
import { RADIUS } from "./operationalStyles";
import { CountUp } from "./animations";

/**
 * @deprecated 2026-05-19 — ConversionFunnelCard (mode="saas") 로 통합.
 *   사장님 결정: SaaS 의 본질 지표는 "전환율 funnel". 월 burn / 팀 / 로드맵 지표는
 *   각각 CashZeroDateCard · TeamCard · StartupHealthSection 으로 이미 분산되어 있음.
 *   파일은 카드 합성 패턴 참고용으로 보존 (다음 정리 PR 에서 삭제 검토).
 *
 * StartupMetricsCard — 스타트업 전용 지표만 표시.
 *
 * 중복 제거 원칙 (25.04.20):
 *   - 런웨이 → SurvivalBoardCard가 단독 소유
 *   - 주간 성장% → SurvivalBoardCard가 단독 소유
 *   - 주간 활성 사용자 → ActivitySnapshot이 고객 수 커버
 *   → 이 카드는 월 burn · 팀 · 로드맵 3지표만 노출.
 */
export function StartupMetricsCard({
  ko,
  monthlyBurn,
  employeesCount,
  roadmapProgress,
  fmt,
}: {
  ko: boolean;
  recent7Customers: number;  // 유지 — 상위 호출부 호환 (미사용)
  activeDays7: number;        // 유지 — 상위 호출부 호환 (미사용)
  weeklySalesChange: number;  // 유지 — 상위 호출부 호환 (미사용)
  monthlyBurn: number;
  runwayMonths: number;       // 유지 — 상위 호출부 호환 (미사용, SurvivalBoard 단독 소유)
  employeesCount: number;
  roadmapProgress: number;
  fmt: (n: number) => string;
}) {
  return (
    <section style={card} className="bento-card">
      <div style={header}>
        <div style={eyebrow}>{ko ? "스타트업 지표" : "Startup metrics"}</div>
        <div style={title}>{ko ? "실행 상태" : "Execution"}</div>
      </div>

      <div style={grid}>
        <div style={block}>
          <div style={label}>{ko ? "월 Burn" : "Monthly burn"}</div>
          <div style={{ ...value, color: monthlyBurn > 0 ? "#b54708" : "#1d3557" }}>
            {monthlyBurn > 0 ? <CountUp to={monthlyBurn} duration={1.0} format={fmt} /> : ko ? "흑자" : "Positive"}
          </div>
          <div style={note}>{ko ? "비용 − 매출" : "Costs − revenue"}</div>
        </div>
        <div style={block}>
          <div style={label}>{ko ? "팀" : "Team"}</div>
          <div style={value}>
            <CountUp to={employeesCount} duration={0.8} format={(n) => Math.round(n).toString()} />{ko ? "명" : ""}
          </div>
          <div style={note}>{ko ? "등록 인력 기준" : "Registered staff"}</div>
        </div>
        <div style={block}>
          <div style={label}>{ko ? "로드맵 실행률" : "Execution"}</div>
          <div style={value}>
            <CountUp to={roadmapProgress} duration={1.0} format={(n) => `${Math.round(n)}%`} />
          </div>
          <div style={note}>{ko ? "현재 경로 완료" : "Current path"}</div>
        </div>
      </div>
    </section>
  );
}

// ─── Styles (RADIUS 토큰 기반) ───────────────────────────────

const card: React.CSSProperties = {
  borderRadius: `${RADIUS.OUTER_CARD}px`,
  padding: "22px",
  background: "var(--surface-strong)",
  border: "1px solid var(--border)",
  boxShadow: "0 1px 2px rgba(17,17,17,0.02)",
  display: "grid",
  gap: "14px",
};

const header: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const title: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  color: "var(--text)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
};

const block: React.CSSProperties = {
  borderRadius: `${RADIUS.INNER_BLOCK}px`,
  padding: "14px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  display: "grid",
  gap: "6px",
};

const label: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

/** MorningBriefing 노스스타 hero(매출/런웨이) 와 chip(번레이트/사용자) 가 메인. 여기는 보조 메트릭이라 격하. */
const value: React.CSSProperties = {
  fontSize: "18px",
  lineHeight: 1.1,
  fontWeight: 700,
  letterSpacing: "-0.025em",
  color: "var(--text)",
  fontVariantNumeric: "tabular-nums",
};

const note: React.CSSProperties = {
  fontSize: "11.5px",
  lineHeight: 1.4,
  color: "var(--muted)",
};
