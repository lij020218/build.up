//
//  BUCard.swift — build.up 표준 카드 컴포넌트
//
//  사용법:
//   BUCard(.card) {
//       Text("Hello")
//   }
//
//   BUCard(.hero, tint: HealthColors.palette(for: .critical).backgroundTint) {
//       VStack { ... }
//   }
//
//  Hero / Card / Subtle 3가지 톤. Liquid Glass material 자동 적용 (iOS 26+).
//  카드 자체 padding/radius/shadow 표준 적용 — 호출 측은 콘텐츠만 작성.
//

import SwiftUI
import BuildUpCore

// MARK: - BUCard

public struct BUCard<Content: View>: View {

    public enum Style: Sendable {
        /// Hero — Tier 1 메인 카드 (CEOMorningHero 모바일 버전)
        case hero
        /// Card — 일반 카드 (Tier 2-3, KPI 카드 등)
        case card
        /// Subtle — 위험신호 박스, inline 알림 등 (background tint 강조)
        case subtle
        /// Chip — pill / 작은 chip
        case chip

        fileprivate var glassTone: BUGlassTone {
            switch self {
            case .hero:   return .hero
            case .card:   return .card
            case .subtle: return .subtle
            case .chip:   return .chip
            }
        }

        fileprivate var cornerRadius: CGFloat {
            switch self {
            case .hero:   return BURadius.xl       // 22
            case .card:   return BURadius.lg       // 16
            case .subtle: return BURadius.md       // 14
            case .chip:   return BURadius.sm       // 10
            }
        }

        fileprivate var padding: CGFloat {
            switch self {
            case .hero:   return BUSpacing.lg      // 20
            case .card:   return BUSpacing.lg      // 20
            case .subtle: return BUSpacing.sm + 2  // 14
            case .chip:   return BUSpacing.xs + 2  // 10
            }
        }

        fileprivate var shadow: BUShadow? {
            switch self {
            case .hero:   return .hero
            case .card:   return .card
            case .subtle: return nil       // tint 가 있으면 별도 shadow 불필요
            case .chip:   return nil
            }
        }
    }

    let style: Style
    let tint: Color?
    let content: Content

    public init(
        _ style: Style = .card,
        tint: Color? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.style = style
        self.tint = tint
        self.content = content()
    }

    public var body: some View {
        content
            .padding(style.padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .buGlass(style.glassTone, tint: tint, cornerRadius: style.cornerRadius)
            .overlay(
                // 미세 border (웹 1px solid rgba 와 매핑)
                RoundedRectangle(cornerRadius: style.cornerRadius, style: .continuous)
                    .strokeBorder(
                        tint?.opacity(0.18) ?? BUColor.border,
                        lineWidth: 0.5
                    )
            )
            .modifier(OptionalShadow(shadow: style.shadow))
    }
}

// MARK: - Conditional shadow helper

private struct OptionalShadow: ViewModifier {
    let shadow: BUShadow?

    func body(content: Content) -> some View {
        if let shadow {
            content.buShadow(shadow)
        } else {
            content
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUCard styles") {
    ZStack {
        BUBackgroundSurface()

        ScrollView {
            VStack(spacing: BUSpacing.cardGap) {

                // Hero 예시 — CEOMorningHero 모바일 버전 시뮬레이션
                BUCard(.hero) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        HStack {
                            Text("오늘".uppercased())
                                .buEyebrowStyle()
                            Spacer()
                            Text("운영 47일째")
                                .font(BUFont.eyebrow)
                                .foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.08), in: Capsule())
                        }
                        Text("좋은 아침, 사장님")
                            .buCardTitleStyle()
                        Text("어제 매출 87만원, 이번 주 -12%")
                            .buAnalysisStyle()
                    }
                }

                // 위험신호 (subtle + tint)
                BUCard(.subtle, tint: HealthColors.palette(for: .critical).dot) {
                    HStack(alignment: .top, spacing: 11) {
                        Circle()
                            .fill(HealthColors.palette(for: .critical).dot)
                            .frame(width: 9, height: 9)
                            .shadow(
                                color: HealthColors.palette(for: .critical).glow,
                                radius: 4
                            )
                            .padding(.top, 5)

                        VStack(alignment: .leading, spacing: 3) {
                            HStack {
                                Text("현금 흐름 위험")
                                    .font(BUFont.label)
                                    .foregroundStyle(HealthColors.palette(for: .critical).text)
                                Text(HealthGrade.critical.labelKo)
                                    .font(BUFont.eyebrow)
                                    .foregroundStyle(HealthColors.palette(for: .critical).text.opacity(0.7))
                                    .textCase(.uppercase)
                                    .tracking(0.5)
                            }
                            Text("런웨이 2.3개월 — 영역 점수 32점")
                                .font(BUFont.labelSmall)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }

                // 일반 카드 예시 — KPI
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("어제 매출".uppercased())
                            .buEyebrowStyle()
                        Text("870,000")
                            .buHeroNumberStyle()
                        Text("원 · -12% WoW")
                            .font(BUFont.bodyCaption)
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }

                // Chip 예시
                HStack(spacing: BUSpacing.xs) {
                    BUCard(.chip) {
                        Text("성장")
                            .font(BUFont.eyebrow)
                            .foregroundStyle(BUColor.midnight)
                    }
                    BUCard(.chip, tint: HealthColors.palette(for: .warning).dot) {
                        Text("주의 신호")
                            .font(BUFont.eyebrow)
                            .foregroundStyle(HealthColors.palette(for: .warning).text)
                    }
                }
            }
            .padding(BUSpacing.md)
        }
    }
    .preferredColorScheme(.light)
}

#Preview("BUCard styles — Dark Mode") {
    ZStack {
        BUBackgroundSurface()

        ScrollView {
            VStack(spacing: BUSpacing.cardGap) {
                BUCard(.hero) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("오늘 매출".uppercased())
                            .buEyebrowStyle()
                        Text("870,000원")
                            .buHeroNumberStyle()
                        Text("어제보다 +18% 성장")
                            .buAnalysisStyle()
                    }
                }
                BUCard(.subtle, tint: HealthColors.palette(for: .warning).dot) {
                    Text("재료비 32% — 업종 평균 28% 대비 약간 높음")
                        .font(BUFont.labelSmall)
                        .foregroundStyle(BUColor.inkSecondary)
                }
            }
            .padding(BUSpacing.md)
        }
    }
    .preferredColorScheme(.dark)
}
#endif
