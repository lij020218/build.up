/**
 * /api/account/owner-profile — 사장님 프로필 PII 봉투암호화 동기화.
 *
 * GET  : DB 에서 owner_profile_enc 복호화 → 평문 JSON 반환.
 * POST : 평문 JSON → 봉투암호화 → user_store_data.owner_profile_enc upsert.
 *
 * PII 구성: birthYear(Int) | ncbScore(Int) | consideringClosure(Bool) | isDisabledOwner(Bool)
 * 모두 선택적 — 사용자가 입력한 것만 포함.
 *
 * 보안:
 *  - KEK 미설정 시 GET 204 / POST 503 (평문 fallback 금지).
 *  - 인증 필수 (requireApiUser).
 *  - user_id 격리 — 자신의 row 만 읽고 씀.
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { envelopeEncrypt, envelopeDecrypt, isKekAvailable, type EnvelopedSecret } from "../../_lib/envelope-crypto";

export const runtime = "nodejs";
export const maxDuration = 10;

type OwnerProfilePlain = {
  birthYear?: number;
  ncbScore?: number;
  consideringClosure?: boolean;
  isDisabledOwner?: boolean;
};

// ── GET — 복호화해서 반환 ────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (!isKekAvailable()) {
    // KEK 없으면 복호화 불가 — 클라가 로컬값 유지
    return new NextResponse(null, { status: 204 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data } = await supabase
    .from("user_store_data")
    .select("owner_profile_enc")
    .eq("user_id", auth.userId)
    .maybeSingle();

  const enc = data?.owner_profile_enc as EnvelopedSecret | null | undefined;
  if (!enc) return new NextResponse(null, { status: 204 });

  try {
    const plain = envelopeDecrypt(enc);
    const parsed: OwnerProfilePlain = JSON.parse(plain);
    return NextResponse.json({ ok: true, profile: parsed });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

// ── POST — 암호화해서 저장 ───────────────────────────────────────────────

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (!isKekAvailable()) {
    return NextResponse.json({ ok: false, error: "암호화 키 미설정 — 관리자에게 문의하세요." }, { status: 503 });
  }

  let body: OwnerProfilePlain;
  try {
    body = await request.json() as OwnerProfilePlain;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  // 모두 undefined 면 저장할 게 없음
  const hasAny = body.birthYear !== undefined || body.ncbScore !== undefined ||
    body.consideringClosure !== undefined || body.isDisabledOwner !== undefined;
  if (!hasAny) return NextResponse.json({ ok: true });

  // 숫자 필드 범위 검증 — NaN·음수·터무니 없는 값 차단
  const birthYearNum = body.birthYear !== undefined ? Number(body.birthYear) : undefined;
  const ncbScoreNum = body.ncbScore !== undefined ? Number(body.ncbScore) : undefined;

  if (birthYearNum !== undefined) {
    if (!Number.isInteger(birthYearNum) || birthYearNum < 1900 || birthYearNum > 2010) {
      return NextResponse.json({ ok: false, error: "birthYear 는 1900~2010 사이 정수여야 합니다." }, { status: 400 });
    }
  }
  if (ncbScoreNum !== undefined) {
    if (!Number.isFinite(ncbScoreNum) || ncbScoreNum < 0 || ncbScoreNum > 1000) {
      return NextResponse.json({ ok: false, error: "ncbScore 는 0~1000 사이 숫자여야 합니다." }, { status: 400 });
    }
  }

  const plain: OwnerProfilePlain = {
    ...(birthYearNum !== undefined && { birthYear: birthYearNum }),
    ...(ncbScoreNum !== undefined && { ncbScore: ncbScoreNum }),
    ...(body.consideringClosure !== undefined && { consideringClosure: Boolean(body.consideringClosure) }),
    ...(body.isDisabledOwner !== undefined && { isDisabledOwner: Boolean(body.isDisabledOwner) }),
  };

  let enc: EnvelopedSecret;
  try {
    enc = envelopeEncrypt(JSON.stringify(plain));
  } catch (e) {
    console.error("[owner-profile] encrypt failed:", e);
    return NextResponse.json({ ok: false, error: "암호화 실패" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { error } = await supabase
    .from("user_store_data")
    .upsert(
      { user_id: auth.userId, owner_profile_enc: enc },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[owner-profile] upsert failed:", error.message);
    return NextResponse.json({ ok: false, error: "저장 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
