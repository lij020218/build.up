//
//  DailyKpiStrip.swift — 5칸 KPI 가로 strip (웹 DailyKpiStrip.tsx 미러)
//
//  웹 정확 사양:
//   • gridTemplateColumns: repeat(5, minmax(0, 1fr)), gap 10
//   • 각 셀: radius 16 / padding 16/18 / linear-gradient(180deg, color 0.06 → 0.02)
//   • border: 1px solid rgba(color, 0.22)
//   • label: 11px / 700 / 0.04em / uppercase / labelColor
//   • value: 26px / 700 / -0.035em / tabular
//   • trend chip: ±%
//
//  모바일 적응:
//   • 5칸 → 가로 ScrollView (snap)
//   • 각 셀 폭: 130-160pt 고정
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore

// MARK: - KpiCell data

public struct KpiCellData: Identifiable, Sendable {
    public let id = UUID()
    public let label: String
    public let value: Double?
    public let displayOverride: String?
    public let trendPct: Double?
    public let grade: HealthGrade
    public let unit: String

    public init(
        label: String,
        value: Double?,
        displayOverride: String? = nil,
        trendPct: Double? = nil,
        grade: HealthGrade,
        unit: String = ""
    ) {
        self.label = label
        self.value = value
        self.displayOverride = displayOverride
        self.trendPct = trendPct
        self.grade = grade
        self.unit = unit
    }
}

// MARK: - DailyKpiStrip

public struct DailyKpiStrip: View {

    let cells: [KpiCellData]
    let ko: Bool

    public init(cells: [KpiCellData], ko: Bool = true) {
        self.cells = cells
        self.ko = ko
    }

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(cells) { cell in
                    KpiCellView(cell: cell, ko: ko)
                }
            }
            .padding(.horizontal, BUSpacing.md)
        }
        .padding(.horizontal, -BUSpacing.md)  // 부모 margin 무시하고 edge-to-edge
    }
}

// MARK: - KpiCellView

private struct KpiCellView: View {

    let cell: KpiCellData
    let ko: Bool

    private var palette: HealthColorPalette {
        HealthColors.palette(for: cell.grade)
    }

    private var displayValue: String {
        if let override = cell.displayOverride { return override }
        guard let v = cell.value, v.isFinite else { return "—" }
        if cell.unit == "%" { return "\(String(format: "%.0f", v))%" }
        if cell.unit == "개월" || cell.unit == "mo" {
            return "\(String(format: "%.1f", v))\(cell.unit)"
        }
        let i = Int(round(v))
        if i >= 100_000_000 {
            return "\(String(format: "%.1f", Double(i) / 100_000_000))억"
        }
        if i >= 10_000 {
            return "\(i / 10_000)만"
        }
        return i.formatted()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // label + trend chip
            HStack(spacing: 4) {
                Text(cell.label.uppercased())
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(palette.text)
                    .tracking(0.4)
                    .lineLimit(1)
                Spacer(minLength: 0)
                if let pct = cell.trendPct {
                    trendBadge(pct: pct)
                }
            }

            // value
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(displayValue)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(palette.text)
                    .tracking(-0.7)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
                if cell.unit == "원" {
                    Text("원")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(palette.text.opacity(0.6))
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(width: 138, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    palette.dot.opacity(0.08),
                    palette.dot.opacity(0.02),
                ],
                startPoint: .top,
                endPoint: .bottom
            ),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(palette.border, lineWidth: 0.6)
        )
    }

    private func trendBadge(pct: Double) -> some View {
        let positive = pct >= 0
        return HStack(spacing: 2) {
            Image(systemName: positive ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 8, weight: .heavy))
            Text("\(positive ? "+" : "")\(String(format: "%.0f", pct))%")
                .font(.system(size: 9, weight: .bold))
                .monospacedDigit()
        }
        .foregroundStyle(positive ? BUColor.success : BUColor.danger)
        .padding(.horizontal, 5)
        .padding(.vertical, 2)
        .background(
            (positive ? BUColor.success : BUColor.danger).opacity(0.10),
            in: Capsule()
        )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("DailyKpiStrip — 외식") {
    ZStack {
        BUBackgroundSurface()
        VStack {
            DailyKpiStrip(cells: [
                .init(label: "어제매출", value: 870_000, trendPct: 5.4, grade: .healthy, unit: "원"),
                .init(label: "어제고객", value: 28, trendPct: -2.0, grade: .caution, unit: "명"),
                .init(label: "원가율", value: 32, trendPct: -1.0, grade: .healthy, unit: "%"),
                .init(label: "런웨이", value: 8.3, grade: .healthy, unit: "개월"),
                .init(label: "객단가", value: 31_071, trendPct: 7.5, grade: .healthy, unit: "원"),
            ])
            .padding(.vertical, BUSpacing.lg)
        }
    }
}
#endif
