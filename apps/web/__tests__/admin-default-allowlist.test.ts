/**
 * 관리자 기본 allowlist 가드 (2026-07-28 사장님 지시) —
 *   ADMIN_EMAILS 미설정이어도 대표 계정(lij020218@naver.com)만 관리자.
 *   env 설정 시엔 그 목록이 기본값을 대체(소문자 정규화).
 */
import { describe, it, expect, afterEach } from "vitest";
import { getAdminEmails } from "../app/api/_lib/env";

const orig = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (orig === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = orig;
});

describe("getAdminEmails", () => {
  it("env 미설정 → 대표 계정만 관리자", () => {
    delete process.env.ADMIN_EMAILS;
    expect(getAdminEmails()).toEqual(["lij020218@naver.com"]);
  });

  it("env 설정 → 대표 계정 + env 합집합 (대표 계정은 절대 안 빠짐)", () => {
    process.env.ADMIN_EMAILS = "A@x.com, b@y.com";
    expect(getAdminEmails()).toEqual(["lij020218@naver.com", "a@x.com", "b@y.com"]);
  });

  it("따옴표 혼입·중복도 정규화된다 (대시보드 입력 실수 방어)", () => {
    process.env.ADMIN_EMAILS = "\"LIJ020218@naver.com\", 'ops@x.com'";
    expect(getAdminEmails()).toEqual(["lij020218@naver.com", "ops@x.com"]);
  });
});
