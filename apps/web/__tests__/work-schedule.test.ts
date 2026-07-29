import { describe, it, expect } from "vitest";
import {
  resolveShiftForDate,
  resolveMonthShifts,
  expandLeaveDates,
  expandLeaveDatesWithStatus,
} from "../../../packages/shared/src/team/work-schedule";

/**
 * 근무 해석 SSOT 가드 — 사장 화면·직원 화면이 같은 답을 내야 한다 (2026-07-28).
 * 특히 active=false 방어: 사장 화면은 비활성 규칙까지 로드하므로 함수가 막지 않으면
 * "사장 캘린더엔 출근인데 직원 화면엔 없는" 불일치가 난다.
 */

const rules = [
  { weekday: 1, start_time: "09:00", end_time: "18:00" },              // 월
  { weekday: 3, start_time: "13:00", end_time: "22:00", active: true }, // 수
  { weekday: 5, start_time: "09:00", end_time: "18:00", active: false }, // 금 — 비활성
];

describe("resolveShiftForDate", () => {
  it("요일 반복 규칙을 적용한다", () => {
    // 2026-07-06 = 월요일
    expect(resolveShiftForDate("2026-07-06", 1, rules, [])).toEqual({
      start_time: "09:00", end_time: "18:00", note: null,
    });
  });

  it("비활성(active:false) 규칙은 근무로 치지 않는다 — 사장 화면 오표시 차단", () => {
    // 2026-07-10 = 금요일 (비활성 규칙)
    expect(resolveShiftForDate("2026-07-10", 5, rules, [])).toBeNull();
  });

  it("예외행이 반복 규칙을 덮어쓴다 (다른 시간)", () => {
    const ex = [{ work_date: "2026-07-06", start_time: "11:00", end_time: "20:00", note: "늦게 오픈" }];
    expect(resolveShiftForDate("2026-07-06", 1, rules, ex)).toEqual({
      start_time: "11:00", end_time: "20:00", note: "늦게 오픈",
    });
  });

  it("예외행 is_off 는 휴무 — 반복 규칙이 있어도 근무 아님", () => {
    const ex = [{ work_date: "2026-07-06", is_off: true }];
    expect(resolveShiftForDate("2026-07-06", 1, rules, ex)).toBeNull();
  });

  it("규칙도 예외도 없으면 null", () => {
    expect(resolveShiftForDate("2026-07-07", 2, rules, [])).toBeNull();
  });
});

describe("resolveMonthShifts", () => {
  it("한 달 근무일만 담는다 (2026-07: 월요일 4회 + 수요일 5회)", () => {
    const map = resolveMonthShifts(2026, 6, rules, []); // monthIndex 6 = 7월
    const mondays = ["2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27"];
    const wednesdays = ["2026-07-01", "2026-07-08", "2026-07-15", "2026-07-22", "2026-07-29"];
    for (const d of [...mondays, ...wednesdays]) expect(map.has(d), d).toBe(true);
    expect(map.size).toBe(mondays.length + wednesdays.length);
    // 금요일(비활성)은 하나도 없어야 함
    expect(map.has("2026-07-03")).toBe(false);
  });
});

describe("expandLeaveDates", () => {
  it("기간을 날짜로 전개하고 반려 건은 뺀다", () => {
    const set = expandLeaveDates([
      { start_date: "2026-07-06", end_date: "2026-07-08", status: "approved" },
      { start_date: "2026-07-20", end_date: "2026-07-20", status: "rejected" },
    ]);
    expect([...set].sort()).toEqual(["2026-07-06", "2026-07-07", "2026-07-08"]);
  });

  it("역순·잘못된 날짜는 무한 루프 없이 무시한다", () => {
    const set = expandLeaveDates([
      { start_date: "2026-07-10", end_date: "2026-07-05", status: "approved" },
      { start_date: "bad-date", end_date: "2026-07-05", status: "approved" },
    ]);
    expect(set.size).toBe(0);
  });
});

describe("expandLeaveDatesWithStatus (2026-07-28 냉정 리뷰 — 승인 대기 구분)", () => {
  it("승인 건은 approved, 대기 건은 pending 으로 구분한다", () => {
    const map = expandLeaveDatesWithStatus([
      { start_date: "2026-07-06", end_date: "2026-07-06", status: "approved" },
      { start_date: "2026-07-10", end_date: "2026-07-10", status: "pending" },
    ]);
    expect(map.get("2026-07-06")).toBe("approved");
    expect(map.get("2026-07-10")).toBe("pending");
  });

  it("반려 건은 아예 없다", () => {
    const map = expandLeaveDatesWithStatus([
      { start_date: "2026-07-15", end_date: "2026-07-15", status: "rejected" },
    ]);
    expect(map.size).toBe(0);
  });

  it("같은 날 승인+대기가 겹치면 승인이 이긴다 (확정 정보 우선)", () => {
    const map = expandLeaveDatesWithStatus([
      { start_date: "2026-07-20", end_date: "2026-07-20", status: "pending" },
      { start_date: "2026-07-20", end_date: "2026-07-20", status: "approved" },
    ]);
    expect(map.get("2026-07-20")).toBe("approved");
  });

  it("status 미지정은 보수적으로 pending 취급 (확정으로 단정 금지)", () => {
    const map = expandLeaveDatesWithStatus([{ start_date: "2026-07-22", end_date: "2026-07-22" }]);
    expect(map.get("2026-07-22")).toBe("pending");
  });
});
