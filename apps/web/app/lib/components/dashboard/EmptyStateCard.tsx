"use client";

import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * 공통 Empty State 카드.
 *
 * 데이터 부족 시 카드가 사라지거나 "--"로 공허한 느낌을 주지 않도록
 * 일관된 톤·색상·레이아웃으로 "왜 비어 있는지 + 뭘 하면 열리는지"를 명확히 전달.
 *
 * 스트레스 최소화 원칙:
 * - 크기 작게 (본 카드보다 80% 크기)
 * - 색상 중립 (회색 톤)
 * - 긍정적 프레이밍 ("기다려" 대신 "곧 열립니다")
 * - 액션 버튼 있을 때만 표시 (없으면 자체 완결)
 */

type Props = {
  /** 상단 작은 라벨 (카드 정체성) */
  eyebrow: string;
  /** 메인 타이틀 — 간결 */
  title: string;
  /** 서브 설명 — 왜 비어 있는지 + 뭐가 필요한지 */
  description: string;
  /** 아이콘 (선택) */
  Icon?: LucideIcon;
  /** 액션 CTA (선택) */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** 진행 상황 표시 (선택) — 예: {current: 2, target: 7, unit: "일"} */
  progress?: {
    current: number;
    target: number;
    unitKo: string;
    unitEn: string;
  };
  /** 언어 */
  ko: boolean;
  /** 최소 여백 모드 (다른 카드 안에 삽입될 때) */
  compact?: boolean;
};

export function EmptyStateCard({
  eyebrow,
  title,
  description,
  Icon,
  action,
  progress,
  ko,
  compact = false,
}: Props) {
  const progressPct = progress
    ? Math.min(100, (progress.current / progress.target) * 100)
    : 0;

  return (
    <section
      style={{
        borderRadius: "20px",
        padding: compact ? "18px 20px" : "24px 22px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.85) 100%)",
        border: "1px solid rgba(15,23,42,0.05)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset",
      }}
      className="bento-card"
    >
      {/* Eyebrow */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: 650,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: "rgba(15,23,42,0.35)",
          marginBottom: "4px",
        }}
      >
        {eyebrow}
      </div>

      {/* Title + Icon */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "6px",
        }}
      >
        {Icon && (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              background: "rgba(15,23,42,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <Icon size={17} strokeWidth={1.5} color="rgba(15,23,42,0.55)" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 680,
              letterSpacing: "-0.02em",
              color: "rgba(15,23,42,0.85)",
              lineHeight: 1.35,
              marginBottom: "4px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "12.5px",
              fontWeight: 500,
              color: "rgba(15,23,42,0.5)",
              lineHeight: 1.55,
            }}
          >
            {description}
          </div>
        </div>
      </div>

      {/* Progress bar (선택) */}
      {progress && (
        <div style={{ marginTop: "12px", marginLeft: Icon ? "44px" : "0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "5px",
            }}
          >
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 650,
                color: "rgba(15,23,42,0.45)",
              }}
            >
              {ko ? `${progress.current}/${progress.target} ${progress.unitKo}` : `${progress.current}/${progress.target} ${progress.unitEn}`}
            </span>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 650,
                color: progressPct >= 100 ? "#059669" : "rgba(15,23,42,0.4)",
              }}
            >
              {Math.round(progressPct)}%
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "rgba(15,23,42,0.06)",
              borderRadius: "2px",
              overflow: "hidden" as const,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: progressPct >= 100 ? "#059669" : "rgba(15,23,42,0.35)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Action CTA (선택) */}
      {action && (
        <div style={{ marginTop: "14px", marginLeft: Icon ? "44px" : "0" }}>
          <button
            type="button"
            onClick={action.onClick}
            style={{
              padding: "7px 14px",
              borderRadius: "9px",
              border: "1px solid rgba(15,23,42,0.08)",
              background: "rgba(255,255,255,0.9)",
              fontSize: "12px",
              fontWeight: 650,
              color: "rgba(15,23,42,0.7)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "rgba(15,23,42,0.15)";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.9)";
              e.currentTarget.style.borderColor = "rgba(15,23,42,0.08)";
              e.currentTarget.style.color = "rgba(15,23,42,0.7)";
            }}
          >
            {action.label}
            <ArrowRight size={12} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </section>
  );
}
