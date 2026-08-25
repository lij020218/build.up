import { describe, expect, it } from "vitest";
import { resolveStarterPack } from "../inventory-starter-packs";
import { isBulkUnit } from "../inventory-tracking";

describe("inventory-starter-packs", () => {
  it("cafe-dessert 팩 존재, 그 외 업종은 null (억지 프리셋 금지)", () => {
    expect(resolveStarterPack("cafe-dessert")?.items.length).toBeGreaterThan(5);
    expect(resolveStarterPack("retail")).toBeNull();
    expect(resolveStarterPack(null)).toBeNull();
  });
  it("모든 품목의 단위가 관리 방식과 정합 (벌크=g·ml, 개수=개·팩)", () => {
    const pack = resolveStarterPack("cafe-dessert")!;
    for (const item of pack.items) {
      const bulk = isBulkUnit(item.unit);
      if (["원두", "우유", "시럽"].includes(item.name)) expect(bulk, item.name).toBe(true);
      else expect(bulk, item.name).toBe(false);
    }
  });
  it("이름 중복 없음 (중복 생성 방지 필터의 전제)", () => {
    const names = resolveStarterPack("cafe-dessert")!.items.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
