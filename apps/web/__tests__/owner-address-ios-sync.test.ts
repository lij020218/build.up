/**
 * owner-address-ios-sync.test.ts — 호칭 규칙 웹·iOS 드리프트 가드 (2026-09-12).
 *
 * 사장님 지시: "김사장이라 하지 말고 님자를 꼭 붙여."
 * 같은 규칙이 웹(owner-address.ts)·iOS(OwnerAddress.swift) 두 곳에 있으므로
 * 한쪽만 고치면 웹과 앱이 사장님을 다르게 부르게 된다.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ownerAddressKo, ownerAddressEn, HONORIFIC_KO, DEFAULT_OWNER_TITLE_KO } from "@foundone/shared";

const SWIFT = readFileSync(
  join(__dirname, "..", "..", "..", "apps/ios/Sources/FoundOneCore/OwnerAddress.swift"),
  "utf8",
);

describe("호칭 — 이름 뒤에 '님'", () => {
  it("이름만 부르지 않는다", () => {
    expect(ownerAddressKo("김사장")).toBe("김사장님");
    expect(ownerAddressKo("김영희")).toBe("김영희님");
  });

  it("이미 '님'이 붙어 있으면 두 번 붙이지 않는다", () => {
    expect(ownerAddressKo("김사장님")).toBe("김사장님");
  });

  it("이름이 없거나 이메일이면 호칭으로 떨어진다", () => {
    expect(ownerAddressKo("")).toBe("사장님");
    expect(ownerAddressKo(null)).toBe("사장님");
    expect(ownerAddressKo("   ")).toBe("사장님");
    expect(ownerAddressKo("owner@example.com")).toBe("사장님");
  });

  it("업종별 호칭을 넘기면 그것을 쓴다 — 스타트업은 대표님", () => {
    expect(ownerAddressKo("", "대표님")).toBe("대표님");
    expect(ownerAddressKo("박대표", "대표님")).toBe("박대표님");
  });

  it("영어는 존칭 접미사를 붙이지 않는다", () => {
    expect(ownerAddressEn("Jane")).toBe("Jane");
    expect(ownerAddressEn("")).toBe("Founder");
  });
});

describe("iOS 미러 — OwnerAddress.swift", () => {
  it("같은 상수를 쓴다", () => {
    expect(SWIFT).toContain(`honorificKo = "${HONORIFIC_KO}"`);
    expect(SWIFT).toContain(`defaultTitleKo = "${DEFAULT_OWNER_TITLE_KO}"`);
  });

  it("같은 세 갈래 규칙을 갖는다 — 빈값/이메일 · 중복 방지 · 접미", () => {
    expect(SWIFT).toMatch(/name\.isEmpty \|\| name\.contains\("@"\)/);
    expect(SWIFT).toMatch(/hasSuffix\(honorificKo\)/);
    expect(SWIFT).toMatch(/return name \+ honorificKo/);
  });
});
