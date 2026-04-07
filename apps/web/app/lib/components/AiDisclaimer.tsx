"use client";

/**
 * AI 응답에 표시하는 면책 고지.
 * dismiss 불가, 모든 AI 기능 카드 하단에 고정 표시.
 */
export function AiDisclaimer({ language = "ko" }: { language?: "ko" | "en" }) {
  const text =
    language === "ko"
      ? "AI가 제공하는 분석은 참고 목적이며, 법률·세무·투자 조언이 아닙니다. 중요한 의사결정 전에 반드시 전문가와 상담하세요."
      : "AI analysis is for reference only and does not constitute legal, tax, or investment advice. Consult a professional before making important decisions.";

  return (
    <div
      style={{
        marginTop: 12,
        padding: "8px 12px",
        borderRadius: 8,
        background: "#f8f9fa",
        border: "1px solid #e9ecef",
        fontSize: 11,
        color: "#868e96",
        lineHeight: 1.5,
      }}
    >
      <span style={{ marginRight: 4 }}>ℹ️</span>
      {text}
    </div>
  );
}
