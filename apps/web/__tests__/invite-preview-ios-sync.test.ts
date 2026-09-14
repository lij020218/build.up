/**
 * 초대 대상 확인 — 웹 SSOT ↔ iOS 미러 + DB 함수 드리프트 가드.
 *
 * 왜: 한쪽만 already_member 를 놓치면 같은 직원에게 초대가 두 번 간다.
 * 사유 문자열은 DB 함수가 만들고 두 앱이 해석하므로 셋을 함께 대조한다.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SWIFT = readFileSync(resolve(__dirname, "../../ios/Sources/FoundOneCore/InvitePreview.swift"), "utf8");
const TS = readFileSync(resolve(__dirname, "../../../packages/shared/src/team/invite-preview.ts"), "utf8");
const SQL = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20260914000001_invite_target_preview.sql"),
  "utf8",
);

const REASONS = ["not-authenticated", "invalid-email", "self", "not-owner", "rate-limited"];

describe("invite-preview 동기화", () => {
  it("실패 사유가 웹·iOS 양쪽에 모두 있다", () => {
    for (const r of REASONS) {
      expect(TS, `TS 에 ${r} 없음`).toContain(`"${r}"`);
      expect(SWIFT, `Swift 에 ${r} 없음`).toContain(`"${r}"`);
    }
  });

  it("DB 가 실제로 돌려주는 사유만 앱이 해석한다", () => {
    // SQL 이 만드는 reason 값 전부가 앱 목록 안에 있어야 한다.
    const emitted = [...SQL.matchAll(/'reason',\s*'([a-z-]+)'/g)].map((m) => m[1]);
    expect(emitted.length).toBeGreaterThan(0);
    for (const r of emitted) {
      expect(REASONS, `DB 가 ${r} 를 주는데 앱이 모른다`).toContain(r);
    }
  });

  it("차단 조건이 같다 — 이미 직원 / 보낸 초대 있음", () => {
    expect(TS).toContain("result.already_member");
    expect(TS).toContain("result.pending_invite");
    expect(SWIFT).toContain("if alreadyMember {");
    expect(SWIFT).toContain("if pendingInvite {");
  });

  it("이미 직원 판정이 대기 초대보다 먼저다 (양쪽 동일)", () => {
    expect(TS.indexOf("already_member")).toBeLessThan(TS.indexOf("result.pending_invite"));
    expect(SWIFT.indexOf("if alreadyMember {")).toBeLessThan(SWIFT.indexOf("if pendingInvite {"));
  });

  it("응답 필드 이름이 DB 와 같다", () => {
    for (const f of ["masked_name", "masked_email", "already_member", "pending_invite", "exists"]) {
      expect(SQL, `SQL 에 ${f} 없음`).toContain(`'${f}'`);
      expect(TS, `TS 에 ${f} 없음`).toContain(f);
      expect(SWIFT, `Swift 에 ${f} 없음`).toContain(`"${f}"`);
    }
  });

  it("서버는 원문 이름·이메일을 돌려주지 않는다 — 가린 값만", () => {
    // jsonb_build_object 에 들어가는 이름/이메일은 반드시 mask_* 를 거친다.
    expect(SQL).toContain("public.mask_person_name(v_name)");
    expect(SQL).toContain("public.mask_email(v_email)");
    expect(SQL).not.toMatch(/'masked_name',\s*v_name/);
    expect(SQL).not.toMatch(/'masked_email',\s*v_email/);
  });

  it("사장만 조회할 수 있고 시간당 상한이 있다", () => {
    expect(SQL).toContain("not-owner");
    expect(SQL).toContain("v_recent >= 20");
    expect(SQL).toContain("interval '1 hour'");
    // 문구도 20회로 같아야 한다(둘 중 하나만 바꾸면 안내가 거짓이 된다).
    expect(TS).toContain("20번까지");
    expect(SWIFT).toContain("20번까지");
  });

  it("조회 기록을 남긴다 — 이메일 원문이 아니라 해시로", () => {
    expect(SQL).toContain("INSERT INTO public.invite_lookup_log");
    expect(SQL).toContain("sha256(convert_to(v_email, 'UTF8'))");
    expect(SQL).not.toMatch(/invite_lookup_log[\s\S]{0,400}?email\s+text/);
  });
});
