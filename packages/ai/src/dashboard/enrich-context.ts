/* ─────────────────────────────────────────────
 *  enrich-context.ts
 *  DashboardContext에 프랜차이즈 벤치마크 + 성공 사례 + 업종 벤치마크를 주입
 * ───────────────────────────────────────────── */

import type { DashboardContext } from "./prompt";

// shared 패키지에서 데이터 모듈 import
// 빌드 시 @build-up/shared로 resolve됨
import {
  getFranchiseBenchmark,
  getIndustryBenchmark,
  detectBusinessSituation,
  matchCaseStudies,
} from "@build-up/shared";

// franchise-data.ts에서 브랜드 조회용
let _getFranchiseBrandById: ((id: string) => { name: { ko: string } } | undefined) | null = null;

async function loadFranchiseBrandFn() {
  if (_getFranchiseBrandById) return _getFranchiseBrandById;
  try {
    const mod = await import("@build-up/shared");
    _getFranchiseBrandById = (mod as Record<string, unknown>).getFranchiseBrandById as typeof _getFranchiseBrandById ?? null;
  } catch {
    _getFranchiseBrandById = null;
  }
  return _getFranchiseBrandById;
}

export function enrichDashboardContext(base: DashboardContext): DashboardContext {
  const enriched = { ...base };

  // 1. 프랜차이즈 벤치마크 주입
  if (base.franchiseBrandId) {
    const benchmark = getFranchiseBenchmark(base.franchiseBrandId);
    if (benchmark) {
      enriched.franchiseBrandName = enriched.franchiseBrandName ?? base.franchiseBrandId;
      enriched.franchiseAvgRevenue = benchmark.avgMonthlyRevenue;
      enriched.franchiseTopRevenue = benchmark.topStoreMonthlyRevenue;
      enriched.franchiseCostStructure = {
        ingredientRatio: benchmark.costStructure.ingredientRatio,
        laborRatio: benchmark.costStructure.laborRatio,
        rentRatio: benchmark.costStructure.rentRatio,
      };
      enriched.franchiseTopStoreInsights = benchmark.operationalInsights;
    }
  }

  // 2. 업종 벤치마크 주입
  const industryBench = getIndustryBenchmark(base.industryCategoryId);
  if (industryBench && industryBench.avgAnnualRevenue > 0) {
    enriched.industryAvgRevenue = Math.round(industryBench.avgAnnualRevenue / 12);
    enriched.industryTopRevenue = Math.round(industryBench.top10PctRevenue / 12);
  }

  // 3. 상황 감지 + 성공 사례 매칭 (확장 시그널 포함)
  const rentRatio = base.monthlySales > 0
    ? (base.monthlyCosts.rent / base.monthlySales * 100)
    : undefined;

  const situation = detectBusinessSituation({
    runway: base.runway,
    monthlySales: base.monthlySales,
    weeklyChange: base.weeklyChange,
    primeRate: base.primeRate,
    daysSinceLaunch: base.daysSinceLaunch,
    categoryId: base.industryCategoryId,
    // 확장 시그널
    rentRatio,
    employeeCount: base.employeeCount,
    daysSinceLastSnsPost: base.daysSinceLastSnsPost,
  });

  if (situation) {
    const cases = matchCaseStudies(situation, base.industryCategoryId);
    if (cases.length > 0) {
      enriched.matchedCaseStudies = cases.slice(0, 3).map(c => ({
        company: c.company,
        oneLiner: c.oneLiner,
        lesson: c.lesson,
      }));
    }
  }

  // 4. 세금 캘린더 계산 (7일 내 마감 이벤트)
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const taxEvents: string[] = [];

  // 부가세 확정신고: 1/25, 7/25
  if (month === 1 && day <= 25) taxEvents.push("부가세 확정신고 1/25");
  if (month === 7 && day <= 25) taxEvents.push("부가세 확정신고 7/25");
  // 부가세 예정신고: 4/25, 10/25
  if (month === 4 && day <= 25) taxEvents.push("부가세 예정신고 4/25");
  if (month === 10 && day <= 25) taxEvents.push("부가세 예정신고 10/25");
  // 종합소득세: 5/31
  if (month === 5 && day <= 31) taxEvents.push("종합소득세 신고 5/31");
  // 원천세: 매월 10일 (직원 있는 경우)
  if (base.hasEmployees && day <= 10) taxEvents.push(`원천세 납부 ${month}/10`);

  if (taxEvents.length > 0) {
    enriched.computedTaxEvents = taxEvents;
  }

  return enriched;
}

/** 비동기 버전 — 프랜차이즈 브랜드 이름을 franchise-data.ts에서 조회 */
export async function enrichDashboardContextAsync(base: DashboardContext): Promise<DashboardContext> {
  const enriched = enrichDashboardContext(base);

  // 브랜드 이름 보정 (동기 버전에서 fallback ID만 넣었으므로)
  if (base.franchiseBrandId && !base.franchiseBrandName) {
    const getFn = await loadFranchiseBrandFn();
    if (getFn) {
      const brand = getFn(base.franchiseBrandId);
      if (brand) {
        enriched.franchiseBrandName = brand.name.ko;
      }
    }
  }

  return enriched;
}
