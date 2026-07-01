import { describe, expect, it } from "vitest";
import type { WorkflowDecisionMap } from "@foundone/shared";
import { isStartupProblemDefinedComplete } from "../app/lib/utils/task-completion-rules";
import {
  evaluateTaskChecklistGate,
  getPreLaunchTaskHint,
} from "../app/lib/components/surfaces/task-checklist-gates";

function decisionsWithProblemStatement(
  problemStatement: unknown,
  problemConfirmed = false,
): WorkflowDecisionMap {
  return {
    "startup-foundation": {
      stageId: "startup-foundation",
      inputs: { problemStatement, problemConfirmed },
    },
  };
}

describe("task checklist gates", () => {
  it("blocks problem-defined until the problem statement has at least 10 trimmed characters and is confirmed", () => {
    const emptyGate = evaluateTaskChecklistGate("problem-defined", decisionsWithProblemStatement("   ", true));
    const shortGate = evaluateTaskChecklistGate("problem-defined", decisionsWithProblemStatement("123456789", true));
    const unconfirmedGate = evaluateTaskChecklistGate("problem-defined", decisionsWithProblemStatement("1234567890", false));

    expect(emptyGate.blocked).toBe(true);
    expect(shortGate.blocked).toBe(true);
    expect(unconfirmedGate.blocked).toBe(true);
    expect(shortGate.blocked ? shortGate.hint.ko : "").toContain("확인 버튼");
  });

  it("allows problem-defined once the problem statement is long enough and confirmed", () => {
    const decisions = decisionsWithProblemStatement("1234567890", true);

    expect(isStartupProblemDefinedComplete(decisions)).toBe(true);
    expect(
      evaluateTaskChecklistGate("problem-defined", decisions),
    ).toEqual({ blocked: false });
  });

  it("does not gate unrelated task ids", () => {
    expect(evaluateTaskChecklistGate("founder-alignment", {})).toEqual({ blocked: false });
  });

  it("returns pre-launch manual completion hints only for undone pre-launch tasks", () => {
    expect(getPreLaunchTaskHint("ko", true, false)).toBe(
      "위 페이지의 체크리스트를 다 채우면 자동 완료, 또는 여기 직접 체크",
    );
    expect(getPreLaunchTaskHint("en", true, false)).toContain("Auto-completes");
    expect(getPreLaunchTaskHint("ko", true, true)).toBeNull();
    expect(getPreLaunchTaskHint("ko", false, false)).toBeNull();
  });
});
