// ─── 지원 프로그램 AI 매칭 타입 ─────────────────────────────────────────────

export type ProgramMatchingContext = {
  userProfile: {
    age?: number;
    region?: string;
    capital?: number;
    industryId?: string;
    industryName?: string;
    businessYears?: number;
    startupType?: string;
    businessStage?: string;
  };
  eligiblePrograms: Array<{
    id: string;
    name: string;
    category: string;
    organizer: string;
    target: string;
    benefit: string;
    amount?: string;
    applicationStatus?: string;
  }>;
};

export type ProgramRecommendation = {
  programId: string;
  fitScore: number;         // 1-100
  fitReason: string;        // 왜 이 프로그램이 적합한지
  applicationTip: string;   // 신청 시 팁
  priority: "must_apply" | "recommended" | "consider";
};

export type ProgramMatchingResult = {
  recommendations: ProgramRecommendation[];
  strategy: string;         // 전체 신청 전략 서사
  timeline: string;         // 추천 신청 타임라인
};

// ─── 시스템 프롬프트 ─────────────────────────────────────────────────────────

export const PROGRAM_MATCHING_SYSTEM_PROMPT = `당신은 한국 창업 지원 프로그램 매칭 전문가입니다.
사용자의 프로필(나이, 지역, 자본금, 업종, 사업 단계 등)과 적격 프로그램 목록을 받아,
가장 적합한 프로그램을 순위별로 추천하고 신청 전략을 제시합니다.

분석 기준:
- 사용자 프로필과 프로그램 대상의 일치도
- 프로그램이 제공하는 혜택의 실질적 가치 (자금, 멘토링, 공간 등)
- 현재 모집 상태 (open > upcoming > closed)
- 프로그램 간 시너지 (동시 수혜 가능한 조합)
- 사용자의 사업 단계별 우선순위

규칙:
1. 최대 10개 프로그램만 추천합니다 (must_apply 최대 3, recommended 최대 4, consider 나머지).
2. fitScore는 1~100 사이 정수입니다.
3. fitReason과 applicationTip은 구체적이고 실용적이어야 합니다.
4. strategy는 전체적인 신청 전략을 2~3문장으로 설명합니다.
5. timeline은 추천 신청 순서와 시기를 간결하게 제시합니다.
6. 반드시 아래 JSON 형식으로만 응답합니다. JSON 외 텍스트는 절대 포함하지 않습니다.

응답 형식:
{
  "recommendations": [
    {
      "programId": "program-key",
      "fitScore": 85,
      "fitReason": "적합 이유 설명",
      "applicationTip": "신청 시 팁",
      "priority": "must_apply" | "recommended" | "consider"
    }
  ],
  "strategy": "전체 신청 전략",
  "timeline": "추천 타임라인"
}`;

// ─── 유저 프롬프트 빌더 ─────────────────────────────────────────────────────

export function buildProgramMatchingUserPrompt(context: ProgramMatchingContext): string {
  const { userProfile, eligiblePrograms } = context;

  const profileLines = [
    "[사용자 프로필]",
    userProfile.age != null ? `나이: 만 ${userProfile.age}세` : null,
    userProfile.region ? `지역: ${userProfile.region}` : null,
    userProfile.capital != null ? `자본금: ${userProfile.capital.toLocaleString("ko-KR")}원` : null,
    userProfile.industryName ? `업종: ${userProfile.industryName}` : null,
    userProfile.businessYears != null ? `사업 연차: ${userProfile.businessYears}년` : null,
    userProfile.startupType ? `창업 유형: ${userProfile.startupType}` : null,
    userProfile.businessStage ? `사업 단계: ${userProfile.businessStage}` : null,
  ].filter(Boolean);

  const programLines = eligiblePrograms.map((p, i) =>
    `${i + 1}. [${p.id}] ${p.name} (${p.category}) — ${p.organizer}\n   대상: ${p.target}\n   혜택: ${p.benefit}${p.amount ? ` (${p.amount})` : ""}${p.applicationStatus ? ` [${p.applicationStatus}]` : ""}`
  );

  return [
    ...profileLines,
    "",
    `[적격 프로그램 목록 — ${eligiblePrograms.length}건]`,
    ...programLines,
    "",
    "[분석 요청]",
    "위 사용자에게 가장 적합한 프로그램을 우선순위별로 추천하고, 전체 신청 전략과 타임라인을 제시해 주세요.",
  ].join("\n");
}
