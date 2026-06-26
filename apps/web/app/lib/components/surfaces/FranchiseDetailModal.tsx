"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  type FranchiseBrand,
  computeOverallScore,
  formatFranchiseCost,
  getScoreColor,
  getScoreLabel,
  getFranchiseSupplyInfo,
  getSupplyTypeColor,
  estimateFranchiseCost,
  formatCostBreakdownItems,
} from "@foundone/shared";

type Props = {
  brand: FranchiseBrand;
  language: "ko" | "en";
  onClose: () => void;
};

/**
 * FranchiseDetailModal
 * 사장님이 카드를 클릭했을 때 풀스크린 상세 페이지처럼 펼쳐지는 모달.
 *  - 종합 점수 + 5축 점수 시각화
 *  - 핵심 지표 (창업비·연매출·폐점률·매장수)
 *  - 비용 내역 (검증/추정)
 *  - 장점·단점 (사장님 의사결정용)
 *  - 데이터 출처 (신뢰성 확인)
 *  - 가맹 문의 CTA
 */
export function FranchiseDetailModal({ brand: fb, language, onClose }: Props) {
  const ko = language === "ko";
  const overall = computeOverallScore(fb.scores);
  const supplyInfo = getFranchiseSupplyInfo(fb);
  const breakdown = fb.costBreakdown ?? null;
  const estimated = !breakdown ? estimateFranchiseCost(fb) : null;
  const estimatedItems = estimated ? formatCostBreakdownItems(estimated, language) : [];

  // 부모 surface 의 transform/will-change 가 stacking context 만들어 fixed 가 갇히는 문제 해결.
  // → React Portal 로 document.body 에 직접 mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ESC 닫기 + 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const scoreAxes: Array<{ l: string; v: number; desc: string }> = [
    { l: ko ? "수익성" : "Profitability", v: fb.scores.profitability, desc: ko ? "점당 매출·마진 구조 종합" : "Per-store revenue & margin" },
    { l: ko ? "안정성" : "Stability", v: fb.scores.stability, desc: ko ? "폐점률·운영 연속성" : "Closure rate & continuity" },
    { l: ko ? "진입성" : "Accessibility", v: fb.scores.accessibility, desc: ko ? "초기 자본 부담 정도" : "Initial capital burden" },
    { l: ko ? "브랜드력" : "Brand Power", v: fb.scores.brandPower, desc: ko ? "고객 인지도·신뢰" : "Recognition & trust" },
    { l: ko ? "본사지원" : "HQ Support", v: fb.scores.support, desc: ko ? "교육·물류·마케팅" : "Training/logistics/marketing" },
  ];

  // SSR 가드 — mounted 전엔 portal 렌더 X
  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(17,17,17,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px",
        overflowY: "auto",
        animation: "fbdmFade .22s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      <style>{`
        @keyframes fbdmFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fbdmSlide { from { opacity: 0; transform: translateY(20px) scale(.985) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(880px, 100%)",
          background: "rgba(255,255,255,0.98)",
          borderRadius: "28px",
          padding: "32px",
          boxShadow: "0 24px 80px rgba(17,17,17,0.18), 0 4px 16px rgba(17,17,17,0.06)",
          animation: "fbdmSlide .32s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Close */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            aria-label={ko ? "닫기" : "Close"}
            style={{
              width: 36, height: 36, borderRadius: 18,
              border: "1px solid var(--border)", background: "rgba(255,255,255,0.9)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", color: "var(--muted)", lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Header: Name + tagline + score circle */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", marginBottom: fb.description ? "20px" : "24px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "6px" }}>
              {fb.name[language]}
            </div>
            <div style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.5, marginBottom: "10px" }}>
              {fb.tagline[language]}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={chipStyle}>
                {ko ? "데이터 기준" : "Data year"} {fb.dataYear}
              </span>
              {fb.costVerified ? (
                <span style={{ ...chipStyle, color: "#1d3557", borderColor: "rgba(21,128,61,0.25)", background: "rgba(21,128,61,0.06)" }}>
                  {ko ? "비용 검증" : "Cost verified"}
                </span>
              ) : (
                <span style={{ ...chipStyle, color: "#191970", borderColor: "rgba(161,98,7,0.25)", background: "rgba(161,98,7,0.06)" }}>
                  {ko ? "비용 추정" : "Cost estimated"}
                </span>
              )}
            </div>
          </div>
          <div style={{
            width: 96, height: 96, borderRadius: 48,
            background: `conic-gradient(${getScoreColor(overall)} ${overall * 3.6}deg, rgba(0,0,0,0.04) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <div style={{ width: 78, height: 78, borderRadius: 39, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1, color: getScoreColor(overall) }}>{overall}</span>
              <span style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{getScoreLabel(overall, language)}</span>
            </div>
          </div>
        </div>

        {/* Brand description (5줄 정도) — 제공된 브랜드만 노출 */}
        {fb.description && fb.description[language].length > 0 && (
          <div style={{
            padding: "16px 18px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(29,53,87,0.04), rgba(168,218,220,0.05))",
            border: "0.5px solid rgba(29,53,87,0.12)",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "10.5px", fontWeight: 700, color: "rgba(29,53,87,0.7)",
              letterSpacing: "0.06em", textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}>
              {ko ? "이 브랜드 한눈에" : "About this brand"}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "6px" }}>
              {fb.description[language].map((line, i) => (
                <li key={i} style={{
                  fontSize: "13px", lineHeight: 1.6, color: "rgba(15,23,42,0.78)",
                  paddingLeft: "14px", position: "relative",
                }}>
                  <span style={{
                    position: "absolute", left: 0, top: "9px",
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: "#1d3557",
                  }} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "24px" }}>
          {[
            // 0 = 데이터 미확보 → "—" (가짜 0원·0개 표시 금지. iOS 와 동일하게 graceful.)
            { l: ko ? "창업비용" : "Startup", v: fb.startupCostWon > 0 ? formatFranchiseCost(fb.startupCostWon) : "—", sub: ko ? "총액 기준" : "Total" },
            { l: ko ? "연매출" : "Revenue", v: fb.avgAnnualRevenueWon > 0 ? formatFranchiseCost(fb.avgAnnualRevenueWon) : "—", sub: ko ? "점당 평균" : "Per store" },
            { l: ko ? "폐점률" : "Closure", v: fb.closureRate > 0 ? `${fb.closureRate}%` : "—", sub: ko ? "최근 1년" : "Last 1yr" },
            { l: ko ? "매장수" : "Stores", v: fb.storeCount > 0 ? fb.storeCount.toLocaleString() : "—", sub: ko ? "전국" : "Nation" },
          ].map(m => (
            <div key={m.l} style={{
              padding: "14px 12px", borderRadius: "14px",
              background: "rgba(0,0,0,0.025)", textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>{m.v}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{m.l}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", opacity: 0.7 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* 공정위 공식 통계 — data.go.kr 15110241 (officialStats 있을 때만) */}
        {fb.officialStats && (
          <Section
            title={ko ? "공정위 공식 통계" : "KFTC Official Stats"}
            subtitle={ko
              ? `공정거래위원회 정보공개서 · ${fb.officialStats.year}년 기준`
              : `KFTC franchise disclosure · FY${fb.officialStats.year}`}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {(() => {
                const os = fb.officialStats!;
                const netChange = os.newOpenings - os.terminations - os.cancellations;
                const cells: Array<{ l: string; v: string; sub?: string }> = [
                  { l: ko ? "가맹점수" : "Stores", v: os.storeCount.toLocaleString(), sub: ko ? `전국 · ${os.year}` : `Nation · ${os.year}` },
                  { l: ko ? "신규개점" : "New", v: `+${os.newOpenings.toLocaleString()}`, sub: ko ? "그해 개점" : "Opened" },
                  {
                    l: ko ? "순증감" : "Net",
                    v: `${netChange > 0 ? "+" : ""}${netChange.toLocaleString()}`,
                    sub: ko ? "개점−종료·해지" : "Open−Close",
                  },
                  ...(os.avgSalesWon
                    ? [{ l: ko ? "점당 연매출" : "Sales/store", v: formatFranchiseCost(os.avgSalesWon), sub: ko ? "공식 평균" : "Official avg" }]
                    : []),
                  ...(os.avgSalesPerAreaWon
                    ? [{ l: ko ? "평당 매출" : "Sales/3.3㎡", v: formatFranchiseCost(os.avgSalesPerAreaWon), sub: ko ? "면적 3.3㎡당" : "per 3.3㎡" }]
                    : []),
                  { l: ko ? "계약종료" : "Closed", v: os.terminations.toLocaleString(), sub: ko ? "그해 종료" : "Ended" },
                ];
                return cells.map((m) => (
                  <div key={m.l} style={{ padding: "12px 10px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", textAlign: "center" }}>
                    <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#191970" }}>{m.v}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{m.l}</div>
                    {m.sub && <div style={{ fontSize: "10px", color: "var(--muted)", opacity: 0.7 }}>{m.sub}</div>}
                  </div>
                ));
              })()}
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px", lineHeight: 1.5 }}>
              {ko
                ? "공정거래위원회가 매년 공개하는 가맹사업 정보공개서 기준 실데이터입니다. 위 카드의 손큐레이션 수치와 연도·집계 기준이 다를 수 있습니다."
                : "Official figures from the KFTC annual franchise disclosure. May differ from the curated metrics above due to year/method."}
            </div>
          </Section>
        )}

        {/* Score breakdown */}
        <Section title={ko ? "5축 점수 분석" : "5-Axis Score Analysis"}>
          <div style={{ display: "grid", gap: "10px" }}>
            {scoreAxes.map(s => (
              <div key={s.l}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{s.l}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: getScoreColor(s.v) }}>{s.v}</div>
                </div>
                <div style={{ height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: "3px" }}>
                  <div style={{ width: `${s.v}%`, height: "100%", borderRadius: "3px", background: getScoreColor(s.v) }} />
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Pros / Cons */}
        {(fb.pros || fb.cons) && (
          <Section title={ko ? "장점 · 단점" : "Pros & Cons"}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.2)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1d3557", marginBottom: "8px", letterSpacing: "0.04em" }}>
                  {ko ? "👍 장점" : "👍 Pros"}
                </div>
                {(fb.pros?.[language] ?? []).map((p, i) => (
                  <div key={i} style={{ fontSize: "12.5px", lineHeight: 1.55, color: "#14532d", display: "flex", gap: "6px", marginBottom: "5px" }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>{p}</span>
                  </div>
                ))}
                {(!fb.pros || fb.pros[language].length === 0) && (
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "데이터 보강 예정" : "Data pending"}</div>
                )}
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(182,76,76,0.05)", border: "1px solid rgba(182,76,76,0.2)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#b64c4c", marginBottom: "8px", letterSpacing: "0.04em" }}>
                  {ko ? "⚠️ 단점" : "⚠️ Cons"}
                </div>
                {(fb.cons?.[language] ?? []).map((p, i) => (
                  <div key={i} style={{ fontSize: "12.5px", lineHeight: 1.55, color: "#7f1d1d", display: "flex", gap: "6px", marginBottom: "5px" }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>{p}</span>
                  </div>
                ))}
                {(!fb.cons || fb.cons[language].length === 0) && (
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "데이터 보강 예정" : "Data pending"}</div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Best location — 적합 상권 */}
        {fb.bestLocation && fb.bestLocation[language].length > 0 && (
          <Section title={ko ? "어떤 상권에 잘 맞나" : "Best Locations"}>
            <div style={{
              display: "grid", gap: "8px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(99,102,241,0.04)",
              border: "0.5px solid rgba(99,102,241,0.15)",
            }}>
              {fb.bestLocation[language].map((loc, i) => (
                <div key={i} style={{
                  fontSize: "13px", lineHeight: 1.55, color: "rgba(15,23,42,0.8)",
                  display: "flex", gap: "10px", alignItems: "flex-start",
                }}>
                  <span style={{
                    flexShrink: 0, marginTop: "5px",
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#4f46e5",
                  }} />
                  <span>{loc}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Roadmap notes (특이사항) */}
        <Section title={ko ? "특이사항" : "Key Notes"}>
          <div style={{ display: "grid", gap: "6px" }}>
            {fb.roadmapNotes[language].map((note, i) => (
              <div key={i} style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--ink)", display: "flex", gap: "8px" }}>
                <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Cost breakdown */}
        <Section title={ko ? "비용 내역" : "Cost Breakdown"} subtitle={fb.costSource ? `${ko ? "출처" : "Source"}: ${fb.costSource}` : undefined}>
          {breakdown && breakdown.length > 0 ? (
            <div style={{ display: "grid", gap: "6px" }}>
              {breakdown.map((item, i) => (
                <div key={i} style={costRowStyle}>
                  <span style={{ fontSize: "13px" }}>{item.label[language]}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{formatFranchiseCost(item.amountWon)}원</span>
                </div>
              ))}
              {fb.basePyeong && (
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", textAlign: "right" }}>
                  {ko ? `※ ${fb.basePyeong}평 기준` : `* Based on ${fb.basePyeong} pyeong`}
                </div>
              )}
            </div>
          ) : estimatedItems.length > 0 ? (
            <>
              <div style={{ fontSize: "11px", color: "#191970", marginBottom: "8px", padding: "6px 10px", borderRadius: "8px", background: "rgba(161,98,7,0.06)", border: "1px solid rgba(161,98,7,0.2)" }}>
                {ko ? "⚠️ 본사 미공개 — 산업 평균 기반 추정치" : "⚠️ Estimated from industry average (HQ data unavailable)"}
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {estimatedItems.map((item, i) => (
                  <div key={i} style={{ ...costRowStyle, ...(item.highlight ? { borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" } : {}) }}>
                    <span style={{ fontSize: "13px", fontWeight: item.highlight ? 700 : 400 }}>{item.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: item.highlight ? 700 : 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </Section>

        {/* Sources — 사장님이 직접 검증 가능 */}
        {fb.sources && fb.sources.length > 0 && (
          <Section
            title={ko ? "출처 · 검증" : "Sources · Verification"}
            subtitle={
              fb.confidence
                ? (ko
                    ? `신뢰도 ${fb.confidence === "high" ? "높음 (1차+매체 교차)" : fb.confidence === "medium" ? "보통" : "낮음"}`
                    : `Confidence: ${fb.confidence}`)
                : undefined
            }
          >
            <div style={{ display: "grid", gap: "6px" }}>
              {fb.sources.map((s, i) => {
                const tierLabel = s.tier === "primary" ? "1차"
                  : s.tier === "industry" ? "업계"
                  : s.tier === "media" ? "매체"
                  : s.tier === "aggregator" ? "보조" : null;
                const tierColor = s.tier === "primary" ? "#1d3557"
                  : s.tier === "industry" ? "#1d3557"
                  : s.tier === "media" ? "#0561fc"
                  : "#737373";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    background: "rgba(15,23,42,0.025)",
                    border: "0.5px solid rgba(15,23,42,0.06)",
                    fontSize: "12.5px",
                  }}>
                    {tierLabel && (
                      <span style={{
                        flexShrink: 0,
                        padding: "2px 7px", borderRadius: "999px",
                        background: `${tierColor}14`,
                        color: tierColor,
                        fontSize: "10px", fontWeight: 700,
                        letterSpacing: "0.02em",
                      }}>
                        {tierLabel}
                      </span>
                    )}
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1, minWidth: 0,
                          color: "#0f172a",
                          textDecoration: "none",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}
                      >
                        {s.label}
                      </a>
                    ) : (
                      <span style={{ flex: 1, minWidth: 0, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.label}
                      </span>
                    )}
                    {s.url && (
                      <span style={{ flexShrink: 0, fontSize: "10px", color: "var(--muted)" }}>↗</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Supply structure */}
        {supplyInfo.length > 0 && (
          <Section title={ko ? "공급 구조" : "Supply Structure"} subtitle={ko ? "본사 독점·지정·자율 구분" : "HQ exclusive / designated / free purchase"}>
            <div style={{ display: "grid", gap: "8px" }}>
              {supplyInfo.map((s, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${getSupplyTypeColor(s.type)}30`, background: `${getSupplyTypeColor(s.type)}08` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{s.category[language]}</span>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: getSupplyTypeColor(s.type), color: "#fff" }}>
                      {supplyTypeLabel(s.type, ko)}
                    </span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.5 }}>
                    {s.items.map(it => it[language]).join(" · ")}
                  </div>
                  {s.note && (
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", fontStyle: "italic" }}>
                      {s.note[language]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 데이터 출처 안내 — 위 "출처·검증" 섹션이 없을(출처 미등록) 때만 노출.
            (이전엔 출처가 있어도 이 섹션이 같은 sources 를 한 번 더 렌더해 중복 표시됐음) */}
        {(!fb.sources || fb.sources.length === 0) && (
          <Section title={ko ? "데이터 출처" : "Data Sources"}>
            <div style={{ fontSize: "12px", color: "var(--muted)", padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.025)" }}>
              {ko
                ? "공정거래위원회 정보공개서 · 마이프차 · 본사 공식자료 기반 (2024–2025). 상세 출처는 추가 보강 예정."
                : "Based on KFTC disclosures, MyFranchise, and HQ official data (2024–2025). Detailed sources to be added."}
            </div>
          </Section>
        )}

        {/* CTA */}
        <div style={{
          display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
          marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)"
        }}>
          <div style={{ flex: 1, fontSize: "12px", color: "var(--muted)", display: "flex", gap: "10px" }}>
            <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
            <span>·</span>
            <span>{ko
              ? `로열티 ${fb.royaltyPercent ? "매출 " + fb.royaltyPercent + "%" : fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "만원/월" : "없음"}`
              : `Royalty ${fb.royaltyPercent ? fb.royaltyPercent + "% of sales" : fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
          </div>
          {fb.storeLocatorUrl && (
            <a
              href={fb.storeLocatorUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 16px", borderRadius: "999px",
                border: "1px solid var(--border)", background: "rgba(255,255,255,0.9)",
                color: "var(--ink)", fontSize: "13px", fontWeight: 500,
                textDecoration: "none", whiteSpace: "nowrap"
              }}
            >
              {ko ? "매장 찾기" : "Find Store"}
            </a>
          )}
          {fb.franchiseUrl && (
            <a
              href={fb.franchiseUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 18px", borderRadius: "999px",
                background: "var(--primary)", color: "#fff",
                fontSize: "13px", fontWeight: 600,
                textDecoration: "none", whiteSpace: "nowrap"
              }}
            >
              {ko ? "가맹 문의 →" : "Inquiry →"}
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const chipStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  padding: "3px 8px",
  borderRadius: "999px",
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.7)",
  color: "var(--muted)"
};

const costRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 12px",
  borderRadius: "8px",
  background: "rgba(0,0,0,0.02)"
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "2px" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.8 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function supplyTypeLabel(type: "hq-exclusive" | "hq-designated" | "free-purchase", ko: boolean): string {
  if (type === "hq-exclusive") return ko ? "본사 독점" : "HQ Exclusive";
  if (type === "hq-designated") return ko ? "본사 지정" : "HQ Designated";
  return ko ? "자율 구매" : "Free Purchase";
}
