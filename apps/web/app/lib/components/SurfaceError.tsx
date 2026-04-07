"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Surface별 에러 바운더리 UI.
 * 각 라우트의 error.tsx에서 재사용합니다.
 * 전체 페이지가 아닌 해당 탭/섹션만 에러 상태로 표시합니다.
 */
export function SurfaceError({
  error,
  reset,
  surfaceLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  surfaceLabel?: string;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "40vh",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "rgba(220,38,38,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          fontSize: "20px",
        }}
      >
        ⚠
      </div>
      <h2 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "6px", color: "#0f172a" }}>
        {surfaceLabel ? `${surfaceLabel} 로딩에 실패했습니다` : "이 화면을 불러올 수 없습니다"}
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", textAlign: "center", maxWidth: "360px", lineHeight: 1.5 }}>
        일시적인 오류입니다. 다시 시도하거나 다른 탭으로 이동해 보세요.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre style={{ fontSize: "11px", color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: "8px", maxWidth: "500px", overflow: "auto", marginBottom: "14px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        style={{
          padding: "9px 22px",
          borderRadius: "10px",
          border: "none",
          background: "#1d3557",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
