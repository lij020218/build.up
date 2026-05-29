//
//  FunnelMetricsRepository.swift — 전환율 funnel 3-채널 통합 조회 + 수동 입력 저장
//
//  Supabase 스키마 (migration 20260519_000001_funnel_metrics.sql):
//   • saas_funnel_manual_weekly  — 사장님 수동 입력 (Phase 1)
//   • saas_metrics_ga4_daily      — GA4 OAuth 자동 (Phase 2 — read only here)
//   • saas_metrics_events_raw     — Custom Webhook 적재
//   • saas_metrics_webhook_daily  — 위의 일일 rollup
//   → v_saas_funnel_unified      — 세 채널 UNION + 우선순위
//
//  사용:
//   let repo = FunnelMetricsRepository(supabase: client, getUserId: { uid })
//   let recent = try await repo.fetchRecentWeeks(mode: .saas, limit: 4)
//   try await repo.upsertManualEntry(mode: .saas, weekStart: monday, steps: [...])
//

import Foundation
import Supabase
import FoundOneCore

public enum FunnelMode: String, Sendable, Codable {
    case commerce
    case saas
}

public struct FunnelWeekRow: Sendable, Codable, Hashable {
    public let userId: UUID?              // RLS 로 항상 본인 — nil 일 수 있음
    public let weekStart: String          // ISO date "yyyy-MM-dd"
    public let mode: FunnelMode
    public let step1: Int
    public let step2: Int
    public let step3: Int
    public let step4: Int
    public let source: String             // "manual" | "ga4" | "webhook" | "none"

    public var allZero: Bool {
        step1 == 0 && step2 == 0 && step3 == 0 && step4 == 0
    }

    /// 전체 전환율 (step1 → step4).
    public var overallConversionPct: Double {
        guard step1 > 0 else { return 0 }
        return Double(step4) / Double(step1) * 100
    }

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case weekStart = "week_start"
        case mode
        case step1 = "step_1"
        case step2 = "step_2"
        case step3 = "step_3"
        case step4 = "step_4"
        case source
    }
}

// MARK: - Repository protocol

public protocol FunnelMetricsRepositoryProtocol: Sendable {
    /// 최근 N 주의 통합 funnel 데이터 (manual > ga4 > webhook 우선).
    func fetchRecentWeeks(mode: FunnelMode, limit: Int) async throws -> [FunnelWeekRow]

    /// 사장님 수동 입력 upsert. weekStart 는 ISO date (yyyy-MM-dd), 월요일 권장.
    func upsertManualEntry(mode: FunnelMode, weekStart: String, steps: [Int]) async throws
}

// MARK: - Supabase 구현

public actor FunnelMetricsRepository: FunnelMetricsRepositoryProtocol {

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID

    public init(
        supabase: SupabaseClient,
        getUserId: @escaping @Sendable () async throws -> UUID
    ) {
        self.supabase = supabase
        self.getUserId = getUserId
    }

    public func fetchRecentWeeks(mode: FunnelMode, limit: Int) async throws -> [FunnelWeekRow] {
        let rows: [FunnelWeekRow] = try await supabase
            .from("v_saas_funnel_unified")
            .select()
            .eq("mode", value: mode.rawValue)
            .order("week_start", ascending: false)
            .limit(limit)
            .execute()
            .value
        return rows
    }

    public func upsertManualEntry(mode: FunnelMode, weekStart: String, steps: [Int]) async throws {
        let userId = try await getUserId()
        guard steps.count == 4 else {
            throw FunnelMetricsError.invalidStepCount
        }
        struct ManualRow: Encodable {
            let user_id: String
            let week_start: String
            let mode: String
            let step_1: Int
            let step_2: Int
            let step_3: Int
            let step_4: Int
        }
        let row = ManualRow(
            user_id: userId.uuidString,
            week_start: weekStart,
            mode: mode.rawValue,
            step_1: steps[0],
            step_2: steps[1],
            step_3: steps[2],
            step_4: steps[3]
        )
        try await supabase
            .from("saas_funnel_manual_weekly")
            .upsert(row, onConflict: "user_id,week_start,mode")
            .execute()
    }
}

// MARK: - Errors

public enum FunnelMetricsError: Error, Sendable {
    case invalidStepCount
    case notAuthenticated
}

// MARK: - ISO week helper

public enum FunnelMetricsHelpers {
    /// 주어진 Date 가 속한 주의 월요일을 ISO "yyyy-MM-dd" 로 반환.
    public static func mondayISODate(of date: Date = Date()) -> String {
        var cal = Calendar(identifier: .iso8601)
        cal.firstWeekday = 2 // Monday
        let weekStart = cal.dateInterval(of: .weekOfYear, for: date)?.start ?? date
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(secondsFromGMT: 0)
        return f.string(from: weekStart)
    }
}
