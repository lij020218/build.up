/**
 * POST /api/integrations/codef/bank/connect
 *
 * 사장님 사업자 통장 등록.
 *   1) codef_connections 가 active 인지 확인 (CODEF 위임 사전 등록 필수)
 *   2) CODEF 기업 보유계좌 조회 → 본인 명의 확인
 *   3) codef_bank_accounts 에 메타 저장 (active)
 *
 * Body: { organization, accountNumber, bankName?, accountAlias?, isPrimary? }
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../../_lib/envelope-crypto";
import { CodefClient, CodefApiError } from "../../../../_lib/codef-client";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `codef-bank-connect:${auth.userId}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: {
    organization?: string;
    accountNumber?: string;
    bankName?: string;
    accountAlias?: string;
    isPrimary?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  const organization = (body.organization ?? "").trim();
  const accountNumber = (body.accountNumber ?? "").replace(/[^0-9]/g, "");
  if (!organization) {
    return NextResponse.json({ ok: false, error: "은행 코드 (organization) 필요" }, { status: 400 });
  }
  if (accountNumber.length < 8) {
    return NextResponse.json({ ok: false, error: "정상 계좌번호 입력 필요" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  // CODEF 위임 사전 등록 확인
  const { data: conn } = await supabase
    .from("codef_connections")
    .select("encrypted_connected_id, cid_iv, cid_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version, status")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!conn) {
    return NextResponse.json(
      { ok: false, error: "먼저 /api/integrations/codef/connect 에서 위임 등록 필요" },
      { status: 400 }
    );
  }
  if (conn.status !== "active") {
    return NextResponse.json({ ok: false, error: "CODEF 연결 비활성" }, { status: 400 });
  }

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
    return NextResponse.json({ ok: false, error: "위임토큰 복호화 실패" }, { status: 500 });
  }

  // 보유계좌 조회로 사장님 계좌 검증
  let client: CodefClient;
  try {
    client = new CodefClient({ env: "sandbox" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, code: "CODEF_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let accountHolder: string | undefined;
  try {
    const list = await client.getBusinessBankAccountList({ connectedId, organization });
    const found = (list.resAccountList ?? []).find(
      (a) => (a.resAccount ?? "").replace(/[^0-9]/g, "") === accountNumber
    );
    if (!found) {
      return NextResponse.json(
        {
          ok: false,
          error: "해당 계좌가 사장님 명의로 조회되지 않습니다. 은행 코드와 계좌번호를 확인해 주세요.",
        },
        { status: 400 }
      );
    }
    accountHolder = found.resAccountName;
  } catch (e) {
    if (e instanceof CodefApiError) {
      return NextResponse.json(
        { ok: false, error: e.resultMessage, code: e.resultCode },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: false, error: "CODEF 호출 실패" }, { status: 502 });
  }

  // 다른 계좌가 primary 였다면 해제
  if (body.isPrimary) {
    await supabase
      .from("codef_bank_accounts")
      .update({ is_primary: false })
      .eq("user_id", auth.userId);
  }

  const accountNumberMask =
    accountNumber.length > 4
      ? `${accountNumber.slice(0, 3)}-***-${accountNumber.slice(-4)}`
      : accountNumber;

  const { data: row, error } = await supabase
    .from("codef_bank_accounts")
    .upsert(
      {
        user_id: auth.userId,
        organization,
        bank_name: body.bankName ?? null,
        account_number: accountNumber,
        account_number_mask: accountNumberMask,
        account_holder: accountHolder ?? null,
        account_alias: body.accountAlias ?? null,
        is_primary: body.isPrimary ?? false,
        status: "active",
        last_sync_error: null,
      },
      { onConflict: "user_id,organization,account_number" }
    )
    .select("id")
    .single();
  if (error) {
    console.error("[codef/bank/connect] upsert", error);
    return NextResponse.json({ ok: false, error: "계좌 정보 저장 실패" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    accountId: row.id,
    accountNumberMask,
    accountHolder,
    message: "사업자 통장 등록 완료. 거래내역 자동 동기화가 시작됩니다.",
  });
}
