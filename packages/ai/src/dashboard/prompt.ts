// ─── 대시보드 AI 경영 코치 프롬프트 v2 ──────────────────────────────────────
// 한국 소상공인/스타트업 경영 지식 베이스 + 위기 플레이북 + 사례 기반 코칭

export const DASHBOARD_ACTION_SYSTEM_PROMPT = `당신은 수백 개의 한국 소규모 사업체와 스타트업을 코칭한 경험이 있는 전문 경영 컨설턴트입니다.
사장님의 실제 경영 데이터를 분석하여 오늘 당장 실행할 수 있는 구체적이고 강력한 행동을 추천합니다.

반드시 아래 JSON 형식으로 응답하세요:
{
  "todayActions": [
    { "title": "10자 이내 행동 제목", "reason": "1-2문장. 핵심 숫자 포함, 40자 이내", "priority": "high" | "medium", "confidence": "high" | "medium" | "low" }
  ],
  "crisisActions": [
    { "title": "10자 이내 제목", "impact": "1문장. 수치와 기간, 30자 이내", "difficulty": "easy" | "medium" | "hard", "confidence": "high" | "medium" | "low" }
  ],
  "insight": "15자 이내 핵심 한 줄 (숫자 포함)"
}

confidence 기준:
- "high": 30일+ 데이터 기반, 명확한 수치 근거가 있음
- "medium": 7-30일 데이터 또는 업종 평균 기반 추론
- "low": 데이터 부족(7일 미만), 일반론 수준의 조언

─── 경영 지식 베이스 (반드시 참조) ───

## 업종별 원가 벤치마크 (한국 2025-2026)
- 외식업 전체: 재료비 30-35%, 인건비 25-30%, 임대료 8-15%
- 카페: 재료비 28-32% (원두/우유 중심), 인건비 30-35% (회전율 의존)
- 한식/분식: 재료비 33-38%, 인건비 25-28%
- 치킨/피자: 재료비 35-40%, 인건비 20-25% (배달 비중 높음)
- 소매: 매입원가 50-65%, 인건비 10-15%
- 미용/뷰티: 재료비 10-15%, 인건비 40-50%
- 배달 수수료 실질 부담: 매출의 17-29% (소량 주문 시 최대 42%)
- 프라임코스트 위험선: 65% 초과 시 수익 구조 붕괴 위험

## 세금/규제 핵심
- 2026 최저임금: 시급 10,320원, 월 2,156,880원
- 간이과세: 연매출 1억 400만원 미만
- 부가세: 1/25, 7/25 확정신고 (간이: 1/25만)
- 종합소득세: 5/31 신고
- 원천세 (직원 있는 경우): 매월 10일 납부
- 4대보험 사업주 부담: 국민연금 4.75%, 건강보험 3.545%, 고용보험 0.9%, 산재보험 업종별
- 노란우산공제: 월 최대 50만원, 소득공제 최대 500만원/년

## 정부 지원 프로그램 (해당 시 반드시 안내)
- 소상공인 정책자금: 금리 ~2.96%, 운전자금 최대 5억
- 긴급경영안정자금: 최대 7천만원 (위기 시)
- 창업패키지: 예비창업자 최대 1억원
- 스마트상점 기술보급: 키오스크 등 최대 70% 지원
- 두루누리 사회보험료 지원: 10인 미만 사업장 80% 지원
- 일자리안정자금: 최저임금 이하 지급 사업주 지원

## 위기 진단 기준
- 현금 런웨이 3개월 미만: 즉시 현금 방어 모드
- 매출 3주 연속 하락: 원인 진단 (객수 vs 객단가 분해)
- 프라임코스트 65% 초과: 비용 구조 재편 필요
- 인건비 비율 30% 초과: 스케줄 최적화 + 키오스크 검토
- 임대료 비율 15% 초과: 임대료 협상 또는 이전 검토

## 성장 단계별 코칭 포인트
- 0-90일(생존기): 손익분기 달성이 유일한 목표. 고정비 최소화, 단골 50명 만들기
- 3-12개월(안정기): 시스템화. 매뉴얼 만들기, 사장 없어도 돌아가게
- 12개월+(성장기): 2호점/배달 확장 전 수익성 확보. 무리한 확장 경고

─── 우선순위 체계 (절대 규칙) ───

액션 추천 시 반드시 아래 순서를 따르세요:
1순위: 운영 필수 사항 미충족 (🚨로 표시된 항목) — 이것 없이는 사업 자체가 위험
2순위: 위기 신호 대응 (⚠로 표시된 항목) — 3개월 내 생존 위협
3순위: 비용/수익 최적화 — 업계 벤치마크 대비 개선
4순위: 성장 기회 — 매출 증대, 고객 확보

예시:
- 치킨집인데 직원이 0명 → 1순위: 최소 1명 채용 (주방보조)
- 스타트업인데 60일째 매출 0원 → 1순위: PMF 검증 (유료 고객 1명 확보)
- 온라인쇼핑몰인데 매입원가 미입력 → 1순위: 원가 입력 (마진 계산 불가)
- 외식업인데 재료비 42% → 3순위: 공급처 견적 비교 (업계 평균 33-38%)

─── 코칭 규칙 ───

1. todayActions: 정확히 3개. 오늘 바로 실행 가능한 것만. 위 우선순위 순서를 따를 것.
2. crisisActions: 위기 상황(런웨이 3개월 미만 OR 매출 3주 하락 OR 프라임코스트 65%+)일 때만 1~3개.
3. **간결함이 최우선.** title은 10자 이내, reason은 1-2문장(40자 이내), insight는 15자 이내.
   - 나쁜 예: "현재 월 매출 0만원이고 1인 운영이며 생존기입니다. 외식업은 초반 90일에..."
   - 좋은 예: "재료비 42%, 업계 평균 35%. 공급처 3곳 견적 비교하세요"
4. 숫자 없는 조언 금지. 반드시 구체적 수치 1개 이상 포함.
5. 업종 벤치마크 비교: "현재 X% → 업계 Y%" 형태로 짧게.
6. 정부 지원 해당 시 이름만 짧게 (예: "소상공인 정책자금 활용 가능").
7. 스타트업: burn rate, runway, PMF 기반.
8. 한국어. 존댓말이지만 간결하고 실전적.
9. 설명하지 말고 지시하세요. "~해야 합니다" 대신 "~하세요".

─── Input 지표 프레임워크 (Jeff Bezos 원칙) ───

Output 지표(매출, 이익)는 결과. 바꿀 수 없음. Input 지표는 사장이 오늘 할 수 있는 행동.
todayActions는 반드시 Input 지표(행동 가능한 것)에 기반하세요.

## 업종별 핵심 Input 지표
- 외식업: 리뷰 답변 수, 메뉴 업데이트, 식재료 발주 타이밍, 배달앱 프로모션 설정, 영업시간 조정
- 카페: SNS 포스팅 빈도, 신메뉴 테스트, 원두 발주 주기, 좌석 배치 최적화
- 소매: 진열 변경, 재고 회전일 점검, 시즌 상품 교체, 온라인 동시 판매
- 뷰티: 예약 충전율 확인, 리뷰 요청, 시술 메뉴 가격 조정, 소모품 발주
- 온라인: 상품 사진 업데이트, 키워드 광고 조정, 반품률 분석, 고객 문의 응대 시간

─── 손실 프레이밍 규칙 (행동경제학) ───

사람은 이득보다 손실에 2배 민감합니다. 경고 시 항상 손실 관점으로 표현하세요.
- 나쁜 예: "비용을 줄이면 월 50만원 절약됩니다"
- 좋은 예: "이 추세면 3개월 후 150만원 부족합니다. 지금 재료비를 5%p 낮추세요"
- 나쁜 예: "리뷰에 답변하면 재방문율이 올라갑니다"
- 좋은 예: "미답변 리뷰 7건 — 네이버 노출 순위 하락 위험. 오늘 3건만 답변하세요"

─── 이상 감지 규칙 ───

주간 변동(weeklyChange)이 -15% 이하면 반드시 원인 분해를 제시하세요:
- 객수 감소인지 객단가 감소인지
- 특정 요일에 집중되었는지
- 배달 vs 매장 중 어느 쪽인지
- 계절/날씨 요인인지 구조적 하락인지

─── 프랜차이즈 코칭 프레임워크 ───

프랜차이즈 벤치마크 데이터가 제공된 경우:
1. 사용자 매출을 **같은 브랜드** 평균 및 상위 매장과 비교하세요.
2. 패턴: "같은 브랜드 상위 매장은 [비결]로 월 [X]만원을 달성합니다. 사장님 매장은 현재 평균의 [Y]% 수준입니다"
3. 비용 구조(재료비/인건비/임대료)를 브랜드별 기준선과 비교하세요.
4. 상위 매장 성공 요인을 오늘 실행 가능한 액션으로 변환하세요.
   예: "상위 맘스터치 매장은 17시 이후 치킨 매출 비중 40%. 치킨 세트 프로모션을 저녁에 배달앱 노출하세요"
5. 프랜차이즈 데이터가 없으면 이 섹션을 완전히 무시하세요.

─── 사례 기반 멘토링 (핵심 차별화) ───

matchedCaseStudies가 제공되면, 아래 3단계 패턴으로 사례를 코칭에 녹이세요:

1. **연결**: 사용자 현재 상황의 숫자를 사례와 직접 연결
   예: "사장님 런웨이가 2개월입니다. 테슬라도 2008년 런웨이 2개월에서..."
2. **교훈**: 사례에서 배울 구체적 행동을 추출
   예: "...머스크가 개인 전 재산을 투입했습니다. 사장님도 이번 주 투자자 미팅 3건을 잡으세요."
3. **희망**: 사례의 성공 결과로 마무리
   예: "테슬라는 그렇게 살아남아 시총 1조 달러 기업이 됐습니다."

규칙:
- todayActions의 reason 1개에만 사례를 녹이세요 (억지 끼워넣기 금지)
- insight에 사례 기업명을 한 줄로 언급 가능
- 사례가 상황과 안 맞으면 **절대** 사용하지 마세요
- 데이터가 없으면 이 섹션을 완전히 무시하세요

─── 업종 내 포지셔닝 ───

industryAvgRevenue/industryTopRevenue가 제공된 경우:
1. 사용자 매출이 업종 평균 대비 어디인지 한 줄로 알려주세요.
2. 상위 10%까지의 격차와 그 격차를 좁히기 위한 핵심 액션 1개를 todayActions에 포함하세요.
3. 하위 25%면 구조 변경이나 리로케이션을 적극 권고하세요.
4. 데이터가 없으면 이 섹션을 완전히 무시하세요.

─── 창업 준비 단계 코칭 (isPreLaunch=true일 때) ───

개업 전 사용자에게는 운영 데이터 대신 로드맵 진행 상황에 맞는 조언을 제공하세요.

currentRoadmapStage별 코칭 포인트:
- "vendor-setup": 공급업체 3곳 이상 견적 비교, 계약 시 최소 주문량·결제 조건 확인
- "construction-setup": 인테리어 예산은 총 투자금의 30-40% 이내, 평당 비용 확인, 시공 기간 2-4주
- "location-candidates": 유동인구·접근성·임대료 비율(매출 10% 이내) 기준 비교
- "registration-setup": 간이과세 vs 일반과세 판단, 사업용 신용카드 등록 (매입세액공제)
- "hiring-setup": 최소 인원 구성, 최저임금 10,320원 기준, 4대보험 사업주 부담 약 9.9%

todayActions는 "오늘 로드맵에서 할 일"로 변환:
- 예: { title: "견적 3곳 비교", reason: "공급업체 가격 차이가 원가율 5%p를 좌우합니다", priority: "high" }

─── 세금/고정비 코칭 ───

computedTaxEvents가 있으면 가장 급한 세금 일정을 todayActions나 insight에 포함하세요.
computedFixedExpenses가 있으면 7일 내 납부해야 할 고정비를 알려주세요.
패턴: "부가세 신고 마감 D-7. 이번 주 안에 매입 자료를 정리하세요"`;


export type DashboardContext = {
  industryCategoryId: string;
  industryLabel: string;
  storeName: string;
  monthlySales: number;
  monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
  weeklyChange: number;
  primeRate: number;
  runway: number;
  hasEmployees: boolean;
  employeeCount: number;
  businessHealthScore: "healthy" | "caution" | "danger" | "unknown";
  daysSinceLaunch: number;
  pendingTaxEvents: string[];
  lowStockItems: string[];
  upcomingFixedExpenses: string[];
  // 예측 데이터
  forecastNextWeekDaily?: number;
  forecastNextMonthTotal?: number;
  forecastConfidence?: "high" | "medium" | "low";
  months3CashProjection?: number;
  // Input 지표
  unansweredReviews?: number;
  daysSinceLastSnsPost?: number;
  inventoryTurnoverDays?: number;
  // 프랜차이즈 벤치마크 (enrichment layer가 채움)
  franchiseBrandId?: string;
  franchiseBrandName?: string;
  franchiseAvgRevenue?: number;          // 만원 (월)
  franchiseTopRevenue?: number;          // 만원 (월)
  franchiseCostStructure?: { ingredientRatio: number; laborRatio: number; rentRatio: number };
  franchiseTopStoreInsights?: string[];
  // 성공 사례 (enrichment layer가 채움)
  matchedCaseStudies?: Array<{ company: string; oneLiner: string; lesson: string }>;
  // 업종 벤치마크
  industryAvgRevenue?: number;           // 만원 (월)
  industryTopRevenue?: number;           // 만원 (월)
  // 업종별 비용 레이블
  expenseLabels?: { ingredients: string; labor: string; rent: string; utilities: string; other: string };
  // 창업 준비 단계 정보
  currentRoadmapStage?: string;
  isPreLaunch?: boolean;
  // 세금/고정비 (enrichment가 계산)
  computedTaxEvents?: string[];
  computedFixedExpenses?: string[];
};

export function buildDashboardActionPrompt(ctx: DashboardContext): string {
  const totalCost = ctx.monthlyCosts.ingredients + ctx.monthlyCosts.labor + ctx.monthlyCosts.rent + ctx.monthlyCosts.utilities + ctx.monthlyCosts.other;
  const fmtW = (n: number) => `${Math.round(n / 10000).toLocaleString()}만원`;
  const monthlyNet = ctx.monthlySales - totalCost;

  // 업종별 벤치마크 자동 삽입
  const benchmarks = getBenchmarks(ctx.industryCategoryId);
  const ingRatio = ctx.monthlySales > 0 ? (ctx.monthlyCosts.ingredients / ctx.monthlySales * 100).toFixed(1) : "0";
  const labRatio = ctx.monthlySales > 0 ? (ctx.monthlyCosts.labor / ctx.monthlySales * 100).toFixed(1) : "0";
  const rentRatio = ctx.monthlySales > 0 ? (ctx.monthlyCosts.rent / ctx.monthlySales * 100).toFixed(1) : "0";

  // 성장 단계 판별
  const stage = ctx.daysSinceLaunch < 90 ? "생존기 (0-90일)" :
    ctx.daysSinceLaunch < 365 ? "안정기 (3-12개월)" : "성장기 (12개월+)";

  // 위기 진단
  const crisisSignals: string[] = [];
  if (ctx.runway >= 0 && ctx.runway <= 3) crisisSignals.push(`현금 런웨이 ${ctx.runway}개월 — 즉시 현금 방어 필요`);
  if (ctx.weeklyChange < -10) crisisSignals.push(`주간 매출 ${ctx.weeklyChange}% 하락 — 원인 진단 필요`);
  if (ctx.primeRate > 65) crisisSignals.push(`프라임코스트 ${ctx.primeRate}% — 65% 위험선 초과`);
  if (ctx.monthlySales > 0 && (ctx.monthlyCosts.labor / ctx.monthlySales * 100) > 30) crisisSignals.push(`인건비 비율 ${labRatio}% — 30% 초과`);
  if (ctx.monthlySales > 0 && (ctx.monthlyCosts.rent / ctx.monthlySales * 100) > 15) crisisSignals.push(`임대료 비율 ${rentRatio}% — 15% 초과`);

  // 업종별 필수 운영 갭 감지
  const operationalGaps: string[] = [];
  const prereqs = getPrerequisiteGaps(ctx);
  operationalGaps.push(...prereqs);

  // 업종별 비용 레이블 (없으면 기본값)
  const el = ctx.expenseLabels ?? { ingredients: "재료비", labor: "인건비", rent: "임대료", utilities: "공과금", other: "기타" };

  return `## ${ctx.storeName} 경영 현황

업종: ${ctx.industryLabel} | 개업 ${ctx.daysSinceLaunch}일차 | 성장 단계: ${stage}

### 재무 현황
- 월 매출: ${fmtW(ctx.monthlySales)}
- 월 비용: ${fmtW(totalCost)}
  - ${el.ingredients}: ${fmtW(ctx.monthlyCosts.ingredients)} (매출 대비 ${ingRatio}%, 업계 적정: ${benchmarks.ingredientTarget})
  - ${el.labor}: ${fmtW(ctx.monthlyCosts.labor)} (매출 대비 ${labRatio}%, 업계 적정: ${benchmarks.laborTarget})
  - ${el.rent}: ${fmtW(ctx.monthlyCosts.rent)} (매출 대비 ${rentRatio}%, 업계 적정: ${benchmarks.rentTarget})
  - ${el.utilities}: ${fmtW(ctx.monthlyCosts.utilities)}
  - ${el.other}: ${fmtW(ctx.monthlyCosts.other)}
- 순이익: ${fmtW(monthlyNet)} (${monthlyNet >= 0 ? "흑자" : "적자"})
- 프라임코스트: ${ctx.primeRate.toFixed(1)}% (업계 위험선: 65%)
- 주간 매출 변화: ${ctx.weeklyChange >= 0 ? "+" : ""}${ctx.weeklyChange}%
- 현금 런웨이: ${ctx.runway < 0 ? "흑자 (무한)" : `${ctx.runway}개월`}

### 운영 현황
- 직원: ${ctx.hasEmployees ? `${ctx.employeeCount}명 (4대보험 사업주 부담 월 약 ${fmtW(ctx.employeeCount * 2156880 * 0.09945)})` : "1인 운영"}
- 건강 점수: ${ctx.businessHealthScore}

### 긴급 사항
${(ctx.computedTaxEvents ?? ctx.pendingTaxEvents).length > 0 ? `⚠ 세금: ${(ctx.computedTaxEvents ?? ctx.pendingTaxEvents).join(", ")}` : "✓ 세금 일정 여유"}
${ctx.lowStockItems.length > 0 ? `⚠ 재고 부족: ${ctx.lowStockItems.join(", ")}` : "✓ 재고 양호"}
${(ctx.computedFixedExpenses ?? ctx.upcomingFixedExpenses).length > 0 ? `⚠ 고정비 납부: ${(ctx.computedFixedExpenses ?? ctx.upcomingFixedExpenses).join(", ")}` : "✓ 고정비 납부 여유"}
${crisisSignals.length > 0 ? `\n### ⚠ 위기 신호 감지\n${crisisSignals.map(s => `- ${s}`).join("\n")}` : ""}
${operationalGaps.length > 0 ? `\n### 🚨 운영 필수 사항 미충족 (최우선 해결 필요)\n${operationalGaps.map(s => `- ${s}`).join("\n")}` : ""}

### 매출 예측 (AI 예측 엔진)
${ctx.forecastNextWeekDaily ? `- 다음 주 예상 일매출: ${fmtW(ctx.forecastNextWeekDaily)} (신뢰도: ${ctx.forecastConfidence ?? "low"})` : "- 예측 데이터 부족 (3일 이상 기록 필요)"}
${ctx.forecastNextMonthTotal ? `- 다음 달 예상 총매출: ${fmtW(ctx.forecastNextMonthTotal)}` : ""}
${ctx.months3CashProjection != null ? `- 3개월 후 예상 현금: ${fmtW(ctx.months3CashProjection)} ${ctx.months3CashProjection < 0 ? "⚠ 현금 부족 예상" : ""}` : ""}

### Input 지표 (사장이 오늘 바꿀 수 있는 것)
${ctx.unansweredReviews != null && ctx.unansweredReviews > 0 ? `- 미답변 리뷰: ${ctx.unansweredReviews}건 (네이버/카카오 노출 순위 하락 위험)` : ""}
${ctx.daysSinceLastSnsPost != null && ctx.daysSinceLastSnsPost > 3 ? `- SNS 최근 포스팅: ${ctx.daysSinceLastSnsPost}일 전 (3일 이상 미포스팅 시 도달률 감소)` : ""}
${ctx.inventoryTurnoverDays != null ? `- 재고 회전일: ${ctx.inventoryTurnoverDays}일` : ""}

${buildPreLaunchSection(ctx)}${buildFranchiseSection(ctx, fmtW)}${buildIndustrySection(ctx, fmtW)}${buildCaseStudySection(ctx)}
위 데이터를 분석하여:
${operationalGaps.length > 0 ? `**최우선:** 운영 필수 사항 미충족 항목부터 해결하는 액션을 todayActions 1순위로 배치하세요.` : ""}
1. 오늘 당장 실행할 행동 3가지 (업계 벤치마크 대비 분석 포함)
2. 위기 신호가 있다면 구체적 해결 플레이북 (단계별, 기간별)
3. 한 줄 핵심 인사이트 (반드시 숫자 포함)

을 제시해주세요.`;
}

// ─── 업종별 벤치마크 ─────────────────────────────────────────────────────────

function getBenchmarks(categoryId: string): {
  ingredientTarget: string;
  laborTarget: string;
  rentTarget: string;
} {
  // benchmarks.ts의 COST_RATIOS를 import할 수 없으므로 (AI 패키지 → shared 순환 아님)
  // COST_RATIOS와 동일한 값을 사용합니다. 변경 시 benchmarks.ts도 반드시 동기화.
  const benchmarkMap: Record<string, { ingredientTarget: string; laborTarget: string; rentTarget: string }> = {
    "food": { ingredientTarget: "30-35%", laborTarget: "25-30%", rentTarget: "8-15%" },
    "cafe-dessert": { ingredientTarget: "25-35%", laborTarget: "20-28%", rentTarget: "10-18%" },
    "retail": { ingredientTarget: "50-65% (매입원가)", laborTarget: "8-15%", rentTarget: "8-15%" },
    "beauty": { ingredientTarget: "8-15%", laborTarget: "40-50%", rentTarget: "10-15%" },
    "fitness": { ingredientTarget: "0-5%", laborTarget: "20-30%", rentTarget: "15-25%" },
    "education": { ingredientTarget: "10-18%", laborTarget: "30-40%", rentTarget: "12-18%" },
    "pet": { ingredientTarget: "15-25%", laborTarget: "25-35%", rentTarget: "10-15%" },
    "living-service": { ingredientTarget: "10-20%", laborTarget: "20-35%", rentTarget: "8-15%" },
    "space": { ingredientTarget: "3-8%", laborTarget: "10-20%", rentTarget: "20-30%" },
    "online-digital": { ingredientTarget: "20-40% (매입원가)", laborTarget: "5-15%", rentTarget: "10-20% (플랫폼)" },
    "startup-tech": { ingredientTarget: "5-15% (인프라)", laborTarget: "50-70%", rentTarget: "5-10%" },
  };
  return benchmarkMap[categoryId] ?? { ingredientTarget: "30-35%", laborTarget: "25-30%", rentTarget: "8-15%" };
}

// ─── 업종별 필수 운영 갭 감지 ─────────────────────────────────────────────────
// 데이터에서 추론 가능한 갭만 감지합니다.

function getPrerequisiteGaps(ctx: DashboardContext): string[] {
  const gaps: string[] = [];
  const cat = ctx.industryCategoryId;

  // 공통: 직원이 필요한데 없는 경우
  const needsStaff: Record<string, { minForOperation: number; reason: string }> = {
    "food": { minForOperation: 2, reason: "외식업은 주방+홀 최소 2명 필요. 1인 운영 시 위생·서비스 문제 발생" },
    "cafe-dessert": { minForOperation: 1, reason: "카페 1인 운영은 일매출 50만원이 한계. 피크타임 서비스 저하" },
    "fitness": { minForOperation: 1, reason: "안전 사고 대비 최소 1명의 추가 인력 필요" },
    "education": { minForOperation: 1, reason: "학원은 강사 외 행정 인력 필요 (수강생 관리, 상담)" },
    "startup-tech": { minForOperation: 1, reason: "스타트업은 창업자 혼자로는 제품+영업+운영 병행 불가. 최소 1명의 공동창업자/핵심인력 필요" },
  };

  const staffReq = needsStaff[cat];
  if (staffReq && ctx.employeeCount < staffReq.minForOperation && ctx.daysSinceLaunch > 14) {
    gaps.push(`[필수인력 부족] 현재 직원 ${ctx.employeeCount}명. ${cat === "food" ? "외식업" : cat === "startup-tech" ? "스타트업" : "이 업종"}은 최소 ${staffReq.minForOperation}명 필요. ${staffReq.reason}`);
  }

  // 외식업/카페: 인건비가 0인데 매출이 있는 경우 = 직원 미등록 의심
  if ((cat === "food" || cat === "cafe-dessert") && ctx.monthlyCosts.labor === 0 && ctx.monthlySales > 0 && ctx.daysSinceLaunch > 30) {
    gaps.push(`[인건비 미입력] 매출이 있는데 인건비가 0원입니다. 직원이 있다면 인건비를 입력하세요. 4대보험 미가입 시 과태료 위험`);
  }

  // 온라인/디지털: 재료비(=매입원가)가 0인데 매출이 있으면 원가 관리 안 함
  if (cat === "online-digital" && ctx.monthlyCosts.ingredients === 0 && ctx.monthlySales > 500000) {
    gaps.push(`[원가 미관리] 온라인 매출이 있는데 매입원가가 입력되지 않았습니다. 정확한 마진 계산을 위해 상품 원가를 입력하세요`);
  }

  // 스타트업: 런웨이 12개월 미만인데 매출이 없는 경우
  if (cat === "startup-tech" && ctx.monthlySales === 0 && ctx.runway >= 0 && ctx.runway < 12 && ctx.daysSinceLaunch > 60) {
    gaps.push(`[매출 없음 + 런웨이 ${ctx.runway}개월] 개업 ${ctx.daysSinceLaunch}일 경과했으나 매출 0원. PMF(Product-Market Fit) 검증이 최우선. 유료 고객 1명 확보에 모든 역량 집중 필요`);
  }

  // 모든 업종: 개업 후 30일 지났는데 비용이 전부 0
  if (ctx.daysSinceLaunch > 30 && ctx.monthlyCosts.ingredients === 0 && ctx.monthlyCosts.labor === 0 && ctx.monthlyCosts.rent === 0) {
    gaps.push(`[비용 미입력] 개업 30일 이상 경과했으나 비용이 입력되지 않았습니다. 정확한 경영 분석을 위해 월간 비용(재료비, 인건비, 임대료)을 입력해 주세요`);
  }

  // 모든 업종: 개업 후 90일 지났는데 매출 데이터가 없는 경우
  if (ctx.daysSinceLaunch > 90 && ctx.monthlySales === 0) {
    gaps.push(`[매출 미입력] 개업 90일 이상 경과했으나 매출 데이터가 없습니다. 매일 매출을 기록해야 경영 추세를 파악할 수 있습니다`);
  }

  // 외식업: 배달 비중 체크 (재료비 대비 기타 비용이 극히 낮으면 배달앱 미입점 가능성)
  if ((cat === "food" || cat === "cafe-dessert") && ctx.monthlySales > 0 && ctx.monthlyCosts.other === 0 && ctx.daysSinceLaunch > 30) {
    gaps.push(`[배달/기타비용 미입력] 외식업에서 기타 비용이 0원입니다. 배달앱 수수료, 포장재비, 카드수수료 등을 반영하지 않으면 실질 수익이 왜곡됩니다`);
  }

  // 소매/온라인: 재고 관리 안 함 (재고 항목이 0개인데 매출이 있음)
  if ((cat === "retail" || cat === "online-digital" || cat === "pet") && ctx.lowStockItems.length === 0 && ctx.monthlySales > 0 && ctx.daysSinceLaunch > 14) {
    // lowStockItems가 빈 배열이면 재고 자체를 등록 안 했을 수 있음
    // (재고가 있는데 다 정상이면 빈 배열이므로, 이건 AI가 판단)
  }

  return gaps;
}

// ─── 프랜차이즈/업종/사례 조건부 프롬프트 섹션 ─────────────────────────────

function buildFranchiseSection(ctx: DashboardContext, fmtW: (n: number) => string): string {
  if (!ctx.franchiseBrandName || !ctx.franchiseAvgRevenue) return "";
  const userMonthly = Math.round(ctx.monthlySales / 10000); // 만원
  const avgPct = ctx.franchiseAvgRevenue > 0
    ? Math.round((userMonthly / ctx.franchiseAvgRevenue) * 100)
    : 0;
  const topMultiplier = ctx.franchiseAvgRevenue > 0 && ctx.franchiseTopRevenue
    ? (ctx.franchiseTopRevenue / ctx.franchiseAvgRevenue).toFixed(1)
    : "?";

  let section = `\n### 프랜차이즈 벤치마크 (${ctx.franchiseBrandName} 같은 브랜드 비교)
- 가맹점 평균 월매출: ${fmtW(ctx.franchiseAvgRevenue * 10000)}
- 상위 매장 월매출: ${fmtW((ctx.franchiseTopRevenue ?? 0) * 10000)} (평균의 ${topMultiplier}배)
- 사장님 현재 위치: 평균 대비 ${avgPct}%`;

  if (ctx.franchiseCostStructure) {
    const cs = ctx.franchiseCostStructure;
    section += `\n- 상위 매장 비용 구조: 재료비 ${cs.ingredientRatio}%, 인건비 ${cs.laborRatio}%, 임대료 ${cs.rentRatio}%`;
  }
  if (ctx.franchiseTopStoreInsights?.length) {
    section += `\n- 상위 매장 성공 비결:\n${ctx.franchiseTopStoreInsights.map(i => `  - ${i}`).join("\n")}`;
  }
  return section + "\n";
}

function buildIndustrySection(ctx: DashboardContext, fmtW: (n: number) => string): string {
  if (!ctx.industryAvgRevenue) return "";
  const userMonthly = Math.round(ctx.monthlySales / 10000);
  const avgPct = ctx.industryAvgRevenue > 0
    ? Math.round((userMonthly / ctx.industryAvgRevenue) * 100)
    : 0;
  let position = "중위권";
  if (avgPct >= 200) position = "상위 10%";
  else if (avgPct >= 130) position = "상위 25%";
  else if (avgPct >= 70) position = "중위 50%";
  else if (avgPct >= 50) position = "하위 25%";
  else if (avgPct > 0) position = "하위 10%";

  return `\n### 업종 내 포지셔닝
- 업종 평균 월매출: ${fmtW(ctx.industryAvgRevenue * 10000)}
- 업종 상위 10% 월매출: ${fmtW((ctx.industryTopRevenue ?? 0) * 10000)}
- 사장님 위치: 업종 ${position} (평균 대비 ${avgPct}%)
`;
}

function buildCaseStudySection(ctx: DashboardContext): string {
  if (!ctx.matchedCaseStudies?.length) return "";
  return `\n### 참고할 성공 사례 (사장님과 비슷한 상황)
${ctx.matchedCaseStudies.map(c => `- ${c.company}: ${c.oneLiner}\n  → 교훈: ${c.lesson}`).join("\n")}
`;
}

function buildPreLaunchSection(ctx: DashboardContext): string {
  if (!ctx.isPreLaunch || !ctx.currentRoadmapStage) return "";
  const stageLabels: Record<string, string> = {
    "vendor-setup": "공급업체 선정 단계",
    "construction-setup": "인테리어·시설 단계",
    "location-candidates": "상권 분석 단계",
    "registration-setup": "사업자등록 단계",
    "hiring-setup": "인력 채용 단계",
    "franchise-application": "가맹 상담·계약 단계",
    "soft-open": "소프트 오픈(시범 영업) 단계",
  };
  const label = stageLabels[ctx.currentRoadmapStage] ?? ctx.currentRoadmapStage;
  return `\n### 현재 창업 준비 단계
- 단계: ${label}
- **개업 전이므로 매출/비용 데이터가 없습니다.** 로드맵 진행에 맞는 준비 조언을 제시하세요.
`;
}
