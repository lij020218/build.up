//
//  PendingSyncQueue.swift — Local-first 동기화 큐
//
//  사장님이 매출 입력 → SwiftData 캐시 즉시 (0ms) → 큐에 push → 배경 작업이
//  Supabase 로 upsert. 네트워크 실패 시 자동 재시도 (idempotency key 로 중복 방지).
//
//  Conflict 전략: server timestamp wins + idempotency (date unique 활용).
//

import Foundation
import BuildUpCore

// MARK: - PendingOperation

public struct PendingOperation: Sendable, Hashable, Codable {
    public let id: UUID
    public let kind: Kind
    public let createdAt: Date
    public var attemptCount: Int
    public var lastError: String?

    public enum Kind: Sendable, Hashable, Codable {
        case upsertDailyEntry(DailyEntry)
        case deleteDailyEntry(date: String)
        case upsertMonthlyCosts(MonthlyCosts)
    }

    public init(
        id: UUID = UUID(),
        kind: Kind,
        createdAt: Date = .now,
        attemptCount: Int = 0,
        lastError: String? = nil
    ) {
        self.id = id
        self.kind = kind
        self.createdAt = createdAt
        self.attemptCount = attemptCount
        self.lastError = lastError
    }
}

// MARK: - PendingSyncQueue (actor)

public actor PendingSyncQueue {

    private var operations: [PendingOperation] = []
    private let maxRetries: Int

    public init(maxRetries: Int = 5) {
        self.maxRetries = maxRetries
    }

    public func enqueue(_ kind: PendingOperation.Kind) {
        operations.append(PendingOperation(kind: kind))
    }

    public var pendingCount: Int { operations.count }

    /// 한 번 flush — 모든 pending 을 순차 처리. 실패 항목은 attemptCount++ 후 큐에 잔존.
    /// 결과: (성공 N, 실패 N).
    public func flush(
        dailyRepo: any DailyEntryRepositoryProtocol,
        costsRepo: any MonthlyCostsRepositoryProtocol
    ) async -> (succeeded: Int, failed: Int) {

        var success = 0
        var failure = 0
        var remaining: [PendingOperation] = []

        for var op in operations {
            do {
                try await execute(op, dailyRepo: dailyRepo, costsRepo: costsRepo)
                success += 1
                // 성공 시 큐에서 제거 (remaining 에 추가 안 함)
            } catch {
                failure += 1
                op.attemptCount += 1
                op.lastError = String(describing: error)
                if op.attemptCount < maxRetries {
                    remaining.append(op)
                }
                // maxRetries 초과 → drop (별도 dead-letter 큐 추후 구현 가능)
            }
        }

        operations = remaining
        return (success, failure)
    }

    private func execute(
        _ op: PendingOperation,
        dailyRepo: any DailyEntryRepositoryProtocol,
        costsRepo: any MonthlyCostsRepositoryProtocol
    ) async throws {
        switch op.kind {
        case .upsertDailyEntry(let entry):
            try await dailyRepo.upsert(entry)
        case .deleteDailyEntry(let date):
            try await dailyRepo.delete(date: date)
        case .upsertMonthlyCosts(let costs):
            try await costsRepo.upsert(costs)
        }
    }

    public func clear() {
        operations.removeAll()
    }
}
