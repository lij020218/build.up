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
import FoundOneCore

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

        // 1) 원본 JSON 배열 fetch — 모든 키 보존 (productSales/planSignups/planChurns 등 웹 전용 필드 유지).
        //    ⚠️ 과거 버그: DailyEntry(3필드)로 디코드→재인코드 하면서 웹 부가필드가 전 기간 소실됐음.
        //    → 원본 객체를 그대로 들고 sales/customers 만 갱신하는 JSON 레벨 머지로 수정.
        var arr = try await fetchRawEntries(userId: userId)
        if let idx = arr.firstIndex(where: { $0["date"]?.stringValue == entry.date }) {
            arr[idx]["sales"] = .number(entry.sales)
            arr[idx]["customers"] = .int(entry.customers)
        } else {
            arr.append([
                "date": .string(entry.date),
                "sales": .number(entry.sales),
                "customers": .int(entry.customers),
            ])
        }
        arr.sort { ($0["date"]?.stringValue ?? "") < ($1["date"]?.stringValue ?? "") }

        try await supabase
            .from("user_store_data")
            .upsert(
                StoreDataWriteDTO(
                    user_id: userId,
                    daily_entries: arr,
                    updated_at: ISO8601DateFormatter().string(from: Date())
                ),
                onConflict: "user_id"
            )
            .execute()
    }

    public func delete(date: String) async throws {
        let userId = try await getUserId()
        var arr = try await fetchRawEntries(userId: userId)
        arr.removeAll { $0["date"]?.stringValue == date }

        try await supabase
            .from("user_store_data")
            .upsert(
                StoreDataWriteDTO(
                    user_id: userId,
                    daily_entries: arr,
                    updated_at: ISO8601DateFormatter().string(from: Date())
                ),
                onConflict: "user_id"
            )
            .execute()
    }

    /// 원본 daily_entries JSON 객체 배열 — 모든 키 보존(부가필드 유실 방지)용 fetch.
    private func fetchRawEntries(userId: UUID) async throws -> [[String: JSONValue]] {
        let rows: [RawStoreRow] = try await supabase
            .from("user_store_data")
            .select("daily_entries")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        return (rows.first?.daily_entries ?? []).compactMap { $0.objectValue }
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

/// 원본 JSON 보존 fetch 용 — daily_entries 의 모든 키를 그대로 들고 옴.
private struct RawStoreRow: Decodable {
    let daily_entries: [JSONValue]?
}

private struct StoreDataWriteDTO: Encodable {
    let user_id: UUID
    let daily_entries: [[String: JSONValue]]
    let updated_at: String
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
}

/// 임의 JSON 값 — daily_entries 의 부가필드(productSales/planSignups/planChurns 등)를
/// 디코드→인코드 왕복에서 손실 없이 보존하기 위한 Codable 표현. (SDK 의존 없음)
enum JSONValue: Codable, Sendable, Hashable {
    case string(String)
    case int(Int)
    case number(Double)
    case bool(Bool)
    case null
    case array([JSONValue])
    case object([String: JSONValue])

    var stringValue: String? { if case .string(let s) = self { return s }; return nil }
    var objectValue: [String: JSONValue]? { if case .object(let o) = self { return o }; return nil }

    init(from decoder: any Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() {
            self = .null
        } else if let b = try? c.decode(Bool.self) {
            self = .bool(b)
        } else if let i = try? c.decode(Int.self) {
            self = .int(i)
        } else if let d = try? c.decode(Double.self) {
            self = .number(d)
        } else if let s = try? c.decode(String.self) {
            self = .string(s)
        } else if let a = try? c.decode([JSONValue].self) {
            self = .array(a)
        } else if let o = try? c.decode([String: JSONValue].self) {
            self = .object(o)
        } else {
            self = .null
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .int(let i): try c.encode(i)
        case .number(let d): try c.encode(d)
        case .bool(let b): try c.encode(b)
        case .null: try c.encodeNil()
        case .array(let a): try c.encode(a)
        case .object(let o): try c.encode(o)
        }
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
