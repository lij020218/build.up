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
    /// 2026-09-12 개편: 카드 중첩을 없앤 뒤 여백을 되돌렸다.
    ///  종전 14/12 는 "카드 안의 카드 안의 카드" 3겹을 한 화면에 욱여넣느라 깎은 값이다.
    ///  중첩이 사라졌으니 바깥 카드 하나가 숨 쉴 여백을 갖는 편이 읽기 쉽다.
    public static let heroOuterPadding: CGFloat = 18
    public static let heroOuterPaddingBottom: CGFloat = 18
    /// heroPanel padding (모바일 20)
    public static let heroPanelPadding: CGFloat = 20
    /// opsCard / activityCard padding (모바일 18)
    public static let cardPadding: CGFloat = 18
    /// headlineCard padding — 바깥 카드(18)와 맞춰 단계 차이를 없앴다.
    public static let headlinePadding: CGFloat = 18
    /// nested 구획 padding — 위 18(구분선과 거리), 아래 10(다음 구분선/카드 여백이 이어서 18 을 준다).
    ///  아래도 18 이면 구획 마지막 요소(버튼) 밑이 36pt 비어 보인다 (2026-09-12 실렌더).
    public static let nestedCardPaddingV: CGFloat = 18
    public static let nestedCardPaddingBottom: CGFloat = 10
    public static let nestedCardPaddingH: CGFloat = 18

    // MARK: - Gap (웹 1:1)
    /// 섹션 사이 간격 — 관련 없는 것끼리는 넉넉히 띄운다(18 → 24).
    ///  간격이 좁으면 카드 경계선에 위계를 의존하게 되고, 화면이 목록처럼 읽힌다.
    public static let shellGap: CGFloat = 24
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
    /// 모바일 컨텐츠 좌우 margin — 16pt.
    ///  종전 12 는 카드 3겹 중첩 시절 폭을 아끼려던 값이고, 화면마다 12/16 으로 갈려 있었다.
    ///  중첩을 없앤 뒤 16 으로 통일 — 이미 BUSpacing.md(16) 를 쓰던 화면들과도 같아진다.
    public static let screenMargin: CGFloat = 16

    // MARK: - Touch target
    public static let minTapTarget: CGFloat = 44
    public static let numberPadButton: CGFloat = 64
}

// MARK: - Radius (웹 RADIUS 1:1)

public enum BURadius {
    // 2026-09-12 개편: 24/20/18/16/14 다섯 단계 → **한 값**.
    //  단계가 필요했던 이유는 카드를 카드 안에 넣었기 때문이다. 중첩을 없앴으니
    //  모서리로 깊이를 표현할 일이 없다.
    //
    //  값의 근거 (사장님 지시 2026-09-12: "각진 직사각형에서 모서리만 둥근 걸 원한다"):
    //   · 애플 HIG 는 숫자를 공표하지 않는다 — "연속 곡률(continuous)을 쓰고,
    //     큰 면은 평평한 변 + 부드러운 모서리로 읽히게" 라는 질적 지침만 있다.
    //   · 애플이 자사앱에서 **실제로 쓰는** 값은 inset grouped 리스트 섹션의 **10pt** 다.
    //     설정·메일·메모·건강의 흰 묶음이 전부 이것 — 정확히 "직사각형에 모서리만 둥근" 모양.
    //   · 흔히 도는 "22.37% 반경 + 60% 스무딩"은 **앱 아이콘 템플릿**을 역산한 값이지
    //     일반 UI 규칙이 아니다. 카드에 그 비율을 쓰면 뭉툭해진다(직전 26pt 가 그랬다).
    //
    //  그래서: 카드 12 / 안쪽 면 8. 카드를 10 이 아닌 12 로 둔 이유는
    //  안쪽 8pt 면이 카드 안에서 동심(concentric)으로 보이려면 바깥이 한 단계 커야 하기 때문이다.
    //  (iOS 26 의 ConcentricRectangle 이 자동으로 해 주는 계산 = 바깥 반경 − 여백.)
    //  ⚠️ 모든 카드는 `style: .continuous` 로 그린다 — 같은 수치라도 원형 모서리보다 변이 곧게 읽힌다.
    /// CEOMorningHero outer
    public static let heroOuter: CGFloat = 12
    /// OUTER_CARD (heroPanel, opsCard, activityCard, survivalCard)
    public static let outerCard: CGFloat = 12
    /// Row 2 nested white card (NSM 메트릭 카드)
    public static let nestedCard: CGFloat = 12
    /// headlineCard / KPI 미니카드
    public static let headlineCard: CGFloat = 12
    /// INNER_BLOCK — 위험신호 박스, mini stat, sub block (카드가 아닌 '면')
    ///  카드보다 작게 — 카드 모서리를 넘어 보이지 않게.
    public static let innerBlock: CGFloat = 8
    /// INPUT — 10px (input, primaryActionSmall)
    public static let input: CGFloat = 10
    /// primaryAction button — 12px
    /// 카드(12)보다 작게 — 버튼이 카드보다 둥글면 카드가 더 각져 보인다.
    public static let button: CGFloat = 10
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
