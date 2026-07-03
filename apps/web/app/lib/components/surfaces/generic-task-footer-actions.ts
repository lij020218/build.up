import type {
  GenericTaskContinueViewState,
  GenericTaskLaunchViewState,
  GenericTaskSaveViewState,
  SaveStatus,
} from "./generic-task-footer-state";

type ContinueStageHandler = (stageId: string) => void | Promise<void>;
type EditStageHandler = (stageId: string) => void | Promise<void>;
type LaunchBusinessHandler = () => void;
type PersistCurrentStateHandler = () => Promise<void>;
type SetSaveStatusHandler = (status: SaveStatus) => void;
type TimeoutScheduler = (callback: () => void, delay: number) => unknown;

export async function runGenericTaskSaveAction({
  onPersistCurrentState,
  onSetSaveStatus,
  scheduleReset = setTimeout,
  viewState,
}: {
  onPersistCurrentState: PersistCurrentStateHandler;
  onSetSaveStatus: SetSaveStatusHandler;
  scheduleReset?: TimeoutScheduler;
  viewState: GenericTaskSaveViewState;
}) {
  if (viewState.isSaving) {
    return;
  }

  onSetSaveStatus("saving");

  try {
    await onPersistCurrentState();
    onSetSaveStatus("saved");
    scheduleReset(() => onSetSaveStatus("idle"), 2000);
  } catch {
    onSetSaveStatus("error");
    scheduleReset(() => onSetSaveStatus("idle"), 2500);
  }
}

export async function runGenericTaskLaunchAction({
  onContinueStage,
  onLaunchBusiness,
  stageId,
  viewState,
}: {
  onContinueStage: ContinueStageHandler;
  onLaunchBusiness: LaunchBusinessHandler;
  stageId: string;
  viewState: GenericTaskLaunchViewState;
}) {
  if (!viewState.canLaunch) {
    return;
  }

  await onContinueStage(stageId);
  onLaunchBusiness();
}

export function runGenericTaskEditAction({
  onEditStage,
  stageId,
  viewState,
}: {
  onEditStage: EditStageHandler;
  stageId: string;
  viewState: GenericTaskContinueViewState;
}) {
  if (!viewState.canEdit) {
    return;
  }

  void onEditStage(stageId);
}

export function runGenericTaskContinueAction({
  onContinueStage,
  stageId,
  viewState,
}: {
  onContinueStage: ContinueStageHandler;
  stageId: string;
  viewState: GenericTaskContinueViewState;
}) {
  if (!viewState.canContinue) {
    return;
  }

  onContinueStage(stageId);
}
