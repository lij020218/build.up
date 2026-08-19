//
//  NotificationPermissionFlow.swift — 가치 제안 + 권한 요청 UX
//
//  Apple HIG: 권한 요청 다이얼로그를 그냥 띄우면 거부율 ↑. 가치 먼저 제안 → 동의 후 호출.
//  본 컴포넌트는 SwiftUI sheet 로 띄우는 onboarding 단계 (Phase C 의 Today 진입 전).
//
//  2026-08-19 nag 방지:
//   • 「나중에」는 UserDefaults(`notif.optin.dismissedAt`)에 기록 → 14일 안엔 자동 sheet 재표시 금지.
//   • 시스템 권한이 .denied(사용자가 이미 거절)면 앱 내 다이얼로그는 다시 못 띄우므로
//     주 버튼이 「설정에서 켜기」로 바뀌어 앱 설정 화면을 연다.
//   • 프로필 등에서 명시적으로 여는 재진입 경로는 이 쿨다운의 영향을 받지 않는다(shouldAutoPrompt 만 게이트).
//

import SwiftUI
import UserNotifications

@MainActor
@Observable
public final class NotificationPermissionFlow {

    public enum Status: Sendable {
        case unknown
        case requesting
        case granted
        /// 아직 한 번도 시스템 다이얼로그를 띄운 적 없음 — 「알림 받기」로 요청 가능.
        case notDetermined
        /// 사용자가 시스템 다이얼로그에서 거절(또는 설정에서 끔) — 앱 내 재요청 불가, 설정으로 안내.
        case denied
    }

    /// 「나중에」 마지막 시각 (Date, TimeInterval since 1970). 로그아웃 wipe 대상 아님(기기 UX 선호).
    public static let dismissedAtKey = "notif.optin.dismissedAt"
    /// 자동 재표시 최소 간격.
    public static let reaskInterval: TimeInterval = 14 * 24 * 60 * 60

    public private(set) var status: Status = .unknown

    private let defaults: UserDefaults

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func refresh() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            status = .granted
        case .notDetermined:
            status = .notDetermined
        case .denied:
            status = .denied
        @unknown default:
            status = .denied
        }
    }

    // MARK: - 자동 표시 게이트

    /// 자동 sheet 를 띄워도 되는가 — 미허용 + 최근 14일 안에 「나중에」 누른 적 없음.
    ///   호출 전 refresh() 로 status 를 최신화할 것.
    public var shouldAutoPrompt: Bool {
        guard status != .granted, status != .unknown else { return false }
        return !isInDismissCooldown
    }

    /// 「나중에」 이후 14일 쿨다운 중인가.
    public var isInDismissCooldown: Bool {
        let at = defaults.double(forKey: Self.dismissedAtKey)
        guard at > 0 else { return false }
        return Date().timeIntervalSince1970 - at < Self.reaskInterval
    }

    /// 「나중에」 — 다음 자동 표시를 14일 뒤로 미룬다.
    public func markDismissed(now: Date = Date()) {
        defaults.set(now.timeIntervalSince1970, forKey: Self.dismissedAtKey)
    }

    // MARK: - 권한 요청 / 설정 열기

    public func requestAndSchedule() async {
        status = .requesting
        let granted = await NotificationScheduler.shared.requestAuthorization()
        if granted {
            // 권한 받자마자 모닝 브리핑 1회 스케줄.
            await NotificationScheduler.shared.scheduleMorningBrief()
            // 원격 푸시(APNs) 등록 — 토큰은 PushAppDelegate 가 수신해 저장 (2026-07-12).
            //   capability 미설정이면 didFail 로 조용히 끝남(무해).
            #if canImport(UIKit)
            UIApplication.shared.registerForRemoteNotifications()
            #endif
            status = .granted
        } else {
            status = .denied
        }
    }

    /// 시스템 권한이 이미 거절된 경우 — iOS 설정 앱의 이 앱 페이지를 연다.
    public func openSystemSettings() {
        #if canImport(UIKit)
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
        #endif
    }
}
