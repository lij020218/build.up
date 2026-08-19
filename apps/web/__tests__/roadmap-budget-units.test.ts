/**
 * AI 로드맵 예산 단위 정규화 가드 (2026-08-03 실사고 회귀 방지).
 *   증상: 자본금 1억 설정 → 모델이 budgetAllocation 을 원 단위(100,000,000)로 반환 →
 *   화면(만원 단위 가정)이 "10000억원" 표시. parseResponse 가 원 단위 오염을 감지해
 *   만원으로 정규화해야 한다. monthlyCosts 도 동일 가드.
 */
import { describe, it, expect } from "vitest";
import { parseResponse } from "@foundone/ai/roadmap/generate";

/** 필수 필드 최소 골격 — parseResponse 는 parsed 필수. 테스트 관심사는 budgetAllocation·monthlyCosts 뿐 */
function rawWith(ba: Record<string, number>, mc: Record<string, number> = {}): string {
  return JSON.stringify({
    parsed: { industryCategoryId: "food", subIndustryId: "korean-casual", industryLabel: "한식당" },
    budgetAllocation: ba,
    monthlyCosts: { ingredients: 0, labor: 0, rent: 0, utilities: 0, other: 0, ...mc },
  });
}

describe("roadmap budgetAllocation 단위 정규화", () => {
  it("원 단위 오염(1억=100,000,000)을 만원으로 정규화 — '10000억원' 재발 방지", () => {
    const r = parseResponse(rawWith({
      deposit: 40_000_000, interior: 30_000_000, equipment: 20_000_000,
      workingCapital: 10_000_000, total: 100_000_000,
    }));
    expect(r.budgetAllocation.total).toBe(10_000);      // 1억 = 10,000만원
    expect(r.budgetAllocation.deposit).toBe(4_000);
    expect(r.budgetAllocation.workingCapital).toBe(1_000);
  });

  it("정상 만원 단위 입력은 그대로 통과", () => {
    const r = parseResponse(rawWith({
      deposit: 4_000, interior: 3_000, equipment: 2_000, workingCapital: 1_000, total: 10_000,
    }));
    expect(r.budgetAllocation.total).toBe(10_000);
    expect(r.budgetAllocation.deposit).toBe(4_000);
  });

  it("monthlyCosts 원 단위 오염도 정규화 (월세 200만원 = 2,000,000원 케이스)", () => {
    const r = parseResponse(rawWith(
      { deposit: 4_000, interior: 3_000, equipment: 2_000, workingCapital: 1_000, total: 10_000 },
      { ingredients: 3_000_000, labor: 2_500_000, rent: 2_000_000, utilities: 300_000, other: 200_000 },
    ));
    expect(r.monthlyCosts.rent).toBe(200);
    expect(r.monthlyCosts.labor).toBe(250);
  });

  it("음수 가드 유지 — 음수는 0으로 clamp 후 합계 재계산", () => {
    const r = parseResponse(rawWith({
      deposit: 4_000, interior: 3_000, equipment: 2_000, workingCapital: -9_000, total: 0,
    }));
    expect(r.budgetAllocation.workingCapital).toBe(0);
    expect(r.budgetAllocation.total).toBe(9_000);
  });
});

/**
 * iOS 디코딩 계약 (2026-08-19 실사고): iOS 1.0.0(4) AIRoadmapResult.BudgetAllocation.monthlyFixedCost 가
 * non-optional 인데 서버가 안 보내 → 앱 "데이터 파싱 오류"로 AI 로드맵 생성 전멸.
 * 서버 파생 필드로 항상 포함해야 하며, 출시된 빌드가 있는 한 제거 금지.
 */
describe("roadmap budgetAllocation.monthlyFixedCost — iOS 디코딩 계약", () => {
  it("monthlyCosts 의 재료비 제외 합(labor+rent+utilities+other)으로 항상 존재", () => {
    const r = parseResponse(rawWith(
      { deposit: 1500, interior: 1400, equipment: 1300, workingCapital: 800, total: 5000 },
      { ingredients: 180, labor: 250, rent: 180, utilities: 35, other: 70 },
    ));
    expect(r.budgetAllocation.monthlyFixedCost).toBe(250 + 180 + 35 + 70);
  });
  it("monthlyCosts 가 통째로 없어도 0 으로 존재(키 누락 금지)", () => {
    const r = parseResponse(JSON.stringify({
      parsed: { industryCategoryId: "food", subIndustryId: "korean-casual", industryLabel: "한식당" },
      budgetAllocation: { deposit: 1, interior: 1, equipment: 1, workingCapital: 1, total: 4 },
    }));
    expect(r.budgetAllocation).toHaveProperty("monthlyFixedCost", 0);
  });
});

/**
 * iOS 디코딩 계약 #2 (2026-08-19 prod 실측): Timeline.Phase.tasks:[String] non-optional 인데
 * 서버 스키마엔 tasks 가 없어 LLM 이 phases 를 채우면 keyNotFound. 서버가 항상 [] 이상 보장.
 */
describe("roadmap timeline.phases — iOS 디코딩 계약", () => {
  it("phases 각 항목에 name·weeks(정수)·tasks(배열) 항상 존재", () => {
    const r = parseResponse(JSON.stringify({
      parsed: { industryCategoryId: "food", subIndustryId: "korean-casual", industryLabel: "한식당" },
      timeline: { totalWeeks: 15.6, phases: [{ name: "입지", weeks: 2.4 }, { name: "인테리어", weeks: 5, tasks: ["견적", 3] }] },
    }));
    expect(r.timeline.totalWeeks).toBe(16);
    expect(r.timeline.phases).toEqual([
      { name: "입지", weeks: 2, tasks: [] },
      { name: "인테리어", weeks: 5, tasks: ["견적", "3"] },
    ]);
  });
  it("정수 계약: budgetAllocation·monthlyCosts·matchingConfidence 는 소수 입력에도 정수", () => {
    const r = parseResponse(JSON.stringify({
      parsed: { industryCategoryId: "food", subIndustryId: "korean-casual", industryLabel: "한식당", matchingConfidence: 87.5 },
      budgetAllocation: { deposit: 1500.4, interior: 1400, equipment: 1300, workingCapital: 800, total: 5000 },
      monthlyCosts: { ingredients: 180.2, labor: 0, rent: 180, utilities: 35.5, other: 70 },
    }));
    expect(Number.isInteger(r.parsed.matchingConfidence)).toBe(true);
    for (const v of Object.values(r.budgetAllocation)) expect(Number.isInteger(v)).toBe(true);
    for (const v of Object.values(r.monthlyCosts)) expect(Number.isInteger(v)).toBe(true);
  });
});
