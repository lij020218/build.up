/**
 * POST /api/integrations/codef/connect
 *
 * 사장님 위임 정보로 CODEF 가 여신협회 통합조회 회원가입 자동 + connectedId 발급.
 * Body: { businessNumber, representativeBirthday, cardCompany, bankAccountNumber }
 *
 * connectedId 는 봉투 암호화 후 codef_connections 에 저장.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeEncrypt, isKekAvailable } from "../../../_lib/envelope-crypto";
import { CodefClient, CodefApiError } from "../../../_lib/codef-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = checkSimpleRateLimit({ key: `codef-connect:${auth.userId}`, limit: 3, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  if (!isKekAvailable(1)) {
    return NextResponse.json({ ok: false, error: "서버 암호화 키 미설정" }, { status: 500 });
  }

  let body: {
    businessNumber?: string;
    representativeBirthday?: string;
    cardCompany?: string;
    bankAccountNumber?: string;
    businessName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  const businessNumber = (body.businessNumber ?? "").replace(/[^0-9]/g, "");
  const representativeBirthday = (body.representativeBirthday ?? "").replace(/[^0-9]/g, "");
  const cardCompany = (body.cardCompany ?? "").trim();
  const bankAccountNumber = (body.bankAccountNumber ?? "").replace(/[^0-9]/g, "");

  if (businessNumber.length !== 10) {
    return NextResponse.json({ ok: false, error: "사업자번호 10자리 필요" }, { status: 400 });
  }
  if (representativeBirthday.length !== 8) {
    return NextResponse.json({ ok: false, error: "대표자 생년월일 8자리 필요 (YYYYMMDD)" }, { status: 400 });
  }
  if (!cardCompany) {
    return NextResponse.json({ ok: false, error: "카드사 선택 필요" }, { status: 400 });
  }
  if (bankAccountNumber.length < 8) {
    return NextResponse.json({ ok: false, error: "정상 계좌번호 입력 필요" }, { status: 400 });
  }

  let client: CodefClient;
  try {
    client = new CodefClient({ env: "sandbox" });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: (e as Error).message,
        code: "CODEF_NOT_CONFIGURED",
        hint: "developer.codef.io 가입 후 CODEF_CLIENT_ID/SECRET 환경변수 설정",
      },
      { status: 503 }
    );
  }

  let result;
  try {
    result = await client.createBusinessAccount({
      businessNumber,
      representativeBirthday,
      cardCompany,
      bankAccountNumber,
    });
  } catch (e) {
    if (e instanceof CodefApiError) {
      return NextResponse.json(
        { ok: false, error: e.resultMessage, code: e.resultCode },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: false, error: "CODEF 서버 호출 실패" }, { status: 502 });
  }

  if (!result.connectedId) {
    return NextResponse.json({ ok: false, error: "connectedId 발급 실패" }, { status: 500 });
  }

  // 봉투 암호화
  let enveloped;
  try {
    enveloped = envelopeEncrypt(result.connectedId, 1);
  } catch (e) {
    return NextResponse.json({ ok: false, error: "암호화 실패" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const mask = `${businessNumber.slice(0, 3)}-**-***${businessNumber.slice(-2)}`;
  const { error } = await supabase.from("codef_connections").upsert(
    {
      user_id: auth.userId,
      business_number_mask: mask,
      business_name: body.businessName ?? null,
      encrypted_connected_id: enveloped.encryptedSecret,
      cid_iv: enveloped.secretIv,
      cid_auth_tag: enveloped.secretAuthTag,
      encrypted_dek: enveloped.encryptedDek,
      dek_iv: enveloped.dekIv,
      dek_auth_tag: enveloped.dekAuthTag,
      kek_version: enveloped.kekVersion,
      status: "active",
      last_sync_error: null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[codef/connect] upsert", error);
    return NextResponse.json({ ok: false, error: "연결 정보 저장 실패" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: "active",
    businessNumberMask: mask,
    message: "CODEF 위임 등록 완료. 이제 매출 자동 동기화가 시작됩니다.",
  });
}
