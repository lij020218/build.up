import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mapOperatingStatus,
  isNtsUnregisteredMessage,
  checkBusinessStatus,
} from "@foundone/shared";

/**
 * 국세청 연동 정직성 가드 (2026-08-03 감사).
 *
 * 발견됐던 거짓 3건이 되살아나지 않게 한다:
 *  ① 미등록 번호 → "폐업" 단정 (else 분기 + 기본값 "03" 주입)
 *  ② 미등록 안내문이 과세유형 라벨로 흘러 "✓ 국세청에 등록되지 않은… — 국세청 확인" 모순 배지
 *  ③ 상태 코드 부재 → "계속사업자" 기본값 위조
 *
 * 라이브 검증 기록: 2026-08-03 실호출 — 게이트웨이 정상(가짜 키 401 즉답),
 *  백엔드 점검 중(실키 503 code -5). 점검 종료 후 실번호 대조 재검 필요.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

describe("① 미등록 ≠ 폐업", () => {
  it("미등록 안내문이 오면 상태 코드와 무관하게 unregistered", () => {
    expect(mapOperatingStatus("", "국세청에 등록되지 않은 사업자등록번호입니다.")).toBe("unregistered");
  });

  it("명시 코드만 단정 — 01/02/03 외는 unknown (폐업 기본값 금지)", () => {
    expect(mapOperatingStatus("01", "부가가치세 일반과세자")).toBe("active");
    expect(mapOperatingStatus("02", "부가가치세 일반과세자")).toBe("suspended");
    expect(mapOperatingStatus("03", "부가가치세 일반과세자")).toBe("closed");
    expect(mapOperatingStatus("", "")).toBe("unknown");
    expect(mapOperatingStatus("99", "")).toBe("unknown");
  });

  it("어댑터 소스에 기본값 '03' 주입이 없다", () => {
    const src = readFileSync(
      join(HERE, "..", "..", "..", "packages", "shared", "src", "adapters", "nts-business.ts"),
      "utf8",
    );
    expect(src).not.toContain('?? "03"');
  });
});

describe("② 어댑터 end-to-end (fetch 모킹 — 국세청 실제 응답 형태)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("미등록 응답이 unregistered 로 나오고 폐업으로 위장되지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { b_no: "0000000000", b_stt: "", b_stt_cd: "", tax_type: "국세청에 등록되지 않은 사업자등록번호입니다." },
          { b_no: "1234567890", b_stt: "계속사업자", b_stt_cd: "01", tax_type: "부가가치세 간이과세자", tax_type_cd: "02" },
        ],
      }),
    }));
    const r = await checkBusinessStatus({ apiKey: "k", baseUrl: "" }, ["0000000000", "1234567890"]);
    expect(r.data[0]!.operatingStatus).toBe("unregistered");
    expect(r.data[0]!.operatingStatus).not.toBe("closed");
    expect(r.data[1]!.operatingStatus).toBe("active");
    expect(r.data[1]!.taxType).toBe("부가가치세 간이과세자");
  });

  it("isNtsUnregisteredMessage — 정상 과세유형 문구는 미등록으로 오탐하지 않는다", () => {
    for (const t of ["부가가치세 일반과세자", "부가가치세 간이과세자", "면세사업자", ""]) {
      expect(isNtsUnregisteredMessage(t), t).toBe(false);
    }
  });
});

describe("③ 온보딩 소비처 — 모순 배지·기본값 위조 재발 방지", () => {
  const src = readFileSync(
    join(HERE, "..", "app", "lib", "components", "ExistingBusinessOnboarding.tsx"),
    "utf8",
  );

  it("미등록은 notfound 분기로 빠진다 (✓ 배지 경로 진입 금지)", () => {
    expect(src).toContain('item.operatingStatus === "unregistered"');
    expect(src).toContain('{ status: "notfound" }');
    expect(src).toContain("전산 반영 전일 수 있어요");
  });

  it("상태 미상을 계속사업자로 기본 처리하지 않는다", () => {
    expect(src).not.toContain('item.operatingStatus === "active" : true');
    // isActive null 이면 상태 문구 자체를 생략
    expect(src).toContain("bizLookup.isActive !== null &&");
  });
});

describe("라우트 입력 가드", () => {
  it("비배열 크래시·무제한 조회 가드가 있다", () => {
    const src = readFileSync(
      join(HERE, "..", "app", "api", "data", "business", "status", "route.ts"),
      "utf8",
    );
    expect(src).toContain("Array.isArray(body?.businessNumbers)");
    expect(src).toContain(".slice(0, 10)");
  });
});
