"use client";

import {
  buildRoadmapState,
  getFranchiseBrandById,
  saveRoadmapState,
  saveStoreData,
  toggleStageTask,
  upsertStageDecision,
  type UserStoreData,
} from "@foundone/shared";
import { useProfileStore, useRoadmapStore, useOnboardingStore } from "../stores";
import { supabase } from "../../../lib/supabase";
import {
  baseRoadmap,
  buildTransitionNotice,
  getContractTaskDetail,
  markViewedStageAdvanced,
  resolveViewingTargetAfterStageAdvance,
} from "../helpers";
import type { DashboardDeps } from "../types";
import { SURFACE_HREFS } from "../constants";
import { getKstDate } from "../utils/business-day";

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

  const applyTaskOnlyTransition = (stageId: string, result: ReturnType<typeof toggleStageTask>) => {
    // Task-only changes must not navigate the user forward; explicit continue handles progression.
    setTaskMap(result.tasks);
    setRoadmap(result.roadmap);

    if (result.roadmap.currentStageId !== stageId && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId(stageId);
    }
  };

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

    const result = toggleStageTask(baseRoadmap, decisions, taskMap, "contract-review", taskId);

    applyTaskOnlyTransition("contract-review", result);
  };

  // ── Contract continue ──
  const handleContractContinue = () => {
    const result = markViewedStageAdvanced("contract-review", decisions, roadmap, taskMap);
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
    const result = toggleStageTask(baseRoadmap, decisions, taskMap, stageId, taskId);
    applyTaskOnlyTransition(stageId, result);
  };

  // ── Generic stage completion (saves decisions to Supabase via saveRoadmapState) ──
  // ⚠️ 핵심 안전성 (사용자 보고 2026-05-03 "다음 단계로 누르니 뒤 단계로 회귀"):
  //   currentStageId 기반 진행은 사용자가 재방문 중인 viewed stage 와 어긋날 수 있다.
  //   룰 강화로 회귀된 currentStageId 가 viewed stage 보다 앞에 있으면 그 회귀 stage 만 평가되어
  //   no advance + setViewingStageId(null)
  //   로 사용자를 회귀 stage 로 끌고 감.
  //
  //   해결: viewed stageId 를 명시해 completedAt 을 set 하고 shared transition 으로 재빌드.
  const handleStageContinue = (stageId: string) => {
    const result = markViewedStageAdvanced(stageId, decisions, roadmap, taskMap);
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);

    // ⚠️ 2026-05-18 fix (사장님 신고: 8단계 → 다음 → 22단계 점프 / 항상 21단계 financial-review 점프):
    //   buildRoadmapState 의 nextCurrentStageId 는 *path 의 첫 미완료* 를 찾는데,
    //   사용자 데이터에 zombie completedAt / 자동 완료 처리된 후속 stage 가 있으면
    //   path 끝까지 traversal 가서 마지막 stage 반환. 그래서 8 → 22 점프.
    //   여기서는 *방금 완료한 stage 의 path 직계 다음 stage* 를 명시적으로 강제 표시.
    //   resolveNextStageIds 는 nextStageConditions + decisions 따라 정확한 다음 stage 반환.
    //
    //   추가 (2026-05-18): biz-registration / pre-launch / online-marketing 의 default
    //   nextStageIds = "financial-review" 인데, decisions zombie 시 condition 매칭 실패 →
    //   default fall through → financial-review 로 점프. 이걸 array index 거리로 sanity check.
    const viewingResolution = resolveViewingTargetAfterStageAdvance(stageId, result.roadmap, result.decisions);
    if (viewingResolution.isSuspiciousJump) {
      console.warn(
        `[handleStageContinue] zombie 점프 감지: ${stageId} (idx ${viewingResolution.completedIdx}) → ${viewingResolution.explicitNextStageId} (idx ${viewingResolution.explicitIdx}). decisions 의 industry-selection.inputs.categoryId / startup-type.inputs.startupType 누락 의심. array 순서의 직계 다음 available stage 로 fallback.`,
        { decisions: result.decisions },
      );
    }
    setViewingStageId(viewingResolution.viewingTarget);
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

  // ── Mark business as launched and navigate to *operational* dashboard ──
  //  ⚠️ 사용자 지침 (2026-05-11): "대시보드로 가기 → 운영 대시보드로 가야 하는데 내 가게로 가고 있다."
  //  종전엔 `analytics`(=내 가게/MyStore) 로 보내서 운영 대시보드 진입이 한 단계 더 필요했음.
  //  이제 바로 `current`(=OperationalDashboard) 로 진입 — Day 1 매출 입력 흐름과 정합.
  const handleLaunchBusiness = () => {
    const launchDate = getKstDate(new Date());
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
    // ⚠️ 2026-05-19 (사장님 신고: "운영 대시보드로 이동" 버튼 누르면 내 가게로 감):
    //   종전 `SURFACE_HREFS["current"]` (= /current) 는 *로드맵 현재 단계 surface* 라
    //   businessLaunched=true 이후 본진 운영 대시보드가 아님. 메인 홈(`home` = /)이 운영
    //   대시보드 surface — 그곳으로 redirect.
    router.push(SURFACE_HREFS["home"]);
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
