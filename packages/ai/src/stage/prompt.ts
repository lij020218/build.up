export type StageBriefParams = {
  stageId: string;
  categoryId?: string;
  startupType?: string;
  capital?: number;
  businessModelId?: string;
};

export type StageBriefResult = {
  headline: string;
  context: string;
  actions: string[];
  commonMistakes: string[];
  readyWhen: string;
};

export const STAGE_BRIEF_SYSTEM_PROMPT = `당신은 창업 로드맵 앱 build.up의 단계별 안내 도우미입니다.

규칙:
1. 창업자가 이 단계에 진입했을 때 바로 도움이 되는 실질적인 안내를 생성합니다.
2. 업종, 창업 방식, 예산 정보가 제공된 경우 그에 맞게 구체화합니다.
3. 일반론이 아닌, 이 단계에서 실제로 해야 할 일을 중심으로 씁니다.
4. 반드시 JSON만 반환합니다. 마크다운 코드블록 없이 JSON 객체만 출력합니다.
5. 반드시 한국어로 작성합니다.

응답 형식:
{
  "headline": "이 단계를 한 문장으로 표현한 제목 (창업자 행동 중심)",
  "context": "지금 이 단계가 왜 중요한지 2~3문장 설명",
  "actions": ["지금 당장 해야 할 행동1", "행동2", "행동3"],
  "commonMistakes": ["이 단계에서 자주 하는 실수1", "실수2"],
  "readyWhen": "다음 단계로 넘어갈 준비가 된 시점을 한 문장으로"
}`;

const STAGE_LABELS: Record<string, string> = {
  "industry-selection": "업종 선택",
  "startup-type": "창업 방식 결정",
  "business-model": "운영 모델 선택",
  "budget-setup": "예산 및 일정 설정",
  "location-candidates": "입지 후보 비교",
  "contract-review": "계약 전 검토",
  "opening-preparation": "오픈 준비",
  "permit-guide": "허가 및 등록 안내",
  "tax-guide": "세금 설정 안내",
  "loan-guide": "대출 안내"
};

const STAGE_GOALS: Record<string, string> = {
  "industry-selection": "사업 카테고리를 확정해 이후 모든 안내의 방향을 잡습니다.",
  "startup-type": "독립 창업 또는 프랜차이즈 여부를 결정합니다.",
  "business-model": "매장 운영 방식(홀 식사, 배달, 테이크아웃 등)을 선택합니다.",
  "budget-setup": "가용 자본과 목표 오픈 일정을 설정합니다.",
  "location-candidates": "예산과 업종에 맞는 상권 후보를 비교합니다.",
  "contract-review": "임대차 계약 전 용도, 시설, 제한 조건을 확인합니다.",
  "opening-preparation": "공급업체, 인테리어, 장비, POS를 확정합니다.",
  "permit-guide": "업종별 허가와 영업 등록 절차를 확인합니다.",
  "tax-guide": "사업자 등록과 세금 처리 방법을 준비합니다.",
  "loan-guide": "창업 자금 대출 조건과 신청 방법을 검토합니다."
};

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
  return labels[categoryId ?? ""] ?? "미선택";
}

function getStartupTypeLabel(startupType?: string): string {
  if (startupType === "franchise") return "프랜차이즈";
  if (startupType === "independent") return "독립 창업";
  return "미정";
}

function formatCapital(capital?: number): string {
  if (!capital) return "미입력";
  if (capital >= 100000000) return `${(capital / 100000000).toFixed(1)}억 원`;
  if (capital >= 10000000) return `${Math.round(capital / 10000000) * 1000}만 원`;
  return `${(capital / 10000).toFixed(0)}만 원`;
}

export function buildStageBriefUserPrompt(params: StageBriefParams): string {
  const stageLabel = STAGE_LABELS[params.stageId] ?? params.stageId;
  const stageGoal = STAGE_GOALS[params.stageId] ?? "이 단계를 완료합니다.";

  const lines = [
    `[현재 단계]`,
    `단계 ID: ${params.stageId}`,
    `단계명: ${stageLabel}`,
    `단계 목표: ${stageGoal}`,
    "",
    "[창업자 프로필]",
    `업종: ${getCategoryLabel(params.categoryId)}`,
    `창업 방식: ${getStartupTypeLabel(params.startupType)}`,
    `가용 자본: ${formatCapital(params.capital)}`
  ];

  if (params.businessModelId) {
    lines.push(`운영 모델: ${params.businessModelId}`);
  }

  lines.push(
    "",
    "위 정보를 바탕으로 창업자가 이 단계에 막 진입했을 때 도움이 되는 단계별 안내를 JSON 형식으로 생성해 주세요.",
    "업종과 창업 방식에 맞는 구체적인 액션과 흔한 실수를 포함해 주세요."
  );

  return lines.join("\n");
}
