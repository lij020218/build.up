import { describe, expect, it } from "vitest";
import {
  getCurrentStageBodyKind,
  getCurrentStageViewMode,
} from "../app/lib/components/surfaces/current-stage-view-routing";

describe("current stage view routing", () => {
  it("keeps the launched summary branch ahead of roadmap completion", () => {
    expect(
      getCurrentStageViewMode({
        allStagesDone: true,
        businessLaunched: true,
        viewingStageId: null,
      }),
    ).toBe("launched_summary");
  });

  it("renders roadmap completion when all stages are done and not on launched summary", () => {
    expect(
      getCurrentStageViewMode({
        allStagesDone: true,
        businessLaunched: true,
        viewingStageId: "pre-launch-final",
      }),
    ).toBe("roadmap_complete");
  });

  it("falls through to active stage for normal current-stage rendering", () => {
    expect(
      getCurrentStageViewMode({
        allStagesDone: false,
        businessLaunched: false,
        viewingStageId: null,
      }),
    ).toBe("active_stage");
  });

  it("routes stage body kinds in the intended priority order", () => {
    expect(getCurrentStageBodyKind({ stageCode: "industry_selection", isGuideStage: false })).toBe("selection");
    expect(getCurrentStageBodyKind({ stageCode: "contract_review", isGuideStage: false })).toBe("contract_review");
    expect(getCurrentStageBodyKind({ stageCode: "operations_setup", isGuideStage: false })).toBe("generic_task");
    expect(getCurrentStageBodyKind({ stageCode: "loan_guide", isGuideStage: true })).toBe("guide");
    expect(getCurrentStageBodyKind({ stageCode: "unknown_stage", isGuideStage: false })).toBe("fallback");
  });

  it("keeps generic task stages ahead of a stale guide-stage flag", () => {
    expect(getCurrentStageBodyKind({ stageCode: "operations_setup", isGuideStage: true })).toBe("generic_task");
  });
});
