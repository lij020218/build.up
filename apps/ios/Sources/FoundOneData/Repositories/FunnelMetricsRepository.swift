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

/// 수동 입력(`saas_funnel_manual_weekly`) 단일 주차 행 — 웹↔iOS 라운드트립용.
/// 통합 뷰(`FunnelWeekRow`)와 달리 `source` 컬럼이 없어 별도 타입으로 디코드한다.
public struct ManualFunnelWeek: Sendable, Decodable, Hashable {
    public let weekStart: String          // ISO date "yyyy-MM-dd"
    public let mode: FunnelMode
    public let steps: [Int]               // [step1, step2, step3, step4]
    public let updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case weekStart = "week_start"
        case mode
        case step1 = "step_1"
        case step2 = "step_2"
        case step3 = "step_3"
        case step4 = "step_4"
        case updatedAt = "updated_at"
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        weekStart = try c.decode(String.self, forKey: .weekStart)
        mode = try c.decode(FunnelMode.self, forKey: .mode)
        steps = [
            try c.decode(Int.self, forKey: .step1),
            try c.decode(Int.self, forKey: .step2),
            try c.decode(Int.self, forKey: .step3),
            try c.decode(Int.self, forKey: .step4),
        ]
        updatedAt = try c.decodeIfPresent(String.self, forKey: .updatedAt)
    }
}

// MARK: - Repository protocol

public protocol FunnelMetricsRepositoryProtocol: Sendable {
    /// 최근 N 주의 통합 funnel 데이터 (manual > ga4 > webhook 우선).
    func fetchRecentWeeks(mode: FunnelMode, limit: Int) async throws -> [FunnelWeekRow]

    /// 특정 주차의 사장님 수동 입력 행 1건 (없으면 nil) — 웹·다른 기기에서 입력한 값을 read-back.
    func fetchManualWeek(mode: FunnelMode, weekStart: String) async throws -> ManualFunnelWeek?

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

    public func fetchManualWeek(mode: FunnelMode, weekStart: String) async throws -> ManualFunnelWeek? {
        // saas_funnel_manual_weekly 를 직접 읽어 manual SSOT 를 정확히 라운드트립(통합 뷰의 auto 채널 혼입 방지).
        // RLS 로 본인 행만, week_start+mode 로 단일 행.
        let rows: [ManualFunnelWeek] = try await supabase
            .from("saas_funnel_manual_weekly")
            .select("week_start,mode,step_1,step_2,step_3,step_4,updated_at")
            .eq("week_start", value: weekStart)
            .eq("mode", value: mode.rawValue)
            .limit(1)
            .execute()
            .value
        return rows.first
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
        RealtimeEcho.markLocalWrite(table: "saas_funnel_manual_weekly")   // 자기 에코 억제
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
