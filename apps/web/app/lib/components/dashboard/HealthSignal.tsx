"use client";

/**
 * HealthSignal — 사업 건강 신호 공용 컴포넌트
 *
 * 두 가지 형태:
 *  - HealthDot: 인라인 작은 점 (모든 KPI 옆)
 *  - HealthBadge: 운영 대시보드 최상단 한 줄 요약 배지
 *
 * 모든 색상·라벨은 SSOT (`@build-up/shared` unified-health) 에서 가져옴.
 *  → 통합 4단계: healthy / caution / warning / critical (+ unknown)
 */

import {
  HEALTH_COLORS,
  HEALTH_LABEL_KO,
  HEALTH_LABEL_EN,
  type HealthGrade as SharedHealthGrade,
} from "@build-up/shared";

// 호환 type alias — 외부에서 HealthGrade 로 import 하던 코드 보존
export type HealthGrade = Exclude<SharedHealthGrade, "unknown">;
const GRADE_COLOR = HEALTH_COLORS;
const GRADE_LABEL_KO = HEALTH_LABEL_KO;
const GRADE_LABEL_EN = HEALTH_LABEL_EN;

/** 인라인 작은 점 (KPI 옆 — 8px 원형 + 미세 glow) */
export function HealthDot({
  grade,
  size = 8,
  showLabel = false,
  ko = true,
}: {
  grade: HealthGrade;
  size?: number;
  showLabel?: boolean;
  ko?: boolean;
}) {
  const c = GRADE_COLOR[grade];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      verticalAlign: "middle",
    }}>
      <span style={{
        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
        background: c.dot,
        boxShadow: `0 0 ${size * 0.75}px ${c.glow}`,
        flexShrink: 0,
      }} />
      {showLabel && (
        <span style={{
          fontSize: "10.5px", fontWeight: 700, color: c.text,
          letterSpacing: "-0.01em",
        }}>
          {ko ? GRADE_LABEL_KO[grade] : GRADE_LABEL_EN[grade]}
        </span>
      )}
    </span>
  );
}

/**
 * HealthBadge — 운영 대시보드 최상단 한 줄 요약
 *  좌: 큰 dot + 등급 + 점수 / 우: 가장 큰 위험 신호 한 줄
 */
export function HealthBadge({
  grade,
  score,
  topAlertTitle,
  topAlertMessage,
  ko = true,
  onClick,
}: {
  grade: HealthGrade;
  score: number;
  /** 가장 우선 알릴 alert 제목 (예: "재료비 과다") */
  topAlertTitle?: string;
  /** 한 줄 메시지 */
  topAlertMessage?: string;
  ko?: boolean;
  onClick?: () => void;
}) {
  const c = GRADE_COLOR[grade];
  const label = ko ? GRADE_LABEL_KO[grade] : GRADE_LABEL_EN[grade];

  // 동료 톤 카피
  const summaryKo: Record<HealthGrade, string> = {
    healthy: "지금 흐름 좋아요. 이 페이스 유지해 봐요.",
    caution: "한두 가지 살짝 신경 쓸 곳이 보여요.",
    warning: "지금 같이 살펴봐야 할 신호가 있어요.",
    critical: "사장님, 솔직히 말씀드릴게요. 지금이 가장 중요한 순간이에요.",
  };
  const defaultMsg = summaryKo[grade];

  return (
    <button
      type="button"
      onClick={onClick}
      className="health-badge"
      style={{
        background: c.bg,
        border: `0.5px solid ${c.border}`,
      }}
    >
      <style>{HEALTH_BADGE_CSS}</style>
      {/* 좌측 — dot + 등급 + 점수 */}
      <span className="health-badge-left">
        <span className="health-badge-dot-wrap">
          <span
            className="health-badge-dot"
            style={{
              background: c.dot,
              boxShadow: `0 0 14px ${c.glow}, inset 0 0.5px 0 rgba(255,255,255,0.4)`,
            }}
          />
          <span
            className="health-badge-pulse"
            style={{ background: c.glow }}
            aria-hidden
          />
        </span>
        <span className="health-badge-meta">
          <span className="health-badge-grade" style={{ color: c.text }}>{label}</span>
          <span className="health-badge-score">{Math.round(score)}점</span>
        </span>
      </span>

      {/* 가운데 — 메시지 (동료 톤) */}
      <span className="health-badge-msg">
        {topAlertMessage ?? defaultMsg}
        {topAlertTitle && (
          <span className="health-badge-tag" style={{ color: c.text, borderColor: c.border }}>
            {topAlertTitle}
          </span>
        )}
      </span>

      {/* 우측 — 화살표 (클릭 가능 hint) */}
      {onClick && (
        <span className="health-badge-arrow" style={{ color: c.text }}>→</span>
      )}
    </button>
  );
}

const HEALTH_BADGE_CSS = `
@keyframes healthPulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.4); opacity: 0; }
}
.health-badge {
  width: 100%;
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  font-family: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
  letter-spacing: -0.01em;
  transition: transform .18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .18s ease;
  box-shadow: 0 1px 2px rgba(10,25,41,0.03);
}
.health-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(10,25,41,0.08);
}
.health-badge:active { transform: translateY(0); }

.health-badge-left {
  display: flex; align-items: center; gap: 11px;
  flex-shrink: 0;
}
.health-badge-dot-wrap {
  position: relative;
  width: 12px; height: 12px;
  display: inline-flex; align-items: center; justify-content: center;
}
.health-badge-dot {
  position: relative;
  width: 12px; height: 12px; border-radius: 50%;
  z-index: 2;
}
.health-badge-pulse {
  position: absolute; inset: 0;
  border-radius: 50%;
  animation: healthPulse 2s ease-out infinite;
  z-index: 1;
}
.health-badge-meta {
  display: flex; flex-direction: column; gap: 1px;
  line-height: 1.15;
}
.health-badge-grade {
  font-size: 13.5px; font-weight: 700; letter-spacing: -0.02em;
}
.health-badge-score {
  font-size: 10.5px; color: rgba(15,23,42,0.5); font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.health-badge-msg {
  flex: 1;
  font-size: 12.5px; font-weight: 600; color: rgba(15,23,42,0.75);
  line-height: 1.45;
  display: flex; align-items: center; gap: 8px;
  flex-wrap: wrap;
}
.health-badge-tag {
  font-size: 10.5px; font-weight: 700;
  padding: 3px 9px; border-radius: 999px;
  background: rgba(255,255,255,0.5);
  border: 0.5px solid;
  letter-spacing: -0.005em;
}

.health-badge-arrow {
  font-size: 16px; font-weight: 700;
  flex-shrink: 0;
  opacity: 0.6;
  transition: transform .18s ease, opacity .18s ease;
}
.health-badge:hover .health-badge-arrow {
  opacity: 1;
  transform: translateX(2px);
}

@media (max-width: 520px) {
  .health-badge { flex-wrap: wrap; padding: 12px 14px; }
  .health-badge-msg { font-size: 12px; }
}
`;

// ─── 점수 계산 helpers ──────────────────────────────────────────
// SSOT: shared/unified-health 의 gradeKpi / gradeFromScore 를 직접 사용.
// 아래 두 함수는 호환성을 위한 얇은 wrapper.

/**
 * BusinessHealthMetrics 의 healthGrade 4단계를 우리 컴포넌트의 HealthGrade 로 변환
 *  - 동일 키 (healthy/caution/warning/critical) 사용
 */
export function gradeFromMetrics(grade: "healthy" | "caution" | "warning" | "critical"): HealthGrade {
  return grade;
}

/**
 * 단일 KPI 값 → 임계값 비교로 HealthGrade 결정
 *  - 새 코드는 `@build-up/shared`의 `gradeKpi(value, KpiThreshold)` 를 직접 사용 권장.
 *  - 본 wrapper 는 기존 호출부 호환을 위해 남김.
 *  - good ≤ val 이면 healthy (lowerIsBetter 일 때) 식으로 동작.
 */
export function gradeFromThresholds(value: number, thresholds: {
  good: number;
  caution: number;
  critical?: number;
  /** higher 가 true 면 큰 값이 좋음 (예: 런웨이) — 비교 방향 반전 */
  higherIsBetter?: boolean;
}): HealthGrade {
  const { good, caution, critical, higherIsBetter } = thresholds;
  if (higherIsBetter) {
    if (value >= good) return "healthy";
    if (value >= caution) return "caution";
    if (critical !== undefined && value >= critical) return "warning";
    return "critical";
  }
  if (value <= good) return "healthy";
  if (value <= caution) return "caution";
  if (critical !== undefined && value <= critical) return "warning";
  return "critical";
}
