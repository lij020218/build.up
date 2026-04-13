"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  getContractAnalysisHints,
  getContractTaskDetail,
} from "../../../helpers";

export function ContractReviewStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    isDigitalCategory,
    contractTasks,
    activeContractTask,
    activeContractTaskDetail,
    setSelectedContractTaskId,
    effectiveContractAnalysis,
    contractText,
    setContractText,
    contractAnalysisStatus,
    handleContractAnalysis,
    contractAnalysisError,
    prevTraversedStage,
    setViewingStageId,
    handleContractTaskToggle,
    handleContractContinue,
    resetDemo,
  } = d;

  return (
    <>
      <div style={styles.helper}>
        {isDigitalCategory
          ? language === "ko"
            ? "운영 공간, 보관, 택배, 공급 접근성처럼 온라인 판매의 실제 실행 조건을 먼저 점검합니다."
            : "Review workspace, storage, shipping, and sourcing conditions before scaling online operations."
          : copy.home.contractHelp}
      </div>
      <div style={styles.budgetLabel}>
        {language === "ko" ? "꼭 볼 것 3개" : "Three must-check items"}
      </div>
        <div style={styles.optionGrid}>
          {contractTasks.map((task) => {
            const completed = task.status === "completed";
            const selected = activeContractTask?.taskId === task.taskId;
            const analysisHints = getContractAnalysisHints(
              effectiveContractAnalysis,
              task.taskId,
              industryCategoryId,
              language
            );
            return (
              <button
                key={task.taskId}
              type="button"
              style={{
                ...styles.optionCard,
                ...(completed ? {
                  background: "linear-gradient(180deg, rgba(240,248,240,0.95) 0%, rgba(220,245,220,0.85) 100%)",
                  border: "1px solid rgba(34,139,34,0.28)",
                  boxShadow: "0 0 0 3px rgba(34,139,34,0.07), 0 10px 24px rgba(17,17,17,0.04)"
                } : selected ? styles.optionCardSelected : {})
              }}
              onClick={() => setSelectedContractTaskId(task.taskId)}
              >
                <div style={styles.recommendationTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {completed && (
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: "#34c759", display: "flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0
                      }}>
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    <div style={{ ...styles.optionTitle, ...(completed ? { color: "rgba(17,17,17,0.6)" } : {}) }}>
                      {getContractTaskDetail(task.taskId, language, industryCategoryId).title}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {analysisHints.length > 0 ? (
                      <div style={styles.confidenceBadge}>
                        {language === "ko" ? `AI 주의 ${analysisHints.length}` : `AI focus ${analysisHints.length}`}
                      </div>
                    ) : null}
                    <div style={{
                      ...styles.scoreBadge,
                      ...(completed ? { background: "rgba(34,139,34,0.12)", color: "#228B22" } : {})
                    }}>
                      {completed ? (language === "ko" ? "확인 완료" : "Done") : `${task.estimatedMinutes ?? "-"} ${language === "ko" ? "분" : "min"}`}
                    </div>
                  </div>
                </div>
              <div style={styles.optionSummary}>
                {analysisHints.length > 0
                  ? analysisHints[0]
                  : activeContractTask?.taskId === task.taskId
                    ? activeContractTaskDetail?.summary
                    : copy.common.requiredReviewItem}
              </div>
            </button>
          );
        })}
        </div>

      {activeContractTask && activeContractTaskDetail ? (
          <div style={styles.inlinePanel}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div>
                <div style={{ ...styles.budgetLabel, marginBottom: "6px" }}>
                  {language === "ko" ? "현재 확인할 항목" : "Current review item"}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 660, letterSpacing: "-0.2px", lineHeight: 1.2 }}>
                  {activeContractTaskDetail.title}
                </div>
              </div>
              <div style={{
                ...styles.scoreBadge,
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
                ...(activeContractTask.status === "completed"
                  ? { background: "rgba(34,139,34,0.12)", color: "#228B22" }
                  : {})
              }}>
                {activeContractTask.status === "completed"
                  ? language === "ko" ? "확인 완료" : "Done"
                  : `${activeContractTask.estimatedMinutes ?? "-"} ${language === "ko" ? "분" : "min"}`}
              </div>
            </div>

            {/* Summary */}
            <div style={{ ...styles.optionSummary, fontSize: "14px" }}>
              {activeContractTaskDetail.summary}
            </div>

            {/* AI hints (if any) */}
            {getContractAnalysisHints(effectiveContractAnalysis, activeContractTask.taskId, industryCategoryId, language).length > 0 ? (
              <div style={{
                display: "grid",
                gap: "8px",
                padding: "14px 16px",
                borderRadius: "16px",
                background: "rgba(255,200,50,0.10)",
                border: "1px solid rgba(200,150,0,0.18)"
              }}>
                <div style={{ ...styles.budgetLabel, color: "#9a6a00" }}>
                  {language === "ko" ? "AI가 먼저 보라고 한 이유" : "Why AI flagged this item"}
                </div>
                {getContractAnalysisHints(effectiveContractAnalysis, activeContractTask.taskId, industryCategoryId, language).map((item: string) => (
                  <div key={item} style={{ fontSize: "13px", lineHeight: 1.6, color: "#7a5200" }}>• {item}</div>
                ))}
              </div>
            ) : null}

            {/* Checklist */}
            {activeContractTaskDetail.checklist.length > 0 ? (
              <div style={{ display: "grid", gap: "6px" }}>
                <div style={styles.budgetLabel}>
                  {language === "ko" ? "확인할 항목" : "Checklist"}
                </div>
                {activeContractTaskDetail.checklist.map((item) => (
                  <div key={item} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: "1.5px solid rgba(29,53,87,0.25)",
                      flexShrink: 0,
                      marginTop: "3px",
                      background: "rgba(255,255,255,0.7)"
                    }} />
                    <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--primary)" }}>{item}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Traps / Pitfalls */}
            {activeContractTaskDetail.traps.length > 0 ? (
              <div style={{ display: "grid", gap: "8px" }}>
                <div style={styles.budgetLabel}>
                  {language === "ko" ? "흔한 함정" : "Common pitfalls"}
                </div>
                {activeContractTaskDetail.traps.map((trap) => (
                  <div key={trap.label} style={{
                    display: "grid",
                    gap: "4px",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    background: "rgba(220,60,30,0.05)",
                    border: "1px solid rgba(200,60,30,0.14)"
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 620, color: "#b83020", letterSpacing: "-0.1px" }}>
                      ⚠ {trap.label}
                    </div>
                    <div style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--muted)" }}>{trap.desc}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Action steps */}
            {activeContractTaskDetail.actions.length > 0 ? (
              <div style={{ display: "grid", gap: "6px" }}>
                <div style={styles.budgetLabel}>
                  {language === "ko" ? "지금 할 행동" : "Action steps"}
                </div>
                {activeContractTaskDetail.actions.map((action) => (
                  action.href ? (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        color: "var(--accent)",
                        textDecoration: "none",
                        padding: "4px 0"
                      }}
                    >
                      <span style={{ flexShrink: 0, opacity: 0.7 }}>↗</span>
                      <span>{action.label}</span>
                    </a>
                  ) : (
                    <div key={action.label} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "4px 0" }}>
                      <span style={{ fontSize: "14px", color: "var(--muted)", flexShrink: 0, marginTop: "1px" }}>→</span>
                      <div style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--primary)" }}>{action.label}</div>
                    </div>
                  )
                ))}
              </div>
            ) : null}

            {/* Questions to ask */}
            {activeContractTaskDetail.questions.length > 0 ? (
              <div style={{ display: "grid", gap: "6px" }}>
                <div style={styles.budgetLabel}>
                  {language === "ko" ? "건물주·중개사에게 물어볼 것" : "Ask the landlord / agent"}
                </div>
                {activeContractTaskDetail.questions.map((q) => (
                  <div key={q} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "14px", color: "var(--muted)", flexShrink: 0, marginTop: "1px" }}>Q</div>
                    <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--primary)", fontStyle: "italic" }}>{q}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Complete button */}
            <div style={styles.stageInlineActions}>
              <button
                type="button"
                style={activeContractTask.status === "completed" ? styles.button : styles.primaryButton}
                onClick={() => handleContractTaskToggle(activeContractTask.taskId)}
              >
                {activeContractTask.status === "completed"
                  ? language === "ko" ? "다시 확인하기로 표시" : "Mark as not reviewed"
                  : language === "ko" ? "이 항목 확인 완료" : "Mark this item reviewed"}
              </button>
            </div>
          </div>
      ) : null}

      <div style={styles.inlinePanel}>
        <div style={styles.inlinePanelHeader}>
          <div style={styles.budgetLabel}>{language === "ko" ? "계약서 조항 분석" : "Contract clause analysis"}</div>
          <div style={styles.helper}>
            {language === "ko"
              ? "상가 임대차 계약서 원문을 붙여넣으면 위험 조항, 누락 항목, 특이 조건을 먼저 짚어드립니다."
              : "Paste the lease text to flag risky clauses, missing items, and unusual terms before signing."}
          </div>
        </div>
        <div style={styles.aiHelper}>
          {language === "ko"
            ? "법률 자문이 아닌 1차 위험 점검입니다. 긴 계약서는 핵심 조항 중심으로 나눠 검토하는 편이 안전합니다."
            : "This is a first-pass risk review, not legal advice. Review long leases in smaller key-clause sections."}
        </div>
        <textarea
          value={contractText}
          onChange={(event) => setContractText(event.target.value)}
          placeholder={
            language === "ko"
              ? "임대차 계약서 원문을 붙여넣어 보세요. 예: 임대료, 원상복구, 권리금, 해지 조항..."
              : "Paste the lease text here. Focus on rent, restoration, key money, termination, and renewal clauses."
          }
          style={{ ...styles.textarea, ...styles.aiTextarea }}
        />
        <div style={styles.aiHelper}>
          {language === "ko"
            ? "최소 100자 이상, 10,000자 이하의 텍스트를 권장합니다."
            : "Use at least 100 characters and keep the text under 10,000 characters."}
        </div>
        <div style={styles.stageInlineActions}>
          <button
            type="button"
            style={{ ...styles.button, ...(contractText.trim() ? styles.surfaceNavButtonSelected : {}) }}
            onClick={handleContractAnalysis}
            disabled={!contractText.trim() || contractAnalysisStatus === "loading"}
          >
            {contractAnalysisStatus === "loading"
              ? language === "ko"
                ? "분석 중..."
                : "Analyzing..."
              : language === "ko"
                ? "계약서 분석하기"
                : "Analyze contract"}
          </button>
        </div>
        {contractAnalysisError ? <div style={styles.warningText}>{contractAnalysisError}</div> : null}
        {effectiveContractAnalysis ? (
          <div style={{ ...styles.inlinePanel, ...styles.aiInlinePanel }}>
            <div style={styles.inlinePanelMetaRow}>
              <div style={styles.budgetLabel}>
                {language === "ko" ? "AI 해석 · 계약서 원문 기반" : "AI interpretation · grounded in contract text"}
              </div>
              <div style={styles.confidenceBadge}>
                {language === "ko"
                  ? effectiveContractAnalysis.riskLevel === "critical"
                    ? "위험 높음"
                    : effectiveContractAnalysis.riskLevel === "high"
                      ? "주의 필요"
                      : effectiveContractAnalysis.riskLevel === "medium"
                        ? "검토 권장"
                        : "기본 확인"
                  : effectiveContractAnalysis.riskLevel}
              </div>
            </div>
            <div style={styles.inlinePanelHeader}>
              <div style={styles.budgetLabel}>{language === "ko" ? "한 줄 요약" : "Summary"}</div>
              <div style={styles.optionTitle}>{effectiveContractAnalysis.summary}</div>
            </div>
            {effectiveContractAnalysis.flaggedClauses.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "위험 조항" : "Flagged clauses"}</div>
                {effectiveContractAnalysis.flaggedClauses.slice(0, 3).map((clause) => (
                  <div key={`${clause.excerpt}-${clause.issue}`} style={styles.budgetPanel}>
                    <div style={styles.optionSummary}>{clause.excerpt}</div>
                    <div style={clause.severity === "danger" ? styles.criticalText : styles.warningText}>
                      {clause.issue}
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {effectiveContractAnalysis.missingItems.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "누락 확인 항목" : "Missing checks"}</div>
                {effectiveContractAnalysis.missingItems.slice(0, 3).map((item) => (
                  <div key={item} style={styles.aiHelper}>• {item}</div>
                ))}
              </>
            ) : null}
            {effectiveContractAnalysis.unusualTerms.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "특이 조건" : "Unusual terms"}</div>
                {effectiveContractAnalysis.unusualTerms.slice(0, 3).map((item) => (
                  <div key={item} style={styles.aiHelper}>• {item}</div>
                ))}
              </>
            ) : null}
            <div style={styles.budgetLabel}>{language === "ko" ? "다음 행동" : "Next actions"}</div>
            {effectiveContractAnalysis.nextActions.slice(0, 3).map((item) => (
              <div key={item} style={styles.aiHelper}>• {item}</div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={styles.stageFooter}>
        {prevTraversedStage ? (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        ) : null}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: contractTasks.every((task) => task.status === "completed") ? 1 : 0.45
          }}
          onClick={handleContractContinue}
          disabled={!contractTasks.every((task) => task.status === "completed")}
        >
          {copy.home.completeContractReview}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
