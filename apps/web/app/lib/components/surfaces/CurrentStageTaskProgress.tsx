"use client";

import type { TaskState } from "@foundone/shared";
import { styles } from "../../styles";
import { calculateTaskProgressSummary } from "./current-stage-task-progress";

type ProgressLanguage = "ko" | "en";

export function CurrentStageTaskProgress({
  language,
  stageTasks,
  isPreLaunch,
  preLaunchDoneMap,
}: {
  language: ProgressLanguage;
  stageTasks: TaskState[];
  isPreLaunch: boolean;
  preLaunchDoneMap: Record<string, boolean>;
}) {
  const { visibleTasks, visibleDone } = calculateTaskProgressSummary(
    stageTasks,
    isPreLaunch,
    preLaunchDoneMap,
  );

  if (visibleTasks.length === 0) {
    return null;
  }

  return (
    <div style={styles.taskProgress}>
      {language === "ko"
        ? `${visibleDone} / ${visibleTasks.length} 완료`
        : `${visibleDone} of ${visibleTasks.length} done`}
    </div>
  );
}
