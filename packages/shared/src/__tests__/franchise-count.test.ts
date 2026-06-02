import { describe, it, expect } from "vitest";
import { franchiseBrands } from "../franchise-data";

describe("franchiseBrands — 120 브랜드 확장 (Round 2, 2026-05-12)", () => {
  it("총 브랜드 개수는 120개 이상 (데이터 증가 허용 — 손실만 가드)", () => {
    // ⚠️ 정확값(toBe) 가드는 데이터가 늘 때마다 CI 를 빨갛게 만들어 자동배포 신뢰를 떨어뜨렸음.
    //   중복은 아래 별도 테스트가 잡으므로, 여기선 "브랜드가 줄지 않았는지"(손실)만 하한선으로 가드.
    expect(franchiseBrands.length).toBeGreaterThanOrEqual(120);
  });
  it("브랜드 ID 중복 없음", () => {
    const ids = franchiseBrands.map((b) => b.id);
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes).toEqual([]);
  });
  it("Round-2 추가 브랜드 핵심 ID 존재 확인", () => {
    const idSet = new Set(franchiseBrands.map((b) => b.id));
    // chicken-burger 확장
    expect(idSet.has("perikana")).toBe(true);
    expect(idSet.has("mexicana")).toBe(true);
    expect(idSet.has("nobrand-burger")).toBe(true);
    expect(idSet.has("kfc-korea")).toBe(true);
    // korean-casual 확장
    expect(idSet.has("myungryun-galbi")).toBe(true);
    expect(idSet.has("hancheon-seolleongtang")).toBe(true);
    expect(idSet.has("kimgane")).toBe(true);
    // cafe-dessert 확장
    expect(idSet.has("mammoth-coffee")).toBe(true);
    expect(idSet.has("dunkin")).toBe(true);
    expect(idSet.has("dessert39")).toBe(true);
    // retail 확장
    expect(idSet.has("daiso")).toBe(true);
    expect(idSet.has("olive-young")).toBe(true);
    expect(idSet.has("nobrand")).toBe(true);
    // delivery-meals / 분식
    expect(idSet.has("myungrang-hotdog")).toBe(true);
    expect(idSet.has("tanghuo-kungfu")).toBe(true);
  });
});
