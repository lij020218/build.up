//
//  InMemoryRepositories.swift — 데모/프리뷰 전용 in-memory 구현
//
//  실 서비스에선 절대 사용하지 않음. DEBUG 빌드의 demoMode 또는 SwiftUI Preview 에서만 쓰임.
//  Supabase 호출 없이 즉시 응답.
//

import Foundation
import FoundOneCore

public actor InMemoryDailyEntryRepository: DailyEntryRepositoryProtocol {
    private var entries: [DailyEntry]

    public init(seed: [DailyEntry] = []) {
        self.entries = seed
    }

    public func list(limit: Int, ascending: Bool) async throws -> [DailyEntry] {
        let sorted = entries.sorted { ascending ? $0.date < $1.date : $0.date > $1.date }
        return Array(sorted.prefix(limit))
    }

    public func upsert(_ entry: DailyEntry) async throws {
        if let i = entries.firstIndex(where: { $0.date == entry.date }) {
            entries[i] = entry
        } else {
            entries.append(entry)
        }
    }

    public func delete(date: String) async throws {
        entries.removeAll { $0.date == date }
    }
}

public actor InMemoryMonthlyCostsRepository: MonthlyCostsRepositoryProtocol {
    private var costs: MonthlyCosts

    public init(seed: MonthlyCosts = MonthlyCosts()) {
        self.costs = seed
    }

    public func fetch() async throws -> MonthlyCosts { costs }

    public func upsert(_ costs: MonthlyCosts) async throws { self.costs = costs }
}
