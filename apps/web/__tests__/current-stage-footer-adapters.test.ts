import type { WorkflowDecisionMap } from "@foundone/shared";
import { describe, expect, it, vi } from "vitest";
import {
  getContractReviewFooterAdapterProps,
  getGenericTaskFooterAdapterProps,
} from "../app/lib/components/surfaces/current-stage-footer-adapters";

describe("current stage footer adapters", () => {
  it("wires generic task footer actions and edit state from the viewed stage", () => {
    const decisions: WorkflowDecisionMap = {
      "operations-setup": {
        stageId: "operations-setup",
        completedAt: "2026-07-01T00:00:00.000Z",
      },
    };
    const onContinueStage = vi.fn();
    const onEditStage = vi.fn();

    const props = getGenericTaskFooterAdapterProps({
      decisions,
      editSaveStatus: { stageId: "operations-setup", status: "saving" },
      isViewingPastStage: true,
      onContinueStage,
      onEditStage,
      stageId: "operations-setup",
    });

    expect(props.editStatus).toBe("saving");
    expect(props.isStageCompleted).toBe(true);
    expect(props.onContinueStage).toBe(onContinueStage);
    expect(props.onEditStage).toBe(onEditStage);
  });

  it("does not leak generic edit status or completion across stages", () => {
    const decisions: WorkflowDecisionMap = {
      "operations-setup": {
        stageId: "operations-setup",
        completedAt: "2026-07-01T00:00:00.000Z",
      },
    };

    const props = getGenericTaskFooterAdapterProps({
      decisions,
      editSaveStatus: { stageId: "operations-setup", status: "saved" },
      isViewingPastStage: true,
      onContinueStage: vi.fn(),
      onEditStage: vi.fn(),
      stageId: "vendor-setup",
    });

    expect(props.editStatus).toBeNull();
    expect(props.isStageCompleted).toBe(false);
  });

  it("wires contract review continue and scoped edit actions", () => {
    const decisions: WorkflowDecisionMap = {
      "contract-review": {
        stageId: "contract-review",
        completedAt: "2026-07-01T00:00:00.000Z",
      },
    };
    const onContinue = vi.fn();
    const onEditStage = vi.fn();

    const props = getContractReviewFooterAdapterProps({
      decisions,
      editSaveStatus: { stageId: "contract-review", status: "error" },
      isViewingPastStage: true,
      onContinue,
      onEditStage,
    });

    expect(props.editStatus).toBe("error");
    expect(props.isStageCompleted).toBe(true);
    expect(props.onContinue).toBe(onContinue);

    props.onEdit();

    expect(onEditStage).toHaveBeenCalledTimes(1);
    expect(onEditStage).toHaveBeenCalledWith("contract-review");
  });
});
