import { ImageResponse } from "next/og";

// 소셜 공유 미리보기(카카오톡·페북·X) — 크롤러가 렌더 못 하는 SVG 대신 next/og 로 PNG 생성.
//   레포에 한글 폰트가 없어(Pretendard는 CDN) 임베드 불가 → tofu(□) 방지 위해 Latin 워드마크 중심.
//   한글 태그라인 폰트 임베드는 추후 폰트 파일 추가 후.
export const alt = "Found.One — all-in-one mentoring for founders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "96px",
          background: "linear-gradient(135deg, #0f0f4a 0%, #1d3557 55%, #2c4f80 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px", marginBottom: "32px" }}>
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "24px",
              background: "#ffffff",
              color: "#191970",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "54px",
              fontWeight: 800,
            }}
          >
            F
          </div>
          <div style={{ fontSize: "72px", fontWeight: 800, letterSpacing: "-3px" }}>Found.One</div>
        </div>
        <div style={{ fontSize: "46px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-1px" }}>
          The all-in-one mentor for founders
        </div>
        <div style={{ fontSize: "30px", fontWeight: 500, marginTop: "18px", color: "rgba(255,255,255,0.72)" }}>
          Roadmap · Sales · Tax · Funding · Location
        </div>
      </div>
    ),
    { ...size }
  );
}
