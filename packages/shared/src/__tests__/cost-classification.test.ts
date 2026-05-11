import { describe, expect, it } from "vitest";
import {
  classifyCost,
  groupCostsByClassification,
  COST_CLASSIFICATION_LABELS,
} from "../finance/cost-classification";

describe("classifyCost", () => {
  it("고정비 — rent · labor · utilities · interest", () => {
    expect(classifyCost("rent")).toBe("fixed");
    expect(classifyCost("labor")).toBe("fixed");
    expect(classifyCost("utilities")).toBe("fixed");
    expect(classifyCost("interest")).toBe("fixed");
  });
  it("변동비 — ingredients · marketing · sga", () => {
    expect(classifyCost("ingredients")).toBe("variable");
    expect(classifyCost("marketing")).toBe("variable");
    expect(classifyCost("sga")).toBe("variable");
  });
  it("기타 — other 또는 알 수 없는 키", () => {
    expect(classifyCost("other")).toBe("other");
    expect(classifyCost("unknown-field")).toBe("other");
  });
});

describe("groupCostsByClassification", () => {
  const sampleItems = [
    { fieldKey: "ingredients", label: "식재료비", value: 5_500_000 },
    { fieldKey: "labor",       label: "인건비",   value: 2_000_000 },
    { fieldKey: "rent",        label: "임대료",   value: 1_500_000 },
    { fieldKey: "utilities",   label: "공과금",   value: 450_000 },
    { fieldKey: "marketing",   label: "마케팅",   value: 400_000 },
    { fieldKey: "sga",         label: "운영비",   value: 300_000 },
    { fieldKey: "other",       label: "기타",     value: 300_000 },
    { fieldKey: "interest",    label: "이자",     value: 0 },
  ];

  it("분류별 합계가 올바르게 계산됨", () => {
    const g = groupCostsByClassification(sampleItems);
    // 고정비: rent 1500 + labor 2000 + utilities 450 + interest 0 = 3,950,000
    expect(g.fixed.total).toBe(3_950_000);
    // 변동비: ingredients 5500 + marketing 400 + sga 300 = 6,200,000
    expect(g.variable.total).toBe(6_200_000);
    // 기타: other 300 = 300,000
    expect(g.other.total).toBe(300_000);
    // 총합
    expect(g.grandTotal).toBe(10_450_000);
  });

  it("각 그룹 내 항목이 값 큰 순으로 정렬됨", () => {
    const g = groupCostsByClassification(sampleItems);
    expect(g.fixed.items[0].fieldKey).toBe("labor");       // 2000
    expect(g.fixed.items[1].fieldKey).toBe("rent");        // 1500
    expect(g.variable.items[0].fieldKey).toBe("ingredients"); // 5500
  });

  it("0원 항목도 그룹에 포함 (UI 가 표시 여부 결정)", () => {
    const g = groupCostsByClassification(sampleItems);
    const interest = g.fixed.items.find((i) => i.fieldKey === "interest");
    expect(interest).toBeDefined();
    expect(interest?.value).toBe(0);
  });

  it("빈 배열 → 모든 그룹 총 0", () => {
    const g = groupCostsByClassification([]);
    expect(g.grandTotal).toBe(0);
    expect(g.fixed.total).toBe(0);
  });
});

describe("COST_CLASSIFICATION_LABELS", () => {
  it("3개 분류 모두 ko/en 라벨 존재", () => {
    expect(COST_CLASSIFICATION_LABELS.fixed.ko).toBe("고정비");
    expect(COST_CLASSIFICATION_LABELS.variable.ko).toBe("변동비");
    expect(COST_CLASSIFICATION_LABELS.other.ko).toBe("기타");
  });
});
