//
//  LogSalesIntent.swift — App Intent (Siri 단축어 + Interactive Widget)
//
//  사장님이 "Hey Siri, 오늘 매출 50만원" → 본 Intent 실행 → SnapshotStore 업데이트.
//  Widget 의 Button(intent:) 으로도 호출 가능 — 홈 화면에서 직접 1탭 입력.
//
//  ⚠️ App Intent 는 iOS 16+. App target 의 Info.plist 에 NSAppIntentEnabled 설정 필요.
//

import Foundation
import AppIntents
import BuildUpCore

@available(iOS 16.0, *)
public struct LogSalesIntent: AppIntent {

    public static let title: LocalizedStringResource = "오늘 매출 입력"
    public static let description = IntentDescription(
        "오늘 매출을 build.up 에 빠르게 기록합니다."
    )

    @Parameter(title: "매출 (원)", description: "오늘 매출 금액 (예: 500000)")
    public var amount: Int

    @Parameter(title: "고객 수", description: "오늘 고객 수 (옵션)", default: 0)
    public var customers: Int

    public init() {}

    public init(amount: Int, customers: Int = 0) {
        self.amount = amount
        self.customers = customers
    }

    public func perform() async throws -> some IntentResult & ProvidesDialog {
        // 오늘 날짜
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "Asia/Seoul")
        let today = df.string(from: Date())

        let entry = DailyEntry(
            date: today,
            sales: Double(amount),
            customers: customers
        )

        // App Group 큐에 push (메인 앱이 다음 launch 시 동기화)
        await PendingIntentQueue.shared.enqueue(.upsertEntry(entry))

        let formatted: String = {
            let a = Swift.abs(amount)
            if a >= 10_000 { return "\(a / 10_000)만원" }
            return "\(a.formatted())원"
        }()

        return .result(dialog: "오늘 매출 \(formatted) 기록했어요. 사장님 멋져요!")
    }
}

// MARK: - Open Today App Intent

@available(iOS 16.0, *)
public struct OpenTodayIntent: AppIntent {

    public static let title: LocalizedStringResource = "Today 화면 열기"
    public static let description = IntentDescription(
        "build.up Today 화면을 엽니다."
    )

    public static let openAppWhenRun: Bool = true

    public init() {}

    public func perform() async throws -> some IntentResult {
        return .result()
    }
}

// MARK: - PendingIntentQueue (App Group 통한 메인 앱과 통신)

public actor PendingIntentQueue {

    public static let shared = PendingIntentQueue()

    public enum Operation: Codable, Sendable, Hashable {
        case upsertEntry(DailyEntry)
    }

    private let suite: UserDefaults?
    private let key = "pending-intent-ops"

    private init() {
        self.suite = UserDefaults(suiteName: SnapshotStore.appGroupID)
    }

    public func enqueue(_ op: Operation) async {
        var current = await loadOps()
        current.append(op)
        save(current)
    }

    public func loadOps() async -> [Operation] {
        guard let data = suite?.data(forKey: key) else { return [] }
        return (try? JSONDecoder().decode([Operation].self, from: data)) ?? []
    }

    public func drain() async -> [Operation] {
        let all = await loadOps()
        suite?.removeObject(forKey: key)
        return all
    }

    private func save(_ ops: [Operation]) {
        if let data = try? JSONEncoder().encode(ops) {
            suite?.set(data, forKey: key)
        }
    }
}
