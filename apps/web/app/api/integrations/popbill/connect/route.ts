/**
 * POST /api/integrations/popbill/connect
 *
 * 사장님 사업자번호 등록 + 팝빌 회원사 가입 여부 확인.
 *
 * 홈택스 인증서 위임은 팝빌 자체 화면(또는 별도 등록 안내)을 거쳐야 하므로
 * 이 라우트에서는 단순히 사업자번호 + 회원 여부만 기록.
 *
 * Body: { businessNumber, businessName? }
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { PopbillClient, PopbillApiError } from "../../../_lib/popbill-client";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `popbill-connect:${auth.userId}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { businessNumber?: string; businessName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  const businessNumber = (body.businessNumber ?? "").replace(/[^0-9]/g, "");
  if (businessNumber.length !== 10) {
    return NextResponse.json({ ok: false, error: "사업자번호 10자리 필요" }, { status: 400 });
  }

  let isMember = false;
  try {
    const client = new PopbillClient();
    isMember = await client.isMember(businessNumber);
  } catch (e) {
    if (e instanceof PopbillApiError && e.code === "POPBILL_NOT_CONFIGURED") {
      return NextResponse.json(
        { ok: false, error: e.message, code: "POPBILL_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    // 네트워크 오류는 무시 — pending 으로 등록만
    console.warn("[popbill/connect] isMember", e);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const mask = `${businessNumber.slice(0, 3)}-**-***${businessNumber.slice(-2)}`;
  const { error } = await supabase.from("popbill_connections").upsert(
    {
      user_id: auth.userId,
      business_number: businessNumber,
      business_number_mask: mask,
      business_name: body.businessName ?? null,
      hometax_cert_registered: false,
      status: isMember ? "active" : "pending",
      last_sync_error: null,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[popbill/connect] upsert", error);
    return NextResponse.json({ ok: false, error: "연결 정보 저장 실패" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: isMember ? "active" : "pending",
    businessNumberMask: mask,
    isMember,
    nextStep: isMember
      ? "이제 /api/integrations/popbill/sync 에서 세금계산서/현금영수증 자동 수집이 가능합니다."
      : "팝빌 회원가입 + 홈택스 인증서 등록 후 자동 수집이 시작됩니다. www.popbill.com 에서 등록을 완료해 주세요.",
  });
}
