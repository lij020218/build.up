export const CURRENT_STAGE_SELECTION_CODES = [
  "industry_selection",
  "startup_type",
  "business_model",
  "budget_setup",
  "location_candidates",
] as const;

export type CurrentStageSelectionCode = (typeof CURRENT_STAGE_SELECTION_CODES)[number];

const CURRENT_STAGE_SELECTION_CODE_SET = new Set<string>(CURRENT_STAGE_SELECTION_CODES);

export function isCurrentStageSelectionCode(stageCode: string): stageCode is CurrentStageSelectionCode {
  return CURRENT_STAGE_SELECTION_CODE_SET.has(stageCode);
}
