/**
 * 인플루언서 디렉토리 SSOT 가드 (2026-08-05).
 *  불변식: ① 참여율이 있으면 출처 URL 필수 (수치 위조 차단) ② 핸들 유일
 *  ③ 업종은 정의된 5종만 ④ 팔로워 양수. 항목 수는 사장님 큐레이션이라 고정하지 않는다.
 */
import { describe, it, expect } from "vitest";
import {
  INFLUENCER_DIRECTORY,
  influencersForCategory,
  influencerProfileUrl,
  sortInfluencersForBudget,
  TIER_BUDGET_FLOOR_WON,
} from "@foundone/shared";

describe("influencer-directory SSOT", () => {
  it("참여율이 있으면 출처 URL 이 반드시 있다 (위조 차단 게이트)", () => {
    for (const i of INFLUENCER_DIRECTORY) {
      if (i.engagementRatePct != null) {
        expect(i.statsSourceUrl, `${i.handle} 출처 누락`).toBeTruthy();
        expect(i.statsSourceUrl!.startsWith("http"), i.handle).toBe(true);
        expect(i.engagementRatePct).toBeGreaterThan(0);
        expect(i.engagementRatePct).toBeLessThan(50); // 비상식 수치(스토리파이 46% 사고) 차단
      }
    }
  });

  it("핸들 유일 + 팔로워 양수 + 정의된 업종만", () => {
    const seen = new Set<string>();
    for (const i of INFLUENCER_DIRECTORY) {
      expect(seen.has(i.handle), `중복 핸들 ${i.handle}`).toBe(false);
      seen.add(i.handle);
      expect(i.followers, i.handle).toBeGreaterThan(0);
      expect(["food", "cafe-dessert", "beauty", "fitness", "space", "pet", "retail", "education", "travel", "fashion"]).toContain(i.categoryId);
    }
  });

  it("업종 필터 — 미정의 업종·null 은 빈 배열 (억지 매칭 금지)", () => {
    expect(influencersForCategory("online-digital")).toEqual([]);
    expect(influencersForCategory(null)).toEqual([]);
    expect(influencersForCategory("food").length).toBeGreaterThan(0);
  });

  it("확장 매핑 — 숙박(space)엔 여행 계정, 소매(retail)엔 패션 계정이 함께 나온다 (2026-08-07)", () => {
    const space = influencersForCategory("space");
    expect(space.some((i) => i.categoryId === "travel")).toBe(true);
    expect(space.some((i) => i.categoryId === "space")).toBe(true);
    const retail = influencersForCategory("retail");
    expect(retail.some((i) => i.categoryId === "fashion")).toBe(true);
    // travel·fashion 은 장르지 업종 id 가 아니다 — 다른 업종에 새지 않는다
    expect(influencersForCategory("food").every((i) => i.categoryId === "food")).toBe(true);
  });

  it("예산 맞춤 정렬 — 예산 내 등급 먼저, 초과는 뒤로(제외 아님), 등급 하한은 시세표 조합", () => {
    const sample = [
      { handle: "macro1", followers: 2_000_000 },
      { handle: "nano1", followers: 8_000 },
      { handle: "micro1", followers: 30_000 },
    ];
    // 예산 10만원: nano(0)·micro(5만) 는 예산 내, macro(500만) 는 초과 → 맨 뒤
    const sorted = sortInfluencersForBudget(sample, 100_000);
    expect(sorted.map((i) => i.handle)).toEqual(["micro1", "nano1", "macro1"]);
    expect(sorted.map((i) => i.withinBudget)).toEqual([true, true, false]);
    // 예산 0원: 나노만 예산 내 (budgetAdvice "0원이어도 나노 협찬형 가능" 과 동일 논리)
    expect(sortInfluencersForBudget(sample, 0).map((i) => i.withinBudget)).toEqual([true, false, false]);
    expect(TIER_BUDGET_FLOOR_WON).toEqual({ nano: 0, micro: 50_000, mid: 1_000_000, macro: 5_000_000 });
  });

  it("2차 목록 — 신규 항목은 ER 미확보(null) 로 정직 표기, 위조된 ER 없음", () => {
    const travel = INFLUENCER_DIRECTORY.filter((i) => i.categoryId === "travel");
    const fashion = INFLUENCER_DIRECTORY.filter((i) => i.categoryId === "fashion");
    expect(travel.length).toBeGreaterThanOrEqual(10);
    expect(fashion.length).toBeGreaterThanOrEqual(15);
    for (const i of [...travel, ...fashion]) expect(i.engagementRatePct, i.handle).toBeNull();
    // 한국관광공사 공식 계정은 협찬 대상이 아니므로 제외 유지
    expect(INFLUENCER_DIRECTORY.some((i) => i.handle === "kto9suk9suk")).toBe(false);
  });

  it("프로필 URL 은 플랫폼 공식 도메인", () => {
    expect(influencerProfileUrl({ handle: "ry.hyun", platform: "instagram" })).toBe("https://instagram.com/ry.hyun");
    expect(influencerProfileUrl({ handle: "somechannel", platform: "youtube" })).toBe("https://www.youtube.com/@somechannel");
  });
});
