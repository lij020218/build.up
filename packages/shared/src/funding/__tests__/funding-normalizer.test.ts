import { describe, it, expect } from "vitest";
import {
  extractMaxAge, extractRegions, extractIndustries, deriveStatus,
  normalizeLiveProgram, normalizeName, mergeFundingPrograms,
} from "../funding-normalizer";
import type { GovernmentSupportProgram } from "../../adapters/support-programs";
import type { StartupProgram } from "../../startup-programs";

describe("funding-normalizer — 텍스트 파싱", () => {
  it("연령: 만 39세/청년/39세 이하 추출", () => {
    expect(extractMaxAge("만 39세 이하 청년")).toBe(39);
    expect(extractMaxAge("만34세까지")).toBe(34);
    expect(extractMaxAge("청년 창업자 대상")).toBe(39);
    expect(extractMaxAge("연령 제한 없음")).toBeUndefined();
  });
  it("지역: 시·도 추출(없으면 전국=undefined)", () => {
    expect(extractRegions("서울 소재 기업")).toEqual(["서울"]);
    expect(extractRegions("부산·경남 지역 한정")).toEqual(["부산", "경남"]);
    expect(extractRegions("전국 누구나")).toBeUndefined();
  });
  it("업종: 키워드 추출(없으면 전업종=undefined)", () => {
    expect(extractIndustries("외식·음식점 대상")).toEqual(["food"]);
    expect(extractIndustries("AI·반도체 기술창업")).toEqual(["startup-tech"]);
    expect(extractIndustries("일반 중소기업")).toBeUndefined();
  });
  it("상태: 시작/종료일 기준 open/upcoming/closed", () => {
    expect(deriveStatus("2026-01-01", "2026-12-31", "2026-06-09")).toBe("open");
    expect(deriveStatus("2026-07-01", "2026-08-01", "2026-06-09")).toBe("upcoming");
    expect(deriveStatus("2026-01-01", "2026-03-01", "2026-06-09")).toBe("closed");
    expect(deriveStatus(undefined, undefined, "2026-06-09")).toBe("open"); // 상시
  });
});

describe("funding-normalizer — 정규화 + 병합", () => {
  const gov: GovernmentSupportProgram = {
    id: "bizinfo-1", source: "bizinfo",
    programName: "서울 청년 창업 지원사업",
    organizerName: "서울특별시", supportCategory: "창업",
    applicationStart: "2026-06-01", applicationEnd: "2026-07-31",
    isOpen: true, targetDescription: "만 39세 이하 서울 소재 예비창업자",
    fetchedAt: "2026-06-09T00:00:00Z",
  };
  it("라이브 → StartupProgram 정규화(연령·지역·기간·상태)", () => {
    const p = normalizeLiveProgram(gov, "2026-06-09");
    expect(p.maxAge).toBe(39);
    expect(p.regions).toEqual(["서울"]);
    expect(p.applicationStatus).toBe("open");
    expect(p.applicationDeadline).toBe("2026-07-31");
    expect(p.name.ko).toBe("서울 청년 창업 지원사업");
  });
  it("이름 정규화 — 연도·차수·괄호 제거", () => {
    expect(normalizeName("2026년 예비창업패키지(일반형) 제2차")).toBe(normalizeName("예비창업패키지"));
  });
  it("병합 — 중복은 큐레이션 우선 + 라이브 최신 마감일", () => {
    const curated: StartupProgram[] = [{
      id: "cur-1", category: "government",
      name: { ko: "예비창업패키지", en: "x" }, organizer: { ko: "창업진흥원", en: "x" },
      target: { ko: "", en: "" }, benefit: { ko: "", en: "" }, season: { ko: "옛 시즌", en: "" },
      url: "x", forSmallBiz: true, forFranchise: true, dataYear: "2026",
      applicationDeadline: "2026-02-13", applicationStatus: "closed",
    }];
    const live: StartupProgram[] = [normalizeLiveProgram({
      ...gov, id: "bizinfo-2", programName: "2026년 예비창업패키지(일반형)",
      applicationStart: "2026-06-01", applicationEnd: "2026-08-31",
    }, "2026-06-09")];
    const merged = mergeFundingPrograms(curated, live);
    expect(merged.length).toBe(1); // 중복 병합
    expect(merged[0].id).toBe("cur-1"); // 큐레이션 우선
    expect(merged[0].applicationDeadline).toBe("2026-08-31"); // 라이브 최신 마감일
    expect(merged[0].applicationStatus).toBe("open");
  });
  it("병합 — 큐레이션에 없는 라이브는 추가(breadth)", () => {
    const merged = mergeFundingPrograms([], [normalizeLiveProgram(gov, "2026-06-09")]);
    expect(merged.length).toBe(1);
    expect(merged[0].id).toBe("bizinfo-1");
  });
});
