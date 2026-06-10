/**
 * 지원사업 앱 내부 신청 — 파운드원이 직접 운영하는 지원사업(internalApply) 접수.
 *
 *   POST /api/funding/apply  — 현 사업체로 신청(접수 기간 서버 게이팅 + 스냅샷 저장).
 *   GET  /api/funding/apply?programId=  — 본인 신청 여부/상태 조회.
 *
 * 인증: Supabase Bearer (requireApiUser). 익명 거부.
 * 저장: program_applications (RLS 본인 insert/update/select). 프로그램당 1신청 → upsert.
 *
 * 접수 기간은 *서버가* 진실 소스 — 클라이언트 버튼 상태와 무관하게 창(window) 밖이면 거부.
 */
import { NextResponse } from "next/server";
import { requireApiUser, getUserScopedClient } from "../../_lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 앱 내부 신청을 받는 프로그램별 접수 기간(KST 날짜, inclusive) + 발표일. */
const INTERNAL_PROGRAMS: Record<string, { open: string; close: string; announce: string }> = {
  "foundone-startup-grant-1": { open: "2026-06-15", close: "2026-08-15", announce: "2026-08-22" },
};

/** 현재 KST 날짜 (YYYY-MM-DD). 서버 타임존 무관하게 +9h 보정. */
function kstDateString(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

type SnapshotInput = {
  storeName?: unknown;
  industryCategoryId?: unknown;
  businessLaunched?: unknown;
  businessLaunchedDate?: unknown;
  monthlyAvgRevenue?: unknown;
  hasUserSales?: unknown;
  weeklySalesChangePct?: unknown;
  recentCustomers?: unknown;
  customerChangePct?: unknown;
  employeesCount?: unknown;
};

/** 클라이언트 스냅샷 → 알려진 키만 정제 적재(임의 필드 차단). */
function sanitizeSnapshot(raw: unknown): Record<string, unknown> {
  const s = (raw && typeof raw === "object" ? raw : {}) as SnapshotInput;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 200) : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
  return {
    storeName: str(s.storeName),
    industryCategoryId: str(s.industryCategoryId),
    businessLaunched: bool(s.businessLaunched),
    businessLaunchedDate: str(s.businessLaunchedDate),
    monthlyAvgRevenue: num(s.monthlyAvgRevenue),
    hasUserSales: bool(s.hasUserSales),
    weeklySalesChangePct: num(s.weeklySalesChangePct),
    recentCustomers: num(s.recentCustomers),
    customerChangePct: num(s.customerChangePct),
    employeesCount: num(s.employeesCount),
  };
}

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const programId = new URL(request.url).searchParams.get("programId") ?? "";
  if (!INTERNAL_PROGRAMS[programId]) {
    return NextResponse.json({ ok: false, error: "알 수 없는 지원사업입니다." }, { status: 400 });
  }

  const client = getUserScopedClient(request);
  if (!client) return NextResponse.json({ ok: false, error: "세션 오류" }, { status: 401 });

  const { data, error } = await client
    .from("program_applications")
    .select("status, created_at")
    .eq("program_id", programId)
    .maybeSingle();

  if (error) {
    console.error("[funding/apply GET] query failed:", error.message);
    return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    applied: !!data,
    status: data?.status ?? null,
    appliedAt: data?.created_at ?? null,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: { programId?: string; pitch?: string; snapshot?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const programId = typeof body.programId === "string" ? body.programId : "";
  const window = INTERNAL_PROGRAMS[programId];
  if (!window) {
    return NextResponse.json({ ok: false, error: "알 수 없는 지원사업입니다." }, { status: 400 });
  }

  // ── 접수 기간 게이팅 (서버가 진실) ──
  const today = kstDateString();
  if (today < window.open) {
    return NextResponse.json(
      { ok: false, error: `신청은 ${window.open.replaceAll("-", ".")}부터 시작됩니다.` },
      { status: 403 },
    );
  }
  if (today > window.close) {
    return NextResponse.json(
      { ok: false, error: `신청이 마감되었습니다. (마감 ${window.close.replaceAll("-", ".")})` },
      { status: 403 },
    );
  }

  const pitch = typeof body.pitch === "string" ? body.pitch.trim().slice(0, 1000) : null;
  const snapshot = sanitizeSnapshot(body.snapshot);

  const client = getUserScopedClient(request);
  if (!client) return NextResponse.json({ ok: false, error: "세션 오류" }, { status: 401 });

  // 프로그램당 1신청 — 재신청 시 갱신(아이디어·스냅샷 최신화).
  const { error } = await client
    .from("program_applications")
    .upsert(
      {
        user_id: auth.userId,
        program_id: programId,
        status: "submitted",
        pitch,
        snapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,program_id" },
    );

  if (error) {
    console.error("[funding/apply POST] upsert failed:", error.message);
    return NextResponse.json({ ok: false, error: "신청 저장에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, announce: window.announce });
}
