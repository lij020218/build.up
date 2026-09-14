/**
 * 오늘의 근무 명단 SSOT — 홈 화면 "오늘 출근" 카드가 웹·iOS 에서 **같은 판정**을 쓰도록.
 *
 *  왜 SSOT 인가 (2026-09-14): 근무 판정이 화면마다 따로 있으면
 *  "사장 홈엔 출근으로 보이는데 직원 앱엔 휴무"가 생긴다. 근무·급여가 걸린 판정이라
 *  work-schedule.ts 의 resolveShiftForDate 를 그대로 재사용하고, 그 위에
 *  연차·출퇴근 기록만 얹는다. 시간 판정 로직을 여기서 새로 만들지 않는다.
 *
 *  판정 우선순위 (위에서 먼저 맞는 것):
 *   1) 승인된 연차가 오늘을 덮으면      → leave   (근무표와 무관하게 연차가 이긴다)
 *   2) 출퇴근 기록이 있으면             → working / done
 *      (근무표에 없어도 실제로 찍었으면 나온다 — 대타·급한 호출. 기록이 사실이다.)
 *   3) 오늘 근무가 배정돼 있으면        → scheduled
 *   4) 그 외                            → off
 *
 *  ⚠️ 이 함수는 "무엇을 보여줄지"를 정하지 않는다. 모든 상태를 계산해서 돌려주고,
 *     홈에 휴무자를 뺄지 말지는 화면이 정한다(visibleForHome 참고).
 */

import { resolveShiftForDate, timeToMinutes, type WorkRule, type WorkException } from "./work-schedule";

/** 근무 상태 — 화면 라벨은 각 플랫폼이 붙인다(다국어). */
export type TodayShiftStatus = "leave" | "working" | "done" | "scheduled" | "off";

export type RosterMemberInput = {
  memberUserId: string;
  name: string;
  /** 요일 반복 규칙 (그 직원 것만) */
  rules: WorkRule[];
  /** 날짜 예외행 (그 직원 것만) */
  exceptions: WorkException[];
};

/** 출퇴근 기록 — clock_out 이 없으면 근무 중. */
export type RosterAttendance = {
  memberUserId: string;
  clockInAt: string;
  clockOutAt?: string | null;
};

/** 연차·휴가 — 승인된 것만 반영한다(신청 중은 아직 근무 예정). */
export type RosterLeave = {
  memberUserId: string;
  startDate: string;  // "YYYY-MM-DD"
  endDate: string;    // "YYYY-MM-DD"
  status: string;
};

export type TodayRosterEntry = {
  memberUserId: string;
  name: string;
  status: TodayShiftStatus;
  /** 배정된 근무 시간. 근무 배정이 없으면 null (기록만 있는 대타 등). */
  startTime: string | null;
  endTime: string | null;
  /** 정렬·시간대 구분용. 배정이 없으면 null. */
  startMinutes: number | null;
  clockInAt: string | null;
  clockOutAt: string | null;
};

export type BuildTodayRosterArgs = {
  /** 기준일 "YYYY-MM-DD" (로컬) */
  dateStr: string;
  /** 기준일의 요일 0=일 … 6=토 */
  weekday: number;
  members: RosterMemberInput[];
  attendance: RosterAttendance[];
  leaves: RosterLeave[];
};

/**
 * 오늘 명단 계산 — 이른 시간부터 왼쪽에 오도록 정렬한다.
 *  정렬: 시작시간 오름차순 → 시간 없는 사람(기록만·휴무·연차) → 이름순.
 */
export function buildTodayRoster(args: BuildTodayRosterArgs): TodayRosterEntry[] {
  const { dateStr, weekday, members, attendance, leaves } = args;

  const approvedLeave = new Set(
    leaves
      .filter((l) => l.status === "approved" && l.startDate <= dateStr && dateStr <= l.endDate)
      .map((l) => l.memberUserId),
  );
  const attByMember = new Map(attendance.map((a) => [a.memberUserId, a]));

  const entries: TodayRosterEntry[] = members.map((m) => {
    const shift = resolveShiftForDate(dateStr, weekday, m.rules, m.exceptions);
    const att = attByMember.get(m.memberUserId) ?? null;

    const status: TodayShiftStatus = approvedLeave.has(m.memberUserId)
      ? "leave"
      : att
        ? (att.clockOutAt ? "done" : "working")
        : shift
          ? "scheduled"
          : "off";

    return {
      memberUserId: m.memberUserId,
      name: m.name,
      status,
      startTime: shift?.start_time ?? null,
      endTime: shift?.end_time ?? null,
      startMinutes: shift ? timeToMinutes(shift.start_time) : null,
      clockInAt: att?.clockInAt ?? null,
      clockOutAt: att?.clockOutAt ?? null,
    };
  });

  return entries.sort((a, b) => {
    if (a.startMinutes !== null && b.startMinutes !== null && a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    if (a.startMinutes !== null && b.startMinutes === null) return -1;
    if (a.startMinutes === null && b.startMinutes !== null) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * 홈에 보일 사람 — 오늘과 무관한 휴무자는 뺀다.
 *  연차는 남긴다: "오늘 왜 안 보이지"의 답이 화면에 있어야 사장이 다시 찾지 않는다.
 */
export function visibleForHome(entries: TodayRosterEntry[]): TodayRosterEntry[] {
  return entries.filter((e) => e.status !== "off");
}

/** 오늘 실제로 출근한(또는 근무를 마친) 사람 수 — 요약 줄용. */
export function clockedInCount(entries: TodayRosterEntry[]): number {
  return entries.filter((e) => e.status === "working" || e.status === "done").length;
}

/** 오늘 근무 예정 인원(연차 제외) — "3명 중 1명 출근"의 분모. */
export function expectedCount(entries: TodayRosterEntry[]): number {
  return entries.filter((e) => e.status === "working" || e.status === "done" || e.status === "scheduled").length;
}
