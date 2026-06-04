//
//  SaasMetricsRepository.swift — SaaS 사용자 지표 (웹과 동일 Supabase)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/hooks/useUnifiedSaasMetrics.ts + /api/integrations/saas-metrics/daily
//     데이터: public.saas_metrics_daily (GA4 OAuth / 웹훅 등으로 웹에서 수집).
//
//  연동 자체(GA4 OAuth·웹훅)는 웹에서 수행 → 수집된 데이터는 Supabase 에 쌓임.
//  iOS는 같은 테이블을 읽기만 한다 (연결되면 자동 표시, 아니면 정직한 "연동 필요" 빈상태).
//
//  ⚠️ view(v_saas_metrics_unified)는 security_invoker 아님 → RLS 우회 위험.
//     RLS(select-own)가 제대로 걸린 하부 테이블 saas_metrics_daily 를 직접 읽고
//     소스 우선순위 dedup 은 클라이언트에서 수행(웹 view 로직 미러).
//

import Foundation
import Supabase

public struct SaasDailyEntry: Sendable, Hashable {
    public let date: String       // KST YYYY-MM-DD
    public let source: String     // ga4 / amplitude / mixpanel / posthog / webhook / manual
    public let activeUsers: Int?
    public let weeklyActiveUsers: Int?
    public let monthlyActiveUsers: Int?
    public let newUsers: Int?
    public let signups: Int?
    public let churns: Int?
    public let cumulativeUsers: Int?
}

public actor SaasMetricsRepository {

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID

    public init(supabase: SupabaseClient, getUserId: @escaping @Sendable () async throws -> UUID) {
        self.supabase = supabase
        self.getUserId = getUserId
    }

    /// 소스 우선순위 (웹 v_saas_metrics_unified 와 동일). 낮을수록 우선.
    private static func sourcePriority(_ source: String) -> Int {
        switch source {
        case "ga4": return 1
        case "amplitude": return 2
        case "mixpanel": return 3
        case "posthog": return 4
        case "webhook": return 5
        case "manual": return 6
        default: return 99
        }
    }

    /// 최근 N일 일별 지표 (date 오름차순). 같은 날짜는 소스 우선순위로 1줄만 (웹 distinct on 미러).
    public func fetchDaily(fromDays: Int = 30) async throws -> [SaasDailyEntry] {
        let userId = try await getUserId()
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let since = cal.date(byAdding: .day, value: -fromDays, to: Date()) ?? Date()
        let f = DateFormatter(); f.timeZone = cal.timeZone; f.dateFormat = "yyyy-MM-dd"
        let sinceStr = f.string(from: since)

        let rows: [Row] = try await supabase
            .from("saas_metrics_daily")
            .select("date, source, active_users, weekly_active_users, monthly_active_users, new_users, signups, churns, cumulative_users")
            .eq("user_id", value: userId)
            .gte("date", value: sinceStr)
            .order("date", ascending: true)
            .execute()
            .value

        // 같은 date 는 소스 우선순위 최상위 1줄만
        var byDate: [String: Row] = [:]
        for r in rows {
            if let existing = byDate[r.date], Self.sourcePriority(existing.source) <= Self.sourcePriority(r.source) {
                continue
            }
            byDate[r.date] = r
        }
        return byDate.values
            .map { $0.toEntry() }
            .sorted { $0.date < $1.date }
    }

    private struct Row: Decodable {
        let date: String
        let source: String
        let active_users: Int?
        let weekly_active_users: Int?
        let monthly_active_users: Int?
        let new_users: Int?
        let signups: Int?
        let churns: Int?
        let cumulative_users: Int?

        func toEntry() -> SaasDailyEntry {
            SaasDailyEntry(
                date: date, source: source,
                activeUsers: active_users, weeklyActiveUsers: weekly_active_users,
                monthlyActiveUsers: monthly_active_users, newUsers: new_users,
                signups: signups, churns: churns, cumulativeUsers: cumulative_users
            )
        }
    }
}
