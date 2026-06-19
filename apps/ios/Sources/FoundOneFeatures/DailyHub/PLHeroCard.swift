//
//  PLHeroCard.swift — 손익 분석 카드 (웹 PLHeroCard.tsx 미러)
//
//  웹 정확 사양:
//   • opsCard: radius 20 / padding 22 / dual shadow
//   • Header: 월 + "손익" + 위험도 dot
//   • Hero metric: MTD 매출 / 비용 / 순익 (3개 큰 숫자)
//   • Ratios: 재료비 / 인건비 / 임대료 — 각 게이지 6px height
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

// MARK: - PLHeroCard

public struct PLHeroCard: View {

    let totalSales: Double
    let totalCosts: Double
    let ingredientRatio: Double   // %
    let laborRatio: Double        // %
    let rentRatio: Double         // %
    let thresholds: CostRatioThresholds
    /// 웹-canonical categoryId (벤치마크 텍스트 그룹·라벨 해석용). nil 이면 벤치마크 줄 미표시.
    let categoryId: String?
    let ko: Bool

    public init(
        totalSales: Double,
        totalCosts: Double,
        ingredientRatio: Double,
        laborRatio: Double,
        rentRatio: Double,
        thresholds: CostRatioThresholds,
        categoryId: String? = nil,
        ko: Bool = true
    ) {
        self.totalSales = totalSales
        self.totalCosts = totalCosts
        self.ingredientRatio = ingredientRatio
        self.laborRatio = laborRatio
        self.rentRatio = rentRatio
        self.thresholds = thresholds
        self.categoryId = categoryId
        self.ko = ko
    }

    private var netProfit: Double { totalSales - totalCosts }
    private var marginPct: Double {
        totalSales > 0 ? (netProfit / totalSales) * 100 : 0
    }

    private var hasDanger: Bool {
        let ingDanger = (thresholds.ingredients?.grade(ingredientRatio) ?? .healthy) == .warning ||
                        (thresholds.ingredients?.grade(ingredientRatio) ?? .healthy) == .critical
        let laborDanger = (thresholds.labor?.grade(laborRatio) ?? .healthy) == .warning ||
                          (thresholds.labor?.grade(laborRatio) ?? .healthy) == .critical
        let rentDanger = (thresholds.rent?.grade(rentRatio) ?? .healthy) == .warning ||
                         (thresholds.rent?.grade(rentRatio) ?? .healthy) == .critical
        return ingDanger || laborDanger || rentDanger || netProfit < 0
    }

    private var currentMonth: String {
        let df = DateFormatter()
        df.locale = Locale(identifier: ko ? "ko_KR" : "en_US")
        df.dateFormat = "M"
        return ko ? "\(df.string(from: Date()))월" : df.string(from: Date())
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                headerSection
                metricsSection
                ratiosSection
                if let b = benchmarkLine {
                    benchmarkFooter(b)
                }
            }
        }
    }

    // MARK: Header

    private var headerSection: some View {
        HStack(spacing: 8) {
            Text("\(currentMonth) " + (ko ? "손익" : "P&L"))
                .buSectionEyebrowStyle()
            if hasDanger {
                Circle()
                    .fill(BUColor.danger)
                    .frame(width: 6, height: 6)
                    .shadow(color: BUColor.danger.opacity(0.4), radius: 3)
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: Hero metrics (매출 / 비용 / 순익)

    private var metricsSection: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            metricCell(label: ko ? "매출" : "Sales", value: totalSales, color: BUColor.ink)
            Divider()
                .frame(height: 32)
                .overlay(BUColor.midnight.opacity(0.06))
            metricCell(label: ko ? "비용" : "Costs", value: totalCosts, color: BUColor.inkSecondary)
            Divider()
                .frame(height: 32)
                .overlay(BUColor.midnight.opacity(0.06))
            metricCell(
                label: ko ? "순익" : "Net",
                value: netProfit,
                color: netProfit >= 0 ? BUColor.success : BUColor.danger,
                showSign: true
            )
        }
    }

    private func metricCell(label: String, value: Double, color: Color, showSign: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
                .textCase(.uppercase)
            Text(formatKRWCompact(value, showSign: showSign))
                .font(.system(size: 19, weight: .bold))
                .foregroundStyle(color)
                .tracking(-0.5)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Cost ratios (3행 게이지)

    private var ratiosSection: some View {
        VStack(spacing: 10) {
            ratioRow(
                label: ko ? "재료비" : "Materials",
                ratio: ingredientRatio,
                threshold: thresholds.ingredients
            )
            ratioRow(
                label: ko ? "인건비" : "Labor",
                ratio: laborRatio,
                threshold: thresholds.labor
            )
            ratioRow(
                label: ko ? "임대료" : "Rent",
                ratio: rentRatio,
                threshold: thresholds.rent
            )
        }
        .padding(.top, 4)
    }

    private func ratioRow(label: String, ratio: Double, threshold: KpiThreshold?) -> some View {
        let grade = threshold?.grade(ratio) ?? .unknown
        let target = threshold?.healthy ?? 50
        return VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.ink.opacity(0.7))
                Spacer()
                Text("\(String(format: "%.0f", ratio))%")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(HealthColors.palette(for: grade).text)
                    .monospacedDigit()
                if let t = threshold {
                    Text("/ \(Int(t.healthy))%")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            BUGaugeBar(value: ratio, target: target * 2, grade: grade, height: 5)
        }
    }

    // MARK: Benchmark footer (웹 CostCompositionDonutCard 푸터 패턴 미러)

    /// 3개 비율 중 가장 두드러진(나쁜) 등급 1개의 업종 평균 비교 한 줄.
    /// SSOT BenchmarkTextRegistry(웹 benchmarkText 거울). categoryId 없거나 벤치마크 없으면 nil.
    private var benchmarkLine: BenchmarkResult? {
        guard let cid = categoryId else { return nil }
        let lang = ko ? "ko" : "en"
        let results = [
            BenchmarkTextRegistry.benchmarkText(categoryId: cid, metric: .ingredientRatio, myValue: ingredientRatio, language: lang),
            BenchmarkTextRegistry.benchmarkText(categoryId: cid, metric: .laborRatio, myValue: laborRatio, language: lang),
            BenchmarkTextRegistry.benchmarkText(categoryId: cid, metric: .rentRatio, myValue: rentRatio, language: lang),
        ].compactMap { $0 }
        guard !results.isEmpty else { return nil }
        func rank(_ s: BenchmarkStatus) -> Int { s == .risk ? 2 : (s == .watch ? 1 : 0) }
        return results.max { rank($0.status) < rank($1.status) }
    }

    private func benchmarkFooter(_ b: BenchmarkResult) -> some View {
        // 신호등 0: good/watch=미드나잇 농담, risk만 벽돌(danger)
        let tint = b.status == .risk ? BUColor.danger : BUColor.midnight
        return HStack(spacing: 6) {
            Text(b.narrative)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(tint)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 10).fill(tint.opacity(0.06)))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(tint.opacity(0.18), lineWidth: 0.5))
    }
}

// MARK: - Helpers

private func formatKRWCompact(_ value: Double, showSign: Bool = false) -> String {
    let v = Int(round(value))
    let abs = Swift.abs(v)
    let sign: String
    if showSign && v > 0 { sign = "+" }
    else if v < 0 { sign = "-" }
    else { sign = "" }
    if abs >= 100_000_000 {
        return "\(sign)\(String(format: "%.1f", Double(abs) / 100_000_000))억"
    }
    if abs >= 10_000 {
        return "\(sign)\(abs / 10_000)만"
    }
    return "\(sign)\(abs)"
}

// MARK: - Preview

#if DEBUG
#Preview("PLHero — 외식 정상") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            PLHeroCard(
                totalSales: 18_500_000,
                totalCosts: 13_200_000,
                ingredientRatio: 32,
                laborRatio: 28,
                rentRatio: 9,
                thresholds: IndustryThresholds.restaurant
            )
            .padding(BUSpacing.md)
        }
    }
}

#Preview("PLHero — 외식 위험") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            PLHeroCard(
                totalSales: 14_500_000,
                totalCosts: 16_800_000,
                ingredientRatio: 48,
                laborRatio: 42,
                rentRatio: 16,
                thresholds: IndustryThresholds.restaurant
            )
            .padding(BUSpacing.md)
        }
    }
}
#endif
