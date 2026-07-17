//
//  CashCrisisActivityView.swift — Live Activity UI (Lock Screen + Dynamic Island)
//
//  Widget Extension target 의 ActivityConfiguration 안에서 사용.
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem

#if canImport(ActivityKit) && os(iOS)
import ActivityKit
// activityBackgroundTint / activitySystemActionForegroundColor 는 WidgetKit 의 View 확장 —
//   이 import 없이는 컴파일 불가. (이 타깃은 앱 스킴에 미포함이라 오류가 잠복해 있었고,
//   FoundOne-Package 전체 테스트 빌드에서 처음 드러남. 2026-07-17)
import WidgetKit

// MARK: - Lock Screen / Banner

@available(iOS 16.1, *)
public struct CashCrisisLockScreenView: View {

    let state: CashCrisisAttributes.ContentState
    let storeName: String

    public init(state: CashCrisisAttributes.ContentState, storeName: String) {
        self.state = state
        self.storeName = storeName
    }

    public var body: some View {
        HStack(alignment: .center, spacing: BUSpacing.sm) {
            // 위기 아이콘
            ZStack {
                Circle()
                    .fill(BUColor.danger.opacity(0.12))
                    .frame(width: 44, height: 44)
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(BUColor.danger)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(storeName.uppercased())
                    .buEyebrowStyle()

                HStack(spacing: 4) {
                    Text("\(state.daysUntilCrisis)")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(BUColor.danger)
                        .monospacedDigit()
                    Text("일 후 현금 부족")
                        .font(BUFont.label)
                        .foregroundStyle(BUColor.ink)
                }

                Text("부족액 \(formatKRW(Double(state.shortfallWon)))")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
            }

            Spacer(minLength: 0)
        }
        .padding(BUSpacing.md)
        .activityBackgroundTint(BUColor.surface.opacity(0.8))
        .activitySystemActionForegroundColor(BUColor.midnight)
    }
}

// MARK: - Dynamic Island (compact / expanded / minimal)

@available(iOS 16.1, *)
public enum CashCrisisDynamicIsland {

    @ViewBuilder
    public static func leading(state: CashCrisisAttributes.ContentState) -> some View {
        Image(systemName: "exclamationmark.triangle.fill")
            .foregroundStyle(BUColor.danger)
    }

    @ViewBuilder
    public static func trailing(state: CashCrisisAttributes.ContentState) -> some View {
        Text("D-\(state.daysUntilCrisis)")
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(BUColor.danger)
            .monospacedDigit()
    }

    @ViewBuilder
    public static func bottom(state: CashCrisisAttributes.ContentState) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(BUColor.danger)
            VStack(alignment: .leading, spacing: 0) {
                Text("\(state.daysUntilCrisis)일 후 현금 부족")
                    .font(BUFont.label)
                    .foregroundStyle(BUColor.ink)
                Text("부족액 \(formatKRW(Double(state.shortfallWon)))")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
            }
            Spacer()
        }
        .padding(.horizontal, BUSpacing.sm)
    }

    @ViewBuilder
    public static func minimal(state: CashCrisisAttributes.ContentState) -> some View {
        Text("D-\(state.daysUntilCrisis)")
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(BUColor.danger)
            .monospacedDigit()
    }
}

#endif

// MARK: - Preview

#if DEBUG && canImport(ActivityKit) && os(iOS)
@available(iOS 16.1, *)
#Preview("CashCrisis Lock Screen") {
    CashCrisisLockScreenView(
        state: .init(
            daysUntilCrisis: 7,
            shortfallWon: 6_500_000,
            currentBalance: 8_000_000
        ),
        storeName: "Sample SaaS"
    )
    .padding()
    .background(BUColor.surface)
}
#endif
