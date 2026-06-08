import { ImageResponse } from "next/og";

// favicon — next/og 로 PNG 생성(브라우저·소셜 호환). 브랜드 "F" 마크.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1d3557 0%, #191970 100%)",
          color: "#ffffff",
          fontSize: "42px",
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: "14px",
        }}
      >
        F
      </div>
    ),
    { ...size }
  );
}
