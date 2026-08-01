/**
 * 연차 유급휴가 산정 SSOT — 근로기준법 제60조 (2026-07-28 사장님 요청)
 *
 * ── 법적 근거 (원문 확인: casenote 근로기준법 제60조·제11조, 고용노동부 상담 답변) ──
 *  · 제60조 ①: 1년간 80% 이상 출근 → **15일**
 *  · 제60조 ②: 계속근로 1년 미만 또는 80% 미만 출근 → **1개월 개근 시 1일** (1년 미만 최대 11일)
 *  · 제60조 ④: 3년 이상 계속근로 → 최초 1년 초과 **매 2년마다 1일 가산**, 가산 포함 **총 25일 한도**
 *  · 제11조 ①②: 이 법은 상시 5명 이상 사업장에 적용, 4명 이하는 시행령이 정한 일부만
 *    → **연차(제60조)는 5인 미만 사업장에 적용되지 않는다** (고용노동부: "5명 미만에는 적용되지 않음")
 *
 * ── 정직성 경계 (앱이 확정할 수 없는 것) ──
 *  앱은 입사일과 등록 직원 수만 안다. 다음은 알 수 없으므로 **확정 일수로 단정하지 않는다**:
 *   ① 출근율 80% 충족 여부 (결근 기록이 없음)
 *   ② 상시 근로자 수 특칙 — 연차는 "사유 발생일 전 **1년 동안 계속하여** 5명 이상"
 *      (시행령 제7조의2 ③). 앱은 현재 등록 인원만 보므로 추정이다.
 *   ③ 5인 미만이어도 근로계약·취업규칙에 연차를 정했으면 그 약정이 우선한다.
 *  → 결과 타입에 `isEstimate`·`basisNote` 를 실어 UI 가 "예상"임을 표기하게 한다.
 */

/** 연차 부여 기준 — 사장이 선택 (실무에서 둘 다 쓰임) */
export type LeaveBasis =
  /** 입사일 기준 — 직원마다 발생일이 다름 (법 원칙) */
  | "hire_date"
  /** 회계연도 기준 — 매년 1/1 일괄 (관리 편의, 실무 다수) */
  | "fiscal_year";

export const LEAVE_BASIS_LABEL: Record<LeaveBasis, { ko: string; en: string; desc: { ko: string; en: string } }> = {
  hire_date: {
    ko: "입사일 기준",
    en: "Hire date",
    desc: { ko: "직원마다 입사일에 맞춰 연차가 생겨요 (법 원칙)", en: "Accrues on each employee's hire date" },
  },
  fiscal_year: {
    ko: "회계연도 기준",
    en: "Fiscal year",
    desc: { ko: "매년 1월 1일에 모두 함께 생겨요 (관리 편해요)", en: "Accrues for everyone on Jan 1" },
  },
};

export type AnnualLeaveResult = {
  /** 법정 연차 적용 대상인지 — false 면 5인 미만이라 법정 의무 없음 */
  statutory: boolean;
  /** 올해 발생 일수. statutory=false 면 0 (약정이 있으면 사장이 직접 설정) */
  days: number;
  /** 계속근로 개월 수 */
  monthsWorked: number;
  /** 근속 연차(년) — 0 = 1년 미만 */
  yearsWorked: number;
  /** 앱이 확정할 수 없는 요소가 있어 "예상"임 (항상 true — 출근율 80% 미확인) */
  isEstimate: boolean;
  /** 근거 문구 (UI 에 그대로 노출 — 어떻게 나온 숫자인지 설명) */
  basisNote: { ko: string; en: string };
};

/**
 * "YYYY-MM-DD" → 로컬 자정 Date.
 *  🔴 new Date("2026-08-02") 는 **UTC 자정**(= KST 09:00)이라 입사 당일 오전에
 *  hire <= today 가 거짓이 되어 "입사일을 입력하면…"이 뜬다 (iOS 는 로컬 파싱이라 정상 —
 *  같은 날 아침 웹·iOS 가 다른 말을 했다. 2026-08-01 감사)
 */
function parseLocalDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 두 날짜 사이 개월 수 (일자 미도달이면 -1) */
function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * 근속 연수별 법정 연차 (제60조 ①④).
 *  1년 이상: 15일, 3년 이상부터 매 2년 1일 가산, 25일 상한.
 *  (3년차 16일 / 5년차 17일 / 7년차 18일 … 21년차 25일)
 */
export function statutoryDaysForYears(yearsWorked: number): number {
  if (yearsWorked < 1) return 0;
  const bonus = yearsWorked >= 3 ? Math.floor((yearsWorked - 1) / 2) : 0;
  return Math.min(25, 15 + bonus);
}

/**
 * 연차 발생 일수 계산.
 * @param hireDate  입사일 "YYYY-MM-DD" (없으면 계산 불가 → days 0, isEstimate true)
 * @param opts.basis        부여 기준 (사장 선택)
 * @param opts.headcount    등록된 재직 직원 수 (5인 이상 판정용)
 * @param opts.today        기준일 (테스트용)
 */
export function calcAnnualLeave(
  hireDate: string | null | undefined,
  opts: { basis: LeaveBasis; headcount: number; today?: Date },
): AnnualLeaveResult {
  const today = opts.today ?? new Date();
  const statutory = opts.headcount >= 5;

  const hire = hireDate ? parseLocalDate(hireDate) : null;
  const valid = hire !== null && hire <= today;

  if (!valid) {
    return {
      statutory,
      days: 0,
      monthsWorked: 0,
      yearsWorked: 0,
      isEstimate: true,
      basisNote: {
        ko: "입사일을 입력하면 연차를 계산해 드려요.",
        en: "Enter the hire date to calculate leave.",
      },
    };
  }

  const monthsWorked = monthsBetween(hire!, today);
  const yearsWorked = Math.floor(monthsWorked / 12);

  if (!statutory) {
    return {
      statutory: false,
      days: 0,
      monthsWorked,
      yearsWorked,
      isEstimate: true,
      basisNote: {
        ko: "직원 5인 미만은 법정 연차 의무가 없어요 (근로기준법 제11조·제60조). 근로계약서나 취업규칙에 연차를 정했다면 그 약속대로 지급해야 해요.",
        en: "Under 5 employees: no statutory leave (LSA §11, §60). Any contractual leave still applies.",
      },
    };
  }

  // 1년 미만 — 1개월 개근당 1일 (최대 11일)
  if (yearsWorked < 1) {
    const days = Math.min(11, monthsWorked);
    return {
      statutory: true,
      days,
      monthsWorked,
      yearsWorked: 0,
      isEstimate: true,
      basisNote: {
        ko: `입사 ${monthsWorked}개월 — 1개월 개근마다 1일씩 생겨요 (제60조 ②, 1년 미만 최대 11일). 개근 기준이라 결근이 있으면 줄어요.`,
        en: `${monthsWorked} months — 1 day per full month worked (§60②, max 11 in year 1).`,
      },
    };
  }

  const days = statutoryDaysForYears(yearsWorked);
  const bonus = days - 15;
  const basisKo = bonus > 0
    ? `근속 ${yearsWorked}년 — 기본 15일 + 장기근속 가산 ${bonus}일 (제60조 ①④, 3년째부터 2년마다 1일·최대 25일).`
    : `근속 ${yearsWorked}년 — 기본 15일 (제60조 ①). 3년째부터 2년마다 1일씩 늘어요.`;

  return {
    statutory: true,
    days,
    monthsWorked,
    yearsWorked,
    isEstimate: true,
    basisNote: {
      ko: `${basisKo} 직전 1년 출근율 80% 이상일 때 기준이라 실제와 다를 수 있어요.`,
      en: `${yearsWorked}y — 15 days base${bonus > 0 ? ` + ${bonus} long-service` : ""} (§60①④). Assumes 80%+ attendance.`,
    },
  };
}

/** 발생 - 사용 = 잔여 (음수 방지) */
export function remainingLeaveDays(granted: number, usedDays: number): number {
  return Math.max(0, granted - usedDays);
}

/**
 * 연차 사용 일수 — 승인된 "연차/반차"만 집계.
 *  반차(half)는 0.5일. 병가·기타는 연차 차감 대상이 아니므로 제외(사업장 규정에 따라 다름).
 *  ⚠️ 승인 대기·반려는 사용으로 치지 않는다 (확정된 것만).
 */
export function usedLeaveDays(
  leaves: Array<{ leave_type?: string | null; start_date: string; end_date: string; status?: string | null }>,
  opts?: { yearStart?: string; yearEnd?: string },
): number {
  let total = 0;
  for (const l of leaves) {
    if (l.status !== "approved") continue;
    const type = l.leave_type ?? "annual";
    if (type !== "annual" && type !== "half") continue;
    const start = new Date(l.start_date);
    const end = new Date(l.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) continue;
    // 연도 범위 필터 (기간이 걸치면 겹치는 부분만)
    const from = opts?.yearStart ? new Date(opts.yearStart) : start;
    const to = opts?.yearEnd ? new Date(opts.yearEnd) : end;
    const s = start < from ? from : start;
    const e = end > to ? to : end;
    if (s > e) continue;
    const dayCount = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
    total += type === "half" ? dayCount * 0.5 : dayCount;
  }
  return total;
}

/** 올해 연차 산정 구간 — 기준에 따라 다름 (표시·사용량 집계에 사용) */
export function leaveYearRange(
  basis: LeaveBasis,
  hireDate: string | null | undefined,
  today: Date = new Date(),
): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (basis === "fiscal_year" || !hireDate) {
    return { start: `${today.getFullYear()}-01-01`, end: `${today.getFullYear()}-12-31` };
  }
  const hire = parseLocalDate(hireDate);
  if (hire === null) {
    return { start: `${today.getFullYear()}-01-01`, end: `${today.getFullYear()}-12-31` };
  }
  // 입사 기념일 기준 — 올해 기념일이 지났으면 그날부터, 아니면 작년 기념일부터 1년
  const anniversaryThisYear = new Date(today.getFullYear(), hire.getMonth(), hire.getDate());
  const start = anniversaryThisYear <= today
    ? anniversaryThisYear
    : new Date(today.getFullYear() - 1, hire.getMonth(), hire.getDate());
  const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1);
  return { start: fmt(start), end: fmt(end) };
}
