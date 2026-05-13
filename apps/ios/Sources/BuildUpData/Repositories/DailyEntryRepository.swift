//
//  DailyEntryRepository.swift — 매출 일별 기록 CRUD
//
//  Supabase 의 `daily_entries` 테이블 (웹과 같은 schema) 와 통신.
//  Local-first 패턴: 입력 즉시 캐시 → 배경에서 Supabase upsert.
//
//  ⚠️ Supabase schema 가정:
//   table daily_entries (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid not null references auth.users(id),
//     date date not null,
//     sales numeric not null default 0,
//     customers integer not null default 0,
//     created_at timestamptz default now(),
//     updated_at timestamptz default now(),
//     unique(user_id, date)
//   );
//

import Foundation
import Supabase
import BuildUpCore

// MARK: - DTO (Supabase row 와 1:1 매핑)

struct DailyEntryDTO: Codable, Sendable {
    let id: UUID?
    let user_id: UUID
    let date: String           // "yyyy-MM-dd"
    let sales: Double
    let customers: Int

    init(from entry: DailyEntry, userId: UUID) {
        self.id = nil
        self.user_id = userId
        self.date = entry.date
        self.sales = entry.sales
        self.customers = entry.customers
    }

    var domain: DailyEntry {
        DailyEntry(date: date, sales: sales, customers: customers)
    }
}

// MARK: - Repository protocol — 실제 / Mock 동시 지원

public protocol DailyEntryRepositoryProtocol: Sendable {
    func list(limit: Int, ascending: Bool) async throws -> [DailyEntry]
    func upsert(_ entry: DailyEntry) async throws
    func delete(date: String) async throws
}

// MARK: - Supabase 실제 구현

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

    /// 최근 N일 entries (default 90) 조회.
    public func list(limit: Int = 90, ascending: Bool = true) async throws -> [DailyEntry] {
        let userId = try await getUserId()

        let rows: [DailyEntryDTO] = try await supabase
            .from("daily_entries")
            .select()
            .eq("user_id", value: userId)
            .order("date", ascending: ascending)
            .limit(limit)
            .execute()
            .value

        return rows.map { $0.domain }
    }

    /// upsert (있으면 update, 없으면 insert — date unique).
    public func upsert(_ entry: DailyEntry) async throws {
        let userId = try await getUserId()
        let dto = DailyEntryDTO(from: entry, userId: userId)

        try await supabase
            .from("daily_entries")
            .upsert(dto, onConflict: "user_id,date")
            .execute()
    }

    public func delete(date: String) async throws {
        let userId = try await getUserId()
        try await supabase
            .from("daily_entries")
            .delete()
            .eq("user_id", value: userId)
            .eq("date", value: date)
            .execute()
    }
}

// MARK: - In-memory mock (Preview / 테스트용)

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
