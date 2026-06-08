/**
 * 창업 로드맵 음식(offline) 경로 순서 회귀 가드 (2026-06-08).
 *   웹 자료조사 결과: 임대차계약 → 인테리어/공사 → 영업신고 → 사업자등록 → 통장/세무/자금 → …
 *   (이전 "사업자등록 먼저" 는 오류였음 — 주민번호 세금계산서로 부가세 환급 가능)
 *   traverseUserPath 로 실제 navigation 순서를 검증한다.
 */
import { describe, it, expect } from "vitest";
import { starterRoadmap, traverseUserPath } from "@foundone/shared";
import { makeIsPathStage } from "../app/lib/utils/path-filter";

function foodPathIds(): string[] {
  const isPathStage = makeIsPathStage({
    industryCategoryId: "food",
    selectedIndustryId: undefined,
    startupType: undefined,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decisions = {
    "industry-selection": { stageId: "industry-selection", inputs: { categoryId: "food" } },
  } as unknown as Parameters<typeof traverseUserPath>[1];
  return traverseUserPath(starterRoadmap.stages, decisions, isPathStage).map((s) => s.stageId);
}

describe("로드맵 음식 경로 — 인테리어 우선 (2026-06-08 정정)", () => {
  const path = foodPathIds();

  it("계약 전 검토(contract-review) 바로 다음은 인테리어(construction-setup)", () => {
    const i = path.indexOf("contract-review");
    expect(i).toBeGreaterThanOrEqual(0);
    expect(path[i + 1]).toBe("construction-setup");
  });

  it("인테리어가 사업자등록(registration-setup)보다 먼저", () => {
    expect(path.indexOf("construction-setup")).toBeLessThan(path.indexOf("registration-setup"));
  });

  it("핵심 단계 누락 없음(경로에 모두 포함)", () => {
    for (const id of [
      "contract-review", "construction-setup", "registration-setup",
      "biz-registration", "tax-guide", "loan-guide",
      "menu-design", "vendor-setup", "pre-launch-final",
    ]) {
      expect(path, `누락: ${id}`).toContain(id);
    }
  });

  it("순서: 인테리어→사업자등록→통장→세무→자금→메뉴 (단조 증가)", () => {
    const order = ["construction-setup", "registration-setup", "biz-registration", "tax-guide", "loan-guide", "menu-design"];
    const idxs = order.map((id) => path.indexOf(id));
    expect(idxs.every((v) => v >= 0)).toBe(true);
    for (let k = 1; k < idxs.length; k++) {
      expect(idxs[k], `${order[k]} 가 ${order[k - 1]} 보다 앞`).toBeGreaterThan(idxs[k - 1]);
    }
  });

  it("계약검토→인테리어 사이에 단계 점프 없음(바로 인접)", () => {
    // pathStepNumber 점프 버그 회귀 가드: 두 단계 인덱스 차이 = 1
    expect(path.indexOf("construction-setup") - path.indexOf("contract-review")).toBe(1);
  });
});
