import { describe, it, expect } from "vitest";
import {
  starterIndustryOptions,
  SUB_INDUSTRY_OFFERING,
  CATEGORY_OFFERING_FALLBACK,
  OFFERING_KIND_META,
  resolveOfferingKind,
} from "@foundone/shared";

/**
 * 오퍼링 분류 전수 커버리지 가드 (2026-07-25) — wipe 커버리지 가드와 같은 방식.
 *
 * 세부업종을 추가하면 반드시 SUB_INDUSTRY_OFFERING 에 분류를 넣게 강제한다.
 * 누락되면 "재고 없는 업종에 재고 화면" 같은 업종 미스매치가 조용히 생기기 때문.
 */

describe("offering-kinds 전수 커버리지", () => {
  const optionIds = starterIndustryOptions.map((o) => o.id);

  it("가드 sanity — 세부업종 목록을 실제로 읽었다", () => {
    expect(optionIds.length).toBeGreaterThanOrEqual(60);
  });

  it("모든 세부업종이 오퍼링 분류를 갖는다 (누락 = 업종 미스매치 사고)", () => {
    const missing = optionIds.filter((id) => !SUB_INDUSTRY_OFFERING[id]);
    expect(
      missing,
      `분류 누락 세부업종 → offering-kinds.ts SUB_INDUSTRY_OFFERING 에 추가하세요: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("분류에 유령 세부업종이 없다 (오타·삭제된 업종 잔재 방지)", () => {
    const known = new Set(optionIds);
    const ghosts = Object.keys(SUB_INDUSTRY_OFFERING).filter((id) => !known.has(id));
    expect(ghosts, `starterIndustryOptions 에 없는 id: ${ghosts.join(", ")}`).toEqual([]);
  });

  it("hidden 이 아닌 모든 유형에 메타(탭 라벨·섹션 정의)가 있다", () => {
    const kinds = new Set(
      Object.values(SUB_INDUSTRY_OFFERING).map((v) => v.kind).filter((k) => k !== "hidden"),
    );
    for (const k of kinds) {
      expect(OFFERING_KIND_META[k as keyof typeof OFFERING_KIND_META], `메타 누락: ${k}`).toBeTruthy();
    }
  });

  it("대분류 폴백이 11개 카테고리를 모두 덮는다", () => {
    expect(Object.keys(CATEGORY_OFFERING_FALLBACK).sort()).toEqual([
      "beauty", "cafe-dessert", "education", "fitness", "food", "living-service",
      "online-digital", "pet", "retail", "space", "startup-tech",
    ]);
  });

  it("사장님 확정 경계 4건이 결정대로 고정돼 있다 (회귀 방지)", () => {
    expect(resolveOfferingKind("study-cafe-space", "space")).toBe("membership"); // 권종별 판매 수 중심
    expect(resolveOfferingKind("shared-office", "space")).toBe("membership");
    expect(resolveOfferingKind("pet-hotel", "pet")).toBe("space-booking");
    expect(resolveOfferingKind("pet-cafe", "pet")).toBe("menu-bom");
  });

  it("정직성 가드 — 원가율 자동계산은 재료 BOM 이 실재하는 menu-bom 만", () => {
    for (const [kind, meta] of Object.entries(OFFERING_KIND_META)) {
      if (kind !== "menu-bom") {
        expect(meta.showCostRatio, `${kind} 에 원가율 자동계산 노출은 위조 위험`).toBe(false);
      }
    }
  });
});
