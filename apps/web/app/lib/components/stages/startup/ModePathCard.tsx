"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  Compass, ListTree, Clock, AlertTriangle, Quote, ChevronDown, Check,
} from "lucide-react";
import {
  getStageModeContent,
  MODE_DISPLAY_INFO,
  type OperatingMode,
} from "@foundone/shared";
import { SuccessCasesShowcase } from "./SuccessCasesShowcase";

const MIDNIGHT = "#191970";

/**
 * 모드별 경로 카드.
 *
 *  ── 동작 ─────────────────────────────────────────────────────
 *  1. 사용자가 BudgetSetupStage 에서 선택한 운영 모드 (startupOperatingMode) 를 읽음
 *  2. 4개 모드 칩 표시 (인디·부트스트랩·시드·시리즈A) — 사용자가 즉시 다른 모드 보기 가능
 *  3. 현재 모드의 stage-specific 가이드 표시:
 *     - WHY: 왜 이 단계가 이 모드에서 중요한가
 *     - HOW: 핵심 행동 3-5개
 *     - PACE: 일정·규모
 *     - PITFALL: 흔한 함정
 *     - EVIDENCE: 검증된 출처·통계
 *  ─────────────────────────────────────────────────────────────
 *
 *  사용 예시:
 *    <ModePathCard stageId="startup-foundation" />
 */

export function ModePathCard({
  stageId,
  showCases = false,
}: {
  stageId: string;
  /** 모드별 전설 사례 5개 카드 표시 여부.
   *  기본 false — startup-foundation 단계의 'page 4 사례' 에 풀 사이즈로 이미 있어서
   *  다른 단계에서는 중복 방지를 위해 비활성. */
  showCases?: boolean;
}) {
  const d = useDashboardCtx();
  const { language, startupOperatingMode, setStartupOperatingMode } = d;
  const ko = language === "ko";
  const mode = startupOperatingMode;
  // 2026-07-10: '다른 모드 비교' 클릭이 저장 모드를 즉시 덮어써 사용자의 실제 모드(예: 시드)가 유실되던 버그 수정.
  //   비교는 previewMode(로컬)로만 렌더하고, '이 모드로 변경'을 눌러야 저장. displayMode = 미리보기 우선.
  const [previewMode, setPreviewMode] = useState<OperatingMode | null>(null);
  const displayMode = previewMode ?? mode;
  const content = getStageModeContent(stageId, displayMode);

  // 모드 변경 토글 — 기본은 닫혀있음 (사용자가 BudgetSetupStage 에서 이미 저장한 모드만 보임)
  // 다른 모드와 비교하고 싶을 때만 펼쳐짐
  const [showCompare, setShowCompare] = useState(false);

  if (!content) return null;

  return (
    <div style={{
      borderRadius: "20px",
      border: `1px solid ${MIDNIGHT}1A`,
      background: `linear-gradient(180deg, ${MIDNIGHT}05 0%, rgba(255,255,255,0.98) 100%)`,
      padding: "20px 22px",
      marginTop: "16px",
    }}>
      {/* 헤더 — 사용자가 저장한 모드만 표시 (4개 칩 X) */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{
          fontSize: "11px", fontWeight: 700, color: MIDNIGHT,
          letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "6px",
        }}>
          {ko ? "내 운영 모드" : "My mode"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const, marginBottom: "8px" }}>
          {/* 활성 모드 큰 칩 */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            background: MIDNIGHT,
            color: "#fff",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            boxShadow: "0 4px 14px rgba(25,25,112,0.25)",
          }}>
            <Check size={14} strokeWidth={3} />
            {ko ? MODE_DISPLAY_INFO[mode].ko : MODE_DISPLAY_INFO[mode].en}
          </div>
          {/* 비교 토글 */}
          <button
            type="button"
            onClick={() => setShowCompare(v => !v)}
            style={{
              padding: "6px 11px",
              borderRadius: "8px",
              border: `1px solid ${MIDNIGHT}25`,
              background: showCompare ? `${MIDNIGHT}10` : "transparent",
              color: MIDNIGHT,
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s ease",
            }}
          >
            {ko ? "다른 모드 비교" : "Compare modes"}
            <ChevronDown size={12} strokeWidth={2.4} style={{ transform: showCompare ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }} />
          </button>
          {/* 변경 위치 안내 */}
          <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "auto" }}>
            {ko ? "변경: 예산 설정 단계" : "Change in: Budget stage"}
          </span>
        </div>

        {/* 모드 비교 — 토글 시에만 펼쳐짐 */}
        {showCompare && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(0,0,0,0.025)",
              border: "1px solid rgba(0,0,0,0.06)",
              marginTop: "8px",
            }}
          >
            <div style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}>
              {ko ? "참고용 — 다른 모드 길 비교" : "For reference — compare other modes"}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "6px" }}>
              {(["indie", "bootstrap", "seed", "seriesA"] as OperatingMode[]).map((m) => {
                const active = displayMode === m;      // 현재 렌더 중인(미리보기 우선) 모드
                const isSaved = mode === m;             // 저장된 내 모드
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPreviewMode(m === mode ? null : m)}  // 저장 X — 미리보기만
                    style={{
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: active ? 700 : 600,
                      background: active ? MIDNIGHT : "transparent",
                      color: active ? "#fff" : "rgba(15,23,42,0.55)",
                      border: active ? "none" : isSaved ? `1px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.12)",
                      cursor: "pointer",
                      boxShadow: active ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                    }}
                    title={ko ? MODE_DISPLAY_INFO[m].descKo : MODE_DISPLAY_INFO[m].descEn}
                  >
                    {ko ? MODE_DISPLAY_INFO[m].ko : MODE_DISPLAY_INFO[m].en}{isSaved ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
            {previewMode && previewMode !== mode ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
                  {ko
                    ? `미리보기 중 — 저장 모드는 '${MODE_DISPLAY_INFO[mode].ko}'(✓) 입니다. 실제로 바꾸려면 아래 버튼을 누르세요.`
                    : `Previewing — your saved mode is '${MODE_DISPLAY_INFO[mode].en}' (✓). Press the button to actually switch.`}
                </div>
                <button
                  type="button"
                  onClick={() => { setStartupOperatingMode(previewMode); setPreviewMode(null); }}
                  style={{ padding: "5px 10px", borderRadius: "8px", border: "none", background: MIDNIGHT, color: "#fff", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}
                >
                  {ko ? `'${MODE_DISPLAY_INFO[previewMode].ko}'(으)로 변경` : `Switch to '${MODE_DISPLAY_INFO[previewMode].en}'`}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
                {ko
                  ? "✓ = 저장된 내 모드. 다른 칩은 미리보기만 — 클릭해도 저장 모드는 바뀌지 않습니다."
                  : "✓ = your saved mode. Other chips are preview only — clicking does not change your saved mode."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WHY */}
      <div style={{
        padding: "14px 16px",
        borderRadius: "14px",
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        marginBottom: "12px",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "11px", fontWeight: 700, color: MIDNIGHT,
          letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "8px",
        }}>
          <Compass size={13} strokeWidth={2.4} />
          {ko ? "왜 이 단계가 필요한가" : "Why this stage matters"}
        </div>
        <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.75)", lineHeight: 1.65 }}>
          {content.why}
        </div>
      </div>

      {/* HOW — 핵심 행동 */}
      <div style={{
        padding: "14px 16px",
        borderRadius: "14px",
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        marginBottom: "12px",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "11px", fontWeight: 700, color: MIDNIGHT,
          letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "10px",
        }}>
          <ListTree size={13} strokeWidth={2.4} />
          {ko ? "이 단계에서 해야 할 핵심 행동" : "Key actions for this mode"}
        </div>
        <div style={{ display: "grid", gap: "10px" }}>
          {content.actions.map((action, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: `${MIDNIGHT}10`,
                color: MIDNIGHT,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 800,
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: "3px", lineHeight: 1.4 }}>
                  {action.title}
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>
                  {action.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PACE */}
      <div style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: "rgba(25,25,112,0.04)",
        border: "1px solid rgba(25,25,112,0.10)",
        marginBottom: content.pitfall || content.evidence ? "10px" : 0,
        display: "flex", gap: "10px", alignItems: "flex-start",
      }}>
        <Clock size={14} strokeWidth={2.2} style={{ color: MIDNIGHT, flexShrink: 0, marginTop: "2px" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: MIDNIGHT,
            letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "3px",
          }}>
            {ko ? "일정·규모 기준" : "Pace & scale"}
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.7)", lineHeight: 1.55, fontWeight: 600 }}>
            {content.pace}
          </div>
        </div>
      </div>

      {/* PITFALL */}
      {content.pitfall && (
        <div style={{
          padding: "12px 14px",
          borderRadius: "12px",
          background: "rgba(182,76,76,0.04)",
          border: "1px solid rgba(182,76,76,0.14)",
          marginBottom: content.evidence ? "10px" : 0,
          display: "flex", gap: "10px", alignItems: "flex-start",
        }}>
          <AlertTriangle size={14} strokeWidth={2.2} style={{ color: "#b64c4c", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "11px", fontWeight: 700, color: "#b64c4c",
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "3px",
            }}>
              {ko ? "이 모드의 흔한 함정" : "Common pitfall"}
            </div>
            <div style={{ fontSize: "12.5px", color: "rgba(180,28,28,0.9)", lineHeight: 1.55 }}>
              {content.pitfall}
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE */}
      {content.evidence && (
        <div style={{
          padding: "10px 14px",
          borderRadius: "12px",
          background: "rgba(0,0,0,0.025)",
          display: "flex", gap: "8px", alignItems: "flex-start",
          marginBottom: "16px",
        }}>
          <Quote size={12} strokeWidth={2} style={{ color: "rgba(0,0,0,0.4)", flexShrink: 0, marginTop: "3px" }} />
          <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, fontStyle: "italic" as const }}>
            {content.evidence}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SUCCESS CASES — 명시적으로 showCases=true 시에만 표시.
          (기본은 startup-foundation 의 page 4 풀 사이즈 SuccessCasesShowcase
           에서만 보여 중복 제거 — 사용자 요청)
          ═════════════════════════════════════════════════════════ */}
      {showCases && <SuccessCasesShowcase mode={displayMode} ko={ko} compact />}
    </div>
  );
}
