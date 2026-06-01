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

    /// 영업시간을 현재 로그인 사용자의 user_store_data(business_open/close_time)에 저장.
    /// 정수 시(0~23)를 "HH:00" 형식으로 변환. (웹 BusinessHoursInput 과 동일 컬럼)
    @MainActor
    public static func persistBusinessHoursForCurrentUser(openHour: Int, closeHour: Int) {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let client = BUSupabase.shared.client
        let open = String(format: "%02d:00", max(0, min(23, openHour)))
        let close = String(format: "%02d:00", max(0, min(23, closeHour)))
        Task {
            let repo = StoreProfileRepository(supabase: client, userId: uid)
            try? await repo.updateBusinessHours(open: open, close: close)
        }
    }

    /// 세무 처리 방식(세무사/직접)을 user_store_data.cpa_decision 에 저장. ("cpa" | "self" — 웹과 동일 어휘)
    @MainActor
    public static func persistCpaDecisionForCurrentUser(_ choice: String) {
        let trimmed = choice.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed == "cpa" || trimmed == "self" else { return }
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let client = BUSupabase.shared.client
        Task {
            let repo = StoreProfileRepository(supabase: client, userId: uid)
            try? await repo.updateCpaDecision(trimmed)
        }
    }

    /// 과세유형(간이/일반)을 user_store_data.tax_settings.vatType 에 저장.
    /// jsonb 의 hasEmployees 는 보존하기 위해 read-merge-write. ("general"|"simplified" — 웹과 동일 어휘)
    @MainActor
    public static func persistVatTypeForCurrentUser(_ vatType: String) {
        guard vatType == "general" || vatType == "simplified" else { return }
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let client = BUSupabase.shared.client
        Task {
            let repo = StoreProfileRepository(supabase: client, userId: uid)
            try? await repo.mergeTaxVatType(vatType)
        }
    }

    /// tax_settings jsonb 의 vatType 만 갱신, hasEmployees 등 기존 키 보존.
    public func mergeTaxVatType(_ vatType: String) async throws {
        guard vatType == "general" || vatType == "simplified" else { return }
        struct ReadRow: Decodable, Sendable { let tax_settings: TaxSettingsDTO? }
        let rows: [ReadRow] = try await supabase
            .from("user_store_data")
            .select("tax_settings")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        var settings = rows.first?.tax_settings ?? TaxSettingsDTO(vatType: "general", hasEmployees: false)
        settings.vatType = vatType
        let payload = TaxUpsert(
            user_id: userId,
            tax_settings: settings,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        _ = try await supabase
            .from("user_store_data")
            .upsert(payload, onConflict: "user_id")
            .execute()
    }

    /// 세무 처리 방식 단독 저장.
    public func updateCpaDecision(_ choice: String?) async throws {
        let trimmed = choice?.trimmingCharacters(in: .whitespacesAndNewlines)
        let payload = CpaUpsert(
            user_id: userId,
            cpa_decision: (trimmed?.isEmpty ?? true) ? nil : trimmed,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        _ = try await supabase
            .from("user_store_data")
            .upsert(payload, onConflict: "user_id")
            .execute()
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

    private struct CpaUpsert: Encodable, Sendable {
        let user_id: UUID
        let cpa_decision: String?
        let updated_at: String
    }

    /// user_store_data.tax_settings jsonb 구조 (웹 operations-store.ts TaxSettings 와 동일).
    struct TaxSettingsDTO: Codable, Sendable, Hashable {
        var vatType: String       // "general" | "simplified"
        var hasEmployees: Bool
    }

    private struct TaxUpsert: Encodable, Sendable {
        let user_id: UUID
        let tax_settings: TaxSettingsDTO
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
