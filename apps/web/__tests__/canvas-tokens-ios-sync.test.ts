/**
 * canvas-tokens-ios-sync.test.ts — 캔버스 토큰 웹·iOS 드리프트 가드 (2026-09-12).
 *
 * 2026-09-12 사장님 결정: 앱 배경은 **흰색 + 상단 연푸른 글로우**.
 * 같은 값이 두 곳(웹 globals.css / iOS Colors.swift)에 손으로 적혀 있으므로,
 * 한쪽만 고치면 웹과 앱의 배경이 갈라진다. 이 테스트가 그걸 막는다.
 *
 * 값을 바꾸려면 **두 파일을 함께** 고쳐야 테스트가 통과한다.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..", "..");
const CSS_PATH = join(REPO_ROOT, "apps/web/app/globals.css");
const SWIFT_PATH = join(REPO_ROOT, "apps/ios/Sources/FoundOneDesignSystem/Colors.swift");
const SPACING_PATH = join(REPO_ROOT, "apps/ios/Sources/FoundOneDesignSystem/Spacing.swift");

const css = readFileSync(CSS_PATH, "utf8");
const swift = readFileSync(SWIFT_PATH, "utf8");
const spacing = readFileSync(SPACING_PATH, "utf8");

/** `--이름: 값;` 에서 값만. */
function cssVar(name: string): string {
  const hit = new RegExp(`--${name}:\\s*([^;]+);`).exec(css);
  if (!hit) throw new Error(`globals.css 에 --${name} 이 없습니다`);
  return hit[1].trim();
}

/** Colors.swift 의 `light: Color(red: 0xRR/255, green: 0xGG/255, blue: 0xBB/255)` → "R, G, B" (십진). */
function swiftLightRgb(tokenName: string): string {
  const block = new RegExp(
    `static let ${tokenName} = Color\\(\\s*light:\\s*Color\\(red:\\s*0x([0-9A-Fa-f]{2})/255,\\s*green:\\s*0x([0-9A-Fa-f]{2})/255,\\s*blue:\\s*0x([0-9A-Fa-f]{2})/255\\)`,
  ).exec(swift);
  if (!block) throw new Error(`Colors.swift 에서 ${tokenName} 의 light 값을 못 읽었습니다`);
  return [block[1], block[2], block[3]].map((h) => parseInt(h, 16)).join(", ");
}

describe("캔버스 토큰 — 웹 globals.css ↔ iOS Colors.swift", () => {
  it("배경은 양쪽 다 흰색이다", () => {
    expect(cssVar("bg").toLowerCase()).toBe("#ffffff");
    // iOS 는 light: .white 로 적는다(헥사가 아니라 이름).
    expect(swift).toMatch(/static let appBackground = Color\(\s*light:\s*\.white/);
  });

  it("상단 글로우 색이 같다", () => {
    expect(cssVar("canvas-glow")).toBe(swiftLightRgb("canvasGlow"));
  });

  it("상단 글로우 세기가 같다", () => {
    const swiftOpacity = /static let canvasGlowOpacity: Double = ([0-9.]+)/.exec(swift);
    expect(swiftOpacity, "Colors.swift 에 canvasGlowOpacity 가 없습니다").not.toBeNull();
    expect(Number(cssVar("canvas-glow-opacity"))).toBe(Number(swiftOpacity![1]));
  });

  it("카드 안쪽 옅은 면(subtleFill) 색이 같다", () => {
    const [r, g, b] = swiftLightRgb("subtleFill").split(", ").map(Number);
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    expect(cssVar("subtle-fill").toLowerCase()).toBe(hex);
  });

  it("카드 표면은 불투명하다 — 반투명이면 글자 대비가 배경에 좌우된다", () => {
    expect(cssVar("surface").toLowerCase()).toBe("#ffffff");
    expect(cssVar("surface")).not.toMatch(/rgba/);
  });

  it("앱 배경에 오로라 애니메이션 레이어가 남아 있지 않다", () => {
    // body::after 오로라 레이어와 auroraFlow 키프레임은 2026-09-12 에 제거됐다.
    expect(css).not.toMatch(/@keyframes auroraFlow/);
    expect(css).not.toMatch(/body::after\s*\{[^}]*repeating-linear-gradient/);
  });
});

describe("카드 모서리 — 웹 --card-radius ↔ iOS BURadius", () => {
  /** Spacing.swift 의 `public static let 이름: CGFloat = 숫자` */
  function swiftRadius(name: string): number {
    const hit = new RegExp(`public static let ${name}: CGFloat = ([0-9.]+)`).exec(spacing);
    if (!hit) throw new Error(`Spacing.swift 에 ${name} 이 없습니다`);
    return Number(hit[1]);
  }

  it("웹 카드 모서리가 iOS 바깥 카드와 같다", () => {
    expect(Number(cssVar("card-radius").replace("px", ""))).toBe(swiftRadius("outerCard"));
  });

  it("iOS 카드 모서리는 한 값이다 — 중첩이 없으니 단계가 필요 없다", () => {
    const single = swiftRadius("outerCard");
    for (const name of ["heroOuter", "nestedCard", "headlineCard"]) {
      expect(swiftRadius(name), `${name} 이 outerCard 와 다릅니다`).toBe(single);
    }
    // 안쪽 '면'은 카드보다 작아야 한다 (카드 모서리를 넘어 보이면 안 됨)
    expect(swiftRadius("innerBlock")).toBeLessThan(single);
  });

  it("웹에 카드 모서리 하드코딩이 남아 있지 않다", () => {
    // 133곳에 흩어져 있던 20px 을 2026-09-12 에 토큰으로 묶었다 — 다시 늘어나지 않게 고정.
    const hardcoded = css.match(/border-radius:\s*20px/g) ?? [];
    expect(hardcoded).toHaveLength(0);
  });
});
