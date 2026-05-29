// ─── 사장님 자연어 질의 프롬프트 ────────────────────────────────────────────
// 사장님이 대시보드에서 자연어로 묻는 질문에 짧고 명확한 답변 + 다음 액션 제시.
//
// v2 (2026-04-24): "AI 가 사용자의 모든 정보를 알고 있게" — 컨텍스트 전면 확장.
//   사장님 가게의 매출/비용/직원/재고/고정비/마케팅/이상신호/로드맵/창업단계
//   까지 한 번에 받아서 데이터 기반 정밀 답변.

import { ANTI_HALLUCINATION_DIRECTIVE } from "../utils/anti-hallucination";

export type QuickQueryContext = {
  /** 사장님 질문 (한국어 자유 텍스트) */
  question: string;
  /** 언어 */
  language: "ko" | "en";

  // ── 가게 기본 정보 ──
  storeName?: string;
  /** 업종 카테고리 (food, cafe-dessert, beauty, ...) */
  industryCategoryId?: string;
  industryLabel?: string;
  /** 세부업종 (chicken-burger, specialty-coffee, ...) — K-히트 사례 매칭용 */
  industrySubIndustryId?: string;
  /** 창업유형 (independent / franchise / undecided) */
  startupType?: string;
  /** 운영 시작 여부 */
  businessLaunched?: boolean;
  /** 개업 후 경과일 */
  daysSinceLaunch?: number;
  /** 운영 단계 — pre-launch / early(0-30d) / growth(30-90d) / mature(90+) */
  operatingPhase?: "pre-launch" | "early" | "growth" | "mature";
  /** 사장님이 아직 안 써본 Found.One 핵심 기능들 (예: ["재고등록","고정비등록"]) */
  unusedFeatures?: string[];
  /** 매출 트렌드 — improving/declining/stable/insufficient (최근 7일 vs 그 이전 7일) */
  salesTrendDirection?: "improving" | "declining" | "stable" | "insufficient";
  /** 지난달 prime cost rate (%) — 이번달과 비교 가능할 때만 */
  prevPrimeRate?: number;
  /** prime cost rate 증감 (현재 - 지난달, %p) */
  primeRateDeltaPct?: number;
  /** 선호 지역 */
  region?: string;
  /** 자본금 (만원) */
  selectedBudget?: number;

  // ── 매출/비용/마진 (이번 달 합산) ──
  monthlySales?: number;          // 원 단위
  monthlyCosts?: number;
  marginPct?: number;
  /** 비용 세부 분해 (이번 달, 원 단위) */
  monthlyCostBreakdown?: {
    ingredients?: number;
    labor?: number;
    rent?: number;
    utilities?: number;
    sga?: number;
    marketing?: number;
    other?: number;
    interest?: number;
  };
  /** 어제 매출 */
  yesterdaySales?: number;
  /** 최근 7일 매출 변화 (%) */
  weeklyChange?: number;
  /** 같은 요일 대비 변화 (%) */
  weekdayChange?: number;
  /** 프라임 코스트율 (%) */
  primeRate?: number;
  /** 런웨이 (개월, -1 = 흑자) */
  runway?: number;
  /** 사업 건강도 */
  businessHealthScore?: "healthy" | "caution" | "danger" | "unknown";

  // ── 운영 ──
  /** 직원 수 */
  employeeCount?: number;
  /** 재고 부족 품목 (low stock 알림 받은 항목) */
  lowStockItems?: string[];
  /** 7일 내 다가오는 고정비 */
  upcomingFixedExpenses?: string[];
  /** 7일 내 세금 일정 */
  pendingTaxEvents?: string[];

  // ── 마케팅 ──
  /** 이번 달 총 마케팅 지출 (원) */
  totalMarketingSpend?: number;
  /** 활성 마케팅 채널 (인스타·네이버·당근 등) */
  activeChannels?: string[];
  /** 마케팅 ROAS */
  marketingRoas?: number;
  /** 미답변 리뷰 수 */
  unansweredReviews?: number;
  /** 마지막 SNS 포스팅 후 경과일 */
  daysSinceLastSnsPost?: number;

  // ── 이상 신호 (anomaly) ──
  activeAnomalies?: Array<{ kind: string; severity: "critical" | "warning" | "info"; headline: string }>;

  // ── 프랜차이즈 (가맹점주인 경우) ──
  franchiseBrandId?: string;
  franchiseBrandName?: string;
  /** 같은 브랜드 평균 월매출 (만원) */
  franchiseAvgMonthlyRevenue?: number;
  /** 같은 브랜드 상위 매장 월매출 (만원) */
  franchiseTopMonthlyRevenue?: number;

  // ── 로드맵 / 창업 단계 ──
  /** 현재 로드맵 단계 코드 */
  currentRoadmapStage?: string;
  /** 완료한 로드맵 단계 수 */
  completedRoadmapCount?: number;
  /** 개업 전 (isPreLaunch) 단계인지 */
  isPreLaunch?: boolean;

  // ── 고객 인터뷰 / 시간 로그 (있을 때만) ──
  /** 누적 고객 인터뷰 수 */
  customerInterviewCount?: number;
  /** 최근 시간 로그 (어제) — customer/operations/marketing 비율 */
  yesterdayTimeAllocation?: { customerPct: number; operationsPct: number; marketingPct: number };

  // ── K-히트 사례 매칭 결과 (서버에서 enrichment 가능, optional) ──
  matchedKHitCases?: Array<{ id: string; name: string; oneLiner: string; lesson: string }>;

  /**
   * RAG: 외부 비즈니스 인사이트 자료에서 검색된 컨텍스트.
   * formatInsightContext()의 출력 그대로 — 헤더와 사용 지침이 포함된 plain text.
   * 서버 라우트가 retrieveInsightChunks → formatInsightContext 결과를 주입합니다.
   */
  insightContext?: string;
};

export type QuickQueryResult = {
  answer: string;
  nextAction?: string;
  confidence: "high" | "medium" | "low";
  /** 답변 시 인용한 K-히트 사례 (UI 에 [사례:XX] 배지 노출) */
  referencedCase?: { id: string; name: string };
};

export const QUICK_QUERY_SYSTEM_PROMPT = `<role>
당신은 Found.One AI — 한국 소상공인·스타트업 사장님의 경영 파트너입니다.
사장님이 일하다가 불쑥 묻는 질문에 데이터 기반으로 짧고 명확한 답변 + 다음 액션을 제시합니다.

당신은 사장님 가게의 **모든 데이터**를 보고 있습니다 (매출·비용·직원·재고·고정비·마케팅·이상신호·로드맵 등).
사장님이 질문하지 않아도 데이터에서 모순되는 신호가 보이면 짧게 짚어줘도 됩니다.
</role>

${ANTI_HALLUCINATION_DIRECTIVE}

<style>
- 답변은 **2-4 문장**, 길어도 120자 내외. 사장님은 바쁩니다.
- **컨텍스트의 실제 숫자를 그대로 인용** — "이번 달 매출 320만원이고…" / "재료비가 매출의 42%로…"
- 모르면 "추측 금지" — "더 많은 데이터가 필요합니다" 정직하게
- 가능하면 미국 경영 거장 지혜 1줄 인용 (Bezos·Graham·Horowitz·Munger 등)
  단, 자연스럽게 연결될 때만. 억지로 끼워넣지 X.
- K-히트 사례(matchedKHitCases)가 있고 질문과 맞으면 1개만 인용 가능 — 그때 referencedCase 필드 채울 것.
</style>

<wisdom>
상황별 추천 멘토:
- "고객이 줄어요" → Paul Graham "Make something people want" + Bezos "Customer obsession"
- "비용 줄여야 하나요" → Horowitz "People > Products > Profits" (사람 먼저)
- "확장 타이밍" → Hoffman "Marine→Army→Police 3단" + Bezos "Day 1"
- "경쟁 두려워요" → Thiel "Don't compete, monopolize"
- "포기할까요" → Graham "Determination > Intelligence"
- "흑자 났는데 더 욕심?" → Buffett "Long-term greedy"
</wisdom>

<feature_nudging>
컨텍스트의 「아직 안 써본 핵심 기능」 목록이 있으면, 답변 끝에 자연스럽게 1개만 추천 (강요 X).
- 질문과 직접 관련 있는 기능이 있으면 그것 우선 (예: 재고 질문 → "재고등록"이 unusedFeatures 에 있으면 "재고를 등록해 두시면 부족 알림도 자동으로 켜집니다" 한 줄).
- 관련 없으면 끼워 넣지 말 것. 모든 답변에 항상 추천 X.
- 톤: "~ 해보세요" 강요 X, "~ 하시면 ~ 가 자동 으로 켜집니다" 가치 제안.
- 한 답변에 1개 기능만. 나열 X.
</feature_nudging>

<phase_coaching>
컨텍스트의 「운영 단계」에 따라 톤·우선순위를 조정합니다 (사장님과 같은 결의 경영자처럼):
- **개업 전**: 자본·로드맵·인허가·계약 리스크 우선. 매출 추정은 "업종 평균"임을 명시. 거대한 결정 X, 다음 단계 1개만.
- **초기 (Day 1~30)**: 첫 30일은 PMF·고객 확보·운영 동선 안정화. 매출 변동 자연스러우니 단기 하락에 과민반응 X. 일평균·요일 패턴 학습 중. 비용은 「정지/축소」보다 「이해」가 먼저.
- **성장 (Day 31~90)**: 매출 패턴 보임 → 예측 가능. 비용 구조 비율(prime cost) 안정화 검토. 마케팅 ROAS·재방문율·재고 회전 데이터 누적기. 「개선」 액션 가능.
- **성숙 (Day 90+)**: 이미 데이터 풍부. 효율화·확장·신메뉴·2호점·자동화 검토. 매출 정체 시 PMF 재검증보다 운영 효율·신규 채널 우선.

매출 트렌드 신호 처리:
- improving (+5% 이상): "지금 무엇이 작동했는가?" 원인 파악 후 강화. 거장: Bezos "Day 1" / Graham "Default alive".
- declining (-5% 이하): 즉시 원인 진단 — 요일/날씨/메뉴/리뷰/경쟁. 「비용 줄이기」 보다 「매출 회복」 먼저. Horowitz "People > Profits".
- stable: 데이터 더 쌓일 때까지 큰 결정 X. 단, 성장 단계에 stable 이면 정체 신호 → 가설 한 개 실험.
- insufficient: 추세 단정 X. "데이터가 더 필요합니다" 정직하게.

비용 구조 추세 신호:
- primeRateDelta > +2%p (악화): 어느 항목이 늘었는지 분해 확인 → 식자재 단가↑ vs 인건비↑ vs 매출↓ 효과인지 구분. 단편적 「줄여라」 X.
- primeRateDelta < -2%p (개선): 칭찬 + 지속 가능한지 점검. 일회성 효과(공급처 변경) vs 구조 개선 구분.
- prime cost 65% 초과 시 위험선 — 한 달 더 보지 말고 즉시 진단.
</phase_coaching>

<output_format>
반드시 아래 JSON으로만 응답:
{
  "answer": "2-4 문장 핵심 답변. 컨텍스트 숫자 인용 + 거장 지혜 (자연스러울 때만)",
  "nextAction": "한 줄 다음 행동 (선택, 없으면 생략)",
  "confidence": "high|medium|low",
  "referencedCase": { "id": "...", "name": "..." }
}
referencedCase 는 K-히트 사례를 실제로 인용했을 때만 포함 (생략 가능).
</output_format>

<rules>
- 사장님 가게 데이터에 없는 숫자 만들지 말 것 (할루시 절대 금지)
- 한국 시장 맥락 (홈택스·간이과세·소상공인 정책자금 등) 자연스럽게
- 법적 조언 회피 ("세무사·변호사와 상의" 권유)
- 한국어로 답변
- 비속어·반말 금지. 존댓말 유지.
</rules>`;

export function buildQuickQueryUserPrompt(ctx: QuickQueryContext): string {
  const lines: string[] = [];
  lines.push(`## 사장님 질문\n"${ctx.question}"`);
  lines.push("");
  lines.push("## 가게 종합 컨텍스트");

  // ── 1. 가게 기본 정보 ──
  lines.push("### 1. 가게 정보");
  if (ctx.storeName) lines.push(`- 가게명: ${ctx.storeName}`);
  if (ctx.industryLabel || ctx.industryCategoryId) {
    const sub = ctx.industrySubIndustryId ? ` / ${ctx.industrySubIndustryId}` : "";
    lines.push(`- 업종: ${ctx.industryLabel ?? ctx.industryCategoryId}${sub}`);
  }
  if (ctx.startupType) lines.push(`- 창업유형: ${ctx.startupType}`);
  if (ctx.region) lines.push(`- 지역: ${ctx.region}`);
  if (ctx.selectedBudget !== undefined) lines.push(`- 자본금: ${ctx.selectedBudget.toLocaleString()}만원`);
  if (ctx.businessLaunched !== undefined) {
    const phaseLabel = ctx.operatingPhase
      ? ctx.operatingPhase === "pre-launch" ? " · 단계: 개업 전 준비"
        : ctx.operatingPhase === "early" ? " · 단계: 초기(PMF·고객확보)"
        : ctx.operatingPhase === "growth" ? " · 단계: 성장(안정화·패턴학습)"
        : " · 단계: 성숙(효율화·확장 검토)"
      : "";
    lines.push(`- 운영 상태: ${ctx.businessLaunched ? `운영 중 (개업 ${(ctx.daysSinceLaunch ?? 0) + 1}일차)${phaseLabel}` : "개업 전"}`);
  }
  if (ctx.franchiseBrandName) lines.push(`- 가맹 브랜드: ${ctx.franchiseBrandName}`);
  if (ctx.unusedFeatures && ctx.unusedFeatures.length > 0) {
    lines.push(`- 아직 안 써본 핵심 기능: ${ctx.unusedFeatures.join(", ")}`);
  }

  // ── 2. 매출/비용/마진 ──
  if (
    ctx.monthlySales !== undefined ||
    ctx.monthlyCosts !== undefined ||
    ctx.marginPct !== undefined
  ) {
    lines.push("");
    lines.push("### 2. 이번 달 매출·비용");
    if (ctx.monthlySales !== undefined) lines.push(`- 매출: ${formatWon(ctx.monthlySales)}`);
    if (ctx.monthlyCosts !== undefined) lines.push(`- 비용 합계: ${formatWon(ctx.monthlyCosts)}`);
    if (ctx.marginPct !== undefined) lines.push(`- 이익률: ${ctx.marginPct.toFixed(1)}%`);
    if (ctx.primeRate !== undefined) lines.push(`- 프라임코스트율: ${ctx.primeRate.toFixed(1)}% ${ctx.primeRate > 65 ? "⚠ 위험선(65%) 초과" : ""}`);
    if (ctx.runway !== undefined) lines.push(`- 런웨이: ${ctx.runway < 0 ? "흑자" : `${ctx.runway}개월`}`);
    if (ctx.yesterdaySales !== undefined) lines.push(`- 어제 매출: ${formatWon(ctx.yesterdaySales)}`);
    if (ctx.weeklyChange !== undefined) {
      const trendTag = ctx.salesTrendDirection === "improving" ? " ↗ 상승세"
        : ctx.salesTrendDirection === "declining" ? " ↘ 하락세 — 즉시 원인 진단 권장"
        : ctx.salesTrendDirection === "stable" ? " → 안정"
        : "";
      lines.push(`- 주간 매출 변화: ${ctx.weeklyChange >= 0 ? "+" : ""}${ctx.weeklyChange}%${trendTag}`);
    } else if (ctx.salesTrendDirection === "insufficient") {
      lines.push(`- 주간 매출 변화: 데이터 부족 (14일 미만)`);
    }
    if (ctx.prevPrimeRate !== undefined && ctx.primeRateDeltaPct !== undefined) {
      const deltaTag = ctx.primeRateDeltaPct > 2 ? " ⚠ 비용 구조 악화"
        : ctx.primeRateDeltaPct < -2 ? " ✓ 비용 구조 개선"
        : "";
      lines.push(`- 비용 구조 추세: 프라임코스트 지난달 ${ctx.prevPrimeRate.toFixed(1)}% → 이번달 ${(ctx.primeRate ?? 0).toFixed(1)}% (${ctx.primeRateDeltaPct >= 0 ? "+" : ""}${ctx.primeRateDeltaPct}%p)${deltaTag}`);
    }
    if (ctx.weekdayChange !== undefined) lines.push(`- 같은 요일 대비: ${ctx.weekdayChange >= 0 ? "+" : ""}${ctx.weekdayChange.toFixed(1)}%`);
    if (ctx.businessHealthScore) lines.push(`- 사업 건강도: ${ctx.businessHealthScore}`);
  }

  // ── 3. 비용 세부 분해 ──
  if (ctx.monthlyCostBreakdown) {
    const b = ctx.monthlyCostBreakdown;
    const total = (b.ingredients ?? 0) + (b.labor ?? 0) + (b.rent ?? 0) + (b.utilities ?? 0) + (b.sga ?? 0) + (b.marketing ?? 0) + (b.other ?? 0) + (b.interest ?? 0);
    if (total > 0) {
      lines.push("");
      lines.push("### 3. 이번 달 비용 분해");
      if (b.ingredients !== undefined) lines.push(`- 재료비: ${formatWon(b.ingredients)} (${pct(b.ingredients, total)})`);
      if (b.labor !== undefined) lines.push(`- 인건비: ${formatWon(b.labor)} (${pct(b.labor, total)})`);
      if (b.rent !== undefined) lines.push(`- 임대료: ${formatWon(b.rent)} (${pct(b.rent, total)})`);
      if (b.utilities !== undefined) lines.push(`- 공과금: ${formatWon(b.utilities)} (${pct(b.utilities, total)})`);
      if (b.sga !== undefined) lines.push(`- 판관비: ${formatWon(b.sga)} (${pct(b.sga, total)})`);
      if (b.marketing !== undefined) lines.push(`- 마케팅비: ${formatWon(b.marketing)} (${pct(b.marketing, total)})`);
      if (b.other !== undefined) lines.push(`- 기타: ${formatWon(b.other)} (${pct(b.other, total)})`);
      if (b.interest !== undefined) lines.push(`- 이자비: ${formatWon(b.interest)} (${pct(b.interest, total)})`);
    }
  }

  // ── 4. 운영 ──
  if (
    ctx.employeeCount !== undefined ||
    (ctx.lowStockItems && ctx.lowStockItems.length > 0) ||
    (ctx.upcomingFixedExpenses && ctx.upcomingFixedExpenses.length > 0) ||
    (ctx.pendingTaxEvents && ctx.pendingTaxEvents.length > 0)
  ) {
    lines.push("");
    lines.push("### 4. 운영 현황");
    if (ctx.employeeCount !== undefined) lines.push(`- 직원 수: ${ctx.employeeCount}명`);
    if (ctx.lowStockItems && ctx.lowStockItems.length > 0) {
      lines.push(`- 재고 부족 알림: ${ctx.lowStockItems.join(", ")}`);
    }
    if (ctx.upcomingFixedExpenses && ctx.upcomingFixedExpenses.length > 0) {
      lines.push("- 7일 내 고정비:");
      ctx.upcomingFixedExpenses.forEach((e) => lines.push(`  · ${e}`));
    }
    if (ctx.pendingTaxEvents && ctx.pendingTaxEvents.length > 0) {
      lines.push("- 7일 내 세금 일정:");
      ctx.pendingTaxEvents.forEach((e) => lines.push(`  · ${e}`));
    }
  }

  // ── 5. 마케팅 ──
  if (
    ctx.totalMarketingSpend !== undefined ||
    (ctx.activeChannels && ctx.activeChannels.length > 0) ||
    ctx.marketingRoas !== undefined ||
    ctx.unansweredReviews !== undefined ||
    ctx.daysSinceLastSnsPost !== undefined
  ) {
    lines.push("");
    lines.push("### 5. 마케팅 현황");
    if (ctx.totalMarketingSpend !== undefined) lines.push(`- 이번 달 마케팅 지출: ${formatWon(ctx.totalMarketingSpend)}`);
    if (ctx.activeChannels && ctx.activeChannels.length > 0) lines.push(`- 활성 채널: ${ctx.activeChannels.join(", ")}`);
    if (ctx.marketingRoas !== undefined) lines.push(`- ROAS: ${ctx.marketingRoas.toFixed(2)}${ctx.marketingRoas < 1 ? " ⚠ 손실 구간" : ""}`);
    if (ctx.unansweredReviews !== undefined && ctx.unansweredReviews > 0) lines.push(`- 미답변 리뷰: ${ctx.unansweredReviews}건`);
    if (ctx.daysSinceLastSnsPost !== undefined) lines.push(`- 마지막 SNS 포스팅: ${ctx.daysSinceLastSnsPost}일 전`);
  }

  // ── 6. 이상 신호 ──
  if (ctx.activeAnomalies && ctx.activeAnomalies.length > 0) {
    lines.push("");
    lines.push("### 6. 활성 이상 신호 (룰 기반)");
    ctx.activeAnomalies.slice(0, 4).forEach((a) => {
      const sev = a.severity === "critical" ? "🚨" : a.severity === "warning" ? "⚠" : "ⓘ";
      lines.push(`- ${sev} ${a.headline}`);
    });
  }

  // ── 7. 프랜차이즈 벤치마크 ──
  if (ctx.franchiseAvgMonthlyRevenue !== undefined || ctx.franchiseTopMonthlyRevenue !== undefined) {
    lines.push("");
    lines.push("### 7. 같은 브랜드 벤치마크");
    if (ctx.franchiseAvgMonthlyRevenue !== undefined) lines.push(`- 평균 월매출: ${ctx.franchiseAvgMonthlyRevenue.toLocaleString()}만원`);
    if (ctx.franchiseTopMonthlyRevenue !== undefined) lines.push(`- 상위 매장 월매출: ${ctx.franchiseTopMonthlyRevenue.toLocaleString()}만원`);
  }

  // ── 8. 로드맵 ──
  if (ctx.currentRoadmapStage || ctx.completedRoadmapCount !== undefined) {
    lines.push("");
    lines.push("### 8. 로드맵 진행");
    if (ctx.currentRoadmapStage) lines.push(`- 현재 단계: ${ctx.currentRoadmapStage}`);
    if (ctx.completedRoadmapCount !== undefined) lines.push(`- 완료 단계: ${ctx.completedRoadmapCount}개`);
    if (ctx.isPreLaunch) lines.push("- ⓘ 개업 전 단계 — 매출/비용 데이터는 없거나 적음");
  }

  // ── 9. 시간 로그 / 인터뷰 ──
  if (ctx.customerInterviewCount !== undefined || ctx.yesterdayTimeAllocation) {
    lines.push("");
    lines.push("### 9. 사장님 활동");
    if (ctx.customerInterviewCount !== undefined) lines.push(`- 누적 고객 인터뷰: ${ctx.customerInterviewCount}건`);
    if (ctx.yesterdayTimeAllocation) {
      const t = ctx.yesterdayTimeAllocation;
      lines.push(`- 어제 시간 분배: 고객 ${t.customerPct}% / 운영 ${t.operationsPct}% / 마케팅 ${t.marketingPct}%`);
    }
  }

  // ── 10b. 외부 인사이트 (RAG, 있으면) ──
  if (ctx.insightContext && ctx.insightContext.trim().length > 0) {
    lines.push("");
    lines.push(ctx.insightContext.trim());
  }

  // ── 10. K-히트 사례 (있으면) ──
  if (ctx.matchedKHitCases && ctx.matchedKHitCases.length > 0) {
    lines.push("");
    lines.push("### 10. 사장님 업종 K-히트 사례 (인용 가능)");
    lines.push("질문과 자연스럽게 맞으면 1개만 인용. 인용 시 referencedCase 필드 채울 것.");
    lines.push("| id | 이름 | 한 줄 | 교훈 |");
    lines.push("|----|------|-------|------|");
    ctx.matchedKHitCases.slice(0, 3).forEach((c) => {
      lines.push(`| \`${c.id}\` | ${c.name} | ${c.oneLiner} | ${c.lesson} |`);
    });
  }

  lines.push("");
  lines.push("---");
  lines.push("위 컨텍스트를 기반으로 사장님 질문에 짧고 명확하게 답변하세요. JSON 형식만 출력.");
  return lines.join("\n");
}

// ─── helpers ───────────────────────────────────────────
function formatWon(won: number): string {
  if (won >= 100_000_000) return `${(won / 100_000_000).toFixed(1)}억원`;
  if (won >= 10_000) return `${Math.round(won / 10_000).toLocaleString()}만원`;
  return `${won.toLocaleString()}원`;
}

function pct(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
