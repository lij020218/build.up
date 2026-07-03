type PreviousStage = {
  stageId: string;
} | null;

type SetViewingStageHandler = (stageId: string | null) => void;

export function getCurrentStageBackTarget(previousStage: PreviousStage) {
  return previousStage?.stageId ?? null;
}

export function runCurrentStageBackAction({
  previousStage,
  setViewingStageId,
}: {
  previousStage: PreviousStage;
  setViewingStageId: SetViewingStageHandler;
}) {
  setViewingStageId(getCurrentStageBackTarget(previousStage));
}
