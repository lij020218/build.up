"use client";

/**
 * Tier 1 — Hero (즉시 노출).
 *
 * 카드 목록 (위→아래):
 *   - CEOMorningHero   — 거장 리서치 기반 아침 브리핑 (Bezos·Chesky·캐시노트)
 *   - AlertStripBanner — 긴급 alert (alert 있을 때만 자체 가드)
 *
 * FeatureNudgeSection(미사용 기능 안내)은 2026-07-21 밀도 개선으로 데일리 허브 *아래*
 * 로 이동 — 첫 화면은 데이터(매출·현금·손익)가 먼저, 안내는 그 다음 (사장님 목업 기준).
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import { CEOMorningHero } from "../CEOMorningHero";
import { AlertStripBanner } from "../AlertStripBanner";

type Props = {
  d: DashboardHook;
  nextStaggerStyle: () => React.CSSProperties;
  /** 전체 브리핑 펼침 여부 — 오늘의 요약 AI 카드의 [자세히 보기] 토글 (2026-07-21 밀도 재설계).
   *  접힘 상태에서도 brain 요약은 TodaySummarySection AI 카드가 항상 표시 — 정보 유실 0. */
  showBriefing: boolean;
};

export function Tier1Hero({ d, nextStaggerStyle, showBriefing }: Props) {
  return (
    <>
      {showBriefing && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <CEOMorningHero d={d} />
        </div>
      )}
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
        <AlertStripBanner />
      </div>
    </>
  );
}
