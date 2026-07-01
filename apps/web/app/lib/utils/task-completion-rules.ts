import type { WorkflowDecisionMap } from "@foundone/shared";

const STARTUP_FOUNDATION_STAGE_ID = "startup-foundation";

export function isStartupProblemDefinedComplete(decisions: WorkflowDecisionMap) {
  const inputs = decisions[STARTUP_FOUNDATION_STAGE_ID]?.inputs;
  const statement = inputs?.problemStatement;
  const normalizedStatement = typeof statement === "string" ? statement.trim() : "";

  return inputs?.problemConfirmed === true && normalizedStatement.length >= 10;
}
