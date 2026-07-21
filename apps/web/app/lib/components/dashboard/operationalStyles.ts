import type React from "react";

/**
 * ───────────────────────────────────────────────────────────────
 * 디자인 토큰 — 운영 대시보드 및 전체 surface 공통 기준.
 *
 * 색상 팔레트 (2026 CEO-grade 운영 대시보드 톤):
 *   MIDNIGHT      = #191970  — 메인 액센트 (로드맵과 통일)
 *   MIDNIGHT_DEEP = #0f0f4a  — 헤드라인 + 핵심 숫자
 *   MIDNIGHT_INK  = #1d3557  — 호환용 primary (--primary)
 *   SUCCESS       = #1d3557  — 미드나잇 잉크 (수익·성장). 신호등 금지 — good=네이비
 *   WARN          = #191970  — 미드나잇 (주의). 신호등 금지 — 황색 아님
 *   DANGER        = #b64c4c  — 벽돌 (위험). 유일하게 색을 쓰는 상태
 *   INK           = #0f172a  — 본문 텍스트
 *   MUTED         = rgba(15,23,42,0.55)
 *
 * Radius 계층 (Apple HIG + Mercury/Stripe 참조):
 *   OUTER_CARD  = 20px  — 화면 최상위 카드 (MorningBriefing, Activity, Survival 등)
 *   INNER_BLOCK = 14px  — 카드 안에 들어가는 서브 블록 (KPI 미니카드, 알림 박스)
 *   INPUT       = 10px  — 인풋·버튼
 *   PILL        = 999px — 둥근 pill 버튼·배지
 *   BADGE       = 8px   — 작은 라벨·칩
 *   TINY        = 3px   — 진행바, hairline 인디케이터
 *   MODAL       = 24px  — 모달·오버레이 (예외적으로 좀 더 큼)
 *
 * 모든 신규 컴포넌트는 이 상수를 import 해서 사용.
 * 기존 inline radius는 점진 교체.
 * ───────────────────────────────────────────────────────────────
 */
export const PALETTE = {
  MIDNIGHT: "#191970",
  MIDNIGHT_DEEP: "#0f0f4a",
  MIDNIGHT_INK: "#1d3557",
  MIDNIGHT_8: "rgba(25,25,112,0.08)",
  MIDNIGHT_12: "rgba(25,25,112,0.12)",
  MIDNIGHT_18: "rgba(25,25,112,0.18)",
  SUCCESS: "#1d3557",
  SUCCESS_8: "rgba(29,53,87,0.08)",
  WARN: "#191970",
  WARN_8: "rgba(25,25,112,0.08)",
  DANGER: "#b64c4c",
  DANGER_8: "rgba(182,76,76,0.08)",
  INK: "#0f172a",
  MUTED: "rgba(15,23,42,0.55)",
  MUTED_45: "rgba(15,23,42,0.45)",
  MUTED_30: "rgba(15,23,42,0.30)",
  HAIRLINE: "rgba(0,0,0,0.06)",
  SURFACE: "#ffffff",
  SURFACE_TINT: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(243,244,253,0.45) 100%)",
} as const;

/** Motion 곡선 — 거장 리서치 기반 (Linear / Stripe / Apple HIG 2026) */
export const MOTION = {
  // Apple stock easing — Linear/Stripe 2025+ 표준
  EASE_SMOOTH: [0.32, 0.72, 0, 1] as const,
  // Material standard — UI swift transitions
  EASE_SWIFT: [0.4, 0, 0.2, 1] as const,
  // iOS spring 근사 — 입장 emphasized
  EASE_IOS: [0.16, 1, 0.3, 1] as const,
  // 일반 fade·scale
  EASE_OUT: [0.22, 1, 0.36, 1] as const,
  EASE_IN: [0.4, 0, 1, 1] as const,
  DURATION: {
    instant: 0.12,
    fast: 0.18,        // hover, micro
    base: 0.28,        // 카드 entrance, fade
    deliberate: 0.42,  // 중요 변화
    cinematic: 0.65,   // hero 입장
  },
  STAGGER: {
    tight: 0.04,
    normal: 0.06,      // 거장 권장 — Apple HIG, max 20 children
    wide: 0.12,
  },
} as const;

/** 차트 컬러 스케일 — 카테고리별 일관 적용 */
export const CHART_COLORS = {
  primary: PALETTE.MIDNIGHT,
  primarySoft: "rgba(25,25,112,0.6)",
  primaryGhost: "rgba(25,25,112,0.18)",
  success: PALETTE.SUCCESS,
  warn: PALETTE.WARN,
  danger: PALETTE.DANGER,
  // 다중 카테고리 막대/도넛용 — 명도 단계
  series: ["#191970", "#3636A8", "#5B5BC4", "#8585D8", "#B5B5E8", "#D8D8F0"],
  // 그라디언트 (그래프 fill용)
  gradients: {
    primary: { from: "rgba(25,25,112,0.32)", to: "rgba(25,25,112,0)" },
    success: { from: "rgba(29,53,87,0.28)", to: "rgba(29,53,87,0)" },
    danger: { from: "rgba(182,76,76,0.24)", to: "rgba(182,76,76,0)" },
  },
} as const;

export const RADIUS = {
  OUTER_CARD: 20,
  INNER_BLOCK: 14,
  INPUT: 10,
  PILL: 9999,
  BADGE: 8,
  TINY: 3,
  MODAL: 24,
} as const;

export const shell: React.CSSProperties = {
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "var(--dash-gap, 18px)",
  fontFamily:
    '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export const heroPanel: React.CSSProperties = {
  borderRadius: "20px",
  padding: "var(--dash-card-pad, 24px)",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "20px",
  transition: "box-shadow 0.3s ease, transform 0.3s ease",
};

export const heroHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "16px",
  flexWrap: "wrap",
};

export const heroEyebrow: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "6px",
};

export const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 40px)",
  lineHeight: 1.08,
  letterSpacing: "-0.025em",
  fontWeight: 600,
  color: "#1d1d1f",
};

export const heroBody: React.CSSProperties = {
  margin: "10px 0 0",
  maxWidth: "64ch",
  fontSize: "15px",
  lineHeight: 1.65,
  color: "rgba(15, 23, 42, 0.62)",
};

export const heroActions: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

/**
 * 운영 대시보드 메인 CTA 그라데이션 — 사용자 선호 톤 (2026-05-11).
 *  사장님: "정책자금 카드의 '신청 페이지 열기' 버튼 색이 마음에 든다. 다른 곳에도 더 써달라."
 *  → 깊은 미드나이트 → 슬레이트 네이비. 단색 #191970 보다 입체감·고급감.
 */
export const PRIMARY_BUTTON_GRADIENT = "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)";
export const PRIMARY_BUTTON_SHADOW = "0 2px 8px rgba(30,42,85,0.18)";
export const PRIMARY_BUTTON_SHADOW_HOVER = "0 4px 14px rgba(30,42,85,0.28)";

export const primaryAction: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  background: PRIMARY_BUTTON_GRADIENT,
  color: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: PRIMARY_BUTTON_SHADOW,
  letterSpacing: "-0.01em",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

/**
 * 작은 사이즈 primary CTA — 카드 안 인라인 버튼.
 *  예: "신청 페이지 열기" · "기록" · "더 보기" · "재계산" 등.
 *  같은 그라데이션, 더 컴팩트 padding + 작은 폰트.
 */
export const primaryActionSmall: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  border: "none",
  borderRadius: "10px",
  padding: "8px 14px",
  background: PRIMARY_BUTTON_GRADIENT,
  color: "#fff",
  fontSize: "12.5px",
  fontWeight: 650,
  cursor: "pointer",
  boxShadow: PRIMARY_BUTTON_SHADOW,
  letterSpacing: "-0.01em",
  textDecoration: "none",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
  fontFamily: "inherit",
};

export const secondaryAction: React.CSSProperties = {
  border: "1px solid rgba(25,25,112,0.14)",
  borderRadius: "12px",
  padding: "12px 18px",
  background: "#ffffff",
  color: "#191970",
  fontSize: "14px",
  fontWeight: 650,
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(25,25,112,0.03)",
  letterSpacing: "-0.005em",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

export const headlineGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

export const headlineCard: React.CSSProperties = {
  borderRadius: "16px",
  padding: "var(--dash-card-pad, 20px)",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
  transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease",
  cursor: "default",
};

export const headlineLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "8px",
};

export const headlineValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 780,
  letterSpacing: "-0.045em",
  lineHeight: 1.05,
  fontVariantNumeric: "tabular-nums",
};

export const headlineNote: React.CSSProperties = {
  marginTop: "8px",
  fontSize: "12px",
  lineHeight: 1.5,
  color: "rgba(15, 23, 42, 0.52)",
};

export const coreGrid: React.CSSProperties = {
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "16px",
  alignItems: "stretch",
};

export const survivalGrid: React.CSSProperties = {
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "16px",
  alignItems: "stretch",
};

export const opsCard: React.CSSProperties = {
  borderRadius: "20px",
  padding: "var(--dash-card-pad, 22px)",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "14px",
};

export const opsHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

export const sectionEyebrow: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#191970",
  opacity: 0.7,
  marginBottom: "6px",
};

export const emptyState: React.CSSProperties = {
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(25,25,112,0.03)",
  border: "1px dashed rgba(25,25,112,0.16)",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "rgba(25,25,112,0.55)",
  fontWeight: 500,
};

export const detailSection: React.CSSProperties = {
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "12px",
};

export const detailSectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

export const detailSectionTitle: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: 1.3,
  fontWeight: 720,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

/* ── ActivitySnapshotCard styles ── */

export const activityCard: React.CSSProperties = {
  borderRadius: "20px",
  padding: "22px",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "18px",
};

export const activityHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

export const activityTitle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  color: "#0f172a",
};

export const activityStatRail: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

export const activityMiniStat: React.CSSProperties = {
  minWidth: "124px",
  borderRadius: "12px",
  padding: "12px 14px",
  background: "rgba(25,25,112,0.03)",
  border: "1px solid rgba(25,25,112,0.06)",
};

export const activityMiniLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--muted)",
  marginBottom: "6px",
};

export const activityMiniValue: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  letterSpacing: "-0.05em",
  color: "#0f172a",
  lineHeight: 1,
};

export const activityChartWrap: React.CSSProperties = {
  height: "138px",
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "10px",
  alignItems: "end",
  padding: "8px 2px 0",
};

export const activityBarCol: React.CSSProperties = {
  display: "grid",
  // 단일 컬럼 명시 — 생략(암시적 auto) 시 컬럼이 자식의 max-content 를 따라가
  //   카드가 컨테이너보다 넓어진다(grid blowout). 좁은 폰에서 우측 잘림의 원인. (2026-07-15)
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "8px",
};

export const activityBarTrack: React.CSSProperties = {
  width: "100%",
  height: "110px",
  display: "flex",
  alignItems: "flex-end",
  padding: "0 4px",
};

export const activityBarFill: React.CSSProperties = {
  width: "100%",
  borderRadius: "14px",
  minHeight: "4px",
  transition: "height 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
};

export const activityBarLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
};

/* ── Bento micro-interaction: inject global hover styles once ── */
export const bentoHoverCSS = `
/* ── 정보 밀도 그리드 (2026-07-21 사장님 지시: "한 화면에 카드 여러 장") ──
   넓은 화면에서 카드를 2열/3열로 배치해 첫 화면 밀도를 높인다. 좁으면 1열.
   ⚠️ 뷰포트 media query 금지 — 홈은 좌측 사이드바(200px) *옆*에 렌더라 창 기준으로
   판정하면 보통 창 폭에서 1열로 남는다(같은 날 1차 구현의 결함). 대시보드 셸
   (.dash-shell, container-type: inline-size)의 *콘텐츠 폭* 기준 @container 로 판정.
   내부에서 null 을 반환하는 카드(정책자금 self-hide, 메뉴 수익성 입력 전 등)의
   빈 래퍼는 :empty 로 grid 흐름에서 제거. */
.dash-shell { container-type: inline-size; }
.dash-2col { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; align-items: stretch; }
.dash-3col { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: stretch; }
.dash-2col > *:empty, .dash-3col > *:empty { display: none; }
@container (min-width: 860px) {
  .dash-2col { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dash-3col { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@keyframes bentoFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bentoPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
@keyframes bentoProgress { from { width: 0; } }
@keyframes bentoBarGrow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
@keyframes bentoBarPulse { 0% { opacity: 0.7; transform: scaleY(0.95); } 50% { opacity: 1; transform: scaleY(1.02); } 100% { opacity: 1; transform: scaleY(1); } }
@keyframes bentoCountUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bentoGlow { 0%, 100% { box-shadow: 0 0 0 rgba(29,53,87,0); } 50% { box-shadow: 0 0 12px rgba(29,53,87,0.08); } }

/* ── Dashboard entry animations (Phase 1+2+3, refined Apple/Mercury 톤) ── */

/* Apple iOS spring 감각 — translateY + scale + blur 3중 계층 */
@keyframes dashStaggerIn {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
    filter: blur(2px);
  }
  60% {
    filter: blur(0);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* dashSurfaceEnter 제거됨 (2026-05-13) — surface 전환 즉시 표시 */

@keyframes dashBarGrow {
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}
@keyframes dashProgressFill {
  from { transform: scaleX(0); }
  to { transform: scaleX(var(--target-scale, 1)); }
}
@keyframes dashPathDraw {
  from { stroke-dashoffset: var(--path-len, 1000); }
  to { stroke-dashoffset: 0; }
}

.dash-stagger-item {
  /* 0.65s + Apple iOS spring approximation easing */
  animation: dashStaggerIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: transform, opacity, filter;
}
/* 자식 컴포넌트가 null 반환하여 비어있는 wrapper는 grid gap 차지 안 하도록 숨김 */
.dash-stagger-item:empty { display: none !important; }

/* .dash-surface-enter 제거됨 (2026-05-13) — surface 전환 즉시 표시 */

.dash-bar-grow {
  transform-origin: bottom center;
  will-change: transform;
  animation: dashBarGrow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.dash-progress-fill {
  transform-origin: left center;
  will-change: transform;
  animation: dashProgressFill 0.95s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.dash-path-draw {
  stroke-dasharray: var(--path-len, 1000);
  stroke-dashoffset: var(--path-len, 1000);
  animation: dashPathDraw 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  /* 접근성 ON 시에도 fade는 유지하되 transform은 줄임 */
  .dash-stagger-item, .dash-bar-grow, .dash-progress-fill, .dash-path-draw {
    animation-duration: 0.2s !important;
  }
}

.bento-card { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease !important; }
.bento-card:hover { transform: translateY(-2px) !important; box-shadow: 0 21px 94px rgba(0,0,0,0.06) !important; }
.bento-headline { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease !important; }
.bento-headline:hover { transform: translateY(-1px) !important; box-shadow: 0 21px 94px rgba(0,0,0,0.04) !important; }
.bento-btn { transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease !important; }
.bento-btn:active { transform: scale(0.97) !important; }
.bento-meter-fill { animation: bentoProgress 0.8s cubic-bezier(0.22, 1, 0.36, 1) !important; }
.bento-fade-in { animation: bentoFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both !important; }
.bento-number { animation: bentoCountUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; font-variant-numeric: tabular-nums; }
`;
