"use client";

import { type Language, type TaskState, type WorkflowDecisionMap } from "@foundone/shared";
import { styles } from "../../styles";
import { getGenericTaskChecklistItemState } from "./generic-task-checklist-state";
import { getVisibleTaskProgressTasks } from "./current-stage-task-progress";

type GenericTaskChecklistProps = {
  decisions: WorkflowDecisionMap;
  industryCategoryId: string | null | undefined;
  /** 세부 업종 — 디지털 콘텐츠(무배송) 서브타입의 "{taskId}__digital" 라벨 오버라이드용. */
  subIndustryId?: string | null;
  isPreLaunch: boolean;
  isStrictConstructionFranchise: boolean;
  language: Language;
  onToggleTask: (taskId: string) => void;
  preLaunchDoneMap: Record<string, boolean>;
  stageCode: string;
  stageTasks: TaskState[];
};

export function GenericTaskChecklist({
  decisions,
  industryCategoryId,
  subIndustryId,
  isPreLaunch,
  isStrictConstructionFranchise,
  language,
  onToggleTask,
  preLaunchDoneMap,
  stageCode,
  stageTasks,
}: GenericTaskChecklistProps) {
  return (
    <div style={styles.taskChecklist}>
      {getVisibleTaskProgressTasks(stageTasks).map((task) => {
        const itemState = getGenericTaskChecklistItemState({
          decisions,
          industryCategoryId,
          subIndustryId,
          isPreLaunch,
          isStrictConstructionFranchise,
          language,
          preLaunchDoneMap,
          stageCode,
          task,
        });

        return (
          <button
            key={task.taskId}
            type="button"
            title={itemState.preLaunchHint ?? undefined}
            style={{
              ...styles.taskCheckItem,
              ...(itemState.done ? styles.taskCheckItemDone : {}),
              ...(itemState.gate.blocked && !itemState.done ? { opacity: 0.6, cursor: "not-allowed" } : {}),
            }}
            onClick={() => {
              if (itemState.gate.blocked && !itemState.done) {
                const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                  `[data-task-input="${task.taskId}"]`,
                );
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => el.focus(), 400);
                }
                return;
              }
              onToggleTask(task.taskId);
            }}
          >
            <div
              style={{
                ...styles.taskCheckCircle,
                ...(itemState.done ? styles.taskCheckCircleDone : {}),
              }}
            >
              {itemState.done && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7L5.5 10L11.5 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  ...styles.taskCheckTitle,
                  ...(itemState.done ? styles.taskCheckTitleDone : {}),
                }}
              >
                {itemState.title}
              </div>
              {!itemState.done && itemState.gate.blocked && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#b64c4c",
                    lineHeight: 1.5,
                    marginTop: "4px",
                    fontWeight: 600,
                  }}
                >
                  {language === "ko" ? itemState.gate.hint.ko : itemState.gate.hint.en}
                </div>
              )}
              {!itemState.done && itemState.preLaunchHint && (
                <div
                  style={{
                    fontSize: "11.5px",
                    color: "var(--muted)",
                    lineHeight: 1.5,
                    marginTop: "4px",
                    fontWeight: 500,
                  }}
                >
                  ↑ {itemState.preLaunchHint}
                </div>
              )}
              {itemState.constructionHint && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    lineHeight: 1.4,
                    marginTop: "3px",
                  }}
                >
                  {itemState.constructionHint}
                </div>
              )}
            </div>
            {task.estimatedMinutes && !itemState.done && (
              <div style={{ ...styles.taskProgress, flexShrink: 0 }}>
                {task.estimatedMinutes}
                {language === "ko" ? "분" : "m"}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
