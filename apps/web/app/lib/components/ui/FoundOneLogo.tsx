// Found.One 브랜드 로고 락업 — 나선(fieri) 마크 + "Found.One" 세리프 워드마크.
//   글씨체: 비즈니스 클래식 세리프 스택(격조·신뢰). 시스템 세리프라 외부 폰트 의존 0 → 빌드/렌더 안전.
//   "." 은 마크색 액센트. wordColor 기본 currentColor → 부모 색 상속(어두운/밝은 배경 모두 안전).
import type { CSSProperties } from "react";
import { FoundOneSpiralLogo } from "./FoundOneSpiralLogo";

const SERIF =
  '"Hoefler Text", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif';

export function FoundOneLogo({
  height = 28,
  direction = "row",
  markColor = "#3A3AC8",
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
  const fontSize = Math.round(height * (col ? 0.62 : 0.9));
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: col ? "column" : "row",
        alignItems: "center",
        gap: col ? Math.round(height * 0.24) : Math.round(height * 0.32),
        ...style,
      }}
    >
      <FoundOneSpiralLogo size={height} color={markColor} style={{ flexShrink: 0 }} />
      {showWordmark && (
        <span
          style={{
            fontFamily: SERIF,
            fontSize,
            fontWeight: 600,
            letterSpacing: "0.005em",
            color: wordColor,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Found<span style={{ color: markColor }}>.</span>One
        </span>
      )}
    </span>
  );
}

export default FoundOneLogo;
