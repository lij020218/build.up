import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * AI 로드맵 생성 정직성 가드 (2026-08-03 감사 "모두 수정" 세트).
 *  상권·지원사업의 LLM 위조 경로가 되살아나지 않게 소스 레벨로 잠근다.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const prompt = readFileSync(join(HERE, "..", "..", "..", "packages", "ai", "src", "roadmap", "prompt.ts"), "utf8");
const route = readFileSync(join(HERE, "..", "app", "api", "ai", "roadmap", "generate", "route.ts"), "utf8");
const wizard = readFileSync(join(HERE, "..", "app", "lib", "components", "AIRoadmapWizard.tsx"), "utf8");

describe("🔴 상권 — 프롬프트가 수치 생성을 요구하지 않는다", () => {
  it("서울 8개 상권 하드코딩이 없다 (전국 사용자에게 환각 근거였던 블록)", () => {
    for (const banned of ["강남역: 유동인구", "홍대/합정: 유동인구", "성수: 유동인구", "서울 주요 상권 참고 데이터"]) {
      expect(prompt).not.toContain(banned);
    }
  });

  it("점수 산정·수치 요구 지시가 없다", () => {
    expect(prompt).not.toContain("S등급(90-100)");
    expect(prompt).not.toContain('"일 평균 15만명');
    expect(prompt).toContain("절대 생성하지 마세요");
  });

  it("라우트가 marketAnalysis 를 실측으로 결정론 대체한다", () => {
    expect(route).toContain("findMarketRentDistricts");
    expect(route).toContain('grade: "N/A"');
    expect(route).toContain("sbiz.or.kr");
    // 데이터 없으면 지어내지 않는다는 선언이 코드에 남아있어야
    expect(route).toContain("추정치를 지어내지 않습니다");
  });

  it("위저드가 N/A 등급에서 점수·게이지를 그리지 않는다", () => {
    expect(wizard).toContain('result.marketAnalysis.grade !== "N/A"');
    expect(wizard).toContain('result.marketAnalysis.grade === "N/A"');
  });
});

describe("🔴 지원사업 — LLM 생성 금지, SSOT 매칭만", () => {
  it("프롬프트에 프로그램 하드코딩이 없다 (연도 박제 → 낡은 금액 위조)", () => {
    for (const banned of ["예비창업패키지** (preliminary-startup)", "청년창업사관학교** (youth-startup)", "최대 7,000만원"]) {
      expect(prompt).not.toContain(banned);
    }
    expect(prompt).toContain("빈 배열([])로 반환");
  });

  it("라우트가 getMatchedProgramsV2 로 대체하고 eligible 만 내려준다", () => {
    expect(route).toContain("getMatchedProgramsV2");
    expect(route).toContain(".filter((m) => m.eligible)");
    expect(route).toContain("personalFitScore");
  });
});

describe("국세청 확인 카드 — 양 플랫폼 배선 + 정직 문구", () => {
  it("웹·iOS 모두 배선되고, 미등록·오류 문구가 웹과 iOS 에서 동일하다", () => {
    const webCard = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "shared", "NtsBizVerifyCard.tsx"), "utf8");
    const iosView = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "BizRegistrationStageView.swift"), "utf8");
    const panel = readFileSync(join(HERE, "..", "app", "lib", "components", "stages", "offline", "BizRegistrationPanel.tsx"), "utf8");
    expect(panel).toContain("NtsBizVerifyCard");
    expect(iosView).toContain("NtsBizVerifySection()");
    for (const phrase of [
      "국세청으로 등록 확인",
      "전산 반영 전일 수 있어요",
      "미등록이라는 뜻이 아니니 잠시 후 다시 시도해주세요",
      "방금 조회",
    ]) {
      expect(webCard, `web: ${phrase}`).toContain(phrase);
      expect(iosView, `ios: ${phrase}`).toContain(phrase);
    }
  });
});

describe("목표 오픈 D-day — 과거 날짜 미표시 (죽은 카운트다운 금지)", () => {
  it("웹·iOS 모두 0~730일 범위 밖은 렌더하지 않는다", () => {
    const web = readFileSync(join(HERE, "..", "app", "lib", "components", "surfaces", "RoadmapSurface.tsx"), "utf8");
    const ios = readFileSync(join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "RoadmapView.swift"), "utf8");
    expect(web).toContain("diff < 0 || diff > 730");
    expect(ios).toContain("diff >= 0, diff <= 730");
    expect(web).toContain("목표 오픈 D-");
    expect(ios).toContain("목표 오픈 D-");
  });
});
