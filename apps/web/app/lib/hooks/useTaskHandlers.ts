"use client";

import {
  buildRoadmapState,
  evaluateStageCompletion,
  getFranchiseBrandById,
  saveRoadmapState,
  saveStoreData,
  updateTaskStatus,
  upsertStageDecision,
  type UserStoreData,
} from "@build-up/shared";
import { useProfileStore, useRoadmapStore, useOnboardingStore } from "../stores";
import { supabase } from "../../../lib/supabase";
import { baseRoadmap, buildTransitionNotice, getContractTaskDetail, advanceStageWithChainBackfill } from "../helpers";
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
    setEditSaveStatus,
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

  // ── Contract-specific task toggle (⚠️ 체크리스트 100% 가드) ──
  const handleContractTaskToggle = (taskId: string) => {
    const currentTasks = taskMap["contract-review"] ?? [];
    const existing = currentTasks.find((task) => task.taskId === taskId);

    if (!existing) {
      return;
    }

    // todo → completed 로 바뀌는 경우, 해당 task 의 sub-checklist 가 100% 완료됐는지 확인.
    // (UI 에서 이미 막지만 defensive — DevTools 등 우회 방지)
    if (existing.status !== "completed") {
      const detail = getContractTaskDetail(taskId, language, undefined);
      const checklistTotal = detail.checklist.length;
      if (checklistTotal > 0) {
        const subChecks = useRoadmapStore.getState().contractSubChecks;
        const checkedCount = detail.checklist.filter((_, i) => subChecks[`${taskId}:${i}`]).length;
        if (checkedCount < checklistTotal) {
          console.warn(`[contract-review] Task "${taskId}" 완료 차단 — 체크리스트 ${checkedCount}/${checklistTotal}`);
          return;
        }
      }
    }

    const nextTaskMap = updateTaskStatus(
      taskMap,
      "contract-review",
      taskId,
      existing.status === "completed" ? "todo" : "completed"
    );

    // 같은 패턴: rule 이 완료되면 completedAt 즉시 set (refresh-safe).
    let nextDecisions = decisions;
    const stageDef = baseRoadmap.stages.find(s => s.stageId === "contract-review");
    if (stageDef) {
      const stageWithStatus = { ...stageDef, status: "in_progress" as const };
      const completion = evaluateStageCompletion(stageWithStatus, decisions, nextTaskMap);
      const alreadyCompleted = !!decisions["contract-review"]?.completedAt;
      if (completion.isComplete && !alreadyCompleted) {
        nextDecisions = upsertStageDecision(decisions, "contract-review", {
          stageId: "contract-review",
          completedAt: new Date().toISOString(),
        });
        setDecisions(nextDecisions);
      }
    }

    const nextRoadmap = buildRoadmapState(baseRoadmap, nextDecisions, nextTaskMap);
    setTaskMap(nextTaskMap);
    setRoadmap(nextRoadmap);

    // ⚠️ 자동 이동 방지 — 모든 필수 task 가 완료되어 roadmap.currentStageId 가
    //  자동으로 다음 단계로 advance 되더라도, 사용자가 명시적으로 "다음 단계로" 버튼을
    //  누를 때까지 현재 contract-review 화면 유지 (다른 단계의 handleTaskToggle 과 동일 패턴).
    if (nextRoadmap.currentStageId !== "contract-review" && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId("contract-review");
    }
  };

  // ── Contract continue ──
  const handleContractContinue = () => {
    const result = advanceStageWithChainBackfill("contract-review", decisions, roadmap, taskMap);
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
    if (searchParams.get("editStage")) {
      router.replace(SURFACE_HREFS.current);
    }
    void saveRoadmapState(supabase, {
      roadmap: result.roadmap,
      decisions: result.decisions,
      tasks: taskMap,
    }).catch((err) => {
      console.warn("[handleContractContinue] immediate save failed (autosave will retry):", err);
    });
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
    // ⚠ rule 이 완료되면 즉시 decisions[stageId].completedAt 를 set —
    //    이전엔 task 만 토글하고 completedAt 은 "다음 단계로" 버튼 시점에만 set.
    //    그 결과 사용자가 모든 task 끝낸 뒤 새로고침 → completedAt 없음 → 이후 룰 변경 시
    //    저장된 task 가 새 requiredTaskIds 를 만족 못 하면 단계가 다시 "available" 로 회귀하는 버그.
    //    (사용자 보고 2026-05-03 "계속 서버를 새로고침하면 이미 완료한 단계로 돌아옴")
    const stageDef = baseRoadmap.stages.find(s => s.stageId === stageId);
    let nextDecisions = decisions;
    if (stageDef) {
      const completion = (() => {
        const stageWithStatus = { ...stageDef, status: "in_progress" as const };
        // buildRoadmapState 가 사용하는 evaluateStageCompletion 와 동일 로직.
        return evaluateStageCompletion(stageWithStatus, decisions, nextTaskMap);
      })();
      const alreadyCompleted = !!decisions[stageId]?.completedAt;
      if (completion.isComplete && !alreadyCompleted) {
        nextDecisions = upsertStageDecision(decisions, stageId, {
          stageId,
          completedAt: new Date().toISOString(),
        });
        setDecisions(nextDecisions);
      }
    }
    const nextRoadmap = buildRoadmapState(baseRoadmap, nextDecisions, nextTaskMap);
    setTaskMap(nextTaskMap);
    setRoadmap(nextRoadmap);
    // 모든 체크리스트 완료 시 currentStageId가 다음 단계로 바뀌어도
    // 사용자가 "다음 단계로" 버튼을 직접 누를 때까지 현재 화면을 유지
    if (nextRoadmap.currentStageId !== stageId && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId(stageId);
    }
  };

  // ── Generic stage completion (saves decisions to Supabase via saveRoadmapState) ──
  // ⚠️ 핵심 안전성 (사용자 보고 2026-05-03 "다음 단계로 누르니 뒤 단계로 회귀"):
  //   이전엔 completeCurrentStage(roadmap, ...) 를 호출했는데 이 함수는 `roadmap.currentStageId`
  //   기준으로 동작 → 룰 강화로 회귀된 currentStageId 가 viewed stage 보다 앞에 있으면
  //   completeCurrentStage 가 그 회귀 stage 의 룰만 평가 → no advance + setViewingStageId(null)
  //   로 사용자를 회귀 stage 로 끌고 감.
  //
  //   해결: viewed stage 의 completedAt 만 set 하고 buildRoadmapState 로 처음부터 재빌드.
  //   buildRoadmapState 가 모든 stage 의 completion 을 재평가해서 currentStageId 를 가장 앞
  //   미완료 stage 로 자동 계산 → completedAt 있는 stage 는 모두 complete → 자연스레 다음 단계로 advance.
  const handleStageContinue = (stageId: string) => {
    const result = advanceStageWithChainBackfill(stageId, decisions, roadmap, taskMap);
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
    // ⚠️ URL cleanup: ?editStage= 쿼리가 남아있으면 제거.
    //   useTaskAutoCompletion.ts:72 의 useEffect([activeSurface, searchParams]) 가
    //   URL 에 editStage 가 있으면 viewingStageId 를 다시 pin → 새로고침 후 항상 같은 단계로 복귀.
    if (searchParams.get("editStage")) {
      router.replace(SURFACE_HREFS.current);
    }
    // 즉시 Supabase 저장: 800ms autosave debounce 전에 이탈해도 progress 보존.
    void saveRoadmapState(supabase, {
      roadmap: result.roadmap,
      decisions: result.decisions,
      tasks: taskMap,
    }).catch((err) => {
      console.warn("[handleStageContinue] immediate save failed (autosave will retry):", err);
    });
  };

  // ── Stage edit save — 완료된 단계의 입력값을 수정 후 저장 ──
  // ⚠️ 핵심 안전성:
  //   - upsertStageDecision 은 단일 stageId 만 patch (다른 단계 decisions 보존).
  //   - buildRoadmapState 재빌드 시 다른 단계는 기존 decisions/tasks 그대로 평가 → 상태 변동 없음.
  //   - currentStageId 가 이미 다음 단계로 이동했다면 그대로 유지.
  //   - viewingStageId 도 그대로 (사용자가 같은 화면에 머물러 "저장됨" 알림 받음).
  //
  //   2026-05-03 보강: 사용자 보고 "수정 저장 눌러도 아무 동작 안함".
  //     이전엔 setDecisions 만 호출 → 800ms autosave debounce 기다림 → 시각적 피드백 X.
  //     이제는 즉시 saveRoadmapState 호출 + editSaveStatus 로 버튼 라벨 동기화
  //     ("수정 저장" → "저장 중..." → "✓ 수정 완료" → 2초 뒤 idle).
  const handleStageEdit = async (stageId: string) => {
    const existing = decisions[stageId];
    if (!existing?.completedAt) {
      // 완료 안 된 단계는 일반 continue 핸들러로
      handleStageContinue(stageId);
      return;
    }
    // 완료된 단계 — completedAt 갱신 + 즉시 Supabase 저장
    const nextDecisions = upsertStageDecision(decisions, stageId, {
      stageId,
      completedAt: new Date().toISOString(),
    });
    const nextRoadmap = buildRoadmapState(baseRoadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(nextRoadmap);

    // 사용자에게 즉시 시각적 피드백 — "저장 중..."
    setEditSaveStatus({ stageId, status: "saving" });

    try {
      await saveRoadmapState(supabase, {
        roadmap: nextRoadmap,
        decisions: nextDecisions,
        tasks: taskMap,
      });
      // 매장 데이터도 같이 flush (mission, store info 등 onChange 로 들어온 값들).
      try {
        await saveStoreData(supabase, collectStoreData());
      } catch (storeErr) {
        // 매장 데이터 저장 실패는 critical 아님 — 콘솔 경고만, 수정 저장 자체는 성공으로 표시.
        console.warn("[handleStageEdit] saveStoreData failed (non-critical):", storeErr);
      }
      setEditSaveStatus({ stageId, status: "saved" });
      setTransitionNotice({
        title: language === "ko" ? "✓ 수정 저장됨" : "✓ Changes saved",
        body: language === "ko"
          ? "다음 단계는 그대로 유지됩니다. 다른 단계의 데이터에 영향 없음."
          : "Subsequent stages preserved. Other stage data untouched.",
      });
      // 2초 후 idle 로 복귀 (버튼 라벨 "✓ 수정 완료" → 다시 "수정 저장")
      setTimeout(() => {
        const cur = useRoadmapStore.getState().editSaveStatus;
        if (cur?.stageId === stageId && cur.status === "saved") {
          setEditSaveStatus(null);
        }
      }, 2000);
    } catch (err) {
      console.error("[handleStageEdit] save failed:", err);
      setEditSaveStatus({ stageId, status: "error" });
      setTransitionNotice({
        title: language === "ko" ? "저장 실패" : "Save failed",
        body: err instanceof Error ? err.message : (language === "ko" ? "다시 시도해 주세요." : "Please try again."),
      });
      // 4초 후 idle (사용자 재시도 가능)
      setTimeout(() => {
        const cur = useRoadmapStore.getState().editSaveStatus;
        if (cur?.stageId === stageId && cur.status === "error") {
          setEditSaveStatus(null);
        }
      }, 4000);
    }
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
    handleStageEdit,
    handleLaunchBusiness,
  };
}
