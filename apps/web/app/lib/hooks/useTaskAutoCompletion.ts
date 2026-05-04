"use client";

import { useEffect } from "react";
import { useRoadmapStore, useProfileStore } from "../stores";
import { buildRoadmapState, updateTaskStatus } from "@build-up/shared";
import type { WorkflowTaskMap } from "@build-up/shared";
import { baseRoadmap } from "../helpers";
import type { DashboardDeps, DashboardSurface } from "../types";

/**
 * 폼 상태 변경 시 대응 태스크를 자동 완료하는 useEffect 모음.
 * - biz_registration: 세무대리인 선택 → cpa-decision-made
 * - vendor_setup: 공급처 선택 → supplier/equipment/pos tasks
 * - operations_setup: 배달/POS/SNS 선택 → delivery/pos/sns tasks
 * - pre_launch: 소프트오픈 → soft-open/feedback/final tasks
 * - editStage URL 파라미터 동기화
 *
 * ⚠️ 모든 effect 가 `useRoadmapStore.getState()` 로 최신 taskMap/decisions 를 직접 읽음.
 *    이전엔 React 훅 closure 의 `taskMap` 를 쓰면서 같은 render cycle 에서
 *    여러 effect 가 동시에 firing 되면 서로의 변경분을 덮어쓰는 race condition 발생.
 *    그 결과 사용자가 완료한 task 가 다음 stage 진입 시 사라지는 버그 (사용자 보고).
 */
export function useTaskAutoCompletion(
  deps: DashboardDeps,
  surface: DashboardSurface,
  activeSurface: string,
) {
  const { searchParams } = deps;
  const {
    decisions, taskMap, setTaskMap, setRoadmap,
    viewingStageId, setViewingStageId,
    vendorSelections, opsSelections, opsPosChecks,
    softOpenChecks, softOpenPricing, softOpenSkips,
  } = useRoadmapStore();
  const { cpaDecision, selectedInteriorConcept } = useProfileStore();

  /**
   * 단일 stage 의 task 자동 완료 처리 — race-safe.
   * - 항상 store 의 최신 taskMap·decisions 를 직접 읽음.
   * - "현재 미완료" 인 task 만 "completed" 로 변경 (절대 reverse 안 함).
   * - 변경이 있을 때만 roadmap 을 재빌드.
   */
  const applyAutoComplete = (
    stageId: string,
    triggers: Array<{ taskId: string; shouldComplete: boolean }>,
  ): { changed: boolean; viewingStageHint?: string } => {
    const liveTaskMap = useRoadmapStore.getState().taskMap;
    const liveDecisions = useRoadmapStore.getState().decisions;
    if (!liveTaskMap[stageId]) return { changed: false };

    let nextTaskMap: WorkflowTaskMap = liveTaskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (nextTaskMap[stageId] ?? []).find(t => t.taskId === taskId);
      if (!task) continue;
      if (!shouldComplete) continue;
      if (task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, stageId, taskId, "completed");
      changed = true;
    }
    if (!changed) return { changed: false };

    const nextRoadmap = buildRoadmapState(baseRoadmap, liveDecisions, nextTaskMap);
    setTaskMap(nextTaskMap);
    setRoadmap(nextRoadmap);
    return {
      changed: true,
      viewingStageHint: nextRoadmap.currentStageId !== stageId ? stageId : undefined,
    };
  };

  // editStage URL 파라미터 → viewingStageId 동기화
  useEffect(() => {
    if (activeSurface !== "current") return;
    const editStage = searchParams.get("editStage");
    setViewingStageId(editStage ?? null);
  }, [activeSurface, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // biz_registration: 세무대리인 여부 선택 시 태스크 자동 완료
  useEffect(() => {
    applyAutoComplete("biz-registration", [
      { taskId: "cpa-decision-made", shouldComplete: cpaDecision !== null },
    ]);
  }, [cpaDecision]); // eslint-disable-line react-hooks/exhaustive-deps

  // construction-setup: 디자인 컨셉 선택 시 interior-concept-selected 자동 완료.
  //   ConstructionSetupStage UI 에서 selectedInteriorConcept 를 set 하면 즉시 task 처리.
  useEffect(() => {
    applyAutoComplete("construction-setup", [
      { taskId: "interior-concept-selected", shouldComplete: !!selectedInteriorConcept },
    ]);
  }, [selectedInteriorConcept]); // eslint-disable-line react-hooks/exhaustive-deps

  // vendor_setup: 공급처 선택 시 대응 태스크 자동 완료
  useEffect(() => {
    const stageId = "vendor-setup";
    const hasStep = (step: number) =>
      Object.entries(vendorSelections).some(
        ([k, v]) => k.startsWith(`${stageId}_s${step}_`) && v !== ""
      );
    const result = applyAutoComplete(stageId, [
      { taskId: "supplier-identified", shouldComplete: hasStep(1) },
      { taskId: "equipment-planned",   shouldComplete: hasStep(2) },
      { taskId: "pos-selected",        shouldComplete: hasStep(3) || hasStep(4) },
    ]);
    if (result.viewingStageHint && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId(result.viewingStageHint);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorSelections]);

  // operations_setup: 플랫폼 선택 시 대응 태스크 자동 완료
  useEffect(() => {
    const stageId = "operations-setup";
    const hasDelivery = ["baemin", "coupangeats", "yogiyo", "naver-order"].some(id => opsSelections[`delivery-${id}`]);
    const allPosChecked = ["menu-check", "payment-check", "receipt-check", "settlement-check"].every(id => opsPosChecks[id]);
    const hasSns = ["instagram", "naver-place", "kakao-channel", "google-business"].some(id => opsSelections[`sns-${id}`]);
    const result = applyAutoComplete(stageId, [
      { taskId: "delivery-app-registered", shouldComplete: hasDelivery },
      { taskId: "pos-live",               shouldComplete: allPosChecked },
      { taskId: "sns-setup",              shouldComplete: hasSns },
    ]);
    if (result.viewingStageHint && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId(result.viewingStageHint);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opsSelections, opsPosChecks]);

  // pre-launch: 소프트오픈 체크 완료 시 태스크 자동 완료
  // ⚠️ feedback-collected / final-checklist 의 부분 임계값 (≥6, ≥4) 은 100% 룰 로 변경 대상이지만,
  //    여기 useTaskAutoCompletion 은 "준비 단계 입력에 따라 task 만 미리 완료시키는" 용도라
  //    자동완료 트리거는 보수적 임계값을 유지하되, 실제 task 완료 판정 (CurrentStageView) 은 100% 룰.
  useEffect(() => {
    const stageId = "pre-launch";
    const guestIds = ["guest-family", "guest-neighbor", "guest-influencer", "guest-peer"];
    const guestSelected = guestIds.some(k => softOpenChecks[k]);
    const prepKeys = ["prep-feedback-form", "prep-invite-sent", "prep-sns-plan"];
    const allPrepDone = prepKeys.every(k => softOpenChecks[k]);
    const step01Done = guestSelected && softOpenPricing !== "" && allPrepDone;

    // ⚠️ 100% 룰 — preLaunchVisibleIds 가 store 에 push 된 경우, 사용자가 본 모든 항목이 체크돼야 자동완료.
    //    이전엔 dayKeys/feedbackKeys 하드코딩 + ≥6/≥4 임계값으로 부분 체크 자동완료 버그 있었음.
    const visible = useRoadmapStore.getState().preLaunchVisibleIds;
    const allDayChecked = visible !== null
      && visible.dayIds.length > 0
      && visible.dayIds.every(id => softOpenChecks[id]);
    const allFeedbackChecked = visible !== null
      && visible.feedbackIds.length > 0
      && visible.feedbackIds.every(id => softOpenChecks[id]);
    const allFinalResolved = visible !== null
      && visible.finalIds.length > 0
      && visible.finalIds.every(id => softOpenChecks[id] || softOpenSkips[id]);
    const finalAtLeastOne = visible !== null
      && visible.finalIds.some(id => softOpenChecks[id]);

    const result = applyAutoComplete(stageId, [
      { taskId: "soft-open-done",     shouldComplete: step01Done },
      { taskId: "feedback-collected", shouldComplete: allDayChecked },
      { taskId: "final-checklist",    shouldComplete: allFeedbackChecked && allFinalResolved && finalAtLeastOne },
    ]);
    if (result.viewingStageHint && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId(result.viewingStageHint);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [softOpenChecks, softOpenPricing, softOpenSkips]);

  // startup-foundation: 입력 확인 시 대응 태스크 자동 완료
  useEffect(() => {
    const stageId = "startup-foundation";
    const inputs = (decisions[stageId] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
    if (!inputs) return;
    applyAutoComplete(stageId, [
      { taskId: "problem-defined", shouldComplete: !!(inputs.problemConfirmed && (inputs.problemStatement as string)?.trim()?.length >= 10) },
      { taskId: "founder-alignment", shouldComplete: !!(inputs.teamStructure && (inputs.teamStructure as string).length > 0) },
      { taskId: "company-formation-path", shouldComplete: !!(inputs.formationPath && (inputs.formationPath as string).length > 0) },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);

  // company-setup: 사업자등록 선택 확인 시 태스크 자동 완료
  useEffect(() => {
    const stageId = "company-setup";
    const { guideSelections } = useRoadmapStore.getState();
    applyAutoComplete(stageId, [
      { taskId: "business-structure-decided", shouldComplete: !!(guideSelections["biz-structure"]) },
      { taskId: "tax-setup-basics", shouldComplete: !!(guideSelections["tax-type"]) },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);

  // customer-discovery: 인터뷰 입력 시 태스크 자동 완료
  useEffect(() => {
    const stageId = "customer-discovery";
    const { guideSelections } = useRoadmapStore.getState();
    applyAutoComplete(stageId, [
      { taskId: "customer-interviews-done", shouldComplete: !!(guideSelections["interview-target"] && (guideSelections["interview-target"] as string).length > 0) },
      { taskId: "pain-pattern-documented", shouldComplete: !!(guideSelections["analysis-notes"] && (guideSelections["analysis-notes"] as string).length >= 10) },
      { taskId: "narrow-wedge-defined", shouldComplete: !!(guideSelections["analysis-result"]) },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);

  // growth-engine: 북극성 지표 선택 시 자동 완료
  useEffect(() => {
    const stageId = "growth-engine";
    const geInputs = (decisions[stageId] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
    applyAutoComplete(stageId, [
      { taskId: "north-star-set", shouldComplete: !!(geInputs?.northStarType && geInputs?.northStarMetricName && (geInputs.northStarMetricName as string).length > 0) },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);

  // fundraising-readiness: AI 사업계획서 생성 시 자동 완료
  useEffect(() => {
    const stageId = "fundraising-readiness";
    const frInputs = (decisions[stageId] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
    applyAutoComplete(stageId, [
      { taskId: "investor-material-ready", shouldComplete: !!(frInputs?.bpSections) },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);

  // venture-certification: 인증 유형 선택 시 자동 완료
  useEffect(() => {
    const stageId = "venture-certification";
    const { guideSelections } = useRoadmapStore.getState();
    applyAutoComplete(stageId, [
      { taskId: "venture-cert-type-checked", shouldComplete: !!(guideSelections["venture-cert-type"]) },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);

  // suppress unused warnings (taskMap is still in destructure for backwards stability)
  void taskMap;
  void surface;
}
