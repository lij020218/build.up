//
//  CoachingHistoryStore.swift — 코칭 일지 화면 상태 (웹 coaching-history.ts 의 iOS 대응)
//
//  웹은 localStorage primary + Supabase mirror. iOS는 Supabase(coaching_history)를
//  단일 소스로 사용 — 같은 테이블이라 웹·앱 자동 동기화. 네트워크 실패는 graceful(기존 값 유지).
//

import Foundation
import Supabase

@MainActor
public final class CoachingHistoryStore: ObservableObject {

    @Published public private(set) var entries: [CoachingEntry] = []
    @Published public private(set) var stats: CoachingStats = .compute([])
    @Published public private(set) var isLoaded: Bool = false

    private let repository: CoachingHistoryRepository
    /// 같은 신호를 한 세션에 반복 upsert 하지 않기 위한 가드 (date|brief|kind|headline).
    private var lastRecordedKey: String?

    public init(repository: CoachingHistoryRepository) {
        self.repository = repository
    }

    /// 최근 14일 로드. best-effort — 실패 시 기존 entries 유지.
    public func load() async {
        do {
            let fetched = try await repository.fetchHistory(days: 14)
            self.entries = fetched
            self.stats = .compute(fetched)
            self.isLoaded = true
        } catch {
            // 네트워크/RLS 오류 — 기존 값 유지 (UX 차단 X)
            self.isLoaded = true
        }
    }

    /// 오늘 노출된 hero 신호 기록. 하루 1회(중복 신호는 skip). 기존 사장님 응답은 보존.
    public func recordTodaySignal(brief: CoachingBrief, kind: CoachingSignalKind, headline: String, action: String) async {
        let today = CoachingHistoryRepository.todayKST()
        let key = "\(today)|\(brief.rawValue)|\(kind.rawValue)|\(headline.prefix(80))"
        guard key != lastRecordedKey else { return }

        // 기존 오늘 entry 의 응답 보존
        let existing = entries.first { $0.date == today && $0.brief == brief }
        let entry = CoachingEntry(
            date: today, brief: brief, kind: kind, headline: headline, action: action,
            responseTaken: existing?.responseTaken,
            responseNote: existing?.responseNote,
            responseTakenAt: existing?.responseTakenAt
        )

        // 동일 신호면 네트워크 생략 (response 만 다른 경우는 markActionTaken 이 처리)
        if let existing, existing.kind == kind, existing.headline == headline, existing.action == action {
            lastRecordedKey = key
            return
        }

        do {
            try await repository.upsert(entry)
            lastRecordedKey = key
            mergeLocal(entry)
        } catch {
            // graceful — 다음 노출 때 재시도
        }
    }

    /// 사장님 "오늘 했음" 토글. 낙관적 갱신 + 영속.
    public func markActionTaken(_ entry: CoachingEntry, taken: Bool) async {
        var updated = entry
        updated.responseTaken = taken
        updated.responseTakenAt = taken ? ISO8601DateFormatter().string(from: Date()) : nil
        mergeLocal(updated)   // 낙관적
        do {
            try await repository.upsert(updated)
        } catch {
            // 실패 시 원복
            mergeLocal(entry)
        }
    }

    private func mergeLocal(_ entry: CoachingEntry) {
        if let idx = entries.firstIndex(where: { $0.id == entry.id }) {
            entries[idx] = entry
        } else {
            entries.append(entry)
            entries.sort { $0.date > $1.date }   // 최신 먼저
        }
        stats = .compute(entries)
    }
}
