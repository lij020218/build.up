"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * 전역 에러 바운더리 — root layout.tsx에서 발생한 에러를 처리합니다.
 * Next.js App Router에서 global-error.tsx는 <html>/<body>를 직접 렌더링해야 합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            fontFamily: "inherit",
            background: "#fafafa",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
            앱에 문제가 발생했습니다
          </h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre style={{ fontSize: "11px", color: "#dc2626", background: "#fef2f2", padding: "12px", borderRadius: "8px", maxWidth: "600px", overflow: "auto", marginBottom: "16px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {error.message}
              {error.stack?.split("\n").slice(0, 5).join("\n")}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              background: "#1d3557",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
