//
//  NotificationsRepository.swift — 인앱 알림함 (2026-07-14)
//
//  public.notifications 를 본인(recipient_user_id = auth.uid()) 기준으로 읽고 읽음 처리.
//  push_dispatch 가 OS 푸시와 함께 남기는 행이라 출근·초대·연차·추가수당 등 모든
//  이벤트가 여기로 흘러든다. 웹 useInAppNotifications 미러.
//

import Foundation
import Supabase

/// 인앱 알림 1건.
public struct AppNotification: Decodable, Sendable, Identifiable, Equatable {
    public let id: UUID
    public let title: String
    public let body: String
    public let url: String?
    public let isRead: Bool
    public let createdAt: String   // ISO timestamptz

    enum CodingKeys: String, CodingKey {
        case id, title, body, url
        case isRead = "is_read"
        case createdAt = "created_at"
    }
}

public actor NotificationsRepository {
    private let client: SupabaseClient
    public init(supabase: SupabaseClient) { self.client = supabase }

    /// 본인 수신 알림 최근순 (RLS: recipient_user_id = auth.uid())
    public func recent(limit: Int = 30) async throws -> [AppNotification] {
        try await client
            .from("notifications")
            .select("id, title, body, url, is_read, created_at")
            .order("created_at", ascending: false)
            .limit(limit)
            .execute().value
    }

    public func markRead(id: UUID) async throws {
        struct Patch: Encodable { let is_read: Bool }
        try await client
            .from("notifications")
            .update(Patch(is_read: true))
            .eq("id", value: id.uuidString)
            .execute()
    }

    /// 미읽음 전체 읽음 — RLS(UPDATE recipient=본인)가 남의 행을 막으므로 is_read=false 필터만으로 안전.
    public func markAllRead() async throws {
        struct Patch: Encodable { let is_read: Bool }
        try await client
            .from("notifications")
            .update(Patch(is_read: true))
            .eq("is_read", value: false)
            .execute()
    }
}
