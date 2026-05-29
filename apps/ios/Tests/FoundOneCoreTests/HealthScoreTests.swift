//
//  HealthScoreTests.swift — Core 비즈니스 로직 단위 테스트
//
//  웹 SSOT (packages/shared/src/__tests__/) 와 같은 cutoff 검증.
//

import Testing
import Foundation
@testable import FoundOneCore

// MARK: - HealthGrade

@Suite("HealthGrade.from(score:)")
struct HealthGradeCoreTests {

    @Test("75점 이상 → healthy")
    func healthy() {
        #expect(HealthGrade.from(score: 100) == .healthy)
        #expect(HealthGrade.from(score: 75)  == .healthy)
    }

    @Test("55~74 → caution")
    func caution() {
        #expect(HealthGrade.from(score: 74.99) == .caution)
        #expect(HealthGrade.from(score: 55)    == .caution)
    }

    @Test("35~54 → warning")
    func warning() {
        #expect(HealthGrade.from(score: 54.99) == .warning)
        #expect(HealthGrade.from(score: 35)    == .warning)
    }

    @Test("35 미만 → critical")
    func critical() {
        #expect(HealthGrade.from(score: 34.99) == .critical)
        #expect(HealthGrade.from(score: 0)     == .critical)
    }

    @Test("NaN / Infinity → unknown")
    func unknown() {
        #expect(HealthGrade.from(score: .nan)      == .unknown)
        #expect(HealthGrade.from(score: .infinity) == .unknown)
    }
}

// MARK: - KpiThreshold

@Suite("KpiThreshold.grade(_:)")
struct KpiThresholdTests {

    @Test("lowerIsBetter — 비용 비율")
    func lowerIsBetter() {
        // 외식 ingredient: healthy 35 / caution 40 / warning 45
        let t = IndustryThresholds.restaurant.ingredients!
        #expect(t.grade(30) == .healthy)
        #expect(t.grade(35) == .healthy)
        #expect(t.grade(38) == .caution)
        #expect(t.grade(43) == .warning)
        #expect(t.grade(50) == .critical)
    }

    @Test("업종 lookup")
    func industryLookup() {
        let restaurant = IndustryThresholds.thresholds(for: .restaurant)
        #expect(restaurant.ingredients?.healthy == 35)
        #expect(restaurant.primeCost?.healthy == 65)

        let cafe = IndustryThresholds.thresholds(for: .cafe)
        #expect(cafe.ingredients?.healthy == 28)
        #expect(cafe.primeCost?.healthy == 60)
    }
}

// MARK: - CostRatios

@Suite("CostRatios.calculate")
struct CostRatiosTests {

    @Test("최소 7일 부족 시 ready=false")
    func notReadyWithFewDays() {
        let entries = [
            DailyEntry(date: "2026-05-01", sales: 500_000, customers: 30),
            DailyEntry(date: "2026-05-02", sales: 600_000, customers: 32),
        ]
        let costs = MonthlyCosts(ingredients: 3_000_000, labor: 4_000_000)
        let result = CostRatios.calculate(costs: costs, totalRevenue: 1_100_000, days: 2)
        #expect(result.ready == false)
    }

    @Test("매출 0원 시 ready=false")
    func notReadyWithZeroRevenue() {
        let costs = MonthlyCosts(ingredients: 3_000_000)
        let result = CostRatios.calculate(costs: costs, totalRevenue: 0, days: 10)
        #expect(result.ready == false)
    }

    @Test("정상 케이스 — 일평균 50만원 × 26일 = 월환산 1,300만원")
    func normalCase() {
        // 14일간 일평균 50만원 매출, 비용 1,000만원
        let costs = MonthlyCosts(
            ingredients: 3_000_000,    // ≈ 23%
            labor: 4_000_000,          // ≈ 30.8%
            rent: 1_000_000,           // ≈ 7.7%
            utilities: 500_000,
            sga: 0, marketing: 500_000, other: 500_000, interest: 500_000
        )
        let total = costs.total
        let result = CostRatios.calculate(costs: costs, totalRevenue: 7_000_000, days: 14)

        #expect(result.ready == true)
        #expect(abs(result.monthlyRevenueEquivalent - 13_000_000) < 1)
        // primeCost = (식자재 3M + 인건비 4M) / 13M ≈ 53.8%
        #expect(abs(result.primeCostRatio - (7_000_000.0 / 13_000_000.0 * 100)) < 0.1)
        // costToRevenue
        #expect(abs(result.costToRevenueRatio - (total / 13_000_000.0 * 100)) < 0.1)
    }
}

// MARK: - HealthScore

@Suite("HealthScore.calculate")
struct HealthScoreTests {

    @Test("데이터 부족 시 ready=false + reason 노출")
    func insufficient() {
        let entries: [DailyEntry] = []
        let costs = MonthlyCosts()
        let result = HealthScore.calculate(entries: entries, costs: costs)
        #expect(result.ready == false)
        #expect(result.readinessReason != nil)
    }

    @Test("정상 데이터 — score 가 0-100 범위 + grade 매핑 일치")
    func validRange() {
        let entries = (1...14).map { i in
            DailyEntry(
                date: String(format: "2026-04-%02d", i),
                sales: 500_000 + Double(i) * 10_000,
                customers: 25
            )
        }
        let costs = MonthlyCosts(
            ingredients: 2_500_000,
            labor: 3_000_000,
            rent: 1_000_000
        )
        let result = HealthScore.calculate(
            entries: entries,
            costs: costs,
            category: .restaurant,
            stage: .growth,
            currentCash: 30_000_000
        )

        #expect(result.ready == true)
        #expect(result.score >= 0 && result.score <= 100)
        #expect(result.grade == HealthGrade.from(score: result.score))
    }

    @Test("런웨이 도메인 — 흑자면 healthy")
    func runwayHealthyOnProfit() {
        // 흑자 케이스: 매출 1500만원, 비용 1000만원 → monthly burn 음수
        let entries = (1...14).map { i in
            DailyEntry(
                date: String(format: "2026-04-%02d", i),
                sales: 1_200_000,
                customers: 50
            )
        }
        let costs = MonthlyCosts(ingredients: 2_500_000, labor: 3_000_000, rent: 1_000_000)
        let result = HealthScore.calculate(
            entries: entries,
            costs: costs,
            category: .restaurant,
            currentCash: 10_000_000
        )
        let cash = result.domains[.cash]
        #expect(cash?.grade == .healthy)
    }
}

// MARK: - HeroResolver

@Suite("HeroResolver.resolve")
struct HeroResolverTests {

    @Test("매출 미기록 3일+ → stale-sales hero")
    func staleSales() {
        let input = HeroResolverInput(
            ko: true,
            businessLaunched: true,
            totalEntries: 10,
            daysSinceLastSalesEntry: 5,
            monthlyBurn: 10_000_000
        )
        let hero = HeroResolver.resolve(input)
        #expect(hero.source == .staleSales)
        #expect(hero.tone == .warning)
        #expect(hero.ctaTarget == .sales)
    }

    @Test("Cashflow 위기 → crisis hero")
    func crisis() {
        let input = HeroResolverInput(
            ko: true,
            businessLaunched: true,
            totalEntries: 30,
            daysSinceLastSalesEntry: 0,
            monthlyBurn: 10_000_000,
            cashflowCrisis: CashflowCrisis(daysUntilCrisis: 7, shortfallAmount: 5_000_000)
        )
        let hero = HeroResolver.resolve(input)
        #expect(hero.source == .crisis)
        #expect(hero.tone == .crisis)
        #expect(hero.ctaTarget == .cashflow)
    }

    @Test("AI top action → ctaTarget 키워드 매핑")
    func aiActionTargetMapping() {
        let i1 = HeroResolverInput(
            ko: true, businessLaunched: true, totalEntries: 30,
            daysSinceLastSalesEntry: 0, monthlyBurn: 10_000_000,
            aiTopAction: AiAction(
                title: "재료비 점검",
                reason: "식자재 단가가 올랐어요",
                priority: .high
            )
        )
        #expect(HeroResolver.resolve(i1).ctaTarget == .inventory)

        let i2 = HeroResolverInput(
            ko: true, businessLaunched: true, totalEntries: 30,
            daysSinceLastSalesEntry: 0, monthlyBurn: 10_000_000,
            aiTopAction: AiAction(
                title: "재방문 고객 늘리기",
                reason: "단골이 줄었어요",
                priority: .high
            )
        )
        #expect(HeroResolver.resolve(i2).ctaTarget == .users)
    }

    @Test("입력 없음 → drucker fallback")
    func druckerFallback() {
        let input = HeroResolverInput(
            ko: true,
            businessLaunched: false,
            totalEntries: 0,
            daysSinceLastSalesEntry: nil,
            monthlyBurn: 0
        )
        let hero = HeroResolver.resolve(input)
        #expect(hero.source == .drucker)
        #expect(hero.ctaTarget == .sales)
    }
}
