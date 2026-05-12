import { describe, expect, it } from "vitest";
import { starterStageFlow, traverseUserPath } from "../index";
import type { WorkflowDecisionMap } from "../types/roadmap";

/**
 * 2026-05-12 P3 — 사용자 path 의 *실제 navigation 순서* 검증.
 *
 * 사장님 신고: "이 단계가 더 늦게 왔어야 되는 거 아닌가?" 라고 느끼면 안 됨.
 *   → 임대차계약 직후 사업자등록·통장·세무·자금 결정 → 인테리어 발주 순서.
 *
 * 이 테스트는:
 *   1. 각 path 의 실제 navigation 순서가 기대 순서와 일치하는지
 *   2. registration-setup → biz-registration → tax → loan 순서가 인테리어 *전*인지
 *   3. starter-tech 도 기존 흐름 유지하는지
 *   를 검증.
 */

function pathOrder(categoryId: string): string[] {
  const decisions: WorkflowDecisionMap = {
    "industry-selection": {
      stageId: "industry-selection",
      inputs: { categoryId },
    },
  };
  const path = traverseUserPath(starterStageFlow, decisions, () => true);
  return path.map((s) => s.stageId);
}

describe("traverseUserPath — path order matches real-world sequence", () => {
  it("offline (food): 임대차 → 사업자등록 → 통장·세무사 → 세무 → 자금 → 인테리어 순서", () => {
    const order = pathOrder("food");

    const idx = (id: string) => order.indexOf(id);

    // 핵심 검증: registration-setup → biz-registration → tax-guide → loan-guide → construction-setup
    expect(idx("contract-review")).toBeLessThan(idx("registration-setup"));
    expect(idx("registration-setup")).toBeLessThan(idx("biz-registration"));
    expect(idx("biz-registration")).toBeLessThan(idx("tax-guide"));
    expect(idx("tax-guide")).toBeLessThan(idx("loan-guide"));
    expect(idx("loan-guide")).toBeLessThan(idx("construction-setup"));
    expect(idx("construction-setup")).toBeLessThan(idx("vendor-setup"));
    expect(idx("vendor-setup")).toBeLessThan(idx("hiring-setup"));
    expect(idx("hiring-setup")).toBeLessThan(idx("insurance-tax-setup"));
    expect(idx("insurance-tax-setup")).toBeLessThan(idx("operations-setup"));
    expect(idx("operations-setup")).toBeLessThan(idx("pre-launch"));
    expect(idx("pre-launch")).toBeLessThan(idx("financial-review"));
    expect(idx("financial-review")).toBeLessThan(idx("pre-launch-final"));
  });

  it("offline (cafe): 동일한 reorder 흐름 적용됨", () => {
    const order = pathOrder("cafe-dessert");
    const idx = (id: string) => order.indexOf(id);
    expect(idx("registration-setup")).toBeLessThan(idx("construction-setup"));
    expect(idx("biz-registration")).toBeLessThan(idx("construction-setup"));
    expect(idx("loan-guide")).toBeLessThan(idx("construction-setup"));
  });

  it("offline (beauty·pet·fitness 등): 모두 동일 흐름", () => {
    for (const cat of ["retail", "beauty", "fitness", "education", "pet", "living-service", "space"]) {
      const order = pathOrder(cat);
      const idx = (id: string) => order.indexOf(id);
      expect(idx("registration-setup"), `${cat}: registration-setup`).toBeLessThan(idx("construction-setup"));
      expect(idx("biz-registration"), `${cat}: biz-registration`).toBeLessThan(idx("construction-setup"));
      expect(idx("loan-guide"), `${cat}: loan-guide`).toBeLessThan(idx("construction-setup"));
    }
  });

  it("online-digital: 사업자등록 → 통장 → 세무 → 자금 → 재고 → 스토어 → 마케팅", () => {
    const order = pathOrder("online-digital");
    const idx = (id: string) => order.indexOf(id);

    expect(idx("platform-setup")).toBeLessThan(idx("online-registration"));
    expect(idx("online-registration")).toBeLessThan(idx("biz-registration"));
    expect(idx("biz-registration")).toBeLessThan(idx("tax-guide"));
    expect(idx("tax-guide")).toBeLessThan(idx("loan-guide"));
    expect(idx("loan-guide")).toBeLessThan(idx("sourcing-setup"));
    expect(idx("sourcing-setup")).toBeLessThan(idx("store-setup"));
    expect(idx("store-setup")).toBeLessThan(idx("online-marketing"));
    expect(idx("online-marketing")).toBeLessThan(idx("financial-review"));
    expect(idx("financial-review")).toBeLessThan(idx("pre-launch-final"));
  });

  it("startup-tech: company-setup 후 mvp → launch → tax → loan → biz-registration (후반)", () => {
    const order = pathOrder("startup-tech");
    const idx = (id: string) => order.indexOf(id);

    // Startup 은 company-setup 에서 사업자등록 처리 + 후반 finalization 으로 biz-registration
    expect(idx("startup-foundation")).toBeLessThan(idx("customer-discovery"));
    expect(idx("customer-discovery")).toBeLessThan(idx("company-setup"));
    expect(idx("company-setup")).toBeLessThan(idx("mvp-build"));
    expect(idx("mvp-build")).toBeLessThan(idx("launch-gtm"));

    // Startup 은 tax/loan/biz-registration 이 venture-certification 후 (default route).
    expect(idx("venture-certification")).toBeLessThan(idx("tax-guide"));
    expect(idx("tax-guide")).toBeLessThan(idx("loan-guide"));
    expect(idx("loan-guide")).toBeLessThan(idx("biz-registration"));
    expect(idx("biz-registration")).toBeLessThan(idx("financial-review"));
  });

  it("새 path 가 사이클 없음 + 모든 stage 가 reachable (legacy 사용자 path 길이)", () => {
    const foodOrder = pathOrder("food");
    const onlineOrder = pathOrder("online-digital");
    const startupOrder = pathOrder("startup-tech");

    // 같은 stage 가 두 번 등장하면 cycle — 차단됨
    expect(new Set(foodOrder).size).toBe(foodOrder.length);
    expect(new Set(onlineOrder).size).toBe(onlineOrder.length);
    expect(new Set(startupOrder).size).toBe(startupOrder.length);

    // 새 offline path 는 19 stage 흐름
    // (industry, startup-type, business-model, budget, permit-check, location, contract,
    //  registration, biz-registration, tax, loan, construction, vendor, hiring, insurance-tax,
    //  operations, pre-launch, financial-review, pre-launch-final)
    expect(foodOrder.length).toBe(19);

    // online path: 14 stage 흐름
    expect(onlineOrder.length).toBe(14);
  });
});
