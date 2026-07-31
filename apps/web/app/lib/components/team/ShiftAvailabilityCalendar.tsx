"use client";

/**
 * ShiftAvailabilityCalendar — 희망 근무 신청/취합 캘린더 (2026-07-30 사장님 요청)
 *
 *   "매달 알바생에게 스케줄을 물어봐서 조정한다. 5월 마지막 주면 6월에 언제 어떤 시간
 *    출근 가능한지 캘린더에 기록해 보내고, 사장도 그걸 보고, 직원들끼리도 이미 신청한
 *    시간을 보면서 '난 이때 신청해야겠네' 하는 거지."
 *
 *  한 컴포넌트로 두 역할을 렌더한다 (mode) — 그리드·타임라인 계산이 완전히 같아서
 *  복붙하면 사장·직원이 다른 걸 보는 사고가 난다 (근무 캘린더에서 이미 겪은 교훈).
 *    · mode="staff" — 내 희망 입력 + **동료 희망 동시 표시**
 *    · mode="owner" — 전원 취합 + 미제출자 + 근무표 확정
 *
 *  정직성 경계
 *   · 희망(shift_availability)은 확정 근무표(staff_schedules)가 아니다. 문구를 절대 섞지 않는다.
 *   · 필요 인원을 앱이 모르므로 "인원 부족" 같은 판정을 하지 않는다 (인원 수만 보여준다).
 *   · 동료 희망은 RPC 가 근무 필드만 내려준다 (시급·연락처는 애초에 오지 않는다).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check, X, CalendarPlus, RefreshCw, Clock3, Plus } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import {
  currentRequestWindow, isPeriodEditable, periodDates, periodLabel, parsePeriod,
  groupByDate, submissionSummary, pendingSubmitters, availabilityTimeLabel,
  DEFAULT_SHIFT_REQUEST_DEADLINE_DAY, DEADLINE_DAY_CHOICES, deadlineDayLabel,
  normalizeShiftSlots, effectiveShiftSlots, hasOwnerSlots, isValidSlotTime, MAX_SHIFT_SLOTS,
  formatSpanTime, type ShiftAvailability, type ShiftSubmission, type ShiftSlot,
} from "@foundone/shared";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const WISH = "#8b7fd4";           // 희망 = 라벤더 (확정 근무의 미드나잇과 구분)
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n: number) => String(n).padStart(2, "0");
/** 동료 구분색 — 미드나잇 명도 단계 (신호등 컬러 금지) */
const PERSON_COLORS = ["#1d3557", "#3b5c8c", "#6b83b5", "#9aabd0"];

type RpcResult = {
  ok?: boolean;
  reason?: string;
  period?: string;
  deadline_day?: number;
  rows?: ShiftAvailability[];
  submissions?: ShiftSubmission[];
  slots?: unknown;
};

export function ShiftAvailabilityCalendar({
  ko, ownerId, myUserId, mode, onDeadlineChange, previewRows, previewSubs, previewSlots, previewToday,
}: {
  ko: boolean;
  ownerId: string | null;
  /** 내 user id — staff 모드에서 내 희망을 쓰는 주체 */
  myUserId: string | null;
  mode: "staff" | "owner";
  /** owner 모드에서 마감일을 바꿨을 때 부모에게 알림(저장은 이 컴포넌트가 한다) */
  onDeadlineChange?: (day: number) => void;
  /** dev 프리뷰 전용 주입구 — ownerId 없이 렌더를 검증한다. prod 경로 미사용
      (선례: OwnerScheduleCalendar previewLeaves) */
  previewRows?: ShiftAvailability[];
  previewSubs?: ShiftSubmission[];
  previewSlots?: ShiftSlot[];
  previewToday?: Date;
}) {
  const [deadlineDay, setDeadlineDay] = useState<number>(DEFAULT_SHIFT_REQUEST_DEADLINE_DAY);
  const [period, setPeriod] = useState<string>(() => currentRequestWindow(previewToday).period);
  const [rows, setRows] = useState<ShiftAvailability[]>(previewRows ?? []);
  const [subs, setSubs] = useState<ShiftSubmission[]>(previewSubs ?? []);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  /** 사용자가 화살표로 달을 옮겼는가 — 옮긴 뒤엔 서버 마감일이 와도 그 달을 유지한다 */
  const [navigated, setNavigated] = useState(false);
  /** 사장이 정한 근무 시간대 — 직원 신청 버튼이 이걸로 그려진다 */
  const [slots, setSlots] = useState<ShiftSlot[]>(normalizeShiftSlots(previewSlots));
  const [editingSlots, setEditingSlots] = useState(false);
  /** 고정 근무표로만 돌아가는 업장도 있어 기본은 접힘 (사장님 지적 2026-07-30) */
  const [open, setOpen] = useState(false);
  /** 사용자가 직접 접거나 펼쳤는가 — 그 뒤엔 자동 펼침이 개입하지 않는다 */
  const [openTouched, setOpenTouched] = useState(false);

  const now = useMemo(() => previewToday ?? new Date(), [previewToday]);
  const reqWindow = useMemo(() => currentRequestWindow(now, deadlineDay), [now, deadlineDay]);
  const editable = mode === "staff" && isPeriodEditable(period, now, deadlineDay);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_shift_availability" as never, {
        p_owner: ownerId, p_period: period,
      } as never);
      const res = (data ?? {}) as RpcResult;
      // RPC 에러를 "신청 없음"으로 뭉개지 않는다 — 마이그레이션 미적용이면 그렇게 말해야 한다
      //   (2026-07-13 hire_date 사고: 서버엔 데이터가 있는데 화면만 빈 상태로 보였다)
      if (error || res.ok !== true) {
        setFailed(true);
        setRows([]); setSubs([]);
        return;
      }
      setFailed(false);
      setRows(res.rows ?? []);
      setSubs(res.submissions ?? []);
      setSlots(normalizeShiftSlots(res.slots));
      if (typeof res.deadline_day === "number") setDeadlineDay(res.deadline_day);
    } finally {
      setLoading(false);
    }
  }, [ownerId, period]);

  useEffect(() => { void load(); }, [load]);

  // 사장 화면은 realtime 으로 즉시 반영된다 (사장 RLS 가 가게 전체 행을 덮으므로).
  //   직원 화면은 RLS 상 **동료 행이 스트리밍되지 않아** realtime 으로 못 받는다 →
  //   화면 복귀·새로고침 버튼으로 다시 불러온다 (있는 것처럼 말하지 않는다).
  useEffect(() => {
    if (!ownerId || mode !== "owner") return;
    const ch = supabase.channel(`shift-avail-${ownerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shift_availability", filter: `owner_user_id=eq.${ownerId}` }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "shift_availability_submissions", filter: `owner_user_id=eq.${ownerId}` }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [ownerId, mode, load]);

  useEffect(() => {
    if (mode !== "staff") return;
    const onFocus = () => { void load(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => { document.removeEventListener("visibilitychange", onFocus); };
  }, [mode, load]);

  const byDate = useMemo(() => groupByDate(rows), [rows]);
  const mySubmission = useMemo(() => subs.find((s) => s.mine), [subs]);
  const myDayCount = useMemo(() => rows.filter((r) => r.mine).length, [rows]);

  const p = parsePeriod(period);
  const dates = periodDates(period);
  const firstDow = p ? new Date(p.year, p.monthIndex, 1).getDay() : 0;
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...dates];

  const movePeriod = (delta: number) => {
    if (!p) return;
    const d = new Date(p.year, p.monthIndex + delta, 1);
    setSelected(null);
    setNavigated(true);
    setPeriod(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  // 첫 렌더는 기본 마감일(25)로 대상 달을 계산한다. 서버에서 사장이 정한 마감일이 오면
  //   열린 달이 달라질 수 있으므로 **한 번 스냅**한다 — 안 하면 직원이 엉뚱한 달에 도착해
  //   "신청 마감"만 보고 수동으로 화살표를 눌러 찾아야 한다.
  useEffect(() => {
    if (navigated) return;
    if (reqWindow.period !== period) { setSelected(null); setPeriod(reqWindow.period); }
  }, [navigated, reqWindow.period, period]);

  // ── 직원 쓰기 ──
  const setMyDay = async (date: string, start: string | null, end: string | null) => {
    if (!ownerId || !myUserId || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("shift_availability" as never).upsert({
        owner_user_id: ownerId, member_user_id: myUserId, work_date: date,
        start_time: start, end_time: end, updated_at: new Date().toISOString(),
      } as never, { onConflict: "member_user_id,work_date" } as never);
      if (!error) await load();
    } finally { setBusy(false); }
  };

  const clearMyDay = async (date: string) => {
    if (!myUserId || busy) return;
    setBusy(true);
    try {
      await supabase.from("shift_availability" as never).delete()
        .eq("member_user_id", myUserId).eq("work_date", date);
      await load();
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!ownerId || !myUserId || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("shift_availability_submissions" as never).upsert({
        owner_user_id: ownerId, member_user_id: myUserId, period,
        submitted_at: new Date().toISOString(),
      } as never, { onConflict: "member_user_id,period" } as never);
      if (!error) { await load(); setConfirmed(ko ? "사장님께 제출했어요." : "Submitted."); }
    } finally { setBusy(false); }
  };

  // ── 사장 확정 — 희망을 근무표(staff_schedules)로 ──
  const confirmDay = async (date: string) => {
    if (!ownerId || busy) return;
    const day = byDate.get(date);
    if (!day) return;
    const withTime = day.entries.filter((e) => e.start_time && e.end_time);
    if (withTime.length === 0) {
      setConfirmed(ko ? "시간을 적은 희망이 없어 근무표에 넣을 수 없어요." : "No timed requests to confirm.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("staff_schedules" as never).upsert(
        withTime.map((e) => ({
          owner_user_id: ownerId, member_user_id: e.member_user_id, work_date: date,
          start_time: e.start_time, end_time: e.end_time, is_off: false,
        })) as never,
        { onConflict: "owner_user_id,member_user_id,work_date" } as never,
      );
      setConfirmed(error
        ? (ko ? "근무표 저장에 실패했어요. 잠시 후 다시 시도해 주세요." : "Failed to save schedule.")
        : (ko ? `${withTime.length}명을 ${Number(date.slice(8, 10))}일 근무표에 넣었어요.` : `Added ${withTime.length} to the schedule.`));
    } finally { setBusy(false); }
  };

  const saveSlots = async (next: ShiftSlot[]) => {
    if (!ownerId) return;
    const clean = normalizeShiftSlots(next);
    setSlots(clean);
    const { error } = await supabase.from("payroll_settings" as never).upsert(
      { owner_user_id: ownerId, shift_slots: clean } as never,
      { onConflict: "owner_user_id" } as never,
    );
    setConfirmed(error
      ? (ko ? "시간대 저장에 실패했어요. 잠시 후 다시 시도해 주세요." : "Failed to save slots.")
      : (ko ? "근무 시간대를 저장했어요. 직원 신청 화면에 바로 반영돼요." : "Saved."));
  };

  const saveDeadline = async (day: number) => {
    if (!ownerId) return;
    setDeadlineDay(day);
    onDeadlineChange?.(day);
    await supabase.from("payroll_settings" as never).upsert(
      { owner_user_id: ownerId, shift_request_deadline_day: day } as never,
      { onConflict: "owner_user_id" } as never,
    );
  };

  /**
   * 접힌 상태 한 줄 요약 — 열지 않고도 "지금 뭘 해야 하나"가 보여야 접어둘 수 있다.
   *  실패했으면 실패라고 말한다(빈 상태로 위장하지 않는다).
   */
  const collapsedSummary = failed
    ? (ko ? "불러오지 못했어요 — 눌러서 다시 시도" : "Couldn't load — tap to retry")
    : mode === "owner"
      ? `${submissionSummary(subs, ko)} · ${ko ? `마감 ${reqWindow.closesOn}` : `closes ${reqWindow.closesOn}`}`
      : subs.find((x) => x.mine)?.submitted_at
        ? (ko ? `제출 완료 · 내 신청 ${myDayCount}일` : `Submitted · ${myDayCount} days`)
        : (ko
          ? `아직 제출 안 했어요 · ${reqWindow.closesOn} 마감`
          : `Not submitted · closes ${reqWindow.closesOn}`);

  const selectedDay = selected ? byDate.get(selected) : undefined;
  const mine = selected ? rows.find((r) => r.mine && r.work_date === selected) : undefined;

  if (failed) {
    return (
      <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>
        {ko
          ? "희망 근무 신청을 불러오지 못했어요. 서버 준비(마이그레이션 20260730_000001)가 끝나면 표시됩니다."
          : "Couldn't load shift requests (migration 20260730_000001 pending)."}
        <button type="button" onClick={() => { void load(); }} style={{ ...ghostBtn, marginLeft: 8 }}>
          <RefreshCw size={12} strokeWidth={2} /> {ko ? "다시 시도" : "Retry"}
        </button>
      </div>
    );
  }

  // 마감이 임박했을 때만 스스로 펼친다 — 평소엔 접힌 채 자리만 차지하지 않는다
  useEffect(() => {
    if (openTouched) return;
    if (reqWindow.urgent && period === reqWindow.period) setOpen(true);
  }, [openTouched, reqWindow.urgent, reqWindow.period, period]);

  const toggle = () => { setOpenTouched(true); setOpen((v) => !v); };

  if (!open) {
    return (
      <button type="button" onClick={toggle} style={collapsedBar} aria-expanded={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
          <span style={{ fontSize: 13, fontWeight: 750, color: INK }}>
            {ko ? `${periodLabel(reqWindow.period)} 희망 근무` : `${periodLabel(reqWindow.period, false)} availability`}
          </span>
          <span style={{ fontSize: 11.5, color: MUTED }}>{collapsedSummary}</span>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: MIDNIGHT }}>
          {ko ? "열기" : "Open"} <ChevronDown size={14} strokeWidth={2} />
        </span>
      </button>
    );
  }

  return (
    <div>
      {/* 헤더 — 어느 달을 신청받는지 + 마감 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14.5, fontWeight: 750, color: INK, letterSpacing: "-0.01em" }}>
            {ko ? `${periodLabel(period)} 희망 근무` : `${periodLabel(period, false)} availability`}
          </span>
          {period === reqWindow.period ? (
            <span style={{
              fontSize: 10.5, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
              color: reqWindow.urgent ? "#7a2e2e" : MIDNIGHT,
              background: reqWindow.urgent ? "rgba(122,46,46,0.08)" : MIDNIGHT_SOFT,
            }}>
              {ko
                ? (reqWindow.daysLeft === 0 ? "오늘 마감" : `마감 D-${reqWindow.daysLeft}`)
                : (reqWindow.daysLeft === 0 ? "closes today" : `${reqWindow.daysLeft}d left`)}
            </span>
          ) : (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: MUTED, background: "rgba(15,23,42,0.05)", borderRadius: 999, padding: "2px 8px" }}>
              {ko ? "신청 마감" : "closed"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={toggle} aria-label={ko ? "접기" : "Collapse"} style={navBtn}>
            <ChevronDown size={16} strokeWidth={2} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button type="button" onClick={() => movePeriod(-1)} aria-label={ko ? "이전 달" : "Previous month"} style={navBtn}>
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <button type="button" onClick={() => movePeriod(1)} aria-label={ko ? "다음 달" : "Next month"} style={navBtn}>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 안내 — 희망과 확정을 절대 섞지 않는다 */}
      <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.6, marginBottom: 10 }}>
        {mode === "staff"
          ? (ko
            ? `날짜를 눌러 가능한 시간을 고르면 바로 저장돼요. 다 골랐으면 「제출」을 눌러 사장님께 알려주세요. 여기 적은 건 희망이고, 실제 근무는 사장님이 확정해요. (${reqWindow.closesOn} 마감)`
            : "Tap a date to set the times you can work. It saves instantly; press Submit when done. These are requests — the owner confirms the actual schedule.")
          : (ko
            ? "직원이 낸 희망이에요. 아직 근무표가 아니고, 「근무표에 넣기」를 누른 것만 확정됩니다."
            : "Staff requests. Nothing is scheduled until you add it to the roster.")}
      </div>

      {/* 사장: 제출 현황 + 마감일 설정 */}
      {mode === "owner" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, padding: "10px 12px", borderRadius: 11, background: MIDNIGHT_SOFT }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{submissionSummary(subs, ko)}</span>
          {pendingSubmitters(subs).length > 0 && (
            <span style={{ fontSize: 11.5, color: MUTED }}>
              {ko ? "대기: " : "waiting: "}{pendingSubmitters(subs).map((s) => s.name).join(", ")}
            </span>
          )}
          <button type="button" onClick={() => setEditingSlots((v) => !v)} style={{ ...ghostBtn, marginLeft: "auto" }}>
            <Clock3 size={12} strokeWidth={2} />
            {hasOwnerSlots(slots)
              ? (ko ? `근무 시간대 ${slots.length}개` : `${slots.length} slots`)
              : (ko ? "근무 시간대 정하기" : "Set slots")}
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: MUTED }}>
            {ko ? "매달 마감일" : "Deadline"}
            <select
              value={deadlineDay}
              onChange={(e) => { void saveDeadline(Number(e.target.value)); }}
              style={{ fontSize: 12, fontWeight: 700, color: INK, border: `1px solid ${MIDNIGHT_BORDER}`, borderRadius: 8, padding: "3px 6px", background: "#fff" }}
            >
              {DEADLINE_DAY_CHOICES.map((d) => (
                <option key={d} value={d}>{deadlineDayLabel(d, ko)}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* 사장: 근무 시간대 편집 — 업장마다 운영 시간이 달라 사장이 정한다 (2026-07-30) */}
      {mode === "owner" && editingSlots && (
        <SlotEditor
          ko={ko}
          slots={slots}
          onSave={(next) => { void saveSlots(next); setEditingSlots(false); }}
          onCancel={() => setEditingSlots(false)}
        />
      )}

      {/* 직원: 내 신청 요약 + 제출 */}
      {mode === "staff" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, padding: "10px 12px", borderRadius: 11, background: "rgba(139,127,212,0.08)" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>
            {ko ? `내 신청 ${myDayCount}일` : `${myDayCount} days requested`}
          </span>
          {mySubmission?.submitted_at && (
            <span style={{ fontSize: 11, fontWeight: 700, color: WISH, background: "rgba(139,127,212,0.14)", borderRadius: 999, padding: "2px 8px" }}>
              {ko ? "제출 완료" : "submitted"}
            </span>
          )}
          <button type="button" onClick={() => { void load(); }} disabled={loading}
            title={ko ? "동료 신청 현황 새로 불러오기" : "Reload coworkers"}
            style={{ ...ghostBtn, marginLeft: "auto" }}>
            <RefreshCw size={12} strokeWidth={2} /> {ko ? "새로고침" : "Reload"}
          </button>
          {editable && (
            <button type="button" onClick={() => { void submit(); }} disabled={busy || myDayCount === 0} style={{ ...primaryBtn, opacity: myDayCount === 0 ? 0.45 : 1 }}>
              {mySubmission?.submitted_at ? (ko ? "다시 제출" : "Resubmit") : (ko ? "제출" : "Submit")}
            </button>
          )}
        </div>
      )}

      {/* 요일 헤더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {(ko ? WEEKDAYS_KO : WEEKDAYS_EN).map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? WISH : MUTED, padding: "4px 0" }}>{w}</div>
        ))}
      </div>

      {/* 월 그리드 — 내 신청은 채움, 동료 수는 숫자 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((date, idx) => {
          if (date === null) return <div key={`e${idx}`} />;
          const day = byDate.get(date);
          const total = day?.entries.length ?? 0;
          const isMine = day?.entries.some((e) => e.mine) ?? false;
          const isSelected = date === selected;
          const others = total - (isMine ? 1 : 0);
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(isSelected ? null : date)}
              aria-label={`${Number(date.slice(8, 10))}${ko ? "일" : ""} ${total > 0 ? `${total}${ko ? "명 희망" : " requested"}` : ko ? "희망 없음" : "none"}`}
              style={{
                position: "relative", aspectRatio: "1 / 1", padding: 0, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                borderRadius: 10,
                border: isSelected ? `1.5px solid ${MIDNIGHT}` : isMine ? `1px solid ${WISH}` : "1px solid transparent",
                background: isMine ? "rgba(139,127,212,0.16)" : total > 0 ? MIDNIGHT_SOFT : "transparent",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: isMine ? 800 : 600, color: total > 0 ? INK : MUTED }}>
                {Number(date.slice(8, 10))}
              </span>
              {(mode === "owner" ? total > 0 : others > 0) && (
                <span style={{ fontSize: 10, fontWeight: 700, color: MIDNIGHT, opacity: 0.75 }}>
                  {mode === "owner" ? total : others}{ko ? "명" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택한 날 상세 */}
      {selected && (
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.7)", border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 9 }}>
            <div style={{ fontSize: 12.5, fontWeight: 750, color: INK }}>
              {ko
                ? `${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8, 10))}일 (${WEEKDAYS_KO[new Date(selected).getDay()]})`
                : new Date(selected).toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
            </div>
            {mode === "owner" && (selectedDay?.spans.length ?? 0) > 0 && (
              <button type="button" onClick={() => { void confirmDay(selected); }} disabled={busy} style={primaryBtn}>
                <CalendarPlus size={13} strokeWidth={2} /> {ko ? "근무표에 넣기" : "Add to roster"}
              </button>
            )}
          </div>

          {/* 동료 희망 타임라인 — "3시부터는 나 말고 아무도 없네" 가 보여야 조정이 된다 */}
          {(selectedDay?.spans.length ?? 0) > 0 && <WishTimeline ko={ko} day={selectedDay!} />}

          {/* 명단 */}
          {total(selectedDay) === 0 ? (
            <div style={{ fontSize: 12.5, color: MUTED }}>{ko ? "아직 이 날 희망한 사람이 없어요." : "No requests for this day yet."}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
              {selectedDay!.entries.map((e, i) => (
                <div key={`${e.member_user_id}-${e.work_date}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: PERSON_COLORS[i % PERSON_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 650, color: INK }}>{e.mine ? (ko ? "나" : "Me") : e.name}</span>
                  <span style={{ fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{availabilityTimeLabel(e, ko)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 직원 입력 — 프리셋 + 시간 무관 + 취소 */}
          {mode === "staff" && editable && (
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: `1px solid ${MIDNIGHT_BORDER}` }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTED, marginBottom: 7 }}>
                {ko ? "이 날 가능한 시간" : "I can work"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {effectiveShiftSlots(slots).map((ps) => {
                  const on = mine?.start_time?.slice(0, 5) === ps.start && mine?.end_time?.slice(0, 5) === ps.end;
                  return (
                    <button key={`${ps.label}-${ps.start}`} type="button" disabled={busy}
                      onClick={() => { void setMyDay(selected, ps.start, ps.end); }}
                      style={on ? chipOn : chipOff}>
                      {ps.label} <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{ps.start}–{ps.end}</span>
                    </button>
                  );
                })}
                <button type="button" disabled={busy}
                  onClick={() => { void setMyDay(selected, null, null); }}
                  style={mine && !mine.start_time ? chipOn : chipOff}>
                  {ko ? "시간 무관" : "Any time"}
                </button>
                {mine && (
                  <button type="button" disabled={busy} onClick={() => { void clearMyDay(selected); }} style={ghostBtn}>
                    <X size={12} strokeWidth={2} /> {ko ? "이 날 취소" : "Remove"}
                  </button>
                )}
              </div>
              {/* key=selected — 날짜를 바꾸면 입력값도 그 날짜 것으로 리셋 (없으면 이전 날짜 입력이 잔존, iOS 는 syncCustomFields 로 동일 처리) */}
              <CustomTimeRow key={selected} ko={ko} disabled={busy} initial={mine ?? null} onApply={(s, e) => { void setMyDay(selected, s, e); }} />
            </div>
          )}
        </div>
      )}

      {/* 상태 메시지 */}
      {(confirmed || loading) && (
        <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 650, color: MIDNIGHT, display: "flex", alignItems: "center", gap: 6 }}>
          {loading ? (ko ? "불러오는 중" : "loading") : (<><Check size={13} strokeWidth={2.2} /> {confirmed}</>)}
        </div>
      )}

      {mode === "staff" && !editable && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: MUTED, lineHeight: 1.6 }}>
          {ko
            ? `${periodLabel(period)}분은 신청 기간이 아니에요. 지금은 ${periodLabel(reqWindow.period)} 희망을 ${reqWindow.closesOn}까지 받아요.`
            : `Requests for ${periodLabel(period, false)} are closed. ${periodLabel(reqWindow.period, false)} is open until ${reqWindow.closesOn}.`}
        </div>
      )}
    </div>
  );
}

/**
 * SlotEditor — 사장이 우리 가게 근무 시간대를 정의한다 (2026-07-30 사장님 지시).
 *  "업장마다 운영 시간이 다 다르잖아" — 앱이 정한 09–13/13–18/18–22 는 출발점일 뿐이다.
 *  저장하면 직원 신청 버튼이 이 시간대로 바뀐다.
 */
function SlotEditor({ ko, slots, onSave, onCancel }: {
  ko: boolean;
  slots: ShiftSlot[];
  onSave: (next: ShiftSlot[]) => void;
  onCancel: () => void;
}) {
  // 미설정이면 폴백을 초안으로 깔아준다 — 빈 화면에서 시작하면 아무도 안 만든다
  const [draft, setDraft] = useState<ShiftSlot[]>(() =>
    slots.length > 0 ? slots : effectiveShiftSlots([]));

  const set = (i: number, patch: Partial<ShiftSlot>) =>
    setDraft((d) => d.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => setDraft((d) => d.filter((_, idx) => idx !== i));
  const add = () => setDraft((d) => (d.length >= MAX_SHIFT_SLOTS ? d : [...d, { label: "", start: "", end: "" }]));

  // 저장 가능 = 유효한 항목이 하나라도 있고, 입력 중인 항목에 오류가 없어야 한다
  const invalid = draft.filter((s) =>
    s.label.trim() !== "" || s.start !== "" || s.end !== "",
  ).filter((s) => !s.label.trim() || !isValidSlotTime(s.start) || !isValidSlotTime(s.end) || s.start === s.end);
  const valid = normalizeShiftSlots(draft);
  const canSave = invalid.length === 0 && valid.length > 0;

  return (
    <div style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.8)", border: `1px solid ${MIDNIGHT_BORDER}` }}>
      <div style={{ fontSize: 12.5, fontWeight: 750, color: INK, marginBottom: 4 }}>
        {ko ? "우리 가게 근무 시간대" : "Our shift slots"}
      </div>
      <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.55, marginBottom: 10 }}>
        {ko
          ? "직원이 신청할 때 누를 버튼이에요. 이름은 가게에서 부르는 대로 적으세요 (오픈·미들·마감처럼). 자정을 넘기는 시간대도 됩니다."
          : "These become the buttons staff tap. Overnight ranges are supported."}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {draft.map((sl, i) => {
          const bad = (sl.label.trim() !== "" || sl.start !== "" || sl.end !== "")
            && (!sl.label.trim() || !isValidSlotTime(sl.start) || !isValidSlotTime(sl.end) || sl.start === sl.end);
          return (
            // 한 줄에 [이름][시작][–][종료][삭제] 를 다 넣으면 좁은 폭(폰)에서 중간이 감겨
            //   ✕ 가 엉뚱한 입력에 붙어 보인다(실렌더에서 발견). 의도적으로 2줄로 쪼갠다.
            <div key={i} style={{
              display: "flex", flexDirection: "column", gap: 5,
              padding: "8px 9px", borderRadius: 10, background: "rgba(25,25,112,0.03)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  value={sl.label}
                  onChange={(e) => set(i, { label: e.target.value.slice(0, 10) })}
                  placeholder={ko ? "이름 (오픈)" : "Label"}
                  aria-label={ko ? `${i + 1}번째 시간대 이름` : `Slot ${i + 1} label`}
                  style={{ ...timeInput, flex: 1, minWidth: 0 }}
                />
                <button type="button" onClick={() => remove(i)} style={ghostBtn} aria-label={ko ? "이 시간대 삭제" : "Remove slot"}>
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="time" value={sl.start} onChange={(e) => set(i, { start: e.target.value })}
                  aria-label={ko ? `${i + 1}번째 시작 시간` : `Slot ${i + 1} start`}
                  style={{ ...timeInput, flex: 1, minWidth: 0 }} />
                <span style={{ fontSize: 12, color: MUTED, flexShrink: 0 }}>–</span>
                <input type="time" value={sl.end} onChange={(e) => set(i, { end: e.target.value })}
                  aria-label={ko ? `${i + 1}번째 종료 시간` : `Slot ${i + 1} end`}
                  style={{ ...timeInput, flex: 1, minWidth: 0 }} />
              </div>
              {bad && (
                <span style={{ fontSize: 10.5, color: "#7a2e2e" }}>
                  {ko ? "이름과 시작·종료 시간을 채워주세요" : "Fill label and both times"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
        {draft.length < MAX_SHIFT_SLOTS && (
          <button type="button" onClick={add} style={ghostBtn}>
            <Plus size={12} strokeWidth={2} /> {ko ? "시간대 추가" : "Add slot"}
          </button>
        )}
        <button type="button" onClick={onCancel} style={ghostBtn}>{ko ? "취소" : "Cancel"}</button>
        <button type="button" onClick={() => onSave(draft)} disabled={!canSave}
          style={{ ...primaryBtn, marginLeft: "auto", opacity: canSave ? 1 : 0.45 }}>
          {ko ? "저장" : "Save"}
        </button>
      </div>
    </div>
  );
}

function total(day?: { entries: unknown[] }): number {
  return day?.entries.length ?? 0;
}

/**
 * WishTimeline — 하루 희망을 가로 막대로. 12–3시 A / 3–8시 B 가 이어지는지 한눈에.
 *  확정 근무 타임라인(OwnerScheduleCalendar)과 색을 달리해 **희망임을 시각으로 구분**한다.
 */
function WishTimeline({ ko, day }: { ko: boolean; day: { spans: Array<{ member_user_id: string; name: string; span: { startMin: number; endMin: number }; mine: boolean; colorIndex: number }>; anyTimeCount: number } }) {
  const minStart = Math.min(...day.spans.map((s) => s.span.startMin));
  const maxEnd = Math.max(...day.spans.map((s) => s.span.endMin));
  const width = Math.max(1, maxEnd - minStart);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
        <span>{formatSpanTime(minStart, ko)}</span>
        <span>{formatSpanTime(maxEnd, ko)}</span>
      </div>
      {day.spans.map((s) => (
        <div key={s.member_user_id} style={{ position: "relative", height: 16, borderRadius: 5, background: "rgba(15,23,42,0.04)" }}>
          <div
            style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${((s.span.startMin - minStart) / width) * 100}%`,
              width: `${((s.span.endMin - s.span.startMin) / width) * 100}%`,
              // 색은 spans 순번이 아니라 명단 순번(colorIndex) — 아래 점 색과 반드시 같아야 한다
              background: PERSON_COLORS[s.colorIndex % PERSON_COLORS.length],
              borderRadius: 5,
              display: "flex", alignItems: "center", paddingLeft: 5,
              outline: s.mine ? `1.5px solid ${WISH}` : "none",
            }}
          >
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden" }}>
              {s.mine ? (ko ? "나" : "Me") : s.name}
            </span>
          </div>
        </div>
      ))}
      {day.anyTimeCount > 0 && (
        <div style={{ fontSize: 10.5, color: MUTED }}>
          {ko ? `시간 무관 ${day.anyTimeCount}명 (막대 없음)` : `${day.anyTimeCount} any-time`}
        </div>
      )}
    </div>
  );
}

/** 프리셋에 없는 시간 직접 입력 — 프리셋만 두면 실제 교대(예: 06–11시)를 못 낸다 */
function CustomTimeRow({ ko, disabled, initial, onApply }: {
  ko: boolean; disabled: boolean;
  initial: { start_time: string | null; end_time: string | null } | null;
  onApply: (start: string, end: string) => void;
}) {
  const [start, setStart] = useState(initial?.start_time?.slice(0, 5) ?? "");
  const [end, setEnd] = useState(initial?.end_time?.slice(0, 5) ?? "");
  const valid = /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && start !== end;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11.5, color: MUTED }}>{ko ? "직접 입력" : "Custom"}</span>
      <input type="time" value={start} disabled={disabled} onChange={(e) => setStart(e.target.value)} style={timeInput} aria-label={ko ? "시작 시간" : "Start"} />
      <span style={{ fontSize: 12, color: MUTED }}>–</span>
      <input type="time" value={end} disabled={disabled} onChange={(e) => setEnd(e.target.value)} style={timeInput} aria-label={ko ? "종료 시간" : "End"} />
      <button type="button" disabled={disabled || !valid} onClick={() => onApply(start, end)} style={{ ...ghostBtn, opacity: valid ? 1 : 0.45 }}>
        {ko ? "적용" : "Apply"}
      </button>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28, borderRadius: 8, border: `1px solid ${MIDNIGHT_BORDER}`,
  background: "rgba(255,255,255,0.8)", color: MIDNIGHT, cursor: "pointer",
};
const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontSize: 12, fontWeight: 750, color: "#fff", border: "none", borderRadius: 9,
  padding: "6px 12px", cursor: "pointer",
  background: "linear-gradient(135deg,#1d2b7a,#0d0d4d)",
};
const chipBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontSize: 12, fontWeight: 700, borderRadius: 9, padding: "6px 10px", cursor: "pointer",
};
const chipOn: React.CSSProperties = { ...chipBase, color: MIDNIGHT, background: MIDNIGHT_SOFT, border: `1.5px solid ${MIDNIGHT}` };
const chipOff: React.CSSProperties = { ...chipBase, color: INK, background: "rgba(255,255,255,0.8)", border: `1px solid ${MIDNIGHT_BORDER}` };
const ghostBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 11.5, fontWeight: 700, color: MUTED, background: "transparent",
  border: `1px solid ${MIDNIGHT_BORDER}`, borderRadius: 8, padding: "5px 9px", cursor: "pointer",
};
const collapsedBar: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
  background: "rgba(255,255,255,0.7)", border: `1px solid ${MIDNIGHT_BORDER}`,
};
const timeInput: React.CSSProperties = {
  fontSize: 12, fontWeight: 650, color: INK, border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 8, padding: "4px 7px", background: "#fff",
};
