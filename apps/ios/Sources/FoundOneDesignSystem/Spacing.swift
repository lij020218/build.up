//
//  Spacing.swift — 8pt 그리드 + 웹 RADIUS / padding 1:1 미러
//
//  웹 SSOT (operationalStyles.ts):
//   RADIUS = { OUTER_CARD: 20, INNER_BLOCK: 14, INPUT: 10, PILL: 9999,
//              BADGE: 8, TINY: 3, MODAL: 24 }
//   shell gap: 18px
//   heroPanel: padding 24px
//   opsCard: padding 22px, gap 14px
//   headlineCard: padding 20px
//   activityCard: padding 22px, gap 18px
//
//  CEOMorningHero outer (special): radius 24 / padding 28-28-24
//

import SwiftUI
import CoreGraphics

public enum BUSpacing {
    // MARK: - 8pt base
    public static let xxs: CGFloat = 4
    public static let xs:  CGFloat = 8
    public static let sm:  CGFloat = 12
    public static let md:  CGFloat = 16
    public static let lg:  CGFloat = 20
    public static let xl:  CGFloat = 24
    public static let xxl: CGFloat = 32
    public static let xxxl: CGFloat = 48

    // MARK: - Card padding (모바일 최적화 — 사장님 지적: "카드들이 모바일에서 잘림")
    /// CEOMorningHero outer card padding (모바일 viewport 폭 고려 18-18-16 로 축소)
    /// 웹: 28-28-24 (데스크탑) → 모바일에선 더 컴팩트하게.
    public static let heroOuterPadding: CGFloat = 14
    public static let heroOuterPaddingBottom: CGFloat = 12
    /// heroPanel padding (모바일 20)
    public static let heroPanelPadding: CGFloat = 20
    /// opsCard / activityCard padding (모바일 18)
    public static let cardPadding: CGFloat = 18
    /// headlineCard padding (모바일 16)
    public static let headlinePadding: CGFloat = 16
    /// 작은 inner card (Row 2 NSM nested) padding 16/18
    public static let nestedCardPaddingV: CGFloat = 16
    public static let nestedCardPaddingH: CGFloat = 18

    // MARK: - Gap (웹 1:1)
    /// Shell gap — Tier 간 (18px)
    public static let shellGap: CGFloat = 18
    /// Hero panel 내부 gap — 모바일 12pt (사장님 피드백 2026-05-14: Hero 영역 축소)
    public static let heroGap: CGFloat = 12
    /// opsCard 내부 gap (14px)
    public static let opsGap: CGFloat = 14
    /// activityCard 내부 gap (18px)
    public static let activityGap: CGFloat = 18
    /// 일반 카드 간 gap
    public static let cardGap: CGFloat = 14
    /// Row 내부 gap (Row1 → Row1.5)
    public static let rowGap: CGFloat = 14

    // MARK: - 화면 좌우 margin (모바일)
    /// 모바일 컨텐츠 좌우 margin — 12pt (콘텐츠 폭 최대화)
    /// 사장님 지적: "카드들이 모바일에서 잘림"
    public static let screenMargin: CGFloat = 12

    // MARK: - Touch target
    public static let minTapTarget: CGFloat = 44
    public static let numberPadButton: CGFloat = 64
}

// MARK: - Radius (웹 RADIUS 1:1)

public enum BURadius {
    /// CEOMorningHero outer — 24px (모달과 동일)
    public static let heroOuter: CGFloat = 24
    /// OUTER_CARD — 20px (heroPanel, opsCard, activityCard, survivalCard)
    public static let outerCard: CGFloat = 20
    /// Row 2 nested white card — 18px (NSM 메트릭 카드)
    public static let nestedCard: CGFloat = 18
    /// headlineCard / KPI 미니카드 — 16px
    public static let headlineCard: CGFloat = 16
    /// INNER_BLOCK — 14px (위험신호 박스, mini stat, sub block)
    public static let innerBlock: CGFloat = 14
    /// INPUT — 10px (input, primaryActionSmall)
    public static let input: CGFloat = 10
    /// primaryAction button — 12px
    public static let button: CGFloat = 12
    /// BADGE — 8px (작은 라벨 칩)
    public static let badge: CGFloat = 8
    /// PILL — 999 (capsule)
    public static let pill: CGFloat = 9999
    /// TINY — 3px (진행바, hairline)
    public static let tiny: CGFloat = 3
    /// MODAL — 24px
    public static let modal: CGFloat = 24

    // MARK: - 후방 호환 (옛 이름)
    public static let xs: CGFloat = 8
    public static let sm: CGFloat = 10
    public static let md: CGFloat = 14
    public static let lg: CGFloat = 16
    public static let xl: CGFloat = 22
    public static let sheet: CGFloat = 38
    public static let capsule: CGFloat = .infinity
}

// MARK: - Shadow (단일 레이어 — 성능 개정 2026-08-19)
//
//  웹 dual layer(0 1px 3px + 0 12px 24px -12px)를 iOS 에서 두 겹 .shadow 로 미러했으나,
//  .shadow 는 매 레이어마다 오프스크린 블러 패스라 카드 수십 장 스크롤 시 비용이 큼.
//  → 한 겹(radius ≤ 12, 낮은 opacity)으로 통합. 카드 부유감은 유지.

public struct BUShadow: Sendable {
    public let color: Color
    public let radius: CGFloat
    public let x: CGFloat
    public let y: CGFloat

    /// heroPanel/opsCard/activityCard 표준 — 웹 dual layer 근사(한 겹).
    public static let card = BUShadow(color: BUColor.midnight.opacity(0.08), radius: 10, x: 0, y: 4)

    /// CEOMorningHero outer — 웹 0 8px 32px rgba(25,25,112,0.06) 근사(한 겹, radius 12).
    /// inset 하이라이트는 BUCard 의 overlay 로 처리.
    public static let hero = BUShadow(color: BUColor.midnight.opacity(0.07), radius: 12, x: 0, y: 5)

    /// 그림자 없음 (radius 0 · 투명).
    public static let none = BUShadow(color: .clear, radius: 0, x: 0, y: 0)

    var isNone: Bool { radius == 0 }
}

public extension View {
    /// 단일 레이어 shadow 적용 (웹 box-shadow 근사)
    func buShadow(_ shadow: BUShadow) -> some View {
        self.modifier(BUShadowModifier(shadow: shadow))
    }
}

private struct BUShadowModifier: ViewModifier {
    let shadow: BUShadow

    func body(content: Content) -> some View {
        if shadow.isNone {
            content
        } else {
            content.shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
        }
    }
}
