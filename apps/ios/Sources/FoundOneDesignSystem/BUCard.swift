//
//  BUCard.swift — Found.One 표준 카드 컴포넌트 (웹 SSOT 1:1 미러)
//
//  웹 카드 패턴 (operationalStyles.ts + CEOMorningHero):
//
//   Hero outer (CEOMorningHero):
//     radius 24 / padding 28-28-24 / 3-stop diagonal gradient (#F7F8FE → #EEF0FB → #E5E8F7)
//     border 1px rgba(25,25,112,0.08)
//     shadow: inset highlight + 0 8px 32px rgba(25,25,112,0.06)
//     + 2 radial ambient glows (right-top blue / left-bottom midnight)
//
//   Outer card (heroPanel/opsCard/activityCard):
//     radius 20 / padding 22 / 180deg gradient (#fff → #f7f8fe)
//     border 1px rgba(25,25,112,0.10)
//     shadow: 0 1px 3px + 0 12px 24px -12px (dual layer)
//
//   Headline (KPI 미니카드):
//     radius 16 / padding 20 / 동일 gradient + border + shadow
//
//   Nested white (Row 2 NSM):
//     radius 18 / padding 20-22 / solid white / no shadow
//
//   Inner block (Row 1.5 위험신호 + activityMiniStat):
//     radius 14 / padding 13-15 / HEALTH_COLORS tint bg / no shadow
//

import SwiftUI
import FoundOneCore

// MARK: - BUCardStyle (top-level)

public enum BUCardStyle: Sendable {
    case heroOuter   // CEOMorningHero outer
    case outer       // heroPanel/opsCard/activityCard
    case headline    // KPI 미니카드
    case nested      // Row 2 NSM white card
    case inner       // 위험신호 박스 / mini stat

    // MARK: - 후방 호환 alias (점진적 마이그레이션)
    public static let hero: BUCardStyle = .heroOuter
    public static let card: BUCardStyle = .outer
    public static let subtle: BUCardStyle = .inner
    public static let chip: BUCardStyle = .inner

    public var radius: CGFloat {
        switch self {
        case .heroOuter: return BURadius.heroOuter      // 24
        case .outer:     return BURadius.outerCard      // 20
        case .nested:    return BURadius.nestedCard     // 18
        case .headline:  return BURadius.headlineCard   // 16
        case .inner:     return BURadius.innerBlock     // 14
        }
    }
    public var paddingV: CGFloat {
        switch self {
        case .heroOuter: return BUSpacing.heroOuterPadding     // 18 (모바일)
        case .outer:     return BUSpacing.cardPadding          // 18
        case .nested:    return BUSpacing.nestedCardPaddingV   // 16
        case .headline:  return BUSpacing.headlinePadding      // 16
        case .inner:     return 11
        }
    }
    public var paddingH: CGFloat {
        switch self {
        case .heroOuter: return BUSpacing.heroOuterPadding     // 18
        case .outer:     return BUSpacing.cardPadding          // 18
        case .nested:    return BUSpacing.nestedCardPaddingH   // 18
        case .headline:  return BUSpacing.headlinePadding      // 16
        case .inner:     return 13
        }
    }
    public var paddingBottom: CGFloat {
        self == .heroOuter ? BUSpacing.heroOuterPaddingBottom : paddingV
    }
}

// MARK: - BUCard

public struct BUCard<Content: View>: View {

    public typealias Style = BUCardStyle

    let style: Style
    let tint: Color?
    let content: Content

    public init(
        _ style: Style,
        tint: Color? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.style = style
        self.tint = tint
        self.content = content()
    }

    public var body: some View {
        content
            .padding(EdgeInsets(
                top: style.paddingV,
                leading: style.paddingH,
                bottom: style.paddingBottom,
                trailing: style.paddingH
            ))
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(backgroundView)
            .overlay(borderOverlay)
            .overlay(insetHighlightOverlay)
            .clipShape(RoundedRectangle(cornerRadius: style.radius, style: .continuous))
            .modifier(BUCardShadowModifier(style: style))
    }

    // MARK: Background

    @ViewBuilder
    private var backgroundView: some View {
        switch style {
        case .heroOuter:
            ZStack {
                LinearGradient(
                    stops: [
                        .init(color: BUColor.heroGradientStart, location: 0.0),
                        .init(color: BUColor.heroGradientMid,   location: 0.5),
                        .init(color: BUColor.heroGradientEnd,   location: 1.0),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [BUColor.glowBlue.opacity(0.10), BUColor.glowBlue.opacity(0)],
                            center: .center,
                            startRadius: 0,
                            endRadius: 180
                        )
                    )
                    .frame(width: 360, height: 360)
                    .offset(x: 140, y: -180)
                    .allowsHitTesting(false)
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [BUColor.glowMidnight.opacity(0.06), BUColor.glowMidnight.opacity(0)],
                            center: .center,
                            startRadius: 0,
                            endRadius: 120
                        )
                    )
                    .frame(width: 240, height: 240)
                    .offset(x: -100, y: 140)
                    .allowsHitTesting(false)
            }

        case .outer, .headline:
            LinearGradient(
                colors: [BUColor.cardGradientTop, BUColor.cardGradientBottom],
                startPoint: .top,
                endPoint: .bottom
            )

        case .nested:
            BUColor.surfaceElevated

        case .inner:
            (tint ?? BUColor.midnight).opacity(0.04)
        }
    }

    // MARK: Border

    @ViewBuilder
    private var borderOverlay: some View {
        switch style {
        case .heroOuter:
            RoundedRectangle(cornerRadius: style.radius, style: .continuous)
                .strokeBorder(BUColor.heroBorder, lineWidth: 1)
        case .outer, .headline:
            RoundedRectangle(cornerRadius: style.radius, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        case .nested:
            RoundedRectangle(cornerRadius: style.radius, style: .continuous)
                .strokeBorder(BUColor.borderSubtle, lineWidth: 0.5)
        case .inner:
            RoundedRectangle(cornerRadius: style.radius, style: .continuous)
                .strokeBorder(
                    tint?.opacity(0.25) ?? BUColor.borderSubtle,
                    lineWidth: 0.5
                )
        }
    }

    // MARK: Inset highlight (heroOuter)

    @ViewBuilder
    private var insetHighlightOverlay: some View {
        if style == .heroOuter {
            RoundedRectangle(cornerRadius: style.radius, style: .continuous)
                .stroke(Color.white.opacity(0.6), lineWidth: 1)
                .blendMode(.overlay)
                .padding(0.5)
                .mask(
                    LinearGradient(
                        colors: [.white, .clear],
                        startPoint: .top,
                        endPoint: .center
                    )
                )
                .allowsHitTesting(false)
        }
    }
}

// MARK: - Shadow

private struct BUCardShadowModifier: ViewModifier {
    let style: BUCardStyle

    func body(content: Content) -> some View {
        switch style {
        case .heroOuter:
            content.buShadow(.hero)
        case .outer, .headline:
            content.buShadow(.card)
        case .nested, .inner:
            content
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUCard — CEOMorningHero 미러") {
    ZStack {
        BUBackgroundSurface()

        ScrollView {
            VStack(spacing: BUSpacing.shellGap) {

                // Hero outer 카드 — 웹 CEOMorningHero 정확 미러
                BUCard(.heroOuter) {
                    VStack(alignment: .leading, spacing: BUSpacing.heroGap) {

                        // Row 1
                        VStack(alignment: .leading, spacing: 6) {
                            Text("5월 13일 수요일 · 운영 모드")
                                .buHeroEyebrowStyle()
                            HStack(spacing: 6) {
                                pillFilled("운영 247일째")
                                pillSoft("성장 (안정화)")
                                pillTrend(8.7)
                            }
                            Text("좋은 아침, 김사장")
                                .buHeroGreetingStyle()
                                .padding(.top, 4)
                            Text("성심당 본점 · 운영 247일째")
                                .buHeroSubgreetingStyle()
                        }

                        // Row 1.5 위험신호
                        BUCard(.inner, tint: BUColor.danger) {
                            HStack(alignment: .top, spacing: 11) {
                                Circle()
                                    .fill(BUColor.danger)
                                    .frame(width: 9, height: 9)
                                    .padding(.top, 5)
                                VStack(alignment: .leading, spacing: 3) {
                                    HStack(spacing: 8) {
                                        Text("현금 흐름 위험")
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundStyle(BUColor.danger)
                                        Text("긴급")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundStyle(BUColor.danger.opacity(0.7))
                                            .tracking(0.5)
                                            .textCase(.uppercase)
                                    }
                                    Text("런웨이 0.5개월 — 영역 점수 5점")
                                        .font(.system(size: 12.5, weight: .medium))
                                        .foregroundStyle(BUColor.ink.opacity(0.7))
                                        .lineSpacing(2)
                                }
                                Spacer(minLength: 0)
                            }
                        }

                        // Row 2 nested NSM card
                        BUCard(.nested) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("오늘 매출").buNsmEyebrowStyle()
                                Text("870,000").buNsmValueStyle()
                                Text("어제보다 +18% 성장").buNsmDescriptionStyle()
                            }
                        }
                    }
                }

                // Outer card (Tier 1.2)
                BUCard(.outer) {
                    VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                        Text("매출 흐름").buActivityTitleStyle()
                        Text("최근 7일 일평균 89만원")
                            .font(BUFont.headlineNote)
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }

                // Headline KPI grid
                HStack(spacing: BUSpacing.cardGap) {
                    BUCard(.headline) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("어제 매출").buHeadlineLabelStyle()
                            Text("870,000").buHeadlineValueStyle()
                            Text("일평균 89만원").buHeadlineNoteStyle()
                        }
                    }
                    BUCard(.headline) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("런웨이").buHeadlineLabelStyle()
                            Text("8.3").buHeadlineValueStyle(color: BUColor.success)
                            Text("개월 · 안정").buHeadlineNoteStyle()
                        }
                    }
                }
            }
            .padding(BUSpacing.screenMargin)
        }
    }
}

@ViewBuilder
private func pillFilled(_ text: String) -> some View {
    Text(text)
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(.white)
        .tracking(0.6)
        .padding(.horizontal, 8)
        .padding(.vertical, 2)
        .background(BUColor.midnight, in: Capsule())
}
@ViewBuilder
private func pillSoft(_ text: String) -> some View {
    Text(text)
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(BUColor.midnight)
        .tracking(0.5)
        .padding(.horizontal, 8)
        .padding(.vertical, 2)
        .background(BUColor.midnight08, in: Capsule())
}
@ViewBuilder
private func pillTrend(_ pct: Double) -> some View {
    let positive = pct >= 0
    HStack(spacing: 2) {
        Image(systemName: positive ? "arrow.up.right" : "arrow.down.right")
            .font(.system(size: 9, weight: .heavy))
        Text("\(positive ? "+" : "")\(String(format: "%.1f", pct))%")
            .font(.system(size: 10, weight: .bold))
            .monospacedDigit()
    }
    .foregroundStyle(positive ? BUColor.success : BUColor.danger)
    .tracking(0.4)
    .padding(.horizontal, 8)
    .padding(.vertical, 2)
    .background(
        (positive ? BUColor.success : BUColor.danger).opacity(0.10),
        in: Capsule()
    )
}
#endif
