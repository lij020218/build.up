//
//  CoachingHistoryRepository.swift — 코칭 14일 누적 일지 (웹과 동일 Supabase 테이블)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/coaching-history.ts + /api/coaching-history
//     테이블: public.coaching_history (마이그레이션 20260512_coaching_history.sql)
//     컬럼: user_id, date, brief, signal_kind, signal_headline, signal_action,
//           response_taken, response_note, response_taken_at  (unique user_id,date,brief)
//
//  iOS는 Next API 대신 Supabase Swift SDK로 같은 테이블에 직접 read/upsert.
//  RLS: 본인 select/insert/update 만 (delete 는 service_role). 미로그인 시 호출 안 함.
//

import Foundation
import Supabase

// MARK: - 모델 (웹 CoachingEntry 1:1)

public enum CoachingSignalKind: String, Sendable, Codable, CaseIterable {
    case critical, important, notable, good
}

public enum CoachingBrief: String, Sendable, Codable {
    case offline, startup
}

public struct CoachingEntry: Sendable, Hashable, Identifiable {
    public var id: String { "\(date)|\(brief.rawValue)" }
    public let date: String          // KST YYYY-MM-DD
    public let brief: CoachingBrief
    public let kind: CoachingSignalKind
    public let headline: String
    public let action: String
    public var responseTaken: Bool?   // true=했음 / false=안함 / nil=미응답
    public var responseNote: String?
    public var responseTakenAt: String?

    public init(date: String, brief: CoachingBrief, kind: CoachingSignalKind,
                headline: String, action: String,
                responseTaken: Bool? = nil, responseNote: String? = nil, responseTakenAt: String? = nil) {
        self.date = date; self.brief = brief; self.kind = kind
        self.headline = headline; self.action = action
        self.responseTaken = responseTaken; self.responseNote = responseNote; self.responseTakenAt = responseTakenAt
    }
}

// MARK: - 14일 통계 (웹 getStats 1:1)

public struct CoachingStats: Sendable, Hashable {
    public let totalDays: Int
    public let actionsTaken: Int
    public let criticalSignals: Int
    public let takenRate: Int   // 0~100

    public static func compute(_ entries: [CoachingEntry]) -> CoachingStats {
        let total = entries.count
        let taken = entries.filter { $0.responseTaken == true }.count
        let critical = entries.filter { $0.kind == .critical }.count
        let rate = total > 0 ? Int((Double(taken) / Double(total) * 100).rounded()) : 0
        return CoachingStats(totalDays: total, actionsTaken: taken, criticalSignals: critical, takenRate: rate)
    }
}

// MARK: - Repository

public actor CoachingHistoryRepository {

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID

    public init(supabase: SupabaseClient, getUserId: @escaping @Sendable () async throws -> UUID) {
        self.supabase = supabase
        self.getUserId = getUserId
    }

    /// KST 오늘 (YYYY-MM-DD).
    public static func todayKST() -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let f = DateFormatter()
        f.calendar = cal
        f.timeZone = cal.timeZone
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    /// 최근 N일 entry (최신 먼저). 웹 GET ?days=N 미러.
    public func fetchHistory(days: Int = 14) async throws -> [CoachingEntry] {
        let userId = try await getUserId()
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let cutoff = cal.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let f = DateFormatter(); f.timeZone = cal.timeZone; f.dateFormat = "yyyy-MM-dd"
        let cutoffStr = f.string(from: cutoff)

        let rows: [Row] = try await supabase
            .from("coaching_history")
            .select("date, brief, signal_kind, signal_headline, signal_action, response_taken, response_note, response_taken_at")
            .eq("user_id", value: userId)
            .gte("date", value: cutoffStr)
            .order("date", ascending: false)
            .execute()
            .value

        return rows.compactMap { $0.toEntry() }
    }

    /// 오늘 신호 upsert (user_id,date,brief unique → 하루 한 번 덮어쓰기). 웹 recordSignal 미러.
    /// response 필드는 기존 값 보존을 위해 전달받은 경우에만 갱신.
    public func upsert(_ entry: CoachingEntry) async throws {
        let userId = try await getUserId()
        try await supabase
            .from("coaching_history")
            .upsert(
                WriteRow(
                    user_id: userId,
                    date: entry.date,
                    brief: entry.brief.rawValue,
                    signal_kind: entry.kind.rawValue,
                    signal_headline: String(entry.headline.prefix(500)),
                    signal_action: String(entry.action.prefix(1000)),
                    response_taken: entry.responseTaken,
                    response_note: entry.responseNote,
                    response_taken_at: entry.responseTakenAt,
                    updated_at: ISO8601DateFormatter().string(from: Date())
                ),
                onConflict: "user_id,date,brief"
            )
            .execute()
    }

    // MARK: - DTOs

    private struct Row: Decodable {
        let date: String
        let brief: String
        let signal_kind: String
        let signal_headline: String
        let signal_action: String
        let response_taken: Bool?
        let response_note: String?
        let response_taken_at: String?

        func toEntry() -> CoachingEntry? {
            guard let b = CoachingBrief(rawValue: brief),
                  let k = CoachingSignalKind(rawValue: signal_kind) else { return nil }
            return CoachingEntry(
                date: date, brief: b, kind: k,
                headline: signal_headline, action: signal_action,
                responseTaken: response_taken, responseNote: response_note, responseTakenAt: response_taken_at
            )
        }
    }

    private struct WriteRow: Encodable {
        let user_id: UUID
        let date: String
        let brief: String
        let signal_kind: String
        let signal_headline: String
        let signal_action: String
        let response_taken: Bool?
        let response_note: String?
        let response_taken_at: String?
        let updated_at: String
    }
}
