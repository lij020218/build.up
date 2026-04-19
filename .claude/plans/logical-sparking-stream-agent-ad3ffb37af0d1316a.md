# Smart AI Coaching Implementation Plan

## Strategy: Enhance Existing Systems (No New Endpoints)

The cleanest approach is to expand the enrichment layer (`enrich-context.ts`) and system prompt (`prompt.ts`) without creating new API routes or UI components. The existing `DashboardActionsResponse` format (3 todayActions + crisisActions + insight) is already well-structured. The intelligence gap is that data exists but is never injected into the AI context.

---

## Phase 1: Expand Case Study Database + Detection Logic

### File: `packages/shared/src/knowledge/success-case-studies.ts`

**1A. Add 7 new BusinessSituation types to the union (line 7-15):**

```typescript
export type BusinessSituation =
  | "funding-crisis"
  | "pmf-not-found"
  | "revenue-decline"
  | "competitor-pressure"
  | "cost-crisis"
  | "scaling-decision"
  | "small-biz-turnaround"
  | "talent-acquisition"
  // --- NEW ---
  | "marketing-stagnant"      // 매출은 있지만 성장 없음
  | "menu-fatigue"            // 고객 재방문율 하락
  | "delivery-dependency"     // 배달 비중 80%+
  | "seasonal-slump"          // 계절 비수기
  | "expansion-ready"         // 흑자 안정, 2호점 고민
  | "staff-crisis"            // 직원 이탈/채용 실패
  | "rent-crisis";            // 임대료 인상/재계약 문제
```

**1B. Add ~25 new case studies for new situations** (append to CASE_STUDIES array after line 457):

Add case studies covering:
- **marketing-stagnant (4 cases):** Domino's Pizza digital transformation, 교촌치킨 SNS revival, local bakery Instagram case, 무신사 community-first marketing
- **menu-fatigue (3 cases):** McDonald's menu simplification, 본죽 seasonal menu rotation, 이디야 signature menu strategy
- **delivery-dependency (3 cases):** 자체배달 전환 사례, 피자헛 dine-in pivot, ghost kitchen optimization
- **seasonal-slump (3 cases):** 아이스크림 매장 겨울 전략, 보양식점 여름 메뉴 확장, Baskin Robbins cake pivot
- **expansion-ready (3 cases):** 역전할머니맥주 2호점 전략, 모스버거 slow expansion, 본죽 multi-brand
- **staff-crisis (3 cases):** Costco retention model, 스타벅스 partner program, 당근마켓 culture-first hiring
- **rent-crisis (3 cases):** 배달 전용 매장 전환, 공유주방 활용, 임대료 협상 성공 사례

Each case study follows the existing `CaseStudy` type exactly -- no schema changes needed.

**1C. Expand `SituationDetectionInput` with new optional signals (line 462-469):**

```typescript
export type SituationDetectionInput = {
  runway: number;
  monthlySales: number;
  weeklyChange: number;
  primeRate: number;
  daysSinceLaunch: number;
  categoryId: string;
  // --- NEW optional fields ---
  weeklyChangeHistory?: number[];   // last 4 weeks of weeklyChange values
  employeeCount?: number;
  employeeTurnoverLast90Days?: number;
  rentRatio?: number;               // rent / monthlySales * 100
  deliveryRatio?: number;           // delivery sales / total sales * 100
  daysSinceLastSnsPost?: number;
  customerReturnRate?: number;      // % (lower = worse)
  consecutiveFlatWeeks?: number;    // weeks with <2% absolute change
  currentMonth?: number;            // 1-12 for seasonal detection
  seasonalCategory?: boolean;       // true for ice cream, seasonal food etc.
};
```

**1D. Expand `detectBusinessSituation()` (line 471-482):**

Keep existing priority checks unchanged. Add new checks AFTER the existing ones (before the `return null` at line 481):

```typescript
export function detectBusinessSituation(input: SituationDetectionInput): BusinessSituation | null {
  // === EXISTING priority checks (unchanged) ===
  if (input.runway >= 0 && input.runway <= 3) return "funding-crisis";
  if (input.categoryId === "startup-tech" && input.monthlySales === 0 && input.daysSinceLaunch > 60) return "pmf-not-found";
  if (input.primeRate > 65) return "cost-crisis";
  if (input.weeklyChange < -15) return "revenue-decline";
  if (input.monthlySales === 0 && input.daysSinceLaunch > 90) return "pmf-not-found";
  if (input.weeklyChange < -10) return "revenue-decline";

  // === NEW granular checks ===
  // Rent crisis: rent > 15% of sales
  if (input.rentRatio != null && input.rentRatio > 15) return "rent-crisis";

  // Staff crisis: high turnover or critically understaffed
  if (input.employeeTurnoverLast90Days != null && input.employeeTurnoverLast90Days >= 2) return "staff-crisis";

  // Delivery dependency: over 80% delivery
  if (input.deliveryRatio != null && input.deliveryRatio > 80) return "delivery-dependency";

  // Seasonal slump: seasonal business in off-season with sharp decline
  if (input.seasonalCategory && input.weeklyChange < -20) return "seasonal-slump";

  // Menu fatigue: low customer return rate after 6+ months
  if (input.customerReturnRate != null && input.customerReturnRate < 20 && input.daysSinceLaunch > 180) return "menu-fatigue";

  // Marketing stagnant: flat sales for 4+ weeks
  if (input.consecutiveFlatWeeks != null && input.consecutiveFlatWeeks >= 4 && input.monthlySales > 0) return "marketing-stagnant";

  // === EXISTING expansion check (unchanged) ===
  if (input.monthlySales > 0 && input.daysSinceLaunch > 365 && input.weeklyChange >= 0) {
    // NEW: more precise expansion-ready detection
    if (input.runway < 0 && input.primeRate < 60) return "expansion-ready";
    return "scaling-decision";
  }

  return null;
}
```

---

## Phase 2: Add New Fields to DashboardContext + Build Prompt Sections

### File: `packages/ai/src/dashboard/prompt.ts`

**2A. Add new optional fields to `DashboardContext` type (line 143-182):**

Insert after `industryTopRevenue` (line 179) and before `expenseLabels` (line 181):

```typescript
  // Vendor recommendations (enrichment layer fills)
  vendorRecommendations?: Array<{
    vendorType: string;
    vendorTypeLabel: string;
    title: string;
    description: string;
    checkItems: string[];
  }>;

  // Interior guides (enrichment layer fills)
  interiorGuides?: {
    materials: Array<{ name: string; description: string; costRange?: string; pros?: string[]; cons?: string[] }>;
    concepts: Array<{ name: string; description: string; costRange?: string }>;
  };

  // Roadmap stage context (for pre-launch coaching)
  currentRoadmapStage?: string;
  isPreLaunch?: boolean;

  // Computed tax events (replace always-empty pendingTaxEvents)
  computedPendingTaxEvents?: string[];

  // Computed upcoming fixed expenses
  computedUpcomingFixedExpenses?: string[];
```

**2B. Add three new section-builder functions** (after `buildCaseStudySection` around line 392):

```typescript
function buildVendorSection(ctx: DashboardContext): string {
  if (!ctx.vendorRecommendations?.length) return "";
  return `\n### 추천 공급업체 정보
${ctx.vendorRecommendations.slice(0, 5).map(v =>
    `- [${v.vendorTypeLabel}] ${v.title}: ${v.description}`
  ).join("\n")}
`;
}

function buildInteriorSection(ctx: DashboardContext): string {
  if (!ctx.interiorGuides) return "";
  const { materials, concepts } = ctx.interiorGuides;
  if (!materials.length && !concepts.length) return "";
  let section = "\n### 인테리어 참고 정보\n";
  if (concepts.length) {
    section += `추천 컨셉: ${concepts.map(c => `${c.name}${c.costRange ? ` (${c.costRange})` : ""}`).join(", ")}\n`;
  }
  if (materials.length) {
    section += `추천 자재: ${materials.map(m => `${m.name}${m.costRange ? ` (${m.costRange})` : ""}`).join(", ")}\n`;
  }
  return section;
}

function buildPreLaunchSection(ctx: DashboardContext): string {
  if (!ctx.isPreLaunch || !ctx.currentRoadmapStage) return "";
  const stageLabels: Record<string, string> = {
    vendor_setup: "공급업체 선택",
    construction_setup: "인테리어/시공",
    location_candidates: "입지 선택",
    permit_check: "인허가 확인",
    contract_review: "계약 검토",
    registration_setup: "사업자 등록",
    budget_setup: "예산 설정",
  };
  const label = stageLabels[ctx.currentRoadmapStage] ?? ctx.currentRoadmapStage;
  return `\n### 현재 창업 준비 단계: ${label}
사장님은 아직 개업 전 창업 준비 중입니다. 현재 단계에 맞는 구체적인 실행 조언을 제공하세요.
`;
}
```

**2C. Wire new sections into `buildDashboardActionPrompt`** (line 253):

Change line 253 from:
```typescript
${buildFranchiseSection(ctx, fmtW)}${buildIndustrySection(ctx, fmtW)}${buildCaseStudySection(ctx)}
```
to:
```typescript
${buildFranchiseSection(ctx, fmtW)}${buildIndustrySection(ctx, fmtW)}${buildCaseStudySection(ctx)}${buildVendorSection(ctx)}${buildInteriorSection(ctx)}${buildPreLaunchSection(ctx)}
```

**2D. Also update the "긴급 사항" section** (lines 237-240) to use computed tax events:

Change line 237 from:
```typescript
${ctx.pendingTaxEvents.length > 0 ? `⚠ 세금: ${ctx.pendingTaxEvents.join(", ")}` : "✓ 세금 일정 여유"}
```
to:
```typescript
${(ctx.computedPendingTaxEvents ?? ctx.pendingTaxEvents).length > 0 ? `⚠ 세금: ${(ctx.computedPendingTaxEvents ?? ctx.pendingTaxEvents).join(", ")}` : "✓ 세금 일정 여유"}
```

And line 239 similarly for fixed expenses:
```typescript
${(ctx.computedUpcomingFixedExpenses ?? ctx.upcomingFixedExpenses).length > 0 ? `⚠ 고정비 납부: ${(ctx.computedUpcomingFixedExpenses ?? ctx.upcomingFixedExpenses).join(", ")}` : "✓ 고정비 납부 여유"}
```

**2E. Expand `DASHBOARD_ACTION_SYSTEM_PROMPT`** (after line 57, the "성장 단계별 코칭 포인트" section):

Add the following sections:

```
─── 창업 준비 단계별 코칭 (개업 전) ───

사장님이 아직 개업하지 않았다면(isPreLaunch=true), 현재 로드맵 단계에 맞는 코칭을 제공하세요:

- vendor_setup (공급업체 선택 단계):
  vendorRecommendations가 있으면 구체적으로 비교 추천하세요.
  패턴: "사장님 업종에서 [원가항목]을 [X]% 이하로 관리하는 상위 매장은 [공급 방식]을 사용합니다. [추천업체 A], [추천업체 B]를 비교해보세요."

- construction_setup (인테리어 단계):
  interiorGuides가 있으면 예산 대비 적합한 컨셉을 추천하세요.
  패턴: "[평수] [업종] 인테리어 평균 비용은 평당 [X-Y]만원입니다. 사장님 예산으로는 [컨셉]이 적합합니다."

- location_candidates (입지 선택 단계):
  업종 벤치마크와 사례를 활용해 입지 선택 조언을 하세요.
  패턴: "사장님과 비슷한 예산으로 [상권]에서 [업종]을 연 창업자 중 [X]%가 [기간] 내 손익분기를 달성했습니다."

개업 전에는 crisisActions 대신 창업 리스크 경고에 집중하세요.

─── 공급업체 코칭 프레임워크 ───

vendorRecommendations가 제공된 경우:
1. 비용 관련 문제(재료비 높음, 프라임코스트 초과)가 있을 때만 공급업체 변경을 추천하세요.
2. 패턴: "현재 재료비 X% → 업계 Y%. [공급업체 유형]을 [추천 방식]으로 전환하면 Z%p 절감 가능"
3. 공급업체 checkItems를 구체적 행동으로 변환하세요.
4. 데이터가 없으면 이 섹션을 완전히 무시하세요.
```

Also **expand the existing "성공 사례 코칭" section** (lines 126-132) with richer patterns:

Replace with:
```
─── 성공 사례 코칭 (핵심 차별점) ───

matchedCaseStudies가 제공된 경우:
1. 사용자 상황과 가장 관련 높은 사례 **1개만** 자연스럽게 인용하세요.
2. todayActions의 reason 또는 insight에 녹여서 제시합니다.
3. **핵심 패턴:** "[회사명]도 사장님과 같은 상황에서 [구체적 행동]으로 [정량적 결과]를 만들었습니다. 사장님도 [구체적 액션]하세요"
4. 반드시 사용자의 현재 숫자와 사례 속 숫자를 비교해서 연결하세요.
5. 사례의 lesson을 사용자가 **오늘** 할 수 있는 구체적 행동으로 변환하세요.
6. **억지로 끼워넣지 마세요.** 상황과 정확히 맞을 때만 인용합니다.
7. 사례가 없으면 이 섹션을 완전히 무시하세요.

예시:
- 매출 하락 + 메뉴 많은 카페: "스타벅스도 2008년 과잉 확장으로 매출 하락 시 기본기를 재정비했습니다. 사장님도 메뉴를 3개로 줄이고 시그니처 음료에 집중하세요."
- 프랜차이즈 매출 평균 이하: "같은 브랜드 상위 매장은 17시 이후 치킨 세트 배달에 집중합니다. 저녁 프로모션을 등록하세요."
- 런웨이 3개월: "테슬라도 2008년 런웨이 2개월 때 전 재산을 투입했습니다. 이번 주 투자자 미팅 3건을 잡으세요."
```

---

## Phase 3: Expand Enrichment Layer

### File: `packages/ai/src/dashboard/enrich-context.ts`

**3A. Expand `enrichDashboardContext` (synchronous) to pass new detection input:**

Update the situation detection call (lines 58-65) to pass the new optional signals:

```typescript
  const situation = detectBusinessSituation({
    runway: base.runway,
    monthlySales: base.monthlySales,
    weeklyChange: base.weeklyChange,
    primeRate: base.primeRate,
    daysSinceLaunch: base.daysSinceLaunch,
    categoryId: base.industryCategoryId,
    // NEW: pass optional enhanced signals
    employeeCount: base.employeeCount,
    rentRatio: base.monthlySales > 0
      ? (base.monthlyCosts.rent / base.monthlySales * 100)
      : undefined,
    daysSinceLastSnsPost: base.daysSinceLastSnsPost,
  });
```

**3B. Add tax event computation to `enrichDashboardContextAsync`** (after line 96):

```typescript
  // NEW: Compute pending tax events from calendar rules
  if (!enriched.computedPendingTaxEvents || enriched.computedPendingTaxEvents.length === 0) {
    enriched.computedPendingTaxEvents = computePendingTaxEvents(base);
  }

  // NEW: Compute upcoming fixed expenses
  if (!enriched.computedUpcomingFixedExpenses || enriched.computedUpcomingFixedExpenses.length === 0) {
    enriched.computedUpcomingFixedExpenses = computeUpcomingFixedExpenses(base);
  }
```

**3C. Add helper functions at bottom of file:**

```typescript
function computePendingTaxEvents(ctx: DashboardContext): string[] {
  const events: string[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // VAT filing deadlines
  if ((month === 1 && day <= 25) || (month === 7 && day <= 25)) {
    events.push(`부가세 확정신고 마감 ${month}/25`);
  }
  // Advance VAT warning (30 days before)
  if (month === 12 || month === 6) {
    const deadline = month === 12 ? "1/25" : "7/25";
    events.push(`부가세 확정신고 준비 필요 (${deadline} 마감)`);
  }
  // Income tax
  if (month === 5 && day <= 31) {
    events.push("종합소득세 신고 마감 5/31");
  }
  if (month === 4) {
    events.push("종합소득세 신고 준비 필요 (5/31 마감)");
  }
  // Withholding tax (monthly, if has employees)
  if (ctx.hasEmployees && day <= 10) {
    events.push(`원천세 납부 마감 ${month}/10`);
  }

  return events;
}

function computeUpcomingFixedExpenses(ctx: DashboardContext): string[] {
  if (ctx.upcomingFixedExpenses && ctx.upcomingFixedExpenses.length > 0) {
    return ctx.upcomingFixedExpenses;
  }
  const expenses: string[] = [];
  const day = new Date().getDate();
  // Derive from known cost data as a fallback
  if (ctx.monthlyCosts.rent > 0 && day >= 25) {
    expenses.push(`임대료 ${Math.round(ctx.monthlyCosts.rent / 10000).toLocaleString()}만원 납부 예정`);
  }
  return expenses;
}
```

---

## Phase 4: Pass More Context from Client

### File: `apps/web/app/lib/useDashboard.ts`

**4A. Replace empty `pendingTaxEvents` (line 599):**

Change from:
```typescript
pendingTaxEvents: [],
```
to:
```typescript
pendingTaxEvents: (() => {
  const events: string[] = [];
  const now = new Date();
  const m = now.getMonth() + 1, d = now.getDate();
  if ((m === 1 && d <= 25) || (m === 7 && d <= 25)) events.push(`부가세 확정신고 마감 ${m}/25`);
  if (m === 5 && d <= 31) events.push("종합소득세 신고 마감 5/31");
  if ((employees as { id: string }[]).length > 0 && d <= 10) events.push(`원천세 납부 마감 ${m}/10`);
  return events;
})(),
```

**4B. Replace empty `upcomingFixedExpenses` (line 601):**

Change from:
```typescript
upcomingFixedExpenses: [],
```
to:
```typescript
upcomingFixedExpenses: (() => {
  const day = new Date().getDate();
  return (fixedExpenses as FixedExpense[])
    .filter(e => {
      const daysUntilDue = e.dueDay >= day ? e.dueDay - day : (30 - day) + e.dueDay;
      return daysUntilDue <= 7;
    })
    .map(e => `${e.name} ${Math.round(e.amount / 10000)}만원 (${e.dueDay}일 납부)`)
    .slice(0, 3);
})(),
```

**4C. Add roadmap stage info to the request body (after line 602):**

```typescript
currentRoadmapStage: currentStage.code,
isPreLaunch: !businessLaunched,
```

---

## Phase 5: Switch API Route to Async Enrichment

### File: `apps/web/app/api/ai/dashboard/actions/route.ts`

**5A. Update import (line 1):**

Change from:
```typescript
import { generateDashboardActions, enrichDashboardContext } from "@build-up/ai";
```
to:
```typescript
import { generateDashboardActions, enrichDashboardContextAsync } from "@build-up/ai";
```

**5B. Switch to async enrichment (line 40):**

Change from:
```typescript
const enrichedCtx = enrichDashboardContext(body);
```
to:
```typescript
const enrichedCtx = await enrichDashboardContextAsync(body);
```

---

## Implementation Sequence

| Order | File | Change Type | Risk | Est. Time |
|-------|------|-------------|------|-----------|
| 1 | `success-case-studies.ts` | Add types + ~25 case studies + expand detection | Low | 2-3 hrs |
| 2 | `prompt.ts` (DashboardContext type) | Add 6 new optional fields | Low | 30 min |
| 3 | `prompt.ts` (system prompt) | Expand coaching frameworks | Low | 1 hr |
| 4 | `prompt.ts` (buildDashboardActionPrompt) | Add 3 new section builders | Low | 45 min |
| 5 | `enrich-context.ts` | Expand async enrichment + add helpers | Medium | 1 hr |
| 6 | `useDashboard.ts` | Pass tax events + fixed expenses + stage | Low | 45 min |
| 7 | `route.ts` | Switch to async enrichment (2 lines) | Low | 10 min |

**Total estimated time: 6-7 hours**

---

## What Does NOT Change

- `DashboardActionsResponse` type -- untouched
- API route structure -- no new endpoints
- `MonthlyCosts` type -- untouched
- Supabase schema -- no new migrations
- Frontend UI components -- same rendering
- `enrichDashboardContext` sync version -- backwards compatible

---

## Validation Checklist

After implementation, verify these scenarios produce intelligent coaching:

1. Pre-launch vendor-setup stage: AI mentions vendor recommendations for user's industry
2. Pre-launch construction-setup stage: AI mentions interior cost estimates
3. Post-launch franchise below average: AI compares to top stores with specific insights
4. Post-launch 3-week revenue decline: AI matches relevant case study (Apple 1997 or Starbucks 2008)
5. Post-launch runway 3 months: AI matches funding-crisis case study (Tesla 2008)
6. Tax deadline approaching: AI warns about specific upcoming tax event
7. Fixed expense due within 7 days: AI mentions the upcoming payment
8. Stable but flat growth 4+ weeks: AI detects marketing-stagnant situation
