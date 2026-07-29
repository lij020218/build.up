/**
 * 근무 일정 해석 SSOT — 사장 화면·직원 화면이 **같은 규칙**으로 근무일을 계산한다.
 *
 *  왜 SSOT 인가 (2026-07-28): 종전엔 이 로직이 StaffDashboard 안에만 사적으로 있었다.
 *  사장용 캘린더를 만들며 복붙하면 "사장은 출근이라 보는데 직원 화면엔 없는" 불일치가
 *  생긴다 — 근무·급여가 걸린 화면이라 치명적. 한 함수로 통일한다.
 *
 *  해석 우선순위:
 *   1) 그 날짜의 예외행(staff_schedules) — is_off 면 휴무, 시간이 있으면 그 시간
 *   2) 없으면 그 요일의 반복 규칙(staff_schedule_rules)
 *
 *  ⚠️ active 방어: 사장 화면은 rules 를 active 필터 없이 로드해 두고 렌더 시점에 거른다
 *  (직원 화면은 쿼리에서 .eq("active", true)). 호출처가 거르는 걸 잊어도 비활성 규칙이
 *  근무일로 새지 않도록 **이 함수가 항상 active === false 를 배제**한다.
 */

export type WorkRule = {
  weekday: number;          // 0=일 … 6=토
  start_time: string;       // "HH:MM[:SS]"
  end_time: string;
  active?: boolean;         // 미지정 = 활성 (직원 화면은 쿼리에서 이미 필터)
};

export type WorkException = {
  work_date: string;        // "YYYY-MM-DD"
  start_time?: string | null;
  end_time?: string | null;
  is_off?: boolean | null;
  note?: string | null;
};

export type ResolvedShift = {
  start_time: string;
  end_time: string;
  note: string | null;
};

/** 특정 날짜의 실제 근무 — 예외행 우선, 없으면 요일 반복 규칙. 근무 없으면 null. */
export function resolveShiftForDate(
  dateStr: string,
  weekday: number,
  rules: WorkRule[],
  exceptions: WorkException[],
): ResolvedShift | null {
  const ex = exceptions.find((e) => e.work_date === dateStr);
  if (ex) {
    if (ex.is_off) return null;
    if (ex.start_time && ex.end_time) {
      return { start_time: ex.start_time, end_time: ex.end_time, note: ex.note ?? null };
    }
  }
  const r = rules.find((rr) => rr.weekday === weekday && rr.active !== false);
  return r ? { start_time: r.start_time, end_time: r.end_time, note: null } : null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 로컬 기준 YYYY-MM-DD */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * 한 달치 근무일 계산 — 캘린더 렌더용.
 * @param year 연도  @param monthIndex 0=1월
 * @returns dateKey → ResolvedShift (근무 있는 날만)
 */
export function resolveMonthShifts(
  year: number,
  monthIndex: number,
  rules: WorkRule[],
  exceptions: WorkException[],
): Map<string, ResolvedShift> {
  const out = new Map<string, ResolvedShift>();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
    const shift = resolveShiftForDate(dateKey, new Date(year, monthIndex, day).getDay(), rules, exceptions);
    if (shift) out.set(dateKey, shift);
  }
  return out;
}

/** 연차 기간(시작~종료)을 날짜 키 집합으로 전개. 반려 건은 제외. */
export function expandLeaveDates(
  leaves: Array<{ start_date: string; end_date: string; status?: string | null }>,
): Set<string> {
  const out = new Set<string>();
  for (const l of leaves) {
    if (l.status === "rejected") continue;
    const cur = new Date(l.start_date);
    const end = new Date(l.end_date);
    // 잘못된 범위(파싱 실패·역순) 방어 — 무한 루프 금지
    if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) continue;
    while (cur <= end) {
      out.add(toDateKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return out;
}

/** "HH:MM[:SS]" → "HH:MM" (표시용) */
export function shortTime(t: string): string {
  return t.slice(0, 5);
}
