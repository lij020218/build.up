//
//  AuroraBackground.swift — 웹 globals.css Aurora 근사 (정적)
//
//  웹 SSOT (globals.css L88-144):
//   Layer 1: opacity 0.38 / blur(20px) / aurora colors, mask 3 ellipse
//   Layer 2: opacity 0.25 / blur(28px) / mask 2 ellipse
//
//  SwiftUI 구현 (2026-08-19 성능 개정):
//   • TimelineView(30fps) + 풀스크린 Gaussian blur 2겹(r=60/80) → 매 프레임 오프스크린 렌더로
//     스크롤 끊김 원인. 정적 합성으로 교체.
//   • 큰 RadialGradient(중심 색 → 투명) 타원 5개로 부드러운 광채를 대체 — blur 없음.
//   • .drawingGroup() 으로 한 번 래스터라이즈. 이 뷰는 앱 전역에 1개(FoundOneMobileShell)만 유지.
//   • accessibilityReduceMotion 은 애니메이션이 없어 자동 준수 (환경값만 읽어 향후 확장 대비).
//   • 베이스: --bg-raw #f7f6f3 (베이지)
//

import SwiftUI

// MARK: - AuroraBackground

public struct AuroraBackground: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init() {}

    public var body: some View {
        ZStack {
            // 베이스 — globals.css --bg #f7f6f3
            Color(red: 0xF7/255, green: 0xF6/255, blue: 0xF3/255)

            // 정적 Aurora — 애니메이션 없음(reduceMotion 무관하게 동일 결과).
            GeometryReader { geo in
                let w = geo.size.width
                let h = geo.size.height
                ZStack {
                    // Layer 1 (opacity 0.22 근사)
                    AuroraGlow(color: BUColor.auroraBlue, w: w * 1.5, h: h * 0.75, opacity: 0.26)
                        .offset(x: w * 0.30, y: -h * 0.25)
                    AuroraGlow(color: BUColor.auroraTeal, w: w * 1.3, h: h * 0.65, opacity: 0.30)
                        .offset(x: -w * 0.40, y: h * 0.15)
                    AuroraGlow(color: BUColor.auroraNavy, w: w * 1.7, h: h * 0.55, opacity: 0.16)
                        .offset(x: 0, y: h * 0.55)
                    // Layer 2 (opacity 0.14 근사)
                    AuroraGlow(color: BUColor.auroraSky, w: w * 1.2, h: h * 0.6, opacity: 0.30)
                        .offset(x: -w * 0.25, y: -h * 0.20)
                    AuroraGlow(color: BUColor.auroraBlue, w: w * 1.4, h: h * 0.65, opacity: 0.16)
                        .offset(x: w * 0.20, y: h * 0.25)
                }
                .frame(width: w, height: h)
            }
            .drawingGroup()
            .allowsHitTesting(false)
        }
        .ignoresSafeArea()
    }
}

/// 중심 색 → 투명 방사형 타원 — Gaussian blur 없이 부드러운 광채.
private struct AuroraGlow: View {
    let color: Color
    let w: CGFloat
    let h: CGFloat
    let opacity: Double

    var body: some View {
        // 2026-08-22 반달 수정: 납작한 Ellipse 에 원형 그라데이션을 채우면 짧은 축에서 투명해지기 전에
        // 도형 경계에 잘려 딱딱한 호("반달")가 생긴다. → 원(그라데이션이 정확히 가장자리에서 0)에
        // scaleEffect 로 눌러 타원을 만들면 경계가 항상 완전 투명 — 잘린 에지 0.
        Circle()
            .fill(
                RadialGradient(
                    colors: [color.opacity(opacity), color.opacity(opacity * 0.45), color.opacity(0)],
                    center: .center,
                    startRadius: 0,
                    endRadius: w * 0.5
                )
            )
            .frame(width: w, height: w)
            .scaleEffect(x: 1, y: h / w)
            .frame(width: w, height: h)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Aurora Background") {
    AuroraBackground()
        .overlay(
            VStack(spacing: 20) {
                Text("Found.One")
                    .font(.system(size: 48, weight: .bold))
                Text("매일 5초, 사장님 옆에 함께")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
        )
}
#endif
