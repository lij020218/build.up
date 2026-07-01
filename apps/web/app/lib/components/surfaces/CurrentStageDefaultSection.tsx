"use client";

import { formatBudgetPresetLabel } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { getCurrentStageDefaultSectionKind } from "./current-stage-default-section-state";

export function CurrentStageDefaultSection() {
  const {
    businessLaunched,
    copy,
    decisions,
    handleLaunchBusiness,
    language,
    navigateToSurface,
    resetDemo,
    roadmap,
  } = useDashboardCtx();
  const sectionKind = getCurrentStageDefaultSectionKind({
    businessLaunched,
    completedStageIds: roadmap.completedStageIds,
  });

  return (
    <>
      {sectionKind === "launch_cta" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "6px 0" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px" }}>
            {language === "ko" ? "모든 준비가 완료됐습니다." : "You're ready to open."}
          </div>
          <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
            {language === "ko"
              ? "이제 Found.One과 함께 실제 운영을 시작하세요. 매출·비용·손익분기점을 함께 추적합니다."
              : "Start your real operations with Found.One. Track daily revenue, costs, and break-even together."}
          </div>
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              background: "linear-gradient(135deg, #1d3557, #30a84e)",
              marginTop: "4px",
            }}
            onClick={handleLaunchBusiness}
          >
            {language === "ko" ? "가오픈 시작하기" : "Start soft opening"}
          </button>
          <button type="button" style={{ ...styles.primaryButton }} onClick={handleLaunchBusiness}>
            {language === "ko" ? "정식 개업 시작하기" : "Grand opening"}
          </button>
        </div>
      ) : sectionKind === "launched_analytics" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>
            {language === "ko" ? "개업 중 — 매출을 기록하고 있어요." : "Open for business"}
          </div>
          <button type="button" style={styles.primaryButton} onClick={() => navigateToSurface("analytics")}>
            {language === "ko" ? "내 가게 현황 보기" : "View my store analytics"}
          </button>
        </div>
      ) : (
        <>
          <div style={styles.helper}>{copy.home.completeStarterLoop}</div>
          <div style={styles.pillRow}>
            <div style={styles.pill}>
              {language === "ko" ? "선택 업종" : "Selected industry"}{" "}
              {decisions["industry-selection"]?.selectedPrimaryOptionId ?? "-"}
            </div>
            <div style={styles.pill}>
              {copy.home.startupType} {String(decisions["startup-type"]?.selectedPrimaryOptionId ?? "-")}
            </div>
            <div style={styles.pill}>
              {language === "ko" ? "운영 방식" : "Model"}{" "}
              {decisions["business-model"]?.selectedPrimaryOptionId ?? "-"}
            </div>
            <div style={styles.pill}>
              {copy.home.capital}{" "}
              {typeof decisions["budget-setup"]?.inputs?.capital === "number"
                ? formatBudgetPresetLabel(decisions["budget-setup"]?.inputs?.capital as number, language)
                : "-"}
            </div>
            <div style={styles.pill}>
              {language === "ko" ? "상권" : "Market"}{" "}
              {decisions["location-candidates"]?.selectedPrimaryOptionId ?? "-"}
            </div>
          </div>
        </>
      )}
      <div style={styles.pillRow}>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
