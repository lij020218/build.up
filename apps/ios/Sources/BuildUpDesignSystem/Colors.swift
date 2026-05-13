//
//  Colors.swift — build.up 컬러 토큰
//
//  웹 디자인 시스템 (packages/shared 및 globals.css) 과 동기화된 SSOT.
//  변경 시 두 곳 동시 업데이트 — Light Mode 는 웹과 동일, Dark Mode 는 iOS 적응.
//
//  철학 (MEMORY.md feedback_buildup_design_tokens.md):
//   • Lavender Mist 배경 + Midnight Navy 액센트
//   • 신호등 컬러 금지 (위험 시에만 → HealthColors.swift)
//   • Apple HIG 색상 시스템 위에 빌드 (System color 우선)
//

import SwiftUI

public enum BUColor {
    // MARK: - Primary (Midnight Navy)
    // 웹: #191970 (PRIMARY) / #0f0f4a (DEEP) / #162b45 (HOVER)
    // iOS 26 Liquid Glass 위에서도 충분한 contrast 확보

    public static let midnight = Color(
        light: Color(red: 0x19/255, green: 0x19/255, blue: 0x70/255),  // #191970
        dark:  Color(red: 0x6B/255, green: 0x6B/255, blue: 0xC4/255)   // 밝은 라벤더 톤 (Dark 적응)
    )

    public static let midnightDeep = Color(
        light: Color(red: 0x0F/255, green: 0x0F/255, blue: 0x4A/255),  // #0f0f4a
        dark:  Color(red: 0x9A/255, green: 0x9A/255, blue: 0xD8/255)
    )

    public static let midnightHover = Color(
        light: Color(red: 0x16/255, green: 0x2B/255, blue: 0x45/255),
        dark:  Color(red: 0x5C/255, green: 0x6F/255, blue: 0x8C/255)
    )

    // MARK: - Surface (Lavender Mist)
    // 웹: linear-gradient(180deg, #fafbfe, #f3f4fa) → iOS 는 단색 + Material 결합
    // iOS 26 Liquid Glass 가 깔리는 베이스 컬러

    public static let surface = Color(
        light: Color(red: 0xFA/255, green: 0xFB/255, blue: 0xFE/255),  // 매우 옅은 라벤더
        dark:  Color(red: 0x0A/255, green: 0x0A/255, blue: 0x14/255)   // 거의 검정 + 라벤더 hint
    )

    public static let surfaceElevated = Color(
        light: .white,
        dark:  Color(red: 0x14/255, green: 0x14/255, blue: 0x1E/255)
    )

    // MARK: - Text
    // 웹: #0f172a (ink) / rgba(15,23,42, 0.6 / 0.4 / 0.25 muted variants)

    public static let ink = Color(
        light: Color(red: 0x0F/255, green: 0x17/255, blue: 0x2A/255),
        dark:  Color(red: 0xF1/255, green: 0xF5/255, blue: 0xF9/255)
    )

    public static let inkSecondary = Color(
        light: Color(red: 0x0F/255, green: 0x17/255, blue: 0x2A/255).opacity(0.6),
        dark:  Color(red: 0xF1/255, green: 0xF5/255, blue: 0xF9/255).opacity(0.7)
    )

    public static let inkMuted = Color(
        light: Color(red: 0x0F/255, green: 0x17/255, blue: 0x2A/255).opacity(0.4),
        dark:  Color(red: 0xF1/255, green: 0xF5/255, blue: 0xF9/255).opacity(0.5)
    )

    public static let inkSubtle = Color(
        light: Color(red: 0x0F/255, green: 0x17/255, blue: 0x2A/255).opacity(0.25),
        dark:  Color(red: 0xF1/255, green: 0xF5/255, blue: 0xF9/255).opacity(0.3)
    )

    // MARK: - Border / Divider
    public static let border = Color(
        light: Color(red: 0x19/255, green: 0x19/255, blue: 0x70/255).opacity(0.10),
        dark:  Color.white.opacity(0.08)
    )

    public static let borderSubtle = Color(
        light: Color(red: 0x19/255, green: 0x19/255, blue: 0x70/255).opacity(0.06),
        dark:  Color.white.opacity(0.04)
    )

    // MARK: - Accent (사용 자제 — 위험 시에만)
    // HealthColors.swift 의 critical/warning/caution/healthy 사용 권장.
    // 본 enum 은 Apple HIG semantic color 만 노출.

    public static let success = Color(
        light: Color(red: 0x0E/255, green: 0x7C/255, blue: 0x3A/255),  // 차분한 녹색
        dark:  Color(red: 0x34/255, green: 0xC7/255, blue: 0x59/255)
    )

    public static let danger = Color(
        light: Color(red: 0xB3/255, green: 0x24/255, blue: 0x19/255),
        dark:  Color(red: 0xFF/255, green: 0x6B/255, blue: 0x6B/255)
    )

    // MARK: - Hero Tag (CEOMorningHero / heroInsight.tsx tone 매핑)
    public static let toneCrisis  = danger
    public static let toneWarning = Color(
        light: Color(red: 0xB4/255, green: 0x53/255, blue: 0x09/255),
        dark:  Color(red: 0xFF/255, green: 0xB7/255, blue: 0x4D/255)
    )
    public static let toneNeutral = midnight
}

// MARK: - Helper — Light/Dark adaptive Color
// Color(light:dark:) 헬퍼 — UIKit 의 dynamicProvider 를 SwiftUI 에서 사용 가능하게 wrap.

extension Color {
    /// Light / Dark 적응 색상을 한 줄로 정의.
    init(light: Color, dark: Color) {
        #if canImport(UIKit)
        self.init(
            UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark: return UIColor(dark)
                default:    return UIColor(light)
                }
            }
        )
        #else
        self = light
        #endif
    }
}
