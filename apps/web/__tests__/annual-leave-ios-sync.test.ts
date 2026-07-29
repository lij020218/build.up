import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LEAVE_BASIS_LABEL, calcAnnualLeave } from "@foundone/shared";

/**
 * 연차 산정 웹↔iOS 드리프트 가드 (2026-07-28).
 *
 * SSOT = packages/shared/src/team/annual-leave.ts (근로기준법 제60조·제11조).
 * iOS 는 Swift 수동 미러(FoundOneCore/AnnualLeave.swift) — 법정 수치나 안내 문구가
 * 한쪽만 바뀌면 사장님과 직원이 서로 다른 연차 일수를 보게 된다. 여기서 막는다.
 * (선례: hiring-channels-ios-sync.test.ts)
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_CORE = join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "AnnualLeave.swift");
const swift = readFileSync(IOS_CORE, "utf8");

describe("연차 부여 기준 라벨 웹↔iOS 동기화", () => {
  it("BULeaveBasis rawValue 가 DB CHECK·TS 타입과 같다", () => {
    for (const key of Object.keys(LEAVE_BASIS_LABEL)) {
      expect(swift, `iOS 에 rawValue "${key}" 없음`).toContain(`= "${key}"`);
    }
  });

  it("기준별 라벨·설명 한국어 문구가 그대로 있다", () => {
    for (const v of Object.values(LEAVE_BASIS_LABEL)) {
      expect(swift, `iOS 에 라벨 "${v.ko}" 없음`).toContain(`"${v.ko}"`);
      expect(swift, `iOS 에 설명 "${v.desc.ko}" 없음`).toContain(`"${v.desc.ko}"`);
    }
  });
});

describe("법정 수치 웹↔iOS 동기화 (제60조)", () => {
  it("15일 기본 · 25일 상한 · 3년째부터 2년마다 1일 가산 공식이 같다", () => {
    expect(swift).toContain("min(25, 15 + bonus)");
    expect(swift).toContain("yearsWorked >= 3 ? (yearsWorked - 1) / 2 : 0");
  });

  it("1년 미만 11일 상한이 같다", () => {
    expect(swift).toContain("min(11, months)");
  });

  it("반차는 0.5일 · 승인된 것만 차감", () => {
    expect(swift).toContain("0.5");
    expect(swift).toContain('l.status == "approved"');
  });
});

describe("안내 문구 웹↔iOS 동기화 (정직성 문구는 한쪽만 빠지면 안 됨)", () => {
  it("5인 미만 안내 문구가 글자 그대로 같다", () => {
    const note = calcAnnualLeave("2020-01-01", { basis: "hire_date", headcount: 4 }).basisNote.ko;
    expect(swift, "iOS 5인 미만 안내 문구가 SSOT 와 다름").toContain(note);
  });

  it("입사일 미입력 안내 문구가 같다", () => {
    const note = calcAnnualLeave(null, { basis: "hire_date", headcount: 5 }).basisNote.ko;
    expect(swift).toContain(note);
  });

  it("근속 1년 이상 안내에 출근율 80% 단서가 남아 있다", () => {
    expect(swift).toContain("직전 1년 출근율 80% 이상일 때 기준이라 실제와 다를 수 있어요.");
  });
});
