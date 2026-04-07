"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  formatKRW,
  formatMarketMetaValue,
  getRiskLevelLabel,
  getFreshnessPresentation,
  localizeGuideRecord,
} from "@build-up/shared";
import { formatBreakEvenMonth } from "../../helpers";
import { styles } from "../../styles";
import { useRouter } from "next/navigation";

export function GuidesView() {
  const d = useDashboardCtx();
  const router = useRouter();
  const {
    language,
    copy,
    showFinancePanel,
    setShowFinancePanel,
    financeCapitalText,
    setFinanceCapitalText,
    financeMonthlyRentText,
    setFinanceMonthlyRentText,
    financeLaborText,
    setFinanceLaborText,
    financeRevenueText,
    setFinanceRevenueText,
    financeMarketStyle,
    setFinanceMarketStyle,
    financeRentBand,
    setFinanceRentBand,
    financeStatus,
    financeError,
    financeResult,
    financeInterpretation,
    handleRunFinancialSimulation,
    financeDefaults,
    savedFinanceSnapshot,
    permitGuides,
    taxGuides,
    loanGuides,
    selectedIndustryLabel,
  } = d;

  return (
    <section style={styles.section}>
      <article style={styles.financePanel}>
        <div style={styles.financePanelHeader}>
          <div style={styles.sectionTitle}>{language === "ko" ? "재무 시뮬레이션" : "Financial simulation"}</div>
          <div style={styles.financePanelTitle}>
            {language === "ko"
              ? "숫자로 먼저 보고, 해석은 AI가 돕습니다."
              : "Start with the numbers, then let AI interpret them."}
          </div>
          <div style={styles.financePanelBody}>
            {language === "ko"
              ? "선택한 업종과 거점 조건을 바탕으로 손익분기, 버틸 수 있는 개월 수, 초기 투자 후 운전자금을 먼저 계산합니다."
              : "Use your chosen category and location assumptions to estimate break-even, runway, and operating cash after setup."}
          </div>
        </div>

        <div style={styles.inlinePanel}>
          <div style={styles.inlinePanelMetaRow}>
            <div style={styles.homePanelEyebrow}>
              <span>{language === "ko" ? "입력" : "Inputs"}</span>
            </div>
            <button type="button" style={styles.button} onClick={() => setShowFinancePanel((value) => !value)}>
              {showFinancePanel
                ? language === "ko" ? "접기" : "Show less"
                : language === "ko" ? "시뮬레이션 열기" : "Open simulation"}
            </button>
          </div>

          {showFinancePanel ? (
            <>
              {savedFinanceSnapshot && !financeResult ? (
                <div style={styles.financeInlineNote}>
                  {language === "ko"
                    ? `최근 저장된 분석이 있습니다${savedFinanceSnapshot.savedAt ? ` · ${new Date(savedFinanceSnapshot.savedAt).toLocaleDateString("ko-KR")}` : ""}`
                    : `A saved analysis is available${savedFinanceSnapshot.savedAt ? ` · ${new Date(savedFinanceSnapshot.savedAt).toLocaleDateString("en-US")}` : ""}`}
                </div>
              ) : null}

              <div style={styles.financeFieldGrid}>
                <div style={styles.financeField}>
                  <div style={styles.financeFieldLabel}>{language === "ko" ? "자본금 (만원)" : "Capital (10k KRW)"}</div>
                  <input
                    value={financeCapitalText}
                    onChange={(event) => setFinanceCapitalText(event.target.value.replace(/[^\d]/g, ""))}
                    style={styles.textInput}
                    placeholder={language === "ko" ? "예: 8000" : "Ex: 8000"}
                    inputMode="numeric"
                  />
                </div>
                <div style={styles.financeField}>
                  <div style={styles.financeFieldLabel}>{language === "ko" ? "시장 성격" : "Market style"}</div>
                  <div style={styles.segmentedRow}>
                    {(["destination", "office", "residential", "balanced"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        style={{
                          ...styles.button,
                          ...(financeMarketStyle === value ? styles.buttonSelected : {})
                        }}
                        onClick={() => setFinanceMarketStyle(value)}
                      >
                        {formatMarketMetaValue("marketStyle", value, language)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={styles.financeField}>
                  <div style={styles.financeFieldLabel}>{language === "ko" ? "월 임대료 (만원, 선택)" : "Monthly rent (10k KRW, optional)"}</div>
                  <input
                    value={financeMonthlyRentText}
                    onChange={(event) => setFinanceMonthlyRentText(event.target.value.replace(/[^\d]/g, ""))}
                    style={styles.textInput}
                    placeholder={language === "ko" ? "비워두면 업종 평균 반영" : "Leave blank to use benchmark"}
                    inputMode="numeric"
                  />
                </div>
                <div style={styles.financeField}>
                  <div style={styles.financeFieldLabel}>{language === "ko" ? "임대료 구간" : "Rent band"}</div>
                  <div style={styles.segmentedRow}>
                    {(["low", "mid-low", "mid", "mid-high", "high"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        style={{
                          ...styles.button,
                          ...(financeRentBand === value ? styles.buttonSelected : {})
                        }}
                        onClick={() => setFinanceRentBand(value)}
                      >
                        {formatMarketMetaValue("rentBand", value, language)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={styles.financeField}>
                  <div style={styles.financeFieldLabel}>{language === "ko" ? "월 인건비 (만원, 선택)" : "Monthly labor cost (10k KRW, optional)"}</div>
                  <input
                    value={financeLaborText}
                    onChange={(event) => setFinanceLaborText(event.target.value.replace(/[^\d]/g, ""))}
                    style={styles.textInput}
                    placeholder={language === "ko" ? "예: 250" : "Ex: 250"}
                    inputMode="numeric"
                  />
                </div>
                <div style={styles.financeField}>
                  <div style={styles.financeFieldLabel}>{language === "ko" ? "예상 월 매출 (만원, 선택)" : "Expected monthly revenue (10k KRW, optional)"}</div>
                  <input
                    value={financeRevenueText}
                    onChange={(event) => setFinanceRevenueText(event.target.value.replace(/[^\d]/g, ""))}
                    style={styles.textInput}
                    placeholder={language === "ko" ? "비워두면 보수적 기준 반영" : "Leave blank for conservative benchmark"}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div style={styles.financeAssistText}>
                {language === "ko"
                  ? `현재 선택 기준: ${selectedIndustryLabel} · ${formatMarketMetaValue("marketStyle", financeDefaults.marketStyle, language)} · ${formatMarketMetaValue("rentBand", financeDefaults.rentBand, language)}`
                  : `Based on your current setup: ${selectedIndustryLabel} · ${formatMarketMetaValue("marketStyle", financeDefaults.marketStyle, language)} · ${formatMarketMetaValue("rentBand", financeDefaults.rentBand, language)}`}
              </div>

              <div style={styles.stageInlineActions}>
                <button
                  type="button"
                  style={{ ...styles.primaryButton, opacity: financeStatus === "loading" ? 0.65 : 1 }}
                  disabled={financeStatus === "loading"}
                  onClick={handleRunFinancialSimulation}
                >
                  {financeStatus === "loading"
                    ? language === "ko" ? "계산 중..." : "Running..."
                    : language === "ko" ? "시뮬레이션 실행" : "Run simulation"}
                </button>
              </div>

              {financeError ? <div style={styles.warningText}>{financeError}</div> : null}

              {financeResult || savedFinanceSnapshot ? (
                <div style={styles.inlinePanel}>
                  <div style={styles.inlinePanelMetaRow}>
                    <div style={styles.homePanelEyebrow}>
                      <span>{language === "ko" ? "결과" : "Results"}</span>
                    </div>
                    <div style={styles.freshnessText}>
                      {getRiskLevelLabel((financeResult ?? savedFinanceSnapshot)!.riskLevel, language)}
                    </div>
                  </div>

                  <div style={styles.financeResultGrid}>
                    <div style={styles.financeResultCard}>
                      <div style={styles.financeResultLabel}>{language === "ko" ? "버틸 수 있는 기간" : "Runway"}</div>
                      <div style={styles.financeResultValue}>
                        {language === "ko"
                          ? `${(financeResult ?? savedFinanceSnapshot)!.survivabilityMonths}개월`
                          : `${(financeResult ?? savedFinanceSnapshot)!.survivabilityMonths} months`}
                      </div>
                    </div>
                    <div style={styles.financeResultCard}>
                      <div style={styles.financeResultLabel}>{language === "ko" ? "손익분기 시점" : "Break-even"}</div>
                      <div style={styles.financeResultValue}>
                        {formatBreakEvenMonth(
                          financeResult
                            ? financeResult.breakEven.estimatedBreakEvenMonth
                            : savedFinanceSnapshot!.breakEvenMonth,
                          language
                        )}
                      </div>
                    </div>
                    <div style={styles.financeResultCard}>
                      <div style={styles.financeResultLabel}>{language === "ko" ? "손익분기 월매출" : "Break-even revenue"}</div>
                      <div style={styles.financeResultValue}>
                        {formatKRW(
                          financeResult
                            ? financeResult.breakEven.monthlyBreakEvenRevenue
                            : savedFinanceSnapshot!.breakEvenRevenue
                        )}
                      </div>
                    </div>
                    <div style={styles.financeResultCard}>
                      <div style={styles.financeResultLabel}>{language === "ko" ? "초기 투자 후 운전자금" : "Operating cash"}</div>
                      <div style={styles.financeResultValue}>
                        {formatKRW(
                          financeResult
                            ? financeResult.capitalAfterSetup.low
                            : savedFinanceSnapshot!.capitalAfterSetupLow
                        )}{" "}
                        ~{" "}
                        {formatKRW(
                          financeResult
                            ? financeResult.capitalAfterSetup.high
                            : savedFinanceSnapshot!.capitalAfterSetupHigh
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.financeInlineNote}>
                    {language === "ko"
                      ? `월 고정비 ${formatKRW(
                          financeResult
                            ? financeResult.resolvedCosts.totalMonthlyFixed
                            : savedFinanceSnapshot!.totalMonthlyFixed
                        )} · 적용 원가율 ${
                          financeResult
                            ? financeResult.resolvedCosts.cogsRate
                            : savedFinanceSnapshot!.cogsRate
                        }%`
                      : `Monthly fixed costs ${formatKRW(
                          financeResult
                            ? financeResult.resolvedCosts.totalMonthlyFixed
                            : savedFinanceSnapshot!.totalMonthlyFixed
                        )} · COGS ${
                          financeResult
                            ? financeResult.resolvedCosts.cogsRate
                            : savedFinanceSnapshot!.cogsRate
                        }%`}
                  </div>

                  {financeInterpretation || savedFinanceSnapshot?.interpretation ? (
                    <div style={styles.inlinePanel}>
                      <div style={styles.inlinePanelMetaRow}>
                        <div style={styles.homePanelEyebrow}>
                          <span>{language === "ko" ? "AI 해석" : "AI interpretation"}</span>
                        </div>
                      </div>
                      <div style={styles.optionTitle}>{(financeInterpretation ?? savedFinanceSnapshot?.interpretation)!.summary}</div>
                      {(financeInterpretation ?? savedFinanceSnapshot?.interpretation)!.rationale.length > 0 ? (
                        <div style={styles.homePrincipleGrid}>
                          {(financeInterpretation ?? savedFinanceSnapshot?.interpretation)!.rationale.slice(0, 3).map((item) => (
                            <div key={item} style={styles.homePrincipleCard}>
                              <div style={styles.homePrincipleBody}>{item}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {(financeInterpretation ?? savedFinanceSnapshot?.interpretation)!.warnings.length > 0 ? (
                        <div style={styles.homePrincipleGrid}>
                          {(financeInterpretation ?? savedFinanceSnapshot?.interpretation)!.warnings.slice(0, 3).map((item) => (
                            <div key={item} style={styles.warningText}>{item}</div>
                          ))}
                        </div>
                      ) : null}
                      {(financeInterpretation ?? savedFinanceSnapshot?.interpretation)!.nextActions.length > 0 ? (
                        <div style={styles.homePrincipleGrid}>
                          {(financeInterpretation ?? savedFinanceSnapshot?.interpretation)!.nextActions.slice(0, 3).map((item) => (
                            <div key={item} style={styles.homePrincipleCard}>
                              <div style={styles.homePrincipleBody}>{item}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </article>

      <div style={styles.roadmapRowTop}>
        <div style={styles.sectionTitle}>{copy.home.operationalGuides}</div>
      </div>
      {(() => {
        const ko = language === "ko";
        const domainGroups = [
          {
            label: ko ? "인허가" : "Permit",
            color: "#ff9f0a",
            guides: permitGuides,
            emptyMsg: copy.home.noPermitGuide
          },
          {
            label: ko ? "세무" : "Tax",
            color: "#007aff",
            guides: taxGuides,
            emptyMsg: copy.home.noTaxGuide
          },
          {
            label: ko ? "대출·자금" : "Loan",
            color: "#34c759",
            guides: loanGuides,
            emptyMsg: copy.home.noLoanGuide
          }
        ];
        return (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "20px" }}>
            {domainGroups.map((group) => (
              <div key={group.label} style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: group.color, flexShrink: 0 }} />
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase" as const }}>
                    {group.label}
                  </div>
                </div>
                {group.guides.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "var(--muted)", padding: "8px 0" }}>{group.emptyMsg}</div>
                ) : (
                  group.guides.map((rawGuide) => {
                    const guide = localizeGuideRecord(rawGuide, language);
                    const freshness = getFreshnessPresentation(guide.freshness);
                    return (
                      <article
                        key={guide.id}
                        style={{ ...styles.step, cursor: "pointer", borderLeft: `3px solid ${group.color}22` }}
                        onClick={() => router.push(`/guide/${guide.id}`)}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <div style={styles.stepTitle}>{guide.title}</div>
                          <div style={{
                            fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px", flexShrink: 0,
                            background: freshness.tone === "critical" ? "rgba(255,59,48,0.08)" : freshness.tone === "warning" ? "rgba(255,159,10,0.08)" : "rgba(52,199,89,0.08)",
                            color: freshness.tone === "critical" ? "#ff3b30" : freshness.tone === "warning" ? "#ff9f0a" : "#34c759"
                          }}>
                            {freshness.tone === "critical" ? (ko ? "정보 낮음" : "Stale") : freshness.tone === "warning" ? (ko ? "곧 재검토" : "Review soon") : (ko ? "최신" : "Fresh")}
                          </div>
                        </div>
                        {guide.summary && <div style={styles.stepBody}>{guide.summary}</div>}
                        {guide.sources[0] && (
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {ko ? "출처" : "Source"}: {guide.sources[0].sourceName} · {ko ? "확인" : "Verified"} {guide.sources[0].verifiedAt?.slice(0, 10)}
                          </div>
                        )}
                        <div style={{ fontSize: "12px", color: group.color, fontWeight: 600 }}>{ko ? "읽기 →" : "Read →"}</div>
                      </article>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        );
      })()}
    </section>
  );
}
