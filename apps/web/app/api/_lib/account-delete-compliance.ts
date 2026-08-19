/**
 * 계정 삭제 컴플라이언스 헬퍼 (2026-08-19) — /api/account/delete 전용 (reset 은 사용 안 함)
 *
 *  ① archiveLaborRecords  근로기록 분리 보관 (근로기준법 §42 3년) — RPC archive_labor_records
 *  ② wipeUserStorage      Storage 버킷 {userId}/** 파일 삭제 (사업자등록증 등 개인정보 문서)
 *  ③ revokeAppleTokens    Sign in with Apple refresh_token revoke (App Store 5.1.1(v))
 *
 *  전부 best-effort: 실패해도 계정 삭제는 진행(사용자의 삭제 의도가 최우선), 실패는 결과에 남겨 로그.
 *  마이그 20260819_000001 미적용(RPC/테이블 없음)이어도 에러 없이 skip.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { envelopeDecrypt, type EnvelopedSecret } from "./envelope-crypto";
import { isAppleSignInConfigured, revokeAppleRefreshToken } from "./apple-signin";
import { isMissingTableError } from "./account-wipe";

export const USER_STORAGE_BUCKETS = ["store-photos", "business-documents"] as const;

export type ComplianceStep = { step: string; ok: boolean; count?: number; note?: string };

export async function archiveLaborRecords(
  sb: SupabaseClient, userId: string, reason: "owner-or-member-deleted",
): Promise<ComplianceStep> {
  try {
    const { data, error } = await sb.rpc("archive_labor_records", { p_user: userId, p_reason: reason });
    if (error) {
      if (isMissingTableError(error.code, error.message) || /function .* does not exist|PGRST202/i.test(error.message)) {
        return { step: "labor-archive", ok: false, note: "rpc missing (migration 20260819_000001 not applied)" };
      }
      return { step: "labor-archive", ok: false, note: error.message };
    }
    return { step: "labor-archive", ok: true, count: Number(data ?? 0) };
  } catch (e) {
    return { step: "labor-archive", ok: false, note: e instanceof Error ? e.message : String(e) };
  }
}

/** 버킷 내 prefix 하위 파일 재귀 목록 (Storage list 는 폴더 단위라 kind/ 하위까지 내려간다) */
async function listAllPaths(sb: SupabaseClient, bucket: string, prefix: string, depth = 0): Promise<string[]> {
  if (depth > 4) return [];
  const out: string[] = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit, offset });
    if (error || !data) break;
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      // 폴더는 id 가 null 로 온다
      if ((item as { id?: string | null }).id == null) {
        out.push(...(await listAllPaths(sb, bucket, full, depth + 1)));
      } else {
        out.push(full);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

export async function wipeUserStorage(sb: SupabaseClient, userId: string): Promise<ComplianceStep[]> {
  const steps: ComplianceStep[] = [];
  for (const bucket of USER_STORAGE_BUCKETS) {
    try {
      const paths = await listAllPaths(sb, bucket, userId);
      if (paths.length === 0) { steps.push({ step: `storage:${bucket}`, ok: true, count: 0 }); continue; }
      let removed = 0;
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { error } = await sb.storage.from(bucket).remove(chunk);
        if (error) { steps.push({ step: `storage:${bucket}`, ok: false, count: removed, note: error.message }); removed = -1; break; }
        removed += chunk.length;
      }
      if (removed >= 0) steps.push({ step: `storage:${bucket}`, ok: true, count: removed });
    } catch (e) {
      steps.push({ step: `storage:${bucket}`, ok: false, note: e instanceof Error ? e.message : String(e) });
    }
  }
  return steps;
}

export async function revokeAppleTokens(sb: SupabaseClient, userId: string): Promise<ComplianceStep> {
  try {
    const { data, error } = await sb
      .from("apple_auth_tokens").select("refresh_token_enc").eq("user_id", userId).maybeSingle();
    if (error) {
      if (isMissingTableError(error.code, error.message)) return { step: "apple-revoke", ok: true, note: "table missing — skip" };
      return { step: "apple-revoke", ok: false, note: error.message };
    }
    if (!data) return { step: "apple-revoke", ok: true, note: "no apple link" };
    if (!isAppleSignInConfigured()) return { step: "apple-revoke", ok: false, note: "APPLE_SIGNIN_* not configured" };
    const refreshToken = envelopeDecrypt(data.refresh_token_enc as EnvelopedSecret);
    const ok = await revokeAppleRefreshToken(refreshToken);
    await sb.from("apple_auth_tokens").delete().eq("user_id", userId);
    return { step: "apple-revoke", ok, note: ok ? undefined : "apple revoke endpoint returned non-2xx" };
  } catch (e) {
    return { step: "apple-revoke", ok: false, note: e instanceof Error ? e.message : String(e) };
  }
}
