import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUSINESS_INFO } from "../app/lib/businessInfo";

/**
 * 사업자·문의처 정보 웹↔iOS 드리프트 가드 (2026-08-06, 출시 점검).
 *
 * SSOT = apps/web/app/lib/businessInfo.ts. iOS 는 FoundOneCore/BusinessInfo.swift 손미러.
 * 문의처가 갈리면 사장님·심사원이 보낸 메일이 수신함 없는 주소로 사라진다
 * (실제로 iOS 만 support@foundone.dev 를 쓰고 있었다).
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_BUSINESS_INFO = join(
  HERE, "..", "..", "ios", "Sources", "FoundOneCore", "BusinessInfo.swift",
);
const IOS_SOURCES = join(HERE, "..", "..", "ios", "Sources");

function swiftConst(swift: string, name: string): string | undefined {
  return swift.match(new RegExp(`let\\s+${name}\\s*=\\s*"([^"]+)"`))?.[1];
}

describe("사업자·문의처 정보 웹↔iOS 동기화", () => {
  const swift = readFileSync(IOS_BUSINESS_INFO, "utf8");

  it("문의 이메일이 웹 SSOT 와 같다", () => {
    expect(swiftConst(swift, "contactEmail")).toBe(BUSINESS_INFO.email);
  });

  it("서비스명·대표자가 웹 SSOT 와 같다", () => {
    expect(swiftConst(swift, "serviceName")).toBe(BUSINESS_INFO.serviceName);
    expect(swiftConst(swift, "representative")).toBe(BUSINESS_INFO.representative);
  });

  it("iOS 실코드에 수신함 없는 support@foundone.dev 가 남아 있지 않다 (주석의 경위 설명은 허용)", async () => {
    const { execSync } = await import("node:child_process");
    const raw = execSync(
      `grep -rn "support@foundone.dev" "${IOS_SOURCES}" --include="*.swift" || true`,
      { encoding: "utf8" },
    ).trim();
    const codeHits = raw
      .split("\n")
      .filter(Boolean)
      // "path:line:내용" → 내용이 주석(//, *)으로 시작하면 경위 설명이므로 제외
      .filter((l) => !/^\s*(\/\/|\*)/.test(l.split(/:\d+:/)[1] ?? ""));
    expect(codeHits, `support@foundone.dev 잔존: ${codeHits.join(", ")}`).toEqual([]);
  });
});
