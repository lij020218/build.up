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
  apiKey: string;         // Anthropic 모듈은 ANTHROPIC_API_KEY, OpenAI 모듈은 OPENAI_API_KEY
  model?: string;         // Anthropic 기본: claude-sonnet-4-6 | OpenAI 기본: gpt-5.4-mini
  maxTokens?: number;     // 기본값: 1024
  /** 자가개선: 사장님이 "안 맞아요"로 표시한 최근 코칭 블록 — user prompt 끝에 append 해 회피 유도. */
  negativeFeedbackBlock?: string;
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
