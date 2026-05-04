"use client";

/**
 * StageActionHero — 모든 단계가 사용하는 공통 상단 패턴.
 *
 * TaxGuideStage / HiringSetupStage 등이 자체적으로 반복 구현했던 패턴을 추출:
 *   1. KEY ACTION 미드나이트 그라디언트 히어로 ("이 단계에서 꼭 할 일")
 *   2. 페이지 탭 네비 (이전/다음 + 탭 라벨 ribbon)
 *   3. 페이지 헤더 (단계 N / 총 M)
 *   4. 트랩 카드 (빨강 AlertTriangle 경고)
 *
 * 사용처: PermitCheckPanels, LocationCandidatesStage, ContractReviewStage 등
 *         사용자 피드백으로 동일한 톤 통일이 필요한 단계.
 */

import { ShieldCheck, AlertTriangle } from "lucide-react";

const MIDNIGHT = "#191970";

export type KeyAction = {
  title: string;
  detail: string;
};

export type Trap = {
  label: string;
  text: string;
};

// ─── KEY ACTION 히어로 (미드나이트 그라디언트) ─────────────────────────────
type KeyActionHeroProps = {
  ko: boolean;
  action: KeyAction;
  /** 우상단에 보조 인라인 카드 (3개 정도) — 예: "근로계약서 / 4대보험 / 원천세 + 급여" */
  pillars?: Array<{ icon?: React.ReactNode; label: string; meta: string }>;
};

export function KeyActionHero({ ko, action, pillars }: KeyActionHeroProps) {
  return (
    <div style={{
      padding: "20px 22px 22px",
      borderRadius: 18,
      background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
      color: "#fff",
      marginBottom: 18,
      boxShadow: "0 6px 22px rgba(25,25,112,0.28)",
    }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          backdropFilter: "blur(8px)" as const,
        }}>
          <ShieldCheck size={20} strokeWidth={1.6} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: 4 }}>
            {ko ? "KEY ACTION" : "KEY ACTION"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: 5 }}>
            {action.title}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.92 }}>
            {action.detail}
          </div>
        </div>
      </div>
      {pillars && pillars.length > 0 && (
        <div style={{
          marginTop: 16, display: "grid",
          gridTemplateColumns: `repeat(${Math.min(pillars.length, 3)}, minmax(0, 1fr))`,
          gap: 8,
        }}>
          {pillars.map((p, i) => (
            <div key={i} style={{
              padding: "10px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(8px)" as const,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, opacity: 0.78, marginBottom: 3 }}>
                {p.icon}
                {p.label}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{p.meta}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 탭 네비게이션 (이전/다음 + 라벨 ribbon) ──────────────────────────────
type StageTabNavProps = {
  ko: boolean;
  pageIndex: number;
  pageLabels: string[];
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
};

export function StageTabNav({ ko, pageIndex, pageLabels, onPrev, onNext, onJump }: StageTabNavProps) {
  const lastIdx = pageLabels.length - 1;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>
      <button
        type="button"
        disabled={pageIndex === 0}
        onClick={onPrev}
        style={{
          padding: "8px 16px", borderRadius: 10,
          border: "1px solid rgba(25,25,112,0.10)",
          background: pageIndex === 0 ? "rgba(0,0,0,0.02)" : "white",
          color: pageIndex === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: 13, fontWeight: 600,
          cursor: pageIndex === 0 ? "default" : "pointer",
        }}
      >
        ← {ko ? "이전" : "Prev"}
      </button>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, justifyContent: "center" }}>
        {pageLabels.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            style={{
              padding: "5px 12px", borderRadius: 999,
              fontSize: 11.5, fontWeight: i === pageIndex ? 700 : 500,
              background: i === pageIndex ? MIDNIGHT : "transparent",
              color: i === pageIndex ? "#fff" : "rgba(15,23,42,0.45)",
              border: i === pageIndex ? "none" : "1px solid rgba(25,25,112,0.10)",
              cursor: "pointer", letterSpacing: "-0.01em",
              boxShadow: i === pageIndex ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
              transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={pageIndex === lastIdx}
        onClick={onNext}
        style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          background: pageIndex === lastIdx ? "rgba(0,0,0,0.02)" : MIDNIGHT,
          color: pageIndex === lastIdx ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: 13, fontWeight: 600,
          cursor: pageIndex === lastIdx ? "default" : "pointer",
          boxShadow: pageIndex === lastIdx ? "none" : "0 4px 14px rgba(25,25,112,0.25)",
        }}
      >
        {ko ? "다음" : "Next"} →
      </button>
    </div>
  );
}

// ─── 페이지 헤더 (단계 N/M + 라벨) ──────────────────────────────────────────
export function StagePageHeader({
  ko, pageIndex, pageLabels,
}: { ko: boolean; pageIndex: number; pageLabels: string[] }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700,
        color: MIDNIGHT, letterSpacing: "0.08em",
        textTransform: "uppercase" as const, marginBottom: 4,
      }}>
        {ko ? `${pageIndex + 1}단계 / ${pageLabels.length}` : `Step ${pageIndex + 1} / ${pageLabels.length}`}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700,
        letterSpacing: "-0.02em", color: "var(--text)", lineHeight: 1.3,
      }}>
        {pageLabels[pageIndex]}
      </div>
    </div>
  );
}

// ─── 트랩 카드 (빨강 AlertTriangle 경고) ───────────────────────────────────
export function TrapsCard({ traps }: { traps: Trap[] }) {
  if (traps.length === 0) return null;
  return (
    <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
      {traps.map((trap, i) => (
        <div
          key={i}
          style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "13px 15px", borderRadius: 14,
            background: "rgba(220,60,30,0.06)",
            border: "1px solid rgba(200,60,30,0.16)",
          }}
        >
          <AlertTriangle size={18} strokeWidth={1.8} style={{ color: "#b83020", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#b83020", marginBottom: 3, letterSpacing: "-0.01em" }}>
              {trap.label}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(184,48,32,0.85)" }}>
              {trap.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 4단 흐름 카드들 — 모든 단계가 같은 플로우로 표현 ─────────────────────
//   1) WhyMattersBlock  — 왜 이 단계가 중요한가
//   2) WhatToDoBlock    — 여기서 뭘 해야 하나 (단계별 액션 + 시간)
//   3) WatchoutsBlock   — 뭘 주의해야 하나 (TrapsCard 와 호환)
//   4) FavorablePathBlock — 사용자 상황(카테고리·예산·업종) 에 유리한 길

import { Lightbulb, ListChecks, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

const SECTION_HEADER_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center" as const,
  gap: 8,
  marginBottom: 12,
};
const SECTION_TITLE: React.CSSProperties = {
  fontSize: 14.5,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
};
const SECTION_SUBTITLE: React.CSSProperties = {
  fontSize: 12.5,
  color: "rgba(15,23,42,0.55)",
  marginLeft: 30,
  marginBottom: 14,
  marginTop: -8,
  lineHeight: 1.5,
};

// ① 왜 중요한가 — 짧은 본문 + 핵심 stat (Big Number)
type WhyMattersProps = {
  ko: boolean;
  /** 한 줄 핵심 메시지 */
  headline: string;
  /** 본문 (2-3 문장) */
  body: string;
  /** 우측에 강조할 통계 — 예: { value: "70%", label: "사장님이 이 단계 건너뜀" } */
  stat?: { value: string; label: string };
};

export function WhyMattersBlock({ ko, headline, body, stat }: WhyMattersProps) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "18px 20px",
    }}>
      <div style={SECTION_HEADER_BASE}>
        <span style={{
          width: 22, height: 22, borderRadius: 7,
          background: "rgba(25,25,112,0.08)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: MIDNIGHT,
        }}>
          <Lightbulb size={13} strokeWidth={1.6} />
        </span>
        <span style={SECTION_TITLE}>{ko ? "왜 이 단계가 중요한가" : "Why this stage matters"}</span>
      </div>
      <div style={{
        display: "grid",
        // ⚠️ stat column 폭은 내용에 맞게 자동 (이전엔 140px 고정 → "₩2,800만" 처럼 긴 값이 줄바꿈되어 "만" 만 떨어짐)
        gridTemplateColumns: stat ? "minmax(0, 1fr) auto" : "1fr",
        gap: 18,
        alignItems: "stretch",
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.015em", lineHeight: 1.45, marginBottom: 6 }}>
            {headline}
          </div>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", lineHeight: 1.65 }}>
            {body}
          </div>
        </div>
        {stat && (
          <div style={{
            padding: "16px 22px",
            borderRadius: 14,
            // 미드나이트 단색 톤 — 빨강 박스 X (서비스 일관성). 살짝 그라디언트로 깊이.
            background: "linear-gradient(180deg, rgba(25,25,112,0.05) 0%, rgba(25,25,112,0.02) 100%)",
            border: "1px solid rgba(25,25,112,0.12)",
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            gap: 6,
            minWidth: 110,
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10.5, fontWeight: 700, color: MIDNIGHT, opacity: 0.65,
              letterSpacing: "0.06em", textTransform: "uppercase" as const,
            }}>
              <TrendingDown size={11} strokeWidth={1.6} />
              {ko ? "방치 시" : "Risk"}
            </div>
            <div style={{
              fontSize: 26, fontWeight: 800, color: MIDNIGHT,
              letterSpacing: "-0.03em", lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums" as const,
              whiteSpace: "nowrap" as const, // ← "₩2,800만" 한 줄에 들어가도록 줄바꿈 방지
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 500, color: "rgba(15,23,42,0.55)",
              lineHeight: 1.4, textAlign: "center" as const,
              maxWidth: 180,
            }}>
              {stat.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ② 여기서 뭘 해야 하나 — 단계별 액션 + 시간 추정
export type ActionStep = {
  /** 시간 추정 — "20분", "당일", "5분" 등 */
  time: string;
  /** 핵심 한 줄 */
  title: string;
  /** 어떻게/어디서 할지 1-2 문장 */
  detail: string;
};

export function WhatToDoBlock({ ko, totalTime, steps }: { ko: boolean; totalTime?: string; steps: ActionStep[] }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={SECTION_HEADER_BASE}>
          <span style={{
            width: 22, height: 22, borderRadius: 7,
            background: "rgba(25,25,112,0.08)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: MIDNIGHT,
          }}>
            <ListChecks size={13} strokeWidth={1.6} />
          </span>
          <span style={SECTION_TITLE}>{ko ? "여기서 뭘 해야 하나" : "What to do here"}</span>
        </div>
        {totalTime && (
          <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, padding: "3px 10px", borderRadius: 999, background: "rgba(25,25,112,0.06)", letterSpacing: "-0.005em" }}>
            {ko ? "총 " : ""}{totalTime}
          </span>
        )}
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: i === steps.length - 1 ? MIDNIGHT : "rgba(25,25,112,0.08)",
              color: i === steps.length - 1 ? "#fff" : MIDNIGHT,
              fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums" as const,
              boxShadow: i === steps.length - 1 ? "0 4px 12px rgba(25,25,112,0.22)" : "none",
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  {s.title}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,23,42,0.5)", padding: "2px 8px", borderRadius: 999, background: "rgba(15,23,42,0.04)" }}>
                  {s.time}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", lineHeight: 1.6 }}>
                {s.detail}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ③ 뭘 주의해야 하나 — 빨강 톤 트랩 카드 (TrapsCard 가 이미 있음 — heading 추가 wrapper)
export function WatchoutsBlock({ ko, traps }: { ko: boolean; traps: Trap[] }) {
  if (traps.length === 0) return null;
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "18px 20px",
    }}>
      <div style={SECTION_HEADER_BASE}>
        <span style={{
          width: 22, height: 22, borderRadius: 7,
          background: "rgba(220,38,38,0.10)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "#dc2626",
        }}>
          <AlertCircle size={13} strokeWidth={1.6} />
        </span>
        <span style={SECTION_TITLE}>{ko ? "뭘 주의해야 하나" : "Watch out"}</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {traps.map((trap, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "12px 14px", borderRadius: 12,
            background: "rgba(220,38,38,0.04)",
            border: "1px solid rgba(220,38,38,0.12)",
          }}>
            <AlertTriangle size={16} strokeWidth={1.8} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#b91c1c", marginBottom: 3, letterSpacing: "-0.005em" }}>
                {trap.label}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(180,28,28,0.82)" }}>
                {trap.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ④ 사용자 상황에 유리한 길 — 카테고리·예산·업종 별 best practice
export type FavorableTip = {
  /** "예산 1억 이하면", "음식점이라면" 같은 조건 */
  context: string;
  /** 핵심 권장사항 한 줄 */
  recommendation: string;
  /** 왜 이게 유리한지 1-2 문장 */
  rationale: string;
};

export function FavorablePathBlock({ ko, tips }: { ko: boolean; tips: FavorableTip[] }) {
  if (tips.length === 0) return null;
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(5,150,105,0.04) 0%, rgba(255,255,255,0.96) 100%)",
      borderRadius: 16,
      border: "1px solid rgba(5,150,105,0.16)",
      boxShadow: "0 1px 3px rgba(5,150,105,0.06)",
      padding: "18px 20px",
    }}>
      <div style={SECTION_HEADER_BASE}>
        <span style={{
          width: 22, height: 22, borderRadius: 7,
          background: "rgba(5,150,105,0.12)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "#059669",
        }}>
          <TrendingUp size={13} strokeWidth={1.6} />
        </span>
        <span style={SECTION_TITLE}>{ko ? "사장님 상황에 유리한 길" : "What's favorable for you"}</span>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {tips.map((tip, i) => (
          <div key={i} style={{
            padding: "13px 15px", borderRadius: 12,
            background: "white",
            border: "1px solid rgba(5,150,105,0.12)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 5 }}>
              {tip.context}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 4, lineHeight: 1.45 }}>
              {tip.recommendation}
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.6 }}>
              {tip.rationale}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StageOverview — 단계 시작 페이지 (개요). 왜 + 작업 목차 + 기대 결과 ───
//
// 사용자가 단계에 들어왔을 때 첫 페이지: "왜 이 단계가 필요한지" + "내가 뭘 할 것인지" + "끝나면 뭘 얻는지".
// 그 후 다음 페이지부터 실제 작업 시작.
//
// 사용자 피드백: "단계가 왜 필요한지 개요가 먼저 있어야 진행이 자연스럽다"
export type StageOverviewProps = {
  ko: boolean;
  /** 큰 헤드라인 — "왜 이 단계가 필요한가" 한 줄 답 */
  headline: string;
  /** 본문 (2-3 문장) — 단계의 의미·중요성 */
  why: string;
  /** 핵심 통계 (선택) — "₩2,800만 분쟁 평균 손실" 같은 임팩트 숫자 */
  stat?: { value: string; label: string };
  /** 다음 페이지부터 무엇을 할지 — 페이지 1~N의 작업 목차 */
  workOutline: Array<{ stepLabel: string; title: string; time?: string }>;
  /** 이 단계 끝나면 무엇이 확정/결정되는지 (Expected outcome) */
  outcome: string;
  /** 다음 단계 forshadow (선택) */
  nextStage?: string;
};

export function StageOverview({ ko, headline, why, stat, workOutline, outcome, nextStage }: StageOverviewProps) {
  const totalTime = workOutline.map(w => w.time).filter(Boolean).join(" + ") || undefined;
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 18,
    }}>
      {/* ① 왜 — 큰 헤드라인 + 본문 + (옵션) 통계 */}
      <div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10.5, fontWeight: 700, color: MIDNIGHT,
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
          padding: "4px 10px", borderRadius: 999,
          background: "rgba(25,25,112,0.06)",
          marginBottom: 10,
        }}>
          <Lightbulb size={11} strokeWidth={1.6} />
          {ko ? "이 단계 개요" : "Stage overview"}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: stat ? "minmax(0, 1fr) auto" : "1fr",
          gap: 18, alignItems: "start",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 18, fontWeight: 800, color: "#0f172a",
              letterSpacing: "-0.025em", lineHeight: 1.35, marginBottom: 8,
            }}>
              {headline}
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(15,23,42,0.7)", lineHeight: 1.7 }}>
              {why}
            </div>
          </div>
          {stat && (
            <div style={{
              padding: "14px 18px", borderRadius: 12,
              background: "linear-gradient(180deg, rgba(25,25,112,0.05) 0%, rgba(25,25,112,0.02) 100%)",
              border: "1px solid rgba(25,25,112,0.12)",
              display: "flex", flexDirection: "column" as const,
              alignItems: "center" as const, gap: 4, minWidth: 100,
            }}>
              <div style={{
                fontSize: 24, fontWeight: 800, color: MIDNIGHT,
                letterSpacing: "-0.03em", lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums" as const,
                whiteSpace: "nowrap" as const,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 500, color: "rgba(15,23,42,0.55)",
                lineHeight: 1.35, textAlign: "center" as const, maxWidth: 140,
              }}>
                {stat.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ② 작업 목차 — 페이지 1~N 의 흐름 */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
          letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10,
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <ListChecks size={12} strokeWidth={1.6} />
          {ko ? `이 단계에서 진행 — 총 ${workOutline.length}단계` : `What you'll do — ${workOutline.length} steps`}
          {totalTime && <span style={{ opacity: 0.6, fontWeight: 600 }}> · {totalTime}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {workOutline.map((w, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 12,
              background: "rgba(25,25,112,0.03)",
              border: "1px solid rgba(25,25,112,0.06)",
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(25,25,112,0.10)", color: MIDNIGHT,
                fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontVariantNumeric: "tabular-nums" as const,
              }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                  {w.stepLabel}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", marginTop: 1 }}>
                  {w.title}
                </div>
              </div>
              {w.time && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(15,23,42,0.5)",
                  padding: "3px 9px", borderRadius: 999,
                  background: "white", border: "1px solid rgba(25,25,112,0.08)",
                }}>
                  {w.time}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ③ 기대 결과 — 끝나면 무엇이 확정되는지 */}
      <div style={{
        padding: "12px 14px", borderRadius: 12,
        background: "linear-gradient(180deg, rgba(5,150,105,0.04) 0%, rgba(255,255,255,0.96) 100%)",
        border: "1px solid rgba(5,150,105,0.16)",
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: "#059669",
          letterSpacing: "0.06em", textTransform: "uppercase" as const,
          marginBottom: 4,
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <TrendingUp size={11} strokeWidth={1.8} />
          {ko ? "이 단계가 끝나면" : "When done"}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.55 }}>
          {outcome}
        </div>
        {nextStage && (
          <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", marginTop: 6, lineHeight: 1.5 }}>
            {ko ? "→ 다음 단계: " : "→ Next: "}{nextStage}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WorkStep — 한 페이지 = 한 작업. 그 작업의 왜·어떻게·주의·권장 inline 통합 ───
//
// 각 단계의 실제 작업 흐름 (예: 계약 검토 = 서류→현장→특약→사인) 을 페이지로 분리하고,
// 각 페이지 안에 그 페이지의 컨텍스트만 깔끔하게 표시. 일률적 4-페이지 추상화 X.
export type WorkStepProps = {
  ko: boolean;
  /** "1. 서류 발급" 처럼 페이지 번호 + 핵심 라벨 */
  stepLabel: string;
  /** 시간 추정 — "20분", "당일" 등 (선택) */
  time?: string;
  /** 한 줄 핵심 메시지 — "사인 전 30분이 보증금을 결정" */
  headline: string;
  /** 왜 이 작업이 필요한지 1-2 문장 */
  why?: string;
  /** 어떻게 할지 — 단계별 액션 1-4개 */
  how?: Array<{ title: string; detail?: string }>;
  /** 주의사항 1-3개 (선택) — 이 작업의 함정 */
  watchouts?: Array<{ label: string; text: string }>;
  /** 사용자 상황에 유리한 길 (선택) — 카테고리·예산 별 best practice */
  favorable?: { context: string; recommendation: string; rationale?: string };
};

export function WorkStep({ ko, stepLabel, time, headline, why, how, watchouts, favorable }: WorkStepProps) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 14,
    }}>
      {/* 헤더 — step + 시간 + 큰 헤드라인 */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: MIDNIGHT,
            letterSpacing: "0.06em", textTransform: "uppercase" as const,
            padding: "3px 9px", borderRadius: 999,
            background: "rgba(25,25,112,0.06)",
          }}>
            {stepLabel}
          </span>
          {time && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: "rgba(15,23,42,0.5)",
              letterSpacing: "-0.005em",
            }}>
              · {time}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700, color: "#0f172a",
          letterSpacing: "-0.02em", lineHeight: 1.4,
        }}>
          {headline}
        </div>
      </div>

      {/* 왜 — 작은 본문 */}
      {why && (
        <div style={{ fontSize: 13, color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
          {why}
        </div>
      )}

      {/* 어떻게 — BizRegistrationPanel 패턴: 큰 숫자 박스 + 진한 헤드라인 + hairline 구분 */}
      {how && how.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75,
            letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10,
          }}>
            {ko ? "할 일" : "Action"}
          </div>
          <ol style={{
            margin: 0, padding: 0, listStyle: "none",
            background: "white",
            borderRadius: 14,
            border: "1px solid rgba(25,25,112,0.10)",
            overflow: "hidden",
          }}>
            {how.map((h, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px 16px",
                  borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(25,25,112,0.08)", color: MIDNIGHT,
                  fontSize: 14, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontVariantNumeric: "tabular-nums" as const,
                  letterSpacing: "-0.02em",
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: "#0f172a",
                    letterSpacing: "-0.015em", lineHeight: 1.4,
                  }}>
                    {h.title}
                  </div>
                  {h.detail && (
                    <div style={{
                      fontSize: 13, color: "rgba(15,23,42,0.6)",
                      lineHeight: 1.6, marginTop: 4,
                    }}>
                      {h.detail}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 주의 — 인라인 빨강 박스 */}
      {watchouts && watchouts.length > 0 && (
        <div style={{
          padding: "11px 13px", borderRadius: 12,
          background: "rgba(220,38,38,0.04)",
          border: "1px solid rgba(220,38,38,0.14)",
          display: "flex", flexDirection: "column" as const, gap: 6,
        }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, color: "#dc2626",
            letterSpacing: "0.06em", textTransform: "uppercase" as const,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <AlertTriangle size={11} strokeWidth={1.8} />
            {ko ? "주의" : "Watch out"}
          </div>
          {watchouts.map((w, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", letterSpacing: "-0.005em" }}>
                {w.label}
              </div>
              <div style={{ fontSize: 12, color: "rgba(180,28,28,0.85)", lineHeight: 1.55, marginTop: 2 }}>
                {w.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 유리한 길 — 인라인 녹색 박스 */}
      {favorable && (
        <div style={{
          padding: "11px 13px", borderRadius: 12,
          background: "rgba(5,150,105,0.04)",
          border: "1px solid rgba(5,150,105,0.16)",
        }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, color: "#059669",
            letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 4,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <TrendingUp size={11} strokeWidth={1.8} />
            {ko ? `사장님 상황 — ${favorable.context}` : `Your situation — ${favorable.context}`}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", lineHeight: 1.45 }}>
            {favorable.recommendation}
          </div>
          {favorable.rationale && (
            <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: 4 }}>
              {favorable.rationale}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── (Legacy) DotList — 이전 호환 유지. 신규 단계는 4단 흐름 권장. ─────────
export type DotItem = {
  color: "red" | "blue" | "green" | "amber" | "midnight";
  title: string;
  body: string;
};

const DOT_COLORS: Record<DotItem["color"], string> = {
  red: "#dc2626",
  blue: "#2563eb",
  green: "#059669",
  amber: "#d97706",
  midnight: "#191970",
};

export function DotList({ heading, subtitle, items }: { heading?: string; subtitle?: string; items: DotItem[] }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "18px 20px",
    }}>
      {heading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: subtitle ? 4 : 12 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 7,
            background: "rgba(25,25,112,0.08)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: MIDNIGHT,
          }}>💡</span>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {heading}
          </span>
        </div>
      )}
      {subtitle && (
        <div style={SECTION_SUBTITLE}>
          {subtitle}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: DOT_COLORS[it.color],
              marginTop: 6, flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 3 }}>
                {it.title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", lineHeight: 1.6 }}>
                {it.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
