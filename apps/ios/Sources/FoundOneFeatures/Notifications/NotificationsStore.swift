//
//  NotificationsStore.swift — 인앱 알림함 상태 + 실시간 (2026-07-14)
//
//  BUSupabase.shared.client 로 생성. start() 시 세션 유저를 해석해 로드 + realtime 구독.
//  데모/비로그인(currentUser == nil)이면 조용히 비활성(빈 목록) — 벨은 0 배지로 렌더.
//  웹 useInAppNotifications 미러(실시간 recipient_user_id 필터).
//

import Foundation
import Supabase
import FoundOneData

@MainActor
public final class NotificationsStore: ObservableObject {
    @Published public private(set) var items: [AppNotification] = []
    public var unreadCount: Int { items.reduce(0) { $0 + ($1.isRead ? 0 : 1) } }

    private let client: SupabaseClient
    private let repo: NotificationsRepository
    private var channel: RealtimeChannelV2?
    private var subscription: RealtimeSubscription?

    public init(client: SupabaseClient) {
        self.client = client
        self.repo = NotificationsRepository(supabase: client)
    }

    public func load() async {
        if let rows = try? await repo.recent() { items = rows }
    }

    public func markRead(_ id: UUID) {
        Task { try? await repo.markRead(id: id); await load() }
    }

    public func markAllRead() {
        Task { try? await repo.markAllRead(); await load() }
    }

    /// 로드 + 실시간 구독 시작. 세션 없으면(데모) no-op.
    public func start() async {
        guard let uid = client.auth.currentUser?.id.uuidString else { return }
        await load()
        guard channel == nil else { return }
        let ch = client.channel("notif-\(uid)")
        let sub = ch.onPostgresChange(
            AnyAction.self,
            schema: "public",
            table: "notifications",
            filter: "recipient_user_id=eq.\(uid)"
        ) { [weak self] _ in
            Task { @MainActor in await self?.load() }
        }
        self.subscription = sub
        self.channel = ch
        try? await ch.subscribeWithError()
    }

    public func stop() async {
        subscription?.cancel()
        subscription = nil
        if let ch = channel { await client.removeChannel(ch) }
        channel = nil
    }
}
