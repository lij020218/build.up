"use client";

import type { CSSProperties } from "react";
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
} from "@foundone/shared";
import {
  AnimatedBar,
  AnimatedProgressBar,
  CountUp,
  FadeInGroup,
} from "../dashboard/animations";
import { bentoHoverCSS } from "../dashboard/operationalStyles";

function homeStagger(index: number, extraDelay = 0): CSSProperties {
  return {
    animationDelay: `${0.06 + index * 0.08 + extraDelay}s`,
    animationDuration: "0.55s",
  };
}

function buildJourneyBars(progress: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const start = (index / 6) * 100;
    const end = ((index + 1) / 6) * 100;
    const segmentProgress = ((progress - start) / (end - start)) * 100;
    return {
      id: `journey-${index}`,
      height: Math.max(10, Math.min(100, segmentProgress)),
    };
  });
}

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
  const ko = language === "ko";
  const roadmapSignalBars = buildJourneyBars(correctedProgressPercent);

  return (
    <section style={styles.section}>
      <style>{bentoHoverCSS}</style>
      <div style={styles.sectionTitle}>{language === "ko" ? "홈" : "Home"}</div>

      {/* ── Pre-launch home content ── */}
      <div style={styles.homeShowcase}>
        <article style={styles.homeMainPanel} className="dash-stagger-item" aria-label={ko ? "홈 메인 패널" : "Home main panel"} >
          <div className="dash-stagger-item" style={homeStagger(0)}>
            <div style={styles.homePanelEyebrow}>
              <span>{language === "ko" ? "Roadmap-first startup OS" : "Roadmap-first startup OS"}</span>
            </div>
          </div>
          <div className="dash-stagger-item" style={homeStagger(1)}>
            <div style={styles.homeMainTitle}>
              {isFreshAccount
                ? language === "ko"
                  ? "한 단계씩 창업의 구조를 세웁니다."
                  : "Build the business one clear step at a time."
                : language === "ko"
                  ? "지금 필요한 판단과 다음 실행을 한 곳에 모았습니다."
                  : "Your next judgment and next action, in one place."}
            </div>
          </div>
          <div className="dash-stagger-item" style={homeStagger(2)}>
            <div style={styles.homeMainBody}>
              {isFreshAccount
                ? language === "ko"
                  ? "Found.One은 긴 체크리스트 대신, 지금 정해야 할 것 하나만 또렷하게 보여줍니다."
                  : "Found.One keeps the startup process focused by surfacing only the decision that matters now."
                : language === "ko"
                  ? "현재 단계는 크게, 나머지는 얇게. 복잡한 창업 과정을 실행 가능한 리듬으로 정리합니다."
                  : "The current step stays large while everything else stays quiet, so the process feels actionable instead of overwhelming."}
            </div>
          </div>

          <div className="dash-stagger-item" style={homeStagger(3)}>
            <div style={styles.summaryBar}>
              <div style={styles.summarySegment}>
                {copy.home.progress} <CountUp to={correctedProgressPercent} duration={0.9} format={(n) => `${Math.round(n)}%`} />
              </div>
              <div style={styles.summarySegment}>
                {copy.home.completed} <CountUp to={completedCount} duration={0.75} format={(n) => Math.round(n).toString()} /> / {pathTotalStages}
              </div>
              {startupSummary ? <div style={styles.summarySegment}>{startupSummary}</div> : null}
              {preferredRegion ? <div style={{ ...styles.summarySegment, borderRight: "none" }}>{copy.home.region} {preferredRegion}</div> : null}
            </div>
          </div>

          <div className="dash-stagger-item" style={homeStagger(4)}>
            {allStagesDone ? (
              <div style={{
                padding: "18px 20px", borderRadius: "16px",
                background: "rgba(29,53,87,0.07)", // 완료 = 양호(네이비 success). 신호등 그린 폐기(2026-06-16)
                border: "1px solid rgba(29,53,87,0.18)",
                display: "flex", alignItems: "center", gap: "14px",
              }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                  background: "#1d3557", display: "flex", alignItems: "center", justifyContent: "center",
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
                <div style={{ ...styles.homeStageRailCard }} className="dash-stagger-item" aria-label={ko ? "현재 단계 카드" : "Current stage card"} >
                  <div style={homeStagger(5, 0.02)}>
                    <div style={styles.homeStageRailLabel}>{language === "ko" ? "지금" : "Now"}</div>
                    <div style={styles.homeStageRailTitle}>{localizedCurrentStage.title}</div>
                    <div style={styles.homeStageRailBody}>{localizedCurrentStage.goal}</div>
                  </div>
                </div>
                <div style={{ ...styles.homeStageRailCard }} className="dash-stagger-item" aria-label={ko ? "다음 단계 카드" : "Next stage card"} >
                  <div style={homeStagger(6, 0.05)}>
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
              </div>
            )}
          </div>

          <button
            type="button"
            className="dash-stagger-item"
            style={{ ...styles.primaryButton, ...homeStagger(7), width: "fit-content" }}
            onClick={() => navigateToSurface("current")}
          >
            {allStagesDone
              ? (language === "ko" ? "완료 화면 보기" : "View completion")
              : (language === "ko" ? "현재 단계 열기" : "Open current step")}
          </button>
        </article>

        <div style={styles.homeSideStack}>
          <article style={styles.homeInfoPanel} className="dash-stagger-item">
            <FadeInGroup delay={0.2} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div>
                  <div style={styles.homeInfoTitle}>{language === "ko" ? "Roadmap signals" : "Roadmap signals"}</div>
                  <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--primary)", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
                    <CountUp to={correctedProgressPercent} duration={1.0} format={(n) => `${Math.round(n)}%`} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 10px)", alignItems: "end", gap: "6px", height: "72px" }}>
                  {roadmapSignalBars.map((bar, index) => (
                    <div
                      key={bar.id}
                      style={{
                        width: "10px",
                        height: "72px",
                        borderRadius: "999px",
                        background: "rgba(29,53,87,0.08)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "end",
                      }}
                    >
                      <AnimatedBar
                        heightPct={bar.height}
                        delay={0.18 + index * 0.06}
                        duration={0.6}
                        style={{
                          width: "100%",
                          borderRadius: "999px",
                          background: index <= Math.floor((correctedProgressPercent / 100) * roadmapSignalBars.length)
                            ? "linear-gradient(180deg, #a8dadc 0%, #457b9d 52%, #1d3557 100%)"
                            : "rgba(69,123,157,0.18)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <AnimatedProgressBar
                pct={correctedProgressPercent}
                color="linear-gradient(90deg, #1d3557 0%, #457b9d 50%, #a8dadc 100%)"
                delay={0.24}
                duration={0.95}
              />

              <div style={styles.homeMetricGrid}>
                <div style={{ ...styles.homeMetricCard, ...homeStagger(8) }} className="dash-stagger-item">
                  <div style={styles.homeMetricLabel}>{language === "ko" ? "현재 단계" : "Current"}</div>
                  <div style={styles.homeMetricValue}>{localizedCurrentStage.title}</div>
                </div>
                <div style={{ ...styles.homeMetricCard, ...homeStagger(9) }} className="dash-stagger-item">
                  <div style={styles.homeMetricLabel}>{language === "ko" ? "다음 흐름" : "Up next"}</div>
                  <div style={styles.homeMetricValue}>
                    {nextRoadmapStage
                      ? localizeStage(nextRoadmapStage, language, industryCategoryId).title
                      : language === "ko" ? "정리 완료" : "Structured"}
                  </div>
                </div>
                <div style={{ ...styles.homeMetricCard, ...homeStagger(10) }} className="dash-stagger-item">
                  <div style={styles.homeMetricLabel}>{language === "ko" ? "진행률" : "Progress"}</div>
                  <div style={styles.homeMetricValue}>
                    <CountUp to={correctedProgressPercent} duration={0.9} format={(n) => `${Math.round(n)}%`} />
                  </div>
                </div>
                <div style={{ ...styles.homeMetricCard, ...homeStagger(11) }} className="dash-stagger-item">
                  <div style={styles.homeMetricLabel}>{language === "ko" ? "완료" : "Completed"}</div>
                  <div style={styles.homeMetricValue}>
                    <CountUp to={completedCount} duration={0.8} format={(n) => Math.round(n).toString()} /> / {pathTotalStages}
                  </div>
                </div>
              </div>
            </FadeInGroup>
          </article>

          <article style={styles.homeInfoPanel} className="dash-stagger-item">
            <FadeInGroup delay={0.28} style={{ display: "grid", gap: "14px" }}>
              <div style={styles.homeInfoTitle}>{language === "ko" ? "Founder snapshot" : "Founder snapshot"}</div>
              <div style={styles.homeMiniList}>
                <div style={{ ...styles.homeMiniRow, ...homeStagger(12), borderTop: "none" }} className="dash-stagger-item">
                  <div style={styles.homeMiniLabel}>{language === "ko" ? "세부 업종" : "Industry"}</div>
                  <div style={styles.homeMiniValue}>{selectedIndustryLabel}</div>
                </div>
                <div style={{ ...styles.homeMiniRow, ...homeStagger(13) }} className="dash-stagger-item">
                  <div style={styles.homeMiniLabel}>{language === "ko" ? "창업 형태" : "Startup type"}</div>
                  <div style={styles.homeMiniValue}>
                    {profile?.startupType ? formatStartupType(profile.startupType, language) : copy.common.notSetYet}
                  </div>
                </div>
                <div style={{ ...styles.homeMiniRow, ...homeStagger(14) }} className="dash-stagger-item">
                  <div style={styles.homeMiniLabel}>{language === "ko" ? "자본금" : "Capital"}</div>
                  <div style={styles.homeMiniValue}>{activeBudgetLabel}</div>
                </div>
                <div style={{ ...styles.homeMiniRow, ...homeStagger(15) }} className="dash-stagger-item">
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
                      ...homeStagger(16),
                      cursor: "pointer"
                    }}
                    className="dash-stagger-item"
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
            </FadeInGroup>
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
              {highlights.slice(0, 6).map((prog, index) => {
                const catColor = getProgramCategoryColor(prog.category);
                return (
                  <a
                    key={prog.id}
                    href={prog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dash-stagger-item"
                    style={{
                      ...homeStagger(index, 0.22),
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
