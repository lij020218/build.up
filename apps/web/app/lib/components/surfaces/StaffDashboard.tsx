"use client";

/**
 * StaffDashboard — 직원 전용 대시보드.
 *
 * 진입 조건: business_profiles.user_role === 'staff' (또는 'manager').
 * 데이터 출처: 전부 Supabase (모바일·웹 동일하게 보임). 가짜 데이터 없음 —
 *   데이터가 없으면 정직한 빈 상태를 보여준다.
 *
 * 구성 (Build.UP 디자인: lavender-mist 배경 + 미드나잇 네이비, Apple 미니멀):
 *   ① 가게 헤더 — 소속 가게명 + 역할
 *   ② 오늘 카드 — 날짜·요일 + 오늘 근무 일정 + 출근/퇴근 버튼 + 실시간 경과
 *   ③ 출근 기록 캘린더 — 월별, 근무일·연차일 점 코딩
 *   ④ 연차·휴가 — 내 신청 목록 + 신청 폼
 *
 * 백엔드: 마이그레이션 20260708_000002_staff_attendance
 *   (staff_schedules · attendance_records · leave_requests · get_staff_store_context RPC).
 * 초대/연결: 20260708_000001 (store_members · accept_store_invite).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LogOut, Store, CalendarDays, LogIn, Timer, ChevronLeft, ChevronRight,
  Plus, CheckCircle2, Clock3, X, Moon, Hourglass, UserRound,
} from "lucide-react";
import {
  signOutUser, employmentTypeLabel, jobDutyLabel, resolveShiftForDate, expandLeaveDates,
  calcAnnualLeave, usedLeaveDays, remainingLeaveDays, leaveYearRange, type LeaveBasis,
} from "@foundone/shared";
import { supabase } from "../../../../lib/supabase";
import { FoundOneLogo } from "../ui/FoundOneLogo";
import { StaffProfileView } from "./StaffProfileView";
import { StaffRightsCard } from "./StaffRightsCard";
import { StaffAllowanceCard, type AllowanceReq, type AllowanceType, type OvertimeCandidate } from "./StaffAllowanceCard";
import { ShiftAvailabilityCalendar } from "../team/ShiftAvailabilityCalendar";

// ── Build.UP 팔레트 (신호등 컬러 금지) ──
const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_SOFT2 = "rgba(25,25,112,0.10)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_MUTED = "rgba(25,25,112,0.45)";
const LEAVE = "#8b7fd4"; // 연차 — 온브랜드 라벤더 (빨강/노랑 대신)

/** 이번 달 실제 급여일 — 31일 설정인데 2월이면 28일(서버 cron 의 LEAST 보정과 동일 규칙). */
function effectivePaydayLocal(day: number): number {
  const d = new Date();
  return Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
}
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

type Ctx = { userId: string; ownerUserId: string; storeName: string; role: "staff" | "manager"; joinedAt: string | null; hireDate: string | null; hourlyWage: number | null; employmentType: string | null; jobDuties: string[]; leaveBasis: LeaveBasis; staffHeadcount: number | null;
  /** 사장이 정한 급여일(1~31). 없으면 null — 급여일 카드 자체를 숨긴다(가짜 정보 금지). */
  paydayDay: number | null };

// 근속(勤續) 일차 — 입사일(없으면 가게 연결일) 기준 오늘이 N일째
function tenureDays(hireDate: string | null, joinedAt: string | null): number | null {
  const startStr = hireDate ?? (joinedAt ? joinedAt.slice(0, 10) : null);
  if (!startStr) return null;
  const start = new Date(`${startStr}T00:00:00`).getTime();
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - start) / 86400000) + 1;
}
type Attendance = { id: string; work_date: string; clock_in_at: string; clock_out_at: string | null };
// 날짜별 예외(override) 행 — is_off 면 그 날 휴무, 아니면 그 날만 다른 시간
type Schedule = { work_date: string; start_time: string | null; end_time: string | null; note: string | null; is_off?: boolean };
// 주간 반복 규칙 (사장 배정) + 해석된 하루 근무
type Rule = { weekday: number; start_time: string; end_time: string };
type Shift = { start_time: string; end_time: string; note: string | null };

// 근무 해석은 shared SSOT 사용 — 사장 캘린더와 같은 규칙 (packages/shared/team/work-schedule.ts)
const resolveShift = (dateStr: string, weekday: number, rules: Rule[], exceptions: Schedule[]): Shift | null =>
  resolveShiftForDate(dateStr, weekday, rules, exceptions);
type LeaveType = "annual" | "half" | "sick" | "other";
type LeaveStatus = "pending" | "approved" | "rejected";
type Leave = { id: string; leave_type: LeaveType; start_date: string; end_date: string; reason: string | null; status: LeaveStatus };

// ── 날짜 헬퍼 (로컬 기준 YYYY-MM-DD) ──
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function StaffDashboard({ language }: { language: "ko" | "en" }) {
  const ko = language === "ko";

  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [ctxError, setCtxError] = useState(false); // 연결 조회 RPC 실패 — "미연결"과 구분 (2026-07-13)
  const [signingOut, setSigningOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // 내 정보 팝업 (2026-07-13)

  const [todayAtt, setTodayAtt] = useState<Attendance | null>(null);
  const [todaySched, setTodaySched] = useState<Shift | null>(null);
  const [monthAtt, setMonthAtt] = useState<Attendance[]>([]);
  const [monthSched, setMonthSched] = useState<Schedule[]>([]); // 날짜 예외
  const [rules, setRules] = useState<Rule[]>([]);               // 주간 반복 규칙
  const [leaves, setLeaves] = useState<Leave[]>([]);
  /** 잔여 계산 전용 원장 — 승인된 연차·반차 전부 (표시 목록과 달리 잘리지 않는다) */
  const [leaveLedger, setLeaveLedger] = useState<Leave[]>([]);
  /** 원장 조회 실패 — 잔여 히어로 대신 정직한 안내 (2026-08-01) */
  const [ledgerFailed, setLedgerFailed] = useState(false);
  const [allowances, setAllowances] = useState<AllowanceReq[]>([]); // 추가 수당 신청 (2026-07-13)

  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0); // 실시간 경과 타이머용
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [leaveOpen, setLeaveOpen] = useState(false);

  const today = ymd(new Date());
  // 정해진 근무 요일 — 반복 규칙의 요일 집합
  const workdays = useMemo(() => new Set(rules.map((r) => r.weekday)), [rules]);

  // ── 데이터 로드 ──
  const loadAll = useCallback(async (y: number, m: number) => {
    setCtxError(false);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) { setConnected(false); setLoading(false); return; }

    // ⚠️ RPC 에러(서버 장애·마이그레이션 누락 등)와 "진짜 미연결"을 구분한다.
    //   전자를 미연결로 처리하면, 서버엔 연결이 있는데도 화면이 끊긴 것처럼 보인다
    //   (2026-07-13 hire_date 컬럼 누락으로 실제 발생한 사고). 에러면 재시도 상태로.
    const { data: ctxRaw, error: ctxErr } = (await supabase.rpc("get_staff_store_context" as never)) as { data: unknown; error: unknown };
    if (ctxErr) { console.error("[staff] get_staff_store_context failed:", ctxErr); setCtxError(true); setLoading(false); return; }
    const c = (ctxRaw ?? {}) as { connected?: boolean; owner_user_id?: string; role?: string; store_name?: string; joined_at?: string | null; hire_date?: string | null; hourly_wage?: number | null; employment_type?: string | null; job_duties?: string[] | null; payday_day?: number | null; leave_basis?: string | null; staff_headcount?: number | null };
    if (!c.connected || !c.owner_user_id) { setConnected(false); setLoading(false); return; }

    const context: Ctx = {
      userId: user.id,
      ownerUserId: c.owner_user_id,
      storeName: c.store_name?.trim() || (ko ? "가게" : "Store"),
      role: c.role === "manager" ? "manager" : "staff",
      joinedAt: c.joined_at ?? null,
      hireDate: c.hire_date ?? null,
      hourlyWage: c.hourly_wage ?? null,
      employmentType: c.employment_type ?? null,
      jobDuties: Array.isArray(c.job_duties) ? c.job_duties : [],
      paydayDay: c.payday_day ?? null,
      // 연차 계산용 (2026-07-28) — 기준은 사장 설정, 인원은 5인 기준선 판정
      leaveBasis: c.leave_basis === "fiscal_year" ? "fiscal_year" : "hire_date",
      // 🔴 미상을 0 으로 강등하지 않는다 (2026-08-01): 0 이면 "5인 미만 = 법정 연차 없음"이라는
      //   법적 단정이 되어, 실제로는 앱이 인원을 못 받아온 상황에서 직원에게 거짓을 말한다.
      staffHeadcount: typeof c.staff_headcount === "number" ? c.staff_headcount : null,
    };
    setCtx(context);
    setConnected(true);

    const monthStart = `${y}-${pad(m + 1)}-01`;
    const monthEnd = `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`;
    const td = ymd(new Date());

    const [attRes, schedRes, ruleRes, leaveRes, allowRes, ledgerRes] = await Promise.all([
      supabase.from("attendance_records" as never)
        .select("id, work_date, clock_in_at, clock_out_at")
        .eq("member_user_id", user.id).gte("work_date", monthStart).lte("work_date", monthEnd),
      supabase.from("staff_schedules" as never)
        .select("work_date, start_time, end_time, note, is_off")
        .eq("member_user_id", user.id).gte("work_date", monthStart).lte("work_date", monthEnd),
      supabase.from("staff_schedule_rules" as never)
        .select("weekday, start_time, end_time, effective_until")
        .eq("member_user_id", user.id).eq("active", true),
      supabase.from("leave_requests" as never)
        .select("id, leave_type, start_date, end_date, reason, status")
        .eq("member_user_id", user.id).order("start_date", { ascending: false }).limit(12),
      supabase.from("allowance_requests" as never)
        .select("id, work_date, allowance_type, minutes, reason, status")
        .eq("member_user_id", user.id).order("work_date", { ascending: false }).limit(20),
      // 잔여 계산용 원장 — 위 목록(limit 12)으로 사용일수를 세면 연차를 많이 쓴 해에
      // 오래된 승인 건이 잘려 **잔여가 부풀려진다**. 승인된 연차·반차만 최근 1년+ 전부.
      supabase.from("leave_requests" as never)
        .select("id, leave_type, start_date, end_date, reason, status")
        .eq("member_user_id", user.id).eq("status", "approved").in("leave_type", ["annual", "half"])
        .gte("end_date", ymd(new Date(Date.now() - 400 * 86400_000))).limit(1000),
    ]);

    const att = (attRes.data ?? []) as Attendance[];
    const exceptions = (schedRes.data ?? []) as Schedule[];
    const ruleList = (ruleRes.data ?? []) as Rule[];
    setMonthAtt(att);
    setMonthSched(exceptions);
    setRules(ruleList);
    setLeaves((leaveRes.data ?? []) as Leave[]);
    const ledErr = (ledgerRes as { error?: unknown }).error;
    setLedgerFailed(!!ledErr);
    if (ledErr) console.error("[staff] leave ledger failed:", ledErr);
    setLeaveLedger((ledgerRes.data ?? []) as Leave[]);
    setAllowances((allowRes.data ?? []) as AllowanceReq[]);
    setTodayAtt(att.find((a) => a.work_date === td) ?? null);
    setTodaySched(resolveShift(td, new Date().getDay(), ruleList, exceptions));
    setLoading(false);
  }, [ko]);

  useEffect(() => { void loadAll(viewMonth.y, viewMonth.m); }, [loadAll, viewMonth]);

  // owner 가 역할/일정 변경 시 realtime 이벤트 → 재조회
  useEffect(() => {
    const onRemote = () => { void loadAll(viewMonth.y, viewMonth.m); };
    window.addEventListener("buildup:remote-data-changed", onRemote);
    return () => window.removeEventListener("buildup:remote-data-changed", onRemote);
  }, [loadAll, viewMonth]);

  // Supabase realtime — 사장이 근무표·연차를 바꾸면(다른 기기) 즉시 재조회.
  //   채널을 안정적으로 유지하려 reload 는 ref 로 최신화(월 이동 시 재구독 방지).
  const reloadRef = useRef<() => void>(() => {});
  reloadRef.current = () => { void loadAll(viewMonth.y, viewMonth.m); };
  useEffect(() => {
    const uid = ctx?.userId;
    if (!uid) return;
    const fire = () => reloadRef.current();
    const ch = supabase.channel(`staff-rt-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_schedule_rules", filter: `member_user_id=eq.${uid}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_schedules", filter: `member_user_id=eq.${uid}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests", filter: `member_user_id=eq.${uid}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "allowance_requests", filter: `member_user_id=eq.${uid}` }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records", filter: `member_user_id=eq.${uid}` }, fire)
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [ctx?.userId]);

  // 출근 중이면 1초마다 경과 갱신
  const clockedIn = !!todayAtt && !todayAtt.clock_out_at;
  useEffect(() => {
    if (!clockedIn) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [clockedIn]);

  // ── 액션 ──
  const clockIn = async () => {
    if (!ctx || busy) return;
    setBusy(true);
    try {
      const { data, error } = (await supabase.from("attendance_records" as never)
        .insert({ owner_user_id: ctx.ownerUserId, member_user_id: ctx.userId, work_date: today } as never)
        .select("id, work_date, clock_in_at, clock_out_at").maybeSingle()) as { data: Attendance | null; error: unknown };
      if (error) { console.error("[staff] clock-in failed:", error); return; }
      if (data) { setTodayAtt(data); setMonthAtt((p) => [...p.filter((a) => a.work_date !== today), data]); }
    } finally { setBusy(false); }
  };

  const clockOut = async () => {
    if (!ctx || !todayAtt || busy) return;
    setBusy(true);
    try {
      const stamp = new Date().toISOString();
      const { error } = await supabase.from("attendance_records" as never)
        .update({ clock_out_at: stamp } as never).eq("id", todayAtt.id);
      if (error) { console.error("[staff] clock-out failed:", error); return; }
      const updated = { ...todayAtt, clock_out_at: stamp };
      setTodayAtt(updated);
      setMonthAtt((p) => p.map((a) => (a.id === updated.id ? updated : a)));
    } finally { setBusy(false); }
  };

  const submitLeave = async (payload: { leave_type: LeaveType; start_date: string; end_date: string; reason: string }) => {
    if (!ctx) return false;
    const { data, error } = (await supabase.from("leave_requests" as never)
      .insert({ owner_user_id: ctx.ownerUserId, member_user_id: ctx.userId, ...payload } as never)
      .select("id, leave_type, start_date, end_date, reason, status").maybeSingle()) as { data: Leave | null; error: unknown };
    if (error) { console.error("[staff] leave submit failed:", error); return false; }
    if (data) setLeaves((p) => [data, ...p]);
    return true;
  };

  const cancelLeave = async (id: string) => {
    const { error } = await supabase.from("leave_requests" as never).delete().eq("id", id);
    if (error) { console.error("[staff] leave cancel failed:", error); return; }
    setLeaves((p) => p.filter((l) => l.id !== id));
  };

  // ── 급여 미지급 문의 (2026-07-15) ──
  //   DEFINER RPC 경유 — payroll_inquiries 는 INSERT 정책이 없어 직접 삽입 불가(위조 방지)이고,
  //   RPC 가 사장에게 푸시+인앱 알림까지 보낸다. 같은 달 재문의는 서버가 조용히 무시(스팸 방지).
  const reportUnpaid = async (): Promise<"ok" | "duplicate" | "error"> => {
    const now = new Date();
    const period = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const { data, error } = (await supabase.rpc("report_payroll_unpaid" as never, { p_period: period } as never)) as
      { data: { ok?: boolean; duplicate?: boolean } | null; error: unknown };
    if (error) { console.error("[staff] report_payroll_unpaid failed:", error); return "error"; }
    if (!data?.ok) return "error";
    return data.duplicate ? "duplicate" : "ok";
  };

  // ── 추가 수당 (2026-07-13) ──
  const submitAllowance = async (payload: { work_date: string; allowance_type: AllowanceType; minutes: number; reason: string }) => {
    if (!ctx) return false;
    const { data, error } = (await supabase.from("allowance_requests" as never)
      .insert({ owner_user_id: ctx.ownerUserId, member_user_id: ctx.userId, work_date: payload.work_date, allowance_type: payload.allowance_type, minutes: payload.minutes, reason: payload.reason || null } as never)
      .select("id, work_date, allowance_type, minutes, reason, status").maybeSingle()) as { data: AllowanceReq | null; error: unknown };
    if (error) { console.error("[staff] allowance submit failed:", error); return false; }
    if (data) setAllowances((p) => [data, ...p]);
    return true;
  };

  const cancelAllowance = async (id: string) => {
    const { error } = await supabase.from("allowance_requests" as never).delete().eq("id", id);
    if (error) { console.error("[staff] allowance cancel failed:", error); return; }
    setAllowances((p) => p.filter((a) => a.id !== id));
  };

  // 정규 시간 초과 근무 자동 감지 — 이번 달 출퇴근(퇴근 완료) vs 근무표 종료시각.
  //   이미 신청(또는 처리)한 날짜는 제외. 10분 이상만 후보(반올림 잡음 회피).
  const overtimeCandidates = useMemo<OvertimeCandidate[]>(() => {
    const requestedDates = new Set(allowances.map((a) => a.work_date));
    const out: OvertimeCandidate[] = [];
    for (const a of monthAtt) {
      if (!a.clock_out_at || requestedDates.has(a.work_date)) continue;
      const d = new Date(`${a.work_date}T00:00:00`);
      const sched = resolveShift(a.work_date, d.getDay(), rules, monthSched);
      if (!sched) continue;
      const [eh, em] = sched.end_time.split(":").map(Number);
      const end = new Date(`${a.work_date}T00:00:00`); end.setHours(eh, em, 0, 0);
      const [sh, sm] = sched.start_time.split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) end.setDate(end.getDate() + 1); // 자정 넘는 야간영업 보정
      const otMin = Math.round((new Date(a.clock_out_at).getTime() - end.getTime()) / 60000);
      if (otMin >= 10) out.push({ work_date: a.work_date, minutes: otMin });
    }
    return out.sort((x, y) => (x.work_date < y.work_date ? 1 : -1));
  }, [monthAtt, rules, monthSched, allowances]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOutUser(supabase); window.location.href = "/auth"; }
    finally { setSigningOut(false); }
  };

  // ── 렌더: 로딩 / 미연결 ──
  // 직원용 미니 헤더 — 왼쪽: 사장 화면과 동일 로고 아이덴티티 / 오른쪽: 내 정보(연결됐을 때만).
  const renderHeader = (showProfileBtn: boolean) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" }}>
      <FoundOneLogo height={26} wordColor={INK} />
      {showProfileBtn && (
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label={ko ? "내 정보" : "My account"}
          style={{
            marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 999, cursor: "pointer",
            border: `1px solid ${MIDNIGHT_BORDER}`, background: "white",
            color: MIDNIGHT, fontSize: 12.5, fontWeight: 700,
          }}
        >
          <UserRound size={14} strokeWidth={1.9} />{ko ? "내 정보" : "Account"}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
          {renderHeader(false)}
          <div style={{ ...cardStyle, textAlign: "center", color: MUTED }}>{ko ? "직원 정보 불러오는 중…" : "Loading…"}</div>
        </div>
      </main>
    );
  }
  // 연결 조회 RPC 실패 — "미연결"과 구분해 재시도 유도(서버엔 연결이 있어도 일시 오류일 수 있음).
  if (ctxError) {
    return (
      <main style={pageStyle}>
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
          {renderHeader(false)}
          <div style={cardStyle}>
            <div style={eyebrow}>Found.One · {ko ? "직원" : "Staff"}</div>
            <h1 style={h1}>{ko ? "연결 정보를 불러오지 못했어요" : "Couldn't load your workplace"}</h1>
            <p style={sub}>{ko ? "일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요. (연결은 그대로 유지됩니다)" : "This may be temporary. Please retry — your connection is preserved."}</p>
            <button type="button" style={primaryBtn} onClick={() => { setLoading(true); void loadAll(viewMonth.y, viewMonth.m); }}>
              {ko ? "다시 시도" : "Retry"}
            </button>
            <button type="button" style={{ ...primaryBtn, background: "white", color: MUTED, border: `1px solid ${MIDNIGHT_BORDER}`, marginTop: 8 }} onClick={handleSignOut} disabled={signingOut}>
              <LogOut size={14} strokeWidth={1.6} /> {ko ? "로그아웃" : "Sign out"}
            </button>
          </div>
        </div>
      </main>
    );
  }
  if (connected === false || !ctx) {
    return (
      <main style={pageStyle}>
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
          {renderHeader(false)}
          <div style={cardStyle}>
            <div style={eyebrow}>Found.One · {ko ? "직원" : "Staff"}</div>
            <h1 style={h1}>{ko ? "아직 가게에 연결되지 않았어요" : "Not connected yet"}</h1>
            <p style={sub}>{ko ? "사장님께 받은 초대 링크를 다시 눌러주세요. 링크는 7일간 유효합니다." : "Tap the invite link again. Valid for 7 days."}</p>
            <button type="button" style={primaryBtn} onClick={handleSignOut} disabled={signingOut}>
              <LogOut size={14} strokeWidth={1.6} /> {ko ? "로그아웃" : "Sign out"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isToday = viewMonth.y === new Date().getFullYear() && viewMonth.m === new Date().getMonth();

  // 「내 정보」 — 팝업이 아니라 사장 화면과 동일하게 전체 페이지로 전환 (2026-07-13).
  if (profileOpen) {
    return (
      <StaffProfileView
        storeName={ctx.storeName}
        role={ctx.role}
        ko={ko}
        signingOut={signingOut}
        onSignOut={handleSignOut}
        onBack={() => setProfileOpen(false)}
      />
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
        {renderHeader(true)}

        {/* ① 가게 헤더 */}
        <section style={{ ...cardStyle, paddingBottom: 22 }}>
          <div style={eyebrow}>Found.One · {ko ? "직원 대시보드" : "Staff"}</div>
          <h1 style={{ ...h1, marginBottom: 12 }}>
            <span style={{ color: MIDNIGHT }}>{ctx.storeName}</span>{ko ? "에서 일하고 있어요" : ""}
          </h1>
          <div style={chipRow}>
            <span style={chip}><Store size={12} strokeWidth={1.8} /> {ctx.storeName}</span>
            <span style={chip}>{ko ? "역할" : "Role"} · <strong style={{ marginLeft: 3 }}>{ctx.role === "manager" ? (ko ? "매니저" : "Manager") : ko ? "직원" : "Staff"}</strong></span>
            {(() => { const t = tenureDays(ctx.hireDate, ctx.joinedAt); return t != null && t >= 1 ? (
              <span style={chip}>{ko ? "근속" : "Day"} · <strong style={{ marginLeft: 3 }}>{ko ? `${t.toLocaleString()}일차` : t.toLocaleString()}</strong></span>
            ) : null; })()}
            {ctx.employmentType && (
              <span style={{ ...chip, background: MIDNIGHT, color: "white" }}>{employmentTypeLabel(ctx.employmentType, ko)}</span>
            )}
            {ctx.jobDuties.map((k) => (
              <span key={k} style={chip}>{jobDutyLabel(k, ko)}</span>
            ))}
          </div>
          <WeekdayStrip ko={ko} days={workdays} />
        </section>

        {/* ② 오늘 카드 — 출퇴근 */}
        <TodayCard
          ko={ko} sched={todaySched} att={todayAtt} clockedIn={clockedIn} busy={busy}
          onClockIn={clockIn} onClockOut={clockOut} tick={tick}
        />

        {/* ③ 출근 기록 캘린더 */}
        <CalendarCard
          ko={ko} y={viewMonth.y} m={viewMonth.m} isCurrentMonth={isToday}
          att={monthAtt} rules={rules} exceptions={monthSched} leaves={leaves} todayStr={today}
          onPrev={() => setViewMonth((v) => { const d = new Date(v.y, v.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
          onNext={() => setViewMonth((v) => { const d = new Date(v.y, v.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
        />

        {/* ③-b 다음 달 희망 근무 신청 (2026-07-30 사장님 요청) — 캘린더 바로 뒤.
            "이미 신청한 동료 시간을 보면서 조정" 이 핵심이라 같은 화면 안에서 붙여 둔다. */}
        <section style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 750, color: INK, letterSpacing: "-0.01em", marginBottom: 10 }}>
            {ko ? "근무 희망 신청" : "Shift requests"}
          </div>
          <ShiftAvailabilityCalendar ko={ko} ownerId={ctx.ownerUserId} myUserId={ctx.userId} mode="staff" />
        </section>

        {/* ④ 연차·휴가 — 잔여 요약(근로기준법 제60조) + 신청 목록 */}
        <LeaveCard ko={ko} leaves={leaves} ledger={leaveLedger} ledgerFailed={ledgerFailed}
          onOpen={() => setLeaveOpen(true)} onCancel={cancelLeave}
          hireDate={ctx.hireDate} leaveBasis={ctx.leaveBasis} headcount={ctx.staffHeadcount} />

        {/* ④-b 추가 수당 신청 (연장·야간·휴일근로, 2026-07-13) */}
        <StaffAllowanceCard ko={ko} allowances={allowances} candidates={overtimeCandidates} onRequest={submitAllowance} onCancel={cancelAllowance} />

        {/* ④-c 급여일 + 미지급 문의 (2026-07-15) — 사장이 급여일을 정했을 때만 표시 */}
        {ctx.paydayDay != null && (
          <StaffPaydayCard ko={ko} paydayDay={ctx.paydayDay} onReportUnpaid={reportUnpaid} />
        )}

        {/* ⑤ 내 근로 권리 — 주휴수당·퇴직금·연차 자격 (사장과 동일 판정, 2026-07-13) */}
        <StaffRightsCard
          ko={ko}
          hourlyWage={ctx.hourlyWage}
          hireDate={ctx.hireDate}
          joinedAt={ctx.joinedAt}
          weeklyMinutes={rules.reduce((sum, r) => {
            const [sh, sm] = r.start_time.split(":").map(Number);
            const [eh, em] = r.end_time.split(":").map(Number);
            let d = eh * 60 + em - (sh * 60 + sm);
            if (d <= 0) d += 1440;
            return sum + d;
          }, 0)}
        />
        {/* 로그아웃·내 정보는 상단 「내 정보」 → 전체 페이지(StaffProfileView)로 (2026-07-13). */}
      </div>

      {leaveOpen && <LeaveSheet ko={ko} onClose={() => setLeaveOpen(false)} onSubmit={submitLeave} />}
    </main>
  );
}

// 분 → "6시간 30분" / "6시간" / "45분"
function fmtDur(min: number, ko: boolean): string {
  const h = Math.floor(min / 60), m = min % 60;
  const hu = ko ? "시간" : "h", mu = ko ? "분" : "m";
  if (h && m) return `${h}${hu} ${m}${mu}`;
  if (h) return `${h}${hu}`;
  return `${m}${mu}`;
}

/* ══════════════════════ ② 오늘 카드 ══════════════════════ */
function TodayCard({ ko, sched, att, clockedIn, busy, onClockIn, onClockOut, tick }: {
  ko: boolean; sched: Shift | null; att: Attendance | null; clockedIn: boolean;
  busy: boolean; onClockIn: () => void; onClockOut: () => void; tick: number;
}) {
  void tick; // 1초 tick 으로 경과/야근 재계산 유발
  const done = !!att?.clock_out_at;

  // 출근 전에도 10분 게이트·카운트다운이 실시간 갱신되도록 30초 재렌더
  const [, force] = useState(0);
  useEffect(() => {
    if (clockedIn || done || !sched) return;
    const id = window.setInterval(() => force((x) => x + 1), 30000);
    return () => window.clearInterval(id);
  }, [clockedIn, done, sched]);

  const now = new Date();
  const dateLabel = ko
    ? `${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEKDAYS_KO[now.getDay()]})`
    : now.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });

  const hhmm = (t: string) => t.slice(0, 5);
  const stampHM = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  // 정해진 근무시간 창 (오늘 기준, 자정 넘는 야간영업 보정)
  const parseToday = (t: string) => { const [h, m] = t.split(":"); const d = new Date(); d.setHours(Number(h), Number(m), 0, 0); return d; };
  const start = sched ? parseToday(sched.start_time) : null;
  const end = sched ? parseToday(sched.end_time) : null;
  if (start && end && end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
  const durMin = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;

  // 출근 10분 전부터 활성화 (일정 없으면 항상 허용)
  const openAt = start ? new Date(start.getTime() - 10 * 60000) : null;
  const canClockIn = !openAt || Date.now() >= openAt.getTime();
  const minsUntilOpen = openAt ? Math.max(0, Math.ceil((openAt.getTime() - Date.now()) / 60000)) : 0;

  // 경과 + 야근(정규 종료 초과분)
  const elapsedMin = att ? Math.max(0, Math.floor(((att.clock_out_at ? new Date(att.clock_out_at).getTime() : Date.now()) - new Date(att.clock_in_at).getTime()) / 60000)) : 0;
  const otMs = att && end ? Math.max(0, (att.clock_out_at ? new Date(att.clock_out_at).getTime() : Date.now()) - end.getTime()) : 0;
  const overtime = otMs >= 60000;
  const otMin = Math.floor(otMs / 60000);
  const eh = Math.floor(elapsedMin / 60), em = elapsedMin % 60;

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 750, color: INK, letterSpacing: "-0.01em" }}>{dateLabel}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: MIDNIGHT_MUTED }}>
          {sched ? (ko ? "오늘 근무" : "Today") : (ko ? "일정 미등록" : "No schedule")}
        </div>
      </div>

      {/* 오늘 근무 일정 + 정규 근무시간 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: MIDNIGHT_SOFT, marginBottom: 14 }}>
        <CalendarDays size={16} strokeWidth={1.7} style={{ color: MIDNIGHT, flexShrink: 0 }} />
        {sched && start && end ? (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: MIDNIGHT, letterSpacing: "-0.01em" }}>{hhmm(sched.start_time)} – {hhmm(sched.end_time)}</span>
              {durMin != null && (
                <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, padding: "2px 8px", borderRadius: 999 }}>
                  {ko ? "정규 " : ""}{fmtDur(durMin, ko)}
                </span>
              )}
            </div>
            {sched.note && <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{sched.note}</div>}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
            {ko ? "오늘 등록된 근무 일정이 없어요. 사장님이 근무표를 등록하면 여기에 표시됩니다." : "No shift assigned today."}
          </div>
        )}
      </div>

      {/* 출퇴근 버튼 / 상태 */}
      {done ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 16, background: MIDNIGHT, color: "white" }}>
          <CheckCircle2 size={22} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{ko ? "오늘 근무 완료" : "Shift complete"}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {stampHM(att!.clock_in_at)} → {stampHM(att!.clock_out_at!)} · {ko ? "총" : "Total"} {fmtDur(elapsedMin, ko)}
              {overtime && <span style={{ color: "#d9d4f2", fontWeight: 700 }}> · {ko ? "야근" : "OT"} {fmtDur(otMin, ko)}</span>}
            </div>
          </div>
        </div>
      ) : clockedIn ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 16, background: overtime ? "rgba(139,127,212,0.12)" : MIDNIGHT_SOFT, border: `1px solid ${overtime ? "rgba(139,127,212,0.5)" : MIDNIGHT_BORDER}` }}>
            {overtime
              ? <Moon size={22} strokeWidth={1.8} style={{ color: LEAVE, flexShrink: 0 }} />
              : <Timer size={22} strokeWidth={1.8} style={{ color: MIDNIGHT, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: overtime ? LEAVE : MIDNIGHT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase" }}>{overtime ? (ko ? "야근 · 추가 근무" : "Overtime") : (ko ? "근무 중" : "On shift")}</div>
              <div style={{ fontSize: 22, fontWeight: 850, color: overtime ? LEAVE : MIDNIGHT, letterSpacing: "-0.02em", marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
                {eh}:{pad(em)}<span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4, opacity: 0.6 }}>{ko ? "경과" : "elapsed"}</span>
              </div>
              <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>
                {ko ? "출근" : "In"} {stampHM(att!.clock_in_at)}
                {overtime && end && <span style={{ color: LEAVE, fontWeight: 700 }}> · {ko ? `정규 ${hhmm(sched!.end_time)} 초과 +${fmtDur(otMin, ko)}` : `+${fmtDur(otMin, ko)} over`}</span>}
              </div>
            </div>
          </div>
          <button type="button" style={clockBtn(false)} onClick={onClockOut} disabled={busy} aria-label={ko ? "퇴근하기" : "Clock out"}>
            <LogOut size={18} strokeWidth={2} /> {busy ? (ko ? "처리 중…" : "…") : ko ? "퇴근하기" : "Clock out"}
          </button>
        </div>
      ) : canClockIn ? (
        <button type="button" style={clockBtn(true)} onClick={onClockIn} disabled={busy} aria-label={ko ? "출근하기" : "Clock in"}>
          <LogIn size={18} strokeWidth={2} /> {busy ? (ko ? "처리 중…" : "…") : ko ? "출근하기" : "Clock in"}
        </button>
      ) : (
        <div>
          <button type="button" disabled aria-disabled="true" style={{ ...clockBtn(true), background: MIDNIGHT_SOFT, color: MIDNIGHT_MUTED, boxShadow: "none", cursor: "default" }}>
            <Hourglass size={17} strokeWidth={2} /> {ko ? "출근 대기" : "Not open yet"}
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: MUTED, marginTop: 9, lineHeight: 1.5, textAlign: "center" }}>
            <Clock3 size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {ko
              ? `${openAt ? `${pad(openAt.getHours())}:${pad(openAt.getMinutes())}` : ""}부터 출근 가능 · ${minsUntilOpen}분 후 활성화 (근무 10분 전)`
              : `Opens at ${openAt ? `${pad(openAt.getHours())}:${pad(openAt.getMinutes())}` : ""} · in ${minsUntilOpen}m`}
          </div>
        </div>
      )}
    </section>
  );
}

/* 정해진 근무 요일 스트립 */
function WeekdayStrip({ ko, days }: { ko: boolean; days: Set<number> }) {
  const labels = ko ? WEEKDAYS_KO : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{ko ? "근무 요일" : "Work days"}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {labels.map((w, i) => {
          const on = days.has(i);
          return (
            <span key={i} style={{
              flex: 1, textAlign: "center", padding: "7px 0", borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              background: on ? MIDNIGHT : MIDNIGHT_SOFT, color: on ? "white" : i === 0 ? LEAVE : MIDNIGHT_MUTED,
            }}>{w}</span>
          );
        })}
      </div>
      {days.size === 0 && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>{ko ? "근무 요일 미정 — 사장님이 근무표를 등록하면 표시됩니다." : "Not set yet."}</div>}
    </div>
  );
}

/* ══════════════════════ ③ 캘린더 ══════════════════════ */
function CalendarCard({ ko, y, m, isCurrentMonth, att, rules, exceptions, leaves, todayStr, onPrev, onNext }: {
  ko: boolean; y: number; m: number; isCurrentMonth: boolean;
  att: Attendance[]; rules: Rule[]; exceptions: Schedule[]; leaves: Leave[]; todayStr: string;
  onPrev: () => void; onNext: () => void;
}) {
  const workedSet = useMemo(() => new Set(att.filter((a) => a.clock_in_at).map((a) => a.work_date)), [att]);
  // 예정 근무 = 반복 규칙 + 날짜 예외로 해석한 근무일 (그 달 전체)
  const schedSet = useMemo(() => {
    const s = new Set<string>();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
      if (resolveShift(ds, new Date(y, m, d).getDay(), rules, exceptions)) s.add(ds);
    }
    return s;
  }, [y, m, rules, exceptions]);
  const leaveSet = useMemo(() => expandLeaveDates(leaves), [leaves]);

  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthLabel = ko ? `${y}년 ${m + 1}월` : new Date(y, m, 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 750, color: INK, letterSpacing: "-0.01em" }}>{monthLabel}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" style={navBtn} onClick={onPrev} aria-label={ko ? "이전 달" : "Prev"}><ChevronLeft size={16} strokeWidth={2} /></button>
          <button type="button" style={navBtn} onClick={onNext} aria-label={ko ? "다음 달" : "Next"}><ChevronRight size={16} strokeWidth={2} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {WEEKDAYS_KO.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? "rgba(139,127,212,0.9)" : MUTED, padding: "4px 0" }}>{ko ? w : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][i]}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} />;
          const ds = `${y}-${pad(m + 1)}-${pad(day)}`;
          const isToday = ds === todayStr;
          const worked = workedSet.has(ds);
          const onLeave = leaveSet.has(ds);
          const scheduled = schedSet.has(ds) && !worked;
          return (
            <div key={ds} style={{
              position: "relative", aspectRatio: "1", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", borderRadius: 10,
              background: isToday ? MIDNIGHT_SOFT2 : "transparent",
              border: isToday ? `1.5px solid ${MIDNIGHT}` : "1.5px solid transparent",
            }}>
              <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, color: onLeave ? LEAVE : worked ? MIDNIGHT : INK, fontVariantNumeric: "tabular-nums" }}>{day}</span>
              <span style={{ position: "absolute", bottom: 5, display: "flex", gap: 3 }}>
                {worked && <span style={{ width: 5, height: 5, borderRadius: 999, background: MIDNIGHT }} />}
                {onLeave && <span style={{ width: 5, height: 5, borderRadius: 999, background: LEAVE }} />}
                {scheduled && <span style={{ width: 5, height: 5, borderRadius: 999, background: "transparent", border: `1.5px solid ${MIDNIGHT_MUTED}` }} />}
              </span>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        <Legend dot={<span style={{ width: 6, height: 6, borderRadius: 999, background: MIDNIGHT }} />} label={ko ? "근무" : "Worked"} />
        <Legend dot={<span style={{ width: 6, height: 6, borderRadius: 999, background: LEAVE }} />} label={ko ? "연차·휴가" : "Leave"} />
        <Legend dot={<span style={{ width: 6, height: 6, borderRadius: 999, border: `1.5px solid ${MIDNIGHT_MUTED}` }} />} label={ko ? "예정 근무" : "Scheduled"} />
      </div>
      {isCurrentMonth && workedSet.size === 0 && leaveSet.size === 0 && (
        <div style={{ fontSize: 12, color: MUTED, marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
          {ko ? "아직 이번 달 출근 기록이 없어요. 출근하면 여기에 쌓입니다." : "No attendance yet this month."}
        </div>
      )}
    </section>
  );
}

function Legend({ dot, label }: { dot: React.ReactNode; label: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: MUTED, fontWeight: 600 }}>{dot}{label}</span>;
}

/* ══════════════════════ ④ 연차 목록 ══════════════════════ */
const LEAVE_LABEL: Record<LeaveType, { ko: string; en: string }> = {
  annual: { ko: "연차", en: "Annual" }, half: { ko: "반차", en: "Half-day" },
  sick: { ko: "병가", en: "Sick" }, other: { ko: "기타", en: "Other" },
};

/**
 * 급여일 카드 (직원) — 사장이 급여일을 정했을 때만 렌더된다.
 *   급여일 당일·경과에만 "안 들어왔어요" 버튼 노출(그 전엔 보낼 이유가 없다).
 *   문의는 같은 달 1회 — 서버가 UNIQUE 로 막고 duplicate 를 조용히 성공 처리한다.
 */
function StaffPaydayCard({ ko, paydayDay, onReportUnpaid }: {
  ko: boolean; paydayDay: number; onReportUnpaid: () => Promise<"ok" | "duplicate" | "error">;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const eff = effectivePaydayLocal(paydayDay);
  const today = new Date().getDate();
  const due = today >= eff;
  const send = async () => {
    setState("sending");
    const r = await onReportUnpaid();
    setState(r === "error" ? "error" : "sent");   // duplicate 도 사용자에겐 '전달됨'
  };
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 750, color: INK, letterSpacing: "-0.01em" }}>{ko ? "급여일" : "Payday"}</div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: MIDNIGHT }}>
          {ko ? `매월 ${paydayDay}일` : `Day ${paydayDay}`}
          {eff !== paydayDay && (ko ? ` · 이번 달 ${eff}일` : ` · ${eff} this month`)}
        </span>
      </div>
      {!due ? (
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
          {ko ? `이번 달 급여일은 ${eff}일이에요.` : `Payday is on the ${eff}th.`}
        </div>
      ) : state === "sent" ? (
        <div style={{ fontSize: 12.5, color: MIDNIGHT, fontWeight: 600, lineHeight: 1.5 }}>
          {ko ? "✓ 사장님께 전달했어요. 확인하시면 연락이 올 거예요." : "✓ Sent to your manager."}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, marginBottom: 10 }}>
            {ko ? "급여가 아직 안 들어왔다면 사장님께 알릴 수 있어요." : "Not paid yet? Let your manager know."}
          </div>
          <button type="button" onClick={() => void send()} disabled={state === "sending"}
            style={{ ...smallBtn, opacity: state === "sending" ? 0.5 : 1, cursor: state === "sending" ? "wait" : "pointer" }}>
            {state === "sending" ? (ko ? "보내는 중..." : "Sending...") : (ko ? "급여가 안 들어왔어요" : "Payroll not received")}
          </button>
          {state === "error" && (
            <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>{ko ? "전달에 실패했어요. 잠시 후 다시 시도해 주세요." : "Failed. Try again."}</div>
          )}
        </>
      )}
    </section>
  );
}

function LeaveCard({ ko, leaves, ledger, ledgerFailed, onOpen, onCancel, hireDate, leaveBasis, headcount }: {
  hireDate: string | null;
  leaveBasis: LeaveBasis;
  /** 잔여 계산용 원장 — leaves(표시용 12건)로 세면 잔여가 부풀려진다 */
  ledger: Leave[];
  ledgerFailed: boolean;
  /** null = 인원 미상 (RPC 구버전·마이그레이션 미적용) — 0 으로 강등하면 "연차 의무 없음" 거짓말이 된다 */
  headcount: number | null;
  ko: boolean; leaves: Leave[]; onOpen: () => void; onCancel: (id: string) => void }) {
  const md = (d: string) => { const x = new Date(d); return ko ? `${x.getMonth() + 1}.${x.getDate()}` : `${x.getMonth() + 1}/${x.getDate()}`; };
  // 내 연차 — 근로기준법 제60조 계산(shared SSOT). 5인 미만이면 법정 의무가 없어 숫자를 만들지 않는다.
  const headcountKnown = headcount !== null;
  const leaveCalc = calcAnnualLeave(hireDate, { basis: leaveBasis, headcount: headcount ?? 0 });
  const range = leaveYearRange(leaveBasis, hireDate);
  const usedDays = usedLeaveDays(ledger, { yearStart: range.start, yearEnd: range.end });
  const leftDays = remainingLeaveDays(leaveCalc.days, usedDays);
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 750, color: INK, letterSpacing: "-0.01em" }}>{ko ? "연차·휴가" : "Time off"}</div>
        <button type="button" style={smallBtn} onClick={onOpen}><Plus size={14} strokeWidth={2} /> {ko ? "신청" : "Request"}</button>
      </div>

      {/* 잔여 요약 — 신청 목록보다 먼저 (직원이 가장 궁금한 것) */}
      <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(139,127,212,0.08)", marginBottom: 12 }}>
        {!headcountKnown ? (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>
            {ko
              ? "직원 수를 불러오지 못해 연차 일수를 계산할 수 없어요. 잠시 후 다시 열어보시거나 사장님께 문의해 주세요."
              : "Can't compute leave — staff count unavailable."}
          </div>
        ) : ledgerFailed && leaveCalc.statutory && leaveCalc.days > 0 ? (
          <div style={{ fontSize: 12, color: "#b64c4c", lineHeight: 1.55 }}>
            {ko
              ? `올해 ${leaveCalc.days}일 발생 — 사용 일수를 불러오지 못해 잔여를 계산할 수 없어요.`
              : `${leaveCalc.days} granted — usage unavailable.`}
          </div>
        ) : leaveCalc.statutory && leaveCalc.days > 0 ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: LEAVE, fontVariantNumeric: "tabular-nums" }}>
                {ko ? `${leftDays}일` : `${leftDays}d`}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 650, color: INK }}>{ko ? "남았어요" : "left"}</span>
              <span style={{ fontSize: 11.5, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                {ko ? `올해 ${leaveCalc.days}일 중 ${usedDays}일 사용` : `${usedDays} of ${leaveCalc.days} used`}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, background: "rgba(15,23,42,0.06)", borderRadius: 999, padding: "2px 7px" }}>
                {ko ? "예상" : "est."}
              </span>
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
              {ko ? leaveCalc.basisNote.ko : leaveCalc.basisNote.en}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>
            {ko ? leaveCalc.basisNote.ko : leaveCalc.basisNote.en}
          </div>
        )}
      </div>
      {leaves.length === 0 ? (
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, padding: "8px 0" }}>
          {ko ? "신청 내역이 없어요. 연차·휴가가 필요하면 「신청」을 눌러 사장님께 요청하세요." : "No requests yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {leaves.map((l) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: MIDNIGHT_SOFT }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "white", background: LEAVE, padding: "3px 8px", borderRadius: 999, flexShrink: 0 }}>{ko ? LEAVE_LABEL[l.leave_type].ko : LEAVE_LABEL[l.leave_type].en}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{md(l.start_date)}{l.start_date !== l.end_date ? ` – ${md(l.end_date)}` : ""}</div>
                {l.reason && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.reason}</div>}
              </div>
              <StatusPill ko={ko} status={l.status} />
              {l.status === "pending" && (
                <button type="button" onClick={() => onCancel(l.id)} aria-label={ko ? "취소" : "Cancel"} style={{ background: "none", border: "none", cursor: "pointer", color: MIDNIGHT_MUTED, padding: 2, display: "flex" }}><X size={15} strokeWidth={2} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// 신호등 컬러 대신 미드나잇 톤으로 상태 구분
function StatusPill({ ko, status }: { ko: boolean; status: LeaveStatus }) {
  if (status === "approved") return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "white", background: MIDNIGHT, padding: "3px 9px", borderRadius: 999 }}><CheckCircle2 size={11} strokeWidth={2.2} />{ko ? "승인" : "Approved"}</span>;
  if (status === "rejected") return <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT_MUTED, background: "transparent", border: `1px solid ${MIDNIGHT_BORDER}`, padding: "3px 9px", borderRadius: 999, textDecoration: "line-through" }}>{ko ? "반려" : "Declined"}</span>;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: MIDNIGHT_SOFT2, padding: "3px 9px", borderRadius: 999 }}><Clock3 size={11} strokeWidth={2.2} />{ko ? "대기" : "Pending"}</span>;
}

/* ══════════════════════ 연차 신청 시트 ══════════════════════ */
function LeaveSheet({ ko, onClose, onSubmit }: {
  ko: boolean; onClose: () => void;
  onSubmit: (p: { leave_type: LeaveType; start_date: string; end_date: string; reason: string }) => Promise<boolean>;
}) {
  const todayStr = ymd(new Date());
  const [type, setType] = useState<LeaveType>("annual");
  const [start, setStart] = useState(todayStr);
  const [end, setEnd] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (end < start) { setErr(ko ? "종료일이 시작일보다 빠릅니다." : "End before start."); return; }
    setSaving(true); setErr(null);
    const ok = await onSubmit({ leave_type: type, start_date: start, end_date: end, reason: reason.trim() });
    setSaving(false);
    if (ok) onClose(); else setErr(ko ? "신청에 실패했습니다. 잠시 후 다시 시도해 주세요." : "Failed. Try again.");
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={ko ? "연차·휴가 신청" : "Time off request"} style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>{ko ? "연차·휴가 신청" : "Request time off"}</div>
          <button type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"} style={{ background: "none", border: "none", cursor: "pointer", color: MIDNIGHT_MUTED, display: "flex" }}><X size={20} strokeWidth={2} /></button>
        </div>

        <label style={fieldLabel}>{ko ? "종류" : "Type"}</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {(Object.keys(LEAVE_LABEL) as LeaveType[]).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${type === t ? MIDNIGHT : MIDNIGHT_BORDER}`,
              background: type === t ? MIDNIGHT : "white", color: type === t ? "white" : MIDNIGHT,
              transition: "background 180ms, color 180ms, border-color 180ms",
            }}>{ko ? LEAVE_LABEL[t].ko : LEAVE_LABEL[t].en}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="lv-start" style={fieldLabel}>{ko ? "시작일" : "Start"}</label>
            <input id="lv-start" type="date" value={start} min={todayStr} onChange={(e) => { setStart(e.target.value); if (end < e.target.value) setEnd(e.target.value); }} style={dateInput} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="lv-end" style={fieldLabel}>{ko ? "종료일" : "End"}</label>
            <input id="lv-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} style={dateInput} />
          </div>
        </div>

        <label htmlFor="lv-reason" style={fieldLabel}>{ko ? "사유 (선택)" : "Reason (optional)"}</label>
        <textarea id="lv-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
          placeholder={ko ? "예: 병원 예약, 경조사 등" : "e.g. appointment"} style={{ ...dateInput, resize: "none", marginBottom: 8 }} />

        {err && <div style={{ fontSize: 12, color: "#b64c4c", marginBottom: 10 }}>{err}</div>}

        <button type="button" style={{ ...clockBtn(true), marginTop: 8 }} onClick={submit} disabled={saving}>
          {saving ? (ko ? "신청 중…" : "Submitting…") : ko ? "사장님께 신청" : "Submit request"}
        </button>
        <p style={{ fontSize: 11.5, color: MUTED, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
          {ko ? "신청하면 사장님이 승인/반려할 수 있어요. 대기 중인 신청은 취소할 수 있습니다." : "Owner approves or declines. Pending requests can be canceled."}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════ 스타일 ══════════════════════ */
// 2026-07-13 디자인 정합 — 자체 플랫 배경(#f4f4fb)이 전역 오로라를 덮던 문제 제거,
//   카드 규격을 사장 화면 표준(TeamSurface: radius 20·padding 22·h1 24/1.25)과 통일.
const pageStyle: React.CSSProperties = {
  // 상단 패딩: 모바일에선 전역 고정 벨+언어 클러스터(우상단)가 헤더의 「내 정보」 버튼을
  //   덮으므로 그만큼 아래로 내림. 데스크톱은 var unset → 24px (globals ≤sm 에서만 재정의). 2026-07-14
  minHeight: "100vh", display: "flex", alignItems: "flex-start",
  justifyContent: "center", padding: "var(--staff-page-top, 24px) 20px 48px",
};
const cardStyle: React.CSSProperties = {
  width: "100%", background: "white", borderRadius: 20, padding: "22px 22px",
  boxShadow: "0 6px 30px rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.05)",
};
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MIDNIGHT_MUTED, marginBottom: 8 };
const h1: React.CSSProperties = { fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: INK, margin: 0, lineHeight: 1.25, wordBreak: "keep-all" };
const sub: React.CSSProperties = { fontSize: 14, color: MUTED, lineHeight: 1.65, margin: "10px 0 22px" };
const chipRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8 };
const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: MIDNIGHT_SOFT, color: MIDNIGHT, fontSize: 12.5, fontWeight: 600 };
const navBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 10, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", color: MIDNIGHT, cursor: "pointer" };
const smallBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 999, border: "none", background: MIDNIGHT, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
const clockBtn = (primary: boolean): React.CSSProperties => ({
  width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "16px", borderRadius: 16, fontSize: 15.5, fontWeight: 800, cursor: "pointer",
  border: primary ? "none" : `1.5px solid ${MIDNIGHT}`,
  background: primary ? MIDNIGHT : "white", color: primary ? "white" : MIDNIGHT,
  boxShadow: primary ? "0 4px 16px rgba(25,25,112,0.22)" : "none",
  transition: "transform 140ms ease, box-shadow 180ms ease",
});
const fieldLabel: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: MIDNIGHT_MUTED, marginBottom: 7 };
const dateInput: React.CSSProperties = { width: "100%", padding: "11px 12px", borderRadius: 12, border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", fontSize: 14, color: INK, WebkitTextFillColor: INK, boxSizing: "border-box" };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, padding: 0 };
const sheet: React.CSSProperties = { width: "100%", maxWidth: 480, background: "white", borderRadius: "24px 24px 0 0", padding: "26px 24px 32px", boxShadow: "0 -8px 40px rgba(15,23,42,0.18)", animation: "none" };
const primaryBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 14, border: "none", background: MIDNIGHT, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" };
