/**
 * 마케팅 채널 SSOT ↔ iOS 동기화 가드.
 *   웹/shared 는 marketing-channels.ts(SSOT)를 직접 쓰지만, iOS 는 Swift 로 손-미러한다.
 *   이 테스트가 iOS MarketingRepository.swift 를 파싱해 SSOT 와 일치하는지 강제 → 드리프트를 CI 에서 차단.
 *   채널/추천을 바꾸면 두 곳을 같이 고쳐야 통과한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { MARKETING_CHANNELS, RECOMMENDED_CHANNELS, DEFAULT_RECOMMENDED_CHANNELS } from "../marketing-channels";

const here = dirname(fileURLToPath(import.meta.url));
const swiftPath = resolve(here, "../../../../apps/ios/Sources/FoundOneData/Repositories/MarketingRepository.swift");
const swift = readFileSync(swiftPath, "utf8");

/** Swift 배열 리터럴 `["a", "b"]` → ["a","b"] */
function parseStringArray(literal: string): string[] {
  return [...literal.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

describe("marketing channels: iOS Swift mirrors shared SSOT", () => {
  it("MarketingChannelMeta.all === MARKETING_CHANNELS (key·label·color)", () => {
    const re = /\.init\(key:\s*"([^"]+)",\s*labelKo:\s*"([^"]+)",\s*labelEn:\s*"([^"]+)",\s*colorHex:\s*"([^"]+)"\)/g;
    const iosAll = [...swift.matchAll(re)].map((m) => ({ key: m[1], labelKo: m[2], labelEn: m[3], color: m[4] }));
    expect(iosAll.length).toBe(MARKETING_CHANNELS.length);
    expect(iosAll).toEqual(MARKETING_CHANNELS.map((c) => ({ key: c.key, labelKo: c.labelKo, labelEn: c.labelEn, color: c.color })));
  });

  it("recommendedChannels(for:) cases === RECOMMENDED_CHANNELS", () => {
    // case "food":  return ["naver-place", ...]
    const caseRe = /case\s*"([^"]+)":\s*return\s*(\[[^\]]*\])/g;
    const iosMap: Record<string, string[]> = {};
    for (const m of swift.matchAll(caseRe)) iosMap[m[1]] = parseStringArray(m[2]);

    for (const [cat, channels] of Object.entries(RECOMMENDED_CHANNELS)) {
      expect(iosMap[cat], `iOS missing/mismatch for "${cat}"`).toEqual(channels);
    }
    // iOS 가 SSOT 에 없는 업종 case 를 들고 있으면 안 됨 (recommendedChannels switch 한정)
    const ssotKeys = new Set(Object.keys(RECOMMENDED_CHANNELS));
    for (const cat of Object.keys(iosMap)) {
      expect(ssotKeys.has(cat), `iOS has extra industry "${cat}" not in SSOT`).toBe(true);
    }
  });

  it("default fallback === DEFAULT_RECOMMENDED_CHANNELS", () => {
    const def = swift.match(/default:\s*return\s*(\[[^\]]*\])/);
    expect(def, "default case not found in Swift").toBeTruthy();
    expect(parseStringArray(def![1])).toEqual(DEFAULT_RECOMMENDED_CHANNELS);
  });
});
