import { describe, expect, it } from "vitest";
import { getCurrentStageDefaultSectionKind } from "../app/lib/components/surfaces/current-stage-default-section-state";

describe("current stage default section state", () => {
  it("shows the launch CTA when pre-launch final is complete before launch", () => {
    expect(
      getCurrentStageDefaultSectionKind({
        businessLaunched: false,
        completedStageIds: ["industry-selection", "pre-launch-final"],
      }),
    ).toBe("launch_cta");
  });

  it("shows launched analytics after launch even if pre-launch final was completed", () => {
    expect(
      getCurrentStageDefaultSectionKind({
        businessLaunched: true,
        completedStageIds: ["pre-launch-final"],
      }),
    ).toBe("launched_analytics");
  });

  it("shows starter summary for unfinished default fallback stages", () => {
    expect(
      getCurrentStageDefaultSectionKind({
        businessLaunched: false,
        completedStageIds: ["industry-selection"],
      }),
    ).toBe("starter_summary");
  });
});
