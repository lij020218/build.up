/**
 * AI 비용 SSOT — 1인당 월 AI 예산 ₩6,000 가드 (2026-07-28 사장님 지시).
 *
 * 원리: 각 LLM 라우트의 "회당 상한 원가"(입력 추정 상한 + max_completion_tokens 캡 기준)를
 * 호출 승인 시점에 선차감한다. 차감액 ≥ 실비용 이므로, 월 차감 합계가 ₩6,000에서 차단되면
 * 실제 지출은 반드시 ₩6,000 미만이다. 실사용 관측은 prod 로그의 "[ai-cost]" 라인으로.
 *
 * 이 표는 __tests__/ai-cost-budget.test.ts 가 전수 가드한다:
 *  - checkDailyRateLimit 를 쓰는 모든 라우트의 feature 키가 여기 존재해야 함
 *  - 헤비 실사용 프로파일 월 합계 ≤ MONTHLY_AI_BUDGET_WON
 * 모델·토큰 캡·쿼터를 바꾸면 이 표와 테스트를 함께 갱신할 것.
 */

export const MONTHLY_AI_BUDGET_WON = 6_000;

/** 보수적 고정 환율 — 2026-07 시장가(~1,380)보다 높게 잡아 원화 상한을 보수적으로 유지 */
export const KRW_PER_USD = 1_400;

/** 공식 단가 (USD / 1M tokens). GPT-5.6 GA 2026-07-09 공시가, 5.4-mini 기존가 */
export const MODEL_PRICES_USD_PER_MTOK = {
  "gpt-5.6-terra": { in: 2.5, out: 15 },
  "gpt-5.6-luna": { in: 1, out: 6 },
  "gpt-5.4-mini": { in: 0.75, out: 4.5 },
  // Opus 4.5 공시가($5/$25)와 동일 가정 — 계약분석 실측 ~₩85/건과 정합. 공시가 변경 시 갱신
  "claude-opus-4-8": { in: 5, out: 25 },
  // 사업계획서 전용 (2026-08-14) — 공시가 $3/$15 기준(8/31까지 인트로 $2/$10이지만 보수적 상한)
  "claude-sonnet-5": { in: 3, out: 15 },
} as const;

export type AiCostModel = keyof typeof MODEL_PRICES_USD_PER_MTOK;

export function costPerCallWon(model: AiCostModel, inTokens: number, outTokens: number): number {
  const p = MODEL_PRICES_USD_PER_MTOK[model];
  const usd = (inTokens * p.in + outTokens * p.out) / 1_000_000;
  return Math.ceil(usd * KRW_PER_USD);
}

type FeatureCostSpec = {
  model: AiCostModel;
  /** 입력 토큰 상한 추정 (프롬프트+사용자 데이터, 라우트의 입력 길이 제한 기준) */
  inCap: number;
  /** 출력 토큰 상한 = 라우트의 max_tokens / max_completion_tokens */
  outCap: number;
  /** LLM 외 부대비용(원) — 예: cases 의 리서치 단계(5.4-mini web_search)+Tavily */
  extraWon?: number;
  note?: string;
};

/**
 * checkDailyRateLimit feature 키 → 회당 상한 스펙. null = LLM 미사용(비용 0, 차감 없음).
 * outCap 은 해당 라우트의 실제 캡과 일치해야 하며, 캡을 올리면 여기도 올릴 것.
 */
export const FEATURE_COST_SPEC: Record<string, FeatureCostSpec | null> = {
  // ── 마케팅 (GPT-5.6) ──
  "marketing-cases": { model: "gpt-5.6-terra", inCap: 6_000, outCap: 4_000, extraWon: 35, note: "실측 in 4,898 / out 2,304 (2026-07-28)" },
  "marketing-cardnews": { model: "gpt-5.6-luna", inCap: 2_000, outCap: 1_800 },
  // "marketing-coach"·"marketing-trends" — 2026-08-03 라우트 삭제(호출자 0)로 스펙 제거.

  // ── 파서·에이전트 (luna) ──
  "members-parse": { model: "gpt-5.6-luna", inCap: 40_000, outCap: 8_192, note: "입력 50,000자 제한" },
  "products-parse": { model: "gpt-5.6-luna", inCap: 40_000, outCap: 8_192, note: "입력 50,000자 제한" },
  "agents-content-draft": { model: "gpt-5.6-luna", inCap: 1_500, outCap: 600 },
  "agents-coupon-copy": { model: "gpt-5.6-luna", inCap: 1_500, outCap: 500 },
  "agents-feedback-form": { model: "gpt-5.6-luna", inCap: 1_500, outCap: 1_500 },
  "quick-query": { model: "gpt-5.6-luna", inCap: 4_000, outCap: 768 },

  // ── 고위험: 진짜 Opus 4.8 (terra 폴백은 더 저렴 → Opus 상한이 지배) ──
  // extraWon 70 = Opus 파싱실패 시 terra 폴백 재시도(1승인 2호출) 상한 반영
  "contract-analyze": { model: "claude-opus-4-8", inCap: 11_000, outCap: 2_048, extraWon: 70, note: "입력 10,000자 제한, 실측 ~₩85/건" },

  // ── 판단형·생성형 (5.4-mini) ──
  // ── 사업계획서 (Claude Sonnet 5, 2026-08-14 사장님 지시) ──
  //  장문 품질 업그레이드. outCap 16,384 = 사고(adaptive) + 본문 합산 상한.
  //  상한가 ≈ ₩330~400/건 — 주 2회(월 8회) 풀사용 시 인당 월 ~₩3,000 (₩6,000 예산의 절반 이하).
  //  실패 시 gpt-5.4-mini 폴백(더 저렴)이므로 Sonnet 상한이 지배.
  "business-plan-generate": { model: "claude-sonnet-5", inCap: 6_000, outCap: 16_384 },
  // 공고 맞춤(펀딩 페이지) — 공고 컨텍스트 + 위저드 입력만큼 입력 상한 상향. 주 2회
  "business-plan-program": { model: "claude-sonnet-5", inCap: 7_500, outCap: 16_384 },
  "roadmap-classify": { model: "gpt-5.6-luna", inCap: 3_000, outCap: 800, note: "업종 후보 3개 — 분류 분리 (2026-08-03)" },
  "roadmap-generate": { model: "gpt-5.6-terra", inCap: 6_000, outCap: 16_384, extraWon: 30, note: "Pass1 terra(tools 제약으로 effort none, 실측 28s/2.7k out) + Pass2 luna 상한 30원" },
  "interview": { model: "gpt-5.4-mini", inCap: 3_000, outCap: 8_192 },
  "interview-analyze": { model: "gpt-5.4-mini", inCap: 4_000, outCap: 4_096 },
  "health-diagnose": { model: "gpt-5.4-mini", inCap: 3_000, outCap: 2_400 },
  "finance-interpret": { model: "gpt-5.4-mini", inCap: 3_000, outCap: 1_024 },
  "market-narrative": { model: "gpt-5.4-mini", inCap: 2_500, outCap: 300 },
  "report-insight": { model: "gpt-5.4-mini", inCap: 2_500, outCap: 300 },
  "stage-brief": { model: "gpt-5.4-mini", inCap: 2_500, outCap: 600 },
  "programs-match": { model: "gpt-5.4-mini", inCap: 4_000, outCap: 2_048 },
  "funding-score": { model: "gpt-5.4-mini", inCap: 3_000, outCap: 900 },
  "guides-ask": { model: "gpt-5.4-mini", inCap: 3_000, outCap: 1_200 },
  "dashboard-actions": { model: "gpt-5.4-mini", inCap: 3_500, outCap: 2_048 },
  "insights-industry-daily": { model: "gpt-5.4-mini", inCap: 3_500, outCap: 1_500 },

  // 상권 추천 — 점수는 결정론(무LLM), 서술만 gpt-5.4-mini 내레이터 (2026-08-03 역할 축소).
  //  ⚠️ 종전 null("LLM 호출 없음")은 거짓 — scoreWithClaude 시절부터 LLM 을 쓰고 있었다. 미터 누락 정정.
  "market-recommend": { model: "gpt-5.4-mini", inCap: 4_000, outCap: 2_048, note: "내레이터 전용 — 실패 시 템플릿(0원)" },

  // ── LLM 미사용 ──
  "market-snapshot": null, // 지역 실측 스냅샷 — 공공 API 만 (LLM 0)

  // ── 2026-08-19 ai-guard 이관으로 미터에 편입 (종전 분당 한도만 있던 라우트) ──
  //  세무·대출 지식 Q&A (SSE 스트리밍, gpt-5.4-mini) — 입력 = 시스템 프롬프트 + RAG 청크 ≤7개
  //   inCap 4,500 = 시스템 ~600 + RAG 청크 ≤7개(~400tok) + 질문 ≤1,000자 / outCap 1,024 = 라우트 max_tokens
  "knowledge-qa": { model: "gpt-5.4-mini", inCap: 4_500, outCap: 1_024, note: "SSE — 첫 토큰 전 실패 시 환불" },
  //  인사이트 벡터 검색 — text-embedding-3-small 쿼리 1건 (LLM 생성 없음, 회당 ₩1 미만 → extraWon 1 로 상한)
  "insights-search": { model: "gpt-5.4-mini", inCap: 0, outCap: 0, extraWon: 1, note: "임베딩 전용 — 회당 ₩1 상한" },
};

/** 표에 없는 feature 가 미터에 들어오면 보수적 기본 상한으로 차감 (누락 = 과소차감 방지) */
export const DEFAULT_FEATURE_COST_WON = 150;

export function featureCostWon(feature: string): number {
  const spec = FEATURE_COST_SPEC[feature];
  if (spec === null) return 0;
  if (!spec) {
    console.warn(`[ai-cost] unknown feature "${feature}" — charging default ₩${DEFAULT_FEATURE_COST_WON}`);
    return DEFAULT_FEATURE_COST_WON;
  }
  return costPerCallWon(spec.model, spec.inCap, spec.outCap) + (spec.extraWon ?? 0);
}

/** KST 기준 월 키 (예: "2026-07") — 월간 예산 리셋 단위 */
export function kstMonthKey(now: number = Date.now()): string {
  const kst = new Date(now + 9 * 3_600_000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}`;
}
