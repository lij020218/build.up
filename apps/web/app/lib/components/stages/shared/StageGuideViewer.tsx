"use client";

import React from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

export function StageGuideViewer() {
  const {
    language,
    currentStage,
    stageGuideContent,
    guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,
  } = useDashboardCtx();

  if (!stageGuideContent) return null;

  const steps = stageGuideContent.steps;
  const totalSlides = 1 + steps.length;
  const isOverview = guideStepIndex === 0;
  const currentStep = isOverview ? null : steps[guideStepIndex - 1];

  return (
    <div style={styles.guideCard}>
      {/* pager */}
      <div style={styles.guidePager}>
        <span style={styles.guidePagerLabel}>
          {isOverview
            ? (language === "ko" ? "\uac1c\uc694" : "Overview")
            : `${guideStepIndex} / ${steps.length}`}
        </span>
        <div style={styles.guideDots}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              onClick={() => setGuideStepIndex(i)}
              style={{
                width: i === guideStepIndex ? "20px" : "6px",
                height: "6px",
                borderRadius: "100px",
                background: i === guideStepIndex ? "var(--primary)" : "rgba(17,17,17,0.15)",
                cursor: "pointer",
                transition: "width 0.2s ease"
              }}
            />
          ))}
        </div>
      </div>

      {isOverview ? (
        <>
          <div style={styles.guideOverline}>
            {language === "ko" ? "\uc774 \ub2e8\uacc4\uc5d0\uc11c \ud560 \uc77c" : "What to do"}
          </div>
          <p style={styles.guideHeadline}>{stageGuideContent.summary}</p>
          {stageGuideContent.whyNow && (
            <p style={styles.guideBody}>{stageGuideContent.whyNow}</p>
          )}
          {(stageGuideContent.costRange || stageGuideContent.timeEstimate) && (
            <div style={styles.guideMetaRow}>
              {stageGuideContent.costRange && (
                <span style={styles.guideMetaChip}>
                  {language === "ko" ? "\ube44\uc6a9 " : "Cost "}{stageGuideContent.costRange}
                </span>
              )}
              {stageGuideContent.timeEstimate && (
                <span style={styles.guideMetaChip}>
                  {language === "ko" ? "\uae30\uac04 " : "Time "}{stageGuideContent.timeEstimate}
                </span>
              )}
            </div>
          )}
          {stageGuideContent.warnings.map((w, i) => (
            <div
              key={i}
              style={{
                ...styles.guideWarningItem,
                background: w.level === "danger"
                  ? "rgba(220,0,0,0.05)"
                  : w.level === "info"
                    ? "rgba(0,100,220,0.05)"
                    : "rgba(255,160,0,0.07)",
                color: w.level === "danger" ? "#8a1a1a" : w.level === "info" ? "#1a3a6a" : "#7a5500"
              }}
            >
              {w.text}
            </div>
          ))}
        </>
      ) : currentStep ? (
        <>
          <div style={styles.guideOverline}>
            {language === "ko" ? `${guideStepIndex}\ub2e8\uacc4` : `Step ${guideStepIndex}`}
          </div>
          <div style={styles.guideHeadline}>{currentStep.action}</div>
          {currentStep.detail && (
            <p style={styles.guideBody}>{currentStep.detail}</p>
          )}
          {currentStep.url && (
            <a
              href={currentStep.url}
              target="_blank"
              rel="noreferrer"
              style={styles.guideLinkButton}
            >
              {language === "ko" ? "\ubc14\ub85c\uac00\uae30 \u2192" : "Open \u2192"}
            </a>
          )}
          {currentStep.options && currentStep.options.length > 0 && (() => {
            const selectionKey = `${currentStage.stageId}_step${guideStepIndex}`;
            const selected = guideSelections[selectionKey];
            return (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, margin: "4px 0 8px" }}>
                {currentStep.options!.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGuideSelections(prev => ({ ...prev, [selectionKey]: opt }))}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "100px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: selected === opt
                        ? "2px solid var(--primary)"
                        : "1.5px solid rgba(17,17,17,0.15)",
                      background: selected === opt
                        ? "var(--primary)"
                        : "rgba(255,255,255,0.8)",
                      color: selected === opt ? "white" : "var(--text)",
                    }}
                  >
                    {selected === opt ? "\u2713 " : ""}{opt}
                  </button>
                ))}
              </div>
            );
          })()}
          {currentStep.tip && (
            <div style={styles.guideTip}>\ud83d\udca1 {currentStep.tip}</div>
          )}
          {currentStep.cost && (
            <span style={styles.guideCostBadge}>{currentStep.cost}</span>
          )}
        </>
      ) : null}

      {/* card nav -- unified style */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0" }}>
        <button type="button" disabled={guideStepIndex === 0} onClick={() => setGuideStepIndex(i => Math.max(0, i - 1))} style={{
          padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.1)",
          background: guideStepIndex === 0 ? "rgba(0,0,0,0.02)" : "white",
          color: guideStepIndex === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex === 0 ? "default" : "pointer",
        }}>
          \u2190 {language === "ko" ? "\uc774\uc804" : "Prev"}
        </button>
        <div style={{ display: "flex", gap: "6px" }}>
          {Array.from({ length: totalSlides }, (_, i) => (
            <div key={i} onClick={() => setGuideStepIndex(i)} style={{
              width: i === guideStepIndex ? "20px" : "8px", height: "8px", borderRadius: "100px",
              background: i === guideStepIndex ? "#0561fc" : "rgba(0,0,0,0.1)",
              cursor: "pointer", transition: "all 0.2s ease",
            }} />
          ))}
        </div>
        <button type="button" disabled={guideStepIndex >= totalSlides - 1} onClick={() => setGuideStepIndex(i => Math.min(totalSlides - 1, i + 1))} style={{
          padding: "10px 18px", borderRadius: "10px", border: "none",
          background: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.02)" : "#0561fc",
          color: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex >= totalSlides - 1 ? "default" : "pointer",
          boxShadow: guideStepIndex >= totalSlides - 1 ? "none" : "0 4px 14px rgba(5,97,252,0.25)",
        }}>
          {language === "ko" ? "\ub2e4\uc74c" : "Next"} \u2192
        </button>
      </div>
    </div>
  );
}
