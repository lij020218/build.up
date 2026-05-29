//
//  NotificationScheduler.swift — 로컬 알림 스케줄링
//
//  사장님 모바일에서 가장 가치 높은 채널:
//   1. 매일 09:00 — 모닝 브리핑 ("어제 매출 + 오늘 한 가지 행동")
//   2. 위기 즉시  — Cashflow 위기 7일 이내 감지 시
//   3. 매출 미기록 3일+ — 저녁 21:00
//
//  로컬 알림 (UNUserNotificationCenter) 만 사용 — APNS 서버 푸시는 향후 단계.
//  Apple HIG: 권한 요청은 가치 제안 후 호출.
//

#if canImport(UserNotifications)
import UserNotifications
#endif
import Foundation
import FoundOneCore

@MainActor
public final class NotificationScheduler: Sendable {

    public static let shared = NotificationScheduler()

    private init() {}

    // MARK: - Permission

    /// 알림 권한 요청. 가치 제안 후 호출 권장 (예: 온보딩 마지막 단계).
    @discardableResult
    public func requestAuthorization() async -> Bool {
        #if canImport(UserNotifications)
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            return granted
        } catch {
            return false
        }
        #else
        return false
        #endif
    }

    public func authorizationStatus() async -> Bool {
        #if canImport(UserNotifications)
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        return settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
        #else
        return false
        #endif
    }

    // MARK: - Schedule

    /// 매일 09:00 모닝 브리핑 알림 (반복).
    public func scheduleMorningBrief(
        hour: Int = 9,
        minute: Int = 0
    ) async {
        #if canImport(UserNotifications)
        // 기존 모닝 알림 제거
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: [Identifier.morningBrief.rawValue]
        )

        let content = UNMutableNotificationContent()
        content.title = "사장님, 오늘도 5초만"
        content.body = "어제 매출 + 오늘 한 가지 행동을 같이 봐요"
        content.sound = .default
        content.threadIdentifier = "morning-brief"

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute
        // Asia/Seoul timezone — 사장님 한국 기준
        dateComponents.timeZone = TimeZone(identifier: "Asia/Seoul")

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(
            identifier: Identifier.morningBrief.rawValue,
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
        #endif
    }

    /// 현금 위기 즉시 알림 — N일 후 부족 예상.
    public func scheduleCashCrisisAlert(daysUntilCrisis: Int, shortfallWon: Int) async {
        #if canImport(UserNotifications)
        let content = UNMutableNotificationContent()
        content.title = "현금 위기 \(daysUntilCrisis)일 전"
        content.body = "통장 잔고가 \(formatWon(shortfallWon)) 부족할 수 있어요. 같이 해결책 봐요."
        content.sound = .defaultCritical
        content.interruptionLevel = .timeSensitive
        content.threadIdentifier = "cash-crisis"

        // 즉시 (1초 후) 발송
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "cash-crisis-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
        #endif
    }

    /// 매출 미기록 3일+ 알림 — 저녁 21:00 1회.
    public func scheduleStaleSalesReminder(daysSinceLastEntry: Int) async {
        #if canImport(UserNotifications)
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: [Identifier.staleSales.rawValue]
        )

        guard daysSinceLastEntry >= 3 else { return }

        let content = UNMutableNotificationContent()
        content.title = "사장님, 매출 한 건만"
        content.body = "\(daysSinceLastEntry)일째 기록이 비어있어요. 5초면 됩니다."
        content.sound = .default
        content.threadIdentifier = "stale-sales"

        var dateComponents = DateComponents()
        dateComponents.hour = 21
        dateComponents.minute = 0
        dateComponents.timeZone = TimeZone(identifier: "Asia/Seoul")

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: false)
        let request = UNNotificationRequest(
            identifier: Identifier.staleSales.rawValue,
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
        #endif
    }

    public func cancelAll() {
        #if canImport(UserNotifications)
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        #endif
    }

    public enum Identifier: String, Sendable {
        case morningBrief  = "bup.morning-brief"
        case staleSales    = "bup.stale-sales"
    }

    private func formatWon(_ value: Int) -> String {
        let abs = Swift.abs(value)
        if abs >= 10_000 { return "\(abs / 10_000)만원" }
        return "\(abs.formatted())원"
    }
}
