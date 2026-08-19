//
//  GlassMaterials.swift — App 배경 + Aurora 효과 (웹 globals.css 미러)
//
//  웹:
//   body { background: #f7f6f3; }
//   body::before / ::after — Aurora 그라디언트 2-layer (#1d3557 / #457b9d / #a8dadc / #e0f0ff)
//
//  iOS:
//   BUBackgroundSurface: 베이지 + 부드러운 Aurora overlay (정적, 추후 애니).
//

import SwiftUI

// MARK: - BUBackgroundSurface (앱 전역 배경)

public struct BUBackgroundSurface: View {

    public init() {}

    public var body: some View {
        // 정적 Aurora — globals.css 근사 (drawingGroup 1회 래스터, 애니메이션 없음).
        //   앱 전역 1개(FoundOneMobileShell)만 유지. 시트·푸시 화면은 BUFlatBackground 사용.
        AuroraBackground()
    }
}

// MARK: - BUFlatBackground (시트 · 푸시 화면용 평면 배경)

/// 시트(NavigationStack 내부)·푸시 화면 전용 — Aurora 대신 평면 베이지(#f7f6f3).
///   NavigationStack 은 불투명 배경이라 셸의 Aurora 가 비치지 않고, 화면마다 Aurora 를
///   다시 그리면 풀스크린 래스터가 중첩되어 성능 비용. 2026-08-19 성능 개정.
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
            Text("Aurora background preview")
                .font(BUFont.activityTitle)
                .foregroundStyle(BUColor.ink)
        }
    }
}
#endif
