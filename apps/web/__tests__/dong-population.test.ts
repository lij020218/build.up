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

describe("소진공 공식 경쟁밀도 (2026-08-03 Phase A-1)", () => {
  it("70개 세부업종 전수 — 매핑 or 명시적 null (누락 = 새 업종 추가 시 조용한 카카오 폴백 방지)", async () => {
    const { SBIZ_UPJONG_MAP } = await import("../app/api/_lib/sbiz-store");
    const starter = readFileSync(join(HERE, "..", "..", "..", "packages", "shared", "src", "starter-data.ts"), "utf8");
    const seg = starter.slice(starter.indexOf("starterIndustryOptions"), starter.indexOf("];", starter.indexOf("starterIndustryOptions")));
    const ids = [...seg.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]!);
    expect(ids.length).toBeGreaterThanOrEqual(65);
    for (const id of ids) {
      expect(Object.prototype.hasOwnProperty.call(SBIZ_UPJONG_MAP, id), `미선언 업종: ${id}`).toBe(true);
    }
  });

  it("인적용역 코드 금지 — 프리랜서 등록분은 점포 경쟁이 아니다 (0건 시 totalCount 생략 버그 원인이기도)", async () => {
    const { SBIZ_UPJONG_MAP } = await import("../app/api/_lib/sbiz-store");
    const allCodes = Object.values(SBIZ_UPJONG_MAP).flatMap((m) => m ? [...(m.scls ?? []), ...(m.mcls ?? [])] : []);
    // 실측 확인된 인적용역 코드들 (P10604·P10616 류) 미포함
    for (const banned of ["P10604", "P10616", "P10612", "P10626"]) {
      expect(allCodes, banned).not.toContain(banned);
    }
  });

  it("무점포·무분류 업종은 null 선언 (억지 매핑 = 남의 업종 경쟁 수 위조)", async () => {
    const { SBIZ_UPJONG_MAP } = await import("../app/api/_lib/sbiz-store");
    for (const id of ["b2b-saas", "smart-store", "party-room", "pet-grooming", "shared-office"]) {
      expect(SBIZ_UPJONG_MAP[id], id).toBeNull();
    }
  });

  it("라우트 — 공식 우선·카카오 폴백·소스별 밴드·오류≠0", () => {
    const mr = readFileSync(join(HERE, "..", "app", "api", "data", "market-recommend", "route.ts"), "utf8");
    expect(mr).toContain("sbizCountsInRadius");
    expect(mr).toContain("동종업종 매장 [공식]");
    expect(mr).toContain("동종업종 매장 [지도]");            // 폴백 유지
    expect(mr).toContain("소스 태그로 밴드를 갈라 적용");     // 공식/지도 밴드 분리
    expect(mr).toContain("meta.officialCompetition");
    const lib = readFileSync(join(HERE, "..", "app", "api", "_lib", "sbiz-store.ts"), "utf8");
    expect(lib).toContain("오류 ≠ 0개");
    expect(lib).toContain("부분합을 전체인 척 금지");
  });

  it("웹 카드가 공식 경쟁 칩을 렌더한다", () => {
    const stage = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "selection", "LocationCandidatesStage.tsx"), "utf8");
    expect(stage).toContain("item.meta?.officialCompetition");
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
