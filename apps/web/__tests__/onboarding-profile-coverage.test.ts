import { describe, it, expect } from "vitest";
import {
  ONBOARDING_CATEGORY_PROFILES,
  resolveOnboardingProfile,
} from "../../../packages/shared/src/onboarding-profile";
import { CATEGORY_OFFERING_FALLBACK } from "../../../packages/shared/src/offering-kinds";

/**
 * 온보딩 업종 분기 전수 가드 (2026-07-28 사장님 지시) —
 *   "SaaS 기획자에게 프랜차이즈형·쿠팡이츠를 물으면 웃긴다."
 *
 *  1) 커버리지: offering-kinds 의 카테고리 정본과 1:1 — 새 업종 추가 시 프로파일 누락을 CI 가 잡음
 *  2) 오분기 금지: 스타트업·온라인에 프랜차이즈/영업시간 질문이 존재하면 실패
 *  3) 용어: 스타트업은 "회사"·"팀", 온라인은 "스토어" — 오프라인 용어 누출 금지
 */

describe("onboarding-profile: 커버리지", () => {
  it("카테고리 정본(CATEGORY_OFFERING_FALLBACK) 전체에 프로파일이 있다", () => {
    const canonical = Object.keys(CATEGORY_OFFERING_FALLBACK);
    const missing = canonical.filter((c) => !(c in ONBOARDING_CATEGORY_PROFILES));
    expect(missing, `프로파일 누락 카테고리: ${missing.join(", ")}`).toEqual([]);
  });

  it("프로파일에만 있는 유령 카테고리가 없다", () => {
    const canonical = new Set(Object.keys(CATEGORY_OFFERING_FALLBACK));
    const ghosts = Object.keys(ONBOARDING_CATEGORY_PROFILES).filter((c) => !canonical.has(c));
    expect(ghosts, `정본에 없는 카테고리: ${ghosts.join(", ")}`).toEqual([]);
  });
});

describe("onboarding-profile: 오분기 금지", () => {
  it("기술 스타트업 — 프랜차이즈·영업시간 질문 부재, 회사·팀 용어, 지표 연동", () => {
    const p = resolveOnboardingProfile("startup-tech");
    expect(p.asks.franchise).toBe(false);
    expect(p.asks.businessHours).toBe(false);
    expect(p.placeNoun.ko).toBe("회사");
    expect(p.teamLabel.ko).toContain("팀");
    expect(p.revenueSyncCta).toBe("saas-metrics");
    expect(p.ownerTitle.ko).toBe("대표님"); // "사장님" 호칭 누출 금지
    expect(p.secondBandLabel.ko).toBe("공동창업자와"); // "가족과" 누출 금지
  });

  it("온라인/디지털 — 프랜차이즈·영업시간 질문 부재, 스토어 용어, 커머스 연동", () => {
    const p = resolveOnboardingProfile("online-digital");
    expect(p.asks.franchise).toBe(false);
    expect(p.asks.businessHours).toBe(false);
    expect(p.placeNoun.ko).toBe("스토어");
    expect(p.revenueSyncCta).toBe("ecommerce-csv");
  });

  it("오프라인 전 업종 — 주소 필수 + POS 연동 + 영업시간 질문", () => {
    for (const cat of ["food", "cafe-dessert", "retail", "beauty", "fitness", "education", "pet", "living-service", "space"]) {
      const p = resolveOnboardingProfile(cat);
      expect(p.asks.address, `${cat} 주소`).toBe("required");
      expect(p.asks.businessHours, `${cat} 영업시간`).toBe(true);
      expect(p.revenueSyncCta, `${cat} 연동`).toBe("pos");
    }
  });

  it("미지 카테고리 폴백 — 질문을 빼먹기보다 넉넉히 묻는 오프라인 기본형", () => {
    const p = resolveOnboardingProfile("unknown-future-category");
    expect(p.asks.address).toBe("required");
    expect(p.placeNoun.ko).toBe("가게");
  });
});
