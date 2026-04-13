"use client";

import {
  buildRoadmapState,
  completeCurrentStage,
  getFranchiseBrandById,
  saveStoreData,
  updateTaskStatus,
  upsertStageDecision,
  type UserStoreData,
} from "@build-up/shared";
import { useProfileStore, useRoadmapStore, useOnboardingStore } from "../stores";
import { supabase } from "../../../lib/supabase";
import { baseRoadmap, buildTransitionNotice } from "../helpers";
import type { DashboardDeps } from "../types";
import { SURFACE_HREFS } from "../constants";

export function useTaskHandlers(
  deps: DashboardDeps,
  collectStoreData: () => Partial<UserStoreData>
) {
  const { language, router, searchParams } = deps;

  // ── Roadmap store ──
  const {
    decisions, setDecisions,
    roadmap, setRoadmap,
    taskMap, setTaskMap,
    viewingStageId, setViewingStageId,
  } = useRoadmapStore();

  // ── Profile store ──
  const {
    storeName, setStoreName,
    selectedFranchiseBrandId,
    businessLaunched, setBusinessLaunched,
    businessLaunchedDate, setBusinessLaunchedDate,
  } = useProfileStore();

  // ── Onboarding store ──
  const {
    setLastUnlocked,
    setTransitionNotice,
  } = useOnboardingStore();

  // ── Contract-specific task toggle ──
  const handleContractTaskToggle = (taskId: string) => {
    const currentTasks = taskMap["contract-review"] ?? [];
    const existing = currentTasks.find((task) => task.taskId === taskId);

    if (!existing) {
      return;
    }

    const nextTaskMap = updateTaskStatus(
      taskMap,
      "contract-review",
      taskId,
      existing.status === "completed" ? "todo" : "completed"
    );

    setTaskMap(nextTaskMap);
    setRoadmap(buildRoadmapState(baseRoadmap, decisions, nextTaskMap));
  };

  // ── Contract continue (no Supabase save) ──
  const handleContractContinue = () => {
    const transition = completeCurrentStage(roadmap, decisions, taskMap);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  // ── Generic task toggle for any stage ──
  const handleTaskToggle = (stageId: string, taskId: string) => {
    const currentTasks = taskMap[stageId] ?? [];
    const existing = currentTasks.find((task) => task.taskId === taskId);
    if (!existing) return;
    const nextTaskMap = updateTaskStatus(
      taskMap,
      stageId,
      taskId,
      existing.status === "completed" ? "todo" : "completed"
    );
    const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
    setTaskMap(nextTaskMap);
    setRoadmap(nextRoadmap);
    // 모든 체크리스트 완료 시 currentStageId가 다음 단계로 바뀌어도
    // 사용자가 "다음 단계로" 버튼을 직접 누를 때까지 현재 화면을 유지
    if (nextRoadmap.currentStageId !== stageId && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId(stageId);
    }
  };

  // ── Generic stage completion (saves decisions to Supabase via saveRoadmapState) ──
  const handleStageContinue = (stageId: string) => {
    const nextDecisions = upsertStageDecision(decisions, stageId, {
      stageId,
      completedAt: new Date().toISOString()
    });
    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  // ── Mark business as launched and navigate to analytics ──
  const handleLaunchBusiness = () => {
    const launchDate = new Date().toISOString().slice(0, 10);
    setBusinessLaunched(true);
    if (!businessLaunchedDate) setBusinessLaunchedDate(launchDate);
    let finalStoreName = storeName;
    if (!storeName && selectedFranchiseBrandId) {
      const fb = getFranchiseBrandById(selectedFranchiseBrandId);
      if (fb) {
        finalStoreName = fb.name[language];
        setStoreName(finalStoreName);
      }
    }
    // ── Supabase에 store data 저장 ──
    // setTimeout을 사용하여 Zustand 상태가 업데이트된 후 읽도록 함
    setTimeout(() => {
      const storeDataToSave = collectStoreData();
      storeDataToSave.businessLaunched = true;
      storeDataToSave.businessLaunchedDate = businessLaunchedDate ?? launchDate;
      if (finalStoreName) storeDataToSave.storeName = finalStoreName;
      void saveStoreData(supabase, storeDataToSave).catch(() => {});
    }, 0);
    router.push(SURFACE_HREFS["analytics"]);
  };

  return {
    handleContractTaskToggle,
    handleContractContinue,
    handleTaskToggle,
    handleStageContinue,
    handleLaunchBusiness,
  };
}
