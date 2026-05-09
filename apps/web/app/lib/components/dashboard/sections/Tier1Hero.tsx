"use client";

/**
 * Tier 1 — Hero (즉시 노출, 3개 카드).
 *
 * 카드 목록 (위→아래):
 *   - CEOMorningHero      — 거장 리서치 기반 아침 브리핑 (Bezos·Chesky·캐시노트)
 *   - FeatureNudgeSection — 미사용 기능 안내 (1-3개 카드)
 *   - AlertStripBanner    — 긴급 alert (alert 있을 때만 자체 가드)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import { CEOMorningHero } from "../CEOMorningHero";
import { FeatureNudgeSection } from "../FeatureNudgeCard";
import { AlertStripBanner } from "../AlertStripBanner";

type Props = {
  d: DashboardHook;
  nextStaggerStyle: () => React.CSSProperties;
};

export function Tier1Hero({ d, nextStaggerStyle }: Props) {
  return (
    <>
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
        <CEOMorningHero d={d} />
      </div>
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
        <FeatureNudgeSection d={d} />
      </div>
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
        <AlertStripBanner />
      </div>
    </>
  );
}
