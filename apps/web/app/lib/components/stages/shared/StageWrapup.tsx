"use client";

/**
 * StageWrapup — 단계별 마무리 섹션 공통 컴포넌트.
 *
 * 패턴(ContractReviewStage / HiringSetupStage / PreLaunchStage 표본 기반):
 *   1. 헤더: "마무리 — 이 단계에서 한 일 + 다음 단계 전 반드시 확인"
 *   2. 이 단계에서 한 일 — 4개 ✓ 카드
 *   3. 다음 단계 전 반드시 확인 — 빨강 박스 (5~6 항목)
 *   4. 다음 단계 안내 — 녹색 박스 ("이 단계가 끝나면 → 다음 단계명")
 *
 * 미드나이트 톤 + lucide-react 아이콘 사용.
 */

import { Check } from "lucide-react";

const MIDNIGHT = "#191970";

export type WrapupItem = { label: string; detail: string };

export type StageWrapupProps = {
  ko: boolean;
  /** 빨강 박스 라벨 — "다음 단계(XXX) 전 반드시 확인" */
  nextStageLabelKo: string;
  nextStageLabelEn?: string;
  /** 이 단계에서 한 일 — 4개 항목 (한국어) */
  doneItemsKo: WrapupItem[];
  /** 영문판 (선택) */
  doneItemsEn?: WrapupItem[];
  /** 빨강 박스 — 5~6개 점검 항목 */
  verifyItemsKo: string[];
  verifyItemsEn?: string[];
  /** 녹색 박스 — 다음 단계 안내 */
  nextSummaryKo: string;
  nextSummaryEn?: string;
};

export function StageWrapup({
  ko,
  nextStageLabelKo,
  nextStageLabelEn,
  doneItemsKo,
  doneItemsEn,
  verifyItemsKo,
  verifyItemsEn,
  nextSummaryKo,
  nextSummaryEn,
}: StageWrapupProps) {
  const doneItems = ko ? doneItemsKo : (doneItemsEn ?? doneItemsKo);
  const verifyItems = ko ? verifyItemsKo : (verifyItemsEn ?? verifyItemsKo);
  const nextSummary = ko ? nextSummaryKo : (nextSummaryEn ?? nextSummaryKo);
  const nextStageLabel = ko ? nextStageLabelKo : (nextStageLabelEn ?? nextStageLabelKo);

  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      marginTop: 16,
    }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
          letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 4,
        }}>
          {ko ? "마무리" : "Wrap-up"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.4 }}>
          {ko ? "이 단계에서 한 일 + 다음 단계 전 반드시 확인" : "What you did + must-verify before next stage"}
        </div>
      </div>

      {/* 이 단계에서 한 일 */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
          letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10,
        }}>
          {ko ? "이 단계에서 한 일" : "What you did"}
        </div>
        <ol style={{
          margin: 0, padding: 0, listStyle: "none",
          border: "1px solid rgba(25,25,112,0.10)", borderRadius: 12, overflow: "hidden",
        }}>
          {doneItems.map((item, i) => (
            <li key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 14px",
              borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
              background: "rgba(25,25,112,0.025)",
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 7,
                background: MIDNIGHT, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>
                <Check size={12} strokeWidth={3} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: 3 }}>
                  {item.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 다음 단계 진입 전 반드시 확인 */}
      <div style={{
        padding: "14px 16px", borderRadius: 12,
        background: "rgba(220,38,38,0.04)",
        border: "1px solid rgba(220,38,38,0.14)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#dc2626",
          letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8,
        }}>
          {ko ? `다음 단계(${nextStageLabel}) 전 반드시 확인` : `Verify before ${nextStageLabel}`}
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {verifyItems.map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: "#dc2626" }} />
              <span style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6, fontWeight: 500 }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 다음 단계 안내 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 15px", borderRadius: 12,
        background: "linear-gradient(180deg, rgba(5,150,105,0.05) 0%, rgba(5,150,105,0.02) 100%)",
        border: "1px solid rgba(5,150,105,0.16)",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: "rgba(5,150,105,0.12)", color: "#059669",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Check size={14} strokeWidth={2.4} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 2 }}>
            {ko ? "이 단계가 끝나면" : "When done"}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", lineHeight: 1.4 }}>
            {nextSummary}
          </div>
        </div>
      </div>
    </div>
  );
}
