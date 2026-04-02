"use client";

import { useState } from "react";
import {
  LIFECYCLE_STAGES,
  determineCurrentLifecycleStage,
  getPhaseLabel,
  getPhaseColor,
} from "@build-up/shared";
import type { LifecycleStage } from "@build-up/shared";

type Props = {
  businessLaunched: boolean;
  monthsInBusiness: number;
  healthScore: number;
  language: "ko" | "en";
  onChecklistToggle?: (stageId: string, checkId: string) => void;
  checkedItems?: Record<string, boolean>;
};

export default function LifecycleCard({
  businessLaunched,
  monthsInBusiness,
  healthScore,
  language,
  onChecklistToggle,
  checkedItems = {},
}: Props) {
  const [showAllStages, setShowAllStages] = useState(false);
  const ko = language === "ko";

  const current = determineCurrentLifecycleStage({
    businessLaunched,
    monthsInBusiness,
    healthScore,
  });

  const phaseColor = getPhaseColor(current.phase);
  const title = ko ? current.title.ko : current.title.en;
  const whyNow = ko ? current.whyNow.ko : current.whyNow.en;
  const keyQuestion = ko ? current.keyQuestion.ko : current.keyQuestion.en;
  const duration = ko ? current.duration.ko : current.duration.en;

  const checkedCount = current.checklist.filter(
    (c) => checkedItems[`${current.id}:${c.id}`]
  ).length;

  return (
    <div style={{
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.78)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.76) 100%)",
      boxShadow: "0 12px 28px rgba(17,17,17,0.04)",
      backdropFilter: "blur(18px)",
      overflow: "hidden",
    }}>
      {/* 헤더 */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: phaseColor,
            }} />
            <span style={{
              fontSize: "12px",
              fontWeight: 600,
              color: phaseColor,
              letterSpacing: "0.04em",
            }}>
              {getPhaseLabel(current.phase, ko ? "ko" : "en")}
            </span>
          </div>
          <span style={{
            fontSize: "12px",
            color: "var(--muted)",
          }}>
            {duration}
          </span>
        </div>

        {/* 현재 단계 제목 */}
        <div style={{
          fontSize: "22px",
          fontWeight: 680,
          letterSpacing: "-0.4px",
          lineHeight: 1.2,
          marginBottom: "8px",
        }}>
          {title}
        </div>

        {/* 왜 지금 중요한지 — 한 줄 */}
        <div style={{
          fontSize: "14px",
          lineHeight: 1.6,
          color: "var(--muted)",
          marginBottom: "16px",
        }}>
          {whyNow}
        </div>
      </div>

      {/* 핵심 질문 */}
      <div style={{
        margin: "0 22px",
        padding: "14px 16px",
        borderRadius: "14px",
        background: `${phaseColor}08`,
        border: `1px solid ${phaseColor}18`,
        marginBottom: "16px",
      }}>
        <div style={{
          fontSize: "11px",
          color: phaseColor,
          fontWeight: 600,
          letterSpacing: "0.06em",
          marginBottom: "4px",
        }}>
          {ko ? "핵심 질문" : "Key Question"}
        </div>
        <div style={{
          fontSize: "15px",
          fontWeight: 600,
          lineHeight: 1.4,
          letterSpacing: "-0.2px",
        }}>
          {keyQuestion}
        </div>
      </div>

      {/* 체크리스트 */}
      <div style={{ padding: "0 22px 18px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
            {ko ? "체크리스트" : "Checklist"}
          </span>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            {checkedCount}/{current.checklist.length}
          </span>
        </div>

        {/* 진행률 바 */}
        <div style={{
          height: "4px",
          borderRadius: "2px",
          background: "rgba(17,17,17,0.06)",
          overflow: "hidden",
          marginBottom: "12px",
        }}>
          <div style={{
            height: "100%",
            width: `${(checkedCount / Math.max(current.checklist.length, 1)) * 100}%`,
            borderRadius: "2px",
            background: phaseColor,
            transition: "width 0.3s ease",
          }} />
        </div>

        <div style={{ display: "grid", gap: "6px" }}>
          {current.checklist.map((item) => {
            const key = `${current.id}:${item.id}`;
            const checked = checkedItems[key] ?? false;
            const label = ko ? item.label.ko : item.label.en;

            return (
              <button
                key={item.id}
                onClick={() => onChecklistToggle?.(current.id, item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "none",
                  background: checked ? "rgba(52,199,89,0.06)" : "rgba(0,0,0,0.02)",
                  cursor: "pointer",
                  textAlign: "left" as const,
                  width: "100%",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  border: checked ? "none" : "1.5px solid rgba(17,17,17,0.15)",
                  background: checked ? "#34c759" : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}>
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: checked ? "var(--muted)" : "var(--text)",
                  textDecoration: checked ? "line-through" : "none",
                  lineHeight: 1.4,
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 전체 생애주기 보기 토글 */}
      <div style={{ borderTop: "1px solid rgba(17,17,17,0.06)" }}>
        <button
          onClick={() => setShowAllStages(!showAllStages)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            padding: "14px 22px",
            cursor: "pointer",
            fontSize: "13px",
            color: "var(--primary)",
            fontWeight: 600,
            textAlign: "left" as const,
          }}
        >
          {showAllStages
            ? (ko ? "접기" : "Collapse")
            : (ko ? "전체 생애주기 보기" : "View full lifecycle")}
        </button>

        {showAllStages && (
          <div style={{ padding: "0 22px 18px", display: "grid", gap: "4px" }}>
            {LIFECYCLE_STAGES.map((stage) => {
              const isCurrent = stage.id === current.id;
              const stageColor = getPhaseColor(stage.phase);

              return (
                <div key={stage.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: isCurrent ? `${stageColor}0A` : "transparent",
                  border: isCurrent ? `1px solid ${stageColor}20` : "1px solid transparent",
                }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: stageColor,
                    flexShrink: 0,
                    opacity: isCurrent ? 1 : 0.4,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: isCurrent ? 650 : 500,
                      color: isCurrent ? "var(--text)" : "var(--muted)",
                    }}>
                      {ko ? stage.title.ko : stage.title.en}
                    </div>
                  </div>
                  {isCurrent && (
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: stageColor,
                      padding: "3px 8px",
                      borderRadius: "999px",
                      background: `${stageColor}14`,
                    }}>
                      {ko ? "현재" : "Now"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
