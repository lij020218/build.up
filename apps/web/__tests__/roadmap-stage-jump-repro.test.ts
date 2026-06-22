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
import { starterRoadmap, healCompletedAtChain } from "@foundone/shared";

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
});
