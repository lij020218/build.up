//
//  CostRatios.swift — 비용 비율 계산 SSOT
//
//  웹 SSOT 거울 — packages/shared/src/finance/cost-ratios.ts.
//  핵심: 일평균 매출 × 26 영업일 = 월 환산 매출 → 비용 비율 계산.
//  부분월 보정 → 매출이 며칠치 밖에 없어도 정확한 비율 추정.
//

import Foundation

// MARK: - CostRatiosResult

public struct CostRatiosResult: Sendable, Hashable {
    /// 전체 비용 / 월 환산 매출 — 종합 비용율
    public let costToRevenueRatio: Double
    /// 식자재 / 월 환산 매출
    public let ingredientRatio: Double
    /// 인건비 / 월 환산 매출
    public let laborRatio: Double
    /// 임대료 / 월 환산 매출
    public let rentRatio: Double
    /// (식자재 + 인건비) / 월 환산 매출 — 프라임 코스트
    public let primeCostRatio: Double
    /// 월 환산 매출 — 일평균 × 26
    public let monthlyRevenueEquivalent: Double
    /// 데이터 충분 여부 — false 면 UI 에 "—" 표시 권장
    public let ready: Bool

    public init(
        costToRevenueRatio: Double,
        ingredientRatio: Double,
        laborRatio: Double,
        rentRatio: Double,
        primeCostRatio: Double,
        monthlyRevenueEquivalent: Double,
        ready: Bool
    ) {
        self.costToRevenueRatio = costToRevenueRatio
        self.ingredientRatio = ingredientRatio
        self.laborRatio = laborRatio
        self.rentRatio = rentRatio
        self.primeCostRatio = primeCostRatio
        self.monthlyRevenueEquivalent = monthlyRevenueEquivalent
        self.ready = ready
    }

    public static let empty = CostRatiosResult(
        costToRevenueRatio: 0,
        ingredientRatio: 0,
        laborRatio: 0,
        rentRatio: 0,
        primeCostRatio: 0,
        monthlyRevenueEquivalent: 0,
        ready: false
    )
}

// MARK: - CostRatios

public enum CostRatios {

    /// 비용 비율 계산 (웹 calculateCostRatios 거울).
    ///
    /// - Parameters:
    ///   - costs: 월 비용 구조
    ///   - totalRevenue: 기간 내 누적 매출
    ///   - days: 기간 일수 (entries.count)
    /// - Returns: 비율 결과. days < 7 또는 매출 표본 부족 시 ready=false.
    public static func calculate(
        costs: MonthlyCosts,
        totalRevenue: Double,
        days: Int
    ) -> CostRatiosResult {

        // 데이터 충분성 게이트 — 최소 7일 + 양의 매출
        let hasMinDays = days >= 7
        let hasRevenue = totalRevenue > 0
        let totalCosts = costs.total

        guard hasMinDays, hasRevenue, totalCosts > 0 else {
            return .empty
        }

        // 월 환산 매출 — 일평균 × 26 영업일 (외식·소매 표준)
        //   부분월 (예: 2주만 입력) 도 일평균 기준으로 정확한 % 산출
        let dailyAvg = totalRevenue / Double(days)
        let monthlyRevenueEquiv = dailyAvg * 26

        guard monthlyRevenueEquiv > 0 else { return .empty }

        return CostRatiosResult(
            costToRevenueRatio: (totalCosts / monthlyRevenueEquiv) * 100,
            ingredientRatio:    (costs.ingredients / monthlyRevenueEquiv) * 100,
            laborRatio:         (costs.labor / monthlyRevenueEquiv) * 100,
            rentRatio:          (costs.rent / monthlyRevenueEquiv) * 100,
            primeCostRatio:     ((costs.ingredients + costs.labor) / monthlyRevenueEquiv) * 100,
            monthlyRevenueEquivalent: monthlyRevenueEquiv,
            ready: true
        )
    }
}

// MARK: - DailyAverage (sparse 데이터 보정)

public enum DailyAverage {

    public struct Result: Sendable {
        public let avg: Double
        public let denominator: Int
        public let sumValue: Double
        public let sparse: Bool
    }

    /// 정직한 일평균 — 분모 = MAX(entry 개수, 경과 일수).
    /// 웹 honestDailyAverage 거울 — sparse 입력으로 평균 폭주 방지.
    ///
    /// 예: 14일 윈도우 중 entry 가 3일 밖에 없으면 분모 = 14 (entry 수 3 보다 큼).
    public static func honest(
        _ entries: [DailyEntry],
        selector: (DailyEntry) -> Double = { $0.sales }
    ) -> Result {
        let entryCount = entries.filter { selector($0) > 0 }.count
        let elapsed = calendarElapsedDays(entries)
        let denominator = max(entryCount, elapsed, 1)
        let sumValue = entries.reduce(0) { $0 + selector($1) }
        let avg = sumValue / Double(denominator)
        let sparse = entryCount < elapsed / 2
        return Result(
            avg: avg,
            denominator: denominator,
            sumValue: sumValue,
            sparse: sparse
        )
    }

    /// entries 의 가장 빠른 / 늦은 날짜 사이 경과 일수 (calendar 기반).
    private static func calendarElapsedDays(_ entries: [DailyEntry]) -> Int {
        guard !entries.isEmpty else { return 0 }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]

        let dates = entries.compactMap { entry -> Date? in
            // "yyyy-MM-dd" 파싱 — ISO8601 with date only
            let trimmed = entry.date.trimmingCharacters(in: .whitespaces)
            if let d = formatter.date(from: trimmed) { return d }
            // Fallback: DateFormatter
            let df = DateFormatter()
            df.dateFormat = "yyyy-MM-dd"
            df.timeZone = TimeZone(identifier: "Asia/Seoul")
            return df.date(from: trimmed)
        }
        guard let first = dates.min(), let last = dates.max() else { return 0 }
        let cal = Calendar(identifier: .gregorian)
        let components = cal.dateComponents([.day], from: first, to: last)
        return (components.day ?? 0) + 1  // 양쪽 inclusive
    }
}
