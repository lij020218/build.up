/**
 * market-recommend 라우트 구조 가드 (2026-08-03 상권 단계 재설계)
 *
 * 배경: 실측 meta(측정 임대료·배후인구·공식경쟁·프랜차이즈·추이)가 scoreWithClaude 내부에서
 *  생성되고 응답 조립부가 meta 를 새로 만들면서 전량 유실된 P0 사고. 재발 방지 문자열 가드.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HERE = __dirname;
const route = readFileSync(join(HERE, "..", "app", "api", "data", "market-recommend", "route.ts"), "utf8");

describe("market-recommend 라우트 가드", () => {
  it("P0 재발 방지 — 응답 조립이 s.meta 를 병합 기반으로 시작", () => {
    expect(route).toContain("{ ...(s.meta ?? {}) }");
    // ScoredItem 타입에 meta 명시 (스프레드 tsc 우회 재발 차단)
    expect(route).toMatch(/type ScoredItem = \{[\s\S]*?meta\?: Record<string, string \| number>;[\s\S]*?\};/);
  });

  it("오귀속 방지 — candidates[0] 폴백 금지 + 전 후보 템플릿 폴백 존재", () => {
    expect(route).not.toContain("?? candidates[0]");
    // LLM 서술 매칭 실패 후보는 자기 실측 기반 템플릿으로 — 남의 동 서술 부착 불가 구조
    expect(route).toContain("buildTemplateNarration(f.cand.districtName, f.det)");
    expect(route).toContain("scoreCandidateDeterministic");
  });

  it("쿼터 규율 — 소진공 보강은 slice(0,5) 확정 후에만", () => {
    const sliceIdx = route.indexOf("candidates.slice(0, 5)");
    const enrichIdx = route.indexOf("targetCandidates.map(async (c) => {");
    expect(sliceIdx).toBeGreaterThan(-1);
    expect(enrichIdx).toBeGreaterThan(sliceIdx);
    // 전 후보 대상 보강으로의 회귀 차단
    expect(route).not.toContain("candidates.map(async (c) => {");
  });

  it("출처 정직성 — 실측 원천은 붙은 축에만 조건부 병기", () => {
    expect(route).toContain("...(meta.officialCompetition ? [{");
    expect(route).toContain("...(meta.measuredRent ? [{");
    expect(route).toContain("...(meta.backPopulation ? [{");
    expect(route).toContain("소상공인시장진흥공단");
    expect(route).toContain("한국부동산원");
  });

  it("모델 주석 정직성 — 존재하지 않는 모델명 서술 금지", () => {
    expect(route).not.toContain("Sonnet");
    expect(route).not.toContain("Claude 점수화");
  });
});

describe("market-snapshot 라우트 가드 (LLM 무관 실측 스냅샷)", () => {
  const snap = readFileSync(join(HERE, "..", "app", "api", "data", "market-snapshot", "route.ts"), "utf8");

  it("LLM 0 의존 — AI 클라이언트·키 import 금지", () => {
    expect(snap).not.toContain("createAiClient");
    expect(snap).not.toContain("getAnthropicApiKey");
  });

  it("정직성 — 축별 null 허용 + 공식/지도 병기 금지 + 출처 라벨", () => {
    expect(snap).toContain("if (axes.competition) axes.competitionMap = null;");
    expect(snap).toContain("소상공인시장진흥공단(국세청 원천)");
    expect(snap).toContain("카카오 지도 노출 기준");
    expect(snap).toContain("한국부동산원");
  });

  it("추이 원장 축적 부수효과 + 레이트리밋 + 캐시", () => {
    expect(snap).toContain("recordAreaSnapshot");
    expect(snap).toContain("checkSimpleRateLimit");
    expect(snap).toContain("checkDailyRateLimit");
    expect(snap).toContain("CACHE_TTL_MS");
  });

  it("웹 패널 — 디바운스 자동 + 비로그인 조용히 생략", () => {
    const panel = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "selection", "MarketSnapshotPanel.tsx"), "utf8");
    expect(panel).toContain("700");
    expect(panel).toContain("AbortController");
    expect(panel).toContain("비로그인 — 조용히 생략");
  });
});
