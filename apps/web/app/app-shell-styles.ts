/**
 * app-shell-styles.ts
 *
 * StarterStageDemo (앱 메인 셸) 의 레이아웃 스타일 상수.
 * 운영 모드(사이드바 유무)에 따른 Shell 너비·패딩을 관리합니다.
 *
 * ─ operationalShell            : 사이드바 없는 모드 (온보딩 / 스타터 화면)
 * ─ operationalShellSidebar     : 사이드바 열림 (200px)
 * ─ operationalShellSidebarCollapsed : 사이드바 접힘 (60px)
 * ─ operationalNavSection       : 상단 nav 영역 여백
 * ─ operationalSurfaceNav       : nav pill 최대 너비 (사이드바 폭 제외)
 */

export const operationalShell: React.CSSProperties = {
  width: "min(1440px, calc(100vw - 32px))",
  margin: "0 auto",
  padding: "92px 16px 80px",
};

/** 홈 + 운영 중 — 좌측 사이드바 폭만큼 좌측 패딩 추가 (좁은 화면에선 사이드바 숨김 → CSS) */
export const operationalShellSidebar: React.CSSProperties = {
  width: "min(1440px, calc(100vw - 32px))",
  margin: "0 auto",
  padding: "32px 16px 80px 220px", // 사이드바 200px + 여백 20px
};

/** 사이드바 collapsed (60px) 일 때 — 좌측 padding 80px (60 + 20 여백) */
export const operationalShellSidebarCollapsed: React.CSSProperties = {
  width: "min(1440px, calc(100vw - 32px))",
  margin: "0 auto",
  padding: "32px 16px 80px 80px",
};

export const operationalNavSection: React.CSSProperties = {
  marginTop: "0",
  marginBottom: "32px",
};

/**
 * nav pill 최대 너비.
 * ⚠️ 이 스타일은 isHomeOperational (사이드바가 존재하는) 레이아웃에서만 적용할 것.
 *    사이드바가 없을 때 적용하면 nav가 불필요하게 좁아짐.
 */
export const operationalSurfaceNav: React.CSSProperties = {
  maxWidth: "calc(100% - 220px)",
};
