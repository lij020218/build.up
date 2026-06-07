//
//  ReportsView.swift — 보고서 (웹 ReportsSurface/ReportView 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/ReportsSurface.tsx + ReportView.tsx
//
//  세그먼트 4: 일 / 주 / 월 / 분기. 각 period 별:
//   • Hero (대표 매출 + 변화율 + headline)
//   • KPI 3 (비용 / 마진 / 프라임코스트)
//   • ReportChart (시리즈 — day 라인 / week·month·quarter 바)
//   • ReportDonut (비용 도넛 + slice 리스트 + 6개월 sparkline)
//   • 이상 신호 (있을 때만)
//   • 다음 액션 + 거장 인용
//
//  week period 에서만 iOS 고유 블록 5개 추가 (Cashflow13W / CostStructure / Checklist / MonthlyPnL / Insights).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

public struct ReportsView: View {

    let mock: MockData

    @State private var period: ReportPeriod = .week

    public init(mock: MockData) {
        self.mock = mock
    }

    private var data: ReportPeriodData {
        ReportsCalculator.compute(
            period: period,
            entries: mock.entries,
            costs: mock.costs
        )
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: BUSpacing.shellGap) {
                header
                periodTabs

                ReportHeroCard(data: data)
                ReportKpiRow(data: data)
                ReportChartCard(data: data)
                ReportDonutCard(data: data)

                if !data.anomalies.isEmpty {
                    AnomalySignalsCard(anomalies: data.anomalies)
                }

                NextActionCard(actionText: data.nextActionText, wisdom: data.wisdom)

                // iOS 고유 — 주간 점검 전용 블록은 week period 에서만 노출
                if period == .week {
                    let ratios = CostRatios.calculate(
                        costs: mock.costs,
                        totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
                        days: mock.entries.count
                    )
                    let healthResult = HealthScore.calculate(
                        entries: mock.entries,
                        costs: mock.costs,
                        category: mock.category,
                        stage: mock.stage,
                        currentCash: mock.currentCash
                    )
                    let weeklyBalances: [Double] = {
                        guard let cash = mock.currentCash else { return [] }
                        let weeklyNet = (ratios.monthlyRevenueEquivalent - mock.costs.total) / 4.33
                        return (0..<13).map { week in cash + weeklyNet * Double(week) }
                    }()
                    let isCrisis = weeklyBalances.contains(where: { $0 < 0 })

                    weeklyOnlyEyebrow

                    SurvivalBoardCard(mock: mock, healthResult: healthResult)
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
                    WeeklyChecklistBlock()
                    MonthlyRevenueProgressBlock(entries: mock.entries)
                    WeeklyInsightsBlock(entries: mock.entries, ratios: ratios, category: mock.category)
                }

                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        .background(BUBackgroundSurface())
    }

    // MARK: - Header + tabs

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("보고서 · REPORTS")
                .font(.system(size: 11, weight: .heavy))
                .tracking(1.54)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                .textCase(.uppercase)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text(reportTitle)
                .font(.system(size: 26, weight: .bold))
                .tracking(-1.0)
                .foregroundStyle(BUColor.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text(reportSubtitle)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.78))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var reportTitle: String {
        switch period {
        case .day:     return "오늘의 매출"
        case .week:    return "이번 주 점검"
        case .month:   return "이번 달 흐름"
        case .quarter: return "분기 회고"
        }
    }

    private var reportSubtitle: String {
        switch period {
        case .day:     return "지난 7일 평균과 비교"
        case .week:    return "주간 매출·비용·이상 신호"
        case .month:   return "월간 P&L 및 추세"
        case .quarter: return "분기별 성과 + 다음 우선순위"
        }
    }

    private var periodTabs: some View {
        HStack(spacing: 6) {
            ForEach(ReportPeriod.allCases) { p in
                PeriodTab(period: p, isSelected: period == p) {
                    withAnimation(.easeInOut(duration: 0.18)) { period = p }
                }
            }
        }
    }

    private var weeklyOnlyEyebrow: some View {
        HStack(spacing: 6) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(BUColor.midnight.opacity(0.7))
            Text("주간 전용 · WEEKLY DEEP DIVE")
                .buSectionEyebrowStyle()
            Spacer()
        }
        .padding(.top, 8)
    }
}

// MARK: - Period tab

private struct PeriodTab: View {
    let period: ReportPeriod
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Text(period.labelKo)
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(isSelected ? .white : BUColor.inkMuted)
                .frame(maxWidth: .infinity)
                .frame(minHeight: 36)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(isSelected ? BUColor.midnight : Color.white.opacity(0.72))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(isSelected ? Color.clear : BUColor.cardBorder, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Hero

private struct ReportHeroCard: View {
    let data: ReportPeriodData

    private var deltaColor: Color {
        if data.deltaPercent >= 5 { return BUColor.success }
        if data.deltaPercent <= -5 { return BUColor.danger }
        return BUColor.inkMuted
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(data.heroLabel)
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(formatWon(Int(data.heroValueWon)))
                    .font(.system(size: 32, weight: .black))
                    .tracking(-1.0)
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Spacer(minLength: 6)
                if data.heroValueWon > 0 || data.deltaPercent != 0 {
                    HStack(spacing: 3) {
                        Image(systemName: data.deltaPercent >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 11, weight: .heavy))
                        Text(String(format: "%@%.1f%%", data.deltaPercent >= 0 ? "+" : "", data.deltaPercent))
                            .font(.system(size: 13, weight: .heavy))
                    }
                    .foregroundStyle(deltaColor)
                }
            }
            Text(data.headline)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }
}

// MARK: - KPI row

private struct ReportKpiRow: View {
    let data: ReportPeriodData

    var body: some View {
        HStack(spacing: 8) {
            kpi(label: "비용", value: formatWon(Int(data.kpiCostWon)), tint: BUColor.warn)
            kpi(label: "마진", value: String(format: "%.1f%%", data.kpiMarginPercent),
                tint: data.kpiMarginPercent >= 15 ? BUColor.success
                      : data.kpiMarginPercent >= 0 ? BUColor.warn
                      : BUColor.danger)
            kpi(label: "프라임", value: String(format: "%.0f%%", data.kpiPrimeRatePercent),
                tint: data.kpiPrimeRatePercent <= 65 ? BUColor.success
                      : data.kpiPrimeRatePercent <= 75 ? BUColor.warn
                      : BUColor.danger)
        }
    }

    private func kpi(label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.5)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
            Text(value)
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Rectangle()
                .fill(tint)
                .frame(height: 2)
                .padding(.top, 2)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }
}

// MARK: - Chart card

private struct ReportChartCard: View {
    let data: ReportPeriodData

    private var isLine: Bool { data.period == .day }

    private var maxValue: Double {
        max(1, data.chartPoints.map(\.value).max() ?? 0)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("\(data.period.labelKo)별 추이")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.5)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
            if isLine {
                LineChart(points: data.chartPoints, maxValue: maxValue)
                    .frame(height: 100)
            } else {
                BarChart(points: data.chartPoints, maxValue: maxValue)
                    .frame(height: 130)
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }
}

// MARK: - Bar chart

private struct BarChart: View {
    let points: [ReportChartPoint]
    let maxValue: Double

    var body: some View {
        GeometryReader { proxy in
            let w = proxy.size.width
            let h = proxy.size.height - 22
            let gap: CGFloat = 6
            let bw = max(8, (w - gap * CGFloat(points.count - 1)) / CGFloat(max(1, points.count)))

            ZStack(alignment: .bottomLeading) {
                // Bars
                HStack(alignment: .bottom, spacing: gap) {
                    ForEach(Array(points.enumerated()), id: \.offset) { _, p in
                        VStack(spacing: 4) {
                            let bh = maxValue > 0 ? CGFloat(p.value / maxValue) * h : 0
                            Rectangle()
                                .fill(p.isCurrent
                                      ? AnyShapeStyle(LinearGradient(
                                            colors: [BUColor.midnight, BUColor.midnight.opacity(0.7)],
                                            startPoint: .top, endPoint: .bottom))
                                      : AnyShapeStyle(BUColor.midnight.opacity(0.18)))
                                .frame(width: bw, height: max(2, bh))
                                .cornerRadius(4)
                            Text(p.label)
                                .font(.system(size: 9, weight: .heavy))
                                .foregroundStyle(p.isCurrent ? BUColor.ink : BUColor.inkMuted.opacity(0.7))
                                .lineLimit(1)
                                .frame(width: bw)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Line chart

private struct LineChart: View {
    let points: [ReportChartPoint]
    let maxValue: Double

    var body: some View {
        GeometryReader { proxy in
            let w = proxy.size.width
            let h = proxy.size.height - 18
            let step = w / CGFloat(max(1, points.count - 1))

            ZStack(alignment: .bottomLeading) {
                // Path
                Path { path in
                    for (i, p) in points.enumerated() {
                        let x = CGFloat(i) * step
                        let y = h - (maxValue > 0 ? CGFloat(p.value / maxValue) * h : 0)
                        if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                        else { path.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(BUColor.midnight, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

                // Dots
                ForEach(Array(points.enumerated()), id: \.offset) { i, p in
                    let x = CGFloat(i) * step
                    let y = h - (maxValue > 0 ? CGFloat(p.value / maxValue) * h : 0)
                    Circle()
                        .fill(p.isCurrent ? BUColor.midnight : BUColor.midnight.opacity(0.4))
                        .frame(width: p.isCurrent ? 8 : 5, height: p.isCurrent ? 8 : 5)
                        .position(x: x, y: y)
                }

                // X-axis labels — sparse (every other for readability)
                HStack(spacing: 0) {
                    ForEach(Array(points.enumerated()), id: \.offset) { i, p in
                        Text(i % 2 == 0 ? p.label : "")
                            .font(.system(size: 8.5, weight: .heavy))
                            .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.top, h + 4)
            }
        }
    }
}

// MARK: - Donut card

private struct ReportDonutCard: View {
    let data: ReportPeriodData

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("비용 구조")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                Spacer(minLength: 0)
                Text("월 \(formatWon(Int(data.costSlices.reduce(0) { $0 + $1.value } / max(0.0001, data.period.costMultiplier))))")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }

            if data.costSlices.isEmpty {
                Text("월 비용을 입력하면 구조 분석이 보여요.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.vertical, 16)
            } else {
                HStack(alignment: .top, spacing: 12) {
                    DonutChart(slices: data.costSlices)
                        .frame(width: 110, height: 110)
                    VStack(alignment: .leading, spacing: 5) {
                        ForEach(data.costSlices.prefix(5)) { slice in
                            sliceRow(slice)
                        }
                        if data.costSlices.count > 5 {
                            Text("+ \(data.costSlices.count - 5)개 더")
                                .font(.system(size: 10, weight: .heavy))
                                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                        }
                    }
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private func sliceRow(_ slice: ReportCostSlice) -> some View {
        HStack(spacing: 6) {
            Circle()
                .fill(Color(hexString: slice.colorHex))
                .frame(width: 7, height: 7)
            Text(slice.labelKo)
                .font(.system(size: 11.5, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            Spacer(minLength: 4)
            Text(String(format: "%.0f%%", slice.percent))
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
        }
    }
}

private struct DonutChart: View {
    let slices: [ReportCostSlice]

    var body: some View {
        let total = slices.reduce(0) { $0 + $1.percent }
        return ZStack {
            ForEach(Array(slices.enumerated()), id: \.offset) { i, slice in
                let startPct = slices.prefix(i).reduce(0) { $0 + $1.percent }
                DonutSlice(start: startPct / max(0.001, total), end: (startPct + slice.percent) / max(0.001, total))
                    .stroke(Color(hexString: slice.colorHex), style: StrokeStyle(lineWidth: 18, lineCap: .butt))
            }
            VStack(spacing: 1) {
                Text("월")
                    .font(.system(size: 9, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.6))
                Text("비용")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
        }
    }
}

private struct DonutSlice: Shape {
    let start: Double
    let end: Double

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2 - 10
        let startAngle = Angle(degrees: -90 + 360 * start)
        let endAngle = Angle(degrees: -90 + 360 * end)
        path.addArc(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: false)
        return path
    }
}

// MARK: - Anomaly card

private struct AnomalySignalsCard: View {
    let anomalies: [AnomalySignal]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(BUColor.warn)
                Text("이상 신호 \(anomalies.count)건")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.inkMuted)
            }
            VStack(spacing: 8) {
                ForEach(anomalies) { signal in
                    signalRow(signal)
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private func signalRow(_ s: AnomalySignal) -> some View {
        let color: Color = s.severity == .danger
            ? BUColor.danger
            : BUColor.warn
        return HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
                .padding(.top, 5)
            VStack(alignment: .leading, spacing: 3) {
                Text(s.title)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(s.detail)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10).padding(.vertical, 8)
        .background(color.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(color.opacity(0.18), lineWidth: 1)
        )
    }
}

// MARK: - Next action + wisdom

private struct NextActionCard: View {
    let actionText: String
    let wisdom: WisdomQuote

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.up.right.circle.fill")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                    Text("다음 액션")
                        .font(.system(size: 11, weight: .heavy))
                        .tracking(0.5)
                        .textCase(.uppercase)
                        .foregroundStyle(BUColor.inkMuted)
                }
                Text(actionText)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Rectangle()
                .fill(BUColor.inkMuted.opacity(0.08))
                .frame(height: 1)

            VStack(alignment: .leading, spacing: 4) {
                Text("『\(wisdom.text)』")
                    .font(.system(size: 12.5, weight: .medium, design: .serif))
                    .italic()
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                Text("— \(wisdom.author)")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }
}

// MARK: - Helpers

// formatWon 은 FoundOneFeatures.Marketing.MarketingView 에 이미 글로벌 정의 — 재사용.

fileprivate extension Color {
    init(hexString: String) {
        var s = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        var rgb: UInt64 = 0
        Scanner(string: s).scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255.0
        let g = Double((rgb >>  8) & 0xFF) / 255.0
        let b = Double( rgb        & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
