//
//  BUNumberPad.swift — 5초 매출 입력 큰 키패드
//
//  사장님이 카운터/매장에서 한 손으로 5초 안에 매출 입력 가능하게.
//   • 큰 버튼 (64×56pt — Apple HIG 44 최소 훨씬 초과)
//   • 햅틱 피드백
//   • SF Pro Display monospaced digit (자릿수 흔들림 없음)
//   • "만" / "천" 단위 빠른 입력 단축키
//

import SwiftUI
import FoundOneDesignSystem

#if canImport(UIKit)
import UIKit
#endif

// MARK: - BUNumberPad

public struct BUNumberPad: View {

    @Binding public var amount: Int

    /// 단위 ("원" / "명" / "건" 등) — 표시용
    public let unit: String

    /// 큰 단위 빠른 추가 ("+1만" / "+5천" 등). 기본: 1만/5천/1천/100/10
    public let quickAddValues: [Int]

    /// 제출 액션
    public let onSubmit: () -> Void

    public init(
        amount: Binding<Int>,
        unit: String = "원",
        quickAddValues: [Int] = [10_000, 5_000, 1_000, 100, 10],
        onSubmit: @escaping () -> Void
    ) {
        self._amount = amount
        self.unit = unit
        self.quickAddValues = quickAddValues
        self.onSubmit = onSubmit
    }

    public var body: some View {
        VStack(spacing: BUSpacing.md) {
            // ── 디스플레이 ──
            displaySection

            // ── 빠른 추가 chips ──
            quickAddSection

            // ── 숫자 키패드 ──
            numpadSection

            // ── 액션 (지우기 / 기록) ──
            actionSection
        }
        .padding(BUSpacing.lg)
        .background(BUColor.surface)
    }

    // MARK: 디스플레이

    private var displaySection: some View {
        VStack(spacing: 4) {
            Text(formatted(amount))
                .font(.system(size: 56, weight: .bold, design: .default))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-1.5)
                .monospacedDigit()
                .minimumScaleFactor(0.4)
                .lineLimit(1)
                .frame(maxWidth: .infinity)
            Text(unit)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.vertical, BUSpacing.md)
    }

    // MARK: 빠른 추가

    private var quickAddSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: BUSpacing.xs) {
                ForEach(quickAddValues, id: \.self) { v in
                    Button {
                        haptic(.light)
                        amount += v
                    } label: {
                        Text("+\(quickLabel(for: v))")
                            .font(BUFont.label)
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.08), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 2)
        }
    }

    // MARK: 숫자 키패드

    private let layout: [[NumKey]] = [
        [.digit(1), .digit(2), .digit(3)],
        [.digit(4), .digit(5), .digit(6)],
        [.digit(7), .digit(8), .digit(9)],
        [.zeros,    .digit(0), .backspace],
    ]

    private var numpadSection: some View {
        VStack(spacing: BUSpacing.xs) {
            ForEach(layout, id: \.self) { row in
                HStack(spacing: BUSpacing.xs) {
                    ForEach(row, id: \.self) { key in
                        keyButton(key)
                    }
                }
            }
        }
    }

    private func keyButton(_ key: NumKey) -> some View {
        Button {
            haptic(.light)
            apply(key)
        } label: {
            keyLabel(key)
                .frame(maxWidth: .infinity, minHeight: 56)
                .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                        .strokeBorder(BUColor.border, lineWidth: 0.5)
                )
        }
        .buttonStyle(NumberKeyStyle())
    }

    @ViewBuilder
    private func keyLabel(_ key: NumKey) -> some View {
        switch key {
        case .digit(let n):
            Text("\(n)")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .monospacedDigit()
        case .zeros:
            Text("000")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
                .monospacedDigit()
        case .backspace:
            Image(systemName: "delete.left")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
        }
    }

    // MARK: 액션 (지우기 + 기록)

    private var actionSection: some View {
        HStack(spacing: BUSpacing.xs) {
            Button {
                haptic(.medium)
                amount = 0
            } label: {
                Text("지우기")
                    .font(BUFont.label)
                    .foregroundStyle(BUColor.inkSecondary)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(BUColor.surface, in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                            .strokeBorder(BUColor.border, lineWidth: 0.5)
                    )
            }
            .buttonStyle(.plain)

            Button {
                haptic(.success)
                onSubmit()
            } label: {
                Text("기록")
                    .font(BUFont.label)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(
                        amount > 0 ? BUColor.midnight : BUColor.midnight.opacity(0.3),
                        in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                    )
            }
            .buttonStyle(.plain)
            .disabled(amount <= 0)
        }
    }

    // MARK: - Internal

    private enum NumKey: Hashable {
        case digit(Int)
        case zeros        // 000 (빠른 입력)
        case backspace
    }

    private func apply(_ key: NumKey) {
        switch key {
        case .digit(let d):
            // 9자리 제한 (999,999,999원)
            guard amount < 100_000_000 else { return }
            amount = amount * 10 + d
        case .zeros:
            guard amount > 0, amount < 100_000_000 else { return }
            amount *= 1000
        case .backspace:
            amount /= 10
        }
    }

    private func formatted(_ value: Int) -> String {
        guard value > 0 else { return "0" }
        return value.formatted(.number.grouping(.automatic))
    }

    /// 빠른 추가 chip 라벨: 10000 → "1만", 5000 → "5천"
    private func quickLabel(for value: Int) -> String {
        if value >= 10_000 { return "\(value / 10_000)만" }
        if value >= 1_000 { return "\(value / 1_000)천" }
        return value.formatted()
    }

    // MARK: 햅틱

    enum HapticStyle: Sendable {
        case light, medium, success
    }

    private func haptic(_ style: HapticStyle) {
        #if canImport(UIKit)
        switch style {
        case .light:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case .medium:
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case .success:
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
        #endif
    }
}

// MARK: - Button style (눌렀을 때 살짝 줄어듦)

private struct NumberKeyStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.94 : 1.0)
            .opacity(configuration.isPressed ? 0.85 : 1.0)
            .animation(.spring(response: 0.18, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUNumberPad — 5초 매출 입력") {
    NumberPadPreviewWrapper()
}

private struct NumberPadPreviewWrapper: View {
    @State private var amount: Int = 0
    @State private var lastSubmit: String = ""

    var body: some View {
        ZStack {
            BUBackgroundSurface()
            VStack {
                if !lastSubmit.isEmpty {
                    Text("저장: \(lastSubmit)")
                        .font(BUFont.label)
                        .foregroundStyle(BUColor.success)
                        .padding(.top)
                }
                BUNumberPad(amount: $amount) {
                    lastSubmit = "\(amount.formatted())원"
                    amount = 0
                }
            }
        }
    }
}
#endif
