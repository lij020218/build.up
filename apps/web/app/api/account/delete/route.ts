/**
 * POST /api/account/delete
 *
 * 계정 완전 삭제 (개인정보처리방침 "계정 삭제" 권리 + Apple 5.1.1(v) 충족).
 *   1. 모든 사용자 데이터 삭제 (구독·결제 포함)
 *   2. auth.users 본체 삭제 (service_role admin)
 * 되돌릴 수 없음. 웹·iOS 공통 호출.
 *
 * 인증: requireApiUser (실계정만 — 익명 세션은 삭제할 auth 사용자가 없음)
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { wipeUserData, SUBSCRIPTION_TABLES } from "../../_lib/account-wipe";
import { archiveLaborRecords, wipeUserStorage, revokeAppleTokens, type ComplianceStep } from "../../_lib/account-delete-compliance";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser(request);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    // 분당 3회 — 오작동/연타 방지
    const rl = await checkSimpleRateLimit({
      key: `account-delete:${auth.userId}`, limit: 3, windowMs: 60_000,
      message: "잠시 후 다시 시도해 주세요.",
    });
    if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("[/api/account/delete] service role key 미설정");
      return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });
    }

    // 0. 컴플라이언스 (2026-08-19) — 전부 best-effort, 실패해도 삭제 진행
    //    ① 근로기록 분리 보관(근로기준법 §42 3년): auth 삭제 CASCADE 로 사장·직원 기록이 소멸하기 전에 복사
    //    ② Storage 개인정보 문서·사진 삭제 (auth 삭제 후엔 소유자 없는 고아 파일이 됨)
    //    ③ Sign in with Apple refresh_token revoke (App Store 5.1.1(v))
    const compliance: ComplianceStep[] = [];
    compliance.push(await archiveLaborRecords(supabase, auth.userId, "owner-or-member-deleted"));
    compliance.push(...(await wipeUserStorage(supabase, auth.userId)));
    compliance.push(await revokeAppleTokens(supabase, auth.userId));
    for (const c of compliance) {
      if (!c.ok) console.warn(`[/api/account/delete] compliance step failed — ${c.step}: ${c.note ?? ""}`);
    }

    // 1. 데이터 전체 삭제 (구독·결제 포함)
    const wipe = await wipeUserData(supabase, auth.userId, {
      extraUserTables: SUBSCRIPTION_TABLES,
      logPrefix: "[/api/account/delete]",
    });

    // 2. auth 계정 본체 삭제 — 데이터 삭제가 일부 실패해도 계정은 삭제 진행
    //    (남은 row 는 FK/cron 정리. 사용자의 "삭제" 의도가 최우선).
    const { error: authErr } = await supabase.auth.admin.deleteUser(auth.userId);
    if (authErr) {
      console.error("[/api/account/delete] auth.admin.deleteUser 실패:", authErr);
      return NextResponse.json(
        { ok: false, error: "계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.", wipe },
        { status: 500 },
      );
    }

    // 삭제 로그(개인정보 없이 — uid 앞 8자·시각·건수): 파기 기록 (개인정보 보호법 §21 파기 증빙)
    console.log(`[/api/account/delete] 계정 삭제 완료 — userId=${auth.userId.slice(0, 8)} at=${new Date().toISOString()} deleted=${wipe.totalDeleted} dataFailures=${wipe.failures.length} compliance=${JSON.stringify(compliance)}`);
    return NextResponse.json({ ok: true, deletedData: wipe.totalDeleted, compliance });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // 내부 오류 상세(Supabase 쿼리 오류 등)는 서버 로그에만 — 클라이언트엔 고정 문자열.
    console.error("[/api/account/delete] FATAL:", msg, error instanceof Error ? error.stack : undefined);
    return NextResponse.json({ ok: false, error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
