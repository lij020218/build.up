import { describe, expect, it } from "vitest";
import { starterStageFlow, traverseUserPath } from "../index";
import type { WorkflowDecisionMap } from "../types/roadmap";

/**
 * 2026-05-12 P3 — 사용자 path 의 *실제 navigation 순서* 검증.
 * 2026-06-09 정정 — 자료조사 기반 실제 창업 순서로 교정.
 *
 * 대한민국 실제 오프라인 창업 순서(헬프미·찾기쉬운생활법령 등 확인):
 *   임대차계약 → **인테리어/공사** → 영업신고(보건소) → 사업자등록(세무서) → 세무·자금 → 발주·채용 …
 *   즉 인테리어(construction-setup)가 사업자등록(registration-setup) *앞*에 온다.
 *   (이전 버전은 사업자등록을 인테리어 앞에 두는 잘못된 순서를 단언 → 본 테스트가 그걸 못 잡았던 stale 테스트였음.)
 *
 * 이 테스트는:
 *   1. 각 path 의 실제 navigation 순서가 교정된 실제 순서와 일치하는지
 *   2. construction-setup(인테리어) 가 registration-setup(사업자등록) *앞*인지
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
  it("offline (food): 임대차 → 인테리어 → 사업자등록 → 세무 → 자금 → 메뉴 → 발주 순서", () => {
    const order = pathOrder("food");

    const idx = (id: string) => order.indexOf(id);

    // 핵심 검증(실제 순서): contract-review → construction-setup(인테리어) → registration-setup → biz-registration → tax → loan → menu → vendor …
    expect(idx("contract-review")).toBeLessThan(idx("construction-setup"));
    expect(idx("construction-setup")).toBeLessThan(idx("registration-setup"));
    expect(idx("registration-setup")).toBeLessThan(idx("biz-registration"));
    expect(idx("biz-registration")).toBeLessThan(idx("tax-guide"));
    expect(idx("tax-guide")).toBeLessThan(idx("loan-guide"));
    expect(idx("loan-guide")).toBeLessThan(idx("menu-design"));
    expect(idx("menu-design")).toBeLessThan(idx("vendor-setup"));
    expect(idx("vendor-setup")).toBeLessThan(idx("hiring-setup"));
    expect(idx("hiring-setup")).toBeLessThan(idx("insurance-tax-setup"));
    expect(idx("insurance-tax-setup")).toBeLessThan(idx("operations-setup"));
    expect(idx("operations-setup")).toBeLessThan(idx("pre-launch"));
    expect(idx("pre-launch")).toBeLessThan(idx("financial-review"));
    expect(idx("financial-review")).toBeLessThan(idx("pre-launch-final"));
  });

  it("offline (cafe): 인테리어가 사업자등록 *앞* (실제 순서)", () => {
    const order = pathOrder("cafe-dessert");
    const idx = (id: string) => order.indexOf(id);
    expect(idx("construction-setup")).toBeLessThan(idx("registration-setup"));
    expect(idx("construction-setup")).toBeLessThan(idx("biz-registration"));
    expect(idx("construction-setup")).toBeLessThan(idx("loan-guide"));
  });

  it("offline (beauty·pet·fitness 등): 모두 인테리어 우선 흐름", () => {
    for (const cat of ["retail", "beauty", "fitness", "education", "pet", "living-service", "space"]) {
      const order = pathOrder(cat);
      const idx = (id: string) => order.indexOf(id);
      expect(idx("construction-setup"), `${cat}: construction-setup`).toBeLessThan(idx("registration-setup"));
      expect(idx("construction-setup"), `${cat}: construction<biz`).toBeLessThan(idx("biz-registration"));
      expect(idx("construction-setup"), `${cat}: construction<loan`).toBeLessThan(idx("loan-guide"));
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

    // offline path 는 최소 19 stage 흐름 (이후 stage 추가 가능 — 순서는 위 idx 단언이 가드).
    // (industry, startup-type, business-model, budget, permit-check, location, contract,
    //  registration, biz-registration, tax, loan, construction, vendor, hiring, insurance-tax,
    //  operations, pre-launch, financial-review, pre-launch-final, …)
    // ⚠️ 정확값(toBe) 가드는 stage 추가 시마다 CI 를 빨갛게 만들어 자동배포 신뢰 저하 → 하한선으로.
    expect(foodOrder.length).toBeGreaterThanOrEqual(19);

    // online path: 최소 14 stage 흐름
    expect(onlineOrder.length).toBeGreaterThanOrEqual(14);
  });
});
