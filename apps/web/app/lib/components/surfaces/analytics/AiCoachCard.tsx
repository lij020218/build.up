"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  getFranchiseBenchmark, getIndustryBenchmark, getFranchiseBrandById,
} from "@build-up/shared";

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
        <button type="button" onClick={fetchAiActions} disabled={aiActionsLoading}
          style={{ fontSize: "11px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", opacity: aiActionsLoading ? 0.4 : 1 }}>
          {aiActionsLoading ? (ko ? "\ubd84\uc11d \uc911..." : "Loading...") : (ko ? "\uc0c8\ub85c\uace0\uce68" : "Refresh")}
        </button>
      </div>

      {hasError && (
        <div style={{ padding: "12px 22px 20px" }}>
          <div style={{
            padding: "20px", borderRadius: "16px",
            background: "rgba(245,158,11,0.04)",
            border: "1px solid rgba(245,158,11,0.1)",
            textAlign: "center" as const,
          }}>
            <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a", marginBottom: "6px" }}>
              {ko ? "AI 코칭을 불러올 수 없습니다" : "Could not load AI coaching"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", marginBottom: "12px" }}>
              {ko ? "네트워크 연결을 확인하고 다시 시도해주세요" : "Check your connection and try again"}
            </div>
            <button type="button" onClick={fetchAiActions} style={{
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
            const barColor = userMonthlyMan >= benchAvg ? "#34c759" : userMonthlyMan >= benchAvg * 0.7 ? "#ff9f0a" : "#ff3b30";

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
                  <span>{ko ? `\uc0c1\uc704 \ub9e4\uc7a5 ${benchTop.toLocaleString()}\ub9cc` : `Top ${benchTop.toLocaleString()}\ub9cc`}</span>
                </div>
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
            {aiActions.todayActions.map((action, i) => (
              <div key={i} style={{
                display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "14px",
                background: action.priority === "high" ? "rgba(0,122,255,0.04)" : "rgba(0,0,0,0.02)",
                border: action.priority === "high" ? "0.5px solid rgba(0,122,255,0.1)" : "0.5px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "8px", flexShrink: 0,
                  background: action.priority === "high" ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 700, color: action.priority === "high" ? "#007aff" : "var(--muted)",
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{action.title}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{action.reason}</div>
                </div>
              </div>
            ))}
          </div>

          {/* \uc704\uae30 \ud574\uacb0 \ubc29\ubc95 (\uc788\uc744 \ub54c\ub9cc) */}
          {aiActions.crisisActions.length > 0 && (
            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "14px 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#ff3b30", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
                {ko ? "\uc704\uae30 \ub300\uc751 \ubc29\ubc95" : "Crisis Response"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                {aiActions.crisisActions.map((action, i) => {
                  const diffColor = action.difficulty === "easy" ? "#34c759" : action.difficulty === "hard" ? "#ff9f0a" : "#007aff";
                  const diffLabel = action.difficulty === "easy" ? (ko ? "\uc26c\uc6c0" : "Easy") : action.difficulty === "hard" ? (ko ? "\uc5b4\ub824\uc6c0" : "Hard") : (ko ? "\ubcf4\ud1b5" : "Medium");
                  return (
                    <div key={i} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255,59,48,0.03)", border: "0.5px solid rgba(255,59,48,0.08)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{action.title}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{action.impact}</div>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: diffColor, padding: "3px 8px", borderRadius: "6px", background: `${diffColor}12`, flexShrink: 0, alignSelf: "flex-start" }}>
                        {diffLabel}
                      </div>
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
