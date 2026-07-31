"use client";

/**
 * TeamSurface — 사장 전용 "직원" surface.
 *
 * 역할: 직원 근무표(주간 반복 규칙) 배정 + 연차·휴가 승인/반려.
 *   - 근무표: 직원별 근무 요일 + 기본 근무시간 → staff_schedule_rules 로 저장.
 *     (특정 날짜만 다른 시간/휴무 = 예외는 후속 슬라이스에서 staff_schedules override.)
 *   - 승인: leave_requests 대기 건을 승인/반려 (owner RLS).
 *
 * 직원명: user_profiles 는 본인전용 RLS라 get_store_members() SECURITY DEFINER RPC 로 조회.
 * 백엔드: 20260708_000002(출퇴근·연차) + 20260708_000003(반복 규칙·get_store_members).
 * 가짜 데이터 없음 — 초대된 직원/신청이 없으면 정직한 빈 상태.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Users, CalendarClock, CalendarPlus, Check, X, Clock3, UserPlus, CheckCircle2, Coins, Wallet, UserMinus } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import {
  HIRING_QUICK_CHANNELS,
  calcAnnualLeave, usedLeaveDays, remainingLeaveDays, leaveYearRange,
  LEAVE_BASIS_LABEL, type LeaveBasis,
} from "@foundone/shared";
import { InviteLinkSection } from "../InviteLinkSection";
import { StaffDetailModal } from "./StaffDetailModal";
import { DaangnHiringGuideModal } from "../DaangnHiringGuideModal";
import { ExternalQuickLinks } from "../ui/ExternalQuickLinks";
import { OwnerScheduleCalendar } from "../team/OwnerScheduleCalendar";
import { ShiftAvailabilityCalendar } from "../team/ShiftAvailabilityCalendar";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_SOFT2 = "rgba(25,25,112,0.10)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_MUTED = "rgba(25,25,112,0.45)";
const LEAVE = "#8b7fd4";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];

type Member = { member_user_id: string; name: string; role: "staff" | "manager"; joined_at: string | null; hire_date: string | null; hourly_wage?: number | null; employment_type?: string | null; job_duties?: string[] | null;
  // 퇴사·정산 (2026-07-15). left_at=퇴사일, settle_due_at=금품청산 기한(퇴사일+14일, 근로기준법 §36).
  //   정산 완료(settled_at)된 사람은 RPC 가 아예 안 내려준다 → 여기 없으면 '숨김'.
  left_at?: string | null; severance_amount?: number | null; settle_due_at?: string | null };

// 근속(勤續) 일차 — 입사일(없으면 가게 연결일) 기준 오늘이 N일째
function tenureDays(hireDate: string | null, joinedAt: string | null): number | null {
  const startStr = hireDate ?? (joinedAt ? joinedAt.slice(0, 10) : null);
  if (!startStr) return null;
  const start = new Date(`${startStr}T00:00:00`).getTime();
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - start) / 86400000) + 1; // 입사일 = 1일차
}
type Rule = { id?: string; member_user_id: string; weekday: number; start_time: string; end_time: string; active: boolean };
type LeaveType = "annual" | "half" | "sick" | "other";
type LeaveStatus = "pending" | "approved" | "rejected";
type Leave = { id: string; member_user_id: string; leave_type: LeaveType; start_date: string; end_date: string; reason: string | null; status: LeaveStatus };
// 날짜별 예외 — is_off 면 그 날 휴무, 아니면 그 날만 다른 시간(대타)
type Exception = { id: string; member_user_id: string; work_date: string; start_time: string | null; end_time: string | null; is_off: boolean };

const LEAVE_LABEL: Record<LeaveType, string> = { annual: "연차", half: "반차", sick: "병가", other: "기타" };
type AllowanceType = "overtime" | "night" | "holiday" | "other";
type Allowance = { id: string; member_user_id: string; work_date: string; allowance_type: AllowanceType; minutes: number; reason: string | null; status: LeaveStatus };
const ALLOWANCE_LABEL: Record<AllowanceType, string> = { overtime: "연장근로", night: "야간근로", holiday: "휴일근로", other: "기타" };
const fmtMinKo = (min: number) => { const h = Math.floor(min / 60), m = min % 60; return h && m ? `${h}시간 ${m}분` : h ? `${h}시간` : `${m}분`; };
const ymdLocal = (base?: Date) => { const d = base ?? new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// 급여 기간 키 'YYYY-MM' — DB payroll_confirmations.period 와 동일 형식(cron 도 같은 키를 쓴다).
const ymLocal = () => ymdLocal().slice(0, 7);
/** 이번 달 실제 급여일 — payday_day=31 인데 2월이면 28일로 보정(cron 의 LEAST 와 동일 규칙). */
function effectivePayday(day: number): number {
  const d = new Date();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Math.min(day, daysInMonth);
}
/** 금품청산 기한까지 남은 일수(음수=초과). 근로기준법 §36 — 퇴사일+14일. */
function daysUntil(iso: string): number {
  const due = new Date(iso); due.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}
// 오늘 출퇴근 — clock_out_at IS NULL 이면 근무 중, 있으면 근무 완료, 행 없으면 미출근 (2026-07-14)
type Att = { member_user_id: string; clock_in_at: string; clock_out_at: string | null };
const hhmmKST = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" });

export function TeamSurface({ ko, categoryId }: { ko: boolean; categoryId?: string | null }) {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  /** 연차 잔여 계산 전용 원장 — 승인된 연차·반차 전부 (표시 목록과 달리 잘리지 않는다) */
  const [leaveLedger, setLeaveLedger] = useState<Leave[]>([]);
  const [allowances, setAllowances] = useState<Allowance[]>([]); // 추가 수당 신청 (2026-07-13)
  const [todayAtt, setTodayAtt] = useState<Att[]>([]); // 오늘 출퇴근 — 직원별 출근여부 배지 (2026-07-14)
  const [loading, setLoading] = useState(true);
  const [showDaangnGuide, setShowDaangnGuide] = useState(false); // 당근 구인 가이드 팝업 (2026-07-25)
  const [membersError, setMembersError] = useState(false); // get_store_members RPC 실패 — "직원 없음"과 구분 (2026-07-13)
  // 급여일 (2026-07-15) — paidThisMonth: true=보냄 / false=아직 / null=무응답(=cron 이 3일 간격 재알림)
  const [paydayDay, setPaydayDay] = useState<number | null>(null);
  const [paidThisMonth, setPaidThisMonth] = useState<boolean | null>(null);
  // 연차 부여 기준 (2026-07-28) — 사장이 버튼으로 선택. 일수는 근로기준법 제60조로 계산(저장 안 함)
  const [leaveBasis, setLeaveBasis] = useState<LeaveBasis>("hire_date");
  const [savingPayroll, setSavingPayroll] = useState(false);
  // 직원 상세 팝업 (시급·근태·연차 — 2026-07-13)
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setOwnerId(user.id);
    const period = ymLocal();
    const ledgerCutoff = ymdLocal(new Date(Date.now() - 400 * 86400_000));
    const [mRes, rRes, exRes, lRes, aRes, atRes, psRes, pcRes, ledRes] = await Promise.all([
      supabase.rpc("get_store_members" as never),
      supabase.from("staff_schedule_rules" as never).select("id, member_user_id, weekday, start_time, end_time, active").eq("owner_user_id", user.id),
      supabase.from("staff_schedules" as never).select("id, member_user_id, work_date, start_time, end_time, is_off").eq("owner_user_id", user.id).gte("work_date", ymdLocal()).order("work_date"),
      supabase.from("leave_requests" as never).select("id, member_user_id, leave_type, start_date, end_date, reason, status").eq("owner_user_id", user.id).order("created_at", { ascending: false }).limit(40),
      supabase.from("allowance_requests" as never).select("id, member_user_id, work_date, allowance_type, minutes, reason, status").eq("owner_user_id", user.id).order("created_at", { ascending: false }).limit(40),
      // 오늘 출퇴근 — 직원별 "출근함/미출근" 배지용 (owner RLS att_owner_read)
      supabase.from("attendance_records" as never).select("member_user_id, clock_in_at, clock_out_at").eq("owner_user_id", user.id).eq("work_date", ymdLocal()),
      // 급여일 설정 + 이번 달 지급 확인 (2026-07-15)
      supabase.from("payroll_settings" as never).select("payday_day, leave_basis").eq("owner_user_id", user.id).maybeSingle(),
      supabase.from("payroll_confirmations" as never).select("paid").eq("owner_user_id", user.id).eq("period", period).maybeSingle(),
      // 연차 잔여 계산용 원장 — 위 목록(limit 40, 최근 생성순)으로 사용일수를 세면
      // 직원이 여럿일 때 오래된 승인 건이 잘려 나가 **잔여가 부풀려진다**(가짜 숫자). 별도 조회.
      supabase.from("leave_requests" as never)
        .select("id, member_user_id, leave_type, start_date, end_date, reason, status")
        .eq("owner_user_id", user.id).eq("status", "approved").in("leave_type", ["annual", "half"])
        .gte("end_date", ledgerCutoff).limit(1000),
    ]);
    // RPC 에러(마이그레이션 누락·서버 장애)를 "직원 없음"으로 오인하지 않도록 구분 (2026-07-13).
    const mErr = (mRes as { error?: unknown }).error;
    setMembersError(!!mErr);
    if (mErr) console.error("[team] get_store_members failed:", mErr);
    setMembers((((mRes as { data: unknown }).data ?? []) as Member[]));
    setRules(((rRes.data ?? []) as Rule[]));
    setExceptions(((exRes.data ?? []) as Exception[]));
    setLeaves(((lRes.data ?? []) as Leave[]));
    setLeaveLedger(((ledRes.data ?? []) as Leave[]));
    setAllowances(((aRes.data ?? []) as Allowance[]));
    setTodayAtt(((atRes.data ?? []) as Att[]));
    setPaydayDay(((psRes.data as { payday_day?: number } | null)?.payday_day) ?? null);
    const savedBasis = (psRes.data as { leave_basis?: string } | null)?.leave_basis;
    if (savedBasis === "hire_date" || savedBasis === "fiscal_year") setLeaveBasis(savedBasis);
    setPaidThisMonth(((pcRes.data as { paid?: boolean } | null)?.paid) ?? null);  // null = 무응답
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Supabase realtime — 직원이 출퇴근/연차 신청하면 즉시 반영.
  const reloadRef = useRef<() => void>(() => {});
  reloadRef.current = () => { void load(); };
  useEffect(() => {
    if (!ownerId) return;
    const fire = () => reloadRef.current();
    const ch = supabase.channel(`team-rt-${ownerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests", filter: `owner_user_id=eq.${ownerId}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "allowance_requests", filter: `owner_user_id=eq.${ownerId}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records", filter: `owner_user_id=eq.${ownerId}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_schedule_rules", filter: `owner_user_id=eq.${ownerId}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_schedules", filter: `owner_user_id=eq.${ownerId}` }, fire)
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [ownerId, load]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("leave_requests" as never)
      .update({ status, decided_at: new Date().toISOString() } as never).eq("id", id);
    if (error) { console.error("[team] decide failed:", error); return; }
    setLeaves((p) => p.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const decideAllowance = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("allowance_requests" as never)
      .update({ status, decided_at: new Date().toISOString() } as never).eq("id", id);
    if (error) { console.error("[team] allowance decide failed:", error); return; }
    setAllowances((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const saveRules = async (memberId: string, workdays: Set<number>, start: string, end: string): Promise<boolean> => {
    if (!ownerId) return false;
    await supabase.from("staff_schedule_rules" as never).delete().eq("owner_user_id", ownerId).eq("member_user_id", memberId);
    const rows: Rule[] = [...workdays].sort().map((w) => ({ owner_user_id: ownerId, member_user_id: memberId, weekday: w, start_time: start, end_time: end, active: true } as Rule & { owner_user_id: string }));
    if (rows.length) {
      const { error } = await supabase.from("staff_schedule_rules" as never).insert(rows as never);
      if (error) { console.error("[team] saveRules failed:", error); return false; }
    }
    setRules((p) => [...p.filter((r) => r.member_user_id !== memberId), ...rows]);
    return true;
  };

  // 날짜 예외 저장 — 대타(다른 시간) 또는 특정일 휴무. (owner+member+work_date UNIQUE 로 upsert)
  const saveException = async (memberId: string, date: string, isOff: boolean, start: string, end: string): Promise<boolean> => {
    if (!ownerId) return false;
    const row = { owner_user_id: ownerId, member_user_id: memberId, work_date: date, is_off: isOff, start_time: isOff ? null : start, end_time: isOff ? null : end };
    const { data, error } = (await supabase.from("staff_schedules" as never)
      .upsert(row as never, { onConflict: "owner_user_id,member_user_id,work_date" } as never)
      .select("id, member_user_id, work_date, start_time, end_time, is_off").maybeSingle()) as { data: Exception | null; error: unknown };
    if (error) { console.error("[team] saveException failed:", error); return false; }
    if (data) setExceptions((p) => [...p.filter((e) => !(e.member_user_id === memberId && e.work_date === date)), data].sort((a, b) => a.work_date.localeCompare(b.work_date)));
    return true;
  };
  const deleteException = async (id: string) => {
    const { error } = await supabase.from("staff_schedules" as never).delete().eq("id", id);
    if (error) { console.error("[team] deleteException failed:", error); return; }
    setExceptions((p) => p.filter((e) => e.id !== id));
  };

  // 입사일 지정 — 근속 계산 기준 (owner 가 store_members 갱신)
  const setHireDate = async (memberId: string, date: string) => {
    if (!ownerId) return;
    const { error } = await supabase.from("store_members" as never)
      .update({ hire_date: date } as never).eq("owner_user_id", ownerId).eq("member_user_id", memberId);
    if (error) { console.error("[team] setHireDate failed:", error); return; }
    setMembers((p) => (p ? p.map((m) => (m.member_user_id === memberId ? { ...m, hire_date: date } : m)) : p));
  };

  // ── 급여일·퇴사 정산 (2026-07-15) ──
  const savePayday = async (day: number) => {
    if (!ownerId) return;
    setSavingPayroll(true);
    const { error } = await supabase.from("payroll_settings" as never)
      .upsert({ owner_user_id: ownerId, payday_day: day, updated_at: new Date().toISOString() } as never,
        { onConflict: "owner_user_id" } as never);
    setSavingPayroll(false);
    if (error) { console.error("[payroll] payday save failed:", error); return; }
    setPaydayDay(day);
  };

  /** 연차 부여 기준 저장 — payday 와 같은 행(payroll_settings). 일수는 계산이라 저장하지 않는다. */
  const saveLeaveBasis = async (basis: LeaveBasis) => {
    if (!ownerId) return;
    const prev = leaveBasis;
    setLeaveBasis(basis); // 낙관적 반영
    const { error } = await supabase.from("payroll_settings" as never)
      .upsert({ owner_user_id: ownerId, leave_basis: basis, updated_at: new Date().toISOString() } as never,
        { onConflict: "owner_user_id" } as never);
    if (error) { console.error("[payroll] leave_basis save failed:", error); setLeaveBasis(prev); }
  };

  /** "월급 보내셨습니까?" 응답. true=보냄(재알림 중단) / false=아직(3일 간격 재알림 계속). */
  const confirmPaid = async (paid: boolean) => {
    if (!ownerId) return;
    setSavingPayroll(true);
    const { error } = await supabase.from("payroll_confirmations" as never)
      .upsert({ owner_user_id: ownerId, period: ymLocal(), paid, confirmed_at: new Date().toISOString() } as never,
        { onConflict: "owner_user_id,period" } as never);
    setSavingPayroll(false);
    if (error) { console.error("[payroll] confirm failed:", error); return; }
    setPaidThisMonth(paid);
  };

  const markLeft = async (memberId: string) => {
    const { error } = await supabase.from("store_members" as never)
      .update({ left_at: new Date().toISOString() } as never)
      .eq("owner_user_id", ownerId!).eq("member_user_id", memberId);
    if (error) { console.error("[team] mark left failed:", error); return; }
    void load();
  };

  /** 정산 완료 — 명부에서 사라짐(행·근로기록은 보존). 금액은 입력했을 때만 기록. */
  const markSettled = async (memberId: string, severance: number | null) => {
    const { error } = await supabase.from("store_members" as never)
      .update({ settled_at: new Date().toISOString(), ...(severance != null ? { severance_amount: severance } : {}) } as never)
      .eq("owner_user_id", ownerId!).eq("member_user_id", memberId);
    if (error) { console.error("[team] settle failed:", error); return; }
    void load();
  };

  const activeMembers = (members ?? []).filter((m) => !m.left_at);
  const leavers = (members ?? []).filter((m) => !!m.left_at);

  const pending = leaves.filter((l) => l.status === "pending");
  const decided = leaves.filter((l) => l.status !== "pending").slice(0, 8);
  const allowPending = allowances.filter((a) => a.status === "pending");
  const allowDecided = allowances.filter((a) => a.status !== "pending").slice(0, 8);
  const nameOf = (id: string) => members?.find((m) => m.member_user_id === id)?.name ?? (ko ? "직원" : "Staff");
  const mdDay = (d: string) => { const [, mm, dd] = d.split("-"); return ko ? `${Number(mm)}월 ${Number(dd)}일` : `${mm}/${dd}`; };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <header>
          <div style={eyebrow}>Found.One · {ko ? "직원 관리" : "Team"}</div>
          <h1 style={h1}>{ko ? "근무표 · 연차 관리" : "Schedule & time off"}</h1>
          <p style={{ fontSize: 14, color: MUTED, margin: "8px 0 0", lineHeight: 1.6 }}>
            {ko ? "직원별 근무 요일·시간을 정하고, 연차 신청을 승인/반려하세요. 여기서 정한 근무표는 직원 화면에 그대로 표시됩니다." : "Set each staff's shifts and approve time-off requests."}
          </p>
        </header>

        {/* 구인구직 바로가기 — 직원이 없거나 더 필요할 때의 다음 행동 (2026-07-24 사장님 지시).
            2026-07-25: 채널 목록을 shared SSOT(HIRING_QUICK_CHANNELS)로 승격 + 당근알바 추가
            + "당근으로 구하는 법" 가이드 팝업. URL 은 공식 도메인만. */}
        <ExternalQuickLinks
          title={ko ? "직원 구인 바로가기" : "Hiring quick links"}
          caption={ko ? "공고 등록·지원자 관리는 각 사이트에서 하세요." : "Post jobs on these sites."}
          action={{ label: ko ? "당근으로 구하는 법 →" : "How to hire on Daangn →", onClick: () => setShowDaangnGuide(true) }}
          links={HIRING_QUICK_CHANNELS.map((c) => ({
            label: ko ? c.label : c.labelEn,
            url: c.url,
            badge: c.badge ? (ko ? c.badge.ko : c.badge.en) : undefined,
          }))}
        />
        {showDaangnGuide && <DaangnHiringGuideModal ko={ko} onClose={() => setShowDaangnGuide(false)} />}

        {loading ? (
          <div style={{ ...card, textAlign: "center", color: MUTED }}>{ko ? "불러오는 중…" : "Loading…"}</div>
        ) : membersError ? (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Users size={18} strokeWidth={1.7} style={{ color: MIDNIGHT }} />
              <div style={{ fontSize: 15, fontWeight: 750, color: INK }}>{ko ? "직원 목록을 불러오지 못했어요" : "Couldn't load your team"}</div>
            </div>
            <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 12px" }}>
              {ko ? "일시적인 오류일 수 있어요. 연결된 직원 정보는 그대로 유지됩니다. 잠시 후 다시 시도해 주세요." : "This may be temporary — your team data is preserved. Please retry."}
            </p>
            <button type="button" onClick={() => { setLoading(true); void load(); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12, border: "none", background: MIDNIGHT, color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
              {ko ? "다시 시도" : "Retry"}
            </button>
          </div>
        ) : !members || members.length === 0 ? (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <UserPlus size={18} strokeWidth={1.7} style={{ color: MIDNIGHT }} />
              <div style={{ fontSize: 15, fontWeight: 750, color: INK }}>{ko ? "아직 연결된 직원이 없어요" : "No staff yet"}</div>
            </div>
            <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 12px" }}>
              {ko
                ? "아래에서 초대 링크를 만들어 직원에게 카톡·문자로 보내세요. 직원이 링크로 가입·연결되면 여기서 근무표·연차·출퇴근을 관리할 수 있어요."
                : "Create an invite link below and send it to your staff. Once they join, you can manage schedules, time off, and attendance here."}
            </p>
            <InviteLinkSection ko={ko} />
          </div>
        ) : (
          <>
            {/* ── 급여일 (2026-07-15) — 시간에 걸린 액션이라 맨 위 ── */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Wallet size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "급여일" : "Payday"}</div>
              </div>
              {paydayDay == null ? (
                <>
                  <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px", lineHeight: 1.5 }}>
                    {ko ? "급여일을 정하면 그날 사장님과 직원 모두에게 알림이 갑니다. 지급 확인을 안 하시면 3일 간격으로 다시 알려드려요." : "Set a payday to notify you and your staff."}
                  </p>
                  <PaydayPicker ko={ko} value={null} saving={savingPayroll} onSave={savePayday} />
                </>
              ) : (
                <>
                  {/* 값 + 「수정」은 PaydayPicker 가 소유(읽기 default). 여기선 말일 보정만 보조 설명. */}
                  <PaydayPicker ko={ko} value={paydayDay} saving={savingPayroll} onSave={savePayday} />
                  {effectivePayday(paydayDay) !== paydayDay && (
                    <p style={{ fontSize: 11.5, color: MIDNIGHT_MUTED, margin: "6px 0 0", lineHeight: 1.5 }}>
                      {ko ? `이번 달은 ${effectivePayday(paydayDay)}일(말일)에 알려드려요.` : `This month: the ${effectivePayday(paydayDay)}th.`}
                    </p>
                  )}
                  <div style={{ height: 12 }} />
                  {/* 급여일 당일·경과 + 미확인 → 응답 요청 */}
                  {new Date().getDate() >= effectivePayday(paydayDay) && paidThisMonth !== true ? (
                    <div style={{ padding: "12px 14px", borderRadius: 12, background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 10 }}>
                        {ko ? `${ymLocal()} 급여를 보내셨나요?` : "Did you send this month's payroll?"}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" disabled={savingPayroll} onClick={() => void confirmPaid(true)}
                          style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 13, fontWeight: 700, cursor: savingPayroll ? "wait" : "pointer" }}>
                          {ko ? "네, 보냈어요" : "Yes, sent"}
                        </button>
                        <button type="button" disabled={savingPayroll} onClick={() => void confirmPaid(false)}
                          style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "transparent", color: MIDNIGHT, fontSize: 13, fontWeight: 700, cursor: savingPayroll ? "wait" : "pointer" }}>
                          {ko ? "아직이요" : "Not yet"}
                        </button>
                      </div>
                      {paidThisMonth === false && (
                        <div style={{ fontSize: 11.5, color: MIDNIGHT_MUTED, marginTop: 10, lineHeight: 1.5 }}>
                          {ko ? "3일 간격으로 다시 알려드릴게요. 임금은 매월 1회 이상 일정한 날짜에 지급해야 합니다(근로기준법 §43)." : "We'll remind you every 3 days."}
                        </div>
                      )}
                    </div>
                  ) : paidThisMonth === true ? (
                    <div style={{ fontSize: 13, color: MIDNIGHT, fontWeight: 600 }}>
                      {ko ? `✓ ${ymLocal()} 급여 지급 확인됨` : `✓ ${ymLocal()} payroll confirmed`}
                    </div>
                  ) : (
                    /* 급여일 전 — 안내만. (값·수정은 위 PaydayPicker 가 이미 소유) */
                    <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
                      {ko ? "급여일에 사장님과 직원 모두에게 알려드려요." : "We'll notify you and your staff on payday."}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ── 퇴사·정산 (2026-07-15) — 미정산자만. 정산 완료하면 RPC 가 안 내려줘 사라짐 ── */}
            {leavers.length > 0 && (
              <section style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <UserMinus size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                  <div style={sectionTitle}>{ko ? "퇴사자 정산" : "Offboarding"}</div>
                  <span style={badge}>{leavers.length}</span>
                </div>
                <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px", lineHeight: 1.5 }}>
                  {ko ? "퇴직 시 임금·퇴직금 등 일체의 금품은 퇴사일부터 14일 이내에 지급해야 합니다(근로기준법 §36). 정산을 마치면 완료 표시해 주세요." : "Settle final pay within 14 days of departure (LSA §36)."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {leavers.map((m) => (
                    <LeaverRow key={m.member_user_id} ko={ko} member={m} onSettle={(amt) => void markSettled(m.member_user_id, amt)} />
                  ))}
                </div>
              </section>
            )}

            {/* 연차 승인 큐 */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Clock3 size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "연차·휴가 승인" : "Time-off approvals"}</div>
                {pending.length > 0 && <span style={badge}>{pending.length}</span>}
              </div>

              {pending.length === 0 ? (
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{ko ? "대기 중인 신청이 없어요." : "No pending requests."}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pending.map((l) => (
                    <div key={l.id} style={leaveRow}>
                      <span style={leaveType}>{LEAVE_LABEL[l.leave_type]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{nameOf(l.member_user_id)} · {mdRange(l.start_date, l.end_date)}</div>
                        {l.reason && <div style={{ fontSize: 12, color: MUTED, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.reason}</div>}
                      </div>
                      <button type="button" style={approveBtn} onClick={() => decide(l.id, "approved")}><Check size={14} strokeWidth={2.4} />{ko ? "승인" : "Approve"}</button>
                      <button type="button" style={rejectBtn} onClick={() => decide(l.id, "rejected")} aria-label={ko ? "반려" : "Decline"}><X size={15} strokeWidth={2.2} /></button>
                    </div>
                  ))}
                </div>
              )}

              {decided.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${MIDNIGHT_SOFT2}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{ko ? "최근 처리" : "Recent"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {decided.map((l) => (
                      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: MUTED }}>
                        <span style={{ fontWeight: 700, color: INK }}>{nameOf(l.member_user_id)}</span>
                        <span>{LEAVE_LABEL[l.leave_type]} · {mdRange(l.start_date, l.end_date)}</span>
                        <span style={{ marginLeft: "auto", ...(l.status === "approved" ? approvedPill : rejectedPill) }}>{l.status === "approved" ? (ko ? "승인" : "Approved") : (ko ? "반려" : "Declined")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 추가 수당 승인 큐 (2026-07-13) */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Coins size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "추가 수당 승인" : "Allowance approvals"}</div>
                {allowPending.length > 0 && <span style={badge}>{allowPending.length}</span>}
              </div>

              {allowPending.length === 0 ? (
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{ko ? "대기 중인 신청이 없어요. 직원이 연장·야간·휴일근로 수당을 신청하면 여기 표시됩니다." : "No pending requests."}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allowPending.map((a) => (
                    <div key={a.id} style={leaveRow}>
                      <span style={leaveType}>{ALLOWANCE_LABEL[a.allowance_type]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{nameOf(a.member_user_id)} · {mdDay(a.work_date)} · {fmtMinKo(a.minutes)}</div>
                        {a.reason && <div style={{ fontSize: 12, color: MUTED, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.reason}</div>}
                      </div>
                      <button type="button" style={approveBtn} onClick={() => decideAllowance(a.id, "approved")}><Check size={14} strokeWidth={2.4} />{ko ? "승인" : "Approve"}</button>
                      <button type="button" style={rejectBtn} onClick={() => decideAllowance(a.id, "rejected")} aria-label={ko ? "반려" : "Decline"}><X size={15} strokeWidth={2.2} /></button>
                    </div>
                  ))}
                </div>
              )}

              {allowDecided.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${MIDNIGHT_SOFT2}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{ko ? "최근 처리" : "Recent"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {allowDecided.map((a) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: MUTED }}>
                        <span style={{ fontWeight: 700, color: INK }}>{nameOf(a.member_user_id)}</span>
                        <span>{ALLOWANCE_LABEL[a.allowance_type]} · {mdDay(a.work_date)} · {fmtMinKo(a.minutes)}</span>
                        <span style={{ marginLeft: "auto", ...(a.status === "approved" ? approvedPill : rejectedPill) }}>{a.status === "approved" ? (ko ? "승인" : "Approved") : (ko ? "반려" : "Declined")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: MIDNIGHT_MUTED, marginTop: 12, lineHeight: 1.55 }}>
                {ko ? "연장·야간·휴일근로는 상시 5인 이상 사업장에서 통상임금 50% 가산(근로기준법 §56). 5인 미만은 초과분 시급 지급." : "50% premium at workplaces with 5+ staff (LSA §56)."}
              </div>
            </section>

            {/* 연차 관리 — 법정 일수(근로기준법 제60조) + 직원별 잔여 (2026-07-28) */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CalendarClock size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "연차 관리" : "Annual leave"}</div>
              </div>
              <AnnualLeaveSection
                ko={ko}
                members={activeMembers}
                leaves={leaveLedger}
                basis={leaveBasis}
                onChangeBasis={(b) => void saveLeaveBasis(b)}
              />
            </section>

            {/* 근무 캘린더 — 어느 날 누가 나오는지 한눈에 (2026-07-28 사장님 요청).
                배정 편집(아래 섹션)보다 먼저 — 현황 파악이 편집보다 앞선다. */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CalendarClock size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "근무 캘린더" : "Shift calendar"}</div>
              </div>
              <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 14px", lineHeight: 1.5 }}>
                {ko ? "날짜를 누르면 그날 출근하는 직원과 시간을 볼 수 있어요." : "Tap a date to see who works that day."}
              </p>
              <OwnerScheduleCalendar
                ko={ko}
                ownerId={ownerId}
                members={activeMembers.map((m) => ({ member_user_id: m.member_user_id, name: m.name }))}
                rules={rules}
              />
            </section>

            {/* 희망 근무 취합 — 직원이 낸 다음 달 희망 (2026-07-30 사장님 요청).
                근무 캘린더(확정) 바로 뒤 — "확정 현황 → 다음 달 희망 → 배정 편집" 순서. */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CalendarPlus size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "희망 근무 취합" : "Shift requests"}</div>
              </div>
              <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 14px", lineHeight: 1.5 }}>
                {ko
                  ? "직원이 낸 다음 달 희망을 모아서 보여줘요. 마음에 들면 그대로 근무표에 넣을 수 있어요."
                  : "Next month's requests from your staff — add them straight to the roster."}
              </p>
              <ShiftAvailabilityCalendar ko={ko} ownerId={ownerId} myUserId={ownerId} mode="owner" />
            </section>

            {/* 직원별 근무표 */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CalendarClock size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "근무표 배정" : "Weekly schedule"}</div>
              </div>
              <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 14px", lineHeight: 1.5 }}>
                {ko ? "근무 요일과 기본 근무시간을 정하세요. 특정 날짜만 다르게(대타) 하거나 휴무 처리는 「예외」에서." : "Pick work days and set the default shift time. Use exceptions for one-off changes."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* 퇴사자는 근무표 대상이 아니다 — 위 「퇴사자 정산」 섹션에서만 다룬다. */}
                {activeMembers.map((m) => (
                  <MemberScheduleEditor
                    key={m.member_user_id} ko={ko} member={m}
                    attToday={todayAtt.find((a) => a.member_user_id === m.member_user_id) ?? null}
                    memberRules={rules.filter((r) => r.member_user_id === m.member_user_id && r.active)}
                    memberExceptions={exceptions.filter((e) => e.member_user_id === m.member_user_id)}
                    onSave={(wd, s, e) => saveRules(m.member_user_id, wd, s, e)}
                    onSaveException={(date, isOff, s, e) => saveException(m.member_user_id, date, isOff, s, e)}
                    onDeleteException={deleteException}
                    onSetHireDate={(date) => setHireDate(m.member_user_id, date)}
                    onOpenDetail={() => setDetailMember(m)}
                  />
                ))}
              </div>
            </section>

            {/* 직원 추가 초대 — 운영 중에도 새 직원 연결 (2026-07-12: 종전엔 초대 진입로가 로드맵 채용 단계에만 있었음) */}
            <section style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <UserPlus size={17} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
                <div style={sectionTitle}>{ko ? "직원 추가" : "Add staff"}</div>
              </div>
              <InviteLinkSection ko={ko} />
            </section>
          </>
        )}
      </div>

      {/* 직원 상세 팝업 — 시급(사장 편집)·예상 급여·이번 달 근태·연차 */}
      {detailMember && (
        <StaffDetailModal
          member={detailMember}
          rules={rules.filter((r) => r.member_user_id === detailMember.member_user_id && r.active)}
          leaves={leaves.filter((l) => l.member_user_id === detailMember.member_user_id)}
          ko={ko}
          categoryId={categoryId}
          onClose={() => setDetailMember(null)}
          onWageSaved={(wage) => {
            setDetailMember((prev) => (prev ? { ...prev, hourly_wage: wage } : prev));
            void load();
          }}
          onMarkLeft={() => {
            const target = detailMember.member_user_id;
            setDetailMember(null);
            void markLeft(target);
          }}
          onJobSaved={(employmentType, jobDuties) => {
            setDetailMember((prev) => (prev ? { ...prev, employment_type: employmentType, job_duties: jobDuties } : prev));
            void load();
          }}
        />
      )}
    </div>
  );
}

function MemberScheduleEditor({ ko, member, attToday, memberRules, memberExceptions, onSave, onSaveException, onDeleteException, onSetHireDate, onOpenDetail }: {
  ko: boolean; member: Member; attToday: Att | null; memberRules: Rule[]; memberExceptions: Exception[];
  onSave: (workdays: Set<number>, start: string, end: string) => Promise<boolean>;
  onSaveException: (date: string, isOff: boolean, start: string, end: string) => Promise<boolean>;
  onDeleteException: (id: string) => void;
  onSetHireDate: (date: string) => void;
  onOpenDetail: () => void;
}) {
  const tdays = tenureDays(member.hire_date, member.joined_at);
  const hireVal = member.hire_date ?? (member.joined_at ? member.joined_at.slice(0, 10) : "");
  // 저장된 현재값 — 읽기 모드는 항상 props(서버 상태)에서 직접 계산
  const savedDays = new Set(memberRules.map((r) => r.weekday));
  const savedStart = memberRules[0]?.start_time?.slice(0, 5) ?? "17:00";
  const savedEnd = memberRules[0]?.end_time?.slice(0, 5) ?? "23:00";

  // ── 수정/저장 모드 (사장님 데이터 카드 표준 패턴, 2026-07-13 재작성) ──
  //   기본 = 읽기 전용. 「수정」 클릭 시에만 draft 편집 → 「저장」으로 서버 반영.
  //   상태 4단계: idle / saving / saved(2초 후 idle) / error.
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<Set<number>>(savedDays);
  const [start, setStart] = useState(savedStart);
  const [end, setEnd] = useState(savedEnd);
  const [hireDraft, setHireDraft] = useState(hireVal);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleEdit = () => {
    setDays(new Set(savedDays));
    setStart(savedStart);
    setEnd(savedEnd);
    setHireDraft(hireVal);
    setSaveStatus("idle");
    setEditing(true);
  };
  const handleCancel = () => { setEditing(false); setSaveStatus("idle"); };
  const handleSave = async () => {
    setSaveStatus("saving");
    const ok = await onSave(days, start, end);
    if (ok && hireDraft && hireDraft !== hireVal) onSetHireDate(hireDraft);
    if (ok) {
      setSaveStatus("saved");
      setEditing(false);
      window.setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
    }
  };

  // 날짜 예외(대타/휴무) 추가 폼
  const [exOpen, setExOpen] = useState(false);
  const [exDate, setExDate] = useState(ymdLocal());
  const [exMode, setExMode] = useState<"off" | "custom">("off");
  const [exStart, setExStart] = useState("17:00");
  const [exEnd, setExEnd] = useState("23:00");
  const [exSaving, setExSaving] = useState(false);
  const addException = async () => {
    setExSaving(true);
    const ok = await onSaveException(exDate, exMode === "off", exStart, exEnd);
    setExSaving(false);
    if (ok) setExOpen(false);
  };
  const md1 = (d: string) => { const x = new Date(`${d}T00:00:00`); return `${x.getMonth() + 1}.${x.getDate()} (${WEEK_KO[x.getDay()]})`; };

  const toggle = (w: number) => { setDays((prev) => { const n = new Set(prev); n.has(w) ? n.delete(w) : n.add(w); return n; }); };

  // 요약 칩·읽기 표시는 화면 모드에 맞는 값으로 (읽기=저장값, 수정=draft)
  const viewDays = editing ? days : savedDays;
  const viewStart = editing ? start : savedStart;
  const viewEnd = editing ? end : savedEnd;
  const durMin = (() => { const [sh, sm] = viewStart.split(":").map(Number); const [eh, em] = viewEnd.split(":").map(Number); let d = eh * 60 + em - (sh * 60 + sm); if (d <= 0) d += 1440; return d; })();
  const durLabel = `${Math.floor(durMin / 60)}${ko ? "시간" : "h"}${durMin % 60 ? ` ${durMin % 60}${ko ? "분" : "m"}` : ""}`;

  return (
    <div style={{ padding: "16px 16px 14px", borderRadius: 16, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white" }}>
      {/* flexWrap: 항목(이름·역할·출근·근속·주간요약·수정)이 많아 좁은 폰에서 한 줄 초과 →
          줄바꿈 허용해 '수정' 버튼이 카드 밖으로 삐져나가지 않게 (2026-07-14). */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {/* 이름 영역 클릭 → 직원 상세(시급·근태) 팝업 (2026-07-13) */}
        <button
          type="button"
          onClick={onOpenDetail}
          title={ko ? "직원 상세 — 시급·근태·연차" : "Staff details"}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 999, background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={15} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 750, color: INK, textDecoration: "underline", textDecorationColor: "rgba(25,25,112,0.25)", textUnderlineOffset: 3 }}>{member.name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED }}>{ko ? "상세 ›" : "Details ›"}</span>
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: MIDNIGHT_SOFT, padding: "2px 8px", borderRadius: 999 }}>{member.role === "manager" ? (ko ? "매니저" : "Manager") : ko ? "직원" : "Staff"}</span>
        {/* 오늘 출근여부 — 신호등 색 대신 채움 강조로 구분: 근무중=채운 네이비 · 완료=소프트 · 미출근=아웃라인 (2026-07-14) */}
        {attToday == null ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, padding: "2px 8px", borderRadius: 999 }}>
            {ko ? "미출근" : "Not in"}
          </span>
        ) : attToday.clock_out_at == null ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 750, color: "white", background: MIDNIGHT, padding: "2px 9px", borderRadius: 999 }}>
            <Clock3 size={11} strokeWidth={2.4} />{ko ? `출근 ${hhmmKST(attToday.clock_in_at)}` : `In ${hhmmKST(attToday.clock_in_at)}`}
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: MIDNIGHT_SOFT2, padding: "2px 9px", borderRadius: 999 }}>
            <CheckCircle2 size={11} strokeWidth={2.2} />{ko ? "근무 완료" : "Done"}
          </span>
        )}
        {tdays != null && tdays >= 1 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, padding: "2px 8px", borderRadius: 999 }}>
            {ko ? `근속 ${tdays.toLocaleString()}일차` : `Day ${tdays.toLocaleString()}`}
          </span>
        )}
        {viewDays.size > 0 && <span style={{ marginLeft: "auto", fontSize: 12, color: MIDNIGHT_MUTED, fontWeight: 600 }}>{ko ? `주 ${viewDays.size}일 · ${durLabel}` : `${viewDays.size}d/wk · ${durLabel}`}</span>}
        {!editing && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: viewDays.size > 0 ? 0 : "auto" }}>
            {saveStatus === "saved" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: MIDNIGHT }}>
                <CheckCircle2 size={13} strokeWidth={2.2} />{ko ? "저장됨" : "Saved"}
              </span>
            )}
            <button type="button" onClick={handleEdit} style={{
              padding: "7px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MIDNIGHT,
            }}>
              {ko ? "수정" : "Edit"}
            </button>
          </span>
        )}
      </div>

      {!editing ? (
        /* ── 읽기 모드 — 저장된 근무표 요약 (편집 불가) ── */
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {WEEK_KO.map((w, i) => {
              const on = savedDays.has(i);
              return (
                <span key={i} aria-hidden style={{
                  flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                  background: on ? MIDNIGHT : MIDNIGHT_SOFT,
                  color: on ? "white" : i === 0 ? LEAVE : MIDNIGHT_MUTED,
                }}>{w}</span>
              );
            })}
          </div>
          {savedDays.size > 0 ? (
            <div style={{ fontSize: 13, color: INK, fontWeight: 600 }}>
              {ko
                ? `${timeLabel(savedStart, true)} – ${timeLabel(savedEnd, true)} · ${durLabel}`
                : `${savedStart} – ${savedEnd} · ${durLabel}`}
              {hireVal && <span style={{ color: MUTED, fontWeight: 500 }}> · {ko ? "입사일" : "Hired"} {hireVal}</span>}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: MUTED }}>
              {ko ? "근무표 미설정 — 「수정」을 눌러 요일과 시간을 배정하세요." : "No schedule yet — press Edit to assign."}
            </div>
          )}
        </div>
      ) : (
        /* ── 수정 모드 — draft 편집 + 저장/취소 ── */
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: MIDNIGHT_MUTED, flexShrink: 0 }}>{ko ? "입사일" : "Hire date"}</span>
            <input type="date" value={hireDraft} max={ymdLocal()} onChange={(e) => setHireDraft(e.target.value)} style={{ ...timeInput, maxWidth: 168, padding: "8px 10px" }} aria-label={ko ? "입사일 (근속 계산 기준)" : "Hire date"} />
            <span style={{ fontSize: 11.5, color: MUTED }}>{ko ? "근속 계산 기준" : "for tenure"}</span>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {WEEK_KO.map((w, i) => {
              const on = days.has(i);
              return (
                <button key={i} type="button" onClick={() => toggle(i)} aria-pressed={on} style={{
                  flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: `1px solid ${on ? MIDNIGHT : MIDNIGHT_BORDER}`,
                  background: on ? MIDNIGHT : "white", color: on ? "white" : i === 0 ? LEAVE : MIDNIGHT_MUTED,
                  transition: "background 160ms, color 160ms, border-color 160ms",
                }}>{w}</button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>{ko ? "출근" : "Start"}</label>
              <TimeSelect value={start} onChange={setStart} ko={ko} ariaLabel={ko ? "출근 시간" : "Start time"} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>{ko ? "퇴근" : "End"}</label>
              <TimeSelect value={end} onChange={setEnd} ko={ko} ariaLabel={ko ? "퇴근 시간" : "End time"} />
            </div>
          </div>

          {saveStatus === "error" && (
            <div style={{ fontSize: 12, color: "#b64c4c", marginBottom: 10 }}>
              {ko ? "저장에 실패했어요. 네트워크 확인 후 다시 시도해 주세요." : "Save failed — please retry."}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={handleCancel} disabled={saveStatus === "saving"} style={{
              padding: "10px 16px", borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${MIDNIGHT_BORDER}`, background: "transparent", color: MUTED,
            }}>
              {ko ? "취소" : "Cancel"}
            </button>
            <button type="button" onClick={handleSave} disabled={saveStatus === "saving"} style={{
              padding: "10px 18px", borderRadius: 11, fontSize: 13.5, fontWeight: 700, minWidth: 86,
              border: "none", background: MIDNIGHT, color: "white",
              cursor: saveStatus === "saving" ? "wait" : "pointer",
              opacity: saveStatus === "saving" ? 0.6 : 1,
            }}>
              {saveStatus === "saving" ? (ko ? "저장 중…" : "Saving…") : ko ? "저장" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* 날짜 예외 — 대타/특정일 휴무 */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${MIDNIGHT_SOFT2}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase" }}>{ko ? "예외 · 대타/휴무" : "Exceptions"}</span>
          <button type="button" onClick={() => setExOpen((o) => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: MIDNIGHT, fontSize: 12.5, fontWeight: 700, padding: "2px 4px" }}>
            {exOpen ? (ko ? "닫기" : "Close") : (ko ? "+ 예외 추가" : "+ Add")}
          </button>
        </div>

        {memberExceptions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {memberExceptions.map((ex) => (
              <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span style={{ fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{md1(ex.work_date)}</span>
                <span style={{ color: ex.is_off ? LEAVE : MIDNIGHT, fontWeight: 600 }}>
                  {ex.is_off ? (ko ? "휴무" : "Off") : `${ex.start_time?.slice(0, 5)}–${ex.end_time?.slice(0, 5)} · ${ko ? "대타" : "custom"}`}
                </span>
                <button type="button" onClick={() => onDeleteException(ex.id)} aria-label={ko ? "예외 삭제" : "Delete"} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: MIDNIGHT_MUTED, padding: 2, display: "flex" }}><X size={13} strokeWidth={2} /></button>
              </div>
            ))}
          </div>
        )}

        {exOpen && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: MIDNIGHT_SOFT, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>{ko ? "날짜" : "Date"}</label>
                <input type="date" value={exDate} min={ymdLocal()} onChange={(e) => setExDate(e.target.value)} style={timeInput} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>{ko ? "종류" : "Type"}</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["off", "custom"] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => setExMode(mode)} style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      border: `1px solid ${exMode === mode ? MIDNIGHT : MIDNIGHT_BORDER}`,
                      background: exMode === mode ? MIDNIGHT : "white", color: exMode === mode ? "white" : MIDNIGHT_MUTED,
                    }}>{mode === "off" ? (ko ? "휴무" : "Off") : (ko ? "대타" : "Custom")}</button>
                  ))}
                </div>
              </div>
            </div>
            {exMode === "custom" && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}><label style={fieldLabel}>{ko ? "출근" : "Start"}</label><TimeSelect value={exStart} onChange={setExStart} ko={ko} ariaLabel={ko ? "대타 출근 시간" : "Start"} /></div>
                <div style={{ flex: 1 }}><label style={fieldLabel}>{ko ? "퇴근" : "End"}</label><TimeSelect value={exEnd} onChange={setExEnd} ko={ko} ariaLabel={ko ? "대타 퇴근 시간" : "End"} /></div>
              </div>
            )}
            <button type="button" onClick={addException} disabled={exSaving} style={{
              padding: "11px", borderRadius: 12, border: "none", fontSize: 13.5, fontWeight: 700,
              background: MIDNIGHT, color: "white", cursor: exSaving ? "default" : "pointer",
            }}>{exSaving ? (ko ? "저장 중…" : "…") : (ko ? "예외 저장" : "Save exception")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── helpers ──
function mdRange(s: string, e: string): string {
  const f = (d: string) => { const x = new Date(`${d}T00:00:00`); return `${x.getMonth() + 1}.${x.getDate()}`; };
  return s === e ? f(s) : `${f(s)} – ${f(e)}`;
}

// ── styles ──
const wrap: React.CSSProperties = { padding: "8px 4px 40px" };
const card: React.CSSProperties = { background: "white", borderRadius: 20, padding: "22px 22px", boxShadow: "0 6px 30px rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.05)" };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MIDNIGHT_MUTED, marginBottom: 8 };
/**
 * 급여일 — 읽기 default + 「수정」 + 저장 (사장님 데이터 카드 표준 패턴, feedback_edit_save_pattern).
 *   1~31일. 31=말일 의도(그 달 말일로 자동 보정).
 */
/**
 * AnnualLeaveSection — 연차 부여 기준 선택 + 직원별 발생·사용·잔여 (2026-07-28)
 *
 *  일수는 근로기준법 제60조 계산(shared SSOT). 5인 미만이면 법정 의무가 없으므로
 *  숫자를 만들어내지 않고 안내만 한다 — 없는 의무를 있다고 하면 안 됨(제11조).
 *  출근율 80%·상시인원 특칙은 앱이 모르므로 항상 "예상"으로 표기한다.
 */
function AnnualLeaveSection({ ko, members, leaves, basis, onChangeBasis }: {
  ko: boolean;
  members: Member[];
  leaves: Leave[];
  basis: LeaveBasis;
  onChangeBasis: (b: LeaveBasis) => void;
}) {
  const headcount = members.length;
  const statutory = headcount >= 5;

  return (
    <div>
      {/* 5인 기준선 안내 — 사장님 질문의 핵심 */}
      <div style={{
        padding: "10px 12px", borderRadius: 10, marginBottom: 14,
        background: statutory ? MIDNIGHT_SOFT : "rgba(15,23,42,0.04)",
        fontSize: 12, lineHeight: 1.6, color: statutory ? MIDNIGHT : MUTED,
      }}>
        {statutory
          ? (ko
              ? `등록 직원 ${headcount}명 — 상시 5인 이상이라 법정 연차(근로기준법 제60조)가 적용돼요. 1년 미만은 개근 1개월당 1일, 1년부터 15일, 3년째부터 2년마다 1일씩 늘어 최대 25일이에요.`
              : `${headcount} staff — statutory leave applies (LSA §60).`)
          : (ko
              ? `등록 직원 ${headcount}명 — 5인 미만은 법정 연차 의무가 없어요 (근로기준법 제11조·제60조). 근로계약서·취업규칙에 연차를 정했다면 그 약속은 지켜야 해요.`
              : `${headcount} staff — under 5, no statutory leave (LSA §11, §60). Contractual leave still applies.`)}
      </div>

      {/* 부여 기준 — 사장이 선택 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTED, marginBottom: 7 }}>
          {ko ? "연차 부여 기준" : "Accrual basis"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["hire_date", "fiscal_year"] as const).map((b) => {
            const on = basis === b;
            const label = LEAVE_BASIS_LABEL[b];
            return (
              <button
                key={b}
                type="button"
                onClick={() => !on && onChangeBasis(b)}
                style={{
                  flex: "1 1 160px", textAlign: "left", padding: "10px 12px", borderRadius: 11,
                  border: on ? `1.5px solid ${MIDNIGHT}` : `1px solid ${MIDNIGHT_BORDER}`,
                  background: on ? MIDNIGHT_SOFT : "white",
                  cursor: on ? "default" : "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 750, color: on ? MIDNIGHT : INK }}>
                  {ko ? label.ko : label.en}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.45 }}>
                  {ko ? label.desc.ko : label.desc.en}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 직원별 연차 */}
      {members.length === 0 ? (
        <div style={{ fontSize: 12.5, color: MUTED }}>{ko ? "등록된 직원이 없어요." : "No staff yet."}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => {
            const result = calcAnnualLeave(m.hire_date, { basis, headcount });
            const range = leaveYearRange(basis, m.hire_date);
            const used = usedLeaveDays(
              leaves.filter((l) => l.member_user_id === m.member_user_id),
              { yearStart: range.start, yearEnd: range.end },
            );
            const left = remainingLeaveDays(result.days, used);
            return (
              <div key={m.member_user_id} style={{ padding: "11px 13px", borderRadius: 11, border: `1px solid ${MIDNIGHT_BORDER}`, background: "rgba(255,255,255,0.7)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 750, color: INK }}>{m.name}</span>
                  {result.statutory && result.days > 0 ? (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 800, color: MIDNIGHT, fontVariantNumeric: "tabular-nums" }}>
                        {ko ? `잔여 ${left}일` : `${left}d left`}
                      </span>
                      <span style={{ fontSize: 11.5, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                        {ko ? `(발생 ${result.days}일 · 사용 ${used}일)` : `(${result.days} granted · ${used} used)`}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, background: "rgba(15,23,42,0.05)", borderRadius: 999, padding: "2px 7px" }}>
                        {ko ? "예상" : "est."}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12.5, color: MUTED }}>
                      {ko ? (m.hire_date ? "법정 의무 없음" : "입사일 미입력") : (m.hire_date ? "Not statutory" : "No hire date")}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 5, lineHeight: 1.5 }}>
                  {ko ? result.basisNote.ko : result.basisNote.en}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 11, color: MIDNIGHT_MUTED, marginTop: 12, lineHeight: 1.55 }}>
        {ko
          ? "표시된 일수는 입사일 기준 예상치예요. 실제 일수는 직전 1년 출근율(80%)과 상시 근로자 수 산정에 따라 달라질 수 있어요 — 확정이 필요하면 노무사(1350)에게 확인하세요."
          : "Estimates based on hire date. Actual entitlement depends on 80% attendance and headcount rules."}
      </div>
    </div>
  );
}

function PaydayPicker({ ko, value, saving, onSave }: { ko: boolean; value: number | null; saving: boolean; onSave: (d: number) => void }) {
  const [editing, setEditing] = useState(value == null);   // 미설정이면 바로 입력 상태
  const [day, setDay] = useState<string>(value != null ? String(value) : "25");

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{ko ? `매월 ${value}일` : `Day ${value}`}</span>
        <button type="button" onClick={() => { setEditing(true); setDay(String(value ?? 25)); }}
          style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 9, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MIDNIGHT, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {ko ? "수정" : "Edit"}
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: MUTED }}>{ko ? "매월" : "Day"}</span>
      <select value={day} onChange={(e) => setDay(e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: INK, fontSize: 13.5, fontWeight: 600 }}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}{ko ? "일" : ""}{d === 31 && ko ? " (말일)" : ""}</option>
        ))}
      </select>
      <button type="button" disabled={saving} onClick={() => { onSave(Number(day)); setEditing(false); }}
        style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 13, fontWeight: 700,
          cursor: saving ? "wait" : "pointer", opacity: saving ? 0.45 : 1 }}>
        {saving ? (ko ? "저장 중…" : "Saving…") : (ko ? "저장" : "Save")}
      </button>
      {value != null && (
        <button type="button" onClick={() => setEditing(false)}
          style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: "transparent", color: MUTED, fontSize: 12.5, cursor: "pointer" }}>
          {ko ? "취소" : "Cancel"}
        </button>
      )}
    </div>
  );
}

/** 퇴사자 1행 — [퇴사] 배지 + 금품청산 D-day + 정산 완료(금액 선택 입력). */
function LeaverRow({ ko, member, onSettle }: { ko: boolean; member: Member; onSettle: (amount: number | null) => void }) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const left = daysUntil(member.settle_due_at ?? "");
  const overdue = left < 0;
  // 긴급도는 신호등 색이 아니라 대비·굵기로 — 브랜드 토큰은 미드나잇 네이비 + 라벤더뿐이고
  //   빨강/노랑은 금지다. 기한 초과는 배경 tint 를 진하게(SOFT2) + 문구를 풀강도 MIDNIGHT 로.
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      border: `1px solid ${MIDNIGHT_BORDER}`,
      // 기한 초과는 좌측 미드나잇 액센트 바로 위계를 준다 — 실렌더로 보니 배경 tint 차이
      //   (0.06→0.10)만으로는 나란히 놓고서야 겨우 구분됐다. 브랜드 토큰이라 신호등 규칙 위반 아님.
      borderLeft: overdue ? `3px solid ${MIDNIGHT}` : `1px solid ${MIDNIGHT_BORDER}`,
      background: overdue ? MIDNIGHT_SOFT2 : MIDNIGHT_SOFT,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 750, color: INK }}>{member.name}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: "white", background: MUTED, padding: "2px 7px", borderRadius: 999 }}>
          {ko ? "퇴사" : "Left"}
        </span>
        {member.settle_due_at && (
          <span style={{ fontSize: 11.5, fontWeight: overdue ? 800 : 700, color: overdue ? MIDNIGHT : MIDNIGHT_MUTED }}>
            {overdue
              ? (ko ? `정산 기한 ${-left}일 초과 · 지연이자 발생` : `${-left}d overdue`)
              : (ko ? `정산 기한 D-${left}` : `D-${left}`)}
          </span>
        )}
      </div>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          style={{ marginTop: 10, padding: "8px 16px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          {ko ? "정산 완료 표시" : "Mark settled"}
        </button>
      ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={ko ? "지급액(원) — 선택 입력" : "Amount (optional)"}
            style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: INK, fontSize: 13 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => onSettle(amount ? Number(amount) : null)}
              style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              {ko ? "완료" : "Done"}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "transparent", color: MUTED, fontSize: 12.5, cursor: "pointer" }}>
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: MIDNIGHT_MUTED, lineHeight: 1.5 }}>
            {ko ? "완료 표시하면 명단에서 사라집니다. 근태·연차 기록은 법정 보존을 위해 유지됩니다." : "Removed from the list; work records are retained."}
          </div>
        </div>
      )}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: INK, margin: 0, lineHeight: 1.25 };
const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 750, color: INK, letterSpacing: "-0.01em" };
const badge: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "white", background: LEAVE, minWidth: 18, height: 18, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" };
const leaveRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: MIDNIGHT_SOFT };
const leaveType: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "white", background: LEAVE, padding: "3px 8px", borderRadius: 999, flexShrink: 0 };
const approveBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 999, border: "none", background: MIDNIGHT, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 };
const rejectBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 999, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MIDNIGHT_MUTED, cursor: "pointer", flexShrink: 0 };
const approvedPill: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "white", background: MIDNIGHT, padding: "2px 9px", borderRadius: 999 };
const rejectedPill: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED, background: "transparent", border: `1px solid ${MIDNIGHT_BORDER}`, padding: "2px 9px", borderRadius: 999, textDecoration: "line-through" };
const fieldLabel: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED, marginBottom: 6 };
const timeInput: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 11, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", fontSize: 14, color: INK, WebkitTextFillColor: INK, boxSizing: "border-box", fontFamily: "inherit" };

// ── 시간 선택 (2026-07-13) ───────────────────────────────────────
// 네이티브 <input type="time">는 맥 Safari 에서 피커 없이 세그먼트 키보드 편집만 가능해
// "시간 수정이 안 된다"는 신고(사장님 실사용)로 이어짐 → 30분 단위 select 로 교체.
// 브라우저 무관하게 클릭 2번으로 확실히 동작, 오전/오후 표기.
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  return `${String(h).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
});
function timeLabel(t: string, ko: boolean): string {
  const [h, m] = t.split(":").map(Number);
  if (!ko) return t;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? "오전" : "오후"} ${h12}:${String(m).padStart(2, "0")}`;
}
function TimeSelect({ value, onChange, ko, ariaLabel }: { value: string; onChange: (v: string) => void; ko: boolean; ariaLabel: string }) {
  // 기존 저장값이 30분 단위가 아니면(예: 17:15) 그 값을 옵션에 포함해 표시 보존
  const options = TIME_OPTIONS.includes(value) ? TIME_OPTIONS : [value, ...TIME_OPTIONS];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel} style={{ ...timeInput, cursor: "pointer", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23191970' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 30 }}>
      {options.map((t) => (
        <option key={t} value={t}>{timeLabel(t, ko)}</option>
      ))}
    </select>
  );
}
