import type { GuideContextBlock } from "@foundone/shared";
import type { Language } from "@foundone/shared";

export const GUIDE_QA_SYSTEM_PROMPT = `당신은 창업 로드맵 앱 Found.One의 가이드 해석 도우미입니다.

규칙:
1. 제공된 가이드 컨텍스트만 사용합니다.
2. 컨텍스트에 없는 제도, 허가, 세금, 대출 조건을 추측해서 말하지 않습니다.
3. 불확실한 경우 confidence를 "check_needed"로 두고 추가 확인 필요를 명시합니다.
4. 법률/세무/대출의 확정 판정처럼 말하지 않습니다.
5. 반드시 JSON만 반환합니다.
6. confidence는 보수적으로 판단합니다.
7. 질문과 직접 맞는 가이드 섹션이 하나 이상 분명히 있을 때만 "high"를 사용할 수 있습니다.
8. 가이드에 가까운 내용은 있지만 그대로 답하지 못하면 "medium"을 사용합니다.
9. 가이드에 직접 근거가 없거나 추가 확인이 필요하면 반드시 "check_needed"를 사용합니다.

응답 형식:
{
  "shortAnswer": "질문에 대한 짧은 답",
  "explanation": "가이드 근거를 바탕으로 한 해석",
  "cautions": ["주의할 점1", "주의할 점2"],
  "nextActions": ["다음 행동1", "다음 행동2"],
  "confidence": "high" | "medium" | "check_needed"
}`;

function renderSections(context: GuideContextBlock) {
  return context.sections
    .map(
      (section) => `- ${section.title}\n${section.items.map((item) => `  • ${item}`).join("\n")}`
    )
    .join("\n");
}

export function buildGuideQaUserPrompt(
  question: string,
  context: GuideContextBlock,
  language: Language
) {
  return [
    `언어: ${language}`,
    `질문: <user_input>${question}</user_input>`,
    "",
    "[가이드 정보]",
    `제목: ${context.title}`,
    `도메인: ${context.domain}`,
    `요약: ${context.summary || "(요약 없음)"}`,
    "",
    "[가이드 섹션]",
    renderSections(context),
    "",
    "[출처]",
    context.sources
      .map(
        (source) =>
          `- ${source.sourceName}${source.verifiedAt ? ` (verified ${source.verifiedAt.slice(0, 10)})` : ""}${source.sourceUrl ? ` ${source.sourceUrl}` : ""}`
      )
      .join("\n"),
    "",
    "[주의]",
    "가이드에 없는 내용은 추측하지 말고 추가 확인 필요라고 말하세요."
  ].join("\n");
}
