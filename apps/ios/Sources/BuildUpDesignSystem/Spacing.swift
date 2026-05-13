//
//  Spacing.swift — 8pt 그리드 시스템
//
//  Apple HIG 권장 8pt grid + build.up 카드 내부 22px padding 호환.
//  모바일 최적화: 좌우 margin 16pt (Apple 표준) — 카드는 full-width 1-col.
//

import SwiftUI
import CoreGraphics

public enum BUSpacing {
    // MARK: - Base 8pt grid
    public static let xxs: CGFloat = 4
    public static let xs:  CGFloat = 8
    public static let sm:  CGFloat = 12
    public static let md:  CGFloat = 16    // ← 화면 좌우 margin 기본
    public static let lg:  CGFloat = 20    // ← 카드 내부 padding 기본
    public static let xl:  CGFloat = 24
    public static let xxl: CGFloat = 32
    public static let xxxl: CGFloat = 48

    // MARK: - Card-specific (웹 22px 와 호환)
    /// 카드 내부 padding 표준 (웹 22px ≈ iOS 20pt — 시각적 동등)
    public static let cardPadding: CGFloat = lg

    /// 카드 간 vertical gap (Tier 2 / Tier 3 카드 스택)
    public static let cardGap: CGFloat = sm

    /// Tier 간 vertical gap (Hero → Daily Hub → Coaching)
    public static let tierGap: CGFloat = xl

    // MARK: - Tap target
    /// Apple HIG 최소 44×44pt 터치 영역.
    public static let minTapTarget: CGFloat = 44

    /// 큰 숫자 키패드 버튼 — 손가락이 잡기 편한 크기
    public static let numberPadButton: CGFloat = 64
}

// MARK: - Corner radius (Apple iOS 26 Continuous corners)

public enum BURadius {
    /// 작은 chip / pill — capsule 권장 시엔 .capsule
    public static let xs: CGFloat = 8

    /// 칩 / 작은 버튼
    public static let sm: CGFloat = 10

    /// 보조 카드
    public static let md: CGFloat = 14

    /// 메인 카드 (웹 16-18px ≈ iOS 16pt)
    public static let lg: CGFloat = 16

    /// Hero 카드 / 큰 카드 (웹 20-28px)
    public static let xl: CGFloat = 22

    /// Sheet / Modal 상단 (iOS 표준)
    public static let sheet: CGFloat = 38

    /// Capsule (작은 chip / pill — height 따라 자동)
    public static let capsule: CGFloat = .infinity
}

// MARK: - Shadow (iOS 표준 + 웹 box-shadow 매핑)

public struct BUShadow: Sendable {
    public let color: Color
    public let radius: CGFloat
    public let x: CGFloat
    public let y: CGFloat

    /// 카드 elevation (웹 0 18px 42px rgba(15,23,42,0.038) ≈)
    public static let card = BUShadow(
        color: Color.black.opacity(0.04),
        radius: 14,
        x: 0,
        y: 6
    )

    /// Hero 카드 (조금 더 깊은 그림자)
    public static let hero = BUShadow(
        color: Color.black.opacity(0.06),
        radius: 24,
        x: 0,
        y: 12
    )

    /// 위험 신호 — colored shadow
    public static func tinted(_ tint: Color, intensity: Double = 0.12) -> BUShadow {
        BUShadow(
            color: tint.opacity(intensity),
            radius: 12,
            x: 0,
            y: 6
        )
    }
}

public extension View {
    func buShadow(_ shadow: BUShadow) -> some View {
        self.shadow(
            color: shadow.color,
            radius: shadow.radius,
            x: shadow.x,
            y: shadow.y
        )
    }
}
