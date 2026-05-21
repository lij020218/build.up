import type { FinancialSimulationResult } from "@build-up/shared";
import { formatKRW } from "@build-up/shared";
import { ANTI_HALLUCINATION_DIRECTIVE } from "../utils/anti-hallucination";

// ─── 재무 해석 AI 프롬프트 v2 ──────────────────────────────────────────────
// 경영학 프레임워크 + 한국 창업 자금/규제 + 시나리오 기반 해석

export const FINANCE_SYSTEM_PROMPT = `당신은 수백 건의 한국 소자본 창업 재무를 분석한 전문 컨설턴트입니다.
재무 시뮬레이션 수치를 받아, 창업자가 바로 이해하고 행동할 수 있도록 해석합니다.

${ANTI_HALLUCINATION_DIRECTIVE}

─── 재무 해석 가이드라인 ───

⚠️ 정책자금 한도·생존율·창업비용 등의 *변동 수치는 절대 임의 인용 금지*. 사용자 요청
   prompt 에 별도 첨부되는 [검증된 정책 자료 — YYYY-MM 기준] 블록 안의 수치만 사용.
   해당 블록이 없으면 "현재 정책 자료가 prompt 에 포함되지 않아 구체 수치는 답할 수 없음"
   이라고 답하고 일반 원칙만 안내. 이는 정책 변경 (예: 정책자금 한도 5억 → 7억) 후에도
   AI 가 옛 수치를 단정 인용하는 거짓 정보 사고를 막기 위한 절대 규칙임.

   참고: 출처 블록은 buildPolicySourceBlock() (packages/shared/src/constants/korea-policy.ts)
   가 매 호출 시 생성. 갱신은 그 파일 한 곳에서만 수행.

## 현금흐름 관리 핵심
- 외식업 매출 램프업: 1개월 30%, 2개월 50%, 3개월 70%, 4개월 85%, 5개월+ 100%
- 카드 매출 정산: 2-3 영업일 (카드사별 상이)
- 배달앱 정산: 주 1-2회
- 적정 운전자금: 최소 3개월치 고정비 확보 권장

## 위기 시나리오별 대응
- 런웨이 3개월 미만: 즉시 비용 삭감 + 정부 긴급자금 신청 + 매출 quick-win
- 손익분기 미달성(예상 기간 초과): 비용 구조 재편 or 사업 모델 피봇 검토
- 자본금 초과 투자: 대출 구조 검토 + 초기 투자 범위 재조정

─── 해석 규칙 ───

1. 주어진 수치를 절대 임의로 변경하지 않습니다.
2. 전문 용어 대신 일상 언어: BEP → 손익분기, COGS → 재료비
3. 위험이 높아도 감추지 않되, "대안이 있다"는 점을 반드시 같이 전달
4. nextActions는 "오늘 할 일 / 이번 주 / 이번 달" 프레임
5. 해당하는 정부 지원 프로그램이 있으면 이름과 조건 명시
6. "비슷한 업종에서 성공적으로 창업한 사례의 평균"과 비교
7. 스타트업의 경우: burn rate, runway, unit economics 관점 추가

응답 형식 (JSON만):
{
  "summary": "한 문장 재무 상태 핵심 (위험도 + 핵심 이유)",
  "rationale": ["수치 근거 판단1", "근거2", "근거3"],
  "warnings": ["주의점1", "주의점2"],
  "nextActions": ["구체적 행동1 (기간 명시)", "행동2", "행동3"]
}`;

// ─── 유저 프롬프트 빌더 ───────────────────────────────────────────────────────

export function buildFinanceUserPrompt(
  result: FinancialSimulationResult,
  categoryLabel?: string
): string {
  const {
    input,
    resolvedCosts,
    breakEven,
    projections,
    survivabilityMonths,
    capitalAfterSetup,
    riskLevel,
    riskReasons,
    revenueRange,
    setupCostRange
  } = result;

  const riskLabelMap: Record<string, string> = {
    low: "안정",
    medium: "보통",
    high: "주의",
    critical: "위험"
  };

  const lastProjection = projections[projections.length - 1];
  const simulationMonths = projections.length;

  // 위기 신호 자동 감지
  const crisisSignals: string[] = [];
  if (survivabilityMonths < 3) crisisSignals.push(`매출 없이 ${survivabilityMonths}개월만 버틸 수 있음 — 긴급 자금 확보 필요`);
  if (capitalAfterSetup.low < 0) crisisSignals.push(`초기 투자비가 자본금을 초과할 수 있음`);
  if (breakEven.estimatedBreakEvenMonth === null) crisisSignals.push(`${simulationMonths}개월 내 손익분기 달성 어려움`);
  if (riskLevel === "critical") crisisSignals.push(`종합 위험도: 위험 — 현재 계획으로는 사업 지속이 어려울 수 있음`);

  const lines: string[] = [];

  lines.push(`## 재무 시뮬레이션 분석 요청`);
  if (categoryLabel) lines.push(`업종: ${categoryLabel}`);
  lines.push(`자본금: ${formatKRW(input.capital)}`);
  lines.push("");

  lines.push(`### 핵심 수치`);
  lines.push(`- 위험도: ${riskLabelMap[riskLevel] ?? riskLevel}`);
  lines.push(`- 초기 투자 후 남는 돈: 최소 ${formatKRW(capitalAfterSetup.low)} ~ 최대 ${formatKRW(capitalAfterSetup.high)}`);
  lines.push(`  (초기 투자비: ${formatKRW(setupCostRange.low)} ~ ${formatKRW(setupCostRange.high)})`);
  lines.push(`- 매출 없이 버틸 수 있는 기간: ${survivabilityMonths}개월`);
  lines.push("");

  lines.push(`### 월 고정비`);
  lines.push(`- 임대료: ${formatKRW(resolvedCosts.monthlyRent)}`);
  lines.push(`- 인건비: ${formatKRW(resolvedCosts.monthlyLaborCost)}`);
  lines.push(`- 기타: ${formatKRW(resolvedCosts.monthlyOtherFixed)}`);
  lines.push(`- 합계: ${formatKRW(resolvedCosts.totalMonthlyFixed)}`);
  lines.push(`- 재료비/원가율: ${resolvedCosts.cogsRate}%`);
  lines.push("");

  lines.push(`### 손익분기`);
  lines.push(`- 손익분기 월 매출: ${formatKRW(breakEven.monthlyBreakEvenRevenue)}`);
  lines.push(`- 일 손익분기 매출: ${formatKRW(breakEven.dailyBreakEvenRevenue)}`);
  if (breakEven.dailyTransactionsNeeded !== undefined) {
    lines.push(`- 일 필요 거래 건수: ${breakEven.dailyTransactionsNeeded}건`);
  }
  lines.push(`- 예상 달성: ${breakEven.estimatedBreakEvenMonth !== null ? `${breakEven.estimatedBreakEvenMonth}개월차` : `${simulationMonths}개월 내 미달성`}`);
  lines.push("");

  lines.push(`### 현금흐름`);
  lines.push(`- 예상 월 매출 (궤도 도달 시): ${formatKRW(input.expectedMonthlyRevenue ?? revenueRange.low)}`);
  if (lastProjection) {
    lines.push(`- ${simulationMonths}개월 후 누적 현금: ${formatKRW(lastProjection.cumulativeCash)}`);
    lines.push(`  (${lastProjection.cumulativeCash >= 0 ? "양수 — 생존 가능" : "음수 — 자본 소진 예상"})`);
  }

  if (revenueRange.low > 0 || revenueRange.high > 0) {
    lines.push("");
    lines.push(`### 업종 벤치마크`);
    lines.push(`- 동일 업종 월 매출 범위: ${formatKRW(revenueRange.low)} ~ ${formatKRW(revenueRange.high)}`);
  }

  if (riskReasons.length > 0) {
    lines.push("");
    lines.push(`### 감지된 위험 요인`);
    riskReasons.forEach((reason) => lines.push(`- ${reason}`));
  }

  if (crisisSignals.length > 0) {
    lines.push("");
    lines.push(`### ⚠ 위기 신호`);
    crisisSignals.forEach((signal) => lines.push(`- ${signal}`));
  }

  lines.push("");
  lines.push(`[요청]`);
  lines.push(`위 시뮬레이션 결과를 업종 벤치마크와 비교하여 해석하고, 창업자가 당장 실행할 행동을 제시해주세요.`);
  if (crisisSignals.length > 0) {
    lines.push(`위기 신호가 감지되었으니, 자본금 조정/비용 절감/대안 자금원(정부 지원 프로그램 등) 중심으로 조언해주세요.`);
  }

  return lines.join("\n");
}
