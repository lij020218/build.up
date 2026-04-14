// ─── AI 인터뷰 스크립트 생성기 ───────────────────────────────────────────────
// Mom Test 원칙 기반 고객 인터뷰 질문지를 자동 생성합니다.

import Anthropic from "@anthropic-ai/sdk";

export type InterviewInput = {
  industryCategoryId: string;
  problemStatement: string;
  targetCustomer: string;
  language: "ko" | "en";
};

export type InterviewQuestion = {
  phase: string;
  question: string;
  purpose: string;
  followUp?: string;
};

export type InterviewScript = {
  title: string;
  duration: string;
  principles: string[];
  icebreaker: string;
  questions: InterviewQuestion[];
  closing: string;
  doNots: string[];
};

const SYSTEM_PROMPT = `당신은 Y Combinator와 IDEO에서 훈련받은 고객 인터뷰 전문가입니다.
Rob Fitzpatrick의 "The Mom Test" 원칙을 완벽하게 따릅니다.

핵심 원칙:
1. 솔루션을 말하지 마세요. 문제만 물어보세요.
2. 과거 행동을 물어보세요 (미래 의도 X). "~한 적 있나요?" > "~할 의향이 있나요?"
3. 칭찬을 구하지 마세요. "이 아이디어 어때요?"는 금지.
4. 구체적인 사례를 요청하세요. "가장 최근에 이 문제를 겪은 게 언제인가요?"
5. 돈과 시간의 진짜 비용을 파악하세요. "이 문제 때문에 얼마나 쓰고 있나요?"

반드시 아래 JSON 형식으로 응답하세요. JSON 외 다른 텍스트 없이:
{
  "title": "인터뷰 제목 (타겟 + 주제)",
  "duration": "권장 시간 (예: 25-30분)",
  "principles": ["인터뷰 전 기억할 핵심 원칙 3개"],
  "icebreaker": "첫 1-2분 아이스브레이커 질문",
  "questions": [
    {
      "phase": "도입 / 핵심 / 심화 / 마무리 중 하나",
      "question": "실제 질문 문장",
      "purpose": "이 질문의 의도 (인터뷰어만 보는 메모)",
      "followUp": "후속 질문 (선택)"
    }
  ],
  "closing": "인터뷰 마무리 멘트",
  "doNots": ["하지 말아야 할 것 3개"]
}

질문은 총 8-12개. 도입 2개, 핵심 4-5개, 심화 2-3개, 마무리 1-2개.
모든 질문은 개방형(Open-ended)이어야 합니다. 예/아니오로 끝나는 질문 금지.`;

export async function generateInterviewScript(
  input: InterviewInput,
  opts: { apiKey: string },
): Promise<InterviewScript> {
  const client = new Anthropic({ apiKey: opts.apiKey });

  const userPrompt = input.language === "ko"
    ? `업종: ${input.industryCategoryId}
해결하려는 문제: ${input.problemStatement}
타겟 고객: ${input.targetCustomer}

위 정보를 바탕으로 Mom Test 원칙에 맞는 고객 인터뷰 스크립트를 한국어로 생성해주세요.`
    : `Industry: ${input.industryCategoryId}
Problem to solve: ${input.problemStatement}
Target customer: ${input.targetCustomer}

Generate a Mom Test interview script in English based on the above.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // JSON 추출 + 정리
  let jsonStr = text;
  // markdown 코드블록 제거
  jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  // 가장 바깥 {} 추출
  const start = jsonStr.indexOf("{");
  const end = jsonStr.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Failed to find JSON in response");
  jsonStr = jsonStr.slice(start, end + 1);

  // 트레일링 콤마만 제거 (제어 문자는 건드리지 않음 — 파싱 실패 시 2차에서 처리)
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, "$1");

  try {
    return JSON.parse(jsonStr) as InterviewScript;
  } catch (e1) {
    // 2차 시도: 문자열 값 내부의 실제 줄바꿈을 이스케이프
    try {
      // JSON 문자열 안의 raw newline만 \\n으로 교체 (키-값 구조 밖의 줄바꿈은 무시)
      const fixed = jsonStr.replace(/"([^"]*?)"/g, (match) => {
        return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      });
      return JSON.parse(fixed) as InterviewScript;
    } catch (e2) {
      console.error("[interview/generate] JSON length:", jsonStr.length, "last 100 chars:", jsonStr.slice(-100));
      throw new Error(`JSON parse failed: ${e2 instanceof Error ? e2.message : String(e2)}`);
    }
  }
}
