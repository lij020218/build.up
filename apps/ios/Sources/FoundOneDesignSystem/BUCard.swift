//
//  BUCard.swift — Found.One 표준 카드 컴포넌트.
//
//  2026-09-12 개편 (사장님 승인한 미리보기 기준):
//
//   카드는 **두 종류**뿐이다.
//    · 바깥 카드(heroOuter / outer)
//        흰색 불투명 · 모서리 20 · 여백 18 · 0.5pt 헤어라인 경계 · 얕은 그림자 한 겹
//    · 카드 안 구획(nested)
//        채움 없음. 위쪽 0.5pt 구분선 하나로만 나눈다 → 흰 면이 이어져 가볍게 읽힌다.
//    · 안쪽 면(headline / inner)
//        옅은 채움(subtleFill)만. 경계·그림자 없음. inner 에 tint 를 주면 경고 박스(모서리 16).
//
//  왜 이렇게 바꿨나:
//   종전에는 모서리 24/20/18/16/14 다섯 단계 + 그라디언트 3종 + 테두리 3겹 + inset highlight 가
//   겹쳐 홈 히어로가 "카드 안의 카드 안의 카드"가 됐다. 모서리 단계가 필요했던 이유는
//   중첩 그 자체였으므로, 중첩을 없애니 단계도 필요 없어졌다.
//
//  수치는 BURadius / BUSpacing 한 곳에서만 정의한다 (Spacing.swift).
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
        // 전부 20 (inner 만 16) — 실제 값은 BURadius 한 곳에서 바꾼다.
        case .heroOuter: return BURadius.heroOuter
        case .outer:     return BURadius.outerCard
        case .nested:    return BURadius.nestedCard
        case .headline:  return BURadius.headlineCard
        case .inner:     return BURadius.innerBlock
        }
    }
    public var paddingV: CGFloat {
        switch self {
        case .heroOuter: return BUSpacing.heroOuterPadding
        case .outer:     return BUSpacing.cardPadding
        case .nested:    return BUSpacing.nestedCardPaddingV
        case .headline:  return BUSpacing.headlinePadding
        case .inner:     return 13
        }
    }
    public var paddingH: CGFloat {
        switch self {
        case .heroOuter: return BUSpacing.heroOuterPadding
        case .outer:     return BUSpacing.cardPadding
        // nested 는 '카드 안 구획' — 가로 여백을 또 주면 글이 두 번 들여써진다.
        case .nested:    return 0
        case .headline:  return BUSpacing.headlinePadding
        case .inner:     return 15
        }
    }
    public var paddingBottom: CGFloat {
        switch self {
        case .heroOuter: return BUSpacing.heroOuterPaddingBottom
        case .nested:    return BUSpacing.nestedCardPaddingBottom
        default:         return paddingV
        }
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
            .clipShape(RoundedRectangle(cornerRadius: style == .nested ? 0 : style.radius, style: .continuous))
            .modifier(BUCardShadowModifier(style: style))
    }

    // MARK: Background

    /// 2026-09-12 개편: 카드는 **두 종류**뿐이다.
    ///   · 바깥 카드(heroOuter/outer) = 흰색 불투명 + 얇은 경계 + 얕은 그림자
    ///   · 안쪽 면(nested/headline/inner) = 옅은 채움만. 경계·그림자 없음 → 카드 안 카드처럼 보이지 않는다.
    ///  종전에는 그라디언트 3종 + 테두리 3겹 + inset highlight 가 겹쳐 "카드 안의 카드 안의 카드" 가 됐다.
    private var isOuterCard: Bool { style == .heroOuter || style == .outer }

    @ViewBuilder
    private var backgroundView: some View {
        if isOuterCard {
            BUColor.surfaceElevated
        } else if style == .nested {
            // 채움 없음 — 아래 borderOverlay 의 구분선 하나로 나눈다.
            Color.clear
        } else if style == .inner, let tint {
            tint.opacity(0.06)
        } else {
            BUColor.subtleFill
        }
    }

    // MARK: Border

    @ViewBuilder
    private var borderOverlay: some View {
        if isOuterCard {
            // 흰 배경 위 흰 카드 — 경계선 하나로만 띄운다.
            RoundedRectangle(cornerRadius: style.radius, style: .continuous)
                .strokeBorder(BUColor.ink.opacity(0.07), lineWidth: 0.5)
        } else if style == .nested {
            // 카드 안 구획 — 회색 블록 대신 위쪽 0.5pt 선 하나.
            //  옅은 회색 면을 카드 안에 또 깔면 그게 "카드 안의 카드"로 읽힌다.
            VStack(spacing: 0) {
                BUHairline()
                Spacer(minLength: 0)
            }
        }
        // 그 밖의 안쪽 면은 경계 없음 (여백과 색 차이로 충분하다)
    }

    // MARK: Inset highlight (heroOuter)

    /// 2026-09-12: inset highlight 제거 — 유리질 표현은 네비게이션 레이어(탭바)에만 둔다.
    @ViewBuilder
    private var insetHighlightOverlay: some View {
        EmptyView()
    }
}

// MARK: - Shadow

private struct BUCardShadowModifier: ViewModifier {
    let style: BUCardStyle

    func body(content: Content) -> some View {
        switch style {
        case .heroOuter, .outer:
            // 얕은 그림자 한 겹 — 흰 배경에서 카드를 띄우는 최소한.
            content.shadow(color: BUColor.ink.opacity(0.05), radius: 10, x: 0, y: 3)
        case .headline, .nested, .inner:
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
