//
//  BUBarChart.swift — 막대 차트 (웹 ActivitySnapshotCard / Cashflow13Week 미러)
//
//  웹 정확 사양:
//   • Bar radius: 10px 10px 3px 3px (위 둥글, 아래 살짝)
//   • Bar gradient: 위(진한 색) → 아래(연한 색)
//   • Height 140px (Activity) / 동적 (13주)
//   • Animation: 진입 시 height 0 → 실제 (CSS transition 0.45s)
//   • BEP 라인 (점선, 회색 rgba(15,23,42,0.25))
//

import SwiftUI
import FoundOneDesignSystem

// MARK: - BUBarChart

public struct BUBarChart: View {

    public struct Bar: Identifiable, Sendable {
        public let id = UUID()
        public let value: Double
        public let label: String?        // x축 라벨
        public let tone: Tone
        public let highlighted: Bool     // 오늘 또는 강조

        public enum Tone: Sendable {
            case positive   // 매출 (녹색 → 연녹색)
            case negative   // 적자 (빨강 → 연한 빨강)
            case neutral    // 회색
            case midnight   // 홈 매출 그래프 (미드나이트블루)
        }

        public init(value: Double, label: String? = nil, tone: Tone = .positive, highlighted: Bool = false) {
            self.value = value
            self.label = label
            self.tone = tone
            self.highlighted = highlighted
        }
    }

    let bars: [Bar]
    let height: CGFloat
    let bepValue: Double?         // 손익분기 라인 (점선)
    let showLabels: Bool

    /// 막대(및 라벨) 탭 → 해당 index. nil 이면 차트는 표시 전용.
    /// 웹 ActivitySnapshotCard 는 막대를 누르면 그 날짜 입력이 열린다 — iOS 도 동일 (2026-08-06).
    let onSelect: ((Int) -> Void)?

    public init(
        bars: [Bar],
        height: CGFloat = 140,
        bepValue: Double? = nil,
        showLabels: Bool = true,
        onSelect: ((Int) -> Void)? = nil
    ) {
        self.bars = bars
        self.height = height
        self.bepValue = bepValue
        self.showLabels = showLabels
        self.onSelect = onSelect
    }

    private var maxValue: Double {
        max(bars.map(\.value).max() ?? 1, bepValue ?? 0, 1) * 1.15
    }

    public var body: some View {
        VStack(spacing: 6) {
            // Chart area
            ZStack(alignment: .bottom) {
                // BEP line (점선)
                if let bep = bepValue {
                    GeometryReader { geo in
                        let y = geo.size.height * (1 - bep / maxValue)
                        Path { path in
                            path.move(to: CGPoint(x: 0, y: y))
                            path.addLine(to: CGPoint(x: geo.size.width, y: y))
                        }
                        .stroke(
                            BUColor.ink.opacity(0.18),
                            style: StrokeStyle(lineWidth: 1, dash: [3, 3])
                        )
                    }
                    .frame(height: height)
                }

                // Bars
                HStack(alignment: .bottom, spacing: 6) {
                    ForEach(Array(bars.enumerated()), id: \.element.id) { idx, bar in
                        let column = BarColumn(
                            bar: bar,
                            maxValue: maxValue,
                            chartHeight: height
                        )
                        if let onSelect {
                            Button { onSelect(idx) } label: {
                                // 값이 0 인 빈 막대도 눌러서 그날을 기록할 수 있어야 한다
                                column.contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                        } else {
                            column
                        }
                    }
                }
                .frame(height: height, alignment: .bottom)
            }

            // X-axis labels
            if showLabels {
                HStack(spacing: 6) {
                    ForEach(Array(bars.enumerated()), id: \.element.id) { idx, bar in
                        let label = Text(bar.label ?? "")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(bar.highlighted ? BUColor.midnight : BUColor.inkMuted)
                            .frame(maxWidth: .infinity)
                        if let onSelect {
                            Button { onSelect(idx) } label: { label.contentShape(Rectangle()) }
                                .buttonStyle(.plain)
                        } else {
                            label
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Single bar column

private struct BarColumn: View {
    let bar: BUBarChart.Bar
    let maxValue: Double
    let chartHeight: CGFloat

    @State private var animated: Bool = false

    private var barGradient: LinearGradient {
        switch bar.tone {
        case .positive:
            return LinearGradient(
                colors: [BUColor.success.opacity(0.92), BUColor.success.opacity(0.55)],
                startPoint: .top,
                endPoint: .bottom
            )
        case .negative:
            return LinearGradient(
                colors: [BUColor.danger.opacity(0.92), BUColor.danger.opacity(0.55)],
                startPoint: .top,
                endPoint: .bottom
            )
        case .neutral:
            return LinearGradient(
                colors: [BUColor.inkMuted.opacity(0.7), BUColor.inkMuted.opacity(0.4)],
                startPoint: .top,
                endPoint: .bottom
            )
        case .midnight:
            return LinearGradient(
                colors: [BUColor.midnight.opacity(0.96), BUColor.midnight.opacity(0.46)],
                startPoint: .top,
                endPoint: .bottom
            )
        }
    }

    private var ratio: CGFloat {
        guard maxValue > 0 else { return 0 }
        return max(0.02, CGFloat(bar.value / maxValue))
    }

    var body: some View {
        UnevenRoundedRectangle(
            cornerRadii: .init(topLeading: 8, bottomLeading: 3, bottomTrailing: 3, topTrailing: 8),
            style: .continuous
        )
        .fill(barGradient)
        .frame(height: animated ? max(2, chartHeight * ratio) : 2)
        .overlay(
            // Highlight today
            bar.highlighted
                ? UnevenRoundedRectangle(
                    cornerRadii: .init(topLeading: 8, bottomLeading: 3, bottomTrailing: 3, topTrailing: 8),
                    style: .continuous
                  )
                  .strokeBorder(BUColor.midnight.opacity(0.4), lineWidth: 1.5)
                : nil
        )
        .shadow(
            color: bar.highlighted ? BUColor.midnight.opacity(0.15) : .clear,
            radius: 3, x: 0, y: 1
        )
        .frame(maxWidth: .infinity)
        .onAppear {
            withAnimation(.easeOut(duration: 0.5).delay(0.1)) {
                animated = true
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUBarChart — 7일 매출") {
    ZStack {
        BUColor.appBackground.ignoresSafeArea()

        VStack(spacing: 24) {
            BUBarChart(
                bars: [
                    .init(value: 500_000, label: "월", tone: .positive),
                    .init(value: 620_000, label: "화", tone: .positive),
                    .init(value: 480_000, label: "수", tone: .positive),
                    .init(value: 720_000, label: "목", tone: .positive),
                    .init(value: 820_000, label: "금", tone: .positive),
                    .init(value: 950_000, label: "토", tone: .positive),
                    .init(value: 870_000, label: "일", tone: .positive, highlighted: true),
                ],
                bepValue: 600_000
            )
            .padding(.horizontal, 22)
        }
    }
}
#endif
