//
//  CohortRetentionCalculator.swift — 회원 Cohort 잔존율 계산 SSOT (iOS)
//
//  웹 SSOT 1:1 포팅: packages/shared/src/finance/cohort-retention.ts
//
//  임계값 (업종별):
//    피트니스 (FIA Retention Report): 90d = 50%
//    교육 (학원조아·Spider): 30d=80%·60d=70%·90d=60%·1y=50%
//
//  출처: Mindbody·MarianaTek·Glofox·FIA·학원조아·Spider Strategies (2026-05-13 검증)
//

import Foundation

// MARK: - Input type (웹 CohortMember 미러 — BUMember 불필요, 날짜 문자열만 사용)

/// 잔존율 계산용 최소 입력 — BUMember 에서 map 해서 사용.
public struct CohortMember: Sendable {
    public let id: String
    public let startDate: String  // YYYY-MM-DD
    public let endDate: String    // YYYY-MM-DD
    public init(id: String = "", startDate: String, endDate: String) {
        self.id = id; self.startDate = startDate; self.endDate = endDate
    }
}

// MARK: - Result types

public struct CohortResult: Sendable {
    public let total: Int
    public let stillActive: Int
    public let rate: Int

    public static let empty = CohortResult(total: 0, stillActive: 0, rate: 0)
}

// MARK: - Calculator

public enum CohortRetentionCalculator {

    // MARK: Members (endDate 기반) — CohortMember 입력

    /// N일 cohort 잔존율.
    /// cohort = 오늘로부터 daysAgo ± windowDays 사이에 가입한 회원.
    /// 활성 = endDate >= today.
    public static func memberCohortRetention(
        members: [CohortMember],
        daysAgo: Int,
        windowDays: Int = 7,
        now: Date = Date()
    ) -> CohortResult {
        let cal = Calendar.current
        let today = cal.startOfDay(for: now)
        let todayStr = isoDate(today)
        let cutoffStart = isoDate(cal.date(byAdding: .day, value: -(daysAgo + windowDays), to: today)!)
        let cutoffEnd   = isoDate(cal.date(byAdding: .day, value: -max(0, daysAgo - windowDays), to: today)!)

        let cohort = members.filter { $0.startDate >= cutoffStart && $0.startDate <= cutoffEnd }
        let stillActive = cohort.filter { $0.endDate >= todayStr }.count
        let rate = cohort.isEmpty ? 0 : Int((Double(stillActive) / Double(cohort.count) * 100).rounded())
        return CohortResult(total: cohort.count, stillActive: stillActive, rate: rate)
    }

    /// 만료 임박 회원 인덱스 (daysAhead 일 이내) — id 목록 반환
    public static func expiringMemberIds(
        members: [CohortMember],
        daysAhead: Int = 7,
        now: Date = Date()
    ) -> Set<String> {
        let cal = Calendar.current
        let today = cal.startOfDay(for: now)
        let todayStr  = isoDate(today)
        let futureStr = isoDate(cal.date(byAdding: .day, value: daysAhead, to: today)!)
        return Set(members.filter { $0.endDate >= todayStr && $0.endDate <= futureStr }.map { $0.id })
    }

    /// 만료 임박 회원 카운트 (daysAhead 일 이내)
    public static func expiringCount(
        members: [CohortMember],
        daysAhead: Int = 7,
        now: Date = Date()
    ) -> Int {
        expiringMemberIds(members: members, daysAhead: daysAhead, now: now).count
    }

    /// 활성 회원 카운트 (endDate >= today)
    public static func activeMemberCount(members: [CohortMember], now: Date = Date()) -> Int {
        let todayStr = isoDate(Calendar.current.startOfDay(for: now))
        return members.filter { $0.endDate >= todayStr }.count
    }

    /// 지난 N일 신규 가입 카운트
    public static func newMemberCount(members: [CohortMember], daysAgo: Int = 30, now: Date = Date()) -> Int {
        let cutoff = isoDate(Calendar.current.date(byAdding: .day, value: -daysAgo, to: Calendar.current.startOfDay(for: now))!)
        return members.filter { $0.startDate >= cutoff }.count
    }

    // MARK: Private

    private static func isoDate(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]
        return f.string(from: date)
    }
}
