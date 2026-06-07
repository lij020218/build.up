"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 카드 이름 — 에러 메시지에 표시 (예: "AI 코치", "계약서 분석") */
  cardLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * AI 카드/위젯 단위 에러 바운더리.
 * 개별 카드가 에러나도 나머지 대시보드는 정상 동작합니다.
 *
 * 사용법:
 * ```tsx
 * <CardErrorBoundary cardLabel="AI 코치">
 *   <AiCoachCard />
 * </CardErrorBoundary>
 * ```
 */
export class CardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: {
        componentStack: { value: errorInfo.componentStack ?? "" },
        cardLabel: { value: this.props.cardLabel ?? "unknown" },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid rgba(182,76,76,0.15)",
            background: "rgba(254,242,242,0.5)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#b64c4c", marginBottom: "6px" }}>
            {this.props.cardLabel
              ? `${this.props.cardLabel} 로딩 실패`
              : "이 영역을 표시할 수 없습니다"}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            일시적인 오류입니다. 새로고침하면 복구될 수 있습니다.
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre style={{ fontSize: "10px", color: "#b64c4c", background: "#fef2f2", padding: "8px", borderRadius: "6px", textAlign: "left", overflow: "auto", maxHeight: "80px", marginBottom: "10px" }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(182,76,76,0.2)",
              background: "white",
              color: "#b64c4c",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
