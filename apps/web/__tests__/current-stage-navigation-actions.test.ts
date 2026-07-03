import { describe, expect, it, vi } from "vitest";
import {
  getCurrentStageBackTarget,
  runCurrentStageBackAction,
} from "../app/lib/components/surfaces/current-stage-navigation-actions";

describe("current stage navigation actions", () => {
  it("uses the previous traversed stage as the back target", () => {
    expect(getCurrentStageBackTarget({ stageId: "operations-setup" })).toBe("operations-setup");
  });

  it("falls back to the active roadmap stage when there is no previous traversed stage", () => {
    expect(getCurrentStageBackTarget(null)).toBeNull();
  });

  it("sets the viewing stage to the resolved back target", () => {
    const setViewingStageId = vi.fn();

    runCurrentStageBackAction({
      previousStage: { stageId: "contract-review" },
      setViewingStageId,
    });
    runCurrentStageBackAction({
      previousStage: null,
      setViewingStageId,
    });

    expect(setViewingStageId).toHaveBeenNthCalledWith(1, "contract-review");
    expect(setViewingStageId).toHaveBeenNthCalledWith(2, null);
  });
});
