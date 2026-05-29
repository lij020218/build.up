//
//  BUSparkline.swift — 14일 매출 추세 sparkline
//
//  Swift Charts (Apple 내장) 활용 — 별도 라이브러리 불필요.
//  CEOMorningHero 의 sparkline 모바일 버전. 컴팩트한 라인 차트 + 그라디언트.
//

import SwiftUI
import Charts
import FoundOneDesignSystem
import FoundOneCore

// MARK: - BUSparkline

public struct BUSparkline: View {

    public struct DataPoint: Identifiable, Sendable {
        public let id = UUID()
        public let index: Int
        public let value: Double
        public init(index: Int, value: Double) {
            self.index = index
            self.value = value
        }
    }

    let data: [DataPoint]
    let tint: Color
    let height: CGFloat
    let showFill: Bool

    public init(
        data: [DataPoint],
        tint: Color = BUColor.midnight,
        height: CGFloat = 36,
        showFill: Bool = true
    ) {
        self.data = data
        self.tint = tint
        self.height = height
        self.showFill = showFill
    }

    /// DailyEntry 배열에서 간편 생성 (selector 로 sales/customers 선택)
    public init(
        entries: [DailyEntry],
        selector: (DailyEntry) -> Double = { $0.sales },
        tint: Color = BUColor.midnight,
        height: CGFloat = 36,
        showFill: Bool = true
    ) {
        self.data = entries
            .enumerated()
            .map { DataPoint(index: $0.offset, value: selector($0.element)) }
        self.tint = tint
        self.height = height
        self.showFill = showFill
    }

    public var body: some View {
        if data.isEmpty {
            EmptyView()
        } else {
            Chart(data) { point in
                // 영역 그라디언트 (옵션)
                if showFill {
                    AreaMark(
                        x: .value("index", point.index),
                        y: .value("value", point.value)
                    )
                    .interpolationMethod(.catmullRom)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [tint.opacity(0.30), tint.opacity(0.0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
                // 라인
                LineMark(
                    x: .value("index", point.index),
                    y: .value("value", point.value)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(tint)
                .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
            }
            .chartXAxis(.hidden)
            .chartYAxis(.hidden)
            .chartLegend(.hidden)
            .frame(height: height)
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUSparkline — 매출 추세") {
    VStack(spacing: BUSpacing.md) {
        // 상승 추세 (healthy)
        BUSparkline(
            data: [400_000, 420_000, 380_000, 450_000, 500_000, 540_000, 580_000,
                   600_000, 620_000, 640_000, 700_000, 720_000, 780_000, 820_000]
                .enumerated()
                .map { BUSparkline.DataPoint(index: $0.offset, value: $0.element) },
            tint: HealthColors.palette(for: .healthy).dot
        )

        // 하락 추세 (warning)
        BUSparkline(
            data: [800_000, 750_000, 720_000, 680_000, 650_000, 620_000, 580_000,
                   540_000, 510_000, 480_000, 450_000, 420_000, 400_000, 380_000]
                .enumerated()
                .map { BUSparkline.DataPoint(index: $0.offset, value: $0.element) },
            tint: HealthColors.palette(for: .warning).dot
        )

        // 정체 (caution)
        BUSparkline(
            data: (0..<14).map { _ in 500_000 + Double.random(in: -50_000...50_000) }
                .enumerated()
                .map { BUSparkline.DataPoint(index: $0.offset, value: $0.element) },
            tint: HealthColors.palette(for: .caution).dot,
            height: 50
        )
    }
    .padding(BUSpacing.lg)
    .background(BUColor.surface)
}
#endif
