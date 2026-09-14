import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CARDNEWS_THEMES,
  DEFAULT_CARDNEWS_THEME,
  resolveCardNewsTheme,
  defaultThemeForCategory,
} from "@foundone/shared";

/**
 * 카드뉴스 테마 웹↔iOS 드리프트 가드 (2026-09-12).
 *
 * SSOT = packages/shared/src/marketing/cardnews-themes.ts
 *   → scripts/gen-marketing-cardnews-json.mts → cardnews-themes.json (iOS Resources 심볼릭 링크)
 * 웹 canvas 와 iOS ImageRenderer 가 같은 hex 를 써야 같은 결과물이 나온다. 코드젠을 잊고 색만 바꾸면
 * iOS 가 옛 색으로 렌더하므로, 이 테스트가 JSON 과 TS 를 대조한다.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(HERE, "..", "..", "..", "packages", "shared", "src", "marketing", "cardnews-themes.json");
const IOS_REGISTRY = join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "CardNewsThemeRegistry.swift");
const IOS_CARD_VIEW = join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Marketing", "CardNewsStudioCard.swift");

type ThemeJson = {
  themes: Array<Record<string, unknown>>;
  defaultThemeId: string;
  defaultByCategory: Record<string, string>;
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe("카드뉴스 테마 SSOT", () => {
  it("테마는 3종이고 색 토큰이 모두 #RRGGBB 형식이다", () => {
    expect(CARDNEWS_THEMES).toHaveLength(3);
    for (const t of CARDNEWS_THEMES) {
      for (const key of ["coverFrom", "coverTo", "bodyBg", "ink", "accent", "accentOnDark", "ctaBg"] as const) {
        expect(t[key], `${t.id}.${key}`).toMatch(HEX);
      }
      expect(t.label.ko.length).toBeGreaterThan(0);
      expect(t.hint.ko.length).toBeGreaterThan(0);
    }
    expect(new Set(CARDNEWS_THEMES.map((t) => t.id)).size).toBe(CARDNEWS_THEMES.length);
  });

  it("resolve — 모르는 id 는 기본 테마", () => {
    expect(resolveCardNewsTheme("mono").id).toBe("mono");
    expect(resolveCardNewsTheme("없는테마").id).toBe(DEFAULT_CARDNEWS_THEME);
    expect(resolveCardNewsTheme(null).id).toBe(DEFAULT_CARDNEWS_THEME);
  });

  it("업종 기본 테마 — 카페는 크림, 뷰티·피트니스는 모노, 나머지는 미드나잇", () => {
    expect(defaultThemeForCategory("cafe-dessert")).toBe("cream");
    expect(defaultThemeForCategory("beauty")).toBe("mono");
    expect(defaultThemeForCategory("fitness")).toBe("mono");
    expect(defaultThemeForCategory("food")).toBe("midnight");
    expect(defaultThemeForCategory(null)).toBe("midnight");
  });
});

describe("iOS 코드젠 동기화", () => {
  const json = JSON.parse(readFileSync(JSON_PATH, "utf8")) as ThemeJson;

  it("cardnews-themes.json 이 TS SSOT 와 완전히 같다 (코드젠 누락 감지)", () => {
    expect(json.themes).toEqual(JSON.parse(JSON.stringify(CARDNEWS_THEMES)));
    expect(json.defaultThemeId).toBe(DEFAULT_CARDNEWS_THEME);
    for (const [category, themeId] of Object.entries(json.defaultByCategory)) {
      expect(defaultThemeForCategory(category), category).toBe(themeId);
    }
  });

  it("iOS 레지스트리가 JSON 의 모든 색 키를 디코드한다", () => {
    const swift = readFileSync(IOS_REGISTRY, "utf8");
    for (const key of ["coverFrom", "coverTo", "bodyBg", "ink", "accent", "accentOnDark", "ctaBg"]) {
      expect(swift, `Swift 모델에 ${key} 누락`).toContain(`public let ${key}: String`);
    }
    expect(swift).toContain("cardnews-themes");
  });

  it("iOS 카드 뷰가 자리표시 대신 텍스트 카드로 떨어진다 (사진 없음 경로)", () => {
    const view = readFileSync(IOS_CARD_VIEW, "utf8");
    // 사진 자리표시 문구가 이미지 렌더에 남아 있으면 안 된다
    expect(view).not.toContain('Text(card.photoIdea ?? "사진을 넣어주세요")');
    // 웹과 같은 분기 이름으로 미러
    expect(view).toContain("private var usePhoto: Bool");
    expect(view).toContain("private var asText: Bool");
    expect(view).toContain("theme: BUCardNewsTheme?");
  });
});
