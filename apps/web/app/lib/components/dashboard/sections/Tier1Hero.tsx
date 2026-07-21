"use client";

/**
 * Tier 1 — 긴급 알림 스트립.
 *
 * CEOMorningHero(전체 AI 브리핑)는 2026-07-21 밀도 재설계로 TodaySummarySection 의
 * AI 코칭 카드 [자세히 보기] 펼침으로 이동 — 요약 카드가 같은 brain 신호를 항상 표시.
 * FeatureNudgeSection(미사용 기능 안내)도 데일리 허브 아래로 이동 (데이터 먼저 원칙).
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import { AlertStripBanner } from "../AlertStripBanner";

type Props = {
  d: DashboardHook;
  nextStaggerStyle: () => React.CSSProperties;
};

export function Tier1Hero({ d: _d, nextStaggerStyle }: Props) {
  return (
    <div className="dash-stagger-item" style={nextStaggerStyle()}>
      <AlertStripBanner />
    </div>
  );
}
