import { describe, expect, it } from "vitest";
import {
  getConstructionTaskHint,
  getConstructionTaskTitleOverride,
  shouldUseStrictFranchiseConstructionCopy,
} from "../app/lib/components/surfaces/construction-task-copy";

describe("construction task copy", () => {
  it("overrides construction task titles only for strict franchises", () => {
    expect(getConstructionTaskTitleOverride("contractor-selected", "ko", true)).toBe(
      "본사 가맹 담당자에게 시공 일정·비용 분담 협의 완료",
    );
    expect(getConstructionTaskTitleOverride("construction-complete", "en", true)).toBe(
      "HQ-mandated contractor finishes + HQ inspection / BI audit passes",
    );
    expect(getConstructionTaskTitleOverride("contractor-selected", "ko", false)).toBeNull();
  });

  it("returns strict franchise construction hints", () => {
    expect(getConstructionTaskHint("contractor-selected", "ko", true)).toBe(
      "외부 업체 견적·시공이 불가능합니다. 본사 가맹 담당자가 표준 시공 일정과 비용 분담(본사 부담 vs 점주 부담)을 안내해 줍니다.",
    );
    expect(getConstructionTaskHint("fire-health-parallel", "en", true)).toContain(
      "HQ provides the fire/health manual",
    );
  });

  it("returns regular construction hints when the franchise is not strict", () => {
    expect(getConstructionTaskHint("contractor-selected", "en", false)).toBe(
      "Share the material list and chosen concept above for more accurate quotes.",
    );
    expect(getConstructionTaskHint("fire-health-parallel", "ko", false)).toBeNull();
  });

  it("returns null for unknown construction task ids", () => {
    expect(getConstructionTaskTitleOverride("unknown-task", "ko", true)).toBeNull();
    expect(getConstructionTaskHint("unknown-task", "en", false)).toBeNull();
  });

  it("uses strict franchise copy only for selected strict construction franchises", () => {
    expect(shouldUseStrictFranchiseConstructionCopy({
      stageCode: "construction_setup",
      startupType: "franchise",
      selectedFranchiseBrandId: "brand-a",
      franchiseFlexibility: "strict",
    })).toBe(true);
    expect(shouldUseStrictFranchiseConstructionCopy({
      stageCode: "vendor_setup",
      startupType: "franchise",
      selectedFranchiseBrandId: "brand-a",
      franchiseFlexibility: "strict",
    })).toBe(false);
    expect(shouldUseStrictFranchiseConstructionCopy({
      stageCode: "construction_setup",
      startupType: "independent",
      selectedFranchiseBrandId: "brand-a",
      franchiseFlexibility: "strict",
    })).toBe(false);
    expect(shouldUseStrictFranchiseConstructionCopy({
      stageCode: "construction_setup",
      startupType: "franchise",
      selectedFranchiseBrandId: null,
      franchiseFlexibility: "strict",
    })).toBe(false);
    expect(shouldUseStrictFranchiseConstructionCopy({
      stageCode: "construction_setup",
      startupType: "franchise",
      selectedFranchiseBrandId: "brand-a",
      franchiseFlexibility: "moderate",
    })).toBe(false);
  });
});
