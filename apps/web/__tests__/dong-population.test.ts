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
    expect(mr).toContain("meta.officialCompetition");
    // 팩트 라인(공식/지도 태그)은 내레이터로 이관 (2026-08-03 역할 분리)
    const nar = readFileSync(join(HERE, "..", "app", "api", "_lib", "market-narrator.ts"), "utf8");
    expect(nar).toContain("동종업종 매장 [공식]");
    expect(nar).toContain("동종업종 매장 [지도]");            // 폴백 유지
    // 소스별 밴드 분리는 프롬프트 지시가 아니라 결정론 코드 — market-scoring.ts
    const ms = readFileSync(join(HERE, "..", "app", "api", "_lib", "market-scoring.ts"), "utf8");
    expect(ms).toContain("officialSameCount");
    expect(ms).toContain("공식은 지도보다");
    const lib = readFileSync(join(HERE, "..", "app", "api", "_lib", "sbiz-store.ts"), "utf8");
    expect(lib).toContain("오류 ≠ 0개");
    expect(lib).toContain("부분합을 전체인 척 금지");
  });

  it("웹 카드가 공식 경쟁 칩을 렌더한다", () => {
    const stage = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "selection", "LocationCandidatesStage.tsx"), "utf8");
    expect(stage).toContain("item.meta?.officialCompetition");
  });
});

describe("개폐업 추이 — 자체 스냅샷 원장 (2026-08-03)", () => {
  it("라이브 위조 없음 — 관측 이력 없으면 언급 금지, 60일 미만 비교 안 함", () => {
    const lib = readFileSync(join(HERE, "..", "app", "api", "_lib", "sbiz-store.ts"), "utf8");
    expect(lib).toContain("콜드스타트: 과거 스냅샷 없으면 추이 미표시");
    expect(lib).toContain("60 * 86_400_000");                    // 60일 컷오프
    expect(lib).toContain('ignoreDuplicates: true');             // 첫 관측 보존
    const mr = readFileSync(join(HERE, "..", "app", "api", "data", "market-recommend", "route.ts"), "utf8");
    expect(mr).toContain("meta.areaTrend");
    const nar = readFileSync(join(HERE, "..", "app", "api", "_lib", "market-narrator.ts"), "utf8");
    expect(nar).toContain("개폐업 추이: 관측 이력 없음 (언급 금지)");
  });

  it("마이그레이션 — 전역 통계 RLS 잠금 + 하루 1스냅샷 유니크 + wipe 보존 선언", () => {
    const mig = readFileSync(join(HERE, "..", "..", "..", "supabase", "migrations", "20260803_000001_market_area_snapshots.sql"), "utf8");
    expect(mig).toContain("ENABLE ROW LEVEL SECURITY");
    expect(mig).toContain("UNIQUE (area_key, upjong_sig, snapshot_date)");
    const wipe = readFileSync(join(HERE, "..", "__tests__", "account-wipe-coverage.test.ts"), "utf8");
    expect(wipe).toContain("market_area_snapshots");
  });

  it("iOS — meta 디코딩 + 실측 칩 4종 렌더 (웹 패리티)", () => {
    const svc = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneData", "AIRoadmap", "MarketRecommendService.swift"), "utf8");
    for (const f of ["measuredRent", "backPopulation", "officialCompetition", "areaTrend"]) {
      expect(svc, f).toContain(f);
    }
    const view = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "LocationCandidatesStageView.swift"), "utf8");
    expect(view).toContain("measuredMetaLines(item)");
    expect(view).toContain("MeasuredMetaChip");
  });
});

describe("프랜차이즈 반경 실측 (2026-08-03 사장님 스펙)", () => {
  it("같은 브랜드 존재 = 영업지역 경고 -15점 규칙이 프롬프트에 있다", () => {
    const mr = readFileSync(join(HERE, "..", "app", "api", "data", "market-recommend", "route.ts"), "utf8");
    // -15 규칙은 프롬프트 지시가 아니라 서버 결정론 강제 (2026-08-03) — LLM 이 어겨도 무관
    const ms = readFileSync(join(HERE, "..", "app", "api", "_lib", "market-scoring.ts"), "utf8");
    expect(ms).toContain("-15");
    expect(ms).toContain("영업지역 보호");
    expect(ms).toContain("본사 영업담당에게 출점 가능 여부 확인 필수");
    const nar = readFileSync(join(HERE, "..", "app", "api", "_lib", "market-narrator.ts"), "utf8");
    expect(nar).toContain("실측 라인이 없으면 프랜차이즈 관련 언급 금지");
    expect(mr).toContain("meta.franchisePresence");
    expect(mr).toContain("franchiseBrandId");
  });

  it("헬퍼 정직성 — 오류=null(부분 결과 위장 금지)·표본 한계 라벨", () => {
    const lib = readFileSync(join(HERE, "..", "app", "api", "_lib", "sbiz-store.ts"), "utf8");
    expect(lib).toContain("오류 = 실측 불가 (부분 결과 위장 금지)");
    expect(lib).toContain("sampled");
    expect(lib).toContain("영업지역 보호로 가맹 자체가 불가할 수 있는 결정 신호");
  });

  it("웹·iOS — 브랜드 전달 + 칩 렌더", () => {
    const stage = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "selection", "LocationCandidatesStage.tsx"), "utf8");
    expect(stage).toContain('franchiseBrandId: startupType === "franchise" ? selectedFranchiseBrandId : undefined');
    expect(stage).toContain("item.meta?.franchisePresence");
    const iosSvc = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneData", "AIRoadmap", "MarketRecommendService.swift"), "utf8");
    expect(iosSvc).toContain("franchiseBrandId");
    expect(iosSvc).toContain("franchisePresence");
    const iosView = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "LocationCandidatesStageView.swift"), "utf8");
    expect(iosView).toContain("stage.franchise.selectedBrandId");
    expect(iosView).toContain("franchisePresence");
  });
});

describe("배선 — 라우트 주입 + 웹 칩 + 번들 격리", () => {
  it("market-recommend 가 실측 주입 + 매칭 없음 언급 금지 + meta 결정론 부착", () => {
    const mr = readFileSync(join(HERE, "..", "app", "api", "data", "market-recommend", "route.ts"), "utf8");
    expect(mr).toContain("findDongPopulation");
    expect(mr).toContain("meta.backPopulation");
    const nar = readFileSync(join(HERE, "..", "app", "api", "_lib", "market-narrator.ts"), "utf8");
    expect(nar).toContain("배후 주거인구: 매칭 없음 (언급 금지)");
    expect(nar).toContain('"유동인구" 라고 부르지 마라');
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

describe("프랜차이즈 시도 분포 — 신형 가족 단일 SSOT (혼동 금지, 2026-08-03)", () => {
  it("findBrandRegional — 시도 게이트·실측 0 유지·라벨 강제", async () => {
    const { findBrandRegional, formatBrandRegionalLine, FRANCHISE_REGIONAL_YR } = await import("../app/api/_lib/franchise-regional");
    // 시도를 못 갈라내면 null (전국수 단독 표기 금지)
    expect(findBrandRegional("kftc-any", "둔산동 어딘가")).toBeNull();
    // 존재 브랜드 스모크 — JSON에서 하나 집어 실측 대조
    const raw = (await import("../app/api/_lib/franchise-regional.json")).default as unknown as {
      _yr: string; brands: Record<string, { total: number; areas: Record<string, number> }>;
    };
    expect(raw._yr).toBe(FRANCHISE_REGIONAL_YR);
    const [id, b] = Object.entries(raw.brands)[0]!;
    // 전국수 = 시도합 (같은 가족 내부 정합) + "전체" 행 이중계상 금지
    expect(Object.values(b.areas).reduce((a, n) => a + n, 0)).toBe(b.total);
    expect(b.areas["전체"]).toBeUndefined();
    const r = findBrandRegional(id, "서울 마포구");
    expect(r).not.toBeNull();
    expect(r!.nationalTotal).toBe(b.total);
    expect(r!.sidoCount).toBe(b.areas["서울"] ?? 0); // 0개 = 실측 0, null 아님
    // 라벨 연도 = acntgYr(실제 회계연도) — jngBizCrtraYr(등록기준) 아님
    const line = formatBrandRegionalLine("테스트", r!);
    expect(line).toContain("공정위 정보공개서");
    expect(line).toContain(`${r!.yr}년 기준`);
    expect(line).toContain("가맹+직영");
    // 메가커피 실측 대조 (원시행 검증 2026-08-03: 전국 2,709 · 대전 67 · 서울 665)
    const mega = findBrandRegional("mega-coffee", "대전 둔산동");
    expect(mega).not.toBeNull();
    expect(mega!.nationalTotal).toBe(2709);
    expect(mega!.sidoCount).toBe(67);
    expect(mega!.yr).toBe("2023");
  });

  it("배선 — 라우트 최상위 1회 + 프롬프트 라벨 + 웹·iOS 표시 1회 (카드 중복 금지)", () => {
    const mr = readFileSync(join(HERE, "..", "app", "api", "data", "market-recommend", "route.ts"), "utf8");
    expect(mr).toContain("findBrandRegional");
    expect(mr).toContain("franchiseRegional: fRegionalLine");
    const nar = readFileSync(join(HERE, "..", "app", "api", "_lib", "market-narrator.ts"), "utf8");
    expect(nar).toContain("반경 실측이 우선 신호");
    // 시도 분포는 후보별 meta 에 붙이지 않는다 (시도 단위 수치 — 카드 5장 중복 방지)
    expect(mr).not.toContain("meta.franchiseRegional");
    const stage = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "selection", "LocationCandidatesStage.tsx"), "utf8");
    expect(stage).toContain("data.franchiseRegional");
    expect(stage).toContain("franchiseRegionalNote");
    const iosSvc = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneData", "AIRoadmap", "MarketRecommendService.swift"), "utf8");
    expect(iosSvc).toContain("franchiseRegional");
    const iosView = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "LocationCandidatesStageView.swift"), "utf8");
    expect(iosView).toContain("aiFranchiseRegional");
  });

  it("혼동 금지 — 신형 분포 모듈이 구형 officialStats 수치를 섞지 않는다", () => {
    const lib = readFileSync(join(HERE, "..", "app", "api", "_lib", "franchise-regional.ts"), "utf8");
    // 구형 계보 데이터 import 금지 (주석 언급은 허용 — 코드 접근만 차단)
    expect(lib).not.toMatch(/import[^;]*franchise-brands/);
    expect(lib).not.toContain("getFranchiseBrandById");
    expect(lib).toContain("병기하지 말 것");
    // 서버 전용 — shared index 미export
    const sharedIndex = readFileSync(join(HERE, "..", "..", "..", "packages", "shared", "src", "index.ts"), "utf8");
    expect(sharedIndex).not.toContain("franchise-regional");
  });
});
