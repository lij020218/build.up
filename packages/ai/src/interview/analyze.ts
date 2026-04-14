// ─── AI 인터뷰 결과 분석기 ───────────────────────────────────────────────────
// 인터뷰 노트를 입력하면 패턴, 핵심 고통, 초기 타겟 세그먼트를 추출합니다.

import Anthropic from "@anthropic-ai/sdk";

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
  const client = new Anthropic({ apiKey: opts.apiKey });

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
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  let jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  const start = jsonStr.indexOf("{");
  const end = jsonStr.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Failed to find JSON");
  jsonStr = jsonStr.slice(start, end + 1);
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, "$1");

  try {
    return JSON.parse(jsonStr) as InterviewAnalysisResult;
  } catch {
    const fixed = jsonStr.replace(/"([^"]*?)"/g, (match) =>
      match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
    );
    return JSON.parse(fixed) as InterviewAnalysisResult;
  }
}
