/**
 * 오늘 근무 명단 — 웹 SSOT ↔ iOS 미러 드리프트 가드.
 *
 * 왜: 근무 판정이 갈리면 "사장 홈엔 출근인데 직원 앱엔 휴무"가 된다. 급여로 이어지는 판정이라
 * 한쪽만 고치는 사고를 테스트가 막는다. Swift 소스를 문자열로 읽어 분기·정렬·필터를 대조한다.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SWIFT = readFileSync(
  resolve(__dirname, "../../ios/Sources/FoundOneCore/TodayRoster.swift"),
  "utf8",
);
const TS = readFileSync(
  resolve(__dirname, "../../../packages/shared/src/team/today-roster.ts"),
  "utf8",
);

describe("today-roster iOS 동기화", () => {
  it("상태 5종이 양쪽에 모두 있다", () => {
    for (const s of ["leave", "working", "done", "scheduled", "off"]) {
      expect(TS, `TS 에 ${s} 없음`).toContain(`"${s}"`);
      expect(SWIFT, `Swift 에 ${s} 없음`).toMatch(new RegExp(`\\b${s}\\b`));
    }
  });

  it("판정 우선순위가 같다 — 연차 → 기록 → 배정 → 휴무", () => {
    // TS: approvedLeave → att → shift → off
    const tsOrder = [
      TS.indexOf("approvedLeave.has"),
      TS.indexOf("att.clockOutAt"),
      TS.indexOf('shift\n          ? "scheduled"'),
    ];
    expect(tsOrder.every((i) => i > 0)).toBe(true);
    expect(tsOrder[0]).toBeLessThan(tsOrder[1]);
    expect(tsOrder[1]).toBeLessThan(tsOrder[2]);

    const swiftOrder = [
      SWIFT.indexOf("onLeave.contains"),
      SWIFT.indexOf("att.clockOutAt != nil"),
      SWIFT.indexOf("shift != nil"),
    ];
    expect(swiftOrder.every((i) => i > 0)).toBe(true);
    expect(swiftOrder[0]).toBeLessThan(swiftOrder[1]);
    expect(swiftOrder[1]).toBeLessThan(swiftOrder[2]);
  });

  it("승인된 연차만 반영한다 — 양쪽 모두 approved 비교", () => {
    expect(TS).toContain('l.status === "approved"');
    expect(SWIFT).toContain('$0.status == "approved"');
  });

  it("연차 기간 판정이 같다 (start <= today <= end)", () => {
    expect(TS).toContain("l.startDate <= dateStr && dateStr <= l.endDate");
    expect(SWIFT).toContain("$0.startDate <= dateStr && dateStr <= $0.endDate");
  });

  it("근무 시간 해석은 공용 resolver 를 재사용한다 — 시간 판정을 새로 만들지 않는다", () => {
    expect(TS).toContain("resolveShiftForDate(");
    expect(SWIFT).toContain("BUWorkSchedule.resolve(");
  });

  it("홈 필터가 같다 — 휴무자만 뺀다(연차는 남긴다)", () => {
    expect(TS).toContain('e.status !== "off"');
    expect(SWIFT).toContain("$0.status != .off");
  });

  it("출근 인원 집계가 같다 — working + done", () => {
    expect(TS).toContain('e.status === "working" || e.status === "done"');
    expect(SWIFT).toContain("$0.status == .working || $0.status == .done");
  });

  it("예정 인원 집계가 같다 — working + done + scheduled (연차 제외)", () => {
    expect(TS).toContain('e.status === "working" || e.status === "done" || e.status === "scheduled"');
    expect(SWIFT).toContain("$0.status == .working || $0.status == .done || $0.status == .scheduled");
  });

  it("정렬 규칙이 같다 — 시작시간 오름차순, 시간 없으면 뒤, 그다음 이름순", () => {
    // 시간 있는 쪽이 앞
    expect(TS).toContain("if (a.startMinutes !== null && b.startMinutes === null) return -1");
    expect(SWIFT).toContain("if a.startMinutes != nil && b.startMinutes == nil { return true }");
    // 이름순 폴백
    expect(TS).toContain("a.name.localeCompare(b.name)");
    expect(SWIFT).toContain("a.name.localizedCompare(b.name)");
  });

  it("배정이 없으면 시간 칸은 비운다 — 없는 근무표를 지어내지 않는다", () => {
    expect(TS).toContain("shift?.start_time ?? null");
    expect(SWIFT).toContain("shift?.startTime");
  });
});
