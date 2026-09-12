import { describe, it, expect } from "vitest";
import {
  IDENTITY_CHANNELS,
  recommendIdentityChannel,
  pickPlan,
  runPgPrecheck,
  htmlToSearchableText,
  PG_PRECHECK_RULES,
  decodeDocumentRequest,
  DOC_TERMS,
} from "../compliance";

/**
 * 앱·플랫폼 규제·계약 도구(2026-09-11) — 순수 로직 검증.
 *  선택기: 구함 요건(성별 필요·결제 없음) → 통합인증 제외, 테스트 필요 시 KCP 1순위, 아니면 다날(비용 공개) 1순위.
 *  프리체크: 구함 반려 2건(전화번호 없음·상품/가격 없음·'곧 출시')을 HTML 에서 잡아내는가.
 *  해석기: 다날 서류 메일에서 사본·인감증명서·실제소유자·마스킹을 찾아 체크리스트를 만드는가.
 */

describe("본인인증 채널 선택기", () => {
  it("채널 SSOT 수치 — 다날 요금제 4단계·통합인증 40원·KCP 요금 미공개", () => {
    const danal = IDENTITY_CHANNELS.find((c) => c.id === "danal")!;
    expect(danal.plans?.map((p) => [p.monthlyKrw, p.cases])).toEqual([[50000, 1200], [100000, 2400], [200000, 4800], [300000, 7200]]);
    expect(danal.joinFeeDirectKrw).toBe(100000);
    expect(danal.joinFeeViaPortoneKrw).toBe(0);
    expect(IDENTITY_CHANNELS.find((c) => c.id === "inicis-unified")!.perCaseKrw).toBe(40);
    const kcp = IDENTITY_CHANNELS.find((c) => c.id === "kcp")!;
    expect(kcp.plans).toBeNull();
    expect(kcp.testBeforeContract).toBe(true);
  });

  it("pickPlan — 건수를 덮는 최소 요금제, 최대 초과면 null", () => {
    const plans = IDENTITY_CHANNELS.find((c) => c.id === "danal")!.plans!;
    expect(pickPlan(plans, 0)?.monthlyKrw).toBe(50000);
    expect(pickPlan(plans, 1200)?.monthlyKrw).toBe(50000);
    expect(pickPlan(plans, 1201)?.monthlyKrw).toBe(100000);
    expect(pickPlan(plans, 8000)).toBeNull();
  });

  it("구함 요건(성별 필요·테스트 불필요·결제 없음) → 통합인증 제외, 다날 추천, 33만원 경고·콘솔 경로 포함", () => {
    const r = recommendIdentityChannel({ needsGender: true, needsForeigner: false, monthlyCases: 300, needsPreLaunchTest: false, acceptsPayments: false });
    const byId = Object.fromEntries(r.verdicts.map((v) => [v.channelId, v]));
    expect(byId["inicis-unified"].status).toBe("excluded");
    expect(byId["inicis-unified"].reasons.join(" ")).toContain("성별");
    expect(byId.danal.status).toBe("recommended");
    expect(byId.danal.monthlyCostKrw).toBe(50000);
    expect(byId.kcp.status).toBe("possible");
    expect(r.globalWarnings.join(" ")).toContain("33만 원");
    expect(r.consoleSteps.length).toBeGreaterThan(3);
    expect(r.consoleSteps.join(" ")).toContain("채널 속성");
  });

  it("출시 전 테스트 필요 → KCP 1순위, 다날엔 테스트 불가 경고", () => {
    const r = recommendIdentityChannel({ needsGender: true, needsForeigner: true, monthlyCases: 500, needsPreLaunchTest: true, acceptsPayments: true });
    const byId = Object.fromEntries(r.verdicts.map((v) => [v.channelId, v]));
    expect(byId.kcp.status).toBe("recommended");
    expect(byId.danal.warnings.join(" ")).toContain("테스트 불가");
    expect(byId.danal.warnings.join(" ")).toContain("내외국인 반환 여부 미확인");
    expect(r.globalWarnings).toEqual([]);
    expect(r.consoleSteps).toEqual([]);
  });

  it("성별 불필요·소량 → 통합인증(건당 40원)이 비용상 1순위", () => {
    const r = recommendIdentityChannel({ needsGender: false, needsForeigner: false, monthlyCases: 200, needsPreLaunchTest: false, acceptsPayments: true });
    expect(r.verdicts[0].channelId).toBe("inicis-unified");
    expect(r.verdicts[0].monthlyCostKrw).toBe(8000);
  });
});

const GUHAM_BEFORE = `
<html><head><title>구함</title></head><body>
<h1>구함 — 곧 출시!</h1>
<p>서울 핫플에 같이 갈 사람을 구하는 앱. 팝업·전시·공연·맛집·카페·온라인 게임까지, 혼자 가기 애매한 곳에 같이 갈 파티를 만들고 참여할 수 있습니다. 파티장은 시간과 장소를 정해 모집하고, 참여자는 프로필과 후기를 보고 신청합니다. 본인인증으로 안전하게, 매너 점수로 신뢰를 쌓는 서비스입니다. 회원가입은 무료이며 결제 기능은 없습니다.</p>
<footer>상호: 구함 | 대표: 이영준 | 사업자등록번호: 123-45-67890 | 주소: 서울시 어딘가
<a href="/terms">이용약관</a> <a href="/privacy">개인정보처리방침</a></footer>
</body></html>`;

const GUHAM_AFTER = GUHAM_BEFORE
  .replace("곧 출시!", "지금 다운로드")
  .replace("주소: 서울시 어딘가", "주소: 서울시 어딘가 | 전화: 010-1234-5678 | 이메일: hi@guham.app | 개인정보 보호책임자: 이영준")
  .replace("</footer>", `</footer><section><h2>서비스 안내</h2><p>상품명: 구함 기본 이용권 / 가격: 0원 (무료) / 환불: 무료 서비스로 결제·환불이 발생하지 않습니다</p><a href="https://apps.apple.com/kr/app/id1">App Store</a></section>`);

describe("PG 심사 프리체크", () => {
  it("규칙 SSOT — 반려급 항목에 전화번호·상품/가격·약관·환불 포함", () => {
    const rejectIds = PG_PRECHECK_RULES.filter((r) => r.severity === "reject").map((r) => r.id);
    for (const id of ["phone", "product-price", "terms-link", "privacy-link", "refund-policy", "biz-number"]) expect(rejectIds).toContain(id);
    expect(new Set(PG_PRECHECK_RULES.map((r) => r.id)).size).toBe(PG_PRECHECK_RULES.length);
  });

  it("htmlToSearchableText — 스크립트 제거·href 수집", () => {
    const { text, hrefs } = htmlToSearchableText(`<script>var a=1</script><a href="/terms">이용약관</a><p>본문</p>`);
    expect(text).not.toContain("var a");
    expect(text).toContain("이용약관");
    expect(hrefs).toEqual(["/terms"]);
  });

  it("구함 반려 당시 사이트 — 전화번호·상품/가격·환불이 fail, '곧 출시' warn", () => {
    const r = runPgPrecheck({ url: "https://guham.app", html: GUHAM_BEFORE });
    const st = Object.fromEntries(r.items.map((i) => [i.id, i.status]));
    expect(st.phone).toBe("fail");
    expect(st["product-price"]).toBe("fail");
    expect(st["refund-policy"]).toBe("fail");
    expect(st["coming-soon"]).toBe("warn");
    expect(st["biz-number"]).toBe("pass");
    expect(st["terms-link"]).toBe("pass");
    expect(st["privacy-link"]).toBe("pass");
    expect(r.rejectRiskCount).toBe(3);
    expect(r.items.find((i) => i.id === "phone")!.rejectAs).toContain("유선번호 미표기");
    expect(r.appOnlyNote).toContain("APK");
  });

  it("보완 후 사이트 — 반려 위험 0, 스토어 링크 인식", () => {
    const r = runPgPrecheck({ url: "https://guham.app", html: GUHAM_AFTER });
    const st = Object.fromEntries(r.items.map((i) => [i.id, i.status]));
    expect(r.rejectRiskCount).toBe(0);
    expect(st.phone).toBe("pass");
    expect(st["product-price"]).toBe("pass");
    expect(st["coming-soon"]).toBe("pass");
    expect(st["store-link"]).toBe("pass");
    expect(st["privacy-officer"]).toBe("pass");
    expect(r.spaSuspect).toBe(false);
  });

  it("빈 SPA 셸 — spaSuspect true", () => {
    const r = runPgPrecheck({ url: "https://x.app", html: `<html><body><div id="root"></div><script src="/app.js"></script></body></html>` });
    expect(r.spaSuspect).toBe(true);
  });
});

describe("서류 요청 해석기", () => {
  it("용어 SSOT — id 유일, 별칭 비어 있지 않음", () => {
    expect(new Set(DOC_TERMS.map((t) => t.id)).size).toBe(DOC_TERMS.length);
    for (const t of DOC_TERMS) expect(t.aliases.length).toBeGreaterThan(0);
  });

  it("다날 서류 안내 메일 → 사본·인감증명서·실제소유자·마스킹·전자계약 매칭 + 체크리스트", () => {
    const mail = `안녕하세요 다날입니다. 계약서 원본 2부(통합계약서, 특약서), 사업자등록증 사본, 인감증명서(전자계약 시 생략), 대표자 신분증 사본(마스킹 없이), 고객정보 및 실제소유자 확인서를 보내주세요.`;
    const d = decodeDocumentRequest(mail);
    const ids = d.matches.map((m) => m.term.id);
    for (const id of ["original", "biz-cert", "seal-cert", "id-copy", "masking", "owner-form", "e-contract", "special-terms", "copy"]) expect(ids).toContain(id);
    expect(ids).not.toContain("biz-cert-proof");
    expect(d.checklist.length).toBeGreaterThanOrEqual(8);
    expect(d.eContractHint).toContain("인감증명서");
    // '사본' 단독 항목은 맨 뒤
    expect(ids[ids.length - 1]).toBe("copy");
  });

  it("'사업자등록증명원' 은 등록증이 아니라 증명 항목으로 잡힌다", () => {
    const d = decodeDocumentRequest("사업자등록증명원 1부 제출 바랍니다");
    const ids = d.matches.map((m) => m.term.id);
    expect(ids).toContain("biz-cert-proof");
  });
});
