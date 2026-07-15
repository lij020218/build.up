/**
 * GET /api/cron/payroll-check — 급여일·퇴사정산 알림 (매일 1회, 09:00 KST)
 *
 * 1) 급여일 당일  → 사장에게 "월급 보내셨습니까?" · 재직 직원에게 "오늘 급여일"
 * 2) 급여일 경과 + 사장이 '예' 를 안 함 → **다음날부터 3일 간격**(+1, +4, +7…) 사장에게 재알림
 * 3) 퇴사·미정산 → 금품청산 기한(퇴사일+14일) D-3 / D-day / 기한초과(3일 간격) 사장에게 알림
 *
 * 법적 근거: 근로기준법 §36 금품청산(퇴직일부터 14일 이내), §37 지연이자 연 20%.
 *   → 기한 기준은 '월급일' 이 아니라 left_at + 14일.
 *
 * 인증: Vercel cron 의 Authorization: Bearer <CRON_SECRET>.
 * 알림 발송은 push_dispatch RPC(SECURITY DEFINER) 경유 — 푸시 + 인앱 알림함 동시 기록.
 */
import { NextResponse } from "next/server";
import { getCronSecret } from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { getKstDate } from "../../../lib/utils/business-day";

export const runtime = "nodejs";
export const maxDuration = 120;

const NAG_INTERVAL_DAYS = 3;   // 사장님 결정(2026-07-15): 매일은 알림 피로 → 3일 간격
const SETTLE_DUE_DAYS = 14;    // 근로기준법 §36 금품청산 기한

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = getCronSecret();
  if (!secret) return false;   // 미설정 = fail-closed
  return timingSafeEqualStr(token, secret);
}

/** KST 자정 기준 두 날짜의 일수 차 (b - a). 시각 성분 제거로 DST/시분 오차 없음. */
function daysBetweenKst(aIso: string, bIso: string): number {
  const a = Date.parse(`${aIso}T00:00:00Z`);
  const b = Date.parse(`${bIso}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

type Setting = { owner_user_id: string; payday_day: number };
type MemberRow = { owner_user_id: string; member_user_id: string; left_at: string | null };

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const today = getKstDate();                       // YYYY-MM-DD (KST)
  const [y, m, d] = today.split("-").map(Number);
  const period = `${y}-${String(m).padStart(2, "0")}`;
  const daysInMonth = new Date(y, m, 0).getDate();  // m 은 1-based → 그 달 말일

  const notify = async (recipient: string, title: string, body: string, url: string) => {
    const { error } = await supabase.rpc("push_dispatch" as never, {
      p_recipient: recipient, p_title: title, p_body: body, p_url: url,
    } as never);
    if (error) console.warn("[payroll-check] push_dispatch failed:", error.message);
  };

  let paydayNotified = 0, nagged = 0, settleNotified = 0;

  // ── 1·2. 급여일 / 미확인 재알림 ──
  const { data: settings, error: sErr } = await supabase
    .from("payroll_settings").select("owner_user_id, payday_day");
  if (sErr) {
    console.error("[payroll-check] settings load failed:", sErr.message);
    return NextResponse.json({ error: "settings load failed" }, { status: 500 });
  }

  for (const s of ((settings ?? []) as Setting[])) {
    // 말일 보정 — payday_day=31 인데 2월이면 28일이 실제 급여일.
    const effPayday = Math.min(s.payday_day, daysInMonth);
    if (d < effPayday) continue;

    // 이 달 '보냈다' 확인 여부
    const { data: conf } = await supabase
      .from("payroll_confirmations").select("paid")
      .eq("owner_user_id", s.owner_user_id).eq("period", period).maybeSingle();
    const alreadyPaid = (conf as { paid?: boolean } | null)?.paid === true;
    if (alreadyPaid) continue;

    const { data: members } = await supabase
      .from("store_members").select("owner_user_id, member_user_id, left_at")
      .eq("owner_user_id", s.owner_user_id).is("settled_at", null);
    const active = ((members ?? []) as MemberRow[]).filter((x) => !x.left_at);

    if (d === effPayday) {
      await notify(s.owner_user_id, "오늘은 급여일입니다",
        `${period} 급여를 보내셨나요? 팀 화면에서 지급 여부를 알려주세요.`, "/team");
      for (const mem of active) {
        await notify(mem.member_user_id, "오늘은 급여일입니다",
          "급여가 입금되지 않았다면 내 근무 화면에서 사장님께 알릴 수 있어요.", "/staff");
      }
      paydayNotified++;
    } else {
      // 급여일 경과 + 미확인 → 다음날부터 3일 간격(+1, +4, +7…)
      const since = d - effPayday;
      if (since >= 1 && (since - 1) % NAG_INTERVAL_DAYS === 0) {
        await notify(s.owner_user_id, "급여 지급 확인이 필요합니다",
          `${period} 급여일(${effPayday}일)이 ${since}일 지났습니다. 지급하셨다면 팀 화면에서 확인해 주세요.`,
          "/team");
        nagged++;
      }
    }
  }

  // ── 3. 퇴사·미정산 → 금품청산 기한 알림 ──
  const { data: leavers } = await supabase
    .from("store_members").select("owner_user_id, member_user_id, left_at")
    .not("left_at", "is", null).is("settled_at", null);

  for (const lv of ((leavers ?? []) as MemberRow[])) {
    if (!lv.left_at) continue;
    const leftDate = getKstDate(new Date(lv.left_at));
    const dueIn = SETTLE_DUE_DAYS - daysBetweenKst(leftDate, today);  // 남은 일수(음수=초과)
    const overdue = -dueIn;
    const isD3 = dueIn === 3;
    const isDDay = dueIn === 0;
    // 초과분은 3일 간격으로만(매일 X)
    const isOverdueTick = dueIn < 0 && overdue % NAG_INTERVAL_DAYS === 0;
    if (!isD3 && !isDDay && !isOverdueTick) continue;

    const title = dueIn < 0 ? "퇴직 정산 기한이 지났습니다" : "퇴직 정산 기한이 다가옵니다";
    const body = dueIn < 0
      ? `퇴사자 정산 기한(퇴사일+14일)이 ${overdue}일 지났습니다. 지연이자(연 20%)가 발생합니다. 정산 후 팀 화면에서 완료 표시해 주세요.`
      : dueIn === 0
        ? "오늘이 퇴사자 금품청산 기한(퇴사일+14일)입니다. 임금·퇴직금 지급을 마쳐 주세요."
        : `퇴사자 금품청산 기한이 ${dueIn}일 남았습니다(퇴사일+14일).`;
    await notify(lv.owner_user_id, title, body, "/team");
    settleNotified++;
  }

  return NextResponse.json({ ok: true, today, period, paydayNotified, nagged, settleNotified });
}
