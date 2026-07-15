/**
 * account-wipe.ts — 사용자 데이터 전체 삭제 공유 헬퍼.
 *
 * /api/account/reset (데이터만 초기화, auth 유지) 와
 * /api/account/delete (데이터 + auth 계정 자체 삭제) 가 동일 로직을 공유.
 *
 * "테이블 없음(미연결 통합)" 은 soft-fail 처리.
 */

import type { getSupabaseAdmin } from "./supabase-admin";

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

// user_id 컬럼 테이블. roadmap → 자식(stage_decisions/stage_tasks)은 ON DELETE CASCADE.
export const USER_TABLES = [
  "business_profiles",
  "user_store_data",
  "roadmaps",
  "portone_connections",
  "portone_payments",
  "portone_webhook_log",
  "stripe_connections",
  "stripe_webhook_log",
  "toss_connections",
  "toss_webhook_log",
  "custom_connections",
  "subscription_events",
  "tossplace_connections",
  "tossplace_orders",
  "tossplace_payments",
  "codef_connections",
  "codef_card_sales",
  "csv_revenue_uploads",
  "csv_revenue_entries",
  "customers",
  "customer_visits",
  // 외부 통합 — GA4 OAuth token + webhook secret hash 포함
  "saas_metrics_connections",
  // 팝빌·CODEF 연동 정보
  "popbill_connections",
  "codef_bank_accounts",
  // ── 2026-06-07 점검: account/reset 이 안 지워 잔존하던 데이터 테이블들 추가 ──
  //   (이전엔 USER_TABLES 누락 → "진행 초기화" 후 옛 매출·세금·지표가 부활)
  //   delete 는 user_id FK CASCADE 로도 정리되지만 reset 은 사용자 유지라 직접 삭제 필요.
  "popbill_jobs",
  "popbill_tax_invoices",
  "popbill_cashbills",
  "codef_bank_transactions",
  "saas_metrics_daily",
  "saas_funnel_manual_weekly",
  "saas_funnel_source_daily",
  "saas_funnel_events_raw",
  "ai_report_insights",
  "marketing_coach_cache",
  "coaching_history",
  // ── 2026-06-10 감사: 마케팅 사례 엔진 신규 테이블 (미포함 시 초기화 후 부활) ──
  //   marketing_trend_cache 는 user_id 없는 업종 공용 캐시라 제외(개인 데이터 아님).
  "marketing_cases_cache",
  "marketing_play_progress",
  // ── 2026-07-15 감사: 살아있는데 목록에 없어 초기화 후 잔존하던 것들 (3번째 재발) ──
  //   이 누락이 반복되어 __tests__/account-wipe-coverage.test.ts 가드를 신설했다.
  "program_applications",
  "coaching_feedback",
] as const;

// owner_user_id 컬럼 테이블 (사용자가 소유자로 만든 row 만).
export const OWNER_TABLES = ["store_invites", "store_members"] as const;

// recipient_user_id 컬럼 테이블 — 알림함은 user_id 가 아니라 수신자 기준.
export const RECIPIENT_TABLES = ["notifications"] as const;

// 계정 완전 삭제 시 추가로 제거할 구독·결제 테이블 (reset 에서는 보존).
export const SUBSCRIPTION_TABLES = ["foundone_subscriptions", "foundone_payments"] as const;

export function isMissingTableError(code?: string, message?: string): boolean {
  const m = message?.toLowerCase() ?? "";
  return (
    code === "42P01" ||
    m.includes("does not exist") ||
    (m.includes("relation") && m.includes("not exist"))
  );
}

export type WipeResult = {
  deleted: Record<string, number>;
  failures: Array<{ table: string; error: string }>;
  totalDeleted: number;
};

/**
 * userId 의 모든 데이터를 삭제.
 * @param extraUserTables  user_id 기준으로 추가 삭제할 테이블 (예: 구독·결제)
 */
export async function wipeUserData(
  supabase: Admin,
  userId: string,
  opts: { extraUserTables?: readonly string[]; logPrefix?: string } = {},
): Promise<WipeResult> {
  const log = opts.logPrefix ?? "[account-wipe]";
  const failures: Array<{ table: string; error: string }> = [];
  const deleted: Record<string, number> = {};

  const userTables = [...USER_TABLES, ...(opts.extraUserTables ?? [])];

  async function wipeBy(table: string, column: "user_id" | "owner_user_id" | "recipient_user_id") {
    try {
      const { count: beforeCount, error: countErr } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(column, userId);
      if (countErr) {
        if (isMissingTableError(countErr.code, countErr.message)) return;
        failures.push({ table, error: `count: ${countErr.message}` });
        return;
      }
      const { error: deleteErr } = await supabase.from(table).delete().eq(column, userId);
      if (deleteErr) {
        if (isMissingTableError(deleteErr.code, deleteErr.message)) return;
        failures.push({ table, error: deleteErr.message });
        return;
      }
      deleted[table] = beforeCount ?? 0;
    } catch (e) {
      const msg = (e as Error).message;
      if (isMissingTableError(undefined, msg)) return;
      console.error(`${log} exception on ${table}:`, e);
      failures.push({ table, error: msg });
    }
  }

  for (const table of userTables) await wipeBy(table, "user_id");
  for (const table of OWNER_TABLES) await wipeBy(table, "owner_user_id");
  for (const table of RECIPIENT_TABLES) await wipeBy(table, "recipient_user_id");

  const totalDeleted = Object.values(deleted).reduce((s, n) => s + n, 0);
  console.log(`${log} done — userId=${userId.slice(0, 8)} totalDeleted=${totalDeleted} failures=${failures.length}`);
  if (failures.length > 0) console.warn(`${log} failures:`, failures);

  return { deleted, failures, totalDeleted };
}
