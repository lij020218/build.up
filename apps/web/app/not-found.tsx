"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f7",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      color: "#1d1d1f",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: "72px", fontWeight: 700, letterSpacing: "-0.04em",
        color: "rgba(29,29,31,0.12)", lineHeight: 1, marginBottom: "24px",
      }}>
        404
      </div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
        페이지를 찾을 수 없어요
      </h1>
      <p style={{ fontSize: "15px", color: "#6e6e73", margin: "0 0 32px", maxWidth: "340px", lineHeight: 1.5 }}>
        주소를 다시 확인하거나, 아래 버튼으로 대시보드로 돌아가세요.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: "12px 22px", borderRadius: "980px",
            border: "1.5px solid rgba(29,29,31,0.18)",
            background: "transparent", cursor: "pointer",
            fontSize: "15px", fontWeight: 500, color: "#1d1d1f",
          }}
        >
          이전 페이지
        </button>
        <button
          type="button"
          onClick={() => { window.location.assign("/"); }}
          style={{
            padding: "12px 22px", borderRadius: "980px",
            border: "none", background: "#1d3557",
            cursor: "pointer", fontSize: "15px", fontWeight: 500, color: "#fff",
          }}
        >
          대시보드로 이동
        </button>
      </div>
    </div>
  );
}
