"use client";

/**
 * Tier 0 — 상호명 + 0단계 경영 리추얼 배너.
 *
 * 카드 목록 (위→아래):
 *   - 상호명 + LIVE 배지 (모두, 사장님 본인 가게명)
 *   - 0단계 RitualBanner (주간/월간 경영 점검 프롬프트, !isStaff)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import { RitualBanner } from "../RitualBanner";
import { BusinessHealthScoreCard } from "../BusinessHealthScoreCard";
import { useProfileStore } from "../../../stores/profile-store";

type Props = {
  d: DashboardHook;
  ko: boolean;
  isStaff: boolean;
  nextStaggerStyle: () => React.CSSProperties;
  /** 사업 건강 점수 — useDashboardComputed SSOT. 미런칭/직원 화면에선 미노출. */
  businessHealthScore?: "healthy" | "caution" | "danger" | "unknown";
};

export function Tier0Header({ d, ko, isStaff, nextStaggerStyle, businessHealthScore }: Props) {
  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const showRitualBanner = !hiddenCards.includes("ritual-banner");
  const showHealthScore =
    !isStaff && !!businessHealthScore && d.businessLaunched && !hiddenCards.includes("business-health-score");
  return (
    <>
      {/* 상호명 — Apple 페이지 타이틀 톤 */}
      <div
        className="dash-stagger-item"
        style={{
          ...nextStaggerStyle(),
          padding: "4px 0 0",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontSize: "clamp(24px, 2.6vw, 30px)",
            fontWeight: 720,
            color: "#0f172a",
            letterSpacing: "-0.028em",
            lineHeight: 1.1,
            fontFamily: "inherit",
          }}
        >
          {d.storeName || (ko ? "내 가게" : "My Store")}
        </span>
        {d.businessLaunched && (
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 650,
              padding: "4px 10px",
              borderRadius: "999px",
              background: "rgba(5,150,105,0.08)",
              color: "#059669",
              letterSpacing: "0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              lineHeight: 1,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#059669",
                boxShadow: "0 0 0 3px rgba(5,150,105,0.15)",
              }}
            />
            {ko ? "운영 중" : "LIVE"}
          </span>
        )}
      </div>

      {/* 경영 건강 점수 — 사용자 지침 2026-05-11: ProfileView 에서 운영 대시보드로 이동.
          런칭 후·사장님 화면에서만 노출. unknown 이면 자동 가림. */}
      {showHealthScore && businessHealthScore && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <BusinessHealthScoreCard ko={ko} businessHealthScore={businessHealthScore} />
        </div>
      )}

      {/* 0단계 — 경영 리추얼 배너 */}
      {!isStaff && showRitualBanner && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <RitualBanner ko={ko} />
        </div>
      )}
    </>
  );
}
