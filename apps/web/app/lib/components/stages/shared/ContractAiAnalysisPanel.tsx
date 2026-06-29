"use client";

/**
 * ContractAiAnalysisPanel — 계약서 AI 분석 패널(웹).
 *
 * contract-review 마무리 페이지의 interactive ref="contractAiAnalysis".
 * iOS BUContractAnalysisCard 와 동일 기능(web↔iOS). DashboardContext 의 계약 분석 상태 재사용.
 * 원본: 구 selection/ContractReviewStage.tsx 의 AI 분석 섹션(SSOT 전환으로 분해).
 */

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

export function ContractAiAnalysisPanel({ ko }: { ko: boolean }) {
  const {
    contractText,
    setContractText,
    contractAnalysisStatus,
    handleContractAnalysis,
    contractAnalysisError,
    effectiveContractAnalysis,
  } = useDashboardCtx();

  return (
    <div style={styles.inlinePanel}>
      <div style={styles.inlinePanelHeader}>
        <div style={styles.budgetLabel}>{ko ? "계약서 조항 분석" : "Contract clause analysis"}</div>
        <div style={styles.helper}>
          {ko
            ? "상가 임대차 계약서 원문을 붙여넣으면 위험 조항, 누락 항목, 특이 조건을 먼저 짚어드립니다."
            : "Paste the lease text to flag risky clauses, missing items, and unusual terms before signing."}
        </div>
      </div>
      <div style={styles.aiHelper}>
        {ko
          ? "법률 자문이 아닌 1차 위험 점검입니다. 긴 계약서는 핵심 조항 중심으로 나눠 검토하는 편이 안전합니다."
          : "This is a first-pass risk review, not legal advice. Review long leases in smaller key-clause sections."}
      </div>
      <textarea
        value={contractText}
        onChange={(event) => setContractText(event.target.value)}
        placeholder={
          ko
            ? "임대차 계약서 원문을 붙여넣어 보세요. 예: 임대료, 원상복구, 권리금, 해지 조항..."
            : "Paste the lease text here. Focus on rent, restoration, key money, termination, and renewal clauses."
        }
        style={{ ...styles.textarea, ...styles.aiTextarea }}
      />
      <div style={styles.aiHelper}>
        {ko
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
            ? ko ? "분석 중..." : "Analyzing..."
            : ko ? "계약서 분석하기" : "Analyze contract"}
        </button>
      </div>
      {contractAnalysisError ? <div style={styles.warningText}>{contractAnalysisError}</div> : null}
      {effectiveContractAnalysis ? (
        <div style={{ ...styles.inlinePanel, ...styles.aiInlinePanel }}>
          <div style={styles.inlinePanelMetaRow}>
            <div style={styles.budgetLabel}>
              {ko ? "AI 해석 · 계약서 원문 기반" : "AI interpretation · grounded in contract text"}
            </div>
            <div style={styles.confidenceBadge}>
              {ko
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
            <div style={styles.budgetLabel}>{ko ? "한 줄 요약" : "Summary"}</div>
            <div style={styles.optionTitle}>{effectiveContractAnalysis.summary}</div>
          </div>
          {effectiveContractAnalysis.flaggedClauses.length > 0 ? (
            <>
              <div style={styles.budgetLabel}>{ko ? "위험 조항" : "Flagged clauses"}</div>
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
              <div style={styles.budgetLabel}>{ko ? "누락 확인 항목" : "Missing checks"}</div>
              {effectiveContractAnalysis.missingItems.slice(0, 3).map((item) => (
                <div key={item} style={styles.aiHelper}>• {item}</div>
              ))}
            </>
          ) : null}
          {effectiveContractAnalysis.unusualTerms.length > 0 ? (
            <>
              <div style={styles.budgetLabel}>{ko ? "특이 조건" : "Unusual terms"}</div>
              {effectiveContractAnalysis.unusualTerms.slice(0, 3).map((item) => (
                <div key={item} style={styles.aiHelper}>• {item}</div>
              ))}
            </>
          ) : null}
          <div style={styles.budgetLabel}>{ko ? "다음 행동" : "Next actions"}</div>
          {effectiveContractAnalysis.nextActions.slice(0, 3).map((item) => (
            <div key={item} style={styles.aiHelper}>• {item}</div>
          ))}
          <div
            style={{
              ...styles.aiHelper,
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px solid rgba(0,0,0,0.08)",
              lineHeight: 1.6,
            }}
          >
            {ko
              ? "이 분석은 AI가 입력하신 계약서 텍스트만 보고 1차로 짚어드린 결과라 오류나 빠진 부분이 있을 수 있습니다. 참고용으로만 활용하시고, 서명 여부에 대한 최종 판단과 책임은 본인에게 있습니다. 금액이 크거나 중요한 계약은 변호사·공인노무사·가맹거래사 등 전문가 검토를 함께 받으시길 권장합니다."
              : "This is an AI first-pass based only on the text you pasted, so it may contain errors or gaps. Use it for reference only — the final decision and responsibility for signing rest with you. For high-value or important contracts, we recommend additional review by a lawyer or licensed professional."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
