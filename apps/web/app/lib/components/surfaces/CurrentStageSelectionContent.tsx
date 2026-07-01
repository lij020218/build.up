"use client";

import { BudgetSetupStage } from "../stages/selection/BudgetSetupStage";
import { BusinessModelSelectionStage } from "../stages/selection/BusinessModelSelectionStage";
import { IndustrySelectionStage } from "../stages/selection/IndustrySelectionStage";
import { LocationCandidatesStage } from "../stages/selection/LocationCandidatesStage";
import { StartupTypeSelectionStage } from "../stages/selection/StartupTypeSelectionStage";

const SELECTION_STAGE_COMPONENTS = {
  industry_selection: IndustrySelectionStage,
  startup_type: StartupTypeSelectionStage,
  business_model: BusinessModelSelectionStage,
  budget_setup: BudgetSetupStage,
  location_candidates: LocationCandidatesStage,
} as const;

type SelectionStageCode = keyof typeof SELECTION_STAGE_COMPONENTS;

export function isCurrentStageSelectionCode(stageCode: string): stageCode is SelectionStageCode {
  return Object.prototype.hasOwnProperty.call(SELECTION_STAGE_COMPONENTS, stageCode);
}

export function CurrentStageSelectionContent({ stageCode }: { stageCode: string }) {
  if (!isCurrentStageSelectionCode(stageCode)) {
    return null;
  }

  const StageComponent = SELECTION_STAGE_COMPONENTS[stageCode];
  return <StageComponent />;
}
