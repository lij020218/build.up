"use client";

/**
 * FundingScoreModal — AI 점수 보기 결과 팝업.
 *
 * GuidesView.ProgramCard "AI 점수 보기" 클릭 → fetch + 모달.
 *
 * 디자인: Apple 미드나이트 블루 + 그라데이션 score ring + breakdown bar + 가점·자격미충족 badges.
 *  - 점수 0-100 + 합격선 표기 + level 컬러
 *  - breakdown 섹션 — 항목별 배점/획득 점수 막대 그래프
 *  - strengths / weaknesses / improvements 3 섹션
 *  - bonusEligible (가점 가능) / disqualified (자격 미충족) badges
 *  - verdict 결론 + AI 한계 disclaimer
 *
 * 출처 표기: 평가 framework (PSST/TIPS/policy-loan/...) + passingScore.
 *
 * 접근성: ESC + 배경 클릭 닫힘. body scroll lock.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertTriangle, AlertCircle, ArrowUpRight, Loader2, Sparkles, Shield, Award, Target, type LucideIcon } from "lucide-react";

const MIDNIGHT = "#191970";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "rgba(15,23,42,0.55)";
const TEXT_SUBTLE = "rgba(15,23,42,0.45)";

export type FundingScore = {
  score: number;
  level: "high" | "medium" | "low";
  framework: string;
  passingScore: number;
  headline: string;
  breakdown: { item: string; weight: number; itemScore: number; reason: string }[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  verdict: string;
  bonusEligible: string[];
  disqualified: string[];
};

const FRAMEWORK_LABEL: Record<string, string> = {
  psst: "PSST 평가표 (창업진흥원)",
  tips: "TIPS 평가표 (운영사 추천형)",
  "policy-loan": "정책자금 심사 (소진공)",
  "redo-fund": "재도전 특별자금",
  "emergency-fund": "긴급경영안정자금",
  competition: "창업경진대회",
  "corporate-vc": "기업·VC 액셀러레이팅",
};

const LEVEL_META: Record<FundingScore["level"], {
  label: string;
  color: string;
  bg: string;
  ring: string;
  ringBg: string;
  Icon: LucideIcon;
}> = {
  high: {
    label: "높음", color: "#1d3557", bg: "rgba(25,25,112,0.10)",
    ring: "#1d3557", ringBg: "rgba(25,25,112,0.12)", Icon: Target,
  },
  medium: {
    label: "보통", color: "#191970", bg: "rgba(25,25,112,0.10)", // 신호등 앰버 잔재 제거 → 미드나잇(2026-06-16)
    ring: "#191970", ringBg: "rgba(25,25,112,0.12)", Icon: AlertCircle,
  },
  low: {
    label: "낮음", color: "#b64c4c", bg: "rgba(182,76,76,0.10)",
    ring: "#b64c4c", ringBg: "rgba(182,76,76,0.12)", Icon: AlertTriangle,
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
  programName: string;
  loading: boolean;
  error: string | null;
  result: FundingScore | null;
  ko: boolean;
};

export function FundingScoreModal({ open, onClose, programName, loading, error, result, ko }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const meta = result ? LEVEL_META[result.level] : null;
  const frameworkLabel = result && (FRAMEWORK_LABEL[result.framework] ?? result.framework);

  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label={ko ? "AI 점수 보기" : "AI score"}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        animation: "buFadeIn 0.18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 24,
          width: "min(620px, calc(100vw - 32px))", maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(15,23,42,0.30), 0 4px 16px rgba(15,23,42,0.10)",
          padding: "28px 28px 24px", position: "relative", fontFamily: "inherit",
          animation: "buScaleIn 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <button
          type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: 999,
            border: "none", background: "rgba(15,23,42,0.06)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(15,23,42,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(15,23,42,0.06)"; }}
        >
          <X size={16} strokeWidth={1.8} color={TEXT_PRIMARY} />
        </button>

        <div style={{ marginBottom: 18 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, color: MIDNIGHT,
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: "rgba(25,25,112,0.08)", padding: "4px 10px", borderRadius: 999,
            marginBottom: 10,
          }}>
            <Sparkles size={11} strokeWidth={1.8} />
            {ko ? "AI 사전 심사" : "AI pre-screening"}
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 4 }}>
            {ko ? "프로그램" : "Program"}
          </div>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY,
            letterSpacing: "-0.02em", margin: 0, lineHeight: 1.4,
          }}>
            {programName}
          </h2>
          {frameworkLabel && (
            <div style={{
              fontSize: 11, color: TEXT_SUBTLE, marginTop: 6,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <Shield size={11} strokeWidth={1.6} />
              {ko ? "평가 기준: " : "Rubric: "}{frameworkLabel}
            </div>
          )}
        </div>

        {loading && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Loader2 size={28} strokeWidth={1.8} color={MIDNIGHT}
              style={{ animation: "buSpin 1s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, color: TEXT_MUTED, fontWeight: 500 }}>
              {ko ? "사장님 데이터로 평가 중…" : "Evaluating against your data…"}
            </div>
            <div style={{ fontSize: 12, color: TEXT_SUBTLE, marginTop: 4 }}>
              {ko ? "5-15초 정도 소요됩니다" : "Takes 5-15 seconds"}
            </div>
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: "30px 20px", textAlign: "center",
            background: "rgba(182,76,76,0.04)", borderRadius: 14,
            border: "1px solid rgba(182,76,76,0.12)",
          }}>
            <AlertTriangle size={24} strokeWidth={1.6} color="#b64c4c" style={{ margin: "0 auto 10px" }} />
            <div style={{ fontSize: 14, color: "#b64c4c", fontWeight: 600, marginBottom: 4 }}>
              {ko ? "평가 실패" : "Evaluation failed"}
            </div>
            <div style={{ fontSize: 12, color: TEXT_MUTED }}>{error}</div>
          </div>
        )}

        {!loading && !error && result && meta && (
          <>
            {/* Score ring + level + passing score */}
            <div style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "16px 18px", background: meta.bg, borderRadius: 18,
              marginBottom: 16, border: `1px solid ${meta.color}22`,
            }}>
              <div style={{
                position: "relative", width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
                background: `conic-gradient(${meta.ring} ${result.score * 3.6}deg, ${meta.ringBg} 0)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", background: "white",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800, color: meta.color,
                    letterSpacing: "-0.02em", lineHeight: 1,
                  }}>
                    {result.score}
                  </div>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: meta.color, letterSpacing: "0.08em", marginTop: 2 }}>
                    /100
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 700, color: meta.color,
                  background: "white", padding: "3px 9px", borderRadius: 999,
                  marginBottom: 6,
                }}>
                  <meta.Icon size={11} strokeWidth={1.8} color={meta.color} />
                  <span>{ko ? `합격 가능성 ${meta.label}` : `Match: ${meta.label}`}</span>
                  <span style={{ opacity: 0.6, marginLeft: 4 }}>
                    {ko ? `합격선 ${result.passingScore}+` : `passing ${result.passingScore}+`}
                  </span>
                </div>
                <div style={{
                  fontSize: 13.5, fontWeight: 600, color: TEXT_PRIMARY,
                  lineHeight: 1.5, letterSpacing: "-0.005em",
                }}>
                  {result.headline}
                </div>
              </div>
            </div>

            {/* Disqualified — 자격 미충족 (가장 우선 노출) */}
            {result.disqualified.length > 0 && (
              <div style={{
                padding: "12px 14px", marginBottom: 14,
                background: "rgba(182,76,76,0.06)", border: "1px solid rgba(182,76,76,0.18)",
                borderRadius: 12,
              }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, color: "#b64c4c",
                  marginBottom: 6, display: "flex", alignItems: "center", gap: 5,
                  letterSpacing: "0.02em",
                }}>
                  <AlertTriangle size={12} strokeWidth={1.8} />
                  {ko ? "자격 미충족 — 신청 전 해결 필요" : "Disqualifying — resolve before applying"}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 12.5, color: TEXT_PRIMARY, lineHeight: 1.55 }}>
                  {result.disqualified.map((d, i) => (
                    <li key={i} style={{ paddingLeft: 12, position: "relative" }}>
                      <span style={{
                        position: "absolute", left: 0, top: "0.55em",
                        width: 4, height: 4, borderRadius: "50%", background: "#b64c4c",
                      }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Breakdown — 항목별 배점·획득 점수 */}
            {result.breakdown.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, color: MIDNIGHT,
                  letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8,
                }}>
                  {ko ? "항목별 점수" : "Breakdown"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.breakdown.map((b, i) => {
                    const pct = Math.max(0, Math.min(100, (b.itemScore / b.weight) * 100));
                    const barColor = pct >= 75 ? "#1d3557" : pct >= 50 ? "#191970" : "#b64c4c";
                    return (
                      <div key={i} style={{
                        padding: "10px 12px", background: "rgba(15,23,42,0.02)",
                        border: "1px solid rgba(15,23,42,0.06)", borderRadius: 10,
                      }}>
                        <div style={{
                          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8,
                          marginBottom: 5,
                        }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY }}>
                            {b.item}
                          </div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: barColor, whiteSpace: "nowrap" }}>
                            {b.itemScore}<span style={{ opacity: 0.55 }}>/{b.weight}</span>
                          </div>
                        </div>
                        <div style={{
                          height: 4, background: "rgba(15,23,42,0.08)",
                          borderRadius: 999, overflow: "hidden", marginBottom: 6,
                        }}>
                          <div style={{
                            width: `${pct}%`, height: "100%", background: barColor,
                            transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
                          }} />
                        </div>
                        {b.reason && (
                          <div style={{ fontSize: 11.5, color: TEXT_MUTED, lineHeight: 1.45 }}>
                            {b.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Section
                icon={<CheckCircle2 size={14} strokeWidth={1.8} color="#1d3557" />}
                title={ko ? "부합하는 점" : "Strengths"}
                items={result.strengths}
                emptyText={ko ? "현재 데이터로는 명확한 강점을 찾기 어려워요" : "No clear strengths"}
                color="#1d3557"
              />
              <Section
                icon={<AlertTriangle size={14} strokeWidth={1.8} color="#191970" />}
                title={ko ? "약점 / 미충족 요건" : "Weaknesses"}
                items={result.weaknesses}
                emptyText={ko ? "특별한 약점은 없어요" : "No major weaknesses"}
                color="#191970"
              />
              <Section
                icon={<ArrowUpRight size={14} strokeWidth={1.8} color={MIDNIGHT} />}
                title={ko ? "합격률 올리는 방향" : "Improvements"}
                items={result.improvements}
                emptyText={ko ? "이 프로그램에 대한 추가 액션 제안이 없어요" : "No specific improvements"}
                color={MIDNIGHT}
              />
            </div>

            {/* Bonus eligible badges */}
            {result.bonusEligible.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, color: "#1d3557",
                  marginBottom: 6, display: "flex", alignItems: "center", gap: 5,
                }}>
                  <Award size={12} strokeWidth={1.8} />
                  {ko ? "받을 수 있는 가점" : "Bonus you may earn"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.bonusEligible.map((b, i) => (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 600, color: "#1d3557",
                      background: "rgba(25,25,112,0.08)", padding: "3px 9px",
                      borderRadius: 999, border: "1px solid rgba(25,25,112,0.18)",
                    }}>
                      +{b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verdict */}
            {result.verdict && (
              <div style={{
                marginTop: 18, padding: "14px 16px",
                background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.12)",
                borderRadius: 14,
                fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY,
                lineHeight: 1.55, letterSpacing: "-0.005em",
              }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: MIDNIGHT,
                  letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4,
                }}>
                  {ko ? "결론" : "Verdict"}
                </div>
                {result.verdict}
              </div>
            )}

            <div style={{
              marginTop: 14, padding: "8px 4px",
              fontSize: 10.5, color: TEXT_SUBTLE, textAlign: "center", lineHeight: 1.45,
            }}>
              {ko
                ? "AI 추정 — 실제 심사 결과를 보장하지 않습니다. 평가 기준은 창업진흥원·중진공·소진공 공식 운영지침과 합격사업계획서 분석 결과 기반. 일일 평가 20회 제한."
                : "AI estimate — not a guarantee. Rubrics based on official KISED·KOSME·SEMAS guidelines + 100 winning plan analysis. 20/day limit."}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes buFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes buScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes buSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
}

function Section({ icon, title, items, emptyText, color }: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  emptyText: string;
  color: string;
}) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, fontWeight: 700, color, marginBottom: 8,
        letterSpacing: "-0.005em",
      }}>
        {icon}{title}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12.5, color: TEXT_SUBTLE, fontStyle: "italic" }}>{emptyText}</div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <li key={i} style={{
              fontSize: 13, color: TEXT_PRIMARY,
              lineHeight: 1.55, letterSpacing: "-0.005em",
              paddingLeft: 14, position: "relative",
            }}>
              <span style={{
                position: "absolute", left: 0, top: "0.55em",
                width: 4, height: 4, borderRadius: "50%",
                background: color, opacity: 0.7,
              }} />
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
