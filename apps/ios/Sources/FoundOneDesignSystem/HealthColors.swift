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

        case .healthy:
            // 웹: text #15803d / dot #22c55e (green-500/700)
            return HealthColorPalette(
                bgLight:     .rgb(34, 197, 94, opacity: 0.08),
                bgDark:      .rgb(34, 197, 94, opacity: 0.14),
                borderLight: .rgb(34, 197, 94, opacity: 0.25),
                borderDark:  .rgb(34, 197, 94, opacity: 0.35),
                textLight:   .hex(0x15803D),
                textDark:    .hex(0x4ADE80),    // green-400 (Dark 대비)
                dotLight:    .hex(0x22C55E),
                dotDark:     .hex(0x4ADE80),
                glowLight:   .rgb(34, 197, 94, opacity: 0.40),
                glowDark:    .rgb(34, 197, 94, opacity: 0.55)
            )

        case .caution:
            // 웹: text #b45309 / dot #f59e0b (amber-500/700)
            return HealthColorPalette(
                bgLight:     .rgb(245, 158, 11, opacity: 0.09),
                bgDark:      .rgb(245, 158, 11, opacity: 0.14),
                borderLight: .rgb(245, 158, 11, opacity: 0.28),
                borderDark:  .rgb(245, 158, 11, opacity: 0.38),
                textLight:   .hex(0xB45309),
                textDark:    .hex(0xFBBF24),    // amber-400
                dotLight:    .hex(0xF59E0B),
                dotDark:     .hex(0xFBBF24),
                glowLight:   .rgb(245, 158, 11, opacity: 0.45),
                glowDark:    .rgb(245, 158, 11, opacity: 0.60)
            )

        case .warning:
            // 웹: text #c2410c / dot #ea580c (orange-600/700)
            return HealthColorPalette(
                bgLight:     .rgb(234, 88, 12, opacity: 0.09),
                bgDark:      .rgb(234, 88, 12, opacity: 0.14),
                borderLight: .rgb(234, 88, 12, opacity: 0.30),
                borderDark:  .rgb(234, 88, 12, opacity: 0.40),
                textLight:   .hex(0xC2410C),
                textDark:    .hex(0xFB923C),    // orange-400
                dotLight:    .hex(0xEA580C),
                dotDark:     .hex(0xFB923C),
                glowLight:   .rgb(234, 88, 12, opacity: 0.50),
                glowDark:    .rgb(234, 88, 12, opacity: 0.65)
            )

        case .critical:
            // 웹: text #b91c1c / dot #ef4444 (red-500/700)
            return HealthColorPalette(
                bgLight:     .rgb(220, 38, 38, opacity: 0.09),
                bgDark:      .rgb(220, 38, 38, opacity: 0.14),
                borderLight: .rgb(220, 38, 38, opacity: 0.30),
                borderDark:  .rgb(220, 38, 38, opacity: 0.40),
                textLight:   .hex(0xB91C1C),
                textDark:    .hex(0xF87171),    // red-400
                dotLight:    .hex(0xEF4444),
                dotDark:     .hex(0xF87171),
                glowLight:   .rgb(239, 68, 68, opacity: 0.50),
                glowDark:    .rgb(239, 68, 68, opacity: 0.65)
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
