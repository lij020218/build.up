import { describe, it, expect } from "vitest";
import {
  crisisThresholdsFor,
  declineDecompositionFrame,
  buildDashboardActionPrompt,
  type DashboardContext,
} from "../../../packages/ai/src/dashboard/prompt";
import { resolveKpiGuidance, INDUSTRY_KPI_GUIDANCE } from "../../../packages/ai/src/industry-kpi-guide";
import { COST_RATIO_THRESHOLDS } from "@foundone/shared";

/**
 * AI 브리핑 업종 오탐 회귀 가드 (2026-07-31 냉정 리뷰 → 2026-08-01 수정).
 *
 *  🔴 원 사고: CRISIS_THR 가 restaurant 임계값을 전 업종에 하드코딩 —
 *   SSOT 가 "건강"(45%)이라 판정한 뷰티샵 인건비가 브리핑에선 "33% 초과 위기"로 주입.
 *   같은 앱의 두 시스템이 같은 가게를 정반대로 판정하는 구조적 거짓말.
 *
 *  실사용자 피드백("브리핑이 원론적·비개인화")의 직접 원인 절반이 여기였다.
 */

function ctxWith(over: Partial<DashboardContext>): DashboardContext {
  return {
    industryCategoryId: "food",
    industryLabel: "외식업",
    storeName: "테스트가게",
    monthlySales: 10_000_000,
    monthlyCosts: { ingredients: 3_000_000, labor: 3_000_000, rent: 1_000_000, utilities: 300_000, other: 200_000 },
    weeklyChange: 0,
    primeRate: 60,
    runway: 12,
    hasEmployees: true,
    employeeCount: 2,
    businessHealthScore: "healthy",
    daysSinceLaunch: 200,
    pendingTaxEvents: [],
    lowStockItems: [],
    upcomingFixedExpenses: [],
    productCount: 5,
    ...over,
  } as DashboardContext;
}

describe("crisisThresholdsFor — 업종별 임계값 (하드코딩 제거)", () => {
  it("🔴 원 사고 재현 방지: 뷰티 인건비 주의선은 55%, 외식 33%가 아니다", () => {
    const beauty = crisisThresholdsFor("beauty-salon");
    expect(beauty.group).toBe("beauty");
    expect(beauty.laborCritical).toBe(COST_RATIO_THRESHOLDS.beauty.labor!.caution); // 55
    expect(beauty.laborCritical).toBeGreaterThan(45); // SSOT healthy(45)보다 위 — 정상 범위가 위기로 안 잡힘
    const food = crisisThresholdsFor("food");
    expect(food.laborCritical).toBe(COST_RATIO_THRESHOLDS.restaurant.labor!.caution); // 33
  });

  it("프라임코스트는 업종에 정의된 경우에만 — SaaS·뷰티는 판정 자체가 없다", () => {
    expect(crisisThresholdsFor("food").primeCostCritical).toBe(65);
    expect(crisisThresholdsFor("cafe-dessert").primeCostCritical).toBe(60); // 카페는 외식과도 다름
    expect(crisisThresholdsFor("startup-tech").primeCostCritical).toBeUndefined();
    expect(crisisThresholdsFor("beauty-salon").primeCostCritical).toBeUndefined();
  });

  it("업종 미상은 보수적 general 폴백 (거짓 판정 최소화)", () => {
    const g = crisisThresholdsFor(undefined);
    expect(g.group).toBe("general");
    expect(g.laborCritical).toBe(COST_RATIO_THRESHOLDS.general.labor!.caution);
  });
});

describe("buildDashboardActionPrompt — 실제 프롬프트에서 오탐이 사라졌는가", () => {
  it("🔴 뷰티샵 인건비 45% (SSOT: 건강) → 위기 신호 없음", () => {
    const prompt = buildDashboardActionPrompt(ctxWith({
      industryCategoryId: "beauty-salon",
      monthlyCosts: { ingredients: 1_000_000, labor: 4_500_000, rent: 1_000_000, utilities: 300_000, other: 200_000 },
    }));
    expect(prompt).not.toContain("인건비 비율 45.0% — 이 업종");   // 위기 신호로 안 잡힘
    expect(prompt).not.toMatch(/인건비.*33%/);                      // 외식 임계값 잔재 없음
  });

  it("같은 45%라도 외식이면 위기 신호가 뜬다 (판정이 죽은 게 아니라 업종화된 것)", () => {
    const prompt = buildDashboardActionPrompt(ctxWith({
      industryCategoryId: "food",
      monthlyCosts: { ingredients: 1_000_000, labor: 4_500_000, rent: 1_000_000, utilities: 300_000, other: 200_000 },
    }));
    expect(prompt).toContain("인건비 비율 45.0% — 이 업종(restaurant) 주의선 33% 초과");
  });

  it("🔴 SaaS 프롬프트에 프라임코스트 위험선이 없다 — '부적합 지표' 명시", () => {
    const prompt = buildDashboardActionPrompt(ctxWith({ industryCategoryId: "startup-tech", primeRate: 80 }));
    expect(prompt).not.toMatch(/프라임코스트.*위험선.*65/);
    expect(prompt).toContain("부적합한 지표");
    // 하락 분해 프레임도 SaaS 축
    expect(prompt).toContain("이탈(churn)");
    expect(prompt).not.toContain("객수 감소인지 객단가 감소인지");
  });

  it("외식은 기존 프레임(객수/객단가) 유지 + 65% 위험선 표기", () => {
    const prompt = buildDashboardActionPrompt(ctxWith({ industryCategoryId: "food" }));
    expect(prompt).toContain("이 업종 위험선: 65%");
    expect(prompt).toContain("객수 감소인지 객단가 감소인지");
  });

  it("업종 지표 가이드가 브리핑 본체에 주입된다 (industry-daily 와 같은 SSOT)", () => {
    const prompt = buildDashboardActionPrompt(ctxWith({ industryCategoryId: "retail" }));
    expect(prompt).toContain("이 업종의 핵심 지표 원칙");
    expect(prompt).toContain(INDUSTRY_KPI_GUIDANCE.retail.slice(0, 30)); // 편의점 객단가 금지 가이드
  });

  it("세부 업종 1순위 — 편의점(convenience-small)은 카테고리(retail)보다 세부 프로파일", () => {
    const prompt = buildDashboardActionPrompt(ctxWith({
      industryCategoryId: "retail",
      industrySubIndustryId: "convenience-small",
    }));
    expect(prompt).toContain("박리다매");   // 편의점 전용 프로파일 문구
  });
});

describe("resolveKpiGuidance — 폴백 사다리", () => {
  it("세부 → 카테고리 → 범용 안전 문구", () => {
    expect(resolveKpiGuidance("retail", "convenience-small")).toContain("박리다매");
    expect(resolveKpiGuidance("retail")).toContain("객수");
    expect(resolveKpiGuidance("없는업종")).toContain("약점으로 지적하지 말 것");
  });
});

describe("declineDecompositionFrame — 업종별 분해 축", () => {
  it("구독·이커머스·회원제·뷰티가 오프라인 프레임을 벗어난다", () => {
    expect(declineDecompositionFrame("saas")).toContain("이탈");
    expect(declineDecompositionFrame("ecommerce")).toContain("전환율");
    expect(declineDecompositionFrame("service")).toContain("재등록");
    expect(declineDecompositionFrame("beauty")).toContain("재방문");
    expect(declineDecompositionFrame("restaurant")).toContain("객단가");
  });
});
