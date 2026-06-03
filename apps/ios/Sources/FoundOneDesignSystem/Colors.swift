//
//  Colors.swift — Found.One 컬러 토큰 (웹 SSOT 1:1 미러)
//
//  웹 SSOT (검증 완료):
//   • apps/web/app/globals.css           — 앱 전역 배경, Aurora
//   • apps/web/app/lib/components/dashboard/operationalStyles.ts — PALETTE
//   • CEOMorningHero.tsx 직접 inline values
//
//  변경 시 두 곳 동시 업데이트.
//

import SwiftUI

public enum BUColor {

    // MARK: - App Background (globals.css)
    /// 앱 전역 body 배경 — 베이지 톤 (#f7f6f3)
    public static let appBackground = Color(
        light: Color(red: 0xF7/255, green: 0xF6/255, blue: 0xF3/255),
        dark:  Color(red: 0x0A/255, green: 0x0A/255, blue: 0x14/255)
    )

    // MARK: - Hero Card Gradient (CEOMorningHero outer)
    /// 3-stop diagonal 135deg 라벤더 그라디언트
    /// (#F7F8FE 0% → #EEF0FB 50% → #E5E8F7 100%)
    public static let heroGradientStart = Color(
        light: Color(red: 0xF7/255, green: 0xF8/255, blue: 0xFE/255),
        dark:  Color(red: 0x16/255, green: 0x18/255, blue: 0x28/255)
    )
    public static let heroGradientMid = Color(
        light: Color(red: 0xEE/255, green: 0xF0/255, blue: 0xFB/255),
        dark:  Color(red: 0x12/255, green: 0x14/255, blue: 0x22/255)
    )
    public static let heroGradientEnd = Color(
        light: Color(red: 0xE5/255, green: 0xE8/255, blue: 0xF7/255),
        dark:  Color(red: 0x0E/255, green: 0x10/255, blue: 0x1C/255)
    )

    // MARK: - Card Gradient (heroPanel/opsCard 180deg gradient)
    /// 일반 카드 배경 — linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)
    public static let cardGradientTop = Color(
        light: .white,
        dark:  Color(red: 0x14/255, green: 0x14/255, blue: 0x1E/255)
    )
    public static let cardGradientBottom = Color(
        light: Color(red: 0xF7/255, green: 0xF8/255, blue: 0xFE/255),
        dark:  Color(red: 0x10/255, green: 0x10/255, blue: 0x18/255)
    )

    // MARK: - Surface (Row 2 nested white card)
    public static let surface = appBackground
    public static let surfaceElevated = Color(
        light: .white,
        dark:  Color(red: 0x18/255, green: 0x18/255, blue: 0x22/255)
    )

    // MARK: - Primary / Midnight (operationalStyles PALETTE)
    /// MIDNIGHT — 메인 액센트 (#191970)
    public static let midnight = Color(
        light: Color(red: 0x19/255, green: 0x19/255, blue: 0x70/255),
        dark:  Color(red: 0x6B/255, green: 0x6B/255, blue: 0xC4/255)
    )
    /// MIDNIGHT_DEEP — 핵심 숫자 (#0f0f4a)
    public static let midnightDeep = Color(
        light: Color(red: 0x0F/255, green: 0x0F/255, blue: 0x4A/255),
        dark:  Color(red: 0x9A/255, green: 0x9A/255, blue: 0xD8/255)
    )
    /// MIDNIGHT_INK — 호환용 primary (#1d3557)
    public static let midnightInk = Color(
        light: Color(red: 0x1D/255, green: 0x35/255, blue: 0x57/255),
        dark:  Color(red: 0x8A/255, green: 0xB0/255, blue: 0xD5/255)
    )
    /// MIDNIGHT_BRIGHT — 밝은 미드나이트 블루 (#3A3AC8) — 나선 로고/액센트
    public static let midnightBright = Color(
        light: Color(red: 0x3A/255, green: 0x3A/255, blue: 0xC8/255),
        dark:  Color(red: 0x7E/255, green: 0x7E/255, blue: 0xE8/255)
    )
    public static let midnight08 = midnight.opacity(0.08)
    public static let midnight12 = midnight.opacity(0.12)
    public static let midnight18 = midnight.opacity(0.18)

    // MARK: - Text
    /// INK — 본문 (#0f172a)
    public static let ink = Color(
        light: Color(red: 0x0F/255, green: 0x17/255, blue: 0x2A/255),
        dark:  Color(red: 0xF1/255, green: 0xF5/255, blue: 0xF9/255)
    )
    public static let inkSecondary = ink.opacity(0.62)
    public static let inkMuted = Color(
        light: Color(red: 0x0F/255, green: 0x17/255, blue: 0x2A/255).opacity(0.55),
        dark:  Color(red: 0xF1/255, green: 0xF5/255, blue: 0xF9/255).opacity(0.55)
    )
    public static let inkMuted45 = ink.opacity(0.45)
    public static let inkSubtle = ink.opacity(0.30)

    // MARK: - Border (rgba(25,25,112,0.10) / 0.08 for hero)
    public static let cardBorder = midnight.opacity(0.10)
    public static let heroBorder = midnight.opacity(0.08)
    public static let borderSubtle = midnight.opacity(0.06)
    public static let border = cardBorder  // alias

    // MARK: - Semantic (globals.css value-positive / negative 톤 = less saturated)
    /// SUCCESS — #177245 (globals.css value-positive) — 차분한 진녹색
    /// (operationalStyles PALETTE.SUCCESS #34c759 보다 사용자 보기 편함)
    public static let success = Color(
        light: Color(red: 0x17/255, green: 0x72/255, blue: 0x45/255),
        dark:  Color(red: 0x4A/255, green: 0xBE/255, blue: 0x7F/255)
    )
    public static let success08 = success.opacity(0.08)
    public static let successGlow = success.opacity(0.08)

    /// WARN — #c58b2a (차분한 ocher, --warning)
    public static let warn = Color(
        light: Color(red: 0xC5/255, green: 0x8B/255, blue: 0x2A/255),
        dark:  Color(red: 0xE3/255, green: 0xAE/255, blue: 0x5B/255)
    )
    public static let warn08 = warn.opacity(0.08)

    /// DANGER — #b42318 (globals.css value-negative) — 차분한 빨강
    public static let danger = Color(
        light: Color(red: 0xB4/255, green: 0x23/255, blue: 0x18/255),
        dark:  Color(red: 0xE5/255, green: 0x6B/255, blue: 0x5C/255)
    )
    public static let danger08 = danger.opacity(0.08)
    public static let dangerGlow = danger.opacity(0.08)

    // MARK: - Hero tones (HeroResolver tone)
    public static let toneCrisis  = danger
    public static let toneWarning = warn
    public static let toneNeutral = midnight

    // MARK: - Primary Button Gradient (135deg #1E2A55 → #2C4F80)
    public static let primaryButtonStart = Color(
        light: Color(red: 0x1E/255, green: 0x2A/255, blue: 0x55/255),
        dark:  Color(red: 0x3A/255, green: 0x52/255, blue: 0x8C/255)
    )
    public static let primaryButtonEnd = Color(
        light: Color(red: 0x2C/255, green: 0x4F/255, blue: 0x80/255),
        dark:  Color(red: 0x52/255, green: 0x7A/255, blue: 0xB4/255)
    )

    // MARK: - Aurora (globals.css aurora-1 ~ aurora-5)
    public static let auroraNavy = Color(red: 0x1D/255, green: 0x35/255, blue: 0x57/255)
    public static let auroraBlue = Color(red: 0x45/255, green: 0x7B/255, blue: 0x9D/255)
    public static let auroraTeal = Color(red: 0xA8/255, green: 0xDA/255, blue: 0xDC/255)
    public static let auroraSky  = Color(red: 0xE0/255, green: 0xF0/255, blue: 0xFF/255)

    // MARK: - Radial glow (Hero card 안 ambient glow)
    public static let glowBlue   = Color(red: 0x5B/255, green: 0x6B/255, blue: 0xFF/255)  // rgba(91,107,255)
    public static let glowMidnight = midnight  // rgba(25,25,112)
}

// MARK: - Light/Dark adaptive helper

extension Color {
    init(light: Color, dark: Color) {
        #if canImport(UIKit)
        self.init(
            UIColor { trait in
                trait.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
            }
        )
        #else
        self = light
        #endif
    }

    // hex / rgb helper 는 HealthColors.swift 에 정의 — 중복 회피
}
