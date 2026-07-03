import type { WorkflowDecisionMap } from "@foundone/shared";
import {
  getScopedEditSaveStatus,
  shouldShowGenericTaskEditButton,
  type EditSaveStatus,
  type ScopedEditSaveStatus,
} from "./generic-task-footer-state";

type ContinueStageHandler = (stageId: string) => void;
type EditStageHandler = (stageId: string) => void | Promise<void>;
type ContinueHandler = () => void;
type EditHandler = () => void | Promise<void>;

type GenericTaskFooterAdapterInput = {
  decisions: WorkflowDecisionMap;
  editSaveStatus: ScopedEditSaveStatus;
  isViewingPastStage: boolean;
  onContinueStage: ContinueStageHandler;
  onEditStage: EditStageHandler;
  stageId: string;
};

export type GenericTaskFooterAdapterProps = {
  editStatus: EditSaveStatus;
  isStageCompleted: boolean;
  onContinueStage: ContinueStageHandler;
  onEditStage: EditStageHandler;
};

export function getGenericTaskFooterAdapterProps({
  decisions,
  editSaveStatus,
  isViewingPastStage,
  onContinueStage,
  onEditStage,
  stageId,
}: GenericTaskFooterAdapterInput): GenericTaskFooterAdapterProps {
  return {
    editStatus: getScopedEditSaveStatus(editSaveStatus, stageId),
    isStageCompleted: shouldShowGenericTaskEditButton(
      decisions[stageId]?.completedAt,
      isViewingPastStage,
    ),
    onContinueStage,
    onEditStage,
  };
}

type ContractReviewFooterAdapterInput = {
  decisions: WorkflowDecisionMap;
  editSaveStatus: ScopedEditSaveStatus;
  isViewingPastStage: boolean;
  onContinue: ContinueHandler;
  onEditStage: EditStageHandler;
};

export type ContractReviewFooterAdapterProps = {
  editStatus: EditSaveStatus;
  isStageCompleted: boolean;
  onContinue: ContinueHandler;
  onEdit: EditHandler;
};

export function getContractReviewFooterAdapterProps({
  decisions,
  editSaveStatus,
  isViewingPastStage,
  onContinue,
  onEditStage,
}: ContractReviewFooterAdapterInput): ContractReviewFooterAdapterProps {
  return {
    editStatus: editSaveStatus?.stageId === "contract-review" ? editSaveStatus.status : null,
    isStageCompleted: !!decisions["contract-review"]?.completedAt && isViewingPastStage,
    onContinue,
    onEdit: () => onEditStage("contract-review"),
  };
}
