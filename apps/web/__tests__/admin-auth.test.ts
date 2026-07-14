/**
 * requireAdmin — 관리자 게이팅 회귀 가드.
 *   allowlist 포함/미포함/빈목록/이메일없음/미인증 → 200/403/401 분기 + 대소문자 무시 + maskEmail.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../app/api/_lib/auth", () => ({ requireApiUser: vi.fn() }));
vi.mock("../app/api/_lib/env", () => ({ getAdminEmails: vi.fn() }));

import { requireAdmin, maskEmail } from "../app/api/_lib/admin-auth";
import { requireApiUser } from "../app/api/_lib/auth";
import { getAdminEmails } from "../app/api/_lib/env";

const req = new Request("https://x/api/admin/me");
const mockApiUser = requireApiUser as unknown as ReturnType<typeof vi.fn>;
const mockAdmins = getAdminEmails as unknown as ReturnType<typeof vi.fn>;

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allowlist 포함 + 이메일 확인됨 → ok (대소문자 무시)", async () => {
    mockApiUser.mockResolvedValue({ ok: true, userId: "u1", email: "Lij020218@Naver.com", emailConfirmed: true });
    mockAdmins.mockReturnValue(["lij020218@naver.com"]);
    const r = await requireAdmin(req);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.email).toBe("lij020218@naver.com");
  });

  it("이메일 미확인(email_confirmed_at 없음) → 403 (관리자 이메일 사칭 차단)", async () => {
    mockApiUser.mockResolvedValue({ ok: true, userId: "u1b", email: "lij020218@naver.com", emailConfirmed: false });
    mockAdmins.mockReturnValue(["lij020218@naver.com"]);
    expect(await requireAdmin(req)).toMatchObject({ ok: false, status: 403 });
  });

  it("allowlist 미포함 → 403", async () => {
    mockApiUser.mockResolvedValue({ ok: true, userId: "u2", email: "other@x.com" });
    mockAdmins.mockReturnValue(["lij020218@naver.com"]);
    expect(await requireAdmin(req)).toMatchObject({ ok: false, status: 403 });
  });

  it("allowlist 비어있음 → 403 (안전 기본값)", async () => {
    mockApiUser.mockResolvedValue({ ok: true, userId: "u3", email: "lij020218@naver.com" });
    mockAdmins.mockReturnValue([]);
    expect(await requireAdmin(req)).toMatchObject({ ok: false, status: 403 });
  });

  it("email 없는 계정 → 403", async () => {
    mockApiUser.mockResolvedValue({ ok: true, userId: "u4" });
    mockAdmins.mockReturnValue(["lij020218@naver.com"]);
    expect(await requireAdmin(req)).toMatchObject({ ok: false, status: 403 });
  });

  it("미인증(requireApiUser 실패) → 그대로 전달", async () => {
    mockApiUser.mockResolvedValue({ ok: false, status: 401, error: "로그인 필요" });
    mockAdmins.mockReturnValue(["lij020218@naver.com"]);
    expect(await requireAdmin(req)).toMatchObject({ ok: false, status: 401 });
  });
});

describe("maskEmail", () => {
  it("로컬 앞 3자만 노출", () => {
    expect(maskEmail("lij020218@naver.com")).toBe("lij***@naver.com");
    expect(maskEmail("ab@x.com")).toBe("ab***@x.com");
  });
  it("null/빈값 → —", () => {
    expect(maskEmail(null)).toBe("—");
    expect(maskEmail(undefined)).toBe("—");
    expect(maskEmail("")).toBe("—");
  });
});
