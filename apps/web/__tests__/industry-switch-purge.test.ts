/**
 * 업종 전환 = 진행 전체 삭제 회귀 가드 (2026-07-21, 사장님 결정)
 *
 * 배경(P0 재현): stageId 가 업종 간 공유(biz-registration·tax-guide·loan-guide 등)라,
 * 업종 전환 시 이전 decisions 를 남기면 이전 업종의 completedAt 이 새 path 말단의
 * 강신호가 되어 healCompletedAtChain 이 미열람 단계를 통째로 완료 처리한다
 * (외식 loan-guide → b2b-saas 전환 시 스타트업 9단계 자동완료·94%).
 *
 * 처방: useSelectionHandlers.executeIndustrySwitch 가 *fresh* decisions/tasks 로
 * industry-selection 만 재기록 (+ 서버는 purgeRoadmapProgressForIndustrySwitch).
 * 이 테스트는 엔진 레벨에서 두 계약을 잠근다:
 *   ① 오염 시나리오가 여전히 재현되는가 (재현 안 되면 heal 이 바뀐 것 — 처방 재검토 신호)
 *   ② fresh 전환 후에는 heal 이 아무 단계도 완료 처리하지 않는가 (처방의 정답 상태)
 */
import { describe, expect, it } from "vitest";
import {
  buildRoadmapState,
  markStageAdvanced,
  healCompletedAtChain,
  starterRoadmap,
  type WorkflowDecisionMap,
} from "@foundone/shared";

const base = {
  roadmapId: starterRoadmap.roadmapId,
  templateId: starterRoadmap.templateId,
  stages: starterRoadmap.stages,
};

/** 외식(korean-casual) 사용자가 loan-guide 까지 진행한 decisions */
function progressedFoodDecisions(): WorkflowDecisionMap {
  let decisions: WorkflowDecisionMap = {
    "industry-selection": {
      stageId: "industry-selection",
      selectedPrimaryOptionId: "korean-casual",
      inputs: { categoryId: "food", subIndustryId: "korean-casual", specialtyId: "gukbap" },
      completedAt: "2026-01-01T00:00:00.000Z",
    },
  };
  const roadmap = buildRoadmapState(base, decisions, {});
  // loan-guide advance — 엔진이 path 상 앞 단계 전부 completedAt 백필
  const r = markStageAdvanced(base, roadmap, decisions, {}, "loan-guide", {});
  return r.decisions;
}

const switchPayload = {
  selectedPrimaryOptionId: "b2b-saas",
  inputs: { subIndustryId: "b2b-saas", categoryId: "startup-tech" },
};

describe("업종 전환 진행 삭제 (industry switch purge)", () => {
  it("① [오염 재현 계약] decisions 를 남긴 채 전환하면 heal 이 미열람 단계를 완료 처리한다", () => {
    const foodDecisions = progressedFoodDecisions();
    const roadmap = buildRoadmapState(base, foodDecisions, {});
    // 옛 handleIndustryContinue 동작: 기존 decisions 위에 industry-selection 만 재-advance
    const r = markStageAdvanced(base, roadmap, foodDecisions, {}, "industry-selection", switchPayload);
    const healed = healCompletedAtChain(r.decisions, {}, starterRoadmap.stages);
    const newlyHealed = Object.entries(healed.decisions)
      .filter(([k, d]) => d.completedAt && !r.decisions[k]?.completedAt)
      .map(([k]) => k);
    // 이 계약이 깨지면(=오염이 재현 안 되면) heal 로직이 바뀐 것 — 전환 처방과 함께 재검토할 것.
    expect(newlyHealed.length).toBeGreaterThan(0);
    expect(newlyHealed).toContain("startup-foundation");
  });

  it("② [처방 계약] fresh decisions 로 전환하면 heal 이 아무 단계도 추가 완료하지 않는다", () => {
    // executeIndustrySwitch 와 동일: fresh decisions/tasks 로 industry-selection 만 기록
    const fresh: WorkflowDecisionMap = {};
    const roadmap = buildRoadmapState(base, progressedFoodDecisions(), {});
    const r = markStageAdvanced(base, roadmap, fresh, {}, "industry-selection", switchPayload);

    // 이전 업종 잔재 0 — specialtyId(gukbap)·permitType 등이 새 inputs 에 없어야 한다
    expect(Object.keys(r.decisions)).toEqual(["industry-selection"]);
    expect(r.decisions["industry-selection"]?.inputs?.specialtyId).toBeUndefined();
    expect(r.decisions["industry-selection"]?.inputs?.subIndustryId).toBe("b2b-saas");

    // heal 이 완료 처리할 강신호가 없다 — 자동완료 0
    const healed = healCompletedAtChain(r.decisions, {}, starterRoadmap.stages);
    const newlyHealed = Object.entries(healed.decisions)
      .filter(([k, d]) => d.completedAt && !r.decisions[k]?.completedAt)
      .map(([k]) => k);
    expect(newlyHealed).toEqual([]);

    // 새 path 의 다음 단계에서 새 출발 (전 업종 진행률 승계 없음)
    expect(r.roadmap.currentStageId).not.toBe("financial-review");
    expect(r.roadmap.currentStageId).toBe("startup-type");
  });
});
