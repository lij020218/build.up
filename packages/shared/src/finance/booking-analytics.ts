/**
 * booking-analytics.ts — 예약 기반 4 카드 공유 SSOT (Beauty·Pet·Space·Living).
 *
 *  ── 자료 (Agent B+C 53 자료) ──────────────────────────────────────────
 *  · 뷰티 (Zenoti·Meevo·카카오헤어샵 11): 디자이너 점유율·매출
 *  · 펫 (Gingr·VetPort 14): 서비스 mix (미용·호텔·진료·판매)
 *  · 공간임대 (OfficeRnD·쏘플 15): POR (Percent Occupied Rate)
 *  · 생활서비스 (ServiceTitan·IBM 13): 기사 가동률·FTFR
 *  ────────────────────────────────────────────────────────────────────
 */

import type { CohortBooking } from "./cohort-retention";

export type AnalyticsBooking = CohortBooking & {
  providerId?: string;
  providerName?: string;
  service: string;
  price: number;
  time?: string; // HH:MM
};

export type Provider = {
  id: string;
  name: string;
  role?: string;
  isActive: boolean;
};

/**
 * 디자이너/기사/룸 별 30일 매출·점유.
 *  · 뷰티: 디자이너별 매출 + rebook 노쇼율
 *  · 펫: 미용사·수의사별
 *  · 공간임대: 룸별 점유 (provider=룸)
 *  · 생활서비스: 기사별 가동 (utilization = 완료수 / 일평균 4건 × 30일)
 */
export type ProviderStats = {
  id: string;
  name: string;
  totalBookings: number;
  completedCount: number;
  noshowCount: number;
  revenue: number;
  noshowRate: number;
  /** 가동률 (생활서비스) — 일평균 capacity 대비 */
  utilization?: number;
};

export function providerStats(
  bookings: readonly AnalyticsBooking[],
  providers: readonly Provider[],
  windowDays: number = 30,
  capacityPerDay: number = 4, // 생활서비스 기사 1인당 일평균 4건
  now: Date = new Date(),
): ProviderStats[] {
  const nowMs = now.getTime();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const cutoff = new Date(nowMs - windowDays * 86400000).toISOString().slice(0, 10);
  const windowedBookings = bookings.filter((b) => b.date >= cutoff && b.date <= todayStr);

  return providers.filter((p) => p.isActive).map((p) => {
    const my = windowedBookings.filter((b) => b.providerId === p.id);
    const completed = my.filter((b) => b.status === "completed");
    const noshows = my.filter((b) => b.status === "noshow");
    const revenue = completed.reduce((s, b) => s + (b.price ?? 0), 0);
    const eligibleForNoshow = completed.length + noshows.length;
    const noshowRate = eligibleForNoshow > 0
      ? Math.round((noshows.length / eligibleForNoshow) * 100 * 10) / 10
      : 0;
    const capacity = capacityPerDay * windowDays;
    const utilization = capacity > 0
      ? Math.min(100, Math.round((completed.length / capacity) * 100))
      : 0;

    return {
      id: p.id,
      name: p.name,
      totalBookings: my.length,
      completedCount: completed.length,
      noshowCount: noshows.length,
      revenue,
      noshowRate,
      utilization,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

/**
 * 펫 서비스 분류 (keyword 매칭).
 */
export type PetServiceCategory = "grooming" | "boarding" | "medical" | "retail" | "other";

export function classifyPetService(service: string): PetServiceCategory {
  const s = service.toLowerCase();
  if (s.includes("미용") || s.includes("그루밍") || s.includes("목욕")) return "grooming";
  if (s.includes("호텔") || s.includes("위탁") || s.includes("보호")) return "boarding";
  if (s.includes("진료") || s.includes("수술") || s.includes("백신") || s.includes("검사")) return "medical";
  if (s.includes("사료") || s.includes("용품") || s.includes("간식")) return "retail";
  return "other";
}

/** 90일 서비스 mix (펫) — 카테고리별 매출 비중. */
export function petServiceMix(
  bookings: readonly AnalyticsBooking[],
  windowDays: number = 90,
  now: Date = new Date(),
): Array<{ key: PetServiceCategory; value: number; pct: number }> {
  const nowMs = now.getTime();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const cutoff = new Date(nowMs - windowDays * 86400000).toISOString().slice(0, 10);
  const completed = bookings.filter(
    (b) => b.date >= cutoff && b.date <= todayStr && b.status === "completed",
  );

  const mix: Record<PetServiceCategory, number> = { grooming: 0, boarding: 0, medical: 0, retail: 0, other: 0 };
  for (const b of completed) {
    mix[classifyPetService(b.service)] += b.price ?? 0;
  }
  const total = Object.values(mix).reduce((s, v) => s + v, 0);
  return (Object.entries(mix) as Array<[PetServiceCategory, number]>)
    .map(([key, value]) => ({
      key,
      value,
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value);
}

/**
 * POR (Percent Occupied Rate, 공간임대) — 점유 슬롯 / 가능 슬롯.
 *  무인 스터디카페 BEP = 60-70% POR (출처: 쏘플·작심·세컨드샐러리).
 *
 *  @param totalSlots 활성 룸 × 운영 시간 (예: 5 룸 × 12시간 = 60 슬롯/일)
 *  @param bookedSlots 실제 예약 슬롯 수
 */
export function calculatePOR(bookedSlots: number, totalSlots: number): number {
  if (totalSlots <= 0) return 0;
  return Math.round((bookedSlots / totalSlots) * 100);
}

/** 시간대 분포 (morning/afternoon/evening/night) — 24h 시간에서 분류. */
export type TimeBucket = "morning" | "afternoon" | "evening" | "night";

export function bucketTime(hour: number): TimeBucket {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

export function timeDistribution(
  bookings: readonly AnalyticsBooking[],
  windowDays: number = 7,
  now: Date = new Date(),
): Record<TimeBucket, number> {
  const nowMs = now.getTime();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const cutoff = new Date(nowMs - windowDays * 86400000).toISOString().slice(0, 10);
  const windowed = bookings.filter(
    (b) => b.date >= cutoff && b.date <= todayStr && b.status !== "cancelled" && b.time,
  );

  const buckets: Record<TimeBucket, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const b of windowed) {
    if (!b.time) continue;
    const hour = parseInt(b.time.slice(0, 2), 10);
    if (isNaN(hour)) continue;
    buckets[bucketTime(hour)]++;
  }
  return buckets;
}

/** 피크 시간대 — 가장 높은 비중. */
export function peakBucket(
  buckets: Record<TimeBucket, number>,
): { bucket: TimeBucket; count: number; pct: number } | null {
  const total = Object.values(buckets).reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  const entries = Object.entries(buckets) as Array<[TimeBucket, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const [bucket, count] = entries[0];
  return { bucket, count, pct: Math.round((count / total) * 100) };
}

/** 미배정 의뢰 (생활서비스). */
export function unassignedCount(
  bookings: readonly AnalyticsBooking[],
  date: string,
): number {
  return bookings.filter((b) => b.date === date && !b.providerId).length;
}
