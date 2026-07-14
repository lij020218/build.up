//
//  NotificationBell.swift — 헤더 알림 벨 + 알림함 시트 (2026-07-14)
//
//  웹 language-provider 벨 미러: 미읽음 배지 + 탭 시 최근 알림 목록(출근·초대·연차·수당).
//  신호등 색 미사용 — 미읽음=채운 네이비 점, 읽음=흐린 테두리.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

// MARK: - 벨 버튼 (헤더용)

public struct NotificationBell: View {
    let unread: Int
    let action: () -> Void

    public init(unread: Int, action: @escaping () -> Void) {
        self.unread = unread
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: unread > 0 ? "bell.fill" : "bell")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(unread > 0 ? BUColor.midnight : BUColor.inkMuted)
                    .frame(width: 34, height: 34)
                if unread > 0 {
                    Text(unread > 9 ? "9+" : "\(unread)")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 4)
                        .frame(minWidth: 15, minHeight: 15)
                        .background(BUColor.midnight, in: Capsule())
                        .overlay(Capsule().strokeBorder(.white, lineWidth: 1.5))
                        .offset(x: 5, y: -3)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(unread > 0 ? "알림 \(unread)개" : "알림")
    }
}

// MARK: - 알림함 시트

public struct NotificationsSheet: View {
    @ObservedObject var store: NotificationsStore
    @Environment(\.dismiss) private var dismiss

    public init(store: NotificationsStore) { self.store = store }

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                if store.items.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        VStack(spacing: 8) {
                            ForEach(store.items) { n in
                                row(n)
                            }
                        }
                        .padding(BUSpacing.md)
                    }
                }
            }
            .navigationTitle("알림")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                if store.unreadCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("모두 읽음") { store.markAllRead() }.foregroundStyle(BUColor.midnight)
                    }
                }
                #endif
            }
            .task { await store.load() }
        }
    }

    private func row(_ n: AppNotification) -> some View {
        Button {
            if !n.isRead { store.markRead(n.id) }
        } label: {
            BUCard(.outer) {
                HStack(alignment: .top, spacing: 10) {
                    // 미읽음 = 채운 네이비 · 읽음 = 흐린 테두리
                    Circle()
                        .fill(n.isRead ? Color.clear : BUColor.midnight)
                        .overlay(Circle().strokeBorder(BUColor.midnight.opacity(n.isRead ? 0.18 : 0), lineWidth: 1.5))
                        .frame(width: 8, height: 8)
                        .padding(.top, 5)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(n.title)
                            .font(.system(size: 14, weight: n.isRead ? .semibold : .heavy))
                            .foregroundStyle(BUColor.ink)
                        Text(n.body)
                            .font(.system(size: 12.5))
                            .foregroundStyle(BUColor.inkSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(Self.timeAgo(n.createdAt))
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                            .padding(.top, 2)
                    }
                    Spacer(minLength: 0)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "bell.slash")
                .font(.system(size: 30, weight: .light))
                .foregroundStyle(BUColor.inkMuted)
            Text("새 알림 없음")
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            Text("직원 출근·초대·연차 등 알림이 여기에 모입니다")
                .font(.system(size: 12.5))
                .foregroundStyle(BUColor.inkSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(30)
    }

    /// ISO timestamptz → 상대 시간 (방금 전 / N분 전 / N시간 전 / N일 전)
    private static func timeAgo(_ iso: String) -> String {
        let parsed: Date? = {
            let f1 = ISO8601DateFormatter(); f1.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let d = f1.date(from: iso) { return d }
            let f2 = ISO8601DateFormatter(); f2.formatOptions = [.withInternetDateTime]
            return f2.date(from: iso)
        }()
        guard let date = parsed else { return "" }
        let m = Int(Date().timeIntervalSince(date) / 60)
        if m < 1 { return "방금 전" }
        if m < 60 { return "\(m)분 전" }
        let h = m / 60
        if h < 24 { return "\(h)시간 전" }
        return "\(h / 24)일 전"
    }
}
