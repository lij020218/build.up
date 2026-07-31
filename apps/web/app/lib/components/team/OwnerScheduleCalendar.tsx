"use client";

/**
 * OwnerScheduleCalendar — 사장용 근무 캘린더 (2026-07-28 사장님 요청)
 *
 *   "사장 입장에서는 캘린더에 어떤 직원들이 출근하는지"
 *
 *  월 그리드에 날짜별 출근 인원을 표시하고, 날짜를 고르면 그날 명단(이름·시간)을 보여준다.
 *  직원 화면(StaffDashboard)의 캘린더와 **같은 해석 규칙**을 쓴다 —
 *  packages/shared/team/work-schedule.ts (resolveShiftForDate). 복붙 금지.
 *
 *  데이터: rules 는 부모(TeamSurface)가 이미 로드한 것을 받고,
 *  예외·연차·출퇴근은 **보는 달 범위로 이 컴포넌트가 직접 조회**한다.
 *  (부모는 예외를 오늘 이후만 들고 있어 지난달을 보면 부정확해지기 때문.)
 *
 *  정직성: 지난 날짜는 "예정"이 아니라 실제 출근 기록(attendance)을 함께 표시하고,
 *  기록이 없으면 없는 대로 둔다 — 예정만 보고 "출근했다"고 말하지 않는다.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import {
  resolveShiftForDate, expandLeaveDatesWithStatus, shortTime,
  toShiftSpan, findCoverageGaps, formatSpanTime, type ShiftSpan,
} from "@foundone/shared";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const LEAVE = "#8b7fd4";

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export type CalMember = { member_user_id: string; name: string };
export type CalRule = { member_user_id: string; weekday: number; start_time: string; end_time: string; active: boolean };

type ExceptionRow = { member_user_id: string; work_date: string; start_time: string | null; end_time: string | null; is_off: boolean };
type LeaveRow = { member_user_id: string; start_date: string; end_date: string; status: string };
type AttRow = { member_user_id: string; work_date: string; clock_in_at: string | null };
type WishRow = { member_user_id: string; work_date: string };

/** 하루치 출근 명단 */
type DayEntry = { memberId: string; name: string; time: string; worked: boolean; leavePending: boolean; span: ShiftSpan | null };

export function OwnerScheduleCalendar({
  ko, ownerId, members, rules, previewLeaves,
}: {
  ko: boolean;
  ownerId: string | null;
  members: CalMember[];
  rules: CalRule[];
  /** dev 프리뷰 전용 — ownerId 없이 연차 표시(승인/대기)를 검증하기 위한 주입구. prod 경로 미사용 */
  previewLeaves?: LeaveRow[];
}) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(todayKey);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [leaves, setLeaves] = useState<LeaveRow[]>(previewLeaves ?? []);
  const [atts, setAtts] = useState<AttRow[]>([]);
  /** 이 달의 희망 신청 (미확정) — 셀에 힌트 점만. 확정과 절대 섞지 않는다 (2026-07-31) */
  const [wishes, setWishes] = useState<WishRow[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = `${cursor.y}-${pad(cursor.m + 1)}-01`;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const monthEnd = `${cursor.y}-${pad(cursor.m + 1)}-${pad(daysInMonth)}`;

  // 보는 달 범위 데이터 — 월 이동 시마다 재조회
  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const [ex, lv, at, wi] = await Promise.all([
        supabase.from("staff_schedules" as never)
          .select("member_user_id, work_date, start_time, end_time, is_off")
          .eq("owner_user_id", ownerId).gte("work_date", monthStart).lte("work_date", monthEnd),
        supabase.from("leave_requests" as never)
          .select("member_user_id, start_date, end_date, status")
          .eq("owner_user_id", ownerId).lte("start_date", monthEnd).gte("end_date", monthStart),
        supabase.from("attendance_records" as never)
          .select("member_user_id, work_date, clock_in_at")
          .eq("owner_user_id", ownerId).gte("work_date", monthStart).lte("work_date", monthEnd),
        // 희망 신청 — 마이그레이션(20260730_000001) 미적용이면 에러가 나도 힌트만 생략 (아래 ?? [])
        supabase.from("shift_availability" as never)
          .select("member_user_id, work_date")
          .eq("owner_user_id", ownerId).gte("work_date", monthStart).lte("work_date", monthEnd),
      ]);
      setExceptions((ex.data as ExceptionRow[] | null) ?? []);
      setLeaves((lv.data as LeaveRow[] | null) ?? []);
      setAtts((at.data as AttRow[] | null) ?? []);
      setWishes((wi.data as WishRow[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, [ownerId, monthStart, monthEnd]);

  useEffect(() => { void load(); }, [load]);

  // 사장이 근무표·연차를 바꾸면 즉시 반영 (다른 기기 포함)
  useEffect(() => {
    if (!ownerId) return;
    const ch = supabase.channel(`owner-cal-${ownerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_schedules", filter: `owner_user_id=eq.${ownerId}` }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests", filter: `owner_user_id=eq.${ownerId}` }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records", filter: `owner_user_id=eq.${ownerId}` }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [ownerId, load]);

  /** 날짜 → 그날 출근자 목록 / 연차자 목록 */
  const byDate = useMemo(() => {
    const map = new Map<string, { work: DayEntry[]; leave: Array<{ name: string; pending: boolean }> }>();
    const workedSet = new Set(atts.filter((a) => a.clock_in_at).map((a) => `${a.member_user_id}|${a.work_date}`));

    for (const m of members) {
      const memberRules = rules.filter((r) => r.member_user_id === m.member_user_id);
      const memberEx = exceptions.filter((e) => e.member_user_id === m.member_user_id);
      const memberLeaveMap = expandLeaveDatesWithStatus(
        leaves.filter((l) => l.member_user_id === m.member_user_id),
      );
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`;
        const slot = map.get(key) ?? { work: [], leave: [] };
        const leaveState = memberLeaveMap.get(key);
        if (leaveState === "approved") {
          // 승인된 연차만 근무에서 제외 — 확정된 사실
          slot.leave.push({ name: m.name, pending: false });
        } else {
          // 승인 대기 연차는 **근무 유지** — 승인 전까지 그 직원은 출근 예정이다.
          //   대기 건을 인원에서 빼면 사장이 "이날 아무도 안 나온다"고 착각한다
          //   (2026-07-28 냉정 리뷰 실렌더에서 발견).
          const shift = resolveShiftForDate(key, new Date(cursor.y, cursor.m, d).getDay(), memberRules, memberEx);
          if (shift) {
            slot.work.push({
              memberId: m.member_user_id,
              name: m.name,
              time: `${shortTime(shift.start_time)}–${shortTime(shift.end_time)}`,
              worked: workedSet.has(`${m.member_user_id}|${key}`),
              leavePending: leaveState === "pending",
              span: toShiftSpan(shift.start_time, shift.end_time),
            });
          } else if (leaveState === "pending") {
            // 근무일이 아닌데 연차 신청 — 명단에만 대기로 표기
            slot.leave.push({ name: m.name, pending: true });
          }
        }
        if (slot.work.length || slot.leave.length) map.set(key, slot);
      }
    }
    return map;
  }, [members, rules, exceptions, leaves, atts, cursor, daysInMonth]);

  /** 날짜 → 아직 확정 안 된 희망 수 (그날 이미 확정 근무가 있는 사람의 희망은 제외 — 이중 카운트 방지) */
  const wishCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of wishes) {
      const slot = byDate.get(w.work_date);
      const alreadyScheduled = slot?.work.some((e) => e.memberId === w.member_user_id) ?? false;
      if (!alreadyScheduled) map.set(w.work_date, (map.get(w.work_date) ?? 0) + 1);
    }
    return map;
  }, [wishes, byDate]);

  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthLabel = ko
    ? `${cursor.y}년 ${cursor.m + 1}월`
    : new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });

  const move = (delta: number) => {
    setSelected(null);
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const selectedSlot = selected ? byDate.get(selected) : undefined;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 14.5, fontWeight: 750, color: INK, letterSpacing: "-0.01em" }}>
          {monthLabel}
          {loading && <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginLeft: 8 }}>{ko ? "불러오는 중" : "loading"}</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => move(-1)} aria-label={ko ? "이전 달" : "Previous month"} style={navBtn}>
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <button type="button" onClick={() => move(1)} aria-label={ko ? "다음 달" : "Next month"} style={navBtn}>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {(ko ? WEEKDAYS_KO : WEEKDAYS_EN).map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? LEAVE : MUTED, padding: "4px 0" }}>{w}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} />;
          const key = `${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}`;
          const slot = byDate.get(key);
          const count = slot?.work.length ?? 0;
          const approvedLeave = (slot?.leave ?? []).some((l) => !l.pending);
          const pendingLeave = (slot?.leave ?? []).some((l) => l.pending)
            || (slot?.work ?? []).some((w) => w.leavePending);
          const isToday = key === todayKey;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(isSelected ? null : key)}
              aria-label={`${day}${ko ? "일" : ""} ${count > 0 ? `${count}${ko ? "명 근무" : " working"}` : ko ? "근무 없음" : "no shift"}`}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                borderRadius: 10,
                border: isSelected ? `1.5px solid ${MIDNIGHT}` : isToday ? `1px solid ${MIDNIGHT_BORDER}` : "1px solid transparent",
                background: count > 0 ? MIDNIGHT_SOFT : "transparent",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: isToday ? 800 : 600, color: count > 0 ? MIDNIGHT : MUTED }}>{day}</span>
              {count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: MIDNIGHT, opacity: 0.75 }}>
                  {count}{ko ? "명" : ""}
                </span>
              )}
              {approvedLeave && (
                <span aria-hidden style={{ position: "absolute", top: 4, right: 5, width: 5, height: 5, borderRadius: "50%", background: LEAVE }} />
              )}
              {!approvedLeave && pendingLeave && (
                <span aria-hidden style={{ position: "absolute", top: 4, right: 5, width: 5, height: 5, borderRadius: "50%", border: `1.5px solid ${LEAVE}` }} />
              )}
              {(wishCountByDate.get(key) ?? 0) > 0 && (
                <span aria-hidden title={ko ? "희망 근무 신청 있음 (미확정)" : "Shift requests pending"}
                  style={{ position: "absolute", top: 4, left: 5, width: 5, height: 5, borderRadius: 2, border: `1.5px solid ${LEAVE}`, opacity: 0.9 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* 선택 날짜 상세 — 누가 언제 나오는지 */}
      {selected && (
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.7)", border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 750, color: INK, marginBottom: 8 }}>
            {ko
              ? `${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8, 10))}일 (${WEEKDAYS_KO[new Date(selected).getDay()]})`
              : new Date(selected).toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
          </div>
          {(wishCountByDate.get(selected) ?? 0) > 0 && (
            <div style={{ fontSize: 11.5, color: LEAVE, fontWeight: 700, marginBottom: 8 }}>
              {ko
                ? `희망 근무 신청 ${wishCountByDate.get(selected)}명 — 아직 근무표 아님, 「희망 근무 취합」에서 확정하세요.`
                : `${wishCountByDate.get(selected)} shift request(s) — confirm in Shift requests.`}
            </div>
          )}
          {!selectedSlot || (selectedSlot.work.length === 0 && selectedSlot.leave.length === 0) ? (
            <div style={{ fontSize: 12.5, color: MUTED }}>{ko ? "이날은 근무가 없어요." : "No one scheduled."}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {/* 교대 타임라인 — 누가 언제 겹치고 언제 비는지 (텍스트 나열로는 안 보임) */}
              <ShiftTimeline ko={ko} entries={selectedSlot.work} />
              {selectedSlot.work.map((e) => (
                <div key={e.memberId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: shiftColor(selectedSlot.work.findIndex((w) => w.memberId === e.memberId)), flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 650, color: INK }}>{e.name}</span>
                  <span style={{ fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{e.time}</span>
                  {e.worked && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: MIDNIGHT, background: MIDNIGHT_SOFT, borderRadius: 999, padding: "2px 7px" }}>
                      {ko ? "출근함" : "clocked in"}
                    </span>
                  )}
                  {e.leavePending && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: LEAVE, border: `1px solid ${LEAVE}`, borderRadius: 999, padding: "2px 7px" }}>
                      {ko ? "연차 신청 중" : "leave requested"}
                    </span>
                  )}
                </div>
              ))}
              {selectedSlot.leave.map((l) => (
                <div key={`lv-${l.name}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 650, color: MUTED }}>{l.name}</span>
                  {/* 승인 대기를 확정 연차처럼 보이면 인력 배치를 그르친다 — 반드시 구분 */}
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: LEAVE,
                    background: l.pending ? "transparent" : "rgba(139,127,212,0.12)",
                    border: l.pending ? `1px solid ${LEAVE}` : "none",
                    borderRadius: 999, padding: "2px 7px",
                  }}>
                    {l.pending ? (ko ? "연차 승인 대기" : "leave pending") : (ko ? "연차" : "leave")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
        <Legend color={MIDNIGHT_SOFT} border={MIDNIGHT_BORDER} label={ko ? "근무 있는 날" : "Scheduled"} />
        <Legend dot={LEAVE} label={ko ? "연차(승인)" : "Leave"} />
        <Legend ring={LEAVE} label={ko ? "승인 대기" : "Pending"} />
        <Legend square={LEAVE} label={ko ? "희망 신청 (미확정)" : "Requests"} />
      </div>
    </div>
  );
}

/** 교대 구분색 — 미드나잇 계열 명도 단계 (신호등 컬러 금지 원칙) */
const SHIFT_COLORS = ["#1d3557", "#3b5c8c", "#6b83b5", "#9aabd0"];
function shiftColor(i: number): string {
  return SHIFT_COLORS[i % SHIFT_COLORS.length];
}

/**
 * ShiftTimeline — 하루 교대를 가로 막대로. 12–3시 A / 3–8시 B 가 이어지는지 한눈에.
 *   축 = 그날 최소 시작 ~ 최대 종료. 공백(아무도 없는 구간)은 빗금으로 표시하고
 *   "영업 중인데 비었다"고 단정하지 않는다 (영업시간을 모르므로).
 */
function ShiftTimeline({ ko, entries }: { ko: boolean; entries: DayEntry[] }) {
  const spans = entries.map((e) => e.span).filter((s): s is ShiftSpan => s !== null);
  if (spans.length === 0) return null;

  const min = Math.min(...spans.map((s) => s.startMin));
  const max = Math.max(...spans.map((s) => s.endMin));
  const total = Math.max(1, max - min);
  const gaps = findCoverageGaps(spans);
  const pct = (v: number) => `${((v - min) / total) * 100}%`;

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: MUTED, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
        <span>{formatSpanTime(min, ko)}</span>
        <span>{formatSpanTime(max, ko)}</span>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map((e, i) => (
          e.span && (
            <div key={e.memberId} style={{ position: "relative", height: 18, background: "rgba(25,25,112,0.05)", borderRadius: 5 }}>
              <div
                title={`${e.name} ${e.time}`}
                style={{
                  position: "absolute",
                  left: pct(e.span.startMin),
                  width: `${((e.span.endMin - e.span.startMin) / total) * 100}%`,
                  top: 0, bottom: 0,
                  background: shiftColor(i),
                  borderRadius: 5,
                  display: "flex", alignItems: "center", paddingLeft: 6,
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{e.name}</span>
              </div>
            </div>
          )
        ))}
        {/* 공백 구간 — 근무 사이가 비어 있음 */}
        {gaps.map((g, i) => (
          <div
            key={`gap-${i}`}
            style={{
              position: "absolute", top: 0, bottom: 0,
              left: pct(g.startMin),
              width: `${((g.endMin - g.startMin) / total) * 100}%`,
              background: "repeating-linear-gradient(45deg, rgba(182,76,76,0.10) 0 5px, transparent 5px 10px)",
              border: "1px dashed rgba(182,76,76,0.45)",
              borderRadius: 4,
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
      {gaps.length > 0 && (
        <div style={{ fontSize: 11, color: "#b64c4c", marginTop: 6, lineHeight: 1.5 }}>
          {ko
            ? `교대 사이 빈 시간 ${gaps.map((g) => `${formatSpanTime(g.startMin, ko)}–${formatSpanTime(g.endMin, ko)}`).join(", ")}`
            : `Gap between shifts: ${gaps.map((g) => `${formatSpanTime(g.startMin, ko)}–${formatSpanTime(g.endMin, ko)}`).join(", ")}`}
        </div>
      )}
    </div>
  );
}

function Legend({ color, border, dot, ring, square, label }: { color?: string; border?: string; dot?: string; ring?: string; square?: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED }}>
      {square ? (
        <span style={{ width: 6, height: 6, borderRadius: 2, border: `1.5px solid ${square}` }} />
      ) : ring ? (
        <span style={{ width: 6, height: 6, borderRadius: "50%", border: `1.5px solid ${ring}` }} />
      ) : dot ? (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
      ) : (
        <span style={{ width: 14, height: 14, borderRadius: 4, background: color, border: `1px solid ${border}` }} />
      )}
      {label}
    </span>
  );
}

const navBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  border: `1px solid ${MIDNIGHT_BORDER}`, background: "rgba(255,255,255,0.8)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: MIDNIGHT,
};
