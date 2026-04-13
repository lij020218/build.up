"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import {
  localizeStage,
  formatStartupType,
  formatOpenDatePresetLabel,
  getRiskLevelLabel,
  getMatchedHighlights,
  getProgramCategoryLabel,
  getProgramCategoryColor,
} from "@build-up/shared";
import { AuroraBackground } from "../../../../components/ui/aurora-background";

export function HomeView() {
  const d = useDashboardCtx();
  const {
    language, copy, isFreshAccount, startupSummary, selectedIndustryLabel,
    completedCount, pathTotalStages, correctedProgressPercent, allStagesDone,
    nextStepSummary, homePrinciples, currentStage, nextRoadmapStage, roadmapPreviewStages,
    navigateToSurface, transitionNotice, setTransitionNotice, lastUnlocked,
    aiActions, aiActionsLoading, fetchAiActions, businessHealthScore,
    localizedCurrentStage, industryCategoryId, preferredRegion, businessLaunched,
    startupType, profile, activeBudgetLabel, activeOpenDatePreset,
    savedFinanceSnapshot, openFinanceFromSummary,
    onboardingDismissed, setOnboardingDismissed, mounted,
  } = d;

  return (
    <section style={styles.section}>
      <div style={styles.sectionTitle}>{language === "ko" ? "홈" : "Home"}</div>

      {/* ── Pre-launch home content ── */}
      <div style={styles.homeShowcase}>
        <AuroraBackground className="rounded-[24px]" style={{ minHeight: "auto" }}>
        <article style={{ ...styles.homeMainPanel, background: "transparent", position: "relative", zIndex: 1 }}>
          <div style={styles.homePanelEyebrow}>
            <span>{language === "ko" ? "Roadmap-first startup OS" : "Roadmap-first startup OS"}</span>
          </div>
          <div style={styles.homeMainTitle}>
            {isFreshAccount
              ? language === "ko"
                ? "한 단계씩 창업의 구조를 세웁니다."
                : "Build the business one clear step at a time."
              : language === "ko"
                ? "지금 필요한 판단과 다음 실행을 한 곳에 모았습니다."
                : "Your next judgment and next action, in one place."}
          </div>
          <div style={styles.homeMainBody}>
            {isFreshAccount
              ? language === "ko"
                ? "build.up은 긴 체크리스트 대신, 지금 정해야 할 것 하나만 또렷하게 보여줍니다."
                : "build.up keeps the startup process focused by surfacing only the decision that matters now."
              : language === "ko"
                ? "현재 단계는 크게, 나머지는 얇게. 복잡한 창업 과정을 실행 가능한 리듬으로 정리합니다."
                : "The current step stays large while everything else stays quiet, so the process feels actionable instead of overwhelming."}
          </div>

          <div style={styles.summaryBar}>
            <div style={styles.summarySegment}>{copy.home.progress} {correctedProgressPercent}%</div>
            <div style={styles.summarySegment}>{copy.home.completed} {completedCount} / {pathTotalStages}</div>
            {startupSummary ? <div style={styles.summarySegment}>{startupSummary}</div> : null}
            {preferredRegion ? <div style={{ ...styles.summarySegment, borderRight: "none" }}>{copy.home.region} {preferredRegion}</div> : null}
          </div>

          {allStagesDone ? (
            <div style={{
              padding: "18px 20px", borderRadius: "16px",
              background: "rgba(52,199,89,0.07)",
              border: "1px solid rgba(52,199,89,0.2)",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                background: "#34c759", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10L8.5 15L16 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.2px", color: "var(--primary)" }}>
                  {language === "ko" ? `${pathTotalStages}단계 모두 완료` : `All ${pathTotalStages} stages complete`}
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
                  {language === "ko" ? "창업 준비가 완료되었습니다" : "You're ready to launch"}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.homeStageRail}>
              <div style={styles.homeStageRailCard}>
                <div style={styles.homeStageRailLabel}>{language === "ko" ? "지금" : "Now"}</div>
                <div style={styles.homeStageRailTitle}>{localizedCurrentStage.title}</div>
                <div style={styles.homeStageRailBody}>{localizedCurrentStage.goal}</div>
              </div>
              <div style={styles.homeStageRailCard}>
                <div style={styles.homeStageRailLabel}>{language === "ko" ? "다음" : "Next"}</div>
                <div style={styles.homeStageRailTitle}>
                  {nextRoadmapStage
                    ? localizeStage(nextRoadmapStage, language, industryCategoryId).title
                    : language === "ko"
                      ? "다음 단계 준비 중"
                      : "Preparing the next step"}
                </div>
                <div style={styles.homeStageRailBody}>
                  {nextRoadmapStage
                    ? localizeStage(nextRoadmapStage, language, industryCategoryId).goal
                    : nextStepSummary}
                </div>
              </div>
            </div>
          )}

          <button type="button" style={{ ...styles.primaryButton, width: "fit-content" }} onClick={() => navigateToSurface("current")}>
            {allStagesDone
              ? (language === "ko" ? "완료 화면 보기" : "View completion")
              : (language === "ko" ? "현재 단계 열기" : "Open current step")}
          </button>

        </article>
        </AuroraBackground>

        <div style={styles.homeSideStack}>
          <article style={styles.homeInfoPanel}>
            <div style={styles.homeInfoTitle}>{language === "ko" ? "Roadmap signals" : "Roadmap signals"}</div>
            <div style={styles.homeProgressTrack}>
              <div style={{ ...styles.homeProgressFill, width: `${Math.max(8, correctedProgressPercent)}%` }} />
            </div>
            <div style={styles.homeMetricGrid}>
              <div style={styles.homeMetricCard}>
                <div style={styles.homeMetricLabel}>{language === "ko" ? "현재 단계" : "Current"}</div>
                <div style={styles.homeMetricValue}>{localizedCurrentStage.title}</div>
              </div>
              <div style={styles.homeMetricCard}>
                <div style={styles.homeMetricLabel}>{language === "ko" ? "다음 흐름" : "Up next"}</div>
                <div style={styles.homeMetricValue}>
                  {nextRoadmapStage
                    ? localizeStage(nextRoadmapStage, language, industryCategoryId).title
                    : language === "ko" ? "정리 완료" : "Structured"}
                </div>
              </div>
              <div style={styles.homeMetricCard}>
                <div style={styles.homeMetricLabel}>{language === "ko" ? "진행률" : "Progress"}</div>
                <div style={styles.homeMetricValue}>{correctedProgressPercent}%</div>
              </div>
              <div style={styles.homeMetricCard}>
                <div style={styles.homeMetricLabel}>{language === "ko" ? "완료" : "Completed"}</div>
                <div style={styles.homeMetricValue}>{completedCount} / {pathTotalStages}</div>
              </div>
            </div>
          </article>

          <article style={styles.homeInfoPanel}>
            <div style={styles.homeInfoTitle}>{language === "ko" ? "Founder snapshot" : "Founder snapshot"}</div>
            <div style={styles.homeMiniList}>
              <div style={{ ...styles.homeMiniRow, borderTop: "none" }}>
                <div style={styles.homeMiniLabel}>{language === "ko" ? "세부 업종" : "Industry"}</div>
                <div style={styles.homeMiniValue}>{selectedIndustryLabel}</div>
              </div>
              <div style={styles.homeMiniRow}>
                <div style={styles.homeMiniLabel}>{language === "ko" ? "창업 형태" : "Startup type"}</div>
                <div style={styles.homeMiniValue}>
                  {profile?.startupType ? formatStartupType(profile.startupType, language) : copy.common.notSetYet}
                </div>
              </div>
              <div style={styles.homeMiniRow}>
                <div style={styles.homeMiniLabel}>{language === "ko" ? "자본금" : "Capital"}</div>
                <div style={styles.homeMiniValue}>{activeBudgetLabel}</div>
              </div>
              <div style={styles.homeMiniRow}>
                <div style={styles.homeMiniLabel}>{language === "ko" ? "오픈 시점" : "Opening"}</div>
                <div style={styles.homeMiniValue}>
                  {activeOpenDatePreset
                    ? formatOpenDatePresetLabel(activeOpenDatePreset.id, activeOpenDatePreset.label, language)
                    : copy.common.notSetYet}
                </div>
              </div>
              {savedFinanceSnapshot ? (
                <div
                  style={{
                    ...styles.homeMiniRow,
                    cursor: "pointer"
                  }}
                  onClick={openFinanceFromSummary}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFinanceFromSummary();
                    }
                  }}
                >
                  <div style={styles.homeMiniLabel}>{language === "ko" ? "최근 재무 분석" : "Latest finance read"}</div>
                  <div style={styles.homeMiniValue}>
                    {getRiskLevelLabel(savedFinanceSnapshot.riskLevel, language)}
                    {language === "ko"
                      ? ` · ${savedFinanceSnapshot.survivabilityMonths}개월`
                      : ` · ${savedFinanceSnapshot.survivabilityMonths} months`}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </div>

      {/* ── 추천 지원 프로그램 (pre-launch only) ── */}
      {!businessLaunched && (() => {
        const ko = language === "ko";
        const highlights = getMatchedHighlights(startupType);
        if (highlights.length === 0) return null;
        return (
          <div style={{ marginTop: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={styles.sectionTitle}>{ko ? "추천 지원 프로그램" : "Recommended Support Programs"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {highlights.slice(0, 6).map(prog => {
                const catColor = getProgramCategoryColor(prog.category);
                return (
                  <a
                    key={prog.id}
                    href={prog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "grid", gap: "8px", padding: "18px",
                      borderRadius: "20px",
                      border: "1px solid var(--border)",
                      background: "rgba(255,255,255,0.82)",
                      textDecoration: "none", color: "inherit",
                      boxShadow: "0 2px 8px rgba(17,17,17,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: `${catColor}12`, color: catColor }}>
                        {getProgramCategoryLabel(prog.category, language)}
                      </span>
                      {prog.amount && <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)" }}>{prog.amount}</span>}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{prog.name[language]}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{prog.benefit[language]}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{prog.organizer[language]}</span>
                      <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>↗</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })()}

    </section>
  );
}
