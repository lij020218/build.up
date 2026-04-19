/**
 * Supabase service-role 클라이언트 — RLS 우회 쓰기 전용.
 * cron job, 서버 측 배치 업데이트에서만 사용.
 *
 * 일반 사용자 요청 경로에서는 절대 사용하지 말 것 (SRK 노출 위험).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey } from "./env";

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (_adminClient) return _adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = getSupabaseServiceRoleKey();
  if (!url || !serviceKey) return null;
  _adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _adminClient;
}
