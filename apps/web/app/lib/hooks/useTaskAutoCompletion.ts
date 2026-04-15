"use client";

import { useEffect } from "react";
import { useRoadmapStore, useProfileStore } from "../stores";
import { buildRoadmapState, updateTaskStatus } from "@build-up/shared";
import { baseRoadmap } from "../helpers";
import type { DashboardDeps, DashboardSurface } from "../types";

/**
 * 폼 상태 변경 시 대응 태스크를 자동 완료하는 useEffect 모음.
 * - biz_registration: 세무대리인 선택 → cpa-decision-made
 * - vendor_setup: 공급처 선택 → supplier/equipment/pos tasks
 * - operations_setup: 배달/POS/SNS 선택 → delivery/pos/sns tasks
 * - pre_launch: 소프트오픈 → soft-open/feedback/final tasks
 * - editStage URL 파라미터 동기화
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
  const { cpaDecision } = useProfileStore();

  // editStage URL 파라미터 → viewingStageId 동기화
  useEffect(() => {
    if (activeSurface !== "current") return;
    const editStage = searchParams.get("editStage");
    setViewingStageId(editStage ?? null);
  }, [activeSurface, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // biz_registration: 세무대리인 여부 선택 시 태스크 자동 완료
  useEffect(() => {
    const bizStageId = "biz-registration";
    if (!taskMap[bizStageId]) return;
    const task = taskMap[bizStageId].find((t) => t.taskId === "cpa-decision-made");
    if (!task) return;
    const shouldComplete = cpaDecision !== null;
    if ((task.status === "completed") === shouldComplete) return;
    const nextTaskMap = updateTaskStatus(taskMap, bizStageId, "cpa-decision-made", shouldComplete ? "completed" : "todo");
    const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
    setTaskMap(nextTaskMap);
    setRoadmap(nextRoadmap);
  }, [cpaDecision]); // eslint-disable-line react-hooks/exhaustive-deps

  // vendor_setup: 공급처 선택 시 대응 태스크 자동 완료
  useEffect(() => {
    const vendorStageId = "vendor-setup";
    if (!taskMap[vendorStageId]) return;
    const hasStep = (step: number) =>
      Object.entries(vendorSelections).some(
        ([k, v]) => k.startsWith(`${vendorStageId}_s${step}_`) && v !== ""
      );
    const triggers: Array<{ taskId: string; shouldComplete: boolean }> = [
      { taskId: "supplier-identified", shouldComplete: hasStep(1) },
      { taskId: "equipment-planned",   shouldComplete: hasStep(2) },
      { taskId: "pos-selected",        shouldComplete: hasStep(3) || hasStep(4) },
    ];
    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[vendorStageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, vendorStageId, taskId, "completed");
      changed = true;
    }
    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
      if (nextRoadmap.currentStageId !== vendorStageId && viewingStageId === null && !searchParams.get("editStage")) {
        setViewingStageId(vendorStageId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorSelections]);

  // operations_setup: 플랫폼 선택 시 대응 태스크 자동 완료
  useEffect(() => {
    const opsStageId = "operations-setup";
    if (!taskMap[opsStageId]) return;
    const hasDelivery = ["baemin", "coupangeats", "yogiyo", "naver-order"].some(id => opsSelections[`delivery-${id}`]);
    const allPosChecked = ["menu-check", "payment-check", "receipt-check", "settlement-check"].every(id => opsPosChecks[id]);
    const hasSns = ["instagram", "naver-place", "kakao-channel", "google-business"].some(id => opsSelections[`sns-${id}`]);
    const triggers: Array<{ taskId: string; shouldComplete: boolean }> = [
      { taskId: "delivery-app-registered", shouldComplete: hasDelivery },
      { taskId: "pos-live",               shouldComplete: allPosChecked },
      { taskId: "sns-setup",              shouldComplete: hasSns },
    ];
    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[opsStageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, opsStageId, taskId, "completed");
      changed = true;
    }
    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
      if (nextRoadmap.currentStageId !== opsStageId && viewingStageId === null && !searchParams.get("editStage")) {
        setViewingStageId(opsStageId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opsSelections, opsPosChecks]);

  // pre-launch: 소프트오픈 체크 완료 시 태스크 자동 완료
  useEffect(() => {
    const stageId = "pre-launch";
    if (!taskMap[stageId]) return;
    const guestIds = ["guest-family", "guest-neighbor", "guest-influencer", "guest-peer"];
    const guestSelected = guestIds.some(k => softOpenChecks[k]);
    const prepKeys = ["prep-feedback-form", "prep-invite-sent", "prep-sns-plan"];
    const allPrepDone = prepKeys.every(k => softOpenChecks[k]);
    const step01Done = guestSelected && softOpenPricing !== "" && allPrepDone;
    const dayKeys = [
      "day-cleanliness", "day-staff-briefing", "day-pos", "day-ambiance",
      "day-observation", "day-payment", "day-feedback-card", "day-debrief", "day-settlement", "day-sns",
      "day-inventory", "day-order-timing", "day-delivery",
      "day-booking-system", "day-no-show", "day-service-time",
      "day-display", "day-checkout-test",
      "day-equipment", "day-crm", "day-class",
      "day-checkout-online", "day-cs", "day-fulfillment",
    ];
    const dayChecked = dayKeys.filter(k => softOpenChecks[k]).length;
    const feedbackKeys = [
      "feedback-service", "feedback-price", "feedback-ambiance",
      "feedback-taste", "feedback-quality", "feedback-product", "feedback-facility", "feedback-ux",
      "feedback-booking", "feedback-menu", "feedback-display", "feedback-instructor",
    ];
    const feedbackChecked = feedbackKeys.filter(k => softOpenChecks[k]).length;
    const finalKeys = ["final-naver", "final-instagram", "final-kakao", "final-event"];
    const finalAllResolved = finalKeys.every(k => softOpenChecks[k] || softOpenSkips[k]);
    const finalAtLeastOne  = finalKeys.some(k => softOpenChecks[k]);
    const triggers = [
      { taskId: "soft-open-done",     shouldComplete: step01Done },
      { taskId: "feedback-collected", shouldComplete: dayChecked >= 6 },
      { taskId: "final-checklist",    shouldComplete: feedbackChecked >= 4 && finalAllResolved && finalAtLeastOne },
    ];
    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[stageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, stageId, taskId, "completed");
      changed = true;
    }
    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
      if (nextRoadmap.currentStageId !== stageId && viewingStageId === null && !searchParams.get("editStage")) {
        setViewingStageId(stageId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [softOpenChecks, softOpenPricing, softOpenSkips]);

  // startup-foundation: 입력 확인 시 대응 태스크 자동 완료
  useEffect(() => {
    const stageId = "startup-foundation";
    if (!taskMap[stageId]) return;
    const inputs = (decisions[stageId] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
    if (!inputs) return;

    const triggers: Array<{ taskId: string; shouldComplete: boolean }> = [
      { taskId: "problem-defined", shouldComplete: !!(inputs.problemConfirmed && (inputs.problemStatement as string)?.trim()?.length >= 10) },
      { taskId: "founder-alignment", shouldComplete: !!(inputs.teamStructure && (inputs.teamStructure as string).length > 0) },
      { taskId: "company-formation-path", shouldComplete: !!(inputs.formationPath && (inputs.formationPath as string).length > 0) },
    ];

    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[stageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, stageId, taskId, "completed");
      changed = true;
    }
    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);

  // company-setup: 사업자등록 선택 확인 시 태스크 자동 완료
  useEffect(() => {
    const stageId = "company-setup";
    if (!taskMap[stageId]) return;
    const { guideSelections } = useRoadmapStore.getState();

    const triggers: Array<{ taskId: string; shouldComplete: boolean }> = [
      { taskId: "business-structure-decided", shouldComplete: !!(guideSelections["biz-structure"]) },
      { taskId: "tax-setup-basics", shouldComplete: !!(guideSelections["tax-type"]) },
    ];

    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[stageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, stageId, taskId, "completed");
      changed = true;
    }
    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions]);
}
