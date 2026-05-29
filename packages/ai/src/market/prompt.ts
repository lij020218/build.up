import type { RecommendationItem } from "@foundone/shared";

export const MARKET_NARRATIVE_SYSTEM_PROMPT = `당신은 창업 로드맵 앱 Found.One의 상권 분석 해설가입니다.

규칙:
1. 제공된 점수 항목 데이터를 바탕으로 창업자 관점의 자연어 해설을 2~3문장으로 생성합니다.
2. 숫자를 그대로 나열하지 않습니다. 점수는 의미와 맥락으로 변환합니다.
3. 이 상권에서 무엇을 기대할 수 있고, 어디서 조심해야 하는지를 중심으로 씁니다.
4. 창업자가 바로 다음 행동을 생각할 수 있도록 실질적인 톤을 유지합니다.
5. 과도하게 긍정적이거나 부정적이지 않습니다.
6. 반드시 한국어로만 응답합니다.
7. 마크다운, JSON, 코드블록 없이 순수 텍스트 2~3문장만 반환합니다.`;

function getCategoryLabel(categoryId?: string): string {
  const labels: Record<string, string> = {
    "cafe-dessert": "카페/디저트",
    food: "외식",
    retail: "소매/유통",
    beauty: "뷰티",
    fitness: "피트니스",
    education: "교육",
    pet: "반려동물",
    "living-service": "생활 서비스",
    space: "공간/숙박",
    "online-digital": "온라인/디지털"
  };
  return labels[categoryId ?? ""] ?? "창업";
}

function getStartupTypeLabel(startupType?: string): string {
  if (startupType === "franchise") return "프랜차이즈";
  if (startupType === "independent") return "독립 창업";
  return "창업 방식 미정";
}

export function buildMarketNarrativeUserPrompt(
  item: RecommendationItem,
  params: { categoryId?: string; startupType?: string }
): string {
  const meta = item.meta ?? {};
  const categoryLabel = getCategoryLabel(params.categoryId);
  const startupTypeLabel = getStartupTypeLabel(params.startupType);

  const lines = [
    `업종: ${categoryLabel} (${startupTypeLabel})`,
    `상권명: ${item.title}`,
    `종합 점수: ${item.score !== undefined ? `${item.score} / 100` : "미산출"}`,
    "",
    "[점수 항목별 분석]",
    `- 예산 적합도: ${meta.scoreBudgetFit ?? "-"}`,
    `- 경쟁 강도: ${meta.scoreCompetition ?? "-"}`,
    `- 유동/수요: ${meta.scoreDemand ?? "-"}`,
    `- 업종 적합도: ${meta.scoreCategoryFit ?? "-"}`,
    `- 접근성: ${meta.scoreAccess ?? "-"}`,
    "",
    "[상권 특성]",
    `- 임대료 수준: ${meta.rentBand ?? "-"}`,
    `- 경쟁 밀도: ${meta.competitionLevel ?? "-"}`,
    `- 고객 적합도: ${meta.customerFit ?? "-"}`
  ];

  if (item.summary) {
    lines.push("", "[기존 요약]", item.summary);
  }

  lines.push(
    "",
    "위 데이터를 바탕으로 창업자 관점에서 이 상권의 핵심 특성과 주의점을 2~3문장으로 설명해 주세요.",
    "숫자는 직접 언급하지 말고, 창업 준비에 실질적으로 도움이 되는 해설로 변환해 주세요."
  );

  return lines.join("\n");
}
