import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HIRING_QUICK_CHANNELS, DAANGN_HIRING_GUIDE } from "@foundone/shared";

/**
 * 직원 구인 채널·당근 가이드 웹↔iOS 드리프트 가드 (2026-07-25).
 *
 * SSOT = packages/shared/src/team/hiring-channels.ts.
 * 웹은 SSOT 를 직접 import 하지만 iOS 는 Swift 수동 미러 —
 * 이 테스트가 Swift 파일을 파싱해 목록·순서·문구가 어긋나면 CI 에서 실패시킨다.
 * (선례: marketing-channels-ios-sync.test.ts)
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_TEAM_VIEW = join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "TeamManagementView.swift");
const IOS_GUIDE_SHEET = join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "DaangnHiringGuideSheet.swift");

describe("직원 구인 채널 웹↔iOS 동기화", () => {
  const swift = readFileSync(IOS_TEAM_VIEW, "utf8");

  it("iOS BUQuickLink 목록이 SSOT(HIRING_QUICK_CHANNELS)와 순서까지 일치한다", () => {
    const re = /BUQuickLink\(label:\s*"([^"]+)",\s*url:\s*"([^"]+)"(?:,\s*badge:\s*"([^"]+)")?\)/g;
    const found: Array<{ label: string; url: string; badge?: string }> = [];
    for (const m of swift.matchAll(re)) {
      found.push({ label: m[1], url: m[2], badge: m[3] });
    }
    expect(found.length, "iOS 에서 BUQuickLink 를 하나도 못 찾음 — 파싱 regex 또는 파일 확인").toBeGreaterThan(0);
    expect(found).toEqual(
      HIRING_QUICK_CHANNELS.map((c) => ({ label: c.label, url: c.url, badge: c.badge?.ko })),
    );
  });
});

describe("당근 구인 가이드 웹↔iOS 동기화", () => {
  const swift = readFileSync(IOS_GUIDE_SHEET, "utf8");

  it("가이드 3단계·팁의 제목과 설명이 iOS 시트에 그대로 있다", () => {
    for (const item of [...DAANGN_HIRING_GUIDE.steps, ...DAANGN_HIRING_GUIDE.tips]) {
      expect(swift, `제목 누락: ${item.title.ko}`).toContain(`"${item.title.ko}"`);
      expect(swift, `설명 누락/변형: ${item.title.ko}`).toContain(item.desc.ko);
    }
  });

  it("당근알바 URL·출처 링크가 SSOT 와 일치한다", () => {
    expect(swift).toContain(`"${DAANGN_HIRING_GUIDE.url}"`);
    for (const s of DAANGN_HIRING_GUIDE.sources) {
      expect(swift, `출처 누락: ${s.name.ko}`).toContain(s.url);
    }
  });

  it("제목·부제가 SSOT 와 일치한다", () => {
    expect(swift).toContain(`"${DAANGN_HIRING_GUIDE.title.ko}"`);
    expect(swift).toContain(DAANGN_HIRING_GUIDE.subtitle.ko);
  });
});
