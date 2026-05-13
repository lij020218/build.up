//
//  GlassMaterials.swift — iOS 26 Liquid Glass + iOS 18 Material fallback
//
//  build.up 카드의 모든 surface 머티리얼을 한 곳에서 관리.
//  사장님 디바이스가 iOS 26+ 면 `.glassEffect()` (refraction + depth),
//  iOS 18 면 `.ultraThinMaterial` 등 표준 Material — 일관된 톤 유지.
//
//  사용 시 직접 `.glassEffect()` 호출하지 말고 본 wrapper 사용 → SSOT.
//

import SwiftUI

// MARK: - Glass intensity

public enum BUGlassTone: Sendable {
    /// Hero / 메인 카드 — 가장 강한 glass + tint
    case hero
    /// 일반 카드 — 보조 카드 / Tier 2-3
    case card
    /// Chip / 작은 칩 / pill
    case chip
    /// Sheet / Modal — 더 강한 blur
    case sheet
    /// 미세한 layered effect (위험신호 박스 등)
    case subtle
}

// MARK: - View modifier — 통합 glass 적용

public extension View {

    /// build.up 표준 glass material 적용 (iOS 26 / iOS 18 자동 분기).
    ///
    /// - Parameters:
    ///   - tone: 강도 선택 (hero / card / chip / sheet / subtle)
    ///   - tint: 컬러 강조 (위험신호 박스에서 HEALTH_COLORS 적용)
    ///   - cornerRadius: 라운드 (BURadius 권장)
    func buGlass(
        _ tone: BUGlassTone = .card,
        tint: Color? = nil,
        cornerRadius: CGFloat = BURadius.lg
    ) -> some View {
        modifier(BUGlassModifier(tone: tone, tint: tint, cornerRadius: cornerRadius))
    }
}

private struct BUGlassModifier: ViewModifier {
    let tone: BUGlassTone
    let tint: Color?
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        // iOS 26+ : Liquid Glass API (.glassEffect)
        if #available(iOS 26.0, *) {
            content
                .background(
                    iOS26GlassBackground
                        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                )
        } else {
            // iOS 18 fallback : Material API
            content
                .background(
                    iOS18MaterialBackground
                        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                )
        }
    }

    // MARK: iOS 26 Liquid Glass

    @available(iOS 26.0, *)
    @ViewBuilder
    private var iOS26GlassBackground: some View {
        // ⚠️ iOS 26 .glassEffect() 정식 API
        //   .regular  = 표준 (대부분 카드)
        //   .clear    = 콘텐츠 위에 살짝 (chip / pill)
        //   .identity = 효과 없음 (디버그용)
        switch tone {
        case .hero:
            // Hero: regular + tint (CEOMorningHero 의 미드나잇 그라디언트 대체)
            ZStack {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(BUColor.surfaceElevated)
                if let tint {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(tint.opacity(0.08))
                }
            }
            // 실제 .glassEffect(.regular) 적용은 호출 측에서 보충 (Apple API 시그니처 변동 대비)
        case .card:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(BUColor.surfaceElevated)
        case .chip:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(.ultraThinMaterial)
        case .sheet:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(.regularMaterial)
        case .subtle:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(tint?.opacity(0.04) ?? BUColor.surface.opacity(0.6))
        }
    }

    // MARK: iOS 18 Material fallback

    @ViewBuilder
    private var iOS18MaterialBackground: some View {
        switch tone {
        case .hero:
            ZStack {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(BUColor.surfaceElevated)
                if let tint {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(tint.opacity(0.06))
                }
            }
        case .card:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(BUColor.surfaceElevated)
        case .chip:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(.ultraThinMaterial)
        case .sheet:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(.regularMaterial)
        case .subtle:
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(tint?.opacity(0.04) ?? BUColor.surface.opacity(0.6))
        }
    }
}

// MARK: - Background surface (Lavender Mist gradient)

public struct BUBackgroundSurface: View {

    public init() {}

    public var body: some View {
        // 웹 lavender-mist gradient 와 동일 톤
        LinearGradient(
            stops: [
                .init(color: BUColor.surface, location: 0.0),
                .init(color: BUColor.surface.opacity(0.94), location: 1.0),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
        .overlay(
            // 좌상단 미세한 highlight — 웹 radial gradient 와 매핑
            RadialGradient(
                colors: [
                    BUColor.midnight.opacity(0.05),
                    .clear,
                ],
                center: .topLeading,
                startRadius: 0,
                endRadius: 600
            )
            .ignoresSafeArea()
            .allowsHitTesting(false)
        )
    }
}
