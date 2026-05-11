import { describe, expect, it } from "vitest";
import {
  getMatchedProgramsV2,
  getRecommendedPrograms,
  type MatchCriteria,
} from "../startup-programs";

describe("지원사업 점수 클램프 (사장님 신고 2026-05-11: 102점 같은 점수 없도록)", () => {
  it("matchScore 는 모든 프로그램에서 0-100 범위 내", () => {
    // 가산점이 *최대* 누적되는 위기 조건 — 모든 부스트가 발동.
    const crisisCriteria: MatchCriteria = {
      startupType: "independent",
      industryCategoryId: "food",
      age: 25, // 청년
      businessYears: 0, // 막 시작
      region: "서울",
      monthlyAvgRevenue: 5_000_000, // 영세
      hasUserSales: true,
      runwayMonths: 2, // 긴급 위기
      weeklySalesChangePct: -30, // 매출 폭락
      employeesCount: 1,
      ncbScore: 800, // 신용취약 자격
      consideringClosure: true, // 폐업 검토
      salesDeclinePct: 30,
      isDisabledOwner: true, // 장애인
    };
    const matched = getMatchedProgramsV2(crisisCriteria);
    expect(matched.length).toBeGreaterThan(0);
    for (const p of matched) {
      expect(p.matchScore).toBeGreaterThanOrEqual(0);
      expect(p.matchScore).toBeLessThanOrEqual(100);
      expect(p.personalFitScore).toBeGreaterThanOrEqual(0);
      expect(p.personalFitScore).toBeLessThanOrEqual(100);
    }
  });

  it("부스트 거의 없는 평범한 사용자도 0-100 범위", () => {
    const ordinaryCriteria: MatchCriteria = {
      startupType: "independent",
      industryCategoryId: "retail",
      businessYears: 5,
      monthlyAvgRevenue: 30_000_000,
      hasUserSales: true,
      runwayMonths: 24,
      weeklySalesChangePct: 5,
      employeesCount: 2,
    };
    const matched = getMatchedProgramsV2(ordinaryCriteria);
    for (const p of matched) {
      expect(p.matchScore).toBeGreaterThanOrEqual(0);
      expect(p.matchScore).toBeLessThanOrEqual(100);
    }
  });

  it("getRecommendedPrograms — 상위 추천 결과도 0-100 범위", () => {
    const criteria: MatchCriteria = {
      startupType: "independent",
      industryCategoryId: "food",
      age: 30,
      businessYears: 2,
      monthlyAvgRevenue: 10_000_000,
      hasUserSales: true,
      employeesCount: 2,
      ncbScore: 750,
      consideringClosure: false,
    };
    const recommended = getRecommendedPrograms(criteria, 6);
    expect(recommended.length).toBeGreaterThan(0);
    for (const p of recommended) {
      expect(p.matchScore).toBeGreaterThanOrEqual(0);
      expect(p.matchScore).toBeLessThanOrEqual(100);
      expect(p.personalFitScore).toBeGreaterThanOrEqual(0);
      expect(p.personalFitScore).toBeLessThanOrEqual(100);
    }
  });

  it("점수 정수 (소수점·NaN 없음)", () => {
    const matched = getMatchedProgramsV2({
      industryCategoryId: "food",
      businessYears: 1,
      monthlyAvgRevenue: 5_000_000,
    });
    for (const p of matched) {
      expect(Number.isInteger(p.matchScore)).toBe(true);
      expect(Number.isInteger(p.personalFitScore)).toBe(true);
      expect(Number.isFinite(p.matchScore)).toBe(true);
    }
  });

  it("eligibility=false 인 프로그램도 점수 0-100 (이벤트는 정렬 맨 뒤)", () => {
    // 자격 미달이 강제되는 케이스 — businessYearRange 초과
    const matched = getMatchedProgramsV2({
      industryCategoryId: "food",
      businessYears: 30, // 매우 오래된 사업 — 청년 자금 자격 미달
      age: 60,
      monthlyAvgRevenue: 5_000_000,
    });
    const ineligible = matched.filter((p) => !p.eligible);
    for (const p of ineligible) {
      expect(p.matchScore).toBeGreaterThanOrEqual(0);
      expect(p.matchScore).toBeLessThanOrEqual(100);
    }
  });
});
