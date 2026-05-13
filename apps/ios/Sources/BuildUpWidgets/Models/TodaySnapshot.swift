//
//  TodaySnapshot.swift — 위젯 + Live Activity 가 공유하는 데이터 모델
//
//  App Group (group.com.buildup.shared) 을 통해 메인 앱이 쓰고 위젯이 읽음.
//  UserDefaults(suiteName:) 또는 FileManager.containerURL 활용.
//

import Foundation
import BuildUpCore

public struct TodaySnapshot: Codable, Sendable, Hashable {

    /// 오늘 또는 가장 최근 매출
    public let todaySales: Double
    /// 어제 매출
    public let yesterdaySales: Double
    /// 최근 7일 일평균
    public let avgDaily7: Double
    /// 7일 전 대비 변화율 (%)
    public let weeklyChangePct: Double?
    /// 사업 건강도 점수 (0-100, nil 이면 미준비)
    public let healthScore: Double?
    public let healthGrade: HealthGrade?
    /// 가장 시급한 1개 행동 (heroResolver 결과 요약)
    public let heroAction: String
    /// 가장 시급한 1개 액션의 tone (위험도)
    public let heroTone: HeroTone
    /// 마지막 업데이트 시간
    public let updatedAt: Date

    public init(
        todaySales: Double,
        yesterdaySales: Double,
        avgDaily7: Double,
        weeklyChangePct: Double?,
        healthScore: Double?,
        healthGrade: HealthGrade?,
        heroAction: String,
        heroTone: HeroTone,
        updatedAt: Date = .now
    ) {
        self.todaySales = todaySales
        self.yesterdaySales = yesterdaySales
        self.avgDaily7 = avgDaily7
        self.weeklyChangePct = weeklyChangePct
        self.healthScore = healthScore
        self.healthGrade = healthGrade
        self.heroAction = heroAction
        self.heroTone = heroTone
        self.updatedAt = updatedAt
    }

    /// Preview / 위젯 placeholder 용
    public static let preview = TodaySnapshot(
        todaySales: 870_000,
        yesterdaySales: 920_000,
        avgDaily7: 890_000,
        weeklyChangePct: -5.4,
        healthScore: 72,
        healthGrade: .caution,
        heroAction: "재방문 고객 늘리기",
        heroTone: .neutral,
        updatedAt: .now
    )
}

// MARK: - SnapshotStore (App Group 공유)

public actor SnapshotStore {

    public static let appGroupID = "group.com.buildup.shared"
    public static let key = "today-snapshot"

    private let suite: UserDefaults?

    public init(suiteName: String = SnapshotStore.appGroupID) {
        self.suite = UserDefaults(suiteName: suiteName)
    }

    public func save(_ snapshot: TodaySnapshot) async {
        guard let suite else { return }
        do {
            let data = try JSONEncoder().encode(snapshot)
            suite.set(data, forKey: Self.key)
        } catch {
            // silent — 위젯은 최신 데이터 없어도 placeholder 표시
        }
    }

    public func load() async -> TodaySnapshot? {
        guard let suite, let data = suite.data(forKey: Self.key) else { return nil }
        return try? JSONDecoder().decode(TodaySnapshot.self, from: data)
    }
}
