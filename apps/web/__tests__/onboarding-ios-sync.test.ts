import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ONBOARDING_CATEGORY_PROFILES } from "../../../packages/shared/src/onboarding-profile";
import { CATEGORY_REVENUE_BENCHMARK, REVENUE_BANDS } from "../../../packages/shared/src/industry-revenue-benchmark";

/**
 * 웹↔iOS 온보딩 SSOT 드리프트 가드 —
 *   iOS OnboardingRegistry.swift 는 codegen 산출물(gen-onboarding-swift.mts).
 *   웹 SSOT 를 바꾸고 재생성을 잊으면 여기서 CI 가 실패한다 (hiring-channels-ios-sync 패턴).
 */

const __filename = fileURLToPath(import.meta.url);
const SWIFT_PATH = join(dirname(__filename), "..", "..", "ios", "Sources", "FoundOneCore", "OnboardingRegistry.swift");
const swift = readFileSync(SWIFT_PATH, "utf8");

describe("onboarding iOS sync", () => {
  it("전 카테고리 프로파일이 Swift 레지스트리에 존재하고 핵심 필드가 일치한다", () => {
    for (const [cat, p] of Object.entries(ONBOARDING_CATEGORY_PROFILES)) {
      const line = swift.split("\n").find((l) => l.includes(`"${cat}": .init(placeNoun:`));
      expect(line, `${cat} 프로파일 누락 — codegen 재실행 필요`).toBeTruthy();
      expect(line, `${cat} placeNoun 불일치`).toContain(`placeNoun: "${p.placeNoun.ko}"`);
      expect(line, `${cat} ownerTitle 불일치`).toContain(`ownerTitle: "${p.ownerTitle.ko}"`);
      expect(line, `${cat} asksFranchise 불일치`).toContain(`asksFranchise: ${p.asks.franchise}`);
      expect(line, `${cat} asksBusinessHours 불일치`).toContain(`asksBusinessHours: ${p.asks.businessHours}`);
      expect(line, `${cat} revenueSyncCta 불일치`).toContain(`revenueSyncCta: "${p.revenueSyncCta}"`);
    }
  });

  it("벤치마크 수치가 일치한다 (원문 수치 드리프트 차단)", () => {
    for (const [cat, b] of Object.entries(CATEGORY_REVENUE_BENCHMARK)) {
      if (!b) {
        expect(swift, `${cat} 는 Swift 에서도 nil 이어야 함`).toContain(`"${cat}": nil`);
        continue;
      }
      const line = swift.split("\n").find((l) => l.includes(`"${cat}": .init(kstatIndustry:`));
      expect(line, `${cat} 벤치마크 누락`).toBeTruthy();
      expect(line, `${cat} 연매출 불일치`).toContain(`annualRevenueMillionKrw: ${b.annualRevenueMillionKrw}`);
      expect(line, `${cat} 월환산 불일치`).toContain(`monthlyRevenueManwon: ${b.monthlyRevenueManwon}`);
    }
  });

  it("매출 구간 6종의 id·라벨이 일치한다", () => {
    for (const band of REVENUE_BANDS) {
      expect(swift, `${band.id} 구간 누락`).toContain(`id: "${band.id}"`);
      expect(swift, `${band.id} 라벨 불일치`).toContain(`labelKo: "${band.label.ko}"`);
    }
  });

  it("자동 생성 헤더가 유지된다 (직접 수정 금지 표식)", () => {
    expect(swift).toContain("자동 생성 파일 — 직접 수정 금지");
  });
});
