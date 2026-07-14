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
import { Users, CalendarClock, Check, X, Clock3, UserPlus, CheckCircle2, Coins } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { InviteLinkSection } from "../InviteLinkSection";
import { StaffDetailModal } from "./StaffDetailModal";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_SOFT2 = "rgba(25,25,112,0.10)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_MUTED = "rgba(25,25,112,0.45)";
const LEAVE = "#8b7fd4";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];

type Member = { member_user_id: string; name: string; role: "staff" | "manager"; joined_at: string | null; hire_date: string | null; hourly_wage?: number | null; employment_type?: string | null; job_duties?: string[] | null };

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
const ymdLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// 오늘 출퇴근 — clock_out_at IS NULL 이면 근무 중, 있으면 근무 완료, 행 없으면 미출근 (2026-07-14)
type Att = { member_user_id: string; clock_in_at: string; clock_out_at: string | null };
const hhmmKST = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" });

export function TeamSurface({ ko, categoryId }: { ko: boolean; categoryId?: string | null }) {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [allowances, setAllowances] = useState<Allowance[]>([]); // 추가 수당 신청 (2026-07-13)
  const [todayAtt, setTodayAtt] = useState<Att[]>([]); // 오늘 출퇴근 — 직원별 출근여부 배지 (2026-07-14)
  const [loading, setLoading] = useState(true);
  const [membersError, setMembersError] = useState(false); // get_store_members RPC 실패 — "직원 없음"과 구분 (2026-07-13)
  // 직원 상세 팝업 (시급·근태·연차 — 2026-07-13)
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setOwnerId(user.id);
    const [mRes, rRes, exRes, lRes, aRes, atRes] = await Promise.all([
      supabase.rpc("get_store_members" as never),
      supabase.from("staff_schedule_rules" as never).select("id, member_user_id, weekday, start_time, end_time, active").eq("owner_user_id", user.id),
      supabase.from("staff_schedules" as never).select("id, member_user_id, work_date, start_time, end_time, is_off").eq("owner_user_id", user.id).gte("work_date", ymdLocal()).order("work_date"),
      supabase.from("leave_requests" as never).select("id, member_user_id, leave_type, start_date, end_date, reason, status").eq("owner_user_id", user.id).order("created_at", { ascending: false }).limit(40),
      supabase.from("allowance_requests" as never).select("id, member_user_id, work_date, allowance_type, minutes, reason, status").eq("owner_user_id", user.id).order("created_at", { ascending: false }).limit(40),
      // 오늘 출퇴근 — 직원별 "출근함/미출근" 배지용 (owner RLS att_owner_read)
      supabase.from("attendance_records" as never).select("member_user_id, clock_in_at, clock_out_at").eq("owner_user_id", user.id).eq("work_date", ymdLocal()),
    ]);
    // RPC 에러(마이그레이션 누락·서버 장애)를 "직원 없음"으로 오인하지 않도록 구분 (2026-07-13).
    const mErr = (mRes as { error?: unknown }).error;
    setMembersError(!!mErr);
    if (mErr) console.error("[team] get_store_members failed:", mErr);
    setMembers((((mRes as { data: unknown }).data ?? []) as Member[]));
    setRules(((rRes.data ?? []) as Rule[]));
    setExceptions(((exRes.data ?? []) as Exception[]));
    setLeaves(((lRes.data ?? []) as Leave[]));
    setAllowances(((aRes.data ?? []) as Allowance[]));
    setTodayAtt(((atRes.data ?? []) as Att[]));
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
                {members.map((m) => (
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
