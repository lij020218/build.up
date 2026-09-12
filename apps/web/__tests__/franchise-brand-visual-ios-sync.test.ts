import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FRANCHISE_CATEGORY_TINTS,
  FRANCHISE_TINT_FALLBACK,
  FRANCHISE_LOGO_MANIFEST,
  franchiseMonogram,
  franchiseTint,
  franchiseLogoWebPath,
  closureBand,
  getScoreLabel,
} from "@foundone/shared";

/**
 * 프랜차이즈 행 비주얼 웹↔iOS 드리프트 가드 (2026-09-12).
 *
 * 행 디자인(아이콘 타일·업종 색·모노그램·폐점 밴드·점수 등급)은 두 플랫폼이 같아야 한다.
 * 색 토큰은 shared TS 가 SSOT, Swift 는 hex 문자열 그대로 미러 → 여기서 문자열로 대조한다.
 * 로고 자산은 스크립트가 웹(public)·iOS(Resources) 양쪽에 같은 파일을 쓴다 → 존재 여부를 대조한다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const SWIFT = join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "FranchiseBrandVisual.swift");
const IOS_RES = join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "Resources");
const WEB_LOGOS = join(HERE, "..", "public", "franchise-logos");

describe("업종 색 토큰", () => {
  const swift = readFileSync(SWIFT, "utf8");

  it("Swift 미러가 TS SSOT 와 hex 까지 같다", () => {
    for (const [categoryId, tint] of Object.entries(FRANCHISE_CATEGORY_TINTS)) {
      const re = new RegExp(`"${categoryId}":\\s*Tint\\(bgHex: "([^"]+)", fgHex: "([^"]+)"\\)`);
      const m = re.exec(swift);
      expect(m, `Swift 에 ${categoryId} 색 없음`).not.toBeNull();
      expect(m![1]).toBe(tint.bg);
      expect(m![2]).toBe(tint.fg);
    }
    const fb = /tintFallback = Tint\(bgHex: "([^"]+)", fgHex: "([^"]+)"\)/.exec(swift);
    expect(fb![1]).toBe(FRANCHISE_TINT_FALLBACK.bg);
    expect(fb![2]).toBe(FRANCHISE_TINT_FALLBACK.fg);
  });

  it("모르는 업종은 폴백 색", () => {
    expect(franchiseTint("없는업종")).toEqual(FRANCHISE_TINT_FALLBACK);
    expect(franchiseTint(null)).toEqual(FRANCHISE_TINT_FALLBACK);
    expect(franchiseTint("food").fg).toBe("#C2410C");
  });
});

describe("모노그램 규칙", () => {
  it("한글은 첫 글자, 영문·숫자는 앞 두 글자 대문자", () => {
    expect(franchiseMonogram("메가커피")).toBe("메");
    expect(franchiseMonogram("엽기떡볶이")).toBe("엽");
    expect(franchiseMonogram("BBQ")).toBe("BBQ");     // 3글자 이하는 통째로 — 잘리면 못 알아본다
    expect(franchiseMonogram("Paris Baguette")).toBe("PA");
    expect(franchiseMonogram("cu")).toBe("CU");
    expect(franchiseMonogram("60계치킨")).toBe("60");
    expect(franchiseMonogram("(주)한솥")).toBe("한");
    expect(franchiseMonogram("  ")).toBe("?");
  });
});

describe("폐점률 밴드 · 점수 등급", () => {
  it("20%+ 위험, 10%+ 주의", () => {
    expect(closureBand(0)).toBe("safe");
    expect(closureBand(1.5)).toBe("safe");
    expect(closureBand(10)).toBe("watch");
    expect(closureBand(24.1)).toBe("risk");
    expect(closureBand(null)).toBe("safe");
  });

  it("Swift scoreLabel 이 웹 getScoreLabel(ko) 와 같은 구간을 쓴다", () => {
    const swift = readFileSync(SWIFT, "utf8");
    for (const [score, label] of [[95, "최우수"], [85, "우수"], [75, "양호"], [65, "보통"], [40, "주의"]] as const) {
      expect(getScoreLabel(score, "ko")).toBe(label);
      expect(swift).toContain(`return "${label}"`);
    }
  });
});

describe("로고 자산", () => {
  it("manifest 의 모든 브랜드가 웹·iOS 양쪽에 파일로 존재한다", () => {
    const ids = Object.keys(FRANCHISE_LOGO_MANIFEST);
    expect(ids.length).toBeGreaterThan(50);
    const iosFiles = new Set(readdirSync(IOS_RES).filter((f) => f.startsWith("flogo-")));
    for (const id of ids) {
      const ext = FRANCHISE_LOGO_MANIFEST[id];
      expect(existsSync(join(WEB_LOGOS, `${id}.${ext}`)), `웹 로고 누락: ${id}`).toBe(true);
      expect(iosFiles.has(`flogo-${id}.${ext}`), `iOS 로고 누락: ${id}`).toBe(true);
    }
  });

  it("웹 경로 헬퍼 — 없는 브랜드는 null (모노그램 경로)", () => {
    expect(franchiseLogoWebPath("이런브랜드없음")).toBeNull();
    const first = Object.keys(FRANCHISE_LOGO_MANIFEST)[0];
    expect(franchiseLogoWebPath(first)).toBe(`/franchise-logos/${first}.${FRANCHISE_LOGO_MANIFEST[first]}`);
  });
});
