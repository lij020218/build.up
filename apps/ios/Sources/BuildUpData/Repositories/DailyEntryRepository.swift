//
//  DailyEntryRepository.swift — 매출 일별 기록 CRUD
//
//  ⚠️ 웹 SSOT: user_store_data 테이블의 `daily_entries` JSON 컬럼 (별도 테이블 X).
//   웹 packages/shared/src/supabase/store-data.ts 의 saveStoreData 와 호환.
//
//  Local-first 패턴: 입력 즉시 메모리 캐시 → 배경에서 Supabase upsert.
//   기존 entries 전체 fetch → 갱신 → 전체 upsert (JSON 컬럼 특성).
//

import Foundation
import Supabase
import BuildUpCore

// MARK: - Repository protocol

public protocol DailyEntryRepositoryProtocol: Sendable {
    func list(limit: Int, ascending: Bool) async throws -> [DailyEntry]
    func upsert(_ entry: DailyEntry) async throws
    func delete(date: String) async throws
}

// MARK: - Supabase 실제 구현 (user_store_data JSON 컬럼 기반)

public actor DailyEntryRepository: DailyEntryRepositoryProtocol {

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID

    public init(
        supabase: SupabaseClient,
        getUserId: @escaping @Sendable () async throws -> UUID
    ) {
        self.supabase = supabase
        self.getUserId = getUserId
    }

    public func list(limit: Int = 90, ascending: Bool = true) async throws -> [DailyEntry] {
        let userId = try await getUserId()

        let rows: [StoreDataReadDTO] = try await supabase
            .from("user_store_data")
            .select("daily_entries")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value

        let entries = (rows.first?.daily_entries ?? [])
            .compactMap(DailyEntry.init(json:))
            .sorted { ascending ? $0.date < $1.date : $0.date > $1.date }

        return Array(entries.prefix(limit))
    }

    public func upsert(_ entry: DailyEntry) async throws {
        let userId = try await getUserId()

        // 1) 기존 전체 fetch
        var current = try await list(limit: 9999, ascending: true)
        if let idx = current.firstIndex(where: { $0.date == entry.date }) {
            current[idx] = entry
        } else {
            current.append(entry)
            current.sort { $0.date < $1.date }
        }

        // 2) JSON 직렬화
        let json = current.map { $0.toJSON() }

        // 3) upsert (user_id PK)
        try await supabase
            .from("user_store_data")
            .upsert(
                StoreDataWriteDTO(
                    user_id: userId,
                    daily_entries: json,
                    updated_at: ISO8601DateFormatter().string(from: Date())
                ),
                onConflict: "user_id"
            )
            .execute()
    }

    public func delete(date: String) async throws {
        let userId = try await getUserId()
        var current = try await list(limit: 9999, ascending: true)
        current.removeAll { $0.date == date }

        try await supabase
            .from("user_store_data")
            .upsert(
                StoreDataWriteDTO(
                    user_id: userId,
                    daily_entries: current.map { $0.toJSON() },
                    updated_at: ISO8601DateFormatter().string(from: Date())
                ),
                onConflict: "user_id"
            )
            .execute()
    }
}

// MARK: - DTOs

private struct StoreDataReadDTO: Decodable {
    let daily_entries: [DailyEntryJSON]?
}

private struct DailyEntryJSON: Decodable {
    let date: String
    let sales: Double?
    let customers: Int?
}

private struct StoreDataWriteDTO: Encodable {
    let user_id: UUID
    let daily_entries: [[String: AnyEncodable]]
    let updated_at: String
}

/// `AnyEncodable` — Codable-safe wrapper for heterogeneous JSON values.
struct AnyEncodable: Encodable {
    let value: Any

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let v as String: try container.encode(v)
        case let v as Double: try container.encode(v)
        case let v as Int:    try container.encode(v)
        case let v as Bool:   try container.encode(v)
        default:
            try container.encodeNil()
        }
    }
}

private extension DailyEntry {
    init?(json: DailyEntryJSON) {
        guard let sales = json.sales else { return nil }
        self = DailyEntry(
            date: json.date,
            sales: sales,
            customers: json.customers ?? 0
        )
    }

    func toJSON() -> [String: AnyEncodable] {
        [
            "date": AnyEncodable(value: date),
            "sales": AnyEncodable(value: sales),
            "customers": AnyEncodable(value: customers),
        ]
    }
}

// MARK: - In-memory mock (Preview / 테스트)

public actor MockDailyEntryRepository: DailyEntryRepositoryProtocol {
    private var storage: [String: DailyEntry] = [:]

    public init(seed: [DailyEntry] = []) {
        for e in seed { storage[e.date] = e }
    }

    public func list(limit: Int, ascending: Bool) async throws -> [DailyEntry] {
        let all = storage.values
            .sorted { ascending ? $0.date < $1.date : $0.date > $1.date }
        return Array(all.prefix(limit))
    }

    public func upsert(_ entry: DailyEntry) async throws {
        storage[entry.date] = entry
    }

    public func delete(date: String) async throws {
        storage.removeValue(forKey: date)
    }
}
