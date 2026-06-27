import { describe, it, expect } from "vitest";
import {
  getSoftOpenContent,
  getSoftOpenDayChecks,
  getSoftOpenArchetype,
} from "../stages/content/pre-launch";

// 2026-06-27 사장님 신고: 소프트오픈 내용이 업종과 안 맞음(셀프 빨래방인데 식자재·손님초대).
describe("소프트 오픈 업종 맞춤 콘텐츠", () => {
  // 사장님 신고의 핵심 = '식자재'(빨래방에 부적합). '메뉴'는 무인 키오스크 맥락에선 정상이라 제외.
  const hasFood = (s: string) => /식자재|시식|조리법|식재료/.test(s);

  it("self-laundry 는 unmanned 아키타입 — '시범 운영', 식자재 없음", () => {
    expect(getSoftOpenArchetype("self-laundry", "living-service")).toBe("unmanned");
    const c = getSoftOpenContent("self-laundry", "living-service");
    // page1 라벨이 '손님 초대'가 아님(무인 시범운영)
    expect(c.page1Label.ko).not.toContain("손님 초대");
    // 본오픈 준비에 식자재·메뉴 없음
    const finalText = c.finalPrep.map((f) => f.label.ko + f.detail.ko).join(" ");
    expect(hasFood(finalText)).toBe(false);
    // 체험 대상도 '식자재' 무관
    expect(c.trialTypes.length).toBeGreaterThan(0);
  });

  it("self-laundry 당일 점검은 세탁기·세제 등 — 식자재 아님", () => {
    const checks = getSoftOpenDayChecks("self-laundry");
    expect(checks.length).toBeGreaterThan(0);
    const text = checks.map((c) => c.label.ko).join(" ");
    expect(hasFood(text)).toBe(false);
    expect(/세탁|건조|세제|결제|청결|CCTV/.test(text)).toBe(true);
    // 완료판정 ID 계약 유지(기존 meta ID)
    expect(checks.map((c) => c.id)).toContain("day-machine-test");
  });

  it("food(korean-casual)는 dine-in — 식자재·메뉴 정상 포함", () => {
    expect(getSoftOpenArchetype("korean-casual", "food")).toBe("dine-in");
    const c = getSoftOpenContent("korean-casual", "food");
    expect(c.page1Label.ko).toContain("손님");
  });

  it("모든 아키타입 콘텐츠 구조 완비(빈 배열 없음)", () => {
    for (const sub of ["self-laundry", "hair-salon", "yoga-studio", "kids-academy", "convenience-small", "pet-grooming", "shared-office"]) {
      const c = getSoftOpenContent(sub, null);
      expect(c.trialTypes.length).toBeGreaterThan(0);
      expect(c.page1Steps.length).toBeGreaterThan(0);
      expect(c.feedbackAxes.length).toBeGreaterThan(0);
      expect(c.finalPrep.length).toBeGreaterThan(0);
    }
  });
});
