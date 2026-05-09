/**
 * 보고서 AI 인사이트 프롬프트
 *
 * 목적: 기간별 보고서의 핵심 지표를 바탕으로 2~3문장 인사이트를 생성.
 * 비용 전략:
 *   - System prompt를 크게 고정 → prompt caching 90% 할인
 *   - User prompt에 10개 지표만 전달 (토큰 최소화)
 *   - max_tokens: 300 (인사이트 2~3문장이면 충분)
 */

export const REPORT_INSIGHT_SYSTEM_PROMPT = `당신은 한국 소상공인 전문 경영 분석가입니다.
사장님의 보고서 데이터를 보고, 핵심 인사이트를 2~3문장으로 작성합니다.

[업종별 벤치마크]
- 외식(카페·식당): 원가율 28~35%, 프라임코스트 65% 이하 목표
- 소매(편의점·잡화): 원가율 60~70%, 마진 20~30%
- 서비스(미용·세탁): 원가율 15~25%, 인건비 비중 40~50%
- 프라임코스트 = 재료비 + 인건비. 65% 초과 시 수익 구조 위험 신호.
- 런웨이 6개월 미만 = 자금 위기 경보.

${ANTI_HALLUCINATION_DIRECTIVE}

[인사이트 작성 원칙]
1. 데이터에 있는 숫자만 인용 — 없는 수치는 절대 만들지 않음
2. 2~3문장, 총 200~350자 (한국어 기준)
3. 사장님 눈높이 — 전문 용어보다 "인건비가 매출의 몇 %를 차지하고 있어요" 같은 직관적 표현
4. 가장 중요한 1가지 문제 또는 기회에 집중
5. 마지막 문장은 구체적 행동 제안으로 마무리
6. 긍정/부정 어느 쪽이든 사실 그대로 전달 (과장 없이)

[응답 형식 — JSON 엄수]
{ "insight": "..." }`;

export type ReportInsightInput = {
  period: "day" | "week" | "month" | "quarter";
  periodLabel: string;     // "5월 5일", "5월 2주차", "2026년 5월", "Q2 2026"
  revenue: number;         // 매출 (원)
  revenuePrev: number;     // 이전 기간 매출
  revenueChangePct: number | null; // 증감 %
  marginPct: number | null;        // 마진율 %
  primeCostPct: number | null;     // 프라임코스트 %
  runway: number | null;           // 런웨이 (개월)
  topCostItem: string | null;      // 가장 큰 비용 항목
  anomaly: string | null;          // 감지된 이상 신호 요약
  industry: string;                // 업종 (예: "카페", "식당")
  phase: "pre-launch" | "early" | "growth" | "mature";
};

import { formatKRW } from "@build-up/shared";
import { ANTI_HALLUCINATION_DIRECTIVE } from "../utils/anti-hallucination";

export function buildReportInsightPrompt(input: ReportInsightInput): string {
  const lines: string[] = [
    `기간: ${input.periodLabel} (${input.period})`,
    `업종: ${input.industry} / 단계: ${input.phase}`,
    `매출: ${formatKRW(input.revenue)} (이전: ${formatKRW(input.revenuePrev)}${input.revenueChangePct != null ? `, 변화: ${input.revenueChangePct >= 0 ? "+" : ""}${input.revenueChangePct}%` : ""})`,
  ];

  if (input.marginPct != null) lines.push(`마진율: ${input.marginPct}%`);
  if (input.primeCostPct != null) lines.push(`프라임코스트: ${input.primeCostPct}%`);
  if (input.runway != null) lines.push(`런웨이: ${input.runway.toFixed(1)}개월`);
  if (input.topCostItem) lines.push(`최대 비용 항목: ${input.topCostItem}`);
  if (input.anomaly) lines.push(`이상 신호: ${input.anomaly}`);

  return lines.join("\n");
}
