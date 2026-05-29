//
//  WeeklyPulseView.swift — Tier 2 통합 (웹 sections/Tier2WeeklyPulse.tsx 미러)
//
//  웹 카드 순서:
//   1. SurvivalBoardCard — 4셀 + 헬스 게이지
//   2. Cashflow13WeekForecastCard — 13주 잔고 예측
//   3. CostStructureCard — 비용 구조 (외식만)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

public struct WeeklyPulseView: View {

    let mock: MockData

    public init(mock: MockData) {
        self.mock = mock
    }

    private var ratios: CostRatiosResult {
        CostRatios.calculate(
            costs: mock.costs,
            totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
            days: mock.entries.count
        )
    }

    private var healthResult: UnifiedHealthResult {
        HealthScore.calculate(
            entries: mock.entries,
            costs: mock.costs,
            category: mock.category,
            stage: mock.stage,
            currentCash: mock.currentCash
        )
    }

    private var weeklyBalances: [Double] {
        guard let cash = mock.currentCash else { return [] }
        let weeklyNet = (ratios.monthlyRevenueEquivalent - mock.costs.total) / 4.33
        return (0..<13).map { week in
            cash + weeklyNet * Double(week)
        }
    }

    private var isCrisis: Bool {
        weeklyBalances.contains(where: { $0 < 0 })
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: BUSpacing.shellGap) {
                sectionEyebrow

                SurvivalBoardCard(
                    mock: mock,
                    healthResult: healthResult
                )

                if !weeklyBalances.isEmpty {
                    Cashflow13WeekCard(
                        currentBalance: mock.currentCash ?? 0,
                        weeklyBalances: weeklyBalances,
                        isCrisis: isCrisis
                    )
                }

                if ratios.ready && mock.category != .startupTech {
                    CostStructureCard(
                        ingredientRatio: ratios.ingredientRatio,
                        laborRatio: ratios.laborRatio,
                        rentRatio: ratios.rentRatio,
                        primeCostRatio: ratios.primeCostRatio,
                        thresholds: IndustryThresholds.thresholds(for: mock.category)
                    )
                }

                // ━━━ 추가 블록 (웹 ReportsSurface 미러) ━━━
                WeeklyChecklistBlock()
                MonthlyPnLCompareBlock(
                    thisMonthRevenue: ratios.monthlyRevenueEquivalent,
                    thisMonthCosts: mock.costs.total
                )
                WeeklyInsightsBlock()

                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        .background(BUBackgroundSurface())
    }

    private var sectionEyebrow: some View {
        HStack(spacing: 6) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.7))
            Text("이번 주 점검")
                .buSectionEyebrowStyle()
            Spacer()
        }
        .padding(.top, 4)
    }
}

// MARK: - WeeklyChecklistBlock

public struct WeeklyChecklistBlock: View {

    struct Item: Identifiable {
        let id = UUID()
        let label: String
        let hint: String
    }

    private let items: [Item] = [
        .init(label: "매출 입력 7일", hint: "주 7일 모두 매출 기록 완료"),
        .init(label: "비용 결산", hint: "재료비·인건비·임대료 확인"),
        .init(label: "재고 정산", hint: "주요 품목 실재고 카운트"),
        .init(label: "직원 미팅", hint: "주간 1회 짧은 공유"),
        .init(label: "다음 주 목표 설정", hint: "한 줄 목표·1개 액션")
    ]

    @State private var checked: Set<UUID> = []

    public init() {}

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "checklist")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("CHECKLIST")
                            .buSectionEyebrowStyle()
                        Text("주간 점검 5가지")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                    Text("\(checked.count)/\(items.count)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(checked.count == items.count ? BUColor.success : BUColor.midnight)
                        .monospacedDigit()
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(
                            (checked.count == items.count ? BUColor.success : BUColor.midnight).opacity(0.10),
                            in: Capsule()
                        )
                }

                VStack(spacing: 6) {
                    ForEach(items) { item in
                        row(item)
                    }
                }
            }
        }
    }

    private func row(_ item: Item) -> some View {
        let isOn = checked.contains(item.id)
        return Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.85)) {
                if isOn { checked.remove(item.id) } else { checked.insert(item.id) }
            }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(isOn ? BUColor.success : BUColor.inkSubtle)
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.label)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.ink.opacity(isOn ? 0.5 : 0.9))
                        .strikethrough(isOn, color: BUColor.inkSubtle)
                    Text(item.hint)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer()
            }
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - MonthlyPnLCompareBlock

public struct MonthlyPnLCompareBlock: View {

    let thisMonthRevenue: Double
    let thisMonthCosts: Double

    // 지난 달 = 이번 달 - 8% (샘플)
    private var lastMonthRevenue: Double { max(0, thisMonthRevenue * 0.92) }
    private var lastMonthCosts: Double { max(0, thisMonthCosts * 1.03) }

    private var thisMonthNet: Double { thisMonthRevenue - thisMonthCosts }
    private var lastMonthNet: Double { lastMonthRevenue - lastMonthCosts }

    public init(thisMonthRevenue: Double, thisMonthCosts: Double) {
        self.thisMonthRevenue = thisMonthRevenue
        self.thisMonthCosts = thisMonthCosts
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "chart.bar.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("MONTHLY P&L")
                            .buSectionEyebrowStyle()
                        Text("이번 달 vs 지난 달")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                VStack(spacing: 10) {
                    compareRow(label: "매출", thisM: thisMonthRevenue, lastM: lastMonthRevenue, higherIsBetter: true)
                    compareRow(label: "비용", thisM: thisMonthCosts, lastM: lastMonthCosts, higherIsBetter: false)
                    Divider().background(BUColor.midnight.opacity(0.08))
                    compareRow(label: "순이익", thisM: thisMonthNet, lastM: lastMonthNet, higherIsBetter: true, emphasis: true)
                }
            }
        }
    }

    private func compareRow(label: String, thisM: Double, lastM: Double, higherIsBetter: Bool, emphasis: Bool = false) -> some View {
        let delta = thisM - lastM
        let pct = lastM != 0 ? (delta / Swift.abs(lastM)) * 100 : 0
        let positive = higherIsBetter ? delta >= 0 : delta <= 0
        let tint: Color = positive ? BUColor.success : BUColor.danger
        return VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BUColor.ink.opacity(0.6))
                    .tracking(0.3)
                Spacer()
                Text("\(pct >= 0 ? "+" : "")\(String(format: "%.1f", pct))%")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(tint)
                    .monospacedDigit()
                    .padding(.horizontal, 7)
                    .padding(.vertical, 2)
                    .background(tint.opacity(0.10), in: Capsule())
            }
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                VStack(alignment: .leading, spacing: 1) {
                    Text("이번 달")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                    Text(formatKRWLocal(thisM))
                        .font(.system(size: emphasis ? 18 : 15, weight: .bold))
                        .foregroundStyle(emphasis ? (thisM >= 0 ? BUColor.success : BUColor.danger) : BUColor.ink)
                        .monospacedDigit()
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text("지난 달")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                    Text(formatKRWLocal(lastM))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.ink.opacity(0.55))
                        .monospacedDigit()
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
            }
        }
    }
}

// MARK: - WeeklyInsightsBlock

public struct WeeklyInsightsBlock: View {

    struct Insight: Identifiable {
        let id = UUID()
        let icon: String
        let tint: Color
        let title: String
        let body: String
    }

    private let insights: [Insight] = [
        .init(
            icon: "arrow.up.right.circle.fill",
            tint: BUColor.success,
            title: "주말 매출이 평일의 1.6배",
            body: "토·일 객수가 늘었어요. 주말 인력 1명 더 배치 검토."
        ),
        .init(
            icon: "exclamationmark.triangle.fill",
            tint: Color(red: 0.77, green: 0.55, blue: 0.16),
            title: "재료비 비율 32% → 권장 30% 초과",
            body: "이번 주 식자재 단가가 올랐어요. 주요 3품목 재협상 또는 메뉴 가격 검토."
        ),
        .init(
            icon: "heart.fill",
            tint: BUColor.midnight,
            title: "단골 24명 30일 이상 미방문",
            body: "win-back 메시지 1회 발송하면 평균 4-5명 복귀."
        ),
    ]

    public init() {}

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.success08).frame(width: 36, height: 36)
                        Image(systemName: "sparkles")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.success)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("FOR THE OWNER")
                            .buSectionEyebrowStyle()
                        Text("사장님께 보내드릴 인사이트")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                VStack(spacing: 10) {
                    ForEach(insights) { ins in
                        HStack(alignment: .top, spacing: 10) {
                            ZStack {
                                Circle().fill(ins.tint.opacity(0.12)).frame(width: 30, height: 30)
                                Image(systemName: ins.icon)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(ins.tint)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(ins.title)
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(BUColor.ink)
                                Text(ins.body)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(BUColor.inkMuted)
                                    .lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Helpers

private func formatKRWLocal(_ value: Double) -> String {
    let v = Int(round(value))
    let abs = Swift.abs(v)
    let sign = v < 0 ? "-" : ""
    if abs >= 100_000_000 { return "\(sign)\(String(format: "%.1f", Double(abs) / 100_000_000))억" }
    if abs >= 10_000 { return "\(sign)\(abs / 10_000)만" }
    return "\(sign)\(abs)"
}

#if DEBUG
#Preview("WeeklyPulse — 위기") {
    WeeklyPulseView(mock: .criticalSaaS)
}
#Preview("WeeklyPulse — 안정") {
    WeeklyPulseView(mock: .healthyRestaurant)
}
#endif
