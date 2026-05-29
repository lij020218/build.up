//
//  DashboardStore.swift — Today / Roadmap 화면이 의존하는 상태 저장소
//
//  @Observable (iOS 17+) — SwiftUI 가 자동 dependency tracking.
//  사용자 데이터 (entries / costs) + 계산된 결과 (healthResult / hero) 를 캐시.
//
//  Local-first:
//   1. 입력 즉시 메모리 + 큐에 push
//   2. 화면은 즉시 갱신
//   3. 배경 작업이 Supabase 동기화 (별도 SyncTask)
//

import Foundation
import Observation
import FoundOneCore

@MainActor
@Observable
public final class DashboardStore {

    // MARK: - State (UI 가 읽음)

    public private(set) var entries: [DailyEntry] = []
    public private(set) var costs: MonthlyCosts = MonthlyCosts()
    public private(set) var category: IndustryCategory = .general
    public private(set) var stage: HealthScore.BusinessMaturity = .growth
    public private(set) var currentCash: Double? = nil
    public private(set) var storeName: String = "내 가게"
    public private(set) var userName: String = "사장님"
    public private(set) var daysSinceLaunch: Int = 0
    public private(set) var businessLaunched: Bool = false

    public private(set) var isLoading: Bool = false
    public private(set) var lastError: String? = nil
    public private(set) var pendingSyncCount: Int = 0

    // MARK: - Derived (computed, healthResult 캐시)

    public private(set) var healthResult: UnifiedHealthResult = .empty

    private static let empty = UnifiedHealthResult(
        score: .nan,
        grade: .unknown,
        domains: [:],
        weights: [:],
        missingDomains: DomainKey.allCases,
        ready: false,
        readinessReason: "데이터 로드 중"
    )

    public var hero: Hero {
        HeroResolver.resolve(HeroResolverInput(
            ko: true,
            businessLaunched: businessLaunched,
            totalEntries: entries.count,
            daysSinceLastSalesEntry: daysSinceLastEntry,
            monthlyBurn: costs.total
        ))
    }

    public var todayEntry: DailyEntry? {
        let today = isoDateString(Date())
        return entries.first { $0.date == today }
    }

    public var daysSinceLastEntry: Int? {
        guard let last = entries.map(\.date).max() else { return nil }
        let cal = Calendar(identifier: .gregorian)
        guard let lastDate = parseDate(last) else { return nil }
        return cal.dateComponents([.day], from: lastDate, to: Date()).day
    }

    // MARK: - Dependencies

    private let dailyRepo: any DailyEntryRepositoryProtocol
    private let costsRepo: any MonthlyCostsRepositoryProtocol
    private let syncQueue: PendingSyncQueue

    public init(
        dailyRepo: any DailyEntryRepositoryProtocol,
        costsRepo: any MonthlyCostsRepositoryProtocol,
        syncQueue: PendingSyncQueue = PendingSyncQueue()
    ) {
        self.dailyRepo = dailyRepo
        self.costsRepo = costsRepo
        self.syncQueue = syncQueue
        self.healthResult = Self.empty
    }

    // MARK: - Load (앱 시작 시 호출)

    public func loadAll() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let entriesFuture = dailyRepo.list(limit: 90, ascending: true)
            async let costsFuture = costsRepo.fetch()

            self.entries = try await entriesFuture
            self.costs = try await costsFuture
            recomputeHealth()
        } catch {
            self.lastError = String(describing: error)
        }
    }

    // MARK: - Update — Local-first

    /// 매출 입력 — 즉시 UI 갱신 + 동기화 큐 push.
    public func upsertEntry(_ entry: DailyEntry) async {
        // 1. 로컬 즉시 (UI 0ms 반응)
        if let idx = entries.firstIndex(where: { $0.date == entry.date }) {
            entries[idx] = entry
        } else {
            entries.append(entry)
            entries.sort { $0.date < $1.date }
        }
        recomputeHealth()

        // 2. 큐 push
        await syncQueue.enqueue(.upsertDailyEntry(entry))
        await refreshPendingCount()

        // 3. 배경 sync (try immediately, fallback to later flush)
        await flushSync()
    }

    public func upsertCosts(_ costs: MonthlyCosts) async {
        self.costs = costs
        recomputeHealth()
        await syncQueue.enqueue(.upsertMonthlyCosts(costs))
        await refreshPendingCount()
        await flushSync()
    }

    public func deleteEntry(date: String) async {
        entries.removeAll { $0.date == date }
        recomputeHealth()
        await syncQueue.enqueue(.deleteDailyEntry(date: date))
        await refreshPendingCount()
        await flushSync()
    }

    // MARK: - Profile setters

    public func applyRemoteData(
        profile: DashboardProfile,
        entries remoteEntries: [DailyEntry],
        costs remoteCosts: MonthlyCosts?
    ) {
        self.storeName = profile.storeName
        self.userName = profile.userName
        self.daysSinceLaunch = profile.daysSinceLaunch
        self.category = profile.category
        self.stage = profile.stage
        self.currentCash = profile.currentCash
        if !remoteEntries.isEmpty {
            self.entries = remoteEntries.sorted { $0.date < $1.date }
        }
        if let remoteCosts {
            self.costs = remoteCosts
        }
        self.businessLaunched = profile.businessLaunched || !entries.isEmpty || costs.total > 0
        self.lastError = nil
        recomputeHealth()
    }

    public func setProfile(
        storeName: String,
        userName: String,
        daysSinceLaunch: Int,
        category: IndustryCategory,
        currentCash: Double?,
        businessLaunched: Bool = true
    ) {
        self.storeName = storeName
        self.userName = userName
        self.daysSinceLaunch = daysSinceLaunch
        self.category = category
        self.currentCash = currentCash
        self.businessLaunched = businessLaunched
        recomputeHealth()
    }

    /// 가게 이름만 단독 갱신 — Profile 편집 시트에서 사용.
    public func updateStoreName(_ newName: String) {
        let trimmed = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        self.storeName = trimmed.isEmpty ? "내 가게" : trimmed
    }

    /// 진행 초기화 — 메모리 캐시 비우기. 호출자가 서버 reset 도 별도로 수행.
    public func resetAll() {
        self.entries = []
        self.costs = MonthlyCosts()
        self.category = .general
        self.stage = .growth
        self.currentCash = nil
        // ⚠️ 2026-05-25 fix 사장님 신고: "전부 초기화 후에도 이전 상호명이 남아있음".
        //   이전: "내 가게" default 자리표시자 — 사용자가 "어, 왜 옛 이름이 그대로?" 혼란.
        //   변경: 명시적으로 "" 빈값 — ProfileView 가 .isEmpty 체크로 "가게 이름을
        //   입력해 주세요" 안내 표시. 신규 가입과 동일한 깨끗한 상태.
        self.storeName = ""
        self.daysSinceLaunch = 0
        self.businessLaunched = false
        self.pendingSyncCount = 0
        self.lastError = nil
        recomputeHealth()
    }

    public func recordError(_ message: String) {
        self.lastError = message
    }

    // MARK: - Sync flush (수동 또는 BackgroundTask 에서 호출)

    public func flushSync() async {
        let result = await syncQueue.flush(dailyRepo: dailyRepo, costsRepo: costsRepo)
        await refreshPendingCount()
        if result.failed > 0 {
            self.lastError = "\(result.failed)건 동기화 실패 — 재시도 대기 중"
        } else if result.succeeded > 0 {
            self.lastError = nil
        }
    }

    private func refreshPendingCount() async {
        self.pendingSyncCount = await syncQueue.pendingCount
    }

    // MARK: - Helpers

    private func recomputeHealth() {
        self.healthResult = HealthScore.calculate(
            entries: entries,
            costs: costs,
            category: category,
            stage: stage,
            currentCash: currentCash
        )
    }

    private func isoDateString(_ date: Date) -> String {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "Asia/Seoul")
        return df.string(from: date)
    }

    private func parseDate(_ str: String) -> Date? {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "Asia/Seoul")
        return df.date(from: str)
    }
}

public struct DashboardProfile: Sendable, Hashable {
    public let storeName: String
    public let userName: String
    public let daysSinceLaunch: Int
    public let businessLaunched: Bool
    public let category: IndustryCategory
    public let stage: HealthScore.BusinessMaturity
    public let currentCash: Double?

    public init(
        storeName: String,
        userName: String,
        daysSinceLaunch: Int,
        businessLaunched: Bool,
        category: IndustryCategory,
        stage: HealthScore.BusinessMaturity,
        currentCash: Double?
    ) {
        self.storeName = storeName
        self.userName = userName
        self.daysSinceLaunch = daysSinceLaunch
        self.businessLaunched = businessLaunched
        self.category = category
        self.stage = stage
        self.currentCash = currentCash
    }
}

// MARK: - UnifiedHealthResult helper

extension UnifiedHealthResult {
    static let empty = UnifiedHealthResult(
        score: .nan,
        grade: .unknown,
        domains: [:],
        weights: [:],
        missingDomains: DomainKey.allCases,
        ready: false,
        readinessReason: "데이터 로드 중"
    )
}
