import { describe, it, expect } from "vitest";
import { APP_COMPLIANCE_CONTENT, DOCUMENT_GLOSSARY_SECTION, REGISTRATION_SETUP_CONTENT, STAGE_CONTENT_REGISTRY } from "../stages";

/**
 * app-compliance 콘텐츠 무결성 (2026-09-11, 구함 사례 문서 기반).
 *  - 레지스트리 등록 · 4페이지 구조 · 체크리스트 id 유일 · dateOffset config 유효 · 비교표 열 수 일치
 *  - 문서의 공식 출처 수치(다날 5만원/1,200건 · 통합인증 40원 · 카드 PG 33만원)가 본문에 그대로 있음
 *  - 오프라인 registration-setup 에도 같은 서류 용어 사전 섹션이 들어감
 */

const ALL_SECTIONS = APP_COMPLIANCE_CONTENT.pages.flatMap((p) => p.sections);

describe("app-compliance 콘텐츠", () => {
  it("레지스트리에 등록되어 있고 4페이지(절차 지도·본인인증·PG 심사·법적 페이지) 구조다", () => {
    expect(STAGE_CONTENT_REGISTRY["app-compliance"]).toBe(APP_COMPLIANCE_CONTENT);
    expect(APP_COMPLIANCE_CONTENT.pages.map((p) => p.id)).toEqual(["map", "auth-pg", "pg-review", "legal-dates"]);
    expect(Object.keys(APP_COMPLIANCE_CONTENT.byCategory)).toEqual(["startup-tech", "online-digital"]);
  });

  it("prepChecklist 항목 id 가 전역 유일하다(로컬 저장 키 충돌 방지)", () => {
    const ids = ALL_SECTIONS.flatMap((s) => (s.kind === "prepChecklist" ? s.items.map((it) => it.id) : []));
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("dateOffset 위젯 2개 — D+30(위치정보법) · 7일 전(개정 고지) config 가 유효하다", () => {
    const widgets = ALL_SECTIONS.filter((s) => s.kind === "interactive" && s.ref === "dateOffset");
    expect(widgets).toHaveLength(2);
    const configs = widgets.map((w) => (w.kind === "interactive" ? w.config ?? {} : {}));
    expect(configs.map((c) => [c.offsetDays, c.direction])).toEqual([
      [30, "after"],
      [7, "before"],
    ]);
    for (const c of configs) {
      expect(typeof c.title).toBe("string");
      expect(typeof c.inputLabel).toBe("string");
      expect(typeof c.resultLabel).toBe("string");
    }
    const notice = configs.find((c) => typeof c.noticeTemplate === "string")?.noticeTemplate as string;
    expect(notice).toContain("{{input}}");
    expect(notice).toContain("{{result}}");
  });

  it("compareTable 행의 cells 수 = columns 수 - 1 이고, 모르는 값은 '미확인' 으로만 적는다", () => {
    const tables = ALL_SECTIONS.filter((s) => s.kind === "compareTable");
    expect(tables.length).toBeGreaterThan(0);
    for (const t of tables) {
      if (t.kind !== "compareTable") continue;
      for (const row of t.rows) expect(row.cells).toHaveLength(t.columns.length - 1);
    }
    // KCP 요금은 공개 페이지가 없어 '미확인' 으로 시작, 성별·테스트는 개발자센터에서 확인된 사실.
    const kcp = tables.flatMap((t) => (t.kind === "compareTable" ? t.rows : [])).find((r) => r.label.includes("NHN KCP"));
    expect(kcp?.cells[0]).toMatch(/^미확인/);
    expect(kcp?.cells[1]).toContain("성별");
    expect(kcp?.cells[2]).toContain("testcert.kcp.co.kr");
  });

  it("조사로 확인된 수치·조문이 본문에 그대로 있다 (지어낸 금액 없음, 정정 사항 반영)", () => {
    const text = JSON.stringify(APP_COMPLIANCE_CONTENT);
    expect(text).toContain("월정액 5만/1,200 · 10만/2,400 · 20만/4,800 · 30만/7,200건");
    expect(text).toContain("건당 40원");
    expect(text).toContain("33만 원(카드 PG 가입비 30만 + VAT)");
    expect(text).toContain("직계약 등록비 10만");
    // 정정: 위치정보법 미신고는 과태료가 아니라 형사처벌(제40조)
    expect(text).toContain("3년 이하 징역 또는 3천만원 이하 벌금(제40조)");
    expect(text).not.toContain("과태료(금액 미확인)");
    // 정정: 본인확인만 신청 시 앱스토어 등록 전 APK/앱심사 문서로 심사 가능(포트원 FAQ)
    expect(text).toContain("APK 파일 또는 앱심사 문서");
    // 보험료는 여전히 미확인
    expect(text).toContain("보증보험(1년)");
    expect(text).toContain("보험료는 미확인");
  });

  it("서류 용어 사전은 registration-setup(오프라인) 사업자등록 페이지에도 같은 객체로 들어간다", () => {
    const page = REGISTRATION_SETUP_CONTENT.pages.find((p) => p.id === "biz-registration");
    expect(page?.sections).toContain(DOCUMENT_GLOSSARY_SECTION);
    const inApp = ALL_SECTIONS.includes(DOCUMENT_GLOSSARY_SECTION);
    expect(inApp).toBe(true);
  });
});
