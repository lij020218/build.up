"use client";

import { useRef, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  computeOverallScore,
  formatFranchiseCost,
  formatStartupType,
  getFranchiseBrandById,
  getFranchiseBrandsForCategory,
  getFranchiseBrandsForSubIndustry,
  getScoreColor,
  getScoreLabel,
} from "@build-up/shared";

export function StartupTypeSelectionStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    selectedIndustryId,
    startupType, setStartupType,
    showFranchisePicker, setShowFranchisePicker,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    canCompleteStartupTypeStep, handleStartupTypeContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
  } = d;

  const startupTypeRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  const isStartupCategory = industryCategoryId === "startup-tech";
  const startupTypeOptions: Array<"independent" | "franchise" | "undecided"> = isStartupCategory
    ? ["independent", "undecided"]
    : ["independent", "franchise", "undecided"];

  return (
    <>
      {!showFranchisePicker ? (
        /* ── Screen 1: Choose startup type ── */
        <>
          <div style={styles.helper}>
            {copy.home.startupTypeHelp}
          </div>
          <div ref={startupTypeRef} style={{ display: "grid", gridTemplateColumns: `repeat(${startupTypeOptions.length}, 1fr)`, gap: "10px", ...(shakeWarning ? { outline: "2px solid #dc2626", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
            {startupTypeOptions.map((type) => {
              const ko = language === "ko";
              const selected = startupType === type;
              const config: Record<string, { icon: string; color: string; subtitle: string }> = {
                independent: {
                  icon: industryCategoryId === "startup-tech"
                    ? "M13 10V3L4 14h7v7l9-11h-7z"       // 번개
                    : "M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z", // 별
                  color: "#2563eb",
                  subtitle: industryCategoryId === "startup-tech"
                    ? (ko ? "직접 제품과 회사를 만드는 기술 스타트업입니다" : "Build a product company yourself")
                    : (ko ? "본인이 직접 브랜드와 메뉴를 구성합니다" : "Build your own brand and concept"),
                },
                franchise: {
                  icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v4m4-4v4", // 빌딩
                  color: "#7c3aed",
                  subtitle: ko ? "검증된 브랜드로 빠르게 시작합니다" : "Start fast with a proven brand",
                },
                undecided: {
                  icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 14v.01M12 8a2 2 0 012 2c0 1.5-2 2-2 3", // 물음표
                  color: "#6b7280",
                  subtitle: ko ? "아직 결정하지 않았습니다" : "Haven't decided yet",
                },
              };
              const c = config[type] ?? config.undecided;
              return (
              <button
                key={type}
                type="button"
                style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const,
                  gap: "8px", padding: "32px 20px", borderRadius: "20px", cursor: "pointer", width: "100%",
                  border: selected ? `1.5px solid ${c.color}40` : "1.5px solid rgba(0,0,0,0.04)",
                  background: selected
                    ? `linear-gradient(160deg, ${c.color}10 0%, ${c.color}06 100%)`
                    : "rgba(255,255,255,0.8)",
                  boxShadow: selected ? `0 0 0 3px ${c.color}0c, 0 4px 12px ${c.color}0a` : "none",
                  transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                onClick={() => { setStartupType(type); if (type !== "franchise") { setSelectedFranchiseBrandId(null); setShowFranchisePicker(false); } }}
              >
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  background: selected ? `${c.color}14` : "rgba(0,0,0,0.035)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke={selected ? c.color : "rgba(15,23,42,0.35)"}
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "stroke 0.2s ease" }}>
                    <path d={c.icon} />
                  </svg>
                </div>
                <div style={{ fontSize: "17px", fontWeight: 680, letterSpacing: "-0.02em", color: selected ? c.color : "#0f172a" }}>
                  {formatStartupType(type, language)}
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.5, color: "rgba(15,23,42,0.45)" }}>
                  {c.subtitle}
                </div>
              </button>
            )})}
          </div>

          <div style={styles.stageFooter}>
            {prevTraversedStage ? (
              <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
                {language === "ko" ? "← 이전 단계" : "← Back"}
              </button>
            ) : null}
            <button
              type="button"
              style={{ ...styles.primaryButton, opacity: canCompleteStartupTypeStep ? 1 : 0.45 }}
              onClick={() => {
                if (!canCompleteStartupTypeStep) {
                  setShakeWarning(true);
                  startupTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => setShakeWarning(false), 2000);
                  return;
                }
                handleStartupTypeContinue();
              }}
            >
              {canCompleteStartupTypeStep
                ? (startupType === "franchise"
                    ? (language === "ko" ? "브랜드 선택하기 →" : "Choose brand →")
                    : (language === "ko" ? "이 창업 형태로 계속" : "Use this startup type and continue"))
                : (language === "ko" ? "↑ 창업 형태를 선택하세요" : "↑ Select a startup type")}
            </button>
            <button type="button" style={styles.button} onClick={resetDemo}>
              {copy.common.resetDemo}
            </button>
          </div>
        </>
      ) : (
        /* ── Screen 2: Franchise brand picker ── */
        (() => {
          const brands = (() => { const sub = selectedIndustryId ? getFranchiseBrandsForSubIndustry(selectedIndustryId) : []; return sub.length > 0 ? sub : getFranchiseBrandsForCategory(industryCategoryId); })();
          const ko = language === "ko";
          return (
            <>
              <div style={{ fontSize: "22px", fontWeight: 680, letterSpacing: "-0.03em", marginBottom: "6px" }}>
                {ko ? "프랜차이즈 브랜드 선택" : "Choose a Franchise Brand"}
              </div>
              <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                {ko
                  ? "공정거래위원회 정보공개서 기반 데이터입니다. 점수는 수익성·안정성·진입장벽·브랜드력·본사지원을 종합한 결과입니다."
                  : "Data based on KFTC disclosure. Scores combine profitability, stability, accessibility, brand power, and HQ support."}
              </div>

              {brands.length === 0 ? (
                <div style={{ padding: "24px", borderRadius: "16px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.6)", color: "var(--muted)", textAlign: "center" }}>
                  {ko ? "이 업종에는 아직 등록된 프랜차이즈가 없습니다." : "No franchise brands registered for this industry yet."}
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {brands
                    .sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores))
                    .map((fb) => {
                    const overall = computeOverallScore(fb.scores);
                    const sel = selectedFranchiseBrandId === fb.id;
                    const scoreEntries: { key: string; label: string; value: number }[] = [
                      { key: "profit", label: ko ? "수익성" : "Profit", value: fb.scores.profitability },
                      { key: "stable", label: ko ? "안정성" : "Stability", value: fb.scores.stability },
                      { key: "access", label: ko ? "진입장벽" : "Access", value: fb.scores.accessibility },
                      { key: "brand", label: ko ? "브랜드" : "Brand", value: fb.scores.brandPower },
                      { key: "support", label: ko ? "지원" : "Support", value: fb.scores.support },
                    ];
                    return (
                      <button
                        key={fb.id}
                        type="button"
                        onClick={() => setSelectedFranchiseBrandId(sel ? null : fb.id)}
                        style={{
                          display: "grid",
                          gap: "14px",
                          padding: "20px",
                          borderRadius: "20px",
                          border: sel ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: sel ? "rgba(29,53,87,0.04)" : "rgba(255,255,255,0.82)",
                          boxShadow: sel ? "0 0 0 4px rgba(29,53,87,0.06)" : "0 2px 8px rgba(17,17,17,0.03)",
                          cursor: "pointer",
                          textAlign: "left" as const,
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* header row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>{fb.name[language]}</span>
                              {sel && <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--primary)", background: "rgba(29,53,87,0.08)", padding: "2px 8px", borderRadius: "6px" }}>{ko ? "선택됨" : "Selected"}</span>}
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{fb.tagline[language]}</div>
                          </div>
                          {/* overall score circle */}
                          <div style={{
                            width: 52, height: 52, borderRadius: 26,
                            background: `conic-gradient(${getScoreColor(overall)} ${overall * 3.6}deg, rgba(0,0,0,0.04) 0deg)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <div style={{ width: 42, height: 42, borderRadius: 21, background: sel ? "rgba(255,255,255,0.95)" : "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1, color: getScoreColor(overall) }}>{overall}</span>
                              <span style={{ fontSize: "8px", color: "var(--muted)", marginTop: "1px" }}>{getScoreLabel(overall, language)}</span>
                            </div>
                          </div>
                        </div>

                        {/* key metrics */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                          {[
                            { label: ko ? "창업비용" : "Startup", value: formatFranchiseCost(fb.startupCostWon) },
                            { label: ko ? "연매출" : "Revenue", value: formatFranchiseCost(fb.avgAnnualRevenueWon) },
                            { label: ko ? "폐점률" : "Closure", value: `${fb.closureRate}%` },
                            { label: ko ? "매장수" : "Stores", value: fb.storeCount.toLocaleString() }
                          ].map((m) => (
                            <div key={m.label} style={{ padding: "8px 6px", borderRadius: "10px", background: sel ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
                              <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em" }}>{m.value}</div>
                              <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{m.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* score bars */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                          {scoreEntries.map((s) => (
                            <div key={s.key} style={{ textAlign: "center" }}>
                              <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.04)", marginBottom: "4px", overflow: "hidden" }}>
                                <div style={{ width: `${s.value}%`, height: "100%", borderRadius: "2px", background: getScoreColor(s.value), transition: "width 0.5s ease" }} />
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--muted)" }}>{s.label}</div>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: getScoreColor(s.value) }}>{s.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* expanded detail when selected */}
                        {sel && (
                          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "grid", gap: "8px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                              {ko ? "프랜차이즈 로드맵 특이사항" : "Franchise Roadmap Notes"}
                            </div>
                            {fb.roadmapNotes[language].map((note, ni) => (
                              <div key={ni} style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)", display: "flex", gap: "6px" }}>
                                <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                                <span>{note}</span>
                              </div>
                            ))}
                            <div style={{ marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" as const, fontSize: "12px", color: "var(--muted)" }}>
                              <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
                              <span>·</span>
                              <span>{ko ? `로열티 ${fb.monthlyRoyalty ? fb.monthlyRoyalty + "만/월" : "없음"}` : `Royalty ${fb.monthlyRoyalty ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
                              <span>·</span>
                              <span>{ko ? `데이터 ${fb.dataYear}년` : `Data ${fb.dataYear}`}</span>
                            </div>
                            {fb.franchiseUrl && (
                              <a
                                href={fb.franchiseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  marginTop: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "10px 16px",
                                  borderRadius: "999px",
                                  border: "none",
                                  background: "var(--primary)",
                                  color: "#fff",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  cursor: "pointer",
                                  width: "fit-content"
                                }}
                              >
                                {ko ? `${fb.name.ko} 가맹 문의 →` : `${fb.name.en} Franchise Inquiry →`}
                              </a>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={styles.stageFooter}>
                <button type="button" style={styles.button} onClick={() => setShowFranchisePicker(false)}>
                  {language === "ko" ? "← 창업 형태로 돌아가기" : "← Back to startup type"}
                </button>
                <button
                  type="button"
                  style={{ ...styles.primaryButton, opacity: selectedFranchiseBrandId ? 1 : 0.45 }}
                  onClick={handleStartupTypeContinue}
                  disabled={!selectedFranchiseBrandId}
                >
                  {language === "ko"
                    ? (selectedFranchiseBrandId
                        ? `${getFranchiseBrandById(selectedFranchiseBrandId)?.name.ko}(으)로 계속`
                        : "브랜드를 선택해주세요")
                    : (selectedFranchiseBrandId
                        ? `Continue with ${getFranchiseBrandById(selectedFranchiseBrandId)?.name.en}`
                        : "Select a brand")}
                </button>
                <button type="button" style={styles.button} onClick={resetDemo}>
                  {copy.common.resetDemo}
                </button>
              </div>
            </>
          );
        })()
      )}
    </>
  );
}
