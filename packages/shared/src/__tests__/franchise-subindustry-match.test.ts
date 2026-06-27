import { describe, it, expect } from "vitest";
import {
  getFranchiseBrandsForSubIndustry,
  expandSubIndustryGroup,
  classifySubIndustriesByName,
} from "../franchise-data";

// 2026-06-27 회귀 — 사장님 신고: "스터디카페 골랐는데 눈높이·구몬(아동교육)이 뜬다"
//  세부업종 매칭이 동의어 그룹 + 공정위 분류 + 카테고리 오염 폴백 제거로 정확해야 함.
describe("프랜차이즈 세부업종 매칭", () => {
  const studyKeywords = (n: string) => /스터디|독서실/.test(n);
  const isEducationLeaflet = (n: string) =>
    ["눈높이", "구몬", "윤선생", "재능", "빨간펜"].some((k) => n.includes(k));

  it("study-room 동의어 그룹은 study-cafe-space 를 포함", () => {
    const g = expandSubIndustryGroup("study-room");
    expect(g).toContain("study-cafe-space");
    expect(g).toContain("study-room");
  });

  for (const id of ["study-room", "study-cafe-space", "small-study-room"]) {
    it(`'${id}' 선택 시 스터디카페 브랜드가 뜨고 학습지(눈높이·구몬)는 안 뜬다`, () => {
      const brands = getFranchiseBrandsForSubIndustry(id);
      expect(brands.length).toBeGreaterThan(0);
      // 실제 스터디카페 브랜드가 포함 (작심·토즈·하우스터디 중 하나라도)
      const names = brands.map((b) => b.name.ko);
      expect(names.some((n) => studyKeywords(n) || n.includes("작심") || n.includes("토즈"))).toBe(true);
      // 학습지·아동교육 브랜드는 절대 포함 안 됨 (오염 폴백 제거 검증)
      expect(names.some(isEducationLeaflet)).toBe(false);
      // 반환된 모든 브랜드는 study 그룹 세부업종을 실제로 보유 (카테고리 오염 0)
      const group = new Set(expandSubIndustryGroup(id));
      expect(brands.every((b) => b.subIndustryIds.some((s) => group.has(s)))).toBe(true);
    });
  }

  it("chicken-burger 는 치킨 브랜드만 — 한식·커피 섞이지 않음", () => {
    const brands = getFranchiseBrandsForSubIndustry("chicken-burger");
    expect(brands.length).toBeGreaterThan(0);
    expect(brands.every((b) => b.subIndustryIds.includes("chicken-burger"))).toBe(true);
  });

  // 2026-06-27 기존 브랜드 오분류 교정 회귀 가드
  it("피자 브랜드는 western-pasta-brunch — 치킨에 섞이지 않음", () => {
    const chicken = getFranchiseBrandsForSubIndustry("chicken-burger").map((b) => b.name.ko);
    const western = getFranchiseBrandsForSubIndustry("western-pasta-brunch").map((b) => b.name.ko);
    for (const pizza of ["도미노피자", "피자헛", "미스터피자"]) {
      expect(chicken).not.toContain(pizza);
      expect(western).toContain(pizza);
    }
  });

  it("안경 브랜드는 fashion-accessories 에 노출 (전용 세부 복구)", () => {
    const brands = getFranchiseBrandsForSubIndustry("fashion-accessories");
    expect(brands.some((b) => b.name.ko.includes("안경"))).toBe(true);
  });

  it("어학원은 language-academy (kids-academy 아님)", () => {
    const lang = getFranchiseBrandsForSubIndustry("language-academy").map((b) => b.name.ko);
    expect(lang).toContain("정상어학원");
  });

  it("상한(limit) 으로 인기 세부업종도 선택 UI 범람 안 함", () => {
    const brands = getFranchiseBrandsForSubIndustry("korean-casual");
    expect(brands.length).toBeLessThanOrEqual(60);
    // 검증된 큐레이션 브랜드가 상위에 위치 (정렬: costVerified 우선)
    expect(brands[0]?.costVerified).toBe(true);
  });

  describe("이름 기반 분류기 — 오탐 0", () => {
    it("스터디카페·독서실 이름은 study-cafe-space 로 분류", () => {
      expect(classifySubIndustriesByName("르하임스터디카페")).toContain("study-cafe-space");
      expect(classifySubIndustriesByName("하우스터디")).toContain("study-cafe-space");
      expect(classifySubIndustriesByName("○○독서실")).toContain("study-cafe-space");
    });
    it("학습지·학원(교육)은 study-cafe 로 오분류하지 않음", () => {
      expect(classifySubIndustriesByName("눈높이")).toEqual([]);
      expect(classifySubIndustriesByName("구몬")).toEqual([]);
      expect(classifySubIndustriesByName("뉴스터디교육")).toEqual([]); // '교육' 가드
      expect(classifySubIndustriesByName("메가스터디학원")).toEqual([]); // '학원' 가드
    });
  });
});
