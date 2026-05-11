/**
 * @deprecated 2026-05-11 — 정책자금 데이터는 `packages/shared/src/startup-programs.ts`
 *  로 통합 이관됨 (사용자 지침: "펀딩 페이지에서 추천되는 프로그램이 정책자금 카드에도
 *  똑같이 추천되게 하자"). 본 파일의 9개 항목은 startupPrograms 에 `category:"government"`
 *  + `policyFundSubCategory:...` 로 흡수. PolicyFundMatchCard 는 이제 `getRecommendedPrograms`
 *  를 통해 펀딩 페이지와 *동일 SSOT* 사용.
 *
 *  이 파일은 backward-compat 만 유지 — 외부 import 없음 (확인: 2026-05-11).
 *  안전한 시점에 삭제 가능.
 *
 * ─── 원본 설명 (참고) ───────────────────────────────────────────
 * 2026년 소상공인 정책자금 카탈로그.
 *
 * 출처:
 *   - 소상공인시장진흥공단 (semas.or.kr) 2026년 융자사업 공고
 *   - 중소벤처기업부 2026년 정책자금 운영안
 *   - 희망리턴패키지 (sbiz.or.kr/nhrp)
 */

export type PolicyFundCategory =
  | "operation"      // 운영자금 (임대료·인건비·재료비)
  | "low-credit"     // 신용취약 (NCB 839 이하)
  | "refinance"      // 대환대출 (고금리 → 저금리)
  | "youth"          // 청년고용연계
  | "redemption"     // 재도전특별자금
  | "disabled"       // 장애인기업
  | "growth"         // 성장기반
  | "closure";       // 폐업·재창업 (희망리턴패키지)

export type PolicyFundProgram = {
  id: string;
  category: PolicyFundCategory;
  /** 표시명 */
  nameKo: string;
  nameEn: string;
  /** 한 줄 설명 */
  summaryKo: string;
  /** 운영기관 */
  agency: "semas" | "kbiz" | "sbiz" | "kodit";
  /** 자격 요건 (자동 매칭에 사용) */
  eligibility: {
    minBusinessYears?: number;        // 최소 업력 (년)
    maxBusinessYears?: number;
    minMonthlySalesWon?: number;      // 최소 월매출
    maxMonthlySalesWon?: number;
    minNcbScore?: number;             // NCB 신용점수 하한
    maxNcbScore?: number;
    industries?: string[];            // 업종 제한 (없으면 전체)
    requiresClosure?: boolean;        // 폐업 의도자만
    minAge?: number;
    maxAge?: number;                  // 청년 자금: 39세 이하
    requiresEmployees?: boolean;      // 청년 고용 매장
    salesDeclinePctMin?: number;      // 매출 감소율 (최소) — 위기자금
  };
  /** 한도 (원) */
  limitWon: number;
  /** 금리 (연) — null = 변동/사례별 */
  interestRatePctMin?: number;
  interestRatePctMax?: number;
  /** 상환 기간 */
  termMonths?: number;
  /** 신청 URL */
  applyUrl: string;
  /** 정책 정보 페이지 */
  infoUrl: string;
  /** 마지막 검증일 (정책 변경 추적) */
  lastVerified: string;             // YYYY-MM-DD
};

// ─── 카탈로그 ──────────────────────────────────────────────────────

export const POLICY_FUNDS_2026: PolicyFundProgram[] = [
  {
    id: "general-operation-2026",
    category: "operation",
    nameKo: "일반경영안정자금",
    nameEn: "General Operation Stabilization Fund",
    summaryKo: "업력 무관 — 임대료·인건비·재료비 등 운전자금 부족 시 신청. 가장 보편적인 정책자금.",
    agency: "semas",
    eligibility: {
      // 업력·신용 무관, 사업자만 있으면 가능
    },
    limitWon: 70_000_000,         // 7천만원
    interestRatePctMin: 3.0,
    interestRatePctMax: 4.5,
    termMonths: 60,
    applyUrl: "https://ols.semas.or.kr",
    infoUrl: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    lastVerified: "2026-05-06",
  },
  {
    id: "low-credit-2026",
    category: "low-credit",
    nameKo: "신용취약 소상공인 자금",
    nameEn: "Low-Credit SMB Fund",
    summaryKo: "NCB 839점 이하 — 일반 자금 거절자도 신청 가능. 특례보증.",
    agency: "semas",
    eligibility: {
      maxNcbScore: 839,
    },
    limitWon: 30_000_000,
    interestRatePctMin: 4.5,
    interestRatePctMax: 5.5,        // 기준금리 +1.6%p
    termMonths: 60,
    applyUrl: "https://ols.semas.or.kr",
    infoUrl: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    lastVerified: "2026-05-06",
  },
  {
    id: "refinance-2026",
    category: "refinance",
    nameKo: "대환대출 (고금리 → 저금리)",
    nameEn: "Refinance Fund",
    summaryKo: "기존 고금리 대출을 저금리 정책자금으로 전환. 이자 부담 즉시 감소. 2026년 한도 확대.",
    agency: "semas",
    eligibility: {
      maxNcbScore: 919,             // 중·저신용 대상
    },
    limitWon: 50_000_000,
    interestRatePctMin: 3.5,
    interestRatePctMax: 4.5,
    termMonths: 84,                 // 7년 분할상환
    applyUrl: "https://ols.semas.or.kr",
    infoUrl: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    lastVerified: "2026-05-06",
  },
  {
    id: "youth-employment-2026",
    category: "youth",
    nameKo: "청년고용연계자금",
    nameEn: "Youth Employment Fund",
    summaryKo: "만 39세 이하 청년 사장님 또는 청년 고용 매장. 정책자금 기준금리만 부담.",
    agency: "semas",
    eligibility: {
      maxAge: 39,
    },
    limitWon: 100_000_000,          // 1억
    interestRatePctMin: 2.5,
    interestRatePctMax: 3.5,
    termMonths: 60,
    applyUrl: "https://ols.semas.or.kr",
    infoUrl: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    lastVerified: "2026-05-06",
  },
  {
    id: "redemption-2026",
    category: "redemption",
    nameKo: "재도전특별자금",
    nameEn: "Redemption Fund",
    summaryKo: "이전 폐업 후 재창업하는 사장님 우대. 신용 회복 단계 지원.",
    agency: "semas",
    eligibility: {
      requiresClosure: true,
    },
    limitWon: 100_000_000,
    interestRatePctMin: 2.5,
    interestRatePctMax: 3.5,
    termMonths: 60,
    applyUrl: "https://ols.semas.or.kr",
    infoUrl: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    lastVerified: "2026-05-06",
  },
  {
    id: "hope-return-closure-2026",
    category: "closure",
    nameKo: "희망리턴패키지 — 점포철거비",
    nameEn: "Hope Return — Store Removal Fund",
    summaryKo: "폐업 시 인테리어 철거·폐기물 처리비 최대 600만원 지원. 부담 없이 정리.",
    agency: "sbiz",
    eligibility: {
      requiresClosure: true,
    },
    limitWon: 6_000_000,
    interestRatePctMin: 0,          // 보조금
    termMonths: 0,                   // 상환 X
    applyUrl: "https://www.sbiz.or.kr/nhrp",
    infoUrl: "https://www.sbiz.or.kr/nhrp/main.do",
    lastVerified: "2026-05-06",
  },
  {
    id: "hope-return-restart-2026",
    category: "closure",
    nameKo: "희망리턴패키지 — 재창업자금",
    nameEn: "Hope Return — Restart Fund",
    summaryKo: "폐업 후 재창업 시 최대 2,000만원 지원. 교육·컨설팅 패키지 포함.",
    agency: "sbiz",
    eligibility: {
      requiresClosure: true,
    },
    limitWon: 20_000_000,
    interestRatePctMin: 0,
    termMonths: 0,
    applyUrl: "https://www.sbiz.or.kr/nhrp",
    infoUrl: "https://www.sbiz.or.kr/nhrp/main.do",
    lastVerified: "2026-05-06",
  },
  {
    id: "growth-base-2026",
    category: "growth",
    nameKo: "성장기반자금",
    nameEn: "Growth Base Fund",
    summaryKo: "업력 3년 이상 + 매출 안정적 — 시설·매장 확장·디지털 전환 자금.",
    agency: "semas",
    eligibility: {
      minBusinessYears: 3,
      minMonthlySalesWon: 5_000_000,    // 월 500만 이상
    },
    limitWon: 200_000_000,
    interestRatePctMin: 3.0,
    interestRatePctMax: 4.0,
    termMonths: 84,
    applyUrl: "https://ols.semas.or.kr",
    infoUrl: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    lastVerified: "2026-05-06",
  },
  {
    id: "disabled-business-2026",
    category: "disabled",
    nameKo: "장애인기업지원자금",
    nameEn: "Disabled Business Fund",
    summaryKo: "장애인 등록증 보유 사장님 — 우대 금리 + 한도 확대.",
    agency: "semas",
    eligibility: {},
    limitWon: 100_000_000,
    interestRatePctMin: 2.0,
    interestRatePctMax: 2.5,
    termMonths: 60,
    applyUrl: "https://ols.semas.or.kr",
    infoUrl: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    lastVerified: "2026-05-06",
  },
];

// ─── 매칭 입력 (사장님 프로필) ─────────────────────────────────────

export type PolicyFundMatchInput = {
  /** 업력 (년) */
  businessYears?: number;
  /** 월매출 (원) — useDashboard 의 monthlySales */
  monthlySalesWon?: number;
  /** 사장님 나이 */
  age?: number;
  /** NCB 신용점수 (사용자 입력 시) */
  ncbScore?: number;
  /** 직원 수 */
  employeeCount?: number;
  /** 폐업 검토 중 여부 (위기 시그널) */
  consideringClosure?: boolean;
  /** 매출 감소율 (%) — 최근 3개월 평균 */
  salesDeclinePct?: number;
  /** 업종 ID */
  industryCategoryId?: string;
  /** 장애인 여부 */
  isDisabledOwner?: boolean;
};

export type PolicyFundMatch = {
  program: PolicyFundProgram;
  /** 0–100 매칭 점수 */
  score: number;
  /** 왜 추천하는지 (1–2개 근거) */
  reasonsKo: string[];
};

// ─── 매칭 엔진 ──────────────────────────────────────────────────────
//
// 점수 = 자격 충족 100점 - 자격 미달 시 0점. 가산점:
// + 사장님 위기 시그널과 매칭 (매출감소·폐업검토·저신용 → 우선순위 자금)
// + 한도 큰 자금 (선택지 폭 넓음)

export function matchPolicyFunds(
  input: PolicyFundMatchInput,
  options: { limit?: number } = {},
): PolicyFundMatch[] {
  const limit = options.limit ?? 3;
  const matches: PolicyFundMatch[] = [];

  for (const program of POLICY_FUNDS_2026) {
    const reasons: string[] = [];
    let score = 50;     // 기본 점수
    const e = program.eligibility;

    // ── 자격 필터 (실격 검사) ────────────────────────
    if (e.minBusinessYears != null && (input.businessYears ?? 0) < e.minBusinessYears) continue;
    if (e.maxBusinessYears != null && (input.businessYears ?? 999) > e.maxBusinessYears) continue;
    if (e.minMonthlySalesWon != null && (input.monthlySalesWon ?? 0) < e.minMonthlySalesWon) continue;
    if (e.maxMonthlySalesWon != null && (input.monthlySalesWon ?? Infinity) > e.maxMonthlySalesWon) continue;
    if (e.maxNcbScore != null && (input.ncbScore ?? 1000) > e.maxNcbScore) continue;
    if (e.minAge != null && (input.age ?? 0) < e.minAge) continue;
    if (e.maxAge != null && (input.age ?? 999) > e.maxAge) continue;
    if (e.industries && input.industryCategoryId && !e.industries.includes(input.industryCategoryId)) continue;
    if (e.requiresClosure && !input.consideringClosure) continue;
    if (e.requiresEmployees && (input.employeeCount ?? 0) === 0) continue;

    // ── 가산점 ────────────────────────────────────────
    // 위기 시그널과 매칭 → 점수 가산
    if (program.category === "low-credit" && (input.ncbScore ?? 1000) <= 839) {
      score += 30;
      reasons.push("신용점수 NCB 839 이하 — 일반 자금 거절자도 신청 가능");
    }
    if (program.category === "refinance" && (input.ncbScore ?? 1000) <= 919) {
      score += 25;
      reasons.push("기존 대출 이자 부담 시 즉시 절감 가능");
    }
    if (program.category === "youth" && (input.age ?? 999) <= 39) {
      score += 20;
      reasons.push(`만 39세 이하 청년 사장님 우대 — 기준금리만 부담`);
    }
    if (program.category === "closure" && input.consideringClosure) {
      score += 35;
      reasons.push("폐업 검토 중이라면 정리 부담 줄이고 재출발 가능");
    }
    if (program.category === "operation" && (input.salesDeclinePct ?? 0) > 10) {
      score += 20;
      reasons.push(`최근 매출 감소 ${input.salesDeclinePct?.toFixed(0)}% — 운영자금 보충 권장`);
    }
    if (program.category === "growth" && (input.businessYears ?? 0) >= 3 && (input.monthlySalesWon ?? 0) >= 5_000_000) {
      score += 15;
      reasons.push("업력 3년+ 안정 운영 → 시설·디지털 전환 투자 적기");
    }
    if (program.category === "disabled" && input.isDisabledOwner) {
      score += 30;
      reasons.push("장애인 사장님 우대 금리 적용");
    }

    // 한도 가산점 (선택지 넓을수록 +)
    score += Math.min(15, Math.round(program.limitWon / 10_000_000));

    // 최소 1개 사유는 있어야 추천
    if (reasons.length === 0) {
      reasons.push("업력·신용 무관 — 사업자만 있으면 신청 가능");
    }

    matches.push({ program, score: Math.min(100, score), reasonsKo: reasons.slice(0, 2) });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}
