/**
 * AI 위저드 공급처 추천 → vendor-setup 단계 핸드오프 (2026-08-05 감사 후속).
 *
 * 2026-08-03 감사 원인: 온보딩이 vendorSelections 에 `__etc__<key>` 값을 넣지만
 * VendorSetupStage 는 카탈로그(getVendorData) 이름만 매칭 → AI 선택이 화면에서 통째로 안 보임.
 *
 * 수정 후 계약:
 *  - step 구분 = 스테이지 섹션과 1:1 (s1 공급처 · s2 장비 · s3 POS·결제 · s4 인테리어·기타)
 *  - 카탈로그와 이름 일치 → 값 = 카탈로그 이름 (네이티브 행 프리체크)
 *  - 불일치 → `__etc__` + vendorCustomInputs 에 표시명만
 *  - iOS 미러: AIVendorHandoff.swift (키워드·순서 동일)
 */
import { describe, expect, it } from "vitest";
import {
  aiVendorStepForCategory,
  buildAiVendorHandoff,
  getVendorData,
  parseVendorCustomLabel,
  resolveVendorDisplayName,
} from "../app/lib/components/stages/offline/vendor-setup-data";

describe("aiVendorStepForCategory — 섹션과 1:1", () => {
  it("POS·결제·예약 → s3", () => {
    expect(aiVendorStepForCategory("POS")).toBe(3);
    expect(aiVendorStepForCategory("결제 시스템")).toBe(3);
    expect(aiVendorStepForCategory("예약 시스템")).toBe(3);
  });
  it("장비·설비·주방 → s2 (종전 버그: s3 로 가서 POS 섹션에 섞임)", () => {
    expect(aiVendorStepForCategory("주방 장비")).toBe(2);
    expect(aiVendorStepForCategory("설비")).toBe(2);
    expect(aiVendorStepForCategory("진열 집기")).toBe(2);
  });
  it("식자재·포장·소모품 → s1 (종전 버그: 포장·소모품이 s2 장비 섹션으로)", () => {
    expect(aiVendorStepForCategory("식자재 도매")).toBe(1);
    expect(aiVendorStepForCategory("포장재")).toBe(1);
    expect(aiVendorStepForCategory("위생·안전 소모품")).toBe(1);
    expect(aiVendorStepForCategory("미용 재료")).toBe(1);
  });
  it("인테리어·기타 → s4", () => {
    expect(aiVendorStepForCategory("인테리어")).toBe(4);
    expect(aiVendorStepForCategory("기타")).toBe(4);
  });
});

describe("buildAiVendorHandoff", () => {
  const catalog = getVendorData("korean-casual", "food");

  it("카탈로그와 정확히 같은 이름 → 네이티브 행 프리체크 (__etc__ 없음)", () => {
    const nativeName = catalog.suppliers[0].name;
    const { vendorSelections, vendorCustomInputs } = buildAiVendorHandoff(
      [{ name: nativeName, category: "식자재" }],
      [],
      catalog,
    );
    const values = Object.values(vendorSelections);
    expect(values).toContain(nativeName);
    expect(values.some((v) => v.startsWith("__etc__"))).toBe(false);
    expect(Object.keys(vendorCustomInputs)).toHaveLength(0);
  });

  it("카탈로그 밖 업체 → __etc__ 커스텀 + 표시명만 저장", () => {
    const { vendorSelections, vendorCustomInputs } = buildAiVendorHandoff(
      [{ name: "동네 없는 도매상", category: "식자재" }],
      [],
      catalog,
    );
    const [key, value] = Object.entries(vendorSelections)[0];
    expect(key).toMatch(/^vendor-setup_s1_c\d+$/);
    expect(value).toBe(`__etc__${key}`);
    expect(vendorCustomInputs[key]).toBe("동네 없는 도매상");
  });

  it("인테리어 시공 업체 → s4 커스텀", () => {
    const { vendorSelections, vendorCustomInputs } = buildAiVendorHandoff(
      [],
      [{ title: "우리동네 인테리어" }],
      catalog,
    );
    const [key] = Object.entries(vendorSelections)[0];
    expect(key).toMatch(/^vendor-setup_s4_c\d+$/);
    expect(vendorCustomInputs[key]).toBe("우리동네 인테리어");
  });

  it("빈 이름은 드롭, 커서는 키 충돌 없이 증가", () => {
    const { vendorSelections } = buildAiVendorHandoff(
      [
        { name: "  ", category: "식자재" },
        { name: "업체A", category: "식자재" },
        { name: "업체B", category: "주방 장비" },
      ],
      [],
      catalog,
    );
    const keys = Object.keys(vendorSelections);
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
  });
});

describe("parseVendorCustomLabel / resolveVendorDisplayName — 구형 포맷 호환", () => {
  it("신형 (표시명만)", () => {
    expect(parseVendorCustomLabel("하림")).toEqual({ name: "하림", verified: false });
  });
  it("구형 '[검증] 이름 — 이유 (가격)'", () => {
    const p = parseVendorCustomLabel("[검증] 하림 — 대량 납품 실적 (월 50만원)");
    expect(p.name).toBe("하림");
    expect(p.verified).toBe(true);
    expect(p.reason).toBe("대량 납품 실적 (월 50만원)");
  });
  it("구형 인테리어 '[검증·인테리어 시공] 제목 — 설명'", () => {
    const p = parseVendorCustomLabel("[검증·인테리어 시공] 시공사A — 설명 · 이유");
    expect(p.name).toBe("시공사A");
    expect(p.verified).toBe(true);
  });
  it("resolveVendorDisplayName: 카탈로그 값은 그대로, __etc__ 는 커스텀에서 해석", () => {
    expect(resolveVendorDisplayName("쿠팡이츠", "k", {})).toBe("쿠팡이츠");
    expect(
      resolveVendorDisplayName("__etc__vendor-setup_s1_c0", "vendor-setup_s1_c0", {
        "vendor-setup_s1_c0": "[검증] 하림 — 이유",
      }),
    ).toBe("하림");
    expect(resolveVendorDisplayName("__etc__x", "x", {})).toBe("");
  });
});
