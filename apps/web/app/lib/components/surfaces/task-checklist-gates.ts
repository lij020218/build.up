import type { Language, WorkflowDecisionMap } from "@foundone/shared";
import { isStartupProblemDefinedComplete } from "../../utils/task-completion-rules";

export type TaskChecklistGate =
  | { blocked: true; hint: { ko: string; en: string } }
  | { blocked: false };

const PROBLEM_DEFINED_GATE_HINT = {
  ko: "↑ 1단계 페이지에서 핵심 문제를 한 문장(10자 이상)으로 입력하고 확인 버튼을 눌러야 체크할 수 있어요.",
  en: "↑ Fill in your problem statement (10+ chars) on Step 1 page and press Confirm before checking this.",
};

export function evaluateTaskChecklistGate(
  taskId: string,
  decisions: WorkflowDecisionMap,
): TaskChecklistGate {
  if (taskId !== "problem-defined") {
    return { blocked: false };
  }

  if (isStartupProblemDefinedComplete(decisions)) {
    return { blocked: false };
  }

  return {
    blocked: true,
    hint: PROBLEM_DEFINED_GATE_HINT,
  };
}

export function getPreLaunchTaskHint(
  language: Language,
  isPreLaunch: boolean,
  isDone: boolean,
) {
  if (!isPreLaunch || isDone) {
    return null;
  }

  return language === "ko"
    ? "위 페이지의 체크리스트를 다 채우면 자동 완료, 또는 여기 직접 체크"
    : "Auto-completes from page checklist above — or check here directly";
}
