import { describe, it, expect } from "vitest";
import {
  resolveShiftForDate,
  ruleActiveOn,
  resolveMonthShifts,
  expandLeaveDates,
  expandLeaveDatesWithStatus,
  toShiftSpan,
  findCoverageGaps,
  formatSpanTime,
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

describe("교대 타임라인 (2026-07-28 — A 12-3시 / B 3-8시 구분)", () => {
  it("자정 넘는 야간 근무를 +24h 로 편다 (음수 방지)", () => {
    expect(toShiftSpan("22:00", "02:00")).toEqual({ startMin: 1320, endMin: 1560 });
    expect(toShiftSpan("12:00", "15:00")).toEqual({ startMin: 720, endMin: 900 });
  });

  it("이어지는 교대(12–3, 3–8)는 공백이 없다", () => {
    const gaps = findCoverageGaps([
      toShiftSpan("12:00", "15:00")!,
      toShiftSpan("15:00", "20:00")!,
    ]);
    expect(gaps).toEqual([]);
  });

  it("떨어진 교대(12–3, 5–8)는 3–5시 공백을 잡는다", () => {
    const gaps = findCoverageGaps([
      toShiftSpan("12:00", "15:00")!,
      toShiftSpan("17:00", "20:00")!,
    ]);
    expect(gaps).toEqual([{ startMin: 900, endMin: 1020 }]);
  });

  it("겹치는 교대는 공백이 아니다", () => {
    const gaps = findCoverageGaps([
      toShiftSpan("12:00", "18:00")!,
      toShiftSpan("15:00", "20:00")!,
    ]);
    expect(gaps).toEqual([]);
  });

  it("근무 1개 이하면 공백 개념 없음 (영업시간 모르는데 단정 금지)", () => {
    expect(findCoverageGaps([toShiftSpan("12:00", "15:00")!])).toEqual([]);
    expect(findCoverageGaps([])).toEqual([]);
  });

  it("익일 표기 — 24시 넘는 종료", () => {
    expect(formatSpanTime(1560)).toBe("익일 02:00");
    expect(formatSpanTime(900)).toBe("15:00");
  });
});

describe("규칙 적용 기간 — effective_until (2026-07-31 사장님 요청)", () => {
  const rule = { weekday: 1, start_time: "09:00", end_time: "18:00", active: true, effective_until: "2026-08-31" };

  it("기간 안은 근무, 종료일 당일 포함", () => {
    expect(ruleActiveOn(rule, "2026-08-15")).toBe(true);
    expect(ruleActiveOn(rule, "2026-08-31")).toBe(true);   // 포함
  });

  it("🔴 종료일 다음 날부터 근무 아님 — '무한 근무표' 방지가 이 기능의 존재 이유", () => {
    expect(ruleActiveOn(rule, "2026-09-01")).toBe(false);
    // resolveShiftForDate 도 같은 판정 (SSOT 한 곳)
    expect(resolveShiftForDate("2026-09-07", 1, [rule], [])).toBeNull();
    expect(resolveShiftForDate("2026-08-31", 1, [rule], [])).not.toBeNull();
  });

  it("미지정(null/undefined) = 계속 — 기존 데이터 동작 불변", () => {
    expect(ruleActiveOn({ ...rule, effective_until: null }, "2030-01-01")).toBe(true);
    const legacy = { weekday: 1, start_time: "09:00", end_time: "18:00", active: true };
    expect(ruleActiveOn(legacy, "2030-01-01")).toBe(true);
  });

  it("비활성 규칙은 기간과 무관하게 근무 아님 (기존 active 방어 유지)", () => {
    expect(ruleActiveOn({ ...rule, active: false }, "2026-08-15")).toBe(false);
  });

  it("기간이 지나도 날짜 예외(대타)는 그대로 — 예외가 규칙보다 우선", () => {
    const ex = [{ work_date: "2026-09-07", start_time: "10:00", end_time: "14:00", is_off: false }];
    expect(resolveShiftForDate("2026-09-07", 1, [rule], ex)?.start_time).toBe("10:00");
  });
});
