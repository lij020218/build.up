/**
 * 로드맵 그래프 불변식 — *모든 업종 경로* 회귀 가드 (2026-06-08).
 *   이전 "최종 점검"이 못 잡은 버그 부류(순서 점프·사이클·고아단계·조기종료)를
 *   traverseUserPath 시뮬레이션으로 전 카테고리 검증한다.
 *   하나라도 깨지면 = 새 버그.
 */
import { describe, it, expect } from "vitest";
import { starterRoadmap, traverseUserPath } from "@foundone/shared";
import { makeIsPathStage } from "../app/lib/utils/path-filter";

const OFFLINE = ["food", "cafe-dessert", "retail", "beauty", "fitness", "education", "pet", "living-service", "space"];
const ONLINE = ["online-digital"];

function pathIds(categoryId: string, startupType?: string): string[] {
  const isPathStage = makeIsPathStage({ industryCategoryId: categoryId, selectedIndustryId: undefined, startupType });
  const decisions = {
    "industry-selection": { stageId: "industry-selection", inputs: { categoryId } },
    ...(startupType ? { "startup-type": { stageId: "startup-type", inputs: { startupType } } } : {}),
  } as unknown as Parameters<typeof traverseUserPath>[1];
  return traverseUserPath(starterRoadmap.stages, decisions, isPathStage).map((s) => s.stageId);
}

function assertWellFormed(path: string[], label: string) {
  // 1. 비어있지 않음
  expect(path.length, `${label}: 빈 경로`).toBeGreaterThan(8);
  // 2. 중복 없음(사이클 재진입 = traverseUserPath visited 가 끊은 흔적)
  expect(new Set(path).size, `${label}: 중복 단계(사이클 의심) — ${path.join(" → ")}`).toBe(path.length);
  // 3. 종료 단계 도달(조기 truncation 방지)
  expect(path[path.length - 1], `${label}: 종료 단계가 pre-launch-final 아님 — 끝: ${path[path.length - 1]}`).toBe("pre-launch-final");
}

describe("로드맵 불변식 — 전 카테고리", () => {
  for (const cat of OFFLINE) {
    it(`[offline:${cat}] 경로 well-formed + 계약검토→인테리어 인접 + 사업자등록 포함`, () => {
      const path = pathIds(cat);
      assertWellFormed(path, `offline:${cat}`);
      // 오프라인은 인테리어가 계약검토 직후(이번 정정의 핵심 불변식)
      const ci = path.indexOf("contract-review");
      if (ci >= 0) {
        expect(path[ci + 1], `offline:${cat}: 계약검토 다음이 인테리어 아님 — ${path[ci + 1]}`).toBe("construction-setup");
      }
      // 사업자등록/통장은 반드시 경로에 있어야(고아 방지)
      expect(path, `offline:${cat}: registration-setup 누락`).toContain("registration-setup");
      expect(path, `offline:${cat}: biz-registration 누락`).toContain("biz-registration");
    });
  }

  for (const cat of ONLINE) {
    it(`[online:${cat}] 경로 well-formed + biz-registration 포함`, () => {
      const path = pathIds(cat);
      assertWellFormed(path, `online:${cat}`);
      expect(path, `online:${cat}: biz-registration 누락`).toContain("biz-registration");
    });
  }

  it("[startup-tech] 경로 비어있지 않음 + 중복 없음 (truncation/사이클 가드)", () => {
    const path = pathIds("startup-tech", "b2b-saas");
    expect(path.length).toBeGreaterThan(8);
    expect(new Set(path).size, `startup: 중복(사이클) — ${path.join(" → ")}`).toBe(path.length);
  });

  it("모든 오프라인 경로는 동일한 backbone 순서를 가진다 (카테고리 간 일관성)", () => {
    // food 기준 backbone 의 상대 순서가 다른 오프라인 카테고리에서도 보존되는지
    const order = ["contract-review", "construction-setup", "registration-setup", "biz-registration"];
    for (const cat of OFFLINE) {
      const path = pathIds(cat);
      const idxs = order.map((id) => path.indexOf(id)).filter((i) => i >= 0);
      for (let k = 1; k < idxs.length; k++) {
        expect(idxs[k], `offline:${cat}: backbone 순서 깨짐 (${order[k]})`).toBeGreaterThan(idxs[k - 1]);
      }
    }
  });
});
