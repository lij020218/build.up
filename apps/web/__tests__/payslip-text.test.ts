/**
 * payslip-text.test.ts — 명세서 공유 텍스트 (2026-09-12).
 *
 * 이 텍스트가 카카오톡·문자로 직원에게 **실제로 전달되는 명세서**다.
 * 근로기준법 §48② 필수 기재사항이 빠지면 미교부와 같은 취급을 받을 수 있다
 * (기재사항 누락·허위기재도 과태료 대상).
 */

// @vitest-environment node

import { describe, expect, it } from "vitest";
import { calculatePayroll, PAYROLL_MINIMUM_WAGE } from "@foundone/shared";
import { payslipPlainText } from "../app/lib/components/payroll/PayslipView";

const result = calculatePayroll({
  period: "2026-09",
  headcount: 6,
  hourlyWage: PAYROLL_MINIMUM_WAGE,
  contractedWeeklyHours: 20,
  actualWorkedHours: 80,
  overtimeHours: 5,
  nightHours: 2,
  weeks: [0, 1, 2, 3].map((i) => ({ weekStart: `2026-09-0${i + 1}`, scheduledHours: 20, absentDays: 0 })),
});

const text = payslipPlainText({ memberName: "김서연", result, paydayLabel: "매월 10일" });

describe("명세서 필수 기재사항 (근기법 §48②)", () => {
  it("근로자를 특정할 수 있는 정보", () => {
    expect(text).toContain("성명: 김서연");
  });

  it("임금지급일", () => {
    expect(text).toContain("임금지급일: 매월 10일");
  });

  it("구성항목별 금액", () => {
    expect(text).toContain("기본급");
    expect(text).toContain("주휴수당");
    expect(text).toContain("지급 총액");
  });

  it("출근일수·시간에 따라 달라지는 항목의 계산방법", () => {
    // 기본급·주휴는 시간으로 계산되므로 산식이 그대로 적혀야 한다.
    expect(text).toMatch(/기본급[\s\S]{0,80}10,320원 × 80시간/);
    expect(text).toMatch(/주휴수당[\s\S]{0,120}개근 4주/);
  });

  it("연장·야간근로의 **시간 수**", () => {
    expect(text).toMatch(/연장근로수당[\s\S]{0,120}5시간/);
    expect(text).toMatch(/야간근로수당[\s\S]{0,120}2시간/);
  });

  it("공제 항목별 금액과 총액", () => {
    expect(text).toContain("[공제]");
    expect(text).toContain("국민연금");
    expect(text).toContain("공제 총액");
  });

  it("실지급액", () => {
    expect(text).toContain(`실지급액 ${result.netPay.toLocaleString("ko-KR")}원`);
  });
});

describe("정직성", () => {
  it("소득세가 추정임을 명세서에 적는다", () => {
    expect(text).toContain("추정");
    expect(text).toContain("간이세액표");
  });

  it("공제가 없으면 '없음'이라고 적는다 — 빈칸으로 두지 않는다", () => {
    const noDeduction = calculatePayroll({
      period: "2026-09", headcount: 2, insuranceEnrolled: false,
      hourlyWage: 11_000, contractedWeeklyHours: 12, actualWorkedHours: 20,
    });
    const t = payslipPlainText({ memberName: "박지훈", result: noDeduction });
    expect(t).toContain("· 없음");
  });

  it("급여일을 모르면 그 줄을 아예 넣지 않는다", () => {
    const t = payslipPlainText({ memberName: "김서연", result });
    expect(t).not.toContain("임금지급일");
  });
});
