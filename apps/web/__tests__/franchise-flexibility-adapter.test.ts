import { describe, expect, it } from "vitest";
import { getSelectedFranchiseFlexibility } from "../app/lib/components/surfaces/franchise-flexibility-adapter";

describe("franchise flexibility adapter", () => {
  const fixtureData = {
    strictBrand: { flexibility: "strict" },
    moderateBrand: { flexibility: "moderate" },
  } as const;

  it("returns flexibility only for franchise construction stages with a selected brand", () => {
    expect(getSelectedFranchiseFlexibility({
      franchiseInteriorData: fixtureData,
      selectedFranchiseBrandId: "strictBrand",
      stageCode: "construction_setup",
      startupType: "franchise",
    })).toBe("strict");

    expect(getSelectedFranchiseFlexibility({
      franchiseInteriorData: fixtureData,
      selectedFranchiseBrandId: "strictBrand",
      stageCode: "construction_setup",
      startupType: "independent",
    })).toBeUndefined();

    expect(getSelectedFranchiseFlexibility({
      franchiseInteriorData: fixtureData,
      selectedFranchiseBrandId: "strictBrand",
      stageCode: "operations_setup",
      startupType: "franchise",
    })).toBeUndefined();

    expect(getSelectedFranchiseFlexibility({
      franchiseInteriorData: fixtureData,
      selectedFranchiseBrandId: null,
      stageCode: "construction_setup",
      startupType: "franchise",
    })).toBeUndefined();
  });
});
