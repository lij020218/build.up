/**
 * POST /api/integrations/popbill/sync
 *
 * 팝빌 비동기 Job 패턴 동기화:
 *   1) RequestJob 호출 (taxinvoice_sell, taxinvoice_buy, cashbill 각각)
 *   2) GetJobState 폴링 (최대 30초, 0.5s 간격)
 *   3) 완료 시 Search 페이지네이션으로 전건 수집 → DB upsert
 *
 * Body: { kinds?: ('taxinvoice_sell'|'taxinvoice_buy'|'cashbill')[]; fromDays?: number }
 *
 * 시간이 오래 걸리는 Job 의 경우 30초 안에 완료 안 될 수 있음 →
 * 그 경우 jobId 만 popbill_jobs 에 저장 후 cron 으로 후속 폴링.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import {
  PopbillClient,
  PopbillApiError,
  popbillJobStateLabel,
  type PopbillTaxinvoiceSummary,
  type PopbillCashbillSummary,
} from "../../../_lib/popbill-client";

export const runtime = "nodejs";
export const maxDuration = 60;

type Kind = "taxinvoice_sell" | "taxinvoice_buy" | "cashbill";
const ALL_KINDS: Kind[] = ["taxinvoice_sell", "taxinvoice_buy", "cashbill"];

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 28_000;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `popbill-sync:${auth.userId}`, limit: 4, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { kinds?: Kind[]; fromDays?: number } = {};
  try { body = (await request.json()) as typeof body; } catch { /* empty */ }
  const kinds = (body.kinds && body.kinds.length > 0 ? body.kinds : ALL_KINDS) as Kind[];
  const fromDays = body.fromDays ?? 30;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data: conn } = await supabase
    .from("popbill_connections")
    .select("business_number, status")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!conn) {
    return NextResponse.json({ ok: false, error: "팝빌 연결을 먼저 등록해 주세요." }, { status: 400 });
  }
  if (conn.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "팝빌 회원사 가입/홈택스 인증서 등록이 완료된 후 사용 가능합니다." },
      { status: 400 }
    );
  }

  let client: PopbillClient;
  try {
    client = new PopbillClient();
  } catch (e) {
    if (e instanceof PopbillApiError) {
      return NextResponse.json({ ok: false, error: e.message, code: String(e.code) }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "팝빌 초기화 실패" }, { status: 500 });
  }

  const corpNum = conn.business_number;
  const until = new Date();
  const from = new Date(until.getTime() - fromDays * 24 * 60 * 60 * 1000);
  const startDate = toYmd(from);
  const endDate = toYmd(until);

  const summary: Array<{ kind: Kind; jobId?: string; collected: number; state: string; error?: string }> = [];

  for (const kind of kinds) {
    try {
      // 1) RequestJob
      let jobId: string;
      if (kind === "cashbill") {
        jobId = await client.requestCashbillJob({ corpNum, dateType: "W", startDate, endDate });
      } else {
        jobId = await client.requestTaxinvoiceJob({
          corpNum,
          type: kind === "taxinvoice_sell" ? "SELL" : "BUY",
          dateType: "W",
          startDate,
          endDate,
        });
      }

      await supabase.from("popbill_jobs").insert({
        user_id: auth.userId,
        job_id: jobId,
        job_kind: kind,
        date_type: "W",
        start_date: ymdToDate(startDate),
        end_date: ymdToDate(endDate),
        state: "requested",
      });

      // 2) Poll
      const startedAt = Date.now();
      let lastState: number = 0;
      let collectTotal = 0;
      let collectCount = 0;
      while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        const js =
          kind === "cashbill"
            ? await client.getCashbillJobState({ corpNum, jobId })
            : await client.getTaxinvoiceJobState({ corpNum, jobId });
        lastState = js.jobState;
        collectTotal = js.collectTotal ?? 0;
        collectCount = js.collectCount ?? 0;
        const label = popbillJobStateLabel(lastState);
        if (label === "success" || label === "failed") {
          await supabase
            .from("popbill_jobs")
            .update({
              state: label,
              collect_total: collectTotal,
              collect_count: collectCount,
              error_code: js.errorCode ? String(js.errorCode) : null,
              error_message: js.errorReason ?? null,
              finished_at: new Date().toISOString(),
            })
            .eq("user_id", auth.userId)
            .eq("job_id", jobId);
          break;
        }
        await sleep(POLL_INTERVAL_MS);
      }

      const finalLabel = popbillJobStateLabel(lastState);
      if (finalLabel !== "success") {
        summary.push({
          kind,
          jobId,
          collected: 0,
          state: finalLabel,
          error: finalLabel === "failed" ? "수집 실패" : "타임아웃 — cron 으로 후속 폴링됩니다.",
        });
        continue;
      }

      // 3) Search → DB upsert
      const collected = await collectAll(client, corpNum, jobId, kind);
      const upserted = await persist(supabase, auth.userId, kind, collected);
      summary.push({ kind, jobId, collected: upserted, state: "success" });
    } catch (e) {
      const msg = e instanceof PopbillApiError ? `${e.code}: ${e.message}` : (e as Error).message;
      summary.push({ kind, collected: 0, state: "failed", error: msg });
    }
  }

  await supabase
    .from("popbill_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", auth.userId);

  return NextResponse.json({
    ok: true,
    range: { startDate, endDate },
    results: summary,
  });
}

async function collectAll(
  client: PopbillClient,
  corpNum: string,
  jobId: string,
  kind: Kind
): Promise<Array<PopbillTaxinvoiceSummary | PopbillCashbillSummary>> {
  const out: Array<PopbillTaxinvoiceSummary | PopbillCashbillSummary> = [];
  let page = 1;
  const perPage = 500;
  while (true) {
    if (kind === "cashbill") {
      const r = await client.searchCashbill({ corpNum, jobId, page, perPage });
      out.push(...r.list);
      if (r.list.length < perPage || page * perPage >= r.total) break;
    } else {
      const r = await client.searchTaxinvoice({ corpNum, jobId, page, perPage });
      out.push(...r.list);
      if (r.list.length < perPage || page * perPage >= r.total) break;
    }
    page++;
    if (page > 50) break; // 25,000 건 안전상한
  }
  return out;
}

async function persist(
  supabase: ReturnType<typeof getSupabaseAdmin> & object,
  userId: string,
  kind: Kind,
  list: Array<PopbillTaxinvoiceSummary | PopbillCashbillSummary>
): Promise<number> {
  if (list.length === 0) return 0;

  if (kind === "cashbill") {
    const rows = (list as PopbillCashbillSummary[])
      .filter((c) => c.confirmNum)
      .map((c) => ({
        user_id: userId,
        confirm_num: c.confirmNum!,
        trade_date: c.tradeDate ? formatDate(c.tradeDate) : null,
        issue_date: c.issueDT ? formatTimestamp(c.issueDT) : null,
        trade_type: c.tradeType ?? null,
        trade_usage: c.tradeUsage ?? null,
        supply_cost: numOrZero(c.supplyCost),
        tax: numOrZero(c.tax),
        service_fee: numOrZero(c.serviceFee),
        total_amount: numOrZero(c.totalAmount),
        identity_num_mask: c.identityNum ? maskIdentityNum(c.identityNum) : null,
        raw: c,
      }));
    if (rows.length === 0) return 0;
    const { error } = await supabase!
      .from("popbill_cashbills")
      .upsert(rows, { onConflict: "user_id,confirm_num" });
    if (error) {
      console.error("[popbill/sync] cashbill upsert", error);
      return 0;
    }
    return rows.length;
  }

  const direction = kind === "taxinvoice_sell" ? "sell" : "buy";
  const rows = (list as PopbillTaxinvoiceSummary[])
    .filter((t) => t.ntsConfirmNum)
    .map((t) => {
      const isSell = direction === "sell";
      return {
        user_id: userId,
        direction,
        nts_confirm_num: t.ntsConfirmNum!,
        write_date: t.writeDate ? formatDate(t.writeDate) : null,
        issue_date: t.issueDT ? formatTimestamp(t.issueDT) : null,
        send_date: t.sendDT ? formatTimestamp(t.sendDT) : null,
        supply_cost_total: numOrZero(t.supplyCostTotal),
        tax_total: numOrZero(t.taxTotal),
        total_amount: numOrZero(t.totalAmount),
        tax_type: t.taxType ?? null,
        purpose_type: t.purposeType ?? null,
        modify_code: typeof t.modifyCode === "number" ? t.modifyCode : null,
        counterparty_corp_num: isSell ? t.invoiceeCorpNum ?? null : t.invoicerCorpNum ?? null,
        counterparty_corp_name: isSell ? t.invoiceeCorpName ?? null : t.invoicerCorpName ?? null,
        self_corp_num: isSell ? t.invoicerCorpNum ?? null : t.invoiceeCorpNum ?? null,
        self_corp_name: isSell ? t.invoicerCorpName ?? null : t.invoiceeCorpName ?? null,
        raw: t,
      };
    });
  if (rows.length === 0) return 0;
  const { error } = await supabase!
    .from("popbill_tax_invoices")
    .upsert(rows, { onConflict: "user_id,direction,nts_confirm_num" });
  if (error) {
    console.error("[popbill/sync] taxinvoice upsert", error);
    return 0;
  }
  return rows.length;
}

// ─── 유틸 ─────────────────────────────────────────────────────────

function toYmd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function ymdToDate(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function formatDate(input: string): string {
  // 팝빌은 'yyyyMMdd' 또는 'yyyy-MM-dd' 모두 가능
  const d = input.replace(/[^0-9]/g, "");
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return input;
}

function formatTimestamp(input: string): string {
  // 'yyyyMMddHHmmss' → ISO
  const d = input.replace(/[^0-9]/g, "");
  if (d.length >= 14) {
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(8, 10)}:${d.slice(10, 12)}:${d.slice(12, 14)}+09:00`;
  }
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00+09:00`;
  return input;
}

function numOrZero(v: unknown): number {
  if (typeof v === "number") return Math.round(v);
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  return 0;
}

function maskIdentityNum(v: string): string {
  const cleaned = v.replace(/[^0-9*]/g, "");
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-2)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
