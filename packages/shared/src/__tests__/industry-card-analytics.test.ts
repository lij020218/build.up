import { describe, expect, it } from "vitest";
import {
  providerStats,
  classifyPetService,
  petServiceMix,
  calculatePOR,
  bucketTime,
  timeDistribution,
  peakBucket,
  unassignedCount,
  type AnalyticsBooking,
  type Provider,
} from "../finance/booking-analytics";
import {
  aggregateAds,
  aggregateByChannel,
  returnRate,
  topReturnReasons,
  gradeRoas,
  gradeCvr,
  filterByWindow,
  type AdSpendRecord,
  type ReturnRecord,
} from "../finance/ecommerce-analytics";
import {
  computeCashZeroDate,
  DEFAULT_HIRE_COST_KRW,
} from "../finance/cash-zero-date";

const NOW = new Date("2026-05-13T00:00:00Z");

// ════════════════════════════════════════════════════════════════════
// Booking analytics (뷰티·펫·공간·생활서비스 공유)
// ════════════════════════════════════════════════════════════════════

describe("providerStats (디자이너·기사·룸별)", () => {
  const providers: Provider[] = [
    { id: "p1", name: "김디자이너", isActive: true },
    { id: "p2", name: "이디자이너", isActive: true },
    { id: "p3", name: "박디자이너", isActive: false }, // 비활성 (제외)
  ];

  it("매출·노쇼율·가동률 계산", () => {
    const bookings: AnalyticsBooking[] = [
      { providerId: "p1", customerName: "A", date: "2026-05-10", service: "컷", price: 30_000, status: "completed" },
      { providerId: "p1", customerName: "B", date: "2026-05-11", service: "컷", price: 50_000, status: "completed" },
      { providerId: "p1", customerName: "C", date: "2026-05-12", service: "컷", price: 30_000, status: "noshow" },
      { providerId: "p2", customerName: "D", date: "2026-05-10", service: "펌", price: 100_000, status: "completed" },
    ];
    const stats = providerStats(bookings, providers, 30, 4, NOW);
    expect(stats).toHaveLength(2); // 비활성 제외
    const p1 = stats.find((s) => s.id === "p1")!;
    expect(p1.completedCount).toBe(2);
    expect(p1.noshowCount).toBe(1);
    expect(p1.revenue).toBe(80_000);
    expect(p1.noshowRate).toBeCloseTo(33.3, 1);
  });

  it("desc 매출 정렬", () => {
    const bookings: AnalyticsBooking[] = [
      { providerId: "p1", customerName: "A", date: "2026-05-10", service: "컷", price: 10_000, status: "completed" },
      { providerId: "p2", customerName: "B", date: "2026-05-10", service: "펌", price: 100_000, status: "completed" },
    ];
    const stats = providerStats(bookings, providers, 30, 4, NOW);
    expect(stats[0].id).toBe("p2");
    expect(stats[1].id).toBe("p1");
  });
});

describe("classifyPetService (펫)", () => {
  it("미용·그루밍·목욕 → grooming", () => {
    expect(classifyPetService("강아지 미용")).toBe("grooming");
    expect(classifyPetService("Premium 그루밍 코스")).toBe("grooming");
    expect(classifyPetService("목욕만")).toBe("grooming");
  });
  it("호텔·위탁·보호 → boarding", () => {
    expect(classifyPetService("애견 호텔 1박")).toBe("boarding");
    expect(classifyPetService("위탁 3일")).toBe("boarding");
  });
  it("진료·수술·백신 → medical", () => {
    expect(classifyPetService("진료")).toBe("medical");
    expect(classifyPetService("심장사상충 백신")).toBe("medical");
  });
  it("사료·용품·간식 → retail", () => {
    expect(classifyPetService("로얄캐닌 사료")).toBe("retail");
  });
  it("그 외 → other", () => {
    expect(classifyPetService("산책 대행")).toBe("other");
  });
});

describe("petServiceMix", () => {
  it("미용 60% · 호텔 40%", () => {
    const bookings: AnalyticsBooking[] = [
      { customerName: "A", date: "2026-05-01", service: "미용", price: 60_000, status: "completed" },
      { customerName: "B", date: "2026-05-02", service: "호텔", price: 40_000, status: "completed" },
      { customerName: "C", date: "2026-05-03", service: "미용 취소된 것", price: 100_000, status: "cancelled" }, // 제외
    ];
    const mix = petServiceMix(bookings, 90, NOW);
    const grooming = mix.find((m) => m.key === "grooming")!;
    const boarding = mix.find((m) => m.key === "boarding")!;
    expect(grooming.pct).toBe(60);
    expect(boarding.pct).toBe(40);
  });
});

describe("calculatePOR (공간임대)", () => {
  it("30 슬롯 / 60 가능 = 50% (BEP 60% 미달)", () => {
    expect(calculatePOR(30, 60)).toBe(50);
  });
  it("0 가능 → 0", () => {
    expect(calculatePOR(0, 0)).toBe(0);
  });
  it("BEP 도달 70%", () => {
    expect(calculatePOR(42, 60)).toBe(70);
  });
});

describe("bucketTime + timeDistribution", () => {
  it("0-11 = morning", () => {
    expect(bucketTime(8)).toBe("morning");
    expect(bucketTime(11)).toBe("morning");
  });
  it("12-16 = afternoon", () => {
    expect(bucketTime(12)).toBe("afternoon");
    expect(bucketTime(16)).toBe("afternoon");
  });
  it("17-21 = evening", () => {
    expect(bucketTime(19)).toBe("evening");
  });
  it("22+ = night", () => {
    expect(bucketTime(23)).toBe("night");
  });

  it("시간대 분포 — 평일 저녁 양봉", () => {
    const bookings: AnalyticsBooking[] = [
      { customerName: "A", date: "2026-05-10", service: "x", price: 0, status: "completed", time: "19:00" },
      { customerName: "B", date: "2026-05-10", service: "x", price: 0, status: "completed", time: "20:00" },
      { customerName: "C", date: "2026-05-11", service: "x", price: 0, status: "completed", time: "10:00" },
    ];
    const dist = timeDistribution(bookings, 7, NOW);
    expect(dist.evening).toBe(2);
    expect(dist.morning).toBe(1);
  });
});

describe("peakBucket", () => {
  it("저녁 50%+ = peak", () => {
    const result = peakBucket({ morning: 10, afternoon: 5, evening: 30, night: 5 });
    expect(result?.bucket).toBe("evening");
    expect(result?.pct).toBeCloseTo(60, 0);
  });
  it("빈 분포 → null", () => {
    expect(peakBucket({ morning: 0, afternoon: 0, evening: 0, night: 0 })).toBeNull();
  });
});

describe("unassignedCount (생활서비스)", () => {
  it("providerId 없는 의뢰 카운트", () => {
    const bookings: AnalyticsBooking[] = [
      { customerName: "A", date: "2026-05-13", service: "청소", price: 50_000, status: "confirmed" },
      { customerName: "B", date: "2026-05-13", service: "청소", price: 50_000, status: "confirmed", providerId: "p1" },
      { customerName: "C", date: "2026-05-13", service: "수리", price: 80_000, status: "confirmed" },
    ];
    expect(unassignedCount(bookings, "2026-05-13")).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════
// Ecommerce analytics
// ════════════════════════════════════════════════════════════════════

describe("aggregateAds + grade", () => {
  it("ROAS 400% · CVR 2%", () => {
    const ads: AdSpendRecord[] = [
      { date: "2026-05-10", channel: "naver", spend: 50_000, clicks: 200, conversions: 4, conversionValue: 200_000 },
    ];
    const agg = aggregateAds(ads);
    expect(agg.cvr).toBe(2);
    expect(agg.roas).toBe(400);
  });

  it("gradeRoas 임계", () => {
    expect(gradeRoas(500)).toBe("elite");
    expect(gradeRoas(400)).toBe("good");
    expect(gradeRoas(300)).toBe("ok");
    expect(gradeRoas(200)).toBe("low");
    expect(gradeRoas(150)).toBe("critical");
  });

  it("gradeCvr 임계", () => {
    expect(gradeCvr(3.5)).toBe("elite");
    expect(gradeCvr(2.5)).toBe("good");
    expect(gradeCvr(1.4)).toBe("average");
    expect(gradeCvr(0.8)).toBe("low");
  });
});

describe("aggregateByChannel", () => {
  it("3 채널 비교, desc spend", () => {
    const ads: AdSpendRecord[] = [
      { date: "2026-05-10", channel: "naver", spend: 50_000, clicks: 100, conversions: 2, conversionValue: 100_000 },
      { date: "2026-05-10", channel: "coupang", spend: 100_000, clicks: 300, conversions: 10, conversionValue: 500_000 },
      { date: "2026-05-10", channel: "meta", spend: 30_000, clicks: 500, conversions: 1, conversionValue: 30_000 },
    ];
    const chans = aggregateByChannel(ads);
    expect(chans[0].channel).toBe("coupang");
    expect(chans[0].roas).toBe(500);
    expect(chans[2].channel).toBe("meta");
    expect(chans[2].roas).toBe(100);
  });
});

describe("returnRate", () => {
  it("반품률 25%", () => {
    const returns: ReturnRecord[] = [
      { date: "2026-05-10", orderAmount: 25_000, reason: "사이즈" },
      { date: "2026-05-11", orderAmount: 25_000, reason: "변심" },
    ];
    const result = returnRate(returns, 200_000);
    expect(result.rate).toBe(25);
  });
});

describe("topReturnReasons", () => {
  it("top 3 정렬", () => {
    const returns: ReturnRecord[] = [
      { date: "1", orderAmount: 1, reason: "사이즈" },
      { date: "2", orderAmount: 1, reason: "사이즈" },
      { date: "3", orderAmount: 1, reason: "사이즈" },
      { date: "4", orderAmount: 1, reason: "변심" },
      { date: "5", orderAmount: 1, reason: "변심" },
      { date: "6", orderAmount: 1, reason: "지연" },
    ];
    const top = topReturnReasons(returns, 3);
    expect(top[0]).toEqual({ reason: "사이즈", count: 3 });
    expect(top[1]).toEqual({ reason: "변심", count: 2 });
    expect(top[2]).toEqual({ reason: "지연", count: 1 });
  });
});

describe("filterByWindow", () => {
  it("7일 윈도우", () => {
    const items = [
      { date: "2026-05-10" },  // 3일 전 (포함)
      { date: "2026-05-05" },  // 8일 전 (제외)
      { date: "2026-05-13" },  // 오늘 (포함)
      { date: "2026-05-06" },  // 7일 전 (포함)
    ];
    const filtered = filterByWindow(items, 7, NOW);
    expect(filtered).toHaveLength(3);
  });
});

// ════════════════════════════════════════════════════════════════════
// Cash Zero Date
// ════════════════════════════════════════════════════════════════════

describe("computeCashZeroDate", () => {
  it("자본 미입력 → not ready", () => {
    const result = computeCashZeroDate({
      totalCapital: 0,
      currentMonthlyBurn: 10_000_000,
      hireCount: 0,
      now: NOW,
    });
    expect(result.ready).toBe(false);
  });

  it("월 비용 미입력 → not ready", () => {
    const result = computeCashZeroDate({
      totalCapital: 200_000_000,
      currentMonthlyBurn: 0,
      hireCount: 0,
      now: NOW,
    });
    expect(result.ready).toBe(false);
  });

  it("자본 2억 · 월 1천만 → 20개월 runway (warning, <18 아니므로 good)", () => {
    const result = computeCashZeroDate({
      totalCapital: 200_000_000,
      currentMonthlyBurn: 10_000_000,
      hireCount: 0,
      now: NOW,
    });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.currentRunwayMonths).toBe(20);
      expect(result.tone).toBe("good"); // 20m >= 18m
    }
  });

  it("자본 6천 · 월 1천만 → 6개월 (critical)", () => {
    const result = computeCashZeroDate({
      totalCapital: 60_000_000,
      currentMonthlyBurn: 10_000_000,
      hireCount: 0,
      now: NOW,
    });
    if (result.ready) {
      expect(result.currentRunwayMonths).toBe(6);
      expect(result.tone).toBe("warning"); // 6 < 18 = warning
    }
  });

  it("자본 3천 · 월 1천만 → 3개월 (critical)", () => {
    const result = computeCashZeroDate({
      totalCapital: 30_000_000,
      currentMonthlyBurn: 10_000_000,
      hireCount: 0,
      now: NOW,
    });
    if (result.ready) {
      expect(result.currentRunwayMonths).toBe(3);
      expect(result.tone).toBe("critical");
    }
  });

  it("채용 시뮬 — 1명 추가 시 burn 증가 (600만)", () => {
    const result = computeCashZeroDate({
      totalCapital: 200_000_000,
      currentMonthlyBurn: 10_000_000,
      hireCount: 1,
      hireCost: DEFAULT_HIRE_COST_KRW,
      now: NOW,
    });
    if (result.ready) {
      expect(result.simulatedBurn).toBe(16_000_000);
      // simulated runway = 200M / 16M = 12.5m
      expect(result.simulatedRunwayMonths).toBeCloseTo(12.5, 1);
      // monthsShifted = 20 - 12.5 = 7.5
      expect(result.monthsShifted).toBeCloseTo(7.5, 1);
    }
  });

  it("절대 날짜 — runway 12개월 = ~365일 후", () => {
    const result = computeCashZeroDate({
      totalCapital: 120_000_000,
      currentMonthlyBurn: 10_000_000,
      hireCount: 0,
      now: NOW,
    });
    if (result.ready) {
      // 12 * 30.4375 = 365.25 → 365일 후
      expect(result.daysAhead).toBeCloseTo(365, 0);
      // 2027-05 안에 있어야 함
      expect(result.cashZeroDateStr.startsWith("2027-05")).toBe(true);
    }
  });
});
