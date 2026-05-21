// ────────────────────────────────────────────────────────────────────────────
//  한국 정부 지원·정책자금·통계 SSOT (Single Source of Truth)
//
//  목적:
//    - AI prompt 내 stale 하드코딩 (4대보험 옛 요율·1.4억 거짓 등) 재발 방지
//    - 변동값을 한 파일에서 갱신하면 모든 AI 호출에 반영
//    - 매 호출 시 user prompt 에 출처 일자와 함께 inject 가능
//
//  업데이트 규칙:
//    - 매년 1월·7월 두 번 점검 (정책자금 한도 / 4대보험 요율 / 최저시급 갱신 시점)
//    - 변경 시 lastVerified 일자 함께 수정
//    - 출처 URL 주석에 명시
// ────────────────────────────────────────────────────────────────────────────

// 명명 충돌 회피: packages/shared/src/policy-funds/catalog-2026.ts 의 PolicyFundProgram 와 다른
// 목적·필드 셋. 이쪽은 AI prompt 인용 전용으로 한도·금리·출처일자만 보관.
export type KoreaPolicyFundEntry = {
  /** 프로그램명 (한국 정부 공식 명칭) */
  name: string;
  /** 최대 한도 (원) */
  maxAmount: number;
  /** 표시용 라벨 (예: "최대 1억원") */
  maxAmountLabel: string;
  /** 대상 조건 요약 */
  eligibility: string;
  /** 출처 URL */
  source: string;
  /** 마지막 검증 일자 */
  lastVerified: string;
  /** 금리 (변동 시 undefined) */
  interestRate?: string;
};

/**
 * 한국 창업·운영 자금 지원 프로그램 목록.
 *
 *  ⚠️ 모든 한도·금리는 시점에 따라 변경됨 — AI prompt 에 인용 시 반드시 lastVerified 도
 *     함께 inject 하고 "출처 일자 이후 변경 가능성" 안내문 추가.
 */
export const KOREA_POLICY_FUNDS: readonly KoreaPolicyFundEntry[] = [
  {
    name: "소상공인 정책자금 (일반경영안정자금)",
    maxAmount: 500_000_000,
    maxAmountLabel: "최대 5억원",
    eligibility: "소상공인 (상시근로자 5인 미만, 제조·건설·운수·광업은 10인 미만)",
    source: "https://www.semas.or.kr",
    lastVerified: "2026-05",
    interestRate: "변동 (~2.96% 수준, 분기 갱신)",
  },
  {
    name: "예비창업패키지",
    maxAmount: 100_000_000,
    maxAmountLabel: "최대 1억원",
    eligibility: "창업 전 또는 창업 3년 이내",
    source: "https://www.k-startup.go.kr",
    lastVerified: "2026-05",
  },
  {
    name: "초기창업패키지",
    maxAmount: 100_000_000,
    maxAmountLabel: "최대 1억원",
    eligibility: "창업 3년 이내",
    source: "https://www.k-startup.go.kr",
    lastVerified: "2026-05",
  },
  {
    name: "청년창업자금",
    maxAmount: 100_000_000,
    maxAmountLabel: "최대 1억원",
    eligibility: "만 39세 이하",
    source: "https://www.semas.or.kr",
    lastVerified: "2026-05",
    interestRate: "2.5% 고정",
  },
  {
    name: "TIPS (Tech Incubator Program for Startup)",
    maxAmount: 800_000_000,
    maxAmountLabel: "R&D 최대 8억원",
    eligibility: "기술 스타트업, 운영사 추천 필요",
    source: "https://www.jointips.or.kr",
    lastVerified: "2026-05",
  },
  {
    name: "긴급경영안정자금",
    maxAmount: 70_000_000,
    maxAmountLabel: "최대 7천만원",
    eligibility: "재해·매출 급감 등 위기 사업자",
    source: "https://www.semas.or.kr",
    lastVerified: "2026-05",
  },
] as const;

/**
 * 한국 소상공인 폐업·생존율 통계.
 *
 *  출처: 통계청 「2024년 기준 영업 활동 통계」 + 국세청 폐업 자료
 *  (실제 갱신 시 통계청 KOSIS 최신 보고서 확인)
 */
export const KOREA_BUSINESS_SURVIVAL = {
  closureRate1y: 22,
  closureRate3y: 40,
  closureRate5y: 56,
  avgClosureDebtKrw: 102_000_000,
  policySupportNonUtilizationPctOnClosure: 78.2,
  source: "통계청 KOSIS, 국세청 폐업자료",
  lastVerified: "2026-05",
} as const;

/**
 * 업종별 평균 창업 비용 (소상공인진흥공단 조사).
 *
 *  ⚠️ 지역·매장 규모에 따라 ±50% 편차. AI 가 답변할 때 "평균치이며 본인 상황과 다를 수 있다" 명시 필수.
 */
export const KOREA_STARTUP_COST_BENCHMARK = {
  food: { avgKrw: 175_000_000, label: "1.5억~2억원" },
  cafe: { avgKrw: 117_000_000, label: "약 1.17억원" },
  retail: { avgKrw: 115_000_000, label: "8천만~1.5억원" },
  "online-digital": { avgKrw: 35_000_000, label: "2천만~5천만원" },
  "startup-tech": { avgKrw: 300_000_000, label: "시드 평균 3억원 (밸류 기준)" },
  franchise_chicken: { avgKrw: 56_000_000, label: "약 5,600만원" },
  source: "소상공인진흥공단 창업비용 조사",
  lastVerified: "2026-05",
} as const;

/**
 * AI prompt 의 출처 블록 헤더 — `[정책 자료 — ${lastVerified} 기준]` 형식.
 *
 *  사용법:
 *    const block = buildPolicySourceBlock();
 *    const userPrompt = `${block}\n\n[사장님 현황]\n...`;
 *
 *  AI 는 이 블록 안의 수치만 인용 가능 (ANTI_HALLUCINATION_DIRECTIVE 와 결합).
 */
export function buildPolicySourceBlock(): string {
  const funds = KOREA_POLICY_FUNDS
    .map((f) => `- ${f.name}: ${f.maxAmountLabel}${f.interestRate ? ` / 금리 ${f.interestRate}` : ""} / 조건: ${f.eligibility}`)
    .join("\n");
  return [
    `[검증된 정책 자료 — ${KOREA_POLICY_FUNDS[0].lastVerified} 기준]`,
    "## 한국 정부 지원·정책자금",
    funds,
    "",
    `## 폐업·생존율 (출처: ${KOREA_BUSINESS_SURVIVAL.source}, ${KOREA_BUSINESS_SURVIVAL.lastVerified} 기준)`,
    `- 1년 내 폐업: ${KOREA_BUSINESS_SURVIVAL.closureRate1y}%`,
    `- 3년 내 폐업: ${KOREA_BUSINESS_SURVIVAL.closureRate3y}%`,
    `- 5년 내 폐업: ${KOREA_BUSINESS_SURVIVAL.closureRate5y}%`,
    `- 폐업 시 평균 부채: ${(KOREA_BUSINESS_SURVIVAL.avgClosureDebtKrw / 100_000_000).toFixed(2)}억원`,
    `- 폐업자 ${KOREA_BUSINESS_SURVIVAL.policySupportNonUtilizationPctOnClosure}% 가 정부 지원 미활용`,
    "",
    `⚠️ 이 블록 안의 수치만 인용 가능. 출처 일자 이후 변경 가능성 항상 안내.`,
  ].join("\n");
}
