/**
 * 관리자(Admin) 게이팅 — 모든 /api/admin/* 라우트의 보안 경계.
 *
 * 설계 근거:
 *  - 이 앱은 세션이 클라이언트(localStorage) 측이라 서버 컴포넌트/미들웨어가 세션을 못 읽는다.
 *    또한 Next.js 미들웨어 단독 인가는 우회 위험(.rsc prefetch). → 실제 권한 검증은 여기,
 *    즉 Route Handler 의 Bearer 토큰 검증에 둔다. 페이지단 가드(AdminGuard)는 UX(숨김)일 뿐.
 *  - 관리자 판별은 서버 env allowlist(ADMIN_EMAILS). email 은 Supabase 가 서명 검증한 JWT 에서
 *    나오므로(requireApiUser → getUser) 위조 불가. user_metadata 와 무관 → 사용자 변조 불가.
 *
 * 사용:
 *   const gate = await requireAdmin(request);
 *   if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
 *   // gate.userId, gate.email 사용 가능 (email 로깅 금지 — PII)
 */
import { requireApiUser } from "./auth";
import { getAdminEmails } from "./env";

export type AdminAuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; error: string };

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  // 1) 로그인·익명거부·JWT 서명검증 (requireApiUser 가 email 도 반환)
  const auth = await requireApiUser(request);
  if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };

  const email = auth.email?.trim().toLowerCase();
  if (!email) {
    // 이메일 없는 계정(이론상) → 관리자 불가
    return { ok: false, status: 403, error: "관리자 권한이 없습니다." };
  }

  // 2) 서버 allowlist 매칭
  const admins = getAdminEmails();
  if (admins.length === 0 || !admins.includes(email)) {
    // 비관리자에게 존재 여부를 노출하지 않도록 일관된 403.
    return { ok: false, status: 403, error: "관리자 권한이 없습니다." };
  }

  return { ok: true, userId: auth.userId, email };
}

/** 이메일 마스킹 — 관리 화면/응답에 PII 최소노출. lij020218@naver.com → lij***@naver.com */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, Math.min(3, local.length));
  return `${head}***@${domain}`;
}
