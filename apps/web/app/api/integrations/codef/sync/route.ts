/**
 * POST /api/integrations/codef/sync
 *
 * CODEF 통해 여신협회 매통조 매입내역 가져오기.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../_lib/envelope-crypto";
import { CodefClient, CodefApiError } from "../../../_lib/codef-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const rl = checkSimpleRateLimit({ key: `codef-sync:${auth.userId}`, limit: 6, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data: conn } = await supabase
    .from("codef_connections")
    .select("encrypted_connected_id, cid_iv, cid_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version, status")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!conn) return NextResponse.json({ ok: false, error: "CODEF 연결을 먼저 설정해 주세요." }, { status: 400 });
  if (conn.status !== "active") return NextResponse.json({ ok: false, error: "연결이 비활성 상태" }, { status: 400 });

  let connectedId: string;
  try {
    connectedId = envelopeDecrypt({
      encryptedSecret: conn.encrypted_connected_id,
      secretIv: conn.cid_iv,
      secretAuthTag: conn.cid_auth_tag,
      encryptedDek: conn.encrypted_dek,
      dekIv: conn.dek_iv,
      dekAuthTag: conn.dek_auth_tag,
      kekVersion: conn.kek_version,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "connectedId 복호화 실패. 다시 연결해 주세요." }, { status: 500 });
  }

  let body: { fromDays?: number } = {};
  try { body = (await request.json()) as typeof body; } catch { /* empty */ }
  const fromDays = body.fromDays ?? 30;
  const until = new Date();
  const from = new Date(until.getTime() - fromDays * 24 * 60 * 60 * 1000);

  let client: CodefClient;
  try {
    client = new CodefClient({ env: "sandbox" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message, code: "CODEF_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const result = await client.getMemberStorePurchase({
      connectedId,
      startDate: toYmd(from),
      endDate: toYmd(until),
    });
    const rows = (result.resList ?? []).map((s) => ({
      user_id: auth.userId,
      card_company: s.cardCompany,
      approval_number: s.approvalNumber,
      approved_at: s.approvedAt,
      amount: Math.round(s.amount),
      vat: Math.round(s.vat ?? 0),
      service_charge: Math.round(s.serviceCharge ?? 0),
      card_brand: s.cardBrand ?? null,
      installment_months: s.installmentMonths ?? 0,
      status: s.status,
      raw: s.raw ?? s,
    }));
    if (rows.length > 0) {
      const { error } = await supabase
        .from("codef_card_sales")
        .upsert(rows, { onConflict: "user_id,card_company,approval_number" });
      if (error) {
        console.error("[codef/sync] upsert", error);
        return NextResponse.json({ ok: false, error: "DB 저장 실패", fetched: rows.length }, { status: 500 });
      }
    }
    await supabase.from("codef_connections").update({ last_sync_at: new Date().toISOString(), last_sync_error: null }).eq("user_id", auth.userId);
    return NextResponse.json({ ok: true, fetched: rows.length, range: { from: from.toISOString(), until: until.toISOString() } });
  } catch (e) {
    const errMsg = e instanceof CodefApiError ? `${e.resultCode}: ${e.resultMessage}` : (e as Error).message;
    await supabase.from("codef_connections").update({ last_sync_error: errMsg }).eq("user_id", auth.userId);
    return NextResponse.json({ ok: false, error: errMsg }, { status: 502 });
  }
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
