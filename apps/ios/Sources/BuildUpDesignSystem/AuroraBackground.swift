//
//  AuroraBackground.swift — 웹 globals.css Aurora 1:1 재현
//
//  웹 SSOT (globals.css L88-144):
//   Layer 1: opacity 0.38 / blur(20px) /
//     repeating-linear-gradient(100deg, aurora colors 10-30%)
//     mask: 3 ellipse (85%5%, 10%55%, 50%100%)
//     animation auroraFlow1 80s
//   Layer 2: opacity 0.25 / blur(28px) /
//     repeating-linear-gradient(135deg + 80deg)
//     mask: 2 ellipse (20%15%, 75%70%)
//     animation auroraFlow2 110s
//
//  SwiftUI 구현:
//   • TimelineView(.animation) — 지속 흐름
//   • 다중 큰 Ellipse + LinearGradient + blur(60+) — Aurora flow 근사
//   • 2 layer (.before / .after) 분리 합성
//   • 베이스: --bg-raw #f7f6f3 (베이지)
//

import SwiftUI

// MARK: - AuroraBackground

public struct AuroraBackground: View {

    public init() {}

    public var body: some View {
        ZStack {
            // 베이스 — globals.css --bg #f7f6f3
            Color(red: 0xF7/255, green: 0xF6/255, blue: 0xF3/255)

            // Aurora layers — TimelineView 로 부드러운 흐름
            TimelineView(.animation(minimumInterval: 1.0/30.0)) { context in
                let t = context.date.timeIntervalSinceReferenceDate

                ZStack {
                    AuroraLayer1(time: t)
                        .opacity(0.22)         // 웹 0.38 + blur 20px ≈ iOS 0.22 + blur 60
                        .blur(radius: 60)

                    AuroraLayer2(time: t)
                        .opacity(0.14)         // 웹 0.25 + blur 28px ≈ iOS 0.14 + blur 80
                        .blur(radius: 80)
                }
            }
            .blendMode(.normal)
            .compositingGroup()
        }
        .ignoresSafeArea()
    }
}

// MARK: - Aurora Layer 1 (메인 — 우상단 + 좌중간 + 하단)

private struct AuroraLayer1: View {
    let time: TimeInterval

    /// 80초 cycle
    private var phase: Double {
        (time.truncatingRemainder(dividingBy: 80)) / 80
    }

    // Aurora colors (globals.css)
    private let aurora1 = Color(red: 0x1D/255, green: 0x35/255, blue: 0x57/255)  // navy
    private let aurora2 = Color(red: 0x45/255, green: 0x7B/255, blue: 0x9D/255)  // mid blue
    private let aurora3 = Color(red: 0xA8/255, green: 0xDA/255, blue: 0xDC/255)  // teal
    private let aurora4 = Color(red: 0xE0/255, green: 0xF0/255, blue: 0xFF/255)  // light sky

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height

            ZStack {
                // 우상단 ellipse (mask: at 85% 5%) — 메인 큰 광채
                Ellipse()
                    .fill(
                        LinearGradient(
                            colors: [aurora1, aurora2, aurora3, aurora4],
                            startPoint: UnitPoint(x: 0.2, y: 0.3),
                            endPoint: UnitPoint(x: 0.9, y: 0.7)
                        )
                    )
                    .frame(width: w * 1.4, height: h * 0.7)
                    .offset(
                        x: w * 0.3 + CGFloat(sin(phase * 2 * .pi) * 30),
                        y: -h * 0.25 + CGFloat(cos(phase * 2 * .pi) * 20)
                    )

                // 좌중간 ellipse (mask: at 10% 55%)
                Ellipse()
                    .fill(
                        LinearGradient(
                            colors: [aurora3, aurora4, aurora2],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: w * 1.2, height: h * 0.6)
                    .offset(
                        x: -w * 0.4 + CGFloat(cos(phase * 2 * .pi + 1) * 25),
                        y: h * 0.15 + CGFloat(sin(phase * 2 * .pi + 1) * 30)
                    )

                // 하단 ellipse (mask: at 50% 100%)
                Ellipse()
                    .fill(
                        LinearGradient(
                            colors: [aurora2, aurora1, aurora3],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: w * 1.6, height: h * 0.5)
                    .offset(
                        x: CGFloat(sin(phase * 2 * .pi + 2) * 40),
                        y: h * 0.55 + CGFloat(cos(phase * 2 * .pi + 2) * 15)
                    )
            }
        }
        .allowsHitTesting(false)
    }
}

// MARK: - Aurora Layer 2 (보조 — 좌상단 + 우하단)

private struct AuroraLayer2: View {
    let time: TimeInterval

    /// 110초 cycle (느림)
    private var phase: Double {
        (time.truncatingRemainder(dividingBy: 110)) / 110
    }

    private let aurora1 = Color(red: 0x1D/255, green: 0x35/255, blue: 0x57/255)
    private let aurora2 = Color(red: 0x45/255, green: 0x7B/255, blue: 0x9D/255)
    private let aurora3 = Color(red: 0xA8/255, green: 0xDA/255, blue: 0xDC/255)
    private let aurora4 = Color(red: 0xE0/255, green: 0xF0/255, blue: 0xFF/255)

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height

            ZStack {
                // 좌상단 ellipse (mask: at 20% 15%)
                Ellipse()
                    .fill(
                        LinearGradient(
                            colors: [aurora2, aurora3, aurora4],
                            startPoint: .topTrailing,
                            endPoint: .bottomLeading
                        )
                    )
                    .frame(width: w * 1.1, height: h * 0.55)
                    .offset(
                        x: -w * 0.25 + CGFloat(sin(phase * 2 * .pi) * 35),
                        y: -h * 0.20 + CGFloat(cos(phase * 2 * .pi) * 20)
                    )

                // 우하단 ellipse (mask: at 75% 70%)
                Ellipse()
                    .fill(
                        LinearGradient(
                            colors: [aurora4, aurora2, aurora1],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: w * 1.3, height: h * 0.6)
                    .offset(
                        x: w * 0.20 + CGFloat(cos(phase * 2 * .pi + 1.5) * 30),
                        y: h * 0.25 + CGFloat(sin(phase * 2 * .pi + 1.5) * 25)
                    )
            }
        }
        .allowsHitTesting(false)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Aurora Background") {
    AuroraBackground()
        .overlay(
            VStack(spacing: 20) {
                Text("build.up")
                    .font(.system(size: 48, weight: .bold))
                Text("매일 5초, 사장님 옆에 함께")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
        )
}
#endif
