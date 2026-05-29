// ─── 경영 건강 진단 AI 프롬프트 v2 ────────────────────────────────────────────
// 경영학적 프레임워크 + 한국 규제 지식 + 위기 플레이북 기반 전문 진단

import { formatKRW } from "@foundone/shared";
import { ANTI_HALLUCINATION_DIRECTIVE } from "../utils/anti-hallucination";

export type HealthDiagnosisContext = {
  businessType: string;
  monthsInBusiness: number;
  avgDailySales: number;
  avgDailyCustomers: number;
  operatingMargin: number;
  primeCostRatio: number;
  rentCostRatio: number;
  salesTrend: string;
  salesTrendPercent: number;
  healthScore: number;
  cashRunwayMonths: number;
  alerts: Array<{ type: string; title: string }>;
  // 프랜차이즈 벤치마크 (enrichment layer가 채움)
  franchiseBrandName?: string;
  franchiseAvgRevenue?: number;          // 만원 (월)
  franchiseTopRevenue?: number;          // 만원 (월)
  franchiseCostStructure?: { ingredientRatio: number; laborRatio: number; rentRatio: number };
  // 성공 사례 (enrichment layer가 채움)
  matchedCaseStudy?: { company: string; oneLiner: string; lesson: string };
  // 업종 벤치마크
  industryAvgRevenue?: number;           // 만원 (월)
  industryTopRevenue?: number;           // 만원 (월)
};

export type HealthDiagnosisResult = {
  headline: string;
  statusSummary: string;
  actions: Array<{
    title: string;
    reason: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
  encouragement: string;
};

export const HEALTH_DIAGNOSIS_SYSTEM_PROMPT = `당신은 수백 개의 한국 소규모 사업체를 진단한 경영 컨설턴트입니다.
사업자의 실제 데이터를 기반으로 정확한 진단과 실행 가능한 처방을 제공합니다.

${ANTI_HALLUCINATION_DIRECTIVE}

─── 진단 프레임워크 ───

## 건강 점수 해석
- 80-100: 건강. 현재 구조 유지하되 성장 기회 탐색
- 60-79: 양호. 1-2개 지표 개선하면 건강 구간 진입 가능
- 40-59: 주의. 방치하면 3-6개월 내 위기 진입 가능성
- 20-39: 경고. 즉시 비용 구조 재편 필요
- 0-19: 위험. 생존 모드 — 현금 방어가 최우선

## 업종별 핵심 벤치마크
- 외식업: 프라임코스트 ≤60%, 재료비 30-35%, 인건비 25-30%, 임대료 ≤12%
- 카페: 프라임코스트 ≤62%, 재료비 28-32%, 인건비 30-35%, 임대료 ≤15%
- 소매: 매입원가 50-65%, 인건비 10-15%, 재고회전율 월 4-8회
- 뷰티/서비스: 재료비 10-15%, 인건비 40-50%, 재방문율 ≥40%
- 스타트업: 번레이트 대비 런웨이 ≥12개월, MoM 성장률 ≥15%

## 위기 진단 기준 (하나라도 해당 시 위기 대응 제시)
- 현금 런웨이 3개월 미만
- 영업이익률 -10% 이하
- 프라임코스트 70% 이상
- 매출 3개월 연속 하락
- 임대료 비율 20% 이상

## 성장 단계별 진단 포인트
- 0-3개월: "생존하고 있는가?" → 손익분기 달성 진척, 단골 형성
- 3-12개월: "시스템이 있는가?" → 사장 없이도 운영 가능 여부, 비용 안정성
- 12개월+: "성장할 준비가 됐는가?" → 수익성 유지하면서 확장 가능 여부

## 코칭 원칙
1. headline: 반드시 한 문장. 가장 중요한 문제 하나만.
2. statusSummary: 2-3문장. "무엇이 문제이고, 왜 문제이고, 얼마나 급한지"
3. actions: 최대 3개. 난이도 순서(쉬운 것 먼저). 각 action에 기대 효과 수치 포함.
   - 예: "메뉴 20% 축소 → 재료비 5-8%p 절감 예상, 2주 내 실행 가능"
   - 예: "공급처 3곳 견적 비교 → 재료비 10-15% 절감, 이번 주 실행 가능"
4. encouragement: 반드시 데이터에 근거한 긍정적 점. "열심히 하고 계세요" 금지.
   - 좋은 예: "객단가가 업계 평균보다 12% 높습니다. 고객이 사장님 가게의 가치를 인정하고 있다는 뜻입니다."
5. 정부 지원 프로그램 해당 시 이름과 금액 명시
6. 비슷한 상황에서 회복한 사례가 있으면 한 줄 언급

## 프랜차이즈 비교 코칭
프랜차이즈 벤치마크 데이터가 제공된 경우:
- headline이나 statusSummary에 같은 브랜드 상위 매장과 비교를 포함하세요
- 비용 구조 차이를 actions에 반영하세요
- 데이터가 없으면 무시하세요

## 성공 사례 코칭
matchedCaseStudy가 제공된 경우:
- encouragement에 해당 사례를 자연스럽게 인용하세요
- 패턴: "[회사명]도 비슷한 상황에서 [행동]으로 [결과]를 만들었습니다"
- 데이터가 없으면 무시하세요

응답 형식 (JSON만, 다른 텍스트 없이):
{
  "headline": "한 줄 진단",
  "statusSummary": "현재 상태 2~3문장 요약",
  "actions": [
    { "title": "액션 제목", "reason": "왜 해야 하는지 + 기대 효과 수치", "difficulty": "easy" }
  ],
  "encouragement": "데이터 근거 긍정적 점 한 줄"
}`;

export function buildHealthDiagnosisUserPrompt(ctx: HealthDiagnosisContext): string {
  // 성장 단계 판별
  const stage = ctx.monthsInBusiness < 3 ? "생존기 (0-3개월)" :
    ctx.monthsInBusiness < 12 ? "안정기 (3-12개월)" : "성장기 (12개월+)";

  // 위기 신호 자동 감지
  const crisisSignals: string[] = [];
  if (ctx.cashRunwayMonths >= 0 && ctx.cashRunwayMonths <= 3) crisisSignals.push(`현금 런웨이 ${ctx.cashRunwayMonths}개월 (위험)`)
  if (ctx.operatingMargin < -10) crisisSignals.push(`영업이익률 ${ctx.operatingMargin}% (심각한 적자)`);
  if (ctx.primeCostRatio > 70) crisisSignals.push(`프라임코스트 ${ctx.primeCostRatio}% (70% 초과 — 구조적 위험)`);
  if (ctx.salesTrend === "declining" && ctx.salesTrendPercent < -15) crisisSignals.push(`매출 ${ctx.salesTrendPercent}% 급락`);
  if (ctx.rentCostRatio > 20) crisisSignals.push(`임대료 비율 ${ctx.rentCostRatio}% (20% 초과)`);

  // 객단가 계산
  const avgTicket = ctx.avgDailyCustomers > 0 ? Math.round(ctx.avgDailySales / ctx.avgDailyCustomers) : 0;

  const lines = [
    `## 사업 현황`,
    `업종: ${ctx.businessType} | 영업 ${ctx.monthsInBusiness}개월 | 단계: ${stage}`,
    ``,
    `### 매출 지표`,
    // ⚠️ formatKRW 사용 — raw 원 + 콤마는 LLM 이 만 단위로 오독 (10× 폭주 위험)
    `- 일 평균 매출: ${formatKRW(ctx.avgDailySales)}`,
    `- 일 평균 고객: ${ctx.avgDailyCustomers}명`,
    `- 객단가: ${formatKRW(avgTicket)}`,
    `- 매출 추세: ${ctx.salesTrend} (${ctx.salesTrendPercent > 0 ? "+" : ""}${ctx.salesTrendPercent}%)`,
    ``,
    `### 비용 지표`,
    `- 영업이익률: ${ctx.operatingMargin}%`,
    `- 프라임코스트 (재료비+인건비): ${ctx.primeCostRatio}%`,
    `- 임대료 비율: ${ctx.rentCostRatio}%`,
    ``,
    `### 생존 지표`,
    `- 건강 점수: ${ctx.healthScore}/100`,
    `- 현금 런웨이: ${ctx.cashRunwayMonths >= 0 ? `${ctx.cashRunwayMonths}개월` : "흑자 (무한)"}`,
    "",
  ];

  if (ctx.alerts.length > 0) {
    lines.push(`### 감지된 경고 ${ctx.alerts.length}건`);
    for (const alert of ctx.alerts) {
      lines.push(`- [${alert.type}] ${alert.title}`);
    }
    lines.push("");
  }

  if (crisisSignals.length > 0) {
    lines.push(`### ⚠ 위기 신호`);
    for (const signal of crisisSignals) {
      lines.push(`- ${signal}`);
    }
    lines.push("");
  }

  // 프랜차이즈 벤치마크
  if (ctx.franchiseBrandName && ctx.franchiseAvgRevenue) {
    const userMonthlyWon = ctx.avgDailySales * 30;
    const avgMonthlyWon = ctx.franchiseAvgRevenue * 10000;
    const pct = avgMonthlyWon > 0 ? Math.round((userMonthlyWon / avgMonthlyWon) * 100) : 0;
    lines.push(`### 프랜차이즈 벤치마크 (${ctx.franchiseBrandName})`);
    lines.push(`- 가맹점 평균 월매출: ${ctx.franchiseAvgRevenue}만원`);
    if (ctx.franchiseTopRevenue) lines.push(`- 상위 매장 월매출: ${ctx.franchiseTopRevenue}만원`);
    lines.push(`- 사장님 현재 위치: 평균 대비 ${pct}%`);
    if (ctx.franchiseCostStructure) {
      const cs = ctx.franchiseCostStructure;
      lines.push(`- 브랜드 비용 기준: 재료비 ${cs.ingredientRatio}%, 인건비 ${cs.laborRatio}%, 임대료 ${cs.rentRatio}%`);
    }
    lines.push("");
  }

  // 업종 벤치마크
  if (ctx.industryAvgRevenue) {
    lines.push(`### 업종 벤치마크`);
    lines.push(`- 업종 평균 월매출: ${ctx.industryAvgRevenue}만원`);
    if (ctx.industryTopRevenue) lines.push(`- 업종 상위 10% 월매출: ${ctx.industryTopRevenue}만원`);
    lines.push("");
  }

  // 성공 사례
  if (ctx.matchedCaseStudy) {
    lines.push(`### 참고 사례`);
    lines.push(`- ${ctx.matchedCaseStudy.company}: ${ctx.matchedCaseStudy.oneLiner}`);
    lines.push(`  → 교훈: ${ctx.matchedCaseStudy.lesson}`);
    lines.push("");
  }

  lines.push("[요청]");
  lines.push("위 데이터를 업종별 벤치마크와 비교하여 진단하고, 성장 단계에 맞는 핵심 액션을 제시해 주세요.");
  if (crisisSignals.length > 0) {
    lines.push("위기 신호가 감지되었으니 즉시 실행할 긴급 액션을 우선 제시해 주세요.");
  }

  return lines.join("\n");
}
