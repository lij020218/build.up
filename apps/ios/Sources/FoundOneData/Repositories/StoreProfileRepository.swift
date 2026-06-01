//
//  StoreProfileRepository.swift — user_store_data 의 가게 메타 (이름·영업시간) 읽기/쓰기.
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/StoreNameInput.tsx
//          apps/web/app/lib/components/stages/shared/BusinessHoursInput.tsx
//
//  웹은 zustand → 600ms debounce → Supabase upsert. iOS 는 사용자가 시트에서 "저장" 명시 호출.
//

import Foundation
import Supabase

public struct StoreProfileInfo: Sendable, Hashable {
    public let storeName: String
    public let businessOpenTime: String?     // "HH:MM" 24h KST or nil (24h)
    public let businessCloseTime: String?

    public init(storeName: String, businessOpenTime: String? = nil, businessCloseTime: String? = nil) {
        self.storeName = storeName
        self.businessOpenTime = businessOpenTime
        self.businessCloseTime = businessCloseTime
    }
}

public actor StoreProfileRepository {
    private let supabase: SupabaseClient
    private let userId: UUID

    public init(supabase: SupabaseClient, userId: UUID) {
        self.supabase = supabase
        self.userId = userId
    }

    /// 온보딩/위저드 등 어디서든 호출 — 현재 로그인 사용자의 store_name 을 Supabase(user_store_data)에 저장.
    /// 웹은 StoreNameInput 이 입력 즉시 flushStoreDataImmediate 로 저장하므로, iOS 도 상호명 확정 시점에
    /// 동일하게 서버에 반영해 웹·앱 SSOT 를 유지한다. (빈값/placeholder "내 가게" / 비로그인 시 무시)
    @MainActor
    public static func persistStoreNameForCurrentUser(_ name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed != "내 가게" else { return }
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let client = BUSupabase.shared.client
        Task {
            let repo = StoreProfileRepository(supabase: client, userId: uid)
            try? await repo.updateStoreName(trimmed)
        }
    }

    public func load() async throws -> StoreProfileInfo {
        let rows: [Row] = try await supabase
            .from("user_store_data")
            .select("store_name, business_open_time, business_close_time")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        let row = rows.first
        return StoreProfileInfo(
            storeName: row?.store_name ?? "",
            businessOpenTime: row?.business_open_time,
            businessCloseTime: row?.business_close_time
        )
    }

    public func updateStoreName(_ newName: String) async throws {
        let trimmed = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        let payload = NameUpsert(
            user_id: userId,
            store_name: trimmed.isEmpty ? nil : trimmed,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        _ = try await supabase
            .from("user_store_data")
            .upsert(payload, onConflict: "user_id")
            .execute()
    }

    public func updateBusinessHours(open: String?, close: String?) async throws {
        // 빈 문자열 → nil (24h 운영)
        let openClean  = open?.trimmingCharacters(in: .whitespaces).isEmpty == false ? open : nil
        let closeClean = close?.trimmingCharacters(in: .whitespaces).isEmpty == false ? close : nil
        let payload = HoursUpsert(
            user_id: userId,
            business_open_time: openClean,
            business_close_time: closeClean,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        _ = try await supabase
            .from("user_store_data")
            .upsert(payload, onConflict: "user_id")
            .execute()
    }

    /// 가게 이름 + 영업시간 동시 저장 (시트 [저장] 액션).
    public func updateAll(storeName: String, open: String?, close: String?) async throws {
        let trimmed = storeName.trimmingCharacters(in: .whitespacesAndNewlines)
        let openClean  = open?.trimmingCharacters(in: .whitespaces).isEmpty == false ? open : nil
        let closeClean = close?.trimmingCharacters(in: .whitespaces).isEmpty == false ? close : nil
        let payload = FullUpsert(
            user_id: userId,
            store_name: trimmed.isEmpty ? nil : trimmed,
            business_open_time: openClean,
            business_close_time: closeClean,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        _ = try await supabase
            .from("user_store_data")
            .upsert(payload, onConflict: "user_id")
            .execute()
    }

    // MARK: - Supabase row DTOs

    private struct Row: Decodable, Sendable, Hashable {
        let store_name: String?
        let business_open_time: String?
        let business_close_time: String?
    }

    private struct NameUpsert: Encodable, Sendable {
        let user_id: UUID
        let store_name: String?
        let updated_at: String
    }

    private struct HoursUpsert: Encodable, Sendable {
        let user_id: UUID
        let business_open_time: String?
        let business_close_time: String?
        let updated_at: String
    }

    private struct FullUpsert: Encodable, Sendable {
        let user_id: UUID
        let store_name: String?
        let business_open_time: String?
        let business_close_time: String?
        let updated_at: String
    }
}
