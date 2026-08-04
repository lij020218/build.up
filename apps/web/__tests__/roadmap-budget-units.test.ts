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
