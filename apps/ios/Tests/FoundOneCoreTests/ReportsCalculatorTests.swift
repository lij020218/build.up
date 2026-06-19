//
//  ReportsCalculatorTests.swift — 리포트 계산 단위 테스트 (날짜 주입으로 날짜비의존화)
//
//  핵심 잠금: 프라임코스트 = (재료+인건비) / **매출** (외식 표준·SSOT cost-ratios.ts·웹 useReportSnapshot).
//  2026-06-16 fix(종전 /총비용 비표준) 회귀 방지. compute(today:) 주입으로 실행 시점과 무관하게 결정적.
//

import Testing
import Foundation
@testable import FoundOneCore

@Suite("ReportsCalculator.compute — 프라임코스트(매출 기준) + 기간 비용배수")
struct ReportsCalculatorPrimeTests {

    // Asia/Seoul 고정 (ReportsCalculator 내부 calendar/isoFormatter 와 동일 TZ)
    private static func kstDate(_ y: Int, _ m: Int, _ d: Int, _ h: Int = 12) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul")!
        return cal.date(from: DateComponents(year: y, month: m, day: d, hour: h))!
    }

    // 3개월 각 1건 1,000만원 (분기 합 3,000만) · 비용: 재료 200만 + 인건비 150만 (prime 분자=350만) + 임대 100만
    private static let entries = [
        DailyEntry(date: "2026-04-10", sales: 10_000_000, customers: 100),
        DailyEntry(date: "2026-05-10", sales: 10_000_000, customers: 100),
        DailyEntry(date: "2026-06-10", sales: 10_000_000, customers: 100),
    ]
    private static let costs = MonthlyCosts(ingredients: 2_000_000, labor: 1_500_000, rent: 1_000_000)
    private static let today = kstDate(2026, 6, 15)

    @Test("월(month): 이번 달 매출 1,000만 · 프라임 = 350만/1,000만 = 35% (총비용 기준 77.8% 아님)")
    func monthPrime() {
        let r = ReportsCalculator.compute(period: .month, entries: Self.entries, costs: Self.costs, today: Self.today)
        #expect(r.heroValueWon == 10_000_000)
        #expect(abs(r.kpiPrimeRatePercent - 35.0) < 0.01)
        // 총비용(450만) 기준이었다면 77.8% — 그 회귀를 명확히 배제
        #expect(r.kpiPrimeRatePercent < 50)
        #expect(r.kpiCostWon == 4_500_000) // month costMultiplier = 1.0
    }

    @Test("분기(quarter): 매출 3,000만 · 비용배수 3 · 프라임 = (350만×3)/3,000만 = 35%")
    func quarterPrime() {
        let r = ReportsCalculator.compute(period: .quarter, entries: Self.entries, costs: Self.costs, today: Self.today)
        #expect(r.heroValueWon == 30_000_000)
        #expect(abs(r.kpiPrimeRatePercent - 35.0) < 0.01)
        #expect(r.kpiCostWon == 13_500_000) // quarter costMultiplier = 3.0
    }

    @Test("매출 0 → 프라임 0 (0 나눗셈 가드)")
    func zeroSalesGuard() {
        let r = ReportsCalculator.compute(period: .month, entries: [], costs: Self.costs, today: Self.today)
        #expect(r.heroValueWon == 0)
        #expect(r.kpiPrimeRatePercent == 0)
    }
}
