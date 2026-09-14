/**
 * 단시간 근로자 연차 표시 일관성 — 웹·iOS.
 *
 * 2026-09-14 렌더 검증에서 발견: 같은 계정에서
 *   · 임금명세서 → "주 15시간 미만 — 주휴수당·연차 의무가 없고…"
 *   · 내 근로 권리 → "연차 15일 발생"
 * 두 화면이 서로 반대를 말했다. 근속만 보고 주 소정근로를 안 본 탓이다.
 *
 * 연차 표시는 법적 주장이다. 근기법 §18③ — 4주 평균 주 15시간 미만 근로자에게는
 * §60(연차유급휴가)가 적용되지 않는다. 근속이 아무리 길어도 마찬가지다.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SHORT_TIME_WEEKLY_HOURS } from "@foundone/shared";

const WEB = readFileSync(
  resolve(__dirname, "../app/lib/components/surfaces/StaffRightsCard.tsx"),
  "utf8",
);
const IOS = readFileSync(
  resolve(__dirname, "../../ios/Sources/FoundOneFeatures/Staff/StaffDashboardView.swift"),
  "utf8",
);

describe("단시간 근로자 연차 — 근속만으로 판정하지 않는다", () => {
  it("기준 시간은 SSOT 상수다 (15시간)", () => {
    expect(SHORT_TIME_WEEKLY_HOURS).toBe(15);
  });

  it("웹: 연차 적용 여부가 주 소정근로에 걸려 있다", () => {
    expect(WEB).toContain("leaveApplies = weeklyHours >= SHORT_TIME_WEEKLY_HOURS");
    expect(WEB).toContain("leaveAccrued = leaveApplies && daysSinceHire >= 365");
  });

  it("iOS: 연차 적용 여부가 주 소정근로에 걸려 있다", () => {
    expect(IOS).toContain("leaveApplies: Bool { weeklyHours >= BUPayrollRates.shortTimeWeeklyHours }");
    expect(IOS).toContain("leaveAccrued: Bool { leaveApplies && daysSinceHire >= 365 }");
  });

  it("근속만으로 '15일 발생'을 단정하는 표현이 남아 있지 않다", () => {
    // 이 회귀의 원인이 된 형태 — 근속 조건만으로 배지/문구를 정하는 코드.
    expect(WEB).not.toMatch(/daysSinceHire >= 365 \?\s*\(ko \? "15일 발생"/);
    expect(IOS).not.toMatch(/badge:\s*daysSinceHire >= 365 \? "15일 발생"/);
  });

  it("비대상일 때 근거 조문(§18③)을 함께 보여준다 — 주장만 하지 않는다", () => {
    expect(WEB).toContain("§18③");
    expect(IOS).toContain("§18③");
  });
});
