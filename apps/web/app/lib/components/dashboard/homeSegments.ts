/**
 * homeSegments — 운영 대시보드(홈) 세그먼트 SSOT (2026-08-19 IA).
 *
 *  iOS TodayView.HomeSegment 와 동일 3탭: 오늘 · 운영 · 더보기.
 *  홈이 탭으로 나뉘면서 "다른 탭에 있는 카드로 스크롤" 요청(히어로 CTA·구독 플랜 → DeepDive 등)이
 *  DOM 에 없어 무반응이 되는 문제를 막기 위해, 카드 selector / DeepDive id → 세그먼트 매핑과
 *  포커스 요청 이벤트를 여기 한 곳에 둔다. OperationalDashboard 가 구독해 탭 전환 + 스크롤한다.
 */

export type HomeSegment = "today" | "ops" | "more";

export const HOME_SEGMENTS: Array<{ key: HomeSegment; label: string }> = [
  { key: "today", label: "오늘" },
  { key: "ops", label: "운영" },
  { key: "more", label: "더보기" },
];

/** DeepDive id → 그 섹션이 사는 세그먼트 (buildup:open-deepdive 이벤트 → 탭 자동 전환) */
export const DEEPDIVE_SEGMENT: Record<string, HomeSegment> = {
  "ops-mgmt": "ops",
  "weekly-pulse": "more",
  "growth-tools": "more",
  "forecast-tools": "more",
};

/** 카드 data-selector → 세그먼트 (히어로 CTA focusBySelector 폴백) */
export const SELECTOR_SEGMENT: Record<string, HomeSegment> = {
  "[data-sales-input]": "today",
  "[data-user-activity]": "today",
  "[data-cashflow-hero]": "today",
  "[data-pl-hero]": "today",
  "[data-inventory-card]": "ops",
  "[data-team-card]": "ops",
  "[data-ops-rituals]": "ops",
  "[data-cost-structure]": "more",
  "[data-first-customers-card]": "more",
};

export const HOME_FOCUS_EVENT = "buildup:home-focus";

/** 홈 orchestrator 마운트 카운트 — 0 이면 requestHomeFocus 는 false (다른 surface 에서 호출 시 기존 폴백 유지) */
let hostCount = 0;
export function registerHomeSegmentHost(): () => void {
  hostCount += 1;
  return () => { hostCount = Math.max(0, hostCount - 1); };
}

export type HomeFocusDetail = { selector: string; segment: HomeSegment; focusInput?: boolean };

/**
 * 다른 세그먼트에 있는 카드로 포커스 요청. 매핑이 없으면 false (호출 측이 기존 폴백 유지).
 * 홈이 마운트돼 있지 않으면(다른 surface) 이벤트는 무시된다 — 호출 측 폴백이 담당.
 */
export function requestHomeFocus(selector: string, opts: { focusInput?: boolean } = {}): boolean {
  const segment = SELECTOR_SEGMENT[selector];
  if (!segment || hostCount === 0 || typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent<HomeFocusDetail>(HOME_FOCUS_EVENT, {
    detail: { selector, segment, focusInput: opts.focusInput },
  }));
  return true;
}
