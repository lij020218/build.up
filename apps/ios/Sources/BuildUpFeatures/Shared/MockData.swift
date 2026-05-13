//
//  MockData.swift — Preview / 데모용 mock 데이터
//
//  실제 Supabase 연동 전 사장님 화면 시각 검증용. 3가지 시나리오:
//   • healthy:   안정 운영, 위험 없음 → Drucker hero
//   • warning:   비용 급증, 매출 정체 → anomaly hero
//   • critical:  현금 부족 7일, 매출 미기록 5일 → crisis hero
//

import Foundation
import BuildUpCore

public enum MockScenario: String, CaseIterable, Sendable {
    case healthy   = "안정 운영"
    case warning   = "주의 신호"
    case critical  = "긴급 위기"
    case staleSales = "매출 미기록"
    case empty     = "첫 진입"
}

public struct MockData: Sendable {

    public let entries: [DailyEntry]
    public let costs: MonthlyCosts
    public let category: IndustryCategory
    public let stage: HealthScore.BusinessMaturity
    public let currentCash: Double?
    public let storeName: String
    public let daysSinceLaunch: Int
    public let userName: String
    public let resolverInput: HeroResolverInput

    public static func scenario(_ kind: MockScenario) -> MockData {
        switch kind {
        case .healthy:    return .healthyRestaurant
        case .warning:    return .warningCafe
        case .critical:   return .criticalSaaS
        case .staleSales: return .staleSalesRestaurant
        case .empty:      return .empty
        }
    }
}

// MARK: - Scenarios

extension MockData {

    /// 시나리오 1 — 안정 운영 (외식, 일평균 50만원 흑자, 14일 데이터)
    public static let healthyRestaurant: MockData = {
        let entries = makeEntries(
            startDate: "2026-04-29",
            days: 14,
            baseRevenue: 800_000,
            growth: 0.05
        )
        let costs = MonthlyCosts(
            ingredients: 5_500_000,
            labor: 4_500_000,
            rent: 1_200_000,
            utilities: 400_000,
            sga: 200_000,
            marketing: 300_000,
            other: 100_000
        )
        return MockData(
            entries: entries,
            costs: costs,
            category: .restaurant,
            stage: .growth,
            currentCash: 35_000_000,
            storeName: "성심당 본점",
            daysSinceLaunch: 247,
            userName: "김사장",
            resolverInput: HeroResolverInput(
                ko: true,
                businessLaunched: true,
                totalEntries: 14,
                daysSinceLastSalesEntry: 0,
                monthlyBurn: 12_200_000,
                aiTopAction: AiAction(
                    title: "단골 재방문 캠페인",
                    reason: "최근 2주 신규 고객은 늘었지만 재방문이 정체. 카카오 채널 메시지로 마지막 방문 30일+ 고객에게 쿠폰 발송 추천.",
                    priority: .medium,
                    referencedCase: Hero.ReferencedCase(id: "kakao-hairshop", name: "카카오헤어샵")
                )
            )
        )
    }()

    /// 시나리오 2 — 주의 신호 (카페, 매출 정체 + 재료비 급증)
    public static let warningCafe: MockData = {
        let entries = makeEntries(
            startDate: "2026-04-29",
            days: 14,
            baseRevenue: 600_000,
            growth: -0.08
        )
        let costs = MonthlyCosts(
            ingredients: 5_500_000,  // 35% — 카페 표준 28% 대비 ↑
            labor: 4_800_000,        // 30%
            rent: 1_800_000,
            utilities: 500_000,
            sga: 100_000,
            marketing: 200_000,
            other: 100_000
        )
        return MockData(
            entries: entries,
            costs: costs,
            category: .cafe,
            stage: .growth,
            currentCash: 18_000_000,
            storeName: "라떼 컴퍼니",
            daysSinceLaunch: 156,
            userName: "이사장",
            resolverInput: HeroResolverInput(
                ko: true,
                businessLaunched: true,
                totalEntries: 14,
                daysSinceLastSalesEntry: 0,
                monthlyBurn: 13_000_000,
                topAnomaly: Anomaly(
                    severity: .warning,
                    kind: .costSpike,
                    headline: "재료비 비율 35% — 카페 평균 28% 대비 +7%p",
                    analysis: "지난 4주 원두 매입 단가가 18% 올랐어요. 같은 매출이라도 마진이 줄고 있습니다.",
                    action: "다른 원두 공급처 견적 받아보기 — 우유·시럽 단가도 함께 점검 권장"
                )
            )
        )
    }()

    /// 시나리오 3 — 긴급 위기 (스타트업, 현금 7일 후 부족 + 번레이트 ↑)
    public static let criticalSaaS: MockData = {
        let entries = makeEntries(
            startDate: "2026-04-29",
            days: 14,
            baseRevenue: 320_000,   // SaaS — 매출 작지만 MRR 누적
            growth: 0.02
        )
        let costs = MonthlyCosts(
            ingredients: 0,
            labor: 18_000_000,         // SaaS — 인건비 대부분
            rent: 800_000,
            utilities: 200_000,
            sga: 1_500_000,
            marketing: 3_000_000,
            other: 500_000
        )
        return MockData(
            entries: entries,
            costs: costs,
            category: .startupTech,
            stage: .early,
            currentCash: 8_000_000,
            storeName: "Sample SaaS",
            daysSinceLaunch: 92,
            userName: "박대표",
            resolverInput: HeroResolverInput(
                ko: true,
                businessLaunched: true,
                totalEntries: 14,
                daysSinceLastSalesEntry: 0,
                monthlyBurn: 24_000_000,
                cashflowCrisis: CashflowCrisis(
                    daysUntilCrisis: 7,
                    shortfallAmount: 6_500_000
                )
            )
        )
    }()

    /// 시나리오 4 — 매출 미기록 5일 (stale-sales hero)
    public static let staleSalesRestaurant: MockData = {
        let entries = makeEntries(
            startDate: "2026-04-20",
            days: 8,
            baseRevenue: 700_000,
            growth: 0
        )
        let costs = MonthlyCosts(
            ingredients: 4_000_000,
            labor: 4_000_000,
            rent: 1_000_000
        )
        return MockData(
            entries: entries,
            costs: costs,
            category: .restaurant,
            stage: .growth,
            currentCash: 12_000_000,
            storeName: "맛집",
            daysSinceLaunch: 88,
            userName: "최사장",
            resolverInput: HeroResolverInput(
                ko: true,
                businessLaunched: true,
                totalEntries: 8,
                daysSinceLastSalesEntry: 5,
                monthlyBurn: 9_000_000
            )
        )
    }()

    /// 시나리오 5 — 첫 진입 (데이터 0건, drucker)
    public static let empty: MockData = MockData(
        entries: [],
        costs: MonthlyCosts(),
        category: .restaurant,
        stage: .early,
        currentCash: nil,
        storeName: "내 가게",
        daysSinceLaunch: 0,
        userName: "사장님",
        resolverInput: HeroResolverInput(
            ko: true,
            businessLaunched: false,
            totalEntries: 0,
            daysSinceLastSalesEntry: nil,
            monthlyBurn: 0
        )
    )
}

// MARK: - Helpers

private func makeEntries(
    startDate: String,
    days: Int,
    baseRevenue: Double,
    growth: Double
) -> [DailyEntry] {
    let df = DateFormatter()
    df.dateFormat = "yyyy-MM-dd"
    df.timeZone = TimeZone(identifier: "Asia/Seoul")
    guard let start = df.date(from: startDate) else { return [] }
    let cal = Calendar(identifier: .gregorian)

    return (0..<days).compactMap { i -> DailyEntry? in
        guard let date = cal.date(byAdding: .day, value: i, to: start) else { return nil }
        let dateStr = df.string(from: date)
        // 약간의 무작위 변동 + 추세
        let noise = Double.random(in: -0.1...0.1)
        let trend = 1.0 + Double(i) * (growth / Double(days))
        let sales = baseRevenue * trend * (1.0 + noise)
        let customers = Int(round(sales / 25_000))  // 평균 객단가 2.5만원 가정
        return DailyEntry(
            date: dateStr,
            sales: max(0, sales),
            customers: max(0, customers)
        )
    }
}
