/**
 * compliance/pg-precheck.ts — PG 입점심사 사전 검사(규칙 SSOT + 순수 검사기).
 *
 * 문제(구함 사례 2026-09): PG 심사는 심사관이 사이트 URL을 열어 사업자 정보·전화번호·상품/가격·약관·환불을
 *   눈으로 확인한다. 구함은 ① 유선번호 미표기 ② "상품 혹은 서비스가 등록되지 않았거나 상세 설명 및
 *   가격 정보가 확인되지 않았어요" 로 두 번 반려됐다. 반려 1건당 재심사 14일+.
 *
 * 파운드원이 대신 하는 것: 제출 전에 같은 검사를 기계가 먼저 한다.
 *   웹 API(/api/compliance/pg-precheck)가 URL을 안전하게 받아(https·SSRF 가드) HTML을 이 함수에 넘기고,
 *   웹·iOS 위젯은 결과를 항목별 통과/미달 + 반려 문구 + 고치는 법으로 보여준다.
 *
 * 규칙 출처(사이트 하단 표기·상품·정책):
 *   - 식스샵 PG 연동: 사업자등록번호·상호·대표자·개인정보관리책임자·사업장 소재지·전화번호·이메일 하단 노출,
 *     이용약관·개인정보처리방침 필수, 빈 페이지 있으면 보류, 상품 1개 이상(이미지 포함), 배송/교환/환불 정책.
 *   - 캠페인어스: 상품명에 '테스트'·'샘플' 제거, 심사 중 상품 정보 변경 금지, 카드사 심사 7~14영업일.
 *   - 포트원 FAQ(구축요건): PG·카드사가 URL에서 상품·판매금액·사업자정보·환불정책 확인. 미구축 시 지연·반려.
 *     **본인확인 서비스만 신청하는 경우 앱스토어 등록 전 APK 파일 또는 앱심사 문서로 진행 가능.**
 *   - 포트원 블로그(반려 3원인): 환불 가능 기간·절차 명시, 단순 "환불 가능" 표현 부족.
 *
 * 한계: 정적 HTML 텍스트 검사. 클라이언트 렌더(SPA)·이미지 속 텍스트는 못 본다 → spaSuspect 로 알린다.
 */

export type PrecheckSeverity = "reject" | "warn" | "info";
export type PrecheckStatus = "pass" | "fail" | "warn" | "info";

export type PrecheckRule = {
  id: string;
  label: string;
  severity: PrecheckSeverity;
  /** 심사에서 돌아오는 반려 문구·결과(실측·공식 안내). */
  rejectAs: string;
  /** 고치는 법 한 줄. */
  fix: string;
  /** 검사 방식 설명(화면 툴팁용). */
  how: string;
};

export const PG_PRECHECK_RULES: readonly PrecheckRule[] = [
  { id: "biz-number", label: "사업자등록번호 표기", severity: "reject", rejectAs: "사업자 정보 미표기", fix: "푸터에 000-00-00000 형식으로 표기 (사업자등록증과 동일)", how: "본문에서 000-00-00000 패턴 탐지" },
  { id: "company-name", label: "상호(회사명) 표기", severity: "reject", rejectAs: "사업자 정보 미표기", fix: "푸터에 '상호: OOO' 표기 — 사업자등록증 상호와 완전히 일치", how: "'상호'·'회사명'·'법인명' 라벨 탐지" },
  { id: "representative", label: "대표자 성명 표기", severity: "reject", rejectAs: "사업자 정보 미표기", fix: "푸터에 '대표: 홍길동' 표기", how: "'대표'·'대표자' 라벨 탐지" },
  { id: "address", label: "사업장 소재지 표기", severity: "reject", rejectAs: "사업자 정보 미표기", fix: "푸터에 '주소:' 또는 '사업장 소재지:' 표기", how: "'주소'·'사업장 소재지' 라벨 탐지" },
  { id: "phone", label: "전화번호 표기", severity: "reject", rejectAs: "유선번호 미표기 (구함 반려 1)", fix: "유선번호가 없으면 휴대폰 번호로도 통과 사례 있음(구함) — 000-0000-0000 형식으로 푸터에", how: "02/0XX/010/15XX-XXXX 번호 패턴 탐지" },
  { id: "email", label: "이메일 표기", severity: "warn", rejectAs: "연락처 미비로 보류 가능", fix: "푸터에 문의 이메일 표기", how: "이메일 패턴 탐지" },
  { id: "privacy-officer", label: "개인정보관리책임자 표기", severity: "warn", rejectAs: "법적 필수 정보 미비(전자상거래법 표시사항)", fix: "푸터 또는 처리방침에 '개인정보 보호책임자: 이름·연락처'", how: "'개인정보 (보호|관리)책임자' 탐지" },
  { id: "terms-link", label: "이용약관 링크", severity: "reject", rejectAs: "약관 미비 — 심사 보류", fix: "'이용약관' 텍스트의 링크를 푸터에 — 빈 페이지면 보류되니 내용까지", how: "'이용약관'·terms 링크/텍스트 탐지" },
  { id: "privacy-link", label: "개인정보처리방침 링크", severity: "reject", rejectAs: "처리방침 미비 — 심사 보류", fix: "'개인정보처리방침' 링크를 푸터에 — 수집 항목·위탁사 포함", how: "'개인정보처리방침'·privacy 링크/텍스트 탐지" },
  { id: "product-price", label: "상품·서비스 명세 + 가격", severity: "reject", rejectAs: "상품 혹은 서비스가 등록되지 않았거나 상세 설명 및 가격 정보가 확인되지 않았어요 (구함 반려 2)", fix: "무료라도 상품명·가격(0원)·상세·제공방식·환불을 한 페이지에 — 상품 명세 템플릿 사용", how: "가격 표기(원/₩/무료/0원) + 상품·서비스·이용권 단어 동시 탐지" },
  { id: "refund-policy", label: "환불·취소 규정", severity: "reject", rejectAs: "불충분한 환불 정책 (포트원 반려 원인 2)", fix: "환불 가능 기간·절차를 구체적으로 — 무료 서비스는 '결제·환불 없음' 명시", how: "'환불'·'취소 규정'·'반품/교환' 탐지" },
  { id: "test-sample-name", label: "상품명에 '테스트/샘플' 없음", severity: "warn", rejectAs: "테스트 상품으로 판단 — 보류", fix: "상품명에서 '테스트'·'샘플' 제거", how: "'테스트 상품'·'샘플' 단어 탐지" },
  { id: "coming-soon", label: "'곧 출시' 문구 없음", severity: "warn", rejectAs: "서비스 미등록으로 읽힘 (구함 반려 2의 숨은 원인)", fix: "출시 전이면 TestFlight 공개 링크·웹 데모를 걸거나, 본인확인만 신청 시 APK/앱심사 문서로 진행", how: "'곧 출시'·'출시 예정'·coming soon 탐지" },
  { id: "store-link", label: "앱스토어/플레이 링크", severity: "info", rejectAs: "(참고) 서비스 실재 증빙", fix: "정식 등록 후 App Store·Google Play 링크를 홈에", how: "apps.apple.com / play.google.com 링크 탐지" },
  { id: "telecom-number", label: "통신판매업 신고번호", severity: "info", rejectAs: "(참고) 결제 받는 서비스만 해당", fix: "인앱결제·광고수익이 있으면 신고 후 번호 표기. 결제 없는 무료 앱은 불필요", how: "'통신판매업' 탐지" },
];

export type PrecheckItem = {
  id: string;
  label: string;
  severity: PrecheckSeverity;
  status: PrecheckStatus;
  /** 탐지된 근거(짧게). */
  evidence: string | null;
  rejectAs: string;
  fix: string;
};

export type PgPrecheckResult = {
  url: string;
  items: PrecheckItem[];
  /** severity=reject 인데 fail 인 항목 수 — 0 이면 제출 가능. */
  rejectRiskCount: number;
  warnCount: number;
  /** 본문 텍스트가 매우 짧음 → 클라이언트 렌더(SPA) 또는 빈 페이지 의심. */
  spaSuspect: boolean;
  textLength: number;
  /** 앱 전용 서비스 안내(포트원 FAQ) — 항상 포함. */
  appOnlyNote: string;
};

export const APP_ONLY_NOTE =
  "앱 전용 서비스라 사이트가 없거나 출시 전이면: 본인확인 서비스만 신청하는 경우 앱스토어 등록 전 APK 파일 또는 앱심사 문서 형태로 심사 진행이 가능합니다(포트원 FAQ '서비스 구축요건').";

/** HTML → 평문(스크립트·스타일 제거, 태그 제거, 공백 정리). href 도 텍스트에 합쳐 링크 검사에 쓴다. */
export function htmlToSearchableText(html: string): { text: string; hrefs: string[] } {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const hrefs: string[] = [];
  for (const m of noScript.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) hrefs.push(m[1]);
  const text = noScript
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|footer|header)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return { text, hrefs };
}

const PHONE_RE = /(?:0(?:2|[3-6]\d|70|[15]0)-\d{3,4}-\d{4})|(?:1[5-9]\d{2}-\d{4})/;
const BIZ_RE = /\d{3}-\d{2}-\d{5}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PRICE_RE = /(?:\d{1,3}(?:,\d{3})+|\d+)\s*원|₩\s*\d|\b0원\b|무료/;
const PRODUCT_WORD_RE = /상품|서비스\s*(?:안내|명세|소개)|이용권|요금제|플랜/;

function firstMatch(re: RegExp, text: string): string | null {
  const m = re.exec(text);
  return m ? m[0].slice(0, 60) : null;
}

/** 순수 검사기 — 서버(API)와 테스트에서 호출. */
export function runPgPrecheck(input: { url: string; html: string }): PgPrecheckResult {
  const { text, hrefs } = htmlToSearchableText(input.html);
  const lower = text.toLowerCase();
  const hrefBlob = hrefs.join(" ").toLowerCase();

  const has = (re: RegExp): string | null => firstMatch(re, text);
  const hasAny = (re: RegExp): string | null => firstMatch(re, `${text}\n${hrefBlob}`);

  const evidenceById: Record<string, { found: boolean; evidence: string | null }> = {
    "biz-number": pick(has(BIZ_RE)),
    "company-name": pick(has(/상호\s*[:：]|회사명\s*[:：]|법인명\s*[:：]|상호명\s*[:：]/)),
    representative: pick(has(/대표(?:자|이사)?\s*(?:성명)?\s*[:：]/)),
    address: pick(has(/(?:사업장\s*(?:소재지|주소)|주소)\s*[:：]/)),
    phone: pick(has(PHONE_RE)),
    email: pick(has(EMAIL_RE)),
    "privacy-officer": pick(has(/개인정보\s*(?:보호|관리)\s*책임자/)),
    "terms-link": pick(hasAny(/이용\s*약관|terms/i)),
    "privacy-link": pick(hasAny(/개인정보\s*처리\s*방침|privacy/i)),
    "product-price": (() => {
      const price = has(PRICE_RE);
      const word = has(PRODUCT_WORD_RE);
      return { found: !!price && !!word, evidence: price && word ? `${word} · ${price}` : price ?? word };
    })(),
    "refund-policy": pick(has(/환불|취소\s*규정|반품|교환\s*(?:정책|규정|안내)/)),
    // 아래 셋은 "없어야 통과" 또는 참고 항목 — found 의 의미가 반대라 개별 처리.
    "test-sample-name": pick(has(/테스트\s*상품|샘플\s*상품|\(테스트\)|\(샘플\)/)),
    "coming-soon": pick(has(/곧\s*출시|출시\s*예정|coming\s*soon/i)),
    "store-link": pick(firstMatch(/apps\.apple\.com|play\.google\.com/i, hrefBlob) ?? firstMatch(/app\s*store|google\s*play/i, lower)),
    "telecom-number": pick(has(/통신판매업/)),
  };

  const items: PrecheckItem[] = PG_PRECHECK_RULES.map((rule) => {
    const ev = evidenceById[rule.id] ?? { found: false, evidence: null };
    let status: PrecheckStatus;
    if (rule.id === "test-sample-name" || rule.id === "coming-soon") {
      status = ev.found ? "warn" : "pass";
    } else if (rule.severity === "info") {
      status = ev.found ? "pass" : "info";
    } else if (ev.found) {
      status = "pass";
    } else {
      status = rule.severity === "reject" ? "fail" : "warn";
    }
    return { id: rule.id, label: rule.label, severity: rule.severity, status, evidence: ev.evidence, rejectAs: rule.rejectAs, fix: rule.fix };
  });

  const rejectRiskCount = items.filter((it) => it.severity === "reject" && it.status === "fail").length;
  const warnCount = items.filter((it) => it.status === "warn").length;
  return {
    url: input.url,
    items,
    rejectRiskCount,
    warnCount,
    spaSuspect: text.length < 300,
    textLength: text.length,
    appOnlyNote: APP_ONLY_NOTE,
  };
}

function pick(evidence: string | null): { found: boolean; evidence: string | null } {
  return { found: evidence != null, evidence };
}
