// ─── 공통 AI 응답 구조 ────────────────────────────────────────────────────────
// 모든 AI 해석 기능이 이 4칸 형식을 따릅니다.

export type AiStructuredResponse = {
  summary: string;        // 한 줄 요약
  rationale: string[];    // 근거 (2~4개)
  warnings: string[];     // 주의할 점 (0~3개, 위험 없으면 빈 배열)
  nextActions: string[];  // 다음 행동 (2~4개, 구체적인 액션)
};

export type GuideAiStructuredResponse = {
  shortAnswer: string;
  explanation: string;
  cautions: string[];
  nextActions: string[];
  confidence: "high" | "medium" | "check_needed";
};

// ─── AI 호출 옵션 ─────────────────────────────────────────────────────────────

export type AiCallOptions = {
  apiKey: string;
  model?: string;        // 기본값: claude-sonnet-4-6
  maxTokens?: number;    // 기본값: 1024
};

// ─── 파싱 에러 ────────────────────────────────────────────────────────────────

export class AiParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string
  ) {
    super(message);
    this.name = "AiParseError";
  }
}
