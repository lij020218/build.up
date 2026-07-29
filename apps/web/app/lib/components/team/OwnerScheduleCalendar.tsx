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
import { resolveShiftForDate, expandLeaveDates, shortTime } from "@foundone/shared";

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

/** 하루치 출근 명단 */
type DayEntry = { memberId: string; name: string; time: string; worked: boolean };

export function OwnerScheduleCalendar({
  ko, ownerId, members, rules,
}: {
  ko: boolean;
  ownerId: string | null;
  members: CalMember[];
  rules: CalRule[];
}) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(todayKey);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [atts, setAtts] = useState<AttRow[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = `${cursor.y}-${pad(cursor.m + 1)}-01`;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const monthEnd = `${cursor.y}-${pad(cursor.m + 1)}-${pad(daysInMonth)}`;

  // 보는 달 범위 데이터 — 월 이동 시마다 재조회
  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const [ex, lv, at] = await Promise.all([
        supabase.from("staff_schedules" as never)
          .select("member_user_id, work_date, start_time, end_time, is_off")
          .eq("owner_user_id", ownerId).gte("work_date", monthStart).lte("work_date", monthEnd),
        supabase.from("leave_requests" as never)
          .select("member_user_id, start_date, end_date, status")
          .eq("owner_user_id", ownerId).lte("start_date", monthEnd).gte("end_date", monthStart),
        supabase.from("attendance_records" as never)
          .select("member_user_id, work_date, clock_in_at")
          .eq("owner_user_id", ownerId).gte("work_date", monthStart).lte("work_date", monthEnd),
      ]);
      setExceptions((ex.data as ExceptionRow[] | null) ?? []);
      setLeaves((lv.data as LeaveRow[] | null) ?? []);
      setAtts((at.data as AttRow[] | null) ?? []);
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
    const map = new Map<string, { work: DayEntry[]; leave: string[] }>();
    const workedSet = new Set(atts.filter((a) => a.clock_in_at).map((a) => `${a.member_user_id}|${a.work_date}`));

    for (const m of members) {
      const memberRules = rules.filter((r) => r.member_user_id === m.member_user_id);
      const memberEx = exceptions.filter((e) => e.member_user_id === m.member_user_id);
      const memberLeaveSet = expandLeaveDates(
        leaves.filter((l) => l.member_user_id === m.member_user_id),
      );
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`;
        const slot = map.get(key) ?? { work: [], leave: [] };
        if (memberLeaveSet.has(key)) {
          slot.leave.push(m.name);
        } else {
          const shift = resolveShiftForDate(key, new Date(cursor.y, cursor.m, d).getDay(), memberRules, memberEx);
          if (shift) {
            slot.work.push({
              memberId: m.member_user_id,
              name: m.name,
              time: `${shortTime(shift.start_time)}–${shortTime(shift.end_time)}`,
              worked: workedSet.has(`${m.member_user_id}|${key}`),
            });
          }
        }
        if (slot.work.length || slot.leave.length) map.set(key, slot);
      }
    }
    return map;
  }, [members, rules, exceptions, leaves, atts, cursor, daysInMonth]);

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
          const hasLeave = (slot?.leave.length ?? 0) > 0;
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
              {hasLeave && (
                <span aria-hidden style={{ position: "absolute", top: 4, right: 5, width: 5, height: 5, borderRadius: "50%", background: LEAVE }} />
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
          {!selectedSlot || (selectedSlot.work.length === 0 && selectedSlot.leave.length === 0) ? (
            <div style={{ fontSize: 12.5, color: MUTED }}>{ko ? "이날은 근무가 없어요." : "No one scheduled."}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {selectedSlot.work.map((e) => (
                <div key={e.memberId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 650, color: INK }}>{e.name}</span>
                  <span style={{ fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{e.time}</span>
                  {e.worked && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: MIDNIGHT, background: MIDNIGHT_SOFT, borderRadius: 999, padding: "2px 7px" }}>
                      {ko ? "출근함" : "clocked in"}
                    </span>
                  )}
                </div>
              ))}
              {selectedSlot.leave.map((name) => (
                <div key={`lv-${name}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 650, color: MUTED }}>{name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: LEAVE, background: "rgba(139,127,212,0.12)", borderRadius: 999, padding: "2px 7px" }}>
                    {ko ? "연차" : "leave"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
        <Legend color={MIDNIGHT_SOFT} border={MIDNIGHT_BORDER} label={ko ? "근무 있는 날" : "Scheduled"} />
        <Legend dot={LEAVE} label={ko ? "연차" : "Leave"} />
      </div>
    </div>
  );
}

function Legend({ color, border, dot, label }: { color?: string; border?: string; dot?: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED }}>
      {dot ? (
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
