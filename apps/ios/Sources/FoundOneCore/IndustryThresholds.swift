//
//  IndustryThresholds.swift — 업종별 비용 비율 임계값
//
//  웹 SSOT 거울 — packages/shared/src/finance/unified-health.ts 의 COST_RATIO_THRESHOLDS.
//  출처: KREI 2024 외식업체 경영실태조사 + 업계 표준.
//
//  ⚠️ 모든 값은 % (백분율). 변경 시 두 곳 동시 업데이트.
//

import Foundation

// MARK: - KpiThreshold (단일 KPI 의 3단계 컷오프)

public struct KpiThreshold: Sendable, Hashable {
    public let healthy: Double
    public let caution: Double
    public let warning: Double
    public let direction: Direction
    public let unit: Unit
    public let source: String

    public enum Direction: Sendable {
        case lowerIsBetter   // 작을수록 건강 (비용 비율 등)
        case higherIsBetter  // 클수록 건강 (마진, 런웨이 등)
    }

    public enum Unit: Sendable {
        case percent
        case months
        case ratio
        case currencyKrw
        case count
    }

    public init(
        healthy: Double,
        caution: Double,
        warning: Double,
        direction: Direction,
        unit: Unit,
        source: String
    ) {
        self.healthy = healthy
        self.caution = caution
        self.warning = warning
        self.direction = direction
        self.unit = unit
        self.source = source
    }

    /// 값 → 등급 (웹 gradeKpi 거울)
    public func grade(_ value: Double) -> HealthGrade {
        guard value.isFinite else { return .unknown }
        switch direction {
        case .lowerIsBetter:
            if value <= healthy { return .healthy }
            if value <= caution { return .caution }
            if value <= warning { return .warning }
            return .critical
        case .higherIsBetter:
            if value >= healthy { return .healthy }
            if value >= caution { return .caution }
            if value >= warning { return .warning }
            return .critical
        }
    }
}

// MARK: - 업종별 비용 비율 임계값

public struct CostRatioThresholds: Sendable {
    public let ingredients: KpiThreshold?
    public let labor: KpiThreshold?
    public let rent: KpiThreshold?
    public let primeCost: KpiThreshold?

    public init(
        ingredients: KpiThreshold? = nil,
        labor: KpiThreshold? = nil,
        rent: KpiThreshold? = nil,
        primeCost: KpiThreshold? = nil
    ) {
        self.ingredients = ingredients
        self.labor = labor
        self.rent = rent
        self.primeCost = primeCost
    }
}

// MARK: - COST_RATIO_THRESHOLDS lookup (웹 SSOT 거울)

public enum IndustryThresholds {

    /// 외식업 — KREI 2024 외식업체 경영실태조사
    /// 평균: 식재료 40.7-44.5% / 인건비 33.9% / 임차료 8.4% / 영업이익률 8.7%
    public static let restaurant = CostRatioThresholds(
        ingredients: KpiThreshold(
            healthy: 35, caution: 40, warning: 45,
            direction: .lowerIsBetter, unit: .percent,
            source: "KREI 2024 + 글로벌 외식업 표준 (35%)"
        ),
        labor: KpiThreshold(
            healthy: 25, caution: 33, warning: 40,
            direction: .lowerIsBetter, unit: .percent,
            source: "KREI 2024 (평균 33.9%) + 외식업 표준 25-30%"
        ),
        rent: KpiThreshold(
            healthy: 8, caution: 12, warning: 15,
            direction: .lowerIsBetter, unit: .percent,
            source: "KREI 2024 (평균 8.4%) + 외식업 표준 8-10%"
        ),
        primeCost: KpiThreshold(
            healthy: 65, caution: 70, warning: 75,
            direction: .lowerIsBetter, unit: .percent,
            source: "글로벌 외식업 황금률 65% (식재료+인건비 합)"
        )
    )

    /// 카페·디저트·베이커리 — 식재료 비율 낮고 인건비 비율 높음 (라떼 등)
    public static let cafe = CostRatioThresholds(
        ingredients: KpiThreshold(
            healthy: 28, caution: 33, warning: 40,
            direction: .lowerIsBetter, unit: .percent,
            source: "카페 업계 표준 (커피 원두 28-32%)"
        ),
        labor: KpiThreshold(
            healthy: 28, caution: 35, warning: 42,
            direction: .lowerIsBetter, unit: .percent,
            source: "카페 업계 표준 (바리스타 인건비 28-32%)"
        ),
        rent: KpiThreshold(
            healthy: 10, caution: 15, warning: 20,
            direction: .lowerIsBetter, unit: .percent,
            source: "상권 카페 임차료 평균 10-15%"
        ),
        primeCost: KpiThreshold(
            healthy: 60, caution: 65, warning: 72,
            direction: .lowerIsBetter, unit: .percent,
            source: "카페 황금률 (외식 황금률 65% 보다 5%p 보수적)"
        )
    )

    /// 미용·살롱
    public static let beauty = CostRatioThresholds(
        labor: KpiThreshold(
            healthy: 45, caution: 55, warning: 65,
            direction: .lowerIsBetter, unit: .percent,
            source: "미용업 표준 (디자이너 비율 45-55%)"
        ),
        rent: KpiThreshold(
            healthy: 12, caution: 18, warning: 25,
            direction: .lowerIsBetter, unit: .percent,
            source: "미용실 임차료 표준"
        )
    )

    /// 일반 (보수적 기본값)
    public static let general = CostRatioThresholds(
        ingredients: KpiThreshold(
            healthy: 35, caution: 45, warning: 55,
            direction: .lowerIsBetter, unit: .percent,
            source: "일반 업종 보수적 기준"
        ),
        labor: KpiThreshold(
            healthy: 30, caution: 40, warning: 50,
            direction: .lowerIsBetter, unit: .percent,
            source: "일반 업종 보수적 기준"
        ),
        rent: KpiThreshold(
            healthy: 10, caution: 15, warning: 20,
            direction: .lowerIsBetter, unit: .percent,
            source: "일반 업종 보수적 기준"
        )
    )

    /// 업종 → 임계값 lookup
    public static func thresholds(for category: IndustryCategory) -> CostRatioThresholds {
        switch category {
        case .restaurant:    return restaurant
        case .cafe:          return cafe
        case .beauty:        return beauty
        case .retail, .pet, .fitness, .education,
             .livingService, .space:
            return general
        case .ecommerce, .startupTech, .general:
            return general
        }
    }
}
