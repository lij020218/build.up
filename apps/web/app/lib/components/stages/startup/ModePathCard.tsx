"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  Compass, ListTree, Clock, AlertTriangle, Quote,
} from "lucide-react";
import {
  getStageModeContent,
  MODE_DISPLAY_INFO,
  type OperatingMode,
} from "@build-up/shared";

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

export function ModePathCard({ stageId }: { stageId: string }) {
  const d = useDashboardCtx();
  const { language, startupOperatingMode, setStartupOperatingMode } = d;
  const ko = language === "ko";
  const mode = startupOperatingMode;
  const content = getStageModeContent(stageId, mode);

  if (!content) return null;

  return (
    <div style={{
      borderRadius: "20px",
      border: `1px solid ${MIDNIGHT}1A`,
      background: `linear-gradient(180deg, ${MIDNIGHT}05 0%, rgba(255,255,255,0.98) 100%)`,
      padding: "20px 22px",
      marginTop: "16px",
    }}>
      {/* 헤더 + 모드 칩 */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{
          fontSize: "11px", fontWeight: 700, color: MIDNIGHT,
          letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px",
        }}>
          {ko ? "내 운영 모드에 맞는 길" : "Your path by mode"}
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "10px" }}>
          {ko
            ? `${MODE_DISPLAY_INFO[mode].ko} 단계 — 이 사용자 상황이면 이렇게 가는 게 맞습니다`
            : `${MODE_DISPLAY_INFO[mode].en} mode — recommended path for your situation`}
        </div>

        {/* 4개 모드 칩 */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "4px" }}>
          {(["indie", "bootstrap", "seed", "seriesA"] as OperatingMode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setStartupOperatingMode(m)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 600,
                  background: active ? MIDNIGHT : "transparent",
                  color: active ? "#fff" : "rgba(15,23,42,0.55)",
                  border: active ? "none" : "1px solid rgba(25,25,112,0.12)",
                  cursor: "pointer",
                  boxShadow: active ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                }}
                title={ko ? MODE_DISPLAY_INFO[m].descKo : MODE_DISPLAY_INFO[m].descEn}
              >
                {ko ? MODE_DISPLAY_INFO[m].ko : MODE_DISPLAY_INFO[m].en}
              </button>
            );
          })}
        </div>
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
          background: "rgba(220,60,30,0.06)",
          border: "1px solid rgba(200,60,30,0.16)",
          marginBottom: content.evidence ? "10px" : 0,
          display: "flex", gap: "10px", alignItems: "flex-start",
        }}>
          <AlertTriangle size={14} strokeWidth={2.2} style={{ color: "#b83020", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "11px", fontWeight: 700, color: "#b83020",
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "3px",
            }}>
              {ko ? "이 모드의 흔한 함정" : "Common pitfall"}
            </div>
            <div style={{ fontSize: "12.5px", color: "rgba(184,48,32,0.9)", lineHeight: 1.55 }}>
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
        }}>
          <Quote size={12} strokeWidth={2} style={{ color: "rgba(0,0,0,0.4)", flexShrink: 0, marginTop: "3px" }} />
          <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, fontStyle: "italic" as const }}>
            {content.evidence}
          </div>
        </div>
      )}
    </div>
  );
}
