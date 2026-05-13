//
//  CostStructureCard.swift — 비용 구조 카드 (웹 CostStructureCard.tsx 미러)
//
//  웹 정확 사양:
//   • 4행: 식자재 / 인건비 / 임대료 / 프라임 — 각 게이지 6px height
//   • 업종별 임계값 (KREI 2024) 기준
//   • Apple/Linear 톤
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents

public struct CostStructureCard: View {

    let ingredientRatio: Double
    let laborRatio: Double
    let rentRatio: Double
    let primeCostRatio: Double
    let thresholds: CostRatioThresholds
    let ko: Bool

    public init(
        ingredientRatio: Double,
        laborRatio: Double,
        rentRatio: Double,
        primeCostRatio: Double,
        thresholds: CostRatioThresholds,
        ko: Bool = true
    ) {
        self.ingredientRatio = ingredientRatio
        self.laborRatio = laborRatio
        self.rentRatio = rentRatio
        self.primeCostRatio = primeCostRatio
        self.thresholds = thresholds
        self.ko = ko
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(ko ? "비용 구조" : "Cost Structure")
                        .buSectionEyebrowStyle()
                    Text(ko ? "월 환산 매출 대비 비율" : "Monthly Cost Ratios")
                        .buDetailTitleStyle()
                }

                VStack(spacing: 12) {
                    row(label: ko ? "식자재" : "Materials",
                        ratio: ingredientRatio,
                        threshold: thresholds.ingredients)
                    row(label: ko ? "인건비" : "Labor",
                        ratio: laborRatio,
                        threshold: thresholds.labor)
                    row(label: ko ? "임대료" : "Rent",
                        ratio: rentRatio,
                        threshold: thresholds.rent)
                    if let primeThr = thresholds.primeCost {
                        primeRow(value: primeCostRatio, threshold: primeThr)
                    }
                }
            }
        }
    }

    private func row(label: String, ratio: Double, threshold: KpiThreshold?) -> some View {
        let grade = threshold?.grade(ratio) ?? .unknown
        let target = threshold?.healthy ?? 50
        return VStack(spacing: 5) {
            HStack(spacing: 8) {
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink.opacity(0.75))
                Spacer()
                Text("\(String(format: "%.0f", ratio))%")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(HealthColors.palette(for: grade).text)
                    .monospacedDigit()
                if let t = threshold {
                    Text(" / \(Int(t.healthy))%")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            BUGaugeBar(value: ratio, target: target * 2, grade: grade, height: 6)
        }
    }

    private func primeRow(value: Double, threshold: KpiThreshold) -> some View {
        let grade = threshold.grade(value)
        return VStack(spacing: 5) {
            Divider()
                .padding(.vertical, 2)
                .overlay(BUColor.midnight.opacity(0.05))
            HStack(spacing: 8) {
                HStack(spacing: 4) {
                    Image(systemName: "circle.hexagongrid.fill")
                        .font(.system(size: 11, weight: .bold))
                    Text(ko ? "프라임" : "Prime")
                        .font(.system(size: 13, weight: .bold))
                }
                .foregroundStyle(HealthColors.palette(for: grade).text)
                Spacer()
                Text("\(String(format: "%.0f", value))%")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(HealthColors.palette(for: grade).text)
                    .monospacedDigit()
                Text(" / \(Int(threshold.healthy))%")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            BUGaugeBar(value: value, target: threshold.healthy * 1.5, grade: grade, height: 6)
        }
        .padding(.top, 2)
    }
}

#if DEBUG
#Preview("CostStructure — 외식") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            CostStructureCard(
                ingredientRatio: 36,
                laborRatio: 31,
                rentRatio: 11,
                primeCostRatio: 67,
                thresholds: IndustryThresholds.restaurant
            )
            .padding(BUSpacing.md)
        }
    }
}
#endif
