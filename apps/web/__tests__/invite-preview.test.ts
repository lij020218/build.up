/**
 * 초대 대상 확인 — 화면 판정 테스트.
 *
 * 여기서 지키는 것: 같은 사람에게 초대가 두 번 가지 않게 하는 차단 조건과,
 * 가린 이름을 그대로만 쓰는 것(실명 복원·추측 금지).
 */

import { describe, it, expect } from "vitest";
import { invitePreviewView, parseInvitePreview } from "@foundone/shared";

const ok = (over: Record<string, unknown> = {}) => ({
  ok: true as const,
  exists: true,
  masked_name: "김*현",
  masked_email: "su***@gmail.com",
  already_member: false,
  pending_invite: false,
  ...over,
});

describe("invitePreviewView — 초대 가능 판정", () => {
  it("가입한 계정이고 우리 직원이 아니면 초대할 수 있다", () => {
    const v = invitePreviewView(ok(), true);
    expect(v.canInvite).toBe(true);
    expect(v.tone).toBe("found");
    expect(v.title).toContain("김*현");
  });

  it("이미 우리 가게 직원이면 초대할 수 없다 — 중복 초대 차단", () => {
    const v = invitePreviewView(ok({ already_member: true }), true);
    expect(v.canInvite).toBe(false);
    expect(v.tone).toBe("blocked");
  });

  it("보낸 초대가 아직 살아 있으면 초대할 수 없다", () => {
    const v = invitePreviewView(ok({ pending_invite: true }), true);
    expect(v.canInvite).toBe(false);
    expect(v.tone).toBe("blocked");
  });

  it("이미 직원이면 대기 초대보다 그 사실을 먼저 알린다", () => {
    const v = invitePreviewView(ok({ already_member: true, pending_invite: true }), true);
    expect(v.title).toContain("이미 우리 가게 직원");
  });

  it("미가입 이메일도 초대할 수 있다 — 가입 시 「받은 초대」로 뜬다", () => {
    const v = invitePreviewView(
      { ok: true, exists: false, masked_email: "no***@gmail.com", already_member: false, pending_invite: false },
      true,
    );
    expect(v.canInvite).toBe(true);
    expect(v.tone).toBe("new");
  });

  it("미가입인데 이미 초대를 보냈으면 또 보내지 않는다", () => {
    const v = invitePreviewView(
      { ok: true, exists: false, masked_email: "no***@gmail.com", already_member: false, pending_invite: true },
      true,
    );
    expect(v.canInvite).toBe(false);
  });

  it("가린 이름이 없으면 이름 없이 안내한다 — 지어내지 않는다", () => {
    const v = invitePreviewView(ok({ masked_name: "" }), true);
    expect(v.canInvite).toBe(true);
    expect(v.title).toBe("계정을 찾았습니다");
  });

  it("실패 사유는 전부 초대 불가", () => {
    for (const reason of ["not-authenticated", "invalid-email", "self", "not-owner", "rate-limited"] as const) {
      const v = invitePreviewView({ ok: false, reason }, true);
      expect(v.canInvite, reason).toBe(false);
      expect(v.tone, reason).toBe("error");
      expect(v.title.length, reason).toBeGreaterThan(0);
    }
  });

  it("영어 문구도 나온다", () => {
    expect(invitePreviewView(ok(), false).title).toContain("김*현");
    expect(invitePreviewView({ ok: false, reason: "rate-limited" }, false).detail).toMatch(/hour/);
  });
});

describe("parseInvitePreview — 서버 응답 해석", () => {
  it("정상 응답을 좁힌다", () => {
    const r = parseInvitePreview(ok());
    expect(r).not.toBeNull();
    expect(r!.ok).toBe(true);
  });

  it("실패 응답을 좁힌다", () => {
    const r = parseInvitePreview({ ok: false, reason: "rate-limited" });
    expect(r).toEqual({ ok: false, reason: "rate-limited" });
  });

  it("모양이 다르면 null — 추측하지 않는다", () => {
    expect(parseInvitePreview(null)).toBeNull();
    expect(parseInvitePreview("ok")).toBeNull();
    expect(parseInvitePreview({})).toBeNull();
    expect(parseInvitePreview({ ok: true })).toBeNull();
  });
});
