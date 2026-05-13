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
        ZStack {
            // 베이스: 베이지 (#f7f6f3) — viewport 전체 채움
            BUColor.appBackground
                .ignoresSafeArea()

            // Aurora overlay layer 1 (우상단 푸른 톤)
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BUColor.auroraBlue.opacity(0.08),
                            BUColor.auroraBlue.opacity(0.0),
                        ],
                        center: .center,
                        startRadius: 40,
                        endRadius: 320
                    )
                )
                .frame(width: 600, height: 600)
                .offset(x: 220, y: -300)
                .allowsHitTesting(false)

            // Aurora overlay layer 2 (좌하단 청량)
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BUColor.auroraTeal.opacity(0.10),
                            BUColor.auroraTeal.opacity(0.0),
                        ],
                        center: .center,
                        startRadius: 30,
                        endRadius: 280
                    )
                )
                .frame(width: 500, height: 500)
                .offset(x: -180, y: 280)
                .allowsHitTesting(false)

            // Aurora overlay layer 3 (가운데 옅은 sky)
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BUColor.auroraSky.opacity(0.16),
                            BUColor.auroraSky.opacity(0.0),
                        ],
                        center: .center,
                        startRadius: 50,
                        endRadius: 400
                    )
                )
                .frame(width: 700, height: 700)
                .offset(x: 0, y: -40)
                .allowsHitTesting(false)
        }
        .ignoresSafeArea()
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
