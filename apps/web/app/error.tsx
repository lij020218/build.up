"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
        문제가 발생했습니다
      </h2>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
        일시적인 오류입니다. 다시 시도해 주세요.
      </p>
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
  );
}
