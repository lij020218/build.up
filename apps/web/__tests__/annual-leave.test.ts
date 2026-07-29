import { describe, it, expect } from "vitest";
import {
  calcAnnualLeave,
  statutoryDaysForYears,
  usedLeaveDays,
  remainingLeaveDays,
  leaveYearRange,
} from "../../../packages/shared/src/team/annual-leave";

/**
 * 연차 산정 가드 — 근로기준법 제60조 (2026-07-28).
 *  수치를 코드에 박았으므로 조문이 바뀌지 않는 한 이 값들이 흔들리면 안 된다.
 *  특히 5인 미만 적용제외(제11조)는 사장님 질문의 핵심 — 법정 의무를 없는데 있다고 하면 안 됨.
 */

const TODAY = new Date("2026-07-28");
const staff5 = { basis: "hire_date" as const, headcount: 5, today: TODAY };

describe("statutoryDaysForYears — 제60조 ①④", () => {
  it("1년 미만은 0 (별도 계산: 월 1일)", () => {
    expect(statutoryDaysForYears(0)).toBe(0);
  });

  it("1~2년차는 15일", () => {
    expect(statutoryDaysForYears(1)).toBe(15);
    expect(statutoryDaysForYears(2)).toBe(15);
  });

  it("3년차부터 매 2년 1일 가산 — 3년 16일, 5년 17일, 7년 18일", () => {
    expect(statutoryDaysForYears(3)).toBe(16);
    expect(statutoryDaysForYears(4)).toBe(16);
    expect(statutoryDaysForYears(5)).toBe(17);
    expect(statutoryDaysForYears(7)).toBe(18);
  });

  it("25일 상한 — 21년차 25일, 그 이후도 25일", () => {
    expect(statutoryDaysForYears(21)).toBe(25);
    expect(statutoryDaysForYears(30)).toBe(25);
    expect(statutoryDaysForYears(50)).toBe(25);
  });
});

describe("calcAnnualLeave — 5인 기준선 (제11조)", () => {
  it("🔴 5인 미만이면 법정 연차 없음 — days 0 + 약정 우선 안내", () => {
    const r = calcAnnualLeave("2020-01-01", { basis: "hire_date", headcount: 4, today: TODAY });
    expect(r.statutory).toBe(false);
    expect(r.days).toBe(0);
    expect(r.basisNote.ko).toContain("5인 미만");
    expect(r.basisNote.ko).toContain("근로계약서"); // 약정이 있으면 지켜야 함을 안내
  });

  it("5인 이상이면 법정 적용", () => {
    const r = calcAnnualLeave("2020-01-01", { ...staff5 });
    expect(r.statutory).toBe(true);
    expect(r.days).toBeGreaterThan(0);
  });
});

describe("calcAnnualLeave — 근속별 일수", () => {
  it("입사 3개월 → 3일 (1개월 개근당 1일, 제60조 ②)", () => {
    const r = calcAnnualLeave("2026-04-28", { ...staff5 });
    expect(r.monthsWorked).toBe(3);
    expect(r.days).toBe(3);
  });

  it("1년 미만은 11일이 상한", () => {
    const r = calcAnnualLeave("2025-08-01", { ...staff5 }); // 약 11.9개월
    expect(r.yearsWorked).toBe(0);
    expect(r.days).toBeLessThanOrEqual(11);
  });

  it("입사 1년 → 15일", () => {
    const r = calcAnnualLeave("2025-07-28", { ...staff5 });
    expect(r.yearsWorked).toBe(1);
    expect(r.days).toBe(15);
  });

  it("입사 3년 → 16일 (가산 시작)", () => {
    const r = calcAnnualLeave("2023-07-28", { ...staff5 });
    expect(r.yearsWorked).toBe(3);
    expect(r.days).toBe(16);
  });

  it("입사일 없으면 계산 불가 — 0일 + 입력 유도", () => {
    const r = calcAnnualLeave(null, { ...staff5 });
    expect(r.days).toBe(0);
    expect(r.basisNote.ko).toContain("입사일");
  });

  it("항상 예상치로 표기 — 출근율 80% 를 앱이 모름", () => {
    expect(calcAnnualLeave("2020-01-01", { ...staff5 }).isEstimate).toBe(true);
  });
});

describe("usedLeaveDays — 승인된 것만, 반차 0.5", () => {
  it("승인 연차 3일 + 반차 1건 = 3.5일", () => {
    const used = usedLeaveDays([
      { leave_type: "annual", start_date: "2026-07-01", end_date: "2026-07-03", status: "approved" },
      { leave_type: "half", start_date: "2026-07-10", end_date: "2026-07-10", status: "approved" },
    ]);
    expect(used).toBe(3.5);
  });

  it("🔴 승인 대기·반려는 사용으로 치지 않는다 (확정된 것만)", () => {
    const used = usedLeaveDays([
      { leave_type: "annual", start_date: "2026-07-01", end_date: "2026-07-05", status: "pending" },
      { leave_type: "annual", start_date: "2026-07-10", end_date: "2026-07-12", status: "rejected" },
    ]);
    expect(used).toBe(0);
  });

  it("병가·기타는 연차 차감 대상 아님", () => {
    const used = usedLeaveDays([
      { leave_type: "sick", start_date: "2026-07-01", end_date: "2026-07-03", status: "approved" },
      { leave_type: "other", start_date: "2026-07-05", end_date: "2026-07-05", status: "approved" },
    ]);
    expect(used).toBe(0);
  });

  it("연도 범위 밖은 제외 (기간이 걸치면 겹치는 만큼만)", () => {
    const used = usedLeaveDays(
      [{ leave_type: "annual", start_date: "2025-12-30", end_date: "2026-01-02", status: "approved" }],
      { yearStart: "2026-01-01", yearEnd: "2026-12-31" },
    );
    expect(used).toBe(2); // 1/1, 1/2 만
  });
});

describe("remainingLeaveDays", () => {
  it("발생 - 사용, 음수 없음", () => {
    expect(remainingLeaveDays(15, 3)).toBe(12);
    expect(remainingLeaveDays(15, 20)).toBe(0);
  });
});

describe("leaveYearRange — 기준별 산정 구간", () => {
  it("회계연도 기준 = 1/1~12/31", () => {
    expect(leaveYearRange("fiscal_year", "2020-03-15", TODAY)).toEqual({ start: "2026-01-01", end: "2026-12-31" });
  });

  it("입사일 기준 = 올해 기념일이 지났으면 그날부터 1년", () => {
    // 입사 3/15, 오늘 7/28 → 2026-03-15 ~ 2027-03-14
    expect(leaveYearRange("hire_date", "2020-03-15", TODAY)).toEqual({ start: "2026-03-15", end: "2027-03-14" });
  });

  it("입사일 기준 — 올해 기념일이 아직이면 작년 기념일부터", () => {
    // 입사 11/01, 오늘 7/28 → 2025-11-01 ~ 2026-10-31
    expect(leaveYearRange("hire_date", "2020-11-01", TODAY)).toEqual({ start: "2025-11-01", end: "2026-10-31" });
  });
});
