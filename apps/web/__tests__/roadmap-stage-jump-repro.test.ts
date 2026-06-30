/**
 * 단계 점프 회귀 가드 (사장님 신고: 대출 가이드 완료 / 프랜차이즈 외부링크 왕복 시 "21·22단계 완료로 건너뜀").
 *
 * 뿌리: connectAndLoad 의 completedAt self-heal 이 **배열 인덱스 순서**로 chain backfill 했음.
 *   roadmap.stages 배열은 path 순서가 아니라 starter-data 정의 순서(offline→tech→cluster→franchise→
 *   online→tail)라, 배열상 늦은 stage(loan-guide=idx44, franchise-application=idx26)에 신호가 생기면
 *   그 앞 *배열* 전체를 완료 처리 → 사장님 화면 "21·22단계 완료로 건너뜀".
 *
 * 수정: healCompletedAtChain 이 resolveNextStageIds 로 사용자 path 를 따라가며 path 상 furthest 신호
 *   이전 path stage 만 backfill. off-path / path-이후 stage 는 건드리지 않는다.
 */
import { describe, it, expect } from "vitest";
import {
  buildRoadmapState,
  starterRoadmap,
  starterTaskMap,
  healCompletedAtChain,
  traverseUserPath,
} from "@foundone/shared";

const ISO = "2026-01-01T00:00:00.000Z";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDec = any;

/** 음식 경로 + 대출 가이드 완료(신호)를 heal 에 통과시킨 결과 decisions. */
function healWithLoanGuideSignal(): AnyDec {
  const decisions: AnyDec = {
    "industry-selection": { stageId: "industry-selection", inputs: { categoryId: "food" }, completedAt: ISO },
    "loan-guide": { stageId: "loan-guide", completedAt: ISO },
  };
  return healCompletedAtChain(decisions, {} as AnyDec, starterRoadmap.stages as AnyDec).decisions;
}

describe("heal completedAt — path-aware (단계 점프 회귀 가드)", () => {
  it("loan-guide 가 배열상 늦어도(idx44) off-path·path-이후 단계를 완료 처리하지 않음", () => {
    const healed = healWithLoanGuideSignal();
    // franchise-application: 배열 idx 26 (< 44) 이지만 food path 아님 → 완료 처리 X (구버그=완료됨)
    expect(healed["franchise-application"]?.completedAt, "off-path franchise 단계 오완료").toBeFalsy();
    // menu-design: food path 상 loan-guide *다음* (배열 idx 31 < 44) → 완료 처리 X (구버그=완료됨)
    expect(healed["menu-design"]?.completedAt, "path-이후 menu-design 오완료").toBeFalsy();
  });

  it("food path 상 loan-guide 이전 단계는 chain backfill 됨 (정상)", () => {
    const healed = healWithLoanGuideSignal();
    for (const sid of ["contract-review", "construction-setup", "tax-guide"]) {
      expect(healed[sid]?.completedAt, `path-이전 ${sid} backfill 누락`).toBeTruthy();
    }
  });

  it("오완료 폭발 없음 — 배열 0..44 전부 완료(구버그) 재발 가드", () => {
    const healed = healWithLoanGuideSignal();
    const completedCount = Object.values(healed).filter((d: AnyDec) => d?.completedAt).length;
    // food path 의 loan-guide 까지 길이(~10) 수준이어야 함. 44 근처면 배열-순서 버그 재발.
    expect(completedCount, `완료 단계 수 ${completedCount} — path 길이 초과(배열 backfill 의심)`).toBeLessThan(20);
  });

  it("신호 없으면 heal 은 아무것도 바꾸지 않음 (fresh reset 보호)", () => {
    const decisions: AnyDec = {
      "industry-selection": { stageId: "industry-selection", inputs: { categoryId: "food" } },
    };
    const { healed } = healCompletedAtChain(decisions, {} as AnyDec, starterRoadmap.stages as AnyDec);
    expect(healed).toBe(false);
  });

  // ── 2026-06-23 근본 버그: "외부링크 갔다가 돌아오면 모두 완료 + 21단계 점프" ──
  //   path 말단(pre-launch-final)에 *약신호(완료 task 1개)* 가 stray 로 생기면, 종전엔 그게
  //   furthest *신호* 라 그 앞 0..19 전부 backfill → 모두 완료 + 마지막 단계 점프 + Supabase 저장
  //   영구 손상. 수정: chain backfill 은 강신호(completedAt)까지만, 약신호는 현재 stage 자기 완료만.
  it("말단 약신호(완료 task)는 chain 을 끌지 않음 — '모두 완료 + 21단계 점프' 가드", () => {
    const decisions: AnyDec = {
      "industry-selection": { stageId: "industry-selection", inputs: { categoryId: "food" }, completedAt: ISO },
      "loan-guide": { stageId: "loan-guide", completedAt: ISO },
    };
    // pre-launch-final(path 말단)에 stray 완료 task — 외부링크 복귀 등으로 생긴 단발 신호 가정.
    const tasks: AnyDec = { "pre-launch-final": [{ taskId: "t1", status: "completed" }] };
    const { decisions: healed } = healCompletedAtChain(decisions, tasks, starterRoadmap.stages as AnyDec);
    expect(healed["pre-launch-final"]?.completedAt, "stray 말단 약신호로 pre-launch-final 오완료").toBeFalsy();
    const count = Object.values(healed).filter((d: AnyDec) => d?.completedAt).length;
    expect(count, `완료 ${count} — 약신호 chain backfill 폭발(모두 완료 버그 재발)`).toBeLessThan(20);
  });

  // ── 2026-06-29 근본 원칙: "사용자가 '다음 단계로'를 누르기 전엔 절대 자동 advance 금지" ──
  //   (사장님 신고: 19단계 [운영·마케팅] → 누르지도 않았는데 [소프트오픈]으로 넘어감.)
  //   task 완료 ≠ 단계 통과. 약신호(완료 task)로는 *현재 진행 stage* 도 완료 처리하지 않는다.
  //   유실된 *통과 이력* 복구는 강신호(completedAt) chain backfill 만 담당.
  it("현재 진행 stage 의 약신호(완료 task)는 완료 처리 안 함 — '다음 단계' 전 자동 advance 금지", () => {
    // loan-guide 까지 강신호 → 현재 stage = menu-design. 거기 task 1개만 완료 토글한 상태(아직 미통과).
    const decisions: AnyDec = {
      "industry-selection": { stageId: "industry-selection", inputs: { categoryId: "food" }, completedAt: ISO },
      "loan-guide": { stageId: "loan-guide", completedAt: ISO },
    };
    const tasks: AnyDec = { "menu-design": [{ taskId: "t1", status: "completed" }] };
    const { decisions: healed } = healCompletedAtChain(decisions, tasks, starterRoadmap.stages as AnyDec);
    // 현재 stage(menu-design) 는 '다음 단계로'를 안 눌렀으니 completedAt 없어야 함(자동 advance 금지).
    expect(healed["menu-design"]?.completedAt, "약신호로 현재 stage 오완료 — 자동 advance 버그").toBeFalsy();
    // 그 다음 단계로도 당연히 번지면 안 됨.
    expect(healed["vendor-setup"]?.completedAt, "현재 stage 너머로 번짐").toBeFalsy();
  });

  // ── 2026-06-30: 19단계 [운영 및 마케팅 준비] → [소프트 오픈] 자동 이동 재발 가드 ──
  //   buildRoadmapState 가 required_tasks 완료를 곧바로 completed 로 취급하면, 저장/재로드/자동 task
  //   completion 경로에서 사용자가 "다음 단계로"를 누르지 않아도 currentStageId 가 pre-launch 로 이동한다.
  //   진행 이동의 유일한 근거는 completedAt(=명시적 다음 단계 버튼)이어야 한다.
  it("operations-setup 의 모든 task 가 완료돼도 completedAt 없으면 pre-launch 로 자동 advance 하지 않음", () => {
    const branchDecision = {
      "industry-selection": {
        stageId: "industry-selection",
        inputs: { categoryId: "food" },
        completedAt: ISO,
      },
    };
    const foodPath = traverseUserPath(starterRoadmap.stages, branchDecision as AnyDec, () => true)
      .map((stage) => stage.stageId);
    const opsIndex = foodPath.indexOf("operations-setup");
    expect(opsIndex).toBeGreaterThan(0);

    const decisions: AnyDec = { ...branchDecision };
    for (const stageId of foodPath.slice(0, opsIndex)) {
      decisions[stageId] = {
        ...(decisions[stageId] ?? { stageId }),
        stageId,
        completedAt: ISO,
      };
    }

    const tasks: AnyDec = {
      ...starterTaskMap,
      "operations-setup": starterTaskMap["operations-setup"].map((task) => ({
        ...task,
        status: "completed",
        completedAt: ISO,
      })),
    };

    const roadmapBeforeButton = buildRoadmapState(
      { roadmapId: starterRoadmap.roadmapId, templateId: starterRoadmap.templateId, stages: starterRoadmap.stages },
      decisions,
      tasks,
    );
    expect(roadmapBeforeButton.currentStageId).toBe("operations-setup");
    expect(roadmapBeforeButton.completedStageIds).not.toContain("operations-setup");

    const roadmapAfterButton = buildRoadmapState(
      { roadmapId: starterRoadmap.roadmapId, templateId: starterRoadmap.templateId, stages: starterRoadmap.stages },
      {
        ...decisions,
        "operations-setup": { stageId: "operations-setup", completedAt: ISO },
      },
      tasks,
    );
    expect(roadmapAfterButton.currentStageId).toBe("pre-launch");
    expect(roadmapAfterButton.completedStageIds).toContain("operations-setup");
  });
});
