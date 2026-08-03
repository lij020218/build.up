import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findDongPopulation,
  formatDongPopulationLine,
  DONG_POP_YM,
} from "../app/api/_lib/dong-population";

/**
 * 배후 주거인구 SSOT 가드 (2026-08-03).
 *  데이터: 행안부 주민등록 (전국 읍면동, 월간 배치 — 2026-08-03 실수집 202606, 전국 합 5,109만 대조).
 *  지키는 것: ① 법정동↔행정동 합산 정확성 ② 과잉 매칭 금지 ③ 거주≠유동 정직 라벨.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

describe("법정동↔행정동 합산 (이 기능의 존재 이유)", () => {
  it("둔산동 — 행정동 3개(둔산1·2·3동)가 하나로 합산된다", () => {
    const r = findDongPopulation("대전 둔산동", "둔산동")!;
    expect(r).not.toBeNull();
    expect(r.adminDongCount).toBe(3);
    expect(r.total).toBeGreaterThan(30_000);
    expect(r.total).toBeLessThan(200_000);
    expect(r.age2030Pct + r.age40PlusPct).toBeLessThanOrEqual(100);
  });

  it("행정동식 입력('둔산1동')도 같은 정규화 키로 매칭", () => {
    const a = findDongPopulation("대전", "둔산동");
    const b = findDongPopulation("대전", "둔산1동");
    expect(a).not.toBeNull();
    expect(b?.total).toBe(a?.total);
  });
});

describe("🔴 과잉 매칭 금지 — 남의 동네 인구 부착 방지", () => {
  it("동명이인 동은 시도로 갈리고, 그 시도에 없으면 null", () => {
    const seoul = findDongPopulation("서울", "신정동");
    expect(seoul).not.toBeNull();
    expect(seoul!.sido).toContain("서울");
    expect(findDongPopulation("부산", "신정동")).toBeNull();   // 부산엔 없음 — 울산 것을 주면 위조
  });

  it("시도 없이 전국 다중 매칭이면 null (아무 동네나 단정 금지)", () => {
    // 신정동은 여러 시도에 존재 — 지역 힌트 없으면 단정하지 않는다
    expect(findDongPopulation("어딘가", "신정동")).toBeNull();
  });

  it("없는 동·너무 짧은 키는 null", () => {
    expect(findDongPopulation("서울", "없는동")).toBeNull();
    expect(findDongPopulation("서울", "동")).toBeNull();
  });
});

describe("정직 라벨 — 거주 ≠ 유동", () => {
  it("문장에 기준월·거주 라벨·합산 표기가 강제된다", () => {
    const r = findDongPopulation("대전 둔산동", "둔산동")!;
    const line = formatDongPopulationLine(r);
    expect(line).toContain("주민등록");
    expect(line).toContain("거주 인구, 유동 아님");
    expect(line).toContain("행정동 3개 합산");
    expect(line).toMatch(/20~30대 \d+%/);
    expect(DONG_POP_YM).toMatch(/^\d{6}$/);
  });
});

describe("배선 — 라우트 주입 + 웹 칩 + 번들 격리", () => {
  it("market-recommend 가 실측 주입 + 매칭 없음 언급 금지 + meta 결정론 부착", () => {
    const mr = readFileSync(join(HERE, "..", "app", "api", "data", "market-recommend", "route.ts"), "utf8");
    expect(mr).toContain("findDongPopulation");
    expect(mr).toContain("배후 주거인구: 매칭 없음 (언급 금지)");
    expect(mr).toContain("meta.backPopulation");
    expect(mr).toContain('"유동인구" 라고 부르지 마라');
  });

  it("웹 후보 카드가 배후인구 칩을 렌더한다", () => {
    const stage = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "selection", "LocationCandidatesStage.tsx"), "utf8");
    expect(stage).toContain("item.meta?.backPopulation");
  });

  it("456KB JSON 이 클라이언트 번들로 새지 않는다 — shared index 미export + 서버 밖 import 금지", () => {
    const sharedIndex = readFileSync(join(HERE, "..", "..", "..", "packages", "shared", "src", "index.ts"), "utf8");
    expect(sharedIndex).not.toContain("dong-population");
    // app/api 밖(클라이언트 컴포넌트)에서 dong-population 직접 import 금지
    const stage = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "selection", "LocationCandidatesStage.tsx"), "utf8");
    expect(stage).not.toContain('from "../../../../api/_lib/dong-population"');
  });
});
