/**
 * cohort-retention.ts — 회원/학생/단골 cohort 잔존율 SSOT.
 *
 *  ── 왜 SSOT (2026-05-13) ─────────────────────────────────────────────
 *  4 카드 (FitnessRetention·EducationEnrollment·PetBooking·LivingServiceDispatch)
 *  가 동일 cohort 잔존율 계산 패턴 사용 — 각 카드 안에 inline 으로 중복 구현되어
 *  있었음. SSOT 함수로 추출 → 단일 검증 + unit test 가능.
 *
 *  ── 정의 ────────────────────────────────────────────────────────────
 *  N일 cohort 잔존율 = "오늘로부터 N일 전 (±윈도우) 가입한 회원 중 *현재까지*
 *  활성인 비율".
 *
 *  활성 정의:
 *    · members 모델: endDate >= today (회원권/구독이 아직 유효)
 *    · bookings 모델: 최근 N일 안에 1회+ 의뢰/예약 (last activity)
 *
 *  ── 임계값 (업종별 다름, 함수 호출 측 결정) ─────────────────────────
 *  · 피트니스 (FIA Retention Report 19 자료): 90d=50% 기준
 *  · 교육 (학원조아·Spider 17 자료): 30d=80%·60d=70%·90d=60%·1y=50%
 *  · 펫 (Gingr·VetPort·펫프렌즈 14 자료): 60일 cycle·재방문 85%
 *  · 생활서비스 (청소연구소 88%·IBM FTFR 13 자료): 30일 재의뢰 70%+ 우수
 *  ────────────────────────────────────────────────────────────────────
 */

/** 회원 모델 — startDate/endDate 기반 */
export type CohortMember = {
  id?: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
};

/** Booking 모델 — 마지막 활동 기반 */
export type CohortBooking = {
  id?: string;
  customerId?: string;
  customerName: string;
  date: string;       // YYYY-MM-DD
  status: "confirmed" | "completed" | "noshow" | "cancelled";
};

/** Cohort 결과 */
export type CohortResult = {
  /** 해당 cohort 에 들어간 사람 수 */
  total: number;
  /** 그 중 현재 활성 */
  stillActive: number;
  /** 잔존율 % (정수) */
  rate: number;
};

/**
 * Members cohort 잔존율 — endDate >= today 가 활성 정의.
 *
 *  @param members 전체 회원 목록
 *  @param daysAgo 기준일 (오늘로부터 N일 전 가입)
 *  @param windowDays ±윈도우 (가입일 cutoff start/end 폭). 기본 ±7일.
 *  @param now 현재 시각 (test 용, 기본 new Date())
 */
export function memberCohortRetention(
  members: readonly CohortMember[],
  daysAgo: number,
  windowDays = 7,
  now: Date = new Date(),
): CohortResult {
  const nowMs = now.getTime();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const cutoffStart = new Date(nowMs - (daysAgo + windowDays) * 86400000).toISOString().slice(0, 10);
  const cutoffEnd = new Date(nowMs - Math.max(0, daysAgo - windowDays) * 86400000).toISOString().slice(0, 10);

  const cohort = members.filter((m) => m.startDate >= cutoffStart && m.startDate <= cutoffEnd);
  const stillActive = cohort.filter((m) => m.endDate >= todayStr).length;
  const rate = cohort.length > 0 ? Math.round((stillActive / cohort.length) * 100) : 0;

  return { total: cohort.length, stillActive, rate };
}

/**
 * Booking customer 재방문률 — 최근 N일 안에 같은 customer 2회+ 활동.
 *
 *  @param bookings 전체 booking 목록
 *  @param windowDays 최근 N일 범위 (기본 90일)
 *  @param now 현재 시각
 */
export function bookingRepeatRate(
  bookings: readonly CohortBooking[],
  windowDays = 90,
  now: Date = new Date(),
): { uniqueCustomers: number; repeatCustomers: number; rate: number } {
  const nowMs = now.getTime();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const cutoff = new Date(nowMs - windowDays * 86400000).toISOString().slice(0, 10);

  const relevant = bookings.filter(
    (b) => b.date >= cutoff && b.date <= todayStr && b.status !== "cancelled",
  );

  const counts = new Map<string, number>();
  for (const b of relevant) {
    const key = b.customerId || b.customerName;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const uniqueCustomers = counts.size;
  const repeatCustomers = Array.from(counts.values()).filter((c) => c >= 2).length;
  const rate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

  return { uniqueCustomers, repeatCustomers, rate };
}

/**
 * 만료 임박 회원 (D-N).
 *
 *  @param members 회원 목록
 *  @param daysAhead 며칠 안에 만료 (기본 7일)
 *  @param now 현재 시각
 *  @returns 만료 임박 회원 + 카운트
 */
export function expiringMembers(
  members: readonly CohortMember[],
  daysAhead: number = 7,
  now: Date = new Date(),
): { count: number; members: CohortMember[] } {
  const nowMs = now.getTime();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const futureStr = new Date(nowMs + daysAhead * 86400000).toISOString().slice(0, 10);

  const filtered = members.filter(
    (m) => m.endDate >= todayStr && m.endDate <= futureStr,
  );

  return { count: filtered.length, members: filtered };
}

/**
 * 활성 회원 카운트 (endDate >= today).
 */
export function activeMemberCount(
  members: readonly CohortMember[],
  now: Date = new Date(),
): number {
  const todayStr = new Date(now.getTime()).toISOString().slice(0, 10);
  return members.filter((m) => m.endDate >= todayStr).length;
}

/**
 * 지난 N일 신규 가입 카운트.
 */
export function newMemberCount(
  members: readonly CohortMember[],
  daysAgo: number = 30,
  now: Date = new Date(),
): number {
  const cutoff = new Date(now.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);
  return members.filter((m) => m.startDate >= cutoff).length;
}

/**
 * Booking 노쇼율 (지난 N일).
 *
 *  공식: noshow / (completed + noshow) × 100
 *  완료·노쇼만 분모 (취소·confirmed 제외).
 *
 *  카카오헤어샵 0.09% / 한국 평균 5% / 10%+ critical (Zenoti·Meevo 표준).
 */
export function noshowRate(
  bookings: readonly CohortBooking[],
  windowDays = 30,
  now: Date = new Date(),
): { count: number; total: number; rate: number } {
  const nowMs = now.getTime();
  const cutoff = new Date(nowMs - windowDays * 86400000).toISOString().slice(0, 10);
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);

  const eligible = bookings.filter(
    (b) => b.date >= cutoff && b.date <= todayStr
      && (b.status === "noshow" || b.status === "completed"),
  );
  const noshows = eligible.filter((b) => b.status === "noshow").length;
  const rate = eligible.length > 0
    ? Math.round((noshows / eligible.length) * 100 * 10) / 10
    : 0;

  return { count: noshows, total: eligible.length, rate };
}
