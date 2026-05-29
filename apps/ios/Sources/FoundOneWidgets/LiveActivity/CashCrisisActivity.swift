//
//  CashCrisisActivity.swift — Cashflow 위기 Live Activity
//
//  현금 위기 7일 이내 감지 시 → Live Activity 시작 → 잠금화면 + Dynamic Island 에 표시.
//  사장님 화면에 항상 떠있음 → 즉시 인지.
//
//  ⚠️ ActivityKit 은 iOS 16.1+. WidgetExtension target 에 ActivityConfiguration 등록 필요.
//

import Foundation
#if canImport(ActivityKit)
import ActivityKit
#endif

// MARK: - ActivityAttributes

#if canImport(ActivityKit) && os(iOS)
@available(iOS 16.1, *)
public struct CashCrisisAttributes: ActivityAttributes {

    public struct ContentState: Codable, Hashable, Sendable {
        /// 위기까지 남은 일수
        public var daysUntilCrisis: Int
        /// 부족 예상 금액 (원)
        public var shortfallWon: Int
        /// 현재 잔고 (원)
        public var currentBalance: Int
        /// 마지막 업데이트 시간 — 진행률 표시용
        public var updatedAt: Date

        public init(
            daysUntilCrisis: Int,
            shortfallWon: Int,
            currentBalance: Int,
            updatedAt: Date = .now
        ) {
            self.daysUntilCrisis = daysUntilCrisis
            self.shortfallWon = shortfallWon
            self.currentBalance = currentBalance
            self.updatedAt = updatedAt
        }
    }

    /// 시작 시 1회 고정되는 메타데이터
    public let storeName: String

    public init(storeName: String) {
        self.storeName = storeName
    }
}

// MARK: - LiveActivityManager (메인 앱이 호출)

@available(iOS 16.1, *)
@MainActor
public final class LiveActivityManager {

    public static let shared = LiveActivityManager()
    private init() {}

    public var isAvailable: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    /// 위기 감지 시 Live Activity 시작.
    public func startCashCrisis(
        storeName: String,
        daysUntilCrisis: Int,
        shortfallWon: Int,
        currentBalance: Int
    ) async throws {
        guard isAvailable else { return }

        let attributes = CashCrisisAttributes(storeName: storeName)
        let contentState = CashCrisisAttributes.ContentState(
            daysUntilCrisis: daysUntilCrisis,
            shortfallWon: shortfallWon,
            currentBalance: currentBalance
        )

        _ = try Activity<CashCrisisAttributes>.request(
            attributes: attributes,
            content: .init(state: contentState, staleDate: nil),
            pushType: nil
        )
    }

    /// 위기 상태 업데이트 — 매일 자동 호출.
    public func updateCashCrisis(
        daysUntilCrisis: Int,
        shortfallWon: Int,
        currentBalance: Int
    ) async {
        for activity in Activity<CashCrisisAttributes>.activities {
            let newState = CashCrisisAttributes.ContentState(
                daysUntilCrisis: daysUntilCrisis,
                shortfallWon: shortfallWon,
                currentBalance: currentBalance
            )
            await activity.update(.init(state: newState, staleDate: nil))
        }
    }

    /// 위기 해소 시 종료.
    public func endAllCashCrisis() async {
        for activity in Activity<CashCrisisAttributes>.activities {
            await activity.end(dismissalPolicy: .immediate)
        }
    }
}
#endif  // canImport(ActivityKit) && os(iOS)
