/**
 * 내부 계정(internal) 판별 — **통계 집계에서만** 빼는 명단. (2026-08-03 사장님 지시)
 *
 *   "yeom 이 계정이랑 kim 이 계정도 내 직원들 계정이니 관리자 계정(admin 페이지는 못 들어가게)으로
 *    돌려줘. lij020218 관련 이메일 계정도 모두 그렇게 처리해"
 *
 * ⚠️ 이 파일은 **권한을 주지 않는다**. 관리자 페이지 접근은 오직 env.ts 의 getAdminEmails()
 *    allowlist(ADMIN_EMAILS) 로만 결정된다. 여기 이름이 올라가도 /admin 은 여전히 403 이다.
 *    (사장님 요구의 괄호 조건 — "admin 페이지는 못 들어가게" — 이 코드 구조로 보장된다.
 *     internal-accounts-guard 테스트가 두 집합이 섞이지 않는지 감시한다.)
 *
 * 왜 필요한가: 사장님·직원·QA 계정이 서비스를 테스트로 돌리면 그 사용량이 실사용자 통계에
 *    섞여 "사용자 수 / AI 비용 / 활성도" 를 부풀린다. 부풀린 숫자로 출시 판단을 하면 틀린다.
 *
 * 정직성: 제외는 **조용히 하지 않는다**. 호출처는 제외 계정 수를 응답에 실어 화면이 명시한다.
 */
import { getAdminEmails } from "./env";

/** 도메인 무관 — 이 local part 를 쓰는 계정은 전부 사장님 본인 (@naver/@cau/@daum …) */
const INTERNAL_LOCAL_PARTS = ["lij020218"];

/** 개별 지정 계정 — 사장님이 직접 지목 (직원 + local part 규칙에 안 걸리는 본인 계정) */
const INTERNAL_EMAILS = [
  "yeoumyejun@gmail.com",  // 직원
  "yeoumyejun@naver.com",  // 직원
  "kim@naver.com",         // 직원
  "kim2@naver.com",        // 직원
  "lki720412@gmail.com",   // 사장님 본인 (local part 가 lij020218 이 아니라 개별 지정)
];

/**
 * 도메인 단위 제외.
 *  example.com 은 RFC 2606 예약 도메인 — 메일 수신 자체가 불가능하므로 실사용자일 수 없다.
 *  (E2E 시드가 만든 eve.qa.*@example.com 계정이 여기 걸린다)
 */
const INTERNAL_DOMAINS = ["example.com", "example.org", "example.net"];

/** 이메일 정규화 — 소문자 + gmail 류 +별칭 제거 (lij020218+test@ → lij020218@) */
function splitEmail(email: string): { local: string; domain: string } | null {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at <= 0 || at === e.length - 1) return null;
  const local = e.slice(0, at).split("+")[0]!;
  return { local, domain: e.slice(at + 1) };
}

/** env 확장 — 재배포 없이 추가하려면 INTERNAL_EMAILS=a@b.com,c@d.com */
function envInternalEmails(): string[] {
  const raw = process.env.INTERNAL_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().replace(/^["']+|["']+$/g, "").trim().toLowerCase())
    .filter((e) => e.length > 0);
}

/**
 * 통계에서 제외할 계정인가.
 *  관리자(getAdminEmails)도 당연히 내부 계정이다 — 두 명단의 합집합.
 *  역은 성립하지 않는다: 내부 계정이라고 관리자가 되지는 않는다.
 */
export function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const parts = splitEmail(email);
  if (!parts) return false;
  const full = `${parts.local}@${parts.domain}`;

  if (getAdminEmails().includes(full)) return true;
  if (INTERNAL_EMAILS.includes(full)) return true;
  if (envInternalEmails().includes(full)) return true;
  if (INTERNAL_LOCAL_PARTS.includes(parts.local)) return true;
  if (INTERNAL_DOMAINS.includes(parts.domain)) return true;
  return false;
}

/** 운영 화면 설명용 — 어떤 규칙으로 뺐는지 사람이 읽을 수 있게 (숫자만 주면 "왜?" 가 남는다) */
export function internalExclusionRules(): string[] {
  return [
    `관리자 계정 (${getAdminEmails().length}개)`,
    `사장님 본인 계정 (${INTERNAL_LOCAL_PARTS.join(", ")}@* — 도메인 무관)`,
    `개별 지정 계정 (직원·본인 ${INTERNAL_EMAILS.length}개)`,
    "테스트 도메인 (example.com 등 RFC 2606 예약)",
  ];
}
