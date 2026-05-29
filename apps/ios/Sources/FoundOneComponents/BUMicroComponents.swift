//
//  BUMicroComponents.swift — 작은 UI 빌딩 블록 모음
//
//  BUHealthDot   — 9pt 펄스 dot + glow (위험신호)
//  BUEyebrow     — UPPERCASE 라벨 chip
//  BUTrendChip   — ↗ +12% 트렌드 표시
//  BUTagBadge    — 단계/상태 작은 배지 (운영 47일째, 단계 등)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - BUHealthDot — 위험 신호 펄스 dot

public struct BUHealthDot: View {

    let grade: HealthGrade
    let size: CGFloat
    let animated: Bool

    public init(grade: HealthGrade, size: CGFloat = 9, animated: Bool = false) {
        self.grade = grade
        self.size = size
        self.animated = animated
    }

    @State private var pulse = false

    public var body: some View {
        let palette = HealthColors.palette(for: grade)

        Circle()
            .fill(palette.dot)
            .frame(width: size, height: size)
            .shadow(color: palette.glow, radius: animated && pulse ? 8 : 4)
            .scaleEffect(animated && pulse ? 1.15 : 1.0)
            .onAppear {
                guard animated else { return }
                withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
                    pulse = true
                }
            }
            .accessibilityLabel(Text(grade.labelKo + " 상태"))
    }
}

// MARK: - BUEyebrow — UPPERCASE 라벨 (Tier/카테고리)

public struct BUEyebrow: View {

    let text: String
    let color: Color

    public init(_ text: String, color: Color = BUColor.inkMuted) {
        self.text = text
        self.color = color
    }

    public var body: some View {
        Text(text)
            .buEyebrowStyle(color: color)
            .accessibilityAddTraits(.isHeader)
    }
}

// MARK: - BUTagBadge — 작은 pill (운영 47일째, 단계 등)

public struct BUTagBadge: View {

    public enum Style: Sendable {
        case solid     // 진한 배경 (운영 N일째)
        case soft      // 옅은 tint (단계 chip)
        case outline   // 외곽선만 (보조)
    }

    let text: String
    let style: Style
    let tint: Color

    public init(_ text: String, style: Style = .soft, tint: Color = BUColor.midnight) {
        self.text = text
        self.style = style
        self.tint = tint
    }

    public var body: some View {
        Text(text)
            .font(BUFont.eyebrow)
            .foregroundStyle(textColor)
            .tracking(0.5)
            .padding(.horizontal, 8)
            .padding(.vertical, 2.5)
            .background(backgroundColor, in: Capsule())
            .overlay(
                Capsule()
                    .strokeBorder(borderColor, lineWidth: borderWidth)
            )
    }

    private var textColor: Color {
        switch style {
        case .solid:   return .white
        case .soft:    return tint
        case .outline: return tint
        }
    }
    /// background 는 ShapeStyle 필요 → Color (ShapeStyle 채택) 로 분기.
    private var backgroundColor: Color {
        switch style {
        case .solid:   return tint
        case .soft:    return tint.opacity(0.08)
        case .outline: return .clear
        }
    }
    private var borderColor: Color {
        switch style {
        case .outline: return tint.opacity(0.4)
        default: return .clear
        }
    }
    private var borderWidth: CGFloat {
        switch style {
        case .outline: return 0.8
        default: return 0
        }
    }
}

// MARK: - BUTrendChip — ↗ +12% 트렌드

public struct BUTrendChip: View {

    /// 변화율 (%) — nil 이면 chip 미표시
    let changePct: Double?
    /// 라벨 ("WoW" / "MoM" / "주간매출" 등)
    let label: String?

    public init(changePct: Double?, label: String? = nil) {
        self.changePct = changePct
        self.label = label
    }

    public var body: some View {
        if let pct = changePct, pct.isFinite {
            HStack(spacing: 3) {
                Image(systemName: arrow(for: pct))
                    .font(.system(size: 10, weight: .heavy))
                Text("\(pct >= 0 ? "+" : "")\(String(format: "%.0f", pct))%")
                    .font(BUFont.eyebrow)
                    .monospacedDigit()
                if let label {
                    Text(label)
                        .font(BUFont.eyebrow)
                        .foregroundStyle(.secondary)
                }
            }
            .foregroundStyle(color(for: pct))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(tintBg(for: pct), in: Capsule())
            .tracking(0.3)
        }
    }

    private func arrow(for pct: Double) -> String {
        if pct > 0.5 { return "arrow.up.right" }
        if pct < -0.5 { return "arrow.down.right" }
        return "minus"
    }
    private func color(for pct: Double) -> Color {
        if pct > 0.5 { return BUColor.success }
        if pct < -0.5 { return BUColor.danger }
        return BUColor.inkMuted
    }
    private func tintBg(for pct: Double) -> Color {
        if pct > 0.5 { return BUColor.success.opacity(0.10) }
        if pct < -0.5 { return BUColor.danger.opacity(0.10) }
        return BUColor.inkMuted.opacity(0.06)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Micro components") {
    ZStack {
        BUBackgroundSurface()

        VStack(alignment: .leading, spacing: BUSpacing.lg) {
            Group {
                Text("BUHealthDot — 등급 5종 (animated=true 펄스)")
                    .buEyebrowStyle()
                HStack(spacing: BUSpacing.md) {
                    ForEach(HealthGrade.allCases, id: \.self) { grade in
                        VStack {
                            BUHealthDot(grade: grade, animated: grade == .critical)
                            Text(grade.labelKo)
                                .font(BUFont.labelSmall)
                        }
                    }
                }
            }

            Divider()

            Group {
                Text("BUTagBadge — solid / soft / outline")
                    .buEyebrowStyle()
                HStack(spacing: BUSpacing.xs) {
                    BUTagBadge("운영 47일째", style: .solid)
                    BUTagBadge("성장 단계", style: .soft)
                    BUTagBadge("외식", style: .outline)
                }
            }

            Divider()

            Group {
                Text("BUTrendChip — ±변화율")
                    .buEyebrowStyle()
                HStack(spacing: BUSpacing.xs) {
                    BUTrendChip(changePct: 18, label: "WoW")
                    BUTrendChip(changePct: -12, label: "WoW")
                    BUTrendChip(changePct: 0)
                }
            }
        }
        .padding(BUSpacing.lg)
    }
}
#endif
