/**
 * 인증 에러 한국어 매핑 가드 (2026-07-28) —
 *   "User already registered" 가 영어 원문 그대로 노출되어 사장님이 중복 기준(이메일)을
 *   오해한 사고의 재발 방지. 대표 에러는 전부 한국어, 미지 에러도 한국어 기본문 + 원문 병기.
 */
import { describe, it, expect } from "vitest";
import { getAuthErrorMessage, ALREADY_REGISTERED_MESSAGE } from "../../../packages/shared/src/supabase/auth";

describe("getAuthErrorMessage", () => {
  it("이미 가입된 이메일 → CTA 트리거 문구 (UI 가 이 문구로 로그인/재설정 버튼 표시)", () => {
    expect(getAuthErrorMessage(new Error("User already registered"))).toBe(ALREADY_REGISTERED_MESSAGE);
  });

  it("로그인 실패 → 한국어", () => {
    expect(getAuthErrorMessage(new Error("Invalid login credentials"))).toBe(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
  });

  it("이메일 미인증 → 한국어", () => {
    expect(getAuthErrorMessage(new Error("Email not confirmed"))).toContain("이메일 인증이 필요");
  });

  it("재발송 스로틀 → 초 수 안내", () => {
    expect(getAuthErrorMessage(new Error("For security purposes, you can only request this after 42 seconds."))).toBe(
      "요청이 너무 잦아요. 42초 후 다시 시도해 주세요.",
    );
  });

  it("미지 에러 → 한국어 기본문 + 원문 병기 (영어 원문 단독 노출 금지)", () => {
    const msg = getAuthErrorMessage(new Error("Some unknown backend error"));
    expect(msg).toContain("인증에 실패했습니다");
    expect(msg).toContain("Some unknown backend error");
  });

  it("에러 객체 형태({message})도 동일 매핑", () => {
    expect(getAuthErrorMessage({ message: "User already registered" })).toBe(ALREADY_REGISTERED_MESSAGE);
  });
});
