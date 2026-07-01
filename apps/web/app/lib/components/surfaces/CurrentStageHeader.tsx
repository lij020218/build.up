"use client";

import { formatStageType, type StageType } from "@foundone/shared";
import { styles } from "../../styles";
import type { DashboardSurface } from "../../types";

type CurrentStageHeaderProps = {
  language: "ko" | "en";
  pathStepNumber: number;
  pathTotalStages: number;
  stageType: StageType;
  title: string;
  goal: string;
  transitionNotice: { title: string; body: string } | null;
  isFreshAccount: boolean;
  persistenceLabel: string;
  isViewingPastStage: boolean;
  navigateToSurface: (surface: DashboardSurface) => void;
};

export function CurrentStageHeader({
  language,
  pathStepNumber,
  pathTotalStages,
  stageType,
  title,
  goal,
  transitionNotice,
  isFreshAccount,
  persistenceLabel,
  isViewingPastStage,
  navigateToSurface,
}: CurrentStageHeaderProps) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "2px" }}>
        <div style={{ flex: 1, display: "flex", gap: "3px" }}>
          {Array.from({ length: pathTotalStages }).map((_, index) => (
            <div key={index} style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              background: index < pathStepNumber - 1
                ? "var(--primary, #1d3557)"
                : index === pathStepNumber - 1
                  ? "rgba(29,53,87,0.35)"
                  : "rgba(0,0,0,0.06)",
              transition: "background 0.3s ease",
            }} />
          ))}
        </div>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" as const, fontVariantNumeric: "tabular-nums" }}>
          {pathStepNumber}/{pathTotalStages} · {formatStageType(stageType, language)}
        </span>
      </div>

      <div style={styles.currentTitle}>{title}</div>
      <div style={styles.currentBody}>{goal}</div>

      {transitionNotice ? (
        <div style={styles.transitionNotice}>
          <div style={styles.transitionNoticeTitle}>{transitionNotice.title}</div>
          <div style={styles.transitionNoticeBody}>{transitionNotice.body}</div>
        </div>
      ) : null}

      {isFreshAccount ? null : (
        <>
          <div style={styles.currentActionRail}>
            <button type="button" style={styles.currentUtilityButton} onClick={() => navigateToSurface("roadmap")}>
              {language === "ko" ? "전체 로드맵" : "Roadmap"}
            </button>
            <button type="button" style={styles.currentStateChip}>
              {persistenceLabel}
            </button>
          </div>
          {isViewingPastStage ? (
            <div style={{
              padding: "10px 16px",
              borderRadius: "14px",
              background: "rgba(29,53,87,0.06)",
              border: "1px solid rgba(29,53,87,0.12)",
              fontSize: "13px",
              color: "var(--primary)",
              fontWeight: 500,
            }}>
              {language === "ko" ? "이전 단계 보는 중" : "Viewing a past step"}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
