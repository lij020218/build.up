"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  getFranchiseBenchmark, getIndustryBenchmark, getFranchiseBrandById,
  FRANCHISE_BENCHMARK_PROVENANCE,
  FEATURES_BY_ID, type FeatureCatalogItem,
} from "@foundone/shared";

type ActionEvidenceItem = { text: string };

/**
 * "왜 이렇게 판단?" — AI 가 판단에 사용한 데이터 포인트를 펼쳐 보여주는 drawer.
 * Bezos "Disagree-and-commit 의 전제는 데이터" — 신뢰의 시작은 근거 노출.
 */
function EvidenceDrawer({ ko, evidence, idPrefix, inset = true }: { ko: boolean; evidence: ActionEvidenceItem[]; idPrefix: string; inset?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!evidence || evidence.length === 0) return null;
  return (
    <div style={{ marginLeft: inset ? "36px" : 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${idPrefix}-evidence`}
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "4px 10px", borderRadius: "999px",
          border: "1px solid rgba(15,23,42,0.08)",
          background: open ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.7)",
          fontSize: "11px", fontWeight: 620, color: "rgba(15,23,42,0.6)",
          cursor: "pointer", letterSpacing: "-0.005em",
          transition: "background 0.12s ease",
        }}
      >
        <FileText size={11} strokeWidth={1.7} />
        <span>{ko ? `왜 이렇게 판단? · 근거 ${evidence.length}` : `Why this? · ${evidence.length} cite${evidence.length > 1 ? "s" : ""}`}</span>
        {open ? <ChevronUp size={11} strokeWidth={2} /> : <ChevronDown size={11} strokeWidth={2} />}
      </button>
      {open && (
        <div
          id={`${idPrefix}-evidence`}
          style={{
            marginTop: "6px",
            padding: "9px 12px",
            borderRadius: "10px",
            background: "rgba(15,23,42,0.025)",
            border: "1px solid rgba(15,23,42,0.05)",
            display: "grid", gap: "5px",
          }}
        >
          {evidence.map((e, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: "7px", alignItems: "flex-start",
                fontSize: "11.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.5,
              }}
            >
              <span style={{ color: "rgba(15,23,42,0.35)", fontWeight: 700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {i + 1}.
              </span>
              <span>{e.text}</span>
            </div>
          ))}
          <div style={{ marginTop: "3px", fontSize: "10px", color: "rgba(15,23,42,0.4)", lineHeight: 1.4 }}>
            {ko ? "AI 가 컨텍스트에서 직접 인용한 데이터 — 환각 방지 검증 통과" : "Cited directly from your context — hallucination-checked"}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AI 가 추천한 feature 를 클릭했을 때 실행되는 navigation.
 * starter-stage-demo 의 navigation listener 가 이 이벤트를 받아 surface 전환 + scroll 처리.
 */
function navigateToFeature(feature: FeatureCatalogItem) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("bup:navigate-feature", {
      detail: { surface: feature.surface, scrollTargetId: feature.scrollTargetId },
    }),
  );
}

export function AiCoachCard() {
  const d = useDashboardCtx();
  const {
    language, businessLaunched, aiActions, aiActionsLoading, fetchAiActions,
    dailyEntries, selectedFranchiseBrandId, selectedIndustryCategoryId,
  } = d;

  const ko = language === "ko";

  if (!businessLaunched) return null;
  const hasError = !aiActions && !aiActionsLoading;

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
      <div style={{ padding: "18px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "2px" }}>
            {ko ? "AI \ucf54\uce58" : "AI Coach"}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
            {ko ? "\uc624\ub298 \ud560 \uc77c" : "Today's Actions"}
          </div>
        </div>
        <button type="button" onClick={() => { void fetchAiActions(true); }} disabled={aiActionsLoading}
          style={{ fontSize: "11px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", opacity: aiActionsLoading ? 0.4 : 1 }}>
          {aiActionsLoading ? (ko ? "\ubd84\uc11d \uc911..." : "Loading...") : (ko ? "\uc0c8\ub85c\uace0\uce68" : "Refresh")}
        </button>
      </div>

      {hasError && (
        <div style={{ padding: "12px 22px 20px" }}>
          <div style={{
            padding: "20px", borderRadius: "16px",
            background: "rgba(25,25,112,0.04)",
            border: "1px solid rgba(25,25,112,0.1)",
            textAlign: "center" as const,
          }}>
            <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a", marginBottom: "6px" }}>
              {ko ? "AI 코칭을 불러올 수 없습니다" : "Could not load AI coaching"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", marginBottom: "12px" }}>
              {ko ? "네트워크 연결을 확인하고 다시 시도해주세요" : "Check your connection and try again"}
            </div>
            <button type="button" onClick={() => { void fetchAiActions(true); }} style={{
              padding: "8px 16px", borderRadius: "8px",
              border: "1px solid rgba(15,23,42,0.1)", background: "#fff",
              fontSize: "13px", fontWeight: 620, cursor: "pointer",
            }}>
              {ko ? "다시 시도" : "Retry"}
            </button>
          </div>
        </div>
      )}

      {aiActionsLoading && !aiActions && (
        <div style={{ padding: "20px 22px 24px", textAlign: "center" as const }}>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>{ko ? "\uacbd\uc601 \ub370\uc774\ud130\ub97c \ubd84\uc11d\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4..." : "Analyzing your business data..."}</div>
        </div>
      )}

      {aiActions && (
        <>
          {/* \ud55c \uc904 \uc778\uc0ac\uc774\ud2b8 */}
          {aiActions.insight && (
            <div style={{ padding: "0 22px 12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", lineHeight: 1.5 }}>
                {aiActions.insight}
              </div>
            </div>
          )}

          {/* \ud504\ub79c\ucc28\uc774\uc988/\uc5c5\uc885 \ubca4\uce58\ub9c8\ud06c \ube44\uad50 \ubc14 */}
          {(() => {
            const fBench = selectedFranchiseBrandId ? getFranchiseBenchmark(selectedFranchiseBrandId) : null;
            const iBench = selectedIndustryCategoryId ? getIndustryBenchmark(selectedIndustryCategoryId) : null;
            const userMonthly = (dailyEntries as { sales: number }[]).reduce((s, e) => s + e.sales, 0);
            const userMonthlyMan = Math.round(userMonthly / 10000);
            const benchAvg = fBench?.avgMonthlyRevenue ?? (iBench ? Math.round(iBench.avgAnnualRevenue / 12) : 0);
            const benchTop = fBench?.topStoreMonthlyRevenue ?? (iBench ? Math.round(iBench.top10PctRevenue / 12) : 0);
            const benchLabel = fBench ? (getFranchiseBrandById(selectedFranchiseBrandId!)?.name?.[language] ?? selectedFranchiseBrandId) : (ko ? "\uc5c5\uc885 \ud3c9\uade0" : "Industry avg");

            if (!benchAvg || userMonthly === 0) return null;

            const pct = Math.min(Math.round((userMonthlyMan / benchTop) * 100), 100);
            const avgPct = Math.min(Math.round((benchAvg / benchTop) * 100), 100);
            const barColor = userMonthlyMan >= benchAvg ? "#1d3557" : userMonthlyMan >= benchAvg * 0.7 ? "#191970" : "#b64c4c";

            return (
              <div style={{ padding: "0 22px 14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>
                  {fBench ? (ko ? `${benchLabel} \uac19\uc740 \ube0c\ub79c\ub4dc \ube44\uad50` : `vs ${benchLabel} stores`) : (ko ? "\uc5c5\uc885 \ub0b4 \ud3ec\uc9c0\uc158" : "Industry position")}
                </div>
                {/* \ube44\uad50 \ubc14 */}
                <div style={{ position: "relative" as const, height: "28px", borderRadius: "8px", background: "rgba(0,0,0,0.03)", overflow: "hidden" }}>
                  {/* \ud3c9\uade0 \ub9c8\ucee4 */}
                  <div style={{ position: "absolute" as const, left: `${avgPct}%`, top: 0, bottom: 0, width: "1.5px", background: "rgba(0,0,0,0.15)", zIndex: 2 }} />
                  <div style={{ position: "absolute" as const, left: `${Math.max(avgPct - 3, 0)}%`, top: "-1px", fontSize: "9px", fontWeight: 700, color: "var(--muted)" }}>
                    {ko ? "\ud3c9\uade0" : "Avg"}
                  </div>
                  {/* \uc0ac\uc6a9\uc790 \ubc14 */}
                  <div style={{
                    position: "absolute" as const, left: 0, top: "10px", bottom: "4px", width: `${pct}%`,
                    borderRadius: "6px", background: barColor, transition: "width 0.6s ease",
                    minWidth: "4px",
                  }} />
                </div>
                {/* \ub808\uc774\ube14 */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "var(--muted)" }}>
                  <span>{ko ? `\ub0b4 \ub9e4\uc7a5 ${userMonthlyMan.toLocaleString()}\ub9cc` : `You ${userMonthlyMan.toLocaleString()}\ub9cc`}</span>
                  <span>{ko ? `\uc0c1\uc704 \ucd94\uc815 ${benchTop.toLocaleString()}\ub9cc` : `Top est. ${benchTop.toLocaleString()}\ub9cc`}</span>
                </div>
                {/* \ucd9c\ucc98\u00b7\uc5f0\ub3c4\u00b7\ucd94\uc815 \ub77c\ubca8 (\uc815\uc9c1\uc131) */}
                {(() => {
                  const yr = fBench?.yearReported ?? FRANCHISE_BENCHMARK_PROVENANCE.disclosureYear;
                  // \uacbd\ub85c\ubcc4 \uc815\ud655\ud55c \uce90\ube44\uc5c7: \ud504\ub79c\ucc28\uc774\uc988=\uc0c1\uc704\ub9e4\uc7a5 \ubaa8\ub378\ucd94\uc815(+\ube0c\ub79c\ub4dc \ucd94\uc815), \uc5c5\uc885=\uc0c1\u00b7\ud558\uc704 \ubd84\ud3ec\ucd94\uc815
                  const caveatKo = fBench
                    ? `${FRANCHISE_BENCHMARK_PROVENANCE.modeledNoteKo}${fBench.isEstimate ? " " + FRANCHISE_BENCHMARK_PROVENANCE.estimateNoteKo : ""}`
                    : "\uc0c1\u00b7\ud558\uc704 \uad6c\uac04\uc740 \ubd84\ud3ec \ucd94\uc815\uce58\uc785\ub2c8\ub2e4.";
                  const caveatEn = fBench
                    ? `Top-store figure is modeled (avg \u00d7 multiplier), not an actual store.${fBench.isEstimate ? " Brand revenue is estimated." : ""}`
                    : "Upper/lower bands are distribution estimates.";
                  return (
                    <div style={{ marginTop: "6px", fontSize: "9.5px", lineHeight: 1.45, color: "rgba(15,23,42,0.4)" }}>
                      {ko
                        ? `\u203b \uae30\uc900 ${yr}\ub144 \u00b7 ${FRANCHISE_BENCHMARK_PROVENANCE.source}`
                        : `* As of ${yr} \u00b7 Korea FTC franchise disclosures \u00b7 SEMAS survey`}
                      <br />
                      {ko ? caveatKo : caveatEn}
                    </div>
                  );
                })()}
                {/* \uc0c1\uc704 \ub9e4\uc7a5 \ube44\uacb0 (\ud504\ub79c\ucc28\uc774\uc988\ub9cc) */}
                {fBench?.operationalInsights?.[0] && (
                  <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "10px", background: "rgba(0,122,255,0.03)", border: "0.5px solid rgba(0,122,255,0.08)" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#007aff", marginBottom: "2px" }}>
                      {ko ? "\uc0c1\uc704 \ub9e4\uc7a5 \ube44\uacb0" : "Top store insight"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text)", lineHeight: 1.4 }}>
                      {fBench.operationalInsights[0]}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* \uc624\ub298 \ud560 \uc77c 3\uac00\uc9c0 */}
          <div style={{ padding: "0 22px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            {aiActions.todayActions.map((action, i) => {
              const feature = action.feature ? FEATURES_BY_ID[action.feature] : undefined;
              return (
              <div key={i} style={{
                display: "flex", flexDirection: "column" as const, gap: "10px",
                padding: "12px 14px", borderRadius: "14px",
                background: action.priority === "high" ? "rgba(0,122,255,0.04)" : "rgba(0,0,0,0.02)",
                border: action.priority === "high" ? "0.5px solid rgba(0,122,255,0.1)" : "0.5px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "8px", flexShrink: 0,
                    background: action.priority === "high" ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 700, color: action.priority === "high" ? "#007aff" : "var(--muted)",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{action.title}</div>
                      {/* 정량 ROI 배지 — "줄이세요" 가 아니라 "예상 +X" */}
                      {action.estimatedImpactWon != null && action.estimatedImpactWon > 0 && (
                        <span style={{
                          fontSize: "10.5px", fontWeight: 700, color: "#0d9488",
                          background: "rgba(45,212,191,0.1)", border: "0.5px solid rgba(45,212,191,0.28)",
                          borderRadius: "6px", padding: "1px 7px", whiteSpace: "nowrap" as const,
                        }}>
                          {ko
                            ? `예상 +${Math.round(action.estimatedImpactWon / 10000).toLocaleString()}만`
                            : `Est. +${Math.round(action.estimatedImpactWon / 10000).toLocaleString()}만`}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{action.reason}</div>
                  </div>
                </div>

                {/* AI \uac00 \ucd94\ucc9c\ud55c Found.One \uae30\ub2a5 \u2014 \ud074\ub9ad \uc2dc \ud574\ub2f9 surface \ub85c \uc774\ub3d9 */}
                {feature && (
                  <button
                    type="button"
                    onClick={() => navigateToFeature(feature)}
                    style={{
                      alignSelf: "flex-start" as const,
                      marginLeft: "36px",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "999px",
                      border: "1px solid rgba(45, 212, 191, 0.32)",
                      background: "linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.04) 100%)",
                      color: "#0d9488",
                      fontSize: "11.5px", fontWeight: 650,
                      letterSpacing: "-0.005em",
                      cursor: "pointer",
                      transition: "transform 0.15s ease, background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(2px)";
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(45,212,191,0.18) 0%, rgba(45,212,191,0.08) 100%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.04) 100%)";
                    }}
                  >
                    <span>{ko ? feature.labelKo : feature.labelEn}</span>
                    <ArrowRight size={12} strokeWidth={2.25} />
                  </button>
                )}

                {/* "\uc65c \uc774\ub807\uac8c \ud310\ub2e8?" \u2014 AI \uc758 \ub370\uc774\ud130 \uadfc\uac70 \ud3bc\uce68 */}
                {action.evidence && action.evidence.length > 0 && (
                  <EvidenceDrawer ko={ko} evidence={action.evidence} idPrefix={`today-${i}`} />
                )}
              </div>
              );
            })}
          </div>

          {/* \uc704\uae30 \ud574\uacb0 \ubc29\ubc95 (\uc788\uc744 \ub54c\ub9cc) */}
          {aiActions.crisisActions.length > 0 && (
            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "14px 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#b64c4c", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
                {ko ? "\uc704\uae30 \ub300\uc751 \ubc29\ubc95" : "Crisis Response"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                {aiActions.crisisActions.map((action, i) => {
                  const diffColor = action.difficulty === "easy" ? "#1d3557" : action.difficulty === "hard" ? "#191970" : "#007aff";
                  const diffLabel = action.difficulty === "easy" ? (ko ? "\uc26c\uc6c0" : "Easy") : action.difficulty === "hard" ? (ko ? "\uc5b4\ub824\uc6c0" : "Hard") : (ko ? "\ubcf4\ud1b5" : "Medium");
                  const feature = action.feature ? FEATURES_BY_ID[action.feature] : undefined;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column" as const, gap: "10px", padding: "12px 14px", borderRadius: "14px", background: "rgba(182,76,76,0.03)", border: "0.5px solid rgba(182,76,76,0.08)" }}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{action.title}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{action.impact}</div>
                        </div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: diffColor, padding: "3px 8px", borderRadius: "6px", background: `${diffColor}12`, flexShrink: 0, alignSelf: "flex-start" }}>
                          {diffLabel}
                        </div>
                      </div>

                      {feature && (
                        <button
                          type="button"
                          onClick={() => navigateToFeature(feature)}
                          style={{
                            alignSelf: "flex-start" as const,
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "5px 12px",
                            borderRadius: "999px",
                            border: "1px solid rgba(45, 212, 191, 0.32)",
                            background: "linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.04) 100%)",
                            color: "#0d9488",
                            fontSize: "11.5px", fontWeight: 650,
                            letterSpacing: "-0.005em",
                            cursor: "pointer",
                            transition: "transform 0.15s ease, background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateX(2px)";
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(45,212,191,0.18) 0%, rgba(45,212,191,0.08) 100%)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateX(0)";
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.04) 100%)";
                          }}
                        >
                          <span>{ko ? feature.labelKo : feature.labelEn}</span>
                          <ArrowRight size={12} strokeWidth={2.25} />
                        </button>
                      )}

                      {/* "왜 이렇게 판단?" — 위기 액션의 데이터 근거 (좌측 들여쓰기 X — 위기 카드는 번호 prefix 가 없음) */}
                      {action.evidence && action.evidence.length > 0 && (
                        <EvidenceDrawer ko={ko} evidence={action.evidence} idPrefix={`crisis-${i}`} inset={false} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
