//
//  HealthScore.swift — 통합 건강도 점수 (Unified Health Score)
//
//  웹 SSOT 거울 — packages/shared/src/finance/unified-health.ts의
//  calculateUnifiedHealthScore 4도메인 가중합 알고리즘.
//
//  4 도메인:
//   • cash       — 현금 흐름 (런웨이, 일평균 burn)
//   • profit     — 수익성 (영업이익률, BEP 달성률)
//   • efficiency — 비용 효율 (원가율, 재료비/인건비 비율)
//   • growth     — 성장 (WoW, MoM)
//
//  데이터 충분성 게이트 — days ≥ 7 + 매출 + 비용 모두 필요. 부족 시 ready=false.
//
//  단순화 노트: 웹 SSOT 는 ~600줄로 더 정밀 (deliverySales, defaultAlive, missingDomains 등).
//   본 Swift 미러는 MVP 핵심 로직만 — 같은 cutoff, 같은 도메인 가중치.
//

import Foundation

// MARK: - DomainComponent (도메인 내 단일 KPI 점수)

public struct DomainComponent: Sendable, Hashable {
    public let name: String
    public let value: Double
    public let score: Double
    public let weight: Double
    public let grade: HealthGrade

    public init(name: String, value: Double, score: Double, weight: Double, grade: HealthGrade) {
        self.name = name
        self.value = value
        self.score = score
        self.weight = weight
        self.grade = grade
    }
}

// MARK: - DomainScore (도메인 별 점수 + 구성 KPI)

public struct DomainScore: Sendable, Hashable {
    public let score: Double          // 0~100 (NaN 가능)
    public let grade: HealthGrade
    public let components: [DomainComponent]
    public let missingCount: Int
    public let totalCount: Int

    public init(
        score: Double,
        grade: HealthGrade,
        components: [DomainComponent],
        missingCount: Int,
        totalCount: Int
    ) {
        self.score = score
        self.grade = grade
        self.components = components
        self.missingCount = missingCount
        self.totalCount = totalCount
    }

    public static let unknown = DomainScore(
        score: .nan,
        grade: .unknown,
        components: [],
        missingCount: 0,
        totalCount: 0
    )
}

// MARK: - UnifiedHealthResult (calculateUnifiedHealthScore 결과)

public struct UnifiedHealthResult: Sendable {
    public let score: Double                              // 0~100
    public let grade: HealthGrade
    public let domains: [DomainKey: DomainScore]
    public let weights: [DomainKey: Double]
    public let missingDomains: [DomainKey]                // 가중치 0 된 영역
    public let ready: Bool                                // UI 노출 가능 여부
    public let readinessReason: String?                   // ready=false 시 사유

    public init(
        score: Double,
        grade: HealthGrade,
        domains: [DomainKey: DomainScore],
        weights: [DomainKey: Double],
        missingDomains: [DomainKey],
        ready: Bool,
        readinessReason: String?
    ) {
        self.score = score
        self.grade = grade
        self.domains = domains
        self.weights = weights
        self.missingDomains = missingDomains
        self.ready = ready
        self.readinessReason = readinessReason
    }
}

// MARK: - HealthScore (메인 계산 진입점)

public enum HealthScore {

    /// 도메인 기본 가중치 (웹 SSOT 거울). 모두 합 1.0.
    public static let defaultWeights: [DomainKey: Double] = [
        .cash:       0.35,
        .profit:     0.30,
        .efficiency: 0.20,
        .growth:     0.15,
    ]

    /// 단계별 가중치 — early (생존 우선) / growth (균형) / mature (효율 우선)
    public static let stageWeights: [BusinessMaturity: [DomainKey: Double]] = [
        .early:  [.cash: 0.50, .profit: 0.20, .efficiency: 0.10, .growth: 0.20],
        .growth: [.cash: 0.35, .profit: 0.30, .efficiency: 0.20, .growth: 0.15],
        .mature: [.cash: 0.20, .profit: 0.35, .efficiency: 0.30, .growth: 0.15],
    ]

    public enum BusinessMaturity: Sendable {
        case early, growth, mature
    }

    /// 통합 건강도 계산 — MVP 단순화 버전.
    ///
    /// - Parameters:
    ///   - entries: 매출 일별 entries
    ///   - costs: 월 비용 구조
    ///   - category: 업종
    ///   - stage: 사업 단계 (early/growth/mature)
    ///   - currentCash: 현재 현금 잔고 (옵션, 런웨이 계산용)
    public static func calculate(
        entries: [DailyEntry],
        costs: MonthlyCosts,
        category: IndustryCategory = .general,
        stage: BusinessMaturity = .growth,
        currentCash: Double? = nil
    ) -> UnifiedHealthResult {

        let weights = stageWeights[stage] ?? defaultWeights
        let totalCosts = costs.total
        let totalRevenue = entries.reduce(0) { $0 + $1.sales }
        let days = entries.count

        // 데이터 충분성 게이트
        let hasRevenue = totalRevenue > 0
        let hasCosts = totalCosts > 0
        let hasEnoughDays = days >= 7

        guard hasRevenue, hasCosts, hasEnoughDays else {
            return UnifiedHealthResult(
                score: .nan,
                grade: .unknown,
                domains: Dictionary(uniqueKeysWithValues: DomainKey.allCases.map { ($0, .unknown) }),
                weights: weights,
                missingDomains: DomainKey.allCases,
                ready: false,
                readinessReason: !hasEnoughDays
                    ? "최소 7일 매출 기록 필요"
                    : !hasRevenue ? "매출 데이터 없음"
                    : "비용 데이터 없음"
            )
        }

        // 비용 비율 계산
        let ratios = CostRatios.calculate(costs: costs, totalRevenue: totalRevenue, days: days)
        let monthlyRev = ratios.monthlyRevenueEquivalent
        let monthlyBurn = totalCosts - monthlyRev

        // 도메인별 점수 계산
        let thresholds = IndustryThresholds.thresholds(for: category)
        var domains: [DomainKey: DomainScore] = [:]

        // 1. Cash domain — 런웨이 + 일평균 burn 등
        domains[.cash] = computeCashDomain(
            currentCash: currentCash,
            monthlyBurn: monthlyBurn
        )

        // 2. Profit domain — 영업이익률 + BEP 달성률
        domains[.profit] = computeProfitDomain(
            totalRevenue: totalRevenue,
            totalCosts: totalCosts,
            monthlyRev: monthlyRev,
            monthlyCostsTotal: totalCosts
        )

        // 3. Efficiency domain — 원가율 + 식자재/인건비 비율
        domains[.efficiency] = computeEfficiencyDomain(
            ratios: ratios,
            thresholds: thresholds
        )

        // 4. Growth domain — 최근 7일 vs 이전 7일 매출 변화
        domains[.growth] = computeGrowthDomain(entries: entries)

        // 미존재 도메인 + 가중치 재정규화
        let missing = domains.filter { $0.value.grade == .unknown }.map { $0.key }
        let effectiveWeights = renormalize(weights: weights, missing: missing)

        // 가중합 → 0~100 점수
        let weightedSum = domains.reduce(0.0) { acc, pair in
            guard let w = effectiveWeights[pair.key], pair.value.score.isFinite else { return acc }
            return acc + (pair.value.score * w)
        }

        return UnifiedHealthResult(
            score: weightedSum,
            grade: HealthGrade.from(score: weightedSum),
            domains: domains,
            weights: effectiveWeights,
            missingDomains: missing,
            ready: true,
            readinessReason: nil
        )
    }

    // MARK: - Domain computations

    private static func computeCashDomain(
        currentCash: Double?,
        monthlyBurn: Double
    ) -> DomainScore {
        guard let cash = currentCash, cash > 0 else { return .unknown }
        guard monthlyBurn > 0 else {
            // 흑자 = 무한 런웨이 — 만점
            return DomainScore(
                score: 100,
                grade: .healthy,
                components: [
                    DomainComponent(name: "런웨이", value: .infinity, score: 100, weight: 1.0, grade: .healthy)
                ],
                missingCount: 0,
                totalCount: 1
            )
        }
        let runwayMonths = cash / monthlyBurn
        // 런웨이 12개월+ = healthy (100점), 6개월 caution (60), 3개월 warning (35), 미만 critical
        let runwayScore: Double
        if runwayMonths >= 12 { runwayScore = 100 }
        else if runwayMonths >= 6 { runwayScore = 60 + (runwayMonths - 6) * 6.67 } // 60-100
        else if runwayMonths >= 3 { runwayScore = 35 + (runwayMonths - 3) * 8.33 } // 35-60
        else if runwayMonths >= 0 { runwayScore = max(0, runwayMonths * 11.67) }   // 0-35
        else { runwayScore = 0 }

        return DomainScore(
            score: runwayScore,
            grade: HealthGrade.from(score: runwayScore),
            components: [
                DomainComponent(
                    name: "런웨이",
                    value: runwayMonths,
                    score: runwayScore,
                    weight: 1.0,
                    grade: HealthGrade.from(score: runwayScore)
                )
            ],
            missingCount: 0,
            totalCount: 1
        )
    }

    private static func computeProfitDomain(
        totalRevenue: Double,
        totalCosts: Double,
        monthlyRev: Double,
        monthlyCostsTotal: Double
    ) -> DomainScore {
        // 영업이익률 — (월 환산 매출 - 월 비용) / 월 환산 매출
        let netProfit = monthlyRev - monthlyCostsTotal
        let marginPct = monthlyRev > 0 ? (netProfit / monthlyRev) * 100 : 0

        // 외식업 표준: 10%+ healthy / 5%+ caution / 0%+ warning / 적자 critical
        let marginScore: Double
        if marginPct >= 10 { marginScore = 75 + min(25, (marginPct - 10) * 1.25) }  // 75-100
        else if marginPct >= 5 { marginScore = 55 + (marginPct - 5) * 4 }           // 55-75
        else if marginPct >= 0 { marginScore = 35 + marginPct * 4 }                 // 35-55
        else { marginScore = max(0, 35 + marginPct * 3.5) }                         // 0-35

        return DomainScore(
            score: marginScore,
            grade: HealthGrade.from(score: marginScore),
            components: [
                DomainComponent(
                    name: "영업이익률",
                    value: marginPct,
                    score: marginScore,
                    weight: 1.0,
                    grade: HealthGrade.from(score: marginScore)
                )
            ],
            missingCount: 0,
            totalCount: 1
        )
    }

    private static func computeEfficiencyDomain(
        ratios: CostRatiosResult,
        thresholds: CostRatioThresholds
    ) -> DomainScore {
        guard ratios.ready else { return .unknown }

        var components: [DomainComponent] = []

        // 원가율 (Prime cost)
        if let primeThr = thresholds.primeCost {
            let grade = primeThr.grade(ratios.primeCostRatio)
            let score = scoreFromGrade(grade)
            components.append(DomainComponent(
                name: "원가율",
                value: ratios.primeCostRatio,
                score: score,
                weight: 0.5,
                grade: grade
            ))
        }
        // 식자재 비율
        if let ingThr = thresholds.ingredients {
            let grade = ingThr.grade(ratios.ingredientRatio)
            let score = scoreFromGrade(grade)
            components.append(DomainComponent(
                name: "식자재 비율",
                value: ratios.ingredientRatio,
                score: score,
                weight: 0.3,
                grade: grade
            ))
        }
        // 인건비 비율
        if let laborThr = thresholds.labor {
            let grade = laborThr.grade(ratios.laborRatio)
            let score = scoreFromGrade(grade)
            components.append(DomainComponent(
                name: "인건비 비율",
                value: ratios.laborRatio,
                score: score,
                weight: 0.2,
                grade: grade
            ))
        }

        guard !components.isEmpty else { return .unknown }

        let weightSum = components.reduce(0) { $0 + $1.weight }
        let weighted = components.reduce(0.0) { $0 + ($1.score * $1.weight) }
        let avgScore = weightSum > 0 ? weighted / weightSum : 0

        return DomainScore(
            score: avgScore,
            grade: HealthGrade.from(score: avgScore),
            components: components,
            missingCount: 0,
            totalCount: components.count
        )
    }

    private static func computeGrowthDomain(entries: [DailyEntry]) -> DomainScore {
        guard entries.count >= 14 else { return .unknown }

        let sorted = entries.sorted { $0.date < $1.date }
        let recent7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
        let prior7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }

        guard prior7 > 0 else { return .unknown }

        let changePct = ((recent7 - prior7) / prior7) * 100

        // +20% 이상 healthy, +5%+ caution, -5%+ warning, 그 이하 critical
        let score: Double
        if changePct >= 20 { score = 90 }
        else if changePct >= 5 { score = 60 + (changePct - 5) * 2 }
        else if changePct >= -5 { score = 40 + (changePct + 5) * 2 }
        else if changePct >= -20 { score = 20 + (changePct + 20) * 1.33 }
        else { score = 0 }

        return DomainScore(
            score: score,
            grade: HealthGrade.from(score: score),
            components: [
                DomainComponent(
                    name: "주간 성장",
                    value: changePct,
                    score: score,
                    weight: 1.0,
                    grade: HealthGrade.from(score: score)
                )
            ],
            missingCount: 0,
            totalCount: 1
        )
    }

    // MARK: - Helpers

    private static func scoreFromGrade(_ grade: HealthGrade) -> Double {
        switch grade {
        case .healthy:  return 87.5  // 75-100 midpoint
        case .caution:  return 65    // 55-74 midpoint
        case .warning:  return 45    // 35-54 midpoint
        case .critical: return 17.5  // 0-34 midpoint
        case .unknown:  return .nan
        }
    }

    private static func renormalize(
        weights: [DomainKey: Double],
        missing: [DomainKey]
    ) -> [DomainKey: Double] {
        guard !missing.isEmpty else { return weights }
        let missingSet = Set(missing)
        let presentWeightSum = weights.reduce(0.0) {
            missingSet.contains($1.key) ? $0 : $0 + $1.value
        }
        guard presentWeightSum > 0 else { return weights }
        return weights.mapValues { w in
            // 미존재 도메인의 가중치는 0, 나머지는 비례 재정규화
            // (간단화: 모든 키에 동일 비율 적용)
            w / presentWeightSum
        }.filter { !missingSet.contains($0.key) }
    }
}
