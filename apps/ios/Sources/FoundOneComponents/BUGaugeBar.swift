//
//  BUGaugeBar.swift — 비용 비율 게이지 (PLHeroCard / CostStructureCard 미러)
//
//  웹 정확 사양:
//   • height 6px / radius 3px
//   • bg: 회색 (rgba(15,23,42,0.05))
//   • fill: HEALTH_COLORS 단계별 (healthy / caution / warning / critical)
//   • transition: 0.8s ease (값 변경 시)
//   • 우측 target marker (점선 또는 작은 dot)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - BUGaugeBar

public struct BUGaugeBar: View {

    /// 현재 값 (% 또는 0~1)
    let value: Double
    /// 목표 / max 값 (예: 100% 또는 60%)
    let target: Double
    let grade: HealthGrade
    /// 게이지 height
    let height: CGFloat
    /// target marker 표시 여부
    let showTargetMarker: Bool

    @State private var animated: Bool = false

    public init(
        value: Double,
        target: Double = 100,
        grade: HealthGrade,
        height: CGFloat = 6,
        showTargetMarker: Bool = false
    ) {
        self.value = value
        self.target = target
        self.grade = grade
        self.height = height
        self.showTargetMarker = showTargetMarker
    }

    private var ratio: CGFloat {
        guard target > 0 else { return 0 }
        return max(0.02, min(1.0, CGFloat(value / target)))
    }

    public var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // BG
                Capsule()
                    .fill(BUColor.ink.opacity(0.05))

                // Fill
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                HealthColors.palette(for: grade).dot,
                                HealthColors.palette(for: grade).dot.opacity(0.7),
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: animated ? geo.size.width * ratio : 4)
                    .animation(.easeOut(duration: 0.8), value: animated)
            }
        }
        .frame(height: height)
        .onAppear { animated = true }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUGaugeBar — Cost Ratios") {
    ZStack {
        BUColor.appBackground.ignoresSafeArea()

        VStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("재료비").font(.system(size: 12, weight: .semibold))
                    Spacer()
                    Text("32%").font(.system(size: 12, weight: .bold)).monospacedDigit()
                }
                BUGaugeBar(value: 32, target: 50, grade: .healthy)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("인건비").font(.system(size: 12, weight: .semibold))
                    Spacer()
                    Text("35%").font(.system(size: 12, weight: .bold)).monospacedDigit()
                }
                BUGaugeBar(value: 35, target: 50, grade: .caution)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("임대료").font(.system(size: 12, weight: .semibold))
                    Spacer()
                    Text("18%").font(.system(size: 12, weight: .bold)).monospacedDigit()
                }
                BUGaugeBar(value: 18, target: 20, grade: .warning)
            }
        }
        .padding(22)
        .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: 20))
        .padding()
    }
}
#endif
