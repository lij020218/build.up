//
//  HealthColors.swift — 건강 등급 4단계 컬러 시스템
//
//  웹 SSOT 거울 — packages/shared/src/finance/unified-health.ts 의 HEALTH_COLORS 와 동일 값.
//  변경 시 두 곳 동시 업데이트. 같은 5필드 (bg / border / text / dot / glow) 보유.
//
//  사용 위치 — 사장님 화면에 위험 신호 표시되는 모든 곳:
//   • CEOMorningHero Row 1.5 위험신호 박스
//   • CostStructureCard 게이지 색상
//   • HealthDot / HealthBadge
//   • Tier 5 ForecastCard 톤
//
//  ⚠️ MEMORY.md "신호등 컬러 금지" — 항상 4색 동시 노출 X.
//   위험 상태 (warning/critical) 에서만 활성, 평소엔 neutral 으로 표시.
//

import SwiftUI
import FoundOneCore

// MARK: - HealthGrade SSOT 위치
//
// 2026-05-13: HealthGrade enum 은 FoundOneCore.HealthGrade 로 통일.
// 본 파일은 그 grade 에 해당하는 색상 팔레트만 책임.
// labelKo / labelEn 도 FoundOneCore 의 HealthGrade extension 으로 제공.

public extension HealthGrade {
    /// 한국어 라벨 (웹 HEALTH_LABEL_KO 거울)
    var labelKo: String {
        switch self {
        case .healthy:  return "건강"
        case .caution:  return "주의"
        case .warning:  return "위험"
        case .critical: return "긴급"
        case .unknown:  return "분석 준비 중"
        }
    }

    /// 영어 라벨
    var labelEn: String {
        switch self {
        case .healthy:  return "Healthy"
        case .caution:  return "Caution"
        case .warning:  return "Warning"
        case .critical: return "Critical"
        case .unknown:  return "Analyzing"
        }
    }
}

// MARK: - HealthColorPalette (웹 HEALTH_COLORS[grade] 거울)

public struct HealthColorPalette: Sendable {
    /// 배경 (옅은 gradient 또는 tint)
    public let backgroundTint: Color
    /// 테두리
    public let border: Color
    /// 라벨 텍스트
    public let text: Color
    /// 점 / 슬라이스 (강조 색)
    public let dot: Color
    /// 펄스 / 그림자 (glow)
    public let glow: Color

    /// 다크 모드 대응 자동 (Color init(light:dark:) 사용)
    fileprivate init(
        bgLight: Color, bgDark: Color,
        borderLight: Color, borderDark: Color,
        textLight: Color, textDark: Color,
        dotLight: Color, dotDark: Color,
        glowLight: Color, glowDark: Color
    ) {
        self.backgroundTint = Color(light: bgLight, dark: bgDark)
        self.border = Color(light: borderLight, dark: borderDark)
        self.text = Color(light: textLight, dark: textDark)
        self.dot = Color(light: dotLight, dark: dotDark)
        self.glow = Color(light: glowLight, dark: glowDark)
    }
}

// MARK: - HEALTH_COLORS lookup (웹 SSOT 거울)

public enum HealthColors {

    /// 등급 → 5필드 컬러 팔레트 매핑.
    /// 웹 HEALTH_COLORS [healthy/caution/warning/critical/unknown] 와 1:1 동기화.
    public static func palette(for grade: HealthGrade) -> HealthColorPalette {
        switch grade {

        // ⚠️ 신호등 컬러 금지 — 웹 HEALTH_COLORS 와 1:1. healthy→warning 은 미드나잇 네이비(#191970)
        //   농담(옅음=양호, 짙음=위험), critical 1단계만 벽돌 danger(#b64c4c). 라벨 항상 동반(색각 접근성).
        case .healthy:
            // 옅은 네이비 = 양호
            return HealthColorPalette(
                bgLight:     .rgb(25, 25, 112, opacity: 0.05),
                bgDark:      .rgb(123, 123, 196, opacity: 0.12),
                borderLight: .rgb(25, 25, 112, opacity: 0.14),
                borderDark:  .rgb(123, 123, 196, opacity: 0.30),
                textLight:   .hex(0x1D3557),
                textDark:    .hex(0x8AB0D5),
                dotLight:    .rgb(25, 25, 112, opacity: 0.38),
                dotDark:     .rgb(123, 123, 196, opacity: 0.55),
                glowLight:   .rgb(25, 25, 112, opacity: 0.18),
                glowDark:    .rgb(123, 123, 196, opacity: 0.30)
            )

        case .caution:
            // 중간 네이비
            return HealthColorPalette(
                bgLight:     .rgb(25, 25, 112, opacity: 0.07),
                bgDark:      .rgb(123, 123, 196, opacity: 0.14),
                borderLight: .rgb(25, 25, 112, opacity: 0.18),
                borderDark:  .rgb(123, 123, 196, opacity: 0.34),
                textLight:   .hex(0x1D3557),
                textDark:    .hex(0x8AB0D5),
                dotLight:    .rgb(25, 25, 112, opacity: 0.58),
                dotDark:     .rgb(123, 123, 196, opacity: 0.70),
                glowLight:   .rgb(25, 25, 112, opacity: 0.26),
                glowDark:    .rgb(123, 123, 196, opacity: 0.40)
            )

        case .warning:
            // 짙은 네이비 = 위험 임박
            return HealthColorPalette(
                bgLight:     .rgb(25, 25, 112, opacity: 0.10),
                bgDark:      .rgb(123, 123, 196, opacity: 0.16),
                borderLight: .rgb(25, 25, 112, opacity: 0.24),
                borderDark:  .rgb(123, 123, 196, opacity: 0.40),
                textLight:   .hex(0x191970),
                textDark:    .hex(0x9A9AD8),
                dotLight:    .rgb(25, 25, 112, opacity: 0.85),
                dotDark:     .rgb(154, 154, 216, opacity: 0.90),
                glowLight:   .rgb(25, 25, 112, opacity: 0.34),
                glowDark:    .rgb(123, 123, 196, opacity: 0.50)
            )

        case .critical:
            // 위험 1색 (벽돌 danger #b64c4c)
            return HealthColorPalette(
                bgLight:     .rgb(182, 76, 76, opacity: 0.10),
                bgDark:      .rgb(182, 76, 76, opacity: 0.16),
                borderLight: .rgb(182, 76, 76, opacity: 0.32),
                borderDark:  .rgb(182, 76, 76, opacity: 0.42),
                textLight:   .hex(0xB64C4C),
                textDark:    .hex(0xD98A8A),
                dotLight:    .hex(0xB64C4C),
                dotDark:     .hex(0xD98A8A),
                glowLight:   .rgb(182, 76, 76, opacity: 0.45),
                glowDark:    .rgb(182, 76, 76, opacity: 0.60)
            )

        case .unknown:
            // 웹: 회색 톤
            return HealthColorPalette(
                bgLight:     .rgb(15, 23, 42, opacity: 0.03),
                bgDark:      .rgb(241, 245, 249, opacity: 0.04),
                borderLight: .rgb(15, 23, 42, opacity: 0.05),
                borderDark:  .rgb(241, 245, 249, opacity: 0.08),
                textLight:   .rgb(15, 23, 42, opacity: 0.50),
                textDark:    .rgb(241, 245, 249, opacity: 0.50),
                dotLight:    .rgb(15, 23, 42, opacity: 0.20),
                dotDark:     .rgb(241, 245, 249, opacity: 0.25),
                glowLight:   .rgb(15, 23, 42, opacity: 0.15),
                glowDark:    .rgb(241, 245, 249, opacity: 0.20)
            )
        }
    }
}

// MARK: - Color hex/rgba helper

extension Color {
    /// 0xRRGGBB → Color (16진수 정수 입력)
    static func hex(_ hex: UInt32, opacity: Double = 1.0) -> Color {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8)  & 0xFF) / 255.0
        let b = Double( hex        & 0xFF) / 255.0
        return Color(red: r, green: g, blue: b).opacity(opacity)
    }

    /// rgba(r, g, b, a) — 웹 CSS 스타일
    static func rgb(_ r: Int, _ g: Int, _ b: Int, opacity: Double = 1.0) -> Color {
        Color(
            red:   Double(r) / 255.0,
            green: Double(g) / 255.0,
            blue:  Double(b) / 255.0
        ).opacity(opacity)
    }
}
