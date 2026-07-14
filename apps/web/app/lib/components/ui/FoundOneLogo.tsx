// Found.One 브랜드 로고 락업 — fieri 나선 마크 + "FOUND.ONE" 워드마크(공식 서체).
//   2026-07-14: 세리프 텍스트 → 공식 로고(사장님 제공)로 교체. 마크는 앱의 매끄러운 스파이럴
//   (제공 SVG 의 추적 초승달보다 고품질), 워드마크는 FoundOneWordmark(F 보정·색상대응).
//   wordColor 기본 currentColor → 부모 색 상속(어두운/밝은 배경 모두 안전).
import type { CSSProperties } from "react";
import { FoundOneSpiralLogo } from "./FoundOneSpiralLogo";
import { FoundOneWordmark } from "./FoundOneWordmark";

// 이미지 기준 색: 미드나잇 네이비 마크/점.
const MARK_NAVY = "#172A78";

export function FoundOneLogo({
  height = 28,
  direction = "row",
  markColor = MARK_NAVY,
  wordColor = "currentColor",
  showWordmark = true,
  style,
}: {
  height?: number;
  direction?: "row" | "column";
  markColor?: string;
  wordColor?: string;
  showWordmark?: boolean;
  style?: CSSProperties;
}) {
  const col = direction === "column";
  // 이미지 비례: 워드마크 캡 높이 ≈ 마크 지름의 0.38, 간격 ≈ 0.34.
  const wordmarkHeight = Math.max(10, Math.round(height * (col ? 0.34 : 0.38)));
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: col ? "column" : "row",
        alignItems: "center",
        gap: col ? Math.round(height * 0.22) : Math.round(height * 0.34),
        ...style,
      }}
    >
      <FoundOneSpiralLogo size={height} color={markColor} style={{ flexShrink: 0 }} />
      {showWordmark && (
        <FoundOneWordmark height={wordmarkHeight} color={wordColor} dotColor={markColor} style={{ flexShrink: 0 }} />
      )}
    </span>
  );
}

export default FoundOneLogo;
