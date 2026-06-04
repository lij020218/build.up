//
//  SaasMetricsStore.swift — SaaS 사용자 지표 화면 상태 (웹 useUnifiedSaasMetrics 의 iOS 대응)
//
//  스타트업 업종만 의미. 미연동(데이터 없음) 시 anyConnected=false → 카드가 정직한 빈상태 표시.
//  가짜 숫자 금지: 연동 안 됐으면 0/예시 숫자 절대 표시하지 않음.
//

import Foundation

@MainActor
public final class SaasMetricsStore: ObservableObject {

    @Published public private(set) var entries: [SaasDailyEntry] = []
    @Published public private(set) var isLoading: Bool = true
    @Published public private(set) var isLoaded: Bool = false

    private let repository: SaasMetricsRepository

    public init(repository: SaasMetricsRepository) {
        self.repository = repository
    }

    /// 최소 1개 채널이라도 연결되어 데이터가 있는지 (웹 anyConnected = entries.length > 0).
    public var anyConnected: Bool { !entries.isEmpty }

    /// 가장 최근 일자 지표 (정렬 오름차순이므로 last).
    public var latest: SaasDailyEntry? { entries.last }

    /// 최근 7일 평균 DAU (웹 avg7DayDau 미러).
    public var avg7DayDau: Int? {
        let last7 = entries.suffix(7)
        guard !last7.isEmpty else { return nil }
        let sum = last7.reduce(0) { $0 + ($1.activeUsers ?? 0) }
        return Int((Double(sum) / Double(last7.count)).rounded())
    }

    /// 기간 누적 신규 가입 (웹 total30DayNewUsers 미러).
    public var totalNewUsers: Int? {
        guard !entries.isEmpty else { return nil }
        return entries.reduce(0) { $0 + ($1.newUsers ?? 0) }
    }

    /// 스타트업일 때만 fetch (웹 가드와 동일). 비스타트업은 즉시 빈 결과.
    public func load(isStartup: Bool, fromDays: Int = 30) async {
        guard isStartup else {
            self.entries = []
            self.isLoading = false
            self.isLoaded = true
            return
        }
        do {
            let fetched = try await repository.fetchDaily(fromDays: fromDays)
            self.entries = fetched
        } catch {
            // 네트워크/권한 오류 — 빈 상태 유지 (가짜 숫자 금지)
            self.entries = []
        }
        self.isLoading = false
        self.isLoaded = true
    }
}
