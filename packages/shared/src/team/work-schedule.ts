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

/**
 * 연차 기간을 날짜 → 상태 맵으로 전개 (반려 제외).
 *  ⚠️ 사장 화면은 "승인된 연차"와 "승인 대기 신청"을 반드시 구분해야 한다 —
 *  대기 건을 확정 연차처럼 보여주면 사장이 그날 인력이 빠진다고 착각한다
 *  (승인하지 않으면 그 직원은 출근한다). 2026-07-28 냉정 리뷰에서 발견.
 */
export function expandLeaveDatesWithStatus(
  leaves: Array<{ start_date: string; end_date: string; status?: string | null }>,
): Map<string, "approved" | "pending"> {
  const out = new Map<string, "approved" | "pending">();
  for (const l of leaves) {
    if (l.status === "rejected") continue;
    const state: "approved" | "pending" = l.status === "approved" ? "approved" : "pending";
    const cur = new Date(l.start_date);
    const end = new Date(l.end_date);
    if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) continue;
    while (cur <= end) {
      const key = toDateKey(cur);
      // 같은 날 승인·대기가 겹치면 승인이 우선 (확정 정보가 더 강함)
      if (out.get(key) !== "approved") out.set(key, state);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return out;
}

/** "HH:MM[:SS]" → "HH:MM" (표시용) */
export function shortTime(t: string): string {
  return t.slice(0, 5);
}

// ── 교대 타임라인 (2026-07-28 사장님 요청) ───────────────────────────────
//   "A가 12–3시, B가 3–8시면 잘 구분되게" — 이름·시간 텍스트 나열로는 교대가 이어지는지
//   겹치는지 비는지 알 수 없다. 분 단위로 환산해 가로 타임라인으로 그린다.

/** "HH:MM[:SS]" → 자정 기준 분. 파싱 실패 시 null */
export function timeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
}

export type ShiftSpan = {
  /** 시작 (자정 기준 분) */
  startMin: number;
  /** 종료 (자정 기준 분). 야간 근무로 자정을 넘기면 1440 초과 값 (예: 익일 02:00 = 1560) */
  endMin: number;
};

/**
 * 근무 시간 → 분 구간. 종료가 시작보다 이르면 **자정을 넘긴 야간 근무**로 보고 +24h.
 * (22:00–02:00 을 "4시간"이 아니라 음수로 계산하면 타임라인이 깨진다)
 */
export function toShiftSpan(startTime: string, endTime: string): ShiftSpan | null {
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  if (s === null || e === null) return null;
  return { startMin: s, endMin: e <= s ? e + 24 * 60 : e };
}

/** 분 → "H:MM" 표시. 24시 넘으면 "익일 H:MM" (ko) / "+1d H:MM" (en) */
export function formatSpanTime(min: number, ko = true): string {
  const nextDay = min >= 24 * 60;
  const m = min % (24 * 60);
  const label = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  if (!nextDay) return label;
  return ko ? `익일 ${label}` : `+1d ${label}`;
}

/**
 * 여러 근무 구간에서 **아무도 없는 시간대**를 찾는다 (교대 공백).
 *  범위는 그날 근무의 최소 시작 ~ 최대 종료 — 영업시간을 모르는 상태에서
 *  "영업 중인데 사람이 없다"고 단정하지 않기 위해, 근무가 실제로 있는 구간 안의
 *  틈만 본다. 근무가 1개 이하면 공백 개념이 없으므로 빈 배열.
 */
export function findCoverageGaps(spans: ShiftSpan[]): ShiftSpan[] {
  if (spans.length < 2) return [];
  const sorted = [...spans].sort((a, b) => a.startMin - b.startMin);
  const gaps: ShiftSpan[] = [];
  let cursor = sorted[0].endMin;
  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    if (s.startMin > cursor) gaps.push({ startMin: cursor, endMin: s.startMin });
    cursor = Math.max(cursor, s.endMin);
  }
  return gaps;
}
