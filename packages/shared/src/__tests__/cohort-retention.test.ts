import { describe, expect, it } from "vitest";
import {
  memberCohortRetention,
  bookingRepeatRate,
  expiringMembers,
  activeMemberCount,
  newMemberCount,
  noshowRate,
  type CohortMember,
  type CohortBooking,
} from "../finance/cohort-retention";

// 2026-05-13 기준 — 모든 test 에 명시 Date 주입 (test 안정성)
const NOW = new Date("2026-05-13T00:00:00Z");

// ─── memberCohortRetention ───────────────────────────────────────────

describe("memberCohortRetention", () => {
  it("30일 cohort — 3명 가입 중 2명 active = 67%", () => {
    const members: CohortMember[] = [
      { id: "1", startDate: "2026-04-13", endDate: "2026-08-13" },  // 30일 전 가입, 아직 active
      { id: "2", startDate: "2026-04-10", endDate: "2026-06-15" },  // 30일 전 ±, active
      { id: "3", startDate: "2026-04-14", endDate: "2026-05-01" },  // 30일 전, 이미 만료
    ];
    const result = memberCohortRetention(members, 30, 7, NOW);
    expect(result.total).toBe(3);
    expect(result.stillActive).toBe(2);
    expect(result.rate).toBe(67);
  });

  it("90일 cohort — 빈 cohort = 0% (0/0)", () => {
    const members: CohortMember[] = [
      { startDate: "2026-05-01", endDate: "2026-12-31" },  // 12일 전 — 90일 cohort 에 안 들어감
    ];
    const result = memberCohortRetention(members, 90, 7, NOW);
    expect(result.total).toBe(0);
    expect(result.rate).toBe(0);
  });

  it("windowDays 좁힘 — 1명만 cohort 진입", () => {
    const members: CohortMember[] = [
      { startDate: "2026-04-13", endDate: "2027-04-13" },  // 정확히 30일 전
      { startDate: "2026-04-05", endDate: "2027-04-05" },  // 38일 전 (±7 윈도우 밖)
    ];
    const result = memberCohortRetention(members, 30, 7, NOW);
    expect(result.total).toBe(1);
    expect(result.rate).toBe(100);
  });

  it("1년 cohort — long retention", () => {
    const members: CohortMember[] = [
      { startDate: "2025-05-13", endDate: "2026-12-31" },  // 365일 전, active
      { startDate: "2025-05-10", endDate: "2025-12-31" },  // 365일 전, 이미 만료
    ];
    const result = memberCohortRetention(members, 365, 14, NOW);
    expect(result.total).toBe(2);
    expect(result.stillActive).toBe(1);
    expect(result.rate).toBe(50);
  });
});

// ─── bookingRepeatRate ───────────────────────────────────────────────

describe("bookingRepeatRate", () => {
  it("3명 중 2명 재방문 = 67%", () => {
    const bookings: CohortBooking[] = [
      { customerName: "A", date: "2026-04-13", status: "completed" },
      { customerName: "A", date: "2026-05-01", status: "completed" },
      { customerName: "B", date: "2026-04-20", status: "completed" },
      { customerName: "B", date: "2026-05-05", status: "completed" },
      { customerName: "C", date: "2026-04-25", status: "completed" },
    ];
    const result = bookingRepeatRate(bookings, 90, NOW);
    expect(result.uniqueCustomers).toBe(3);
    expect(result.repeatCustomers).toBe(2);
    expect(result.rate).toBe(67);
  });

  it("취소 booking 제외", () => {
    const bookings: CohortBooking[] = [
      { customerName: "A", date: "2026-04-13", status: "completed" },
      { customerName: "A", date: "2026-05-01", status: "cancelled" },  // 제외
      { customerName: "B", date: "2026-04-20", status: "completed" },
    ];
    const result = bookingRepeatRate(bookings, 90, NOW);
    expect(result.uniqueCustomers).toBe(2);
    expect(result.repeatCustomers).toBe(0);  // A 도 1회만 (취소 제외 후)
  });

  it("customerId 우선 사용 (이름 동음이의 처리)", () => {
    const bookings: CohortBooking[] = [
      { customerId: "u1", customerName: "김민지", date: "2026-04-13", status: "completed" },
      { customerId: "u1", customerName: "김민지", date: "2026-05-01", status: "completed" },
      { customerId: "u2", customerName: "김민지", date: "2026-04-20", status: "completed" },  // 다른 사람
    ];
    const result = bookingRepeatRate(bookings, 90, NOW);
    expect(result.uniqueCustomers).toBe(2);  // u1, u2
    expect(result.repeatCustomers).toBe(1);  // u1 만 재방문
  });
});

// ─── expiringMembers ─────────────────────────────────────────────────

describe("expiringMembers", () => {
  it("D-7 임박 — 7일 안 만료", () => {
    const members: CohortMember[] = [
      { id: "1", startDate: "2026-04-01", endDate: "2026-05-15" },  // 2일 후 만료
      { id: "2", startDate: "2026-04-01", endDate: "2026-05-20" },  // 7일 후
      { id: "3", startDate: "2026-04-01", endDate: "2026-05-25" },  // 12일 후 (제외)
      { id: "4", startDate: "2026-04-01", endDate: "2026-05-10" },  // 이미 만료 (제외)
    ];
    const result = expiringMembers(members, 7, NOW);
    expect(result.count).toBe(2);
    expect(result.members.map((m) => m.id)).toEqual(["1", "2"]);
  });

  it("D-14 (학원 표준) — 14일 안", () => {
    const members: CohortMember[] = [
      { id: "1", startDate: "2026-01-01", endDate: "2026-05-20" },  // 7일 후
      { id: "2", startDate: "2026-01-01", endDate: "2026-05-26" },  // 13일 후
      { id: "3", startDate: "2026-01-01", endDate: "2026-05-28" },  // 15일 후 (제외)
    ];
    const result = expiringMembers(members, 14, NOW);
    expect(result.count).toBe(2);
  });
});

// ─── activeMemberCount ──────────────────────────────────────────────

describe("activeMemberCount", () => {
  it("endDate >= today 인 회원만", () => {
    const members: CohortMember[] = [
      { startDate: "2026-01-01", endDate: "2026-12-31" },  // active
      { startDate: "2026-01-01", endDate: "2026-05-13" },  // 정확히 오늘 (active 포함)
      { startDate: "2026-01-01", endDate: "2026-05-12" },  // 어제 만료
    ];
    expect(activeMemberCount(members, NOW)).toBe(2);
  });
});

// ─── newMemberCount ──────────────────────────────────────────────────

describe("newMemberCount", () => {
  it("지난 30일 신규", () => {
    const members: CohortMember[] = [
      { startDate: "2026-05-01", endDate: "2027-05-01" },  // 12일 전
      { startDate: "2026-04-13", endDate: "2027-04-13" },  // 30일 전
      { startDate: "2026-04-10", endDate: "2027-04-10" },  // 33일 전 (제외)
      { startDate: "2026-05-13", endDate: "2027-05-13" },  // 오늘 (포함)
    ];
    expect(newMemberCount(members, 30, NOW)).toBe(3);
  });
});

// ─── noshowRate ──────────────────────────────────────────────────────

describe("noshowRate", () => {
  it("30일 노쇼율 — 5건 중 1건 = 20%", () => {
    const bookings: CohortBooking[] = [
      { customerName: "A", date: "2026-05-01", status: "completed" },
      { customerName: "B", date: "2026-05-02", status: "completed" },
      { customerName: "C", date: "2026-05-03", status: "completed" },
      { customerName: "D", date: "2026-05-04", status: "completed" },
      { customerName: "E", date: "2026-05-05", status: "noshow" },
    ];
    const result = noshowRate(bookings, 30, NOW);
    expect(result.count).toBe(1);
    expect(result.total).toBe(5);
    expect(result.rate).toBe(20);
  });

  it("취소·confirmed 분모 제외", () => {
    const bookings: CohortBooking[] = [
      { customerName: "A", date: "2026-05-01", status: "completed" },
      { customerName: "B", date: "2026-05-02", status: "cancelled" },  // 제외
      { customerName: "C", date: "2026-05-03", status: "confirmed" },  // 제외 (아직 미완료)
      { customerName: "D", date: "2026-05-04", status: "noshow" },
    ];
    const result = noshowRate(bookings, 30, NOW);
    expect(result.total).toBe(2);  // completed + noshow 만
    expect(result.rate).toBe(50);
  });

  it("0건 = 0%", () => {
    const result = noshowRate([], 30, NOW);
    expect(result.rate).toBe(0);
  });

  it("카카오헤어샵 사례: 노쇼 0.09% — 1000건 중 1건 (반올림 0.1%)", () => {
    const bookings: CohortBooking[] = [
      ...Array.from({ length: 999 }, (_, i) => ({
        customerName: `C${i}`,
        date: "2026-05-01",
        status: "completed" as const,
      })),
      { customerName: "NX", date: "2026-05-01", status: "noshow" as const },
    ];
    const result = noshowRate(bookings, 30, NOW);
    expect(result.rate).toBe(0.1);
  });
});
