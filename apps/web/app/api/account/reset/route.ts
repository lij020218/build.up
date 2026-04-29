/**
 * POST /api/account/reset
 *
 * 사용자의 모든 가게/진행 데이터를 풀-와이프.
 * 한 번 호출로 모든 user_id 관련 테이블의 row 삭제 (auth.users 본체는 유지 — 로그인 상태는 유지).
 *
 * 인증: requireApiUser (Bearer token)
 *
 * 삭제 대상 (user_id 기준):
 *   - business_profiles, user_store_data
 *   - roadmaps (cascade → stage_decisions, stage_tasks)
 *   - portone_connections, portone_payments
 *   - stripe_connections, toss_connections, custom_connections
 *   - subscription_events
 *   - tossplace_connections, tossplace_orders, tossplace_payments
 *   - codef_connections, codef_card_sales
 *   - csv_revenue_uploads, csv_revenue_entries
 *   - customers, customer_visits, collected_sales, sales_collection_config, sales_sync_log
 *   - store_invites, store_members (owner_user_id 기준)
 *
 * Webhook 멱등 로그 (stripe_webhook_log / toss_webhook_log) 는 GDPR-style 흔적 정리 차원에서 함께 삭제.
 */

import { NextResponse } from "next/server";
import { requireApiUserAllowAnon } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// 모든 user_id 컬럼을 가진 테이블. roadmap → 자식 테이블 (stage_decisions / stage_tasks) 은 ON DELETE CASCADE.
const USER_TABLES = [
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
  // 고객/매출 수집 — 가게 단위 데이터로 데모 초기화 시 함께 삭제
  "customers",
  "customer_visits",
  "collected_sales",
  "sales_collection_config",
  "sales_sync_log",
] as const;

// owner_user_id 컬럼을 사용하는 가게-소유 관계 테이블 (직원 초대/매핑).
// 사용자가 가게 소유자로서 만든 row 만 삭제 — 다른 사람이 만든 가게의 직원 row 는 손대지 않음.
const OWNER_TABLES = [
  "store_invites",
  "store_members",
] as const;

export async function POST(request: Request) {
  try {
    // 익명 세션도 허용 — 데모 모드 사용자가 자기 데이터를 지우는 것은 안전.
    // 결제·통합 같은 민감 endpoint 는 여전히 requireApiUser (anon 거부) 를 사용한다.
    const auth = await requireApiUserAllowAnon(request);
    if (!auth.ok) {
      console.warn("[/api/account/reset] auth failed:", auth.error);
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    // 분당 3회 — 실수 방지
    const rl = checkSimpleRateLimit({
      key: `account-reset:${auth.userId}`, limit: 3, windowMs: 60_000,
      message: "잠시 후 다시 시도해 주세요.",
    });
    if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("[/api/account/reset] getSupabaseAdmin returned null — service role key missing");
      return NextResponse.json({ ok: false, error: "DB 설정 오류 (service role key 미설정)" }, { status: 500 });
    }

    const failures: Array<{ table: string; error: string }> = [];
    const deleted: Record<string, number> = {};

    for (const table of USER_TABLES) {
      try {
        // count exact 로 삭제 전 갯수 측정 + delete
        const { count: beforeCount, error: countErr } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq("user_id", auth.userId);

        if (countErr) {
          console.warn(`[/api/account/reset] count error on ${table}:`, countErr);
          failures.push({ table, error: `count: ${countErr.message}` });
          continue;
        }

        const { error: deleteErr } = await supabase
          .from(table)
          .delete()
          .eq("user_id", auth.userId);

        if (deleteErr) {
          console.warn(`[/api/account/reset] delete error on ${table}:`, deleteErr);
          failures.push({ table, error: deleteErr.message });
        } else {
          deleted[table] = beforeCount ?? 0;
        }
      } catch (e) {
        console.error(`[/api/account/reset] exception on ${table}:`, e);
        failures.push({ table, error: (e as Error).message });
      }
    }

    // owner_user_id 컬럼 테이블 — 사용자가 소유한 가게의 초대/직원 매핑 정리
    for (const table of OWNER_TABLES) {
      try {
        const { count: beforeCount, error: countErr } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq("owner_user_id", auth.userId);

        if (countErr) {
          // store_invites/store_members 테이블이 존재 안 할 수 있음 — soft fail
          if (countErr.code === "42P01" || countErr.message?.includes("does not exist")) {
            console.log(`[/api/account/reset] table ${table} does not exist (skipped)`);
            continue;
          }
          failures.push({ table, error: `count: ${countErr.message}` });
          continue;
        }

        const { error: deleteErr } = await supabase
          .from(table)
          .delete()
          .eq("owner_user_id", auth.userId);

        if (deleteErr) {
          if (deleteErr.code === "42P01" || deleteErr.message?.includes("does not exist")) {
            continue;
          }
          failures.push({ table, error: deleteErr.message });
        } else {
          deleted[table] = beforeCount ?? 0;
        }
      } catch (e) {
        const msg = (e as Error).message;
        if (msg?.includes("does not exist") || msg?.includes("relation")) {
          continue; // soft fail for missing tables
        }
        console.error(`[/api/account/reset] exception on ${table}:`, e);
        failures.push({ table, error: msg });
      }
    }

    const totalDeleted = Object.values(deleted).reduce((s, n) => s + n, 0);
    console.log(`[/api/account/reset] done — userId=${auth.userId.slice(0, 8)} totalDeleted=${totalDeleted} failures=${failures.length}`);
    if (failures.length > 0) {
      console.warn("[/api/account/reset] failures:", failures);
    }

    return NextResponse.json({
      ok: failures.length === 0,
      deleted,
      failures,
      totalDeleted,
    });
  } catch (error) {
    // ⚠️ 여기까지 도달하면 try 안에서 잡히지 않은 예외 — 절대 happenable 하지 않아야 함.
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[/api/account/reset] FATAL — uncaught exception:", msg, stack);
    return NextResponse.json(
      { ok: false, error: `서버 예외: ${msg}` },
      { status: 500 },
    );
  }
}
