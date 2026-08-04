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
      expect(["food", "cafe-dessert", "beauty", "fitness", "space"]).toContain(i.categoryId);
    }
  });

  it("업종 필터 — 미정의 업종·null 은 빈 배열 (억지 매칭 금지)", () => {
    expect(influencersForCategory("education")).toEqual([]);
    expect(influencersForCategory(null)).toEqual([]);
    expect(influencersForCategory("food").length).toBeGreaterThan(0);
  });

  it("프로필 URL 은 인스타 공식 도메인", () => {
    expect(influencerProfileUrl({ handle: "ry.hyun" })).toBe("https://instagram.com/ry.hyun");
  });
});
