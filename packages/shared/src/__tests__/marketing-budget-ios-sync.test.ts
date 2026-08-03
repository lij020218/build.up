/**
 * 마케팅 예산 벤치마크 SSOT ↔ iOS 동기화 가드.
 *   웹/shared 는 marketing-budget-benchmarks.ts(SSOT)를 직접 쓰고, iOS 는
 *   FoundOneCore/MarketingBudgetBenchmarks.swift 로 손-미러한다. 이 테스트가
 *   Swift 파일을 파싱해 구간·출처·최소매출이 일치하는지 강제 — 드리프트를 CI 에서 차단.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  getMarketingBudgetBenchmark,
  MIN_REVENUE_FOR_ASSESSMENT_WON,
} from "../marketing-budget-benchmarks";

const here = dirname(fileURLToPath(import.meta.url));
const swiftPath = resolve(here, "../../../../apps/ios/Sources/FoundOneCore/MarketingBudgetBenchmarks.swift");
const swift = readFileSync(swiftPath, "utf8");

describe("marketing budget benchmarks: iOS Swift mirrors shared SSOT", () => {
  it("외식(food/cafe-dessert) 구간·출처 일치", () => {
    const food = getMarketingBudgetBenchmark("food");
    const m = /case\s*"food",\s*"cafe-dessert":[\s\S]*?lowPct:\s*(\d+),\s*highPct:\s*(\d+),\s*newBizLowPct:\s*(\d+),\s*newBizHighPct:\s*(\d+),[\s\S]*?sourceUrl:\s*"([^"]+)"/.exec(swift);
    expect(m, "iOS food case not found or shape changed").toBeTruthy();
    expect(Number(m![1])).toBe(food.lowPct);
    expect(Number(m![2])).toBe(food.highPct);
    expect(Number(m![3])).toBe(food.newBiz!.lowPct);
    expect(Number(m![4])).toBe(food.newBiz!.highPct);
    expect(m![5]).toBe(food.sourceUrl);
  });

  it("일반(SBA) 구간·출처 일치", () => {
    const def = getMarketingBudgetBenchmark(null);
    const m = /default:[\s\S]*?lowPct:\s*(\d+),\s*highPct:\s*(\d+),\s*newBizLowPct:\s*nil,\s*newBizHighPct:\s*nil,[\s\S]*?sourceUrl:\s*"([^"]+)"/.exec(swift);
    expect(m, "iOS default case not found or shape changed").toBeTruthy();
    expect(Number(m![1])).toBe(def.lowPct);
    expect(Number(m![2])).toBe(def.highPct);
    expect(m![3]).toBe(def.sourceUrl);
  });

  it("판정 최소 매출 일치", () => {
    const m = /minRevenueForAssessmentWon\s*=\s*([\d_]+)/.exec(swift);
    expect(m).toBeTruthy();
    expect(Number(m![1].replace(/_/g, ""))).toBe(MIN_REVENUE_FOR_ASSESSMENT_WON);
  });
});
