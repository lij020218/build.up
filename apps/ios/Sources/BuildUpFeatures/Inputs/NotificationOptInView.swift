//
//  NotificationOptInView.swift — 푸시 알림 권한 sheet
//
//  Apple HIG 베스트 프랙티스: 가치 제안 → 사용자 동의 → 시스템 다이얼로그 호출.
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpNotifications

public struct NotificationOptInView: View {

    @Bindable public var flow: NotificationPermissionFlow
    public let onDone: () -> Void

    public init(flow: NotificationPermissionFlow, onDone: @escaping () -> Void) {
        self.flow = flow
        self.onDone = onDone
    }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            VStack(spacing: BUSpacing.lg) {
                Spacer()

                Image(systemName: "bell.badge.fill")
                    .font(.system(size: 64, weight: .light))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.bottom, BUSpacing.md)

                VStack(spacing: BUSpacing.sm) {
                    Text("매일 30초, 사장님 손에")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.5)
                        .multilineTextAlignment(.center)

                    Text("아침에 어제 매출 + 오늘 한 가지 행동,\n위기 시 가장 먼저 알려드릴게요.")
                        .font(BUFont.body)
                        .foregroundStyle(BUColor.inkSecondary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                }

                // ── 가치 제안 3개 ──
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    valueRow(icon: "sun.max.fill", title: "매일 09:00", subtitle: "어제 매출 + 오늘 한 가지 행동")
                    valueRow(icon: "exclamationmark.triangle.fill", title: "현금 위기 즉시", subtitle: "통장 부족 예상 7일 전 알림")
                    valueRow(icon: "moon.stars.fill", title: "저녁 21:00", subtitle: "매출 미기록 3일+ 시")
                }
                .padding(.horizontal, BUSpacing.lg)
                .padding(.top, BUSpacing.lg)

                Spacer()

                // ── 액션 버튼 ──
                VStack(spacing: BUSpacing.xs) {
                    Button {
                        Task {
                            await flow.requestAndSchedule()
                            onDone()
                        }
                    } label: {
                        HStack {
                            if flow.status == .requesting {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "bell.fill")
                            }
                            Text("알림 받기")
                        }
                        .font(BUFont.label)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(flow.status == .requesting)

                    Button {
                        onDone()
                    } label: {
                        Text("나중에")
                            .font(BUFont.bodySmall)
                            .foregroundStyle(BUColor.inkMuted)
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, BUSpacing.md)
                .padding(.bottom, BUSpacing.xl)
            }
        }
    }

    private func valueRow(icon: String, title: String, subtitle: String) -> some View {
        HStack(spacing: BUSpacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: BURadius.sm, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.08))
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(BUFont.label)
                    .foregroundStyle(BUColor.ink)
                Text(subtitle)
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
            }
            Spacer()
        }
    }
}

#if DEBUG
#Preview("NotificationOptIn") {
    NotificationOptInView(flow: NotificationPermissionFlow()) {
        // dismissed
    }
}
#endif
