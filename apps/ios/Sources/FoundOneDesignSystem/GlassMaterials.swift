//
//  GlassMaterials.swift — 앱 전역 캔버스 배경.
//
//  2026-09-12 개편: 베이지 + Aurora 2겹 → **흰 배경 + 상단 푸른 글로우 1겹**.
//   웹 미러: apps/web/app/globals.css 의 --bg / --canvas-glow / body::before
//   (동기화 가드: apps/web/__tests__/canvas-tokens-ios-sync.test.ts)
//
//  ⚠️ 배경은 셸이 한 번만 그린다. 화면이 또 깔면 그라디언트가 그 위치에서 다시 시작돼
//     로고 아래에 가로 단차가 생긴다 — 그래서 BUCanvasBackground 의 글로우는
//     자기 bounds 가 아니라 **화면 전역 좌표**를 기준으로 그린다(아래 주석 참고).
//

import SwiftUI
import UIKit

// MARK: - BUBackgroundSurface (앱 전역 배경)

public struct BUBackgroundSurface: View {

    public init() {}

    public var body: some View {
        // 2026-09-12 개편: 전역 Aurora → **흰 배경 + 상단 푸른 글로우**.
        //   콘텐츠(카드·리스트)가 놓이는 영역은 사실상 흰색이라 대비가 스크롤 위치에 따라 변하지 않는다.
        //   AuroraBackground 타입은 남겨 둔다(브랜드 화면에서 명시적으로 쓸 수 있게).
        BUCanvasBackground()
    }
}

// MARK: - BUCanvasBackground (앱 전역 캔버스)

/// 흰 바탕 + 상단 푸른 글로우. 글로우 중심은 화면 위쪽 바깥이라 가장자리가 보이지 않고,
///  위쪽 1/3 안에서 사라진다. 세기는 BUColor.canvasGlowOpacity 한 값으로 조절.
public struct BUCanvasBackground: View {
    /// 글로우 없이 흰 면만 필요할 때(시트 등).
    public var showsGlow: Bool

    public init(showsGlow: Bool = true) {
        self.showsGlow = showsGlow
    }

    public var body: some View {
        ZStack(alignment: .top) {
            BUColor.appBackground
            if showsGlow {
                GeometryReader { geo in
                    // 글로우는 **화면 최상단**을 기준으로 그린다 — 자기 뷰의 top 이 아니라.
                    //
                    //  왜: 이 배경이 화면 안에 한 번 더 깔리는 경우가 있다(NavigationStack 은
                    //  불투명 배경을 칠해서 셸의 캔버스를 가리므로 로드맵·시트는 자체 배경이 필요하다).
                    //  자기 bounds 를 기준으로 그리면 그 사본의 그라디언트가 브랜드 바 아래에서
                    //  **다시 시작**돼 로고 아래에 가로 단차가 생긴다(2026-09-12 사장님 신고).
                    //  전역 y 만큼 위로 밀어 두면 어디에 깔리든 같은 그림이 나온다.
                    let topOffset = geo.frame(in: .global).minY
                    let screenWidth = max(geo.size.width, UIScreen.main.bounds.width)
                    RadialGradient(
                        colors: [
                            BUColor.canvasGlow.opacity(BUColor.canvasGlowOpacity),
                            BUColor.canvasGlow.opacity(BUColor.canvasGlowOpacity * 0.35),
                            .clear,
                        ],
                        center: .init(x: 0.5, y: -0.12),
                        startRadius: 0,
                        endRadius: screenWidth * 1.15
                    )
                    .frame(width: screenWidth, height: geo.size.height + topOffset)
                    .offset(y: -topOffset)
                }
                .allowsHitTesting(false)
            }
        }
        .ignoresSafeArea()
    }
}

// MARK: - BUFlatBackground (시트 · 푸시 화면용 평면 배경)

/// 시트(NavigationStack 내부)·푸시 화면 전용 — 글로우 없는 평면 흰 배경.
///   NavigationStack 은 불투명 배경이라 셸 캔버스가 비치지 않는다.
///   글로우까지 필요 없는 화면은 이걸 쓴다(2026-08-19 성능 개정, 2026-09-12 흰 배경으로 갱신).
public struct BUFlatBackground: View {
    public init() {}
    public var body: some View {
        BUColor.appBackground.ignoresSafeArea()
    }
}

// MARK: - Glass material modifier (호환용 — 카드 컴포넌트 안에서만 사용)

public enum BUGlassTone: Sendable {
    case hero, card, chip, sheet, subtle
}

public extension View {
    /// 후방 호환 — BUCard 가 SSOT. 호출 측은 BUCard 사용 권장.
    func buGlass(
        _ tone: BUGlassTone = .card,
        tint: Color? = nil,
        cornerRadius: CGFloat = BURadius.outerCard
    ) -> some View {
        modifier(LegacyGlassModifier(tone: tone, tint: tint, cornerRadius: cornerRadius))
    }
}

private struct LegacyGlassModifier: ViewModifier {
    let tone: BUGlassTone
    let tint: Color?
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(background)
            )
    }

    private var background: Color {
        switch tone {
        case .hero, .card:  return BUColor.surfaceElevated
        case .chip, .sheet: return BUColor.surfaceElevated.opacity(0.85)
        case .subtle:       return (tint ?? BUColor.midnight).opacity(0.04)
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUBackgroundSurface") {
    ZStack {
        BUBackgroundSurface()
        VStack {
            Text("캔버스 배경 — 흰 바탕 + 상단 글로우")
                .font(BUFont.activityTitle)
                .foregroundStyle(BUColor.ink)
        }
    }
}
#endif
