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
  "collected_sales",
  "sales_collection_config",
  "sales_sync_log",
] as const;

// owner_user_id 컬럼 테이블 (사용자가 소유자로 만든 row 만).
export const OWNER_TABLES = ["store_invites", "store_members"] as const;

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

  async function wipeBy(table: string, column: "user_id" | "owner_user_id") {
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

  const totalDeleted = Object.values(deleted).reduce((s, n) => s + n, 0);
  console.log(`${log} done — userId=${userId.slice(0, 8)} totalDeleted=${totalDeleted} failures=${failures.length}`);
  if (failures.length > 0) console.warn(`${log} failures:`, failures);

  return { deleted, failures, totalDeleted };
}
