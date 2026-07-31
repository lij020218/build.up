/**
 * 희망 근무 신청 SSOT — 매달 직원 희망을 받아 근무표를 조정하는 흐름 (2026-07-30)
 *
 *  사장님 요청: "카페 같은 곳은 매달 알바생에게 스케줄을 물어봐서 조정한다. 5월 마지막 주면
 *   6월에 언제 어떤 시간 출근 가능한지 캘린더에 기록해 보내고, 사장도 그걸 보고,
 *   직원들끼리도 이미 신청한 시간을 보면서 조정하게."
 *
 *  ── 신청 창(window) 규칙 ──
 *   대상 = **다음 달**. 마감 = 이번 달 `deadlineDay`(사장 설정, 기본 31=말일).
 *   마감이 지나면 다음 달 신청은 닫히고, 그 다음 달 신청이 열린다.
 *     예) 기본(말일): 5/31 → 6월분 신청 마지막 날 / 6/1 → 6월분 마감, 7월분 신청 시작
 *         마감 25 로 앞당긴 경우: 5/20 → 6월분 신청 중(5일 남음) / 5/27 → 7월분
 *   마감 후에도 **조회는 열려 있다**(직원이 자기가 낸 걸 확인해야 함). 수정만 막는다.
 *
 *  ── 이번 달을 열지 않는 이유 (사장님 결정 2026-07-30) ──
 *   6월 중에는 6월 희망을 못 낸다. 이건 누락이 아니라 **의도**다 —
 *   "6/20 못 나가요" 같은 중간 변경은 **연차·반차 신청**(leave_requests)이 이미 처리한다
 *   (날짜 지정 + 사장 승인). 여기에 같은 기능을 또 만들면 직원이 어디에 내야 하는지 헷갈리고,
 *   확정 근무표와 충돌하는 "희망"이 생긴다. 창은 다음 달 하나만 유지한다.
 *
 *  ── 확정과의 분리 ──
 *   희망(shift_availability)은 근무표(staff_schedules)가 아니다. 사장이 확정해야 근무가 된다.
 *   화면 문구도 "희망/신청"과 "확정"을 절대 섞지 않는다 — 직원이 출근일을 오해하면 사고다.
 */

import { toShiftSpan, formatSpanTime, type ShiftSpan } from "./work-schedule";

/**
 * 기본 마감일 = **31(말일 의도)**.
 *  6월분을 5/25까지 받으면 너무 빡빡하다(사장님 지적 2026-07-30) — 기본은 전월 말일까지 받고,
 *  근무표를 미리 짜야 하는 사장은 payroll_settings.shift_request_deadline_day 로 앞당긴다.
 *  31 은 "말일" 의도이며 그 달에 31일이 없으면 말일로 보정한다 (payday_day 와 같은 관례).
 */
export const DEFAULT_SHIFT_REQUEST_DEADLINE_DAY = 31;

export type ShiftAvailability = {
  member_user_id: string;
  name: string;
  work_date: string;            // YYYY-MM-DD
  start_time: string | null;    // null = 시간 무관(종일 가능)
  end_time: string | null;
  note: string | null;
  mine?: boolean;
};

export type ShiftSubmission = {
  member_user_id: string;
  name: string;
  submitted_at: string | null;  // null = 아직 제출 안 함
  day_count: number;
  mine?: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM" — 해당 달의 기간 키 */
export function periodKey(year: number, monthIndex: number): string {
  return `${year}-${pad2(monthIndex + 1)}`;
}

/** "YYYY-MM" → { year, monthIndex }. 형식이 틀리면 null */
export function parsePeriod(period: string): { year: number; monthIndex: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(m[1]), monthIndex: month - 1 };
}

/** "2026-06" → "6월" (ko) / "Jun 2026" (en) */
export function periodLabel(period: string, ko = true): string {
  const p = parsePeriod(period);
  if (!p) return period;
  if (ko) return `${p.monthIndex + 1}월`;
  return new Date(p.year, p.monthIndex, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

/** 마감일 선택 목록 — 1~31, 31 은 "말일"로 표기 (없는 달은 말일로 보정됨) */
export const DEADLINE_DAY_CHOICES: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

/** 마감일 표기 — 31 은 달마다 날짜가 달라 "말일"로 부른다 */
export function deadlineDayLabel(day: number, ko = true): string {
  if (day >= 31) return ko ? "말일" : "Last day";
  return ko ? `${day}일` : String(day);
}

export type RequestWindow = {
  /** 지금 신청받는 기간 "YYYY-MM" */
  period: string;
  /** 마감일 (YYYY-MM-DD) — 이 날까지 수정 가능 */
  closesOn: string;
  /** 남은 일수 (0 = 오늘 마감) */
  daysLeft: number;
  /** 마감이 임박했는지 (3일 이내) — 화면 강조용 */
  urgent: boolean;
};

/**
 * 지금 열려 있는 신청 창.
 *  이번 달 마감일이 아직 안 지났으면 다음 달분, 지났으면 그 다음 달분.
 *  마감일이 그 달에 없는 값(예: 31일인데 2월)이면 그 달 말일로 보정한다
 *  — payroll cron 의 LEAST(payday_day, 말일) 규칙과 같은 감각.
 */
export function currentRequestWindow(
  today: Date = new Date(),
  deadlineDay: number = DEFAULT_SHIFT_REQUEST_DEADLINE_DAY,
): RequestWindow {
  const y = today.getFullYear();
  const m = today.getMonth();
  const lastDayThisMonth = new Date(y, m + 1, 0).getDate();
  const effectiveDeadline = Math.min(Math.max(1, deadlineDay), lastDayThisMonth);

  // 마감일이 지났으면 한 달 밀린다 (이번 달 마감 → 다음 달 마감 기준)
  const passed = today.getDate() > effectiveDeadline;
  const anchorMonth = m + (passed ? 1 : 0);
  const anchor = new Date(y, anchorMonth, 1);
  const anchorLast = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const closeDay = Math.min(Math.max(1, deadlineDay), anchorLast);
  const closesOn = `${anchor.getFullYear()}-${pad2(anchor.getMonth() + 1)}-${pad2(closeDay)}`;

  // 대상 달 = 마감 기준 달의 다음 달
  const target = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);

  const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const closeTime = new Date(anchor.getFullYear(), anchor.getMonth(), closeDay).getTime();
  const daysLeft = Math.max(0, Math.round((closeTime - midnightToday) / 86400000));

  return {
    period: periodKey(target.getFullYear(), target.getMonth()),
    closesOn,
    daysLeft,
    urgent: daysLeft <= 3,
  };
}

/** 그 기간이 지금 수정 가능한지 (조회는 항상 가능, 쓰기만 이 게이트) */
export function isPeriodEditable(
  period: string,
  today: Date = new Date(),
  deadlineDay: number = DEFAULT_SHIFT_REQUEST_DEADLINE_DAY,
): boolean {
  return currentRequestWindow(today, deadlineDay).period === period;
}

/** 그 달의 날짜 키 전부 (캘린더 렌더용) */
export function periodDates(period: string): string[] {
  const p = parsePeriod(period);
  if (!p) return [];
  const last = new Date(p.year, p.monthIndex + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => `${p.year}-${pad2(p.monthIndex + 1)}-${pad2(i + 1)}`);
}

/**
 * 사장이 정하는 근무 시간대 (2026-07-30 사장님 지시).
 *  "시간을 사장이 정해서 저장하게 하자. 업장마다 운영 시간이 다 다르잖아."
 *
 *  저장 위치: payroll_settings.shift_slots (jsonb). 직원은 이 테이블을 직접 못 읽으므로
 *  get_shift_availability RPC 가 함께 내려준다.
 */
export type ShiftSlot = {
  /** 사장이 부르는 이름 — "오픈", "미들", "마감" 처럼 업장 말투 그대로 */
  label: string;
  start: string;   // "HH:MM"
  end: string;     // "HH:MM" (start 보다 이르면 자정 넘김으로 해석)
};

/** 시간대 최대 개수 — 넘치면 버튼이 캘린더보다 커진다 */
export const MAX_SHIFT_SLOTS = 6;

/**
 * 사장이 시간대를 아직 정하지 않았을 때의 폴백 — 일반적인 교대 구간.
 *  ⚠️ 이건 "업종 표준"이 아니다. 앱이 그 업장 영업시간을 모르므로 **출발점만** 준다.
 *  사장이 정하면 그 값이 SSOT 가 되고 이 목록은 쓰이지 않는다.
 */
export const SHIFT_PRESETS: Array<{ key: string; ko: string; en: string; start: string; end: string }> = [
  { key: "morning", ko: "오전", en: "Morning", start: "09:00", end: "13:00" },
  { key: "afternoon", ko: "오후", en: "Afternoon", start: "13:00", end: "18:00" },
  { key: "evening", ko: "저녁", en: "Evening", start: "18:00", end: "22:00" },
];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "HH:MM" 형식·범위 검사 (초 붙은 "09:00:00" 도 받아 앞 5자만 본다) */
export function isValidSlotTime(t: string): boolean {
  return HHMM.test(t.slice(0, 5));
}

/**
 * 저장된 시간대를 화면용으로 정규화.
 *  깨진 항목(시간 형식 오류·빈 이름·같은 시각)은 **조용히 버린다** — 잘못된 시간대를
 *  버튼으로 보여주면 직원이 그 시간에 신청하고 사장은 근무표에 그대로 넣는다.
 */
export function normalizeShiftSlots(raw: unknown): ShiftSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: ShiftSlot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const start = typeof o.start === "string" ? o.start.slice(0, 5) : "";
    const end = typeof o.end === "string" ? o.end.slice(0, 5) : "";
    if (!label || !isValidSlotTime(start) || !isValidSlotTime(end) || start === end) continue;
    out.push({ label, start, end });
    if (out.length >= MAX_SHIFT_SLOTS) break;
  }
  return out;
}

/** 직원 화면에 띄울 시간대 — 사장이 정한 게 있으면 그것, 없으면 폴백 */
export function effectiveShiftSlots(saved: ShiftSlot[]): ShiftSlot[] {
  if (saved.length > 0) return saved;
  return SHIFT_PRESETS.map((p) => ({ label: p.ko, start: p.start, end: p.end }));
}

/** 사장이 정한 시간대인지 (화면 문구를 "우리 가게 시간대" vs "예시"로 나누기 위해) */
export function hasOwnerSlots(saved: ShiftSlot[]): boolean {
  return saved.length > 0;
}

/** 시간대 표기 — "오픈 07:00–12:00" (자정 넘김은 익일 표기) */
export function shiftSlotLabel(slot: ShiftSlot, ko = true): string {
  const span = toShiftSpan(slot.start, slot.end);
  if (!span) return slot.label;
  return `${slot.label} ${formatSpanTime(span.startMin, ko)}–${formatSpanTime(span.endMin, ko)}`;
}

/** 시간 무관(종일 가능) 표기 */
export function availabilityTimeLabel(
  a: Pick<ShiftAvailability, "start_time" | "end_time">,
  ko = true,
): string {
  if (!a.start_time || !a.end_time) return ko ? "시간 무관" : "Any time";
  const span = toShiftSpan(a.start_time, a.end_time);
  if (!span) return ko ? "시간 무관" : "Any time";
  return `${formatSpanTime(span.startMin, ko)}–${formatSpanTime(span.endMin, ko)}`;
}

export type DayAvailability = {
  date: string;
  /** 그 날 희망한 사람들 (이름순은 서버가 이미 정렬) */
  entries: ShiftAvailability[];
  /**
   * 시간을 적은 사람들의 구간 (타임라인 렌더용).
   *  colorIndex = entries 안에서의 순번. 🔴 spans 순번으로 색을 고르면 안 된다 —
   *  "시간 무관"으로 낸 사람은 막대가 없어 spans 에서 빠지므로 색이 밀리고,
   *  **막대 색과 아래 명단 점 색이 다른 사람을 가리킨다**(2026-07-30 실렌더에서 발견).
   */
  spans: Array<{ member_user_id: string; name: string; span: ShiftSpan; mine: boolean; colorIndex: number }>;
  /** 시간 무관으로 낸 사람 수 — 구간이 없어 타임라인에 안 그려지므로 따로 센다 */
  anyTimeCount: number;
};

/** 날짜별로 묶기 — 캘린더 셀과 상세 패널이 같은 계산을 두 번 하지 않도록 */
export function groupByDate(rows: ShiftAvailability[]): Map<string, DayAvailability> {
  const out = new Map<string, DayAvailability>();
  for (const r of rows) {
    let d = out.get(r.work_date);
    if (!d) {
      d = { date: r.work_date, entries: [], spans: [], anyTimeCount: 0 };
      out.set(r.work_date, d);
    }
    const colorIndex = d.entries.length;   // entries 순번 = 명단 점 색과 같은 인덱스
    d.entries.push(r);
    const span = r.start_time && r.end_time ? toShiftSpan(r.start_time, r.end_time) : null;
    if (span) {
      d.spans.push({ member_user_id: r.member_user_id, name: r.name, span, mine: r.mine === true, colorIndex });
    } else {
      d.anyTimeCount += 1;
    }
  }
  return out;
}

/** 아직 안 낸 사람 (사장 화면의 핵심 정보 — 독촉 대상) */
export function pendingSubmitters(subs: ShiftSubmission[]): ShiftSubmission[] {
  return subs.filter((s) => !s.submitted_at);
}

/**
 * 신청 현황 한 줄 요약.
 *  ⚠️ 제출자 수는 실제 행 수로만 말한다 — "충분/부족" 같은 판정은 하지 않는다.
 *  필요 인원을 앱이 모르는데 부족하다고 단정하면 가짜 정보가 된다.
 */
export function submissionSummary(subs: ShiftSubmission[], ko = true): string {
  const total = subs.length;
  const done = subs.filter((s) => s.submitted_at).length;
  if (total === 0) return ko ? "등록된 직원이 없어요." : "No staff registered.";
  if (done === total) return ko ? `직원 ${total}명 모두 제출했어요.` : `All ${total} submitted.`;
  return ko ? `${total}명 중 ${done}명 제출 · ${total - done}명 대기` : `${done}/${total} submitted`;
}
