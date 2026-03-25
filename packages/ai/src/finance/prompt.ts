import type { FinancialSimulationResult } from "@build-up/shared";
import { formatKRW } from "@build-up/shared";

// ─── 시스템 프롬프트 ──────────────────────────────────────────────────────────

export const FINANCE_SYSTEM_PROMPT = `당신은 한국 소자본 창업자를 위한 재무 해석 전문가입니다.
재무 시뮬레이션 수치를 받아, 창업자가 바로 이해하고 행동할 수 있도록 해석합니다.

규칙:
1. 주어진 수치를 절대 임의로 변경하거나 새로 만들지 않습니다. 제공된 숫자만 인용합니다.
2. 전문 용어 대신 일상 언어를 사용합니다. (BEP → 손익분기, COGS → 재료비/원가)
3. 위험이 높더라도 감추지 않고 명확하게 전달합니다.
4. nextActions는 막연한 조언이 아니라 창업자가 당장 할 수 있는 구체적 행동이어야 합니다.
5. 반드시 아래 JSON 형식으로만 응답합니다. JSON 외 다른 텍스트는 절대 포함하지 않습니다.

응답 형식:
{
  "summary": "한 문장으로 현재 재무 상태의 핵심을 전달하는 요약",
  "rationale": ["근거1", "근거2", "근거3"],
  "warnings": ["주의할 점1", "주의할 점2"],
  "nextActions": ["구체적 행동1", "구체적 행동2", "구체적 행동3"]
}

필드 기준:
- summary: 1문장, 위험도와 핵심 이유를 포함
- rationale: 2~4개, 수치를 근거로 한 판단 이유
- warnings: 0~3개, 반드시 조심해야 할 위험 요소 (없으면 빈 배열 [])
- nextActions: 2~4개, 지금 당장 할 수 있는 구체적 행동`;

// ─── 유저 프롬프트 빌더 ───────────────────────────────────────────────────────
// FinancialSimulationResult에서 AI 해석에 필요한 핵심 수치만 추출합니다.
// 전체 JSON을 넘기지 않고 읽기 쉬운 구조화 텍스트로 변환합니다.

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

  const lines: string[] = [];

  if (categoryLabel) {
    lines.push(`업종: ${categoryLabel}`);
  }
  lines.push(`자본금: ${formatKRW(input.capital)}`);
  lines.push("");

  lines.push("[재무 시뮬레이션 요약]");
  lines.push(`- 위험도: ${riskLabelMap[riskLevel] ?? riskLevel} (${riskLevel})`);
  lines.push(
    `- 초기 투자 후 운전자금: 최소 ${formatKRW(capitalAfterSetup.low)} ~ 최대 ${formatKRW(capitalAfterSetup.high)}`
  );
  lines.push(
    `  (초기 투자비 범위: ${formatKRW(setupCostRange.low)} ~ ${formatKRW(setupCostRange.high)})`
  );
  lines.push(`- 매출 없이 버틸 수 있는 기간: ${survivabilityMonths}개월`);
  lines.push("");

  lines.push("[월 고정비 내역]");
  lines.push(`- 월 임대료: ${formatKRW(resolvedCosts.monthlyRent)}`);
  lines.push(`- 월 인건비: ${formatKRW(resolvedCosts.monthlyLaborCost)}`);
  lines.push(`- 기타 고정비: ${formatKRW(resolvedCosts.monthlyOtherFixed)}`);
  lines.push(`- 합계: ${formatKRW(resolvedCosts.totalMonthlyFixed)}`);
  lines.push(`- 적용 원가율: ${resolvedCosts.cogsRate}%`);
  lines.push("");

  lines.push("[손익분기 분석]");
  lines.push(`- 손익분기 월 매출: ${formatKRW(breakEven.monthlyBreakEvenRevenue)}`);
  lines.push(`- 일 손익분기 매출: ${formatKRW(breakEven.dailyBreakEvenRevenue)}`);
  if (breakEven.dailyTransactionsNeeded !== undefined) {
    lines.push(`- 일 필요 거래 건수: ${breakEven.dailyTransactionsNeeded}건`);
  }
  if (breakEven.estimatedBreakEvenMonth !== null) {
    lines.push(`- 예상 손익분기 달성: ${breakEven.estimatedBreakEvenMonth}개월차`);
  } else {
    lines.push(`- 예상 손익분기: ${simulationMonths}개월 시뮬레이션 기간 내 미달성`);
  }
  lines.push("");

  lines.push("[현금흐름 예상]");
  lines.push(
    `- 예상 월 매출 (완전 궤도): ${formatKRW(input.expectedMonthlyRevenue ?? revenueRange.low)}`
  );
  if (lastProjection) {
    lines.push(
      `- ${simulationMonths}개월 후 누적 현금 잔액: ${formatKRW(lastProjection.cumulativeCash)}`
    );
  }
  lines.push("");

  if (revenueRange.low > 0 || revenueRange.high > 0) {
    lines.push("[업종 벤치마크 비교]");
    lines.push(
      `- 동일 업종/상권의 월 매출 참고 범위: ${formatKRW(revenueRange.low)} ~ ${formatKRW(revenueRange.high)}`
    );
  }

  if (riskReasons.length > 0) {
    lines.push("");
    lines.push("[감지된 위험 요인]");
    riskReasons.forEach((reason) => lines.push(`- ${reason}`));
  }

  return lines.join("\n");
}
