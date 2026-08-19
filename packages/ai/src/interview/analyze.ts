// ─── AI 인터뷰 결과 분석기 ───────────────────────────────────────────────────
// 인터뷰 노트를 입력하면 패턴, 핵심 고통, 초기 타겟 세그먼트를 추출합니다.

import { createAiClient } from "../utils/client";
import { systemWithCache } from "../utils/client";
import { parseLlmJson } from "../utils/parse-json";
import type { ResponseSchema } from "../utils/structured-output";

export type InterviewAnalysisInput = {
  interviewNotes: string;
  industryCategoryId: string;
  language: "ko" | "en";
};

export type InterviewAnalysisResult = {
  patterns: Array<{ pattern: string; frequency: string; quotes: string[] }>;
  corePain: string;
  targetSegment: string;
  existingAlternatives: string[];
  willingnessToPaySignals: string[];
  oneProblemStatement: string;
  nextSteps: string[];
};

/** Structured Outputs 스키마 — InterviewAnalysisResult 1:1 */
export const INTERVIEW_ANALYSIS_RESPONSE_SCHEMA: ResponseSchema = {
  name: "interview_analysis",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["patterns", "corePain", "targetSegment", "existingAlternatives", "willingnessToPaySignals", "oneProblemStatement", "nextSteps"],
    properties: {
      patterns: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pattern", "frequency", "quotes"],
          properties: {
            pattern: { type: "string" },
            frequency: { type: "string" },
            quotes: { type: "array", items: { type: "string" } },
          },
        },
      },
      corePain: { type: "string" },
      targetSegment: { type: "string" },
      existingAlternatives: { type: "array", items: { type: "string" } },
      willingnessToPaySignals: { type: "array", items: { type: "string" } },
      oneProblemStatement: { type: "string" },
      nextSteps: { type: "array", items: { type: "string" } },
    },
  },
};

const SYSTEM_PROMPT = `당신은 YC 파트너 출신의 고객 인사이트 분석 전문가입니다.
인터뷰 노트를 분석하여 패턴, 핵심 고통, 초기 타겟을 추출합니다.

분석 원칙:
1. 의견이 아닌 행동에서 패턴을 찾으세요. "~하고 싶다"가 아닌 "실제로 ~했다"를 추적합니다.
2. 빈도를 세세요. 3명 이상이 같은 행동/불만을 언급하면 패턴입니다.
3. 돈과 시간 신호를 찾으세요. 이미 대안에 돈을 쓰고 있으면 지불 의사가 있습니다.
4. 가장 좁은 세그먼트를 정의하세요. "모든 사장님"이 아닌 "월매출 3천만 이하 카페 사장님" 수준으로.

반드시 아래 JSON만 응답하세요:
{
  "patterns": [
    { "pattern": "반복 패턴 설명", "frequency": "10명 중 7명", "quotes": ["실제 인용 1", "실제 인용 2"] }
  ],
  "corePain": "가장 절실한 핵심 고통 한 문장",
  "targetSegment": "가장 좁은 초기 타겟 세그먼트 (누가, 어떤 상황에서)",
  "existingAlternatives": ["현재 대안 1", "현재 대안 2"],
  "willingnessToPaySignals": ["지불 의사 신호 1", "지불 의사 신호 2"],
  "oneProblemStatement": "우리가 해결할 하나의 문제 문장",
  "nextSteps": ["다음 행동 1", "다음 행동 2", "다음 행동 3"]
}`;

export async function analyzeInterviews(
  input: InterviewAnalysisInput,
  opts: { apiKey: string },
): Promise<InterviewAnalysisResult> {
  const client = createAiClient(opts.apiKey);

  const userPrompt = input.language === "ko"
    ? `업종: ${input.industryCategoryId}

아래는 고객 인터뷰 노트입니다. 분석해주세요.

<interview_notes>
${input.interviewNotes}
</interview_notes>`
    : `Industry: ${input.industryCategoryId}

Below are customer interview notes. Analyze them.

<interview_notes>
${input.interviewNotes}
</interview_notes>`;

  const response = await client.messages.create({
    model: "gpt-5.4-mini",
    max_tokens: 4096,
    // ✦ Prompt Caching — interview analysis system prompt 안정 재사용
    system: systemWithCache(SYSTEM_PROMPT),
    messages: [{ role: "user", content: userPrompt }],
    response_schema: INTERVIEW_ANALYSIS_RESPONSE_SCHEMA,
  });

  const text = (() => { const t = response.content.find((c) => c.type === "text"); return t && t.type === "text" ? t.text : ""; })();

  // Structured Outputs 로 문법은 보장 — parseLlmJson(4단계 복구) 은 안전망
  return parseLlmJson<InterviewAnalysisResult>(text);
}
