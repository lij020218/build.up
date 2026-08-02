import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isInternalEmail, internalExclusionRules } from "../app/api/_lib/internal-accounts";
import { getAdminEmails } from "../app/api/_lib/env";

/**
 * 내부 계정 제외 가드 (2026-08-03 사장님 지시).
 *   "yeom·kim 계정도 내 직원들 계정이니 관리자 계정(admin 페이지는 못 들어가게)으로 돌려줘.
 *    lij020218 관련 이메일 계정도 모두"
 *
 * 이 테스트가 지키는 두 가지:
 *   ① 지목된 계정이 통계에서 실제로 빠지는가
 *   ② **그 대가로 권한이 새지 않는가** — 괄호 조건("admin 페이지는 못 들어가게")
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p: string[]) => readFileSync(join(HERE, ...p), "utf8");

describe("내부 계정 — 통계 제외 대상", () => {
  it("사장님 본인 계정은 도메인 무관 전부 (naver·cau·daum …)", () => {
    for (const e of ["lij020218@naver.com", "lij020218@cau.ac.kr", "lij020218@daum.net", "lij020218@gmail.com"]) {
      expect(isInternalEmail(e), e).toBe(true);
    }
  });

  it("지목된 직원 계정 (yeom·kim)", () => {
    for (const e of ["yeoumyejun@gmail.com", "yeoumyejun@naver.com", "kim@naver.com", "kim2@naver.com"]) {
      expect(isInternalEmail(e), e).toBe(true);
    }
  });

  it("테스트 도메인 (RFC 2606 예약 — 메일 수신 불가라 실사용자일 수 없다)", () => {
    expect(isInternalEmail("eve.qa.20260725.1530402101@example.com")).toBe(true);
  });

  it("대소문자·+별칭 우회가 안 통한다", () => {
    expect(isInternalEmail("LIJ020218@Naver.com")).toBe(true);
    expect(isInternalEmail("lij020218+test@gmail.com")).toBe(true);
    expect(isInternalEmail("  kim@naver.com  ")).toBe(true);
  });

  it("실사용자는 절대 빠지지 않는다 (과잉 제외 = 통계 축소 = 또 다른 가짜 숫자)", () => {
    for (const e of [
      "tochan1996@naver.com",
      "binlove0me@naver.com",
      "bbol_a@naver.com",
      "kimchi@naver.com",      // kim 으로 시작해도 다른 사람
      "kim@gmail.com",         // local 은 같아도 도메인이 다르면 남
      "yeoumyejun2@naver.com", // 부분일치 금지
      "lij0202180@naver.com",
    ]) {
      expect(isInternalEmail(e), e).toBe(false);
    }
    expect(isInternalEmail(null)).toBe(false);
    expect(isInternalEmail("")).toBe(false);
    expect(isInternalEmail("골뱅이없음")).toBe(false);
  });
});

describe("🔴 권한 분리 — 통계 제외가 관리자 권한을 주지 않는다", () => {
  it("직원·본인 부계정은 관리자 allowlist 에 없다 (/admin 403 유지)", () => {
    const admins = getAdminEmails();
    for (const e of [
      "yeoumyejun@gmail.com",
      "yeoumyejun@naver.com",
      "kim@naver.com",
      "kim2@naver.com",
      "lij020218@cau.ac.kr",
      "lij020218@daum.net",
    ]) {
      expect(admins, e).not.toContain(e);
      expect(isInternalEmail(e), e).toBe(true);   // 빠지긴 빠진다
    }
  });

  it("관리자 게이트는 internal 명단을 쳐다보지 않는다 (import 자체가 없어야 한다)", () => {
    const gate = read("..", "app", "api", "_lib", "admin-auth.ts");
    expect(gate).not.toContain("internal-accounts");
    expect(gate).not.toContain("isInternalEmail");
    expect(gate).toContain("getAdminEmails");
  });

  it("관리자는 내부 계정의 부분집합 (반대 방향은 성립하지 않는다)", () => {
    for (const a of getAdminEmails()) expect(isInternalEmail(a), a).toBe(true);
  });
});

describe("정직성 — 조용히 빼지 않는다", () => {
  it("제외 기준을 사람이 읽을 수 있게 내려준다", () => {
    const rules = internalExclusionRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.join(" ")).toContain("lij020218");
  });

  it("세 운영 화면이 모두 제외 사실을 표시한다", () => {
    for (const f of [
      read("..", "app", "admin", "page.tsx"),
      read("..", "app", "lib", "components", "admin", "UsagePanel.tsx"),
    ]) {
      expect(f).toContain("ExclusionNote");
    }
    expect(read("..", "app", "lib", "components", "admin", "ActivityPanel.tsx")).toContain("제외했습니다");
  });

  it("집계 라우트 3종이 모두 제외 집합을 쓴다 (한 곳만 빼면 화면끼리 숫자가 어긋난다)", () => {
    for (const r of ["activity", "usage", "overview"]) {
      const src = read("..", "app", "api", "admin", r, "route.ts");
      expect(src, r).toContain("buildExcludedUserIdSet");
      expect(src, r).toContain("excludedAccounts");
    }
  });
});
