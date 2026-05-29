//
//  Typography.swift — Found.One 타이포그래피 (웹 SSOT 1:1 미러)
//
//  웹 SSOT (operationalStyles.ts + CEOMorningHero inline):
//   heroTitle:        clamp(28-40px) / weight 600 / -0.025em / color #1d1d1f
//   heroBody:         15px / lineHeight 1.65 / color rgba(15,23,42,0.62)
//   heroEyebrow:      12px / 0.14em / uppercase / color rgba(15,23,42,0.48)
//   headlineValue:    26px / weight 780 / -0.045em / tabular-nums
//   headlineLabel:    11px / 0.08em / uppercase / color rgba(15,23,42,0.48)
//   headlineNote:     12px / lineHeight 1.5 / color rgba(15,23,42,0.52)
//   sectionEyebrow:   10.5px / weight 700 / 0.1em / uppercase / color #191970 / opacity 0.7
//   activityTitle:    24px / weight 700 / -0.04em / color #0f172a
//   detailSectionTitle: 20px / weight 720 / -0.03em / color #0f172a
//
//  CEOMorningHero inline:
//   Row 1 eyebrow:    10.5px / 700 / 0.14em / uppercase / MIDNIGHT opacity 0.65
//   Row 1 chip:       10px / 700 / 0.06-0.08em / pill
//   Row 1 greeting:   18px / 700 / -0.02em / lineHeight 1.35 / MIDNIGHT_DEEP
//   Row 1 subgreeting:13.5px / MUTED / lineHeight 1.5
//   Row 2 NSM value:  clamp(34-44px) / 700 / -0.045em / tabular / MIDNIGHT_DEEP
//   Row 2 NSM eyebrow:11px / 700 / 0.1em / uppercase / MIDNIGHT opacity 0.7
//   Row 2 delta:      12.5px / 700 / tabular
//   Row 2 deltaLabel: 11.5px / 600 / opacity 0.75
//   Row 2 desc:       12.5px / 500 / MUTED / lineHeight 1.5
//
//  ⚠️ 폰트는 SF Pro Display + Apple SD Gothic Neo (iOS auto fallback for ko).
//

import SwiftUI

public enum BUFont {

    // MARK: - Hero outer (CEOMorningHero)
    /// Hero greeting (18px / 700 / -0.02em)
    public static let heroGreeting = Font.system(size: 18, weight: .bold, design: .default)
    /// Hero sub-greeting (13.5px)
    public static let heroSubgreeting = Font.system(size: 13.5, weight: .regular)

    /// Hero eyebrow (10.5px / 700 / 0.14em / uppercase)
    public static let heroEyebrow = Font.system(size: 10.5, weight: .bold)

    /// Hero chip (10px / 700)
    public static let heroChip = Font.system(size: 10, weight: .bold)

    // MARK: - NSM Main metric (Row 2 - 큰 숫자)
    /// NSM 메인 숫자 — clamp(34-44px) → 모바일 34pt / 700 / -0.045em
    public static let nsmValue = Font.system(size: 34, weight: .bold, design: .default).monospacedDigit()

    /// NSM eyebrow (11px / 700 / 0.1em / uppercase / MIDNIGHT opacity 0.7)
    public static let nsmEyebrow = Font.system(size: 11, weight: .bold)

    /// NSM delta pill 숫자 (12.5px / 700 / tabular)
    public static let nsmDelta = Font.system(size: 12.5, weight: .bold).monospacedDigit()
    public static let nsmDeltaLabel = Font.system(size: 11.5, weight: .semibold)

    /// NSM description (12.5px / 500)
    public static let nsmDescription = Font.system(size: 12.5, weight: .medium)

    // MARK: - Headline KPI (Tier 1.2 미니카드)
    /// headlineValue (26px / 780(.heavy) / -0.045em / tabular)
    public static let headlineValue = Font.system(size: 26, weight: .heavy, design: .default).monospacedDigit()

    /// headlineLabel (11px / 0.08em / uppercase / rgba(15,23,42,0.48))
    public static let headlineLabel = Font.system(size: 11, weight: .semibold)

    /// headlineNote (12px / 1.5 lineHeight / rgba(15,23,42,0.52))
    public static let headlineNote = Font.system(size: 12, weight: .regular)

    // MARK: - Section / Activity card
    /// activityTitle (24px / 700 / -0.04em / #0f172a)
    public static let activityTitle = Font.system(size: 24, weight: .bold, design: .default)
    /// activityMiniValue (22px / 700 / -0.05em)
    public static let activityMiniValue = Font.system(size: 22, weight: .bold).monospacedDigit()
    /// activityMiniLabel (11px / rgba(15,23,42,0.48))
    public static let activityMiniLabel = Font.system(size: 11, weight: .regular)

    /// sectionEyebrow (10.5px / 700 / 0.1em / uppercase / MIDNIGHT opacity 0.7)
    public static let sectionEyebrow = Font.system(size: 10.5, weight: .bold)

    /// detailSectionTitle (20px / 720(.bold+) / -0.03em / #0f172a)
    public static let detailSectionTitle = Font.system(size: 20, weight: .bold, design: .default)

    // MARK: - 기존 alias (점진적 교체)
    public static let heroNumber = nsmValue
    public static let bigNumber = activityMiniValue
    public static let cardTitle = activityTitle
    public static let cardTitleSmall = detailSectionTitle
    public static let body = Font.system(.body, design: .default)
    public static let bodySmall = Font.system(size: 13.5, weight: .regular)
    public static let bodyCaption = Font.system(size: 12, weight: .regular)
    public static let label = Font.system(size: 13, weight: .bold)
    public static let labelSmall = Font.system(size: 12.5, weight: .medium)
    public static let eyebrow = sectionEyebrow
    public static let eyebrowLarge = heroEyebrow
}

// MARK: - View modifier helpers (정확한 tracking + lineHeight + color)

public extension View {

    // ── Hero outer Row 1 ──

    /// Hero eyebrow — MIDNIGHT opacity 0.65 / 0.14em / uppercase
    func buHeroEyebrowStyle() -> some View {
        self.font(BUFont.heroEyebrow)
            .foregroundStyle(BUColor.midnight.opacity(0.65))
            .tracking(1.5)               // ≈ 0.14em * 10.5px
            .textCase(.uppercase)
    }

    /// Hero greeting — MIDNIGHT_DEEP / 700 / -0.02em / lineHeight 1.35
    func buHeroGreetingStyle() -> some View {
        self.font(BUFont.heroGreeting)
            .foregroundStyle(BUColor.midnightDeep)
            .tracking(-0.36)             // -0.02em * 18px
            .lineSpacing(2.5)
    }

    /// Hero sub greeting — MUTED / 13.5px / lineHeight 1.5
    func buHeroSubgreetingStyle() -> some View {
        self.font(BUFont.heroSubgreeting)
            .foregroundStyle(BUColor.inkSecondary)
            .lineSpacing(3.5)
    }

    // ── Row 2 NSM ──

    /// NSM eyebrow — MIDNIGHT opacity 0.7 / 0.1em / uppercase
    func buNsmEyebrowStyle() -> some View {
        self.font(BUFont.nsmEyebrow)
            .foregroundStyle(BUColor.midnight.opacity(0.7))
            .tracking(1.1)
            .textCase(.uppercase)
    }

    /// NSM 메인 숫자 — MIDNIGHT_DEEP / 700 / -0.045em / lineHeight 1
    func buNsmValueStyle() -> some View {
        self.font(BUFont.nsmValue)
            .foregroundStyle(BUColor.midnightDeep)
            .tracking(-1.5)              // -0.045em * 34px
            .lineSpacing(0)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
    }

    /// NSM description — MUTED / 500 / lineHeight 1.5
    func buNsmDescriptionStyle() -> some View {
        self.font(BUFont.nsmDescription)
            .foregroundStyle(BUColor.inkMuted)
            .lineSpacing(3.5)
    }

    // ── Headline KPI ──

    /// Headline label — 0.08em / uppercase / rgba(15,23,42,0.48)
    func buHeadlineLabelStyle() -> some View {
        self.font(BUFont.headlineLabel)
            .foregroundStyle(BUColor.ink.opacity(0.48))
            .tracking(0.88)              // 0.08em * 11px
            .textCase(.uppercase)
    }

    /// Headline value — 26px / .heavy / -0.045em / tabular
    func buHeadlineValueStyle(color: Color? = nil) -> some View {
        self.font(BUFont.headlineValue)
            .foregroundStyle(color ?? BUColor.ink)
            .tracking(-1.17)             // -0.045em * 26px
            .lineSpacing(0)
            .minimumScaleFactor(0.7)
            .lineLimit(1)
    }

    /// Headline note — 12px / rgba(15,23,42,0.52)
    func buHeadlineNoteStyle() -> some View {
        self.font(BUFont.headlineNote)
            .foregroundStyle(BUColor.ink.opacity(0.52))
            .lineSpacing(3)
    }

    // ── Section / Activity ──

    /// activityTitle — 24px / 700 / -0.04em / #0f172a
    func buActivityTitleStyle() -> some View {
        self.font(BUFont.activityTitle)
            .foregroundStyle(BUColor.ink)
            .tracking(-0.96)             // -0.04em * 24px
    }

    /// section eyebrow — MIDNIGHT opacity 0.7 / 0.1em / uppercase
    func buSectionEyebrowStyle() -> some View {
        self.font(BUFont.sectionEyebrow)
            .foregroundStyle(BUColor.midnight.opacity(0.7))
            .tracking(1.05)
            .textCase(.uppercase)
    }

    /// detailSectionTitle — 20px / .bold / -0.03em
    func buDetailTitleStyle() -> some View {
        self.font(BUFont.detailSectionTitle)
            .foregroundStyle(BUColor.ink)
            .tracking(-0.6)
    }

    // ── 기존 alias (점진적 교체) ──
    func buHeroNumberStyle(color: Color = BUColor.midnightDeep) -> some View {
        self.font(BUFont.nsmValue).foregroundStyle(color).tracking(-1.5).lineLimit(1)
    }
    func buCardTitleStyle(color: Color = BUColor.ink) -> some View {
        self.font(BUFont.activityTitle).foregroundStyle(color).tracking(-0.96)
    }
    func buEyebrowStyle(color: Color? = nil) -> some View {
        self.font(BUFont.sectionEyebrow)
            .foregroundStyle(color ?? BUColor.midnight.opacity(0.7))
            .tracking(1.05)
            .textCase(.uppercase)
    }
    func buAnalysisStyle(color: Color = BUColor.inkSecondary) -> some View {
        self.font(BUFont.bodySmall).foregroundStyle(color).lineSpacing(4)
    }
}
